export function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (envUrl) {
    try {
      const url = new URL(envUrl);
      return url.origin;
    } catch (e) {
      // 不正な環境変数の値は警告を出して無視する
      // eslint-disable-next-line no-console
      console.warn(`VITE_SITE_URL の値 "${envUrl}" が不正です。`, e);
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // ブラウザ環境でない、または環境変数未設定時のフォールバック
  return 'https://cat-link.catnote.tokyo';
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
