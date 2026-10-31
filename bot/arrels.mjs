// bot/arrels.mjs — Resolució ÚNICA de rutes del bot (Pedra Seca)
// [FIX-1] Abans hi havia TRES estratègies de rutes en conflicte:
//   · index.mjs:     IAIA_STATE_ROOT || __dirname          (auth, runtime)
//   · cervell.mjs:   process.cwd() i process.cwd()/..      (perfil vs wiki+índex!)
//   · episodica.mjs: process.cwd()/var/baileys-runtime     (memòries personals)
// Amb el layout real del repositori (.agents i _wiki_de_poble germanes de bot/),
// era IMPOSSIBLE que PROFILE i WIKI resolgueren bé alhora: si cwd = arrel del
// repo, la wiki es buscava FORA del repo i el Genotip "no es trobava" en silenci.
// Ara: una sola funció, determinista, independent del cwd de systemd.

import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Arrel del PROJECTE: env explícit, o puja des de bot/ fins trobar package.json + _wiki_de_poble. */
export function arrelProjecte() {
  if (process.env.IAIA_PROJECT_ROOT) return resolve(process.env.IAIA_PROJECT_ROOT);
  let dir = __dirname;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, '_wiki_de_poble'))) {
      return dir;
    }
    const pare = dirname(dir);
    if (pare === dir) break;
    dir = pare;
  }
  // Fail-loud: millor petar a l'arrancada que servir una IAIA sense cervell.
  throw new Error(
    "[ARRELS] No trobe l'arrel del projecte (package.json + _wiki_de_poble). " +
    'Defineix IAIA_PROJECT_ROOT o revisa el desplegament.',
  );
}

/** Arrel d'ESTAT mutable (auth, runtime, memòries): separable del codi via env. */
export function arrelEstat() {
  return process.env.IAIA_STATE_ROOT ? resolve(process.env.IAIA_STATE_ROOT) : __dirname;
}

const ROOT = arrelProjecte();
const STATE = arrelEstat();

export const RUTES = Object.freeze({
  projecte: ROOT,
  wiki: join(ROOT, '_wiki_de_poble'),
  genotip: join(ROOT, '_wiki_de_poble', '00_SER_Brain_Identitat', '02_GENOTIP.md'),
  perfil: join(ROOT, '.agents', 'identity', 'PROFILE.md'),
  persona: join(ROOT, 'bot', 'persona', 'IAIA_MARIA.md'), // nou fitxer de persona WhatsApp
  // P1-24 (C1645-03) · L'índex que escriu el productor (npm run rag:build →
  // tooling/wiki/core/build_rag_index.mjs): només la Wiki pública. Abans era
  // <estat>/rag_index.json, que ningú no generava, i el bot no arrencava.
  indexRag: join(ROOT, 'public', 'rag-index.json'),
  estat: STATE,
  auth: join(STATE, '.iaia_auth'),
  runtime: join(STATE, 'var', 'baileys-runtime'),
  memoria: join(STATE, 'var', 'memoria'), // [FIX-7] separada del runtime de Baileys
});
