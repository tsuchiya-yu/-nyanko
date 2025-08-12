import { FALLBACK_BASE_URL } from './constants';

export function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl) {
    try {
      const url = new URL(envUrl);
      return url.origin;
    } catch (e) {
      // 不正な環境変数の値は警告を出して無視する

      console.warn(`VITE_SITE_URL の値 "${envUrl}" が不正です。`, e);
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // ブラウザ環境でない、または環境変数未設定時のフォールバック
  return FALLBACK_BASE_URL;
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  return new URL(path, base).href;
}
