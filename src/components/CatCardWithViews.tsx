import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePageViewCount } from '../hooks/usePageViewCount';
import CatCard from './CatCard/index';

import type { Cat } from '../types';

interface CatCardWithViewsProps {
  cat: Cat;
  isOwnProfile?: boolean;
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
        footer={
          cat.is_public === false && (
            <div className="flex justify-end">
              <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded">非公開</span>
            </div>
          )
        }
      />
      {/* ページビュー数の表示 */}
      <div className="mt-1 flex items-center justify-end text-gray-500 text-xs">
        <Eye className="h-3 w-3 mr-1" />
        <span>月間表示: {pageViewCount ?? 0}回</span>
      </div>
    </div>
  );
}
