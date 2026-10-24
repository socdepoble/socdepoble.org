/**
 * Lector de notícies · la taula de rutes de l'app.
 *
 * Bloc 0 del Gauntlet (ordre del Mestre, 261016, prompt 261016_0015) · Les
 * notícies es munten sobre l'espai de treball del Bloc de notes
 * (vistes/Noticies.jsx, UniversalWorkspace): RUTES_NOTICIES només diu quin
 * camí és de les notícies i en valida els paràmetres (useRutaApp), sense
 * columnes. Derogades les quatre rutes de columnes del 261004 (carpetes ·
 * fonts · notícies): l'arbre de l'espai ja porta carpetes i fonts.
 * Ordre del Mestre (261024, 15:05) · La gestió de fonts deixa de ser una
 * pàgina (/fonts, sobre ClosaAplicacio): viu a l'arbre (vistes/GestioFonts.jsx).
 * La taula de la closca (RUTES) i els seus títols se'n van; l'enllaç vell el
 * porta la plataforma a les notícies (RutaApps).
 *
 *   noticies                     «Hui» (sense carpeta al camí)
 *   noticies/totes               «Totes», el «Tot» de l'espai
 *   noticies/:carpeta            una carpeta: 'hui', 'despres' o una categoria
 *   noticies/:carpeta/fonts      l'enllaç vell de les fonts d'una carpeta en
 *                                estret: AppLector el canonitza a la carpeta
 *   noticies/:carpeta/:font      una font (la carpeta és la seua o 'hui')
 *   ?article=<id>                la notícia oberta, al detall
 * La carpeta: 'hui', 'despres' o l'id d'una categoria; la font, el seu id.
 * Cap dels dos pot ser un tram literal (fonts, totes, colleccio): el port ja
 * llença les categories i fonts amb un id reservat (nucli/model.js).
 */
import { esIdOpac } from '../plataforma/index.js';
import { RESERVATS } from './nucli/index.js';
import { NOTICIES, TOTES, TRAM_FONTS } from './vistes/navegacio.js';

const CARPETES_DE_RUTA = new Set(['hui', 'despres']);

/** Una carpeta del camí: 'hui', 'despres' o un id de categoria (no reservat). */
export const esCarpeta = (valor) => esIdOpac(valor) && (CARPETES_DE_RUTA.has(valor) || !RESERVATS.includes(valor));
/** Una font del camí: un id no reservat. */
export const esFont = (valor) => esIdOpac(valor) && !RESERVATS.includes(valor);

/** El camí de «Totes» i el de l'enllaç vell de les fonts d'una carpeta. */
export const CAMI_TOTES = `${NOTICIES}/${TOTES}`;
export const CAMI_FONTS_VELL = `${NOTICIES}/:carpeta/${TRAM_FONTS}`;

/* Els literals van davant dels paràmetres; tampoc no casarien amb ells (RESERVATS). */
export const RUTES_NOTICIES = Object.freeze([
  { path: NOTICIES },
  { path: CAMI_TOTES },
  { path: `${NOTICIES}/:carpeta`, params: { carpeta: esCarpeta } },
  { path: CAMI_FONTS_VELL, params: { carpeta: esCarpeta } },
  { path: `${NOTICIES}/:carpeta/:font`, params: { carpeta: esCarpeta, font: esFont } }
]);
