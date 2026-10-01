/* Fase visual del calendari (prompt 261001_0445) · Les graelles de la vista
   Mes i de la vista 2 setmanes: les setmanes justes de cada mes (4-6 files) i
   N setmanes seguides des d'un dilluns, sempre de mitjanit local a mitjanit
   local, també quan el període travessa un canvi d'hora. */
import { describe, expect, test } from 'vitest';
import { graellaDeSetmanes, graellaDelMes } from './periodes.js';

const claus = (graella) => graella.flat().map((d) => d.clau);

describe('graellaDelMes amb setmanes justes: les files que toquen el mes', () => {
  test('octubre de 2026 en té cinc; març de 2026, sis; febrer de 2027, quatre', () => {
    expect(graellaDelMes({ any: 2026, mes: 9 }, { setmanes: 'justes' })).toHaveLength(5);
    expect(graellaDelMes({ any: 2026, mes: 2 }, { setmanes: 'justes' })).toHaveLength(6);
    expect(graellaDelMes({ any: 2027, mes: 1 }, { setmanes: 'justes' })).toHaveLength(4);
  });

  test('octubre de 2026: del dilluns 28 de setembre al diumenge 1 de novembre', () => {
    const graella = graellaDelMes({ any: 2026, mes: 9 }, { setmanes: 'justes' });
    expect(claus(graella)[0]).toBe('2026-09-28');
    expect(claus(graella).at(-1)).toBe('2026-11-01');
    expect(graella.flat().filter((d) => !d.delMes).map((d) => d.clau)).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-11-01']);
  });
});

describe('graellaDeSetmanes: N setmanes des del dilluns d’una data', () => {
  test('dues setmanes des d’un dijous comencen el dilluns d’eixa setmana, i cap dia és d’un mes veí', () => {
    const graella = graellaDeSetmanes(new Date(2026, 9, 1, 15, 30), 2, { avui: new Date(2026, 9, 1, 9) });
    expect(graella).toHaveLength(2);
    expect(graella.every((fila) => fila.length === 7)).toBe(true);
    expect(claus(graella)[0]).toBe('2026-09-28');
    expect(claus(graella).at(-1)).toBe('2026-10-11');
    expect(graella.flat().every((d) => d.delMes)).toBe(true);
    expect(graella.flat().filter((d) => d.esAvui).map((d) => d.clau)).toEqual(['2026-10-01']);
  });

  test('amb mes, delMes diu si el dia és d’eixe mes', () => {
    const graella = graellaDeSetmanes(new Date(2026, 9, 1), 2, { mes: { any: 2026, mes: 9 } });
    expect(graella.flat().filter((d) => !d.delMes).map((d) => d.clau)).toEqual(['2026-09-28', '2026-09-29', '2026-09-30']);
  });

  test('sis setmanes des de l’1 del mes són la graella fixa de graellaDelMes', () => {
    const cursor = { any: 2026, mes: 2 };
    const fixa = graellaDelMes(cursor);
    const setmanes = graellaDeSetmanes(new Date(2026, 2, 1), 6, { mes: cursor });
    expect(claus(setmanes)).toEqual(claus(fixa));
    expect(setmanes.flat().map((d) => d.delMes)).toEqual(fixa.flat().map((d) => d.delMes));
  });

  test('travessant el canvi d’hora de tardor (25-10-2026), cada dia és una mitjanit local', () => {
    const graella = graellaDeSetmanes(new Date(2026, 9, 19), 2);
    expect(claus(graella)).toEqual([
      '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
      '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'
    ]);
    expect(graella.flat().every((d) => d.data.getHours() === 0 && d.data.getMinutes() === 0)).toBe(true);
  });

  test('un nombre de setmanes que no és un enter positiu en fa una', () => {
    for (const setmanes of [0, -2, 1.5, '2', null, undefined]) {
      expect(graellaDeSetmanes(new Date(2026, 9, 1), setmanes), String(setmanes)).toHaveLength(1);
    }
  });
});
