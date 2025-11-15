import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import OptimizedImage from '../OptimizedImage';
import { formatDiaryTime } from '../../utils/date';

import type { CatDiary } from '../../types/catDiary';

interface Props {
  diary: CatDiary;
  isOwner?: boolean;
  onEdit?: (diary: CatDiary) => void;
  onDelete?: (diary: CatDiary) => void;
}

export default function DiaryItem({ diary, isOwner, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const urls = diary.image_urls || [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="text-sm text-gray-500">{formatDiaryTime(diary.created_at)}</div>
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="メニュー"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.(diary);
                  }}
                >
                  編集
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(diary);
                  }}
                >
                  削除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
        {diary.content}
      </p>

      {urls.length > 0 && (
        <div className="mt-3">
          {/* Layout: first bigger, then two halves side-by-side */}
          {urls.length === 1 && (
            <OptimizedImage
              src={urls[0]}
              alt="diary"
              width={800}
              height={800}
              className="w-full h-auto rounded-lg object-cover"
              options={{ resize: 'contain', quality: 85 }}
            />
          )}
          {urls.length === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {urls.map((u, i) => (
                <OptimizedImage
                  key={i}
                  src={u}
                  alt="diary"
                  width={400}
                  height={400}
                  className="w-full h-40 object-cover rounded-lg"
                  options={{ resize: 'fill', quality: 80 }}
                />
              ))}
            </div>
          )}
          {urls.length >= 3 && (
            <div className="grid grid-cols-2 gap-2">
              <OptimizedImage
                src={urls[0]}
                alt="diary"
                width={600}
                height={600}
                className="w-full h-56 object-cover rounded-lg col-span-2"
                options={{ resize: 'fill', quality: 85 }}
              />
              <OptimizedImage
                src={urls[1]}
                alt="diary"
                width={400}
                height={400}
                className="w-full h-40 object-cover rounded-lg"
                options={{ resize: 'fill', quality: 80 }}
              />
              <OptimizedImage
                src={urls[2]}
                alt="diary"
                width={400}
                height={400}
                className="w-full h-40 object-cover rounded-lg"
                options={{ resize: 'fill', quality: 80 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

