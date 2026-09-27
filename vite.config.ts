import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {satqueryVisionDevApi} from './server/vision/viteDevPlugin.js';

export default defineConfig(({mode}) => {
  // Server-only secrets (no VITE_ prefix) — read here for the dev API, never exposed to the client bundle.
  const serverEnv = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      cesium(),
      satqueryVisionDevApi({
        GEMINI_API_KEY: serverEnv.GEMINI_API_KEY,
        GEMINI_MODEL: serverEnv.GEMINI_MODEL,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: process.env.VITE_SPRING_BOOT_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
