import { supabase } from './supabase';

// エラーレスポンスの型定義
interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
  data?: null;
  error?: {
    message: string;
  };
}

// APIエラーハンドリング関数
export async function handleApiError(error: ErrorResponse): Promise<never> {
  if ('message' in error && error.message === 'JWT expired') {
    alert('セッションの有効期限が切れました。再度ログインしてください。');
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  console.error('API Error:', error);
  throw new Error(typeof error.message === 'string' ? error.message : 'APIエラーが発生しました');
}
