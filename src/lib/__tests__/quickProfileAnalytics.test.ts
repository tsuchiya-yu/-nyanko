import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QUICK_PROFILE_EVENT_NAMES, QuickProfileAnalytics } from '../quickProfileAnalytics';

describe('QuickProfileAnalytics', () => {
  const track = vi.fn();
  let now = 1_000_000;
  let analytics: QuickProfileAnalytics;

  beforeEach(() => {
    sessionStorage.clear();
    track.mockReset();
    now = 1_000_000;
    analytics = new QuickProfileAnalytics({
      now: () => now,
      storage: sessionStorage,
      track,
    });
  });

  it('tracks the start of a measurement session only once', () => {
    analytics.start();
    analytics.start();

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.createStart);
  });

  it('tracks the first ready preview with elapsed time and the 30-second result', () => {
    analytics.start();
    now += 29_500;

    analytics.trackPreviewReady();
    analytics.trackPreviewReady();

    expect(track).toHaveBeenLastCalledWith(QUICK_PROFILE_EVENT_NAMES.previewReady, {
      elapsed_time_ms: 29_500,
      within_30_seconds: true,
    });
    expect(track).toHaveBeenCalledTimes(2);
  });

  it('reports previews taking longer than 30 seconds', () => {
    analytics.start();
    now += 30_001;

    analytics.trackPreviewReady();

    expect(track).toHaveBeenLastCalledWith(
      QUICK_PROFILE_EVENT_NAMES.previewReady,
      expect.objectContaining({ within_30_seconds: false })
    );
  });

  it('does not track funnel events before a session starts', () => {
    analytics.trackPhotoSelected();
    analytics.trackPreviewReady();
    analytics.trackAuthOpen('register');
    analytics.trackAuthComplete('register');
    analytics.trackPublishComplete();

    expect(track).not.toHaveBeenCalled();
  });

  it('tracks each funnel milestone once and keeps the authentication method non-personal', () => {
    analytics.start();
    analytics.trackPhotoSelected();
    analytics.trackPhotoSelected();
    analytics.trackAuthOpen('register');
    analytics.trackAuthOpen('register');
    analytics.trackAuthComplete('register');
    analytics.trackPublishComplete();

    expect(track.mock.calls).toEqual([
      [QUICK_PROFILE_EVENT_NAMES.createStart],
      [QUICK_PROFILE_EVENT_NAMES.photoSelected, undefined],
      [QUICK_PROFILE_EVENT_NAMES.authOpen, { auth_method: 'register' }],
      [QUICK_PROFILE_EVENT_NAMES.authComplete, { auth_method: 'register' }],
      [QUICK_PROFILE_EVENT_NAMES.publishComplete, undefined],
    ]);
  });

  it('starts a new session after the previous profile was published', () => {
    analytics.start();
    analytics.trackPublishComplete();
    now += 5_000;

    analytics.start();

    expect(track).toHaveBeenLastCalledWith(QUICK_PROFILE_EVENT_NAMES.createStart);
    expect(track).toHaveBeenCalledTimes(3);
  });

  it('tracks each card action with a constrained format and destination', () => {
    analytics.trackCardDownload();
    analytics.trackCardShare('x');

    expect(track).toHaveBeenNthCalledWith(1, QUICK_PROFILE_EVENT_NAMES.cardDownload, {
      card_format: 'standard_3_4',
    });
    expect(track).toHaveBeenNthCalledWith(2, QUICK_PROFILE_EVENT_NAMES.cardShare, {
      card_format: 'standard_3_4',
      share_destination: 'x',
    });
  });

  it('continues without throwing when session storage is unavailable', () => {
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      removeItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    };
    const storageBlockedAnalytics = new QuickProfileAnalytics({
      storage: unavailableStorage,
      track,
    });

    storageBlockedAnalytics.start();
    storageBlockedAnalytics.trackPhotoSelected();

    expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.createStart);
    expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.photoSelected, undefined);
    expect(() => storageBlockedAnalytics.reset()).not.toThrow();
  });
});
