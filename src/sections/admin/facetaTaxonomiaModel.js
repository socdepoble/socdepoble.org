/**
 * facetaTaxonomiaModel.js — Constants i lògica pura de la faceta «Etiquetes i categories» (Onada R32.22 · T2 HMR).
 */
import { Tags } from 'lucide-react';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { CLASSES_ETIQUETA, VERSIO_TAXONOMIA } from '../../data/personalitzacio.js';

/** La faceta, per a qui la cableja al menú del Tauler. */
export const FACETA_TAXONOMIA = Object.freeze({ id: 'taxonomia', titol: 'Etiquetes i categories', icona: Tags });

export const CLAU_TAXONOMIA = 'taxonomia';
export const CLASSE_PER_DEFECTE = 'sdp-badge-tag';
export const LEAD_TAXONOMIA = 'Les etiquetes de cada pàgina del sistema i les categories i etiquetes de sèrie del Bloc de notes, per a este poble. Cada «Desar» crea una versió nova; des de l’historial se’n pot restaurar una d’anterior.';
export const TEXT_SENSE_CAPACITAT = 'Este node no admet personalització';
export const TEXT_CONFLICTE = 'Algú ha desat una versió nova: recarrega';

const NOM_DE_CLASSE = Object.freeze({
  'sdp-badge-system': 'Sistema (blau fosc)',
  'sdp-badge-category': 'Categoria (blau clar)',
  'sdp-badge-tag': 'Etiqueta (taronja clar)',
  'sdp-badge-accent': 'Accent (taronja)',
  'sdp-badge-neutral': 'Neutra (gris)',
  'sdp-badge-buit': 'Buida (només contorn)',
});
export const OPCIONS_CLASSE = Object.freeze(
  CLASSES_ETIQUETA.map((valor) => Object.freeze({ valor, etiqueta: NOM_DE_CLASSE[valor] || valor }))
);
const CLASSES = new Set(CLASSES_ETIQUETA);

export const netejaTextos = (valors) => [
  ...new Set((Array.isArray(valors) ? valors : []).map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)),
];

export function normalitzaEtiquetes(labels) {
  return (Array.isArray(labels) ? labels : []).map((label) => (typeof label === 'string'
    ? { text: label, className: CLASSE_PER_DEFECTE }
    : { text: String(label?.text ?? ''), className: CLASSES.has(label?.className) ? label.className : CLASSE_PER_DEFECTE }));
}

const iguals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const etiquetesDeSerie = (clau) => normalitzaEtiquetes(PAGE_COPY[clau]?.labels);

export function esborranyInicial(pageCopy, taxonomia) {
  const pagines = Object.fromEntries(SYSTEM_PAGES.map(({ key }) => {
    const actual = pageCopy?.[key] || PAGE_COPY[key];
    const labels = taxonomia?.pagines?.[key]?.labels ?? actual?.labels;
    return [key, { titol: actual?.title || key, labels: normalitzaEtiquetes(labels) }];
  }));
  return { pagines, categories: netejaTextos(taxonomia?.categories), etiquetes: netejaTextos(taxonomia?.etiquetes) };
}

/** El payload que es desa: només les pàgines que no són com les de sèrie. */
export function payloadDe(esborrany) {
  const pagines = {};
  for (const [clau, pagina] of Object.entries(esborrany.pagines)) {
    const labels = pagina.labels.map((label) => ({ text: label.text.trim(), className: label.className }));
    if (!iguals(labels, etiquetesDeSerie(clau))) pagines[clau] = { labels };
  }
  return { v: VERSIO_TAXONOMIA, pagines, categories: netejaTextos(esborrany.categories), etiquetes: netejaTextos(esborrany.etiquetes) };
}

export function dataLlegible(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const nomFitxerExportacio = (ara = new Date()) => `taxonomia-${ara.toISOString().slice(0, 10)}.json`;
