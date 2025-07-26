# CAT LINK - AIエージェントガイド

## 言語設定

第一言語を日本語、第二言語を英語とします。

## プロジェクト概要

**CAT LINK**は、猫のプロフィールを作成・共有するためのWebアプリケーションです。React 18 + TypeScript + Supabaseを使用したモダンなフルスタックアプリケーションで、画像最適化、AI機能、ソーシャル機能を備えています。

## 技術スタック

### フロントエンド

- **React 18** - 最新のReact機能を活用
- **TypeScript** - 型安全性を重視
- **Vite** - 高速な開発環境
- **TailwindCSS** - ユーティリティファーストCSS
- **React Query (@tanstack/react-query)** - サーバー状態管理
- **React Router DOM** - クライアントサイドルーティング
- **Zustand** - 軽量な状態管理
- **React Hook Form** - フォーム管理
- **React Image Crop** - 画像編集機能
- **React Zoom Pan Pinch** - 画像ズーム機能

### バックエンド

- **Supabase** - BaaS（認証、データベース、ストレージ）
- **Edge Functions** - サーバーレス関数
- **Google Analytics API** - アクセス解析
- **Google Gemini API** - AI画像分析

### 開発環境

- **Docker** - コンテナ化
- **Docker Compose** - マルチコンテナ管理
- **Make** - タスク自動化

### テスト・品質管理

- **Vitest** - 高速なテストランナー
- **Testing Library** - コンポーネントテスト
- **ESLint** - コード品質管理
- **Prettier** - コードフォーマット

## アーキテクチャパターン

### ディレクトリ構造

```
src/
  ├── app/         # アプリケーション固有のロジック
  ├── components/  # 再利用可能なコンポーネント
  ├── context/     # Reactコンテキスト
  ├── hooks/       # カスタムフック
  ├── lib/         # ユーティリティ関数やAPI関連
  ├── pages/       # ページコンポーネント
  ├── store/       # 状態管理（Zustand）
  ├── test/        # テストユーティリティ
  ├── types/       # TypeScript型定義
  └── utils/       # 汎用ユーティリティ関数
```

### 状態管理パターン

- **Zustand** - グローバル状態（認証情報など）
- **React Query** - サーバー状態（APIデータ）
- **React Context** - UI状態（ヘッダー表示制御など）
- **Local State** - コンポーネント固有の状態

### データフロー

1. **認証**: Supabase Auth → Zustand Store
2. **データ取得**: React Query → Supabase
3. **画像処理**: クライアントサイド最適化 → Supabase Storage
4. **AI機能**: Edge Functions → Google Gemini API

## コーディング規約

### TypeScript

- **strict mode** を有効化
- **noUnusedLocals** と **noUnusedParameters** を有効化
- 型定義は `src/types/` に集約
- インターフェース名は PascalCase
- 型エイリアスは PascalCase

### React

- **関数コンポーネント** を基本とする
- **Hooks** を積極的に活用
- **Props** は TypeScript インターフェースで定義
- **Children** は `ReactNode` 型を使用

### コンポーネント設計

```typescript
interface ComponentProps {
  // 必須プロパティ
  requiredProp: string;
  // オプショナルプロパティ
  optionalProp?: number;
  // イベントハンドラー
  onAction?: (value: string) => void;
  // 子要素
  children?: ReactNode;
}

export default function Component({
  requiredProp,
  optionalProp,
  onAction,
  children,
}: ComponentProps) {
  // コンポーネント実装
}
```

### ファイル命名規則

- **コンポーネント**: PascalCase（例: `CatCard.tsx`）
- **フック**: camelCase + `use` プレフィックス（例: `useFavorites.ts`）
- **ユーティリティ**: camelCase（例: `calculateAge.ts`）
- **型定義**: camelCase（例: `index.ts`）
- **テスト**: `.test.ts` または `.test.tsx` サフィックス

### インポート順序

ESLintの `import/order` ルールに従い、以下の順序でインポート：

1. ビルトインモジュール
2. 外部ライブラリ
3. 内部モジュール
4. 親ディレクトリ
5. 兄弟ディレクトリ
6. インデックスファイル
7. オブジェクト
8. 型定義

## データベース設計

### 主要テーブル

- **profiles** - ユーザープロフィール
- **cats** - 猫のプロフィール
- **cat_photos** - 猫の写真
- **favorites** - お気に入り
- **news** - お知らせ
- **columns** - コラム記事
- **cache** - APIレスポンスキャッシュ

### RLS（Row Level Security）

- 全テーブルでRLSを有効化
- ユーザーは自分のデータのみ操作可能
- 公開データは誰でも閲覧可能
- 認証済みユーザーのみ管理機能利用可能

### インデックス戦略

- 主キーに自動インデックス
- 外部キーにインデックス
- 検索頻度の高いカラムにインデックス

## 画像処理システム

### 最適化戦略

- **WebP形式** を優先使用
- **レスポンシブ画像** 対応（1x, 2x）
- **遅延読み込み** 実装
- **段階的リサイズ** で品質維持

### アップロード前処理

```typescript
// Instagram推奨サイズに最適化
const optimalSize = calculateOptimalSize(width, height);
// 品質0.75でJPEG変換
const optimizedFile = await optimizeImageForUpload(file, {
  quality: 0.75,
  format: 'jpeg',
});
```

### Supabase Storage Transformations

- 動的リサイズ
- フォーマット変換
- 品質調整
- キャッシュ活用

## 認証・セキュリティ

### Supabase Auth

- **Email/Password** 認証
- **OAuth** 対応（必要に応じて）
- **セッション管理** 自動化
- **トークン自動更新**

### セキュリティ対策

- **RLS** によるデータアクセス制御
- **CORS** 設定
- **環境変数** による機密情報管理
- **入力値検証** 実装

## パフォーマンス最適化

### フロントエンド

- **コード分割** と遅延ロード
- **画像最適化** とWebP対応
- **React Query** によるキャッシュ
- **メモ化** による再レンダリング最適化

### バックエンド

- **Edge Functions** による高速レスポンス
- **データベースクエリ** 最適化
- **キャッシュ戦略** 実装
- **CDN** 活用

## テスト戦略

### テスト配置規則

```
src/
  ├── components/
  │   └── ComponentName/
  │       ├── __tests__/
  │       │   └── ComponentName.test.tsx
  │       └── index.tsx
  └── hooks/
      └── __tests__/
          └── useHookName.test.ts
```

### テスト種類

- **ユニットテスト** - 関数・フック
- **コンポーネントテスト** - UI動作
- **統合テスト** - API連携
- **E2Eテスト** - ユーザーフロー

### テストユーティリティ

- **MSW** - APIモック
- **Testing Library** - DOM操作
- **Vitest** - テストランナー
- **Jest DOM** - DOMマッチャー

## 開発ワークフロー

### 環境構築

```bash
# 開発環境起動
make up

# テスト実行
make test

# コード品質チェック
make lint
make format
```

### デプロイメント

```bash
# Edge Functions デプロイ
make deploy-ga-pageviews
make deploy-sitemap
make deploy-gemini
```

### データベース操作

```bash
# データベース復元
make db-restore
```

## AI機能統合

### Google Gemini API

- **画像分析** - 猫の気持ち推定
- **自然言語処理** - プロフィール生成
- **Edge Functions** での実行

### 実装パターン

```typescript
// Edge Function でのAI処理
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Image } }],
        },
      ],
    }),
  }
);
```

## エラーハンドリング

### フロントエンド

- **React Error Boundary** 実装
- **Toast通知** によるユーザーフィードバック
- **フォールバックUI** 提供
- **ログ出力** によるデバッグ支援

### バックエンド

- **Supabase** エラーハンドリング
- **Edge Functions** エラー処理
- **データベース** 制約違反処理
- **API** レスポンスエラー処理

## 監視・分析

### Google Analytics

- **ページビュー** トラッキング
- **ユーザー行動** 分析
- **パフォーマンス** 監視
- **カスタムイベント** 設定

### ログ管理

- **ブラウザコンソール** ログ
- **サーバーサイド** ログ
- **エラー** トラッキング
- **パフォーマンス** メトリクス

## アクセシビリティ

### WCAG準拠

- **セマンティックHTML** 使用
- **ARIA属性** 適切な設定
- **キーボードナビゲーション** 対応
- **スクリーンリーダー** 対応

### 実装例

```typescript
// アクセシブルなボタン
<button
  onClick={handleClick}
  aria-label="いいねボタン"
  aria-pressed={isLiked}
  className="accessible-button"
>
  <Heart className={isLiked ? 'filled' : 'outline'} />
</button>
```

## 国際化対応

### 日本語対応

- **日本語UI** 実装
- **日本語データ** 処理
- **日本語検索** 対応
- **日本語エラーメッセージ**

### 将来の拡張性

- **i18nライブラリ** 導入準備
- **多言語対応** 設計考慮
- **地域設定** 対応準備

## セキュリティチェックリスト

### フロントエンド

- [ ] 入力値検証
- [ ] XSS対策
- [ ] CSRF対策
- [ ] 機密情報の露出防止

### バックエンド

- [ ] SQLインジェクション対策
- [ ] 認証・認可
- [ ] データ暗号化
- [ ] ログセキュリティ

### インフラ

- [ ] HTTPS強制
- [ ] セキュリティヘッダー
- [ ] アクセス制御
- [ ] 監査ログ

## パフォーマンスチェックリスト

### フロントエンド

- [ ] 画像最適化
- [ ] コード分割
- [ ] キャッシュ戦略
- [ ] バンドルサイズ最適化

### バックエンド

- [ ] データベースクエリ最適化
- [ ] インデックス設定
- [ ] キャッシュ実装
- [ ] CDN活用

## 品質保証

### コード品質

- **ESLint** による静的解析
- **Prettier** によるフォーマット統一
- **TypeScript** による型チェック
- **テストカバレッジ** 測定

### レビュープロセス

- **プルリクエスト** 必須
- **コードレビュー** 実施
- **テスト実行** 必須
- **ドキュメント更新** 確認

### ブランチガイド
- 作業ブランチは main ブランチから作成する
- 作業ブランチ名は`{feat/fix/refactor/doc/chore}/{issue number}-{branch overview}`のフォーマットにする

### コミットガイド
- コミットメッセージは`{feat/fix/refactor/doc/chore}/{commit overview}`のフォーマットにする
- コミットのたびに`テスト実行`と`コード品質チェック`を実行して、エラーがあれば修正をして追加のコミットを行う

### プルリクエストガイド

- プルリクエストの内容によっては以下を修正して既存コードと記載内容に差分がないようにする
  - `AGENTS.md`、`README.md`
- PRのテンプレートは`.github/pull_request_template.md`を使用する。ただし必要に応じて拡張しても構わない。
- プルリクエストの向き先はmainブランチにする

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー** - 環境変数確認
2. **画像アップロード失敗** - ストレージ権限確認
3. **認証エラー** - セッション状態確認
4. **パフォーマンス問題** - クエリ最適化

### デバッグ手法

- **ブラウザ開発者ツール** 活用
- **Supabaseダッシュボード** 確認
- **ログ分析** 実施
- **パフォーマンス測定** 実行

---

このガイドは、CAT LINKプロジェクトの開発・保守・拡張を行うAIエージェントが、プロジェクトの文脈を理解し、一貫性のある高品質なコードを生成するための包括的なリファレンスです。
