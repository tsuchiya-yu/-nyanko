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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  queryClient.setQueryData(['cat', mockCat.id], mockCat);
  queryClient.setQueryData(['cat-photos', mockCat.id], []);
  queryClient.setQueryData(['owner-cats', mockCat.owner_id, mockCat.id], []);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <HeaderProvider>
            <MemoryRouter initialEntries={[`/cats/${mockCat.id}`]}>{children}</MemoryRouter>
          </HeaderProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }

  return Wrapper;
};

describe('CatProfile', () => {
  beforeEach(() => {
    mockedUseParams.mockReturnValue({ id: mockCat.id });
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

    const avatarImg = screen.getByAltText(mockCat.name);
    const avatarButton = avatarImg.closest('button');
    expect(avatarButton).not.toBeNull();
    fireEvent.click(avatarButton!);

    expect(await screen.findByText('SNSでページをシェアする')).toBeInTheDocument();
  });
});
