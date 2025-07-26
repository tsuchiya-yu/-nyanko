import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
  });

  it('should return page views', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pageViews: 42 }),
    });

    window.fetch = mockFetch;

    const { result } = renderHook(() => usePageViewCount('test-page'), {
      wrapper,
    });

    expect(result.current.data).toBe(undefined);
    await vi.waitFor(() => {
      expect(result.current.data).toBe(42);
    });
  });

  it('should handle error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    window.fetch = mockFetch;

    const { result } = renderHook(() => usePageViewCount('test-page'), {
      wrapper,
    });

    expect(result.current.data).toBe(undefined);
    await vi.waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
