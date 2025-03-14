// Google Analytics初期化
export const initGA = (): void => {
  // HTMLのhead内にGTAGが直接設定されているため、ここでの初期化はスキップ
  console.log('GA already initialized via HTML script tag');
};

// ページビューをトラッキング
export const trackPageView = (path: string): void => {
  // グローバルのgtagを使用
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
  // グローバルのgtagを使用
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
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}
