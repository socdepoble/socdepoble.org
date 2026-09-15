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

export default defineConfig({
  plugins: [
    preact()
  ],
  server: {
    host: true,
    port: 3340,
    strictPort: true,
    watch: {
      ignored: ['**/.gemini/**', '**/scripts/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/client': 'preact/compat/client',
      'react/jsx-runtime': 'preact/jsx-runtime',
      'react/jsx-dev-runtime': 'preact/jsx-dev-runtime'
    }
  },
  test: {
    environment: 'jsdom',
    /* En Node, lucide-react es resol pel `main` CJS, que fa require('react')
       i carrega el React real: l'àlies a preact/compat no hi arriba i pintar
       qualsevol icona peta (InvalidCharacterError). Forcem l'entrada ESM i
       la processem inline, com fa l'app en el build. */
    alias: { 
      'lucide-react': path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/lucide-react.mjs')
    },
    server: { deps: { inline: [/lucide-react/, /react/, /@testing-library/] } },
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '_wiki_de_poble/**']
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true
  }
});
