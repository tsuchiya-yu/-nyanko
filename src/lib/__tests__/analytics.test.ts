import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('VITE_GA_TRACKING_ID', 'G-TEST123456');
    document.head.innerHTML = '';
    window.dataLayer = [];
    delete window.gtag;
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'loading',
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'complete',
    });
  });

  it('defers loading gtag.js until after window load', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const { initGA } = await import('../analytics');

    initGA();

    expect(window.dataLayer).toHaveLength(3);
    expect(window.dataLayer[2]).toEqual([
      'consent',
      'default',
      {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 5000,
      },
    ]);
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function), { once: true });

    window.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(1000);

    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="googletagmanager.com/gtag/js"]'
    );

    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
    expect(script?.src).toContain('id=G-TEST123456');
  });

  it('queues page_view events before the script finishes loading', async () => {
    const { initGA, trackPageView } = await import('../analytics');

    initGA();
    trackPageView('/cats/taro');

    expect(window.dataLayer).toHaveLength(4);
    expect(window.dataLayer.at(-1)).toEqual([
      'event',
      'page_view',
      {
        page_path: '/cats/taro',
      },
    ]);
  });
});
