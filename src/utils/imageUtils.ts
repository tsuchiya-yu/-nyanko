/**
 * 画像のリサイズタイプ
 */
export type ResizeType = 'fill' | 'contain' | 'cover';

/**
 * 画像フォーマットタイプ
 */
export type ImageFormat = 'webp' | 'jpeg' | 'png' | 'original';

/**
 * 画像サイズ定義
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 画像変換オプション
 */
export interface ImageTransformOptions {
  /**
   * リサイズ方法
   * @default 'fill'
   */
  resize?: ResizeType;

  /**
   * 画像フォーマット
   * @default 'webp'
   */
  format?: ImageFormat;

  /**
   * 品質 (0-100)
   * @default 80
   */
  quality?: number;
}

/**
 * Supabase Storage Transformations APIを使用して最適化された画像URLを生成します
 *
 * @param imageUrl - 元の画像URL
 * @param size - 画像サイズ (幅と高さ)
 * @param options - 変換オプション
 * @returns 最適化された画像URL
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  size: ImageSize,
  options: ImageTransformOptions = {}
): string {
  if (!imageUrl) return '';

  // デフォルト値の設定
  const { resize = 'fill', format = 'webp', quality = 80 } = options;

  // URLにパラメータを追加するためのセパレータ
  const separator = imageUrl.includes('?') ? '&' : '?';

  // 変換パラメータの構築
  let params = `width=${size.width}&height=${size.height}&resize=${resize}`;

  // format=originalの場合はフォーマット変換しない
  if (format !== 'original') {
    params += `&format=${format}`;
    // 品質パラメータの追加
    params += `&quality=${quality}`;
  }

  return `${imageUrl}${separator}${params}`;
}

/**
 * レスポンシブ画像のソースセットを生成します
 *
 * @param imageUrl - 元の画像URL
 * @param sizes - 通常サイズと2倍サイズの定義
 * @param options - 変換オプション
 * @returns srcSetの文字列
 */
export function generateSrcSet(
  imageUrl: string,
  sizes: { normal: ImageSize; retina: ImageSize },
  options: ImageTransformOptions = {}
): string {
  const normalUrl = getOptimizedImageUrl(imageUrl, sizes.normal, options);
  const retinaUrl = getOptimizedImageUrl(imageUrl, sizes.retina, options);

  return `${normalUrl} 1x, ${retinaUrl} 2x`;
}

/**
 * 画像要素の全プロパティを生成します
 *
 * @param imageUrl - 元の画像URL
 * @param size - 基本サイズ
 * @param alt - 代替テキスト
 * @param options - 変換オプション
 * @returns 画像要素のprops
 */
export function getImageProps(
  imageUrl: string,
  size: ImageSize,
  alt: string = '',
  options: ImageTransformOptions = {}
) {
  // 高解像度ディスプレイ用に2倍サイズも用意
  const retinaSize = {
    width: size.width * 2,
    height: size.height * 2,
  };

  return {
    src: getOptimizedImageUrl(imageUrl, size, options),
    srcSet: generateSrcSet(imageUrl, { normal: size, retina: retinaSize }, options),
    alt,
    width: size.width,
    height: size.height,
  };
}
