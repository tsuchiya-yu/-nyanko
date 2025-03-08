import { X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSessionRefresh } from '../../hooks/useSessionRefresh';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  useSessionRefresh();
  const navigate = useNavigate();
  const { setUser, fetchProfile } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (userId: string) => {
    await fetchProfile(userId);
    onClose();
    if (onSuccess) {
      onSuccess();
    }
    console.log(mode === 'login' ? 'ログインしました' : 'アカウントを作成しました');
    navigate(`/profile/${userId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            name,
          });
          setUser(authData.user);
          await handleSuccess(authData.user.id);
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        if (authData.user) {
          setUser(authData.user);
          await handleSuccess(authData.user.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-[-10px] top-[-30px] text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              className={`flex-1 py-2 text-center rounded-full font-medium transition-colors
                ${
                  mode === 'login'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              onClick={() => setMode('login')}
            >
              ログイン
            </button>
            <button
              className={`flex-1 py-2 text-center rounded-full font-medium transition-colors
                ${
                  mode === 'register'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              onClick={() => setMode('register')}
            >
              新規登録
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          <form
            id={mode === 'login' ? 'login-form' : 'register-form'}
            onSubmit={handleSubmit}
            className="space-y-4"
            autoComplete="on"
          >
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  飼い主さんのニックネーム
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="猫田 太郎"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="example@email.com"
                autoComplete="email"
                name="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                name="password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-full
                text-white bg-gray-800 hover:bg-gray-200 font-medium
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
