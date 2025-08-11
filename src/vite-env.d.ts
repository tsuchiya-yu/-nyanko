/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  // 他の公開環境変数を必要に応じて追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

