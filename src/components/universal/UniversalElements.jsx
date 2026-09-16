/**
 * UniversalElements.jsx — FAÇANA TEMPORAL (260910).
 *
 * Tot viu a components/PedraSeca/. Aquest fitxer només reexporta perquè cap dels
 * 13 imports existents es trenque el dia del trasllat. Es migren un a un a
 * '../ui' (o '../../components/PedraSeca') i, quan
 *   grep -rn "UniversalElements" src
 * torne 0, s'esborra. GlobeIcon, SearchIcon i ThemeIcon ja no hi són:
 * no tenien cap consumidor.
 */
export * from '../PedraSeca/index.js';
export { useContent, ContentProvider } from './ContentProvider';
