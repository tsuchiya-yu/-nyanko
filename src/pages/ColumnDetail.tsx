import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';

import type { Column } from '../types/index';

export default function ColumnDetail() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: column,
    isLoading,
    error,
  } = useQuery<Column>({
    queryKey: ['column', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('columns')
        .select('id, title, content, image_url, published_at, slug') // 必要なフィールドのみ選択
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを保持
    gcTime: 1000 * 60 * 30, // 30分間キャッシュを保持
  });

  // メタデータをメモ化
  const metaDescription = useMemo(() => {
    if (!column?.content) return '';
    return column.content.substring(0, 160);
  }, [column?.content]);

  // JSON-LDをメモ化
  const jsonLd = useMemo(() => {
    if (!column) return '';
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: column.title,
      image: column.image_url || 'https://cat-link.catnote.tokyo/images/logo.png',
      datePublished: column.published_at,
      author: {
        '@type': 'Organization',
        name: 'CAT LINK',
        url: 'https://cat-link.catnote.tokyo',
      },
    });
  }, [column]);

  // 日付表示をメモ化
  const formattedDate = useMemo(() => {
    if (!column?.published_at) return '';
    return new Date(column.published_at)
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '.');
  }, [column?.published_at]);

  // HTML内容をメモ化
  const contentHtml = useMemo(() => {
    return { __html: column?.content || '' };
  }, [column?.content]);

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

  if (!column) {
    return <div className="text-center py-12">404 - 記事が見つかりません</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Helmet>
        <title>{column.title} | CAT LINK</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${column.title} | CAT LINK`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://cat-link.catnote.tokyo/columns/${column.slug}`} />
        {column.image_url && (
          <>
            <link
              rel="preload"
              as="image"
              href={`${column.image_url}?transform=resize&width=800&quality=75&format=webp`}
              type="image/webp"
              media="(min-width: 768px)"
              fetchpriority="high"
            />
            <link
              rel="preload"
              as="image"
              href={`${column.image_url}?transform=resize&width=600&quality=75&format=webp`}
              type="image/webp"
              media="(max-width: 767px)"
              fetchpriority="high"
            />
            <meta property="og:image" content={column.image_url} />
          </>
        )}
        <link rel="canonical" href={`https://cat-link.catnote.tokyo/columns/${column.slug}`} />
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <div className="mb-8">
        <Link
          to="/columns"
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
          コラム一覧に戻る
        </Link>
      </div>

      <article>
        <header className="mb-8">
          <time dateTime={column.published_at} className="text-sm text-gray-500">
            {formattedDate}
          </time>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{column.title}</h1>
        </header>

        {column.image_url && (
          <div className="mb-8 aspect-video w-full">
            <picture>
              <source
                type="image/webp"
                srcSet={`${column.image_url}?transform=resize&width=800&quality=75&format=webp`}
                media="(min-width: 768px)"
              />
              <source
                type="image/webp"
                srcSet={`${column.image_url}?transform=resize&width=600&quality=75&format=webp`}
                media="(max-width: 767px)"
              />
              <img
                src={`${column.image_url}?transform=resize&width=800&quality=75`}
                alt={column.title}
                width="800"
                height="450"
                className="w-full h-full object-cover rounded-lg"
                loading="eager"
                fetchpriority="high"
              />
            </picture>
          </div>
        )}

        <div
          className="prose prose-pink max-w-none min-h-[200px]"
          dangerouslySetInnerHTML={contentHtml}
        />
      </article>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          to="/columns"
          className="inline-flex items-center text-gray-500 hover:text-gray-600 transition-colors"
        >
          他の記事を読む
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
