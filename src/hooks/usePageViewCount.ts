import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

// 猫のプロフィールページのビュー数を取得するためのカスタムフック
export function usePageViewCount(catId: string) {
  return useQuery({
    queryKey: ['pageViews', catId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ga-pageviews', {
        body: { catId },
      });

      if (error) {
        console.error('Failed to fetch page views:', error);
        throw error;
      }

      return data;
    },
    enabled: !!catId,
    staleTime: 1000 * 60 * 60, // 1時間
    retry: false,
  });
}
