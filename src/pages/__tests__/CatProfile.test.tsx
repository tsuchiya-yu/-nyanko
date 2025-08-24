import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, useParams } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HeaderProvider } from '../../context/HeaderContext';
import { useAuthStore } from '../../store/authStore';
import { mockCat } from '../../test/utils';
import CatProfile from '../CatProfile';

vi.mock('../../store/authStore');
vi.mock('../../hooks/useSessionRefresh', () => ({
  useSessionRefresh: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: vi.fn() };
});

const mockedUseParams = useParams as unknown as vi.Mock;
const mockedUseAuthStore = useAuthStore as unknown as vi.Mock;

const createWrapper = ({ cat = mockCat, photos = [], ownerCats = [] } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  queryClient.setQueryData(['cat', cat.prof_path_id], cat);
  queryClient.setQueryData(['cat-photos', cat.id], photos);
  queryClient.setQueryData(['owner-cats', cat.owner_id, cat.id], ownerCats);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <HeaderProvider>
            <MemoryRouter initialEntries={[`/cats/${cat.prof_path_id}`]}>{children}</MemoryRouter>
          </HeaderProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }

  return Wrapper;
};

describe('CatProfile', () => {
  beforeEach(() => {
    mockedUseParams.mockReturnValue({ path: mockCat.prof_path_id });
    mockedUseAuthStore.mockReturnValue({
      user: null,
      profile: null,
      setUser: vi.fn(),
      setProfile: vi.fn(),
      signOut: vi.fn(),
      fetchProfile: vi.fn(),
    });
  });

  it('アバター画像をクリックするとShareModalが表示される', async () => {
    const Wrapper = createWrapper();
    render(<CatProfile />, { wrapper: Wrapper });

    // モーダルが初期状態では表示されていないことを確認
    expect(
      screen.queryByRole('heading', { name: `${mockCat.name} | CAT LINK` })
    ).not.toBeInTheDocument();

    const avatarButton = screen.getByRole('button', { name: 'プロフィール画像をシェアする' });
    fireEvent.click(avatarButton);

    expect(
      await screen.findByRole('heading', { name: `${mockCat.name} | CAT LINK` })
    ).toBeInTheDocument();
  });

  it('右上のシェアボタンをクリックするとShareModalが表示される', async () => {
    const Wrapper = createWrapper();
    render(<CatProfile />, { wrapper: Wrapper });

    expect(
      screen.queryByRole('heading', { name: `${mockCat.name} | CAT LINK` })
    ).not.toBeInTheDocument();

    const shareButton = screen.getByRole('button', { name: 'シェアする' });
    fireEvent.click(shareButton);

    expect(
      await screen.findByRole('heading', { name: `${mockCat.name} | CAT LINK` })
    ).toBeInTheDocument();
  });
});
