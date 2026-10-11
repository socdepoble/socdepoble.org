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
/* Onada 12 (261011; ordres 261011_0130, punt 6) · Les receptes amb el que hi ha al rebost. */
/* Correcció del refutador (261011, R5) · Només el que crida la vista (vistes/perReceptes.js i
   Receptes.jsx); la resta d'exports dels tres fitxers són per a ells i per a les seues proves. */
export { ingredientDArticle, ingredientPerId, nomEnFrase } from './ingredients.js';
export { RECEPTES, receptaPerId } from './receptes.js';
export { faltaPerCuinar, recomana } from './recomanador.js';
