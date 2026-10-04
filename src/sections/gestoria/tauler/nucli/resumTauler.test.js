// @vitest-environment node
/* Gestoria · Tauler · resumTauler: les xifres del Tauler a partir d'extractes
   sintètics de la Norma 43 i del CSV del banc, fets ací registre a registre.
   Cap dada és real: l'entitat 9999 és de prova, els comptes són inventats i
   el titular és «TITULAR SINTETIC». Imports en cèntims. */
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from '../../nucli/c43.js';
import { crearFactura } from '../../nucli/model.js';
import { llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';
import { CODIS_TAULER, FINESTRA_DIES, MESOS_MITJANA, comptesDe, restaMesos, resumTauler, sumaDies } from './resumTauler.js';

/* ── Norma 43 sintètica (les posicions de c43.js) ─────────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE_A = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const COMPTE_B = { entitat: '9999', oficina: '0002', compte: '0000008765' };
const r11 = (c, { inici, fi, dh = '2', saldo = 0, divisa = '978' }) =>
  `11${c.entitat}${c.oficina}${c.compte}${inici}${fi}${dh}${xifres(saldo, 14)}${divisa}3${text('TITULAR SINTETIC', 26)}${text('', 3)}`;
const r22 = ({ op, dh = '1', centims, comu = '99' }) =>
  `22${text('', 4)}0001${op}${op}${comu}000${dh}${xifres(centims, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`;
const r23 = (concepte) => `2301${text(concepte, 38)}${text('', 38)}`;
const r33 = (c, { nDeure, deure, nHaver, haver, dh = '2', saldo, divisa = '978' }) =>
  `33${c.entitat}${c.oficina}${c.compte}${xifres(nDeure, 5)}${xifres(deure, 14)}${xifres(nHaver, 5)}${xifres(haver, 14)}${dh}${xifres(saldo, 14)}${divisa}${text('', 4)}`;
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${text('', 54)}`;
const fitxer = (linies) => `${[...linies, r88(linies.length)].join('\r\n')}\r\n`;
const llig = (linies) => ({ nom: 'extracte.n43', lectura: llegeixC43(fitxer(linies)) });

/* Compte A, del 01/04/26 al 30/06/26: 5.000,00 € d'inici, quatre càrrecs i un abonament; acaba amb 4.400,00 €. */
const TRIMESTRE_A = [
  r11(COMPTE_A, { inici: '260401', fi: '260630', saldo: 500000 }),
  r22({ op: '260410', centims: 60000 }),
  r22({ op: '260510', centims: 60000 }),
  r22({ op: '260605', dh: '2', centims: 150000 }),
  r22({ op: '260610', centims: 60000 }),
  r22({ op: '260620', centims: 30000 }),
  r23('FORN DE PROVA'),
  r33(COMPTE_A, { nDeure: 4, deure: 210000, nHaver: 1, haver: 150000, saldo: 440000 })
];
/* El mateix compte, del 15/06/26 al 15/07/26: repetix el càrrec del 20/06 i n'afig un del 05/07. */
const SOLAPAT_A = [
  r11(COMPTE_A, { inici: '260615', fi: '260715', saldo: 470000 }),
  r22({ op: '260620', centims: 30000 }),
  r22({ op: '260705', centims: 10000 }),
  r33(COMPTE_A, { nDeure: 2, deure: 40000, nHaver: 0, haver: 0, saldo: 430000 })
];
/* Compte B, en dòlars. */
const DOLARS_B = [
  r11(COMPTE_B, { inici: '260601', fi: '260630', saldo: 100000, divisa: '840' }),
  r33(COMPTE_B, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 100000, divisa: '840' })
];
/* Sense peu (33): el saldo es calcula. */
const SENSE_PEU_A = [
  r11(COMPTE_A, { inici: '260601', fi: '260630', saldo: 10000 }),
  r22({ op: '260602', dh: '2', centims: 2500 })
];

const CSV = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2026-06-25,2026-06-25,COMPRA,-12.34,4387.66',
  '2026-06-20,2026-06-20,"OP.TARJ.COMPRA COMERCIO',
  '999999******1234 FORN DE PROVA",-300.00,4400.00'
].join('\n');
const csv = () => ({ nom: 'moviments.csv', lectura: llegeixMovimentsCsv(CSV) });
const d = (a, m, dia) => ({ a, m, d: dia });
const congela = (x) => JSON.parse(JSON.stringify(x), (_clau, valor) => (valor && typeof valor === 'object' ? Object.freeze(valor) : valor));

describe('el calendari del Tauler', () => {
  test('sumaDies travessa mesos i anys', () => {
    expect(sumaDies(d(2026, 6, 30), -29)).toEqual(d(2026, 6, 1));
    expect(sumaDies(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
    expect(sumaDies(d(2026, 2, 30), 1)).toBeNull();
  });

  test('restaMesos retalla el dia al final del mes', () => {
    expect(restaMesos(d(2026, 8, 31), 6)).toEqual(d(2026, 2, 28));
    expect(restaMesos(d(2028, 8, 31), 6)).toEqual(d(2028, 2, 29));
    expect(restaMesos(d(2026, 3, 15), 6)).toEqual(d(2025, 9, 15));
  });
});

describe('comptesDe', () => {
  test('un compte per entitat i quatre últims dígits, amb el saldo del peu', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(TRIMESTRE_A)] });
    expect(avisos).toEqual([]);
    expect(comptes).toHaveLength(1);
    expect(comptes[0]).toMatchObject({
      id: 'c43-9999-4321', entitat: '9999', compte4: '4321', divisa: 'EUR', desde: d(2026, 4, 1), fins: d(2026, 6, 30),
      saldo: 440000, saldoDe: 'peu', avisos: 0
    });
    expect(comptes[0].moviments).toHaveLength(5);
    expect(JSON.stringify(comptes)).not.toMatch(/0000004321|TITULAR/);
  });

  test('dos extractes que es solapen: els moviments no es repetixen i mana el saldo del més recent', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(SOLAPAT_A), llig(TRIMESTRE_A)] });
    expect(avisos.map((a) => a.codi)).toEqual(['EXTRACTES_SOLAPATS']);
    expect(comptes).toHaveLength(1);
    expect(comptes[0]).toMatchObject({ saldo: 430000, desde: d(2026, 4, 1), fins: d(2026, 7, 15) });
    expect(comptes[0].moviments.map((m) => m.centims)).toEqual([-60000, -60000, 150000, -60000, -30000, -10000]);
  });

  test('sense peu, el saldo és l’inicial més els moviments', () => {
    const [compte] = comptesDe({ extractes: [llig(SENSE_PEU_A)] }).comptes;
    expect(compte).toMatchObject({ saldo: 12500, saldoDe: 'calculat' });
  });

  test('el CSV del banc aporta el comerç; una fila sense parella ho diu i no es compta', () => {
    const { comptes, avisos } = comptesDe({ extractes: [llig(TRIMESTRE_A)], csv: [csv()] });
    expect(comptes[0].moviments).toHaveLength(5);
    expect(comptes[0].moviments.find((m) => m.comerc)).toMatchObject({ centims: -30000, comerc: 'FORN DE PROVA' });
    expect(avisos.map((a) => a.codi)).toEqual(['CSV_SENSE_PARELLA']);
  });

  test('un CSV sense cap Norma 43 fa un compte sense número amb el saldo de la fila més nova', () => {
    const { comptes } = comptesDe({ csv: [csv()] });
    expect(comptes).toEqual([expect.objectContaining({
      id: 'csv', compte4: null, divisa: 'EUR', desde: d(2026, 6, 20), fins: d(2026, 6, 25), saldo: 438766, saldoDe: 'csv'
    })]);
  });

  test('sense res, cap compte; i no modifica el que rep', () => {
    expect(comptesDe()).toEqual({ comptes: [], avisos: [] });
    const extractes = congela([llig(TRIMESTRE_A)]);
    expect(() => comptesDe({ extractes, csv: congela([csv()]) })).not.toThrow();
  });
});

describe('resumTauler', () => {
  const comptes = comptesDe({ extractes: [llig(TRIMESTRE_A), llig(DOLARS_B)] }).comptes;

  test('la caixa real suma els saldos en euros; un compte en dòlars queda fora i ho diu', () => {
    const { caixa, fins } = resumTauler({ comptes });
    expect(fins).toEqual(d(2026, 6, 30));
    expect(caixa).toEqual({ saldo: 440000, completa: false, comptes: 1, exclosos: ['c43-9999-8765'], motiu: 'ALTRA_MONEDA' });
    expect(resumTauler({ comptes: comptes.slice(0, 1) }).caixa).toMatchObject({ saldo: 440000, completa: true, motiu: null });
  });

  test('les finances dels últims 30 dies fins a l’última data dels extractes, mai fins a avui', () => {
    const { finances } = resumTauler({ comptes, avui: d(2026, 10, 4) });
    expect(FINESTRA_DIES).toBe(30);
    expect(finances).toEqual({
      desde: d(2026, 6, 1), fins: d(2026, 6, 30),
      banc: { entrades: 150000, eixides: 90000, net: 60000, moviments: 3 },
      factures: null,
      motiu: null
    });
  });

  test('la cobertura: la caixa entre la despesa mensual mitjana dels mesos observats (com a molt sis)', () => {
    const { cobertura } = resumTauler({ comptes });
    expect(MESOS_MITJANA).toBe(6);
    const mesos = 91 / (365.2425 / 12);
    const despesaMensual = Math.round(210000 / mesos);
    expect(cobertura).toEqual({ mesos: 6.3, despesaMensual, mesosObservats: 3, motiu: null });
    expect(Math.round((440000 / despesaMensual) * 10) / 10).toBe(6.3);
  });

  test('la tresoreria de cada compte, amb el flux de la finestra', () => {
    const { tresoreria } = resumTauler({ comptes });
    expect(tresoreria.map((c) => [c.id, c.compte4, c.divisa, c.saldo])).toEqual([
      ['c43-9999-4321', '4321', 'EUR', 440000],
      ['c43-9999-8765', '8765', 'USD', 100000]
    ]);
    expect(tresoreria[0].finestra).toEqual({ entrades: 150000, eixides: 90000, net: 60000, moviments: 3 });
  });

  test('sense factures no hi ha res a conciliar, i es diu; amb factures, el recompte de concilia', () => {
    expect(resumTauler({ comptes }).conciliacio).toEqual({ ambFactures: false, moviments: 5, factures: 0 });
    const factura = crearFactura({
      tipus: 'despesa', data: '2026-06-18', num: 'FRA-77001', contrapart: 'Forn de Prova', subtotal: '247,93', iva: '52,07', total: '300,00'
    });
    const r = resumTauler({ comptes, factures: [factura] });
    expect(r.conciliacio).toEqual({
      ambFactures: true, moviments: 5, factures: 1, parelles: 1, movimentsSenseFactura: 4, facturesSensePagament: 0, incidencies: 0
    });
    /* Cap factura emesa en euros: les vendes no s'han mesurat (null, no 0); el rendiment sí, amb les compres. */
    expect(r.finances.factures).toEqual({ emeses: 0, rebudes: 1, vendes: null, compres: 24793, rendiment: -24793, completa: true });
  });

  test('sense cap extracte: cap xifra, amb el motiu (mai un zero)', () => {
    const r = resumTauler({ comptes: [] });
    expect(r.caixa).toMatchObject({ saldo: null, motiu: 'SENSE_DADES' });
    expect(r.cobertura).toEqual({ mesos: null, despesaMensual: null, mesosObservats: 0, motiu: 'SENSE_DADES' });
    expect(r.finances).toEqual({ desde: null, fins: null, banc: null, factures: null, motiu: 'SENSE_DADES' });
    expect(r.tresoreria).toEqual([]);
    expect(CODIS_TAULER).toContain(r.caixa.motiu);
  });

  /* Ordre del Mestre, 261004 (zeros falsos): sense res en euros, cap import és 0. */
  test('tots els comptes en una altra moneda: «sense mesura en euros», mai un zero', () => {
    const dolars = comptesDe({ extractes: [llig(DOLARS_B)] }).comptes;
    const r = resumTauler({ comptes: dolars });
    expect(r.finances.banc).toEqual({ entrades: null, eixides: null, net: null, moviments: 0 });
    expect(r.finances.motiu).toBe('ALTRA_MONEDA');
    expect(r.caixa).toMatchObject({ saldo: null, motiu: 'ALTRA_MONEDA' });
    expect(r.cobertura).toMatchObject({ mesos: null, despesaMensual: null, motiu: 'ALTRA_MONEDA' });
    expect(r.tresoreria[0].finestra).toEqual({ entrades: null, eixides: null, net: null, moviments: 0 });
    for (const motiu of [r.finances.motiu, r.caixa.motiu, r.cobertura.motiu]) expect(CODIS_TAULER).toContain(motiu);
  });

  test('un compte en euros sense cap moviment a la finestra: «sense mesura en euros», mai un zero', () => {
    const quiet = [
      r11(COMPTE_A, { inici: '260601', fi: '260630', saldo: 500000 }),
      r33(COMPTE_A, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 500000 })
    ];
    const r = resumTauler({ comptes: comptesDe({ extractes: [llig(quiet)] }).comptes });
    expect(r.caixa).toMatchObject({ saldo: 500000, motiu: null });
    expect(r.finances.banc).toEqual({ entrades: null, eixides: null, net: null, moviments: 0 });
    expect(r.finances.motiu).toBe('SENSE_MOVIMENTS');
    expect(r.cobertura.despesaMensual).toBeNull();
    expect(CODIS_TAULER).toContain(r.finances.motiu);
  });

  test('factures del període en una altra moneda o sense base: cap venda, compra ni rendiment de zero', () => {
    const enDolars = crearFactura({
      tipus: 'ingres', data: '2026-06-18', num: 'FRA-77002', contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00'
    });
    const factures = [{ ...enDolars, moneda: 'USD' }, { ...enDolars, num: 'FRA-77003', tipus: 'despesa', subtotal: null }];
    const r = resumTauler({ comptes, factures });
    expect(r.finances.factures).toEqual({ emeses: 1, rebudes: 1, vendes: null, compres: null, rendiment: null, completa: false });
  });

  test('menys d’un mes de moviments: la cobertura no s’inventa', () => {
    const curt = comptesDe({ extractes: [llig(SENSE_PEU_A)] }).comptes;
    expect(resumTauler({ comptes: curt }).cobertura).toMatchObject({ mesos: null, motiu: 'POCS_DIES' });
  });

  test('no modifica el que rep', () => {
    const congelats = congela(comptes);
    expect(() => resumTauler({ comptes: congelats, factures: congela([]) })).not.toThrow();
  });
});
