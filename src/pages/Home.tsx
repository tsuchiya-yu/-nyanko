import { useQuery } from '@tanstack/react-query';
import { InstagramIcon, X, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';

import CatCard from '../components/CatCard';
import { handleAuthAction } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { stripHtml } from '../utils/html';

import type { Cat, News, Column } from '../types/index';

export default function Home() {
  const { data: cats, isLoading: isLoadingCats } = useQuery({
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

  const { data: news, isLoading: isLoadingNews } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .lt('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as News[];
    },
  });

  const { data: columns, isLoading: isLoadingColumns } = useQuery({
    queryKey: ['columns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('columns')
        .select('*')
        .lt('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as Column[];
    },
  });

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleStartAction = () => {
    handleAuthAction(user, navigate, 'register');
  };

  const handleTryAIAction = () => {
    handleAuthAction(user, navigate, 'register');
  };

  return (
    <div className="space-y-16 pb-12">
      <Helmet>
        <title>CAT LINK - 愛猫のプロフィールページを簡単に作成・共有</title>
        <link rel="canonical" href="https://cat-link.catnote.tokyo/" />
        <meta
          name="description"
          content="CAT LINKで愛猫のプロフィールページを簡単に作成・共有。スマホで簡単に写真やプロフィールを登録して、SNSで共有できます。AIが猫の気持ちを分析する「ねこのひとこと」機能も搭載！"
        />
        <meta
          name="keywords"
          content="猫, ペット, プロフィール, 写真, 共有, SNS, 無料, AI, ねこのひとこと, 猫の気持ち"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                '@id': 'https://cat-link.catnote.tokyo/#website',
                url: 'https://cat-link.catnote.tokyo/',
                name: 'CAT LINK',
                description: '愛猫のプロフィールページを簡単に作成・共有',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://cat-link.catnote.tokyo/search?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'Organization',
                '@id': 'https://cat-link.catnote.tokyo/#organization',
                name: 'CAT LINK',
                url: 'https://cat-link.catnote.tokyo/',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://cat-link.catnote.tokyo/images/logo_title.png',
                  width: 160,
                  height: 20,
                },
                description: '愛猫のプロフィールページを簡単に作成・共有するサービス',
              },
              {
                '@type': 'SoftwareApplication',
                name: 'CAT LINK',
                operatingSystem: 'All',
                applicationCategory: 'LifestyleApplication',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'JPY',
                },
                description:
                  '愛猫のプロフィールページを簡単に作成・共有できるウェブアプリ。AIで猫の気持ちを分析する「ねこのひとこと」機能搭載。',
                screenshot: 'https://cat-link.catnote.tokyo/images/top/main.jpg',
                featureList: [
                  '愛猫のプロフィールページ作成',
                  '写真ギャラリー',
                  'SNSへの共有機能',
                  'スマホでかんたん操作',
                  'AIによる「ねこのひとこと」機能',
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'CAT LINKの利用にお金はかかりますか？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'いいえ、完全無料でご利用いただけます。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'CAT LINKを利用することでどんなことができますか？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'CAT LINKでは、あなたの愛猫の写真やプロフィールを簡単に登録し、他の猫好きさんに共有することができます。また、AIが猫の気持ちを分析する「ねこのひとこと」機能も利用できます。',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '会員登録をするとどんなメリットがありますか？',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '会員登録をすると、猫ちゃんに「いいね！」をすることができます。さらに、猫ちゃんのプロフィールページを作成することができます。プロフィールページは、SNSで共有することができます。',
                    },
                  },
                ],
              },
            ],
          })}
        </script>
        {cats && cats.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: cats.map((cat, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Animal',
                  name: cat.name,
                  image: cat.image_url,
                  mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `https://cat-link.catnote.tokyo/cats/${cat.prof_path_id}`,
                  },
                  url: `https://cat-link.catnote.tokyo/cats/${cat.prof_path_id}`,
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      {/* ヒーローセクション */}
      <section className="relative">
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-2 sm:py-8 sm:mt-2 mt-8">
          <div className="max-w-7xl mx-auto text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-12">
              あなたの猫を１ページに
            </h1>
            <div className="flex flex-col sm:flex-row w-full mx-auto mb-6">
              {/* 画像部分 */}
              <div className="w-full sm:w-1/2">
                <picture>
                  <source srcSet="/images/top/webp/main.webp" type="image/webp" />
                  <img
                    src="/images/top/main.jpg"
                    alt="愛猫の写真"
                    className="w-full h-auto object-cover rounded-lg shadow-lg"
                    width="600"
                    height="600"
                    decoding="async"
                    loading="eager"
                  />
                </picture>
              </div>

              {/* ソーシャルリンク＆画像ギャラリー */}
              <div className="w-full sm:w-1/2 flex flex-col items-center p-4 sm:pt-0">
                <p className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow w-full mb-4">
                  <InstagramIcon className="h-5 w-5 mr-2" />
                  うちの子日記@Instagram
                </p>
                <p className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow w-full mb-6">
                  <X className="h-5 w-5 mr-2" />
                  うちの子日記@X
                </p>

                <div className="flex w-full space-x-2">
                  <div className="w-[24%] aspect-square">
                    <picture>
                      <source srcSet="/images/top/webp/example3.webp" type="image/webp" />
                      <img
                        src="/images/top/example3.jpg"
                        alt="愛猫の写真１"
                        className="w-full object-cover rounded-lg shadow-lg"
                        width="120"
                        height="120"
                        decoding="async"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                  <div className="w-[50%] aspect-square">
                    <picture>
                      <source srcSet="/images/top/webp/example2.webp" type="image/webp" />
                      <img
                        src="/images/top/example2.jpg"
                        alt="愛猫の写真２"
                        className="w-full object-cover rounded-lg shadow-lg"
                        width="250"
                        height="250"
                        decoding="async"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                  <div className="w-[24%] aspect-square">
                    <picture>
                      <source srcSet="/images/top/webp/example1.webp" type="image/webp" />
                      <img
                        src="/images/top/example1.jpg"
                        alt="愛猫の写真３"
                        className="w-full object-cover rounded-lg shadow-lg"
                        width="120"
                        height="120"
                        decoding="async"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-lg max-w-3xl mx-auto px-4 py-3">
              あなたの愛猫の写真やプロフィールを登録して、他の人に見てもらおう！
            </p>
          </div>
          <div className="text-center mt-8">
            <button
              onClick={handleStartAction}
              className="inline-block w-full max-w-[400px] px-8 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
            >
              今すぐ始める
            </button>
          </div>
        </div>
      </section>

      {/* みんなの愛猫 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">みんなの愛猫</h2>
        </div>
        {isLoadingCats ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats?.map(cat => <CatCard key={cat.id} cat={cat} />)}
          </div>
        )}
        <div className="text-center mt-8">
          <button
            onClick={handleStartAction}
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            今すぐ始める
          </button>
        </div>
      </section>

      {/* AIが猫の気持ちを代弁 - 新しいセクション */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 rounded-xl mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">AIが猫の気持ちを代弁</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            写真をアップロードすると、AIが猫の気持ちを分析して教えてくれる「ねこのひとこと」機能を搭載！
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mt-8">
          <div className="w-full lg:w-1/2 max-w-md">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <picture className="flex justify-center">
                <source srcSet="/images/top/webp/example2.webp" type="image/webp" />
                <img
                  src="/images/top/example2.jpg"
                  alt="猫の写真"
                  className="w-[180px] h-[180px] object-cover rounded-lg mb-4 mx-auto"
                  width="180"
                  height="180"
                  decoding="async"
                  loading="lazy"
                />
              </picture>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-gray-800 font-semibold text-sm mb-2">ねこのひとこと(β版)</h3>
                <p className="text-gray-700 text-sm italic">
                  窓の外を見ていると、鳥さんたちが遊んでるのが見えるニャ。私も外に出たいけど、ここからじっと見守るのも悪くないにゃ〜。
                </p>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 max-w-md space-y-4">
            <div className="bg-white p-5 rounded-lg shadow-sm flex items-start">
              <div className="bg-pink-100 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">最新のAI技術を活用</h3>
                <p className="text-gray-600 text-sm">
                  最新のAI画像認識技術で、猫の表情や姿勢から気持ちを分析
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm flex items-start">
              <div className="bg-pink-100 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">猫の気持ちを理解</h3>
                <p className="text-gray-600 text-sm">
                  愛猫の表情や仕草から、どんな気持ちだったのかを教えてくれます
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm flex items-start">
              <div className="bg-pink-100 rounded-full p-2 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">猫視点の語り口</h3>
                <p className="text-gray-600 text-sm">
                  まるで猫が話しているかのような語り口で、より楽しめます
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <button
            onClick={handleTryAIAction}
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            「ねこのひとこと」を試してみる
          </button>
        </div>
      </section>

      {/* コラムセクション */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">猫のコラム</h2>
          {isLoadingColumns ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {columns?.map(column => (
                  <article
                    key={column.id}
                    className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
                  >
                    {column.image_url && (
                      <Link to={`/columns/${column.slug}`} className="block">
                        <img
                          src={column.image_url}
                          alt={column.title}
                          loading="lazy"
                          className="w-full h-40 object-cover"
                        />
                      </Link>
                    )}
                    <div className="p-4">
                      <time dateTime={column.published_at} className="text-sm text-gray-500">
                        {new Date(column.published_at)
                          .toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                          .replace(/\//g, '.')}
                      </time>
                      <h3 className="text-base font-semibold text-gray-800 mt-2 hover:text-gray-500 transition-colors line-clamp-2">
                        <Link to={`/columns/${column.slug}`}>{column.title}</Link>
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {stripHtml(column.content)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="text-right">
                <Link
                  to="/columns"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 transition-colors"
                >
                  コラム一覧へ
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* お知らせセクション */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">お知らせ</h2>
          {isLoadingNews ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {news?.map(item => (
                  <article key={item.id} className="border-b border-gray-100 pb-4">
                    <time dateTime={item.published_at} className="text-sm text-gray-500">
                      {new Date(item.published_at)
                        .toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                        .replace(/\//g, '.')}
                    </time>
                    <h3 className="text-base text-gray-800 mt-1 hover:text-gray-500 transition-colors">
                      <Link to={`/news/${item.slug}`} className="block">
                        {item.title}
                      </Link>
                    </h3>
                  </article>
                ))}
              </div>
              <div className="mt-4 text-right">
                <Link
                  to="/news"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 transition-colors"
                >
                  お知らせ一覧へ
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={handleStartAction}
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            今すぐ始める
          </button>
        </div>
      </section>

      {/* プロフィールページを作ろう！ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
          ３ステップでページを作ろう！
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <picture>
              <source srcSet="/images/top/webp/step1.webp" type="image/webp" />
              <img
                src="/images/top/step1.png"
                alt="会員登録"
                className="w-full h-48 object-scale-down rounded-lg mb-4"
                width="300"
                height="192"
              />
            </picture>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-pink-500 rounded-full text-xl font-semibold mb-4">
              1
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">会員登録</h3>
            <p className="text-gray-600">メールアドレスで簡単に登録できます</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <picture>
              <source srcSet="/images/top/webp/step2.webp" type="image/webp" />
              <img
                src="/images/top/step2.png"
                alt="猫ちゃん情報の入力"
                className="w-full h-48 object-scale-down rounded-lg mb-4"
                width="300"
                height="192"
                decoding="async"
                loading="lazy"
              />
            </picture>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-pink-500 rounded-full text-xl font-semibold mb-4">
              2
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">猫ちゃん情報の入力</h3>
            <p className="text-gray-600">名前やプロフィール、写真を登録できます</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <picture>
              <source srcSet="/images/top/webp/step3.webp" type="image/webp" />
              <img
                src="/images/top/step3.png"
                alt="ページの公開"
                className="w-full h-48 object-scale-down rounded-lg mb-4"
                width="300"
                height="192"
                decoding="async"
                loading="lazy"
              />
            </picture>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-pink-500 rounded-full text-xl font-semibold mb-4">
              3
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">ページの公開</h3>
            <p className="text-gray-600">SNSでページを共有して、うちの子を他の人に共有しよう！</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <button
            onClick={handleStartAction}
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            無料で始める
          </button>
        </div>
      </section>

      {/* スマホ操作説明 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
          スマホでかんたん操作
        </h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4 scrollbar-none sm:space-x-0 sm:space-y-6 sm:flex-col sm:overflow-x-visible">
          <div className="bg-white p-6 rounded-lg shadow-md flex-none w-[280px] sm:w-full flex flex-col sm:flex-row items-center">
            <picture>
              <source srcSet="/images/top/webp/feature1.webp" type="image/webp" />
              <img
                src="/images/top/feature1.png"
                alt="写真の追加"
                className="w-48 h-32 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
                width="192"
                height="128"
                decoding="async"
                loading="lazy"
              />
            </picture>
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">写真の追加</h3>
              <p className="text-gray-600">スマホで撮影した写真をすぐにアップロード</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex-none w-[280px] sm:w-full flex flex-col sm:flex-row items-center">
            <picture>
              <source srcSet="/images/top/webp/feature2.webp" type="image/webp" />
              <img
                src="/images/top/feature2.png"
                alt="プロフィール編集"
                className="w-48 h-32 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
                width="192"
                height="128"
                decoding="async"
                loading="lazy"
              />
            </picture>
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">プロフィール編集</h3>
              <p className="text-gray-600">いつでもどこでも情報を更新できます</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md flex-none w-[280px] sm:w-full flex flex-col sm:flex-row items-center">
            <picture>
              <source srcSet="/images/top/webp/feature3.webp" type="image/webp" />
              <img
                src="/images/top/feature3.png"
                alt="SNSシェア"
                className="w-48 h-32 object-cover rounded-lg mb-4 sm:mb-0 sm:mr-6"
                width="192"
                height="128"
                decoding="async"
                loading="lazy"
              />
            </picture>
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-800 mb-2">SNSシェア</h3>
              <p className="text-gray-600">InstagramやXへ簡単に共有</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <button
            onClick={handleStartAction}
            className="inline-block w-full max-w-[400px] px-8 py-4 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
          >
            今すぐ始める
          </button>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">よくある質問</h2>
        <div className="space-y-4">
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">CAT LINKの利用にお金はかかりますか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">完全無料でご利用いただけます。</p>
          </details>
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">CAT LINKはどんなことができますか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">
              CAT
              LINKでは、あなたの愛猫の写真やプロフィールを簡単に登録し、他の猫好きさんに共有することができます。
              また、写真をアップロードすると、AIが猫の気持ちを分析して教えてくれる「ねこのひとこと」機能が利用できます。
            </p>
          </details>
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">「ねこのひとこと」機能とは何ですか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">
              「ねこのひとこと」は、アップロードした猫の写真をAIが分析して、猫の気持ちを教えてくれる機能です。写真をアップロードするだけで自動的に設定され、完全無料でご利用いただけます。
            </p>
          </details>
          <details className="bg-white p-6 rounded-lg shadow-md">
            <summary className="flex justify-between items-center cursor-pointer">
              <span className="font-medium">会員登録をするとどんなメリットがありますか？</span>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </summary>
            <p className="mt-4 text-gray-600">
              会員登録をすると、猫ちゃんに「いいね」をすることができます。さらに、猫ちゃんのプロフィールページを作成でき、写真をアップロードすることで「ねこのひとこと」機能も利用できます。
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
