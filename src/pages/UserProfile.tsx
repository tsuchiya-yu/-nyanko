import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Image, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import CatCard from '../components/CatCard';
import UserSettingsModal from '../components/user/UserSettingsModal';
import type { Cat } from '../types';

export default function UserProfile() {
  const { id } = useParams();
  const { user, signOut } = useAuthStore();
  const isOwnProfile = user?.id === id;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: cats, isLoading: catsLoading } = useQuery({
    queryKey: ['user-cats', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .eq('owner_id', id);

      if (error) throw error;
      return data as Cat[];
    },
  });

  const { data: favoriteCats, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          cat_id,
          cats (*)
        `)
        .eq('user_id', id);

      if (error) throw error;
      return data.map((fav) => fav.cats) as Cat[];
    },
    enabled: isOwnProfile,
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
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">ようこそ！{profile?.name}さん</h1>
      </div>
      <div className="">
        {isOwnProfile && (
        <div className="inline-flex flex-col sm:flex-row">
          <Link
            to="/register-cat"
            className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors mr-3 mb-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            新しい猫ちゃんを登録
          </Link>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors mr-3 mb-2"
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
          {cats?.map((cat) => (
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
                    <Settings className="h-5 w-5 text-pink-500" />
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

      {/* {isOwnProfile && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-500" />
            <h2 className="text-xl font-semibold text-gray-800">お気に入りの猫ちゃん</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteCats?.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
          {favoriteCats?.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">まだお気に入りの猫ちゃんがいません。</p>
            </div>
          )}
        </div>
      )} */}

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
        className="px-4 py-2 rounded transition-colors mb-2 text-link-blue "
        >
        ログアウトする
      </button>
    </div>

    </div>
  );
}