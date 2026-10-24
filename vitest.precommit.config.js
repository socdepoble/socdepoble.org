/**
 * vitest.precommit.config.js · T4 (261024_1800, P1-10) · La suite ràpida del
 * pre-commit (`npm run test:precommit`): les proves unitàries i de seguretat
 * essencials, en menys de 30 s (uns 21-23 s en el Mac del Mestre amb 4 workers,
 * 261024), perquè el hook (tooling/gates/git-staged.mjs, 120 s per pas) puga
 * passar sense --no-verify. NO substituïx la suite sencera (`npm test`, uns
 * 9 min): eixa continua sent la del tancament d'una Onada i la de qualsevol
 * canvi gran. `npm run test:precommit` hi afig després les proves de node de
 * la fortificació i dels secrets del build (tests/fortificacio.test.mjs,
 * tests/dist-secrets.test.mjs), menys d'1 s.
 *
 * Què hi entra (PRECOMMIT_INCLUDE), i per què:
 *   · supabase/**: les Edge Functions (l'anti-SSRF de noticies, la revocació
 *     d'Apple, la purga de fitxers) i les seues paritats;
 *   · src/data/**: el port de backend, els adaptadors (també els locals, que
 *     fan de servidor en seed/local) i les proves estàtiques de les
 *     migracions (*.migracio.test.js: RLS, permisos, quotes, codis);
 *   · la seguretat de la resta de src: els sanejadors (també l'HTML del
 *     Lector), les fronteres dels mòduls (frontera*.test.js), les
 *     *.seguretat.test.*, les guardes d'auth de les rutes (també la de la
 *     Consola), la detecció d'enllaços sospitosos del xat i els interns,
 *     l'entrada nativa i el social login, els orígens permesos (iframe,
 *     Sollutia, origen públic), la cripto del cofre i webauthn.
 * Una prova nova de seguretat fora d'estes carpetes entra amb el seu nom
 * (*.seguretat.test.js) o afegint-ne la ruta ací.
 *
 * Hereta tota la configuració de vite.config.js (alias, entorn jsdom, la zona
 * horària de les proves, l'exclude) i només canvia l'include, els workers i el
 * temps màxim de cada prova.
 */
import os from 'node:os';
import { defineConfig, mergeConfig } from 'vitest/config';
import configBase from './vite.config.js';

export const PRECOMMIT_INCLUDE = Object.freeze([
  'supabase/**/*.test.{js,mjs,ts}',
  'src/data/**/*.test.{js,jsx}',
  'src/utils/sanitize*.test.js',
  'src/**/*.seguretat.test.{js,jsx}',
  'src/**/frontera*.test.js',
  'src/app/guards/**/*.test.{js,jsx}',
  'src/sections/xat/components/EnllacSegur.test.jsx',
  'src/sections/xat/enllacos.test.js',
  'src/app/enllacosInterns.test.js',
  'src/apps/lector/nucli/{html,analitzador}.test.js',
  'src/natiu/entrada*.test.{js,jsx}',
  'src/config/{hostIframeAdapter,origenPublic,origensSollutia}.test.js',
  'src/sections/gestoria/cofre/nucli/cripto.test.js',
  'src/sections/tractors/nucli/webauthn.test.js'
]);

/* La suite principal en fa servir 2 (vite.config.js: no satura els imports del catàleg); esta, que
   és més menuda, en fa servir fins a 4, deixant sempre dos nuclis lliures (amb 6 no anava més de
   pressa, 261024, i una altra IA pot estar provant alhora). */
const WORKERS = Math.max(2, Math.min(4, (os.availableParallelism?.() ?? os.cpus().length) - 2));
/* Amb més workers, una prova de CPU (la cerca no quadràtica de gestor.test.js, que es dona 10 s ella
   mateixa) pot passar dels 5 s de Vitest per contenció: 15 s, cap assertió relaxada. */
const TEMPS_PER_PROVA_MS = 15000;

export default defineConfig(async (entorn) => {
  const base = typeof configBase === 'function' ? await configBase(entorn) : configBase;
  const config = mergeConfig(base, { test: { maxWorkers: WORKERS, testTimeout: TEMPS_PER_PROVA_MS } });
  /* L'include es posa a mà (mergeConfig concatenaria les llistes). */
  config.test.include = [...PRECOMMIT_INCLUDE];
  return config;
});
