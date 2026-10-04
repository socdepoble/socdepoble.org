/**
 * empremta.js — l'empremta («Huella») dels registres de facturació de Veri*Factu.
 *
 * Algoritme de l'AEAT (Orde HAC/1177/2024 i el document «Algoritmo de
 * cálculo de codificación de la huella o hash»): SHA-256 sobre el text UTF-8
 * de les parelles «Camp=valor» unides amb «&», en l'ordre fix de
 * l'especificació, i el resultat en hexadecimal MAJÚSCULES. Les trampes,
 * blindades ací:
 *   · el camp Huella hi va sempre, buit en el primer registre de la cadena;
 *   · cap codificació URL dins del text, i cada valor sense espais als extrems;
 *   · imports amb punt i dos decimals: «123.40», mai «123.4» ni «123,40»
 *     (diners.formatImport escriu coma: no servix);
 *   · data d'expedició dd-mm-aaaa (la del model és aaaa-mm-dd);
 *   · data i hora de generació en ISO 8601 amb el desfase de la zona
 *     (Europe/Madrid) en el moment de generar: «2024-01-01T19:20:30+01:00».
 * Els dos casos del document oficial són proves (empremta.test.js).
 *
 * JS pur: sense DOM, React ni xarxa. El resum el fa WebCrypto (sha256Hex de
 * la Porta d'Aprovació), que rep `subtle` per paràmetre.
 */
import { sha256Hex } from '../../../tractors/nucli/canonic.js';
import { esDataIso } from '../comu.js';

/* Zona horària del desfase: la de l'obligat tributari a la Península i les Balears. */
export const ZONA_AEAT = 'Europe/Madrid';
/* TipoHuella de l'AEAT: 01 és SHA-256. */
export const TIPUS_EMPREMTA = '01';

const EMPREMTA = /^[0-9A-F]{64}$/;
const DATA_HORA_HUS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
const DATA_AEAT = /^\d{2}-\d{2}-\d{4}$/;
const IMPORT_AEAT = /^-?\d{1,12}\.\d{2}$/;
const MAX_CENTIMS = 99999999999999;

/* Cert si el text té la forma d'una empremta: 64 xifres hexadecimals en majúscules. */
export const esEmpremta = (text) => typeof text === 'string' && EMPREMTA.test(text);
/* Cert si el text és una data i hora ISO 8601 amb desfase, al segon. */
export const esDataHoraHus = (text) => typeof text === 'string' && DATA_HORA_HUS.test(text) && Number.isFinite(Date.parse(text));

/**
 * Cèntims → import de l'AEAT, amb punt i dos decimals: 12345 → '123.45', -5 → '-0.05'.
 * @param {number} centims enter segur, com a molt 12 xifres enteres
 * @returns {string}
 */
export function importAEAT(centims) {
  if (!Number.isSafeInteger(centims) || Math.abs(centims) > MAX_CENTIMS) {
    throw new RangeError('Import de l\'AEAT: cal un enter de cèntims amb 12 xifres enteres com a molt.');
  }
  const absolut = Math.abs(centims);
  const euros = (absolut - (absolut % 100)) / 100;
  return `${centims < 0 ? '-' : ''}${euros}.${String(absolut % 100).padStart(2, '0')}`;
}

/**
 * Data del model → data de l'AEAT: '2024-01-01' → '01-01-2024'.
 * @param {string} iso
 * @returns {string}
 */
export function dataAEAT(iso) {
  if (!esDataIso(iso)) throw new RangeError('Data de l\'AEAT: cal una data «aaaa-mm-dd» que existisca.');
  const [any, mes, dia] = iso.split('-');
  return `${dia}-${mes}-${any}`;
}

const dos = (n) => String(n).padStart(2, '0');

/**
 * L'instant en ISO 8601 amb el desfase de la zona en eixe moment, al segon:
 * dataHoraAmbHus(Date.UTC(2024, 0, 1, 18, 20, 30)) → '2024-01-01T19:20:30+01:00'.
 * El desfase es calcula amb Intl (les regles d'estiu les porta el navegador), no es suposa.
 * @param {number|Date} instant mil·lisegons UTC o una Date
 * @param {string} [zona] per defecte Europe/Madrid
 * @returns {string}
 */
export function dataHoraAmbHus(instant, zona = ZONA_AEAT) {
  const ms = instant instanceof Date ? instant.getTime() : instant;
  if (!Number.isFinite(ms)) throw new RangeError('Cal un instant vàlid (mil·lisegons o Date).');
  const segons = ms - (((ms % 1000) + 1000) % 1000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(segons)).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]));
  const local = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const desfase = Math.round((local - segons) / 60000);
  const absolut = Math.abs(desfase);
  const hus = `${desfase < 0 ? '-' : '+'}${dos((absolut - (absolut % 60)) / 60)}:${dos(absolut % 60)}`;
  return `${String(parts.year).padStart(4, '0')}-${dos(parts.month)}-${dos(parts.day)}T${dos(parts.hour)}:${dos(parts.minute)}:${dos(parts.second)}${hus}`;
}

/* «Camp=valor» unides amb «&», cada valor sense espais als extrems i sense codificar. */
function uneix(parelles) {
  return parelles.map(([camp, valor]) => `${camp}=${String(valor).trim()}`).join('&');
}

function comprova(condicio, camp) {
  if (!condicio) throw new TypeError(`Empremta: el camp ${camp} no té el format de l'AEAT.`);
}

/**
 * El text que es resumix per a un registre d'ALTA, amb els valors ja en format de l'AEAT.
 * @param {{ idEmisor: string, numSerie: string, dataExpedicio: string, tipusFactura: string,
 *   quotaTotal: string, importTotal: string, empremtaAnterior: string, dataHoraHusGeneracio: string }} c
 * @returns {string}
 */
export function cadenaAlta(c) {
  comprova(typeof c?.idEmisor === 'string' && c.idEmisor.trim() !== '', 'IDEmisorFactura');
  comprova(typeof c.numSerie === 'string' && c.numSerie.trim() !== '', 'NumSerieFactura');
  comprova(DATA_AEAT.test(c.dataExpedicio ?? ''), 'FechaExpedicionFactura');
  comprova(typeof c.tipusFactura === 'string' && c.tipusFactura.trim() !== '', 'TipoFactura');
  comprova(IMPORT_AEAT.test(c.quotaTotal ?? ''), 'CuotaTotal');
  comprova(IMPORT_AEAT.test(c.importTotal ?? ''), 'ImporteTotal');
  comprova(c.empremtaAnterior === '' || esEmpremta(c.empremtaAnterior), 'Huella');
  comprova(esDataHoraHus(c.dataHoraHusGeneracio), 'FechaHoraHusoGenRegistro');
  return uneix([
    ['IDEmisorFactura', c.idEmisor],
    ['NumSerieFactura', c.numSerie],
    ['FechaExpedicionFactura', c.dataExpedicio],
    ['TipoFactura', c.tipusFactura],
    ['CuotaTotal', c.quotaTotal],
    ['ImporteTotal', c.importTotal],
    ['Huella', c.empremtaAnterior],
    ['FechaHoraHusoGenRegistro', c.dataHoraHusGeneracio]
  ]);
}

/**
 * El text que es resumix per a un registre d'ANUL·LACIÓ, amb els valors ja en format de l'AEAT.
 * @param {{ idEmisor: string, numSerie: string, dataExpedicio: string, empremtaAnterior: string,
 *   dataHoraHusGeneracio: string }} c
 * @returns {string}
 */
export function cadenaAnulacio(c) {
  comprova(typeof c?.idEmisor === 'string' && c.idEmisor.trim() !== '', 'IDEmisorFacturaAnulada');
  comprova(typeof c.numSerie === 'string' && c.numSerie.trim() !== '', 'NumSerieFacturaAnulada');
  comprova(DATA_AEAT.test(c.dataExpedicio ?? ''), 'FechaExpedicionFacturaAnulada');
  comprova(c.empremtaAnterior === '' || esEmpremta(c.empremtaAnterior), 'Huella');
  comprova(esDataHoraHus(c.dataHoraHusGeneracio), 'FechaHoraHusoGenRegistro');
  return uneix([
    ['IDEmisorFacturaAnulada', c.idEmisor],
    ['NumSerieFacturaAnulada', c.numSerie],
    ['FechaExpedicionFacturaAnulada', c.dataExpedicio],
    ['Huella', c.empremtaAnterior],
    ['FechaHoraHusoGenRegistro', c.dataHoraHusGeneracio]
  ]);
}

/**
 * SHA-256 del text en UTF-8, en hexadecimal MAJÚSCULES.
 * @param {string} cadena
 * @param {SubtleCrypto} [subtle] per defecte, crypto.subtle
 * @returns {Promise<string>}
 */
export async function calculaEmpremta(cadena, subtle) {
  if (typeof cadena !== 'string' || cadena === '') throw new TypeError('Empremta: cal el text del registre.');
  return (await sha256Hex(cadena, subtle)).toUpperCase();
}

/* Els camps de l'AEAT d'un registre del model (alta o anul·lació), a partir dels seus valors. */
export function campsAEAT(registre) {
  const comuns = {
    idEmisor: registre.idEmisor,
    numSerie: registre.numSerie,
    dataExpedicio: dataAEAT(registre.dataExpedicio),
    empremtaAnterior: registre.encadenament?.empremta ?? '',
    dataHoraHusGeneracio: registre.dataHoraHusGeneracio
  };
  if (registre.tipusRegistre === 'anulacio') return comuns;
  return {
    ...comuns,
    tipusFactura: registre.tipusFactura,
    quotaTotal: importAEAT(registre.quotaTotal),
    importTotal: importAEAT(registre.importTotal)
  };
}

/**
 * L'empremta que li correspon a un registre del model (alta o anul·lació):
 * la que es calcula en crear-lo i la que es torna a calcular en verificar la cadena.
 * @param {object} registre
 * @param {SubtleCrypto} [subtle]
 * @returns {Promise<string>}
 */
export async function empremtaDeRegistre(registre, subtle) {
  const camps = campsAEAT(registre);
  return calculaEmpremta(registre.tipusRegistre === 'anulacio' ? cadenaAnulacio(camps) : cadenaAlta(camps), subtle);
}
