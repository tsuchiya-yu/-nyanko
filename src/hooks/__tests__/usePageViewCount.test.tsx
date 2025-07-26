import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { supabase } from '../../lib/supabase';
import { usePageViewCount } from '../usePageViewCount';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('usePageViewCount', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('ページビュー数が正しく取得される', async () => {
    const mockInvoke = vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: { pageViews: 42 },
      error: null,
    });

    const { result } = renderHook(() => usePageViewCount('test-page'), {
      wrapper,
    });

    expect(result.current.data).toBe(undefined);
    await vi.waitFor(() => {
      expect(result.current.data).toBe(42);
    });

    expect(mockInvoke).toHaveBeenCalledWith('ga-pageviews', {
      body: { catId: 'test-page' },
    });
  });

  it('APIエラー時にエラーハンドリングが正しく行われる', async () => {
    const mockError = new Error('Internal Server Error');
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => usePageViewCount('test-page-error'), {
      wrapper,
    });

    expect(result.current.data).toBe(undefined);
    await vi.waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
  });

  it('ページビュー数が0の場合、正しく処理される', async () => {
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({
      data: { pageViews: 0 },
      error: null,
    });

    const { result } = renderHook(() => usePageViewCount('test-page-zero'), {
      wrapper,
    });

    await vi.waitFor(() => {
      expect(result.current.data).toBe(0);
    });
  });
});
