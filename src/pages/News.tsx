import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { paths } from '../utils/paths';
import { absoluteUrl } from '../utils/url';

import type { News as NewsType } from '../types/index';

export default function News() {
  const {
    data: news,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .lt('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as NewsType[];
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Helmet>
        <title>お知らせ一覧 - CAT LINK</title>
        <meta
          name="description"
          content="CAT LINKからのお知らせ一覧です。新機能の追加や重要なアップデート情報をお届けします。"
        />
        <meta property="og:title" content="お知らせ一覧 - CAT LINK" />
        <meta
          property="og:description"
          content="CAT LINKからのお知らせ一覧です。新機能の追加や重要なアップデート情報をお届けします。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={absoluteUrl(paths.news())} />
        <link rel="canonical" href={absoluteUrl(paths.news())} />
        {news && news.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: news.map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'NewsArticle',
                    headline: item.title,
                    articleBody: item.content,
                    datePublished: item.published_at,
                    url: absoluteUrl(paths.newsDetail(item.slug)),
                    publisher: {
                      '@type': 'Organization',
                      name: 'CAT LINK',
                      url: absoluteUrl(paths.home()),
                    },
                  },
                })),
              },
            })}
          </script>
        )}
      </Helmet>

      <div className="mb-8">
        <Link
          to={paths.home()}
          className="text-sm text-gray-600 hover:text-gray-500 transition-colors inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          トップに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">お知らせ</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div
            role="status"
            aria-label="読み込み中"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"
          />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">エラーが発生しました</div>
      ) : news && news.length > 0 ? (
        <div className="space-y-8">
          {news.map(item => (
            <article key={item.id} className="border-b border-gray-200 pb-8">
              <time dateTime={item.published_at} className="text-sm text-gray-500">
                {new Date(item.published_at)
                  .toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                  .replace(/\//g, '.')}
              </time>
              <h2 className="text-xl font-semibold text-gray-800 mt-2 hover:text-gray-500 transition-colors">
                <Link to={paths.newsDetail(item.slug)}>{item.title}</Link>
              </h2>
              <p className="mt-3 text-gray-600 line-clamp-2">{item.content}</p>
              <div className="mt-4">
                <Link
                  to={paths.newsDetail(item.slug)}
                  className="text-sm text-gray-500 hover:text-gray-600 transition-colors inline-flex items-center"
                >
                  続きを読む
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
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">お知らせはありません</div>
      )}
    </div>
  );
}
