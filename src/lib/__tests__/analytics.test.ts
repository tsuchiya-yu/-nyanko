import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_GA_TRACKING_ID', 'G-TEST123456');
    document.head.innerHTML = '';
    window.dataLayer = [];
    delete window.gtag;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('does not dynamically inject gtag.js or suppress GA storage', async () => {
    const { initGA } = await import('../analytics');

    initGA();

    expect(window.dataLayer).toHaveLength(0);
    expect(typeof window.gtag).toBe('function');
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });

  it('queues page_view events for SPA route changes', async () => {
    const { initGA, trackPageView } = await import('../analytics');

    initGA();
    window.history.pushState(null, '', '/cats/taro?utm_source=test#profile');
    trackPageView('/cats/taro?utm_source=test');

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer.at(-1)).toEqual([
      'event',
      'page_view',
      expect.objectContaining({
        page_path: '/cats/taro?utm_source=test',
        page_location: 'http://localhost:3000/cats/taro?utm_source=test#profile',
      }),
    ]);
  });

  it('queues structured events and removes undefined parameters', async () => {
    const { trackEvent } = await import('../analytics');

    trackEvent('quick_profile_preview_ready', {
      elapsed_time_ms: 12_345,
      optional_parameter: undefined,
      within_30_seconds: true,
    });

    expect(window.dataLayer.at(-1)).toEqual([
      'event',
      'quick_profile_preview_ready',
      {
        elapsed_time_ms: 12_345,
        within_30_seconds: true,
      },
    ]);
  });

  it('does not propagate errors from gtag', async () => {
    const { trackEvent, trackPageView } = await import('../analytics');
    window.gtag = vi.fn(() => {
      throw new Error('analytics unavailable');
    });

    expect(() => trackEvent('quick_profile_create_start')).not.toThrow();
    expect(() => trackPageView('/create')).not.toThrow();
  });
});
