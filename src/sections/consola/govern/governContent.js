/**
 * governContent.js — les dues vies d'entrada de la matriu del Govern del
 * Mestre, sense React.
 *
 *  (a) El servidor de desenvolupament: GET /__iaia/govern.json, llegit amb
 *      useFontDev (../useFontDev.js), igual que consola.json i el Mapa. Hui
 *      eixa ruta no existix: la font i la ruta del middleware
 *      (tooling/brain/fonts-govern.mjs i tooling/vite/consola-iaia.mjs) són
 *      zona de governança i les ha d'endollar MarIA. Mentrestant, una
 *      resposta 404 o que no siga JSON és absència, no un error: la Consola
 *      diu que encara no hi ha cap matriu connectada i no n'inventa cap.
 *  (b) Un fitxer que el Mestre obri des del seu ordinador (mcr.json o
 *      trasllat.json): es llig en este navegador i no es puja enlloc.
 *
 * Forma que el middleware ha de servir (sdp.govern.v1): { schema, generat,
 * head, mcr, trasllat, font }, on `mcr` i `trasllat` són els fitxers de Codex
 * tal qual (o null), `head`, el commit d'ara, i `font`, la carpeta d'on els
 * llig.
 * Revisió adversarial del carril F1 (correcció del camp «pla») · El pla de
 * les decisions del Mestre no el diu el servidor: el diu la matriu mateixa
 * (normalitzaMcr), perquè siga el mateix si el Mestre l'obri d'un fitxer
 * (l'única via d'ara) o si arriba per govern.json. Un `pla` que porte la
 * resposta no canvia res. Derogat: el `pla` de govern.json com a pla de la
 * matriu.
 */
import { instantISO, normalitzaMcr } from './matriuGovern.js';

export const FONT_GOVERN = '/__iaia/govern.json';
/** Un fitxer de més d'açò no és cap matriu: no es llig (la de Codex en fa uns 90 kB). */
export const MIDA_MAXIMA_FITXER = 5 * 1024 * 1024;

const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const instant = (iso) => {
  const t = instantISO(iso);
  return t === null ? null : new Date(t).toISOString();
};
const PATRO_COMMIT = /^[0-9a-f]{7,40}$/i;

/**
 * Un trasllat (trasllat.json o comprovacio-trasllat.json de Codex): els ids
 * que passen a la tanda següent. Llança si no porta la llista `ids`. Un id
 * repetit es diu; els que no són text es descarten i es compten.
 */
export function normalitzaTrasllat(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new Error('Este fitxer no és un trasllat: no és un objecte JSON.');
  if (!Array.isArray(brut.ids)) throw new Error('Este fitxer no és un trasllat: li falta la llista «ids».');
  const vistos = new Set();
  const duplicats = [];
  let descartats = 0;
  for (const v of brut.ids) {
    const id = text(v);
    if (id === null) { descartats += 1; continue; }
    if (vistos.has(id)) duplicats.push(id);
    else vistos.add(id);
  }
  return {
    at: instant(brut.at),
    font: text(brut.source),
    ids: [...vistos],
    duplicats,
    descartats,
    // comprovacio-trasllat.json declara el seu propi resultat: es diu, no es creu.
    declaraIgual: typeof brut.equal === 'boolean' ? brut.equal : null
  };
}

/**
 * Què és un fitxer obert pel Mestre, per la seua forma: 'trasllat' si porta
 * `ids`, 'matriu' si porta `requirements`; null si cap de les dues.
 */
export function tipusDeFitxer(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return null;
  if (Array.isArray(brut.ids)) return 'trasllat';
  if (Array.isArray(brut.requirements)) return 'matriu';
  return null;
}

/**
 * La resposta de govern.json, normalitzada: { generat, head, matriu,
 * trasllat, font }. `matriu` i `trasllat` són null si el servidor encara no
 * en té cap (o si el fitxer s'estava escrivint: el servidor torna null).
 * La matriu porta el seu propi pla (normalitzaMcr), el mateix que si
 * s'obrira d'un fitxer. Llança si la resposta no té la forma.
 */
export function normalitzaGovern(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new Error('Resposta de govern invàlida: no és un objecte.');
  const head = typeof brut.head === 'string' && PATRO_COMMIT.test(brut.head.trim()) ? brut.head.trim().toLowerCase() : null;
  const matriu = brut.mcr == null ? null : normalitzaMcr(brut.mcr);
  let trasllat = null;
  try {
    trasllat = brut.trasllat == null ? null : normalitzaTrasllat(brut.trasllat);
  } catch {
    trasllat = null;
  }
  return {
    generat: instant(brut.generat),
    head,
    matriu,
    trasllat,
    font: text(brut.font)
  };
}

/** Una lectura de govern.json; null si no n'hi ha (fora de DEV, 404 o una resposta que no és JSON). */
export async function carregaGovern(signal) {
  /* Higiene d'amfitrió (ordre del Mestre, 261004) · El middleware és només de
     DEV (apply: 'serve'): fora de DEV és absència, sense cap petició a /__iaia/*. */
  if (import.meta.env.DEV !== true) return null;
  const r = await fetch(FONT_GOVERN, { signal, cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Govern ${r.status} ${r.statusText}`);
  // Sense middleware, el servidor pot tornar l'HTML de l'aplicació (200): és absència, no un error.
  if (!(r.headers?.get?.('content-type') || '').includes('application/json')) return null;
  return normalitzaGovern(await r.json());
}

/* El text d'un File: Blob.text() i, si el navegador no el té, FileReader. */
function llegixText(fitxer) {
  if (typeof fitxer?.text === 'function') return fitxer.text();
  return new Promise((resol, rebutja) => {
    const lector = new FileReader();
    lector.onload = () => resol(String(lector.result ?? ''));
    lector.onerror = () => rebutja(lector.error ?? new Error('No s’ha pogut llegir el fitxer.'));
    lector.readAsText(fitxer);
  });
}

/**
 * Llig un fitxer obert pel Mestre, en este navegador i sense pujar-lo
 * enlloc: { tipus: 'matriu' | 'trasllat', nom, valor } amb el valor ja
 * normalitzat. Llança amb un missatge en paraules planes si no es pot.
 */
export async function llegixFitxerDeGovern(fitxer) {
  if (!fitxer) throw new Error('No s’ha triat cap fitxer.');
  if (Number.isFinite(fitxer.size) && fitxer.size > MIDA_MAXIMA_FITXER) {
    throw new Error('Este fitxer és massa gran per a ser una matriu de requeriments.');
  }
  let brut;
  try {
    brut = JSON.parse(await llegixText(fitxer));
  } catch {
    throw new Error('Este fitxer no és JSON: obri el mcr.json o el trasllat.json que deixa Codex.');
  }
  const tipus = tipusDeFitxer(brut);
  if (tipus === 'matriu') return { tipus, nom: text(fitxer.name), valor: normalitzaMcr(brut) };
  if (tipus === 'trasllat') return { tipus, nom: text(fitxer.name), valor: normalitzaTrasllat(brut) };
  throw new Error('Este fitxer no és ni una matriu (mcr.json) ni un trasllat (trasllat.json).');
}
