/**
 * La Nevera de Casa · l'API del nucli (pur: cap React, cap xarxa, cap disc).
 * La vista, el magatzem i l'importador només importen d'ací.
 */
export { ARTICLES_BASE, ARTICLES_PRODUCTES, CATEGORIES, FONT, ID_PROPIS } from './cataleg.js';
export {
  ESQUEMA_ESTAT, ESTATS_CASA, IDS_RESERVATS, LIMITS, LLISTA_INICIAL,
  afig, afigPerNom, afigPropostes, amagaSeccio, articlePerId, articlePerNom, articlesDe, categoriesDeLlista, clauDeNom,
  commuta, creaArticlePropi, creaLlista, esIdNevera, esborraArticlePropi, esborraLlista, estatACasa, estatInicial, lleva,
  liniesOrdenades, llistaPerId, marcaACasa, marcaComprat, mouSeccio, netejaText, normalitzaEstat, productesEnUs,
  propostesDeCasa, reanomenaLlista, recentsDisponibles, restableixSeccions, textQuantitat, totsElsArticles, triaLlista
} from './nevera.js';
export { ESQUEMA_COPIA, MAX_COPIA, creaCopia, llegixCopia, serialitzaCopia } from './copia.js';
