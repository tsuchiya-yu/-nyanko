import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useSessionRefresh } from '../useSessionRefresh';

// グローバルオブジェクトの型定義
type MockCallback = (event: string, session: unknown) => Promise<void>;

// モックの設定
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useSessionRefresh', () => {
  // モックのセットアップ
  const mockSetUser = vi.fn();
  const mockUnsubscribe = vi.fn();
  // グローバルスコープに保存するコールバック
  let authCallback: MockCallback;

  beforeEach(() => {
    vi.clearAllMocks();

    // useAuthStoreのモック
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      setUser: mockSetUser,
    });

    // supabase.auth.onAuthStateChangeのモック
    (supabase.auth.onAuthStateChange as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (callback: MockCallback) => {
        // コールバック関数を保存して後でテストから呼び出せるようにする
        authCallback = callback;

        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        };
      }
    );
  });

  afterEach(() => {
    // グローバル変数のクリーンアップ
    authCallback = undefined as unknown as MockCallback;
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
    await authCallback('SIGNED_IN', mockSession);

    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
  });

  it('SIGNED_OUTイベントでsetUser(null)が呼ばれること', async () => {
    renderHook(() => useSessionRefresh());

    // 保存したコールバック関数を呼び出してSIGNED_OUTイベントをシミュレート
    await authCallback('SIGNED_OUT', null);

    expect(mockSetUser).toHaveBeenCalledWith(null);
  });

  it('アンマウント時にunsubscribeが呼ばれること', () => {
    const { unmount } = renderHook(() => useSessionRefresh());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
