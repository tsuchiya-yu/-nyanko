import { useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useSessionRefresh() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);
}
