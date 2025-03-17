/**
 * 猫の気持ちを取得する関数
 * 指定された画像URLをGemini APIに送信し、猫の気持ちを取得します
 *
 * @param imageUrl - 分析する猫の画像のURL
 * @returns 猫の気持ちのテキスト、エラー時はnull
 */
import { fetch } from 'cross-fetch';

export async function getCatMood(imageUrl: string): Promise<string | null> {
  console.log('[getCatMood] 開始: 画像URL =', imageUrl?.substring(0, 100) + '...');
  
  try {
    console.log('[getCatMood] Edge Function呼び出し開始');
    
    const requestBody = JSON.stringify({ imageUrl });
    console.log('[getCatMood] リクエストボディ:', requestBody.substring(0, 100) + '...');
    
    const response = await fetch(
      'https://mypvypmyjcrxiovdejqj.supabase.co/functions/v1/image-to-gemini',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      }
    );
    
    console.log('[getCatMood] レスポンスステータス:', response.status, response.statusText);
    console.log('[getCatMood] レスポンスヘッダー:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));
    
    if (!response.ok) {
      console.error('猫の気持ち取得エラー:', response.statusText, '(ステータス:', response.status, ')');
      return null;
    }

    const responseText = await response.text();
    console.log('[getCatMood] レスポンステキスト:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[getCatMood] パース済みデータ:', JSON.stringify(data).substring(0, 200) + '...');
    } catch (parseError) {
      console.error('[getCatMood] JSONパースエラー:', parseError);
      return null;
    }
    
    if (data.success && data.catMood) {
      console.log('[getCatMood] 成功: 猫の気持ち取得完了', data.catMood.substring(0, 50) + '...');
      return data.catMood;
    } else {
      console.warn('[getCatMood] データ構造警告: success=', data.success, ', catMood=', data.catMood ? '存在します' : '存在しません');
      if (data.error) {
        console.error('[getCatMood] APIエラー:', data.error);
      }
    }

    return null;
  } catch (error) {
    console.error('[getCatMood] 例外発生:', error);
    return null;
  } finally {
    console.log('[getCatMood] 終了');
  }
}
