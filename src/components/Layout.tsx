import { useState, type ReactNode, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';
import { useHeaderFooter } from '../context/HeaderContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuthStore();
  const { isHeaderFooterVisible } = useHeaderFooter();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      // ユーザーがログイン済みの場合はUserProfileページに遷移
      navigate(`/profile/${user.id}`);
    } else {
      // 未ログインの場合は認証モーダルを表示
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
                <img
                  src="/images/logo.png"
                  alt="ロゴ"
                  loading="lazy"
                  className="inline-block w-[120px]"
                />
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
                      onClick={handleAuthAction}
                      className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium"
                    >
                      ログイン
                    </button>
                    <button
                      onClick={handleAuthAction}
                      className="px-4 py-2 rounded-full bg-gray-500 text-white hover:bg-gray-600 font-medium transition-colors"
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

      <main className={`flex-grow mx-2 ${isHeaderFooterVisible ? 'mt-16 mb-4' : 'my-2'}`}>
        {children}
      </main>

      {isHeaderFooterVisible && (
        <footer className="bg-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center space-x-8 mb-4">
              <Link to="/terms" className="text-gray-600 hover:text-gray-800">
                利用規約
              </Link>
              <Link to="/privacy" className="text-gray-600 hover:text-gray-800">
                プライバシーポリシー
              </Link>
            </div>
            <div className="text-center text-gray-500">
              <p>© 2024 CAT LINK All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
