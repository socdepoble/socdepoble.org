/**
 * classificacio/model.js — Carpeta, categories i etiquetes d'un document.
 *
 * Funcions pures: no saben d'on venen els documents ni com es desen. Qui les
 * crida aplica els canvis amb el seu port de dades (a Notes, setLocalNoteField).
 *
 * REGLA D'ORFANDAT
 *   Un document té sempre una carpeta i almenys una categoria. Les etiquetes
 *   poden quedar buides. Si una operació el deixa sense categoria, rep la
 *   general (CATEGORIA_GENERAL).
 */

export const CATEGORIA_GENERAL = 'General';

const textDe = (label) => (typeof label === 'string' ? label : label?.text);
const unics = (valors) => [...new Set((valors || []).map((v) => String(v ?? '').trim()).filter(Boolean))];
const iguals = (a, b) => Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Llig la classificació amb el mateix criteri que pinta les píndoles
 * (etiquetesDeNota): un document antic sense `categories` i amb `labels`
 * mostra els labels, i en el primer desat no se n'ha de perdre cap (E5).
 * Els labels de text es pinten com a etiquetes; un label objecte amb classe
 * de categoria es llig com a categoria.
 */
export function classificacioDe(doc) {
  if (!Array.isArray(doc?.categories) && Array.isArray(doc?.labels)) {
    const categoria = (label) => typeof label === 'object' && label?.className === 'sdp-badge-category';
    return {
      antiga: true,
      categories: unics(doc.labels.filter(categoria).map(textDe)),
      tags: unics([...doc.labels.filter((l) => !categoria(l)).map(textDe), ...(doc.tags || [])])
    };
  }
  return { antiga: false, categories: unics(doc?.categories), tags: unics(doc?.tags) };
}

/** Garantix la regla d'orfandat de les categories. */
export function ambCategoria(categories) {
  const netes = unics(categories);
  return netes.length ? netes : [CATEGORIA_GENERAL];
}

/**
 * Camps que cal escriure perquè `doc` quede amb `seguent` ({ categories?, tags? }).
 * Un document antic s'escriu sencer: en tindre `categories`, les píndoles ja
 * no lligen els labels, i les etiquetes han d'estar al seu camp.
 */
export function canvisDeClassificacio(doc, seguent = {}) {
  const actual = classificacioDe(doc);
  const categories = ambCategoria(seguent.categories ?? actual.categories);
  const tags = unics(seguent.tags ?? actual.tags);
  const canvis = {};
  if (actual.antiga || !iguals(doc?.categories ?? [], categories)) canvis.categories = categories;
  if (actual.antiga || !iguals(doc?.tags ?? [], tags)) canvis.tags = tags;
  return canvis;
}

/** Catàleg d'un camp ('categories' | 'tags'): unió de tots els documents i dels valors de sèrie. */
export function cataleg(docs, camp, base = []) {
  const valors = new Set(unics(base));
  for (const doc of docs || []) classificacioDe(doc)[camp].forEach((v) => valors.add(v));
  return [...valors].sort((a, b) => a.localeCompare(b, 'ca'));
}

/** Quants documents porten cada valor d'un camp. */
export function usos(docs, camp) {
  const compte = {};
  for (const doc of docs || []) {
    for (const v of classificacioDe(doc)[camp]) compte[v] = (compte[v] || 0) + 1;
  }
  return compte;
}

function operacions(docs, camp, valor, transforma) {
  return (docs || []).flatMap((doc) => {
    const actual = classificacioDe(doc);
    if (!actual[camp].includes(valor)) return [];
    const canvis = canvisDeClassificacio(doc, { ...actual, [camp]: transforma(actual[camp]) });
    return Object.keys(canvis).length ? [{ doc, canvis }] : [];
  });
}

/** Reanomena `vell` a tots els documents que el porten. Torna [{ doc, canvis }]. */
export function reanomena(docs, camp, vell, nou) {
  const net = String(nou ?? '').trim();
  if (!net || net === vell) return [];
  return operacions(docs, camp, vell, (valors) => unics(valors.map((v) => (v === vell ? net : v))));
}

/** Lleva `valor` de tots els documents. Qui es queda sense categoria rep la general. */
export function esborra(docs, camp, valor) {
  return operacions(docs, camp, valor, (valors) => valors.filter((v) => v !== valor));
}
