// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaAvisosPushNatius } from './avisosPushNatius.js';

const pendent = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
const pontIos = () => {
  const listeners = new Map();
  const emet = token => { for (const fn of [...(listeners.get('registration') || [])]) fn({ value: token }); };
  let ordre = 0;
  const push = {
    checkPermissions: vi.fn(async () => ({ receive: 'granted' })),
    addListener: vi.fn(async (nom, fn) => {
      if (!listeners.has(nom)) listeners.set(nom, new Set());
      listeners.get(nom).add(fn);
      return { remove: vi.fn(async () => listeners.get(nom).delete(fn)) };
    }),
    register: vi.fn(async () => emet(`TEST_ONLY_R322_TOKEN_${++ordre}`)),
    unregister: vi.fn(async () => {}),
    removeAllDeliveredNotifications: vi.fn(async () => {})
  };
  const nucli = {
    Capacitor: { isPluginAvailable: () => true, getPlatform: () => 'ios' },
    registerPlugin: () => push
  };
  return { nucli, push, emet, listeners };
};
beforeEach(() => vi.stubEnv('VITE_SDP_PUSH_NATIU', '1'));
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

test('token iOS després de baixa: una segona unregister neteja el registre tardà sense desa ni actiu', async () => {
  const h = pontIos();
  h.push.register.mockResolvedValue(undefined);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 5000 });
  const alta = avisos.activa();
  await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  expect(await alta).toEqual({ estat: 'inactiu' });
  expect(h.push.unregister).toHaveBeenCalledTimes(1);
  h.emet('TEST_ONLY_R322_TOKEN_TARDA');
  await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
  expect(desa).not.toHaveBeenCalled();
  expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
  expect(h.listeners.get('registration').size).toBe(0);
});

for (const falla of [false, true]) test(`desa A ${falla ? 'rebutjat' : 'resolt'} després de baixa no conserva testimoni ni actiu`, async () => {
  const h = pontIos(), desat = pendent();
  const desa = vi.fn(() => desat.promise);
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa });
  const alta = avisos.activa();
  await vi.waitFor(() => expect(desa).toHaveBeenCalledTimes(1));
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  if (falla) desat.reject(new Error('servidor tardà')); else desat.resolve();
  expect(await alta).toEqual({ estat: 'inactiu' });
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
  const retira = vi.fn(async () => {});
  await avisos.desactiva({ retira });
  expect(retira).not.toHaveBeenCalled();
});

for (const falla of [false, true]) test(`A activa → baixa → B activa: desa A ${falla ? 'rebutjat' : 'resolt'} no desfà B`, async () => {
  const h = pontIos(), desatA = pendent();
  const desaA = vi.fn(() => desatA.promise), desaB = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: desaA });
  const altaA = avisos.activa();
  await vi.waitFor(() => expect(desaA).toHaveBeenCalledTimes(1));
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'actiu' });
  if (falla) desatA.reject(new Error('A antic')); else desatA.resolve();
  expect(await altaA).toEqual({ estat: 'inactiu' });
  expect(h.push.unregister).toHaveBeenCalledTimes(1);
  expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  const retira = vi.fn(async () => {});
  await avisos.desactiva({ retira });
  expect(retira).toHaveBeenCalledWith({ testimoni: 'TEST_ONLY_R322_TOKEN_2', plataforma: 'ios' });
});

test('unregister del token tardà ocupa baixaPont: B no arranca fins al completion real', async () => {
  vi.useFakeTimers();
  const h = pontIos(), neteja = pendent();
  h.push.register.mockResolvedValueOnce(undefined);
  h.push.unregister.mockResolvedValueOnce(undefined).mockReturnValueOnce(neteja.promise);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 100, limitBaixaMs: 10 });
  const altaA = avisos.activa();
  await vi.advanceTimersByTimeAsync(0);
  expect(h.push.register).toHaveBeenCalledTimes(1);
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  expect(await altaA).toEqual({ estat: 'inactiu' });
  h.emet('TEST_ONLY_R322_TOKEN_TARDA');
  await vi.advanceTimersByTimeAsync(10);
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  expect(await avisos.activa()).toEqual({ estat: 'error' });
  expect(desa).not.toHaveBeenCalled();
  neteja.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  expect(h.push.register).toHaveBeenCalledTimes(2);
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  await avisos.desactiva();
});

test('token A tardà després de B activa no pot executar una baixa nativa contra B', async () => {
  const h = pontIos();
  h.push.register.mockResolvedValueOnce(undefined);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 5000 });
  const altaA = avisos.activa();
  await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
  await avisos.desactiva();
  expect(await altaA).toEqual({ estat: 'inactiu' });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  h.emet('TEST_ONLY_R322_TOKEN_ANTIC');
  await Promise.resolve();
  expect(h.push.unregister).toHaveBeenCalledTimes(1);
  expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  await avisos.desactiva();
});

test('el receptor iOS cancel·lat es lleva al topall si mai arriba token tardà', async () => {
  vi.useFakeTimers();
  const h = pontIos();
  h.push.register.mockResolvedValue(undefined);
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(), topallMs: 100 });
  const alta = avisos.activa();
  await vi.advanceTimersByTimeAsync(0);
  await avisos.desactiva();
  expect(await alta).toEqual({ estat: 'inactiu' });
  expect(h.listeners.get('registration').size).toBe(1);
  await vi.advanceTimersByTimeAsync(100);
  expect(h.listeners.get('registration').size).toBe(0);
  expect(h.listeners.get('registrationError').size).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});

test('unregister tardà rebutjat conserva el deure de baixa per al reintent, sempre inactiu', async () => {
  const h = pontIos();
  h.push.register.mockResolvedValue(undefined);
  h.push.unregister.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('pont temporalment caigut'));
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(), topallMs: 5000 });
  const alta = avisos.activa();
  await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
  await avisos.desactiva();
  expect(await alta).toEqual({ estat: 'inactiu' });
  h.emet('TEST_ONLY_R322_TOKEN_TARDA');
  await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
  expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  expect(h.push.unregister).toHaveBeenCalledTimes(3);
});

test('permís antic rebutjat després de baixa no inventa cap registre ni crida unregister', async () => {
  const h = pontIos(), permis = pendent();
  h.push.checkPermissions.mockReturnValueOnce(permis.promise);
  const desa = vi.fn();
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa });
  const alta = avisos.activa();
  expect(h.push.checkPermissions).toHaveBeenCalledTimes(1);
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  permis.reject(new Error('permís antic'));
  expect(await alta).toEqual({ estat: 'inactiu' });
  expect(h.push.register).not.toHaveBeenCalled();
  expect(h.push.unregister).not.toHaveBeenCalled();
  expect(desa).not.toHaveBeenCalled();
});

for (const durantPermisB of [false, true]) test(`baixa A i alta B denegada no adopten token A tardà (${durantPermisB ? 'abans' : 'després'} de denegar)`, async () => {
  const h = pontIos(), permisB = pendent();
  h.push.register.mockResolvedValueOnce(undefined);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 5000 });
  const altaA = avisos.activa();
  await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
  await avisos.desactiva();
  expect(await altaA).toEqual({ estat: 'inactiu' });
  h.push.checkPermissions.mockReturnValueOnce(permisB.promise);
  const altaB = avisos.activa();
  if (durantPermisB) h.emet('TEST_ONLY_R322_A_AFTER_DISABLE');
  permisB.resolve({ receive: 'denied' });
  expect(await altaB).toEqual({ estat: 'denegat' });
  if (!durantPermisB) h.emet('TEST_ONLY_R322_A_AFTER_DISABLE');
  await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
  expect(desa).not.toHaveBeenCalled();
  expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
});

for (const mode of ['sense-servidor', 'check-rebutjat', 'request-rebutjat', 'desa-rebutjat']) {
  for (const durantPermisB of [true, false]) test(`B ${mode} no pot adoptar un token A obsolet (${durantPermisB ? 'mentre B espera' : 'després de B'})`, async () => {
    const h = pontIos(), permisB = pendent();
    h.push.register.mockResolvedValueOnce(undefined);
    h.push.requestPermissions = vi.fn(async () => { throw new Error('permís B rebutjat'); });
    const desaA = vi.fn(async () => {});
    const desaB = vi.fn(async () => { throw new Error('desat B rebutjat'); });
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, topallMs: 5000 });
    const altaA = avisos.activa({ desa: desaA });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    await avisos.desactiva();
    expect(await altaA).toEqual({ estat: 'inactiu' });
    h.push.checkPermissions.mockReturnValueOnce(permisB.promise);
    const altaB = avisos.activa(mode === 'sense-servidor' ? {} : { desa: desaB });
    if (durantPermisB) h.emet('TEST_ONLY_R322_A_WHILE_B_FAILS');
    if (mode === 'check-rebutjat') permisB.reject(new Error('check B rebutjat'));
    else permisB.resolve({ receive: mode === 'request-rebutjat' ? 'prompt' : 'granted' });
    expect(await altaB).toEqual({ estat: mode === 'sense-servidor' ? 'sense-servidor' : 'error' });
    if (!durantPermisB) h.emet('TEST_ONLY_R322_A_AFTER_B_FAILS');
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    expect(desaA).not.toHaveBeenCalled();
    expect(h.push.register).toHaveBeenCalledTimes(mode === 'desa-rebutjat' ? 2 : 1);
    expect(desaB).toHaveBeenCalledTimes(mode === 'desa-rebutjat' ? 1 : 0);
    expect(h.push.requestPermissions).toHaveBeenCalledTimes(mode === 'request-rebutjat' ? 1 : 0);
    expect((await avisos.estat()).estat).not.toBe('actiu');
  });
}

test('B sense token expira i drena el cleanup A que arribà mentre B comprovava el permís', async () => {
  vi.useFakeTimers();
  const h = pontIos(), permisB = pendent();
  h.push.register.mockResolvedValue(undefined);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 100 });
  const altaA = avisos.activa();
  await vi.advanceTimersByTimeAsync(0);
  expect(h.push.register).toHaveBeenCalledTimes(1);
  await avisos.desactiva();
  expect(await altaA).toEqual({ estat: 'inactiu' });
  h.push.checkPermissions.mockReturnValueOnce(permisB.promise);
  const altaB = avisos.activa();
  h.emet('TEST_ONLY_R322_A_BEFORE_B_TIMEOUT');
  permisB.resolve({ receive: 'granted' });
  await vi.advanceTimersByTimeAsync(100);
  expect(await altaB).toEqual({ estat: 'error' });
  expect(h.push.register).toHaveBeenCalledTimes(2);
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  expect(desa).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('baixa B durant el permís drena també el token A que estava diferit darrere de B', async () => {
  const h = pontIos(), permisB = pendent();
  h.push.register.mockResolvedValueOnce(undefined);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 5000 });
  const altaA = avisos.activa();
  await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
  await avisos.desactiva();
  expect(await altaA).toEqual({ estat: 'inactiu' });
  h.push.checkPermissions.mockReturnValueOnce(permisB.promise);
  const altaB = avisos.activa();
  h.emet('TEST_ONLY_R322_A_DURING_B_PERMISSION');
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  permisB.resolve({ receive: 'granted' });
  expect(await altaB).toEqual({ estat: 'inactiu' });
  expect(h.push.register).toHaveBeenCalledTimes(1);
  expect(desa).not.toHaveBeenCalled();
});

test('cleanup A drenat després de denegar B bloqueja C fins al completion natiu real', async () => {
  vi.useFakeTimers();
  const h = pontIos(), permisB = pendent(), baixaTarda = pendent();
  h.push.register.mockResolvedValueOnce(undefined);
  h.push.unregister.mockResolvedValueOnce(undefined).mockReturnValueOnce(baixaTarda.promise);
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa, topallMs: 100, limitBaixaMs: 10 });
  const altaA = avisos.activa();
  await vi.advanceTimersByTimeAsync(0);
  await avisos.desactiva();
  expect(await altaA).toEqual({ estat: 'inactiu' });
  h.push.checkPermissions.mockReturnValueOnce(permisB.promise);
  const altaB = avisos.activa();
  h.emet('TEST_ONLY_R322_A_WHILE_B_DENIED');
  permisB.resolve({ receive: 'denied' });
  await vi.advanceTimersByTimeAsync(10);
  expect(await altaB).toEqual({ estat: 'denegat' });
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  expect(await avisos.activa()).toEqual({ estat: 'error' });
  expect(h.push.register).toHaveBeenCalledTimes(1);
  baixaTarda.resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  expect(h.push.register).toHaveBeenCalledTimes(2);
  expect(h.push.unregister).toHaveBeenCalledTimes(2);
  expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  await avisos.desactiva();
});
