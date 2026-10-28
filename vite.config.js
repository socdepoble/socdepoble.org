import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import consolaIaia from './tooling/vite/consola-iaia.mjs';
import wikiWatcher from './tooling/vite/wiki-watcher.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { validatePublicCredentials } from './src/config/publicCredentials.js';

/* Notes (261025) · La memòria cau de Vite (el pre-empaquetat del servidor de
   desenvolupament i, davall de /vitest, la de les proves) porta l'empremta de
   l'arrel real: cap altra arrel no la pot compartir. El crash de Notes («useRef»
   nul dins de @tiptap/react, dos React a la pàgina, amb un sol React al disc)
   molt probablement va vindre d'ací (inferència forta, no demostrada): una
   còpia de treball amb node_modules enllaçat sencer a l'arbre viu va reescriure
   node_modules/.vite/deps davall del servidor del 3340.
     · Amb node_modules i node_modules/.vite propis, va a
       node_modules/.vite/<empremta>. El lloc per defecte (node_modules/.vite)
       queda per a qui arranque Vite amb un altre config, i ja no xafa el del
       servidor viu.
     · Si algun dels dos és un enllaç a una altra arrel (una còpia enllaçada),
       va a la carpeta temporal del sistema: la còpia no escriu res dins de
       l'arbre viu.
   Si torna «useRef» nul o «Invalid hook call» en desenvolupament: reiniciar amb
   `npm run dev -- --force` i recarregar la pàgina sencera. */
export function cacheDirPropi(arrel, tmp = os.tmpdir()) {
  const real = fs.realpathSync(arrel);
  const empremta = createHash('sha256').update(real).digest('hex').slice(0, 12);
  const propia = ['node_modules', path.join('node_modules', '.vite')].every((rel) => {
    try { return fs.realpathSync(path.join(real, rel)) === path.join(real, rel); }
    catch { return true; } // encara no existix: Vite la crearà dins de l'arrel
  });
  return propia
    ? path.join(real, 'node_modules', '.vite', empremta)
    : path.join(fs.realpathSync(tmp), 'sdp-vite-cache', empremta);
}

/* P1-35 (decisió 6 del Mestre, 261028) · El build del sistema: la data de
   compilació aammdd a Europe/Madrid, que src/config/versio.js llig de
   import.meta.env.SDP_BUILD. Amb SOURCE_DATE_EPOCH (build reproduïble), la
   d'eixe instant. La mateixa funció viu a vite.standalone.config.js (el natiu
   la importa d'allà); ací no s'importa per no fer d'eixe fitxer i de les seues
   dependències de src/ una dependència del servidor de desenvolupament, que es
   reiniciaria amb cada canvi. versio.test.js comprova que diuen el mateix. */
export function segellDeBuild(env = process.env) {
  const epoca = Number(env.SOURCE_DATE_EPOCH);
  const quan = env.SOURCE_DATE_EPOCH && Number.isFinite(epoca) ? new Date(epoca * 1000) : new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Madrid', year: '2-digit', month: '2-digit', day: '2-digit' })
    .formatToParts(quan).map(({ type, value }) => [type, value]));
  return `${parts.year}${parts.month}${parts.day}`;
}

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
        '**/.claude/**', '**/.codex/**', '**/.snapshots/**', '**/.wiki-safety/**',
        '**/.agents/**', '**/_wiki_de_poble/**'
      ]
    }
  },
  cacheDir: cacheDirPropi(__dirname),
  /* P1-35 · El segell del build només en compilar: el servidor de
     desenvolupament i les proves (que avaluen este fitxer com a `serve`) no el
     porten, i la versió s'hi llig «v1.0.0» sense build. */
  ...(command === 'build' ? { define: { 'import.meta.env.SDP_BUILD': JSON.stringify(segellDeBuild()) } } : {}),
  resolve: {
    /* Assegurança barata, la forma que recomana Vite: si un dia apareix una
       segona còpia de React a node_modules, totes les importacions van a la de
       l'arrel. Cap àlies de react o react-dom a un camí absolut: salta el mapa
       `exports`, i al navegador react-dom/server prendria la versió de Node,
       que peta en carregar. */
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  /* L'escàner de Vite ja les troba en arrancar. La llista evita que, si un dia
     falla, @tiptap/react es descobrisca a mitja sessió i force un
     re-empaquetat amb recàrrega. */
  optimizeDeps: {
    include: ['react', 'react-dom', '@tiptap/react', '@tiptap/core']
  },
  test: {
    /* Proves (261025) · El temps se n'anava en transformar i avaluar en cada
       fitxer el barril ESM de lucide-react (més de 1.700 mòduls d'icona), no en
       provar. Ara l'optimitzador de Vitest pre-empaqueta una vegada (dins de
       cacheDir) l'entrada que resol Node, la CJS del `main`, amb React extern; el
       build continua amb l'ESM, i totes dues ixen del mateix codi de lucide.
       Es manté en 2 workers: amb 4 i altres IA provant alhora, tres proves amb
       esperes de Testing Library d'1 s (PublicacioDetall.sistema,
       NotesSection.lector:294 i lector261024:193) cauen per contenció. Pujar-ne
       el nombre, com el pre-commit, vol primer endurir eixes esperes. */
    maxWorkers: 2,
    /* Una prova pesada pot passar dels 5 s de Vitest per contenció (261025:
       PublicacioDetall.sistema, 5,3 s amb la màquina a càrrega 39). 15 s, com el
       pre-commit; cap assertió relaxada. No cobrix les esperes de Testing Library
       (findBy/waitFor, 1 s): si una d'eixes cau amb la màquina carregada, es
       repetix la prova a soles abans de donar-la per regressió. */
    testTimeout: 15000,
    environment: 'jsdom',
    deps: {
      optimizer: {
        client: { enabled: true, include: ['lucide-react'] },
        ssr: { enabled: true, include: ['lucide-react'] }
      }
    },
    server: { deps: { inline: [/react/, /@testing-library/] } },
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '_wiki_de_poble/**', 'tooling/**', 'tests/**/*.test.mjs']
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  }
  };
});
