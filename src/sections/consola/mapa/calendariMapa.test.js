import { describe, expect, test } from 'vitest';
import {
  ANCORA_TASQUES, cadenciaCron, classificaTasca, cronARrule, graellaMes, mouMes, quanDe, resumCalendari,
  tascaAEsdeveniment, tocaElDia
} from './calendariMapa.js';
import { ocorreElDia, recurrenciaSuportada } from '../../../utils/esdeveniment.js';

const tasca = (id, cadencia, llancador = null) => ({ id, estat: 'desconegut', llancador, cadencia, script: null, font: null });

describe('cadències', () => {
  test('cron com la regla d’Emowe', () => {
    expect(cadenciaCron('30 2 * * *')).toBe('dia');
    expect(cadenciaCron('0 9 * * 4')).toBe('setmana');
    expect(cadenciaCron('0 9 15 * *')).toBe('mes');
    expect(cadenciaCron('*/5 * * 1 *')).toBe('altra');
    expect(cadenciaCron('no és cron')).toBe('altra');
  });

  test('segons, residents, arrencada, esdeveniments i silenci', () => {
    expect(classificaTasca(tasca('plaquetes', { cada_segons: 3600, en_arrencar: true }))).toBe('dia');
    expect(classificaTasca(tasca('setmanal', { cada_segons: 604800 }))).toBe('setmana');
    expect(classificaTasca(tasca('reflex', { permanent: true }))).toBe('permanent');
    expect(classificaTasca(tasca('boot', { en_arrencar: true }))).toBe('arrencada');
    expect(classificaTasca(tasca('hook', null, { tipus: 'hook', esdeveniment: 'PreToolUse' }))).toBe('esdeveniment');
    expect(classificaTasca(tasca('promesa', null))).toBe('sense');
  });

  test('«quan» en valencià', () => {
    expect(quanDe(tasca('a', { cron: '30 2 * * 4' }))).toBe('cada dijous a les 02:30');
    expect(quanDe(tasca('b', { cron: '0 7 * * 0' }))).toBe('cada diumenge a les 07:00');
    expect(quanDe(tasca('c', { cron: '5 9 1 * *' }))).toBe('el dia 1 a les 09:05');
    expect(quanDe(tasca('d', { cada_segons: 3600, en_arrencar: true }))).toBe('cada hora · en arrencar');
    expect(quanDe(tasca('e', null, { tipus: 'hook', esdeveniment: 'SessionStart' }))).toBe('en SessionStart');
    expect(quanDe(tasca('f', null))).toBe('—');
  });

  test('el resum agrupa sense perdre cap tasca', () => {
    const tasques = [tasca('z', { cada_segons: 60 }), tasca('a', { cada_segons: 60 }), tasca('p', null)];
    const grups = resumCalendari(tasques);
    expect(grups.dia.map((t) => t.id)).toEqual(['a', 'z']);
    expect(grups.sense.map((t) => t.id)).toEqual(['p']);
    expect(Object.values(grups).flat()).toHaveLength(3);
  });
});

describe('el mes', () => {
  test('setembre de 2026 comença en dimarts i té 30 dies', () => {
    const setmanes = graellaMes(2026, 8);
    expect(setmanes[0].slice(0, 2)).toEqual([null, 1]);
    expect(setmanes.flat().filter(Boolean)).toHaveLength(30);
    expect(setmanes.every((s) => s.length === 7)).toBe(true);
  });

  test('cada tasca salta el dia que toca, i les que no tenen àncora no salten', () => {
    // 24-09-2026 és dijous.
    expect(tocaElDia(tasca('d', { cron: '30 2 * * *' }), 2026, 8, 24)).toBe(true);
    expect(tocaElDia(tasca('s', { cron: '0 9 * * 4' }), 2026, 8, 24)).toBe(true);
    expect(tocaElDia(tasca('s', { cron: '0 9 * * 4' }), 2026, 8, 25)).toBe(false);
    expect(tocaElDia(tasca('m', { cron: '0 9 24 * *' }), 2026, 8, 24)).toBe(true);
    expect(tocaElDia(tasca('w', { cada_segons: 604800 }), 2026, 8, 24)).toBe(false);
  });

  test('moure el mes creua els anys', () => {
    expect(mouMes({ any: 2026, mes: 11 }, 1)).toEqual({ any: 2027, mes: 0 });
    expect(mouMes({ any: 2026, mes: 0 }, -1)).toEqual({ any: 2025, mes: 11 });
  });
});

/* ── T8 (ordre del Mestre, 260930) · Les tasques com a esdeveniments ────── */

/* Les tasques de les fixtures del Mapa, literals: vistesMapa.test.jsx (el Mapa
   real del 25-09), actorsMapa.test.js, ConsolaSection.test.jsx,
   mapaContent.test.js i construeixMapa.test.js. */
const FIXTURES = [
  { id: 'plaquetes-diagnostic', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'org.socdepoble.plaquetes' }, cadencia: { cada_segons: 3600, en_arrencar: true }, script: 'scripts/immunitari/plaquetes.mjs', font: null },
  { id: 'reflex-daemon', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 'com.socdepoble.reflex_daemon' }, cadencia: { permanent: true }, script: 'tooling/wiki/core/reflex_daemon.mjs', font: null },
  { id: 'frontissa-contingut', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: 'tooling/gates/frontissa-contingut.mjs', font: null },
  { id: 'higiene-basica', estat: 'declarat-sense-llancador', llancador: null, cadencia: null, script: null, font: null },
  { id: 'time-machine', estat: 'declarat-sense-llancador', llancador: { tipus: 'launchd', etiqueta: 'org.x.tm' }, cadencia: { cada_segons: 1800 }, script: 'tooling/tm.mjs', font: null },
  { id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: null, font: null },
  { id: 't', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'org.x' }, cadencia: { cada_segons: 60 }, script: null, font: null }
];

/* Totes les formes que classificaTasca distingix, i les vores: diumenge com a
   0 i com a 7, els dies 29, 30 i 31, dies del mes que no existixen, passos,
   llistes i rangs de cron, i cadències en segons de tota mena. */
const SINTETIQUES = [
  ...['30 2 * * *', '0 9 * * 0', '0 9 * * 4', '0 9 * * 7', '5 9 1 * *', '0 9 15 * *', '0 9 29 * *', '0 9 30 * *',
    '0 9 31 * *', '0 9 0 * *', '0 9 45 * *', '*/15 * * * *', '0 */6 * * *', '0,30 9-17 * * *', '* * * * 3',
    '*/5 * * 1 *', '0 9 * * 1-5', '0 9 1,15 * *', 'no és cron'].map((cron) => tasca(`cron ${cron}`, { cron })),
  ...[1, 45, 60, 90, 1800, 3600, 7200, 43200, 86400, 90000, 604800, 2592000].map((s) => tasca(`cada ${s}`, { cada_segons: s })),
  tasca('resident', { permanent: true, cada_segons: 60 }),
  tasca('arrencada', { en_arrencar: true }),
  tasca('hook amb cadència', { cron: '30 2 * * *' }, { tipus: 'hook', esdeveniment: 'PreToolUse' }),
  tasca('buida', {}),
  tasca('sense', null),
  // Un llançador de launchd sense StartInterval, tal com el deixa construeixMapa.js.
  tasca('launchd sense interval', { cada_segons: null, en_arrencar: true, permanent: false }, { tipus: 'launchd', etiqueta: 'org.x' })
];

describe('tasques com a esdeveniments', () => {
  test('equivalència: ocorreElDia(tascaAEsdeveniment(t)) === tocaElDia(t), cada dia de 24 mesos', () => {
    const divergencies = [];
    for (const t of [...FIXTURES, ...SINTETIQUES]) {
      const esd = tascaAEsdeveniment(t);
      // gener de 2026 – desembre de 2027: dos canvis d'hora de cada sentit.
      for (let m = 0; m < 24; m++) {
        const { any, mes } = mouMes({ any: 2026, mes: 0 }, m);
        const dies = new Date(any, mes + 1, 0).getDate();
        for (let dia = 1; dia <= dies; dia++) {
          if (ocorreElDia(esd, any, mes, dia) !== tocaElDia(t, any, mes, dia)) divergencies.push(`${t.id} · ${any}-${mes + 1}-${dia}`);
        }
      }
    }
    expect(divergencies).toEqual([]);
  });

  test('l’equivalència discrimina: pinta de veres els dies que toca', () => {
    // 24-09-2026 és dijous; el 25, divendres.
    const setmanal = tascaAEsdeveniment(tasca('s', { cron: '0 9 * * 4' }));
    expect(ocorreElDia(setmanal, 2026, 8, 24)).toBe(true);
    expect(ocorreElDia(setmanal, 2026, 8, 25)).toBe(false);
    expect(ocorreElDia(tascaAEsdeveniment(FIXTURES[0]), 2026, 8, 25)).toBe(true);
    expect(tascaAEsdeveniment(FIXTURES[1])).toBeNull();
    expect(tascaAEsdeveniment(tasca('w', { cada_segons: 604800 }))).toBeNull();
  });

  test('cronARrule: diari, setmanal (diumenge 0 i 7) i mensual; null per a la resta', () => {
    expect(cronARrule('30 2 * * *')).toBe('FREQ=DAILY;BYHOUR=2;BYMINUTE=30');
    expect(cronARrule('0 9 * * 4')).toBe('FREQ=WEEKLY;BYDAY=TH;BYHOUR=9;BYMINUTE=0');
    expect(cronARrule('0 7 * * 0')).toBe('FREQ=WEEKLY;BYDAY=SU;BYHOUR=7;BYMINUTE=0');
    expect(cronARrule('0 7 * * 7')).toBe('FREQ=WEEKLY;BYDAY=SU;BYHOUR=7;BYMINUTE=0');
    expect(cronARrule('5 9 15 * *')).toBe('FREQ=MONTHLY;BYMONTHDAY=15;BYHOUR=9;BYMINUTE=5');
    expect(cronARrule('0,30 9-11 * * *')).toBe('FREQ=DAILY;BYHOUR=9,10,11;BYMINUTE=0,30');
    expect(cronARrule('0 */8 * * *')).toBe('FREQ=DAILY;BYHOUR=0,8,16;BYMINUTE=0');
    expect(cronARrule('*/5 * * 1 *')).toBeNull();
    expect(cronARrule('0 9 0 * *')).toBeNull();
    expect(cronARrule('no és cron')).toBeNull();
  });

  test('tascaAEsdeveniment: DTSTART sincronitzat amb la regla, des de l’àncora, i la font del Mapa', () => {
    // L'1-1-1970 va ser dijous: el primer diumenge, el 4; el primer 31, el 31 de gener.
    expect(tascaAEsdeveniment(tasca('d', { cron: '0 7 * * 0' })).inici.dataHora).toBe('1970-01-04T07:00');
    expect(tascaAEsdeveniment(tasca('m', { cron: '15 3 31 * *' })).inici.dataHora).toBe('1970-01-31T03:15');
    const plaquetes = tascaAEsdeveniment(FIXTURES[0]);
    expect(plaquetes).toMatchObject({
      id: 'plaquetes-diagnostic', titol: 'plaquetes-diagnostic', inici: { dataHora: `${ANCORA_TASQUES}T00:00` },
      recurrencia: ['RRULE:FREQ=HOURLY'], font: { tipus: 'mapa', id: 'plaquetes-diagnostic', ruta: null }
    });
    expect(tascaAEsdeveniment(FIXTURES[4]).recurrencia).toEqual(['RRULE:FREQ=MINUTELY;INTERVAL=30']);
    expect(tascaAEsdeveniment(tasca('s', { cada_segons: 90 })).recurrencia).toEqual(['RRULE:FREQ=SECONDLY;INTERVAL=90']);
    expect(tascaAEsdeveniment(tasca('d', { cada_segons: 86400 })).recurrencia).toEqual(['RRULE:FREQ=DAILY']);
    expect(recurrenciaSuportada(plaquetes)).toBe(true);
    expect(tascaAEsdeveniment(tasca('d', { cron: '0 9 * * 4' }), { ancora: '2026-09-01' }).inici.dataHora).toBe('2026-09-03T09:00');
  });

  test('divergència volguda: un cron que el mateix cron rebutjaria no es pinta (tocaElDia sí)', () => {
    const malFet = tasca('minut 61', { cron: '61 2 * * *' });
    expect(tocaElDia(malFet, 2026, 8, 24)).toBe(true);
    expect(tascaAEsdeveniment(malFet)).toBeNull();
  });
});
