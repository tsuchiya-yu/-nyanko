import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface RequestBody {
  imageUrl: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

serve(async req => {
  // CORS header settings
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS,
      status: 204,
    });
  }
  try {
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY が設定されていません');
      return new Response(
        JSON.stringify({
          error: 'Gemini APIキーが設定されていません',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Retrieve data from request body
    const body: RequestBody = await req.json();
    let { imageUrl } = body;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          error: '画像URLが必要です',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Supabase Storageの画像URLかどうかを確認し、リサイズパラメータを追加
    if (
      imageUrl.includes('storage.googleapis.com') ||
      imageUrl.includes('supabase.co/storage/v1')
    ) {
      // URLにリサイズパラメータを追加
      const separator = imageUrl.includes('?') ? '&' : '?';
      imageUrl = `${imageUrl}${separator}width=800&height=800&resize=contain&format=webp&quality=80`;
    }

    console.log('画像URL:', imageUrl);

    // Fetch image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({
          error: '画像の取得に失敗しました',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    const imageBlob = await imageResponse.blob();

    // ファイルサイズをチェック（10MB以上なら警告をログに出力）
    if (imageBlob.size > 10 * 1024 * 1024) {
      console.warn('警告: 画像サイズが10MB以上です。処理に時間がかかる可能性があります。');
    }

    console.log('画像サイズ:', imageBlob.size, 'バイト');
    console.log('画像タイプ:', imageBlob.type);

    const imageBase64 = await blobToBase64(imageBlob);
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBlob.type || 'image/jpeg';

    if (!base64Data) {
      return new Response(
        JSON.stringify({
          error: '画像データの変換に失敗しました',
          success: false,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Set prompt
    const prompt =
      'この画像に写っている猫になりきって、この時の気持ちを50文字程度で教えてください。その時の猫の表情や動きを考慮してください。また、猫の口調や言葉遣いとなるように意識してください。';

    console.log(`Gemini APIにリクエスト送信中... model=${GEMINI_MODEL}`);

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    });

    const geminiResponseText = await geminiResponse.text();
    let geminiResult: GeminiGenerateContentResponse | null = null;

    if (geminiResponseText) {
      try {
        geminiResult = JSON.parse(geminiResponseText) as GeminiGenerateContentResponse;
      } catch (parseError) {
        console.error('Gemini APIレスポンスのJSON解析に失敗しました:', parseError);
      }
    }

    if (!geminiResponse.ok) {
      console.error('Gemini APIエラー:', {
        model: GEMINI_MODEL,
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        responseBody: geminiResponseText,
      });

      return new Response(
        JSON.stringify({
          error: 'Gemini APIの呼び出しに失敗しました',
          details: geminiResult?.error?.message || geminiResponseText || geminiResponse.statusText,
          success: false,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    console.log('Gemini APIからレスポンス受信');

    const catMood =
      geminiResult?.candidates
        ?.flatMap(candidate => candidate.content?.parts ?? [])
        .map(part => part.text?.trim())
        .filter((text): text is string => Boolean(text))
        .join('\n')
        .trim() || '';

    if (!catMood) {
      console.error('Gemini APIレスポンスにテキストが含まれていません:', {
        model: GEMINI_MODEL,
        responseBody: geminiResponseText,
      });

      return new Response(
        JSON.stringify({
          error: 'Gemini APIレスポンスにテキストが含まれていません',
          success: false,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        catMood,
        model: GEMINI_MODEL,
        success: true,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error) {
    console.error('エラーが発生しました:', error);

    return new Response(
      JSON.stringify({
        error: '処理中にエラーが発生しました',
        details: getErrorMessage(error),
        success: false,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  }
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return '不明なエラーが発生しました';
}

// Function to convert Blob to base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
