/**
 * calendari.js — el calendari de mes, pur (sense React ni DOM).
 *
 * T40 (ordre del Mestre, 260928) · La Consola (CalendariMapa) i el selector
 * de data de publicació de l'editor (SelectorDataHora) pinten el MATEIX mes.
 * DIES_CURTS, DIES_LLARGS, graellaMes i mouMes són el trasllat literal de
 * sections/consola/mapa/calendariMapa.js, que els reexporta perquè cap import
 * antic canvie. La resta són les peces de la tria de dia i hora.
 *
 * Fus horari: el dia i l'hora es trien en hora LOCAL (el que la persona veu
 * al rellotge) i es guarden en ISO 8601 UTC (toISOString).
 */

export const DIES_CURTS = Object.freeze(['dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.', 'dg.']);
export const DIES_LLARGS = Object.freeze(['dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte', 'diumenge']);

/** Setmanes del mes (de dilluns a diumenge); null als forats. `mes` va de 0 a 11. */
export function graellaMes(any, mes) {
  const desfas = (new Date(any, mes, 1).getDay() + 6) % 7;
  const dies = new Date(any, mes + 1, 0).getDate();
  const celles = [...Array(desfas).fill(null), ...Array.from({ length: dies }, (_, i) => i + 1)];
  while (celles.length % 7) celles.push(null);
  const setmanes = [];
  for (let i = 0; i < celles.length; i += 7) setmanes.push(celles.slice(i, i + 7));
  return setmanes;
}

/** Mes anterior o següent sense eixir de 0–11. */
export function mouMes({ any, mes }, pas) {
  const d = new Date(any, mes + pas, 1);
  return { any: d.getFullYear(), mes: d.getMonth() };
}

const dataValida = (valor) => valor instanceof Date && !Number.isNaN(valor.getTime());
const dosDigits = (n) => String(n).padStart(2, '0');

/** El mes (cursor del calendari) d'una data; per defecte, el de hui. */
export function cursorDe(data = new Date()) {
  const d = dataValida(data) ? data : new Date(data);
  const bona = dataValida(d) ? d : new Date();
  return { any: bona.getFullYear(), mes: bona.getMonth() };
}

/** La data (Date o ISO) cau en eixe dia, en hora local? */
export function esMateixDia(data, any, mes, dia) {
  if (data == null || data === '') return false;
  const d = data instanceof Date ? data : new Date(data);
  return dataValida(d) && d.getFullYear() === any && d.getMonth() === mes && d.getDate() === dia;
}

/** 'HH:MM' en hora local d'una data (Date o ISO); '' si no és una data. */
export function horaDe(data) {
  if (data == null || data === '') return '';
  const d = data instanceof Date ? data : new Date(data);
  return dataValida(d) ? `${dosDigits(d.getHours())}:${dosDigits(d.getMinutes())}` : '';
}

const HORA = /^(\d{1,2}):(\d{2})$/;

/**
 * El dia (any, mes 0–11, dia) i l'hora 'HH:MM' locals, en ISO UTC. Null si
 * alguna peça no és vàlida (el 30 de febrer no passa al 2 de març).
 */
export function combinaDataHora(any, mes, dia, hhmm) {
  const hora = HORA.exec(String(hhmm ?? ''));
  if (!hora || ![any, mes, dia].every(Number.isInteger)) return null;
  const h = Number(hora[1]);
  const m = Number(hora[2]);
  if (h > 23 || m > 59) return null;
  const d = new Date(any, mes, dia, h, m);
  if (!dataValida(d) || d.getFullYear() !== any || d.getMonth() !== mes || d.getDate() !== dia) return null;
  return d.toISOString();
}

/* Data ISO 8601 (només data, o data i hora amb zona opcional). Fins a 9
   decimals: un timestamptz de Postgres en torna fins a 6 (microsegons). */
const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Una data de publicació neta: ISO UTC vàlida o null. Accepta un Date vàlid
 * o una cadena ISO 8601; rebutja la resta ('demà', '', '2026-02-30').
 */
export function dataIsoONull(valor) {
  if (valor instanceof Date) return dataValida(valor) ? valor.toISOString() : null;
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  const parts = ISO.exec(text);
  if (!parts) return null;
  // El dia de calendari ha d'existir tal com està escrit (Date el desbordaria).
  const [any, mes, dia] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const calendari = new Date(Date.UTC(any, mes - 1, dia));
  if (calendari.getUTCFullYear() !== any || calendari.getUTCMonth() !== mes - 1 || calendari.getUTCDate() !== dia) return null;
  const d = new Date(text);
  return dataValida(d) ? d.toISOString() : null;
}
