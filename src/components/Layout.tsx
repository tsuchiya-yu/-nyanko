import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AuthModal from './auth/AuthModal';
import { useHeaderFooter } from '../context/HeaderContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, signOut } = useAuthStore();
  const { isHeaderFooterVisible } = useHeaderFooter();

  const handleSignOut = async () => {
    await signOut();
    alert('ログアウトしました');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-purple-50">
      {isHeaderFooterVisible && (
        <header className="fixed top-0 left-0 right-0 bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <Link to="/" className="flex items-center">
                <PawPrint className="h-8 w-8 text-pink-500" />
                <span className="ml-2 text-xl font-semibold text-gray-800">にゃんこみゅ</span>
              </Link>
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link
                      to={`/profile/${user.id}`}
                      className="px-4 py-2 rounded-full text-pink-600 hover:text-pink-700 font-medium"
                    >
                      マイページ
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                    >
                      ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-4 py-2 rounded-full text-pink-600 hover:text-pink-700 font-medium"
                    >
                      ログイン
                    </button>
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 font-medium transition-colors"
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

      <main className={`flex-grow mx-2 ${isHeaderFooterVisible ? 'my-20nm' : 'my-2'}` }>
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
              <p>© 2024 にゃんこみゅ All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}