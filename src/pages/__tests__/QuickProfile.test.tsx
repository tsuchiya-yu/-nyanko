import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthModalStore } from '../../components/Layout';
import { quickProfileAnalytics } from '../../lib/quickProfileAnalytics';
import { renderWithProviders } from '../../test/utils';
import QuickProfile from '../QuickProfile';

vi.mock('../../lib/quickProfileAnalytics', () => ({
  quickProfileAnalytics: {
    start: vi.fn(),
    trackPhotoSelected: vi.fn(),
    trackPreviewReady: vi.fn(),
    trackAuthOpen: vi.fn(),
  },
}));

const mockedQuickProfileAnalytics = vi.mocked(quickProfileAnalytics);

describe('QuickProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthModalStore.setState({ isOpen: false, mode: 'login' });
    URL.createObjectURL = vi.fn(() => 'blob:quick-cat-photo');
    URL.revokeObjectURL = vi.fn();
  });

  it('未登録でも写真と名前だけでプロフィールプレビューを表示する', () => {
    renderWithProviders(<QuickProfile />, { initialEntries: ['/quick-profile'] });

    expect(mockedQuickProfileAnalytics.start).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /写真と名前だけで/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '無料登録して公開へ進む' })
    ).not.toBeInTheDocument();

    const photoInput = screen.getByLabelText(/猫の写真/);
    const photoFile = new File(['cat'], 'cat.png', { type: 'image/png' });
    fireEvent.change(photoInput, { target: { files: [photoFile] } });
    fireEvent.change(screen.getByLabelText(/名前/), { target: { value: 'つくし' } });

    expect(screen.getByRole('heading', { name: 'つくし' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'つくしのプレビュー' })).toHaveAttribute(
      'src',
      'blob:quick-cat-photo'
    );
    expect(screen.getByRole('button', { name: '無料登録して公開へ進む' })).toBeInTheDocument();
    expect(mockedQuickProfileAnalytics.trackPhotoSelected).toHaveBeenCalledTimes(1);
    expect(mockedQuickProfileAnalytics.trackPreviewReady).toHaveBeenCalledTimes(1);
  });

  it('任意の性格タグとひとことをプレビューに反映する', () => {
    renderWithProviders(<QuickProfile />, { initialEntries: ['/quick-profile'] });

    fireEvent.click(screen.getByRole('button', { name: '甘えん坊' }));
    fireEvent.change(screen.getByLabelText(/ひとこと/), {
      target: { value: '今日も窓辺をパトロール中' },
    });

    expect(screen.getAllByText('甘えん坊')).toHaveLength(2);
    expect(screen.getByText('今日も窓辺をパトロール中')).toBeInTheDocument();
  });

  it('公開CTAから登録モーダルを開き、認証開始を計測する', () => {
    renderWithProviders(<QuickProfile />, { initialEntries: ['/quick-profile'] });

    fireEvent.change(screen.getByLabelText(/猫の写真/), {
      target: { files: [new File(['cat'], 'cat.png', { type: 'image/png' })] },
    });
    fireEvent.change(screen.getByLabelText(/名前/), { target: { value: 'つくし' } });
    fireEvent.click(screen.getByRole('button', { name: '無料登録して公開へ進む' }));

    expect(mockedQuickProfileAnalytics.trackAuthOpen).toHaveBeenCalledWith('register');
    expect(useAuthModalStore.getState()).toMatchObject({ isOpen: true, mode: 'register' });
  });

  it('画像以外のファイルは受け付けない', () => {
    renderWithProviders(<QuickProfile />, { initialEntries: ['/quick-profile'] });

    fireEvent.change(screen.getByLabelText(/猫の写真/), {
      target: { files: [new File(['text'], 'memo.txt', { type: 'text/plain' })] },
    });

    expect(screen.getByText('画像ファイルを選択してください。')).toBeInTheDocument();
    expect(mockedQuickProfileAnalytics.trackPhotoSelected).not.toHaveBeenCalled();
  });
});
