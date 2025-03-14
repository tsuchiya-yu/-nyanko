import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // 環境変数の読み込み
  const env = loadEnv(mode, process.cwd(), '');
  
  return defineConfig({
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    define: {
      'process.env': env,
    },
    server: {
      port: 5173,
    },
    // HTMLファイル内の%ENV_VAR%を置換
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        return filename;
      },
    },
  });
};
