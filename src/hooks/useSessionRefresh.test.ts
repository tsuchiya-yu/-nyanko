import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useSessionRefresh } from './useSessionRefresh';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// モックの設定
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useSessionRefresh', () => {
  // モックのセットアップ
  const mockSetUser = vi.fn();
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // useAuthStoreのモック
    (useAuthStore as any).mockReturnValue({
      setUser: mockSetUser,
    });

    // supabase.auth.onAuthStateChangeのモック
    (supabase.auth.onAuthStateChange as any).mockImplementation(callback => {
      // コールバック関数を保存して後でテストから呼び出せるようにする
      (global as any).authCallback = callback;

      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });
  });

  afterEach(() => {
    // グローバル変数のクリーンアップ
    delete (global as any).authCallback;
  });

  it('初期化時にsupabase.auth.onAuthStateChangeが呼ばれること', () => {
    renderHook(() => useSessionRefresh());

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it('SIGNED_INイベントでsetUserが呼ばれること', async () => {
    renderHook(() => useSessionRefresh());

    const mockUser = { id: 'user-1', email: 'test@example.com' };
    const mockSession = { user: mockUser };

    // 保存したコールバック関数を呼び出してSIGNED_INイベントをシミュレート
    await (global as any).authCallback('SIGNED_IN', mockSession);

    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
  });

  it('SIGNED_OUTイベントでsetUser(null)が呼ばれること', async () => {
    renderHook(() => useSessionRefresh());

    // 保存したコールバック関数を呼び出してSIGNED_OUTイベントをシミュレート
    await (global as any).authCallback('SIGNED_OUT', null);

    expect(mockSetUser).toHaveBeenCalledWith(null);
  });

  it('アンマウント時にunsubscribeが呼ばれること', () => {
    const { unmount } = renderHook(() => useSessionRefresh());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
