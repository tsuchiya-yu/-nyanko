import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import CatCard from '../components/CatCard';
import type { Cat } from '../types';

export default function Home() {
  const { data: cats, isLoading } = useQuery({
    queryKey: ['cats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Cat[];
    },
  });

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          愛猫との素敵な思い出を共有しよう
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          にゃんこみゅは、猫好きの皆さんのための特別なコミュニティ。
          あなたの大切な家族を紹介して、新しい出会いを見つけましょう。
        </p>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">新着の猫ちゃん</h2>
        </div>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats?.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}