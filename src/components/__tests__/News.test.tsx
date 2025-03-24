import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

import { supabase } from '../../lib/supabase';
import News from '../../pages/News';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockNews = [
  {
    id: 1,
    title: 'テストニュース1',
    content: 'テストニュース1の内容',
    published_at: '2024-03-01T00:00:00.000Z',
    slug: 'test-news-1',
    is_published: true,
  },
  {
    id: 2,
    title: 'テストニュース2',
    content: 'テストニュース2の内容',
    published_at: '2024-02-01T00:00:00.000Z',
    slug: 'test-news-2',
    is_published: true,
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderNews = () => {
  render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <News />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('News', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('ニュース一覧が正しく表示される', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockNews,
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNews();

    await waitFor(() => {
      expect(screen.getByText('テストニュース1')).toBeInTheDocument();
      expect(screen.getByText('テストニュース2')).toBeInTheDocument();
    });
  });

  it('ローディング中はスピナーが表示される', () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(new Promise(() => {})),
        }),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNews();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('エラー時にエラーメッセージが表示される', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('エラーが発生しました'),
          }),
        }),
      }),
    });

    (supabase.from as Mock).mockImplementation(mockFrom);

    renderNews();

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });
}); 