// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaAvisosPushNatius, adaptadorPushNatiuPerAlRegistre, motiuPushNatiu, TOPALL_BAIXA_NATIVA_MS, CONNECTOR_CICLE_PUSH_ANDROID } from './avisosPushNatius.js';
import { LIMIT_BAIXA_PUSH_MS } from '../config/avisosPushXat.js';

const pendent = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
const token = 'TEST_ONLY_R31_SYNTHETIC_FCM_TOKEN';
const connector = ({ plataforma = 'android' } = {}) => {
  const listeners = new Map();
  const push = {
    createChannel: vi.fn(async () => {}),
    checkPermissions: vi.fn(async () => ({ receive: 'granted' })),
    addListener: vi.fn(async (nom, fn) => {
      listeners.set(nom, fn);
      return { remove: vi.fn(async () => listeners.delete(nom)) };
    }),
    register: vi.fn(async () => { listeners.get('registration')?.({ value: token }); return { value: token }; }),
    unregister: vi.fn(async () => {}),
    removeAllDeliveredNotifications: vi.fn(async () => {})
  };
  const nucli = {
    Capacitor: { isPluginAvailable: () => true, getPlatform: () => plataforma },
    registerPlugin: () => push
  };
  return { push, nucli, listeners };
};
beforeEach(() => vi.stubEnv('VITE_SDP_PUSH_NATIU', '1'));
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

test('el topall natiu respecta el límit de l’eixida del consumidor', () => {
  expect(TOPALL_BAIXA_NATIVA_MS).toBe(LIMIT_BAIXA_PUSH_MS);
});

test('no registra abans que el pont haja instal·lat els dos oients', async () => {
  const { push, nucli, listeners } = connector({ plataforma: 'ios' });
  const ready = [pendent(), pendent()];
  let index = 0;
  push.addListener.mockImplementation((nom, fn) => ready[index++].promise.then(() => {
    listeners.set(nom, fn);
    return { remove: async () => listeners.delete(nom) };
  }));
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli, desa });
  const activa = avisos.activa();
  await vi.waitFor(() => expect(push.addListener).toHaveBeenCalledTimes(2));
  expect(push.register).not.toHaveBeenCalled();
  ready[0].resolve();
  await Promise.resolve();
  expect(push.register).not.toHaveBeenCalled();
  ready[1].resolve();
  expect(await activa).toEqual({ estat: 'actiu' });
  expect(desa).toHaveBeenCalledWith({ testimoni: token, plataforma: 'ios' });
  await avisos.desactiva();
});

test('un oient rebutjat no deixa arrancar un registre sense receptor', async () => {
  const { push, nucli } = connector({ plataforma: 'ios' });
  push.addListener.mockRejectedValue(new Error('pont no disponible'));
  expect(await creaAvisosPushNatius({ nucli, desa: vi.fn() }).activa()).toEqual({ estat: 'error' });
  expect(push.register).not.toHaveBeenCalled();
});

test('timeout mentre el pont prepara oients: ni registre tardà ni listeners oblidats', async () => {
  vi.useFakeTimers();
  const { push, nucli } = connector({ plataforma: 'ios' });
  const ready = pendent();
  const remove = vi.fn(async () => {});
  push.addListener.mockImplementation(() => ready.promise.then(() => ({ remove })));
  const activa = creaAvisosPushNatius({ nucli, desa: vi.fn(), topallMs: 10 }).activa();
  await vi.advanceTimersByTimeAsync(10);
  expect(await activa).toEqual({ estat: 'error' });
  ready.resolve();
  await vi.runAllTimersAsync();
  expect(push.register).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledTimes(2);
});

test('la retirada remota no espera unregister ni la neteja nativa penjats', async () => {
  const { push, nucli } = connector();
  const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  const unregister = pendent(), clean = pendent();
  push.unregister.mockReturnValue(unregister.promise);
  push.removeAllDeliveredNotifications.mockReturnValue(clean.promise);
  const retira = vi.fn(async () => {});
  const baixa = avisos.desactiva({ retira });
  await vi.waitFor(() => expect(retira).toHaveBeenCalledWith({ testimoni: token, plataforma: 'android' }));
  unregister.resolve(); clean.resolve();
  expect(await baixa).toEqual({ estat: 'inactiu' });
});

test('logout mentre els oients es preparen cancel·la el registre i lleva els handles tardans', async () => {
  const { push, nucli } = connector({ plataforma: 'ios' });
  const ready = pendent();
  const remove = vi.fn(async () => {});
  push.addListener.mockImplementation(() => ready.promise.then(() => ({ remove })));
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli, desa });
  const activa = avisos.activa();
  await vi.waitFor(() => expect(push.addListener).toHaveBeenCalledTimes(2));
  expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
  expect(await activa).toEqual({ estat: 'inactiu' });
  ready.resolve();
  await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
  expect(push.register).not.toHaveBeenCalled();
  expect(desa).not.toHaveBeenCalled();
});

test('baixa fitada: un unregister tardà no pot fer arrancar B abans de la confirmació del pont', async () => {
  vi.useFakeTimers();
  const { push, nucli } = connector();
  const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}), limitBaixaMs: 10 });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  const unregister = pendent();
  push.unregister.mockReturnValue(unregister.promise);
  const retira = vi.fn(async () => {});
  const baixa = avisos.desactiva({ retira });
  await vi.advanceTimersByTimeAsync(10);
  expect(await baixa).toEqual({ estat: 'error' });
  expect(retira).toHaveBeenCalledTimes(1);
  const savesB = vi.fn(async () => {});
  expect(await avisos.activa({ desa: savesB })).toEqual({ estat: 'error' });
  expect(savesB).not.toHaveBeenCalled();
  unregister.resolve();
  await vi.runAllTimersAsync();
  expect(await avisos.activa({ desa: savesB })).toEqual({ estat: 'actiu' });
  expect(savesB).toHaveBeenCalledTimes(1);
  await avisos.desactiva();
});

test('consumidor logout real: la baixa acaba dins del límit i retira A amb el pont penjat', async () => {
  vi.useFakeTimers(); vi.resetModules();
  await import('../config/motorAvisosPushXat.js');
  const registre = await import('../config/avisosPushXat.js');
  const { push, nucli } = connector();
  const raw = creaAvisosPushNatius({ nucli });
  let optin = null;
  const memoria = { llegeix: () => optin, desa: a => { optin = a; }, oblida: () => { optin = null; } };
  registre.registraAvisosPush(adaptadorPushNatiuPerAlRegistre(raw, { nucli, memoria }));
  const retira = vi.fn(async () => {});
  registre.fixaServidorAvisosPush({ ambit: 'r31-a', desa: vi.fn(async () => {}), retira });
  expect(await registre.activaAvisosPush()).toEqual({ estat: 'actiu' });
  const pending = pendent();
  push.unregister.mockReturnValue(pending.promise);
  const baixa = registre.baixaAvisosPushEnEixir();
  await vi.advanceTimersByTimeAsync(registre.LIMIT_BAIXA_PUSH_MS);
  await baixa;
  expect(retira).toHaveBeenCalledWith({ plataforma: 'android', adreca: token });
  expect(registre.instantaniaAvisosPush().eixint).toBe(true);
  expect(registre.instantaniaAvisosPush().estat).not.toBe('actiu');
  expect(optin).toBe(null);
  pending.resolve();
  await vi.runAllTimersAsync();
});

test('la retirada tardana d’A no oblida el mateix token que B acaba de registrar', async () => {
  vi.useFakeTimers();
  const { nucli } = connector();
  const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}), limitBaixaMs: 10 });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  const retireA = pendent();
  const baixaA = avisos.desactiva({ retira: () => retireA.promise });
  await vi.advanceTimersByTimeAsync(10);
  expect(await baixaA).toEqual({ estat: 'inactiu' });
  expect(await avisos.activa({ desa: vi.fn(async () => {}) })).toEqual({ estat: 'actiu' });
  retireA.resolve();
  await vi.runAllTimersAsync();
  const retireB = vi.fn(async () => {});
  expect(await avisos.desactiva({ retira: retireB })).toEqual({ estat: 'inactiu' });
  expect(retireB).toHaveBeenCalledWith({ plataforma: 'android', testimoni: token });
});

// Doble amb dos ponts diferents: el connector oficial no promet completion
// SDK; només el plugin local retorna les Tasks reals. El Java de producció
// es compila i executa per separat a r31-push-android-task.test.mjs.
const androidAmbTasks = () => {
  const h = connector();
  const cicle = {
    register: vi.fn(async () => ({ value: token })),
    unregister: vi.fn(async () => {})
  };
  h.nucli.registerPlugin = vi.fn(nom => nom === CONNECTOR_CICLE_PUSH_ANDROID ? cicle : h.push);
  return { ...h, cicle };
};

test('APK Android antic sense pont Task: falla tancat, sense cridar register/unregister del SDK vell', async () => {
  const h = androidAmbTasks();
  h.nucli.Capacitor.isPluginAvailable = nom => nom !== CONNECTOR_CICLE_PUSH_ANDROID;
  const desa = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa });
  expect(motiuPushNatiu({ nucli: h.nucli })).toBe('sense-connector');
  expect(await avisos.estat()).toEqual({ estat: 'sense-connector' });
  expect(await avisos.activa()).toEqual({ estat: 'sense-connector' });
  expect(await avisos.desactiva({ ambOptIn: true })).toEqual({ estat: 'error' });
  expect(h.push.register).not.toHaveBeenCalled();
  expect(h.push.unregister).not.toHaveBeenCalled();
  expect(desa).not.toHaveBeenCalled();
});

test('Android SDK8.1.3: el fals ACK oficial no allibera B abans de deleteToken real', async () => {
  vi.useFakeTimers();
  const h = androidAmbTasks();
  let tokenViu = false;
  h.cicle.register.mockImplementation(async () => { tokenViu = true; return { value: token }; });
  const esborrat = pendent();
  h.cicle.unregister.mockImplementation(() => esborrat.promise.then(() => { tokenViu = false; }));
  // Contracte real del SDK oficial: resol immediatament i perd la Task.
  let esborraVell;
  h.push.unregister.mockImplementation(async () => { esborraVell = () => { tokenViu = false; }; });
  const desaA = vi.fn(async () => {}), desaB = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: desaA, limitBaixaMs: 10 });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  const retira = vi.fn(async () => {});
  const baixa = avisos.desactiva({ retira });
  await vi.advanceTimersByTimeAsync(10);
  expect(await baixa).toEqual({ estat: 'error' });
  expect(retira).toHaveBeenCalledTimes(1);
  expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'error' });
  expect(desaB).not.toHaveBeenCalled();
  expect(h.cicle.register).toHaveBeenCalledTimes(1);
  expect(h.push.register).not.toHaveBeenCalled();
  expect(h.push.unregister).not.toHaveBeenCalled();
  expect(esborraVell).toBeUndefined();
  esborrat.resolve();
  await vi.runAllTimersAsync();
  expect(tokenViu).toBe(false);
  expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'actiu' });
  expect(tokenViu).toBe(true);
  expect(desaB).toHaveBeenCalledTimes(1);
  expect(await avisos.estat()).toEqual({ estat: 'actiu' });
});

test('Task de baixa rebutjada: el reintent pendent continua bloquejant B fins a completion', async () => {
  vi.useFakeTimers();
  const h = androidAmbTasks();
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), limitBaixaMs: 10 });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  h.cicle.unregister.mockRejectedValueOnce(new Error('Task fallida'));
  expect(await avisos.desactiva()).toEqual({ estat: 'error' });
  const retry = pendent();
  h.cicle.unregister.mockReturnValueOnce(retry.promise);
  const baixa = avisos.desactiva();
  await vi.advanceTimersByTimeAsync(10);
  expect(await baixa).toEqual({ estat: 'error' });
  expect(await avisos.activa()).toEqual({ estat: 'error' });
  expect(h.cicle.register).toHaveBeenCalledTimes(1);
  retry.resolve();
  await vi.runAllTimersAsync();
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
});

test('timeout de getToken no acaba la Task: logout espera alta antiga i baixa abans de B', async () => {
  vi.useFakeTimers();
  const h = androidAmbTasks();
  const get = pendent(), del = pendent();
  h.cicle.register.mockReturnValueOnce(get.promise);
  h.cicle.unregister.mockImplementationOnce(() => get.promise.then(() => del.promise));
  const desaA = vi.fn(async () => {}), desaB = vi.fn(async () => {});
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: desaA, topallMs: 10, limitBaixaMs: 10 });
  const alta = avisos.activa();
  await vi.advanceTimersByTimeAsync(10);
  expect(await alta).toEqual({ estat: 'error' });
  const baixa = avisos.desactiva();
  await vi.advanceTimersByTimeAsync(10);
  expect(await baixa).toEqual({ estat: 'error' });
  expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'error' });
  get.resolve({ value: 'token-A-tarda' });
  await vi.runAllTimersAsync();
  expect(desaA).not.toHaveBeenCalled();
  expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'error' });
  del.resolve();
  await vi.runAllTimersAsync();
  expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'actiu' });
  expect(desaB).toHaveBeenCalledWith({ testimoni: token, plataforma: 'android' });
  expect(h.push.register).not.toHaveBeenCalled();
  expect(h.push.unregister).not.toHaveBeenCalled();
});

test('rotació Android retinguda: l’event és un wake i només publica el resultat Task vigent', async () => {
  const h = androidAmbTasks();
  const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}) });
  expect(await avisos.activa()).toEqual({ estat: 'actiu' });
  const fn = vi.fn(async () => {});
  const deixa = avisos.escoltaRegistre(fn);
  await h.listeners.get('registration')({ value: 'token-A-obsolet-retingut' });
  expect(fn).toHaveBeenCalledWith({ testimoni: token, plataforma: 'android' });
  expect(h.cicle.register).toHaveBeenCalledTimes(2);
  await avisos.desactiva();
  await h.listeners.get('registration')({ value: 'token-A-despres-logout' });
  expect(h.cicle.register).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledTimes(1);
  deixa();
});
