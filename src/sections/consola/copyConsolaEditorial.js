/**
 * copyConsolaEditorial.js — IDEA-362 (v1.2.26 · CMS Pur 100 Anys).
 *
 * Separa el text editable de /consola (del CMS via CoreContentContext.pageCopy)
 * del motor JSX de ConsolaSection i IndexConsola. Sense dades editades al CMS,
 * conserva íntegra la llavor canònica de copyConsola() / paginesConsola() sense
 * alterar cap píxel ni cap test preexistent.
 */
import { copyConsola, paginaConsola, paginesConsola } from './consolaPagines.js';

const textNoBuit = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);

function entradaCmsConsola(pageCopy) {
  if (!pageCopy || typeof pageCopy !== 'object' || Array.isArray(pageCopy)) return null;
  if (!Object.hasOwn(pageCopy, 'consola')) return null;
  const entrada = pageCopy.consola;
  return entrada && typeof entrada === 'object' && !Array.isArray(entrada) ? entrada : null;
}

/**
 * Fusiona el copy editable del CMS (`pageCopy.consola`) sobre la llavor
 * canònica de `copyConsola()`, conservant qualsevol camp no editat.
 */
export function resolCopyConsolaEditorial(pageCopy) {
  const base = copyConsola();
  const cms = entradaCmsConsola(pageCopy);
  if (!cms) return base;
  return {
    ...base,
    title: textNoBuit(cms.title) ?? base.title,
    subtitle: textNoBuit(cms.subtitle) ?? base.subtitle,
    lead: textNoBuit(cms.lead) ?? base.lead,
    date: textNoBuit(cms.date) ?? base.date,
    pagines: Array.isArray(cms.pagines) && cms.pagines.length > 0 ? cms.pagines : base.pagines
  };
}

function mapaPaginesCms(cms) {
  if (!cms) return null;
  const mapa = new Map();
  if (Array.isArray(cms.pagines)) {
    for (const p of cms.pagines) {
      if (p && typeof p === 'object' && typeof p.id === 'string' && p.id.trim()) {
        mapa.set(p.id.trim(), p);
      }
    }
  }
  if (cms.paginesPerId && typeof cms.paginesPerId === 'object' && !Array.isArray(cms.paginesPerId)) {
    for (const [id, p] of Object.entries(cms.paginesPerId)) {
      if (p && typeof p === 'object') mapa.set(id, p);
    }
  }
  return mapa.size > 0 ? mapa : null;
}

/**
 * Resol una pàgina concreta de la Consola aplicant overrides editables del CMS
 * sobre el seu copy canònic. Torna `null` si l'id no correspon a cap pàgina.
 */
export function resolPaginaConsolaEditorial(id, pageCopy) {
  const base = paginaConsola(id);
  if (!base) return null;
  const mapa = mapaPaginesCms(entradaCmsConsola(pageCopy));
  const extra = mapa?.get(id);
  if (!extra) return base;
  return {
    ...base,
    title: textNoBuit(extra.title) ?? base.title,
    subtitle: textNoBuit(extra.subtitle) ?? base.subtitle,
    lead: textNoBuit(extra.lead) ?? base.lead
  };
}

/**
 * Llista ordenada de les 9 pàgines de la sala de màquines amb els textos
 * editables del CMS fusionats damunt la llavor canònica.
 */
export function resolPaginesConsolaEditorial(pageCopy) {
  const mapa = mapaPaginesCms(entradaCmsConsola(pageCopy));
  if (!mapa) return paginesConsola();
  return paginesConsola().map((base) => {
    const extra = mapa.get(base.id);
    if (!extra) return base;
    return {
      ...base,
      title: textNoBuit(extra.title) ?? base.title,
      subtitle: textNoBuit(extra.subtitle) ?? base.subtitle,
      lead: textNoBuit(extra.lead) ?? base.lead
    };
  });
}

/**
 * Textos editables del bloc editorial de l'Índex (`/consola`), si el CMS els
 * declara (`indexTitle`, `indexLead`, o sobreescriptures de `pagines`). Torna
 * `null` quan no hi ha cap edició activa.
 */
export function resolIndexEditorialConsola(pageCopy) {
  const cms = entradaCmsConsola(pageCopy);
  if (!cms) return null;
  const titol = textNoBuit(cms.indexTitle);
  const entradeta = textNoBuit(cms.indexLead);
  const mapa = mapaPaginesCms(cms);
  if (!titol && !entradeta && !mapa) return null;
  return {
    titol,
    entradeta,
    pagines: mapa ? Object.fromEntries(mapa.entries()) : null
  };
}
