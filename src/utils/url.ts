export function getBaseUrl(): string {
  const envUrl = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
  if (envUrl) {
    try {
      const url = new URL(envUrl);
      return url.origin;
    } catch {
      // 不正な環境変数の値は無視する
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
