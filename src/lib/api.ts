import { supabase } from './supabase';

export async function handleApiError(error: any) {
  if (error?.message === 'JWT expired') {
    alert('セッションの有効期限が切れました。再度ログインしてください。');
    await supabase.auth.signOut();
    window.location.href = '/login';
  }
} 