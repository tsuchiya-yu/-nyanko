import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSessionRefresh() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('セッションが更新されました');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
} 