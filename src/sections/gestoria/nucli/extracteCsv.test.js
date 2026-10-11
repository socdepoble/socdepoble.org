// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 6). El lector tolerant
   d'extractes en CSV amb els casos durs de l'ordre: imports negatius,
   devolucions, moneda, dates dd/mm/aa, BOM i punt i coma contra coma. Totes
   les dades són sintètiques (any 2099, comerços inventats). */
import { describe, expect, test } from 'vitest';
import { CODIS_AVIS_EXTRACTE, MOTIUS_SIGNE, llegeixExtracteCsv } from './extracteCsv.js';
import { llegeixMovimentsCsv } from './movimentsBanc.js';

const D = (a, m, d) => ({ a, m, d });
const BOM = String.fromCharCode(0xfeff);
const codis = (lectura) => lectura.avisos.map((a) => a.codi);
const imports = (lectura) => lectura.moviments.map((m) => m.centims);

describe('el separador, la capçalera i el decimal', () => {
  test('punt i coma, coma decimal, dd/mm/aa, BOM i preàmbul: es llig sencer i diu com', () => {
    const text = `${BOM}${[
      'Compte de prova;;;',
      'Període: 01/04/2099 - 30/06/2099;;;',
      'Fecha;Concepto;Importe;Saldo',
      '01/04/99;TRANSFERENCIA REBUDA, CLIENT SINTETIC, SL;1.210,00;1.210,00',
      '30/06/99;REBUT LLUM;-45,30;1.164,70'
    ].join('\r\n')}\r\n`;
    const lectura = llegeixExtracteCsv(text);
    expect(lectura.moviments).toEqual([
      { fila: 4, dataOperacio: D(2099, 4, 1), dataValor: D(2099, 4, 1), concepte: 'TRANSFERENCIA REBUDA, CLIENT SINTETIC, SL', centims: 121000, saldo: 121000 },
      { fila: 5, dataOperacio: D(2099, 6, 30), dataValor: D(2099, 6, 30), concepte: 'REBUT LLUM', centims: -4530, saldo: 116470 }
    ]);
    expect(lectura.format).toMatchObject({ delimitador: 'punt i coma', decimal: ',', capcalera: 3, signe: 'compte', motiuSigne: 'SALDO', targeta: false });
    expect(lectura.format.columnes).toEqual({ data: 0, concepte: 1, import: 2, saldo: 3 });
    expect(lectura.avisos).toEqual([]);
  });

  test('un concepte amb més comes que punts i coma no enganya el separador', () => {
    const text = ['Data;Concepte;Import', '01/07/2099;BAR, FORN, I QUEVIURES, SINTETICS, SL;-3,50'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(lectura.format.delimitador).toBe('punt i coma');
    expect(lectura.moviments).toEqual([expect.objectContaining({ concepte: 'BAR, FORN, I QUEVIURES, SINTETICS, SL', centims: -350 })]);
  });

  test('el format de sempre (coma, ISO i punt decimal) dona els mateixos moviments que movimentsBanc.js', () => {
    const text = ['Fecha,F. valor,Concepto,Importe,Saldo', '2099-07-10,2099-07-11,COMPRA SENSE FACTURA,-45.00,-166.00', '2099-08-01,2099-08-01,ALTRA,-1.00,-167.00'].join('\n');
    const tolerant = llegeixExtracteCsv(text);
    expect(tolerant.format).toMatchObject({ delimitador: 'coma', decimal: '.' });
    expect(tolerant.moviments).toEqual(llegeixMovimentsCsv(text).moviments);
  });

  test('amb tabuladors també', () => {
    const lectura = llegeixExtracteCsv(['Date\tDescription\tAmount', '2099-07-01\tSINTETIC LTD\t-12.50'].join('\n'));
    expect(lectura.format.delimitador).toBe('tabulador');
    expect(imports(lectura)).toEqual([-1250]);
  });

  test('sense capçalera dedueix les columnes pel contingut (i el saldo, per l’aritmètica) i ho avisa', () => {
    const text = ['01/07/2099;COMPRA BAR;-3,50;96,50', '02/07/2099;COMPRA FORN;-1,20;95,30', '03/07/2099;INGRES;100,00;195,30'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(lectura.format.columnes).toEqual({ data: 0, import: 2, saldo: 3, concepte: 1 });
    expect(lectura.format.capcalera).toBeNull();
    expect(imports(lectura)).toEqual([-350, -120, 10000]);
    expect(lectura.moviments.map((m) => m.saldo)).toEqual([9650, 9530, 19530]);
    expect(codis(lectura)).toEqual(['COLUMNES_INFERIDES']);
  });

  test('«1.234»: amb coma decimal a la columna són mil euros; amb punt decimal no es llig, i ho diu', () => {
    const ambComa = llegeixExtracteCsv(['Fecha;Concepto;Importe', '01/07/2099;A;-12,50', '02/07/2099;B;-1.234'].join('\n'));
    expect(imports(ambComa)).toEqual([-1250, -123400]);
    expect(ambComa.avisos).toEqual([]);
    const ambPunt = llegeixExtracteCsv(['Fecha,Concepto,Importe', '2099-07-01,A,-12.50', '2099-07-02,B,-1.234'].join('\n'));
    expect(imports(ambPunt)).toEqual([-1250]);
    expect(ambPunt.avisos).toEqual([expect.objectContaining({ codi: 'IMPORT_AMBIGU', severitat: 'mitjana', fila: 3 })]);
  });

  test('el signe escrit darrere («12,50-») i els parèntesis són negatius', () => {
    const lectura = llegeixExtracteCsv(['Fecha;Concepto;Importe', '01/07/2099;REBUT;12,50-', '02/07/2099;REBUT;(3,00)', '03/07/2099;INGRES;8,00'].join('\n'));
    expect(imports(lectura)).toEqual([-1250, -300, 800]);
  });
});

describe('el signe', () => {
  test('columnes de càrrec i d’abonament: el càrrec resta i l’abonament suma', () => {
    const text = ['Fecha,Concepto,Cargo,Abono,Saldo', '2099-07-01,REBUT,45.30,,100.00', '2099-07-02,INGRES,,200.00,300.00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([-4530, 20000]);
    expect(lectura.format).toMatchObject({ signe: 'columnes', motiuSigne: 'COLUMNES_SEPARADES' });
  });

  test('un extracte que escriu les eixides en positiu es gira quan el saldo ho diu', () => {
    const text = ['Data;Concepte;Import;Saldo', '01/07/2099;COMPRA;10,00;90,00', '02/07/2099;COMPRA;15,00;75,00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([-1000, -1500]);
    expect(lectura.format).toMatchObject({ signe: 'girat', motiuSigne: 'SALDO' });
    expect(codis(lectura)).toEqual(['SIGNE_INVERTIT']);
  });

  test('un CSV amb la data més nova primer també quadra amb el saldo', () => {
    const text = ['Data;Concepte;Import;Saldo', '02/07/2099;COMPRA;-15,00;75,00', '01/07/2099;COMPRA;-10,00;90,00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([-1500, -1000]);
    expect(lectura.format).toMatchObject({ signe: 'compte', motiuSigne: 'SALDO' });
  });

  test('la targeta de crèdit: les compres en positiu passen a negatiu i la devolució, a positiu', () => {
    const text = [
      'Extracte de targeta de crèdit',
      'Fecha operación;Comercio;Importe',
      '01/07/2099;FERRETERIA SINTETICA;25,00',
      '02/07/2099;SUBSCRIPCIO SINTETICA 4321********9876;20,00',
      '03/07/2099;FERRETERIA SINTETICA;-5,00'
    ].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([-2500, -2000, 500]);
    expect(lectura.format).toMatchObject({ signe: 'girat', motiuSigne: 'TARGETA', targeta: true });
    expect(lectura.moviments.map((m) => m.comerc)).toEqual(['FERRETERIA SINTETICA', 'SUBSCRIPCIO SINTETICA', 'FERRETERIA SINTETICA']);
    expect(codis(lectura)).toEqual(['SIGNE_INVERTIT']);
  });

  test('una targeta que ja escriu les compres en negatiu no es gira', () => {
    const text = ['Fecha;Comercio;Importe', '01/07/2099;FERRETERIA SINTETICA;-25,00', '03/07/2099;FERRETERIA SINTETICA;5,00', '04/07/2099;FORN SINTETIC;-2,00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([-2500, 500, -200]);
    expect(lectura.format).toMatchObject({ signe: 'compte', motiuSigne: 'PER_DEFECTE', targeta: true });
  });

  /* Correcció 261011 (refutador, punt 3). */
  test('compres en positiu sense saldo ni cap senyal de targeta: no es giren a cegues, però el signe queda dubtós i s’avisa', () => {
    const text = ['Fecha;Concepto;Importe', '01/07/2099;FERRETERIA SINTETICA;25,00', '02/07/2099;FORN SINTETIC;2,50', '03/07/2099;BAR SINTETIC;4,00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([2500, 250, 400]);
    expect(lectura.format).toMatchObject({ signe: 'compte', motiuSigne: 'PER_DEFECTE', signeDubtos: true, targeta: false });
    expect(lectura.avisos).toEqual([expect.objectContaining({ codi: 'SIGNE_DUBTOS', severitat: 'mitjana' })]);
    expect(MOTIUS_SIGNE).toEqual(['COLUMNES_SEPARADES', 'SALDO', 'TARGETA', 'PER_DEFECTE']);
  });

  test('el mateix extracte amb «tarjeta» al nom del fitxer és d’una targeta: es gira i ja no és dubtós', () => {
    const text = ['Fecha;Concepto;Importe', '01/07/2099;FERRETERIA SINTETICA;25,00', '02/07/2099;FORN SINTETIC;2,50', '03/07/2099;BAR SINTETIC;-4,00'].join('\n');
    const lectura = llegeixExtracteCsv(text, { pista: 'extracte_tarjeta_2099-07.csv' });
    expect(imports(lectura)).toEqual([-2500, -250, 400]);
    expect(lectura.format).toMatchObject({ signe: 'girat', motiuSigne: 'TARGETA', signeDubtos: false, targeta: true });
  });

  test('amb saldo, amb columnes separades o amb majoria d’eixides, el signe no és dubtós', () => {
    const ambSaldo = llegeixExtracteCsv(['Data;Concepte;Import;Saldo', '01/07/2099;INGRES;10,00;110,00', '02/07/2099;INGRES;15,00;125,00'].join('\n'));
    expect(ambSaldo.format).toMatchObject({ motiuSigne: 'SALDO', signeDubtos: false });
    const eixides = llegeixExtracteCsv(['Fecha;Concepto;Importe', '01/07/2099;A;-25,00', '02/07/2099;B;-2,50', '03/07/2099;C;4,00'].join('\n'));
    expect(eixides.format.signeDubtos).toBe(false);
    expect(codis(eixides)).toEqual([]);
  });
});

/* Correccions 261011 (refutador, punts 8 i 10). */
describe('números de targeta i de compte, l’euro escrit i les dates amb el mes davant', () => {
  const concepteDe = (concepte) => llegeixExtracteCsv(['Fecha;Concepto;Importe', `01/07/2099;${concepte};-2,00`].join('\n')).moviments[0].concepte;
  /* Fets a trossos: cap número amb forma de targeta o de compte escrit sencer al codi. */
  const PAN_VALID = ['4111', '1111', '1111', '1111'];
  const NUMERO_QUALSEVOL = ['1000', '0000', '0000', '0000'];
  const IBAN_SINTETIC = ['ES91', '2100', '0418', '4502', '0005', '1332'];

  test('les formes emmascarades que escriuen els bancs se’n van senceres, també el principi', () => {
    expect(concepteDe(`COMPRA ${['XXXX', 'XXXX', 'XXXX', '1234'].join('-')} FORN`)).toBe('COMPRA FORN');
    expect(concepteDe(`COMPRA ${['4532', '****', '****', '1234'].join(' ')} FORN`)).toBe('COMPRA FORN');
    expect(concepteDe('COMPRA ************1234 FORN')).toBe('COMPRA FORN');
  });

  test('un número de targeta sencer (passa Luhn) es tapa i només en queden les quatre últimes; un número llarg qualsevol, no', () => {
    expect(concepteDe(`PAGO ${PAN_VALID.join(' ')} FORN`)).toBe('PAGO ****1111 FORN');
    expect(concepteDe(`PAGO ${PAN_VALID.join('')} FORN`)).toBe('PAGO ****1111 FORN');
    expect(concepteDe(`REF ${NUMERO_QUALSEVOL.join('')} FORN`)).toBe(`REF ${NUMERO_QUALSEVOL.join('')} FORN`);
  });

  test('un IBAN al concepte es tapa i només en queden les quatre últimes; una frase en majúscules, no', () => {
    expect(concepteDe(`TRANSFERENCIA A ${IBAN_SINTETIC.join(' ')}`)).toBe('TRANSFERENCIA A ****1332');
    expect(concepteDe(`TRANSFERENCIA A ${IBAN_SINTETIC.join('')}`)).toBe('TRANSFERENCIA A ****1332');
    expect(concepteDe('REF12 PAGO FACT MARC ABRIL')).toBe('REF12 PAGO FACT MARC ABRIL');
  });

  test('l’euro darrere de l’import no apaga el decimal de la columna ni la guarda de «1.234»', () => {
    const ambComa = llegeixExtracteCsv(['Fecha;Concepto;Importe', '01/07/2099;A;-12,50 €', '02/07/2099;B;-1.234 €'].join('\n'));
    expect(ambComa.format.decimal).toBe(',');
    expect(imports(ambComa)).toEqual([-1250, -123400]);
    const ambPunt = llegeixExtracteCsv(['Fecha,Concepto,Importe', '2099-07-01,A,-12.50 €', '2099-07-02,B,-1.234 €'].join('\n'));
    expect(ambPunt.format.decimal).toBe('.');
    expect(imports(ambPunt)).toEqual([-1250]);
    expect(codis(ambPunt)).toEqual(['IMPORT_AMBIGU']);
  });

  test('si alguna data només existix amb el mes davant, no es llig cap moviment: res es gira a cegues', () => {
    const text = ['Date,Description,Amount', '07/04/2099,SINTETIC INC,-12.50', '07/25/2099,SINTETIC INC,-3.00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(lectura.moviments).toEqual([]);
    expect(lectura.avisos).toEqual([expect.objectContaining({ codi: 'DATES_MES_DIA', severitat: 'alta' })]);
    expect(lectura.format).not.toBeNull();
    /* Amb el dia primer i dies de més de 12, tot és normal. */
    expect(imports(llegeixExtracteCsv(['Date,Description,Amount', '04/07/2099,A,-12.50', '25/07/2099,B,-3.00'].join('\n')))).toEqual([-1250, -300]);
  });
});

describe('la moneda, el número de targeta i les files que no són moviments', () => {
  test('la moneda d’una columna, d’un codi o d’un símbol es conserva i s’avisa', () => {
    const text = [
      'Fecha;Concepto;Importe;Moneda', '01/07/2099;SINTETIC INC;-12,50;USD', '02/07/2099;SINTETIC SL;-3,00;EUR', '03/07/2099;SINTETIC LTD;-4,00 GBP;'
    ].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(lectura.moviments.map((m) => [m.centims, m.moneda])).toEqual([[-1250, 'USD'], [-300, undefined], [-400, 'GBP']]);
    expect(lectura.avisos).toEqual([expect.objectContaining({ codi: 'ALTRA_MONEDA', severitat: 'mitjana' })]);
    const simbol = llegeixExtracteCsv(['Date,Description,Amount', '2099-07-01,SINTETIC INC,-$12.50'].join('\n'));
    expect(simbol.moviments).toEqual([expect.objectContaining({ centims: -1250, moneda: 'USD' })]);
  });

  test('l’euro escrit («€» o «EUR») no és una altra moneda', () => {
    const lectura = llegeixExtracteCsv(['Fecha;Concepto;Importe', '01/07/2099;A;-12,50 €', '02/07/2099;B;-3,00 EUR'].join('\n'));
    expect(lectura.moviments.map((m) => [m.centims, m.moneda])).toEqual([[-1250, undefined], [-300, undefined]]);
    expect(lectura.avisos).toEqual([]);
  });

  test('el número de targeta emmascarat se’n va del concepte; un nom amb ics, no', () => {
    const text = ['Fecha;Concepto;Importe', '01/07/2099;COMPRA 432112******9876 FORN SINTETIC;-2,00', '02/07/2099;TALLER MAXX 2099;-9,00'].join('\n');
    expect(llegeixExtracteCsv(text).moviments.map((m) => m.concepte)).toEqual(['COMPRA FORN SINTETIC', 'TALLER MAXX 2099']);
  });

  test('un peu de totals i una línia de text no són moviments; una fila a mitges, sí que s’avisa', () => {
    const text = [
      'Fecha;Concepto;Importe', '01/07/2099;A;-12,50', ';Sense data;-3,00', '02/07/2099;Sense import;', 'Total;;-15,50', 'Fi de l’extracte;;'
    ].join('\n');
    const lectura = llegeixExtracteCsv(text);
    expect(imports(lectura)).toEqual([-1250]);
    expect(lectura.avisos).toEqual([
      expect.objectContaining({ codi: 'FILA_INVALIDA', fila: 3 }),
      expect.objectContaining({ codi: 'FILA_INVALIDA', fila: 4 }),
      expect.objectContaining({ codi: 'FILES_IGNORADES', severitat: 'info' })
    ]);
  });

  test('un text buit o un CSV que no és un extracte no torna cap moviment i diu per què', () => {
    expect(llegeixExtracteCsv('')).toEqual({ moviments: [], avisos: [expect.objectContaining({ codi: 'CSV_BUIT' })], format: null });
    expect(llegeixExtracteCsv(null).avisos[0].codi).toBe('CSV_BUIT');
    expect(llegeixExtracteCsv('a,b\n1,2')).toEqual({ moviments: [], avisos: [expect.objectContaining({ codi: 'SENSE_COLUMNES' })], format: null });
  });

  test('cada avís porta un codi del catàleg i res del que rep es modifica', () => {
    const text = ['Fecha,Concepto,Importe', '2099-07-01,A,-12.50', '2099-07-02,B,-1.234', ',C,-1.00'].join('\n');
    const lectura = llegeixExtracteCsv(text);
    for (const a of lectura.avisos) expect(CODIS_AVIS_EXTRACTE).toContain(a.codi);
    expect(llegeixExtracteCsv(text)).toEqual(lectura);
  });
});
