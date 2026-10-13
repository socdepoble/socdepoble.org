// @vitest-environment node
/* Gestoria · impostos: l'estimació del 303 i del 130 (pas 1 de l'onada 2,
   MAPA_EMPRESA_GESTORIA §2.4 i §4). Dades sintètiques: factures fictícies,
   sense cap NIF ni nom real. Imports en cèntims. */
import { describe, expect, test } from 'vitest';
import { crearFactura } from '../../nucli/model.js';
import {
  CODIS_FALTA, LLEGENDA_ESTIMACIO, TIPUS_OPERACIO_REBUDA, estimaIrpf130, estimaIva303, resumHisenda, terminiPresentacio,
  trimestreDeData
} from './impostos.js';

const d = (a, m, dia) => ({ a, m, d: dia });
const emesa = (data, subtotal, iva, extra = {}) => ({ tipus: 'ingres', data, subtotal, iva, total: subtotal + iva, estat: 'completa', ...extra });
const rebuda = (data, subtotal, iva, extra = {}) => ({ tipus: 'despesa', data, subtotal, iva, total: subtotal + iva, estat: 'completa', ...extra });
const codis = (resultat) => resultat.falten.map((f) => f.codi);

describe('el calendari', () => {
  test('el trimestre d’una data', () => {
    expect(trimestreDeData(d(2026, 2, 28))).toEqual({ any: 2026, t: 1 });
    expect(trimestreDeData(d(2026, 10, 4))).toEqual({ any: 2026, t: 4 });
    expect(trimestreDeData(d(2026, 2, 30))).toBeNull();
    expect(trimestreDeData(null)).toBeNull();
  });

  test('la finestra de presentació: del dia 1 al 20 del mes següent; la del 4T, fins al 30 de gener', () => {
    expect(terminiPresentacio(2026, 1)).toEqual({ inici: d(2026, 4, 1), fi: d(2026, 4, 20) });
    expect(terminiPresentacio(2026, 3)).toEqual({ inici: d(2026, 10, 1), fi: d(2026, 10, 20) });
    expect(terminiPresentacio(2026, 4)).toEqual({ inici: d(2027, 1, 1), fi: d(2027, 1, 30) });
    expect(terminiPresentacio(2026, 5)).toBeNull();
  });
});

describe('el 303', () => {
  test('sense cap factura del trimestre: cap xifra i «estimació incompleta»', () => {
    const r = estimaIva303({ factures: [], any: 2026, t: 3 });
    expect(r).toMatchObject({ model: '303', completa: false, repercutit: null, suportat: null, resultat: null });
    expect(codis(r)).toEqual(['SENSE_FACTURES']);
    expect(r.termini).toEqual({ inici: d(2026, 10, 1), fi: d(2026, 10, 20) });
  });

  test('una factura rebuda sense tipus d’operació no resta IVA i fa l’estimació incompleta', () => {
    const r = estimaIva303({
      factures: [emesa(d(2026, 7, 10), 100000, 21000), rebuda(d(2026, 8, 3), 20000, 4200)],
      any: 2026, t: 3
    });
    expect(r).toMatchObject({ completa: false, repercutit: 21000, suportat: 0, resultat: 21000, factures: { emeses: 1, rebudes: 1 } });
    expect(codis(r)).toEqual(['SENSE_TIPUS_OPERACIO']);
  });

  test('amb el tipus d’operació de totes les rebudes: completa; la no deduïble no resta', () => {
    const r = estimaIva303({
      factures: [
        emesa(d(2026, 7, 10), 100000, 21000),
        rebuda(d(2026, 8, 3), 20000, 4200, { tipusOperacio: 'interior-deduible' }),
        rebuda(d(2026, 9, 30), 5000, 1050, { tipusOperacio: 'interior-no-deduible' }),
        emesa(d(2026, 10, 1), 999900, 209979)
      ],
      any: 2026, t: 3
    });
    expect(r).toMatchObject({ completa: true, falten: [], repercutit: 21000, suportat: 4200, resultat: 16800 });
    expect(TIPUS_OPERACIO_REBUDA).toEqual(['interior-deduible', 'interior-no-deduible']);
  });

  test('en una altra moneda, sense import o pendent: ho diu, sense inventar res', () => {
    const r = estimaIva303({
      factures: [
        emesa(d(2026, 7, 10), 10000, 2100),
        emesa(d(2026, 7, 11), 10000, 2100, { moneda: 'USD' }),
        emesa(d(2026, 7, 12), 10000, null),
        emesa(d(2026, 7, 13), 10000, 2100, { estat: 'pendent' })
      ],
      any: 2026, t: 3
    });
    expect(r.repercutit).toBe(4200);
    expect(codis(r)).toEqual(['ALTRA_MONEDA', 'IMPORT_DESCONEGUT', 'FACTURA_PENDENT']);
    expect(r.completa).toBe(false);
  });

  /* Ordre del Mestre, 261004 (zeros falsos): factures, sí; cap en euros amb l'IVA llegit. */
  test('totes en una altra moneda o sense IVA llegit: cap xifra, mai un 0,00 €', () => {
    const r = estimaIva303({
      factures: [emesa(d(2026, 7, 10), 10000, 2100, { moneda: 'USD' }), rebuda(d(2026, 8, 3), 5000, null)],
      any: 2026, t: 3
    });
    expect(r).toMatchObject({ completa: false, repercutit: null, suportat: null, resultat: null, factures: { emeses: 0, rebudes: 0 } });
    expect(codis(r)).toEqual(['ALTRA_MONEDA', 'IMPORT_DESCONEGUT']);
  });

  test('un trimestre que no existix no peta', () => {
    expect(estimaIva303({ any: 2026, t: 0 })).toMatchObject({ completa: false, resultat: null, periode: null });
    expect(codis(estimaIva303({ any: 2026, t: 0 }))).toEqual(['TRIMESTRE_INVALID']);
  });

  test('accepta les factures del model i no les modifica', () => {
    const factures = Object.freeze([
      Object.freeze(crearFactura({ tipus: 'ingres', data: '15/07/2026', num: 'A-0001', contrapart: 'Client de Prova', subtotal: '100,00', iva: '21,00', total: '121,00' }))
    ]);
    expect(estimaIva303({ factures, any: 2026, t: 3 }).repercutit).toBe(2100);
  });
});

describe('el 130', () => {
  test('el 20 % del rendiment acumulat de l’any, menys retencions i pagaments anteriors', () => {
    const r = estimaIrpf130({
      factures: [
        emesa(d(2026, 2, 10), 300000, 63000, { retencio: 45000 }),
        rebuda(d(2026, 5, 3), 50000, 10500),
        emesa(d(2026, 8, 20), 200000, 42000),
        rebuda(d(2026, 11, 2), 10000, 2100)
      ],
      any: 2026, t: 3, pagamentsAnteriors: 20000
    });
    expect(r).toMatchObject({
      model: '130', completa: true, ingressos: 500000, despeses: 50000, rendiment: 450000, quota: 90000,
      retencions: 45000, pagamentsAnteriors: 20000, resultat: 25000
    });
    expect(r.periode).toEqual({ inici: d(2026, 1, 1), fi: d(2026, 9, 30) });
  });

  test('sense els pagaments dels trimestres anteriors: la xifra no els descompta i és incompleta', () => {
    const r = estimaIrpf130({ factures: [emesa(d(2026, 7, 1), 100000, 21000)], any: 2026, t: 3 });
    expect(r).toMatchObject({ completa: false, quota: 20000, pagamentsAnteriors: null, resultat: 20000 });
    expect(codis(r)).toEqual(['PAGAMENTS_ANTERIORS']);
  });

  test('el primer trimestre no té pagaments anteriors', () => {
    expect(estimaIrpf130({ factures: [emesa(d(2026, 1, 9), 10000, 2100)], any: 2026, t: 1 }))
      .toMatchObject({ completa: true, pagamentsAnteriors: 0, resultat: 2000 });
  });

  test('un rendiment negatiu o unes retencions més grans no fan cap xifra negativa', () => {
    expect(estimaIrpf130({ factures: [rebuda(d(2026, 1, 9), 10000, 2100)], any: 2026, t: 1 }))
      .toMatchObject({ rendiment: -10000, quota: 0, resultat: 0 });
    expect(estimaIrpf130({ factures: [emesa(d(2026, 1, 9), 10000, 2100, { retencio: 1500 })], any: 2026, t: 1 }))
      .toMatchObject({ quota: 2000, retencions: 1500, resultat: 500 });
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I · motors; auditoria de Codex 261013_1510, GES-A4). */
  test('la retenció d’una rectificativa resta: factura i abonament íntegre són neutrals', () => {
    const neutral = estimaIrpf130({ factures: [emesa(d(2026, 1, 9), 10000, 0)], any: 2026, t: 1 });
    const ambParella = estimaIrpf130({
      factures: [
        emesa(d(2026, 1, 5), 10000, 0, { retencio: 1500 }),
        emesa(d(2026, 1, 6), -10000, 0, { retencio: 1500 }),
        emesa(d(2026, 1, 9), 10000, 0)
      ],
      any: 2026, t: 1
    });
    const projecta = (r) => ({ rendiment: r.rendiment, retencions: r.retencions, resultat: r.resultat });
    expect(projecta(ambParella)).toEqual(projecta(neutral));
    expect(projecta(ambParella)).toEqual({ rendiment: 10000, retencions: 0, resultat: 2000 });
    /* El signe escrit de la retenció no importa: el mana la base, com al model. */
    const escritaNegativa = estimaIrpf130({
      factures: [emesa(d(2026, 1, 5), 10000, 0, { retencio: -1500 }), emesa(d(2026, 1, 6), -10000, 0, { retencio: -1500 })], any: 2026, t: 1
    });
    expect(escritaNegativa.retencions).toBe(0);
  });

  test('un abonament sense la seua factura a l’any: la retenció neta és negativa i no s’amaga', () => {
    const r = estimaIrpf130({
      factures: [emesa(d(2026, 1, 9), 20000, 0), emesa(d(2026, 2, 3), -5000, 0, { retencio: 750 })], any: 2026, t: 1
    });
    expect(r).toMatchObject({ rendiment: 15000, quota: 3000, retencions: -750, resultat: 3750 });
  });

  test('totes les de l’any en una altra moneda o sense base: cap xifra, mai un 0,00 €', () => {
    const r = estimaIrpf130({
      factures: [emesa(d(2026, 1, 9), 10000, 2100, { moneda: 'GBP' }), rebuda(d(2026, 2, 3), null, 0)],
      any: 2026, t: 1
    });
    expect(r).toMatchObject({ completa: false, ingressos: null, despeses: null, rendiment: null, quota: null, retencions: null, resultat: null });
    expect(codis(r)).toEqual(['ALTRA_MONEDA', 'IMPORT_DESCONEGUT']);
    expect(resumHisenda({ iva: estimaIva303({ factures: [emesa(d(2026, 1, 9), 10000, 2100, { moneda: 'GBP' })], any: 2026, t: 1 }), irpf: r }).total)
      .toBeNull();
  });

  test('sense cap factura de l’any: cap xifra', () => {
    const r = estimaIrpf130({ any: 2026, t: 1 });
    expect(r).toMatchObject({ completa: false, resultat: null, quota: null });
    expect(codis(r)).toEqual(['SENSE_FACTURES']);
  });
});

describe('la targeta Hisenda', () => {
  /* Ordre del Mestre, 13-10-2026 (auditoria de Codex 261013_1510, GES-A5): resumHisenda porta també
     `ivaACompensar` (0 si el 303 surt a pagar; null sense 303). */
  test('suma les dues estimacions; amb una sola, la que hi ha i incompleta; sense cap, cap xifra', () => {
    const iva = { resultat: 16800, completa: true, falten: [] };
    const irpf = { resultat: 25000, completa: true, falten: [] };
    expect(resumHisenda({ iva, irpf })).toEqual({ total: 41800, ivaACompensar: 0, completa: true, falten: [] });
    const senseIrpf = { resultat: null, completa: false, falten: [{ codi: 'SENSE_FACTURES', missatge: 'x' }] };
    expect(resumHisenda({ iva, irpf: senseIrpf })).toMatchObject({ total: 16800, completa: false });
    expect(resumHisenda({})).toEqual({ total: null, ivaACompensar: null, completa: false, falten: [] });
  });

  /* GES-A5: un 303 negatiu és IVA a compensar, no diners cobrats: no resta del 130. */
  test('un 303 a compensar no resta del 130: el que surt a pagar va a part del crèdit d’IVA', () => {
    const iva = { resultat: -50000, completa: true, falten: [] };
    const irpf = { resultat: 30000, completa: true, falten: [] };
    expect(resumHisenda({ iva, irpf })).toEqual({ total: 30000, ivaACompensar: 50000, completa: true, falten: [] });
    /* Només el 303 a compensar: no hi ha res a pagar, però la xifra existix (0), i el crèdit, a part. */
    expect(resumHisenda({ iva, irpf: { resultat: null, completa: false, falten: [] } })).toMatchObject({ total: 0, ivaACompensar: 50000, completa: false });
    /* Un 303 a pagar no té res a compensar. */
    expect(resumHisenda({ iva: { resultat: 2100, completa: true, falten: [] }, irpf })).toMatchObject({ total: 32100, ivaACompensar: 0 });
    /* Sense 303, el crèdit no es pot saber: null, mai 0. */
    expect(resumHisenda({ iva: { resultat: null, completa: false, falten: [] }, irpf })).toMatchObject({ total: 30000, ivaACompensar: null });
  });

  test('els codis i la llegenda: mai «declaració» com a promesa', () => {
    expect(CODIS_FALTA[0]).toBe('TRIMESTRE_INVALID');
    expect(LLEGENDA_ESTIMACIO).toMatch(/^Estimació per a revisar amb la gestoria/);
  });
});
