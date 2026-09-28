/**
 * calendariMapa.js — el calendari de processos (02_calendari.md), pur.
 *
 * Traduïx el calendari d'Emowe: caixes per cadència damunt del mes i, a part,
 * el que no té hora (residents, en arrencar i esdeveniments). Una tasca sense
 * cadència declarada no rep cap punt al mes: el que falta es pinta, no s'inventa.
 */

/* T40 (ordre del Mestre, 260928) · El mes pur viu ara a utils/calendari.js,
   compartit amb el selector de data de l'editor. Es reexporta: cap import
   antic (proves, CalendariMapa) canvia. */
import { DIES_LLARGS } from '../../../utils/calendari.js';
export { DIES_CURTS, DIES_LLARGS, graellaMes, mouMes } from '../../../utils/calendari.js';

export const GRUPS_CADENCIA = Object.freeze([
  ['dia', 'Diàries'],
  ['setmana', 'Setmanals'],
  ['mes', 'Mensuals'],
  ['altra', 'Altres cadències'],
  ['permanent', 'Residents (sempre vius)'],
  ['arrencada', 'En arrencar'],
  ['esdeveniment', 'Per esdeveniment'],
  ['sense', 'Sense cadència declarada']
]);

const DIA = 86400;
const SETMANA = 7 * DIA;

function campsCron(expr) {
  const camps = String(expr ?? '').trim().split(/\s+/);
  return camps.length === 5 ? camps : null;
}

/** Com la `regla_cron` d'Emowe: diària, setmanal, mensual o altra. */
export function cadenciaCron(expr) {
  const c = campsCron(expr);
  if (!c) return 'altra';
  const [, , dom, mes, dow] = c;
  if (dom === '*' && mes === '*' && dow === '*') return 'dia';
  if (dom === '*' && mes === '*' && /^[0-7]$/.test(dow)) return 'setmana';
  if (/^\d{1,2}$/.test(dom) && mes === '*' && dow === '*') return 'mes';
  return 'altra';
}

/** Grup de cadència d'una tasca del Mapa. */
export function classificaTasca(tasca) {
  const l = tasca?.llancador;
  const c = tasca?.cadencia;
  if (l && ['hook', 'git-hook'].includes(l.tipus)) return 'esdeveniment';
  if (!c) return 'sense';
  if (c.permanent) return 'permanent';
  if (typeof c.cron === 'string') return cadenciaCron(c.cron);
  if (Number.isFinite(c.cada_segons) && c.cada_segons > 0) {
    if (c.cada_segons <= DIA) return 'dia';
    return c.cada_segons <= SETMANA ? 'setmana' : 'mes';
  }
  if (c.en_arrencar) return 'arrencada';
  return 'sense';
}

function durada(segons) {
  if (segons % DIA === 0) return segons === DIA ? 'dia' : `${segons / DIA} dies`;
  if (segons % 3600 === 0) return segons === 3600 ? 'hora' : `${segons / 3600} hores`;
  if (segons % 60 === 0) return segons === 60 ? 'minut' : `${segons / 60} minuts`;
  return `${segons} s`;
}

/** «Quan» en text: «cada dijous a les 02:30», «cada hora · en arrencar»… */
export function quanDe(tasca) {
  const c = tasca?.cadencia;
  if (!c) return tasca?.llancador?.esdeveniment ? `en ${tasca.llancador.esdeveniment}` : '—';
  if (typeof c.cron === 'string') {
    const k = campsCron(c.cron);
    if (!k || !/^\d{1,2}$/.test(k[0]) || !/^\d{1,2}$/.test(k[1])) return c.cron;
    const hora = `${k[1].padStart(2, '0')}:${k[0].padStart(2, '0')}`;
    const tipus = cadenciaCron(c.cron);
    if (tipus === 'setmana') return `cada ${DIES_LLARGS[(Number(k[4]) + 6) % 7]} a les ${hora}`;
    if (tipus === 'mes') return `el dia ${Number(k[2])} a les ${hora}`;
    if (tipus === 'dia') return `cada dia a les ${hora}`;
    return c.cron;
  }
  const parts = [];
  if (Number.isFinite(c.cada_segons) && c.cada_segons > 0) parts.push(`cada ${durada(c.cada_segons)}`);
  if (c.en_arrencar) parts.push('en arrencar');
  if (c.permanent) parts.push('sempre viu');
  return parts.join(' · ') || '—';
}

export function resumCalendari(tasques) {
  const grups = Object.fromEntries(GRUPS_CADENCIA.map(([k]) => [k, []]));
  for (const t of tasques) grups[classificaTasca(t)].push(t);
  for (const k of Object.keys(grups)) grups[k].sort((a, b) => a.id.localeCompare(b.id));
  return grups;
}

/**
 * Salta este dia? Una cadència en segons de setmanes o mesos no té àncora
 * (no se sap quin dia va començar): no es pinta al mes, només a la seua caixa.
 */
export function tocaElDia(tasca, any, mes, dia) {
  const tipus = classificaTasca(tasca);
  if (tipus === 'dia') return true;
  const cron = typeof tasca?.cadencia?.cron === 'string' ? campsCron(tasca.cadencia.cron) : null;
  if (!cron) return false;
  if (tipus === 'setmana') return new Date(any, mes, dia).getDay() === Number(cron[4]) % 7;
  if (tipus === 'mes') return Number(cron[2]) === dia;
  return false;
}
