import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

interface RequestBody {
  imageUrl: string;
}

serve(async (req) => {
  // CORS header settings
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      status: 204
    });
  }
  try {
    // Retrieve data from request body
    const body: RequestBody = await req.json();
    let { imageUrl } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({
        error: "画像URLが必要です"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Supabase Storageの画像URLかどうかを確認し、リサイズパラメータを追加
    if (imageUrl.includes("storage.googleapis.com") || 
        imageUrl.includes("supabase.co/storage/v1")) {
      // URLにリサイズパラメータを追加
      const separator = imageUrl.includes("?") ? "&" : "?";
      imageUrl = `${imageUrl}${separator}width=800&height=800&resize=contain&format=webp&quality=80`;
    }

    console.log("画像URL:", imageUrl);

    // Fetch image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response(JSON.stringify({
        error: "画像の取得に失敗しました"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const imageBlob = await imageResponse.blob();
    
    // ファイルサイズをチェック（10MB以上なら警告をログに出力）
    if (imageBlob.size > 10 * 1024 * 1024) {
      console.warn("警告: 画像サイズが10MB以上です。処理に時間がかかる可能性があります。");
    }
    
    console.log("画像サイズ:", imageBlob.size, "バイト");
    console.log("画像タイプ:", imageBlob.type);
    
    const imageBase64 = await blobToBase64(imageBlob);

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // 利用可能なモデルを表示（デバッグ用）
    try {
      const models = await genAI.getModels();
      console.log("利用可能なモデル:", models);
    } catch (error) {
      console.error("モデル一覧取得エラー:", error);
    }
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    // Set prompt
    const prompt = "この画像に写っている猫になりきって、この時の気持ちを一言で教えてください";

    console.log("Gemini APIにリクエスト送信中...");
    
    // Call Gemini API with image and prompt
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: imageBlob.type,
                data: imageBase64.split(",")[1]
              }
            }
          ]
        }
      ]
    });

    console.log("Gemini APIからレスポンス受信");
    
    const response = result.response;
    const catMood = response.text();

    return new Response(JSON.stringify({
      catMood,
      success: true
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("エラーが発生しました:", error);
    // エラーオブジェクトの詳細情報を取得
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error.response ? { 
        status: error.response.status,
        statusText: error.response.statusText,
        responseBody: await error.response.text().catch(() => "レスポンスボディを取得できません")
      } : {})
    };
    
    return new Response(JSON.stringify({
      error: "処理中にエラーが発生しました",
      details: error.message,
      errorInfo: errorDetails,
      success: false
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});

// Function to convert Blob to base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
