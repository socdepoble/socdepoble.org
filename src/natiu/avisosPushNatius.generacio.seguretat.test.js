// @vitest-environment node
/* R32.2 · Troballa de la nit 2 (Arbitratge de l'Elefant, Ronda 6, Peixos 3 i 4):
   la carrera Sequential Undo activa() ↔ desactiva() de creaAvisosPushNatius.
   Contracte: després d'una baixa, cap continuació d'un activa vell escriu
   «actiu» ni conserva el testimoni, i tot testimoni tardà (el que iOS lliura
   per l'esdeveniment després d'un register() ja eixit, o el que torna amb un
   desa obsolet) es revoca al pont dins de la cua de la baixa. Si un activa
   posterior és l'amo del registre natiu, el testimoni d'A no el desfà.
   Android continua amb la cua de Tasks de CiclePushNatiu (R31): mai
   l'unregister del connector oficial. Es diu *.seguretat.test.js: després
   d'eixir, els avisos d'una persona no han d'arribar a l'aparell. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaAvisosPushNatius, adaptadorPushNatiuPerAlRegistre, CONNECTOR_PUSH, CONNECTOR_CICLE_PUSH_ANDROID } from './avisosPushNatius.js';

const TESTIMONI = 'TEST_ONLY_R322_TESTIMONI_SINTETIC';

const pendent = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};

/* Unes quantes voltes de la cua de microtasques (sense rellotge). */
const buida = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

/* El contracte oficial d'iOS (PushNotificationsPlugin.swift 8.1.3):
   register() resol de seguida i sense valor; el testimoni arriba després,
   NOMÉS per l'esdeveniment 'registration'. Admet diversos oients per nom,
   com el pont de veres. `ordre` apunta crides i esdeveniments. */
function pontIos() {
  const oients = new Map();
  const ordre = [];
  const push = {
    checkPermissions: vi.fn(async () => ({ receive: 'granted' })),
    requestPermissions: vi.fn(async () => ({ receive: 'granted' })),
    addListener: vi.fn(async (nom, fn) => {
      if (!oients.has(nom)) oients.set(nom, new Set());
      oients.get(nom).add(fn);
      return { remove: vi.fn(async () => { oients.get(nom)?.delete(fn); }) };
    }),
    register: vi.fn(async () => { ordre.push('register'); }),
    unregister: vi.fn(async () => { ordre.push('unregister'); }),
    removeAllDeliveredNotifications: vi.fn(async () => {}),
    createChannel: vi.fn(async () => {})
  };
  const emet = (nom, dada) => {
    ordre.push(nom);
    for (const fn of [...(oients.get(nom) || [])]) fn(dada);
  };
  const vius = () => (oients.get('registration')?.size || 0) + (oients.get('registrationError')?.size || 0);
  /* Un pont que lliura el testimoni tot sol, poc després de register(). */
  const lliuraSol = () => push.register.mockImplementation(async () => {
    ordre.push('register');
    setTimeout(() => emet('registration', { value: TESTIMONI }), 0);
  });
  const nucli = {
    Capacitor: { isPluginAvailable: nom => nom === CONNECTOR_PUSH, getPlatform: () => 'ios' },
    registerPlugin: () => push
  };
  return { push, nucli, emet, vius, ordre, lliuraSol };
}

/* Android amb el pont local CiclePushNatiu: register() torna la Task
   getToken; unregister() la Task deleteToken. El connector oficial només hi
   és per a permisos i avisos. */
function pontAndroid() {
  const h = pontIos();
  const cicle = {
    register: vi.fn(async () => ({ value: TESTIMONI })),
    unregister: vi.fn(async () => {})
  };
  h.nucli.Capacitor.isPluginAvailable = nom => nom === CONNECTOR_PUSH || nom === CONNECTOR_CICLE_PUSH_ANDROID;
  h.nucli.Capacitor.getPlatform = () => 'android';
  h.nucli.registerPlugin = nom => (nom === CONNECTOR_CICLE_PUSH_ANDROID ? cicle : h.push);
  return { ...h, cicle };
}

beforeEach(() => vi.stubEnv('VITE_SDP_PUSH_NATIU', '1'));
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('R32.2 · generacioLocal: iOS, el testimoni tardà de l’esdeveniment', () => {
  test('baixa mentre s’espera el testimoni: el testimoni tardà no activa res i es revoca amb unregister', async () => {
    const h = pontIos();
    const desa = vi.fn(async () => {});
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa });
    const alta = avisos.activa();
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await alta).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    h.emet('registration', { value: TESTIMONI });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    // L'última paraula al pont és la revocació, posterior al testimoni tardà.
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
    expect(desa).not.toHaveBeenCalled();
    expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
    await buida();
    expect(h.vius()).toBe(0);
  });

  test('la sentinella viu com a molt fins al topall; un registrationError tardà la lleva sense revocar', async () => {
    vi.useFakeTimers();
    for (const final of ['topall', 'registrationError']) {
      const h = pontIos();
      const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), topallMs: 50 });
      const alta = avisos.activa();
      await vi.advanceTimersByTimeAsync(0);
      expect(h.push.register, final).toHaveBeenCalledTimes(1);
      expect(await avisos.desactiva(), final).toEqual({ estat: 'inactiu' });
      expect(await alta, final).toEqual({ estat: 'inactiu' });
      if (final === 'topall') await vi.advanceTimersByTimeAsync(50);
      else h.emet('registrationError', { error: 'SERVICE_NOT_AVAILABLE' });
      await vi.advanceTimersByTimeAsync(0);
      expect(h.vius(), final).toBe(0);
      // Ningú ja no escolta: un testimoni encara més tardà no toca el pont.
      h.emet('registration', { value: TESTIMONI });
      await vi.advanceTimersByTimeAsync(0);
      expect(h.push.unregister, final).toHaveBeenCalledTimes(1);
    }
  });

  test('un activa B posterior és l’amo del registre: el testimoni tardà d’A no desfà B', async () => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const desaA = vi.fn(async () => {}), desaB = vi.fn(async () => {});
    const altaA = avisos.activa({ desa: desaA });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await altaA).toEqual({ estat: 'inactiu' });
    const altaB = avisos.activa({ desa: desaB });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(2));
    // El mateix esdeveniment arriba a la sentinella d'A i a l'espera de B.
    h.emet('registration', { value: TESTIMONI });
    expect(await altaB).toEqual({ estat: 'actiu' });
    await buida();
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    expect(desaA).not.toHaveBeenCalled();
    expect(desaB).toHaveBeenCalledWith({ testimoni: TESTIMONI, plataforma: 'ios' });
    expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  });

  test('la revocació ocupa la cua de la baixa: B no arrenca fins que el pont la confirma', async () => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}) });
    const altaA = avisos.activa();
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    await avisos.desactiva();
    await altaA;
    const revocacio = pendent();
    h.push.unregister.mockImplementationOnce(() => revocacio.promise);
    h.emet('registration', { value: TESTIMONI });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    const desaB = vi.fn(async () => {});
    expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'error' });
    expect(h.push.register).toHaveBeenCalledTimes(1);
    revocacio.resolve();
    await buida();
    h.lliuraSol();
    expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'actiu' });
    expect(desaB).toHaveBeenCalledTimes(1);
  });

  test('una revocació que falla conserva el deure de baixa: la baixa següent torna a cridar unregister', async () => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}) });
    const alta = avisos.activa();
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    await avisos.desactiva();
    await alta;
    h.push.unregister.mockRejectedValueOnce(new Error('pont'));
    h.emet('registration', { value: TESTIMONI });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    await buida();
    expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(3);
    // Feta la baixa, ja no queda res a desfer.
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(3);
  });
});

describe('R32.2 · generacioLocal: el desa que torna després de la baixa', () => {
  test.each(['resol', 'rebutja'])('desa d’A que %s després de la baixa: inactiu, cap testimoni conservat i revocació al pont', async (final) => {
    const h = pontIos();
    h.lliuraSol();
    const desat = pendent();
    const desa = vi.fn(() => desat.promise);
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa });
    const alta = avisos.activa();
    await vi.waitFor(() => expect(desa).toHaveBeenCalledTimes(1));
    const retira = vi.fn(async () => {});
    expect(await avisos.desactiva({ retira })).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    if (final === 'resol') desat.resolve(); else desat.reject(new Error('Registre obsolet'));
    expect(await alta).toEqual({ estat: 'inactiu' });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
    // Cap testimoniDesat: una altra baixa no té res a retirar ni a desfer.
    expect(await avisos.desactiva({ retira })).toEqual({ estat: 'inactiu' });
    expect(retira).not.toHaveBeenCalled();
    expect(h.push.unregister).toHaveBeenCalledTimes(2);
  });

  test.each(['resol', 'rebutja'])('A → baixa → B: el desa tardà d’A que %s no desfà B', async (final) => {
    const h = pontIos();
    h.lliuraSol();
    const desatA = pendent();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const altaA = avisos.activa({ desa: vi.fn(() => desatA.promise) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    await buida();
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    const desaB = vi.fn(async () => {});
    expect(await avisos.activa({ desa: desaB })).toEqual({ estat: 'actiu' });
    if (final === 'resol') desatA.resolve(); else desatA.reject(new Error('500'));
    expect(await altaA).toEqual({ estat: 'inactiu' });
    await buida();
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  });

  test('un desa que falla sense cap baixa continua sent error (no inactiu) i no revoca', async () => {
    const h = pontIos();
    h.lliuraSol();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => { throw new Error('500'); }) });
    expect(await avisos.activa()).toEqual({ estat: 'error' });
    await buida();
    expect(h.push.unregister).not.toHaveBeenCalled();
  });
});

describe('R32.2 · Android: la revocació passa per la cua de Tasks (contracte R31)', () => {
  test('desa d’A després de la baixa: revoca amb CiclePushNatiu.unregister, mai amb l’unregister oficial', async () => {
    const h = pontAndroid();
    const desat = pendent();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(() => desat.promise) });
    const alta = avisos.activa();
    await vi.waitFor(() => expect(h.cicle.register).toHaveBeenCalledTimes(1));
    await buida();
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.cicle.unregister).toHaveBeenCalledTimes(1);
    desat.resolve();
    expect(await alta).toEqual({ estat: 'inactiu' });
    await vi.waitFor(() => expect(h.cicle.unregister).toHaveBeenCalledTimes(2));
    expect(h.push.unregister).not.toHaveBeenCalled();
    expect(h.push.register).not.toHaveBeenCalled();
    expect(await avisos.estat()).toEqual({ estat: 'inactiu' });
  });

  test('baixa durant getToken: la Task tardana no torna a activa i la cua nativa ja porta deleteToken darrere', async () => {
    const h = pontAndroid();
    const get = pendent();
    h.cicle.register.mockImplementationOnce(() => get.promise);
    const desa = vi.fn(async () => {});
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa });
    const alta = avisos.activa();
    await vi.waitFor(() => expect(h.cicle.register).toHaveBeenCalledTimes(1));
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await alta).toEqual({ estat: 'inactiu' });
    get.resolve({ value: 'TEST_ONLY_R322_TASK_TARDANA' });
    await buida();
    expect(desa).not.toHaveBeenCalled();
    expect(h.cicle.unregister).toHaveBeenCalledTimes(1);
    expect(h.push.unregister).not.toHaveBeenCalled();
  });
});

describe('R32.2 · cicleAvisosPush amb l’adaptador de veres (iOS)', () => {
  const memoriaDeProva = () => {
    let optin = null;
    return { llegeix: () => optin, desa: a => { optin = a; }, oblida: () => { optin = null; } };
  };

  test('registration tardà després de la primera baixa: es revoca encara que la neteja del cicle ja no tinga res a desfer', async () => {
    const h = pontIos();
    const memoria = memoriaDeProva();
    const cicle = adaptadorPushNatiuPerAlRegistre(creaAvisosPushNatius({ nucli: h.nucli }), { nucli: h.nucli, memoria });
    const desa = vi.fn(async () => {}), retira = vi.fn(async () => {});
    const alta = cicle.activa({ ambit: 'persona-a', desa, retira });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await cicle.desactiva({ retira })).toEqual({ estat: 'inactiu' });
    expect(await alta).toEqual({ estat: 'inactiu' });
    await buida();
    const abans = h.push.unregister.mock.calls.length;
    expect(abans).toBeGreaterThanOrEqual(1);
    h.emet('registration', { value: TESTIMONI });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(abans + 1));
    expect(h.ordre.at(-1)).toBe('unregister');
    expect(h.ordre.lastIndexOf('unregister')).toBeGreaterThan(h.ordre.indexOf('registration'));
    expect(desa).not.toHaveBeenCalled();
    expect(memoria.llegeix()).toBe(null);
    expect(await cicle.estat()).toEqual({ estat: 'inactiu' });
  });

  test('oblida mentre s’espera el testimoni: el desa del cicle el refusa i la neteja del cicle fa unregister després del testimoni', async () => {
    const h = pontIos();
    const memoria = memoriaDeProva();
    const cicle = adaptadorPushNatiuPerAlRegistre(creaAvisosPushNatius({ nucli: h.nucli }), { nucli: h.nucli, memoria });
    const desa = vi.fn(async () => {});
    const alta = cicle.activa({ ambit: 'persona-a', desa, retira: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    cicle.oblida();
    h.emet('registration', { value: TESTIMONI });
    expect(await alta).toEqual({ estat: 'inactiu' });
    await buida();
    expect(desa).not.toHaveBeenCalled();
    expect(h.ordre).toEqual(['register', 'registration', 'unregister']);
    expect(memoria.llegeix()).toBe(null);
    expect(await cicle.estat()).toEqual({ estat: 'inactiu' });
  });
});

/* Correcció de l'Elefant (R32.2, arbitratge dels Peixos sobre la sentinella).
   Peix 1 · La sentinella comptava el topall des del register(), no des de la
   baixa, i un topall sense avortament no deixava ningú escoltant: un
   testimoni d'APNs que arribava just després quedava viu després d'eixir.
   Peix 2 · Qualsevol activa posterior a la baixa passava per amo del
   registre natiu, encara que fallara abans d'arribar al pont.
   Peix R2 · Una baixa en vol que acabava bé esborrava el deure de baixa que
   una revocació encuada darrere acabava de marcar. Contracte comú: després
   d'eixir, l'última paraula al pont és 'unregister'. */
describe('R32.2 · Elefant · Peix 1: el testimoni tardà més enllà del topall del register()', () => {
  const memoriaDeProva = (inicial = null) => {
    let optin = inicial;
    return { llegeix: () => optin, desa: a => { optin = a; }, oblida: () => { optin = null; } };
  };

  test('cicle de veres: eixida 20 ms abans del topall i testimoni 20 ms després; la sentinella compta des de la baixa i revoca', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const cicle = adaptadorPushNatiuPerAlRegistre(creaAvisosPushNatius({ nucli: h.nucli, topallMs: 15000 }), { nucli: h.nucli, memoria: memoriaDeProva('persona-a'), visible: () => true });
    const desa = vi.fn(async () => {}), retira = vi.fn(async () => {});
    // Obertura amb l'opt-in d'una obertura anterior: register() sense gest.
    const sinc = cicle.sincronitza({ actiu: true, ambit: 'persona-a', desa, retira });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.register).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(14980);
    const eixida = cicle.desactiva({ retira });
    await vi.advanceTimersByTimeAsync(0);
    expect(await eixida).toEqual({ estat: 'inactiu' });
    expect(await sinc).toEqual({ estat: 'inactiu' });
    await vi.advanceTimersByTimeAsync(40);
    h.emet('registration', { value: TESTIMONI });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
    expect(desa).not.toHaveBeenCalled();
    expect(h.vius()).toBe(0);
  });

  test('la sentinella viu un topall sencer des de la baixa, i en vèncer sense senyal la baixa següent torna a cridar unregister', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), topallMs: 1000 });
    const alta = avisos.activa();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(990);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await alta).toEqual({ estat: 'inactiu' });
    await vi.advanceTimersByTimeAsync(990);
    // t = 1980 ms: passat el topall del register(), però no el de la baixa.
    expect(h.vius()).toBe(2);
    await vi.advanceTimersByTimeAsync(20);
    expect(h.vius()).toBe(0);
    // Ningú no escolta; el testimoni arriba igual. El deure no s'ha perdut.
    h.emet('registration', { value: TESTIMONI });
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
  });

  test('topall sense cap avortament: activa diu error i lleva els oients (R32), la baixa escolta abans de l’unregister i revoca el testimoni tardà', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), topallMs: 1000 });
    const alta = avisos.activa();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await alta).toEqual({ estat: 'error' });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.vius()).toBe(0);
    const ordreDe = (mock) => mock.mock.invocationCallOrder.at(-1);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    // La guarda: dos oients nous, i al pont abans que l'unregister de la baixa.
    expect(h.push.addListener).toHaveBeenCalledTimes(4);
    expect(ordreDe(h.push.addListener)).toBeLessThan(ordreDe(h.push.unregister));
    expect(h.vius()).toBe(2);
    await vi.advanceTimersByTimeAsync(500);
    h.emet('registration', { value: TESTIMONI });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
    expect(h.vius()).toBe(0);
    // Un senyal del pont tanca la incertesa: cap baixa més sense motiu.
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(2);
  });

  test('la guarda també viu com a molt un topall; mentre el registre siga incert, cada baixa crida unregister i torna a escoltar', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), topallMs: 1000 });
    const alta = avisos.activa();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await alta).toEqual({ estat: 'error' });
    await avisos.desactiva();
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.vius()).toBe(0);
    h.emet('registration', { value: TESTIMONI });
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
    expect(h.vius()).toBe(2);
    h.emet('registrationError', { error: 'SERVICE_NOT_AVAILABLE' });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.vius()).toBe(0);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(2);
  });

  test('cicle de veres amb gest: topall, la baixa correctora del cicle i el testimoni tardà; l’última paraula és unregister', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const memoria = memoriaDeProva();
    const cicle = adaptadorPushNatiuPerAlRegistre(creaAvisosPushNatius({ nucli: h.nucli, topallMs: 1000 }), { nucli: h.nucli, memoria });
    const alta = cicle.activa({ ambit: 'persona-a', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) });
    await vi.advanceTimersByTimeAsync(1000);
    expect(await alta).toEqual({ estat: 'error' });
    h.emet('registration', { value: TESTIMONI });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
    expect(memoria.llegeix()).toBe(null);
  });

  test('un register() nou relleva la guarda: un sol vigilant per testimoni, i B continua actiu', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), topallMs: 1000 });
    const altaA = avisos.activa();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await altaA).toEqual({ estat: 'error' });
    await avisos.desactiva();
    expect(h.vius()).toBe(2);
    const desaB = vi.fn(async () => {});
    const altaB = avisos.activa({ desa: desaB });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.register).toHaveBeenCalledTimes(2);
    // Només els oients de B: la guarda ja s'ha retirat.
    expect(h.vius()).toBe(2);
    h.emet('registration', { value: TESTIMONI });
    expect(await altaB).toEqual({ estat: 'actiu' });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    expect(desaB).toHaveBeenCalledTimes(1);
    expect(await avisos.estat()).toEqual({ estat: 'actiu' });
    // Una segona baixa abans del testimoni de C: un sol vigilant, una sola revocació.
    const altaC = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.advanceTimersByTimeAsync(0);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await altaC).toEqual({ estat: 'inactiu' });
    h.emet('registration', { value: TESTIMONI });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.unregister).toHaveBeenCalledTimes(3);
    expect(h.ordre.at(-1)).toBe('unregister');
  });
});

describe('R32.2 · Elefant · Peix 2: només és amo del registre natiu l’activa que hi ha arribat', () => {
  test.each([
    ['denegat', (perm) => perm.resolve({ receive: 'denied' }), { estat: 'denegat' }],
    ['checkPermissions que llança', (perm) => perm.reject(new Error('pont')), { estat: 'error' }]
  ])('A → baixa → B (%s abans de register) + testimoni tardà d’A: es revoca de seguida', async (_cas, acaba, esperat) => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}) });
    const altaA = avisos.activa();
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await altaA).toEqual({ estat: 'inactiu' });
    const perm = pendent();
    h.push.checkPermissions.mockImplementationOnce(() => perm.promise);
    const altaB = avisos.activa();
    await vi.waitFor(() => expect(h.push.checkPermissions).toHaveBeenCalledTimes(2));
    h.emet('registration', { value: TESTIMONI });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    expect(h.ordre).toEqual(['register', 'unregister', 'registration', 'unregister']);
    acaba(perm);
    expect(await altaB).toEqual(esperat);
    expect(h.push.register).toHaveBeenCalledTimes(1);
  });

  test('cicle de veres: B (persona-b) falla abans de register; l’última paraula al pont és unregister', async () => {
    const h = pontIos();
    let optin = null;
    const memoria = { llegeix: () => optin, desa: a => { optin = a; }, oblida: () => { optin = null; } };
    const cicle = adaptadorPushNatiuPerAlRegistre(creaAvisosPushNatius({ nucli: h.nucli }), { nucli: h.nucli, memoria });
    const altaA = cicle.activa({ ambit: 'persona-a', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await cicle.desactiva({ retira: vi.fn(async () => {}) })).toEqual({ estat: 'inactiu' });
    expect(await altaA).toEqual({ estat: 'inactiu' });
    const perm = pendent();
    h.push.checkPermissions.mockImplementationOnce(() => perm.promise);
    const altaB = cicle.activa({ ambit: 'persona-b', desa: vi.fn(async () => {}), retira: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.push.checkPermissions).toHaveBeenCalledTimes(2));
    h.emet('registration', { value: TESTIMONI });
    perm.reject(new Error('pont'));
    expect(await altaB).toEqual({ estat: 'error' });
    await buida();
    expect(h.ordre.at(-1)).toBe('unregister');
    expect(h.ordre.lastIndexOf('unregister')).toBeGreaterThan(h.ordre.indexOf('registration'));
    expect(optin).toBe(null);
  });

  test.each([
    ['B arriba al getToken: és l’amo i el desa tardà d’A no el desfà', true, 1],
    ['B denegat abans del getToken: el desa tardà d’A revoca amb CiclePushNatiu', false, 2]
  ])('Android: %s', async (_cas, bArriba, baixes) => {
    const h = pontAndroid();
    const desatA = pendent();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const altaA = avisos.activa({ desa: vi.fn(() => desatA.promise) });
    await vi.waitFor(() => expect(h.cicle.register).toHaveBeenCalledTimes(1));
    await buida();
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    if (!bArriba) h.push.checkPermissions.mockResolvedValueOnce({ receive: 'denied' });
    expect(await avisos.activa({ desa: vi.fn(async () => {}) })).toEqual({ estat: bArriba ? 'actiu' : 'denegat' });
    desatA.resolve();
    expect(await altaA).toEqual({ estat: 'inactiu' });
    await buida();
    expect(h.cicle.unregister).toHaveBeenCalledTimes(baixes);
    expect(h.push.unregister).not.toHaveBeenCalled();
  });
});

describe('R32.2 · Elefant · Peix 2: l’amo és un activa VIU (dos registres en vol)', () => {
  /* Un pont iOS on cada register() acaba lliurant el seu propi testimoni
     quan la prova ho diu: així hi ha dos registres en vol (A i B). */
  test('el testimoni de B no gasta la sentinella d’A; si el desa de B rebutja, el testimoni tardà d’A es revoca', async () => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const altaA = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await altaA).toEqual({ estat: 'inactiu' });
    const desatB = pendent();
    const altaB = avisos.activa({ desa: vi.fn(() => desatB.promise) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(2));
    h.emet('registration', { value: 'TEST_ONLY_R322_TESTIMONI_B' });
    await buida();
    // B és viu i amo: cap revocació, i la sentinella d'A continua escoltant.
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    expect(h.vius()).toBe(2);
    desatB.reject(new Error('500'));
    expect(await altaB).toEqual({ estat: 'error' });
    h.emet('registration', { value: 'TEST_ONLY_R322_TESTIMONI_A' });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(2));
    expect(h.ordre.at(-1)).toBe('unregister');
    await buida();
    expect(h.vius()).toBe(0);
  });

  test('B actiu: el testimoni tardà d’A no el desfà; quan B ix, la baixa escolta i revoca el que encara arribe d’A', async () => {
    vi.useFakeTimers();
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, topallMs: 1000 });
    const altaA = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.advanceTimersByTimeAsync(0);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await altaA).toEqual({ estat: 'inactiu' });
    const altaB = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.register).toHaveBeenCalledTimes(2);
    h.emet('registration', { value: 'TEST_ONLY_R322_TESTIMONI_B' });
    expect(await altaB).toEqual({ estat: 'actiu' });
    h.emet('registration', { value: 'TEST_ONLY_R322_TESTIMONI_A' });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    expect(await avisos.estat()).toEqual({ estat: 'actiu' });
    // La sentinella d'A venç sense el seu senyal: el registre queda incert.
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.vius()).toBe(0);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.vius()).toBe(2);
    h.emet('registration', { value: 'TEST_ONLY_R322_TESTIMONI_A_ENCARA' });
    await vi.advanceTimersByTimeAsync(0);
    expect(h.push.unregister).toHaveBeenCalledTimes(3);
    expect(h.ordre.at(-1)).toBe('unregister');
  });

  test('A superat per B abans que B arribe al pont: el desa tardà d’A revoca, i després B registra i queda actiu', async () => {
    const h = pontIos();
    h.lliuraSol();
    const desatA = pendent();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const altaA = avisos.activa({ desa: vi.fn(() => desatA.promise) });
    await vi.waitFor(() => expect(h.ordre).toContain('registration'));
    const permisB = pendent();
    h.push.checkPermissions.mockImplementationOnce(() => permisB.promise);
    const altaB = avisos.activa({ desa: vi.fn(async () => {}) });
    desatA.resolve();
    expect(await altaA).toEqual({ estat: 'inactiu' });
    await vi.waitFor(() => expect(h.push.unregister).toHaveBeenCalledTimes(1));
    await buida();
    permisB.resolve({ receive: 'granted' });
    expect(await altaB).toEqual({ estat: 'actiu' });
    expect(h.ordre).toEqual(['register', 'registration', 'unregister', 'register', 'registration']);
    expect(await avisos.estat()).toEqual({ estat: 'actiu' });
  });
});

describe('R32.2 · Elefant · Peix R2: la baixa en vol no esborra el deure que una revocació acaba de marcar', () => {
  test('baixa lenta que acaba bé + revocació encuada que falla: la baixa següent torna a cridar unregister', async () => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli, desa: vi.fn(async () => {}), limitBaixaMs: 10 });
    const alta = avisos.activa();
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    const lenta = pendent();
    h.push.unregister.mockImplementationOnce(() => lenta.promise);
    expect(await avisos.desactiva()).toEqual({ estat: 'error' });
    expect(await alta).toEqual({ estat: 'inactiu' });
    h.push.unregister.mockImplementationOnce(async () => { h.ordre.push('unregister-falla'); throw new Error('pont'); });
    h.emet('registration', { value: TESTIMONI });
    lenta.resolve();
    await buida();
    expect(h.push.unregister).toHaveBeenCalledTimes(2);
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.push.unregister).toHaveBeenCalledTimes(3);
    expect(h.ordre).toEqual(['register', 'registration', 'unregister-falla', 'unregister']);
  });
});

/* R32.3 (àrbitre de la integració Codex R32.2 + Claude R32.2) · Invariant
   de Codex: cap testimoni tardà d'A desfà un B ja confirmat. Un re-registre
   C de la mateixa obertura (sincronització sense gest) que arriba al pont i
   falla al desa renuncia a la seua generació, però B continua confirmat
   (registrat) i el servidor ja té el testimoni de B. */
describe('R32.3 · Àrbitre: un activa confirmat continua sent l’amo del registre natiu', () => {
  test('B actiu i C sense gest amb el desa rebutjat: un testimoni tardà dins la finestra de la sentinella d’A no desfà B', async () => {
    const h = pontIos();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const altaA = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(1));
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(await altaA).toEqual({ estat: 'inactiu' });
    const altaB = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(2));
    h.emet('registration', { value: TESTIMONI });
    expect(await altaB).toEqual({ estat: 'actiu' });
    const altaC = avisos.activa({ desa: vi.fn(async () => { throw new Error('500'); }), gest: false });
    await vi.waitFor(() => expect(h.push.register).toHaveBeenCalledTimes(3));
    h.emet('registration', { value: TESTIMONI });
    expect(await altaC).toEqual({ estat: 'error' });
    h.emet('registration', { value: TESTIMONI });
    await buida();
    expect(h.push.unregister).toHaveBeenCalledTimes(1);
    expect(h.ordre.at(-1)).toBe('registration');
    expect(await avisos.estat()).toEqual({ estat: 'actiu' });
    // Quan B ix, l'última paraula al pont torna a ser la baixa.
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    expect(h.ordre.at(-1)).toBe('unregister');
  });

  test('Android: B ha despatxat el getToken però encara no és actiu quan torna el desa tardà d’A: no es revoca', async () => {
    const h = pontAndroid();
    const desatA = pendent();
    const avisos = creaAvisosPushNatius({ nucli: h.nucli });
    const altaA = avisos.activa({ desa: vi.fn(() => desatA.promise) });
    await vi.waitFor(() => expect(h.cicle.register).toHaveBeenCalledTimes(1));
    await buida();
    expect(await avisos.desactiva()).toEqual({ estat: 'inactiu' });
    const getB = pendent();
    h.cicle.register.mockImplementationOnce(() => getB.promise);
    const altaB = avisos.activa({ desa: vi.fn(async () => {}) });
    await vi.waitFor(() => expect(h.cicle.register).toHaveBeenCalledTimes(2));
    desatA.resolve();
    expect(await altaA).toEqual({ estat: 'inactiu' });
    await buida();
    // La cua de Tasks posaria el deleteToken darrere del getToken de B.
    expect(h.cicle.unregister).toHaveBeenCalledTimes(1);
    getB.resolve({ value: TESTIMONI });
    expect(await altaB).toEqual({ estat: 'actiu' });
    expect(h.cicle.unregister).toHaveBeenCalledTimes(1);
    expect(h.push.unregister).not.toHaveBeenCalled();
  });
});
