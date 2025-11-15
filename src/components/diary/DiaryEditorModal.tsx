import { useEffect, useMemo, useRef, useState } from 'react';

import Modal from '../common/Modal';
import OptimizedImage from '../OptimizedImage';
import { useDiaryMutations } from '../../hooks/useCatDiaries';

import type { CatDiary } from '../../types/catDiary';

interface Props {
  diary: CatDiary | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DiaryEditorModal({ diary, isOpen, onClose }: Props) {
  const [content, setContent] = useState('');
  const [keepUrls, setKeepUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { updateDiary } = useDiaryMutations(diary?.cat_id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (diary) {
      setContent(diary.content);
      setKeepUrls(diary.image_urls || []);
      setNewFiles([]);
      setError(null);
    }
  }, [diary]);

  useEffect(() => {
    const urls = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [newFiles]);

  const totalImages = keepUrls.length + newFiles.length;
  const canAddMore = useMemo(() => totalImages < 3, [totalImages]);

  const onFilesSelected = (list: FileList | null) => {
    if (!list) return;
    const remaining = Math.max(0, 3 - keepUrls.length - newFiles.length);
    if (remaining <= 0) return;
    const next = [...newFiles, ...Array.from(list).slice(0, remaining)];
    setNewFiles(next);
  };

  const removeKeepUrl = (url: string) => {
    setKeepUrls(prev => prev.filter(u => u !== url));
  };

  const removeNewFile = (idx: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!diary) return;
    try {
      setError(null);
      if (content.trim().length === 0) {
        setError('本文は必須です');
        return;
      }
      if (content.length > 140) {
        setError('本文は140文字以内で入力してください');
        return;
      }
      if (keepUrls.length + newFiles.length > 3) {
        setError('画像は最大3枚までです');
        return;
      }
      await updateDiary.mutateAsync({ diary, newContent: content.trim(), newFiles, keepUrls });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    }
  };

  if (!isOpen || !diary) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">ひとことを編集</h3>
        {error && <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
        <div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={140}
            rows={4}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <div className={`text-xs text-right mt-1 ${content.length > 140 ? 'text-red-500' : 'text-gray-500'}`}>
            {content.length}/140
          </div>
        </div>

        {(keepUrls.length > 0 || previews.length > 0) && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {keepUrls.map(u => (
                <div key={u} className="relative">
                  <OptimizedImage
                    src={u}
                    alt="image"
                    width={400}
                    height={400}
                    className="w-full h-32 object-cover rounded"
                    options={{ resize: 'fill', quality: 80 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeKeepUrl(u)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
                  >
                    削除
                  </button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="preview" className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
                  >
                    取消
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => onFilesSelected(e.target.files)}
            />
            <button
              type="button"
              disabled={!canAddMore}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              画像を追加 ({totalImages}/3)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateDiary.isPending}
              className="px-4 py-1.5 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

