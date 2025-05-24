import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Pencil, Trash, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  catchphrase?: string;
  description: string;
  image_url: string;
  instagram_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
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

export default function EditCat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);

  // 色選択のState
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [bgColor, setBgColor] = useState(defaultBackgroundColor);
  const [textColor, setTextColor] = useState(defaultTextColor);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CatFormData>();

  // フォームの現在値を監視
  const formValues = watch();

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
      // フォームリセットでフィールドを初期化
      reset({
        name: cat.name,
        birthdate: cat.birthdate,
        is_birthdate_estimated: cat.is_birthdate_estimated,
        breed: cat.breed,
        catchphrase: cat.catchphrase || '',
        description: cat.description,
        image_url: cat.image_url,
        instagram_url: cat.instagram_url || '',
        youtube_url: cat.youtube_url || '',
        tiktok_url: cat.tiktok_url || '',
        x_url: cat.x_url || '',
        homepage_url: cat.homepage_url || '',
        gender: cat.gender || '',
        background_color: cat.background_color || defaultBackgroundColor,
        text_color: cat.text_color || defaultTextColor,
      });

      // 色の状態を初期化
      setBgColor(cat.background_color || defaultBackgroundColor);
      setTextColor(cat.text_color || defaultTextColor);

      // cat.image_urlが存在する場合、プレビューURLとして設定
      if (cat.image_url) {
        setPreviewUrl(cat.image_url);
      }
    }
  }, [cat, reset]);

  useEffect(() => {
    if (imageFile && !showImageEditor) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.onerror = () => {
        setPreviewUrl(null);
        console.error('画像の読み込みに失敗しました');
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, showImageEditor]);

  // 編集した画像を保存する処理
  const handleSaveEditedImage = (editedImageBlob: Blob) => {
    // Blobからファイルを作成
    const editedFile = new File([editedImageBlob], imageFile?.name || 'edited-image.jpg', {
      type: editedImageBlob.type,
    });

    setImageFile(editedFile);
    setShowImageEditor(false);

    // 一時的な値を設定（フォーム送信時に実際のURLに置き換えられる）
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

  const mutation = useMutation({
    mutationFn: async (data: CatFormData) => {
      // 編集した画像をSupabase Storageにアップロード
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
      } else if (previewUrl && previewUrl === cat?.image_url) {
        // 既存の画像URLを使用
        data.image_url = cat.image_url;
      }

      console.log('Form data before submit:', data);

      const { error } = await supabase
        .from('cats')
        .update({
          name: data.name,
          birthdate: data.birthdate,
          is_birthdate_estimated: data.is_birthdate_estimated,
          breed: data.breed,
          catchphrase: data.catchphrase || null,
          description: data.description,
          image_url: data.image_url,
          instagram_url: data.instagram_url || null,
          youtube_url: data.youtube_url || null,
          tiktok_url: data.tiktok_url || null,
          x_url: data.x_url || null,
          homepage_url: data.homepage_url || null,
          gender: data.gender || null,
          background_color: data.background_color,
          text_color: data.text_color,
        })
        .eq('id', id);

      if (error) {
        console.error('Update error:', error); // デバッグログ
        throw error;
      }

      // 更新されたデータを返す（キャッシュ更新に使用）
      return {
        ...data,
        id,
      };
    },
    onSuccess: updatedData => {
      // 個別の猫情報キャッシュを直接更新
      queryClient.setQueryData(['cat', id], (oldData: any) => {
        return { ...oldData, ...updatedData };
      });

      // 関連するすべてのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['cat', id] });

      // プロフィールページの猫一覧キャッシュを無効化
      if (cat && cat.owner_id) {
        queryClient.invalidateQueries({ queryKey: ['user-cats', cat.owner_id] });
      }

      // 全体的な猫リストも無効化
      queryClient.invalidateQueries({
        queryKey: ['cats'],
        refetchType: 'all',
      });

      // すべてのクエリキャッシュを無効化し、強制的に最新データを取得
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['cat', id] });
        if (cat && cat.owner_id) {
          queryClient.refetchQueries({ queryKey: ['user-cats', cat.owner_id] });
        }
      }, 100);

      alert('猫ちゃんの情報を更新しました');
      navigate(`/cats/${id}`);
    },
  });

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

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">猫の情報を取得できませんでした</p>
          <Link to="/" className="inline-flex items-center text-gray-700 hover:text-gray-900">
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
          <Link
            to={`/profile/${cat.owner_id}`}
            className="mr-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{cat.name}のプロフィールを編集</h1>
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
                defaultValue={cat?.gender || ''}
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
                    className="rounded border-gray-300 text-gray-500 focus:ring-gray-500"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">紹介文</label>
              <textarea
                {...register('description', { required: '紹介文は必須です' })}
                rows={4}
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
              {(previewUrl || cat?.image_url) && (
                <div className="mt-2">
                  <img
                    src={previewUrl || cat?.image_url}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTubeのURL</label>
              <input
                type="url"
                {...register('youtube_url')}
                placeholder="https://www.youtube.com/@..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TikTokのURL</label>
              <input
                type="url"
                {...register('tiktok_url')}
                placeholder="https://www.tiktok.com/@..."
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
              originalColor={cat?.background_color || defaultBackgroundColor}
            />

            <ColorPickerModal
              isOpen={showTextColorPicker}
              onClose={() => setShowTextColorPicker(false)}
              color={textColor}
              onChange={handleTextColorChange}
              title="文字色を選択"
              colors={textColors}
              originalColor={cat?.text_color || defaultTextColor}
            />

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2 px-4 border border-transparent rounded-full
                text-white bg-gray-800 hover:bg-gray-500 font-medium
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:bg-gray-500 
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? '更新中...' : '保存する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
