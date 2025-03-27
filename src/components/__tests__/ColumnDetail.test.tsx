import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { supabase } from '../../lib/supabase';
import ColumnDetail from '../../pages/ColumnDetail';

// プロミスをフラッシュする関数
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Supabaseのモック
vi.mock('../../lib/supabase', () => {
  const mockThen = vi.fn();
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: mockThen,
      }),
    },
    mockThen,
  };
});

// テスト用のデータ
const mockColumn = {
  id: '1',
  slug: 'test-column',
  title: 'テストコラム',
  content: '<h2>はじめに</h2><p>これはテストコラムです。</p>',
  image_url: 'https://example.com/image.jpg',
  published_at: '2024-03-20T00:00:00Z',
};

describe('ColumnDetail', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コラムの詳細を正しく表示する', async () => {
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback =>
        Promise.resolve(
          callback({
            data: [mockColumn],
            error: null,
          })
        )
      ),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter initialEntries={['/columns/test-column']}>
            <Routes>
              <Route path="/columns/:slug" element={<ColumnDetail />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>
    );

    // ローディング表示を確認
    expect(screen.getByRole('status')).toBeInTheDocument();

    // 非同期処理を待つ
    await flushPromises();

    // データが読み込まれた後の表示を確認
    await waitFor(
      () => {
        expect(screen.getByText('テストコラム')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback =>
        Promise.resolve(
          callback({
            data: null,
            error: new Error('テストエラー'),
          })
        )
      ),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter initialEntries={['/columns/test-column']}>
            <Routes>
              <Route path="/columns/:slug" element={<ColumnDetail />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>
    );

    // 非同期処理を待つ
    await flushPromises();

    // エラーメッセージを確認
    await waitFor(
      () => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('コラムが見つからない場合に404メッセージを表示する', async () => {
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback =>
        Promise.resolve(
          callback({
            data: [],
            error: null,
          })
        )
      ),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter initialEntries={['/columns/test-column']}>
            <Routes>
              <Route path="/columns/:slug" element={<ColumnDetail />} />
            </Routes>
          </MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>
    );

    // 非同期処理を待つ
    await flushPromises();

    // 404メッセージを確認
    await waitFor(
      () => {
        expect(screen.getByText('404 - 記事が見つかりません')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
