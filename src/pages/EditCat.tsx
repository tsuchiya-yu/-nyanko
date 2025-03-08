import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

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

function sanitizeFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = fileName.substring(0, dotIndex);
  const extension = fileName.substring(dotIndex);

  // 無効な文字を置換
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

  return sanitizedBaseName + extension;
}

export default function EditCat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CatFormData>();

  const { data: cat, isLoading } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error } = await supabase.from('cats').select('*').eq('id', id).single();

      if (error) throw error;
      if (!data) throw new Error('猫が見つかりません');

      // 自分の猫かチェック
      if (data.owner_id !== user?.id) {
        throw new Error('この猫の編集権限がありません');
      }

      return data;
    },
  });

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
        gender: cat.gender || '',
      });

      // cat.image_urlが存在する場合、プレビューURLとして設定
      if (cat.image_url) {
        setPreviewUrl(cat.image_url);
      }
    }
  }, [cat, reset]);

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
        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

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
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">猫の情報を取得できませんでした</p>
          <Link to="/" className="inline-flex items-center text-pink-500 hover:text-pink-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{`${cat.name}のプロフィールを編集 | CAT LINK`}</title>
        <meta
          name="description"
          content={`${cat.name}のプロフィール情報を編集します。名前、年齢、品種、写真などの情報を更新できます。`}
        />
        <meta
          name="keywords"
          content={`${cat.name}, 猫編集, プロフィール更新, ペット情報, CAT LINK`}
        />
        <meta property="og:title" content={`${cat.name}のプロフィールを編集 | CAT LINK`} />
        <meta property="og:url" content={`https://cat-link.com/cats/${cat.id}/edit`} />
        <meta property="og:image" content={cat.image_url} />
        <meta
          property="og:description"
          content={`${cat.name}のプロフィール情報を編集します。CAT LINKで愛猫の情報を最新の状態に保ちましょう。`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`https://cat-link.com/cats/${cat.id}`} />
      </Helmet>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Link to={`/cats/${id}`} className="text-pink-500 hover:text-pink-600 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{cat.name}のプロフィールを編集</h1>
        </div>

        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input
              type="text"
              {...register('name', { required: '名前は必須です' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
            <select
              {...register('gender')}
              defaultValue={cat?.gender || ''}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">不明</option>
              <option value="男の子">男の子</option>
              <option value="女の子">女の子</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">生年月日</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">品種</label>
            <input
              type="text"
              {...register('breed', { required: '品種は必須です' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.breed && <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ひとこと</label>
            <input
              type="text"
              {...register('catchphrase')}
              placeholder="例：いつも元気いっぱい！甘えん坊な女の子♪"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">紹介文</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">プロフィール写真</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setImageFile(file);

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (reader.result) {
                      setPreviewUrl(reader.result.toString());
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />

            {/* プレビュー画像の表示 */}
            {(previewUrl || cat?.image_url) && (
              <img
                src={previewUrl || cat?.image_url}
                alt="プレビュー"
                className="mt-2 max-w-[200px] h-auto"
                decoding="async"
                loading="lazy"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">InstagramのURL</label>
            <input
              type="url"
              {...register('instagram_url')}
              placeholder="https://www.instagram.com/..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">XのURL</label>
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
            {mutation.isPending ? '更新中...' : '更新する'}
          </button>
        </form>
      </div>
    </div>
  );
}
