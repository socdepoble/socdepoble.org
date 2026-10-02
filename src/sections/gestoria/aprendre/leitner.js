/**
 * leitner.js — Motor de repàs espaiat per caixes de Leitner (Aprendre · Gestoria).
 *
 * JS pur: sense React, sense DOM i sense rellotge global; l'hora entra sempre
 * per paràmetre. Cada targeta viu en una caixa i cada caixa té un interval en
 * dies: si l'encertes, puja una caixa (fins a l'última); si no, torna a la 0.
 *
 * Els dies són naturals d'Europe/Madrid i el venciment cau a les 04:00 hora
 * local del dia que toca, també els dies de canvi d'hora (a les 04:00 l'hora
 * mai no és ambigua). Els instants es guarden en ms UTC.
 *
 * Estat d'una targeta:
 *   { cardId, contentVersion, caixa, dueAt (ms|null: nova), lastReviewedAt (ms|null),
 *     repetitions (respostes donades), lapses (vegades que no l'has recordada) }
 * Els camps desconeguts (p. ex. barallaId) es conserven en cada transició.
 */

export const CAIXES_PER_DEFECTE = Object.freeze([0, 1, 3, 7, 16, 35]);
export const ZONA_HORARIA = 'Europe/Madrid';
export const HORA_VENCIMENT = 4;

let formatador = null;
function partsLocals(ms) {
  formatador ||= new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
  });
  const p = {};
  for (const { type, value } of formatador.formatToParts(new Date(ms))) p[type] = Number(value);
  // Alguns motors antics escriuen «24» a mitjanit malgrat h23.
  return { a: p.year, m: p.month, d: p.day, h: p.hour % 24, min: p.minute, s: p.second };
}

/* Diferència entre l'hora de paret de Madrid i l'UTC en un instant. */
function desplacament(ms) {
  const segon = Math.floor(ms / 1000) * 1000;
  const l = partsLocals(segon);
  return Date.UTC(l.a, l.m - 1, l.d, l.h, l.min, l.s) - segon;
}

/* Instant UTC de l'hora de paret `h`:00 d'un dia local; es corregix una vegada
   per si el primer desplaçament era el de l'altre costat del canvi d'hora. */
function instantLocal({ a, m, d }, h) {
  const paret = Date.UTC(a, m - 1, d, h);
  const primer = paret - desplacament(paret);
  const segon = paret - desplacament(primer);
  return segon === primer ? primer : segon;
}

function sumaDies({ a, m, d }, dies) {
  const data = new Date(Date.UTC(a, m - 1, d + dies));
  return { a: data.getUTCFullYear(), m: data.getUTCMonth() + 1, d: data.getUTCDate() };
}

function instant(ara) {
  const ms = ara instanceof Date ? ara.getTime() : ara;
  if (typeof ms !== 'number' || !Number.isFinite(ms)) throw new TypeError('Cal un instant vàlid (Date o ms).');
  return ms;
}

function caixesValides(caixes) {
  if (!Array.isArray(caixes) || !caixes.length || !caixes.every(dies => Number.isSafeInteger(dies) && dies >= 0)) {
    throw new RangeError('Les caixes han de ser una llista d’intervals en dies (enters ≥ 0).');
  }
  return caixes;
}

function targetesDe(baralla) {
  const targetes = baralla?.targetes;
  if (!Array.isArray(targetes)) throw new TypeError('La baralla no té targetes.');
  const vistes = new Set();
  for (const t of targetes) {
    if (typeof t?.id !== 'string' || !t.id || typeof t.versio !== 'string' || !t.versio) {
      throw new TypeError('Cada targeta necessita id i versio.');
    }
    if (vistes.has(t.id)) throw new TypeError(`Targeta repetida: ${t.id}.`);
    vistes.add(t.id);
  }
  return targetes;
}

const venc = estat => (Number.isFinite(estat?.dueAt) ? estat.dueAt : null);
const revisat = estat => (Number.isFinite(estat?.lastReviewedAt) ? estat.lastReviewedAt : -Infinity);

/** Dia natural de Madrid d'un instant: { a, m, d }. */
export function diaLocal(ara) {
  const { a, m, d } = partsLocals(instant(ara));
  return { a, m, d };
}

/**
 * Instant (ms UTC) en què venç una targeta respost `ara` amb un interval de
 * `dies`: les 04:00 locals d'eixe dia. Amb 0 dies torna hui mateix i mai
 * cau en el futur (de matinada, abans de les 04:00, ja venç).
 */
export function venciment(ara, dies) {
  const ms = instant(ara);
  if (!Number.isSafeInteger(dies) || dies < 0) throw new RangeError('Interval de dies invàlid.');
  const quan = instantLocal(sumaDies(diaLocal(ms), dies), HORA_VENCIMENT);
  return dies === 0 ? Math.min(ms, quan) : quan;
}

export function estatInicial(cardId, contentVersion) {
  if (typeof cardId !== 'string' || !cardId) throw new TypeError('Cal l’identificador de la targeta.');
  if (typeof contentVersion !== 'string' || !contentVersion) throw new TypeError('Cal la versió del contingut.');
  return { cardId, contentVersion, caixa: 0, dueAt: null, lastReviewedAt: null, repetitions: 0, lapses: 0 };
}

/** Nou estat després de respondre. No muta `estat`. */
export function respon(estat, { encert, ara } = {}, { caixes = CAIXES_PER_DEFECTE } = {}) {
  if (typeof estat?.cardId !== 'string' || !estat.cardId) throw new TypeError('Estat de targeta invàlid.');
  if (typeof encert !== 'boolean') throw new TypeError('La resposta ha de dir si l’has encertada (true/false).');
  const ms = instant(ara);
  const ultima = caixesValides(caixes).length - 1;
  // Una caixa corrupta compta com a 0; una de més amunt que l'última, com l'última.
  const actual = Number.isSafeInteger(estat.caixa) && estat.caixa >= 0 ? Math.min(estat.caixa, ultima) : 0;
  const caixa = encert ? Math.min(actual + 1, ultima) : 0;
  const comptador = valor => (Number.isSafeInteger(valor) && valor >= 0 ? valor : 0);
  return {
    ...estat,
    caixa,
    dueAt: venciment(ms, caixes[caixa]),
    lastReviewedAt: ms,
    repetitions: comptador(estat.repetitions) + 1,
    lapses: comptador(estat.lapses) + (encert ? 0 : 1)
  };
}

/**
 * Estats vàlids per a la baralla, en l'ordre de la baralla. Les targetes
 * eliminades se'n van; si la versió del contingut ha canviat, la targeta torna
 * a la caixa 0 com a nova (es conserva l'historial). Un estat sense canvis
 * conserva la mateixa referència. Duplicats: guanya el revisat més tard.
 */
export function reconcilia(estats, baralla) {
  const targetes = targetesDe(baralla);
  const perTargeta = new Map();
  for (const estat of Array.isArray(estats) ? estats : []) {
    if (typeof estat?.cardId !== 'string') continue;
    const previ = perTargeta.get(estat.cardId);
    if (!previ || revisat(estat) > revisat(previ)) perTargeta.set(estat.cardId, estat);
  }
  const resultat = [];
  for (const targeta of targetes) {
    const estat = perTargeta.get(targeta.id);
    if (!estat) continue;
    resultat.push(estat.contentVersion === targeta.versio
      ? estat
      : { ...estat, contentVersion: targeta.versio, caixa: 0, dueAt: null });
  }
  return resultat;
}

/**
 * Què toca repassar `ara`: primer les vençudes (la més antiga primer; a
 * igualtat, la caixa més baixa i després l'ordre de la baralla) i després
 * les noves, en l'ordre de la baralla.
 * Torna [{ targeta, estat, nova }]; una nova sense estat porta l'inicial.
 */
export function pendents(estats, baralla, ara) {
  const ms = instant(ara);
  const perId = new Map(reconcilia(estats, baralla).map(estat => [estat.cardId, estat]));
  const vencudes = [];
  const noves = [];
  targetesDe(baralla).forEach((targeta, ordre) => {
    const estat = perId.get(targeta.id);
    const quan = venc(estat);
    if (quan === null) noves.push({ targeta, estat: estat || estatInicial(targeta.id, targeta.versio), nova: true });
    else if (quan <= ms) vencudes.push({ targeta, estat, nova: false, ordre });
  });
  vencudes.sort((x, y) => x.estat.dueAt - y.estat.dueAt || x.estat.caixa - y.estat.caixa || x.ordre - y.ordre);
  return [...vencudes.map(({ targeta, estat, nova }) => ({ targeta, estat, nova })), ...noves];
}

/** El pròxim venciment posterior a `ara` (ms UTC), o null si no n'hi ha cap. */
export function proximRepas(estats, baralla, ara) {
  const ms = instant(ara);
  let proxim = null;
  for (const estat of reconcilia(estats, baralla)) {
    const quan = venc(estat);
    if (quan !== null && quan > ms && (proxim === null || quan < proxim)) proxim = quan;
  }
  return proxim;
}
