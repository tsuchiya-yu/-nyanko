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
function toCanvas(image: HTMLImageElement, crop: PixelCrop) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: false,
    desynchronized: true,
  });

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  try {
    // 画像の実際の表示サイズを取得（width/heightプロパティが設定されていない場合はclientWidth/Heightを使用）
    const displayWidth = image.width || image.clientWidth;
    const displayHeight = image.height || image.clientHeight;

    // 実際の画像サイズと表示サイズの比率を計算
    const widthRatio = image.naturalWidth / displayWidth;
    const heightRatio = image.naturalHeight / displayHeight;

    // クロップ座標を実際の画像サイズに変換
    const actualCrop = {
      x: Math.round(crop.x * widthRatio),
      y: Math.round(crop.y * heightRatio),
      width: Math.round(crop.width * widthRatio),
      height: Math.round(crop.height * heightRatio),
    };

    // キャンバスサイズを設定
    canvas.width = actualCrop.width;
    canvas.height = actualCrop.height;

    // メモリ使用量を抑えるため、最大サイズを制限
    const MAX_SIZE = 4096;
    if (canvas.width > MAX_SIZE || canvas.height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / canvas.width, MAX_SIZE / canvas.height);
      canvas.width = Math.floor(canvas.width * ratio);
      canvas.height = Math.floor(canvas.height * ratio);
    }

    // 背景を白で塗りつぶし
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画像を描画
    ctx.drawImage(
      image,
      actualCrop.x,
      actualCrop.y,
      actualCrop.width,
      actualCrop.height,
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

export default function ImageEditor({
  imageFile,
  onSave,
  onCancel,
  aspectRatio,
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

  // ファイルからURLを生成（imgSrcに依存しない形にリファクタ）
  useEffect(() => {
    if (!imageFile) return;

    // 一旦クリアしてから少し待って新しい画像を設定
    setImgSrc('');
    const timerId = window.setTimeout(() => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || '';
        setImgSrc(result);
      });
      reader.readAsDataURL(imageFile);
    }, 100);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [imageFile]);

  // 画像がロードされたときの処理
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = e.currentTarget;

      // Safari/iOSでの画像の安定性を向上
      e.currentTarget.style.display = 'block';
      e.currentTarget
        .decode()
        .then(() => {
          // 画像の初期表示サイズを設定
          // コンテナの実際の幅に基づいて計算
          const container = cropAreaRef.current;
          const maxDisplayWidth = container ? container.clientWidth : 528;
          const displayScale = maxDisplayWidth / naturalWidth;
          const displayWidth = Math.floor(naturalWidth * displayScale);
          const displayHeight = Math.floor(naturalHeight * displayScale);

          // imgRef.currentのスタイルを更新
          if (imgRef.current) {
            // 重要: widthとheightプロパティを実際の表示サイズに設定
            imgRef.current.width = displayWidth;
            imgRef.current.height = displayHeight;
            // 明示的にスタイルも設定
            imgRef.current.style.width = `${displayWidth}px`;
            imgRef.current.style.height = `${displayHeight}px`;
          }

          // アスペクト比に基づいて初期クロップ範囲を設定
          if (aspectRatio) {
            // アスペクト比に基づいてクロップを調整
            const aspectCrop = makeAspectCrop(
              {
                unit: '%',
                width: 90, // 少し余白を持たせる
              },
              aspectRatio,
              displayWidth,
              displayHeight
            );

            // センタリング
            const centeredCrop = centerCrop(aspectCrop, displayWidth, displayHeight);

            setCrop(centeredCrop);

            // ピクセル単位のクロップも設定
            if (centeredCrop.width && centeredCrop.height) {
              const pixelCrop: PixelCrop = {
                unit: 'px',
                x: Math.round(displayWidth * (centeredCrop.x / 100)),
                y: Math.round(displayHeight * (centeredCrop.y / 100)),
                width: Math.round(displayWidth * (centeredCrop.width / 100)),
                height: Math.round(displayHeight * (centeredCrop.height / 100)),
              };
              setCompletedCrop(pixelCrop);
            }
          } else {
            // アスペクト比の制約がない場合は全体を選択
            setCrop({
              unit: 'px',
              x: 0,
              y: 0,
              width: displayWidth,
              height: displayHeight,
            });

            setCompletedCrop({
              unit: 'px',
              x: 0,
              y: 0,
              width: displayWidth,
              height: displayHeight,
            });
          }

          setIsImageLoaded(true);
        })
        .catch(() => {
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

      const canvas = toCanvas(imgRef.current, completedCrop);
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(
          result => {
            // Canvasを明示的に解放
            canvas.width = 0;
            canvas.height = 0;
            resolve(result);
          },
          'image/jpeg',
          0.85 // 高画質設定
        );
      });

      if (blob) {
        await onSave(blob);
      } else {
        throw new Error('画像の生成に失敗しました');
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
              keepSelection
              aspect={aspectRatio}
              ruleOfThirds
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
                  display: 'block',
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
