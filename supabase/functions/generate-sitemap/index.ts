import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Cat {
  id: string
  created_at: string
}

interface News {
  slug: string
  created_at: string
}

interface Column {
  slug: string
  published_at: string
}

serve(async (req) => {
  try {
    // 環境変数の確認
    const projectUrl = Deno.env.get('PROJECT_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    
    if (!projectUrl || !serviceRoleKey) {
      throw new Error(`環境変数が設定されていません: ${!projectUrl ? 'PROJECT_URL' : ''} ${!serviceRoleKey ? 'SERVICE_ROLE_KEY' : ''}`)
    }

    // Supabaseクライアントの初期化
    const supabaseClient = createClient(projectUrl, serviceRoleKey)

    // データベースから情報を取得
    const { data: cats, error: catsError } = await supabaseClient
      .from('cats')
      .select('id, created_at')
    
    if (catsError) {
      throw new Error(`catsテーブルの取得に失敗: ${catsError.message}`)
    }

    const { data: news, error: newsError } = await supabaseClient
      .from('news')
      .select('slug, created_at')
    
    if (newsError) {
      throw new Error(`newsテーブルの取得に失敗: ${newsError.message}`)
    }

    const { data: columns, error: columnsError } = await supabaseClient
      .from('columns')
      .select('slug, published_at')
    
    if (columnsError) {
      throw new Error(`columnsテーブルの取得に失敗: ${columnsError.message}`)
    }

    // サイトマップの生成
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cat-link.catnote.tokyo/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cat-link.catnote.tokyo/terms</loc>
    <lastmod>2024-05-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.1</priority>
  </url>
  <url>
    <loc>https://cat-link.catnote.tokyo/privacy</loc>
    <lastmod>2024-05-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.1</priority>
  </url>
  ${(cats as Cat[]).map(cat => `
  <url>
    <loc>https://cat-link.catnote.tokyo/cats/${cat.id}</loc>
    <lastmod>${new Date(cat.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${(news as News[]).map(item => `
  <url>
    <loc>https://cat-link.catnote.tokyo/news/${item.slug}</loc>
    <lastmod>${new Date(item.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`).join('')}
  ${(columns as Column[]).map(item => `
  <url>
    <loc>https://cat-link.catnote.tokyo/columns/${item.slug}</loc>
    <lastmod>${new Date(item.published_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

    // Storageに保存
    const { error: uploadError } = await supabaseClient
      .storage
      .from('pet-photos')
      .upload('sitemaps/sitemap.xml', sitemap, {
        contentType: 'application/xml',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`サイトマップの保存に失敗: ${uploadError.message}`)
    }

    return new Response(
      JSON.stringify({ message: 'サイトマップの生成が完了しました' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('ERROR:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 