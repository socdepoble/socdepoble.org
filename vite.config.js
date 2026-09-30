import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import consolaIaia from './tooling/vite/consola-iaia.mjs';
import wikiWatcher from './tooling/vite/wiki-watcher.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';

/* calendari-7 (T5, 260930) · Les proves corren amb la zona del poble. Sense,
   la CI (UTC) no passa mai per un dia de 23 o 25 hores i les proves del canvi
   d'hora queden verdes sense provar-lo. Es fixa ací, al procés principal i
   abans de crear els workers, que l'hereten. Un TZ explícit de qui les
   executa es respecta (TZ=America/Los_Angeles npx vitest run). Ni el servidor
   de desenvolupament ni el build la toquen. */
if (process.env.VITEST) process.env.TZ ??= 'Europe/Madrid';

export default defineConfig(({ command, mode, isPreview }) => {
  /* T13 · Empremta del PROCÉS `vite` de desenvolupament (src/config/dataMode.js).
     Una per procés: els reinicis que Vite fa sol (canvis a este fitxer, a les seues
     dependències de tooling/ o a .env) la conserven; un `npm run dev` nou en porta
     una altra. Ni en build, ni en preview, ni en vitest (que també avalua este
     fitxer com a `serve`) existix: l'elecció de mode hi dura, i les proves que
     la necessiten la fixen amb vi.stubEnv. Canviar VITE_DATA_MODE a .env també
     és començar de nou: Vite es reinicia sol i ací es nota; un canvi que no el
     toca conserva l'empremta. */
  if (command === 'serve' && !isPreview && !process.env.VITEST) {
    const dades = loadEnv(mode, process.cwd(), 'VITE_DATA_MODE').VITE_DATA_MODE ?? '';
    if (process.env.SDP_DADES_DEV !== dades || !process.env.VITE_SDP_SERVIDOR_DEV) {
      process.env.SDP_DADES_DEV = dades;
      process.env.VITE_SDP_SERVIDOR_DEV = `dev-${process.pid}-${Date.now().toString(36)}`;
    }
  }
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
    },
    /* host:true obri el servidor a la xarxa local, i Vite servix qualsevol fitxer
       de l'arrel: el 260929 servia la clau del Reflex (.sdp-reflex/secret.key)
       amb un 200. L'estat local i les sessions d'eines no es servixen mai. La
       llista repetix els valors per defecte de Vite, perquè no depenguen de si
       Vite fusiona o substituïx la del projecte. */
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem}', '**/.git/**',
        '**/.sdp-reflex/**', '**/.sdp-paperera/**', '**/.immunitari/**',
        '**/.iaia_auth/**', '**/.wwebjs_auth/**', '**/.wwebjs_cache/**',
        '**/.claude/**', '**/.codex/**', '**/.snapshots/**', '**/.wiki-safety/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    // Evita saturar transformacions i imports del catàleg amb un worker per CPU.
    maxWorkers: 2,
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
