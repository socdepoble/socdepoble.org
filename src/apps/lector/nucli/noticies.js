/**
 * Lector de notícies · què es veu a cada carpeta i quantes en queden per
 * llegir (nucli pur: «ara» el passa qui crida).
 *
 *   carpeta   'hui'      les notícies de les últimes 24 hores
 *             'despres'  «Per a després», en l'ordre en què es van desar
 *             <id>       una categoria del poble
 * Només compten les fonts que la persona seguix; «Per a després» guarda el
 * que es va desar encara que la font s'haja deixat de seguir.
 *
 *   articlesDeCarpeta({ fonts, articles, estat, carpeta, fontId, ara }) → [resum] | null
 *   fontsDeCarpeta({ fonts, estat, carpeta })                         → [font]
 *   comptadorsCarpetes({ categories, fonts, articles, estat, ara })   → Map(carpeta → n)
 *   comptadorsFonts({ fonts, articles, estat, carpeta, ara })         → { total, perFont: Map }
 * Els comptadors són de no llegides; a «Per a després», de desades.
 */
import { seguix } from './estat.js';
import { msDeData } from './dates.js';

export const HUI = 'hui';
export const DESPRES = 'despres';
export const CARPETES_FIXES = Object.freeze([HUI, DESPRES]);
export const FINESTRA_HUI = 24 * 60 * 60 * 1000;

/* Les dates són ISO UTC canòniques (model.js): es poden comparar com a text. */
const perData = (a, b) => {
  const da = a.data || '';
  const db = b.data || '';
  if (da === db) return 0;
  return da < db ? 1 : -1;
};

/** De la més nova a la més vella; les que no tenen data, al final. */
export const ordenaPerData = (articles) => [...articles].sort(perData);

export function esDeHui(article, ara) {
  const ms = msDeData(article?.data);
  return ms !== null && Number.isFinite(ara) && ms >= ara - FINESTRA_HUI;
}

/** Les fonts que la persona veu en una carpeta (null si la carpeta no existix). */
export function fontsDeCarpeta({ fonts = [], categories = null, estat, carpeta }) {
  const seguides = fonts.filter((font) => seguix(estat, font.id));
  if (CARPETES_FIXES.includes(carpeta)) return seguides;
  if (Array.isArray(categories) && !categories.some((categoria) => categoria.id === carpeta)) return null;
  return seguides.filter((font) => font.categoriaId === carpeta);
}

/** Les notícies d'una carpeta (i, si es diu, d'una font), o null si la carpeta no existix. */
export function articlesDeCarpeta({ fonts = [], categories = null, articles = [], estat, carpeta, fontId = null, ara }) {
  let llista;
  if (carpeta === DESPRES) {
    const vives = new Map(articles.map((article) => [article.id, article]));
    llista = estat.despres.map((desat) => vives.get(desat.id) || desat);
  } else {
    const delaCarpeta = fontsDeCarpeta({ fonts, categories, estat, carpeta });
    if (!delaCarpeta) return null;
    const ids = new Set(delaCarpeta.map((font) => font.id));
    llista = ordenaPerData(articles.filter((article) => ids.has(article.fontId) && (carpeta !== HUI || esDeHui(article, ara))));
  }
  return fontId ? llista.filter((article) => article.fontId === fontId) : llista;
}

export function comptadorsCarpetes({ categories = [], fonts = [], articles = [], estat, ara }) {
  const llegits = new Set(estat.llegits);
  const noLlegides = (carpeta) => (articlesDeCarpeta({ fonts, categories, articles, estat, carpeta, ara }) || [])
    .filter((article) => !llegits.has(article.id)).length;
  const comptes = new Map([[HUI, noLlegides(HUI)], [DESPRES, estat.despres.length]]);
  for (const categoria of categories) comptes.set(categoria.id, noLlegides(categoria.id));
  return comptes;
}

export function comptadorsFonts({ fonts = [], categories = null, articles = [], estat, carpeta, ara }) {
  const llegits = new Set(estat.llegits);
  const perFont = new Map();
  let total = 0;
  for (const article of articlesDeCarpeta({ fonts, categories, articles, estat, carpeta, ara }) || []) {
    if (carpeta !== DESPRES && llegits.has(article.id)) continue;
    perFont.set(article.fontId, (perFont.get(article.fontId) || 0) + 1);
    total += 1;
  }
  return { total, perFont };
}
