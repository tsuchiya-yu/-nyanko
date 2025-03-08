import { useQuery } from '@tanstack/react-query';
import { Plus, Image, Settings, Edit, Heart } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';

import CatCard from '../components/CatCard';
import UserSettingsModal from '../components/user/UserSettingsModal';
import { useFavorites } from '../hooks/useFavorites';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

import type { Cat } from '../types';

const getGreetingMessage = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'おはようニャ！朝ごはんまだかニャ';
  } else if (hour >= 12 && hour < 17) {
    return 'こんニャちは！お昼寝の時間かニャ？';
  } else if (hour >= 17 && hour < 22) {
    return 'こんばんは！夜ご飯の時間ニャ！';
  } else {
    return 'こんな遅くまでニャんの用？';
  }
};

export default function UserProfile() {
  const { id } = useParams();
  const { user, signOut } = useAuthStore();
  const isOwnProfile = user?.id === id;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { favoriteCats, isLoading: favoritesLoading } = useFavorites();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();

      if (error) throw error;
      return data;
    },
  });

  const { data: cats, isLoading: catsLoading } = useQuery({
    queryKey: ['user-cats', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('cats').select('*').eq('owner_id', id);

      if (error) throw error;
      return data as Cat[];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    alert('ログアウトしました');
  };

  if (profileLoading || catsLoading || favoritesLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {profile && (
        <Helmet>
          <title>{`${profile.name}のプロフィール | CAT LINK`}</title>
          <meta
            name="description"
            content={`${profile.name}さんのCAT LINKプロフィールページです。${profile.name}さんの愛猫たちをご覧ください。`}
          />
          <meta
            name="keywords"
            content={`${profile.name}, 猫, ペット, プロフィール, 写真, 愛猫家`}
          />
          <meta property="og:title" content={`${profile.name}のプロフィール | CAT LINK`} />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={`https://cat-link.com/profile/${id}`} />
          <meta
            property="og:image"
            content={profile.avatar_url || 'https://cat-link.com/images/default-avatar.jpg'}
          />
          <meta
            property="og:description"
            content={`${profile.name}さんのCAT LINKプロフィールページです。${profile.name}さんの愛猫たちをご覧ください。`}
          />
          <meta property="profile:username" content={profile.name} />
          <link rel="canonical" href={`https://cat-link.com/profile/${id}`} />
        </Helmet>
      )}

      <div className="space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {profile?.name}さん、{getGreetingMessage()}
          </h1>
        </div>
        <div className="">
          {isOwnProfile && (
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link
                to="/register-cat"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-full hover:from-pink-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2 animate-pulse" />
                新しい猫ちゃんを登録
              </Link>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-full hover:from-pink-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Settings className="h-5 w-5 mr-2" />
                アカウント設定
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">登録している猫ちゃん</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats?.map(cat => (
              <div key={cat.id} className="relative">
                <CatCard cat={cat} />
                {isOwnProfile && (
                  <>
                    <Link
                      to={`/cats/${cat.id}/photos`}
                      className="absolute top-3 left-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <Image className="h-5 w-5 text-pink-500" />
                    </Link>
                    <Link
                      to={`/cats/${cat.id}/edit`}
                      className="absolute top-3 left-14 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <Edit className="h-5 w-5 text-pink-500" />
                    </Link>
                  </>
                )}
              </div>
            ))}
          </div>
          {cats?.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">まだ猫ちゃんが登録されていません。</p>
            </div>
          )}
        </div>

        {isOwnProfile && favoriteCats && favoriteCats.length > 0 && (
          <div className="space-y-6 mt-12">
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-pink-500 mr-2 fill-pink-500" />
              <h2 className="text-xl font-semibold text-gray-800">いいねした猫ちゃん</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteCats.map(cat => (
                <div key={cat.id} className="relative">
                  <CatCard cat={cat} />
                </div>
              ))}
            </div>
          </div>
        )}

        {isOwnProfile && (
          <UserSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            profile={profile}
          />
        )}

        <div className="w-full text-right">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded transition-colors mb-2 text-gray-400"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
