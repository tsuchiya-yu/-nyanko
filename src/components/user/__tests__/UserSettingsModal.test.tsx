import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import UserSettingsModal from '../UserSettingsModal';

import type { PostgrestError, User } from '@supabase/supabase-js';

// Supabaseのモック
const eqMock = vi.fn();
const updateMock = vi.fn(() => ({
  eq: eqMock,
}));
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: updateMock,
    })),
    auth: {
      updateUser: vi.fn(),
    },
  },
}));

// AuthStoreのモック
vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockProfile = {
  name: 'テストユーザー',
};

// 型チェッカーを満足させるための最小限のSupabaseユーザーモック
const mockSupabaseUser: User = {
  id: 'test-user-id',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

describe('UserSettingsModal', () => {
  let queryClient: QueryClient;
  const onCloseMock = vi.fn();
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      setUser: vi.fn(),
      setProfile: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
      fetchProfile: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    alertSpy.mockClear();
  });

  afterAll(() => {
    alertSpy.mockRestore();
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: onCloseMock,
      profile: mockProfile,
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <UserSettingsModal {...defaultProps} />
      </QueryClientProvider>
    );
  };

  it('モーダルが開いているときに正しくレンダリングされる', () => {
    renderModal();
    expect(screen.getByText('アカウント設定')).toBeInTheDocument();
    expect(screen.getByText('プロフィール')).toBeInTheDocument();
    expect(screen.getByText('メール')).toBeInTheDocument();
    expect(screen.getByText('パスワード')).toBeInTheDocument();
  });

  it('モーダルが閉じているときはnullを返す', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  describe('プロフィール更新', () => {
    it('正常に更新される', async () => {
      eqMock.mockResolvedValue({ error: null });

      renderModal();

      const nameInput = screen.getByLabelText('飼い主さんのニックネーム');
      fireEvent.change(nameInput, { target: { value: '新しい名前' } });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(updateMock).toHaveBeenCalledWith({
          name: '新しい名前',
        });
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('更新に失敗した場合にエラーメッセージを表示する', async () => {
      const mockError: PostgrestError = {
        message: 'Update failed',
        details: 'Something went wrong',
        hint: '',
        code: '12345',
      };
      eqMock.mockResolvedValue({ error: mockError });

      renderModal();

      const nameInput = screen.getByLabelText('飼い主さんのニックネーム');
      fireEvent.change(nameInput, { target: { value: '既存の名前' } });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('更新に失敗しました');
      });
    });

    it('バリデーションエラーを正しく表示する', async () => {
      renderModal();

      const nameInput = screen.getByLabelText('飼い主さんのニックネーム');
      fireEvent.change(nameInput, { target: { value: 'a' } });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      expect(
        await screen.findByText('飼い主さんのニックネームは2文字以上で入力してください')
      ).toBeInTheDocument();
    });
  });

  describe('メールアドレス更新', () => {
    it('正常に更新される', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });

      renderModal();
      fireEvent.click(screen.getByText('メール'));

      const emailInput = screen.getByLabelText('新しいメールアドレス');
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('更新に失敗した場合にエラーメッセージを表示する', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { name: 'AuthApiError', message: 'Email update failed' },
      });

      renderModal();
      fireEvent.click(screen.getByText('メール'));

      const emailInput = screen.getByLabelText('新しいメールアドレス');
      fireEvent.change(emailInput, { target: { value: 'fail@example.com' } });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('更新に失敗しました');
      });
    });
  });

  describe('パスワード更新', () => {
    it('正常に更新される', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });

      renderModal();
      fireEvent.click(screen.getByText('パスワード'));

      fireEvent.change(screen.getByLabelText('現在のパスワード'), {
        target: { value: 'oldpassword' },
      });
      fireEvent.change(screen.getByLabelText('新しいパスワード'), {
        target: { value: 'newpassword' },
      });
      fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
        target: { value: 'newpassword' },
      });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword' });
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('更新に失敗した場合にエラーメッセージを表示する', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { name: 'AuthApiError', message: 'Password update failed' },
      });

      renderModal();
      fireEvent.click(screen.getByText('パスワード'));

      fireEvent.change(screen.getByLabelText('現在のパスワード'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.change(screen.getByLabelText('新しいパスワード'), {
        target: { value: 'newpassword' },
      });
      fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
        target: { value: 'newpassword' },
      });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('更新に失敗しました');
      });
    });

    it('新しいパスワードが一致しない場合にエラーメッセージを表示する', async () => {
      renderModal();
      fireEvent.click(screen.getByText('パスワード'));

      fireEvent.change(screen.getByLabelText('新しいパスワード'), {
        target: { value: 'newpassword' },
      });
      fireEvent.change(screen.getByLabelText('新しいパスワード（確認）'), {
        target: { value: 'differentpassword' },
      });

      const submitButton = screen.getByText('更新する');
      fireEvent.click(submitButton);

      expect(await screen.findByText('パスワードが一致しません')).toBeInTheDocument();
    });
  });
});
