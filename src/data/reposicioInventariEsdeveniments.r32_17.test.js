import { describe, it, expect } from 'vitest';
import { creaPeticioReservaCicleInventari, validaRebutReservaCicleInventari, reservaCicleReposicioInventari } from './reposicioInventariEsdeveniments.js';
import { clauReposicio } from './inventari/reposicioAntiDobleComanda.js';
const entrada = { tenantId: '00000000-0000-4000-8000-000000000001', magatzemId: 'rebost', articleId: 'cigrons', cicle: '2026-11-20', quantitat: 12 };
const rebut = extra => ({ esquema: 'sdp.inventari.reserva.v1', reserva_id: '00000000-0000-4000-8000-000000000099', tenant_id: entrada.tenantId,
  magatzem_id: entrada.magatzemId, article_id: entrada.articleId, cicle_id: entrada.cicle, quantitat: entrada.quantitat, creada: true, ...extra });

describe('R32.17 adaptador neutral de reserva atòmica', () => {
  it('projecta un DTO immutable i un rebut verificat amb clau canònica', async () => {
    const crides = [];
    const result = await reservaCicleReposicioInventari(entrada, { reservaCicle: async peticio => {
      crides.push(peticio); expect(Object.isFrozen(peticio)).toBe(true); return rebut();
    } });
    expect(crides).toEqual([entrada]); expect(result).toMatchObject({ ...entrada, creada: true, potIniciarComanda: true, estat: 'reservada', clauIdempotencia: clauReposicio(entrada) });
    expect(Object.isFrozen(result)).toBe(true); expect(entrada).not.toHaveProperty('reservaId');
  });
  it('un replay només informa i no dóna permís per tornar a iniciar comanda', () => {
    expect(validaRebutReservaCicleInventari(rebut({ creada: false }), entrada)).toMatchObject({ creada: false, potIniciarComanda: false, estat: 'ja_reservada' });
  });
  it('absència, error de transport i timeout propaguen el bloqueig sense fallback local', async () => {
    await expect(reservaCicleReposicioInventari(entrada)).rejects.toThrow(/no disponible/);
    const error = new Error('timeout');
    await expect(reservaCicleReposicioInventari(entrada, { reservaCicle: () => Promise.reject(error) })).rejects.toBe(error);
    for (const resposta of [null, {}, [], true]) await expect(reservaCicleReposicioInventari(entrada, { reservaCicle: async () => resposta })).rejects.toThrow();
  });
  it('refusa camps desconeguts, accessors, autoritat client i quantitats no enteres segures', () => {
    for (const quantitat of [0, -0, -1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '12', {}, null]) {
      expect(() => creaPeticioReservaCicleInventari({ ...entrada, quantitat })).toThrow();
    }
    for (const delta of [{ tenantId: 'poble' }, { tenantId: entrada.tenantId.toUpperCase().replace('4000','4A00') },
      { magatzemId: '' }, { articleId: 'x'.repeat(161) }, { cicle: 'e\u0301' }, { cicle: 'a\n' }, { cicle: 'a\u202E' },
      { creada: true }, { actor: 'admin' }, { caducaEn: '2027-01-01' }]) expect(() => creaPeticioReservaCicleInventari({ ...entrada, ...delta })).toThrow();
    let crides = 0; const cru = { ...entrada }; Object.defineProperty(cru, 'quantitat', { enumerable: true, get() { crides++; return 12; } });
    expect(() => creaPeticioReservaCicleInventari(cru)).toThrow(); expect(crides).toBe(0);
  });
  it('refusa rebut aliè, mutat, truncat o amb getter abans de coaccionar-lo', () => {
    for (const delta of [{ esquema: 'altra' }, { tenant_id: '00000000-0000-4000-8000-000000000002' }, { magatzem_id: 'altre' },
      { article_id: {} }, { cicle_id: 'altre' }, { quantitat: 13 }, { quantitat: '12' }, { creada: 1 }, { creada: 'true' }, { reserva_id: 'no-uuid' }, { admin: true }]) {
      expect(() => validaRebutReservaCicleInventari(rebut(delta), entrada)).toThrow();
    }
    for (const camp of Object.keys(rebut())) { const r = rebut(); delete r[camp]; expect(() => validaRebutReservaCicleInventari(r, entrada)).toThrow(); }
    let crides = 0; const r = rebut(); Object.defineProperty(r, 'creada', { enumerable: true, get() { crides++; return true; } });
    expect(() => validaRebutReservaCicleInventari(r, entrada)).toThrow(); expect(crides).toBe(0);
  });
  it('Gauntlet v1.2.14 · refusa espais als extrems, Proxy que canvia de valor i camps heretats del prototip', () => {
    for (const delta of [{ magatzemId: 'rebost ' }, { magatzemId: ' rebost' }, { articleId: 'cigrons\u00a0' }, { cicle: '\u20002026' }]) {
      expect(() => creaPeticioReservaCicleInventari({ ...entrada, ...delta })).toThrow();
    }
    let lectures = 0;
    const proxy = new Proxy(rebut({ creada: false }), { get(t, k, r) { if (k === 'creada') { lectures++; return lectures > 1; } return Reflect.get(t, k, r); } });
    const resultat = validaRebutReservaCicleInventari(proxy, entrada);
    expect(resultat).toMatchObject({ creada: false, potIniciarComanda: false, estat: 'ja_reservada' });
    const sense = rebut(); delete sense.creada;
    Object.defineProperty(Object.prototype, 'creada', { value: true, configurable: true, enumerable: false, writable: true });
    try { expect(() => validaRebutReservaCicleInventari(sense, entrada)).toThrow(); }
    finally { delete Object.prototype.creada; }
  });
  it('conserva identitat de cicle amb separadors i límit enter segur sense col·lisions', () => {
    const a = { ...entrada, magatzemId: 'a|b', articleId: 'c' }, b = { ...entrada, magatzemId: 'a', articleId: 'b|c' };
    expect(clauReposicio(creaPeticioReservaCicleInventari(a))).not.toBe(clauReposicio(creaPeticioReservaCicleInventari(b)));
    expect(creaPeticioReservaCicleInventari({ ...entrada, quantitat: Number.MAX_SAFE_INTEGER }).quantitat).toBe(Number.MAX_SAFE_INTEGER);
    expect(clauReposicio(creaPeticioReservaCicleInventari({ ...entrada, quantitat: 99 }))).toBe(clauReposicio(entrada));
  });
});
