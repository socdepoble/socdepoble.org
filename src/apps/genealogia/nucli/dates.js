/**
 * dates.js — Arbre Genealògic · dates amb les 4 precisions (FamyTree).
 *
 *   exacta       '1908', '1908-03' o '1908-03-12'   interval [a, a]
 *   aproximada   '~1908' o la dècada '1930s' (any 1935)  interval [a-5, a+5]
 *   estimada     '1908?'                            interval [a-10, a+10]
 *   desconeguda  '' o '?'                           sense interval
 *
 * DataGen = { precisio, any, mes, dia } (objecte pla, mes i dia només en
 * l'exacta). Totes les regex van ancorades i tenen amplada fixa: no hi ha
 * backtracking possible. El temps entra per `anyActual`: cap rellotge intern.
 */
import { ANY_MINIM, MARGE_PRECISIO, PRECISIONS } from './constants.js';
import { enter, objectePla } from './segur.js';

const RE_EXACTA = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/;
const RE_APROXIMADA = /^~(\d{4})$/;
const RE_ESTIMADA = /^(\d{4})\?$/;
export const MESOS_GEDCOM = Object.freeze(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']);
const RE_GEDCOM = /^(?:(\d{1,2}) )?(?:([A-Z]{3}) )?(\d{3,4})$/;
const QUALIFICADORS = new Set(['ABT', 'CAL', 'EST', 'BEF', 'AFT', 'BET', 'FROM', 'TO']);
const RE_DECADA = /^(\d{3})0s$/;

function exigeixAnyActual(anyActual) {
  if (!Number.isSafeInteger(anyActual)) throw new TypeError('Cal `anyActual` (un enter) per a validar les dates.');
}

const esTraspas = (any) => (any % 4 === 0 && any % 100 !== 0) || any % 400 === 0;
const DIES_MES = Object.freeze([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
const diesDelMes = (any, mes) => (mes === 2 && esTraspas(any) ? 29 : DIES_MES[mes - 1]);

/** La data que no se sap. */
export function dataDesconeguda() {
  return { precisio: 'desconeguda', any: null, mes: null, dia: null };
}

/**
 * Llig una data escrita per la persona o per un fitxer.
 * Torna { ok, data, error: null | 'format' | 'rang' } i no llança mai.
 */
export function llegeixData(textData, { anyActual } = {}) {
  exigeixAnyActual(anyActual);
  const ko = (error) => ({ ok: false, data: dataDesconeguda(), error });
  let cru;
  if (textData === null || textData === undefined) cru = '';
  else if (typeof textData === 'string') cru = textData;
  else if (typeof textData === 'number' && Number.isSafeInteger(textData)) cru = String(textData);
  else return ko('format');
  const net = cru.trim();
  if (net.length > 64) return ko('format');
  if (QUALIFICADORS.has(net.split(' ', 1)[0])) {
    const { data } = llegeixDataGedcom(net, anyActual);
    return data ? { ok: true, data, error: null } : ko('format');
  }
  if (net.length > 12) return ko('format');
  if (net === '' || net === '?') return { ok: true, data: dataDesconeguda(), error: null };

  const anyValid = (any) => any >= ANY_MINIM && any <= anyActual + 1;
  let trobat = RE_APROXIMADA.exec(net);
  if (trobat) {
    const any = Number(trobat[1]);
    return anyValid(any) ? { ok: true, data: { precisio: 'aproximada', any, mes: null, dia: null }, error: null } : ko('rang');
  }
  trobat = RE_ESTIMADA.exec(net);
  if (trobat) {
    const any = Number(trobat[1]);
    return anyValid(any) ? { ok: true, data: { precisio: 'estimada', any, mes: null, dia: null }, error: null } : ko('rang');
  }
  trobat = RE_DECADA.exec(net);
  if (trobat) {
    const any = Number(trobat[1]) * 10 + 5;
    /* El centre de la dècada ha de ser un any admés: així la data desada
       sempre torna a passar per netejaData. */
    return anyValid(any) ?{ ok: true, data: { precisio: 'aproximada', any, mes: null, dia: null }, error: null } : ko('rang');
  }
  trobat = RE_EXACTA.exec(net);
  if (!trobat) return ko('format');
  /* '1908--12' no casa; '1908-12' és el mes; el dia només amb mes. */
  if (trobat[2] === undefined && trobat[3] !== undefined) return ko('format');
  const any = Number(trobat[1]);
  if (!anyValid(any)) return ko('rang');
  const mes = trobat[2] === undefined ? null : Number(trobat[2]);
  const dia = trobat[3] === undefined ? null : Number(trobat[3]);
  if (mes !== null && (mes < 1 || mes > 12)) return ko('rang');
  if (dia !== null && (dia < 1 || dia > diesDelMes(any, mes))) return ko('rang');
  return { ok: true, data: { precisio: 'exacta', any, mes, dia }, error: null };
}

const dosXifres = (n) => String(n).padStart(2, '0');

/** Llig els valors gregorians GEDCOM amb la precisió i els límits originals. */
export function llegeixDataGedcom(cru, anyActual) {
  exigeixAnyActual(anyActual);
  if (typeof cru !== 'string' || cru.length > 64) return { data: null, avis: 'data-format' };
  const net = cru.trim().toUpperCase().split(' ').filter(Boolean).join(' ');
  if (!net) return { data: null, avis: null };
  const paraules = net.split(' ');
  if (paraules[0] === '@#DGREGORIAN@' || paraules[0] === 'GREGORIAN') paraules.shift();
  if (paraules[0]?.startsWith('@#') || ['JULIAN', 'HEBREW', 'FRENCH_R'].includes(paraules[0])) {
    return { data: null, avis: 'data-calendari' };
  }
  const qualificador = QUALIFICADORS.has(paraules[0]) ? paraules.shift() : '';
  const separador = qualificador === 'BET' ? 'AND' : qualificador === 'FROM' ? 'TO' : '';
  const index = separador ? paraules.indexOf(separador) : -1;
  const principal = parsejaDataGedcom(index === -1 ? paraules : paraules.slice(0, index), anyActual);
  const fi = index === -1 ? null : parsejaDataGedcom(paraules.slice(index + 1), anyActual);
  if (!principal.data || (index !== -1 && !fi?.data) || (qualificador === 'BET' && !fi)) {
    return { data: null, avis: principal.avis || fi?.avis || 'data-format' };
  }
  const inici = principal.data;
  const final = fi?.data;
  if (final && ordreCalendari(inici) > ordreCalendari(final, true)) return { data: null, avis: 'data-invalida' };
  if (!qualificador) return principal;
  const precisio = qualificador === 'CAL' || qualificador === 'EST' ? 'estimada' : 'aproximada';
  const data = { precisio, any: inici.any, mes: null, dia: null };
  if (inici.mes !== null || !['ABT', 'EST'].includes(qualificador)) {
    data.gedcom = escriuQualificada(qualificador, inici, final);
  }
  return { data, avis: null };
}

function parsejaDataGedcom(paraules, anyActual) {
  const match = RE_GEDCOM.exec(paraules.join(' '));
  if (!match) return { data: null, avis: 'data-format' };
  const [, dia, codiMes, any] = match;
  const mes = codiMes ? MESOS_GEDCOM.indexOf(codiMes) + 1 : null;
  if (mes === 0 || (dia && !mes)) return { data: null, avis: 'data-format' };
  const canonica = [any.padStart(4, '0'), ...(mes ? [dosXifres(mes)] : []), ...(dia ? [dosXifres(Number(dia))] : [])].join('-');
  const llegida = llegeixData(canonica, { anyActual });
  return llegida.ok ? { data: llegida.data, avis: null } : { data: null, avis: 'data-invalida' };
}

function ordreCalendari({ any, mes, dia }, final = false) {
  return any * 10000 + (mes ?? (final ? 12 : 1)) * 100 + (dia ?? (final ? 31 : 1));
}

function escriuSimple({ any, mes, dia }) {
  return [dia, mes ? MESOS_GEDCOM[mes - 1] : null, any].filter((camp) => camp != null).join(' ');
}

function escriuQualificada(qualificador, inici, fi) {
  const primera = `${qualificador} ${escriuSimple(inici)}`;
  return fi ? `${primera} ${qualificador === 'BET' ? 'AND' : 'TO'} ${escriuSimple(fi)}` : primera;
}

export function escriuDataGedcom(data) {
  if (!data || !Number.isSafeInteger(data.any)) return '';
  if (data.gedcom) return data.gedcom;
  if (data.precisio === 'aproximada') return `ABT ${data.any}`;
  if (data.precisio === 'estimada') return `EST ${data.any}`;
  return data.precisio === 'exacta' ? escriuSimple(data) : '';
}

/** La forma canònica (inversa de llegeixData): '1908', '1908-03-12', '~1908', '1908?' o ''. */
export function escriuData(data) {
  if (!data || data.precisio === 'desconeguda' || !Number.isSafeInteger(data.any)) return '';
  if (data.gedcom) return data.gedcom;
  if (data.precisio === 'aproximada') return `~${data.any}`;
  if (data.precisio === 'estimada') return `${data.any}?`;
  if (!Number.isSafeInteger(data.mes)) return String(data.any);
  if (!Number.isSafeInteger(data.dia)) return `${data.any}-${dosXifres(data.mes)}`;
  return `${data.any}-${dosXifres(data.mes)}-${dosXifres(data.dia)}`;
}

/**
 * La llista blanca d'una data: accepta un DataGen o un text de llegeixData.
 * null/undefined → desconeguda. Llança TypeError si no és vàlida.
 */
export function netejaData(cru, { anyActual } = {}) {
  exigeixAnyActual(anyActual);
  if (cru === null || cru === undefined) return dataDesconeguda();
  if (typeof cru === 'string' || typeof cru === 'number') {
    const llegida = llegeixData(cru, { anyActual });
    if (!llegida.ok) throw new TypeError(`Data no vàlida (${llegida.error}).`);
    return llegida.data;
  }
  if (!objectePla(cru) || !PRECISIONS.includes(cru.precisio)) throw new TypeError('Data no vàlida.');
  if (Object.hasOwn(cru, 'gedcom')) {
    if (typeof cru.gedcom !== 'string' || cru.gedcom.length > 64) throw new TypeError('Data GEDCOM no vàlida.');
    const { data } = llegeixDataGedcom(cru.gedcom, anyActual);
    if (!data?.gedcom || data.any !== cru.any || data.precisio !== cru.precisio) throw new TypeError('Data GEDCOM discordant.');
    return data;
  }
  if (cru.precisio === 'desconeguda') return dataDesconeguda();
  const any = enter(cru.any, { min: ANY_MINIM, max: anyActual + 1 });
  if (any === null) throw new TypeError('Any de la data fora de rang.');
  if (cru.precisio !== 'exacta') {
    if ((cru.mes ?? null) !== null || (cru.dia ?? null) !== null) throw new TypeError('Una data aproximada o estimada no porta mes ni dia.');
    return { precisio: cru.precisio, any, mes: null, dia: null };
  }
  const mes = cru.mes === null || cru.mes === undefined ? null : enter(cru.mes, { min: 1, max: 12 });
  if (cru.mes !== null && cru.mes !== undefined && mes === null) throw new TypeError('Mes no vàlid.');
  if (cru.dia === null || cru.dia === undefined) return { precisio: 'exacta', any, mes, dia: null };
  if (mes === null) throw new TypeError('Un dia sense mes no és una data.');
  const dia = enter(cru.dia, { min: 1, max: diesDelMes(any, mes) });
  if (dia === null) throw new TypeError('Dia no vàlid.');
  return { precisio: 'exacta', any, mes, dia };
}

/** L'interval d'anys possible: exacta ±0, aproximada ±5, estimada ±10; desconeguda null. */
export function intervalAny(data) {
  if (!data || !Object.hasOwn(MARGE_PRECISIO, data.precisio) || !Number.isSafeInteger(data.any)) return null;
  if (data.gedcom) {
    const qualificador = data.gedcom.split(' ', 1)[0];
    if (qualificador === 'BEF' || qualificador === 'TO') return { min: ANY_MINIM, max: data.any };
    // Un «després de» no dona cap fita superior i no acredita una antiguitat.
    if (qualificador === 'AFT') return null;
    const ultima = Number(data.gedcom.slice(data.gedcom.lastIndexOf(' ') + 1));
    if (qualificador === 'BET' || qualificador === 'FROM') {
      return qualificador === 'BET' || data.gedcom.includes(' TO ') ? { min: data.any, max: ultima } : null;
    }
  }
  const marge = MARGE_PRECISIO[data.precisio];
  return { min: data.any - marge, max: data.any + marge };
}

/**
 * Compara dues dates tenint en compte la precisió de cadascuna:
 * 'abans' (a acaba abans que b comence), 'despres', 'solapa' (no es pot
 * ordenar amb seguretat) o null si alguna és desconeguda.
 */
export function relacioDates(a, b) {
  const x = intervalAny(a);
  const y = intervalAny(b);
  if (!x || !y) return null;
  if (x.max < y.min) return 'abans';
  if (x.min > y.max) return 'despres';
  return 'solapa';
}

/** Per a ordenar llistes: per any (les desconegudes al final) i després per precisió. */
export function comparaDates(a, b) {
  const x = intervalAny(a);
  const y = intervalAny(b);
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  if (a.any !== b.any) return a.any - b.any;
  return PRECISIONS.indexOf(a.precisio) - PRECISIONS.indexOf(b.precisio);
}

/**
 * L'etiqueta curta per a la vista: '1908', '~1908', '1908?', '12/03/1908'
 * (en basc '1908/03/12') o '' per a la desconeguda (la interfície hi posa el
 * seu text).
 */
export function etiquetaData(data, idioma = 'ca') {
  if (!data || data.precisio === 'desconeguda' || !Number.isSafeInteger(data.any)) return '';
  if (data.gedcom) return data.gedcom;
  if (data.precisio === 'aproximada') return `~${data.any}`;
  if (data.precisio === 'estimada') return `${data.any}?`;
  if (!Number.isSafeInteger(data.mes)) return String(data.any);
  const parts = Number.isSafeInteger(data.dia) ? [dosXifres(data.dia), dosXifres(data.mes), String(data.any)] : [dosXifres(data.mes), String(data.any)];
  return idioma === 'eu' ? [...parts].reverse().join('/') : parts.join('/');
}
