/**
 * registreSentinelles.js — el catàleg dels set sentinelles d'autonomia per a
 * la porta d'aprovació.
 *
 * Com registreTractors.js (que no es toca: és font dels tractors de la
 * Gestoria i canviar-lo els tornaria a «Versió canviada»), cada sentinella
 * porta el text exacte de la seua fitxa i de cada font declarada, servit per
 * Vite (?raw). El glob és propi perquè el de registreTractors no porta els
 * .md dels tractors. Una font absent deixa el sentinella «incomplet»: no es
 * pot aprovar ni executar. L'ordre és el de les fases: F1 (1, 2, 4),
 * F2 (3, 6) i F3 (5, 7).
 */
import { catalegTractors, empremtesDe, textosPerRuta } from './registreTractors.js';
import TEXT_DEL_REGISTRE from './registreSentinelles.js?raw';
import { SENTINELLA_APARADOR } from './sentinelles/auditoriaAparador.js';
import { SENTINELLA_CONSOL } from './sentinelles/consolVendes.js';
import { SENTINELLA_DETECTIU } from './sentinelles/detectiuPoble.js';
import { SENTINELLA_ENLLAC } from './sentinelles/enllacTorn.js';
import { SENTINELLA_ESTRUCTURAL } from './sentinelles/estructural.js';
import { SENTINELLA_POLICIA } from './sentinelles/policiaDisseny.js';
import { SENTINELLA_TRITURADOR } from './sentinelles/trituradorFinancer.js';

/* On viu este mòdul, des de l'arrel del repositori: hi pengen les claus relatives del glob. */
export const BASE_SENTINELLES = 'src/sections/tractors';

/* El codi de producció que pot ser font d'un sentinella: el seu carril, la
   porta d'aprovació i els mòduls purs de la Gestoria. Ni proves ni suport de
   proves. El glob no torna mai el fitxer que el crida: el seu text entra a part. */
const FITXERS = {
  ...import.meta.glob(
    ['./sentinelles/**/*.{js,md}', './*.{js,jsx}', './nucli/*.js', '../gestoria/nucli/*.js', '!**/*.test.*', '!**/__fixtures__/**'],
    { query: '?raw', import: 'default', eager: true }
  ),
  './registreSentinelles.js': TEXT_DEL_REGISTRE
};

export const SENTINELLES = Object.freeze([
  SENTINELLA_ESTRUCTURAL,
  SENTINELLA_TRITURADOR,
  SENTINELLA_POLICIA,
  SENTINELLA_CONSOL,
  SENTINELLA_ENLLAC,
  SENTINELLA_APARADOR,
  SENTINELLA_DETECTIU
]);

/* El que veu la porta: els manifests derivats, amb la fitxa i les fonts. */
export const TRACTORS_SENTINELLES = catalegTractors(SENTINELLES.map((s) => s.manifest), FITXERS, BASE_SENTINELLES);

/* Les rutes que el glob pot servir com a font d'un sentinella. */
export const RUTES_SENTINELLES = Object.freeze([...textosPerRuta(FITXERS, BASE_SENTINELLES).keys()].sort());

export function sentinellaDe(id) {
  return SENTINELLES.find((s) => s.id === id) ?? null;
}

export function empremtesDeSentinelles(subtle) {
  return empremtesDe(TRACTORS_SENTINELLES, subtle);
}
