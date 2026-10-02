/**
 * dates.js — dates de factura com a { a, m, d }, sense Date ni zones horàries.
 *
 * El model de la Gestoria no guarda mai un Date: una factura és d'un dia del
 * calendari, no d'un instant. Les comptes de dies passen per Date.UTC, que no
 * coneix l'horari d'estiu. JS pur: sense DOM ni React.
 *
 * FORMATS QUE LLIG parseData (sempre dia abans que mes en les numèriques):
 *   dd/mm/aa, dd/mm/aaaa, d/m/aaaa, dd-mm-aaaa, dd.mm.aaaa (el mateix separador
 *   les dues vegades), aaaa-mm-dd i aaaa/mm/dd, amb hora opcional al final
 *   («2026-04-30T10:00:00Z», «30/04/2026 10:22»: l'hora s'ignora tal qual).
 *   Textuals: «30 abr 2026», «15 de juliol de 2026», «15 d'abril del 2026»,
 *   «15 jul. 2026», «15-jul-2026», «Jul 15, 2026», «July 15th, 2026»; amb el
 *   dia de la setmana davant o sense. Mesos en valencià, castellà i anglés.
 *   L'any de dues xifres és 2000 + aa. Els rangs es validen (bixestos inclosos)
 *   i una paraula desconeguda fa que la data siga null: millor buida que falsa.
 */

const NOMS_MESOS = Object.freeze({
  ca: ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
});

/* Abreviatures (ja sense accents) de cada mes en les tres llengües. */
const ABREVIATURES = [
  ['gen', 'ene', 'jan'],
  ['febr', 'feb'],
  ['mar'],
  ['abr', 'apr'],
  [],
  ['jun'],
  ['jul'],
  ['ag', 'ago', 'aug'],
  ['set', 'sep', 'sept', 'setiembre'],
  ['oct'],
  ['nov'],
  ['des', 'dic', 'dec']
];

const senseAccents = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

const MESOS = new Map();
ABREVIATURES.forEach((abreviatures, i) => {
  const noms = [NOMS_MESOS.ca[i], NOMS_MESOS.es[i], NOMS_MESOS.en[i], ...abreviatures];
  for (const nom of noms) MESOS.set(senseAccents(nom), i + 1);
});

/* Paraules que poden acompanyar una data i no hi afigen res. */
const BUIDES = new Set([
  'de', 'del',
  'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg',
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'mon', 'tue', 'tues', 'wed', 'thu', 'thur', 'thurs', 'fri', 'sat', 'sun'
]);

/* Qualsevol espai Unicode que no siga l'espai, el tabulador o un salt de
   línia (espais durs i prims inclosos). Classe negada: cap caràcter
   invisible literal al codi font (ESLint no-irregular-whitespace). */
const ESPAIS_DURS = /[^\S\n\r\t ]/g;
const HORA_FINAL = /(?:t|\s+)\d{1,2}:\d{2}(?::\d{2}(?:[.,]\d+)?)?\s*(?:z|[-+]\d{2}:?\d{2}|h)?$/;
const ISO = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/;
const NUMERICA = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{2}|\d{4})$/;
const DIA_MS = 86400000;

/** Any de traspàs del calendari gregorià. */
export const esBixest = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

/** Dies del mes m (1-12) de l'any a, o 0 si el mes no existix. */
export function diesDelMes(a, m) {
  if (!Number.isInteger(m) || m < 1 || m > 12) return 0;
  if (m === 2) return esBixest(a) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** Cert si x és una Data { a, m, d } que existix al calendari (any de 4 xifres). */
export function esDataValida(x) {
  if (!x || typeof x !== 'object') return false;
  const { a, m, d } = x;
  return Number.isInteger(a) && a >= 1000 && a <= 9999 && Number.isInteger(m) && m >= 1 && m <= 12
    && Number.isInteger(d) && d >= 1 && d <= diesDelMes(a, m);
}

const crea = (a, m, d) => (esDataValida({ a, m, d }) ? { a, m, d } : null);
const anyDe = (text) => (text.length === 2 ? 2000 + Number(text) : Number(text));

function dataTextual(s) {
  const fitxes = s
    .replace(/\bd['’]/g, ' ')
    .replace(/(\d)(?:st|nd|rd|th)\b/g, '$1')
    .replace(/[,.]/g, ' ')
    .split(/[\s/-]+/)
    .filter((fitxa) => fitxa !== '' && !BUIDES.has(fitxa));
  if (fitxes.length !== 3) return null;
  const tipus = fitxes.map((fitxa) => (/^\d+$/.test(fitxa) ? 'n' : MESOS.has(fitxa) ? 'm' : null));
  if (tipus.includes(null)) return null;
  const [x, y, z] = fitxes;
  const forma = tipus.join('');
  const esDia = (t) => t.length <= 2;
  const esAny = (t) => t.length === 2 || t.length === 4;
  if (forma === 'nmn' && esDia(x) && esAny(z)) return crea(anyDe(z), MESOS.get(y), Number(x));
  if (forma === 'nmn' && x.length === 4 && esDia(z)) return crea(Number(x), MESOS.get(y), Number(z));
  if (forma === 'mnn' && esDia(y) && esAny(z)) return crea(anyDe(z), MESOS.get(x), Number(y));
  return null;
}

/**
 * Llig una data escrita (vegeu els formats a dalt). Accepta també una Data
 * vàlida, de la qual torna una còpia.
 * @param {string|{a:number,m:number,d:number}} text
 * @returns {{a:number,m:number,d:number}|null}
 */
export function parseData(text) {
  if (esDataValida(text)) return { a: text.a, m: text.m, d: text.d };
  if (typeof text !== 'string') return null;
  const s = senseAccents(text).toLowerCase().replace(ESPAIS_DURS, ' ').trim().replace(HORA_FINAL, '').trim();
  if (s === '') return null;
  let r = ISO.exec(s);
  if (r) return crea(Number(r[1]), Number(r[3]), Number(r[4]));
  r = NUMERICA.exec(s);
  if (r) return crea(anyDe(r[4]), Number(r[3]), Number(r[1]));
  return dataTextual(s);
}

const dosXifres = (n) => String(n).padStart(2, '0');

/**
 * Escriu una Data: 'dd/mm/aa', 'dd/mm/aaaa' (per defecte) o 'aaaa-mm-dd'.
 * Torna '' si la data no és vàlida; un format desconegut és un error de codi.
 */
export function formatData(d, format = 'dd/mm/aaaa') {
  if (!['dd/mm/aa', 'dd/mm/aaaa', 'aaaa-mm-dd'].includes(format)) throw new RangeError(`Format de data desconegut: ${format}`);
  if (!esDataValida(d)) return '';
  const any = String(d.a);
  if (format === 'aaaa-mm-dd') return `${any}-${dosXifres(d.m)}-${dosXifres(d.d)}`;
  return `${dosXifres(d.d)}/${dosXifres(d.m)}/${format === 'dd/mm/aa' ? any.slice(-2) : any}`;
}

/** Trimestre natural (1-4) d'una Data, o null. */
export const trimestreDe = (d) => (esDataValida(d) ? Math.ceil(d.m / 3) : null);

const esTrimestre = (t) => Number.isInteger(t) && t >= 1 && t <= 4;

/** Primer i últim dia d'un trimestre natural, o null si any o trimestre no valen. */
export function rangTrimestre(any, t) {
  if (!Number.isInteger(any) || any < 1000 || any > 9999 || !esTrimestre(t)) return null;
  return { inici: { a: any, m: 3 * t - 2, d: 1 }, fi: { a: any, m: 3 * t, d: diesDelMes(any, 3 * t) } };
}

/** Els tres mesos (1-12) d'un trimestre, o [] si el trimestre no existix. */
export const mesosDelTrimestre = (t) => (esTrimestre(t) ? [3 * t - 2, 3 * t - 1, 3 * t] : []);

/**
 * Comparador per a sort: negatiu si x va abans que y. Les dates absents o
 * invàlides van al final.
 */
export function comparaDates(x, y) {
  const vx = esDataValida(x);
  const vy = esDataValida(y);
  if (!vx || !vy) return vx === vy ? 0 : vx ? -1 : 1;
  return (x.a - y.a) || (x.m - y.m) || (x.d - y.d);
}

const msUtc = (d) => Date.UTC(d.a, d.m - 1, d.d);

/** Dies de x a y (positiu si y és posterior), o null si alguna no és vàlida. */
export function diesEntre(x, y) {
  if (!esDataValida(x) || !esDataValida(y)) return null;
  return Math.round((msUtc(y) - msUtc(x)) / DIA_MS);
}

/**
 * Cert si d cau dins de { inici, fi }, amb els dos extrems inclosos. Un extrem
 * absent (null) deixa el rang obert per eixe costat; un extrem present però
 * invàlid fa que no hi caiga res.
 */
export function dinsDeRang(d, rang) {
  if (!esDataValida(d) || !rang) return false;
  const { inici, fi } = rang;
  if (inici != null && (!esDataValida(inici) || comparaDates(d, inici) < 0)) return false;
  if (fi != null && (!esDataValida(fi) || comparaDates(d, fi) > 0)) return false;
  return true;
}

/** Número de sèrie d'Excel: dies des del 1899-12-30 (correcte des del 1900-03-01). */
export const serialExcel = (d) => diesEntre({ a: 1899, m: 12, d: 30 }, d);

/**
 * Nom del mes m (1-12) en 'ca' (per defecte), 'es' o 'en', en minúscules o
 * amb la inicial en majúscula; '' si el mes o la llengua no existixen.
 */
export function nomMes(m, idioma = 'ca', { majuscula = false } = {}) {
  const nom = Number.isInteger(m) ? NOMS_MESOS[idioma]?.[m - 1] : undefined;
  if (!nom) return '';
  return majuscula ? nom[0].toUpperCase() + nom.slice(1) : nom;
}
