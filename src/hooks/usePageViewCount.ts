import { useQuery } from '@tanstack/react-query';

// 猫のプロフィールページのビュー数を取得するためのカスタムフック
export function usePageViewCount(catId: string) {
  return useQuery({
    queryKey: ['pageViews', catId],
    queryFn: async () => {
      const response = await window.fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga-pageviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ catId }),
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch page views:', response.status, response.statusText);
        throw new Error(`Failed to fetch page views: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.pageViews;
    },
    enabled: !!catId,
    staleTime: 1000 * 60 * 60, // 1時間
    retry: false,
  });
}
