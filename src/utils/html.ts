/**
 * HTMLタグを除去してテキストのみを取得する関数
 * @param html HTML文字列
 * @returns タグを除去したテキスト
 */
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}; 