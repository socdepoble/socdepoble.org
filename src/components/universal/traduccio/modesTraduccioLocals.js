/**
 * modesTraduccioLocals.js — R51 (P0-46 / IDEA-177) · El mode de traducció i
 * la llengua original que l'editor tria per a una nota: l'ESBORRANY es guarda
 * en este dispositiu (config/storage.js, clau 'traduccio.modes.v1') i la
 * PUBLICACIÓ els porta al seu payload.
 *
 * R51V-02 · Què viatja i què no, sense cap migració:
 *  · la nota (taula notes) no té cap camp que els puga portar: cap columna,
 *    i notes.fitxa descarta les claus que no coneix (coaccionaAmbit). Per
 *    això l'esborrany és d'este dispositiu;
 *  · en publicar o actualitzar al Mur (NotesContext · publishNote), viatgen
 *    al payload de section_submissions (jsonb, el mateix camí que
 *    publish_date): ambModeTraduccio els posa al document, i publishNote, si
 *    el document no en porta, conserva els de la fila ja publicada, validats
 *    (V2-04, traduccioDelPayload), i també les seues traduccions revisades.
 *    La targeta, el detall i el lector els lligen de la publicació
 *    (planTraduccioPublicacio.js);
 *  · una revisió editorial (la llavor i els actes: revisionsEditorials i
 *    l'RPC editorial, amb llista blanca) no els pot portar: es queden en
 *    este dispositiu, i la UI ho diu (editor.traduccio.nomesDispositiu). Per
 *    a app_content cal una migració (D-R51-7). El PAGE_COPY és de la Frontissa.
 *
 * Validat amb el contracte (translationMode.js): un mode o una llengua que no
 * hi són no es guarden. `curated_5_langs` tampoc: preparar traduccions no
 * activa el mode, i sense les cinc revisades no es pot triar.
 */
import { getVal, setVal } from '../../../config/storage.js';
import { TRANSLATION_LANGUAGES, TRANSLATION_MODES, normalizeTranslationMode } from './translationMode.js';

export const CLAU_MODES_TRADUCCIO = 'traduccio.modes.v1';
const VERSIO = 1;
/* Un sostre: el magatzem no creix sense fi amb notes que ja no hi són. */
export const MAXIM_DE_MODES = 200;
const MODES_LOCALS = Object.freeze(TRANSLATION_MODES.filter((mode) => mode !== 'curated_5_langs'));

const esRegistre = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const idValid = (id) => (typeof id === 'string' || typeof id === 'number') && String(id).trim() !== '';

function entradaValida(entrada) {
  if (!esRegistre(entrada)) return null;
  const { translation_mode: mode, source_language: llengua } = entrada;
  if (!MODES_LOCALS.includes(mode) || !TRANSLATION_LANGUAGES.includes(llengua)) return null;
  return Object.freeze({ translation_mode: mode, source_language: llengua });
}

function magatzem() {
  const desat = getVal(CLAU_MODES_TRADUCCIO);
  return esRegistre(desat) && desat.v === VERSIO && esRegistre(desat.modes) ? desat.modes : {};
}

/** El mode guardat per a una nota ({ translation_mode, source_language }), o null. */
export function llegeixModeTraduccio(id) {
  if (!idValid(id)) return null;
  const modes = magatzem();
  return Object.hasOwn(modes, String(id)) ? entradaValida(modes[String(id)]) : null;
}

/**
 * R51V-02 · El mode que porta una publicació (o la nota d'una publicació
 * oberta), si tots dos camps són del contracte ({ translation_mode,
 * source_language }); si no, null. Accepta també la revisada: és el que diu
 * la publicació, no una tria d'este dispositiu.
 */
export function modeDeLaPublicacio(publicacio) {
  if (!esRegistre(publicacio)) return null;
  const { translation_mode: mode, source_language: llengua } = publicacio;
  return TRANSLATION_MODES.includes(mode) && TRANSLATION_LANGUAGES.includes(llengua)
    ? Object.freeze({ translation_mode: mode, source_language: llengua })
    : null;
}

/**
 * R51V-02 · El document que es publica, amb el mode d'este dispositiu
 * (validat) si n'hi ha: NotesContext · publishNote el posa al payload. Sense,
 * el document tal qual (publishNote hi posa el de la fila ja publicada).
 */
export function ambModeTraduccio(doc) {
  const mode = esRegistre(doc) ? llegeixModeTraduccio(doc.id) : null;
  return mode ? { ...doc, ...mode } : doc;
}

/* V2-04 · El mode d'un registre, si el porta i el contracte l'accepta
   (normalizeTranslationMode); si no, null: un mode invàlid no es copia. */
function modeDelContracte(registre) {
  if (!esRegistre(registre) || registre.translation_mode === undefined || registre.translation_mode === null) return null;
  try {
    return normalizeTranslationMode(registre.translation_mode);
  } catch {
    return null;
  }
}

/**
 * V2-04 · Les claus de traducció que una publicació s'emporta al payload en
 * publicar-la o actualitzar-la (NotesContext · publishNote). L'upsert
 * reemplaça el payload sencer: el que no hi va es perd.
 *  · El mode i la llengua original: els de la nota (l'esborrany d'este
 *    dispositiu, ambModeTraduccio, o els de la publicació oberta,
 *    notaDeLaPublicacio) i, si no en porta cap de vàlid, els de la fila ja
 *    publicada. Tots dos passen per normalizeTranslationMode: un mode
 *    invàlid no es copia (ni la seua llengua). Una llengua que no és de les
 *    cinc tampoc viatja (el renderer en farà un error explícit, com abans).
 *  · Les traduccions (`translations`): les de la fila ja publicada o, si la
 *    fila no és a la llista carregada, les que la nota en va copiar en obrir-la
 *    (notaDeLaPublicacio). Tal qual, sense tocar-ne cap entrada: republicar
 *    una revisada (curated_5_langs) les conserva, revisades, i el renderer
 *    les torna a validar amb el contracte (planTraduccioPublicacio.js).
 *    Canviar el mode no les esborra: preparar-les no activa res.
 * Sense res de tot això, {} (el payload de sempre).
 */
export function traduccioDelPayload(nota, fila = null) {
  const font = modeDelContracte(nota) ? nota : modeDelContracte(fila) ? fila : null;
  const translations = esRegistre(fila?.translations) ? fila.translations
    : esRegistre(nota?.translations) ? nota.translations : null;
  return {
    ...(font ? { translation_mode: modeDelContracte(font) } : null),
    ...(font && TRANSLATION_LANGUAGES.includes(font.source_language) ? { source_language: font.source_language } : null),
    ...(translations ? { translations } : null)
  };
}

/** Guarda el mode d'una nota en este dispositiu. Torna true només si ha quedat escrit. */
export function desaModeTraduccio(id, entrada) {
  const valida = entradaValida(entrada);
  if (!idValid(id) || !valida) return false;
  const modes = { ...magatzem() };
  delete modes[String(id)];
  modes[String(id)] = valida;
  const claus = Object.keys(modes);
  for (const vella of claus.slice(0, Math.max(0, claus.length - MAXIM_DE_MODES))) delete modes[vella];
  return setVal(CLAU_MODES_TRADUCCIO, { v: VERSIO, modes }) === true;
}
