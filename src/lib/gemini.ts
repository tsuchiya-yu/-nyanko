/**
 * 猫の気持ちを取得する関数
 * 指定された画像URLをGemini APIに送信し、猫の気持ちを取得します
 * 
 * @param imageUrl - 分析する猫の画像のURL
 * @returns 猫の気持ちのテキスト、エラー時はnull
 */
export async function getCatMood(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://mypvypmyjcrxiovdejqj.supabase.co/functions/v1/image-to-gemini',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      }
    );

    if (!response.ok) {
      console.error('猫の気持ち取得エラー:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.success && data.catMood) {
      return data.catMood;
    }
    
    return null;
  } catch (error) {
    console.error('猫の気持ち取得エラー:', error);
    return null;
  }
} 