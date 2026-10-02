// @vitest-environment node
/* Gestoria · nucli · dates: { a, m, d } sense Date al model, formats de
   factura en tres llengües, trimestres i número de sèrie d'Excel. */
import { describe, expect, test } from 'vitest';
import {
  comparaDates, diesDelMes, diesEntre, dinsDeRang, esBixest, esDataValida, formatData, mesosDelTrimestre,
  nomMes, parseData, rangTrimestre, serialExcel, trimestreDe
} from './dates.js';

const D = (a, m, d) => ({ a, m, d });
/* L'espai no separable es fa des del punt de codi: cap caràcter invisible literal al fitxer. */
const NBSP = String.fromCharCode(0xa0);

describe('parseData: formats numèrics', () => {
  test.each([
    ['30/04/26', D(2026, 4, 30)],
    ['30/04/2026', D(2026, 4, 30)],
    ['1/5/2026', D(2026, 5, 1)],
    ['01/05/26', D(2026, 5, 1)],
    ['2026-04-30', D(2026, 4, 30)],
    ['2026-4-5', D(2026, 4, 5)],
    ['2026/04/30', D(2026, 4, 30)],
    ['30-04-2026', D(2026, 4, 30)],
    ['30.04.2026', D(2026, 4, 30)],
    ['31/12/99', D(2099, 12, 31)],
    ['01/01/00', D(2000, 1, 1)],
    [' 30/04/2026 ', D(2026, 4, 30)],
    ['2026-04-30T10:15:00Z', D(2026, 4, 30)],
    ['2026-04-30T23:59:59.999+02:00', D(2026, 4, 30)],
    ['2026-04-30 10:22:33', D(2026, 4, 30)],
    ['30/04/2026 10:22', D(2026, 4, 30)]
  ])('«%s»', (text, data) => {
    expect(parseData(text)).toEqual(data);
  });
});

describe('parseData: formats textuals', () => {
  test.each([
    ['30 abr 2026', D(2026, 4, 30)],
    ['1 may 2026', D(2026, 5, 1)],
    ['15 de juliol de 2026', D(2026, 7, 15)],
    ['15 jul. 2026', D(2026, 7, 15)],
    ['Jul 15, 2026', D(2026, 7, 15)],
    ['15 July 2026', D(2026, 7, 15)],
    ['July 15, 2026', D(2026, 7, 15)],
    ['July 15th, 2026', D(2026, 7, 15)],
    ['1st Jan 2026', D(2026, 1, 1)],
    ["15 d'abril de 2026", D(2026, 4, 15)],
    ['15 d’abril del 2026', D(2026, 4, 15)],
    ['3 de març de 2026', D(2026, 3, 3)],
    ['3 de marc de 2026', D(2026, 3, 3)],
    ['3 marzo 2026', D(2026, 3, 3)],
    ['3 March 2026', D(2026, 3, 3)],
    ['3 febr. 2026', D(2026, 2, 3)],
    ['3 de febrero de 2026', D(2026, 2, 3)],
    ['12 ag. 2026', D(2026, 8, 12)],
    ['12 ago 2026', D(2026, 8, 12)],
    ['12 agost 2026', D(2026, 8, 12)],
    ['Aug 12, 2026', D(2026, 8, 12)],
    ['9 set. 2026', D(2026, 9, 9)],
    ['9 sept 2026', D(2026, 9, 9)],
    ['9 sep 2026', D(2026, 9, 9)],
    ['9 setembre 2026', D(2026, 9, 9)],
    ['9 de septiembre de 2026', D(2026, 9, 9)],
    ['9 setiembre 2026', D(2026, 9, 9)],
    ['1 des. 2026', D(2026, 12, 1)],
    ['1 dic 2026', D(2026, 12, 1)],
    ['1 Dec 2026', D(2026, 12, 1)],
    ['1 gen 2026', D(2026, 1, 1)],
    ['1 ene 2026', D(2026, 1, 1)],
    ['1 Gener 2026', D(2026, 1, 1)],
    ['20 octubre 2026', D(2026, 10, 20)],
    ['20 nov 2026', D(2026, 11, 20)],
    ['20 juny 2026', D(2026, 6, 20)],
    ['20 Jun 2026', D(2026, 6, 20)],
    ['20 maig 2026', D(2026, 5, 20)],
    ['15-jul-2026', D(2026, 7, 15)],
    ['15/jul/2026', D(2026, 7, 15)],
    ['15 JUL 2026', D(2026, 7, 15)],
    ['15 jul 26', D(2026, 7, 15)],
    ['2026 jul 15', D(2026, 7, 15)],
    ['dimecres, 15 de juliol de 2026', D(2026, 7, 15)],
    ['miércoles, 15 de julio de 2026', D(2026, 7, 15)],
    ['Wed, Jul 15, 2026', D(2026, 7, 15)],
    [`30${NBSP}abr${NBSP}2026`, D(2026, 4, 30)],
    ['15 jul 2026 10:00', D(2026, 7, 15)]
  ])('«%s»', (text, data) => {
    expect(parseData(text)).toEqual(data);
  });
});

describe('parseData: rangs i bixestos', () => {
  test('el 29 de febrer només existix en any de traspàs', () => {
    expect(parseData('29/02/2024')).toEqual(D(2024, 2, 29));
    expect(parseData('29/02/2000')).toEqual(D(2000, 2, 29));
    expect(parseData('29/02/2025')).toBeNull();
    expect(parseData('29/02/1900')).toBeNull();
    expect(parseData('29 feb 2028')).toEqual(D(2028, 2, 29));
    expect(parseData('2026-02-30')).toBeNull();
  });

  test.each([
    '31/04/2026', '31/06/2026', '31/09/2026', '31/11/2026', '32/01/2026', '00/01/2026', '15/13/2026', '15/00/2026',
    '07/15/2026', '30/04-2026', '30/04/202', '30/04/20266', '0999-01-01', '', '   ', 'abc', '15 xyz 2026', '15 jul',
    'jul 2026', '1 de foo de 2026', '15 jul 2026 extra', '15 jul 123', '123 jul 2026', 'jul jul 2026', '2026-04-30T',
    '45 jul 2026'
  ])('«%s» → null', (text) => {
    expect(parseData(text)).toBeNull();
  });

  test('accepta una Data vàlida i en torna una còpia; la resta, null', () => {
    const d = D(2026, 2, 28);
    const copia = parseData(d);
    expect(copia).toEqual(d);
    expect(copia).not.toBe(d);
    expect(parseData(D(2026, 2, 29))).toBeNull();
    expect(parseData(null)).toBeNull();
    expect(parseData(undefined)).toBeNull();
    expect(parseData(20260430)).toBeNull();
    expect(parseData(new Date(2026, 3, 30))).toBeNull();
  });
});

describe('validesa i calendari', () => {
  test('esBixest i diesDelMes', () => {
    expect([2024, 2025, 1900, 2000, 2100].map(esBixest)).toEqual([true, false, false, true, false]);
    expect(diesDelMes(2024, 2)).toBe(29);
    expect(diesDelMes(2026, 2)).toBe(28);
    expect(diesDelMes(2026, 4)).toBe(30);
    expect(diesDelMes(2026, 12)).toBe(31);
    expect(diesDelMes(2026, 13)).toBe(0);
  });

  test('esDataValida', () => {
    expect(esDataValida(D(2026, 1, 31))).toBe(true);
    expect(esDataValida(D(2026, 1, 32))).toBe(false);
    expect(esDataValida(D(26, 1, 1))).toBe(false);
    expect(esDataValida(D(2026, 1.5, 1))).toBe(false);
    expect(esDataValida({ a: '2026', m: 1, d: 1 })).toBe(false);
    expect(esDataValida(null)).toBe(false);
  });
});

describe('formatData', () => {
  test('els tres formats', () => {
    const d = D(2026, 4, 5);
    expect(formatData(d, 'dd/mm/aa')).toBe('05/04/26');
    expect(formatData(d, 'dd/mm/aaaa')).toBe('05/04/2026');
    expect(formatData(d, 'aaaa-mm-dd')).toBe('2026-04-05');
    expect(formatData(d)).toBe('05/04/2026');
    expect(formatData(D(2000, 12, 31), 'dd/mm/aa')).toBe('31/12/00');
  });

  test('data invàlida: buida; format desconegut: error', () => {
    expect(formatData(null)).toBe('');
    expect(formatData(D(2026, 2, 30), 'aaaa-mm-dd')).toBe('');
    expect(() => formatData(D(2026, 1, 1), 'mm/dd/aaaa')).toThrow(RangeError);
  });

  test('anada i tornada amb parseData', () => {
    for (const d of [D(2026, 1, 1), D(2024, 2, 29), D(2026, 12, 31), D(2030, 7, 9)]) {
      for (const format of ['dd/mm/aa', 'dd/mm/aaaa', 'aaaa-mm-dd']) expect(parseData(formatData(d, format))).toEqual(d);
    }
  });
});

describe('trimestres', () => {
  test('trimestreDe', () => {
    const mesos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    expect(mesos.map((m) => trimestreDe(D(2026, m, 1)))).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
    expect(trimestreDe(null)).toBeNull();
    expect(trimestreDe(D(2026, 13, 1))).toBeNull();
  });

  test('rangTrimestre', () => {
    expect(rangTrimestre(2026, 1)).toEqual({ inici: D(2026, 1, 1), fi: D(2026, 3, 31) });
    expect(rangTrimestre(2026, 2)).toEqual({ inici: D(2026, 4, 1), fi: D(2026, 6, 30) });
    expect(rangTrimestre(2026, 3)).toEqual({ inici: D(2026, 7, 1), fi: D(2026, 9, 30) });
    expect(rangTrimestre(2026, 4)).toEqual({ inici: D(2026, 10, 1), fi: D(2026, 12, 31) });
    for (const [any, t] of [[2026, 0], [2026, 5], [2026, '1'], [2026, 1.5], [26, 1], [null, 1]]) expect(rangTrimestre(any, t)).toBeNull();
  });

  test('mesosDelTrimestre', () => {
    expect([1, 2, 3, 4].map(mesosDelTrimestre)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]);
    expect(mesosDelTrimestre(5)).toEqual([]);
    expect(mesosDelTrimestre('2')).toEqual([]);
  });
});

describe('comparacions i comptes de dies', () => {
  test('comparaDates ordena per any, mes i dia, i les absents al final', () => {
    const llista = [D(2026, 5, 1), null, D(2025, 12, 31), D(2026, 4, 30), D(2026, 2, 30), D(2026, 4, 1)];
    expect([...llista].sort(comparaDates)).toEqual([D(2025, 12, 31), D(2026, 4, 1), D(2026, 4, 30), D(2026, 5, 1), null, D(2026, 2, 30)]);
    expect(comparaDates(D(2026, 1, 1), D(2026, 1, 1))).toBe(0);
    expect(comparaDates(null, undefined)).toBe(0);
  });

  test('diesEntre amb Date.UTC: sense horari d’estiu', () => {
    expect(diesEntre(D(2026, 1, 1), D(2026, 12, 31))).toBe(364);
    expect(diesEntre(D(2024, 1, 1), D(2024, 12, 31))).toBe(365);
    expect(diesEntre(D(2024, 2, 28), D(2024, 3, 1))).toBe(2);
    expect(diesEntre(D(2026, 3, 28), D(2026, 3, 30))).toBe(2);
    expect(diesEntre(D(2026, 10, 24), D(2026, 10, 26))).toBe(2);
    expect(diesEntre(D(2026, 3, 30), D(2026, 3, 28))).toBe(-2);
    expect(diesEntre(D(2026, 3, 30), null)).toBeNull();
  });

  test('dinsDeRang inclou els extrems; un extrem absent el deixa obert', () => {
    const rang = rangTrimestre(2026, 2);
    expect(dinsDeRang(D(2026, 4, 1), rang)).toBe(true);
    expect(dinsDeRang(D(2026, 6, 30), rang)).toBe(true);
    expect(dinsDeRang(D(2026, 3, 31), rang)).toBe(false);
    expect(dinsDeRang(D(2026, 7, 1), rang)).toBe(false);
    expect(dinsDeRang(D(2020, 1, 1), { inici: null, fi: D(2026, 1, 1) })).toBe(true);
    expect(dinsDeRang(D(2030, 1, 1), { inici: D(2026, 1, 1) })).toBe(true);
    expect(dinsDeRang(D(2026, 5, 1), { inici: D(2026, 2, 30), fi: D(2026, 12, 31) })).toBe(false);
    expect(dinsDeRang(D(2026, 5, 1), null)).toBe(false);
    expect(dinsDeRang(null, rang)).toBe(false);
  });

  test('serialExcel compta des del 1899-12-30', () => {
    expect(serialExcel(D(1899, 12, 30))).toBe(0);
    expect(serialExcel(D(1899, 12, 31))).toBe(1);
    expect(serialExcel(D(1900, 3, 1))).toBe(61);
    expect(serialExcel(D(2025, 1, 1))).toBe(45658);
    expect(serialExcel(D(2026, 1, 1))).toBe(46023);
    expect(serialExcel(null)).toBeNull();
  });
});

describe('nomMes', () => {
  test('valencià per defecte, en minúscules', () => {
    expect(nomMes(1)).toBe('gener');
    expect(nomMes(3)).toBe('març');
    expect(nomMes(12, 'ca')).toBe('desembre');
  });

  test('majúscula inicial opcional i altres llengües', () => {
    expect(nomMes(3, 'ca', { majuscula: true })).toBe('Març');
    expect(nomMes(3, 'es')).toBe('marzo');
    expect(nomMes(3, 'en', { majuscula: true })).toBe('March');
  });

  test('mes o llengua inexistents: buit', () => {
    for (const m of [0, 13, 1.5, '1', null]) expect(nomMes(m)).toBe('');
    expect(nomMes(1, 'fr')).toBe('');
  });

  test('cada nom es torna a llegir com el seu mes', () => {
    for (const idioma of ['ca', 'es', 'en']) {
      for (let m = 1; m <= 12; m += 1) expect(parseData(`1 ${nomMes(m, idioma)} 2026`)).toEqual(D(2026, m, 1));
    }
  });
});
