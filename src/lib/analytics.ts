import ReactGA from 'react-ga4';

// Google Analytics初期化
export const initGA = (): void => {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;

  if (trackingId) {
    ReactGA.initialize(trackingId, {
      gaOptions: {
        cookieFlags: 'SameSite=None;Secure',
        cookieDomain: window.location.hostname,
        debug_mode: false, // デバッグモードを無効化
        storage: 'none' // ファーストパーティストレージを使用
      },
      gtagOptions: {
        debug_mode: false, // gtagでもデバッグモードを無効化
        cookie_update: false, // cookieの自動更新を無効化
        anonymize_ip: true // IPアドレスを匿名化
      }
    });
    console.log('GA initialized successfully');
  } else {
    console.warn('GA tracking ID not provided');
  }
};

// ページビューをトラッキング
export const trackPageView = (path: string): void => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

// イベントをトラッキング
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
): void => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};
