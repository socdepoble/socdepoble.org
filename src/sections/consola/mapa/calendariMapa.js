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
import { DIES_LLARGS, dosDigits } from '../../../utils/calendari.js';
import { DIES_RRULE, clauDia, creaEsdeveniment } from '../../../utils/esdeveniment.js';
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

/* ── T8 (ordre del Mestre, 260930) · Les tasques com a esdeveniments ──────
   El Calendari de la Consola pinta les tasques amb el mateix organisme que
   l'Agenda del Mur (CalendariEsdeveniments) i el mateix model
   (utils/esdeveniment.js). tocaElDia es conserva: és la referència de la
   prova d'equivalència (calendariMapa.test.js: cada tasca, cada dia de 24
   mesos). Les tasques mai no ixen de la Consola: l'Agenda del Mur no les rep. */

/** Els grups de cadència que es poden situar en dies del mes. */
export const AL_MES = new Set(['dia', 'setmana', 'mes']);

/* tocaElDia no té principi (una tasca salta cada dia que toca, també en el
   passat): l'època Unix fa d'àncora, com als VTIMEZONE de l'RFC 5545. */
export const ANCORA_TASQUES = '1970-01-01';

/** Un camp de cron ('*', '5', '1-5', '*\/15', '0,30', '9-17/2') → valors ordenats, o null. */
function valorsCron(camp, min, max) {
  const valors = new Set();
  for (const tros of camp.split(',')) {
    const p = /^(?:(\*)|(\d{1,2})(?:-(\d{1,2}))?)(?:\/(\d{1,2}))?$/.exec(tros);
    if (!p) return null;
    const desde = p[1] ? min : Number(p[2]);
    const fins = p[1] ? max : (p[3] !== undefined ? Number(p[3]) : (p[4] ? max : desde));
    const pas = p[4] ? Number(p[4]) : 1;
    if (desde < min || fins > max || desde > fins || pas < 1) return null;
    for (let v = desde; v <= fins; v += pas) valors.add(v);
  }
  return [...valors].sort((a, b) => a - b);
}

/**
 * Un cron diari, setmanal o mensual com a RRULE, sense el prefix:
 * «30 2 * * 4» → «FREQ=WEEKLY;BYDAY=TH;BYHOUR=2;BYMINUTE=30». null per a la
 * resta, i per a un minut o una hora que el mateix cron rebutjaria (61, 24):
 * tocaElDia els pinta igualment, i ací no s'inventa.
 */
export function cronARrule(expr) {
  const tipus = cadenciaCron(expr);
  if (!AL_MES.has(tipus)) return null;
  const [minut, hora, diaMes, , diaSetmana] = campsCron(expr);
  const minuts = valorsCron(minut, 0, 59);
  const hores = valorsCron(hora, 0, 23);
  if (!minuts || !hores) return null;
  const temps = `BYHOUR=${hores.join(',')};BYMINUTE=${minuts.join(',')}`;
  if (tipus === 'setmana') return `FREQ=WEEKLY;BYDAY=${DIES_RRULE[Number(diaSetmana) % 7]};${temps}`;
  if (tipus === 'mes') return Number(diaMes) >= 1 && Number(diaMes) <= 31 ? `FREQ=MONTHLY;BYMONTHDAY=${Number(diaMes)};${temps}` : null;
  return `FREQ=DAILY;${temps}`;
}

/* El primer dia des de l'àncora en què el cron toca: DTSTART hi queda
   sincronitzat amb la regla (RFC 5545 §3.8.5.3). En 62 dies sempre n'hi ha. */
function primerDia(ancora, tipus, cron) {
  const [any, mes, dia] = ancora.split('-').map(Number);
  for (let pas = 0; pas < 62; pas++) {
    const d = new Date(any, mes - 1, dia + pas);
    if (tipus === 'dia' || (tipus === 'setmana' && d.getDay() === Number(cron[4]) % 7)
      || (tipus === 'mes' && d.getDate() === Number(cron[2]))) return clauDia(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return null;
}

/* Una cadència en segons de fins a un dia: la xarxa de passos més llarga que la diu. */
function reglaDeSegons(segons) {
  if (segons === DIA) return 'FREQ=DAILY';
  const [freq, unitat] = segons % 3600 === 0 ? ['HOURLY', 3600] : (segons % 60 === 0 ? ['MINUTELY', 60] : ['SECONDLY', 1]);
  return segons === unitat ? `FREQ=${freq}` : `FREQ=${freq};INTERVAL=${segons / unitat}`;
}

/**
 * Una tasca del Mapa com a esdeveniment recurrent, o null si no es pot situar
 * en dies (la frontera de tocaElDia: residents, en arrencar, per esdeveniment,
 * sense cadència, crons d'«altra» i cadències en segons de més d'un dia, que
 * no tenen àncora). Un cron, amb la seua RRULE des de la primera hora del dia;
 * una cadència en segons, amb la xarxa de passos des de la mitjanit de
 * l'àncora. Límits coneguts: un pas de segons no enter no es pinta, i un pas
 * d'entre 23 i 24 hores pot saltar-se el dia de 23 hores del canvi d'hora
 * (tocaElDia el pinta: la tasca, de veres, eixe dia pot no córrer).
 */
export function tascaAEsdeveniment(tasca, { ancora = ANCORA_TASQUES } = {}) {
  const tipus = classificaTasca(tasca);
  if (!AL_MES.has(tipus)) return null;
  const c = tasca.cadencia;
  let regla;
  let inici = `${ancora}T00:00`;
  if (typeof c.cron === 'string') {
    regla = cronARrule(c.cron);
    if (!regla) return null;
    const cron = campsCron(c.cron);
    inici = `${primerDia(ancora, tipus, cron)}T${dosDigits(valorsCron(cron[1], 0, 23)[0])}:${dosDigits(valorsCron(cron[0], 0, 59)[0])}`;
  } else {
    if (c.cada_segons > DIA || !Number.isInteger(c.cada_segons)) return null;
    regla = reglaDeSegons(c.cada_segons);
  }
  return creaEsdeveniment({
    id: tasca.id, titol: tasca.id, inici: { dataHora: inici }, recurrencia: [`RRULE:${regla}`],
    font: { tipus: 'mapa', id: tasca.id }
  });
}
