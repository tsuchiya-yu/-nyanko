import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../lib/supabase';

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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PhotoFormData>();

  const { data: cat } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error } = await supabase.from('cats').select('name').eq('id', id).single();

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

  const addPhoto = useMutation({
    mutationFn: async (data: PhotoFormData) => {
      console.log('addPhoto mutation started:', data);
      if (!data.imageFile) {
        throw new Error('画像を選択してください');
      }
      const uniqueId = uuidv4();
      const sanitizedFileName = sanitizeFileName(data.imageFile.name);
      const filePath = `cats/${uniqueId}_${sanitizedFileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, data.imageFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

        console.log('Generated publicURL:', publicUrl);

        const { error, data: insertedData } = await supabase.from('cat_photos').insert({
          cat_id: id,
          image_url: publicUrl,
          comment: data.comment,
        });

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
        console.log('Data inserted successfully:', insertedData);
      } catch (error) {
        console.error('Error in addPhoto mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cat-photos', id] });
      reset();
      setImageFile(null);
      setPreviewUrl(null);
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
          <meta property="og:url" content={`https://cat-link.com/cats/${id}/photos`} />
          <meta
            property="og:image"
            content={
              photos && photos.length > 0
                ? photos[0].image_url
                : 'https://cat-link.com/images/ogp.jpg'
            }
          />
          <meta
            property="og:description"
            content={`${cat.name}の写真ギャラリーです。可愛い瞬間や思い出の写真をご覧ください。`}
          />
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={`https://cat-link.com/cats/${id}`} />
        </Helmet>
      )}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {cat ? `${cat.name}の写真ギャラリー` : '写真ギャラリー'}
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form
          onSubmit={handleSubmit(data => addPhoto.mutate({ ...data, imageFile }))}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">写真</label>
            <input
              type="file"
              accept="image/*"
              {...register('imageFile', { required: '写真は必須です' })}
              onChange={e => {
                if (e.target.files) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            {errors.imageFile && (
              <p className="mt-1 text-sm text-red-600">{errors.imageFile.message}</p>
            )}
            {previewUrl && (
              <img src={previewUrl} alt="プレビュー" className="mt-2 max-w-[200px] h-auto" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">コメント</label>
            <textarea
              {...register('comment')}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={addPhoto.isPending}
            className="w-full py-2 px-4 border border-transparent rounded-full
              bg-pink-500 hover:bg-pink-600 text-white font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addPhoto.isPending ? '追加中...' : '写真を追加'}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos?.map(photo => (
            <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={photo.image_url}
                  alt=""
                  className="w-full h-48 object-cover"
                  decoding="async"
                  loading="lazy"
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
      )}
    </div>
  );
}
