import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import consolaIaia from './tooling/vite/consola-iaia.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  validatePublicCredentials(supabaseUrl, anonKey);

  return {
    plugins: [
      react(),
      consolaIaia()
    ],
  server: {
    host: true,
    port: 3340,
    strictPort: true,
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://*.socdepoble.org https://socdepoble.org https://*.sollutia.cat https://sollutia.cat https://*.sollutia.com http://localhost:*;"
    },
    watch: {
      ignored: ['**/.gemini/**', '**/scripts/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    /* En Node, lucide-react es resol pel `main` CJS. Forcem l'entrada ESM i
       la processem inline perquè vitest la transforme igual que el build.
       (Pre-260920 açò tapava un doble React amb preact/compat; ja no.) */
    alias: { 
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/lucide-react.mjs')
    },
    server: { deps: { inline: [/lucide-react/, /react/, /@testing-library/] } },
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '_wiki_de_poble/**', 'tooling/**']
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  }
  };
});
