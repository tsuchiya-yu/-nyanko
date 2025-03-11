import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import ImageEditor from '../components/ImageEditor';
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

export default function RegisterCat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CatFormData>({
    defaultValues: {
      name: '',
      birthdate: '',
      is_birthdate_estimated: false,
      breed: '',
      catchphrase: '',
      description: '',
      image_url: '',
      instagram_url: '',
      x_url: '',
      homepage_url: '',
      gender: '',
    },
  });

  // フォームの現在値を監視
  const formValues = watch();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集した画像を保存する処理
  const handleSaveEditedImage = (editedImageBlob: Blob) => {
    // Blobからファイルを作成
    const editedFile = new File([editedImageBlob], editingImage?.name || 'edited-image.jpg', {
      type: editedImageBlob.type,
    });

    setImageFile(editedFile);
    setShowImageEditor(false);

    // 一時的な値を設定
    setValue('image_url', 'temp_image_url');

    // プレビュー用のURLを作成
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(editedFile);
  };

  // 画像編集をキャンセルする処理
  const handleCancelEdit = () => {
    setShowImageEditor(false);
    if (!previewUrl) {
      setImageFile(null);
    }
  };

  // 猫の登録処理
  const handleRegisterCat = async (data: CatFormData) => {
    setIsSubmitting(true);

    try {
      let imageUrl = '';

      // 画像がある場合はアップロード
      if (imageFile) {
        const uniqueId = uuidv4();
        const sanitizedFileName = sanitizeFileName(imageFile.name);
        const filePath = `cats/${uniqueId}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // データベースに登録
      const { error } = await supabase.from('cats').insert({
        name: data.name,
        birthdate: data.birthdate,
        is_birthdate_estimated: data.is_birthdate_estimated,
        breed: data.breed,
        catchphrase: data.catchphrase || null,
        description: data.description,
        image_url: imageUrl,
        instagram_url: data.instagram_url || null,
        x_url: data.x_url || null,
        homepage_url: data.homepage_url || null,
        owner_id: user?.id,
        gender: data.gender || null,
      });

      if (error) throw error;

      // 登録成功
      navigate(`/profile/${user?.id}`);
    } catch (error) {
      console.error('Error registering cat:', error);
      alert('猫の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mutation = useMutation({
    mutationFn: handleRegisterCat,
  });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>愛猫を登録する | CAT LINK</title>
        <meta
          name="description"
          content="CAT LINKで愛猫のプロフィールを作成しましょう。名前、年齢、品種、写真などの情報を登録して、素敵なプロフィールページを作成できます。"
        />
        <meta name="keywords" content="猫登録, 猫プロフィール作成, ペット登録, 猫情報, CAT LINK" />
        <meta property="og:title" content="愛猫を登録する | CAT LINK" />
        <meta property="og:url" content="https://cat-link.com/register-cat" />
        <meta
          property="og:description"
          content="CAT LINKで愛猫のプロフィールを作成しましょう。名前、年齢、品種、写真などの情報を登録して、素敵なプロフィールページを作成できます。"
        />
        <link rel="canonical" href="https://cat-link.com/register-cat" />
      </Helmet>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新しい猫ちゃんを登録</h1>

        {showImageEditor && editingImage ? (
          <ImageEditor
            imageFile={editingImage}
            onSave={handleSaveEditedImage}
            onCancel={handleCancelEdit}
            aspectRatio={1}
          />
        ) : (
          <form
            onSubmit={handleSubmit(data => {
              console.log('提出するデータ:', data);
              mutation.mutate(data);
            })}
            className="space-y-6"
          >
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
                placeholder="ミックス"
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
                placeholder="いつも元気いっぱい！甘えん坊な女の子♪"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">紹介文</label>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setEditingImage(file);
                    setShowImageEditor(true);
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />

              {/* プレビュー画像の表示 */}
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="max-w-[200px] h-auto rounded-lg shadow-sm"
                    decoding="async"
                    loading="lazy"
                  />
                  {/* 編集ボタンはファイルが選択されている場合のみ表示 */}
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImage(imageFile);
                        setShowImageEditor(true);
                      }}
                      className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      画像を再編集
                    </button>
                  )}
                </div>
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
                {...register('homepage_url')}
                placeholder="https://nekoneko.com/..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending || isSubmitting}
              className="w-full py-2 px-4 border border-transparent rounded-full
                bg-gray-500 hover:bg-gray-600 text-white font-medium
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending || isSubmitting ? '登録中...' : '登録する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
