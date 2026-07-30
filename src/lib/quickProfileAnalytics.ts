import { trackEvent, type AnalyticsEventParameters } from './analytics';

export const QUICK_PROFILE_EVENT_NAMES = {
  CREATE_START: 'quick_profile_create_start',
  PHOTO_SELECTED: 'quick_profile_photo_selected',
  PREVIEW_READY: 'quick_profile_preview_ready',
  AUTH_OPEN: 'quick_profile_auth_open',
  AUTH_COMPLETE: 'quick_profile_auth_complete',
  PUBLISH_COMPLETE: 'quick_profile_publish_complete',
  CARD_DOWNLOAD: 'profile_card_download',
  CARD_SHARE: 'profile_card_share',
} as const;

export type QuickProfileEventName =
  (typeof QUICK_PROFILE_EVENT_NAMES)[keyof typeof QUICK_PROFILE_EVENT_NAMES];
export type QuickProfileAuthMethod = 'login' | 'register';
export type ProfileCardShareDestination =
  | 'copy_link'
  | 'instagram'
  | 'line'
  | 'native'
  | 'other'
  | 'x';

interface QuickProfileMeasurementSession {
  sentEvents: QuickProfileEventName[];
  startedAt: number;
}

interface QuickProfileAnalyticsOptions {
  now?: () => number;
  storage?: Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;
  track?: (action: string, parameters?: AnalyticsEventParameters) => void;
}

const STORAGE_KEY = 'quick-profile-measurement-v1';
const THIRTY_SECONDS_IN_MS = 30_000;

export class QuickProfileAnalytics {
  private inMemorySession?: QuickProfileMeasurementSession;
  private readonly now: () => number;
  private readonly storage?: Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;
  private readonly track: (action: string, parameters?: AnalyticsEventParameters) => void;

  constructor({
    now = Date.now,
    storage = typeof window === 'undefined' ? undefined : window.sessionStorage,
    track = trackEvent,
  }: QuickProfileAnalyticsOptions = {}) {
    this.now = now;
    this.storage = storage;
    this.track = track;
  }

  start(): void {
    const currentSession = this.readSession();
    if (
      currentSession &&
      !currentSession.sentEvents.includes(QUICK_PROFILE_EVENT_NAMES.PUBLISH_COMPLETE)
    ) {
      return;
    }

    const session: QuickProfileMeasurementSession = {
      sentEvents: [QUICK_PROFILE_EVENT_NAMES.CREATE_START],
      startedAt: this.now(),
    };

    this.writeSession(session);
    this.track(QUICK_PROFILE_EVENT_NAMES.CREATE_START);
  }

  trackPhotoSelected(): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.PHOTO_SELECTED);
  }

  trackPreviewReady(): void {
    const session = this.readSession();
    if (!session || session.sentEvents.includes(QUICK_PROFILE_EVENT_NAMES.PREVIEW_READY)) {
      return;
    }

    const elapsedTimeMs = Math.max(0, Math.round(this.now() - session.startedAt));
    this.markAsSent(session, QUICK_PROFILE_EVENT_NAMES.PREVIEW_READY);
    this.track(QUICK_PROFILE_EVENT_NAMES.PREVIEW_READY, {
      elapsed_time_ms: elapsedTimeMs,
      within_30_seconds: elapsedTimeMs <= THIRTY_SECONDS_IN_MS,
    });
  }

  trackAuthOpen(authMethod: QuickProfileAuthMethod): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.AUTH_OPEN, { auth_method: authMethod });
  }

  trackAuthComplete(authMethod: QuickProfileAuthMethod): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.AUTH_COMPLETE, { auth_method: authMethod });
  }

  trackPublishComplete(): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.PUBLISH_COMPLETE);
  }

  trackCardDownload(): void {
    this.track(QUICK_PROFILE_EVENT_NAMES.CARD_DOWNLOAD, { card_format: 'standard_3_4' });
  }

  trackCardShare(destination: ProfileCardShareDestination): void {
    this.track(QUICK_PROFILE_EVENT_NAMES.CARD_SHARE, {
      card_format: 'standard_3_4',
      share_destination: destination,
    });
  }

  reset(): void {
    this.inMemorySession = undefined;

    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy modes; measurement remains optional.
    }
  }

  private trackOnce(eventName: QuickProfileEventName, parameters?: AnalyticsEventParameters): void {
    const session = this.readSession();
    if (!session || session.sentEvents.includes(eventName)) {
      return;
    }

    this.markAsSent(session, eventName);
    this.track(eventName, parameters);
  }

  private markAsSent(
    session: QuickProfileMeasurementSession,
    eventName: QuickProfileEventName
  ): void {
    session.sentEvents.push(eventName);
    this.writeSession(session);
  }

  private readSession(): QuickProfileMeasurementSession | undefined {
    try {
      const storedValue = this.storage?.getItem(STORAGE_KEY);
      if (!storedValue) return this.inMemorySession;

      const parsedValue: unknown = JSON.parse(storedValue);
      if (!parsedValue || typeof parsedValue !== 'object') {
        return undefined;
      }

      const sessionCandidate = parsedValue as Partial<QuickProfileMeasurementSession>;
      if (
        !Number.isFinite(sessionCandidate.startedAt) ||
        !Array.isArray(sessionCandidate.sentEvents)
      ) {
        return undefined;
      }

      return {
        sentEvents: sessionCandidate.sentEvents.filter(
          (eventName): eventName is QuickProfileEventName =>
            Object.values(QUICK_PROFILE_EVENT_NAMES).includes(eventName as QuickProfileEventName)
        ),
        startedAt: sessionCandidate.startedAt as number,
      };
    } catch {
      return this.inMemorySession;
    }
  }

  private writeSession(session: QuickProfileMeasurementSession): void {
    this.inMemorySession = {
      sentEvents: [...session.sentEvents],
      startedAt: session.startedAt,
    };

    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Storage can be unavailable in privacy modes; measurement remains optional.
    }
  }
}

export const quickProfileAnalytics = new QuickProfileAnalytics();
