import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Supabaseのモックをインポート
import './mocks/supabase';

// React Routerの警告を抑制
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    // React Router v6の将来の変更に関する警告を抑制
    UNSAFE_DataRouterContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
    UNSAFE_DataRouterStateContext: {
      Provider: ({ children }: { children: React.ReactNode }) => children,
    },
  };
});

// 環境変数のモック
vi.mock('import.meta.env', () => ({
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
}));

// テスト後にクリーンアップ
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// MSWのサーバーをセットアップする場合
// export const server = setupServer(...handlers);
//
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());
