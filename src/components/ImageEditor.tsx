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
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

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

  // ファイルからURLを生成
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // 画像がロードされたときの処理
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (imgRef.current) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height));
      setIsImageLoaded(true);
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

    console.log('Hammer.js initialized');

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

    console.log('Wheel event listener added');

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [isImageLoaded, scale]);

  // 編集した画像を保存
  const handleSave = () => {
    if (!imgRef.current || !completedCrop) return;

    const canvas = toCanvas(imgRef.current, completedCrop, scale);
    canvas.toBlob(blob => {
      if (blob) {
        onSave(blob);
      }
    });
  };

  // 画像の周りをクリックしたときにピンチモードを有効化するためのハンドラー
  const handleImageAreaClick = () => {
    // ダミーの操作 - これによりHammer.jsが正しく初期化される
    if (!isImageLoaded) {
      setIsImageLoaded(true);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">画像編集</h2>

      {imgSrc && (
        <div className="mb-4">
          <div className="mb-2 flex justify-end items-center">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setScale(Math.min(2, scale + 0.1))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setScale(1)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                }}
                onLoad={onImageLoad}
                className="max-w-full"
              />
            </ReactCrop>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700"
        >
          保存
        </button>
      </div>
    </div>
  );
}
