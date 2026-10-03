/**
 * Esquelet comú de catàleg i col·lecció · l'API pública (ordre del Mestre,
 * 261002: sinergies T4/T8). El TPV del bar i La Compra només importen d'ací:
 *
 *   EsqueletCatalegColleccio  la pantalla sencera sobre ClosaAplicacio
 *   rutesCatalegColleccio     les rutes (dues, o quatre amb rutaColleccio), per a una taula pròpia més gran
 *   ColumnaCataleg            el catàleg: categories, graella o llista, detall
 *   ColumnaColleccio          la col·lecció en curs: resum i línies (o rajoles)
 *   ColumnaColleccions        les col·leccions: tiquets oberts, llistes
 *   useVistaCataleg           categoria, vista i article obert, a la URL
 *   useVistesEsquelet         catàleg o col·lecció (pantalla estreta) i com anar a l'altra
 *   useColleccioActiva        l'id de la col·lecció activa del camí (rutaColleccio)
 *
 * Les peces de dins (GraellaArticles, LiniesColleccio, BarraResum…) són de
 * Pedra Seca: src/components/PedraSeca/index.js.
 */
export { EsqueletCatalegColleccio } from './EsqueletCatalegColleccio.jsx';
export { ColumnaCataleg } from './ColumnaCataleg.jsx';
export { ColumnaColleccio } from './ColumnaColleccio.jsx';
export { ColumnaColleccions } from './ColumnaColleccions.jsx';
export { rutesCatalegColleccio, useColleccioActiva } from './rutesCatalegColleccio.js';
export {
  PARAMETRES_CATALEG, PRIMERS, VISTES_CATALEG, esVistaCataleg, primerDe, tramDe, useVistaCataleg, useVistesEsquelet
} from './vistes.js';
