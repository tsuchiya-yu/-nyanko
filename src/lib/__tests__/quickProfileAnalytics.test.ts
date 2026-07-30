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
    expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.CREATE_START);
  });

  it('tracks the first ready preview with elapsed time and the 30-second result', () => {
    analytics.start();
    now += 29_500;

    analytics.trackPreviewReady();
    analytics.trackPreviewReady();

    expect(track).toHaveBeenLastCalledWith(QUICK_PROFILE_EVENT_NAMES.PREVIEW_READY, {
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
      QUICK_PROFILE_EVENT_NAMES.PREVIEW_READY,
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
      [QUICK_PROFILE_EVENT_NAMES.CREATE_START],
      [QUICK_PROFILE_EVENT_NAMES.PHOTO_SELECTED, undefined],
      [QUICK_PROFILE_EVENT_NAMES.AUTH_OPEN, { auth_method: 'register' }],
      [QUICK_PROFILE_EVENT_NAMES.AUTH_COMPLETE, { auth_method: 'register' }],
      [QUICK_PROFILE_EVENT_NAMES.PUBLISH_COMPLETE, undefined],
    ]);
  });

  it('starts a new session after the previous profile was published', () => {
    analytics.start();
    analytics.trackPublishComplete();
    now += 5_000;

    analytics.start();

    expect(track).toHaveBeenLastCalledWith(QUICK_PROFILE_EVENT_NAMES.CREATE_START);
    expect(track).toHaveBeenCalledTimes(3);
  });

  it('tracks each card action with a constrained format and destination', () => {
    analytics.trackCardDownload();
    analytics.trackCardShare('x');

    expect(track).toHaveBeenNthCalledWith(1, QUICK_PROFILE_EVENT_NAMES.CARD_DOWNLOAD, {
      card_format: 'standard_3_4',
    });
    expect(track).toHaveBeenNthCalledWith(2, QUICK_PROFILE_EVENT_NAMES.CARD_SHARE, {
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

    expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.CREATE_START);
    expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.PHOTO_SELECTED, undefined);
    expect(() => storageBlockedAnalytics.reset()).not.toThrow();
  });

  it.each(['null', '"invalid"', '123'])(
    'starts a new measurement session when stored data is not an object: %s',
    storedValue => {
      sessionStorage.setItem('quick-profile-measurement-v1', storedValue);

      analytics.start();

      expect(track).toHaveBeenCalledWith(QUICK_PROFILE_EVENT_NAMES.CREATE_START);
    }
  );
});
