import { supabase } from '../lib/supabase';

/**
 * 指定されたprof_path_idが既に使用されているかどうかをチェックする
 * @param profPathId チェックするプロフィールパスID
 * @param excludeId 除外するcat ID（編集時に自身のIDを除外するために使用）
 * @returns プロフィールパスIDが使用されている場合はtrue、そうでない場合はfalse
 * @throws エラーが発生した場合
 */
export async function isProfPathIdTaken(profPathId: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from('cats').select('id').eq('prof_path_id', profPathId);

  // 編集時は自身のIDを除外
  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking prof_path_id:', error);
    throw error;
  }

  return !!data;
}
