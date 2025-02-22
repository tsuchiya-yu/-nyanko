import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Instagram, Twitter, ChevronDown } from 'lucide-react';
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
    <div className="space-y-16 pb-12">
      {/* ヒーローセクション */}
      <section className="relative">
        <div className="bg-gradient-to-b from-pink-50 to-purple-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-12 sm:py-16 lg:py-20 lg:pt-4 pt-4">
          <div className="max-w-7xl mx-auto text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
              うちの猫を1ページに
            </h1>
            <div className="flex flex-col sm:flex-row w-full mx-auto mb-8">
              {/* 画像部分 */}
              <div className="w-full sm:w-1/2">
                <img
                  src="/images/top/main.jpg"
                  alt="愛猫の写真"
                  className="w-full h-auto object-cover rounded-lg shadow-lg"
                  decoding="async" loading="lazy"
                />
              </div>

              {/* ソーシャルリンク＆画像ギャラリー */}
              <div className="w-full sm:w-1/2 flex flex-col items-center p-4 sm:pt-0">
                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow w-full mb-4"
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  Instagram
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow w-full mb-6"
                >
                  <Twitter className="h-5 w-5 mr-2" />
                  X
                </a>

                <div className="flex w-full space-x-2">
                  <div className="w-[24%] aspect-square">
                      <img
                        src="/images/top/example3.jpg"
                        alt="愛猫の写真１"
                        className="w-full object-cover rounded-lg shadow-lg"
                        decoding="async" loading="lazy"
                      />
                    </div>
                  <div className="w-[50%] aspect-square">
                      <img
                        src="/images/top/example2.jpg"
                        alt="愛猫の写真２"
                        className="w-full object-cover rounded-lg shadow-lg"
                        decoding="async" loading="lazy"
                      />
                  </div>
                    <div className="w-[24%] aspect-square">
                      <img
                        src="/images/top/example1.jpg"
                        alt="愛猫の写真３"
                        className="w-full object-cover rounded-lg shadow-lg"
                        decoding="async" loading="lazy"
                      />
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl text-center mx-auto px-4 sm:px-6 lg:px-8 !mt-[0px]">
        <Link
          to="/register-cat"
          className="inline-block w-full max-w-[400px] px-8 py-4 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
        >
          今すぐ始める
        </Link>
      </section>

      {/* 新着の猫ちゃん */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">みんなの猫</h2>
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
        <section className="max-w-7xl text-center mx-auto px-4 sm:px-6 lg:px-8 my-4">
          <Link
            to="/cats"
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            もっと見る
          </Link>
        </section>
      </section>

      {/* 3ステップ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
          3ステップでページを作ろう
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <img
              src="/images/top/step1.png"
              alt="会員登録"
              className="w-full h-48 object-scale-down rounded-lg mb-4"
            />
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 text-pink-500 rounded-full text-xl font-semibold mb-4">
              1
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">会員登録</h3>
            <p className="text-gray-600">メールアドレスで簡単に登録できます</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <img
              src="/images/top/step2.png"
              alt="猫ちゃん情報の入力"
              className="w-full h-48 object-scale-down rounded-lg mb-4"
              decoding="async" loading="lazy"
            />
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 text-pink-500 rounded-full text-xl font-semibold mb-4">
              2
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">猫ちゃん情報の入力</h3>
            <p className="text-gray-600">名前や写真、プロフィールを登録</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <img
              src="/images/top/step3.png"
              alt="ページの公開"
              className="w-full h-48 object-scale-down rounded-lg mb-4"
              decoding="async" loading="lazy"
            />
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 text-pink-500 rounded-full text-xl font-semibold mb-4">
              3
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">ページの公開</h3>
            <p className="text-gray-600">SNSで共有して思い出を残そう</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link
            to="/register"
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            無料で始める
          </Link>
        </div>
      </section>

      {/* スマホ操作説明 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
          スマホでかんたん操作
        </h2>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center">
            <img
              src="/images/top/feature1.png"
              alt="写真の追加"
              className="w-48 h-32 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
              decoding="async" loading="lazy"
            />
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">写真の追加</h3>
              <p className="text-gray-600">スマホで撮影した写真をすぐにアップロード</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center">
            <img
              src="/images/top/feature2.png"
              alt="プロフィール編集"
              className="w-48 h-32 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
              decoding="async" loading="lazy"
            />
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">プロフィール編集</h3>
              <p className="text-gray-600">いつでもどこでも情報を更新できます</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center">
            <img
              src="/images/top/feature3.png"
              alt="SNSシェア"
              className="w-48 h-32 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
              decoding="async" loading="lazy"
            />
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">SNSシェア</h3>
              <p className="text-gray-600">InstagramやXへ簡単に共有</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link
            to="/register"
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            今すぐ始める
          </Link>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
          よくある質問
        </h2>
        <div className="space-y-4">
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">ページを作成するとお金がかかりますか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">
              いいえ、完全無料でご利用いただけます。
            </p>
          </details>
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">複数の猫を登録できますか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">
              はい、1つのアカウントで複数の猫ちゃんを登録できます。
            </p>
          </details>
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">登録した情報は後から編集できますか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">
              はい、いつでも自由に情報を更新できます。
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}