import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useFavorites } from '../useFavorites';

// モックの設定
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
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
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });
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
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table) => {
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
    const mockInsertFn = vi.fn().mockResolvedValue({ error: null });
    const mockSelectFn = vi.fn().mockResolvedValue({ data: [], error: null });

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: () => ({
            eq: () => mockSelectFn(),
          }),
          insert: mockInsertFn,
        };
      }
      return {};
    });

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.toggleFavorite('cat1');
    });

    // 初期状態の確認（isFavoriteの呼び出し）
    expect(mockSelectFn).toHaveBeenCalled();
    // お気に入り追加の確認
    expect(mockInsertFn).toHaveBeenCalledWith({ user_id: mockUser.id, cat_id: 'cat1' });
  });

  it('お気に入りの削除が正しく動作する', async () => {
    const mockUser = { id: 'user1' };
    const mockMatchFn = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteFn = vi.fn(() => ({ match: mockMatchFn }));
    const mockSelectFn = vi.fn().mockResolvedValue({
      data: [{ id: 'fav1', user_id: 'user1', cat_id: 'cat1' }],
      error: null,
    });

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: () => ({
            eq: () => mockSelectFn(),
          }),
          delete: mockDeleteFn,
        };
      }
      return {};
    });

    const { result } = renderHook(() => useFavorites(), { wrapper });

    // 初期状態を設定するために、お気に入りを取得するのを待つ
    await waitFor(() => {
      expect(result.current.favorites).toBeDefined();
    });

    await act(async () => {
      await result.current.toggleFavorite('cat1');
    });

    // 初期状態の確認（isFavoriteの呼び出し）
    expect(mockSelectFn).toHaveBeenCalled();
    // お気に入り削除の確認
    expect(mockDeleteFn).toHaveBeenCalledTimes(1);
    expect(mockMatchFn).toHaveBeenCalledWith({ user_id: mockUser.id, cat_id: 'cat1' });
  });

  it('ユーザーが未ログインの場合、お気に入りの操作が失敗する', async () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    const { result } = renderHook(() => useFavorites(), { wrapper });

    await act(async () => {
      await result.current.toggleFavorite('cat1');
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('エラーが発生した場合、エラーメッセージが設定される', async () => {
    const mockUser = { id: 'user1' };
    const mockError = new Error('テストエラー');

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
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