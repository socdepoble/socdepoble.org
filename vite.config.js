import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import consolaIaia from './tooling/vite/consola-iaia.mjs';
import wikiWatcher from './tooling/vite/wiki-watcher.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), '');
    const isCI = !!process.env.CI;
    const supabaseUrl = env.VITE_SUPABASE_URL || (isCI ? 'https://mock.supabase.co' : undefined);
    const anonKey = env.VITE_SUPABASE_ANON_KEY || (isCI ? 'mock-anon-key' : undefined);
    validatePublicCredentials(supabaseUrl, anonKey);
  }

  return {
    plugins: [
      react(),
      consolaIaia(),
      wikiWatcher({ arrel: __dirname }),
      {
        name: 'sdp-port-canonic',
        configResolved(config) {
          if (config.command === 'serve' && !config.isPreview &&
              (config.server.port !== 3340 || !config.server.strictPort)) {
            throw new Error('El servidor de desenvolupament usa exclusivament el port 3340 amb strictPort. Reutilitza http://localhost:3340.');
          }
        }
      }
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
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '_wiki_de_poble/**', 'tooling/**', 'tests/**/*.test.mjs']
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  }
  };
});
