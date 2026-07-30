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

export type AnalyticsEventParameter = string | number | boolean;
export type AnalyticsEventParameters = Record<string, AnalyticsEventParameter | undefined>;

const removeUndefinedParameters = (
  parameters: AnalyticsEventParameters
): Record<string, AnalyticsEventParameter> =>
  Object.fromEntries(
    Object.entries(parameters).filter(
      (entry): entry is [string, AnalyticsEventParameter] => entry[1] !== undefined
    )
  );

// Google Analytics初期化
export const initGA = (): void => {
  ensureGtag();
};

// ページビューをトラッキング
export const trackPageView = (path: string): void => {
  try {
    const gtag = ensureGtag();
    gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  } catch {
    // Analytics must never block navigation or rendering.
  }
};

// イベントをトラッキング
export const trackEvent = (action: string, parameters: AnalyticsEventParameters = {}): void => {
  try {
    const gtag = ensureGtag();
    gtag('event', action, removeUndefinedParameters(parameters));
  } catch {
    // Analytics must never block the action being measured.
  }
};

// TypeScriptのためのgtagの型定義
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
