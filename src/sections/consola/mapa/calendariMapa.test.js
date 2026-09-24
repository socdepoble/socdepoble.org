import { describe, expect, test } from 'vitest';
import {
  cadenciaCron, classificaTasca, graellaMes, mouMes, quanDe, resumCalendari, tocaElDia
} from './calendariMapa.js';

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
