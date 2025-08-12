// Google Analytics初期化
export const initGA = (): void => {
  console.log('GA already initialized via HTML script tag');
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
    gtag: (
      command: string,
      action: string,
      params?: {
        [key: string]: string | number | undefined;
      }
    ) => void;
    dataLayer: unknown[];
  }
}
