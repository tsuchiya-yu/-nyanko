import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Share2, ArrowLeft, Image, Instagram, Twitter, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import AuthModal from '../components/auth/AuthModal';
import ShareModal from '../components/ShareModal';

interface CatWithOwner {
  id: string;
  name: string;
  birthdate: string;
  is_birthdate_estimated: boolean;
  breed: string;
  catchphrase: string;
  description: string;
  image_url: string;
  instagram_url: string | null;
  x_url: string | null;
  owner_id: string;
  profiles: {
    name: string;
  };
}

interface CatPhoto {
  id: string;
  image_url: string;
  comment: string;
}

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export default function CatProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: cat, isLoading, error } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      if (!id) throw new Error('猫IDが見つかりません');

      const { data, error: fetchError } = await supabase
        .from('cats')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('猫が見つかりません');
      
      return data as CatWithOwner;
    },
    retry: false,
  });

  const { data: photos } = useQuery({
    queryKey: ['cat-photos', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('cat_photos')
        .select('*')
        .eq('cat_id', id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as CatPhoto[];
    },
  });

  const { data: isFavorited } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('cat_id', id)
        .eq('user_id', user.id)
        .single();

      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('ユーザーが見つかりません');

      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('cat_id', id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('favorites')
          .insert({ cat_id: id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  const handleFavoriteClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    toggleFavorite.mutate();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
      </div>
    );
  }

  if (error || !cat) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : '猫の情報を取得できませんでした'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center text-pink-500 hover:text-pink-600"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const age = calculateAge(cat.birthdate);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-96">
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white">{cat.name}</h1>
            <p className="text-white/90">
              {cat.breed} • {age}歳
              {cat.is_birthdate_estimated && ' (推定)'}
            </p>
            {cat.catchphrase && (
              <p className="text-white/90 mt-2 text-lg">{cat.catchphrase}</p>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-500">飼い主</p>
              <Link
                to={`/profile/${cat.owner_id}`}
                className="text-lg font-medium hover:text-pink-500"
              >
                {cat.profiles.name}さん
              </Link>
            </div>
            <div className="flex space-x-4">
              {user?.id === cat.owner_id && (
                <Link
                  to={`/cats/${cat.id}/edit`}
                  className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <Edit className="h-6 w-6" />
                </Link>
              )}
              <button
                onClick={handleFavoriteClick}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-100 text-pink-500 hover:bg-pink-200'
                }`}
              >
                <Heart className="h-6 w-6" />
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="h-6 w-6" />
              </button>
            </div>
          </div>

          {(cat.instagram_url || cat.x_url) && (
            <div className="flex space-x-4 mb-6">
              {cat.instagram_url && (
                <a
                  href={cat.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-pink-500 hover:text-pink-600"
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  Instagram
                </a>
              )}
              {cat.x_url && (
                <a
                  href={cat.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-500 hover:text-gray-600"
                >
                  <Twitter className="h-5 w-5 mr-2" />
                  X (Twitter)
                </a>
              )}
            </div>
          )}

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">プロフィール</h2>
            <p className="text-gray-700 whitespace-pre-line">{cat.description}</p>
          </div>

          {photos && photos.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">写真ギャラリー</h2>
                {user?.id === cat.owner_id && (
                  <Link
                    to={`/cats/${cat.id}/photos`}
                    className="inline-flex items-center text-pink-500 hover:text-pink-600"
                  >
                    <Image className="h-5 w-5 mr-2" />
                    写真を管理
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {photo.comment && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity
                        flex items-center justify-center p-4">
                        <p className="text-white text-sm text-center">{photo.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => handleFavoriteClick()}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}