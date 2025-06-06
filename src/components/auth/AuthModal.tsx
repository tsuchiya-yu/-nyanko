import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSessionRefresh } from '../../hooks/useSessionRefresh';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import Modal from '../common/Modal';
import { useAuthModalStore } from '../Layout';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  useSessionRefresh();
  const navigate = useNavigate();
  const { setUser, fetchProfile } = useAuthStore();
  const { mode } = useAuthModalStore();
  const [localMode, setLocalMode] = useState<'login' | 'register'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開かれるたびにグローバルなモード設定を適用
  useEffect(() => {
    if (isOpen) {
      setLocalMode(mode);
    }
  }, [isOpen, mode]);

  const handleSuccess = async (userId: string) => {
    await fetchProfile(userId);
    onClose();
    if (onSuccess) {
      onSuccess();
    }
    console.log(localMode === 'login' ? 'ログインしました' : 'アカウントを作成しました');
    navigate(`/profile/${userId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (localMode === 'register') {
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex space-x-2 my-8">
        <button
          className={`flex-1 py-2 text-center rounded-lg text-sm font-medium transition-colors
            ${
              localMode === 'login'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          onClick={() => setLocalMode('login')}
        >
          ログイン
        </button>
        <button
          className={`flex-1 py-2 text-center rounded-lg text-sm font-medium transition-colors
            ${
              localMode === 'register'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          onClick={() => setLocalMode('register')}
        >
          新規登録
        </button>
      </div>

      {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form
        id={localMode === 'login' ? 'login-form' : 'register-form'}
        onSubmit={handleSubmit}
        className="space-y-5"
        autoComplete="on"
      >
        {localMode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              飼い主さんのニックネーム
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
              placeholder="猫田 太郎"
              autoComplete="name"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
            placeholder="example@email.com"
            autoComplete="email"
            name="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">パスワード</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
            placeholder="••••••••"
            autoComplete={localMode === 'login' ? 'current-password' : 'new-password'}
            name="password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 mt-4 rounded-xl
            text-white bg-gray-800 hover:bg-gray-900 font-medium
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700
            transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : localMode === 'login' ? 'ログイン' : 'アカウントを作成'}
        </button>
      </form>
    </Modal>
  );
}
