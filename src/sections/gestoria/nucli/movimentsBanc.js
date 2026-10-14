/**
 * movimentsBanc.js — els moviments del banc en CSV i la fusió amb la Norma 43.
 *
 * llegeixMovimentsCsv llig el CSV que ix de convertir el full de moviments
 * del banc: capçalera «Fecha, F. valor, Concepto, Importe, Saldo» (l'ordre i
 * els accents no importen), dates ISO, punt decimal i un concepte que pot
 * ocupar diverses línies dins de cometes. Un import amb tres decimals o més
 * no es pot llegir sense dubte (seria un punt de milers?): queda null, amb
 * avís.
 *
 * fusionaMoviments aparella cada moviment de la Norma 43 amb la seua fila del
 * CSV per data d'operació, data valor i import amb signe; si n'hi ha diverses
 * d'iguals, per ordre d'aparició (un CSV amb la data més nova primer es llig
 * al revés). El CSV aporta el que la Norma 43 no porta: el comerç de les
 * compres amb targeta, sense el número de la targeta. Res del que rep es
 * modifica: els moviments aparellats es tornen com a còpies.
 * JS pur: sense DOM ni APIs de Node.
 */
import { totsElsMoviments } from './c43.js';
import { parseCsv } from './csv.js';
import { comparaDates, esDataValida, formatData, parseData } from './dates.js';
import { parseImport } from './diners.js';
import { llegeixExtracteCsv } from './extracteCsv.js';

/* Noms de columna (sense accents, espais ni punts) → camp del moviment. */
const COLUMNES = new Map(Object.entries({
  fecha: 'dataOperacio', data: 'dataOperacio', fechaoperacion: 'dataOperacio', dataoperacio: 'dataOperacio',
  fvalor: 'dataValor', fechavalor: 'dataValor', datavalor: 'dataValor',
  concepto: 'concepte', concepte: 'concepte',
  importe: 'import', import: 'import',
  saldo: 'saldo'
}));
const OBLIGATORIES = Object.freeze(['dataOperacio', 'dataValor', 'concepte', 'import']);
/* Punt decimal amb tres xifres o més darrere: «-1.234» pot ser 1,234 € o 1.234 €. */
const IMPORT_AMBIGU = /^[-+]?\d+\.\d{3,}$/;
/* La primera línia del concepte d'una compra (o devolució) amb targeta: «OP.TARJ.COMPRA COMERCIO». */
const TARGETA = /TARJ/i;
/* El número de targeta emmascarat que obri la segona línia: sis xifres, asteriscs i les quatre últimes. */
const NUMERO_TARGETA = /^\s*\d{4,6}[*xX]+\d{4}\s*/;

/* Els codis que pot tornar llegeixMovimentsCsv als avisos. */
export const CODIS_AVIS_CSV_BANC = Object.freeze(['CSV_BUIT', 'CAPCALERA', 'FILA_INVALIDA', 'IMPORT_AMBIGU']);

const senseAccents = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '');
const clauColumna = (nom) => senseAccents(nom).toLowerCase().replace(/[^a-z]/g, '');
const avis = (codi, severitat, missatge, extra = {}) => ({ codi, severitat, missatge, ...extra });

/**
 * El comerç d'una compra amb targeta: la segona línia del concepte, sense el
 * número de targeta. null si no és una compra amb targeta.
 * @param {string} concepte
 * @returns {string|null}
 */
export function comercDelConcepte(concepte) {
  const linies = String(concepte ?? '').split(/\r\n|\n|\r/);
  if (linies.length < 2 || !TARGETA.test(linies[0])) return null;
  const resta = linies.slice(1).join(' ');
  if (!NUMERO_TARGETA.test(resta)) return null;
  const comerc = resta.replace(NUMERO_TARGETA, '').replace(/\s+/g, ' ').trim();
  return comerc || null;
}

/* Un import del CSV: el punt decimal ambigu no es llig. */
function importDe(text, fila, avisos, nom) {
  if (text === '') return null;
  if (IMPORT_AMBIGU.test(text)) {
    avisos.push(avis('IMPORT_AMBIGU', 'mitjana', `Fila ${fila}: ${nom} té més de dos decimals i no es pot llegir sense dubte.`, { fila }));
    return null;
  }
  return parseImport(text);
}

/**
 * Llig el CSV de moviments del banc.
 * @param {string} text
 * @returns {{ moviments: Array<{ fila: number, dataOperacio: object|null, dataValor: object|null, concepte: string,
 *   centims: number|null, saldo: number|null, comerc?: string }>, avisos: object[] }}
 *   `fila` és la fila del CSV (la capçalera és la 1), no la línia del fitxer:
 *   un concepte en diverses línies és una sola fila.
 */
export function llegeixMovimentsCsv(text) {
  const files = parseCsv(typeof text === 'string' ? text : '');
  const inici = files.findIndex((fila) => fila.some((camp) => camp.trim() !== ''));
  if (inici < 0) return { moviments: [], avisos: [avis('CSV_BUIT', 'alta', 'El CSV de moviments no té cap fila.')] };
  const columnes = {};
  files[inici].forEach((nom, k) => {
    const camp = COLUMNES.get(clauColumna(nom));
    if (camp && !(camp in columnes)) columnes[camp] = k;
  });
  const falten = OBLIGATORIES.filter((camp) => !(camp in columnes));
  if (falten.length > 0) {
    return {
      moviments: [],
      avisos: [avis('CAPCALERA', 'alta', 'La primera fila no té les columnes de data, data valor, concepte i import: no és un CSV de moviments del banc.')]
    };
  }
  const avisos = [];
  const moviments = [];
  for (let k = inici + 1; k < files.length; k += 1) {
    const camps = files[k];
    if (camps.every((camp) => camp.trim() === '')) continue;
    const fila = k + 1;
    const valor = (camp) => (camp in columnes ? String(camps[columnes[camp]] ?? '').trim() : '');
    const concepte = String(camps[columnes.concepte] ?? '').split(/\r\n|\n|\r/).map((l) => l.trimEnd()).join('\n').trim();
    const moviment = {
      fila,
      dataOperacio: parseData(valor('dataOperacio')),
      dataValor: parseData(valor('dataValor')),
      concepte,
      centims: importDe(valor('import'), fila, avisos, 'l’import'),
      saldo: importDe(valor('saldo'), fila, avisos, 'el saldo')
    };
    const comerc = comercDelConcepte(concepte);
    if (comerc) moviment.comerc = comerc;
    if (!moviment.dataOperacio || !moviment.dataValor || moviment.centims === null) {
      avisos.push(avis('FILA_INVALIDA', 'mitjana', `Fila ${fila}: falta la data, la data valor o l’import; no es podrà aparellar.`, { fila }));
    }
    moviments.push(moviment);
  }
  return { moviments, avisos };
}

/* La clau de fusió: data d'operació, data valor i import amb signe. null si en falta algun. */
function clauDeFusio(m) {
  if (!esDataValida(m?.dataOperacio) || !esDataValida(m?.dataValor) || !Number.isSafeInteger(m?.centims)) return null;
  return `${formatData(m.dataOperacio, 'aaaa-mm-dd')}|${formatData(m.dataValor, 'aaaa-mm-dd')}|${m.centims}`;
}

/* Cert si les files van de la data més nova a la més antiga. */
function esDescendent(files) {
  const dates = files.map((f) => f?.dataOperacio).filter(esDataValida);
  return dates.length > 1 && comparaDates(dates[0], dates[dates.length - 1]) > 0;
}

/**
 * Fusiona els moviments de la Norma 43 amb les files del CSV del banc.
 * @param {object|object[]} c43 la lectura de llegeixC43 o una llista de moviments
 * @param {object|object[]} csv la lectura de llegeixMovimentsCsv o una llista de files
 * @returns {{ moviments: object[], senseParella: { c43: object[], csv: object[] } }}
 *   `moviments` són tots els de la Norma 43, en el seu ordre; els aparellats,
 *   copiats amb `filaCsv` i, si són de targeta, `comerc`.
 */
export function fusionaMoviments(c43, csv) {
  const delC43 = Array.isArray(c43) ? c43 : totsElsMoviments(c43);
  const delCsv = Array.isArray(csv) ? csv : (csv?.moviments ?? []);
  const files = esDescendent(delCsv) ? [...delCsv].reverse() : delCsv;
  const cues = new Map();
  for (const fila of files) {
    const clau = clauDeFusio(fila);
    if (clau === null) continue;
    if (!cues.has(clau)) cues.set(clau, []);
    cues.get(clau).push(fila);
  }
  const aparellades = new Set();
  const c43SenseParella = [];
  const moviments = delC43.map((m) => {
    const clau = clauDeFusio(m);
    const fila = clau === null ? undefined : cues.get(clau)?.shift();
    if (!fila) {
      c43SenseParella.push(m);
      return m;
    }
    aparellades.add(fila);
    return { ...m, filaCsv: fila.fila, ...(fila.comerc ? { comerc: fila.comerc } : {}) };
  });
  return { moviments, senseParella: { c43: c43SenseParella, csv: delCsv.filter((fila) => !aparellades.has(fila)) } };
}

/**
 * Llig qualsevol extracte bancari o de targeta en CSV (Sabadell, BBVA,
 * CaixaBank, Cajamar, targetes de crèdit i el full clàssic del banc).
 * Primer prova el lector estricte (`llegeixMovimentsCsv`, que preserva els
 * conceptes multilínia quan la capçalera és la clàssica i el signe ja ve
 * donat); si falta capçalera, hi ha preàmbul, columnes de càrrec/abonament,
 * coma decimal amb milers o gir de signe per saldo/targeta, delega en el
 * lector tolerant (`llegeixExtracteCsv`).
 * @param {string} text
 * @param {{ pista?: string }} [opcions]
 * @returns {{ moviments: object[], avisos: object[], format: object|null, origen: 'moviments'|'extracte' }}
 */
export function llegeixQualsevolCsvBanc(text, opcions = {}) {
  const estricte = llegeixMovimentsCsv(text);
  if (estricte.avisos.some((a) => a.codi === 'CSV_BUIT')) {
    return { moviments: [], avisos: estricte.avisos, format: null, origen: 'moviments' };
  }
  const tolerant = llegeixExtracteCsv(text, opcions);
  const capcaleraEstricte = !estricte.avisos.some((a) => a.codi === 'CAPCALERA');
  const validsEstricte = estricte.moviments.filter((m) => esDataValida(m.dataOperacio) && esDataValida(m.dataValor) && m.centims !== null).length;
  const necessitaTolerant = !capcaleraEstricte
    || validsEstricte === 0
    || tolerant.format?.signe === 'girat'
    || (tolerant.format?.targeta === true && estricte.moviments.every((m) => !m.comerc))
    || (estricte.avisos.length > 0 && tolerant.moviments.length > validsEstricte);

  if (!necessitaTolerant) {
    return { moviments: estricte.moviments, avisos: estricte.avisos, format: tolerant.format, origen: 'moviments' };
  }
  if (tolerant.moviments.length > 0 || tolerant.format !== null) {
    return { moviments: tolerant.moviments, avisos: tolerant.avisos, format: tolerant.format, origen: 'extracte' };
  }
  if (estricte.moviments.length > 0) {
    return { moviments: estricte.moviments, avisos: estricte.avisos, format: null, origen: 'moviments' };
  }
  return { moviments: [], avisos: tolerant.avisos, format: null, origen: 'extracte' };
}

