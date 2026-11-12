/**
 * index.js — Arbre Genealògic · la façana del nucli.
 *
 * gedcom/, arxius/ i les vistes importen només d'ací. El magatzem
 * (src/apps/genealogia/magatzem.js, l'únic fitxer que parla amb IndexedDB) no
 * es reexporta: només el fa servir useGenealogia.jsx.
 */
export * from './constants.js';
export * from './dates.js';
export * from './model.js';
export * from './vius.js';
export * from './cronologia.js';
export * from './parentiu.js';
export * from './sosa.js';
export * from './entrevista.js';
export * from './useGenealogia.jsx';
export {
  MIDA_MAXIMA_IMPORTACIO, MAX_PERSONES, MAX_RELACIONS, MAX_FONTS_PER_PERSONA,
  esClauSegura, text, enter, urlSegura, objectePla, revivorSegur, errorCamp
} from './segur.js';
