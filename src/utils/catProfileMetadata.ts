const ROUTE_META_START = '<!-- ROUTE_META_START -->';
const ROUTE_META_END = '<!-- ROUTE_META_END -->';
const DEFAULT_OGP_PATH = '/images/ogp.png';
const MAX_DESCRIPTION_LENGTH = 160;

export const PROFILE_PATH_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,48}[a-zA-Z0-9]$/;

export interface PublicCatMetadataSource {
  name: string;
  catchphrase: string | null;
  description: string;
  image_url: string | null;
  prof_path_id: string;
}

interface RouteMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  type: 'profile' | 'website';
  robots: 'index, follow' | 'noindex, nofollow';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeDescription(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);

  if (characters.length <= MAX_DESCRIPTION_LENGTH) {
    return normalized;
  }

  return `${characters.slice(0, MAX_DESCRIPTION_LENGTH - 1).join('')}…`;
}

export function createCatProfileDescription(
  cat: Pick<PublicCatMetadataSource, 'name' | 'catchphrase' | 'description'>
): string {
  return normalizeDescription(
    [cat.catchphrase, cat.description].filter(Boolean).join(' ') ||
      `${cat.name}のプロフィールをご紹介します。`
  );
}

export function createCatProfileImageUrl(value: string | null, siteOrigin: string): string {
  const fallbackUrl = new URL(DEFAULT_OGP_PATH, siteOrigin).href;

  if (!value) {
    return fallbackUrl;
  }

  try {
    const url = new URL(value, siteOrigin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

function renderRouteMetadata(metadata: RouteMetadata): string {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonicalUrl = escapeHtml(metadata.canonicalUrl);
  const imageUrl = escapeHtml(metadata.imageUrl);

  return `${ROUTE_META_START}
    <title data-rh="true">${title}</title>
    <meta data-rh="true" name="description" content="${description}" />
    <meta data-rh="true" name="robots" content="${metadata.robots}" />
    <link data-rh="true" rel="canonical" href="${canonicalUrl}" />

    <meta data-rh="true" property="og:title" content="${title}" />
    <meta data-rh="true" property="og:type" content="${metadata.type}" />
    <meta data-rh="true" property="og:url" content="${canonicalUrl}" />
    <meta data-rh="true" property="og:image" content="${imageUrl}" />
    <meta data-rh="true" property="og:site_name" content="ねこプロフィール" />
    <meta data-rh="true" property="og:description" content="${description}" />
    <meta data-rh="true" property="og:locale" content="ja_JP" />

    <meta data-rh="true" name="twitter:card" content="summary_large_image" />
    <meta data-rh="true" name="twitter:site" content="@catnote_tokyo" />
    <meta data-rh="true" name="twitter:title" content="${title}" />
    <meta data-rh="true" name="twitter:description" content="${description}" />
    <meta data-rh="true" name="twitter:image" content="${imageUrl}" />
    ${ROUTE_META_END}`;
}

export function createCatProfileMetadata(cat: PublicCatMetadataSource, siteOrigin: string): string {
  const canonicalUrl = new URL(`/cats/${encodeURIComponent(cat.prof_path_id)}`, siteOrigin).href;
  const description = createCatProfileDescription(cat);

  return renderRouteMetadata({
    title: `${cat.name}のプロフィール | ねこプロフィール`,
    description,
    canonicalUrl,
    imageUrl: createCatProfileImageUrl(cat.image_url, siteOrigin),
    type: 'profile',
    robots: 'index, follow',
  });
}

export function createMissingCatMetadata(requestUrl: string, siteOrigin: string): string {
  return renderRouteMetadata({
    title: '猫プロフィールが見つかりません | ねこプロフィール',
    description: '指定された猫プロフィールは存在しないか、非公開になっています。',
    canonicalUrl: requestUrl,
    imageUrl: new URL(DEFAULT_OGP_PATH, siteOrigin).href,
    type: 'website',
    robots: 'noindex, nofollow',
  });
}

export function createFallbackCatMetadata(requestUrl: string, siteOrigin: string): string {
  return renderRouteMetadata({
    title: '猫プロフィール | ねこプロフィール',
    description: '愛猫のプロフィールや写真をご紹介します。',
    canonicalUrl: requestUrl,
    imageUrl: new URL(DEFAULT_OGP_PATH, siteOrigin).href,
    type: 'profile',
    robots: 'index, follow',
  });
}

export function injectRouteMetadata(html: string, metadata: string): string {
  const startIndex = html.indexOf(ROUTE_META_START);
  const endIndex = html.indexOf(ROUTE_META_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('Route metadata markers were not found in index.html');
  }

  return `${html.slice(0, startIndex)}${metadata}${html.slice(endIndex + ROUTE_META_END.length)}`;
}
