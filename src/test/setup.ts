import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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

// Supabaseのモック
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  })),
}));

// react-helmet-asyncのモック
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => children,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// テストのタイムアウトを設定
vi.setConfig({
  testTimeout: 10000,
});
