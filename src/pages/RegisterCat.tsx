import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface CatFormData {
  name: string;
  birthdate: string;
  isBirthdateEstimated: boolean;
  breed: string;
  catchphrase: string;
  description: string;
  imageUrl: string;
  instagramUrl?: string;
  xUrl?: string;
}

export default function RegisterCat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<CatFormData>();

  const mutation = useMutation({
    mutationFn: async (data: CatFormData) => {
      const { error } = await supabase.from('cats').insert({
        name: data.name,
        birthdate: data.birthdate,
        is_birthdate_estimated: data.isBirthdateEstimated,
        breed: data.breed,
        catchphrase: data.catchphrase,
        description: data.description,
        image_url: data.imageUrl,
        instagram_url: data.instagramUrl || null,
        x_url: data.xUrl || null,
        owner_id: user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      navigate(`/profile/${user?.id}`);
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新しい猫ちゃんを登録</h1>

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
                  {...register('isBirthdateEstimated')}
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
              キャッチコピー
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
              メイン写真URL
            </label>
            <input
              type="url"
              {...register('imageUrl', { required: '写真URLは必須です' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-2 px-4 border border-transparent rounded-full
              bg-pink-500 hover:bg-pink-600 text-white font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}