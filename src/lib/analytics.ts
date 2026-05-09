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

// Google Analytics初期化
export const initGA = (): void => {
  ensureGtag();
};

// ページビューをトラッキング
export const trackPageView = (path: string): void => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: `${window.location.origin}${path}`,
      page_title: document.title,
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
