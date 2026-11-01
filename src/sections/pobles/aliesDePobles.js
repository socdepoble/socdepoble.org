/**
 * aliesDePobles.js · D-5 (pla 261101_1246, assalt 10/10; IDEA-49 del Llibre
 * Mestre) · La font única dels àlies de poble, que comparteixen el detector
 * de pobles dels relats i el selector de la Fitxa de memòria oral
 * (sections/notes/memoriaOral.js):
 *   · aliesDelPoble: els àlies d'un poble, primer els de la seua fitxa
 *     (`alies`, si en porta) i després els de la llavor (aliesDePoblesSeed.js);
 *   · catalegDePobles: els pobles que es poden triar al selector, els de
 *     l'aplicació (o la llavor) i, darrere, els municipis de referència que
 *     no hi són.
 *
 * Sense cap nom de poble (ordre del Mestre 261009_0230, punt 6; qualitat.test.js
 * ho vigila): un poble nou amb els seus àlies a la fitxa funciona sense tocar
 * ni una línia de codi. Pur: sense React, sense xarxa i sense rellotge.
 */
import { ALIES_DE_POBLES_SEED, MUNICIPIS_DE_REFERENCIA } from './aliesDePoblesSeed.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { slugDelPoble } from './nomsDelPoble.js';

/** Com a molt, estos àlies es lligen de la fitxa d'un poble. */
export const MAX_ALIES_DE_FITXA = 12;
/** La llargària màxima (caràcters) de la forma d'un àlies. */
export const MAX_FORMA_ALIES = 80;
/* Cap forma de poble no té tantes paraules: un `majusculaEn` més gran no val. */
const MAX_PARAULA_MAJUSCULA = 16;

const TE_LLETRA_O_XIFRA = /[\p{L}\p{N}]/u;
const MARQUES = /\p{M}/gu;
const ESPAIS = /\s+/g;
const BUIT = Object.freeze([]);

/* La clau per a no repetir un àlies: minúscules, sense accents i amb espais simples. */
const clauDeForma = (forma) => forma.normalize('NFKD').replace(MARQUES, '').toLowerCase();

/* Un àlies: una cadena o { forma, ambMajuscula?, majusculaEn? }; null si no val
   (sense lletres ni xifres, buit o de més de MAX_FORMA_ALIES caràcters). */
function aliesDe(valor) {
  const objecte = Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
  const crua = typeof valor === 'string' ? valor : (objecte && typeof valor.forma === 'string' ? valor.forma : null);
  if (crua === null) return null;
  const forma = crua.replace(ESPAIS, ' ').trim();
  if (!forma || forma.length > MAX_FORMA_ALIES || !TE_LLETRA_O_XIFRA.test(forma)) return null;
  const en = objecte ? valor.majusculaEn : 0;
  return Object.freeze({
    forma,
    ambMajuscula: objecte && valor.ambMajuscula === true,
    majusculaEn: Number.isInteger(en) && en >= 0 && en < MAX_PARAULA_MAJUSCULA ? en : 0
  });
}

/* Els àlies de la llavor d'un poble, per l'slug del seu id o, si no hi és (un
   id UUID de la base de dades), del seu nom. Només claus pròpies del mapa. */
function deLaLlavor(poble) {
  for (const clau of [slugDelPoble(String(poble.id ?? '')), slugDelPoble(poble.title ?? poble.nom ?? poble.name)]) {
    if (clau && Object.prototype.hasOwnProperty.call(ALIES_DE_POBLES_SEED, clau)) return ALIES_DE_POBLES_SEED[clau];
  }
  return BUIT;
}

/**
 * Els àlies d'un poble ({ id, title | nom | name, alies? }): una llista
 * congelada de { forma, ambMajuscula, majusculaEn }, sense repetits (sense
 * accents ni majúscules). Primer els de la fitxa (`alies`: cadenes o objectes,
 * com a molt MAX_ALIES_DE_FITXA; els que no valen es boten) i després els de
 * la llavor. Sense poble, una llista buida.
 */
export function aliesDelPoble(poble) {
  if (!poble || typeof poble !== 'object') return BUIT;
  const propis = Array.isArray(poble.alies) ? poble.alies.slice(0, MAX_ALIES_DE_FITXA) : [];
  const vistes = new Set();
  const llista = [];
  for (const valor of [...propis, ...deLaLlavor(poble)]) {
    const a = aliesDe(valor);
    if (!a) continue;
    const clau = clauDeForma(a.forma);
    if (vistes.has(clau)) continue;
    vistes.add(clau);
    llista.push(a);
  }
  return llista.length ? Object.freeze(llista) : BUIT;
}

/* Les claus d'un poble per a no repetir-lo al catàleg: l'slug de l'id i el del nom. */
const clausDelPoble = (poble) => [slugDelPoble(String(poble.id ?? '')), slugDelPoble(poble.title ?? poble.nom ?? poble.name)].filter(Boolean);

function construeixCataleg(pobles) {
  const vistes = new Set();
  const llista = [];
  for (const poble of pobles) {
    if (!poble || typeof poble !== 'object') continue;
    llista.push(poble);
    for (const clau of clausDelPoble(poble)) vistes.add(clau);
  }
  for (const municipi of MUNICIPIS_DE_REFERENCIA) {
    if (!clausDelPoble(municipi).some((clau) => vistes.has(clau))) llista.push(municipi);
  }
  return Object.freeze(llista);
}

let catalegDeLaLlavor = null;
const catalegs = new WeakMap();

/**
 * Els pobles del selector de la fitxa: els de l'aplicació (o la llavor del
 * codi, si la llista és absent o buida) i, darrere, els municipis de
 * referència que no hi són (per l'slug de l'id o del nom). Llista congelada i
 * memoritzada per llista: si canvia, cal passar-ne una de nova.
 */
export function catalegDePobles(pobles) {
  if (!Array.isArray(pobles) || !pobles.length) {
    catalegDeLaLlavor ??= construeixCataleg(MOCK_TOWNS);
    return catalegDeLaLlavor;
  }
  let cataleg = catalegs.get(pobles);
  if (!cataleg) {
    cataleg = construeixCataleg(pobles);
    catalegs.set(pobles, cataleg);
  }
  return cataleg;
}
