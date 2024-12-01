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
        <h1 className="text-3xl my-8 font-bold text-center text-black">
          愛猫の紹介を１ページに
        </h1>
        <img src="/images/main_visual2.jpg" alt="Main Visual" className="h-auto" loading="lazy" />
        <p className="text-2xl text-black mt-10">
          「CAT LINK」は愛猫のプロフィールページをかんたんに作れます
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