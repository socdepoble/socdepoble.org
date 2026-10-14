// @vitest-environment node
/* Gestoria · nucli · movimentsBanc: el CSV de moviments del banc (concepte
   en diverses línies, punt decimal) i la fusió amb la Norma 43, que hi afig
   el comerç de les compres amb targeta. Totes les dades són sintètiques, i
   la targeta porta el prefix de prova 999999. */
import { describe, expect, test } from 'vitest';
import {
  CODIS_AVIS_CSV_BANC,
  comercDelConcepte,
  fusionaMoviments,
  llegeixMovimentsCsv,
  llegeixQualsevolCsvBanc
} from './movimentsBanc.js';

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

describe('llegeixQualsevolCsvBanc', () => {
  test('el CSV clàssic del banc conserva el concepte multilínia i el comerç pel lector estricte', () => {
    const r = llegeixQualsevolCsvBanc(csv(FILES));
    expect(r.origen).toBe('moviments');
    expect(r.avisos).toEqual([]);
    expect(r.moviments).toHaveLength(4);
    expect(r.moviments[0]).toMatchObject({
      concepte: 'OP.TARJ.COMPRA COMERCIO\n999999******0000 BOTIGA SINTETICA - POBLE',
      centims: -1361,
      comerc: 'BOTIGA SINTETICA - POBLE'
    });
  });

  test('Sabadell: preàmbul, punt i coma, coma decimal, milers i Data d’operació sense F. valor', () => {
    const sabadell = [
      ' Banc Sabadell · Extracte de moviments;;;',
      'Període consultat: 01/07/2099 - 31/07/2099;;;',
      "Data d'operació;Concepte;Import;Saldo",
      '05/07/2099;ADEUDO RECIBO SOM ENERGIA SCCL;-1.210,50;3.789,50',
      '12/07/2099;TRANSFERENCIA A FAVOR DE CLIENT SINTETIC;2.500,00;6.289,50'
    ].join('\r\n');
    const r = llegeixQualsevolCsvBanc(sabadell);
    expect(r.origen).toBe('extracte');
    expect(r.avisos).toEqual([]);
    expect(r.moviments).toEqual([
      {
        fila: 4,
        dataOperacio: { a: 2099, m: 7, d: 5 },
        dataValor: { a: 2099, m: 7, d: 5 },
        concepte: 'ADEUDO RECIBO SOM ENERGIA SCCL',
        centims: -121050,
        saldo: 378950
      },
      {
        fila: 5,
        dataOperacio: { a: 2099, m: 7, d: 12 },
        dataValor: { a: 2099, m: 7, d: 12 },
        concepte: 'TRANSFERENCIA A FAVOR DE CLIENT SINTETIC',
        centims: 250000,
        saldo: 628950
      }
    ]);
  });

  test('BBVA: preàmbul, Concepto + Movimiento + Observaciones i Disponible com a saldo', () => {
    const bbva = [
      'Últimos movimientos;;',
      'F.Valor;Fecha;Concepto;Movimiento;Importe;Divisa;Disponible',
      '02/07/2099;01/07/2099;ADEUDO SEPA;LOWI TELECOM;-29,95;EUR;1.470,05',
      '10/07/2099;10/07/2099;PAGO CON TARJETA;ANTHROPIC.COM;-21,78;EUR;1.448,27'
    ].join('\n');
    const r = llegeixQualsevolCsvBanc(bbva);
    expect(r.origen).toBe('extracte');
    expect(r.avisos).toEqual([]);
    expect(r.moviments.map((m) => [m.concepte, m.centims, m.saldo])).toEqual([
      ['ADEUDO SEPA LOWI TELECOM', -2995, 147005],
      ['PAGO CON TARJETA ANTHROPIC.COM', -2178, 144827]
    ]);
  });

  test('CaixaBank: Movimiento + Más datos i Saldo posterior', () => {
    const caixabank = [
      'Fecha;Fecha valor;Movimiento;Más datos;Importe;Saldo posterior',
      '03/07/2099;03/07/2099;RECIBO DOMICILIADO;SITEGROUND SPAIN SL;-145,20 €;2.100,80 €',
      '08/07/2099;08/07/2099;COMPRA TARJETA;FERRETERIA SINTETICA;-18,40 €;2.082,40 €'
    ].join('\n');
    const r = llegeixQualsevolCsvBanc(caixabank);
    expect(r.origen).toBe('extracte');
    expect(r.avisos).toEqual([]);
    expect(r.moviments.map((m) => [m.concepte, m.centims, m.saldo])).toEqual([
      ['RECIBO DOMICILIADO SITEGROUND SPAIN SL', -14520, 210080],
      ['COMPRA TARJETA FERRETERIA SINTETICA', -1840, 208240]
    ]);
  });

  test('Cajamar: Fecha contable, columnes separades Cargo/Abono i Saldo contable', () => {
    const cajamar = [
      'Fecha contable;Fecha valor;Concepto;Cargo;Abono;Saldo contable',
      '04/07/2099;04/07/2099;RECIBO COOPERATIVA ELECTRICA;64,15;;935,85',
      '15/07/2099;15/07/2099;ABONO SUBVENCION;;1.500,00;2.435,85'
    ].join('\n');
    const r = llegeixQualsevolCsvBanc(cajamar);
    expect(r.origen).toBe('extracte');
    expect(r.format?.signe).toBe('columnes');
    expect(r.moviments.map((m) => [m.concepte, m.centims, m.saldo])).toEqual([
      ['RECIBO COOPERATIVA ELECTRICA', -6415, 93585],
      ['ABONO SUBVENCION', 150000, 243585]
    ]);
  });

  test('extracte de targeta de crèdit: gira compres en positiu i ompli comerc', () => {
    const targeta = [
      'Fecha operación;Comercio;Importe',
      '04/07/2099;ANTHROPIC SAN FRANCISCO;20,00',
      '05/07/2099;FAL.AI SAN FRANCISCO;18,50',
      '06/07/2099;FAL.AI SAN FRANCISCO;-3,50'
    ].join('\n');
    const r = llegeixQualsevolCsvBanc(targeta, { pista: 'targeta_juliol.csv' });
    expect(r.origen).toBe('extracte');
    expect(r.format).toMatchObject({ targeta: true, signe: 'girat', motiuSigne: 'TARGETA' });
    expect(r.moviments.map((m) => [m.comerc, m.centims])).toEqual([
      ['ANTHROPIC SAN FRANCISCO', -2000],
      ['FAL.AI SAN FRANCISCO', -1850],
      ['FAL.AI SAN FRANCISCO', 350]
    ]);
  });

  test('text buit o sense columnes d’extracte', () => {
    expect(llegeixQualsevolCsvBanc('')).toEqual({
      moviments: [],
      avisos: [expect.objectContaining({ codi: 'CSV_BUIT' })],
      format: null,
      origen: 'moviments'
    });
    const invalid = llegeixQualsevolCsvBanc('Nom, Ciutat\nAnna, Alcoi');
    expect(invalid.moviments).toEqual([]);
    expect(invalid.avisos[0].codi).toBe('SENSE_COLUMNES');
  });
});

