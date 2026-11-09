// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { adaptadorPushNatiuPerAlRegistre } from './avisosPushNatius.js';

/* Sanejament R15 (B3) · El cicle del kit amb el push natiu ENCÈS (build amb VITE_SDP_PUSH_NATIU=1);
   l'apagat es prova a avisosPushNatius.test.js («sense la bandera de build»). */
beforeEach(() => vi.stubEnv('VITE_SDP_PUSH_NATIU', '1'));
afterEach(() => vi.unstubAllEnvs());

function arnes() {
  let optin = null;
  const memoria = { llegeix: () => optin, desa: id => { optin = id; }, oblida: () => { optin = null; } };
  let registered = false;
  let rotate = null;
  let wake = null;
  let visible = true;
  const raw = {
    estat: vi.fn(async () => ({ estat: registered ? 'actiu' : 'inactiu' })),
    activa: vi.fn(async ({ desa }) => { await desa({ testimoni: 'synthetic-token-aaaaaaaaaaaaaaaaaaaaaaaa', plataforma: 'android' }); registered = true; return { estat: 'actiu' }; }),
    desactiva: vi.fn(async () => { registered = false; return { estat: 'inactiu' }; }),
    preparaCanal: vi.fn(async () => {}),
    neteja: vi.fn(async () => {}),
    escoltaRegistre: vi.fn(fn => { rotate = fn; return () => { rotate = null; }; }),
    escoltaPendent: vi.fn(fn => { wake = fn; return () => { wake = null; }; }),
    escoltaToc: vi.fn(() => () => {})
  };
  const nucli = { Capacitor: { isPluginAvailable: () => true, getPlatform: () => 'android' }, registerPlugin: vi.fn() };
  const saves = [];
  const desa = vi.fn(async d => { saves.push(d); });
  const retira = vi.fn(async () => {});
  return { memoria, raw, nucli, desa, retira, saves, wake: () => wake?.(), hide: () => { visible = false; wake?.(); }, rotate: token => rotate?.({ testimoni: token, plataforma: 'android' }), make: () => adaptadorPushNatiuPerAlRegistre(raw, { nucli, memoria, visible: () => visible }) };
}

describe('R54 consentiment i cicle del mateix compte', () => {
  test('un zero vell és rebutjat i un zero vigent conserva el genèric sense CAS del pont natiu', async () => {
    const h = arnes();
    const a = h.make();
    await a.activa({ ambit: 'a', desa: h.desa, renova: h.desa });
    const old = a.capturaLectura();
    h.wake();
    expect(await a.confirmaLectura(old)).toBe(null);
    expect(h.raw.neteja).not.toHaveBeenCalled();
    expect(await a.confirmaLectura(a.capturaLectura())).toEqual({ estat: 'pendent', motiu: 'sense-cas-natiu' });
    expect(h.raw.neteja).not.toHaveBeenCalled();
    const beforeHide = a.capturaLectura();
    h.hide();
    await a.confirmaLectura(beforeHide);
    expect(h.raw.neteja).not.toHaveBeenCalled();
  });
  test('una instància nova recupera únicament l’opt-in explícit del mateix compte sense un segon gest', async () => {
    const h = arnes();
    await h.make().activa({ ambit: 'a', desa: h.desa, renova: h.desa, retira: h.retira });
    const reopened = h.make();
    expect(await reopened.sincronitza({ actiu: true, ambit: 'a', desa: h.desa, retira: h.retira })).toEqual({ estat: 'actiu' });
    expect(h.saves.at(-1).gest).toBe(false);
  });
  test('permís concedit sense opt-in i A→B no registren silenciosament B', async () => {
    const h = arnes();
    await h.make().sincronitza({ actiu: true, ambit: 'a', desa: h.desa });
    expect(h.raw.activa).not.toHaveBeenCalled();
    const a = h.make();
    await a.activa({ ambit: 'a', desa: h.desa, renova: h.desa });
    h.raw.activa.mockClear();
    expect(await a.sincronitza({ actiu: true, ambit: 'b', desa: h.desa })).toEqual({ estat: 'inactiu' });
    expect(h.memoria.llegeix()).toBe(null);
    expect(h.raw.activa).not.toHaveBeenCalled();
  });
  test('canal preparat abans de desar i rotació amb gest:false retira l’adreça anterior', async () => {
    const h = arnes();
    const a = h.make();
    await a.activa({ ambit: 'a', desa: h.desa, renova: h.desa, retira: h.retira });
    expect(h.raw.preparaCanal.mock.invocationCallOrder[0]).toBeLessThan(h.desa.mock.invocationCallOrder[0]);
    await h.rotate('synthetic-rotated-token-bbbbbbbbbbbbbbbbbbbb');
    expect(h.saves.at(-1)).toMatchObject({ adreca: 'synthetic-rotated-token-bbbbbbbbbbbbbbbbbbbb', gest: false });
    expect(h.retira).toHaveBeenCalledWith({ plataforma: 'android', adreca: 'synthetic-token-aaaaaaaaaaaaaaaaaaaaaaaa' });
  });
  test('logout talla rotació i oblida opt-in; una neteja genèrica sense CAS natiu no esborra el pendent', async () => {
    const h = arnes();
    const a = h.make();
    await a.activa({ ambit: 'a', desa: h.desa, renova: h.desa, retira: h.retira });
    await a.neteja({ noLlegits: 3 });
    await a.neteja();
    expect(h.raw.neteja).not.toHaveBeenCalled();
    await a.neteja({ noLlegits: 0 });
    expect(h.raw.neteja).not.toHaveBeenCalled();
    await a.desactiva({ retira: h.retira });
    expect(h.raw.desactiva).toHaveBeenCalledTimes(1);
    const calls = h.saves.length;
    await h.rotate('synthetic-stale-rotation');
    expect(h.saves).toHaveLength(calls);
    expect(h.memoria.llegeix()).toBe(null);
  });
  test('una activació que acaba després de logout no restaura consentiment', async () => {
    const h = arnes();
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const a = h.make();
    const activation = a.activa({ ambit: 'a', desa: async d => { await pending; await h.desa(d); }, renova: h.desa, retira: h.retira });
    await vi.waitFor(() => expect(h.raw.activa).toHaveBeenCalled());
    const out = a.desactiva({ retira: h.retira });
    finish();
    await Promise.all([activation, out]);
    expect(h.memoria.llegeix()).toBe(null);
    expect((await a.estat()).estat).not.toBe('actiu');
  });
  test('una fallada transitòria en recuperar A conserva el seu opt-in i permet reintent sense gest', async () => {
    const h = arnes();
    h.memoria.desa('a');
    h.raw.activa.mockResolvedValueOnce({ estat: 'error' });
    const a = h.make();
    expect(await a.sincronitza({ actiu: true, ambit: 'a', desa: h.desa })).toEqual({ estat: 'error' });
    expect(h.memoria.llegeix()).toBe('a');
    expect(await a.sincronitza({ actiu: true, ambit: 'a', desa: h.desa })).toEqual({ estat: 'actiu' });
    expect(h.saves.at(-1).gest).toBe(false);
  });
  test('dues recuperacions concurrents del mateix compte compartixen un sol registre', async () => {
    const h = arnes();
    h.memoria.desa('a');
    const a = h.make();
    await Promise.all([a.sincronitza({ actiu: true, ambit: 'a', desa: h.desa }), a.sincronitza({ actiu: true, ambit: 'a', desa: h.desa })]);
    expect(h.raw.activa).toHaveBeenCalledTimes(1);
    expect((await a.estat()).estat).toBe('actiu');
  });
  test('B espera el registre obsolet d’A abans de registrar-se: una baixa tardana no apaga B', async () => {
    const h = arnes();
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const a = h.make();
    const first = a.activa({ ambit: 'a', desa: async d => { await pending; await h.desa(d); }, retira: h.retira });
    await vi.waitFor(() => expect(h.raw.activa).toHaveBeenCalledTimes(1));
    const next = a.activa({ ambit: 'b', desa: h.desa, renova: h.desa, retira: h.retira });
    finish();
    await first;
    expect(await next).toEqual({ estat: 'actiu' });
    expect(h.memoria.llegeix()).toBe('b');
    expect((await a.estat()).estat).toBe('actiu');
  });
  test.each(['desactiva', 'oblida'])('%s cancel·la també B en cua darrere d’una activació A pendent, abans de qualsevol permís o registre B', async baixa => {
    const h = arnes();
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const a = h.make();
    const first = a.activa({ ambit: 'a', desa: async d => { await pending; await h.desa(d); }, retira: h.retira });
    await vi.waitFor(() => expect(h.raw.activa).toHaveBeenCalledTimes(1));
    const saveB = vi.fn(async d => h.desa(d));
    const next = a.activa({ ambit: 'b', desa: saveB, retira: h.retira });
    const out = baixa === 'desactiva' ? a.desactiva({ retira: h.retira }) : a.oblida();
    finish();
    await Promise.all([first, next, out]);
    expect(h.raw.activa).toHaveBeenCalledTimes(1);
    expect(h.raw.preparaCanal).toHaveBeenCalledTimes(1);
    expect(saveB).not.toHaveBeenCalled();
    expect(h.memoria.llegeix()).toBe(null);
    expect((await a.estat()).estat).not.toBe('actiu');
  });
});
