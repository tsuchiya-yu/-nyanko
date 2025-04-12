# CAT LINK

猫のプロフィールを作成・共有するためのWebアプリケーション「CAT LINK」です。

## 開発環境のセットアップ

### 前提条件

- Docker と Docker Compose がインストールされていること
- Supabase のアカウントを持っていること

### 環境構築手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/tsuchiya-yu/-nyanko.git
cd cat-link
```

2. **環境変数の設定**
```bash
cp .env.example .env
```
`.env`ファイルを開き、必要な環境変数を設定してください。

3. **開発環境の起動**
```bash
make build
make up
```

4. **データベースのセットアップ**
- Supabaseのダッシュボードにログイン
- SQL Editorを開く
- `schema.sql`の内容をコピーして実行

5. **アプリケーションの確認**
- ブラウザで http://localhost:5173 にアクセス
- アプリケーションが正常に動作することを確認

## 開発コマンド

### Makefileコマンド
開発環境を操作するためのMakefileコマンドが用意されています：

```bash
# 開発環境の操作
make build   # Dockerイメージのビルド
make up      # コンテナの起動
make down    # コンテナの停止
make logs    # コンテナのログ確認
make app     # コンテナ内でのbashシェル起動

# コード品質管理
make lint    # ESLintによるコード検証
make format  # Prettierによるコードフォーマット

# テスト実行
make test           # テストの実行
make test-coverage  # カバレッジレポート付きでテスト実行
```

### Supabase Edge Functions

Edge Functionsのデプロイ方法：

```bash
# Google Analytics Pageviews取得関数のデプロイ
make deploy-ga-pageviews

# サイトマップ生成関数のデプロイ
make deploy-sitemap

# 画像から猫の気持ちを生成する関数のデプロイ
make deploy-gemini
```

#### Edge Functionsの環境変数設定

Edge Functionsには以下の環境変数を設定してください：

1. **ga-pageviews**
```bash
# Supabaseダッシュボードで設定
GA_PROPERTY_ID=<GOOGLE_ANALYTICS_PROPERTY_ID>
GA_CREDENTIALS=<GOOGLE_SERVICE_ACCOUNT_JSON>
```

2. **generate-sitemap**
```bash
# Supabaseダッシュボードで設定
PROJECT_URL=<SUPABASE_PROJECT_URL>
SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
```

3. **image-to-gemini**
```bash
# Supabaseダッシュボードで設定
GEMINI_API_KEY=<GOOGLE_GEMINI_API_KEY>
```

## 技術スタック

### フロントエンド
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query (@tanstack/react-query)
- React Router DOM
- Zustand（状態管理）
- React Hook Form
- React Image Crop
- React Zoom Pan Pinch

### バックエンド
- Supabase
- Edge Functions (Vercel Edge)
- Google Analytics API
- Google Gemini API

### 開発環境
- Docker
- Docker Compose
- Make

### テスト・品質管理
- Vitest
- Testing Library
- ESLint
- Prettier

## プロジェクト構成

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

supabase/
  └── functions/   # Supabase Edge Functions
      ├── ga-pageviews/      # Google Analyticsページビュー取得
      ├── generate-sitemap/  # サイトマップ生成
      └── image-to-gemini/   # 画像生成AI連携
```

## 主な機能

- 猫のプロフィール登録・編集
- 猫の写真管理（画像のクロップ・ズーム機能付き）
- ユーザープロフィール管理
- 猫のプロフィール閲覧・共有（QRコード生成機能付き）
- Google Analyticsによるアクセス解析
- AIを活用した画像分析・生成

## トラブルシューティング

### 開発環境の問題
- コンテナの状態確認
```bash
make ps
```
- ログの確認
```bash
make logs
```
- 開発環境の再起動
```bash
make down
make up
```

### データベース周りで問題が発生した場合
- Supabaseのダッシュボードでデータベースの状態を確認
- SQLエディタで`schema.sql`を再実行（データが消えるので注意）

### テストの実行に関する問題
- `make test`で個別のテストを実行して問題を特定
- `coverage`ディレクトリを削除して`make test-coverage`を再実行
