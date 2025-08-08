import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { stripHtml } from '../utils/html';
import { paths } from '../utils/paths';

import type { Column } from '../types/index';

export default function Columns() {
  const {
    data: columns,
    isLoading,
    error,
  } = useQuery<Column[]>({
    queryKey: ['columns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('columns')
        .select('id, title, content, image_url, published_at, slug')
        .lt('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Helmet>
        <title>猫の読みもの・コラム | CAT LINK</title>
        <meta
          name="description"
          content="猫との暮らしに役立つ情報、猫の行動や健康に関するコラムなど、猫好きのための読みものコンテンツをお届けします。"
        />
        <meta property="og:title" content="猫の読みもの・コラム | CAT LINK" />
        <meta
          property="og:description"
          content="猫との暮らしに役立つ情報、猫の行動や健康に関するコラムなど、猫好きのための読みものコンテンツをお届けします。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://cat-link.catnote.tokyo${paths.columns()}`} />
        <link rel="canonical" href={`https://cat-link.catnote.tokyo${paths.columns()}`} />
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">コラム一覧</h1>

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
      ) : columns && columns.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {columns.map(column => (
            <article
              key={column.id}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow"
            >
              {column.image_url && (
                <Link to={paths.columnDetail(column.slug)} className="block aspect-video">
                  <picture>
                    <source
                      type="image/webp"
                      srcSet={`${column.image_url}?transform=resize&width=800&quality=75&format=webp`}
                    />
                    <img
                      src={`${column.image_url}?transform=resize&width=800&quality=75`}
                      alt={column.title}
                      loading="lazy"
                      width="800"
                      height="450"
                      className="w-full h-full object-cover"
                    />
                  </picture>
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
                <h2 className="text-xl font-semibold text-gray-800 mt-2 hover:text-gray-500 transition-colors">
                  <Link to={paths.columnDetail(column.slug)}>{column.title}</Link>
                </h2>
                <p className="mt-3 text-gray-600 line-clamp-3">{stripHtml(column.content)}</p>
                <div className="mt-4">
                  <Link
                    to={paths.columnDetail(column.slug)}
                    className="text-sm text-gray-500 hover:text-gray-600 transition-colors inline-flex items-center"
                    aria-label={`${column.title}の続きを読む`}
                  >
                    記事の続きを読む
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">記事はありません</div>
      )}
    </div>
  );
}
