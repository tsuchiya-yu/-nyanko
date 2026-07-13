import { trackEvent, type AnalyticsEventParameters } from './analytics';

export const QUICK_PROFILE_EVENT_NAMES = {
  createStart: 'quick_profile_create_start',
  photoSelected: 'quick_profile_photo_selected',
  previewReady: 'quick_profile_preview_ready',
  authOpen: 'quick_profile_auth_open',
  authComplete: 'quick_profile_auth_complete',
  publishComplete: 'quick_profile_publish_complete',
  cardDownload: 'profile_card_download',
  cardShare: 'profile_card_share',
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
      !currentSession.sentEvents.includes(QUICK_PROFILE_EVENT_NAMES.publishComplete)
    ) {
      return;
    }

    const session: QuickProfileMeasurementSession = {
      sentEvents: [QUICK_PROFILE_EVENT_NAMES.createStart],
      startedAt: this.now(),
    };

    this.writeSession(session);
    this.track(QUICK_PROFILE_EVENT_NAMES.createStart);
  }

  trackPhotoSelected(): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.photoSelected);
  }

  trackPreviewReady(): void {
    const session = this.readSession();
    if (!session || session.sentEvents.includes(QUICK_PROFILE_EVENT_NAMES.previewReady)) {
      return;
    }

    const elapsedTimeMs = Math.max(0, Math.round(this.now() - session.startedAt));
    this.markAsSent(session, QUICK_PROFILE_EVENT_NAMES.previewReady);
    this.track(QUICK_PROFILE_EVENT_NAMES.previewReady, {
      elapsed_time_ms: elapsedTimeMs,
      within_30_seconds: elapsedTimeMs <= THIRTY_SECONDS_IN_MS,
    });
  }

  trackAuthOpen(authMethod: QuickProfileAuthMethod): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.authOpen, { auth_method: authMethod });
  }

  trackAuthComplete(authMethod: QuickProfileAuthMethod): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.authComplete, { auth_method: authMethod });
  }

  trackPublishComplete(): void {
    this.trackOnce(QUICK_PROFILE_EVENT_NAMES.publishComplete);
  }

  trackCardDownload(): void {
    this.track(QUICK_PROFILE_EVENT_NAMES.cardDownload, { card_format: 'standard_3_4' });
  }

  trackCardShare(destination: ProfileCardShareDestination): void {
    this.track(QUICK_PROFILE_EVENT_NAMES.cardShare, {
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

      const parsedValue = JSON.parse(storedValue) as Partial<QuickProfileMeasurementSession>;
      if (!Number.isFinite(parsedValue.startedAt) || !Array.isArray(parsedValue.sentEvents)) {
        return undefined;
      }

      return {
        sentEvents: parsedValue.sentEvents.filter((eventName): eventName is QuickProfileEventName =>
          Object.values(QUICK_PROFILE_EVENT_NAMES).includes(eventName as QuickProfileEventName)
        ),
        startedAt: parsedValue.startedAt as number,
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
