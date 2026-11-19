import { describe, it, expect } from 'vitest';
import { calculaEstocSeguretat, clauReposicio, reposicioAntiDobleComanda } from './reposicioAntiDobleComanda.js';
const base = { tenantId: 'poble', magatzemId: 'nevera', articleId: 'cigrons', cicle: '2026-11-19',
  demandaDiaria: '2.5', terminiDies: '3', estocSeguretat: 2, estocActual: 5, lot: 6 };
describe('IDEA-284 reposició exacta i idempotència', () => {
  it('calcula seguretat sobre màxims i mitjanes amb sostre exacte', () => {
    expect(calculaEstocSeguretat({ demandaDiaria: '2.5', terminiDies: '3.2', demandaMaximaDiaria: '3.1', terminiMaximDies: '4.2' })).toBe(6);
    expect(calculaEstocSeguretat({ demandaDiaria: '0.1', terminiDies: '0.2', demandaMaximaDiaria: '0.1', terminiMaximDies: '0.2' })).toBe(0);
  });
  it('punt 10, objectiu 16, lot 12 sense error de coma flotant', () => {
    expect(reposicioAntiDobleComanda(base)).toMatchObject({ puntComanda: 10, estocObjectiu: 16, posicioEstoc: 5, quantitatComanda: 12, calComandar: true });
  });
  it('compta comandes en trànsit i reserves', () => {
    expect(reposicioAntiDobleComanda({ ...base, enComanda: 10, reservat: 1 })).toMatchObject({ posicioEstoc: 14, quantitatComanda: 0, motiu: 'estoc_suficient' });
    expect(reposicioAntiDobleComanda({ ...base, reservat: 10 }).quantitatComanda).toBe(24);
  });
  it('igualtat al punt activa reposició i respecta mínim de lot', () => {
    expect(reposicioAntiDobleComanda({ ...base, estocActual: 10, minimComanda: 13 }).quantitatComanda).toBe(18);
  });
  it.each(['pendent', 'enviada', 'confirmada', 'rebuda'])('%s del mateix cicle bloqueja duplicat encara que canvie la quantitat', estat => {
    const clauIdempotencia = clauReposicio(base);
    expect(reposicioAntiDobleComanda({ ...base, estocActual: 0, comandes: [{ clauIdempotencia, estat }] })).toMatchObject({ calComandar: false, motiu: 'comanda_ja_registrada' });
  });
  it.each(['cancel_lada', 'fallida'])('%s permet retry del mateix intent', estat => {
    expect(reposicioAntiDobleComanda({ ...base, comandes: [{ clauIdempotencia: clauReposicio(base), estat }] }).calComandar).toBe(true);
  });
  it('claus inclouen tenant, article, magatzem i cicle; no col·lisionen per separadors', () => {
    expect(clauReposicio({ ...base, tenantId: 'a|1:b', magatzemId: 'c' })).not.toBe(clauReposicio({ ...base, tenantId: 'a', magatzemId: 'b|1:c' }));
    for (const camp of ['tenantId', 'articleId', 'magatzemId', 'cicle']) expect(clauReposicio({ ...base, [camp]: 'altre' })).not.toBe(clauReposicio(base));
  });
  it('no coacciona objectes, NaN, fraccions numèriques ni cadenes desmesurades', () => {
    for (const v of [NaN, Infinity, 0.1, {}, [], '1e3', '-1', '0.0000001', '1'.repeat(10000)]) expect(() => reposicioAntiDobleComanda({ ...base, demandaDiaria: v })).toThrow();
    for (const [camp, valor] of [['lot', 0], ['estocActual', -1], ['enComanda', 0.5], ['estocSeguretat', {}], ['cicle', 'a\u202Eb']]) expect(() => reposicioAntiDobleComanda({ ...base, [camp]: valor })).toThrow();
  });
  it('fail-closed davant estat desconegut i rangs impossibles', () => {
    expect(() => reposicioAntiDobleComanda({ ...base, comandes: [{ clauIdempotencia: 'x', estat: 'inventat' }] })).toThrow();
    expect(() => reposicioAntiDobleComanda({ ...base, demandaDiaria: Number.MAX_SAFE_INTEGER })).toThrow();
    expect(() => reposicioAntiDobleComanda({ ...base, estocObjectiu: 1 })).toThrow();
    expect(() => calculaEstocSeguretat({ demandaDiaria: 2, terminiDies: 2, demandaMaximaDiaria: 1, terminiMaximDies: 2 })).toThrow();
  });
  it('fuzz: 5000 casos contra oracle enter independent i propietats del lot', () => {
    let seed = 284;
    const rand = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
    for (let i = 0; i < 5000; i++) {
      const d = rand(10000), t = rand(100), safety = rand(10), stock = rand(100), lot = 1 + rand(12);
      const entrada = { ...base, demandaDiaria: `${Math.floor(d / 100)}.${String(d % 100).padStart(2, '0')}`, terminiDies: t,
        estocSeguretat: safety, estocActual: stock, lot };
      const before = JSON.stringify(entrada), r = reposicioAntiDobleComanda(entrada);
      expect(r.puntComanda).toBe(Math.floor((d * t + 99) / 100) + safety);
      expect(r.quantitatComanda % lot).toBe(0);
      if (r.calComandar) expect(stock + r.quantitatComanda).toBeGreaterThanOrEqual(r.estocObjectiu);
      expect(JSON.stringify(entrada)).toBe(before);
      expect(reposicioAntiDobleComanda(entrada)).toEqual(r);
    }
  });
});
