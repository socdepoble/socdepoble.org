/**
 * Lector de notícies · les dates d'un feed (nucli pur, sense rellotge).
 *
 * L'aritmètica civil és pròpia (els dies des de 1970 per l'algorisme de
 * Howard Hinnant): ni el fus de qui llig ni el parser de cada motor decidixen
 * res. Tot el que ix és ISO 8601 en UTC («2026-10-03T07:30:00.000Z»).
 *
 *   llegixData(text)  RFC 822/2822 (pubDate) o ISO 8601 (Atom, dc:date) → ISO o null
 *     · el dia de la setmana és opcional i no es comprova;
 *     · mesos en anglés o abreujats en valencià o castellà («oct.», «des.»);
 *     · anys de dues xifres (< 50 → 20xx) i zones GMT, UT, UTC, Z, EST…,
 *       CET/CEST i ±hhmm o ±hh:mm; sense zona, UTC;
 *     · el que no és una data de veres (31 de febrer, 25:00) → null.
 *   msDeData(iso)     els mil·lisegons des de 1970, o null
 *   isoDeMs(ms)       al revés
 *   horaRelativa(iso, ara, desfas)   «ara mateix», «fa 5 min», «fa 2 h»,
 *                     «fa 3 dies», «3 d’octubre», «3 d’octubre de 2025»
 *   dataLlarga(iso, desfas)          «3 d’octubre de 2026, 09:30»
 * `ara` el passa la UI (injectable a les proves) i `desfas` són els minuts del
 * fus de qui llig respecte d'UTC (+120 a l'estiu de València).
 */

const MINUT = 60000;
const HORA = 60 * MINUT;
const DIA = 24 * HORA;

/* Les tres primeres lletres (sense punt) → mes. Anglés, valencià i castellà. */
const MESOS = Object.freeze({
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  gen: 1, abr: 4, mai: 5, ago: 8, ag: 8, set: 9, des: 12, ene: 1, dic: 12
});

const ZONES = Object.freeze({
  z: 0, ut: 0, utc: 0, gmt: 0, wet: 0, west: 60, cet: 60, cest: 120,
  est: -300, edt: -240, cst: -360, cdt: -300, mst: -420, mdt: -360, pst: -480, pdt: -420
});

const DE_MES = Object.freeze(['de gener', 'de febrer', 'de març', 'd’abril', 'de maig', 'de juny', 'de juliol',
  'd’agost', 'de setembre', 'd’octubre', 'de novembre', 'de desembre']);

const esTraspas = (any) => (any % 4 === 0 && any % 100 !== 0) || any % 400 === 0;
const diesDelMes = (any, mes) => [31, esTraspas(any) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];

/** Dies des de l'1-1-1970 d'una data del calendari gregorià proléptic. */
export function diesDesDe1970(any, mes, dia) {
  const a = any - (mes <= 2 ? 1 : 0);
  const era = Math.floor(a / 400);
  const anyDeLEra = a - era * 400;
  const diaDeLAny = Math.floor((153 * (mes + (mes > 2 ? -3 : 9)) + 2) / 5) + dia - 1;
  const diaDeLEra = anyDeLEra * 365 + Math.floor(anyDeLEra / 4) - Math.floor(anyDeLEra / 100) + diaDeLAny;
  return era * 146097 + diaDeLEra - 719468;
}

/** Al revés: [any, mes, dia] d'un nombre de dies des de 1970. */
export function civilDe(dies) {
  const z = dies + 719468;
  const era = Math.floor(z / 146097);
  const diaDeLEra = z - era * 146097;
  const anyDeLEra = Math.floor((diaDeLEra - Math.floor(diaDeLEra / 1460) + Math.floor(diaDeLEra / 36524) - Math.floor(diaDeLEra / 146096)) / 365);
  const diaDeLAny = diaDeLEra - (365 * anyDeLEra + Math.floor(anyDeLEra / 4) - Math.floor(anyDeLEra / 100));
  const mp = Math.floor((5 * diaDeLAny + 2) / 153);
  const dia = diaDeLAny - Math.floor((153 * mp + 2) / 5) + 1;
  const mes = mp < 10 ? mp + 3 : mp - 9;
  return [anyDeLEra + era * 400 + (mes <= 2 ? 1 : 0), mes, dia];
}

const dues = (n) => String(n).padStart(2, '0');

/** ISO 8601 en UTC, amb mil·lisegons. */
export function isoDeMs(ms) {
  if (!Number.isFinite(ms)) return null;
  const dies = Math.floor(ms / DIA);
  const resta = ms - dies * DIA;
  const [any, mes, dia] = civilDe(dies);
  if (any < 1000 || any > 9999) return null;
  const hora = Math.floor(resta / HORA);
  const minut = Math.floor((resta % HORA) / MINUT);
  const segon = Math.floor((resta % MINUT) / 1000);
  const mil = String(Math.floor(resta % 1000)).padStart(3, '0');
  return `${any}-${dues(mes)}-${dues(dia)}T${dues(hora)}:${dues(minut)}:${dues(segon)}.${mil}Z`;
}

/* Els mil·lisegons d'unes parts ja llegides, o null si no és una data de veres. */
function msDeParts({ any, mes, dia, hora = 0, minut = 0, segon = 0, mil = 0, desfas = 0 }) {
  if (![any, mes, dia, hora, minut, segon, mil, desfas].every(Number.isInteger)) return null;
  if (any < 1900 || any > 9999 || mes < 1 || mes > 12 || dia < 1 || dia > diesDelMes(any, mes)) return null;
  if (hora > 23 || minut > 59 || segon > 60 || Math.abs(desfas) > 18 * 60) return null;
  const segons = Math.min(segon, 59);
  return diesDesDe1970(any, mes, dia) * DIA + hora * HORA + minut * MINUT + segons * 1000 + mil - desfas * MINUT;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?\s*(Z|z|[+-]\d{2}(?::?\d{2})?)?)?$/;
const RFC = /^(?:[A-Za-zÀ-ÿ.]+,?\s+)?(\d{1,2})[\s-]+([A-Za-zÀ-ÿ.]+)[\s-]+(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*([A-Za-z]{1,5}|[+-]\d{2}:?\d{2})?$/;

function desfasDe(zona) {
  if (!zona) return 0;
  if (/^[+-]/.test(zona)) {
    const xifres = zona.replace(':', '');
    const signe = xifres[0] === '-' ? -1 : 1;
    const hores = Number(xifres.slice(1, 3));
    const minuts = xifres.length > 3 ? Number(xifres.slice(3, 5)) : 0;
    return minuts > 59 ? NaN : signe * (hores * 60 + minuts);
  }
  const nom = zona.toLowerCase();
  if (Object.hasOwn(ZONES, nom)) return ZONES[nom];
  /* Les zones militars d'una lletra no es poden saber (RFC 2822 §4.3): UTC. */
  return nom.length === 1 ? 0 : NaN;
}

function llegixIso(text) {
  const m = ISO.exec(text);
  if (!m) return null;
  const mil = m[7] ? Number(m[7].slice(0, 3).padEnd(3, '0')) : 0;
  return msDeParts({
    any: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]),
    hora: m[4] ? Number(m[4]) : 0, minut: m[5] ? Number(m[5]) : 0, segon: m[6] ? Number(m[6]) : 0, mil,
    desfas: desfasDe(m[8] && m[8].toLowerCase() !== 'z' ? m[8] : null)
  });
}

function llegixRfc(text) {
  const m = RFC.exec(text);
  if (!m) return null;
  const mes = m[2].toLowerCase().replace(/\./g, '');
  const clau = Object.hasOwn(MESOS, mes.slice(0, 3)) ? mes.slice(0, 3) : mes.slice(0, 2);
  if (!Object.hasOwn(MESOS, clau)) return null;
  let any = Number(m[3]);
  if (m[3].length === 2) any += any < 50 ? 2000 : 1900;
  else if (m[3].length === 3) any += 1900;
  return msDeParts({
    any, mes: MESOS[clau], dia: Number(m[1]),
    hora: m[4] ? Number(m[4]) : 0, minut: m[5] ? Number(m[5]) : 0, segon: m[6] ? Number(m[6]) : 0,
    desfas: desfasDe(m[7] || null)
  });
}

/** Una data d'un feed (RFC 822 o ISO 8601) en ISO UTC, o null. */
export function llegixData(text) {
  if (typeof text !== 'string') return null;
  const net = text.trim().replace(/\s+/g, ' ');
  if (net === '' || net.length > 64) return null;
  const ms = llegixIso(net) ?? llegixRfc(net);
  return ms === null || Number.isNaN(ms) ? null : isoDeMs(ms);
}

/** Els mil·lisegons d'una data ISO (o RFC), o null. */
export function msDeData(text) {
  const iso = llegixData(text);
  return iso === null ? null : llegixIso(iso);
}

/* [any, mes, dia, hora, minut] al fus de qui llig. */
function partsLocals(ms, desfas) {
  const local = ms + (Number.isFinite(desfas) ? desfas : 0) * MINUT;
  const dies = Math.floor(local / DIA);
  const resta = local - dies * DIA;
  return [...civilDe(dies), Math.floor(resta / HORA), Math.floor((resta % HORA) / MINUT)];
}

/** «3 d’octubre» o, d'un altre any, «3 d’octubre de 2025». */
export function dataCurta(iso, ara, desfas = 0) {
  const ms = msDeData(iso);
  if (ms === null) return '';
  const [any, mes, dia] = partsLocals(ms, desfas);
  const anyAra = Number.isFinite(ara) ? partsLocals(ara, desfas)[0] : any;
  return `${dia} ${DE_MES[mes - 1]}${any === anyAra ? '' : ` de ${any}`}`;
}

/** «3 d’octubre de 2026, 09:30». */
export function dataLlarga(iso, desfas = 0) {
  const ms = msDeData(iso);
  if (ms === null) return '';
  const [any, mes, dia, hora, minut] = partsLocals(ms, desfas);
  return `${dia} ${DE_MES[mes - 1]} de ${any}, ${dues(hora)}:${dues(minut)}`;
}

/** Quant fa, en valencià, des de `iso` fins a `ara` (ms). Una data futura, absoluta. */
export function horaRelativa(iso, ara, desfas = 0) {
  const ms = msDeData(iso);
  if (ms === null || !Number.isFinite(ara)) return '';
  const diferencia = ara - ms;
  if (diferencia < -5 * MINUT) return dataCurta(iso, ara, desfas);
  if (diferencia < MINUT) return 'ara mateix';
  if (diferencia < HORA) return `fa ${Math.floor(diferencia / MINUT)} min`;
  if (diferencia < DIA) return `fa ${Math.floor(diferencia / HORA)} h`;
  const dies = Math.floor(diferencia / DIA);
  if (dies < 7) return dies === 1 ? 'fa 1 dia' : `fa ${dies} dies`;
  return dataCurta(iso, ara, desfas);
}
