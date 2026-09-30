/**
 * esdeveniment.js — el model d'esdeveniment dels calendaris, pur (sense React
 * ni DOM).
 *
 * T8 (ordre del Mestre, 260930) · Una sola forma per a tot el que es pinta en
 * un calendari: els actes de l'Agenda del Mur, les tasques del Mapa de la
 * Consola i, el dia que s'endolle, Google Calendar o un fitxer .ics. És
 * compatible amb l'RFC 5545 (iCalendar) i amb el recurs Event de l'API v3 de
 * Google Calendar: els noms de fora (DTSTART, start.dateTime…) són els
 * d'eixes dos especificacions i els de dins, en valencià. Cap API: les
 * funcions de Google només traduïxen objectes. L'enxufe viurà a
 * src/data/adaptadors/ i la interfície només coneixerà este model (Model B).
 *
 * MODEL (congelat; creaEsdeveniment torna null si alguna peça no és vàlida)
 *   uid          UID / iCalUID. Estable; per defecte «tipus:id@socdepoble.org».
 *   id           L'id local de la font.
 *   titol        SUMMARY / summary. Obligatori.
 *   descripcio   DESCRIPTION / description, text pla, o null.
 *   lloc         LOCATION / location, o null.
 *   inici        { data: 'AAAA-MM-DD' } (tot el dia) o { dataHora, zona }.
 *                dataHora 'AAAA-MM-DDThh:mm[:ss]' és hora de paret de la zona;
 *                amb Z o ±hh:mm, un instant. zona: nom IANA ('Europe/Madrid').
 *   fi           El mateix format que l'inici, o null. EXCLUSIVA, com a l'RFC i
 *                a Google: un acte de tot el dia del 29 acaba { data: '…-30' }.
 *   totElDia     Derivat de l'inici.
 *   estat        confirmat · provisional · cancellat (confirmed · tentative ·
 *                cancelled). Un acte cancel·lat no ocorre: no es pinta.
 *   recurrencia  null o línies 'RRULE:…' i 'EXDATE…', tal com les escriu l'RFC.
 *   font         { tipus, id, ruta } o null: d'on ve (mur, mapa, gcal, ics…).
 *   enllac       URL absoluta (http/https) o ruta pròpia ('/…'), o null.
 *   actualitzat  LAST-MODIFIED / updated, ISO UTC, o null.
 *
 * SENSE FI. Per a exportar (Google l'exigix i el .ics la fa explícita), un
 * acte sense fi dura tot el dia si és de data i una hora si és amb hora
 * (fiEfectiva). Per a pintar, un acte amb hora i sense fi cau el dia que
 * comença.
 *
 * HORA LOCAL. Com a utils/calendari.js: el dia d'un acte amb hora es decidix
 * amb el rellotge de qui mira, i una hora de paret es llig com a hora local
 * del navegador (la del poble). Un acte de tot el dia es compara pel número
 * de dia del calendari, mai amb new Date('AAAA-MM-DD'), que es llig en UTC.
 *
 * RECURRÈNCIA. ocorreElDia pinta un subconjunt de l'RFC; la resta no es pinta
 * (fail-closed: el que falta es pinta, no s'inventa) i recurrenciaSuportada
 * ho diu. Una sola RRULE, amb:
 *   · FREQ DAILY, WEEKLY o MONTHLY, i INTERVAL, BYDAY (l'ordinal, «-1FR»,
 *     només en MONTHLY), BYMONTHDAY, BYHOUR, BYMINUTE, WKST, UNTIL o COUNT;
 *   · o FREQ HOURLY, MINUTELY o SECONDLY sense cap BY*: una xarxa de passos
 *     des de l'inici (SECONDLY hi és perquè launchd programa en segons).
 * EXDATE i COUNT, només quan hi ha una ocurrència per dia. Com rrule.js i
 * dateutil, l'inici només compta si la regla el genera.
 */
import { dataIsoONull, dosDigits } from './calendari.js';

export const ZONA_PER_DEFECTE = 'Europe/Madrid';
/** Els dies de l'RRULE en l'ordre de Date#getDay() (diumenge = 0). */
export const DIES_RRULE = Object.freeze(['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']);

const ESTATS = Object.freeze(['confirmat', 'provisional', 'cancellat']);
const DIA_MS = 86400000;
const MAX_LINIES_RECURRENCIA = 20;
/* COUNT es resol comptant dia a dia des de l'inici; més enllà de cent anys es
   pinta sense fi (cap calendari del poble hi arriba). */
const LIMIT_DIES_COUNT = 36525;

const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATA_HORA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/;
const ENLLAC = /^(?:https?:\/\/\S+|\/(?!\/)\S*)$/i;

/* ── Dies del calendari ──────────────────────────────────────────────────
   Un «número de dia» compta els dies des de l'1-1-1970 amb Date.UTC: és
   aritmètica de calendari, sense fus horari ni canvis d'hora. */

const numDia = (any, mes, dia) => Date.UTC(any, mes, dia) / DIA_MS;
/** Dia de la setmana d'un número de dia (0 = diumenge; l'1-1-1970 va ser dijous). */
const diaSetmana = (n) => (((n + 4) % 7) + 7) % 7;

function dataDeNum(n) {
  const d = new Date(n * DIA_MS);
  return { any: d.getUTCFullYear(), mes: d.getUTCMonth(), dia: d.getUTCDate() };
}

/** Mitjanit LOCAL (ms) d'un número de dia: el dia que veu qui mira. */
function mitjanit(n) {
  const { any, mes, dia } = dataDeNum(n);
  return new Date(any, mes, dia).getTime();
}

function diaExistix(any, mes, dia) {
  const d = new Date(Date.UTC(any, mes, dia));
  return d.getUTCFullYear() === any && d.getUTCMonth() === mes && d.getUTCDate() === dia;
}

/** «AAAA-MM-DD» d'un dia del calendari (mes de 0 a 11): la clau de ?date= del Mur. */
export const clauDia = (any, mes, dia) => `${any}-${dosDigits(mes + 1)}-${dosDigits(dia)}`;

/** 'AAAA-MM-DD' → número de dia, o null si el dia no existix («2026-02-30»). */
function numDeClau(text) {
  const p = typeof text === 'string' ? DIA.exec(text.trim()) : null;
  if (!p) return null;
  const [any, mes, dia] = [Number(p[1]), Number(p[2]) - 1, Number(p[3])];
  return diaExistix(any, mes, dia) ? numDia(any, mes, dia) : null;
}

/**
 * Les peces d'una dataHora, o null si no és vàlida. `instant` (ms): amb
 * desfasament, exacte; sense (hora de paret), en hora local. ics.js en llig
 * les xifres per a escriure DTSTART.
 */
export function llegixDataHora(text) {
  const p = typeof text === 'string' ? DATA_HORA.exec(text.trim()) : null;
  if (!p) return null;
  const [any, mes, dia, hora, minut] = [Number(p[1]), Number(p[2]) - 1, Number(p[3]), Number(p[4]), Number(p[5])];
  const segon = Number(p[6] ?? 0);
  if (!diaExistix(any, mes, dia) || hora > 23 || minut > 59 || segon > 59) return null;
  const peces = { any, mes, dia, hora, minut, segon, ambDesfas: Boolean(p[7]) };
  if (!p[7]) return { ...peces, instant: new Date(any, mes, dia, hora, minut, segon).getTime() };
  const desfas = p[7] === 'Z' ? 0 : (p[7][0] === '-' ? -1 : 1) * (Number(p[7].slice(1, 3)) * 60 + Number(p[7].slice(4, 6)));
  return { ...peces, instant: Date.UTC(any, mes, dia, hora, minut, segon) - desfas * 60000 };
}

const instantDe = (text) => llegixDataHora(text)?.instant ?? null;

/* Intl llança un RangeError si la zona no existix. */
function zonaValida(zona) {
  try {
    return Boolean(Intl.DateTimeFormat('en-US', { timeZone: zona }));
  } catch {
    return false;
  }
}

/* ── Creació (fail-closed) ─────────────────────────────────────────────── */

const textONull = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);
const idNet = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : textONull(valor));

function normalitzaMoment(valor) {
  if (!valor || typeof valor !== 'object') return null;
  if (valor.data != null) return numDeClau(valor.data) === null ? null : Object.freeze({ data: valor.data.trim() });
  if (instantDe(valor.dataHora) === null) return null;
  const zona = valor.zona ?? ZONA_PER_DEFECTE;
  return typeof zona === 'string' && zonaValida(zona) ? Object.freeze({ dataHora: valor.dataHora.trim(), zona }) : null;
}

/** La fi és del mateix tipus que l'inici i no el precedix (de data, estrictament després). */
function fiPosterior(inici, fi) {
  if (('data' in inici) !== ('data' in fi)) return false;
  return 'data' in inici
    ? numDeClau(fi.data) > numDeClau(inici.data)
    : instantDe(fi.dataHora) >= instantDe(inici.dataHora);
}

/* Línies de l'RFC, o null; undefined si la llista no és vàlida. */
function normalitzaRecurrencia(valor) {
  if (valor == null) return null;
  if (!Array.isArray(valor) || valor.length > MAX_LINIES_RECURRENCIA) return undefined;
  const linies = valor.map(textONull);
  if (linies.some((linia) => linia === null || /[\r\n]/.test(linia))) return undefined;
  return linies.length ? Object.freeze(linies) : null;
}

/* { tipus, id, ruta }, o null; undefined si porta font i no té tipus. */
function normalitzaFont(valor) {
  if (valor == null) return null;
  const tipus = textONull(valor.tipus);
  return tipus ? Object.freeze({ tipus, id: idNet(valor.id), ruta: textONull(valor.ruta) }) : undefined;
}

/**
 * Un esdeveniment del model, congelat, o null si alguna peça no és vàlida:
 * sense id, títol o inici, amb una fi anterior a l'inici o d'un altre tipus,
 * un estat desconegut, una zona que no existix, un enllaç que no és cap URL…
 * Una recurrència que no es pot pintar SÍ que es crea (es conserva per a
 * exportar-la); qui no la pinta és ocorreElDia.
 */
export function creaEsdeveniment(parcial) {
  if (!parcial || typeof parcial !== 'object') return null;
  const id = idNet(parcial.id);
  const titol = textONull(parcial.titol);
  const inici = normalitzaMoment(parcial.inici);
  if (!id || !titol || !inici) return null;
  const fi = parcial.fi == null ? null : normalitzaMoment(parcial.fi);
  if (parcial.fi != null && !(fi && fiPosterior(inici, fi))) return null;
  const estat = parcial.estat ?? 'confirmat';
  const recurrencia = normalitzaRecurrencia(parcial.recurrencia);
  const font = normalitzaFont(parcial.font);
  if (!ESTATS.includes(estat) || recurrencia === undefined || font === undefined) return null;
  const enllac = parcial.enllac == null ? null : textONull(parcial.enllac);
  if (parcial.enllac != null && !(enllac && ENLLAC.test(enllac))) return null;
  const actualitzat = parcial.actualitzat == null ? null : dataIsoONull(parcial.actualitzat);
  if (parcial.actualitzat != null && !actualitzat) return null;
  return Object.freeze({
    uid: textONull(parcial.uid) ?? `${font ? `${font.tipus}:` : ''}${id}@socdepoble.org`,
    id,
    titol,
    descripcio: textONull(parcial.descripcio),
    lloc: textONull(parcial.lloc),
    inici,
    fi,
    totElDia: 'data' in inici,
    estat,
    recurrencia,
    font,
    enllac,
    actualitzat
  });
}

/* Les xifres d'una dataHora amb una hora més, en el seu mateix format. La
   suma es fa sobre les xifres: en hora de paret és una hora de rellotge, i
   amb desfasament el sufix fix fa que siga l'instant més una hora. */
function unaHoraMes(text) {
  const p = llegixDataHora(text);
  const d = new Date(Date.UTC(p.any, p.mes, p.dia, p.hora + 1, p.minut, p.segon));
  const sufix = DATA_HORA.exec(text.trim())[7] ?? '';
  return `${clauDia(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())}T${dosDigits(d.getUTCHours())}:${dosDigits(d.getUTCMinutes())}:${dosDigits(d.getUTCSeconds())}${sufix}`;
}

/**
 * La fi que s'exporta: la de l'acte o, si no en té, tot el dia (acte de data)
 * o una hora (acte amb hora). Google exigix `end`; al .ics es fa explícita.
 */
export function fiEfectiva(esd) {
  if (esd.fi) return esd.fi;
  if (esd.totElDia) {
    const { any, mes, dia } = dataDeNum(numDeClau(esd.inici.data) + 1);
    return Object.freeze({ data: clauDia(any, mes, dia) });
  }
  return Object.freeze({ dataHora: unaHoraMes(esd.inici.dataHora), zona: esd.inici.zona });
}

/* ── Recurrència ───────────────────────────────────────────────────────── */

const FALLA = Object.freeze({ falla: true });
const PARTS_RRULE = new Set(['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'BYMONTHDAY', 'BYHOUR', 'BYMINUTE', 'WKST']);
const PER_DIES = new Set(['DAILY', 'WEEKLY', 'MONTHLY']);
const PAS_MS = Object.freeze({ HOURLY: 3600000, MINUTELY: 60000, SECONDLY: 1000 });
/* Part de l'RRULE → camp llegit: una part present que no es llig tomba la regla. */
const CAMP_DE_PART = Object.freeze({
  INTERVAL: 'interval', COUNT: 'count', UNTIL: 'until', BYDAY: 'perDia',
  BYMONTHDAY: 'perDiaMes', BYHOUR: 'perHora', BYMINUTE: 'perMinut'
});
const ENTER = /^[+-]?\d{1,2}$/;
const DIA_RRULE = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/;
const MOMENT_RFC = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/;

const positiu = (text) => (/^\d{1,6}$/.test(text) && Number(text) > 0 ? Number(text) : null);

function enters(text, min, max, senseZero = false) {
  const valors = text.split(',').map((t) => (ENTER.test(t) ? Number(t) : NaN));
  return valors.every((v) => v >= min && v <= max && !(senseZero && v === 0)) ? valors : null;
}

function diesRrule(text, ambOrdinal) {
  const dies = [];
  for (const tros of text.split(',')) {
    const p = DIA_RRULE.exec(tros);
    if (!p) return null;
    const ordinal = p[1] === undefined ? null : Number(p[1]);
    if (ordinal !== null && (!ambOrdinal || ordinal === 0 || Math.abs(ordinal) > 5)) return null;
    dies.push({ ordinal, dia: DIES_RRULE.indexOf(p[2]) });
  }
  return dies;
}

/** 'AAAAMMDD' (un dia) o 'AAAAMMDDThhmmss[Z]' (un instant; sense Z, hora local). */
function momentRfc(text) {
  const p = MOMENT_RFC.exec(text);
  if (!p) return null;
  const [any, mes, dia] = [Number(p[1]), Number(p[2]) - 1, Number(p[3])];
  if (!diaExistix(any, mes, dia)) return null;
  if (p[4] === undefined) return { dia: numDia(any, mes, dia), instant: null };
  const [hora, minut, segon] = [Number(p[4]), Number(p[5]), Number(p[6])];
  if (hora > 23 || minut > 59 || segon > 59) return null;
  const instant = p[7] ? Date.UTC(any, mes, dia, hora, minut, segon) : new Date(any, mes, dia, hora, minut, segon).getTime();
  const local = new Date(instant);
  return { dia: numDia(local.getFullYear(), local.getMonth(), local.getDate()), instant };
}

function llegixRrule(linia) {
  const parts = {};
  for (const tros of linia.replace(/^RRULE:/i, '').split(';')) {
    const [clau, valor, sobra] = tros.split('=');
    const k = clau.trim().toUpperCase();
    if (!valor || sobra !== undefined || !PARTS_RRULE.has(k) || k in parts) return null;
    parts[k] = valor.trim().toUpperCase();
  }
  const freq = parts.FREQ;
  if ((!PER_DIES.has(freq) && !PAS_MS[freq]) || (parts.COUNT && parts.UNTIL)) return null;
  const regla = {
    freq,
    interval: parts.INTERVAL === undefined ? 1 : positiu(parts.INTERVAL),
    count: parts.COUNT === undefined ? null : positiu(parts.COUNT),
    until: parts.UNTIL === undefined ? null : momentRfc(parts.UNTIL),
    perDia: parts.BYDAY === undefined ? null : diesRrule(parts.BYDAY, freq === 'MONTHLY'),
    perDiaMes: parts.BYMONTHDAY === undefined ? null : enters(parts.BYMONTHDAY, -31, 31, true),
    perHora: parts.BYHOUR === undefined ? null : enters(parts.BYHOUR, 0, 23),
    perMinut: parts.BYMINUTE === undefined ? null : enters(parts.BYMINUTE, 0, 59),
    wkst: parts.WKST === undefined ? 1 : DIES_RRULE.indexOf(parts.WKST)
  };
  if (Object.entries(CAMP_DE_PART).some(([part, camp]) => parts[part] !== undefined && regla[camp] === null)) return null;
  // L'RFC no admet BYMONTHDAY en una regla setmanal.
  if (regla.wkst < 0 || (freq === 'WEEKLY' && regla.perDiaMes)) return null;
  return regla;
}

/* On i quan comença l'esdeveniment, i quant dura, en dies o en ms. */
function geometriaDe(esd) {
  if (esd.totElDia) {
    const iniciDia = numDeClau(esd.inici.data);
    return { iniciDia, fiDia: esd.fi ? numDeClau(esd.fi.data) : iniciDia + 1, t0: null, dur: 0 };
  }
  const t0 = instantDe(esd.inici.dataHora);
  const d = new Date(t0);
  return {
    iniciDia: numDia(d.getFullYear(), d.getMonth(), d.getDate()),
    minutInici: d.getHours() * 60 + d.getMinutes(),
    segonInici: d.getSeconds(),
    t0,
    dur: esd.fi ? instantDe(esd.fi.dataHora) - t0 : 0
  };
}

function compilaRegla(esd, geo) {
  let rrule = null;
  const exclosos = new Set();
  for (const linia of esd.recurrencia) {
    if (/^(?:RRULE:|FREQ=)/i.test(linia)) {
      if (rrule) return FALLA;
      rrule = llegixRrule(linia);
      if (!rrule) return FALLA;
      continue;
    }
    const exdate = /^EXDATE(?:;[^:]*)?:(.+)$/i.exec(linia);
    if (!exdate) return FALLA;
    for (const valor of exdate[1].split(',')) {
      const moment = momentRfc(valor.trim());
      if (!moment) return FALLA;
      exclosos.add(moment.dia);
    }
  }
  if (!rrule) return FALLA;
  const pas = PAS_MS[rrule.freq];
  const ambHores = Boolean(rrule.perHora || rrule.perMinut);
  if (esd.totElDia && (pas || ambHores)) return FALLA;
  if (pas) {
    return rrule.perDia || rrule.perDiaMes || ambHores || exclosos.size ? FALLA : { ...rrule, pas: pas * rrule.interval };
  }
  // Minuts del dia de cada ocurrència: BYHOUR × BYMINUTE, o l'hora de l'inici.
  const minuts = esd.totElDia ? [0] : (rrule.perHora ?? [Math.floor(geo.minutInici / 60)])
    .flatMap((h) => (rrule.perMinut ?? [geo.minutInici % 60]).map((m) => h * 60 + m))
    .sort((a, b) => a - b);
  if (minuts.length > 1 && (rrule.count || exclosos.size)) return FALLA;
  const darrerMinut = minuts[minuts.length - 1];
  return {
    ...rrule,
    pas: null,
    exclosos,
    minuts,
    // El dia de l'inici només hi ha les ocurrències que no el precedixen.
    primerMinutInici: esd.totElDia ? 0 : (minuts.find((m) => m >= geo.minutInici) ?? null),
    // Dies de més que cobrix una ocurrència que passa de mitjanit.
    extraDies: esd.totElDia
      ? geo.fiDia - geo.iniciDia - 1
      : (geo.dur > 0 ? Math.floor((darrerMinut * 60000 + geo.dur - 1) / DIA_MS) : 0)
  };
}

const COMPILATS = new WeakMap();
function compila(esd) {
  let compilat = COMPILATS.get(esd);
  if (!compilat) {
    const geo = geometriaDe(esd);
    compilat = { geo, regla: esd.recurrencia ? compilaRegla(esd, geo) : null };
    COMPILATS.set(esd, compilat);
  }
  return compilat;
}

/* La regla (DAILY, WEEKLY o MONTHLY) genera una ocurrència el dia n? Sense
   UNTIL, COUNT ni EXDATE. */
function generaElDia(r, geo, n) {
  if (n < geo.iniciDia || (n === geo.iniciDia && r.primerMinutInici === null)) return false;
  const { any, mes, dia } = dataDeNum(n);
  const dow = diaSetmana(n);
  if (r.freq === 'DAILY' && (n - geo.iniciDia) % r.interval) return false;
  if (r.freq === 'WEEKLY') {
    const iniciSetmana = (m) => m - ((diaSetmana(m) - r.wkst + 7) % 7);
    if (((iniciSetmana(n) - iniciSetmana(geo.iniciDia)) / 7) % r.interval) return false;
    return (r.perDia ? r.perDia.map((d) => d.dia) : [diaSetmana(geo.iniciDia)]).includes(dow);
  }
  if (r.freq === 'MONTHLY') {
    const inici = dataDeNum(geo.iniciDia);
    if ((any * 12 + mes - (inici.any * 12 + inici.mes)) % r.interval) return false;
    if (!r.perDia && !r.perDiaMes) return dia === inici.dia;
  }
  // BYMONTHDAY i BYDAY limiten (DAILY) o trien (MONTHLY) els dies del mes.
  const diesMes = new Date(Date.UTC(any, mes + 1, 0)).getUTCDate();
  if (r.perDiaMes && !r.perDiaMes.some((v) => (v > 0 ? v : diesMes + v + 1) === dia)) return false;
  return !r.perDia || r.perDia.some(({ ordinal, dia: d }) => d === dow && (ordinal === null
    || (ordinal > 0 ? Math.ceil(dia / 7) === ordinal : Math.floor((diesMes - dia) / 7) + 1 === -ordinal)));
}

function darrerDiaDeCount(r, geo) {
  if (r.darrerDia === undefined) {
    r.darrerDia = Infinity;
    let comptades = 0;
    for (let n = geo.iniciDia; n < geo.iniciDia + LIMIT_DIES_COUNT; n++) {
      if (generaElDia(r, geo, n) && ++comptades === r.count) {
        r.darrerDia = n;
        break;
      }
    }
  }
  return r.darrerDia;
}

/* Comença una ocurrència el dia n? Les EXDATE no descompten COUNT (RFC 5545). */
function iniciaElDia(r, geo, n) {
  if (!generaElDia(r, geo, n) || r.exclosos.has(n)) return false;
  if (r.until) {
    if (r.until.instant === null) return n <= r.until.dia;
    const minut = n === geo.iniciDia ? r.primerMinutInici : r.minuts[0];
    return mitjanit(n) + minut * 60000 + (geo.segonInici ?? 0) * 1000 <= r.until.instant;
  }
  return !r.count || n <= darrerDiaDeCount(r, geo);
}

/* HOURLY, MINUTELY o SECONDLY: la primera ocurrència que toca el dia n. */
function xarxaCobreix(r, geo, n) {
  const [d0, d1] = [mitjanit(n), mitjanit(n + 1)];
  const k = Math.max(0, geo.dur > 0 ? Math.floor((d0 - geo.dur - geo.t0) / r.pas) + 1 : Math.ceil((d0 - geo.t0) / r.pas));
  const inici = geo.t0 + k * r.pas;
  if (inici >= d1 || (r.count && k >= r.count)) return false;
  if (!r.until) return true;
  return r.until.instant === null ? inici < mitjanit(r.until.dia + 1) : inici <= r.until.instant;
}

function rangCobreix(geo, n) {
  if (geo.t0 === null) return n >= geo.iniciDia && n < geo.fiDia;
  const [d0, d1] = [mitjanit(n), mitjanit(n + 1)];
  return geo.dur > 0 ? geo.t0 < d1 && geo.t0 + geo.dur > d0 : geo.t0 >= d0 && geo.t0 < d1;
}

/** L'esdeveniment ocorre (o continua) eixe dia del calendari local? Mes de 0 a 11. */
export function ocorreElDia(esd, any, mes, dia) {
  if (!esd?.inici || esd.estat === 'cancellat') return false;
  const { geo, regla } = compila(esd);
  const n = numDia(any, mes, dia);
  if (!regla) return rangCobreix(geo, n);
  if (regla === FALLA) return false;
  if (regla.pas) return xarxaCobreix(regla, geo, n);
  for (let k = 0; k <= regla.extraDies; k++) if (iniciaElDia(regla, geo, n - k)) return true;
  return false;
}

/** La recurrència (si en porta) és del subconjunt que es pinta? */
export function recurrenciaSuportada(esd) {
  return Boolean(esd?.inici) && compila(esd).regla !== FALLA;
}

/** Els esdeveniments de cada dia d'un mes (Map dia → llista, en l'ordre d'entrada). */
export function indexaMes(esdeveniments, any, mes) {
  const dies = new Date(any, mes + 1, 0).getDate();
  const index = new Map();
  for (const esd of esdeveniments ?? []) {
    if (!esd) continue;
    for (let dia = 1; dia <= dies; dia++) {
      if (!ocorreElDia(esd, any, mes, dia)) continue;
      if (!index.has(dia)) index.set(dia, []);
      index.get(dia).push(esd);
    }
  }
  return index;
}

/* ── Google Calendar v3 (recurs Event), sense API ─────────────────────── */

const ESTAT_A_GOOGLE = Object.freeze({ confirmat: 'confirmed', provisional: 'tentative', cancellat: 'cancelled' });
const ESTAT_DE_GOOGLE = Object.freeze({ confirmed: 'confirmat', tentative: 'provisional', cancelled: 'cancellat' });

/* RFC 3339 demana els segons: «…T10:00» → «…T10:00:00». */
const ambSegons = (text) => text.replace(/T(\d{2}):(\d{2})(?=$|Z|[+-])/, 'T$1:$2:00');

function momentAGoogle(moment) {
  return 'data' in moment ? { date: moment.data } : { dateTime: ambSegons(moment.dataHora), timeZone: moment.zona };
}

function momentDeGoogle(moment) {
  if (!moment) return null;
  return moment.date ? { data: moment.date } : { dataHora: moment.dateTime, zona: moment.timeZone ?? ZONA_PER_DEFECTE };
}

/**
 * L'esdeveniment com a recurs Event de Google Calendar v3 (per a
 * events.import: la clau de sincronia és iCalUID, perquè l'id de Google ha
 * de ser base32hex i els nostres no ho són). La font viatja a
 * extendedProperties.private i torna amb deGoogleCalendar.
 */
export function aGoogleCalendar(esd) {
  if (!esd) return null;
  const recurs = {
    iCalUID: esd.uid,
    summary: esd.titol,
    start: momentAGoogle(esd.inici),
    end: momentAGoogle(fiEfectiva(esd)),
    status: ESTAT_A_GOOGLE[esd.estat]
  };
  if (esd.descripcio) recurs.description = esd.descripcio;
  if (esd.lloc) recurs.location = esd.lloc;
  if (esd.recurrencia) recurs.recurrence = [...esd.recurrencia];
  if (esd.enllac && /^https?:/i.test(esd.enllac)) recurs.source = { title: esd.titol, url: esd.enllac };
  if (esd.font) {
    const privat = { sdpFont: esd.font.tipus };
    if (esd.font.id) privat.sdpId = esd.font.id;
    if (esd.font.ruta) privat.sdpRuta = esd.font.ruta;
    recurs.extendedProperties = { private: privat };
  }
  return recurs;
}

/**
 * Un recurs Event de Google Calendar v3 com a esdeveniment, o null. Sense
 * títol, «(sense títol)», com fa el mateix Google. La descripció de Google pot
 * portar HTML: l'adaptador de l'enxufe (src/data/adaptadors/) l'haurà de
 * passar a text pla abans d'arribar ací.
 */
export function deGoogleCalendar(recurs) {
  if (!recurs || typeof recurs !== 'object') return null;
  const privat = recurs.extendedProperties?.private ?? {};
  const font = privat.sdpFont
    ? { tipus: privat.sdpFont, id: privat.sdpId ?? null, ruta: privat.sdpRuta ?? null }
    : { tipus: 'gcal', id: recurs.id ?? null, ruta: null };
  return creaEsdeveniment({
    id: font.id ?? recurs.id,
    uid: recurs.iCalUID,
    titol: textONull(recurs.summary) ?? '(sense títol)',
    descripcio: recurs.description,
    lloc: recurs.location,
    inici: momentDeGoogle(recurs.start),
    fi: momentDeGoogle(recurs.end),
    estat: ESTAT_DE_GOOGLE[recurs.status ?? 'confirmed'] ?? recurs.status,
    recurrencia: recurs.recurrence ?? null,
    font,
    enllac: recurs.source?.url ?? recurs.htmlLink ?? null,
    actualitzat: recurs.updated ?? null
  });
}
