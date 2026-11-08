// @vitest-environment node
/* R51 (P0-49 / IDEA-180) · L'adaptador de zona del selector de data: la zona
   IANA i els canvis d'hora es resolen ací, i el mòdul pur del contracte rep
   sempre un desfasament explícit. Zones explícites: el resultat no depén de
   la zona de la màquina que passa les proves. */
import { describe, expect, test } from 'vitest';
import {
  desfasamentA, esZonaValida, horaDeParet, partsALaZona, resolHoraDeParet, textDesfasament, zonaDelDispositiu
} from './zonaHoraria.js';

describe('zonaHoraria · desfasament i text', () => {
  test('el desfasament de la zona en cada instant, també als quarts d’hora', () => {
    expect(desfasamentA(Date.UTC(2026, 0, 15, 12), 'Europe/Madrid')).toBe(60);
    expect(desfasamentA(Date.UTC(2026, 6, 15, 12), 'Europe/Madrid')).toBe(120);
    expect(desfasamentA(Date.UTC(2026, 0, 15, 12), 'America/New_York')).toBe(-300);
    expect(desfasamentA(Date.UTC(2026, 0, 15, 12), 'Asia/Kathmandu')).toBe(345);
    expect(desfasamentA(Date.UTC(2026, 0, 15, 12), 'UTC')).toBe(0);
  });

  test('el text visible porta el signe i les hores i els minuts', () => {
    expect(textDesfasament(60)).toBe('UTC+01:00');
    expect(textDesfasament(0)).toBe('UTC+00:00');
    expect(textDesfasament(-210)).toBe('UTC-03:30');
    expect(textDesfasament(345)).toBe('UTC+05:45');
  });

  test('les parts de paret d’un instant en una zona', () => {
    expect(partsALaZona(Date.UTC(2026, 10, 7, 23, 30), 'Europe/Madrid')).toEqual({ any: 2026, mes: 10, dia: 8, hora: 0, minut: 30, segon: 0 });
  });

  test('l’hora de paret d’un dia del calendari (mes 0-11)', () => {
    expect(horaDeParet(2026, 9, 5, '02:30')).toBe('2026-10-05T02:30');
  });

  test('la zona del dispositiu és sempre una zona vàlida', () => {
    expect(esZonaValida(zonaDelDispositiu())).toBe(true);
    expect(esZonaValida('Europe/Madrid')).toBe(true);
    for (const dolenta of ['Mart/Olympus', '', null, 42]) expect(esZonaValida(dolenta)).toBe(false);
  });
});

describe('zonaHoraria · resolHoraDeParet', () => {
  test('una hora normal té un sol desfasament i dona l’instant UTC amb mil·lisegons', () => {
    expect(resolHoraDeParet('2026-11-07T11:30', 'Europe/Madrid')).toEqual({ estat: 'valida', desfasament: 60, iso: '2026-11-07T10:30:00.000Z' });
    expect(resolHoraDeParet('2026-07-07T11:30:15', 'Europe/Madrid')).toEqual({ estat: 'valida', desfasament: 120, iso: '2026-07-07T09:30:15.000Z' });
    expect(resolHoraDeParet('2026-11-07T00:15', 'Asia/Kathmandu')).toEqual({ estat: 'valida', desfasament: 345, iso: '2026-11-06T18:30:00.000Z' });
  });

  test('l’hora que el canvi d’hivern repetix és ambigua: dos instants, primer el d’estiu', () => {
    expect(resolHoraDeParet('2026-10-25T02:30', 'Europe/Madrid')).toEqual({
      estat: 'ambigua',
      opcions: [{ desfasament: 120, iso: '2026-10-25T00:30:00.000Z' }, { desfasament: 60, iso: '2026-10-25T01:30:00.000Z' }]
    });
    expect(resolHoraDeParet('2026-11-01T01:30', 'America/New_York').estat).toBe('ambigua');
  });

  test('l’hora que el canvi d’estiu se salta no existix: cap instant', () => {
    expect(resolHoraDeParet('2026-03-29T02:30', 'Europe/Madrid')).toEqual({ estat: 'inexistent' });
    expect(resolHoraDeParet('2026-03-08T02:30', 'America/New_York')).toEqual({ estat: 'inexistent' });
    // Les vores del salt sí que existixen.
    expect(resolHoraDeParet('2026-03-29T01:59', 'Europe/Madrid').estat).toBe('valida');
    expect(resolHoraDeParet('2026-03-29T03:00', 'Europe/Madrid')).toEqual({ estat: 'valida', desfasament: 120, iso: '2026-03-29T01:00:00.000Z' });
  });

  test('una data que no existix, una forma estranya o una zona desconeguda no es normalitzen', () => {
    for (const local of ['2026-02-30T10:00', '2026-11-07', '2026-11-07T24:00', '2026-11-07T10:00Z', ' 2026-11-07T10:00', '0999-12-31T10:00', null, 0]) {
      expect(resolHoraDeParet(local, 'Europe/Madrid'), String(local)).toEqual({ estat: 'invalida' });
    }
    expect(resolHoraDeParet('2026-11-07T10:00', 'Mart/Olympus')).toEqual({ estat: 'invalida' });
  });

  test('el resultat és immutable', () => {
    const ambigua = resolHoraDeParet('2026-10-25T02:30', 'Europe/Madrid');
    expect(Object.isFrozen(ambigua)).toBe(true);
    expect(Object.isFrozen(ambigua.opcions)).toBe(true);
    expect(Object.isFrozen(ambigua.opcions[0])).toBe(true);
  });
});
