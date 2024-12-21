import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';

interface CatFormData {
  name: string;
  birthdate: string;
  is_birthdate_estimated: boolean;
  breed: string;
  catchphrase: string;
  description: string;
  image_url: string;
  instagram_url?: string;
  x_url?: string;
  gender?: string;
}

function sanitizeFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = fileName.substring(0, dotIndex);
  const extension = fileName.substring(dotIndex);

  // 無効な文字を置換
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

  return sanitizedBaseName + extension;
}

export default function EditCat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: cat, isLoading } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data.owner_id !== user?.id) {
        throw new Error('編集権限がありません');
      }

      return data;
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CatFormData>();

  useEffect(() => {
    if (cat) {
      reset({
        name: cat.name,
        birthdate: cat.birthdate,
        is_birthdate_estimated: cat.is_birthdate_estimated,
        breed: cat.breed,
        catchphrase: cat.catchphrase || '',
        description: cat.description,
        image_url: cat.image_url,
        instagram_url: cat.instagram_url || '',
        x_url: cat.x_url || '',
        homepage_url: cat.homepage_url || '',
        gender: cat.gender || null,
      });
    }
  }, [cat, reset]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(cat?.image_url || null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.onerror = () => {
        setPreviewUrl(null);
        console.error('画像の読み込みに失敗しました');
      };
      reader.readAsDataURL(imageFile);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  const mutation = useMutation({
    mutationFn: async (data: CatFormData) => {
      // 画像をSupabase Storageにアップロード
      if (imageFile) {
        const uniqueId = uuidv4();
        const sanitizedFileName = sanitizeFileName(imageFile.name);
        const filePath = `cats/${uniqueId}_${sanitizedFileName}`;

        console.log('Uploading file:', filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        // アップロードした画像のURLを取得
        const { data: { publicUrl } } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

        console.log('Public URL:', publicUrl); 

        data.image_url = publicUrl;
      }

      console.log('data', data);

      const { error } = await supabase
        .from('cats')
        .update({
          ...data,
          image_url: data.image_url,
        })
        .eq('id', id);

      if (error) {
        console.error('Update error:', error); // デバッグログ
        throw error;
      }
    },
    onSuccess: () => {
      alert('猫ちゃんの情報を更新しました');
      navigate(`/cats/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-center text-gray-600">猫の情報を取得できませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">猫ちゃんの情報を編集</h1>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              {...register('name', { required: '名前は必須です' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              性別
            </label>
            <select
              {...register('gender')}
              defaultValue={cat?.gender || null}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value={null}>不明</option>
              <option value="男の子">男の子</option>
              <option value="女の子">女の子</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生年月日
            </label>
            <input
              type="date"
              {...register('birthdate', { required: '生年月日は必須です' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.birthdate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
            )}
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  {...register('is_birthdate_estimated')}
                  className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                <span className="ml-2 text-sm text-gray-600">推定の生年月日</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              品種
            </label>
            <input
              type="text"
              {...register('breed', { required: '品種は必須です' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.breed && (
              <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ひとこと
            </label>
            <input
              type="text"
              {...register('catchphrase')}
              placeholder="例：いつも元気いっぱい！甘えん坊な女の子♪"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              紹介文
            </label>
            <textarea
              {...register('description', { required: '紹介文は必須です' })}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロフィール写真
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />

            {previewUrl && (
              <img src={previewUrl} alt="プレビュー" className="mt-2 max-w-[200px] h-auto" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              InstagramのURL
            </label>
            <input
              type="url"
              {...register('instagram_url')}
              placeholder="https://www.instagram.com/..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              XのURL
            </label>
            <input
              type="url"
              {...register('x_url')}
              placeholder="https://x.com/..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ホームページのURL
            </label>
            <input
              type="url"
              {...register('x_url')}
              placeholder="https://nekoneko.com/..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-2 px-4 border border-transparent rounded-full
              bg-pink-500 hover:bg-pink-600 text-white font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? '更新中...' : '更新する'}
          </button>
        </form>
      </div>
    </div>
  );
}