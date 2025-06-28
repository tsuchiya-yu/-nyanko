import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import UserSettingsModal from '../UserSettingsModal';

// Supabaseのモック
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      updateUser: vi.fn(() => Promise.resolve({ error: null })),
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

describe('UserSettingsModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    (useAuthStore as any).mockReturnValue({ user: mockUser });
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
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

  it('プロフィール更新が正しく動作する', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const nameInput = screen.getByLabelText('飼い主さんのニックネーム');
    fireEvent.change(nameInput, { target: { value: '新しい名前' } });

    const submitButton = screen.getByText('更新する');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('メールアドレス更新が正しく動作する', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByText('メール'));
    
    const emailInput = screen.getByLabelText('新しいメールアドレス');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    const submitButton = screen.getByText('更新する');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('パスワード更新が正しく動作する', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByText('パスワード'));
    
    const currentPasswordInput = screen.getByLabelText('現在のパスワード');
    const newPasswordInput = screen.getByLabelText('新しいパスワード');
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）');

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword' } });

    const submitButton = screen.getByText('更新する');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('パスワードの不一致をチェックする', async () => {
    renderModal();

    fireEvent.click(screen.getByText('パスワード'));
    
    const newPasswordInput = screen.getByLabelText('新しいパスワード');
    const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）');

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    const submitButton = screen.getByText('更新する');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });
  });

  it('バリデーションエラーを正しく表示する', async () => {
    renderModal();

    const nameInput = screen.getByLabelText('飼い主さんのニックネーム');
    fireEvent.change(nameInput, { target: { value: '1' } }); // 2文字未満

    const submitButton = screen.getByText('更新する');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('飼い主さんのニックネームは2文字以上で入力してください')).toBeInTheDocument();
    });
  });
}); 