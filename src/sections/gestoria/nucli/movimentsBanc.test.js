// @vitest-environment node
/* Gestoria · nucli · movimentsBanc: el CSV de moviments del banc (concepte
   en diverses línies, punt decimal) i la fusió amb la Norma 43, que hi afig
   el comerç de les compres amb targeta. Totes les dades són sintètiques, i
   la targeta porta el prefix de prova 999999. */
import { describe, expect, test } from 'vitest';
import { CODIS_AVIS_CSV_BANC, comercDelConcepte, fusionaMoviments, llegeixMovimentsCsv } from './movimentsBanc.js';

const CAPCALERA = 'Fecha,F. valor,Concepto,Importe,Saldo';
const FILES = [
  '2099-07-02,2099-07-01,"OP.TARJ.COMPRA COMERCIO\n999999******0000 BOTIGA SINTETICA - POBLE        ",-13.61,986.39',
  '2099-07-02,2099-07-01,"OP.TARJ.COMPRA COMERCIO\n999999******0000 ALTRA BOTIGA - POBLE",-13.61,972.78',
  '2099-07-15,2099-07-15,TRANSFERENCIA REBUDA SINTETICA       ,617.43,1590.21',
  '2099-07-20,2099-07-19,"REINTEGRO CAJERO\n999999******0000 CAIXER SINTETIC",-51.37,1538.84'
];
const csv = (files, capcalera = CAPCALERA) => `${[capcalera, ...files].join('\r\n')}\r\n`;

/* Moviments com els de llegeixC43, només amb el que fa falta per a fusionar. */
const moviment = (op, valor, centims, extra = {}) => ({
  dataOperacio: { a: 2099, m: 7, d: op }, dataValor: { a: 2099, m: 7, d: valor }, centims, conceptComu: '99', ...extra
});

describe('llegeixMovimentsCsv', () => {
  const { moviments, avisos } = llegeixMovimentsCsv(csv(FILES));

  test('cada fila del CSV és un moviment: dates ISO, punt decimal i el concepte de diverses línies', () => {
    expect(avisos).toEqual([]);
    expect(moviments).toHaveLength(4);
    expect(moviments[0]).toEqual({
      fila: 2,
      dataOperacio: { a: 2099, m: 7, d: 2 },
      dataValor: { a: 2099, m: 7, d: 1 },
      concepte: 'OP.TARJ.COMPRA COMERCIO\n999999******0000 BOTIGA SINTETICA - POBLE',
      centims: -1361,
      saldo: 98639,
      comerc: 'BOTIGA SINTETICA - POBLE'
    });
    expect(moviments[2]).toMatchObject({ fila: 4, concepte: 'TRANSFERENCIA REBUDA SINTETICA', centims: 61743, saldo: 159021 });
    expect(moviments[2].comerc).toBeUndefined();
  });

  test('el comerç només és de les compres amb targeta, i sense el número de la targeta', () => {
    expect(moviments.map((m) => m.comerc ?? null)).toEqual(['BOTIGA SINTETICA - POBLE', 'ALTRA BOTIGA - POBLE', null, null]);
    expect(JSON.stringify(moviments.map((m) => m.comerc))).not.toContain('999999');
    expect(comercDelConcepte('DEVOL.OP.TARJ.COMPRA COMERCIO\r\n999999XXXXXX0000   Botiga  Sintètica ')).toBe('Botiga Sintètica');
    expect(comercDelConcepte('OP.TARJ.COMPRA COMERCIO')).toBeNull();
    expect(comercDelConcepte('OP.TARJ.COMPRA COMERCIO\nSENSE NUMERO DE TARGETA')).toBeNull();
    expect(comercDelConcepte('OP.TARJ.COMPRA COMERCIO\n999999******0000   ')).toBeNull();
    expect(comercDelConcepte(null)).toBeNull();
  });

  test('l’ordre i els accents de la capçalera no importen; amb punt i coma i coma decimal també', () => {
    const r = llegeixMovimentsCsv(csv(['-3,17;15/07/2099;Compra sintètica;15/07/2099'], 'Importe;Fecha valor;Concepto;Fecha'));
    expect(r.avisos).toEqual([]);
    expect(r.moviments).toEqual([{
      fila: 2, dataOperacio: { a: 2099, m: 7, d: 15 }, dataValor: { a: 2099, m: 7, d: 15 }, concepte: 'Compra sintètica', centims: -317, saldo: null
    }]);
  });

  test('un import amb tres decimals no es llig; una fila sense data tampoc es podrà aparellar', () => {
    const r = llegeixMovimentsCsv(csv(['2099-07-03,2099-07-03,DUBTOS,-1.234,10.5', ',2099-07-04,SENSE DATA,-1.13,', '', '2099-07-05,2099-07-05,SALDO DUBTOS,-1.13,1.2345']));
    expect(r.avisos.map((a) => [a.codi, a.fila])).toEqual([['IMPORT_AMBIGU', 2], ['FILA_INVALIDA', 2], ['FILA_INVALIDA', 3], ['IMPORT_AMBIGU', 5]]);
    expect(r.moviments.map((m) => m.centims)).toEqual([null, -113, -113]);
    expect(r.moviments[2].saldo).toBeNull();
    for (const a of r.avisos) expect(CODIS_AVIS_CSV_BANC).toContain(a.codi);
  });

  test('sense capçalera de moviments o sense files', () => {
    expect(llegeixMovimentsCsv(csv(FILES, 'Data,Concepte,Total')).avisos.map((a) => a.codi)).toEqual(['CAPCALERA']);
    expect(llegeixMovimentsCsv('')).toEqual({ moviments: [], avisos: [expect.objectContaining({ codi: 'CSV_BUIT' })] });
    expect(llegeixMovimentsCsv(null).avisos.map((a) => a.codi)).toEqual(['CSV_BUIT']);
  });
});

describe('fusionaMoviments', () => {
  const delCsv = llegeixMovimentsCsv(csv(FILES));
  const delC43 = [
    moviment(2, 1, -1361, { conceptComu: '12' }),
    moviment(2, 1, -1361, { conceptComu: '12' }),
    moviment(15, 15, 61743),
    moviment(18, 18, -4319, { conceptComu: '03' })
  ];

  test('aparella per dates i import amb signe, en ordre d’aparició, i afig el comerç a les compres amb targeta', () => {
    const { moviments, senseParella } = fusionaMoviments(delC43, delCsv);
    expect(moviments.map((m) => m.comerc ?? null)).toEqual(['BOTIGA SINTETICA - POBLE', 'ALTRA BOTIGA - POBLE', null, null]);
    expect(moviments.map((m) => m.filaCsv ?? null)).toEqual([2, 3, 4, null]);
    expect(senseParella.c43).toEqual([delC43[3]]);
    expect(senseParella.csv).toEqual([delCsv.moviments[3]]);
  });

  test('no modifica res: els aparellats són còpies i els sense parella, els mateixos', () => {
    const abans = JSON.stringify(delC43);
    const { moviments } = fusionaMoviments(delC43, delCsv);
    expect(JSON.stringify(delC43)).toBe(abans);
    expect(moviments[0]).not.toBe(delC43[0]);
    expect(moviments[3]).toBe(delC43[3]);
    expect(moviments[0]).toMatchObject(delC43[0]);
  });

  test('un CSV amb la data més nova primer es llig al revés: el mateix aparellament', () => {
    const invers = llegeixMovimentsCsv(csv([...FILES].reverse()));
    const { moviments } = fusionaMoviments(delC43, invers);
    expect(moviments.map((m) => m.comerc ?? null)).toEqual(['BOTIGA SINTETICA - POBLE', 'ALTRA BOTIGA - POBLE', null, null]);
  });

  test('accepta la lectura sencera de llegeixC43 i ignora les files i els moviments sense clau', () => {
    const lectura = { comptes: [{ moviments: [delC43[0], { ...delC43[1], dataValor: null }] }] };
    const { moviments, senseParella } = fusionaMoviments(lectura, [...delCsv.moviments, { fila: 9, dataOperacio: null, dataValor: null, centims: null }]);
    expect(moviments[0].comerc).toBe('BOTIGA SINTETICA - POBLE');
    expect(senseParella.c43).toHaveLength(1);
    expect(senseParella.csv.map((f) => f.fila)).toEqual([3, 4, 5, 9]);
    expect(fusionaMoviments(null, null)).toEqual({ moviments: [], senseParella: { c43: [], csv: [] } });
  });
});
