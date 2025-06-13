import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePageViewCount } from '../usePageViewCount';

// グローバルなfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('usePageViewCount', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // モックのリセット
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('ページビュー数を正しく取得できる', async () => {
    const mockPageViews = 42;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ pageViews: mockPageViews }),
    });

    const { result } = renderHook(() => usePageViewCount('cat1'), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBe(mockPageViews);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/ga-pageviews'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ catId: 'cat1' }),
      })
    );
  });

  it('APIエラーの場合、0を返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => usePageViewCount('cat1'), { wrapper });

    // 非同期処理の完了を待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.data).toBe(0);
  });

  it('ネットワークエラーの場合、0を返す', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePageViewCount('cat1'), { wrapper });

    // 非同期処理の完了を待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.data).toBe(0);
  });

  it('catIdが未指定の場合、クエリが実行されない', () => {
    renderHook(() => usePageViewCount(''), { wrapper });

    expect(mockFetch).not.toHaveBeenCalled();
  });
}); 