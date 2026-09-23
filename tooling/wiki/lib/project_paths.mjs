/**
 * project_paths.mjs — Camins canònics de la Wiki.
 *
 * REFACTOR 260830: ADAPTADOR, JA NO DESCOBRIDOR
 * ─────────────────────────────────────────────
 * Aquest mòdul tenia el seu propi `discoverProjectRoot()` amb un contracte
 * estructural paral·lel de quatre fitxers i dos directoris, tots obligatoris.
 * Entre els obligatoris hi havia `_wiki_de_poble`, que segons la mateixa
 * doctrina del projecte és **un repositori separat**. Resultat: en un clon
 * sense la Wiki, `matches.length` era 0 i el mòdul llançava en temps d'import:
 *
 *     Error: Arrel de projecte no canònica: se n'han trobat 0; s'esperava
 *     exactament una.
 *         at discoverProjectRoot (project_paths.mjs:62:11)
 *
 * Un stack trace cru, en carregar el mòdul, que tombava `tractor-escriptori.mjs`
 * i tot el que en depenia. A més era una de les tres definicions incompatibles
 * d'"arrel" que convivien al repositori.
 *
 * Ara el descobriment viu només a `tooling/lib/arrel.mjs`. Aquest fitxer manté
 * la seua API pública intacta —cap consumidor s'ha de tocar— però delega.
 *
 * `tooling/gates/tractor-arrel.mjs` (llei A1) impedix que torne a divergir.
 */

import path from 'node:path';
import { arrelSegura, dins as dinsDeLArrel, CAMINS } from '../../lib/arrel.mjs';

/* ═══════════════════════ Arrel ═══════════════════════ */

/**
 * Es manté exportada per compatibilitat: hi ha crides existents.
 * El paràmetre `start` s'ignora — el custodi ja resol des d'on cal i mai
 * depén del `cwd`. Es documenta perquè ningú pense que encara té efecte.
 *
 * @returns {string} arrel absoluta i canònica
 * @throws {ErrorArrel} amb `informe()` llegible, mai un stack trace cru
 */
export function discoverProjectRoot(/* start */) {
  return arrelSegura();
}

export const PROJECT_DIR = arrelSegura();

/* ═══════════════════════ Camins de la Wiki ═══════════════════════ */

/* NOTA PER A tractor-cognitiu.mjs (comprovació P5):
   la línia següent es manté amb la forma `path.join(PROJECT_DIR, '_wiki_de_poble')`
   perquè eixa porta la busca literalment per a detectar si l'arrel del RAG
   exclou `.agents/skills`. Si algun dia es canvia la forma d'aquesta línia,
   cal actualitzar també la comprovació P5. */
export const WIKI_DIR = path.join(PROJECT_DIR, '_wiki_de_poble');

export const TOOLING_WIKI_DIR = path.join(PROJECT_DIR, 'tooling', 'wiki');
export const WIKI_BASELINE_FILE = path.join(TOOLING_WIKI_DIR, 'wiki-baseline.lock.json');

/* ═══════════════════════ L'Escriptori ═══════════════════════ */

/*
 * L'ESCRIPTORI ÉS L'ÚNICA DESTINACIÓ DE TREBALL ACTIU (AGENTS.md §3).
 * Cap eina escriu fora d'ací sense una raó declarada. `resolDins()` de baix
 * és la barrera mecànica que ho fa complir.
 */
export const ESCRIPTORI_DIR = path.join(WIKI_DIR, CAMINS.escriptori.split('/').slice(1).join('/'));
export const EN_CURS_FILE = path.join(ESCRIPTORI_DIR, '00_EN_CURS.md');
export const INDEX_ESCRIPTORI_FILE = path.join(ESCRIPTORI_DIR, '00_index_escriptori.md');
export const ARXIU_DIR = path.join(WIKI_DIR, '04_ARXIU_Documents_Historics');

/* ═══════════════════════ El cervell ═══════════════════════ */

export const AGENTS_DIR = path.join(PROJECT_DIR, CAMINS.agents);
export const SKILLS_DIR = path.join(PROJECT_DIR, CAMINS.skills);
export const BASELINE_MAQUINARI_FILE = path.join(AGENTS_DIR, 'BASELINE.md');

/* ═══════════════════════ Fitxers de deute ═══════════════════════ */

export const DEUTE_PEDRA_SECA_FILE = path.join(PROJECT_DIR, '.agents/deute/.pedra-seca-deute.json');
export const DEUTE_DISSENY_FILE = path.join(PROJECT_DIR, '.agents/deute/.design-guard-deute.json');
export const DEUTE_VOCABULARI_FILE = path.join(PROJECT_DIR, '.agents/deute/.vocabulari-deute.json');
export const DEUTE_RUTES_FILE = path.join(PROJECT_DIR, '.agents/deute/.rutes-deute.json');

/* ═══════════════════════ Contenció ═══════════════════════ */

/**
 * Resol `cami` dins de `base` i falla si se n'escapa un cop resolts els
 * symlinks. És la Canonada: cap eina escriu fora del que declara.
 *
 * @param {string} base directori contenidor (absolut)
 * @param {string} cami ruta relativa o absoluta a resoldre
 * @returns {string} ruta absoluta garantida dins de `base`
 * @throws {Error} si s'escapa
 */
export function resolDins(base, cami) {
  const abs = dinsDeLArrel(base, cami);
  if (!abs) {
    throw new Error(
      `[canonada] "${cami}" queda fora de "${base}". `
      + "Cap eina escriu fora del que declara (AGENTS.md §3).",
    );
  }
  return abs;
}

/** Variant per a l'Escriptori, que és el cas d'ús habitual. */
export const resolEscriptori = (cami) => resolDins(ESCRIPTORI_DIR, cami);
