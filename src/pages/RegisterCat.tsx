import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Helmet } from 'react-helmet';

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
  homepage_url?: string;
  gender?: string;
}

export default function RegisterCat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<CatFormData>();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: CatFormData) => {
      if (imageFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(`cats/${imageFile.name}`, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(uploadData.path);

        data.image_url = publicUrl;
      }

      const { error } = await supabase.from('cats').insert({
        name: data.name,
        birthdate: data.birthdate,
        is_birthdate_estimated: data.is_birthdate_estimated,
        breed: data.breed,
        catchphrase: data.catchphrase,
        description: data.description,
        image_url: data.image_url,
        instagram_url: data.instagram_url || null,
        x_url: data.x_url || null,
        homepage_url: data.homepage_url || null,
        owner_id: user?.id,
        gender: data.gender,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      navigate(`/profile/${user?.id}`);
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>愛猫を登録する | CAT LINK</title>
        <meta name="description" content="CAT LINKで愛猫のプロフィールを作成しましょう。名前、年齢、品種、写真などの情報を登録して、素敵なプロフィールページを作成できます。" />
        <meta name="keywords" content="猫登録, 猫プロフィール作成, ペット登録, 猫情報, CAT LINK" />
        <meta property="og:title" content="愛猫を登録する | CAT LINK" />
        <meta property="og:url" content="https://cat-link.com/register-cat" />
        <meta property="og:description" content="CAT LINKで愛猫のプロフィールを作成しましょう。名前、年齢、品種、写真などの情報を登録して、素敵なプロフィールページを作成できます。" />
        <link rel="canonical" href="https://cat-link.com/register-cat" />
      </Helmet>
      
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
              性別
            </label>
            <select
              {...register('gender')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">不明</option>
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
              placeholder="ミックス"
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
              placeholder="いつも元気いっぱい！甘えん坊な女の子♪"
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
              placeholder={`丸顔で大きな耳が特徴的な愛らしい女の子です。
普段はとても甘えん坊で、人が近くにいると安心する性格ですが、意外と独立心も強く、一人で窓の外を眺めたりするのが好きです。
家ではお気に入りのクッションでのんびり過ごす時間が多く、家族にはとても優しい性格で癒しを与えてくれる存在です。

子供たちとも仲良く遊ぶ穏やかな一面もあり、まさに我が家の人気者！！`}
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
              その他ホームページのURL
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
            {mutation.isPending ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}