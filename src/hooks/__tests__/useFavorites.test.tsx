import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFavorites } from '../useFavorites';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

// モックの設定
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useFavorites', () => {
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

  it('ログインしていない場合、favoritesとfavoriteCatsはundefined', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => {
      expect(result.current.favorites).toBeUndefined();
      expect(result.current.favoriteCats).toBeUndefined();
    });
  });

  it('お気に入りを正しく取得できる', async () => {
    const mockUser = { id: 'user1' };
    const mockFavorites = [
      { id: 'fav1', user_id: 'user1', cat_id: 'cat1' },
      { id: 'fav2', user_id: 'user1', cat_id: 'cat2' },
    ];
    const mockCats = [
      { id: 'cat1', name: 'ねこ1' },
      { id: 'cat2', name: 'ねこ2' },
    ];
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: () => ({
            eq: () => ({
              data: mockFavorites,
              error: null,
            }),
          }),
        };
      }
      if (table === 'cats') {
        return {
          select: () => ({
            in: () => ({
              data: mockCats,
              error: null,
            }),
          }),
        };
      }
      return {};
    });
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => {
      expect(result.current.favoriteCats).toEqual(mockCats);
    });
    expect(result.current.favorites).toEqual(mockFavorites);
  });

  it('お気に入りの追加が正しく動作する', async () => {
    const mockUser = { id: 'user1' };
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as jest.Mock).mockImplementation(() => ({
      insert: () => ({
        error: null,
      }),
    }));

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.toggleFavorite('cat1');
    });

    expect(supabase.from).toHaveBeenCalledWith('favorites');
  });

  it('お気に入りの削除が正しく動作する', async () => {
    const mockUser = { id: 'user1' };
    const mockFavorites = [{ id: 'fav1', user_id: 'user1', cat_id: 'cat1' }];
    
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as jest.Mock).mockImplementation((table) => ({
      select: () => ({
        eq: () => ({
          data: mockFavorites,
          error: null,
        }),
      }),
      delete: () => ({
        match: () => ({
          error: null,
        }),
      }),
    }));

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.toggleFavorite('cat1');
    });

    expect(supabase.from).toHaveBeenCalledWith('favorites');
  });

  it('エラーが発生した場合、エラーメッセージが設定される', async () => {
    const mockUser = { id: 'user1' };
    const mockError = new Error('テストエラー');

    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as jest.Mock).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          data: null,
          error: mockError,
        }),
      }),
    }));

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe(mockError.message);
  });
}); 