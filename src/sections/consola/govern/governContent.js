/**
 * governContent.js — les dues vies d'entrada de la matriu del Govern del
 * Mestre, sense React.
 *
 *  (a) El servidor de desenvolupament: GET /__iaia/govern.json, llegit amb
 *      useFontDev (../useFontDev.js), igual que consola.json i el Mapa. La
 *      servix el connector (tooling/vite/consola-iaia.mjs), que la compila
 *      en cada petició des del Llibre Mestre i el HEAD
 *      (tooling/brain/fonts-govern.mjs; ordre del Mestre del 30-10-2026, B2).
 *      Decisió del Mestre (31-10-2026) · Al build web es llig la instantània
 *      sanejada que n'emet el build (../fontsConsola.js); en un paquet sense
 *      instantània no es demana. Una resposta 404 o que no siga JSON (un
 *      servidor sense el connector) és absència, no un error: la Consola diu
 *      que encara no hi ha cap matriu connectada i no n'inventa cap. Si el
 *      Llibre no es pot compilar, el connector respon 500 amb un JSON
 *      { schema, codi, error }, i el text del compilador és l'error que es
 *      pinta (carregaGovern).
 *      Gauntlet f4b (govern, «text-falta-un-pas-de-maria-ara-fals» i
 *      «error-json-ignorat») · Derogat: «Hui eixa ruta no existix […] les ha
 *      d'endollar MarIA», i l'error «Govern <codi> <text HTTP>» sense llegir el
 *      cos de la resposta.
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
import { errorDeLaInstantania, fontsLlegibles, opcionsDeLectura } from '../fontsConsola.js';

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

export const ESQUEMA_GOVERN = 'sdp.govern.v1';
/** Un text d'error del servidor de més d'açò no es pinta: no és el text fix del compilador. */
const MIDA_MAXIMA_ERROR = 400;

/**
 * L'error d'una resposta de govern.json que no és bona: el text fix del
 * compilador si el connector l'envia en JSON (sdp.govern.v1, { codi, error }),
 * amb el seu `codi`; si no, un text fix que diu el codi HTTP.
 */
export async function errorDeGovern(r) {
  let cos = null;
  if ((r.headers?.get?.('content-type') || '').includes('application/json')) {
    try { cos = await r.json(); } catch { cos = null; }
  }
  const missatge = cos && typeof cos === 'object' && cos.schema === ESQUEMA_GOVERN ? text(cos.error) : null;
  const dit = missatge !== null && missatge.length <= MIDA_MAXIMA_ERROR;
  const error = new Error(dit ? missatge : `El servidor de desenvolupament no ha pogut servir la matriu (codi ${r.status}).`);
  error.codi = dit ? text(cos.codi) : null;
  error.status = r.status;
  return error;
}

/** Una lectura de govern.json; null si no n'hi ha (fora de DEV, 404 o una resposta que no és JSON). */
export async function carregaGovern(signal) {
  /* Higiene d'amfitrió (ordre del Mestre, 261004) · Sense font en este paquet
     (WordPress, natiu), absència i cap petició a /__iaia/*.
     Decisió del Mestre (31-10-2026) · En viu a DEV i, al build web, la
     instantània sanejada (../fontsConsola.js). Si el build no l'ha poguda
     compilar, el sobre d'error porta el codi i el text fix del compilador. */
  if (!fontsLlegibles()) return null;
  const r = await fetch(FONT_GOVERN, opcionsDeLectura(signal));
  if (r.status === 404) return null;
  if (!r.ok) throw await errorDeGovern(r);
  // Sense middleware, el servidor pot tornar l'HTML de l'aplicació (200): és absència, no un error.
  if (!(r.headers?.get?.('content-type') || '').includes('application/json')) return null;
  const cos = await r.json();
  const fallada = errorDeLaInstantania(cos);
  if (fallada) throw fallada;
  return normalitzaGovern(cos);
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
