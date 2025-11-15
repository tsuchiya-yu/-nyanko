import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';

import DiaryComposer from '../components/diary/DiaryComposer';
import DiaryList from '../components/diary/DiaryList';
import { handleApiError } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { defaultTextColor } from '../utils/constants';
import { paths } from '../utils/paths';
import { absoluteUrl } from '../utils/url';

interface CatLite {
  id: string;
  name: string;
  owner_id: string;
  prof_path_id: string;
  is_public: boolean;
  text_color?: string | null;
}

export default function CatDiary() {
  const { path } = useParams<{ path: string }>();
  const { user } = useAuthStore();

  const { data: cat, isLoading, isError, error } = useQuery({
    queryKey: ['cat-lite', path],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('cats')
          .select('id, name, owner_id, prof_path_id, is_public, text_color')
          .eq('prof_path_id', path!)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('猫が見つかりません');
        if (data.is_public === false) {
          throw new Error('この猫ちゃんは非公開です🐈');
        }
        return data as CatLite;
      } catch (e) {
        await handleApiError(e as any);
        throw e;
      }
    },
    enabled: !!path,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
      </div>
    );
  }

  if (isError || !cat) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : '猫の情報を取得できませんでした'}
          </p>
          <Link to={paths.home()} className="inline-flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === cat.owner_id;
  const textColor = cat.text_color || defaultTextColor;

  return (
    <div className="max-w-[560px] mx-auto py-6 px-4" style={{ color: textColor }}>
      {!path && <Navigate to={paths.home()} replace />}
      <Helmet>
        <title>{`${cat.name}のひとこと | CAT LINK`}</title>
        <meta
          name="description"
          content={`${cat.name}の最新ひとこと。日々の様子を写真とともにお届けします。`}
        />
        <link rel="canonical" href={absoluteUrl(paths.catDiaries(cat.prof_path_id))} />
      </Helmet>

      <div className="mb-4">
        <Link to={paths.catProfile(cat.prof_path_id)} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-2" />
          {cat.name}のプロフィールへ戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-4">{cat.name}のひとこと</h1>

      {isOwner && (
        <div className="mb-4">
          <DiaryComposer catId={cat.id} />
        </div>
      )}

      <DiaryList catId={cat.id} isOwner={isOwner} />
    </div>
  );
}

