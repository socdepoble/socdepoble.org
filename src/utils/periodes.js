/**
 * periodes.js — setmanes i graelles de mes del calendari, pur (sense React ni
 * DOM).
 *
 * T10 (ordre del Mestre, 261001) · Les vistes Setmana i Mes a l'estil Google
 * Calendar (VistaSetmana, VistaMes) pinten períodes que no són el mes natural:
 * la setmana de dilluns a diumenge i la graella fixa de sis setmanes. Este
 * mòdul en fa l'aritmètica, i res més.
 *
 * CANVI D'HORA. Tota l'aritmètica de dies és per components (new Date(a, m,
 * d + n)), mai sumant 86400000: el diumenge 25-10-2026 té 25 hores i el
 * 29-03-2026, 23. Un Date que torna una funció d'ací és sempre la mitjanit
 * LOCAL del dia (el que veu qui mira, com a utils/calendari.js).
 *
 * CLAUS. S'escriuen amb clauDia (utils/esdeveniment.js), la clau de ?date= del
 * Mur. Este mòdul no llig claus de dia: les llig diaDeLaClau
 * (sections/calendari/calendariGlobal.js), i no se'n fa un cinquè lector. Sí
 * que llig la clau de setmana ISO 8601 ('AAAA-Www'), que és un format nou.
 */
import { dosDigits } from './calendari.js';
import { clauDia } from './esdeveniment.js';

/* Número de dia del calendari (dies des de l'1-1-1970, amb Date.UTC): per a
   comptar setmanes sense que el canvi d'hora hi sume o reste una hora. */
const numDia = (data) => Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / 86400000;
const SETMANA_ISO = /^(\d{4})-W(\d{2})$/;

/** El dia de la setmana d'una data, de dilluns (0) a diumenge (6). */
export const diaDeLaSetmana = (data) => (data.getDay() + 6) % 7;

/** La mitjanit local de `n` dies després (o abans, si és negatiu) del dia d'una data. */
export function sumaDies(data, n) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + n);
}

/** La clau 'AAAA-MM-DD' del dia local d'una data. */
export const clauDeData = (data) => clauDia(data.getFullYear(), data.getMonth(), data.getDate());

/** Quants dies de calendari local van del dia d'una data al d'una altra (negatiu si és abans). */
export const diesEntre = (desde, fins) => numDia(fins) - numDia(desde);

/** La mitjanit local del dilluns de la setmana d'una data (la mateixa fórmula que datesDeProvaMur.js). */
export const dillunsDe = (data) => sumaDies(data, -diaDeLaSetmana(data));

/** El dilluns de la setmana anterior (pas -1), següent (1) o a `pas` setmanes. */
export const mouSetmana = (data, pas) => sumaDies(dillunsDe(data), 7 * pas);

/**
 * Els set dies de la setmana d'una data, de dilluns a diumenge:
 * [{ clau, data, esAvui, diaSetmana }], amb diaSetmana de 0 (dilluns) a 6.
 * `avui` (Date) marca el dia de hui; sense, cap.
 */
export function diesDeLaSetmana(data, { avui = null } = {}) {
  const dilluns = dillunsDe(data);
  const hui = avui ? clauDeData(avui) : null;
  return Array.from({ length: 7 }, (_, i) => {
    const dia = sumaDies(dilluns, i);
    const clau = clauDeData(dia);
    return { clau, data: dia, esAvui: clau === hui, diaSetmana: i };
  });
}

/**
 * La setmana ISO 8601 d'una data: { any, setmana }. La setmana és de l'any del
 * seu dijous, i la primera és la que conté el 4 de gener: el 31-12-2026 és de
 * la 53 del 2026 i el 30-12-2024, de la 1 del 2025.
 */
export function setmanaIso(data) {
  const any = sumaDies(dillunsDe(data), 3).getFullYear();
  const primerDilluns = dillunsDe(new Date(any, 0, 4));
  return { any, setmana: 1 + (numDia(dillunsDe(data)) - numDia(primerDilluns)) / 7 };
}

/** La clau 'AAAA-Www' de la setmana ISO d'una data (el ?setmana= de /calendari). */
export function clauSetmanaIso(data) {
  const { any, setmana } = setmanaIso(data);
  return `${any}-W${dosDigits(setmana)}`;
}

/**
 * La mitjanit local del dilluns d'una clau 'AAAA-Www', o null. La mateixa
 * regla que les claus de dia i de mes (cursorDeClau): any de quatre xifres a
 * partir del 1000. La setmana va de la 01 a la darrera de l'any (52 o 53):
 * «2026-W53» existix i «2027-W53» no; la W, en majúscula com a la norma.
 */
export function dillunsDeClauSetmana(clau) {
  const p = typeof clau === 'string' ? SETMANA_ISO.exec(clau) : null;
  if (!p) return null;
  const [any, setmana] = [Number(p[1]), Number(p[2])];
  // El 28 de desembre és sempre de la darrera setmana ISO del seu any.
  if (any < 1000 || setmana < 1 || setmana > setmanaIso(new Date(any, 11, 28)).setmana) return null;
  return sumaDies(dillunsDe(new Date(any, 0, 4)), 7 * (setmana - 1));
}

/**
 * La graella del mes ({ any, mes }, de 0 a 11): setmanes de dilluns a
 * diumenge, cada una amb set { clau, data, delMes, esAvui }. Per defecte, sis
 * setmanes fixes (42 dies, com Google Calendar: la graella no canvia d'alçada
 * d'un mes a l'altre); amb setmanes: 'justes', només les que toquen el mes.
 */
export function graellaDelMes({ any, mes }, { avui = null, setmanes = 6 } = {}) {
  const primer = dillunsDe(new Date(any, mes, 1));
  const desfas = diaDeLaSetmana(new Date(any, mes, 1));
  const diesMes = new Date(any, mes + 1, 0).getDate();
  const files = setmanes === 'justes' ? Math.ceil((desfas + diesMes) / 7) : 6;
  const hui = avui ? clauDeData(avui) : null;
  return Array.from({ length: files }, (_, f) => Array.from({ length: 7 }, (_, i) => {
    const dia = sumaDies(primer, 7 * f + i);
    const clau = clauDeData(dia);
    return { clau, data: dia, delMes: dia.getMonth() === mes && dia.getFullYear() === any, esAvui: clau === hui };
  }));
}

/**
 * Fase visual (prompt 261001_0445) · La graella de `setmanes` setmanes
 * seguides des del dilluns de la setmana d'una data (la vista 2 setmanes de
 * Google, o N setmanes des de l'1 d'un mes), amb el format de graellaDelMes.
 * Amb `mes` ({ any, mes }), delMes diu si el dia és d'eixe mes; sense, tots
 * ho són: un període de setmanes no té cap mes veí que atenuar. Un nombre de
 * setmanes que no és un enter positiu en fa una.
 */
export function graellaDeSetmanes(data, setmanes, { avui = null, mes = null } = {}) {
  const dilluns = dillunsDe(data);
  const files = Number.isInteger(setmanes) && setmanes > 0 ? setmanes : 1;
  const hui = avui ? clauDeData(avui) : null;
  return Array.from({ length: files }, (_, f) => Array.from({ length: 7 }, (_, i) => {
    const dia = sumaDies(dilluns, 7 * f + i);
    const clau = clauDeData(dia);
    const delMes = mes ? dia.getMonth() === mes.mes && dia.getFullYear() === mes.any : true;
    return { clau, data: dia, delMes, esAvui: clau === hui };
  }));
}

/** El rang semiobert [desde, fins) de la setmana d'una data: de mitjanit a mitjanit locals. */
export function rangDeLaSetmana(data) {
  const desde = dillunsDe(data);
  return { desde, fins: sumaDies(desde, 7) };
}

/** El rang semiobert [desde, fins) de la graella del mes (42 dies per defecte), per a demanar l'agenda. */
export function rangDeLaGraella(cursor, { setmanes = 6 } = {}) {
  const graella = graellaDelMes(cursor, { setmanes });
  return { desde: graella[0][0].data, fins: sumaDies(graella[graella.length - 1][6].data, 1) };
}

/**
 * El minut de paret (hora × 60 + minut, en hora local) d'un instant (ms) o
 * d'un Date: on cau a la graella de 24 h. El 29-03-2026 les 02:30 no
 * existixen (Date les passa a les 03:30, minut 210); el 25-10-2026 les 02:30
 * passen dos vegades i les dos són el minut 150.
 */
export function minutDeParet(instant) {
  const data = instant instanceof Date ? instant : new Date(instant);
  return data.getHours() * 60 + data.getMinutes();
}
