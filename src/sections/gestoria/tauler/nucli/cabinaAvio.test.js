// @vitest-environment node
/* Gestoria · Tauler · cabinaAvio: el model de la Cabina d'Avió (ordre del
   Mestre, 13-10-2026, pla 261013_1405, front E). Extractes sintètics de la
   Norma 43 fets ací registre a registre (l'entitat 9999 de prova, comptes
   inventats, «TITULAR SINTETIC») i factures de prova. Imports en cèntims. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from '../../nucli/c43.js';
import { crearFactura } from '../../nucli/model.js';
import { LLEGENDA_ESTIMACIO, resumHisenda } from '../../impostos/nucli/impostos.js';
import {
  DIES_FRESCOR, INSTRUMENTS_CABINA, MESOS_CABINA, NOTA_TERMINIS, cabinaDelTauler, diesDeCobertura, venciments
} from './cabinaAvio.js';
import { DIES_PER_MES } from './resumTauler.js';
import { dadesDelTauler, hisendaSobreCaixa } from './targetesTauler.js';
import { reduixC43 } from './tractorTauler.js';

/* ── Norma 43 sintètica (les posicions de c43.js, com a resumTauler.test.js) ── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE_A = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const COMPTE_B = { entitat: '9999', oficina: '0002', compte: '0000008765' };
const r11 = (c, { inici, fi, dh = '2', saldo = 0, divisa = '978' }) =>
  `11${c.entitat}${c.oficina}${c.compte}${inici}${fi}${dh}${xifres(saldo, 14)}${divisa}3${text('TITULAR SINTETIC', 26)}${text('', 3)}`;
const r22 = ({ op, dh = '1', centims, comu = '99' }) =>
  `22${text('', 4)}0001${op}${op}${comu}000${dh}${xifres(centims, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`;
const r33 = (c, { nDeure, deure, nHaver, haver, dh = '2', saldo, divisa = '978' }) =>
  `33${c.entitat}${c.oficina}${c.compte}${xifres(nDeure, 5)}${xifres(deure, 14)}${xifres(nHaver, 5)}${xifres(haver, 14)}${dh}${xifres(saldo, 14)}${divisa}${text('', 4)}`;
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${text('', 54)}`;
const fitxer = (linies) => `${[...linies, r88(linies.length)].join('\r\n')}\r\n`;
/* La lectura tal com la torna el tractor: la reduïda. */
const extracte = (linies) => ({ lectura: reduixC43(llegeixC43(fitxer(linies))) });
const lecturaDe = (...extractes) => ({ extractes: extractes.map(extracte), csv: [], identitat: null, avisos: [] });

/* Compte A, del 01/04/26 al 30/06/26: 5.000,00 € d'inici, quatre càrrecs i un abonament; acaba amb 4.400,00 €. */
const TRIMESTRE_A = [
  r11(COMPTE_A, { inici: '260401', fi: '260630', saldo: 500000 }),
  r22({ op: '260410', centims: 60000 }),
  r22({ op: '260510', centims: 60000 }),
  r22({ op: '260605', dh: '2', centims: 150000 }),
  r22({ op: '260610', centims: 60000 }),
  r22({ op: '260620', centims: 30000 }),
  r33(COMPTE_A, { nDeure: 4, deure: 210000, nHaver: 1, haver: 150000, saldo: 440000 })
];
/* Compte B, en dòlars: no suma a la caixa, que queda incompleta. */
const DOLARS_B = [
  r11(COMPTE_B, { inici: '260601', fi: '260630', saldo: 100000, divisa: '840' }),
  r33(COMPTE_B, { nDeure: 0, deure: 0, nHaver: 0, haver: 0, saldo: 100000, divisa: '840' })
];
const d = (a, m, dia) => ({ a, m, d: dia });
const AVUI = d(2026, 10, 4);
const VENDA_3T = crearFactura({ tipus: 'ingres', data: '2026-07-15', num: 'A-0201', contrapart: 'Client de Prova', subtotal: '1000,00', iva: '210,00', total: '1210,00' });
const perId = (cabina) => Object.fromEntries(cabina.instruments.map((i) => [i.id, i]));
const congelaClon = (x) => JSON.parse(JSON.stringify(x), (_clau, valor) => (valor && typeof valor === 'object' ? Object.freeze(valor) : valor));

describe('les constants de la Cabina', () => {
  test('dotze mesos de flux, un mes de frescor, vuit instruments i la nota dels terminis', () => {
    expect(MESOS_CABINA).toBe(12);
    expect(DIES_FRESCOR).toBe(31);
    expect(INSTRUMENTS_CABINA).toEqual([
      'caixa', 'despesa-mensual', 'dies-cobertura', 'iva-303', 'irpf-130', 'hisenda-a-pagar', 'caixa-sobre-hisenda', 'dies-despres-hisenda'
    ]);
    expect(Object.isFrozen(INSTRUMENTS_CABINA)).toBe(true);
    expect(NOTA_TERMINIS).toBe('Terminis orientatius: a verificar amb la gestoria.');
  });
});

describe('diesDeCobertura', () => {
  test('la caixa per DIES_PER_MES dividida per la despesa mensual, en dies sencers cap avall', () => {
    expect(diesDeCobertura({ saldo: 300000, despesaMensual: 100000 })).toBe(Math.floor(3 * DIES_PER_MES));
    expect(diesDeCobertura({ saldo: 300000, despesaMensual: 100000 })).toBe(91);
    expect(diesDeCobertura({ saldo: 100000, despesaMensual: 100000 })).toBe(30);
    expect(diesDeCobertura({ saldo: 1, despesaMensual: 100000 })).toBe(0);
  });

  test('una caixa en descobert cobrix 0 dies; sense despesa positiva o sense saldo, cap xifra (mai infinit)', () => {
    expect(diesDeCobertura({ saldo: -5000, despesaMensual: 100000 })).toBe(0);
    expect(diesDeCobertura({ saldo: 0, despesaMensual: 100000 })).toBe(0);
    for (const despesaMensual of [0, -100, null, 1.5, '100']) {
      expect(diesDeCobertura({ saldo: 300000, despesaMensual }), String(despesaMensual)).toBeNull();
    }
    for (const saldo of [null, undefined, 1.5, '300000']) expect(diesDeCobertura({ saldo, despesaMensual: 100000 }), String(saldo)).toBeNull();
    expect(diesDeCobertura()).toBeNull();
  });

  test('la mateixa base que la targeta Cobertura: els seus mesos × DIES_PER_MES, amb l’arredoniment d’una dècima', () => {
    const { resum } = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), avui: AVUI });
    const dies = diesDeCobertura({ saldo: resum.caixa.saldo, despesaMensual: resum.cobertura.despesaMensual });
    expect(Number.isFinite(resum.cobertura.mesos)).toBe(true);
    expect(Math.abs(dies - resum.cobertura.mesos * DIES_PER_MES)).toBeLessThanOrEqual(0.05 * DIES_PER_MES + 1);
  });
});

describe('venciments', () => {
  test('el 4 d’octubre: la presentació del 3T és oberta i la del 4T, propera; sense repetir-ne cap i per data', () => {
    const llista = venciments({ finestres: [{ any: 2026, t: 4 }, { any: 2026, t: 3 }, { any: 2026, t: 4 }, null, { any: 2026, t: 9 }], avui: AVUI });
    expect(llista.map((v) => [v.clau, v.fase, v.diesRestants])).toEqual([['2026-T3', 'oberta', 16], ['2026-T4', 'propera', 118]]);
    expect(llista[0]).toMatchObject({
      any: 2026, t: 3, inici: d(2026, 10, 1), fi: d(2026, 10, 20), titol: '303 i 130 · 3T 2026',
      text: 'La presentació acaba el 20/10/2026: queden 16 dies.'
    });
    expect(llista[1]).toMatchObject({ inici: d(2027, 1, 1), fi: d(2027, 1, 30), text: 'La presentació va del 01/01/2027 al 30/01/2027.' });
    expect(Object.isFrozen(llista)).toBe(true);
    expect(Object.isFrozen(llista[0])).toBe(true);
  });

  test('l’últim dia, el penúltim i l’endemà de la finestra', () => {
    const delTercer = (avui) => venciments({ finestres: [{ any: 2026, t: 3 }], avui })[0];
    expect(delTercer(d(2026, 10, 20))).toMatchObject({ fase: 'oberta', diesRestants: 0, text: 'La presentació acaba hui, el 20/10/2026.' });
    expect(delTercer(d(2026, 10, 19))).toMatchObject({ fase: 'oberta', diesRestants: 1, text: 'La presentació acaba el 20/10/2026: queda un dia.' });
    expect(delTercer(d(2026, 10, 21))).toMatchObject({ fase: 'vencuda', diesRestants: -1, text: 'La presentació va acabar el 20/10/2026.' });
    expect(delTercer(d(2026, 9, 30))).toMatchObject({ fase: 'propera', text: 'La presentació va del 01/10/2026 al 20/10/2026.' });
  });

  test('sense dia d’avui vàlid o sense finestres, cap venciment', () => {
    for (const avui of [null, undefined, d(2026, 2, 30), '2026-10-04']) {
      expect(venciments({ finestres: [{ any: 2026, t: 3 }], avui }), String(avui)).toEqual([]);
    }
    expect(venciments({ avui: AVUI })).toEqual([]);
    expect(venciments({ finestres: 'no', avui: AVUI })).toEqual([]);
    expect(venciments()).toEqual([]);
  });
});

describe('cabinaDelTauler, dins de dadesDelTauler', () => {
  const dades = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), factures: [VENDA_3T], avui: AVUI, periode: { any: 2026, t: 3 } });
  const { cabina } = dades;
  const per = perId(cabina);

  test('els instruments, en ordre, i cada un obri una targeta que existix', () => {
    expect(cabina.instruments.map((i) => i.id)).toEqual(INSTRUMENTS_CABINA);
    const targetes = new Set(dades.targetes.map((t) => t.id));
    for (const i of cabina.instruments) {
      expect(targetes.has(i.targeta), i.id).toBe(true);
      expect(i.titol && i.explica, i.id).toBeTruthy();
      expect(['import', 'dies', 'ratio'], i.id).toContain(i.tipus);
    }
    expect(cabina.instruments.map((i) => i.targeta)).toEqual(['caixa', 'cobertura', 'cobertura', 'iva-303', 'irpf-130', 'hisenda', 'hisenda', 'cobertura']);
  });

  test('les xifres ixen de les mateixes peces que les targetes: cap xifra nova que les contradiga', () => {
    const { caixa, cobertura } = dades.resum;
    expect(per.caixa.xifra).toEqual({ tipus: 'import', valor: 440000, moneda: 'EUR' });
    expect(per['despesa-mensual'].xifra).toEqual({ tipus: 'import', valor: cobertura.despesaMensual, moneda: 'EUR' });
    expect(per['dies-cobertura'].xifra).toEqual({ tipus: 'dies', valor: diesDeCobertura({ saldo: caixa.saldo, despesaMensual: cobertura.despesaMensual }) });
    expect(per['iva-303'].xifra).toEqual({ tipus: 'import', valor: 21000, moneda: 'EUR' });
    expect(per['irpf-130'].xifra).toEqual({ tipus: 'import', valor: 20000, moneda: 'EUR' });
    expect(per['hisenda-a-pagar'].xifra).toEqual({ tipus: 'import', valor: dades.hisenda.total, moneda: 'EUR' });
    expect(dades.hisenda.total).toBe(41000);
    /* 4.400,00 € de caixa davant de 410,00 € a pagar: 10,73 vegades, amb dos decimals. */
    expect(per['caixa-sobre-hisenda'].xifra).toEqual({ tipus: 'ratio', valor: 10.73 });
    expect(per['dies-despres-hisenda'].xifra).toEqual({
      tipus: 'dies', valor: diesDeCobertura({ saldo: 440000 - 41000, despesaMensual: cobertura.despesaMensual })
    });
    expect(per['dies-despres-hisenda'].xifra.valor).toBeLessThan(per['dies-cobertura'].xifra.valor);
    for (const i of cabina.instruments) expect(i.privat, i.id).toBe(false);
  });

  test('una estimació incompleta ho diu a cada xifra que la porta; la caixa sencera, no', () => {
    expect(dades.hisenda.completa).toBe(false);
    expect(per.caixa.avis).toBeNull();
    expect(per['dies-cobertura'].avis).toBeNull();
    expect(per['irpf-130'].avis).toBe('Estimació incompleta');
    expect(per['hisenda-a-pagar'].avis).toBe('Estimació incompleta');
    expect(per['caixa-sobre-hisenda'].avis).toBe('Estimació incompleta');
    expect(per['dies-despres-hisenda'].avis).toBe('Estimació incompleta');
  });

  test('la data de referència és l’últim dia dels extractes, i fa més d’un mes: les dades són antigues', () => {
    expect(cabina.fins).toEqual(d(2026, 6, 30));
    expect(cabina.diesDesDeFins).toBe(96);
    expect(cabina.antiga).toBe(true);
    expect(cabina.referencia).toBe('Les xifres del banc són del 30/06/2026, l’últim dia dels extractes.');
    expect(cabina.avisFrescor).toMatch(/^L’últim dia dels extractes és de fa 96 dies/);
    const frescos = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), avui: d(2026, 7, 31) }).cabina;
    expect(frescos).toMatchObject({ diesDesDeFins: 31, antiga: false, avisFrescor: null });
  });

  test('el flux de cada mes, des del primer amb extractes; el sostre comú dels gràfics', () => {
    expect(cabina.mesos.map((m) => [m.clau, m.cobertura, m.entrades, m.eixides, m.net])).toEqual([
      ['2026-04', 'completa', 0, 60000, -60000],
      ['2026-05', 'completa', 0, 60000, -60000],
      ['2026-06', 'completa', 150000, 90000, 60000]
    ]);
    expect(cabina.maxim).toBe(150000);
    expect(cabina.notaFlux).toMatch(/com a molt dels 12 últims/);
  });

  test('els venciments: el 3T, que es presenta ara, i el 4T, sense repetir el trimestre de les estimacions', () => {
    expect(cabina.venciments.map((v) => [v.titol, v.fase])).toEqual([['303 i 130 · 3T 2026', 'oberta'], ['303 i 130 · 4T 2026', 'propera']]);
    expect(cabina.notaTerminis).toBe(NOTA_TERMINIS);
    /* Amb el 2T triat a la capçalera, el seu venciment ja passat també hi és, el primer. */
    const amb2T = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), avui: AVUI, periode: { any: 2026, t: 2 } }).cabina;
    expect(amb2T.venciments.map((v) => [v.clau, v.fase])).toEqual([['2026-T2', 'vencuda'], ['2026-T3', 'oberta'], ['2026-T4', 'propera']]);
  });

  test('les notes: la llegenda d’estimació i el límit honest de les ràtios', () => {
    expect(cabina.notes[0]).toBe(LLEGENDA_ESTIMACIO);
    expect(cabina.notes[1]).toMatch(/única ràtio de liquiditat.*sense balanç/);
  });

  test('el que torna és congelat', () => {
    for (const x of [cabina, cabina.instruments, per.caixa, per.caixa.xifra, cabina.mesos, cabina.mesos[0], cabina.mesos[0].inici,
      cabina.venciments, cabina.venciments[0], cabina.fins, cabina.notes]) {
      expect(Object.isFrozen(x)).toBe(true);
    }
  });
});

describe('cabinaDelTauler, els casos que no tenen xifra', () => {
  test('sense extractes ni factures: cap xifra, el perquè de cada targeta i cap dia de referència (mai el d’avui)', () => {
    const dades = dadesDelTauler({ avui: AVUI });
    const { cabina } = dades;
    expect(dades.resum.fins).toEqual(AVUI);
    expect(cabina).toMatchObject({ fins: null, diesDesDeFins: null, antiga: false, avisFrescor: null, mesos: [], maxim: null });
    expect(cabina.referencia).toMatch(/^Encara no hi ha cap extracte amb data/);
    const senseDe = Object.fromEntries(dades.targetes.map((t) => [t.id, t.senseXifra]));
    for (const i of cabina.instruments) {
      expect(i.xifra, i.id).toBeNull();
      expect(i.privat, i.id).toBe(false);
      expect(i.avis, i.id).toBeNull();
    }
    for (const id of ['caixa', 'despesa-mensual', 'dies-cobertura', 'iva-303', 'irpf-130', 'hisenda-a-pagar', 'dies-despres-hisenda']) {
      expect(perId(cabina)[id].senseXifra, id).toBe(senseDe[perId(cabina)[id].targeta]);
    }
    expect(perId(cabina)['caixa-sobre-hisenda'].senseXifra).toBe(dades.liquidacio.motiu);
    /* Els venciments no depenen dels extractes: avui sí que se sap. */
    expect(cabina.venciments).toHaveLength(2);
  });

  test('amb la caixa i la despesa però sense estimació: els dies després de Hisenda diuen el perquè de Hisenda', () => {
    const dades = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), avui: AVUI });
    const per = perId(dades.cabina);
    expect(per['dies-cobertura'].xifra).not.toBeNull();
    expect(per['dies-despres-hisenda']).toMatchObject({ xifra: null, privat: false });
    expect(per['dies-despres-hisenda'].senseXifra).toBe(dades.targetes.find((t) => t.id === 'hisenda').senseXifra);
    expect(per['caixa-sobre-hisenda']).toMatchObject({ xifra: null, privat: false, senseXifra: dades.liquidacio.motiu });
  });

  test('un compte en una altra moneda deixa la caixa incompleta, i ho diuen les xifres que en depenen', () => {
    const per = perId(dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A, DOLARS_B), avui: AVUI }).cabina);
    expect(per.caixa).toMatchObject({ xifra: { valor: 440000 }, avis: 'Incompleta' });
    expect(per['dies-cobertura'].avis).toBe('Incompleta');
  });

  /* Auditoria de Codex 261013_1510, GES-A5: un 303 a compensar no resta del 130. */
  test('el que surt a pagar: un 303 negatiu no resta del 130', () => {
    const exempta = crearFactura({ tipus: 'ingres', data: '2026-07-15', num: 'A-0101', contrapart: 'Client de Prova', subtotal: '5000,00', iva: '0,00', total: '5000,00' });
    const inversio = {
      ...crearFactura({ tipus: 'despesa', data: '2026-08-10', num: 'B-0101', contrapart: 'Proveïdor de Prova', subtotal: '1000,00', iva: '210,00', total: '1210,00' }),
      tipusOperacio: 'interior-deduible'
    };
    const per = perId(dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), factures: [exempta, inversio], avui: AVUI, periode: { any: 2026, t: 3 } }).cabina);
    expect(per['iva-303'].xifra.valor).toBe(-21000);
    expect(per['irpf-130'].xifra.valor).toBe(80000);
    expect(per['hisenda-a-pagar'].xifra.valor).toBe(80000);
  });
});

describe('la caixa davant de Hisenda i els dies després de pagar', () => {
  const caixa = (saldo) => ({ saldo, completa: true });
  const hisenda = (total) => ({ total, completa: true });
  const cabinaAmb = (saldo, total, despesaMensual = 100000) => perId(cabinaDelTauler({
    resum: { caixa: caixa(saldo), cobertura: { despesaMensual } },
    hisenda: hisenda(total),
    liquidacio: hisendaSobreCaixa({ hisenda: hisenda(total), caixa: caixa(saldo) })
  }));

  test('la ràtio, amb dos decimals; els dies després de pagar, també quan la caixa no hi arriba (0, no null)', () => {
    expect(cabinaAmb(10000, 3000)['caixa-sobre-hisenda'].xifra).toEqual({ tipus: 'ratio', valor: 3.33 });
    expect(cabinaAmb(300000, 100000)['dies-despres-hisenda'].xifra).toEqual({ tipus: 'dies', valor: diesDeCobertura({ saldo: 200000, despesaMensual: 100000 }) });
    expect(cabinaAmb(1000, 5000)['dies-despres-hisenda'].xifra).toEqual({ tipus: 'dies', valor: 0 });
  });

  test('res a pagar i caixa en descobert: el perquè diu el signe d’una xifra i és privat', () => {
    const res = cabinaAmb(10000, 0)['caixa-sobre-hisenda'];
    expect(res).toMatchObject({ xifra: null, privat: true });
    expect(res.senseXifra).toMatch(/^Ni el 303 ni el 130 d’este trimestre surten a pagar/);
    const descobert = cabinaAmb(-500, 3000)['caixa-sobre-hisenda'];
    expect(descobert).toMatchObject({ xifra: null, privat: true });
    expect(descobert.senseXifra).toMatch(/zero o en descobert/);
    /* Amb res a pagar, els dies després de Hisenda són els de la caixa: una xifra, no cap perquè. */
    expect(cabinaAmb(10000, 0)['dies-despres-hisenda'].xifra).toEqual(cabinaAmb(10000, 0)['dies-cobertura'].xifra);
  });

  /* Revisió adversarial 13-10-2026, troballa FIN-3: amb un model sense estimació, el «res» no pot dir que cap dels
     dos surt a pagar, i una estimació incompleta ho diu també al «res» i al descobert (com a la ràtio). */
  test('«res» amb un model sense estimació: només diu el que se sap, i l’estimació incompleta porta l’avís', () => {
    const caixaReal = { saldo: 10000, completa: true };
    const model = (resultat, completa = true) => ({ resultat, completa });
    const liquiditatAmb = (iva, irpf) => {
      const hisendaDels = resumHisenda({ iva, irpf });
      return perId(cabinaDelTauler({
        resum: { caixa: caixaReal, cobertura: { despesaMensual: 100000 } }, iva, irpf, hisenda: hisendaDels,
        liquidacio: hisendaSobreCaixa({ hisenda: hisendaDels, caixa: caixaReal, iva, irpf })
      }))['caixa-sobre-hisenda'];
    };
    /* Els dos models coneguts: el text de sempre; complet, sense avís; incomplet, amb l'avís. */
    const tots = liquiditatAmb(model(-50000), model(0));
    expect(tots).toMatchObject({ xifra: null, privat: true, avis: null });
    expect(tots.senseXifra).toBe('Ni el 303 ni el 130 d’este trimestre surten a pagar: no hi ha res a comparar amb la caixa.');
    expect(liquiditatAmb(model(-50000, false), model(0, false)))
      .toMatchObject({ xifra: null, privat: true, senseXifra: tots.senseXifra, avis: 'Estimació incompleta' });
    /* El 303 a compensar i el 130 sense estimació. */
    const sense130 = liquiditatAmb(model(-50000), model(null, false));
    expect(sense130).toMatchObject({ xifra: null, privat: true, avis: 'Estimació incompleta' });
    expect(sense130.senseXifra).toBe('El 303 d’este trimestre no surt a pagar, i del 130 encara no hi ha estimació: amb el que se sap, no hi ha res a comparar amb la caixa.');
    /* El mirall: el 303 sense estimació i el 130 a zero. */
    const sense303 = liquiditatAmb(model(null, false), model(0));
    expect(sense303).toMatchObject({ xifra: null, privat: true, avis: 'Estimació incompleta' });
    expect(sense303.senseXifra).toBe('El 130 d’este trimestre no surt a pagar, i del 303 encara no hi ha estimació: amb el que se sap, no hi ha res a comparar amb la caixa.');
    for (const parcial of [sense130, sense303]) expect(parcial.senseXifra).not.toMatch(/Ni el 303 ni el 130/);
    /* Cap dels dos: no hi ha estimació, i el perquè (una absència de dada) no és privat. */
    const cap = liquiditatAmb(model(null, false), model(null, false));
    expect(cap).toMatchObject({ xifra: null, privat: false, avis: null });
    expect(cap.senseXifra).toMatch(/^Sense estimació de Hisenda/);
  });

  test('una caixa en descobert davant d’una estimació incompleta també porta l’avís; completa, no', () => {
    const descobertAmb = (completa) => {
      const caixaReal = { saldo: -500, completa: true };
      const hisendaDe = { total: 3000, completa };
      return perId(cabinaDelTauler({
        resum: { caixa: caixaReal, cobertura: { despesaMensual: 100000 } }, hisenda: hisendaDe,
        liquidacio: hisendaSobreCaixa({ hisenda: hisendaDe, caixa: caixaReal })
      }))['caixa-sobre-hisenda'];
    };
    expect(descobertAmb(false)).toMatchObject({ xifra: null, privat: true, avis: 'Estimació incompleta' });
    expect(descobertAmb(false).senseXifra).toMatch(/zero o en descobert/);
    expect(descobertAmb(true)).toMatchObject({ xifra: null, privat: true, avis: null });
  });

  test('dadesDelTauler: un 303 a compensar amb el 130 sense estimació, a la Cabina, no diu que el 130 no surt a pagar', () => {
    /* Una compra deduïble amb l'IVA llegit i sense la base: el 303 surt a compensar i el 130 no té cap base de l'any. */
    const senseBase = {
      ...crearFactura({ tipus: 'despesa', data: '2026-08-10', num: 'B-0301', contrapart: 'Proveïdor de Prova', iva: '210,00', total: '1210,00' }),
      tipusOperacio: 'interior-deduible'
    };
    const dades = dadesDelTauler({ lectura: lecturaDe(TRIMESTRE_A), factures: [senseBase], avui: AVUI, periode: { any: 2026, t: 3 } });
    const per = perId(dades.cabina);
    expect(per['iva-303'].xifra).toEqual({ tipus: 'import', valor: -21000, moneda: 'EUR' });
    expect(per['irpf-130'].xifra).toBeNull();
    expect(per['caixa-sobre-hisenda']).toMatchObject({ xifra: null, privat: true, avis: 'Estimació incompleta' });
    expect(per['caixa-sobre-hisenda'].senseXifra).toMatch(/^El 303 d’este trimestre no surt a pagar, i del 130 encara no hi ha estimació/);
  });

  test('per absència de dada, el perquè no és privat; sense liquidació ni targetes, «Sense dades»', () => {
    const sense = perId(cabinaDelTauler());
    expect(sense['caixa-sobre-hisenda']).toMatchObject({ xifra: null, privat: false, senseXifra: 'Sense dades: encara no has triat cap extracte del banc.' });
    for (const i of Object.values(sense)) expect(i.xifra, i.id).toBeNull();
    const senseCaixa = cabinaAmb(null, 3000)['caixa-sobre-hisenda'];
    expect(senseCaixa).toMatchObject({ xifra: null, privat: false });
    expect(senseCaixa.senseXifra).toMatch(/^Sense caixa real/);
  });

  test('no modifica el que rep, ni congela res que no siga seu', () => {
    const lectura = lecturaDe(TRIMESTRE_A);
    const dades = dadesDelTauler({ lectura, factures: [VENDA_3T], avui: AVUI, periode: { any: 2026, t: 3 } });
    const entrada = congelaClon({ comptes: dades.comptes, resum: dades.resum, iva: dades.iva, irpf: dades.irpf, hisenda: dades.hisenda });
    const abans = JSON.stringify(entrada);
    const cabina = cabinaDelTauler({ ...entrada, liquidacio: dades.liquidacio, targetes: dades.targetes, avui: AVUI, finestres: [{ any: 2026, t: 3 }] });
    expect(JSON.stringify(entrada)).toBe(abans);
    expect(cabina.mesos).toHaveLength(3);
    /* La data de referència és una còpia: la del compte no queda congelada per la Cabina. */
    expect(Object.isFrozen(dades.comptes[0].fins)).toBe(false);
    expect(dades.cabina.fins).not.toBe(dades.comptes[0].fins);
  });
});

describe('el codi del model', () => {
  test('cap xifra escrita: totes ixen de les lectures', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/gestoria/tauler/nucli/cabinaAvio.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codi).not.toMatch(/\d+,\d{2} ?€|\d{4,}/);
  });
});
