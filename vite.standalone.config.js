import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (anonKey && typeof anonKey === 'string' && anonKey.includes('.')) {
  const parts = anonKey.split('.');
  if (parts.length >= 2) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.role === 'service_role') {
      throw new Error('ATURADOR CRÍTIC: Has posat la clau service_role a VITE_SUPABASE_ANON_KEY! Risc massiu d\'exfiltració de dades. Aturant build.');
    }
  }
}

export default defineConfig(() => ({
  plugins: [
    preact({
      jsxImportSource: 'react',
    })
  ],
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
  build: {
    target: 'es2015',
    /* Alineat amb tooling/gates/tractor-build-previ.mjs. emptyOutDir:false
       perquè build:seo ja hi ha escrit seo-routes.json. */
    outDir: 'wordpress-plugin/dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/main.jsx'),
      name: 'SocDePoble',
      formats: ['iife'],
      fileName: () => 'soc-de-poble.standalone.js'
    }
  }
}));
