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
});
