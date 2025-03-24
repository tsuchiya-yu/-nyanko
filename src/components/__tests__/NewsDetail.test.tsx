import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import { supabase } from '../../lib/supabase';
import NewsDetail from '../../pages/NewsDetail';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-news' }),
  };
});

const mockNews = {
  id: 1,
  title: 'テストニュース1',
  content: 'テストニュース1の内容',
  published_at: '2024-03-01T00:00:00.000Z',
  slug: 'test-news',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderNewsDetail = () => {
  render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NewsDetail />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('NewsDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('ニュース詳細が正しく表示される', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [mockNews],
          error: null,
        }),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNewsDetail();

    await waitFor(() => {
      expect(screen.getByText('テストニュース1')).toBeInTheDocument();
      expect(screen.getByText('テストニュース1の内容')).toBeInTheDocument();
      expect(screen.getByText('2024.03.01')).toBeInTheDocument();
    });
  });

  it('存在しないニュースの場合は404にリダイレクトされる', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNewsDetail();

    await waitFor(() => {
      expect(screen.getByText('404 - Not Found')).toBeInTheDocument();
    });
  });

  it('ローディング中はスピナーが表示される', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(new Promise(() => {})),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNewsDetail();

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', '読み込み中');
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('エラーが発生しました'),
        }),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNewsDetail();

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });
}); 