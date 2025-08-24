import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

import { HeaderProvider } from '../context/HeaderContext';

// テスト用のQueryClientを作成
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
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
        <HeaderProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </HeaderProvider>
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
  created_at: '2024-01-01T00:00:00.000Z',
  name: 'タマ',
  birthdate: '2020-01-01',
  is_birthdate_estimated: false,
  breed: 'アメリカンショートヘア',
  catchphrase: '元気いっぱい！',
  description: 'とても人懐っこい猫です。',
  image_url: 'https://example.com/cat.jpg',
  instagram_url: null,
  youtube_url: null,
  tiktok_url: null,
  x_url: null,
  homepage_url: null,
  owner_id: 'user-1',
  gender: '女の子',
  background_color: '#ffffff',
  text_color: '#000000',
  is_public: true,
  prof_path_id: 'tama',
};

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'テストユーザー',
};
