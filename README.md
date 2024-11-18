## 開発環境のセットアップ

### 前提条件

- Docker と Docker Compose がインストールされていること
- Supabase のアカウントを持っていること

### 環境構築手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-username/nyankomu.git
cd nyankomu
```

1. **環境変数の設定**
```bash
cp .env.example .env
```
`.env`ファイルを開き、必要な環境変数を設定してください：
- `VITE_SUPABASE_URL`: SupabaseのプロジェクトURL
- `VITE_SUPABASE_ANON_KEY`: Supabaseの匿名キー

1. **Dockerコンテナのビルドと起動**
```bash
docker-compose build
docker-compose up -d
```

1. **データベースのセットアップ**
- Supabaseのダッシュボードにログイン
- SQL Editorを開く
- `20240224_reset_schema.sql`の内容をコピーして実行

1. **アプリケーションの確認**
- ブラウザで http://localhost:5173 にアクセス
- アプリケーションが正常に動作することを確認

## 開発コマンド

```bash
# コンテナの起動
docker-compose up -d

# コンテナのログ確認
docker-compose logs -f

# コンテナの停止
docker-compose down

# コンテナ内でコマンドを実行
docker-compose exec web npm run <command>
```

## 技術スタック

- Vite + React + TypeScript
- TailwindCSS
- React Query (@tanstack/react-query)
- Supabase
- React Router DOM

## プロジェクト構成

```
src/
  ├── components/  # 再利用可能なコンポーネント
  ├── pages/       # ページコンポーネント
  ├── lib/         # ユーティリティ関数やAPI関連
  ├── store/       # 状態管理
  └── types/       # TypeScript型定義
```

## トラブルシューティング

### アプリケーションにアクセスできない場合
- Dockerコンテナが正常に起動しているか確認
```bash
docker-compose ps
```

### データベース周りで問題が発生した場合
- Supabaseのダッシュボードでデータベースの状態を確認
- SQLエディタで`20240224_reset_schema.sql`を再実行(データが消えるので注意)
