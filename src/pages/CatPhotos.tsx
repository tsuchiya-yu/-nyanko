import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PhotoFormData {
  imageUrl: string;
  comment: string;
}

export default function CatPhotos() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PhotoFormData>();

  const { data: cat } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error } = await supabase
        .from('cats')
        .select('name')
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

  const addPhoto = useMutation({
    mutationFn: async (data: PhotoFormData) => {
      const { error } = await supabase
        .from('cat_photos')
        .insert({
          cat_id: id,
          image_url: data.imageUrl,
          comment: data.comment,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cat-photos', id] });
      reset();
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('cat_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cat-photos', id] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {cat?.name}の写真ギャラリー
        </h1>

        <form onSubmit={handleSubmit((data) => addPhoto.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              写真URL
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              コメント
            </label>
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
          {photos?.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={photo.image_url}
                  alt=""
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => deletePhoto.mutate(photo.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full
                    hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {photo.comment && (
                <p className="p-4 text-sm text-gray-600">{photo.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}