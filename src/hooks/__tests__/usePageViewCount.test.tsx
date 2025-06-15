import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePageViewCount } from '../usePageViewCount';
import { vi } from 'vitest';

// fetchのモック
const originalFetch = window.fetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePageViewCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.fetch = originalFetch;
  });

  it('ページビュー数が正しく取得される', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pageViews: 5 }),
    });
    window.fetch = mockFetch;

    const { result } = renderHook(() => usePageViewCount('test-page'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBe(5);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    expect(mockFetch).toHaveBeenCalled();
  });

  it('ページビュー数が0の場合、正しく処理される', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ pageViews: 0 }),
    });
    window.fetch = mockFetch;

    const { result } = renderHook(() => usePageViewCount('test-page'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('エラーが発生した場合、dataが0になる', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    window.fetch = mockFetch;

    const { result } = renderHook(() => usePageViewCount('test-page'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
}); 