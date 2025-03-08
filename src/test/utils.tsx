import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

// テスト用のQueryClientを作成
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });

interface AllProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
}

// テスト用のプロバイダーをラップする
export const AllProviders = ({ children, initialEntries = ['/'] }: AllProvidersProps) => {
  const testQueryClient = createTestQueryClient();

  return (
    <HelmetProvider>
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

// カスタムレンダー関数
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] }
) => {
  const { initialEntries, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: props => <AllProviders {...props} initialEntries={initialEntries} />,
    ...renderOptions,
  });
};

// モックデータ
export const mockCat = {
  id: 'cat-1',
  name: 'タマ',
  breed: 'アメリカンショートヘア',
  description: 'とても人懐っこい猫です。',
  birthdate: '2020-01-01',
  image_url: 'https://example.com/cat.jpg',
  owner_id: 'user-1',
};

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'テストユーザー',
};
