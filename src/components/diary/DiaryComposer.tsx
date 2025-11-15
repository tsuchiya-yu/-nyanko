import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';

import { useDiaryMutations } from '../../hooks/useCatDiaries';

interface Props {
  catId: string;
}

type FormData = { content: string };

export default function DiaryComposer({ catId }: Props) {
  const { register, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: { content: '' },
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  // Keep track of object URLs to revoke safely
  const previewUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { createDiary } = useDiaryMutations(catId);

  const content = watch('content');

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
      previewUrlsRef.current = [];
    };
  }, []);

  const onFilesSelected = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const remaining = Math.max(0, 3 - files.length);
    if (remaining <= 0) return;
    const toAdd = incoming.slice(0, remaining);
    const newUrls = toAdd.map(f => URL.createObjectURL(f));
    previewUrlsRef.current.push(...newUrls);
    setPreviews(prev => [...prev, ...newUrls]);
    setFiles(prev => [...prev, ...toAdd]);
  };

  const removeFile = (idx: number) => {
    const nextFiles = files.slice();
    nextFiles.splice(idx, 1);
    const url = previewUrlsRef.current[idx];
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    previewUrlsRef.current.splice(idx, 1);
    setFiles(nextFiles);
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = handleSubmit(async data => {
    await createDiary.mutateAsync({ content: data.content.trim(), files });
    reset({ content: '' });
    // Clear files and revoke previews after successful post
    setFiles([]);
    setPreviews([]);
    previewUrlsRef.current.forEach(u => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    previewUrlsRef.current = [];
  });

  const isDisabled = createDiary.isPending || content.trim().length === 0 || content.length > 140;
  const totalImages = files.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <form onSubmit={onSubmit}>
        <textarea
          {...register('content')}
          maxLength={140}
          rows={3}
          placeholder="いま何してる？"
          className="w-full resize-none border-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
        />
        <div className="flex items-center justify-between mt-3">
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
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= 3}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              画像を追加 ({totalImages}/3)
            </button>
            <span className={`text-xs ${content.length > 140 ? 'text-red-500' : 'text-gray-500'}`}>
              {content.length}/140
            </span>
          </div>
          <button
            disabled={isDisabled}
            className="inline-flex items-center gap-1 px-4 py-1.5 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> 投稿
          </button>
        </div>

        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="preview" className="w-full h-28 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
