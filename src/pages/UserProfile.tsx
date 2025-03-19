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
    return 'おはようにゃ！';
  } else if (hour >= 12 && hour < 17) {
    return 'こんにゃちは！';
  } else if (hour >= 17 && hour < 22) {
    return 'こんばんにゃ！';
  } else {
    return '遅くまでおつかれさにゃ！';
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
          <meta name="robots" content="noindex" />
          <meta property="og:title" content={`${profile.name}のプロフィール | CAT LINK`} />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={`https://cat-link.catnote.tokyo/profile/${id}`} />
          <meta
            property="og:image"
            content={
              profile.avatar_url || 'https://cat-link.catnote.tokyo/images/default-avatar.jpg'
            }
          />
          <meta
            property="og:description"
            content={`${profile.name}さんのCAT LINKプロフィールページです。${profile.name}さんの愛猫たちをご覧ください。`}
          />
          <meta property="profile:username" content={profile.name} />
          <link rel="canonical" href={`https://cat-link.catnote.tokyo/profile/${id}`} />
        </Helmet>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {profile?.name || '飼い主'} さん
                </h1>
                <p className="text-gray-500 mt-1">{getGreetingMessage()}</p>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register-cat"
                className="flex items-center px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-300 font-medium text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                新しい猫ちゃんを登録
              </Link>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center px-5 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                アカウント設定
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
            登録している猫ちゃん
          </h2>
          
          {cats?.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">まだ猫ちゃんが登録されていません。</p>
              {isOwnProfile && (
                <Link
                  to="/register-cat"
                  className="inline-block mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-300 text-sm font-medium"
                >
                  猫ちゃんを登録する
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cats?.map(cat => (
                <div key={cat.id} className="group relative">
                  <CatCard
                    cat={cat}
                    actions={
                      isOwnProfile && (
                        <>
                          <Link
                            to={`/cats/${cat.id}/photos`}
                            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-all text-sm font-medium text-center"
                          >
                            写真を追加
                          </Link>
                          <Link
                            to={`/cats/${cat.id}/edit`}
                            className="flex-1 px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-center"
                          >
                            編集する
                          </Link>
                        </>
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isOwnProfile && favoriteCats && favoriteCats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
            いいねした猫ちゃん
          </h2>
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
      
      {isOwnProfile && (
        <div className="mt-8 text-right">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
