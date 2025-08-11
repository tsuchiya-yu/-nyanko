import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { paths } from '../utils/paths';
import { absoluteUrl, getBaseUrl } from '../utils/url';

import type { News } from '../types/index';

const convertUrlsToLinks = (text: string) => {
  // URLを検出する正規表現
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // テキストを配列に分割し、改行を保持
  return text.split('\n').map((line, i) => (
    <p key={i}>
      {line.split(urlRegex).map((part, j) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={j}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  ));
};

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: news,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['news', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('news').select('*').eq('slug', slug);

      if (error) throw error;
      return data as News[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div
          role="status"
          aria-label="読み込み中"
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"
        />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">エラーが発生しました</div>;
  }

  if (!news || news.length === 0) {
    return <div className="text-center py-12">404 - Not Found</div>;
  }

  const article = news[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Helmet>
        <title>{article.title} - CAT LINK</title>
        <meta name="description" content={article.content} />
        <meta property="og:title" content={`${article.title} - CAT LINK`} />
        <meta property="og:description" content={article.content} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={absoluteUrl(paths.newsDetail(article.slug))} />
        <link rel="canonical" href={absoluteUrl(paths.newsDetail(article.slug))} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            articleBody: article.content,
            datePublished: article.published_at,
            url: absoluteUrl(paths.newsDetail(article.slug)),
            publisher: {
              '@type': 'Organization',
              name: 'CAT LINK',
              url: getBaseUrl(),
            },
          })}
        </script>
      </Helmet>

      <div className="mb-8">
        <Link
          to={paths.news()}
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
          お知らせ一覧に戻る
        </Link>
      </div>

      <article>
        <header className="mb-8">
          <time dateTime={article.published_at} className="text-sm text-gray-500">
            {new Date(article.published_at)
              .toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
              .replace(/\//g, '.')}
          </time>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{article.title}</h1>
        </header>

        <div className="prose prose-gray max-w-none">{convertUrlsToLinks(article.content)}</div>
      </article>
    </div>
  );
}
