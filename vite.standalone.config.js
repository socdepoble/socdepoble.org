import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isCI = !!process.env.CI;
  const supabaseUrl = env.VITE_SUPABASE_URL || (isCI ? 'https://mock.supabase.co' : undefined);
  const anonKey = env.VITE_SUPABASE_ANON_KEY || (isCI ? 'mock-anon-key' : undefined);
  validatePublicCredentials(supabaseUrl, anonKey);

  return {
    plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2022',
    /* Alineat amb tooling/gates/tractor-build-previ.mjs. emptyOutDir:false
       perquè build:seo ja hi ha escrit seo-routes.json. */
    outDir: 'wordpress-plugin/dist',
    emptyOutDir: false,
    manifest: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/embed.jsx'),
      name: 'SocDePoble',
      formats: ['iife'],
      fileName: () => 'soc-de-poble.standalone.js'
    }
  }
  };
});
