/**
 * comu.js — peces compartides del nucli de facturació.
 *
 * Congelar en profunditat, errors amb codi estable, l'arredoniment de
 * cèntims sense coma flotant, les dates del calendari en text ISO, els textos
 * d'una línia i les referències opaques a la configuració. JS pur: sense DOM,
 * React ni xarxa.
 */
import { esDataValida } from '../nucli/dates.js';

/* Congela un objecte i tot el que penja d'ell (com congela() d'entregables.js). */
export function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

/* Còpia plana per JSON (sense undefined, funcions ni prototips), congelada
   sencera: qui la reba no pot tocar l'original ni la còpia. */
export const copiaCongelada = (valor) => congela(JSON.parse(JSON.stringify(valor)));

/* Un error amb codi estable, perquè la UI decidisca què diu; `detalls`
   porta la llista d'errors de validació quan n'hi ha més d'un. */
export function errorAmbCodi(codi, missatge, detalls) {
  const error = new Error(missatge);
  error.codi = codi;
  if (detalls !== undefined) error.detalls = detalls;
  return error;
}

/* numerador / denominador arredonit a la meitat lluny de zero, amb enters:
   1,5 → 2 i −1,5 → −2. El residu es lleva abans de dividir perquè la
   divisió siga exacta també prop del límit dels enters segurs. */
export function arrodoneix(numerador, denominador) {
  if (!Number.isSafeInteger(numerador) || !Number.isSafeInteger(denominador) || denominador <= 0) {
    throw new RangeError('arrodoneix() necessita enters segurs i un denominador positiu.');
  }
  const doble = 2 * Math.abs(numerador) + denominador;
  if (!Number.isSafeInteger(doble)) throw new RangeError('Import massa gran per a calcular-lo sense perdre precisió.');
  const divisor = 2 * denominador;
  const resultat = (doble - (doble % divisor)) / divisor;
  return numerador < 0 && resultat !== 0 ? -resultat : resultat;
}

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/* Cert si el text és una data «aaaa-mm-dd» que existix al calendari. */
export function esDataIso(text) {
  const r = typeof text === 'string' ? DATA_ISO.exec(text) : null;
  return Boolean(r) && esDataValida({ a: Number(r[1]), m: Number(r[2]), d: Number(r[3]) });
}

/* Un text sense espais als extrems, o '' si no és un text. */
export const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/* Caràcters de control (inclosos els salts de línia): no van a cap camp d'un registre fiscal. */
export const CONTROL = /[\u0000-\u001F\u007F]/;

/* Un text obligatori d'una sola línia, net i de com a molt `maxim` caràcters; null si no ho és. */
export function textValid(valor, maxim) {
  const net = textNet(valor);
  return net !== '' && net.length <= maxim && !CONTROL.test(net) ? net : null;
}

const dos = (n) => String(n).padStart(2, '0');

/**
 * Una data «aaaa-mm-dd» més (o menys) uns quants dies del calendari: sumaDies('2026-10-04', 90) → '2027-01-02'.
 * @param {string} iso
 * @param {number} dies enter
 * @returns {string}
 */
export function sumaDies(iso, dies) {
  if (!esDataIso(iso) || !Number.isSafeInteger(dies)) throw new RangeError('sumaDies() necessita una data «aaaa-mm-dd» i un enter de dies.');
  const [a, m, d] = iso.split('-').map(Number);
  /* setUTCFullYear, i no Date.UTC: Date.UTC llig els anys de dues xifres com a 19xx. */
  const data = new Date(0);
  data.setUTCFullYear(a, m - 1, d + dies);
  const resultat = `${String(data.getUTCFullYear()).padStart(4, '0')}-${dos(data.getUTCMonth() + 1)}-${dos(data.getUTCDate())}`;
  if (!esDataIso(resultat)) throw new RangeError('sumaDies(): la data resultant queda fora del calendari.');
  return resultat;
}

/* Una referència opaca a la configuració local de l'empresa (un compte de cobrament, un
   domicili, el logo): minúscules, xifres i guions, com «compte-principal». Mai el valor que
   referencia: un text amb forma de número de compte, o amb una tira de huit xifres o més, no
   és una referència, encara que en tinga els caràcters. */
const REFERENCIA = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const FORMA_DE_COMPTE = /^[a-z]{2}\d{2}[a-z0-9]{10,}$|\d{8,}/i;
export const esReferenciaOpaca = (text) => typeof text === 'string' && REFERENCIA.test(text) && !FORMA_DE_COMPTE.test(text);
