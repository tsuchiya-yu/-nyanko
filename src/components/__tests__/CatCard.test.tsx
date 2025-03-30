import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useFavorites } from '../../hooks/useFavorites';
import { useAuthStore } from '../../store/authStore';
import { renderWithProviders, mockCat } from '../../test/utils';
import { calculateAge } from '../../utils/calculateAge';
import CatCard from '../CatCard';

// モックの設定
vi.mock('../../store/authStore');
vi.mock('../../hooks/useFavorites');
vi.mock('../../utils/calculateAge');
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation(callback => callback({ data: [], error: null })),
  },
}));

describe('CatCardコンポーネント', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック実装
    (useAuthStore as any).mockReturnValue({
      user: null,
      profile: null,
      setUser: vi.fn(),
      setProfile: vi.fn(),
      signOut: vi.fn(),
      fetchProfile: vi.fn(),
    });

    (useFavorites as any).mockReturnValue({
      favorites: [],
      favoriteCats: [],
      isLoading: false,
      error: null,
      isFavorite: vi.fn(() => false),
      toggleFavorite: vi.fn(),
    });

    (calculateAge as any).mockReturnValue({
      years: 3,
      months: 0,
      toString: () => '3歳',
    });
  });

  it('猫の情報が正しく表示されること', () => {
    renderWithProviders(<CatCard cat={mockCat} />);

    // 猫の名前が表示されていることを確認
    expect(screen.getByText(mockCat.name)).toBeInTheDocument();

    // 猫の品種と年齢が表示されていることを確認
    expect(screen.getByText(`${mockCat.breed} | 3歳`)).toBeInTheDocument();

    // 猫の説明が表示されていることを確認
    expect(screen.getByText(mockCat.description)).toBeInTheDocument();

    // 猫の画像が表示されていることを確認
    const image = screen.getByAltText(mockCat.name);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', `${mockCat.image_url}?width=400&height=300&resize=fill`);
  });

  it('ユーザーがログインしていない場合、いいねボタンが表示されないこと', () => {
    renderWithProviders(<CatCard cat={mockCat} />);

    // いいねボタンが存在しないことを確認
    const likeButton = screen.queryByLabelText('いいね');
    expect(likeButton).not.toBeInTheDocument();
  });

  it('ユーザーがログインしている場合、いいねボタンが表示されること', () => {
    // ログイン状態をモック
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      profile: null,
      setUser: vi.fn(),
      setProfile: vi.fn(),
      signOut: vi.fn(),
      fetchProfile: vi.fn(),
    });

    renderWithProviders(<CatCard cat={mockCat} />);

    // いいねボタンが存在することを確認
    const likeButton = screen.getByLabelText('いいね');
    expect(likeButton).toBeInTheDocument();
  });

  it('いいねボタンをクリックするとtoggleFavoriteが呼ばれること', () => {
    // ログイン状態をモック
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      profile: null,
      setUser: vi.fn(),
      setProfile: vi.fn(),
      signOut: vi.fn(),
      fetchProfile: vi.fn(),
    });

    const toggleFavoriteMock = vi.fn();
    (useFavorites as any).mockReturnValue({
      favorites: [],
      favoriteCats: [],
      isLoading: false,
      error: null,
      isFavorite: vi.fn(() => false),
      toggleFavorite: toggleFavoriteMock,
    });

    renderWithProviders(<CatCard cat={mockCat} />);

    // いいねボタンをクリック
    const likeButton = screen.getByLabelText('いいね');
    fireEvent.click(likeButton);

    // toggleFavoriteが正しい引数で呼ばれたことを確認
    expect(toggleFavoriteMock).toHaveBeenCalledWith(mockCat.id);
  });

  it('いいね済みの場合、ボタンのスタイルが変わること', () => {
    // ログイン状態をモック
    (useAuthStore as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      profile: null,
      setUser: vi.fn(),
      setProfile: vi.fn(),
      signOut: vi.fn(),
      fetchProfile: vi.fn(),
    });

    // いいね済み状態をモック
    (useFavorites as any).mockReturnValue({
      favorites: [],
      favoriteCats: [],
      isLoading: false,
      error: null,
      isFavorite: vi.fn(() => true),
      toggleFavorite: vi.fn(),
    });

    renderWithProviders(<CatCard cat={mockCat} />);

    // いいね解除ボタンが存在することを確認
    const unlikeButton = screen.getByLabelText('いいね解除');
    expect(unlikeButton).toBeInTheDocument();

    // ハートアイコンのスタイルを確認（fill-pink-500クラスがあるか）
    const heartIcon = unlikeButton.querySelector('svg');
    expect(heartIcon).toHaveClass('fill-pink-500');
  });
});
