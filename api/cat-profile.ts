import { fetchPublicCatMetadata } from '../src/lib/publicCatMetadata';
import {
  createCatProfileMetadata,
  createFallbackCatMetadata,
  createMissingCatMetadata,
  injectRouteMetadata,
  PROFILE_PATH_PATTERN,
} from '../src/utils/catProfileMetadata';

export const config = {
  runtime: 'edge',
};

function getSiteOrigin(request: Request): string {
  const configuredUrl = process.env.VITE_SITE_URL;

  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.origin;
      }
    } catch {
      console.warn('VITE_SITE_URL is invalid. Falling back to the request origin.');
    }
  }

  return new URL(request.url).origin;
}

async function fetchHtmlShell(request: Request): Promise<Response> {
  const shellUrl = new URL('/index.html', request.url);
  const headers = new Headers();
  const authorization = request.headers.get('authorization');

  if (authorization) {
    headers.set('authorization', authorization);
  }

  const response = await fetch(shellUrl, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch index.html: ${response.status}`);
  }

  return response;
}

function createHtmlResponse(shellResponse: Response, html: string, status: number): Response {
  const headers = new Headers(shellResponse.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('etag');
  headers.delete('last-modified');
  headers.set('content-type', 'text/html; charset=utf-8');

  if (status === 404) {
    headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
  } else {
    headers.set('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  }

  return new Response(html, { status, headers });
}

export default async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const path = requestUrl.searchParams.get('path') ?? '';
  const siteOrigin = getSiteOrigin(request);
  const publicProfileUrl = new URL(`/cats/${encodeURIComponent(path)}`, siteOrigin).href;
  const shellResponse = await fetchHtmlShell(request);
  const htmlShell = await shellResponse.text();

  if (!PROFILE_PATH_PATTERN.test(path)) {
    const html = injectRouteMetadata(
      htmlShell,
      createMissingCatMetadata(publicProfileUrl, siteOrigin)
    );
    return createHtmlResponse(shellResponse, html, 404);
  }

  try {
    const cat = await fetchPublicCatMetadata(path, {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    });

    if (!cat) {
      const html = injectRouteMetadata(
        htmlShell,
        createMissingCatMetadata(publicProfileUrl, siteOrigin)
      );
      return createHtmlResponse(shellResponse, html, 404);
    }

    const html = injectRouteMetadata(htmlShell, createCatProfileMetadata(cat, siteOrigin));
    return createHtmlResponse(shellResponse, html, 200);
  } catch (error) {
    console.error('Failed to render cat profile metadata:', error);
    const html = injectRouteMetadata(
      htmlShell,
      createFallbackCatMetadata(publicProfileUrl, siteOrigin)
    );
    return createHtmlResponse(shellResponse, html, 200);
  }
}
