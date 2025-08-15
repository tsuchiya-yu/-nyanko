import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthStore } from '../../../store/authStore';
import { renderWithProviders } from '../../../test/utils';
import { paths } from '../../../utils/paths';
import Layout from '../../Layout';

import type { MockedFunction } from 'vitest';

// モックの設定
vi.mock('../../../store/authStore');
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signOut: vi.fn(),
  }),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe('Layoutコンポーネント', () => {
  const mockSetUser = vi.fn();
  const mockSignOut = vi.fn();
  const useAuthStoreMock = useAuthStore as unknown as MockedFunction<typeof useAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStoreMock.mockReturnValue({
      user: null,
      profile: null,
      setUser: mockSetUser,
      setProfile: vi.fn(),
      signOut: mockSignOut,
      fetchProfile: vi.fn(),
    });
  });

  it('ログインしていない場合、ログインボタンが表示されること', () => {
    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    expect(screen.getByText('ログイン')).toBeInTheDocument();
    expect(screen.getByText('新規登録')).toBeInTheDocument();
  });

  it('ログインしている場合、マイページリンクが表示されること', () => {
    useAuthStoreMock.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      profile: { name: 'テストユーザー' },
      setUser: mockSetUser,
      setProfile: vi.fn(),
      signOut: mockSignOut,
      fetchProfile: vi.fn(),
    });

    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    expect(screen.getByText('マイページ')).toBeInTheDocument();
  });

  it('ロゴをクリックするとホームに遷移すること', () => {
    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    const logoLink = screen.getByAltText('ロゴ').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('子要素が正しく表示されること', () => {
    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
  });

  it('ログアウトボタンが存在しないことを確認', () => {
    useAuthStoreMock.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      profile: { name: 'テストユーザー' },
      setUser: mockSetUser,
      setProfile: vi.fn(),
      signOut: mockSignOut,
      fetchProfile: vi.fn(),
    });

    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    // ログアウトボタンが存在しないことを確認
    expect(screen.queryByRole('button', { name: /ログアウト/i })).not.toBeInTheDocument();
  });

  it('フッターが表示されること', () => {
    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    expect(screen.getByText(/CAT LINK All rights reserved./)).toBeInTheDocument();
  });

  it('利用規約・プライバシーポリシーのリンクが表示されること', () => {
    renderWithProviders(
      <Layout>
        <div>テストコンテンツ</div>
      </Layout>
    );

    expect(screen.getByText('利用規約')).toBeInTheDocument();
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();

    const termsLink = screen.getByText('利用規約').closest('a');
    const privacyLink = screen.getByText('プライバシーポリシー').closest('a');

    expect(termsLink).toHaveAttribute('href', paths.terms());
    expect(privacyLink).toHaveAttribute('href', paths.privacy());
  });
});
