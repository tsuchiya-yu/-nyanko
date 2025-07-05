import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import Modal from '../common/Modal';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
  } | null;
}

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserSettingsModal({ isOpen, onClose, profile }: UserSettingsModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'profile' | 'email' | 'password'>('profile');
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: profile?.name || '',
      email: user?.email || '',
    },
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened');
      console.log('Viewport dimensions:', {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollY: window.scrollY,
      });

      // 初期表示時のログ
      const logModalPosition = () => {
        if (modalRef.current) {
          const rect = modalRef.current.getBoundingClientRect();
          console.log('Modal dimensions:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            offsetTop: modalRef.current.offsetTop,
          });
        }
      };

      // 初回ログ
      logModalPosition();

      // 200msごとに位置をログ
      const intervalId = setInterval(logModalPosition, 200);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isOpen]);

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string }) => {
      if (!user) throw new Error('ユーザーが見つかりません');

      const { error } = await supabase
        .from('profiles')
        .update({ name: data.name })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      alert('プロフィールを更新しました');
      onClose();
    },
  });

  const updateEmail = useMutation({
    mutationFn: async (data: { email: string }) => {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      alert('確認メールを送信しました。メールを確認して新しいメールアドレスを認証してください。');
      onClose();
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      alert('パスワードを更新しました');
      onClose();
    },
  });

  const handleFormSubmit = async (data: ProfileFormData) => {
    try {
      switch (mode) {
        case 'profile':
          await updateProfile.mutateAsync({ name: data.name });
          break;
        case 'email':
          await updateEmail.mutateAsync({ email: data.email });
          break;
        case 'password':
          if (data.newPassword !== data.confirmPassword) {
            alert('新しいパスワードと確認用パスワードが一致しません');
            return;
          }
          await updatePassword.mutateAsync({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          });
          break;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '更新に失敗しました');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="アカウント設定">
      <div ref={modalRef}>
        <div className="flex space-x-4 mb-6">
          <button
            className={`flex-1 py-2 text-center rounded-full font-medium transition-colors
              ${
                mode === 'profile'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            onClick={() => setMode('profile')}
          >
            プロフィール
          </button>
          <button
            className={`flex-1 py-2 text-center rounded-full font-medium transition-colors
              ${
                mode === 'email'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            onClick={() => setMode('email')}
          >
            メール
          </button>
          <button
            className={`flex-1 py-2 text-center rounded-full font-medium transition-colors
              ${
                mode === 'password'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            onClick={() => setMode('password')}
          >
            パスワード
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {mode === 'profile' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                飼い主さんのニックネーム
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: '飼い主さんのニックネームは必須です',
                  minLength: {
                    value: 2,
                    message: '飼い主さんのニックネームは2文字以上で入力してください',
                  },
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
          )}

          {mode === 'email' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                新しいメールアドレス
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'メールアドレスは必須です',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '有効なメールアドレスを入力してください',
                  },
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              {errors.email && (
                <p data-testid="email-error" className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          )}

          {mode === 'password' && (
            <>
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  現在のパスワード
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  {...register('currentPassword', {
                    required: '現在のパスワードは必須です',
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  新しいパスワード
                </label>
                <input
                  id="newPassword"
                  type="password"
                  {...register('newPassword', {
                    required: '新しいパスワードは必須です',
                    minLength: {
                      value: 8,
                      message: 'パスワードは8文字以上で入力してください',
                    },
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  新しいパスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', {
                    validate: value => value === watch('newPassword') || 'パスワードが一致しません',
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-full
              bg-gray-800 hover:bg-gray-700 text-white font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            更新する
          </button>
        </form>
      </div>
    </Modal>
  );
}
