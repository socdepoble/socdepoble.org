/**
 * emojiPintable.js — P1-06 · Quins emojis del catàleg sap pintar este
 * navegador. Les graelles (GraellaEmojis i el calaix del xat) no n'ensenyen
 * cap que es veuria trencat o que després es refusaria.
 *
 * Dues capes, totes dues sense xarxa i sense desar res:
 *   1. `reconeix` (per defecte emojiSol, utils/emoji.js): les dades d'Unicode
 *      del motor de JavaScript. És el mateix criteri que refusa un emoji
 *      triat (Safari 16 porta les d'Unicode 14), de manera que el que es veu
 *      es pot triar.
 *   2. `potPintar`: el tipus de lletra. El motor pot conéixer un punt de codi
 *      que el tipus de lletra d'emojis encara no porta (el quadre buit, el
 *      «tofu»), o una seqüència (to de pell, ZWJ, bandera) que es pinta en
 *      dos glifs. Es mesura l'amplada amb el canvas (measureText): un emoji
 *      pintable és UN glif de l'amplada d'un emoji antic (😀). Cap lectura de
 *      píxels (getImageData): no demana cap permís als navegadors que
 *      protegixen contra l'empremta, i el test de color tomba símbols vàlids
 *      com ♀️ (banc de Chrome, 261030).
 *
 * El detector es comprova a si mateix abans de servir: si el tofu o un parell
 * partit mesuren com un emoji (un canvas mut, una mesura amb soroll, un
 * sistema sense tipus de lletra d'emojis), no hi ha detector i només mana la
 * capa 1. Sense canvas (jsdom, un treballador), tampoc.
 */
import { emojiSol } from './emoji.js';

/* Emoji 1.0: tot sistema amb emojis el pinta. */
export const EMOJI_DE_REFERENCIA = '\u{1F600}';
/* Un no-caràcter: cap tipus de lletra no el porta, sempre és tofu. */
const TOFU_DE_REFERENCIA = '\u{1FFFD}';
/* Una seqüència que no és RGI: sempre es pinta en dos glifs. */
const PARELL_PARTIT = '\u{1F600}‍\u{1F600}';
/* Tolerància de l'amplada d'un glif d'emoji respecte del de referència. */
const MARGE = 0.25;
const CAP = Object.freeze([]);

/**
 * Un detector a partir d'una funció de mesura (text) => amplada, o null si
 * la mesura no permet distingir un emoji d'un tofu o d'un parell partit.
 * Memoritza cada glif: el catàleg sencer (3.972) es mesura una sola vegada.
 */
export function creaDetectorDePintat(mesura) {
  if (typeof mesura !== 'function') return null;
  let referencia;
  let tofu;
  let partit;
  try {
    referencia = mesura(EMOJI_DE_REFERENCIA);
    tofu = mesura(TOFU_DE_REFERENCIA);
    partit = mesura(PARELL_PARTIT);
  } catch {
    return null;
  }
  if (!Number.isFinite(referencia) || referencia <= 0) return null;
  const unGlif = (ample) => Number.isFinite(ample) && Math.abs(ample - referencia) <= referencia * MARGE;
  if (unGlif(tofu) || unGlif(partit)) return null;
  const memoria = new Map();
  return (glif) => {
    let pinta = memoria.get(glif);
    if (pinta === undefined) {
      /* Una mesura que falla no amaga res: en el dubte, es mostra. */
      try { pinta = unGlif(mesura(glif)); } catch { pinta = true; }
      memoria.set(glif, pinta);
    }
    return pinta;
  };
}

/* La mesura del canvas del document, o null. jsdom no implementa el canvas
   (getContext torna null i ho avisa a la consola): allí no es prova. */
function mesuraDelCanvas() {
  const doc = globalThis.document;
  if (typeof doc?.createElement !== 'function' || /jsdom/i.test(globalThis.navigator?.userAgent ?? '')) return null;
  try {
    const context = doc.createElement('canvas').getContext('2d');
    if (typeof context?.measureText !== 'function') return null;
    context.font = '32px sans-serif';
    return (text) => context.measureText(text).width;
  } catch {
    return null;
  }
}

let perDefecte;
/** El detector d'esta pàgina (un per sessió, creat la primera vegada), o null. */
export function detectorDePintat() {
  if (perDefecte === undefined) perDefecte = creaDetectorDePintat(mesuraDelCanvas());
  return perDefecte;
}

/**
 * Els grups del catàleg ({ id, nom, emojis: [[codi, glif, nom]] }) amb només
 * els emojis que el navegador reconeix i sap pintar; sense els grups buits.
 * `potPintar` null (o cap detector) deixa només la capa 1.
 */
export function emojisPintables(grups, { reconeix = emojiSol, potPintar = detectorDePintat() } = {}) {
  const pinta = typeof potPintar === 'function' ? potPintar : null;
  return (Array.isArray(grups) ? grups : CAP)
    .map((grup) => ({ ...grup, emojis: (grup?.emojis ?? CAP).filter(([, glif]) => Boolean(reconeix(glif)) && (!pinta || pinta(glif))) }))
    .filter((grup) => grup.emojis.length);
}
