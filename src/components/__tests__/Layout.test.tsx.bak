import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Layout from './Layout';
import { useHeaderFooter } from '../context/HeaderContext';
import { useAuthStore } from '../store/authStore';
import { renderWithProviders } from '../test/utils';

// モックの設定
vi.mock('../store/authStore');
vi.mock('../context/HeaderContext');
vi.mock('./auth/AuthModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="auth-modal" data-is-open={isOpen}>
      {isOpen && (
        <button onClick={onClose} data-testid="close-modal-button">
          閉じる
        </button>
      )}
    </div>
  ),
}));

describe('Layoutコンポーネント', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック実装
    (useAuthStore as any).mockReturnValue({
      user: null,
    });

    (useHeaderFooter as any).mockReturnValue({
      isHeaderFooterVisible: true,
    });
  });

  it('ヘッダーとフッターが表示されること', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="content">コンテンツ</div>
      </Layout>
    );

    // ヘッダーが表示されていることを確認
    expect(screen.getByAltText('ロゴ')).toBeInTheDocument();

    // フッターが表示されていることを確認
    expect(
      screen.getByText(`© ${new Date().getFullYear()} CAT LINK All rights reserved.`)
    ).toBeInTheDocument();
    expect(screen.getByText('利用規約')).toBeInTheDocument();
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();

    // 子要素が表示されていることを確認
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('コンテンツ')).toBeInTheDocument();
  });

  it('ユーザーがログインしていない場合、ログインと新規登録ボタンが表示されること', () => {
    renderWithProviders(
      <Layout>
        <div>コンテンツ</div>
      </Layout>
    );

    // ログインボタンが表示されていることを確認
    expect(screen.getByText('ログイン')).toBeInTheDocument();

    // 新規登録ボタンが表示されていることを確認
    expect(screen.getByText('新規登録')).toBeInTheDocument();

    // マイページリンクが表示されていないことを確認
    expect(screen.queryByText('マイページ')).not.toBeInTheDocument();
  });

  it('ユーザーがログインしている場合、マイページリンクが表示されること', () => {
    // ログイン状態をモック
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });

    renderWithProviders(
      <Layout>
        <div>コンテンツ</div>
      </Layout>
    );

    // マイページリンクが表示されていることを確認
    const myPageLink = screen.getByText('マイページ');
    expect(myPageLink).toBeInTheDocument();
    expect(myPageLink.getAttribute('href')).toBe('/profile/user-1');

    // ログインと新規登録ボタンが表示されていないことを確認
    expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
    expect(screen.queryByText('新規登録')).not.toBeInTheDocument();
  });

  it('ログインボタンをクリックすると認証モーダルが開くこと', () => {
    renderWithProviders(
      <Layout>
        <div>コンテンツ</div>
      </Layout>
    );

    // 初期状態では認証モーダルは閉じている
    expect(screen.getByTestId('auth-modal').getAttribute('data-is-open')).toBe('false');

    // ログインボタンをクリック
    fireEvent.click(screen.getByText('ログイン'));

    // 認証モーダルが開いていることを確認
    expect(screen.getByTestId('auth-modal').getAttribute('data-is-open')).toBe('true');
  });

  it('新規登録ボタンをクリックすると認証モーダルが開くこと', () => {
    renderWithProviders(
      <Layout>
        <div>コンテンツ</div>
      </Layout>
    );

    // 初期状態では認証モーダルは閉じている
    expect(screen.getByTestId('auth-modal').getAttribute('data-is-open')).toBe('false');

    // 新規登録ボタンをクリック
    fireEvent.click(screen.getByText('新規登録'));

    // 認証モーダルが開いていることを確認
    expect(screen.getByTestId('auth-modal').getAttribute('data-is-open')).toBe('true');
  });

  it('モーダルの閉じるボタンをクリックするとモーダルが閉じること', () => {
    renderWithProviders(
      <Layout>
        <div>コンテンツ</div>
      </Layout>
    );

    // ログインボタンをクリックしてモーダルを開く
    fireEvent.click(screen.getByText('ログイン'));
    expect(screen.getByTestId('auth-modal').getAttribute('data-is-open')).toBe('true');

    // 閉じるボタンをクリック
    fireEvent.click(screen.getByTestId('close-modal-button'));

    // モーダルが閉じていることを確認
    expect(screen.getByTestId('auth-modal').getAttribute('data-is-open')).toBe('false');
  });

  it('isHeaderFooterVisibleがfalseの場合、ヘッダーとフッターが表示されないこと', () => {
    // ヘッダーとフッターを非表示にする
    (useHeaderFooter as any).mockReturnValue({
      isHeaderFooterVisible: false,
    });

    renderWithProviders(
      <Layout>
        <div data-testid="content">コンテンツ</div>
      </Layout>
    );

    // ヘッダーが表示されていないことを確認
    expect(screen.queryByAltText('ロゴ')).not.toBeInTheDocument();

    // フッターが表示されていないことを確認
    expect(
      screen.queryByText(`© ${new Date().getFullYear()} CAT LINK All rights reserved.`)
    ).not.toBeInTheDocument();

    // 子要素は表示されていることを確認
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
