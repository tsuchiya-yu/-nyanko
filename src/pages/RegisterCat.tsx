import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { ColorPickerModal } from '../components/ColorPickerModal';
import ImageEditor from '../components/ImageEditor';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import {
  defaultBackgroundColor,
  defaultTextColor,
  backgroundColors,
  textColors,
} from '../utils/constants';

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
  background_color?: string;
  text_color?: string;
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
  const queryClient = useQueryClient();
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
      background_color: defaultBackgroundColor,
      text_color: defaultTextColor,
    },
  });

  // フォームの現在値を監視
  const formValues = watch();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 色選択のState
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [bgColor, setBgColor] = useState(defaultBackgroundColor);
  const [textColor, setTextColor] = useState(defaultTextColor);

  // 背景色変更のハンドラー
  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    setValue('background_color', color);
  };

  // 文字色変更のハンドラー
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    setValue('text_color', color);
  };

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
        background_color: data.background_color,
        text_color: data.text_color,
      });

      if (error) throw error;

      // ユーザーの猫リストキャッシュを無効化
      await queryClient.invalidateQueries({ queryKey: ['user-cats', user?.id] });

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
        <div className="flex items-center mb-6">
          <Link
            to={`/profile/${user?.id}`}
            className="mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">新しい猫ちゃんを登録</h1>
        </div>

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
              // 色の値をフォームデータに設定
              data.background_color = bgColor;
              data.text_color = textColor;
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
              <select
                {...register('gender')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              {errors.birthdate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
              )}
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_birthdate_estimated')}
                    className="rounded border-gray-300 text-pink-500 focus:ring-gray-500"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XのURL</label>
              <input
                type="url"
                {...register('x_url')}
                placeholder="https://x.com/..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            {/* カラーテーマ設定 */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">カラーテーマ設定</h2>

              <div className="space-y-6">
                <p>プロフィールページのカラーテーマを設定できます。</p>
                {/* 背景色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">背景色</label>
                  <div className="flex items-center">
                    <div
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer mr-3"
                      style={{ backgroundColor: bgColor }}
                      onClick={() => setShowBgColorPicker(true)}
                    ></div>
                    <input
                      type="text"
                      value={bgColor}
                      onChange={e => {
                        setBgColor(e.target.value);
                        setValue('background_color', e.target.value);
                      }}
                      className="block px-3 py-2 border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 文字色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">文字色</label>
                  <div className="flex items-center">
                    <div
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer mr-3"
                      style={{ backgroundColor: textColor }}
                      onClick={() => setShowTextColorPicker(true)}
                    ></div>
                    <input
                      type="text"
                      value={textColor}
                      onChange={e => {
                        setTextColor(e.target.value);
                        setValue('text_color', e.target.value);
                      }}
                      className="block px-3 py-2 border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* プレビュー */}
                <div
                  className="mt-4 p-4 rounded-lg"
                  style={{ backgroundColor: bgColor, color: textColor }}
                >
                  <h3 className="text-base font-medium mb-2">プレビュー</h3>
                  <p className="text-sm">
                    このように表示されます。実際のページで確認するには保存してください。
                  </p>
                </div>
              </div>
            </div>

            {/* モーダル */}
            <ColorPickerModal
              isOpen={showBgColorPicker}
              onClose={() => setShowBgColorPicker(false)}
              color={bgColor}
              onChange={handleBgColorChange}
              title="背景色を選択"
              colors={backgroundColors}
            />

            <ColorPickerModal
              isOpen={showTextColorPicker}
              onClose={() => setShowTextColorPicker(false)}
              color={textColor}
              onChange={handleTextColorChange}
              title="文字色を選択"
              colors={textColors}
            />

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
