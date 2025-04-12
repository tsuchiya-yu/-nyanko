import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORSヘッダーの設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function pemToDer(pem: string): Uint8Array {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  return new Uint8Array(
    atob(pemContents)
      .split('')
      .map(char => char.charCodeAt(0))
  );
}

async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GA_CLIENT_EMAIL');
  const privateKey = Deno.env.get('GA_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  
  if (!clientEmail || !privateKey) {
    throw new Error('Missing credentials');
  }

  const derKey = pemToDer(privateKey);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    derKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    true,
    ['sign']
  );

  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: getNumericDate(3600),
      iat: getNumericDate(0)
    },
    key
  );

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const { access_token } = await tokenResponse.json();
  return access_token;
}

// GA4からページビューを取得する関数
async function getPageViewsFromGA4(catId: string): Promise<number> {
  const propertyId = Deno.env.get('GA_PROPERTY_ID');
  if (!propertyId) throw new Error('GA_PROPERTY_ID is not set');

  const accessToken = await getAccessToken();
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              value: `/cats/${catId}`,
              matchType: 'EXACT',
            },
          },
        },
      }),
    }
  );

  const data = await response.json();
  return data.rows?.[0]?.metricValues?.[0]?.value ? parseInt(data.rows[0].metricValues[0].value, 10) : 0;
}

async function getPageViews(catId: string): Promise<{ pageViews: number; cached: boolean }> {
  // キャッシュからデータを取得
  const { data: cachedData } = await supabase
    .from('cache')
    .select('value, created_at')
    .eq('key', `pageviews:${catId}`)
    .single();

  // キャッシュが有効な場合（1時間以内）
  if (cachedData && Date.now() - new Date(cachedData.created_at).getTime() < 3600000) {
    return { pageViews: cachedData.value, cached: true };
  }

  // GA4から新しいデータを取得
  const pageViews = await getPageViewsFromGA4(catId);

  // キャッシュを更新
  const now = new Date();
  const expires = new Date(now.getTime() + 3600000); // 1時間後

  await supabase
    .from('cache')
    .upsert({
      key: `pageviews:${catId}`,
      value: pageViews,
      created_at: now.toISOString(),
      expires_at: expires.toISOString()
    });

  return { pageViews, cached: false };
}

// メインのハンドラー関数
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { catId } = await req.json();
    if (!catId) {
      return new Response(
        JSON.stringify({ error: 'catId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await getPageViews(catId);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 