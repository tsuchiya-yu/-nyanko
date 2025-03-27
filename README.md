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
`.env`ファイルを開き、必要な環境変数を設定してください：

1. **Dockerコンテナのビルドと起動**
```bash
docker compose build
docker compose up -d
```
または、Makefileを使用：
```bash
make build
make up
```

1. **データベースのセットアップ**
- Supabaseのダッシュボードにログイン
- SQL Editorを開く
- `schema.sql`の内容をコピーして実行

1. **アプリケーションの確認**
- ブラウザで http://localhost:5173 にアクセス
- アプリケーションが正常に動作することを確認

## 開発コマンド

### Dockerコマンド
```bash
# コンテナの起動
docker compose up -d

# コンテナのログ確認
docker compose logs -f

# コンテナの停止
docker compose down

# コンテナ内でコマンドを実行
docker compose exec web npm run <command>
```

### Makefileコマンド
より簡単に開発環境を操作するためのMakefileコマンドが用意されています：

```bash
# コンテナのビルドと起動
make build   # Dockerイメージのビルド
make up      # コンテナの起動
make down    # コンテナの停止
make app     # コンテナ内でのbashシェル起動

# コード品質管理
make lint    # ESLintによるコード検証と自動修正
make format  # Prettierによるコードフォーマット

# テスト実行
make test           # テストの実行
make test-coverage  # カバレッジレポート付きでテスト実行

# Supabase Functions
make deploy-function  # image-to-gemini関数をデプロイ
```

### Supabase Edge Functions

Edge Functionsのデプロイ方法：

```bash
# サイトマップ生成関数のデプロイ
supabase functions deploy generate-sitemap

# 画像生成AIとの連携関数のデプロイ
supabase functions deploy image-to-gemini
```

#### Edge Functionsの環境変数設定

Edge Functionsには以下の環境変数を設定してください：

1. **generate-sitemap**
```bash
# Supabaseダッシュボードで設定
PROJECT_URL=<SUPABASE_PROJECT_URL>
SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
```

2. **image-to-gemini**
```bash
# Supabaseダッシュボードで設定
GEMINI_API_KEY=<GOOGLE_GEMINI_API_KEY>
```

## 技術スタック

- Vite + React + TypeScript
- TailwindCSS
- React Query (@tanstack/react-query)
- Supabase
- React Router DOM
- Zustand（状態管理）
- Vitest & Testing Library（テスト）

## プロジェクト構成

```
src/
  ├── components/  # 再利用可能なコンポーネント
  ├── pages/       # ページコンポーネント
  ├── lib/         # ユーティリティ関数やAPI関連
  ├── hooks/       # カスタムフック
  ├── context/     # Reactコンテキスト
  ├── store/       # 状態管理（Zustand）
  └── types/       # TypeScript型定義
```

## 主な機能

- 猫のプロフィール登録・編集
- 猫の写真管理
- ユーザープロフィール管理
- 猫のプロフィール閲覧・共有

## トラブルシューティング

### アプリケーションにアクセスできない場合
- Dockerコンテナが正常に起動しているか確認
```bash
docker compose ps
```

### データベース周りで問題が発生した場合
- Supabaseのダッシュボードでデータベースの状態を確認
- SQLエディタで`schema.sql`を再実行(データが消えるので注意)
