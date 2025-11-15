import { useState } from 'react';

import { useCatDiaries, useDiaryMutations } from '../../hooks/useCatDiaries';
import DiaryItem from './DiaryItem';
import DiaryEditorModal from './DiaryEditorModal';
import type { CatDiary } from '../../types/catDiary';

interface Props {
  catId: string;
  isOwner?: boolean;
  showLoadMore?: boolean; // default true
}

export default function DiaryList({ catId, isOwner, showLoadMore = true }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useCatDiaries(catId);
  const { deleteDiary } = useDiaryMutations(catId);
  const [editingDiary, setEditingDiary] = useState<CatDiary | null>(null);

  const diaries = data?.pages.flatMap(p => p) ?? [];

  return (
    <div className="space-y-3">
      {status === 'pending' && (
        <div className="text-center py-6 text-gray-500">読み込み中...</div>
      )}
      {status === 'success' && diaries.length === 0 && (
        <div className="text-center py-6 text-gray-500">まだひとことはありません</div>
      )}
      {diaries.map(d => (
        <DiaryItem
          key={d.id}
          diary={d}
          isOwner={isOwner}
          onEdit={() => setEditingDiary(d)}
          onDelete={() => {
            if (confirm('このひとことを削除しますか？')) deleteDiary.mutate(d);
          }}
        />
      ))}

      {showLoadMore && hasNextPage && (
        <div className="pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            もっと見る
          </button>
        </div>
      )}

      <DiaryEditorModal
        diary={editingDiary}
        isOpen={Boolean(editingDiary)}
        onClose={() => setEditingDiary(null)}
      />
    </div>
  );
}
