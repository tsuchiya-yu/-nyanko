import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import CatCard from './CatCard';
import type { Cat } from '../types';

interface CatCardWithViewsProps {
  cat: Cat;
  isOwnProfile?: boolean;
}

// 猫のプロフィールページのビュー数を取得するためのカスタムフック
function usePageViewCount(catId: string | undefined) {
  return useQuery({
    queryKey: ['pageViews', catId],
    queryFn: async () => {
      if (!catId) return null;

      console.log('[DEBUG] ページビュー取得開始', { catId });

      try {
        console.log('[DEBUG] APIリクエスト準備', { 
          url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga-pageviews`,
          hasAuthToken: !!import.meta.env.VITE_SUPABASE_ANON_KEY
        });

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga-pageviews`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ catId }),
            // CORSエラー対策
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
          }
        );

        console.log('[DEBUG] APIレスポンス受信', { 
          status: response.status, 
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries([...response.headers])
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData = {};
          
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.error('[DEBUG] レスポンスJSONパースエラー', e);
          }
          
          console.error('[DEBUG] ページビュー取得エラー', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            errorText
          });
          return 0; // エラー時は0を返す
        }

        const responseText = await response.text();
        console.log('[DEBUG] レスポンステキスト', responseText);
        
        let data: { pageViews?: number } = {};
        try {
          data = JSON.parse(responseText);
          console.log('[DEBUG] レスポンスデータ', data);
        } catch (e) {
          console.error('[DEBUG] JSONパースエラー', e);
          return 0;
        }
        
        return data.pageViews || 0;
      } catch (error: unknown) {
        console.error('[DEBUG] ページビュー取得失敗', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return 0; // エラー時は0を返す
      }
    },
    enabled: !!catId,
    staleTime: 1000 * 60 * 60, // 1時間キャッシュ
    retry: 1,
    // エラー時にも以前のデータを表示
    placeholderData: (prev) => prev,
  });
}

export default function CatCardWithViews({ cat, isOwnProfile }: CatCardWithViewsProps) {
  // 猫のページビュー数を取得
  const { data: pageViewCount } = usePageViewCount(cat.id);

  return (
    <div className="group relative">
      <CatCard
        cat={cat}
        actions={
          isOwnProfile && (
            <>
              <Link
                to={`/cats/${cat.id}/photos`}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-all text-sm font-medium text-center"
              >
                写真を追加
              </Link>
              <Link
                to={`/cats/${cat.id}/edit`}
                className="flex-1 px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-center"
              >
                編集する
              </Link>
            </>
          )
        }
      />
      {/* ページビュー数の表示 */}
      <div className="mt-1 flex items-center justify-end text-gray-500 text-xs">
        <Eye className="h-3 w-3 mr-1" />
        <span>月間表示: {pageViewCount || 0}回</span>
      </div>
    </div>
  );
} 