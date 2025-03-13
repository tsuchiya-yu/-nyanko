import ReactGA from 'react-ga4';

// Google Analytics初期化
export const initGA = (): void => {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
  
  if (trackingId) {
    ReactGA.initialize(trackingId);
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
    value
  });
}; 