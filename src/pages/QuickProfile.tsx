import { Camera, CheckCircle2, ImagePlus, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { useAuthModalStore } from '../components/Layout';
import { quickProfileAnalytics } from '../lib/quickProfileAnalytics';
import { defaultBackgroundColor, defaultTextColor } from '../utils/constants';
import { paths } from '../utils/paths';
import { absoluteUrl } from '../utils/url';

const PERSONALITY_TAGS = ['甘えん坊', '元気いっぱい', 'のんびり', 'ツンデレ', '食いしん坊'];

export default function QuickProfile() {
  const [name, setName] = useState('');
  const [catchphrase, setCatchphrase] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoSelected, setIsPhotoSelected] = useState(false);
  const [hasTrackedPreviewReady, setHasTrackedPreviewReady] = useState(false);
  const { setIsOpen: setAuthModalOpen, setMode: setAuthModalMode } = useAuthModalStore();

  const trimmedName = name.trim();
  const hasRequiredInputs = Boolean(trimmedName && photoUrl);
  const previewDescription = useMemo(() => {
    if (catchphrase.trim()) return catchphrase.trim();
    if (selectedTags.length > 0) return `${selectedTags.join('・')}な猫ちゃんです。`;
    return '写真と名前だけで、まずはプロフィールの完成イメージを確認できます。';
  }, [catchphrase, selectedTags]);

  useEffect(() => {
    quickProfileAnalytics.start();
  }, []);

  useEffect(() => {
    if (hasRequiredInputs && !hasTrackedPreviewReady) {
      quickProfileAnalytics.trackPreviewReady();
      setHasTrackedPreviewReady(true);
    }
  }, [hasRequiredInputs, hasTrackedPreviewReady]);

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoError(null);

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('画像ファイルを選択してください。');
      event.target.value = '';
      return;
    }

    setPhotoUrl(currentUrl => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return URL.createObjectURL(file);
    });

    if (!isPhotoSelected) {
      quickProfileAnalytics.trackPhotoSelected();
      setIsPhotoSelected(true);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(currentTags =>
      currentTags.includes(tag)
        ? currentTags.filter(currentTag => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const handleOpenRegister = () => {
    quickProfileAnalytics.trackAuthOpen('register');
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  return (
    <main className="bg-orange-50/50">
      <Helmet>
        <title>30秒で猫プロフィールをプレビュー | ねこプロフィール</title>
        <meta
          name="description"
          content="会員登録の前に、猫の写真と名前だけでプロフィールの完成イメージを30秒で確認できます。"
        />
        <meta property="og:title" content="30秒で猫プロフィールをプレビュー | ねこプロフィール" />
        <meta property="og:url" content={absoluteUrl(paths.quickProfile())} />
        <meta
          property="og:description"
          content="会員登録の前に、猫の写真と名前だけでプロフィールの完成イメージを30秒で確認できます。"
        />
        <link rel="canonical" href={absoluteUrl(paths.quickProfile())} />
      </Helmet>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:py-10">
        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-orange-700">30秒でプレビュー</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              写真と名前だけで、猫プロフィールの完成イメージを確認
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              登録前に見た目を試せます。プレビュー段階では、猫データや画像は公開領域へ保存されません。
            </p>
          </div>

          <div className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-orange-100 p-2 text-orange-700">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">まずは2項目だけ</h2>
                <p className="mt-1 text-sm text-gray-600">
                  写真と名前を入れると右側に即時反映されます。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-lg bg-white p-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="quick-photo">
                猫の写真 <span className="text-red-600">必須</span>
              </label>
              <label className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/70 px-4 py-6 text-center transition-colors hover:border-orange-300 hover:bg-orange-50">
                <ImagePlus className="h-8 w-8 text-orange-700" />
                <span className="mt-2 text-sm font-medium text-gray-800">写真を選択</span>
                <span className="mt-1 text-xs text-gray-500">
                  この時点ではアップロードされません
                </span>
                <input
                  id="quick-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>
              {!photoUrl && (
                <p className="mt-2 text-sm text-gray-600">プロフィール写真が未選択です。</p>
              )}
              {photoError && <p className="mt-2 text-sm text-red-600">{photoError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800" htmlFor="quick-name">
                名前 <span className="text-red-600">必須</span>
              </label>
              <input
                id="quick-name"
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="例: つくし"
                maxLength={30}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {!trimmedName && (
                <p className="mt-2 text-sm text-gray-600">名前を入力してください。</p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-800">性格タグ 任意</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PERSONALITY_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? 'border-orange-500 bg-orange-100 text-orange-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-800"
                htmlFor="quick-catchphrase"
              >
                ひとこと 任意
              </label>
              <input
                id="quick-catchphrase"
                type="text"
                value={catchphrase}
                onChange={event => setCatchphrase(event.target.value)}
                placeholder="例: 今日も窓辺をパトロール中"
                maxLength={80}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        </section>

        <section className="lg:sticky lg:top-20 lg:self-start" aria-label="プロフィールプレビュー">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">プロフィールプレビュー</p>
                <p className="text-xs text-gray-500">公開ページに近い見た目で確認できます</p>
              </div>
              {hasRequiredInputs && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  完成
                </span>
              )}
            </div>

            <div
              className="overflow-hidden rounded-lg border border-gray-100 px-5 py-8 text-center"
              style={{ backgroundColor: defaultBackgroundColor, color: defaultTextColor }}
            >
              <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`${trimmedName || '猫'}のプレビュー`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="h-10 w-10 text-gray-400" aria-hidden="true" />
                )}
              </div>

              <h2 className="mt-4 text-xl font-bold">{trimmedName || '猫ちゃんの名前'}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedTags.length > 0
                  ? selectedTags.join(' | ')
                  : '性格タグを選ぶとここに表示されます'}
              </p>
              <p className="mx-auto mt-4 max-w-sm whitespace-pre-line text-sm leading-6">
                {previewDescription}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50 p-4">
              {hasRequiredInputs ? (
                <>
                  <div className="flex items-start gap-2 text-sm text-orange-900">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>この内容をもとに、無料登録後ワンタップで公開へ進めるようになります。</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenRegister}
                    className="mt-4 w-full rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    無料登録して公開へ進む
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-700">
                  写真と名前を入れると、公開前の完成イメージを確認できます。
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
