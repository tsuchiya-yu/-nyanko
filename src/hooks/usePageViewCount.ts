import { useQuery } from '@tanstack/react-query';

// 猫のプロフィールページのビュー数を取得するためのカスタムフック
export function usePageViewCount(catId: string) {
  return useQuery({
    queryKey: ['pageViews', catId],
    queryFn: async () => {
      try {
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
          return 0;
        }

        const data = await response.json();
        return data.pageViews;
      } catch (error) {
        console.error('Error fetching page views:', error);
        return 0;
      }
    },
    enabled: !!catId,
    staleTime: 1000 * 60 * 60, // 1時間
    retry: 1,
    placeholderData: 0,
  });
}
