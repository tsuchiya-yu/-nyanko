import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

import { fetchPublicCatMetadata } from './src/lib/publicCatMetadata';
import {
  createCatProfileMetadata,
  createFallbackCatMetadata,
  createMissingCatMetadata,
  injectRouteMetadata,
  PROFILE_PATH_PATTERN,
} from './src/utils/catProfileMetadata';

function catProfileMetadataPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'cat-profile-metadata',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url;

        if (
          !requestUrl ||
          !new URL(requestUrl, 'http://localhost').pathname.match(/^\/cats\/[^/]+$/)
        ) {
          next();
          return;
        }

        try {
          const template = await readFile(resolve(process.cwd(), 'index.html'), 'utf8');
          const html = await server.transformIndexHtml(requestUrl, template);
          response.statusCode = 200;
          response.setHeader('content-type', 'text/html; charset=utf-8');
          response.end(html);
        } catch (error) {
          next(error as Error);
        }
      });
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        const requestUrl = new URL(context.path, env.VITE_SITE_URL || 'http://localhost:5173');
        const match = requestUrl.pathname.match(/^\/cats\/([^/]+)$/);

        if (!match) {
          return html;
        }

        let path: string;
        try {
          path = decodeURIComponent(match[1]);
        } catch {
          return injectRouteMetadata(
            html,
            createMissingCatMetadata(requestUrl.href, requestUrl.origin)
          );
        }
        const siteOrigin = requestUrl.origin;
        const profileUrl = new URL(`/cats/${encodeURIComponent(path)}`, siteOrigin).href;

        if (!PROFILE_PATH_PATTERN.test(path)) {
          return injectRouteMetadata(html, createMissingCatMetadata(profileUrl, siteOrigin));
        }

        try {
          const cat = await fetchPublicCatMetadata(path, {
            supabaseUrl: env.VITE_SUPABASE_URL,
            supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
          });
          const metadata = cat
            ? createCatProfileMetadata(cat, siteOrigin)
            : createMissingCatMetadata(profileUrl, siteOrigin);

          return injectRouteMetadata(html, metadata);
        } catch (error) {
          console.warn('Failed to inject cat profile metadata in Vite dev server:', error);
          return injectRouteMetadata(html, createFallbackCatMetadata(profileUrl, siteOrigin));
        }
      },
    },
  };
}

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // 環境変数の読み込み
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    base: '/',
    plugins: [react(), catProfileMetadataPlugin(env)],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    define: {
      'process.env': env,
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    // HTMLファイル内の%ENV_VAR%を置換
    experimental: {
      renderBuiltUrl(filename) {
        return filename;
      },
    },
  });
};
