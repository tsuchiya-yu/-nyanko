import { User } from '@supabase/supabase-js';
import { type ReactNode, useEffect } from 'react';
import { Link, useNavigate, type NavigateFunction } from 'react-router-dom';
import { create } from 'zustand';

import { useHeaderFooter } from '../context/HeaderContext';
import { useAuthStore } from '../store/authStore';
import { paths } from '../utils/paths';
import AuthModal from './auth/AuthModal';

// グローバルなモーダル状態管理
interface AuthModalStore {
  isOpen: boolean;
  mode: 'login' | 'register';
  setIsOpen: (isOpen: boolean) => void;
  setMode: (mode: 'login' | 'register') => void;
}

export const useAuthModalStore = create<AuthModalStore>(set => ({
  isOpen: false,
  mode: 'login',
  setIsOpen: isOpen => set({ isOpen }),
  setMode: mode => set({ mode }),
}));

interface LayoutProps {
  children: ReactNode;
}

export function handleAuthAction(
  user: User | null,
  navigate: NavigateFunction,
  mode: 'login' | 'register' = 'login'
) {
  if (user) {
    // ユーザーがログイン済みの場合はUserProfileページに遷移
    navigate(paths.userProfile(user.id));
  } else {
    // 未ログインの場合は認証モーダルを表示
    const authStore = useAuthModalStore.getState();
    authStore.setMode(mode);
    authStore.setIsOpen(true);
  }
}

export default function Layout({ children }: LayoutProps) {
  const {
    isOpen: isAuthModalOpen,
    setIsOpen: setIsAuthModalOpen,
    setMode: setAuthMode,
  } = useAuthModalStore();
  const { user } = useAuthStore();
  const { isHeaderFooterVisible } = useHeaderFooter();
  const navigate = useNavigate();

  // コンポーネントが初期化されるときに、モーダルが閉じた状態を確保する
  useEffect(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleLoginAction = () => {
    if (user) {
      navigate(paths.userProfile(user.id));
    } else {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleRegisterAction = () => {
    if (user) {
      navigate(paths.userProfile(user.id));
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
              <Link to={paths.home()} className="flex items-center">
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
              <div className="flex items-center space-x-2 text-sm">
                <Link
                  to={paths.columns()}
                  className="px-1 py-4 rounded-full text-gray-700 hover:text-gray-900 font-medium"
                >
                  コラム
                </Link>
                {user ? (
                  <>
                    <Link
                      to={paths.userProfile(user.id)}
                      className="px-1 py-4 rounded-full text-gray-700 hover:text-gray-900 font-medium"
                    >
                      マイページ
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLoginAction}
                      className="px-1 py-4 rounded-full text-gray-700 hover:text-gray-900 font-medium"
                    >
                      ログイン
                    </button>
                    <button
                      onClick={handleRegisterAction}
                      className="px-3 py-2 rounded-full bg-gray-800 text-white hover:bg-gray500 font-medium transition-colors"
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
        <footer className="bg-white mt-auto border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-6">
              {/* サイトナビゲーション */}
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-2 sm:mb-4">サイト案内</h3>
                <ul className="space-y-1 sm:space-y-2">
                  <li>
                    <Link
                      to={paths.home()}
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                      </svg>
                      ホーム
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={paths.columns()}
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      コラム
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={paths.news()}
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                          clipRule="evenodd"
                        ></path>
                        <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"></path>
                      </svg>
                      お知らせ
                    </Link>
                  </li>
                </ul>
              </div>

              {/* 規約 */}
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-2 sm:mb-4">規約</h3>
                <ul className="space-y-1 sm:space-y-2">
                  <li>
                    <Link
                      to={paths.terms()}
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      利用規約
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={paths.privacy()}
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      プライバシーポリシー
                    </Link>
                  </li>
                </ul>
              </div>

              {/* お問い合わせ・ソーシャル */}
              <div className="col-span-2 md:col-span-1 mt-4 md:mt-0">
                <h3 className="text-base font-semibold text-gray-700 mb-2 sm:mb-4">
                  お問い合わせ・SNS
                </h3>
                <ul className="space-y-1 sm:space-y-2">
                  <li>
                    <a
                      href="https://forms.gle/jdkm3kf7DJ49sEuDA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      お問い合わせ
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://x.com/CATLINK_PR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-gray-600 hover:text-primary-600 flex items-center"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                      </svg>
                      公式X
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="text-center text-gray-500 text-base">
                <p>© {new Date().getFullYear()} CAT LINK All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
