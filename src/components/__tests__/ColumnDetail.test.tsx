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
    // モックのクリーンアップ
    vi.clearAllMocks();
    
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({
        then: vi.fn().mockImplementation((callback) => {
          return Promise.resolve(callback({ 
            data: mockColumn, 
            error: null 
          }));
        }),
      }),
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

    // タイトルが正しく表示されることを確認
    const header = await screen.findByText('コラム一覧に戻る');
    expect(header).toBeInTheDocument();
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    // モックのクリーンアップ
    vi.clearAllMocks();
    
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({
        then: vi.fn().mockImplementation((callback) => {
          return Promise.resolve(callback({ 
            data: null, 
            error: { message: 'テストエラー' } 
          }));
        }),
      }),
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
    
    // 「コラム一覧に戻る」リンクを検索して確認する
    await waitFor(() => {
      const backLink = screen.getByText('コラム一覧に戻る');
      expect(backLink).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('コラムが見つからない場合に404メッセージを表示する', async () => {
    // モックのクリーンアップ
    vi.clearAllMocks();
    
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({
        then: vi.fn().mockImplementation((callback) => {
          return Promise.resolve(callback({ 
            data: null, 
            error: null 
          }));
        }),
      }),
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
    
    // 「コラム一覧に戻る」リンクを検索して確認する
    await waitFor(() => {
      const backLink = screen.getByText('コラム一覧に戻る');
      expect(backLink).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
