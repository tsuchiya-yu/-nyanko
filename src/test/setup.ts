import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';

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

// テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

// MSWのサーバーをセットアップする場合
// export const server = setupServer(...handlers);
// 
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close()); 