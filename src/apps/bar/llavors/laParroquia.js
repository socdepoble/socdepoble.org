/**
 * El Bar · llavors/laParroquia.js — la carta real de «La Parròquia · Menjar i
 * Beure», demanada pel Mestre (Onada 3): l'exportació de Loyverse
 * (la-parroquia-loyverse.csv, còpia exacta de la de 01_produccio) passada per
 * l'importador genèric (nucli/loyverse.js) amb els criteris d'esta casa.
 *
 * EXCEPCIÓ declarada (frontera.test.js): és una llavor real, amb marques i
 * preus de veres, separada de la genèrica (nucli/llavor.js), que continua
 * sent la de la primera càrrega. Només es carrega amb import() dinàmic des
 * de llavors/index.js, a petició, des d'Ajustos › Carta, i només als builds
 * que la demanen (literal de compilació de llavors/index.js): porta els
 * costos de compra del negoci.
 *
 * Decisions reversibles (D4 de l'Onada 3), a confirmar pel Mestre:
 *   · Categories pel codi del prefix del nom («B1☕️ Bombó» → cafeteria), no
 *     per la columna Categoria de Loyverse: 11 subcategories i «altres».
 *   · Variants per preu ascendent (la més barata és la del toc), les de preu
 *     obert al final i l'ordre del fitxer en un empat: Loyverse les dona per
 *     ordre alfabètic i un toc al barril cobraria la Gerra.
 *   · L'IVA dels 4 productes que l'exportació deixa sense impost.
 *   · Cuina per a M1–M4; nevera per als refrescs i les cerveses que no són de barril.
 *   · Els modificadors no s'importen (l'exportació no en porta les opcions).
 *   · Els preus del CSV són els canònics.
 * Les fotos: IMATGES_DISPONIBLES diu quins webp ja són a
 * public/assets/uploads/empresa/la-parroquia/bar/<categoria>/<slug>.webp
 * (una prova ho comprova); la resta porta el marcador 1:1.
 */
import TEXT_LOYVERSE from './la-parroquia-loyverse.csv?raw';
import { importaLoyverse, slugDe } from '../nucli/loyverse.js';
import { DENOMINACIONS } from '../nucli/torn.js';

export const ESTABLIMENT_LA_PARROQUIA = Object.freeze({ nom: 'La Parròquia · Menjar i Beure', slug: 'la-parroquia', ivaPerDefecte: 10 });

/* El codi del prefix del nom → la categoria (els ids i les icones de la llavor d'exemple). */
const CATEGORIES = Object.freeze({
  B1: { id: 'cafeteria', nom: 'Cafeteria', icona: 'Coffee' },
  B2: { id: 'refrescs', nom: 'Refrescs', icona: 'CupSoda' },
  B3: { id: 'cerveseria', nom: 'Cerveseria', icona: 'Beer' },
  B4: { id: 'vins-i-caves', nom: 'Vins i caves', icona: 'Wine' },
  B5C: { id: 'combinats', nom: 'Combinats', icona: 'GlassWater' },
  B5: { id: 'licoreria', nom: 'Licoreria', icona: 'Martini' },
  M1: { id: 'plats-combinats', nom: 'Plats combinats', icona: 'UtensilsCrossed' },
  M2: { id: 'entrepans', nom: 'Entrepans', icona: 'Sandwich' },
  M3: { id: 'torrades', nom: 'Torrades', icona: 'Wheat' },
  M4: { id: 'tapes', nom: 'Tapes', icona: 'Utensils' },
  M5: { id: 'postres', nom: 'Postres i gelats', icona: 'IceCreamCone' },
  x: { id: 'altres', nom: 'Altres' }
});
const ORDRE = Object.freeze(Object.keys(CATEGORIES));
const CUINA = Object.freeze(['M1', 'M2', 'M3', 'M4']);

/* «B1☕️ Bombó», «B3🍺 - Barril …», «B5C🥃 Calimotxo», «x Altres al 10%»: el codi, l'emoji i el guió. */
const PREFIX = /^(?:([A-Z]\d+[A-Z]?)\S*|(x))\s+(?:-\s+)?/;

/** El codi del prefix d'un nom de Loyverse ('B1', 'B5C', 'x'), o null. */
export function codiDe(nom) {
  const trobat = PREFIX.exec(String(nom ?? ''));
  return trobat ? trobat[1] || trobat[2] : null;
}

/** El nom sense el prefix: «B3🍺 - Barril Estrella Damm» → «Barril Estrella Damm». */
export const netejaNom = (nom) => String(nom ?? '').replace(PREFIX, '').trim();

/* Els 4 productes sense impost a l'exportació, per id (slug del Handle): els alcohòlics al 21 %, el menjar al 10 %. */
const IVA_QUAN_FALTA = Object.freeze({
  'b5-combinats-vodkatonic': 21,
  'b5-malibu': 21,
  'm2-calamar-a-la-romana': 10,
  'm4-olives-partides': 10
});

/**
 * Els webp que ja són a public/, per categoria: { cafeteria: ['bombo', …] }.
 * Buit fins que algú hi copie les fotos convertides (MAPA_IMATGES.txt del
 * laboratori 261003_1330_parroquia_claude).
 */
export const IMATGES_DISPONIBLES = Object.freeze({});

const categoriaDelCodi = (codi) => {
  const clau = codi && Object.hasOwn(CATEGORIES, codi) ? codi : 'x';
  return { ...CATEGORIES[clau], ordre: ORDRE.indexOf(clau) };
};

export const OPCIONS_LA_PARROQUIA = Object.freeze({
  categoriaDe: (info) => categoriaDelCodi(codiDe(info.nom)),
  netejaNom,
  ordreVariants: 'preu',
  ivaQuanFalta: (info) => IVA_QUAN_FALTA[slugDe(info.handle)],
  desti: (info) => (CUINA.includes(codiDe(info.nom)) ? 'cuina' : 'barra'),
  reposaNevera: (info) => {
    const codi = codiDe(info.nom);
    return codi === 'B2' || (codi === 'B3' && !/barril/i.test(info.nomNet));
  },
  imatgeDisponible: (categoriaId, slug) => Object.hasOwn(IMATGES_DISPONIBLES, categoriaId) && IMATGES_DISPONIBLES[categoriaId].includes(slug)
});

/**
 * Una exportació de Loyverse de La Parròquia (la del repo o una de més nova)
 * com a llavor: { carta, establiment, avisos, resum }.
 */
export function importaLaParroquia(text) {
  const { carta, avisos, resum } = importaLoyverse(text, OPCIONS_LA_PARROQUIA);
  return { carta, establiment: { ...ESTABLIMENT_LA_PARROQUIA, denominacions: [...DENOMINACIONS] }, avisos, resum };
}

/** La llavor de La Parròquia amb la còpia del CSV del repo. */
export function llavorLaParroquia() {
  return importaLaParroquia(TEXT_LOYVERSE);
}
