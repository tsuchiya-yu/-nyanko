import { useState, type ReactNode, useEffect } from 'react';
import { Link, useNavigate, type NavigateFunction } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';
import { useHeaderFooter } from '../context/HeaderContext';

// グローバルなモーダル状態管理
interface AuthModalStore {
  isOpen: boolean;
  mode: 'login' | 'register';
  setIsOpen: (isOpen: boolean) => void;
  setMode: (mode: 'login' | 'register') => void;
}

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',
  setIsOpen: (isOpen) => set({ isOpen }),
  setMode: (mode) => set({ mode }),
}));

interface LayoutProps {
  children: ReactNode;
}

export function handleAuthAction(user: User | null, navigate: NavigateFunction, mode: 'login' | 'register' = 'login') {
  if (user) {
    // ユーザーがログイン済みの場合はUserProfileページに遷移
    navigate(`/profile/${user.id}`);
  } else {
    // 未ログインの場合は認証モーダルを表示
    const authStore = useAuthModalStore.getState();
    authStore.setMode(mode);
    authStore.setIsOpen(true);
  }
}

export default function Layout({ children }: LayoutProps) {
  const { isOpen: isAuthModalOpen, setIsOpen: setIsAuthModalOpen, mode: authMode, setMode: setAuthMode } = useAuthModalStore();
  const { user } = useAuthStore();
  const { isHeaderFooterVisible } = useHeaderFooter();
  const navigate = useNavigate();

  // コンポーネントが初期化されるときに、モーダルが閉じた状態を確保する
  useEffect(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleLoginAction = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    } else {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleRegisterAction = () => {
    if (user) {
      navigate(`/profile/${user.id}`);
    } else {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {isHeaderFooterVisible && (
        <header
          className="fixed top-0 left-0 right-0 bg-white shadow z-40 w-full"
          style={{ position: 'fixed', top: 0, left: 0, right: 0 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-12">
              <Link to="/" className="flex items-center">
                <picture>
                  <source srcSet="/images/webp/logo.webp" type="image/webp" />
                  <img
                    src="/images/logo.png"
                    alt="ロゴ"
                    loading="lazy"
                    width="120"
                    height="37"
                    className="inline-block w-[120px]"
                  />
                </picture>
              </Link>
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link
                      to={`/profile/${user.id}`}
                      className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium"
                    >
                      マイページ
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLoginAction}
                      className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium"
                    >
                      ログイン
                    </button>
                    <button
                      onClick={handleRegisterAction}
                      className="px-4 py-2 rounded-full bg-gray-800 text-white hover:bg-gray500 font-medium transition-colors"
                    >
                      新規登録
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <main
        className={`flex-grow mx-2 ${isHeaderFooterVisible ? 'mt-16 mb-4' : 'my-2'} min-h-[calc(100vh-100px)]`}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 calc(100vh - 100px)' }}
      >
        {children}
      </main>

      {isHeaderFooterVisible && (
        <footer className="bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center space-x-8 mb-4">
              <Link to="/terms" className="text-gray-600 hover:text-gray-800 text-sm">
                利用規約
              </Link>
              <Link to="/privacy" className="text-gray-600 hover:text-gray-800 text-sm">
                プライバシーポリシー
              </Link>
              <a
                href="https://forms.gle/jdkm3kf7DJ49sEuDA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                お問い合わせ
              </a>
            </div>
            <div className="text-center text-gray-500">
              <p>© {new Date().getFullYear()} CAT LINK All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
