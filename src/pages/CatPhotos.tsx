import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import ImageEditor from '../components/ImageEditor';
import OptimizedImage from '../components/OptimizedImage';
import { getCatMood } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { optimizeImageForUpload } from '../utils/imageUtils';

interface PhotoFormData {
  imageFile: File | null;
  comment: string;
}

function sanitizeFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = fileName.substring(0, dotIndex);
  const extension = fileName.substring(dotIndex);

  // 無効な文字を置換
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

  return sanitizedBaseName + extension;
}

export default function CatPhotos() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<PhotoFormData>();

  const { data: cat } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error } = await supabase
        .from('cats')
        .select('name, owner_id')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: photos, isLoading } = useQuery({
    queryKey: ['cat-photos', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error } = await supabase
        .from('cat_photos')
        .select('*')
        .eq('cat_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // 画像が編集されて保存されたときの処理
  const handleSaveEditedImage = async (editedImageBlob: Blob) => {
    try {
      // Blobからファイルを作成
      const editedFile = new File([editedImageBlob], editingImage?.name || 'edited-image.jpg', {
        type: editedImageBlob.type,
      });

      // 画像をアップロード前に最適化
      const optimizedFile = await optimizeImageForUpload(editedFile);

      setImageFile(optimizedFile);
      setShowImageEditor(false);

      // プレビュー用のURLを作成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(optimizedFile);
    } catch (error) {
      console.error('画像の最適化エラー:', error);
      // エラー時は元の画像を使用
      const editedFile = new File([editedImageBlob], editingImage?.name || 'edited-image.jpg', {
        type: editedImageBlob.type,
      });
      setImageFile(editedFile);
      setShowImageEditor(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(editedFile);
    }
  };

  // 画像編集をキャンセルする処理
  const handleCancelEdit = () => {
    setShowImageEditor(false);
    if (!previewUrl) {
      setImageFile(null);
    }
  };

  // 写真アップロード処理
  const handlePhotoUpload = async (data: { comment: string }) => {
    if (!imageFile) {
      console.error('画像ファイルが選択されていません');
      return;
    }

    setIsUploading(true);

    try {
      // 画像をアップロード
      const uniqueId = uuidv4();
      const sanitizedFileName = sanitizeFileName(imageFile.name);
      const filePath = `cats/${uniqueId}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // 公開URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

      // 猫の気持ちを取得
      const catMood = await getCatMood(publicUrl);

      // データベースに保存
      const { error: dbError } = await supabase.from('cat_photos').insert({
        cat_id: id,
        image_url: publicUrl,
        comment: data.comment,
        cat_mood: catMood, // 猫の気持ちを保存
      });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      // 成功時の処理
      queryClient.invalidateQueries({ queryKey: ['cat-photos', id] });
      reset();
      setImageFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('写真のアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const addPhoto = useMutation({
    mutationFn: handlePhotoUpload,
    onError: error => {
      console.error('Error in addPhoto mutation:', error);
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase.from('cat_photos').delete().eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cat-photos', id] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {cat && (
        <Helmet>
          <title>{`${cat.name}の写真ギャラリー | CAT LINK`}</title>
          <meta
            name="description"
            content={`${cat.name}の写真ギャラリーです。可愛い瞬間や思い出の写真をご覧ください。`}
          />
          <meta
            name="keywords"
            content={`${cat.name}, 猫写真, ペット写真, 猫ギャラリー, CAT LINK`}
          />
          <meta property="og:title" content={`${cat.name}の写真ギャラリー | CAT LINK`} />
          <meta property="og:url" content={`https://cat-link.catnote.tokyo/cats/${id}/photos`} />
          <meta
            property="og:image"
            content={
              photos && photos.length > 0
                ? photos[0].image_url
                : 'https://cat-link.catnote.tokyo/images/ogp.png'
            }
          />
          <meta
            property="og:description"
            content={`${cat.name}の写真ギャラリーです。可愛い瞬間や思い出の写真をご覧ください。`}
          />
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={`https://cat-link.catnote.tokyo/cats/${id}`} />
        </Helmet>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Link
          to={`/cats/${id}`}
          className="mr-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {cat ? `${cat.name}の写真ギャラリー` : '写真ギャラリー'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        {showImageEditor && editingImage ? (
          <ImageEditor
            imageFile={editingImage}
            onSave={handleSaveEditedImage}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">写真を追加する</h2>
            <form
              onSubmit={handleSubmit(data => {
                if (!imageFile) {
                  alert('画像を選択してください');
                  return;
                }
                addPhoto.mutate({ comment: data.comment });
              })}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">写真</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setEditingImage(file);
                      setShowImageEditor(true);
                    }
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {!imageFile && !previewUrl && (
                  <p className="mt-1 text-sm text-red-600">写真は必須です</p>
                )}
                {previewUrl && (
                  <div className="mt-2">
                    <img
                      src={previewUrl}
                      alt="プレビュー"
                      className="mt-2 max-w-[200px] h-auto rounded-lg shadow-sm"
                    />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">コメント</label>
                <textarea
                  {...register('comment')}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={addPhoto.isPending || isUploading}
                className="w-full py-2 px-4 border border-transparent rounded-full
                  text-white bg-gray-800 hover:bg-gray-500 font-medium
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:bg-gray-500 
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addPhoto.isPending || isUploading ? '追加中...' : '写真を追加'}
              </button>
            </form>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">登録済みの写真</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos?.map(photo => (
              <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <OptimizedImage
                    src={photo.image_url}
                    alt=""
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    decoding="async"
                    options={{ resize: 'fill', quality: 80 }}
                  />
                  <button
                    onClick={() => deletePhoto.mutate(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full
                      hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {photo.comment && <p className="p-4 text-sm text-gray-600">{photo.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
