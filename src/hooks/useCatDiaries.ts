import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { handleApiError } from '../lib/api';
import { supabase } from '../lib/supabase';
import { extractStoragePathFromPublicUrl, sanitizeFileName } from '../utils/file';

import type { CatDiary, LatestDiaryItem } from '../types/catDiary';

const BUCKET = 'pet-photos';

type PageParam = { lastCreatedAt?: string };

export function useCatDiaries(catId: string | undefined, pageSize = 5) {
  return useInfiniteQuery({
    queryKey: ['cat-diaries', catId, pageSize],
    enabled: !!catId,
    initialPageParam: {} as PageParam,
    getNextPageParam: lastPage => {
      const last = lastPage[lastPage.length - 1];
      if (!last) return undefined;
      return { lastCreatedAt: last.created_at } as PageParam;
    },
    queryFn: async ({ pageParam }) => {
      try {
        if (!catId) return [] as CatDiary[];
        let query = supabase
          .from('cat_diaries')
          .select('id, cat_id, content, image_urls, created_at, updated_at')
          .eq('cat_id', catId)
          .order('created_at', { ascending: false })
          .limit(pageSize);

        if (pageParam?.lastCreatedAt) {
          query = query.lt('created_at', pageParam.lastCreatedAt);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as CatDiary[];
      } catch (error) {
        await handleApiError(error as any);
        throw error;
      }
    },
  });
}

export function useLatestDiaries(limit = 3) {
  return useQuery({
    queryKey: ['latest-diaries', limit],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('cat_diaries')
          .select(
            `id, cat_id, content, image_urls, created_at, updated_at,
             cats:cat_id ( id, name, prof_path_id, image_url )`
          )
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return (data || []) as LatestDiaryItem[];
      } catch (error) {
        await handleApiError(error as any);
        throw error;
      }
    },
  });
}

export function useDiaryMutations(catId?: string) {
  const qc = useQueryClient();

  const createDiary = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      if (!catId) throw new Error('catId is required');
      if (!content || content.length === 0) throw new Error('本文は必須です');
      if (content.length > 140) throw new Error('本文は140文字以内で入力してください');
      if (files && files.length > 3) throw new Error('画像は最大3枚までです');

      const imageUrls: string[] = [];

      // Upload images sequentially to keep it simple
      if (files && files.length > 0) {
        for (const f of files) {
          if (!f.type.startsWith('image/')) throw new Error('画像ファイルのみアップロードできます');
          const filePath = `diaries/${catId}/${uuidv4()}_${sanitizeFileName(f.name)}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, f);
          if (upErr) throw upErr;
          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
          imageUrls.push(publicUrl);
        }
      }

      const { data, error } = await supabase
        .from('cat_diaries')
        .insert({ cat_id: catId, content, image_urls: imageUrls.length ? imageUrls : null })
        .select('id, cat_id, content, image_urls, created_at, updated_at')
        .single();
      if (error) throw error;
      return data as CatDiary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cat-diaries', catId] });
      qc.invalidateQueries({ queryKey: ['latest-diaries'] });
    },
  });

  const updateDiary = useMutation({
    // Pass full newImageUrls (including kept + newly added)
    mutationFn: async ({
      diary,
      newContent,
      newFiles,
      keepUrls,
    }: {
      diary: CatDiary;
      newContent: string;
      newFiles?: File[];
      keepUrls: string[]; // URLs user kept
    }) => {
      if (newContent.length === 0) throw new Error('本文は必須です');
      if (newContent.length > 140) throw new Error('本文は140文字以内で入力してください');
      const imageUrls = [...keepUrls];

      if (newFiles && newFiles.length > 0) {
        for (const f of newFiles) {
          if (!f.type.startsWith('image/')) throw new Error('画像ファイルのみアップロードできます');
          const fp = `diaries/${diary.cat_id}/${uuidv4()}_${sanitizeFileName(f.name)}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(fp, f);
          if (upErr) throw upErr;
          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET).getPublicUrl(fp);
          imageUrls.push(publicUrl);
        }
      }

      const { data, error } = await supabase
        .from('cat_diaries')
        .update({ content: newContent, image_urls: imageUrls.length ? imageUrls : null })
        .eq('id', diary.id)
        .select('id, cat_id, content, image_urls, created_at, updated_at')
        .single();
      if (error) throw error;

      // Delete removed images AFTER DB success
      const removed = (diary.image_urls || []).filter(u => !keepUrls.includes(u));
      if (removed.length) {
        const toRemove = removed
          .map(u => extractStoragePathFromPublicUrl(u, BUCKET))
          .filter((p): p is string => Boolean(p));
        if (toRemove.length) {
          await supabase.storage.from(BUCKET).remove(toRemove);
        }
      }

      return data as CatDiary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cat-diaries', catId] });
      qc.invalidateQueries({ queryKey: ['latest-diaries'] });
    },
  });

  const deleteDiary = useMutation({
    mutationFn: async (diary: CatDiary) => {
      const { error } = await supabase.from('cat_diaries').delete().eq('id', diary.id);
      if (error) throw error;
      // Remove files AFTER DB delete
      const toRemove = (diary.image_urls || [])
        .map(u => extractStoragePathFromPublicUrl(u, BUCKET))
        .filter((p): p is string => Boolean(p));
      if (toRemove.length) {
        await supabase.storage.from(BUCKET).remove(toRemove);
      }
      return diary.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cat-diaries', catId] });
      qc.invalidateQueries({ queryKey: ['latest-diaries'] });
    },
  });

  return { createDiary, updateDiary, deleteDiary } as const;
}

