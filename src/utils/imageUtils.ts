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
 * Instagramの推奨サイズ定義
 */
export const INSTAGRAM_SIZES = {
  /** 正方形 1:1 */
  SQUARE: {
    width: 1080,
    height: 1080,
    aspectRatio: 1
  },
  /** 縦長 4:5 */
  PORTRAIT: {
    width: 1080,
    height: 1350,
    aspectRatio: 4/5
  },
  /** 横長 1.91:1 */
  LANDSCAPE: {
    width: 1080,
    height: 566,
    aspectRatio: 1.91
  }
};

/**
 * 画像の最適なリサイズサイズを計算します
 * @param originalWidth 元の画像の幅
 * @param originalHeight 元の画像の高さ
 * @returns 最適なリサイズ後のサイズ
 */
export function calculateOptimalSize(originalWidth: number, originalHeight: number): ImageSize {
  const aspectRatio = originalWidth / originalHeight;
  
  // 縦長の画像
  if (aspectRatio < 1) {
    // 極端に縦長の場合は4:5にリサイズ
    if (aspectRatio <= 0.8) {
      return {
        width: Math.round(INSTAGRAM_SIZES.PORTRAIT.height * aspectRatio),
        height: INSTAGRAM_SIZES.PORTRAIT.height
      };
    }
    // それ以外は正方形に合わせる
    return {
      width: Math.round(INSTAGRAM_SIZES.SQUARE.height * aspectRatio),
      height: INSTAGRAM_SIZES.SQUARE.height
    };
  }
  // 正方形に近い画像
  else if (aspectRatio >= 1 && aspectRatio <= 1.5) {
    return {
      width: INSTAGRAM_SIZES.SQUARE.width,
      height: Math.round(INSTAGRAM_SIZES.SQUARE.width / aspectRatio)
    };
  }
  // 横長の画像
  else {
    return {
      width: INSTAGRAM_SIZES.LANDSCAPE.width,
      height: Math.round(INSTAGRAM_SIZES.LANDSCAPE.width / aspectRatio)
    };
  }
}

/**
 * 画像をアップロード前に最適化します
 * - サイズをInstagramの推奨サイズに調整
 * - 画質を0.75に設定
 * - JPEGフォーマットに変換
 * 
 * @param file 元の画像ファイル
 * @param options 追加のオプション
 * @returns 最適化された画像のFile Promise
 */
export function optimizeImageForUpload(file: File, options: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageFormat;
} = {}): Promise<File> {
  return new Promise((resolve, reject) => {
    // デフォルト値の設定
    const quality = options.quality || 0.75;
    const format = options.format || 'jpeg';
    
    const img = new Image();
    const reader = new FileReader();
    
    // 画像の読み込みを最適化
    img.decoding = 'async';
    img.loading = 'eager'; // 優先的に読み込む
    
    reader.onload = async (e) => {
      if (!e.target?.result) {
        reject(new Error('画像の読み込みに失敗しました'));
        return;
      }
      
      try {
        // 画像の非同期デコード
        img.src = e.target.result as string;
        
        // 画像の読み込みと非同期デコードを並列実行
        await Promise.all([
          new Promise<void>((resolve) => {
            img.onload = () => resolve();
          }),
          img.decode()
        ]);
        
        // 最適なサイズを計算
        const optimalSize = calculateOptimalSize(img.width, img.height);
        
        // キャンバスの作成
        const canvas = document.createElement('canvas');
        
        // 元のサイズが最適サイズより小さい場合は、元のサイズを使用
        canvas.width = img.width <= optimalSize.width ? img.width : optimalSize.width;
        canvas.height = img.height <= optimalSize.height ? img.height : optimalSize.height;
        
        const ctx = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: false,
          desynchronized: true // GPUアクセラレーションを有効化
        });
        
        if (!ctx) {
          throw new Error('Canvas contextの取得に失敗しました');
        }
        
        // 背景を白で塗りつぶし
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 画像の描画（品質とパフォーマンスのバランスを調整）
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        
        // 大きな画像の場合は段階的にリサイズ
        if (img.width > optimalSize.width * 2 || img.height > optimalSize.height * 2) {
          // 段階的なリサイズのステップ数を計算
          const steps = Math.min(2, Math.floor(Math.log2(Math.max(
            img.width / optimalSize.width,
            img.height / optimalSize.height
          ))));
          
          let currentWidth = img.width;
          let currentHeight = img.height;
          let currentImage: HTMLImageElement | HTMLCanvasElement = img;
          
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d', { 
            alpha: false,
            desynchronized: true
          });
          
          for (let i = 0; i < steps; i++) {
            currentWidth = Math.max(currentWidth / 2, optimalSize.width);
            currentHeight = Math.max(currentHeight / 2, optimalSize.height);
            
            tempCanvas.width = currentWidth;
            tempCanvas.height = currentHeight;
            
            if (tempCtx) {
              tempCtx.imageSmoothingEnabled = true;
              tempCtx.imageSmoothingQuality = 'medium';
              tempCtx.drawImage(currentImage, 0, 0, currentWidth, currentHeight);
              currentImage = tempCanvas;
            }
          }
          
          // 最終サイズに描画
          ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        } else {
          // 小さな画像は直接描画
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // 画像のエクスポート
        const mimeType = `image/${format}`;
        
        const blob = await new Promise<Blob | null>((resolveBlob) => {
          canvas.toBlob(
            (result) => resolveBlob(result),
            mimeType,
            quality
          );
        });
        
        if (!blob) {
          throw new Error('Blobの生成に失敗しました');
        }
        
        // 元のファイル名を維持しつつ、拡張子を変更
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '.' + format;
        
        // 新しいFileオブジェクトを作成
        const optimizedFile = new File([blob], fileName, {
          type: mimeType,
          lastModified: new Date().getTime()
        });
        
        resolve(optimizedFile);
      } catch (error) {
        console.error('画像最適化エラー:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader エラー:', error);
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
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
