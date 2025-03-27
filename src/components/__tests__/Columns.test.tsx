import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { supabase } from '../../lib/supabase';
import Columns from '../../pages/Columns';

// プロミスをフラッシュする関数
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Supabaseのモック
vi.mock('../../lib/supabase', () => {
  const mockThen = vi.fn();
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: mockThen,
      }),
    },
    mockThen,
  };
});

// テスト用のデータ
const mockColumns = [
  {
    id: '1',
    slug: 'test-column-1',
    title: 'テストコラム1',
    content: '<p>これはテストコラム1です。</p>',
    image_url: 'https://example.com/image1.jpg',
    published_at: '2024-03-20T00:00:00Z',
  },
  {
    id: '2',
    slug: 'test-column-2',
    title: 'テストコラム2',
    content: '<p>これはテストコラム2です。</p>',
    image_url: 'https://example.com/image2.jpg',
    published_at: '2024-03-19T00:00:00Z',
  },
];

describe('Columns', () => {
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

  it('コラム一覧を正しく表示する', async () => {
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(callback =>
        Promise.resolve(
          callback({
            data: mockColumns,
            error: null,
          })
        )
      ),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter>
            <Columns />
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
        expect(screen.getByText('コラム一覧')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
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
          <MemoryRouter>
            <Columns />
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

  it('コラムが存在しない場合にメッセージを表示する', async () => {
    // supabase.fromのモックを設定
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
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
          <MemoryRouter>
            <Columns />
          </MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>
    );

    // 非同期処理を待つ
    await flushPromises();

    // 記事がない場合のメッセージを確認
    await waitFor(
      () => {
        expect(screen.getByText('記事はありません')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('トップに戻るリンクが正しく機能する', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <MemoryRouter>
            <Columns />
          </MemoryRouter>
        </HelmetProvider>
      </QueryClientProvider>
    );

    const backLink = screen.getByText('トップに戻る');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/');
  });
});
