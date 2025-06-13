import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, ArrowLeft, Instagram, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

import AuthModal from '../components/auth/AuthModal';
import TiktokIcon from '../components/icons/TiktokIcon';
import XIcon from '../components/icons/XIcon';
import YoutubeIcon from '../components/icons/YoutubeIcon';
import OptimizedImage from '../components/OptimizedImage';
import OwnerCatsSection from '../components/OwnerCatsSection';
import ShareModal from '../components/ShareModal';
import { useHeaderFooter } from '../context/HeaderContext';
import { handleApiError } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { calculateAge } from '../utils/calculateAge';
import { defaultBackgroundColor, defaultTextColor } from '../utils/constants';

interface CatWithOwner {
  id: string;
  name: string;
  birthdate: string;
  is_birthdate_estimated: boolean;
  breed: string;
  catchphrase: string | null;
  description: string;
  image_url: string;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  x_url: string | null;
  homepage_url: string | null;
  owner_id: string;
  gender: string | null;
  profiles: {
    name: string;
  };
  background_color?: string;
  text_color?: string;
  is_public?: boolean;
}

interface CatPhoto {
  id: string;
  image_url: string;
  comment: string;
  cat_mood?: string | null;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: CatPhoto | null;
}

// モーダルコンポーネント
const Modal = ({ isOpen, onClose, photo }: ModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 z-[9999] p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-0 w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-visible"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[-16px] right-[-16px] bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-600 z-50 shadow-md border border-gray-200 hover:bg-gray-50"
          aria-label="閉じる"
        >
          ×
        </button>
        <div className="px-2 pt-4 pb-4 overflow-y-auto max-h-[90vh]">
          <OptimizedImage
            src={photo?.image_url || ''}
            alt=""
            width={600}
            height={800}
            className="w-full h-auto rounded-lg mb-4 max-h-[70vh] object-contain"
            loading="eager"
            decoding="async"
            options={{ resize: 'contain', quality: 85 }}
          />
          {photo?.comment && <p className="text-gray-800 text-sm text-center">{photo.comment}</p>}
          {photo?.cat_mood && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-gray-800 font-semibold text-sm mb-2">ねこのひとこと(β版)</h3>
              <p className="text-gray-700 text-sm whitespace-pre-line">{photo.cat_mood}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
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
    isError,
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
            profiles:owner_id (
              name
            )
          `
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('猫が見つかりません');

        // 猫が非公開で、かつ現在のユーザーが飼い主でない場合は404エラー
        if (data.is_public === false && (!user || data.owner_id !== user.id)) {
          throw new Error('この猫のプロフィールは存在しません');
        }

        return data as CatWithOwner;
      } catch (error) {
        console.error('Error fetching cat data:', error);
        await handleApiError(error as Error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 0.5, // 30秒はキャッシュを使用
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

  // 同じ飼い主の他の猫を取得
  const { data: ownerCats } = useQuery({
    queryKey: ['owner-cats', cat?.owner_id, id],
    queryFn: async () => {
      if (!cat?.owner_id || !id) return [];

      let query = supabase
        .from('cats')
        .select('*')
        .eq('owner_id', cat.owner_id)
        .neq('id', id); // 現在表示中の猫を除外

      // 飼い主本人でない場合は公開猫のみ表示
      if (!user || cat.owner_id !== user.id) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!cat?.owner_id && !!id,
  });

  useEffect(() => {
    setHeaderFooterVisible?.(false);

    // 猫データ取得後に親要素の背景色を設定
    if (cat) {
      // データベースから取得した色を使用（設定されていない場合はデフォルト値）
      const bgColor = cat.background_color || defaultBackgroundColor;

      const parentElement = document.querySelector('div.min-h-screen.flex.flex-col.bg-white');
      if (parentElement) {
        const originalBgColor = window.getComputedStyle(parentElement).backgroundColor;
        parentElement.setAttribute('style', `background-color: ${bgColor} !important`);

        return () => {
          // クリーンアップ時に元の背景色に戻す
          parentElement.setAttribute('style', `background-color: ${originalBgColor}`);
          setHeaderFooterVisible?.(true);
        };
      }
    }

    return () => {
      setHeaderFooterVisible?.(true);
    };
  }, [setHeaderFooterVisible, cat]);

  if (isLoading) {
    return (
      <div className="text-center py-12 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
      </div>
    );
  }

  if (isError || !cat) {
    return (
      <div className="max-w-4xl mx-auto py-12 min-h-[calc(100vh-200px)]">
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

  const age = cat ? calculateAge(cat.birthdate) : null;

  // データベースから取得した色を使用（設定されていない場合はデフォルト値）
  const textColor = cat.text_color || defaultTextColor;

  return (
    <div
      className="max-w-[480px] mx-auto space-y-6 relative min-h-screen"
      style={{ color: textColor }}
    >
      <Helmet>
        <title>{`${cat.name}のプロフィール | CAT LINK`}</title>
        <meta
          name="description"
          content={`${cat.name}は${age?.toString() || ''}の${cat.breed}です。${cat.catchphrase ? cat.catchphrase : ''}${cat.description ? cat.description.substring(0, 100) + '...' : ''}`}
        />
        <meta
          name="keywords"
          content={`${cat.name}, ${cat.breed}, 猫, ペット, プロフィール, 写真`}
        />
        <meta property="og:title" content={`${cat.name}のプロフィール | CAT LINK`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://cat-link.catnote.tokyo/cats/${cat.id}`} />
        <meta
          property="og:image"
          content={`${cat.image_url}?width=1200&height=630&resize=contain`}
        />
        <meta
          property="og:description"
          content={`${cat.name}は${age?.toString() || ''}の${cat.breed}です。${cat.catchphrase ? cat.catchphrase : ''}`}
        />
        <meta property="profile:first_name" content={cat.name} />
        <link rel="canonical" href={`https://cat-link.catnote.tokyo/cats/${cat.id}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Animal',
            name: cat.name,
            image: cat.image_url,
            description: cat.description,
            species: '猫',
            breed: cat.breed,
            gender: cat.gender,
            birthDate: cat.birthdate,
            additionalProperty: [
              {
                '@type': 'PropertyValue',
                name: '年齢',
                value: age?.toString(),
              },
              {
                '@type': 'PropertyValue',
                name: '推定誕生日',
                value: cat.is_birthdate_estimated ? 'はい' : 'いいえ',
              },
              cat.catchphrase
                ? {
                    '@type': 'PropertyValue',
                    name: 'キャッチフレーズ',
                    value: cat.catchphrase,
                  }
                : null,
            ].filter(Boolean),
            subjectOf: {
              '@type': 'WebPage',
              url: `https://cat-link.catnote.tokyo/cats/${cat.id}`,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://cat-link.catnote.tokyo/cats/${cat.id}`,
            },
            owner: {
              '@type': 'Person',
              name: cat.profiles?.name || '飼い主',
            },
            sameAs: [
              cat.instagram_url,
              cat.youtube_url,
              cat.tiktok_url,
              cat.x_url,
              cat.homepage_url,
            ].filter(Boolean),
            hasPart:
              photos && photos.length > 0
                ? {
                    '@type': 'ImageGallery',
                    name: `${cat.name}の写真ギャラリー`,
                    image: photos.map(photo => ({
                      '@type': 'ImageObject',
                      contentUrl: photo.image_url,
                      description: photo.comment || `${cat.name}の写真`,
                      caption: photo.comment || '',
                    })),
                  }
                : undefined,
          })}
        </script>
      </Helmet>

      <div className="text-center mt-6">
        <Link to="/">
          <picture>
            <source srcSet="/images/webp/logo_title.webp" type="image/webp" />
            <img
              src="/images/logo_title.png"
              alt="ロゴ"
              width="160"
              height="20"
              className="inline-block w-[160px]"
              loading="eager"
              decoding="async"
              style={{ aspectRatio: '160/20', height: '20px' }}
            />
          </picture>
        </Link>
      </div>
      <div className="overflow-hidden">
        <div className="flex flex-col items-center text-center">
          <div className="fixed top-4 right-4 z-40">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              style={{ color: textColor }}
              aria-label="シェアする"
            >
              <Share2 className="h-6 w-6" />
            </button>
          </div>
          <div className="relative">
            <OptimizedImage
              src={cat.image_url}
              alt={cat.name}
              width={88}
              height={88}
              className="w-[88px] h-[88px] rounded-full object-cover"
              loading="eager"
              decoding="async"
              options={{ resize: 'fill', quality: 85 }}
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
          <div className="pt-2.5">
            <h1 className="text-lg font-bold pb-0 mb-1">{cat.name}</h1>
            <p className="text-xs">
              {cat.breed} | {age?.toString()}
              {cat.is_birthdate_estimated && ' (推定)'}{' '}
              {cat.gender !== null ? ' | ' + cat.gender : ''}
            </p>
            {cat.catchphrase && <p className="my-2 text-base">{cat.catchphrase}</p>}
          </div>
        </div>

        <div className="">
          {(cat.instagram_url || cat.x_url || cat.youtube_url || cat.tiktok_url) && (
            <div className="flex space-x-1 mb-4 justify-center">
              {cat.instagram_url && (
                <a
                  href={cat.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <Instagram className="h-6 w-6 mr-2" />
                </a>
              )}
              {cat.youtube_url && (
                <a
                  href={cat.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <YoutubeIcon className="h-6 w-6 mr-2" />
                </a>
              )}
              {cat.tiktok_url && (
                <a
                  href={cat.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <TiktokIcon className="h-6 w-6 mr-2" />
                </a>
              )}
              {cat.x_url && (
                <a
                  href={cat.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <XIcon className="h-6 w-6 mr-2" />
                </a>
              )}
              {cat.homepage_url && (
                <a
                  href={cat.homepage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:opacity-80"
                  style={{ color: textColor }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
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

          <div className="max-w-none">
            <p className="whitespace-pre-line text-sm">{cat.description}</p>
          </div>

          {photos && photos.length > 0 && (
            <div className="">
              <div className="flex justify-between items-center mb-4"></div>
              <div className="grid grid-cols-3 min-h-[150px]" style={{ gap: '1px' }}>
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden cursor-pointer group"
                    onClick={() => openModal(photo)}
                  >
                    <OptimizedImage
                      src={photo.image_url}
                      alt={`${cat.name} の画像`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      options={{ resize: 'fill', quality: 80 }}
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-200"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 同じ飼い主の猫 */}
        <OwnerCatsSection cats={ownerCats || []} textColor={textColor} />

        <div
          className="text-center mt-20 h-[80px] min-h-[80px] flex flex-col items-center justify-center"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
        >
          <Link to="/">
            <img
              src="/images/logo_title.png"
              alt="ロゴ"
              width="160"
              height="20"
              className="inline-block w-[160px]"
              loading="eager"
              decoding="async"
              style={{ aspectRatio: '160/20', height: '20px' }}
            />
          </Link>
          <p className="text-xs mt-2 h-[16px]">©︎CAT LINK All Rights Reserved</p>
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
