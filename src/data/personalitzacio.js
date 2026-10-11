/**
 * personalitzacio.js — La taxonomia personalitzable del poble, pura (sense
 * React ni port de dades).
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 2; brainstorming 261009_2005
 * §2-§4, F2) · La superadmin desa a app_content (clau 'taxonomia', capacitat
 * 'personalitzacio' del contracte) una forma tancada:
 *
 *   { v: 1,
 *     pagines:    { [clau de SYSTEM_PAGES]: { labels: [{ text, className }] } },
 *     categories: [text],      // categories de sèrie que s'afigen al Bloc
 *     etiquetes:  [text] }     // etiquetes de sèrie que s'afigen al Bloc
 *
 * Ací viuen la validació (validaTaxonomia), la fusió amb el pageCopy del
 * contingut core (aplicaPersonalitzacio) i les unions amb els valors de
 * sèrie del Bloc de Notes (categoriesBase, etiquetesBase).
 *
 * LLEI DEL PÍXEL · Sense personalització (null, buida o d'una forma que no
 * és la d'ací) cada funció torna EXACTAMENT el que rebia (===): el pageCopy
 * de sempre i les llistes de sèrie de sempre. Res no canvia fins que la
 * superadmin desa alguna cosa.
 *
 * CATEGORIES_BASE i ETIQUETES_BASE viuen ací (abans, a
 * sections/notes/classificacioBloc.js, que ara les re-exporta) perquè la
 * capa de dades no importe de les seccions.
 */
import { SYSTEM_PAGES } from '../config/systemPages.js';

/** Categories que sempre existixen al Bloc, encara que cap nota les use. */
export const CATEGORIES_BASE = Object.freeze(['Sistema']);
/** Etiquetes que sempre existixen al Bloc, encara que cap nota les use. */
export const ETIQUETES_BASE = Object.freeze(['Productivitat', 'Tutorial']);

/** El conjunt tancat de classes d'etiqueta (modules.css, «Sistema de Badges Universals»). */
export const CLASSES_ETIQUETA = Object.freeze([
  'sdp-badge-buit', 'sdp-badge-system', 'sdp-badge-accent', 'sdp-badge-category', 'sdp-badge-tag', 'sdp-badge-neutral'
]);
/** La versió de la forma que entén este mòdul. */
export const VERSIO_TAXONOMIA = 1;
/** Un text d'etiqueta o de categoria: d'1 a 40 caràcters, sense espais als extrems. */
export const MAX_TEXT = 40;

const CLAUS_DE_PAGINA = Object.freeze(SYSTEM_PAGES.map((pagina) => pagina.key));
const CLASSES = new Set(CLASSES_ETIQUETA);

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const textValid = (valor) => { const net = textNet(valor); return net.length >= 1 && net.length <= MAX_TEXT; };

/* La forma mínima perquè aplicaPersonalitzacio s'hi fixe: objecte, v: 1 i, si
   hi són, `pagines` objecte i `categories` / `etiquetes` llistes. Les
   etiquetes dolentes d'una pàgina es descarten una per una (no invaliden la
   taxonomia sencera); validaTaxonomia sí que les diu. */
function formaValida(taxonomia) {
  if (!esObjecte(taxonomia) || taxonomia.v !== VERSIO_TAXONOMIA) return false;
  if (taxonomia.pagines !== undefined && !esObjecte(taxonomia.pagines)) return false;
  if (taxonomia.categories !== undefined && !Array.isArray(taxonomia.categories)) return false;
  if (taxonomia.etiquetes !== undefined && !Array.isArray(taxonomia.etiquetes)) return false;
  return true;
}

/* Una etiqueta neta ({ text, className }) o null si s'ha de descartar. */
function etiquetaNeta(label) {
  if (!esObjecte(label)) return null;
  const text = textNet(label.text);
  if (!text || !CLASSES.has(label.className)) return null;
  return { text, className: label.className };
}

/**
 * Els defectes d'una taxonomia, en valencià i amb la ruta de cada un; [] si
 * és vàlida. Una taxonomia vàlida té `v: 1`, només claus de pàgina de
 * SYSTEM_PAGES, etiquetes amb text d'1 a 40 caràcters i classe del conjunt
 * tancat, i categories i etiquetes de sèrie amb text d'1 a 40 caràcters. Pura.
 */
export function validaTaxonomia(payload) {
  if (!esObjecte(payload)) return ['La taxonomia ha de ser un objecte.'];
  const errors = [];
  if (payload.v !== VERSIO_TAXONOMIA) errors.push(`La versió de la forma ha de ser ${VERSIO_TAXONOMIA} (v).`);
  if (payload.pagines !== undefined) {
    if (!esObjecte(payload.pagines)) errors.push('«pagines» ha de ser un objecte amb una entrada per pàgina.');
    else {
      for (const [clau, pagina] of Object.entries(payload.pagines)) {
        if (!CLAUS_DE_PAGINA.includes(clau)) { errors.push(`La pàgina «${clau}» no existix (SYSTEM_PAGES).`); continue; }
        if (!esObjecte(pagina) || !Array.isArray(pagina.labels)) { errors.push(`La pàgina «${clau}» ha de portar una llista «labels».`); continue; }
        pagina.labels.forEach((label, i) => {
          if (!esObjecte(label)) { errors.push(`L’etiqueta ${i + 1} de «${clau}» ha de ser un objecte { text, className }.`); return; }
          if (!textValid(label.text)) errors.push(`L’etiqueta ${i + 1} de «${clau}» necessita un text d’1 a ${MAX_TEXT} caràcters.`);
          if (!CLASSES.has(label.className)) errors.push(`L’etiqueta ${i + 1} de «${clau}» té una classe fora del conjunt: ${JSON.stringify(label.className)}.`);
        });
      }
    }
  }
  for (const camp of ['categories', 'etiquetes']) {
    if (payload[camp] === undefined) continue;
    if (!Array.isArray(payload[camp])) { errors.push(`«${camp}» ha de ser una llista de textos.`); continue; }
    payload[camp].forEach((valor, i) => {
      if (!textValid(valor)) errors.push(`El valor ${i + 1} de «${camp}» necessita un text d’1 a ${MAX_TEXT} caràcters.`);
    });
  }
  return errors;
}

/**
 * El pageCopy amb les etiquetes de la taxonomia. Torna el MATEIX objecte
 * (===) si la taxonomia és null, no té la forma d'ací, no nomena cap pàgina o
 * cap de les que nomena és al pageCopy. Si no, un objecte nou on només
 * canvien les `labels` de les pàgines nomenades: cada etiqueta queda
 * { text, className } (una classe fora del conjunt o un text buit es
 * descarten), i la resta de la pàgina i la resta de pàgines són les mateixes
 * referències d'abans. Pura.
 */
export function aplicaPersonalitzacio(pageCopy, taxonomia) {
  if (!esObjecte(pageCopy) || !formaValida(taxonomia) || !esObjecte(taxonomia.pagines)) return pageCopy;
  const canvis = Object.entries(taxonomia.pagines)
    .filter(([clau, pagina]) => CLAUS_DE_PAGINA.includes(clau) && esObjecte(pageCopy[clau]) && esObjecte(pagina) && Array.isArray(pagina.labels));
  if (!canvis.length) return pageCopy;
  const nou = { ...pageCopy };
  for (const [clau, pagina] of canvis) {
    nou[clau] = { ...pageCopy[clau], labels: pagina.labels.map(etiquetaNeta).filter(Boolean) };
  }
  return nou;
}

/* La base ∪ els textos vàlids de la taxonomia, sense repetits i amb la base
   davant; la base mateixa (===) si la taxonomia no n'afig cap. */
function unioAmbBase(base, taxonomia, camp) {
  if (!formaValida(taxonomia) || !Array.isArray(taxonomia[camp])) return base;
  const extres = taxonomia[camp].map(textNet).filter((text) => textValid(text) && !base.includes(text));
  if (!extres.length) return base;
  return [...base, ...new Set(extres)];
}

/** CATEGORIES_BASE ∪ les categories de sèrie de la taxonomia (CATEGORIES_BASE mateixa si no n'hi ha). */
export function categoriesBase(taxonomia) {
  return unioAmbBase(CATEGORIES_BASE, taxonomia, 'categories');
}

/** ETIQUETES_BASE ∪ les etiquetes de sèrie de la taxonomia (ETIQUETES_BASE mateixa si no n'hi ha). */
export function etiquetesBase(taxonomia) {
  return unioAmbBase(ETIQUETES_BASE, taxonomia, 'etiquetes');
}
