/**
 * Lector de notícies · LA taula de rutes (una sola ClosaAplicacio).
 *
 *   noticies                     carpetes · fonts · notícies   (estret: carpetes)
 *   noticies/:carpeta            carpetes · fonts · notícies   (estret: notícies)
 *   noticies/:carpeta/fonts      carpetes · fonts · notícies   (estret: fonts)
 *   noticies/:carpeta/:font      carpetes · fonts · notícies   (estret: notícies)
 *   fonts[/colleccio]            les que seguixes · el catàleg de fonts
 *                                (rutesCatalegColleccio, l'esquelet comú)
 * Les quatre de notícies porten els MATEIXOS components a cada columna: en
 * navegar d'una a l'altra cap columna es desmunta. ?article=<id> obri el
 * lector al detall; ?vista=graella, les targetes 1:1.
 * La carpeta: 'hui', 'despres' o l'id d'una categoria; la font, el seu id.
 * Cap dels dos pot ser un tram literal (fonts, totes, colleccio): el port ja
 * llença les categories i fonts amb un id reservat (nucli/model.js).
 */
import { rutesCatalegColleccio } from '../comu/esquelet/index.js';
import { esIdOpac } from '../plataforma/index.js';
import { RESERVATS } from './nucli/index.js';
import { ColumnaCarpetes } from './vistes/Carpetes.jsx';
import { ColumnaFonts } from './vistes/Fonts.jsx';
import { ColumnaCatalegFonts, ColumnaSeguides } from './vistes/GestioFonts.jsx';
import { FONTS, NOTICIES, TRAM_FONTS } from './vistes/navegacio.js';
import { ColumnaNoticies } from './vistes/Noticies.jsx';

const CARPETES_DE_RUTA = new Set(['hui', 'despres']);

/** Una carpeta del camí: 'hui', 'despres' o un id de categoria (no reservat). */
export const esCarpeta = (valor) => esIdOpac(valor) && (CARPETES_DE_RUTA.has(valor) || !RESERVATS.includes(valor));
/** Una font del camí: un id no reservat. */
export const esFont = (valor) => esIdOpac(valor) && !RESERVATS.includes(valor);

const COLUMNES = Object.freeze({ Esquerra: ColumnaCarpetes, Mig: ColumnaFonts, Detall: ColumnaNoticies });

export const RUTES = Object.freeze([
  { path: NOTICIES, ...COLUMNES, estret: 'esquerra' },
  { path: `${NOTICIES}/:carpeta`, params: { carpeta: esCarpeta }, ...COLUMNES, estret: 'detall' },
  { path: `${NOTICIES}/:carpeta/${TRAM_FONTS}`, params: { carpeta: esCarpeta }, ...COLUMNES, estret: 'mig' },
  { path: `${NOTICIES}/:carpeta/:font`, params: { carpeta: esCarpeta, font: esFont }, ...COLUMNES, estret: 'detall' },
  ...rutesCatalegColleccio({ path: FONTS, Cataleg: ColumnaCatalegFonts, Colleccio: ColumnaSeguides })
]);

const TITOLS_PER_ENTRADA = Object.freeze({
  [NOTICIES]: Object.freeze({ esquerra: 'Carpetes', mig: 'Fonts' }),
  [FONTS]: Object.freeze({ mig: 'Les que seguixes' })
});

/** Els títols dels separadors de la closca per a una entrada (els de Notícies si no n'és cap). */
export function titolsDe(entrada) {
  return Object.hasOwn(TITOLS_PER_ENTRADA, entrada ?? '') ? TITOLS_PER_ENTRADA[entrada] : TITOLS_PER_ENTRADA[NOTICIES];
}
