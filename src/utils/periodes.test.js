/* T10 (ordre del Mestre, 261001) · L'aritmètica de setmanes i graelles de les
   vistes Setmana i Mes. Les proves corren en Europe/Madrid (vite.config.js):
   el 25-10-2026 té 25 hores i el 29-03-2026, 23. Amb un altre TZ explícit,
   les proves d'hores reals es salten (la guarda MADRID). */
import { describe, expect, test } from 'vitest';
import {
  clauDeData, clauSetmanaIso, diaDeLaSetmana, diesDeLaSetmana, diesEntre, dillunsDe, dillunsDeClauSetmana,
  graellaDelMes, minutDeParet, mouSetmana, rangDeLaGraella, rangDeLaSetmana, setmanaIso, sumaDies
} from './periodes.js';

const MADRID = process.env.TZ === 'Europe/Madrid';
const HORA = 3600000;

describe('dies i setmanes', () => {
  test('dillunsDe: la mitjanit local del dilluns, també des del diumenge a les 23:59 i des del dilluns a les 00:00', () => {
    expect(dillunsDe(new Date(2026, 9, 1, 12, 0))).toEqual(new Date(2026, 8, 28));
    expect(dillunsDe(new Date(2026, 9, 4, 23, 59))).toEqual(new Date(2026, 8, 28));
    expect(dillunsDe(new Date(2026, 8, 28, 0, 0))).toEqual(new Date(2026, 8, 28));
    expect(diaDeLaSetmana(new Date(2026, 9, 4))).toBe(6);
  });

  test('sumaDies va per components: creua mesos i anys i torna sempre una mitjanit', () => {
    expect(sumaDies(new Date(2026, 11, 30, 18, 45), 3)).toEqual(new Date(2027, 0, 2));
    expect(sumaDies(new Date(2026, 2, 1), -1)).toEqual(new Date(2026, 1, 28));
    expect(sumaDies(new Date(2026, 9, 25), 1).getHours()).toBe(0);
  });

  test('diesDeLaSetmana: set claus seguides del dilluns al diumenge, també la setmana del canvi d’hora', () => {
    const octubre = diesDeLaSetmana(new Date(2026, 9, 21), { avui: new Date(2026, 9, 22, 9) });
    expect(octubre.map((d) => d.clau)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
    expect(octubre.map((d) => d.esAvui)).toEqual([false, false, false, true, false, false, false]);
    expect(octubre.map((d) => d.diaSetmana)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(diesDeLaSetmana(new Date(2026, 2, 25)).map((d) => d.clau))
      .toEqual(['2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29']);
    expect(diesDeLaSetmana(new Date(2026, 2, 25)).some((d) => d.esAvui)).toBe(false);
    if (!MADRID) return;
    // Entre les mitjanits del 25 i el 26-10 hi ha 25 hores; entre les del 29 i el 30-03, 23.
    expect(sumaDies(new Date(2026, 9, 25), 1) - new Date(2026, 9, 25)).toBe(25 * HORA);
    expect(sumaDies(new Date(2026, 2, 29), 1) - new Date(2026, 2, 29)).toBe(23 * HORA);
  });

  test('mouSetmana: la setmana d’abans i la de després, també creuant l’any', () => {
    expect(mouSetmana(new Date(2026, 9, 21), 1)).toEqual(new Date(2026, 9, 26));
    expect(mouSetmana(new Date(2026, 2, 30), -1)).toEqual(new Date(2026, 2, 23));
    expect(mouSetmana(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 4));
  });

  test('clauDeData i diesEntre: per dies de calendari, no per hores', () => {
    expect(clauDeData(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01');
    expect(diesEntre(new Date(2026, 9, 24, 23), new Date(2026, 9, 26, 0, 30))).toBe(2);
    expect(diesEntre(new Date(2026, 2, 29, 12), new Date(2026, 2, 28, 12))).toBe(-1);
  });
});

describe('setmana ISO 8601', () => {
  test.each([
    [new Date(2026, 9, 1), 2026, 40], [new Date(2026, 2, 23), 2026, 13], [new Date(2026, 9, 19), 2026, 43],
    [new Date(2026, 11, 31), 2026, 53], [new Date(2027, 0, 1), 2026, 53], [new Date(2027, 0, 4), 2027, 1],
    [new Date(2024, 11, 30), 2025, 1], [new Date(2021, 0, 3), 2020, 53]
  ])('%s → %i-W%i', (data, any, setmana) => {
    expect(setmanaIso(data)).toEqual({ any, setmana });
  });

  test('clauSetmanaIso i dillunsDeClauSetmana fan el camí d’anada i tornada', () => {
    expect(clauSetmanaIso(new Date(2026, 9, 1))).toBe('2026-W40');
    expect(clauSetmanaIso(new Date(2027, 0, 1))).toBe('2026-W53');
    expect(dillunsDeClauSetmana('2026-W40')).toEqual(new Date(2026, 8, 28));
    expect(dillunsDeClauSetmana('2026-W53')).toEqual(new Date(2026, 11, 28));
    expect(dillunsDeClauSetmana('2025-W01')).toEqual(new Date(2024, 11, 30));
    for (const clau of ['2026-W01', '2026-W13', '2026-W43', '2027-W52']) expect(clauSetmanaIso(dillunsDeClauSetmana(clau))).toBe(clau);
  });

  test('una clau de setmana que no existix és null', () => {
    for (const brossa of ['2027-W53', '2026-W00', '2026-W54', '2026-w40', '2026-W4', '0026-W10', '2026-40', '', null, undefined, 202640]) {
      expect(dillunsDeClauSetmana(brossa), String(brossa)).toBeNull();
    }
  });
});

describe('graella del mes', () => {
  const claus = (graella) => graella.flat().map((d) => d.clau);

  test('octubre de 2026: 42 dies, del 28-09 al 08-11, i del mes només de l’1 al 31', () => {
    const graella = graellaDelMes({ any: 2026, mes: 9 }, { avui: new Date(2026, 9, 1, 12) });
    expect(graella).toHaveLength(6);
    expect(graella.every((fila) => fila.length === 7)).toBe(true);
    expect(claus(graella)[0]).toBe('2026-09-28');
    expect(claus(graella)[41]).toBe('2026-11-08');
    const delMes = graella.flat().filter((d) => d.delMes).map((d) => d.clau);
    expect(delMes).toHaveLength(31);
    expect([delMes[0], delMes[30]]).toEqual(['2026-10-01', '2026-10-31']);
    expect(graella.flat().filter((d) => d.esAvui).map((d) => d.clau)).toEqual(['2026-10-01']);
    expect(new Set(claus(graella)).size).toBe(42);
  });

  test('març de 2026 comença en diumenge i necessita les sis files; desembre creua l’any', () => {
    const marc = graellaDelMes({ any: 2026, mes: 2 });
    expect(claus(marc)[0]).toBe('2026-02-23');
    expect(graellaDelMes({ any: 2026, mes: 2 }, { setmanes: 'justes' })).toHaveLength(6);
    expect(marc.flat().some((d) => d.esAvui)).toBe(false);
    const desembre = graellaDelMes({ any: 2026, mes: 11 });
    expect([claus(desembre)[0], claus(desembre)[41]]).toEqual(['2026-11-30', '2027-01-10']);
  });

  test('febrer de 2027 comença en dilluns i té 28 dies: amb «justes», quatre files', () => {
    expect(claus(graellaDelMes({ any: 2027, mes: 1 }))[0]).toBe('2027-02-01');
    const justes = graellaDelMes({ any: 2027, mes: 1 }, { setmanes: 'justes' });
    expect(justes).toHaveLength(4);
    expect(justes.flat().every((d) => d.delMes)).toBe(true);
  });
});

describe('rangs i minuts', () => {
  test('rangDeLaSetmana: [dilluns 00:00, dilluns següent 00:00) locals; la del canvi d’hora fa 7 × 24 h + 1 h', () => {
    const { desde, fins } = rangDeLaSetmana(new Date(2026, 9, 21, 15));
    expect(desde).toEqual(new Date(2026, 9, 19));
    expect(fins).toEqual(new Date(2026, 9, 26));
    if (MADRID) expect(fins - desde).toBe(7 * 24 * HORA + HORA);
  });

  test('rangDeLaGraella: [primer dia, l’endemà del darrer) de les sis setmanes', () => {
    expect(rangDeLaGraella({ any: 2026, mes: 9 })).toEqual({ desde: new Date(2026, 8, 28), fins: new Date(2026, 10, 9) });
    expect(rangDeLaGraella({ any: 2027, mes: 1 }, { setmanes: 'justes' })).toEqual({ desde: new Date(2027, 1, 1), fins: new Date(2027, 2, 1) });
  });

  test('minutDeParet: l’hora de paret, també el dia del canvi d’hora', () => {
    expect(minutDeParet(new Date(2026, 9, 1, 10, 15))).toBe(615);
    expect(minutDeParet(new Date(2026, 9, 1, 10, 15).getTime())).toBe(615);
    if (!MADRID) return;
    // El 29-03 les 02:30 no existixen: Date les passa a les 03:30.
    expect(minutDeParet(new Date(2026, 2, 29, 2, 30))).toBe(210);
    expect(minutDeParet(new Date(2026, 9, 25, 2, 30))).toBe(150);
    // El 25-10 les 02:30 passen dos vegades (CEST i CET): totes dues són el minut 150.
    expect(minutDeParet(Date.UTC(2026, 9, 25, 0, 30))).toBe(150);
    expect(minutDeParet(Date.UTC(2026, 9, 25, 1, 30))).toBe(150);
  });
});
