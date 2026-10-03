// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  TIPUS_CELLA, ampladaColumna, comprovaModel, dataLocal, eurosExactes, lletraColumna, partsData, segonsDeHora,
  textCela, validaModel, valorCela
} from './model.js';

const fulla = (extra = {}) => ({ nom: 'Diari', columnes: [{ titol: 'Data', tipus: 'data' }], files: [], ...extra });

describe('peces', () => {
  test('lletraColumna: A, Z, AA, ZZ, AAA i l’última d’Excel', () => {
    expect([0, 25, 26, 701, 702, 16383].map(lletraColumna)).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA', 'XFD']);
    expect(() => lletraColumna(-1)).toThrow(RangeError);
    expect(() => lletraColumna(16384)).toThrow(RangeError);
  });

  test('partsData: només dates que existixen', () => {
    expect(partsData('2024-02-29')).toEqual({ any: 2024, mes: 2, dia: 29 });
    expect(partsData('0028-02-29')).toEqual({ any: 28, mes: 2, dia: 29 });
    for (const dolenta of ['2023-02-29', '2026-13-01', '2026-00-10', '2026-1-1', '02/10/2026', 20261002, null]) {
      expect(partsData(dolenta), String(dolenta)).toBeNull();
    }
  });

  test('segonsDeHora: HH:MM i HH:MM:SS de 00:00 a 23:59:59', () => {
    expect(segonsDeHora('00:00')).toBe(0);
    expect(segonsDeHora('07:30')).toBe(27000);
    expect(segonsDeHora('23:59:59')).toBe(86399);
    for (const dolenta of ['24:00', '7:30', '07:60', '07:30:60', '0730', 730]) expect(segonsDeHora(dolenta), String(dolenta)).toBeNull();
  });

  test('dataLocal i eurosExactes', () => {
    expect(dataLocal('2026-10-02')).toBe('02/10/2026');
    expect(dataLocal('no')).toBe('');
    expect(eurosExactes(123456)).toBe('1234.56');
    expect(eurosExactes(-5)).toBe('-0.05');
    expect(eurosExactes(100, ',')).toBe('1,00');
  });

  test('ampladaColumna: la declarada, la del tipus o la del títol', () => {
    expect(ampladaColumna({ titol: 'Hora', tipus: 'hora' })).toBe(8);
    expect(ampladaColumna({ titol: 'Hora', tipus: 'hora', amplada: 5 })).toBe(5);
    expect(ampladaColumna({ titol: 'Urgència declarada', tipus: 'nombre' })).toBe(20);
  });
});

describe('validaModel', () => {
  test('un model correcte no té problemes', () => {
    expect(validaModel({ fulles: [fulla(), fulla({ nom: 'Resum', files: [['2026-10-02']] })] })).toEqual([]);
    expect(() => comprovaModel({ fulles: [fulla()] })).not.toThrow();
    expect(TIPUS_CELLA).toEqual(['text', 'nombre', 'decimal', 'data', 'hora', 'import']);
  });

  test('noms de fulla que Excel no accepta', () => {
    const casos = ['', 'x'.repeat(32), 'Diari:1', 'A/B', 'A[1]', '\'cometa', 'History'];
    for (const nom of casos) expect(validaModel({ fulles: [fulla({ nom })] }).length, nom).toBeGreaterThan(0);
    expect(validaModel({ fulles: [fulla(), fulla({ nom: 'DIARI' })] })).toEqual([expect.stringMatching(/es repetix/)]);
  });

  test('noms amb caràcters de control o que XML no admet: l’XLSX els perdria i Excel l’hauria de reparar', () => {
    const casos = ['\u0001', 'A\u0001', 'Diari\u001F', 'A\tB', 'A\nB', 'A\u007F', 'A\u0085', 'A\u{FFFE}', 'A\u{FFFF}', 'A\uD800'];
    for (const nom of casos) expect(validaModel({ fulles: [fulla({ nom })] }), JSON.stringify(nom)).toEqual([expect.stringMatching(/caràcters de control/)]);
    expect(validaModel({ fulles: [fulla({ nom: 'A' }), fulla({ nom: 'A\u0001' })] }).length).toBeGreaterThan(0);
    expect(validaModel({ fulles: [fulla({ nom: 'Diari \u{1F600}' }), fulla({ nom: 'Ràtio i €' })] })).toEqual([]);
  });

  test('columnes i files mal fetes', () => {
    expect(validaModel(null)).toHaveLength(1);
    expect(validaModel({ fulles: [] })).toEqual(['El model no té cap fulla.']);
    expect(validaModel({ fulles: [fulla({ columnes: [] })] })).toEqual(['Fulla 1: cal almenys una columna.']);
    expect(validaModel({ fulles: [fulla({ columnes: [{ titol: 'X', tipus: 'moneda' }] })] })[0]).toMatch(/tipus desconegut/);
    expect(validaModel({ fulles: [fulla({ columnes: [{ titol: 'X', tipus: 'decimal', decimals: 11 }] })] })[0]).toMatch(/decimals/);
    expect(validaModel({ fulles: [fulla({ files: [['2026-10-02', 'sobra']] })] })[0]).toMatch(/2 valors i només hi ha 1/);
    expect(validaModel({ fulles: [fulla({ files: 'no' })] })[0]).toMatch(/llista de files/);
    expect(() => comprovaModel({ fulles: [] })).toThrow(TypeError);
  });
});

describe('valorCela i textCela', () => {
  const col = (tipus, extra = {}) => ({ titol: 'C', tipus, ...extra });

  test('buit és buit en qualsevol tipus', () => {
    for (const tipus of TIPUS_CELLA) for (const buit of [null, undefined, '']) expect(valorCela(buit, col(tipus))).toBeNull();
    expect(textCela(null, col('import'))).toBe('');
  });

  test('cada tipus normalitza el seu valor', () => {
    expect(valorCela(7, col('text'))).toEqual({ tipus: 'text', valor: '7' });
    expect(valorCela(12, col('nombre'))).toEqual({ tipus: 'nombre', valor: 12 });
    expect(valorCela(-0, col('decimal'))).toEqual({ tipus: 'decimal', valor: 0 });
    expect(valorCela('2026-10-02', col('data'))).toEqual({ tipus: 'data', valor: '2026-10-02' });
    expect(valorCela('07:30', col('hora'))).toEqual({ tipus: 'hora', valor: 27000 });
    expect(valorCela(150, col('import'))).toEqual({ tipus: 'import', valor: 150 });
  });

  test('un valor d’un altre tipus diu on és i què esperava', () => {
    const casos = [['nombre', 1.5], ['decimal', '1,5'], ['decimal', Number.NaN], ['data', '2026-02-30'], ['hora', '25:00'], ['import', 1.5], ['text', {}]];
    for (const [tipus, valor] of casos) {
      expect(() => valorCela(valor, col(tipus), 'fulla «Diari», fila 3'), `${tipus} ${valor}`).toThrow(/^fulla «Diari», fila 3: la columna «C»/);
    }
    expect(() => valorCela('x'.repeat(32768), col('text'))).toThrow(RangeError);
  });

  test('textCela escriu com un full en valencià: coma decimal, DD/MM/AAAA i HH:MM', () => {
    expect(textCela(1.5, col('decimal'))).toBe('1,50');
    expect(textCela(1.2345, col('decimal', { decimals: 3 }))).toBe('1,234');
    expect(textCela(-5, col('import'))).toBe('-0,05');
    expect(textCela(123456, col('import'))).toBe('1234,56');
    expect(textCela('2026-10-02', col('data'))).toBe('02/10/2026');
    expect(textCela('07:05', col('hora'))).toBe('07:05');
    expect(textCela('07:05:09', col('hora'))).toBe('07:05:09');
    expect(textCela(42, col('nombre'))).toBe('42');
    expect(textCela('=1+1', col('text'))).toBe('=1+1');
  });
});
