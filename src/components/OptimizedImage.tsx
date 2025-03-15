import { ReactElement } from 'react';

import { 
  ImageSize, 
  ImageTransformOptions, 
  getOptimizedImageUrl
} from '../utils/imageUtils';

interface OptimizedImageProps {
  /** 元の画像URL */
  src: string;
  /** 代替テキスト */
  alt: string;
  /** 画像の幅 */
  width: number;
  /** 画像の高さ */
  height: number;
  /** CSSクラス */
  className?: string;
  /** 読み込み戦略 */
  loading?: 'lazy' | 'eager';
  /** デコード方式 */
  decoding?: 'async' | 'sync' | 'auto';
  /** 画像変換オプション */
  options?: ImageTransformOptions;
}

/**
 * 最適化された画像コンポーネント
 * WebP形式を優先し、フォールバックとして元の形式を提供します
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  decoding = 'async',
  options = {
    resize: 'fill',
    format: 'webp',
    quality: 80
  }
}: OptimizedImageProps): ReactElement {
  if (!src) {
    return (
      <div 
        className={`bg-gray-200 ${className}`} 
        style={{ width: `${width}px`, height: `${height}px` }}
        role="img"
        aria-label={alt}
      />
    );
  }
  
  const size: ImageSize = { width, height };
  const retinaSize: ImageSize = { width: width * 2, height: height * 2 };
  
  // WebP版のURL
  const webpOptions = { ...options, format: 'webp' as const };
  const webpSrc = getOptimizedImageUrl(src, size, webpOptions);
  const webpSrcSet = `${webpSrc} 1x, ${getOptimizedImageUrl(src, retinaSize, webpOptions)} 2x`;
  
  // 元のフォーマット（フォールバック用）
  const originalOptions = { ...options, format: 'original' as const };
  const originalSrc = getOptimizedImageUrl(src, size, originalOptions);
  const originalSrcSet = `${originalSrc} 1x, ${getOptimizedImageUrl(src, retinaSize, originalOptions)} 2x`;
  
  return (
    <picture>
      <source srcSet={webpSrcSet} type="image/webp" />
      <img
        src={originalSrc}
        srcSet={originalSrcSet}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        decoding={decoding}
      />
    </picture>
  );
} 