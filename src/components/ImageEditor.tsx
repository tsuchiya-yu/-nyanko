import Hammer from 'hammerjs';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Hammer.jsの型定義
type HammerManager = InstanceType<typeof Hammer>;

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // アスペクト比の制約（オプション）
}

// 画像をキャンバスに描画する関数
function toCanvas(image: HTMLImageElement, crop: PixelCrop, scale = 1) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: false,
    desynchronized: true
  });

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  try {
    // 元の画像のスケール比率を計算
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // 元の画像の解像度を維持するようにキャンバスサイズを設定
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    // ディスプレイのピクセル比を考慮
    const pixelRatio = window.devicePixelRatio || 1;
    if (pixelRatio > 1) {
      canvas.width *= pixelRatio;
      canvas.height *= pixelRatio;
    }

    // メモリ使用量を抑えるため、最大サイズを制限
    const MAX_SIZE = 4096; // モバイルデバイスでの制限を考慮
    if (canvas.width > MAX_SIZE || canvas.height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / canvas.width, MAX_SIZE / canvas.height);
      canvas.width = Math.floor(canvas.width * ratio);
      canvas.height = Math.floor(canvas.height * ratio);
    }

    // 背景を白で塗りつぶし
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 元の画像のクロップ領域の実際のピクセル座標を計算
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // 画像を描画（スケールファクターで調整）
    ctx.drawImage(
      image,
      sourceX / scale,
      sourceY / scale,
      sourceWidth / scale,
      sourceHeight / scale,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // 高品質のリサイズを行うための設定
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    return canvas;
  } catch (error) {
    console.error('Canvas処理エラー:', error);
    throw error;
  }
}

// 初期のクロップ状態を作成する関数
function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
  // アスペクト比を指定せず、自由なクロップを許可
  return {
    unit: '%' as const,
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  };
}

export default function ImageEditor({
  imageFile,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const hammerInstanceRef = useRef<HammerManager | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      // URLを解放
      if (imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
      // Hammer.jsのインスタンスを解放
      if (hammerInstanceRef.current) {
        hammerInstanceRef.current.destroy();
        hammerInstanceRef.current = null;
      }
    };
  }, [imgSrc]);

  // ファイルからURLを生成
  useEffect(() => {
    if (imageFile) {
      // 既存のURLを解放
      if (imgSrc) {
        setImgSrc('');
        // 少し待ってから新しい画像を設定
        setTimeout(() => {
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            const result = reader.result?.toString() || '';
            setImgSrc(result);
          });
          reader.readAsDataURL(imageFile);
        }, 100);
      } else {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const result = reader.result?.toString() || '';
          setImgSrc(result);
        });
        reader.readAsDataURL(imageFile);
      }
    }
  }, [imageFile]);

  // 画像がロードされたときの処理
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (imgRef.current) {
      const { width, height } = e.currentTarget;
      
      // Safari/iOSでの画像の安定性を向上
      e.currentTarget.style.display = 'block';
      e.currentTarget.decode().then(() => {
        setCrop(centerAspectCrop(width, height));
        setIsImageLoaded(true);
      }).catch(() => {
        console.error('画像のデコードに失敗しました');
      });
    }
  }

  // Hammer.jsを使ったピンチズーム処理 - useLayoutEffectを使用して先に実行
  useLayoutEffect(() => {
    if (!cropAreaRef.current || !imgRef.current || !isImageLoaded) return;

    // 既存のインスタンスがあれば破棄
    if (hammerInstanceRef.current) {
      hammerInstanceRef.current.destroy();
    }

    // Hammer.jsのマネージャーを作成
    const hammer = new Hammer.Manager(cropAreaRef.current);
    hammerInstanceRef.current = hammer;

    // ピンチジェスチャーの認識器を追加
    const pinch = new Hammer.Pinch();
    hammer.add(pinch);

    // ピンチイベントのハンドラー
    let baseScale = scale;

    hammer.on('pinchstart', () => {
      baseScale = scale;
    });

    hammer.on('pinch', e => {
      // 現在のスケールを計算
      const newScale = Math.max(0.5, Math.min(2, baseScale * e.scale));
      setScale(newScale);
    });

    return () => {
      if (hammerInstanceRef.current) {
        hammerInstanceRef.current.destroy();
        hammerInstanceRef.current = null;
      }
    };
  }, [isImageLoaded, scale]);

  // wheelイベント（トラックパッドのピンチジェスチャー）
  useEffect(() => {
    if (!cropAreaRef.current || !isImageLoaded) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newScale = Math.max(0.5, Math.min(2, scale + delta));
        setScale(newScale);
      }
    };

    const element = cropAreaRef.current;
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [isImageLoaded, scale]);

  // 編集した画像を保存
  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    setIsSaving(true);
    try {
      // 現在の画像を一時的に非表示
      if (imgRef.current) {
        imgRef.current.style.display = 'none';
      }

      const canvas = toCanvas(imgRef.current, completedCrop, scale);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (result) => {
            // Canvasを明示的に解放
            canvas.width = 0;
            canvas.height = 0;
            resolve(result);
          },
          'image/jpeg',
          0.75
        );
      });
      
      if (blob) {
        await onSave(blob);
      }
    } catch (error) {
      console.error('画像の保存中にエラーが発生しました:', error);
    } finally {
      // 画像を再表示
      if (imgRef.current) {
        imgRef.current.style.display = 'block';
      }
      setIsSaving(false);
    }
  };

  // 画像の周りをクリックしたときにピンチモードを有効化するためのハンドラー
  const handleImageAreaClick = () => {
    // ダミーの操作 - これによりHammer.jsが正しく初期化される
    if (!isImageLoaded) {
      setIsImageLoaded(true);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg relative">
      {/* ローディングオーバーレイ */}
      {isSaving && (
        <div className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/90 rounded-lg p-4 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-10 h-10 border-4 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-800 font-medium">画像を保存中...</p>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">画像編集</h2>

      {imgSrc && (
        <div className="mb-4">
          <div className="mb-2 flex justify-end items-center">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={isSaving}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setScale(Math.min(2, scale + 0.1))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={isSaving}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setScale(1)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={isSaving}
              >
                リセット
              </button>
            </div>
          </div>

          <div
            ref={cropAreaRef}
            className="touch-manipulation"
            style={{ touchAction: 'none' }}
            onClick={handleImageAreaClick}
          >
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              disabled={isSaving}
            >
              <img
                ref={imgRef}
                alt="編集中"
                src={imgSrc}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  transition: 'transform 0.1s',
                  willChange: 'transform',
                  display: 'block'
                }}
                onLoad={onImageLoad}
                className="max-w-full"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  );
}
