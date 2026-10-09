// @vitest-environment node
/* Històric · dels moviments classificats a les operacions de la simulació
   (Onada 6, ordre del Mestre, 261009). Les suposicions són explícites i
   editables; cada operació porta origen 'banc'. Moviments sintètics. */
import { describe, expect, test } from 'vitest';
import { CAMPS_SUPOSITS, SUPOSITS_PER_DEFECTE, operacionsDelBanc, supositsDe } from './operacions.js';

const d = (iso) => ({ a: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });
const mov = (centims, categoria, proveidor = null, iso = '2025-03-10') => ({ data: d(iso), centims, categoria, proveidor });
const una = (m, suposits) => operacionsDelBanc({ moviments: [m], suposits }).operacions[0];

describe('les suposicions', () => {
  test('per defecte: IVA del 21 %, sense retenció ni deduccions dubtoses; cada una descrita', () => {
    expect(SUPOSITS_PER_DEFECTE).toEqual({
      ivaVendes: 2100, retencioVendes: 0, ivaDespesesInteriors: 2100, estrangerAmbIva: false, nominesDeduibles: false, altresDeduibles: false
    });
    expect(CAMPS_SUPOSITS.map((c) => c.clau).sort()).toEqual(Object.keys(SUPOSITS_PER_DEFECTE).sort());
    expect(supositsDe({ retencioVendes: 1500, ivaVendes: 'molt', altresDeduibles: 'sí' })).toMatchObject({ retencioVendes: 1500, ivaVendes: 2100, altresDeduibles: false });
    expect(Object.isFrozen(supositsDe())).toBe(true);
  });
});

describe('cada categoria', () => {
  test('un cobrament de client: base + IVA − retenció', () => {
    expect(una(mov(121000, 'clients'))).toMatchObject({ tipus: 'ingres', tractament: 'interior', base: 100000, iva: 21000, retencio: 0, origen: 'banc' });
    expect(una(mov(106000, 'clients'), { retencioVendes: 1500 })).toMatchObject({ base: 100000, iva: 21000, retencio: 15000 });
  });

  test('IA d’Irlanda: inversió del subjecte passiu intracomunitària; dels Estats Units, extracomunitària', () => {
    expect(una(mov(-2000, 'ia', 'anthropic'))).toMatchObject({ tipus: 'despesa', tractament: 'isp-intracomunitari', base: 2000, iva: 420, deduibleIva: true, deduibleIrpf: true });
    expect(una(mov(-2000, 'ia', 'perplexity'))).toMatchObject({ tractament: 'isp-extracomunitari', base: 2000, iva: 420 });
    expect(una(mov(-2000, 'ia', 'anthropic'), { estrangerAmbIva: true })).toMatchObject({ tractament: 'sense-iva', base: 2000, iva: 0, deduibleIva: false });
  });

  test('una empresa d’Espanya: l’IVA va dins del càrrec', () => {
    expect(una(mov(-1210, 'allotjament', 'siteground'))).toMatchObject({ tractament: 'interior', base: 1000, iva: 210, deduibleIva: true });
    expect(una(mov(-1210, 'telefonia'))).toMatchObject({ tractament: 'interior', base: 1000, iva: 210 });
  });

  test('sense proveïdor conegut a IA o programari: sense IVA deduïble, i es compta', () => {
    const { operacions, senseTractament } = operacionsDelBanc({ moviments: [mov(-500, 'ia'), mov(-500, 'programari')] });
    expect(operacions.map((op) => op.tractament)).toEqual(['sense-iva', 'sense-iva']);
    expect(operacions.every((op) => op.deduibleIrpf && !op.deduibleIva)).toBe(true);
    expect(senseTractament).toBe(2);
  });

  test('comissions exemptes, RETA sense IVA; nòmines, altres i per revisar, no deduïbles per defecte', () => {
    expect(una(mov(-300, 'comissions'))).toMatchObject({ tractament: 'exempt', deduibleIrpf: true, iva: 0 });
    expect(una(mov(-29400, 'reta'))).toMatchObject({ tractament: 'sense-iva', deduibleIrpf: true });
    const r = operacionsDelBanc({ moviments: [mov(-100, 'nomines'), mov(-100, 'altres'), mov(-100, 'revisa')] });
    expect(r.operacions.map((op) => op.deduibleIrpf)).toEqual([false, false, false]);
    expect(r.noDeduibles).toBe(3);
    const deduibles = operacionsDelBanc({ moviments: [mov(-100, 'nomines'), mov(-100, 'altres')], suposits: { nominesDeduibles: true, altresDeduibles: true } });
    expect(deduibles.operacions.map((op) => op.deduibleIrpf)).toEqual([true, true]);
  });

  test('impostos i traspassos, fora; una entrada en «altres» no és cap ingrés; una devolució resta', () => {
    const r = operacionsDelBanc({ moviments: [mov(-100, 'impostos'), mov(50, 'traspas'), mov(700, 'altres'), mov(500, 'ia', 'openai'), mov(0, 'ia')] });
    expect(r.exclosos).toEqual({ impostos: 1, traspas: 1, entradesSenseIngres: 1 });
    expect(r.operacions).toHaveLength(1);
    expect(r.operacions[0]).toMatchObject({ tipus: 'despesa', base: -500, iva: -105 });
  });

  test('cap moviment, cap operació; la data i la categoria passen a l’operació', () => {
    expect(operacionsDelBanc()).toEqual({ operacions: [], exclosos: { impostos: 0, traspas: 0, entradesSenseIngres: 0 }, senseTractament: 0, noDeduibles: 0 });
    expect(una(mov(-2000, 'ia', 'anthropic', '2026-02-01'))).toMatchObject({ data: d('2026-02-01'), categoria: 'ia', proveidor: 'anthropic' });
  });
});
