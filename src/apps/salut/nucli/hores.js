/**
 * hores.js — moments, jornades i intervals de Salut (nucli pur: sense React ni DOM).
 *
 * Un apunt guarda l'hora de RELLOTGE local i l'ofset d'eixe moment:
 *   moment   'AAAA-MM-DDTHH:MM' (el que es veia al rellotge de casa)
 *   ofsetMin minuts a l'est d'UTC en el moment d'apuntar (+60 a l'hivern,
 *            +120 a l'estiu a la Península)
 * Amb les dos coses, l'instant és exacte i els intervals també ho són els
 * dies de canvi d'hora: una jornada pot durar 23 h o 25 h.
 *
 * La JORNADA és el dia que comença quan la persona s'alça: una micció a les
 * 03:10 del dia 3 és de la jornada del 2 (la nit del 2 al 3). L'hora d'alçar-se
 * d'una data és la de l'apunt de son «alcar-se» d'eixa data o, si no n'hi ha,
 * l'habitual de la persona (per defecte, 07:00).
 *
 * Els límits d'una jornada (alçar-se, adormir-se i l'alçada de l'endemà) es
 * prenen dels apunts de son; si falten, de les hores habituals, i es marquen
 * com a estimats.
 */

const PATRO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const PATRO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const PATRO_MOMENT = /^(\d{4}-\d{2}-\d{2})T(([01]\d|2[0-3]):[0-5]\d)$/;
const MS_MINUT = 60000;

export const HORA_ALCAR_PER_DEFECTE = '07:00';
export const HORA_GITAR_PER_DEFECTE = '22:00';
/* Els ofsets reals van de -12 h a +14 h. */
export const OFSET_MAXIM = 14 * 60;

const dosXifres = (n) => String(n).padStart(2, '0');

/* Una data UTC a partir de les parts, també per als anys 0-99 (Date.UTC els desplaça). */
function dataUtc(any, mes, dia, hora = 0, minut = 0) {
  const data = new Date(0);
  data.setUTCFullYear(any, mes - 1, dia);
  data.setUTCHours(hora, minut, 0, 0);
  return data;
}

const textDeData = (data) => `${String(data.getUTCFullYear()).padStart(4, '0')}-${dosXifres(data.getUTCMonth() + 1)}-${dosXifres(data.getUTCDate())}`;

/** 'AAAA-MM-DD' que existix al calendari. */
export function esData(valor) {
  const m = typeof valor === 'string' ? PATRO_DATA.exec(valor) : null;
  if (!m) return false;
  const [any, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mes < 1 || mes > 12 || dia < 1) return false;
  return textDeData(dataUtc(any, mes, dia)) === valor;
}

/** 'HH:MM' de 00:00 a 23:59. */
export const esHora = (valor) => typeof valor === 'string' && PATRO_HORA.test(valor);

/** 'AAAA-MM-DDTHH:MM' amb una data que existix. */
export function esMoment(valor) {
  const m = typeof valor === 'string' ? PATRO_MOMENT.exec(valor) : null;
  return Boolean(m) && esData(m[1]);
}

/** Minuts a l'est d'UTC: un enter de -840 a 840. */
export const esOfset = (valor) => Number.isSafeInteger(valor) && Math.abs(valor) <= OFSET_MAXIM;

export const dataDe = (moment) => moment.slice(0, 10);
export const horaDe = (moment) => moment.slice(11, 16);
export const momentDe = (data, hora) => `${data}T${hora}`;

function partsData(data) {
  const [any, mes, dia] = data.split('-').map(Number);
  return { any, mes, dia };
}

/** La data `n` dies després (o abans, si és negatiu). */
export function sumaDies(data, n) {
  const { any, mes, dia } = partsData(data);
  return textDeData(dataUtc(any, mes, dia + n));
}

/** Dies de calendari de `a` a `b` (b − a). */
export function diesEntre(a, b) {
  const pa = partsData(a);
  const pb = partsData(b);
  return Math.round((dataUtc(pb.any, pb.mes, pb.dia) - dataUtc(pa.any, pa.mes, pa.dia)) / 86400000);
}

/** L'instant (ms UTC) d'un moment de rellotge amb el seu ofset. */
export function instantDe(moment, ofsetMin) {
  const { any, mes, dia } = partsData(dataDe(moment));
  const [hora, minut] = horaDe(moment).split(':').map(Number);
  return dataUtc(any, mes, dia, hora, minut).getTime() - ofsetMin * MS_MINUT;
}

/** Minuts entre dos punts { moment, ofsetMin } (b − a). */
export function minutsEntre(a, b) {
  return (instantDe(b.moment, b.ofsetMin) - instantDe(a.moment, a.ofsetMin)) / MS_MINUT;
}

/** El moment de rellotge local i l'ofset d'una Date (per defecte, ara). */
export function momentLocal(data = new Date()) {
  const moment = `${data.getFullYear()}-${dosXifres(data.getMonth() + 1)}-${dosXifres(data.getDate())}T${dosXifres(data.getHours())}:${dosXifres(data.getMinutes())}`;
  return { moment, ofsetMin: -data.getTimezoneOffset() };
}

/**
 * La data del rellotge de casa ('AAAA-MM-DD') d'un instant ISO desat amb
 * toISOString() (l'última còpia, l'avís acceptat): el dia d'UTC pot ser
 * l'anterior (una còpia a les 01:30 de l'estiu és de les 23:30 UTC).
 */
export function dataLocalDe(iso) {
  return dataDe(momentLocal(new Date(iso)).moment);
}

/**
 * L'ofset del rellotge d'este dispositiu en un moment donat. Només es fa
 * servir per als límits ESTIMATS (les hores habituals), que no s'han apuntat.
 */
export function ofsetLocal(moment) {
  const { any, mes, dia } = partsData(dataDe(moment));
  const [hora, minut] = horaDe(moment).split(':').map(Number);
  return -new Date(any, mes - 1, dia, hora, minut).getTimezoneOffset();
}

/* ── Etiquetes de data, sense dependre de la versió d'ICU ───────────────── */

const DIES = Object.freeze(['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte']);
const DIES_CURTS = Object.freeze(['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.']);
const MESOS = Object.freeze(['de gener', 'de febrer', 'de març', 'd’abril', 'de maig', 'de juny', 'de juliol', 'd’agost',
  'de setembre', 'd’octubre', 'de novembre', 'de desembre']);

/** 0 diumenge … 6 dissabte. */
export function diaSetmana(data) {
  const { any, mes, dia } = partsData(data);
  return dataUtc(any, mes, dia).getUTCDay();
}

/** El dilluns de la setmana d'una data. */
export function dillunsDe(data) {
  return sumaDies(data, -((diaSetmana(data) + 6) % 7));
}

/** 'DD/MM/AAAA', la forma d'un full en valencià. */
export function dataCurta(data) {
  const { any, mes, dia } = partsData(data);
  return `${dosXifres(dia)}/${dosXifres(mes)}/${any}`;
}

/** 'dj. 02/10/2026'. */
export const etiquetaData = (data) => `${DIES_CURTS[diaSetmana(data)]} ${dataCurta(data)}`;

/** 'dijous, 2 d’octubre'. */
export function etiquetaDataLlarga(data) {
  const { mes, dia } = partsData(data);
  return `${DIES[diaSetmana(data)]}, ${dia} ${MESOS[mes - 1]}`;
}

/* ── Jornades ──────────────────────────────────────────────────────────── */

const esSon = (apunt, event) => apunt?.tipus === 'son' && apunt.event === event;
const perInstant = (a, b) => instantDe(a.moment, a.ofsetMin) - instantDe(b.moment, b.ofsetMin);

/** La jornada d'un moment, sabent a quina hora s'ha alçat la persona eixe dia. */
export function jornadaDe(moment, horaAlcar = HORA_ALCAR_PER_DEFECTE) {
  return horaDe(moment) < horaAlcar ? sumaDies(dataDe(moment), -1) : dataDe(moment);
}

/** Per a cada data, l'hora de la primera alçada apuntada (apunt de son «alcar-se»). */
export function alcadesPerData(apunts) {
  const alcades = new Map();
  for (const apunt of apunts) {
    if (!esSon(apunt, 'alcar-se')) continue;
    const data = dataDe(apunt.moment);
    const hora = horaDe(apunt.moment);
    if (!alcades.has(data) || hora < alcades.get(data)) alcades.set(data, hora);
  }
  return alcades;
}

/**
 * Els apunts amb la seua jornada calculada (còpies). L'apunt d'alçar-se és
 * sempre de la jornada de la seua data: és el que la comença.
 */
export function assignaJornades(apunts, persona = {}) {
  const habitual = esHora(persona.horaAlcarHabitual) ? persona.horaAlcarHabitual : HORA_ALCAR_PER_DEFECTE;
  const alcades = alcadesPerData(apunts);
  return apunts.map((apunt) => {
    const jornada = esSon(apunt, 'alcar-se')
      ? dataDe(apunt.moment)
      : jornadaDe(apunt.moment, alcades.get(dataDe(apunt.moment)) ?? habitual);
    return { ...apunt, jornada };
  });
}

/** Ordena per instant (còpia). */
export const ordenaPerInstant = (apunts) => apunts.slice().sort(perInstant);

const punt = (moment, ofsetMin, estimat) => Object.freeze({ moment, ofsetMin, instant: instantDe(moment, ofsetMin), estimat });

/**
 * Els límits d'una jornada:
 *   alcar         quan comença (s'alça)
 *   gitar         quan se'n va al llit per a passar la nit (null si no s'ha apuntat)
 *   adormir       quan comença la nit (s'adorm; si no, quan es gita; si no, l'habitual)
 *   alcarSeguent  quan acaba (s'alça l'endemà)
 * Cada un porta `estimat: true` si ve de les hores habituals.
 *
 * La nit comença una sola vegada: en el primer «adormir-se» després de
 * l'últim «gitar-se» d'abans del primer despertar de nit. Un «gitar-se» o un
 * «adormir-se» posteriors a un despertar són tornar-se'n al llit o tornar-se
 * a adormir, i no la tornen a començar: si no, les miccions d'eixe despertar
 * comptarien com a miccions de dia.
 * @param {string} data la jornada
 * @param {object[]} apunts amb `jornada` (assignaJornades)
 * @param {object} persona horaAlcarHabitual, horaGitarHabitual
 * @param {{ ofsetDe?: (moment: string) => number }} [opcions] l'ofset d'un límit estimat
 */
export function limitsJornada(data, apunts, persona = {}, { ofsetDe = ofsetLocal } = {}) {
  const alcarHabitual = esHora(persona.horaAlcarHabitual) ? persona.horaAlcarHabitual : HORA_ALCAR_PER_DEFECTE;
  const gitarHabitual = esHora(persona.horaGitarHabitual) ? persona.horaGitarHabitual : HORA_GITAR_PER_DEFECTE;
  const delDia = (d) => ordenaPerInstant(apunts.filter((apunt) => apunt.jornada === d));
  const avui = delDia(data);
  const endema = delDia(sumaDies(data, 1));
  const estimat = (moment) => punt(moment, ofsetDe(moment), true);
  const apuntat = (apunt) => punt(apunt.moment, apunt.ofsetMin, false);

  const alcadaDe = (d, llista) => {
    const apunt = llista.find((a) => esSon(a, 'alcar-se'));
    return apunt ? apuntat(apunt) : estimat(momentDe(d, alcarHabitual));
  };
  const son = (event) => avui.filter((a) => esSon(a, event));
  const [primerDespertar] = son('despertar');
  const abansDelDespertar = (a) => !primerDespertar || perInstant(a, primerDespertar) <= 0;
  const gitada = son('gitar-se').filter(abansDelDespertar).pop() || null;
  const adormida = son('adormir-se').find((a) => abansDelDespertar(a) && (!gitada || perInstant(a, gitada) >= 0)) || gitada;
  const dataGitar = gitarHabitual < alcarHabitual ? sumaDies(data, 1) : data;
  const alcar = alcadaDe(data, avui);
  const adormir = adormida ? apuntat(adormida) : estimat(momentDe(dataGitar, gitarHabitual));
  const alcarSeguent = alcadaDe(sumaDies(data, 1), endema);
  return Object.freeze({
    alcar,
    gitar: gitada ? apuntat(gitada) : null,
    adormir,
    alcarSeguent,
    estimat: alcar.estimat || adormir.estimat || alcarSeguent.estimat,
    duradaMin: (alcarSeguent.instant - alcar.instant) / MS_MINUT
  });
}

/** 'dia' si l'apunt és abans d'adormir-se; 'nit' si és després. */
export function periodeDe(apunt, limits) {
  return instantDe(apunt.moment, apunt.ofsetMin) < limits.adormir.instant ? 'dia' : 'nit';
}

/** Totes les jornades que tenen algun apunt, de la més recent a la més antiga. */
export function jornadesAmbApunts(apunts) {
  return [...new Set(apunts.map((apunt) => apunt.jornada).filter(Boolean))].sort().reverse();
}
