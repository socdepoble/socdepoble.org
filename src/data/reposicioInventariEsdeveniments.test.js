import { describe, it, expect } from 'vitest';
import { clauReposicio } from './inventari/reposicioAntiDobleComanda.js';
import { reconciliaInventariEsdeveniments, planificaReposicioInventari } from './reposicioInventariEsdeveniments.js';
const scope = { tenantId: 'poble', magatzemId: 'rebost', articleId: 'cigrons' };
const ara = '2026-11-19T12:00:00.000Z';
const base = { ...scope, cicle: '2026-11-19', ara, demandaDiaria: '2.5', terminiDies: 3, estocSeguretat: 2, lot: 6 };
const event = (id, tipus, quantitat, extra = {}) => ({ ...scope, id, instant: '2026-11-18T12:00:00.000Z', tipus, quantitat, ...extra });
const stock = [event('a', 'entrada', 5, { lotId: 'sac', caducaEl: '2027-01-01' })];
const resum = esdeveniments => reconciliaInventariEsdeveniments({ ...scope, ara, esdeveniments });
const ordre = (id, versio, estat, extra = {}) => event(id, 'comanda', 12, { ordreId: 'ordre-a', cicle: base.cicle, versio, estat, clauIdempotencia: clauReposicio(base), ...extra });
describe('R32.16 inventari convergent i anti-doble-comanda', () => {
  it('compon el motor exacte existent, compta reserves i trànsit sense duplicar', () => {
    const r = planificaReposicioInventari({ ...base, esdeveniments: stock });
    expect(r.inventari).toMatchObject({ estocActual: 5, estocDisponible: 5, reservat: 0, enComanda: 0, bloquejat: false });
    expect(r.reposicio).toMatchObject({ puntComanda: 10, quantitatComanda: 12, calComandar: true });
    const pending = planificaReposicioInventari({ ...base, esdeveniments: [...stock, ordre('o1', 1, 'pendent')] });
    expect(pending.inventari.enComanda).toBe(12); expect(pending.reposicio.calComandar).toBe(false);
    expect(pending.reposicio.motiu).toBe('comanda_ja_registrada');
  });
  it('id immutable: repetició idèntica es deduplica, col·lisió divergent falla tancat', () => {
    const r = resum([...stock, ...stock]); expect(r.estocActual).toBe(5); expect(r.duplicatsOmesos).toBe(1);
    expect(() => resum([...stock, { ...stock[0], quantitat: 6 }])).toThrow(/Col·lisió/);
    expect(() => resum([...stock, { ...stock[0], id: 'altra', tenantId: 'altre' }])).toThrow(/àmbit/);
  });
  it('revisions desordenades convergeixen: cancel·lada allibera, rebuda no afegeix estoc fictici', () => {
    const inicial = ordre('o1', 1, 'pendent'), enviada = ordre('o2', 2, 'enviada'), cancel = ordre('o3', 3, 'cancel_lada');
    const events = [...stock, inicial, enviada, cancel];
    expect(resum(events)).toEqual(resum([...events].reverse())); expect(resum(events).enComanda).toBe(0);
    expect(planificaReposicioInventari({ ...base, esdeveniments: events }).reposicio.calComandar).toBe(true);
    const received = resum([...stock, inicial, ordre('o2', 2, 'rebuda')]);
    expect(received.estocActual).toBe(5); expect(received.enComanda).toBe(0);
    expect(planificaReposicioInventari({ ...base, esdeveniments: [...stock, inicial, ordre('o2', 2, 'rebuda')] }).reposicio.calComandar).toBe(false);
  });
  it('caducitat d’ordre no acredita cancel·lació remota ni permet una doble compra', () => {
    const caducaEn = '2026-11-19T11:00:00.000Z';
    const e1 = ordre('o1', 1, 'pendent', { caducaEn });
    const r = planificaReposicioInventari({ ...base, esdeveniments: [...stock, e1] });
    expect(r.inventari.comandes[0].caducada).toBe(true); expect(r.inventari.enComanda).toBe(12);
    expect(r.inventari.alertes).toContainEqual({ codi: 'comanda_caducada_sense_cancel_lacio', ordreId: 'ordre-a' });
    expect(r.reposicio).toMatchObject({ calComandar: false, motiu: 'inventari_pendent_revisio' });
    const e2 = ordre('o2', 2, 'cancel_lada', { caducaEn, instant: '2026-11-19T11:01:00.000Z' });
    expect(planificaReposicioInventari({ ...base, esdeveniments: [...stock, e2, e1] }).reposicio.calComandar).toBe(true);
  });
  it('lots caducats es declaren i s’exclouen; data de caducitat és inclusiva', () => {
    const events = [event('a', 'entrada', 30, { lotId: 'ahir', caducaEl: '2026-11-18' }), event('b', 'entrada', 5, { lotId: 'hui', caducaEl: '2026-11-19' })];
    const r = planificaReposicioInventari({ ...base, esdeveniments: events });
    expect(r.inventari).toMatchObject({ estocActual: 35, estocDisponible: 5, estocCaducat: 30, bloquejat: false });
    expect(r.inventari.alertes).toContainEqual({ codi: 'lot_caducat', lotId: 'ahir' }); expect(r.reposicio.calComandar).toBe(true);
    expect(() => resum([...events, event('c', 'entrada', 1, { lotId: 'hui', caducaEl: '2026-11-20' })])).toThrow(/Caducitat/);
    expect(() => resum([event('a', 'entrada', 1, { lotId: 'x', caducaEl: '2026-02-30' })])).toThrow();
  });
  it('stock/reserves negatius i dos ordres actives de la mateixa clau bloquegen', () => {
    const negatiu = [event('a', 'entrada', 1, { lotId: 'sac' }), event('b', 'eixida', 2, { lotId: 'sac' })];
    const r = planificaReposicioInventari({ ...base, esdeveniments: negatiu });
    expect(r.inventari.estocActual).toBe(-1); expect(r.inventari.estocNegatiuHistoric).toBe(true); expect(r.reposicio.calComandar).toBe(false);
    expect(resum([event('a', 'allibera', 2)]).alertes).toContainEqual({ codi: 'reserva_negativa' });
    const dobles = [...stock, ordre('o1', 1, 'pendent'), ordre('o2', 1, 'pendent', { ordreId: 'ordre-b' })];
    expect(resum(dobles).alertes).toContainEqual({ codi: 'doble_comanda', clauIdempotencia: clauReposicio(base) });
    expect(planificaReposicioInventari({ ...base, esdeveniments: dobles }).reposicio.calComandar).toBe(false);
  });
  it('mutants: històries incompletes/duplicades, quantitat mutable, terminals reoberts i futurs', () => {
    const inicial = ordre('o1', 1, 'pendent');
    const mutants = [[ordre('o2', 2, 'enviada')], [ordre('o1', 1, 'rebuda')], [inicial, ordre('o2', 1, 'pendent')], [inicial, ordre('o2', 2, 'enviada', { quantitat: 13 })], [inicial, ordre('o2', 2, 'enviada', { clauIdempotencia: 'altra' })], [inicial, ordre('o2', 2, 'rebuda'), ordre('o3', 3, 'pendent')], [event('futur', 'reserva', 1, { instant: '2027-01-01T00:00:00.000Z' })]];
    for (const events of mutants) expect(() => resum(events)).toThrow();
    for (const quantitat of [0, -1, -0, 0.1, NaN, Number.MAX_SAFE_INTEGER + 1, '1', {}]) expect(() => resum([event('x', 'entrada', quantitat, { lotId: 'sac' })])).toThrow();
    expect(() => resum([event('x', 'entrada', 1, { lotId: 'sac', estat: 'pendent' })])).toThrow();
    expect(() => resum([event('x', 'eixida', 1, { lotId: 'sac', caducaEl: '2027-01-01' })])).toThrow();
    expect(() => resum([event('x', 'entrada', Number.MAX_SAFE_INTEGER, { lotId: 'sac' }), event('y', 'entrada', 1, { lotId: 'sac' })])).toThrow(/rang/);
  });
  it('getters i llistes disperses fallen abans de coaccionar cap dada', () => {
    let crides = 0; const e = { ...stock[0] };
    Object.defineProperty(e, 'quantitat', { get() { crides++; return 1; }, enumerable: true });
    expect(() => resum([e])).toThrow(); expect(crides).toBe(0); expect(() => resum(new Array(1))).toThrow();
  });
  it('una ordre rebuda consumix la clau encara que una altra ordre pretenga reobrir-la', () => {
    const events = [...stock, ordre('o1', 1, 'pendent'), ordre('o2', 2, 'rebuda'), ordre('o3', 1, 'pendent', { ordreId: 'ordre-b' })];
    expect(resum(events).alertes).toContainEqual({ codi: 'doble_comanda', clauIdempotencia: clauReposicio(base) });
    expect(planificaReposicioInventari({ ...base, esdeveniments: events }).reposicio.motiu).toBe('inventari_pendent_revisio');
  });
  it('les claus de comanda es deriven de l’àmbit real i del cicle, mai d’un camp cru', () => {
    for (const extra of [{ clauIdempotencia: 'inventada' }, { cicle: 'altre' }, { cicle: undefined }]) expect(() => resum([ordre('o1', 1, 'pendent', extra)])).toThrow();
    const events = []; let crides = 0;
    events[Symbol.iterator] = function* () { crides++; yield stock[0]; };
    expect(() => resum(events)).toThrow(); expect(crides).toBe(0);
  });
  it('propietats: 300 ledgers permutats contra oracle enter i sense mutar entrades', () => {
    let seed = 2843216;
    const rand = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
    for (let cas = 0; cas < 300; cas++) {
      const events = [], oracle = new Map();
      for (let i = 0; i < 30; i++) {
        const lotId = String(rand(5)), q = 1 + rand(50), tipus = rand(3) ? 'entrada' : 'eixida';
        events.push(event(String(i), tipus, q, { lotId, ...(tipus === 'entrada' ? { caducaEl: '2027-01-01' } : {}) }));
        oracle.set(lotId, (oracle.get(lotId) ?? 0n) + BigInt(q) * (tipus === 'entrada' ? 1n : -1n));
      }
      const permutats = [...events];
      for (let i = permutats.length - 1; i > 0; i--) { const j = rand(i + 1); [permutats[i], permutats[j]] = [permutats[j], permutats[i]]; }
      const before = JSON.stringify(events), a = resum(events), b = resum(permutats);
      expect(b).toEqual(a); expect(a.estocActual).toBe(Number([...oracle.values()].reduce((x, y) => x + y, 0n)));
      expect(JSON.stringify(events)).toBe(before);
    }
  });
});
