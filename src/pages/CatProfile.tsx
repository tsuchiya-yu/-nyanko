import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, ArrowLeft, Instagram, Twitter, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';

import AuthModal from '../components/auth/AuthModal';
import ShareModal from '../components/ShareModal';
import { useHeaderFooter } from '../context/HeaderContext';
import { handleApiError } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { calculateAge } from '../utils/calculateAge';

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
  homepage_url: string | null;
  owner_id: string;
  gender: string | null;
  profiles: {
    name: string;
  };
}

interface CatPhoto {
  id: string;
  image_url: string;
  comment: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: CatPhoto | null;
}

// モーダルコンポーネント
const Modal = ({ isOpen, onClose, photo }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70"
      style={{ marginTop: '0' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-md mx-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[-30px] right-[-20px] text-gray-600 text-3xl"
        >
          ×
        </button>
        <img src={photo?.image_url} alt="" className="w-full h-auto rounded-lg mb-4" />
        {photo?.comment && <p className="text-gray-800 text-sm text-center">{photo.comment}</p>}
      </div>
    </div>
  );
};

export default function CatProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CatPhoto | null>(null);
  const { setHeaderFooterVisible } = useHeaderFooter();

  const {
    data: cat,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cat', id],
    queryFn: async () => {
      try {
        if (!id) throw new Error('猫IDが見つかりません');

        const { data, error: fetchError } = await supabase
          .from('cats')
          .select(
            `
            *,
            profiles (
              name
            )
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('猫が見つかりません');

        return data as CatWithOwner;
      } catch (error) {
        await handleApiError(error);
        throw error;
      }
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
        await supabase.from('favorites').delete().eq('cat_id', id).eq('user_id', user.id);
      } else {
        await supabase.from('favorites').insert({ cat_id: id, user_id: user.id });
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

  const openModal = (photo: CatPhoto) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  useEffect(() => {
    setHeaderFooterVisible?.(false);

    return () => {
      setHeaderFooterVisible?.(true);
    };
  }, [setHeaderFooterVisible]);

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
          <Link to="/" className="inline-flex items-center text-pink-500 hover:text-pink-600">
            <ArrowLeft className="h-5 w-5 mr-2" />
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const age = calculateAge(cat.birthdate);

  return (
    <div className="max-w-[480px] mx-auto space-y-6 relative">
      <Helmet>
        <title>{`${cat.name}のプロフィール | CAT LINK`}</title>
        <meta
          name="description"
          content={`${cat.name}は${age}歳の${cat.breed}です。${cat.catchphrase ? cat.catchphrase : ''}${cat.description ? cat.description.substring(0, 100) + '...' : ''}`}
        />
        <meta
          name="keywords"
          content={`${cat.name}, ${cat.breed}, 猫, ペット, プロフィール, 写真`}
        />
        <meta property="og:title" content={`${cat.name}のプロフィール | CAT LINK`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://cat-link.com/cats/${cat.id}`} />
        <meta property="og:image" content={cat.image_url} />
        <meta
          property="og:description"
          content={`${cat.name}は${age}歳の${cat.breed}です。${cat.catchphrase ? cat.catchphrase : ''}`}
        />
        <meta property="profile:first_name" content={cat.name} />
        <link rel="canonical" href={`https://cat-link.com/cats/${cat.id}`} />
      </Helmet>

      <div className="text-center mt-6">
        <Link to="/">
          <img
            src="/images/logo_title.png"
            alt="ロゴ"
            loading="lazy"
            className="inline-block w-[160px]"
          />
        </Link>
      </div>
      <div className="overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="fixed top-4 right-4 z-40">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="h-6 w-6" />
            </button>
          </div>
          <div className="relative">
            <img
              src={cat.image_url}
              alt={cat.name}
              className="w-[88px] h-[88px] rounded-full object-cover"
            />
            <button
              onClick={handleFavoriteClick}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
              aria-label={isFavorited ? 'いいね解除' : 'いいね'}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'text-pink-500 fill-pink-500' : 'text-pink-500'}`}
              />
            </button>
          </div>
          <div className="pt-2.5 text-gray-700">
            <h1 className="text-sm font-bold ">{cat.name}</h1>
            <p className="text-xs">
              {cat.breed} | {age}歳{cat.is_birthdate_estimated && ' (推定)'}{' '}
              {cat.gender !== null ? ' | ' + cat.gender : ''}
            </p>
            {cat.catchphrase && <p className="my-2 text-base">{cat.catchphrase}</p>}
          </div>
        </div>

        <div className="">
          {(cat.instagram_url || cat.x_url) && (
            <div className="flex space-x-1 mb-4 justify-center">
              {cat.instagram_url && (
                <a
                  href={cat.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-500 hover:text-gray-600"
                >
                  <Instagram className="h-8 w-8 mr-2" />
                </a>
              )}
              {cat.x_url && (
                <a
                  href={cat.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-500 hover:text-gray-600"
                >
                  <Twitter className="h-8 w-8 mr-2" />
                </a>
              )}
              {cat.homepage_url && (
                <a
                  href={cat.homepage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-500 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </a>
              )}
            </div>
          )}

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-line text-sm">{cat.description}</p>
          </div>

          {photos && photos.length > 0 && (
            <div className="mt4">
              <div className="flex justify-between items-center mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '1px' }}>
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden cursor-pointer group"
                    onClick={() => openModal(photo)}
                  >
                    <img
                      src={photo.image_url}
                      alt={`${cat.name} の画像`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-200"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-20">
          <Link to="/">
            <img src="/images/logo_title.png" alt="ロゴ" className="inline-block w-[160px]" />
          </Link>
          <p className="text-xs text-gray-700 mt-2">©︎CAT LINK All Rights Reserved</p>
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
        catName={cat.name}
      />
      <Modal isOpen={isModalOpen} onClose={closeModal} photo={selectedPhoto} />
    </div>
  );
}
