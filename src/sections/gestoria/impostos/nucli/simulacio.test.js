// @vitest-environment node
/* Impostos · la simulació (Onada 6, ordre del Mestre, 261009): el 303 i el
   130 de cada trimestre, encadenats, el 390, la renda orientativa i els
   escenaris. Totes les xifres fiscals són dades [NO VERIFICAT] i cap període
   sense operacions té xifra. Operacions sintètiques en cèntims. */
import { describe, expect, test } from 'vitest';
import {
  CAMPS_PARAMETRES, ETIQUETA_NO_VERIFICAT, PARAMETRES_FISCALS, TRACTAMENTS, aplicaEscenari, comparaEscenari, coberturaDe, estima130, estima303,
  estimaAny, estimaRenda, parametresDe, provisioDe, quotaEscala, simula, totalDeLAny, validaParametres
} from './simulacio.js';

const d = (iso) => ({ a: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });
const ingres = (iso, base, extra = {}) => ({ data: d(iso), tipus: 'ingres', base, iva: Math.round(base * 0.21), retencio: 0, tractament: 'interior', deduibleIva: false, deduibleIrpf: true, ...extra });
const despesa = (iso, base, extra = {}) => ({ data: d(iso), tipus: 'despesa', base, iva: Math.round(base * 0.21), tractament: 'interior', deduibleIva: true, deduibleIrpf: true, ...extra });
const P2025 = parametresDe(2025);

describe('els paràmetres: dades per any, amb la font i l’etiqueta', () => {
  test('2025 i 2026, congelats; cada camp amb la seua font; l’etiqueta diu [NO VERIFICAT]', () => {
    expect(Object.keys(PARAMETRES_FISCALS)).toEqual(['2025', '2026']);
    expect(Object.isFrozen(PARAMETRES_FISCALS[2025])).toBe(true);
    expect(ETIQUETA_NO_VERIFICAT).toMatch(/^\[NO VERIFICAT\] estimació per a revisar amb la gestoria$/);
    for (const camp of CAMPS_PARAMETRES) {
      expect(camp.font.length, camp.clau).toBeGreaterThan(10);
      expect(PARAMETRES_FISCALS[2025], camp.clau).toHaveProperty(camp.clau);
    }
    expect(validaParametres(PARAMETRES_FISCALS[2025])).toEqual([]);
    expect(P2025).toMatchObject({ any: 2025, origen: 'per-defecte', etiqueta: ETIQUETA_NO_VERIFICAT, ivaGeneral: 2100, pagament130: 2000 });
  });

  test('els propis vàlids manen; els invàlids no; un any sense dades usa el més pròxim i ho diu', () => {
    expect(parametresDe(2025, { pagament130: 1500 })).toMatchObject({ origen: 'propis', pagament130: 1500, ivaGeneral: 2100 });
    expect(parametresDe(2025, { pagament130: -1, ivaGeneral: 'vint-i-u' })).toMatchObject({ origen: 'per-defecte', pagament130: 2000 });
    expect(parametresDe(2027)).toMatchObject({ any: 2027, origen: 'd-un-altre-any', anyDeLaFont: 2026 });
    expect(parametresDe(2019)).toMatchObject({ origen: 'd-un-altre-any', anyDeLaFont: 2025 });
  });

  test('validaParametres: percentatges, imports, booleans i escales creixents', () => {
    expect(validaParametres({ ivaGeneral: 10001 })).toHaveLength(1);
    expect(validaParametres({ minimEstatal: 1.5 })).toHaveLength(1);
    expect(validaParametres({ dificilAl130: 'sí' })).toHaveLength(1);
    expect(validaParametres({ escalaEstatal: [{ fins: 1000, tipus: 1000 }, { fins: 500, tipus: 2000 }] })).toHaveLength(1);
    expect(validaParametres({ escalaEstatal: [{ fins: 1000, tipus: 1000 }, { fins: null, tipus: 2000 }] })).toEqual([]);
    expect(validaParametres({ minoracio130: [{ fins: 900000, import: 10000 }] })).toEqual([]);
    expect(validaParametres(null)).toHaveLength(1);
  });

  test('quotaEscala: tram a tram, el darrer sense sostre', () => {
    const escala = P2025.escalaEstatal;
    expect(quotaEscala(1245000, escala)).toBe(118275);
    expect(quotaEscala(2020000, escala)).toBe(118275 + 93000);
    expect(quotaEscala(40000000, escala)).toBe(118275 + 93000 + 225000 + 458800 + 5400000 + 2450000);
    expect(quotaEscala(0, escala)).toBe(0);
    expect(quotaEscala(-5, escala)).toBe(0);
    expect(quotaEscala(1.5, escala)).toBe(0);
  });
});

describe('el 303 d’un trimestre', () => {
  test('interior: el repercutit de les vendes menys el suportat deduïble', () => {
    const r = estima303({ operacions: [ingres('2025-02-01', 100000), despesa('2025-02-10', 10000)], any: 2025, t: 1 });
    expect(r).toMatchObject({ repercutit: 21000, suportat: 2100, quota: 18900, resultat: 18900, aIngressar: 18900, aCompensar: 0, motiu: null });
    expect(r.termini).toEqual({ inici: d('2025-04-01'), fi: d('2025-04-20') });
  });

  test('inversió del subjecte passiu intracomunitària: repercutit i suportat, net zero, amb l’avís del 349 i del ROI', () => {
    const r = estima303({ operacions: [despesa('2025-05-05', 10000, { tractament: 'isp-intracomunitari' })], any: 2025, t: 2 });
    expect(r).toMatchObject({ repercutit: 0, ispIntracomunitari: 2100, ispExtracomunitari: 0, suportat: 2100, quota: 0, aIngressar: 0 });
    expect(r.avisos.map((a) => a.codi)).toEqual(['MODEL_349', 'ROI', 'DES_DEL_BANC']);
  });

  test('extracomunitària: net zero, sense 349; si no es deduïx, l’IVA autoliquidat es paga', () => {
    const r = estima303({ operacions: [despesa('2025-05-05', 10000, { tractament: 'isp-extracomunitari' })], any: 2025, t: 2 });
    expect(r).toMatchObject({ ispExtracomunitari: 2100, suportat: 2100, quota: 0 });
    expect(r.avisos.map((a) => a.codi)).toEqual(['DES_DEL_BANC']);
    const noDeduible = estima303({ operacions: [despesa('2025-05-05', 10000, { tractament: 'isp-extracomunitari', deduibleIva: false })], any: 2025, t: 2 });
    expect(noDeduible).toMatchObject({ quota: 2100, aIngressar: 2100 });
  });

  test('sense operacions, cap xifra (mai 0,00 €): el que hi havia per compensar continua', () => {
    const r = estima303({ operacions: [ingres('2025-02-01', 100000)], any: 2025, t: 2, compensacioAnterior: 700 });
    expect(r).toMatchObject({ repercutit: null, quota: null, resultat: null, aIngressar: null, aCompensar: 700, motiu: 'SENSE_DADES' });
    expect(estima303({ operacions: [], any: 2025, t: 9 }).periode).toBeNull();
  });

  test('una quota negativa es compensa als trimestres següents; al quart, l’avís de la devolució', () => {
    const any = estimaAny({
      operacions: [despesa('2025-01-10', 50000), ingres('2025-04-10', 40000), despesa('2025-10-10', 100000)],
      any: 2025, parametres: P2025
    });
    const [t1, t2, t3, t4] = any.trimestres.map((tr) => tr.iva);
    expect(t1).toMatchObject({ quota: -10500, aIngressar: 0, aCompensar: 10500 });
    expect(t2).toMatchObject({ quota: 8400, compensada: 8400, resultat: 0, aIngressar: 0, aCompensar: 2100 });
    expect(t3).toMatchObject({ motiu: 'SENSE_DADES', aCompensar: 2100 });
    expect(t4).toMatchObject({ quota: -21000, aCompensar: 23100 });
    expect(t4.avisos.map((a) => a.codi)).toContain('T4_A_COMPENSAR');
    expect(any.compensacioFinal).toBe(23100);
  });
});

describe('el 130: acumulat de l’any, amb els pagaments anteriors encadenats', () => {
  const ops = [ingres('2025-02-01', 1000000), despesa('2025-02-15', 200000), ingres('2025-05-01', 1000000), despesa('2025-05-15', 200000)];

  test('el primer trimestre: rendiment menys el 5 % de difícil justificació, al 20 %', () => {
    const r = estima130({ operacions: ops, any: 2025, t: 1, parametres: P2025 });
    expect(r).toMatchObject({ ingressos: 1000000, despeses: 200000, rendimentPrevi: 800000, dificil: 40000, rendiment: 760000, quota: 152000, resultat: 152000 });
    expect(r.avisos.map((a) => a.codi)).toEqual(['SENSE_MINORACIO', 'DES_DEL_BANC']);
  });

  test('el segon descompta el que ja es va pagar al primer', () => {
    const any = estimaAny({ operacions: ops, any: 2025, parametres: P2025 });
    const [t1, t2, t3, t4] = any.trimestres.map((tr) => tr.irpf);
    expect(t1.resultat).toBe(152000);
    expect(t2).toMatchObject({ ingressos: 2000000, despeses: 400000, dificil: 80000, quota: 304000, pagamentsAnteriors: 152000, resultat: 152000 });
    /* Sense cap operació al tercer ni al quart trimestre (i sense saber la cobertura), cap xifra: mai 0,00 €, encara que l'any en tinga abans. */
    expect(t3).toMatchObject({ quota: null, resultat: null, motiu: 'SENSE_DADES' });
    expect(t4).toMatchObject({ resultat: null, motiu: 'SENSE_DADES' });
    expect(any.trimestres.map((tr) => tr.total)).toEqual([152000 + 168000, 152000 + 168000, null, null]);
    expect(totalDeLAny(any)).toBe(2 * (152000 + 168000));
  });

  test('amb la cobertura dels extractes: un trimestre «cap» no té ni 303 ni 130; un cobert sense moviments sí (l’acumulat)', () => {
    const cobertura = { '2025-T1': 'completa', '2025-T2': 'completa', '2025-T3': 'completa' };
    expect(coberturaDe(cobertura, 2025, 4)).toBe('cap');
    expect(coberturaDe(null, 2025, 4)).toBeNull();
    expect(coberturaDe({ '2025-T1': 'inventada' }, 2025, 1)).toBe('cap');
    const any = estimaAny({ operacions: ops, any: 2025, parametres: P2025, cobertura });
    const [, , t3, t4] = any.trimestres;
    /* El tercer, cobert pels extractes i sense cap moviment: el 303 és un zero mesurat i el 130, l'acumulat ja pagat. */
    expect(t3.cobertura).toBe('completa');
    expect(t3.iva).toMatchObject({ repercutit: 0, quota: 0, aIngressar: 0, motiu: null });
    expect(t3.irpf).toMatchObject({ quota: 304000, pagamentsAnteriors: 304000, resultat: 0, motiu: null });
    expect(t3.total).toBe(0);
    /* El quart, sense extractes: cap xifra enlloc, tampoc al total ni a la provisió. */
    expect(t4.cobertura).toBe('cap');
    expect(t4.iva).toMatchObject({ aIngressar: null, motiu: 'SENSE_DADES' });
    expect(t4.irpf).toMatchObject({ resultat: null, motiu: 'SENSE_DADES' });
    expect(t4.total).toBeNull();
    expect(provisioDe({ anys: [any] }, { any: 2025, t: 4 }).valor).toBeNull();
    expect(any.avisos.map((a) => a.codi)).toContain('ANY_INCOMPLET');
    expect(any.model390.parcial).toBe(true);
  });

  test('un trimestre cobert a mitges ho diu, i el 130 avisa si l’acumulat de l’any té dies sense extractes', () => {
    const cobertura = { '2025-T1': 'parcial', '2025-T2': 'completa' };
    const any = estimaAny({ operacions: ops, any: 2025, parametres: P2025, cobertura });
    const [t1, t2] = any.trimestres;
    expect(t1.iva.avisos.map((a) => a.codi)).toContain('TRIMESTRE_PARCIAL');
    expect(t1.irpf.avisos.map((a) => a.codi)).toEqual(expect.arrayContaining(['TRIMESTRE_PARCIAL', 'ACUMULAT_INCOMPLET']));
    expect(t2.iva.avisos.map((a) => a.codi)).not.toContain('TRIMESTRE_PARCIAL');
    expect(t2.irpf.avisos.map((a) => a.codi)).toContain('ACUMULAT_INCOMPLET');
    expect(any.model390.parcial).toBe(true);
    const complet = estimaAny({ operacions: ops, any: 2025, parametres: P2025, cobertura: { '2025-T1': 'completa', '2025-T2': 'completa', '2025-T3': 'completa', '2025-T4': 'completa' } });
    expect(complet.trimestres.flatMap((tr) => tr.irpf.avisos.map((a) => a.codi))).not.toContain('ACUMULAT_INCOMPLET');
  });

  test('simula passa la cobertura a cada any: el quart trimestre de l’any en curs, sense extractes, no té cap xifra', () => {
    const tots = [ingres('2025-02-01', 1000000), ingres('2026-02-01', 1000000), ingres('2026-08-01', 1000000)];
    const cobertura = Object.fromEntries(['2025-T1', '2025-T2', '2025-T3', '2025-T4', '2026-T1', '2026-T2', '2026-T3'].map((c) => [c, 'completa']));
    const sim = simula({ operacions: tots, anys: [2025, 2026], cobertura });
    const [a2025, a2026] = sim.anys;
    expect(a2025.trimestres.map((tr) => tr.irpf.motiu)).toEqual([null, null, null, null]);
    expect(a2026.trimestres[3]).toMatchObject({ cobertura: 'cap', total: null });
    expect(a2026.trimestres[3].irpf.resultat).toBeNull();
    expect(a2026.trimestres[2].irpf.resultat).toEqual(expect.any(Number));
  });

  test('les retencions de les vendes es descompten; un resultat negatiu queda en zero', () => {
    const ambRetencio = [ingres('2025-02-01', 1000000, { retencio: 150000 }), despesa('2025-02-15', 200000)];
    expect(estima130({ operacions: ambRetencio, any: 2025, t: 1, parametres: P2025 })).toMatchObject({ retencions: 150000, resultat: 2000 });
    const perdues = [ingres('2025-02-01', 100000), despesa('2025-02-15', 500000)];
    expect(estima130({ operacions: perdues, any: 2025, t: 1, parametres: P2025 })).toMatchObject({ rendiment: -400000, quota: 0, resultat: 0 });
  });

  test('sense difícil justificació al 130, si es tria; la minoració per rendiments baixos de l’any anterior', () => {
    const sense = parametresDe(2025, { dificilAl130: false });
    expect(estima130({ operacions: ops, any: 2025, t: 1, parametres: sense })).toMatchObject({ dificil: 0, quota: 160000 });
    const baix = estima130({ operacions: ops, any: 2025, t: 1, parametres: P2025, rendimentAnyAnterior: 850000 });
    expect(baix).toMatchObject({ minoracio: 10000, resultat: 142000 });
    expect(baix.avisos.map((a) => a.codi)).not.toContain('SENSE_MINORACIO');
    expect(estima130({ operacions: ops, any: 2025, t: 1, parametres: P2025, rendimentAnyAnterior: 1150000 }).minoracio).toBe(2500);
    expect(estima130({ operacions: ops, any: 2025, t: 1, parametres: P2025, rendimentAnyAnterior: 5000000 }).minoracio).toBe(0);
  });

  test('una despesa sense IVA deduïble compta l’IVA com a cost; una no deduïble no compta', () => {
    const r = estima130({
      operacions: [ingres('2025-02-01', 100000), despesa('2025-02-02', 10000, { deduibleIva: false }), despesa('2025-02-03', 5000, { deduibleIrpf: false })],
      any: 2025, t: 1, parametres: P2025
    });
    expect(r.despeses).toBe(12100);
  });

  test('sense operacions de l’any, cap xifra', () => {
    expect(estima130({ operacions: ops, any: 2026, t: 1, parametres: parametresDe(2026) })).toMatchObject({ quota: null, resultat: null, motiu: 'SENSE_DADES' });
  });
});

describe('la renda orientativa i el 390', () => {
  const ops = [ingres('2025-03-01', 4000000, { retencio: 100000 }), despesa('2025-03-02', 1000000)];

  test('rendiment, difícil justificació, base i les dues escales amb el mínim personal', () => {
    const r = estimaRenda({ operacions: ops, any: 2025, parametres: P2025, pagaments130: 200000 });
    expect(r).toMatchObject({ ingressos: 4000000, despeses: 1000000, rendimentPrevi: 3000000, dificil: 150000, rendiment: 2850000, base: 2850000 });
    expect(r.quotaEstatal).toBe(335775 - 52725);
    expect(r.quotaAutonomica).toBe(325500 - 54945);
    expect(r.quotaIntegra).toBe(283050 + 270555);
    expect(r).toMatchObject({ retencions: 100000, pagaments130: 200000, resultat: 553605 - 300000 });
    expect(r.tipusMitja).toBe(Math.round((553605 / 2850000) * 1000) / 10);
  });

  test('el límit de la difícil justificació i una base per davall del mínim', () => {
    const gran = estimaRenda({ operacions: [ingres('2025-01-01', 10000000)], any: 2025, parametres: P2025 });
    expect(gran.dificil).toBe(200000);
    const petita = estimaRenda({ operacions: [ingres('2025-01-01', 300000)], any: 2025, parametres: P2025 });
    expect(petita).toMatchObject({ quotaEstatal: 0, quotaAutonomica: 0, quotaIntegra: 0 });
    expect(estimaRenda({ operacions: [], any: 2025, parametres: P2025 })).toMatchObject({ resultat: null, tipusMitja: null, motiu: 'SENSE_DADES' });
  });

  test('el 390 suma els 303 de l’any; parcial si falta algun trimestre', () => {
    const any = estimaAny({ operacions: [ingres('2025-02-01', 100000), despesa('2025-05-01', 10000, { tractament: 'isp-intracomunitari' })], any: 2025, parametres: P2025 });
    expect(any.model390).toMatchObject({ parcial: true, repercutit: 21000, isp: 2100, suportat: 2100, resultat: 21000, aIngressar: 21000 });
    expect(any.avisos.map((a) => a.codi)).toEqual(['ANY_INCOMPLET']);
    expect(estimaAny({ operacions: [], any: 2025, parametres: P2025 }).model390).toMatchObject({ resultat: null, motiu: 'SENSE_DADES' });
    expect(totalDeLAny(estimaAny({ operacions: [], any: 2025, parametres: P2025 }))).toBeNull();
  });
});

describe('diversos anys i escenaris', () => {
  const ops = [
    ingres('2025-11-01', 100000), despesa('2025-12-01', 200000),
    ingres('2026-02-01', 2000000), despesa('2026-02-15', 300000, { categoria: 'ia', tractament: 'isp-intracomunitari' })
  ];

  test('simula encadena el que queda per compensar i el rendiment de l’any anterior; avisa d’un any sense paràmetres', () => {
    const sim = simula({ operacions: ops, anys: [2026, 2025, 2025] });
    expect(sim.anys.map((a) => a.any)).toEqual([2025, 2026]);
    expect(sim.etiqueta).toBe(ETIQUETA_NO_VERIFICAT);
    expect(sim.anys[0].compensacioFinal).toBe(21000);
    expect(sim.anys[1].trimestres[0].iva).toMatchObject({ quota: 420000, compensada: 21000, aIngressar: 399000 });
    expect(sim.anys[1].trimestres[0].irpf.minoracio).toBe(10000);
    expect(provisioDe(sim, { any: 2026, t: 1 })).toEqual({ valor: sim.anys[1].trimestres[0].total, any: 2026, t: 1 });
    expect(provisioDe(sim, { any: 2030, t: 1 }).valor).toBeNull();
    expect(simula({ operacions: ops, anys: [2027] }).anys[0].avisos.map((a) => a.codi)).toContain('PARAMETRES_D_UN_ALTRE_ANY');
  });

  test('escenari: facturar un 10 % més i gastar un 50 % menys en IA; la resta de despeses, igual', () => {
    const esc = aplicaEscenari(ops, { facturacio: 10, despesaIa: -50 });
    expect(esc.map((op) => op.base)).toEqual([110000, 200000, 2200000, 150000]);
    expect(esc[2].iva).toBe(462000);
    expect(aplicaEscenari(ops, { facturacio: 'molt' }).map((op) => op.base)).toEqual([100000, 200000, 2000000, 300000]);
    const base = simula({ operacions: ops, anys: [2025, 2026] });
    const escenari = simula({ operacions: esc, anys: [2025, 2026] });
    const diferencies = comparaEscenari(base, escenari);
    expect(diferencies.map((x) => x.any)).toEqual([2025, 2026]);
    expect(diferencies[1].rendiment).toBe(escenari.anys[1].renda.rendiment - base.anys[1].renda.rendiment);
    expect(diferencies[1].total).toBeGreaterThan(0);
    expect(comparaEscenari(base, { anys: [] })[0]).toMatchObject({ total: null });
  });

  test('les operacions mal fetes no compten; els tractaments del catàleg', () => {
    expect(TRACTAMENTS).toEqual(['interior', 'isp-intracomunitari', 'isp-extracomunitari', 'exempt', 'sense-iva']);
    const r = estima303({ operacions: [null, { data: d('2025-01-01'), tipus: 'ingres', base: 1.5 }, { tipus: 'regal', data: d('2025-01-01'), base: 1 }], any: 2025, t: 1 });
    expect(r.motiu).toBe('SENSE_DADES');
  });
});
