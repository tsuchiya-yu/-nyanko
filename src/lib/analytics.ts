const GA_SCRIPT_ID = 'ga-gtag-script';
const GA_LOAD_DELAY_MS = 1000;
const CONSENT_UPDATE_DELAY_MS = 5000;

let isInitialized = false;
let consentTimerId: number | undefined;
let scriptTimerId: number | undefined;

const getTrackingId = (): string | undefined => import.meta.env.VITE_GA_TRACKING_ID;

const ensureDataLayer = (): unknown[] => {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
};

const ensureGtag = (): ((...args: unknown[]) => void) => {
  if (typeof window.gtag === 'function') {
    return window.gtag;
  }

  const dataLayer = ensureDataLayer();

  window.gtag = (...args: unknown[]) => {
    dataLayer.push(args);
  };

  return window.gtag;
};

const scheduleConsentUpdate = (gtag: (...args: unknown[]) => void): void => {
  if (consentTimerId !== undefined) {
    window.clearTimeout(consentTimerId);
  }

  consentTimerId = window.setTimeout(() => {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }, CONSENT_UPDATE_DELAY_MS);
};

const appendGtagScript = (trackingId: string): void => {
  if (document.getElementById(GA_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement('script');
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);
};

const scheduleDeferredScriptLoad = (trackingId: string): void => {
  if (scriptTimerId !== undefined) {
    window.clearTimeout(scriptTimerId);
  }

  scriptTimerId = window.setTimeout(() => {
    appendGtagScript(trackingId);
  }, GA_LOAD_DELAY_MS);
};

// Google Analytics初期化
export const initGA = (): void => {
  const trackingId = getTrackingId();

  if (isInitialized || !trackingId) {
    return;
  }

  const gtag = ensureGtag();
  gtag('js', new Date());
  gtag('config', trackingId, {
    client_storage: 'none',
    debug_mode: false,
    anonymize_ip: true,
    cookie_domain: 'none',
    cookie_expires: 0,
    cookie_flags: 'SameSite=None;Secure',
    send_page_view: false,
  });
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500,
  });
  scheduleConsentUpdate(gtag);
  isInitialized = true;

  if (document.readyState === 'complete') {
    scheduleDeferredScriptLoad(trackingId);
    return;
  }

  window.addEventListener(
    'load',
    () => {
      scheduleDeferredScriptLoad(trackingId);
    },
    { once: true }
  );
};

// ページビューをトラッキング
export const trackPageView = (path: string): void => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
    });
  }
};

// イベントをトラッキング
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
): void => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// TypeScriptのためのgtagの型定義
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
