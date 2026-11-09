// @vitest-environment node
/* Ordre nocturna 261030_0252 (Fase 3, WP) · L'adaptador dels avisos push de
   l'App (avisosPushNatius.js), amb el nucli del pont simulat: un connector
   fals que, com el de veres, és un Proxy que respon a qualsevol nom, també a
   `then` (una promesa que es resol amb ell no es resol mai). Mai es carrega
   el nucli de veres, llevat de la sonda de motiuPushNatiu (vi.importActual),
   que el torna a deixar com estava.
   B8C-4 (marató 261101_2143) · La fase N2: el desa de cada crida, el toc cec,
   motiuPushNatiu síncron, l'embolcall per al registre neutre i el registre de
   veres (src/config/avisosPushXat.js) de punta a punta. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { importaElModul } from '../../tests/helpers/especificadorsImport.js';

const simulat = vi.hoisted(() => ({
  Capacitor: { isPluginAvailable: vi.fn(() => false), getPlatform: vi.fn(() => 'web') },
  registerPlugin: vi.fn()
}));
vi.mock('@capacitor/core', () => ({ Capacitor: simulat.Capacitor, registerPlugin: simulat.registerPlugin }));

const {
  CONNECTOR_PUSH, ESTAT_PUSH_NATIU, TOPALL_TESTIMONI_MS, creaAvisosPushNatius, motiuPushNatiu, adaptadorPushNatiuPerAlRegistre
} = await import('./avisosPushNatius.js');

const ARREL = process.cwd();
const FITXER = 'src/natiu/avisosPushNatius.js';
const TESTIMONI = 'testimoni-fcm-de-prova:APA91b';
const TOC = 'pushNotificationActionPerformed';

/** Un connector com el de Capacitor: els mètodes que coneixem i, per a la resta
 *  (també `then`), una crida que no contesta mai. */
function connectorFals({
  permis = 'prompt', resposta = 'granted', testimoni = TESTIMONI, errorDeRegistre = false, registreFalla = false, unregisterFalla = false, netejaFalla = false
} = {}) {
  const oients = new Map();
  const manses = [];
  const ordre = [];
  const metodes = {
    createChannel: vi.fn(async () => {}),
    unregister: vi.fn(async () => {
      ordre.push('unregister');
      if (unregisterFalla) throw new Error('no');
    }),
    removeAllDeliveredNotifications: vi.fn(async () => {
      ordre.push('removeAllDeliveredNotifications');
      if (netejaFalla) throw new Error('no');
    }),
    checkPermissions: vi.fn(async () => ({ receive: permis })),
    requestPermissions: vi.fn(async () => ({ receive: resposta })),
    register: vi.fn(async () => {
      if (registreFalla) throw new Error('no');
      setTimeout(() => {
        if (errorDeRegistre) oients.get('registrationError')?.({ error: 'SERVICE_NOT_AVAILABLE' });
        else if (testimoni !== null) oients.get('registration')?.({ value: testimoni });
      }, 0);
    }),
    addListener: vi.fn((nom, funcio) => {
      oients.set(nom, funcio);
      const mansa = { remove: vi.fn(async () => { if (oients.get(nom) === funcio) oients.delete(nom); }) };
      manses.push(mansa);
      return Promise.resolve(mansa);
    })
  };
  const desconeguts = [];
  const proxy = new Proxy({}, {
    get(_, nom) {
      if (Object.prototype.hasOwnProperty.call(metodes, nom)) return metodes[nom];
      desconeguts.push(String(nom));
      return () => new Promise(() => {});
    }
  });
  return { proxy, metodes, manses, oients, desconeguts, ordre };
}

function nucliFals({ disponible = true, connector = connectorFals(), plataforma = 'android' } = {}) {
  return {
    connector,
    nucli: {
      Capacitor: { isPluginAvailable: vi.fn((nom) => disponible && nom === CONNECTOR_PUSH), getPlatform: vi.fn(() => plataforma) },
      registerPlugin: vi.fn(() => connector.proxy)
    }
  };
}

const PENJADA = Symbol('penjada');
function abansDe(ms, promesa) {
  let rellotge;
  const espera = new Promise((resol) => { rellotge = setTimeout(() => resol(PENJADA), ms); });
  return Promise.race([promesa, espera]).finally(() => clearTimeout(rellotge));
}

const microtasques = () => new Promise((resol) => { setTimeout(resol, 0); });

/** Una instància nova del registre neutre (pur i amb estat de mòdul).
    Onada R9 (C3): la façana i el motor, que s'hi endolla en avaluar-se, com fa src/natiu/entrada.jsx. */
async function registreFresc() {
  vi.resetModules();
  await import('../config/motorAvisosPushXat.js');
  return import('../config/avisosPushXat.js');
}

beforeEach(() => {
  const values = new Map();
  vi.stubGlobal('localStorage', { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) });
  /* Sanejament R15 (B3) · Estes proves són el push natiu ENCÈS (build amb VITE_SDP_PUSH_NATIU=1).
     L'apagat (el build d'avui) té el seu bloc: «sense la bandera de build». */
  vi.stubEnv('VITE_SDP_PUSH_NATIU', '1');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('sense el connector (la web, o l\'App sense el paquet): estat net', () => {
  test('amb el nucli de per defecte (cap connector PushNotifications al pont): sense-connector, sense registrar res', async () => {
    const avisos = creaAvisosPushNatius({ desa: vi.fn() });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    const retira = vi.fn();
    expect(await avisos.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    expect(retira).not.toHaveBeenCalled();
    expect(simulat.Capacitor.isPluginAvailable).toHaveBeenCalledWith(CONNECTOR_PUSH);
    expect(simulat.registerPlugin).not.toHaveBeenCalled();
  });

  test('si el pont no el té, o el nucli és incomplet o falla: sense-connector, cap crida i res a la consola', async () => {
    const consola = ['log', 'warn', 'error'].map((nivell) => vi.spyOn(console, nivell).mockImplementation(() => {}));
    const { nucli, connector } = nucliFals({ disponible: false });
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn() });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    expect(await avisos.desactiva({ retira: vi.fn() })).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    expect(nucli.registerPlugin).not.toHaveBeenCalled();
    expect(connector.metodes.checkPermissions).not.toHaveBeenCalled();
    expect(connector.metodes.unregister).not.toHaveBeenCalled();
    expect(connector.metodes.removeAllDeliveredNotifications).not.toHaveBeenCalled();
    for (const trencat of [null, {}, { Capacitor: {} }, { Capacitor: { isPluginAvailable: () => true } },
      { Capacitor: { isPluginAvailable: () => { throw new Error('no'); } }, registerPlugin: vi.fn() },
      { Capacitor: { isPluginAvailable: () => true }, registerPlugin: () => { throw new Error('no'); } }]) {
      expect(await creaAvisosPushNatius({ nucli: trencat, desa: vi.fn() }).activa()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
      expect(await creaAvisosPushNatius({ nucli: trencat, desa: vi.fn() }).desactiva()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    }
    for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  });
});

describe('amb el connector', () => {
  test('permís denegat: denegat (abans que sense-servidor), sense preguntar ni registrar', async () => {
    for (const desa of [vi.fn(), null]) {
      const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'denied' }) });
      const avisos = creaAvisosPushNatius({ nucli, desa });
      expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.DENEGAT });
      expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.DENEGAT });
      expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
      expect(connector.metodes.register).not.toHaveBeenCalled();
    }
  });

  test('sense servidor configurat: sense-servidor, i no es pregunta ni es registra (seria prometre el que no passarà)', async () => {
    for (const desa of [undefined, null, 'https://servidor.example']) {
      const { nucli, connector } = nucliFals();
      const avisos = creaAvisosPushNatius({ nucli, desa });
      expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
      expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
      expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
      expect(connector.metodes.register).not.toHaveBeenCalled();
      expect(connector.metodes.addListener).not.toHaveBeenCalled();
    }
  });

  test('tot bé: pregunta, registra, passa el testimoni i la plataforma al servidor i lleva els oients', async () => {
    const { nucli, connector } = nucliFals({ plataforma: 'ios' });
    const desa = vi.fn(async () => {});
    const avisos = creaAvisosPushNatius({ nucli, desa });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
    expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(connector.metodes.requestPermissions).toHaveBeenCalledTimes(1);
    expect(connector.metodes.register).toHaveBeenCalledTimes(1);
    expect(desa).toHaveBeenCalledWith({ testimoni: TESTIMONI, plataforma: 'ios' });
    expect(connector.metodes.addListener.mock.calls.map(([nom]) => nom).sort()).toEqual(['registration', 'registrationError']);
    await new Promise((resol) => { setTimeout(resol, 0); });
    expect(connector.manses).toHaveLength(2);
    for (const mansa of connector.manses) expect(mansa.remove).toHaveBeenCalledTimes(1);
    expect(connector.desconeguts).toEqual([]);
  });

  test('amb el permís ja donat no torna a preguntar; prompt-with-rationale sí que pregunta', async () => {
    const donat = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    expect(await creaAvisosPushNatius({ nucli: donat.nucli, desa: vi.fn(async () => {}) }).activa()).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(donat.connector.metodes.requestPermissions).not.toHaveBeenCalled();
    const raonat = nucliFals({ connector: connectorFals({ permis: 'prompt-with-rationale' }) });
    expect(await creaAvisosPushNatius({ nucli: raonat.nucli, desa: vi.fn(async () => {}) }).activa()).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(raonat.connector.metodes.requestPermissions).toHaveBeenCalledTimes(1);
  });

  test('si la persona no dona el permís: denegat, sense registrar', async () => {
    for (const resposta of ['denied', 'prompt', null]) {
      const { nucli, connector } = nucliFals({ connector: connectorFals({ resposta }) });
      const desa = vi.fn();
      expect(await creaAvisosPushNatius({ nucli, desa }).activa(), String(resposta)).toEqual({ estat: ESTAT_PUSH_NATIU.DENEGAT });
      expect(connector.metodes.register).not.toHaveBeenCalled();
      expect(desa).not.toHaveBeenCalled();
    }
  });

  test('un error de registre, un register que falla, un testimoni que no arriba (topall) o el servidor que falla: error, sense llançar', async () => {
    for (const opcions of [{ errorDeRegistre: true }, { registreFalla: true }, { testimoni: null }, { testimoni: '' }]) {
      const { nucli, connector } = nucliFals({ connector: connectorFals(opcions) });
      const desa = vi.fn(async () => {});
      expect(await creaAvisosPushNatius({ nucli, desa, topallMs: 20 }).activa(), JSON.stringify(opcions)).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
      expect(desa).not.toHaveBeenCalled();
      await new Promise((resol) => { setTimeout(resol, 0); });
      for (const mansa of connector.manses) expect(mansa.remove).toHaveBeenCalledTimes(1);
    }
    const { nucli } = nucliFals();
    expect(await creaAvisosPushNatius({ nucli, desa: vi.fn(async () => { throw new Error('500'); }) }).activa()).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    const trencat = nucliFals();
    trencat.connector.metodes.checkPermissions.mockImplementation(async () => { throw new Error('no implementat'); });
    expect(await creaAvisosPushNatius({ nucli: trencat.nucli, desa: vi.fn() }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    expect(TOPALL_TESTIMONI_MS).toBe(15000);
  });

  test('el Proxy respon a `then`: cap funció asíncrona el torna, i res no es penja', async () => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    expect(await abansDe(500, avisos.estat())).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(await abansDe(500, avisos.activa())).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(await abansDe(500, avisos.desactiva({ retira: vi.fn(async () => {}) }))).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.desconeguts).toEqual([]);
  });

  test('registerPlugin una sola vegada per nucli, encara que hi haja dos adaptadors o moltes crides', async () => {
    const { nucli } = nucliFals();
    const u = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    const dos = creaAvisosPushNatius({ nucli });
    await u.estat();
    await u.activa();
    await dos.estat();
    expect(nucli.registerPlugin).toHaveBeenCalledTimes(1);
    expect(nucli.registerPlugin).toHaveBeenCalledWith(CONNECTOR_PUSH);
  });

  test('el testimoni no ix per la consola', async () => {
    const consola = ['log', 'info', 'warn', 'error', 'debug'].map((nivell) => vi.spyOn(console, nivell).mockImplementation(() => {}));
    const { nucli } = nucliFals();
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    await avisos.activa();
    await avisos.desactiva({ retira: vi.fn(async () => { throw new Error('500'); }) });
    for (const espia of consola) expect(espia).not.toHaveBeenCalled();
  });
});

/* Gauntlet matinal 261030 (ALT-01.2 de Gemini i MILLORA-C10 de Codex) · La
   baixa de l'App: abans l'adaptador no en tenia cap. */
describe('desactiva (la baixa de l\'App)', () => {
  test('unregister, lleva els avisos mostrats i retira, de cortesia, el testimoni que este adaptador ha desat; una sola vegada', async () => {
    const { nucli, connector } = nucliFals({ plataforma: 'android' });
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    const retira = vi.fn(async () => { connector.ordre.push('retira'); });
    expect(await avisos.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.ordre).toEqual(['unregister', 'removeAllDeliveredNotifications', 'retira']);
    expect(retira).toHaveBeenCalledWith({ testimoni: TESTIMONI, plataforma: 'android' });
    // Sanejament R15 (B3 · P1-03): la baixa ja feta no deixa res a desfer; només un opt-in desat la repetix.
    expect(await avisos.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(await avisos.desactiva({ retira, ambOptIn: true })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(2);
    expect(retira).toHaveBeenCalledTimes(1);
    expect(connector.desconeguts).toEqual([]);
  });

  test('sense haver activat en esta obertura de l\'App però amb opt-in desat (ambOptIn): fa la baixa i no retira res; no pregunta ni registra', async () => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const retira = vi.fn(async () => {});
    expect(await creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) }).desactiva({ retira, ambOptIn: true })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(retira).not.toHaveBeenCalled();
    expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
    expect(connector.metodes.register).not.toHaveBeenCalled();
  });

  /* Sanejament R15 (B3 · P1-03, R15A-NAT-01) · Sense google-services.json, unregister() peta
     l'APK. Si esta obertura no ha demanat cap registre, no té cap testimoni i no hi ha opt-in
     desat, no hi ha res a desfer: cap crida nativa. */
  test.each([undefined, {}, { retira: null }, { ambOptIn: false }, { ambOptIn: 'true' }, { ambOptIn: 1 }])('sense registre en esta obertura ni opt-in desat (%j): cap unregister ni cap altra crida nativa', async (opcions) => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const retira = vi.fn(async () => {});
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    expect(await avisos.desactiva(opcions === undefined ? undefined : { ...opcions, ...(opcions.retira === undefined ? { retira } : {}) })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(await avisos.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    for (const metode of ['unregister', 'removeAllDeliveredNotifications', 'register', 'requestPermissions']) expect(connector.metodes[metode], metode).not.toHaveBeenCalled();
    expect(retira).not.toHaveBeenCalled();
  });

  test('després d’un registre demanat en esta obertura (encara que el testimoni no arribe), la baixa sí que crida unregister; i una altra baixa ja no', async () => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted', registreFalla: true }) });
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}), topallMs: 5 });
    expect(await avisos.activa()).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    expect(connector.metodes.register).toHaveBeenCalledTimes(1);
    expect(await avisos.desactiva()).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(await avisos.desactiva()).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
  });

  test('si unregister falla, error (i es retira igual); si només falla llevar els avisos, inactiu; una retirada que falla es torna a provar', async () => {
    const trencat = nucliFals({ connector: connectorFals({ unregisterFalla: true }) });
    const ambError = creaAvisosPushNatius({ nucli: trencat.nucli, desa: vi.fn(async () => {}) });
    await ambError.activa();
    const retira = vi.fn(async () => {});
    expect(await ambError.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    expect(retira).toHaveBeenCalledWith({ testimoni: TESTIMONI, plataforma: 'android' });
    expect(trencat.connector.metodes.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);

    const senseNeteja = nucliFals({ connector: connectorFals({ netejaFalla: true }) });
    expect(await creaAvisosPushNatius({ nucli: senseNeteja.nucli }).desactiva()).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });

    const { nucli } = nucliFals();
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    await avisos.activa();
    const fallaUnaVegada = vi.fn().mockRejectedValueOnce(new Error('xarxa')).mockResolvedValue(undefined);
    expect(await avisos.desactiva({ retira: fallaUnaVegada })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(await avisos.desactiva({ retira: fallaUnaVegada })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(fallaUnaVegada).toHaveBeenCalledTimes(2);
    expect(await avisos.desactiva({ retira: fallaUnaVegada })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(fallaUnaVegada).toHaveBeenCalledTimes(2);
  });

  test('opcions estranyes o sense retira: la baixa es fa igual, mai llança', async () => {
    const { nucli } = nucliFals();
    const avisos = creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) });
    await avisos.activa();
    for (const opcions of [undefined, null, {}, { retira: 'https://servidor.example' }, 7]) {
      await expect(avisos.desactiva(opcions), String(opcions)).resolves.toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    }
  });
});

/* B8C-4 · El registre neutre porta el servidor de la persona a cada crida. */
describe('B8C-4 · activa amb el desa de la crida', () => {
  test('el desa de la crida mana sobre el de la construcció', async () => {
    const { nucli } = nucliFals({ plataforma: 'ios' });
    const deLaConstruccio = vi.fn(async () => {});
    const deLaCrida = vi.fn(async () => {});
    expect(await creaAvisosPushNatius({ nucli, desa: deLaConstruccio }).activa({ desa: deLaCrida })).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(deLaCrida).toHaveBeenCalledWith({ testimoni: TESTIMONI, plataforma: 'ios' });
    expect(deLaConstruccio).not.toHaveBeenCalled();
  });

  test('construït sense desa: amb el desa de la crida, en lloc de sense-servidor, pregunta i registra', async () => {
    const { nucli, connector } = nucliFals();
    const desa = vi.fn(async () => {});
    expect(await creaAvisosPushNatius({ nucli }).activa({ desa })).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(connector.metodes.requestPermissions).toHaveBeenCalledTimes(1);
    expect(connector.metodes.register).toHaveBeenCalledTimes(1);
    expect(desa).toHaveBeenCalledWith({ testimoni: TESTIMONI, plataforma: 'android' });
  });

  test('una crida sense desa que siga una funció no compta: sense-servidor, sense preguntar', async () => {
    for (const crida of [undefined, null, {}, { desa: null }, { desa: 'https://servidor.example' }, 7]) {
      const { nucli, connector } = nucliFals();
      expect(await creaAvisosPushNatius({ nucli }).activa(crida), String(crida)).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
      expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
      expect(connector.metodes.register).not.toHaveBeenCalled();
    }
  });

  test('estat(): actiu després d’activar en esta obertura; després de qualsevol baixa (també la que falla), mai més actiu', async () => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const avisos = creaAvisosPushNatius({ nucli });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
    expect(await avisos.activa({ desa: vi.fn(async () => {}) })).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    /* La persona retira el permís als ajustos del sistema: denegat guanya. */
    connector.metodes.checkPermissions.mockResolvedValueOnce({ receive: 'denied' });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.DENEGAT });
    connector.metodes.unregister.mockRejectedValueOnce(new Error('no'));
    expect(await avisos.desactiva({ retira: null })).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
    expect(await avisos.activa({ desa: vi.fn(async () => {}) })).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
    expect(await avisos.desactiva()).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
  });

  test('un desat que falla no fa l’aparell actiu', async () => {
    const { nucli } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const avisos = creaAvisosPushNatius({ nucli });
    expect(await avisos.activa({ desa: vi.fn(async () => { throw new Error('500'); }) })).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    expect(await avisos.estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
  });
});

describe('B8C-4 · escoltaToc: el toc d’un avís, sense cap dada', () => {
  test('sense el connector torna una funció i no crida el pont (ni registerPlugin ni addListener)', () => {
    const { nucli, connector } = nucliFals({ disponible: false });
    const deixa = creaAvisosPushNatius({ nucli }).escoltaToc(vi.fn());
    expect(typeof deixa).toBe('function');
    expect(() => deixa()).not.toThrow();
    expect(nucli.registerPlugin).not.toHaveBeenCalled();
    expect(connector.metodes.addListener).not.toHaveBeenCalled();
    const perDefecte = creaAvisosPushNatius().escoltaToc(vi.fn());
    expect(typeof perDefecte).toBe('function');
    expect(simulat.registerPlugin).not.toHaveBeenCalled();
  });

  test('amb el connector, el toc crida fn({}) encara que la notificació porte el fil, el text i el destí', async () => {
    const { nucli, connector } = nucliFals();
    const fn = vi.fn();
    creaAvisosPushNatius({ nucli }).escoltaToc(fn);
    expect(connector.metodes.addListener).toHaveBeenCalledTimes(1);
    expect(connector.metodes.addListener.mock.calls[0][0]).toBe(TOC);
    const esdeveniment = { actionId: 'tap', notification: { id: '1', title: 'Sóc de Poble', body: 'secret', data: { filId: 'x', text: 'secret', desti: '/xat/x' } } };
    connector.oients.get(TOC)(esdeveniment);
    expect(fn).toHaveBeenCalledTimes(1);
    const [rebut] = fn.mock.calls[0];
    expect(rebut).toEqual({});
    expect(Object.keys(rebut)).toEqual([]);
    expect(rebut).not.toBe(esdeveniment);
    expect(fn.mock.calls[0]).toHaveLength(1);
    expect(connector.desconeguts).toEqual([]);
  });

  test('deixar d’escoltar lleva l’oient una sola vegada i, des d’eixe moment, fn no es crida encara que el connector tarde', async () => {
    const { nucli, connector } = nucliFals();
    const fn = vi.fn();
    const deixa = creaAvisosPushNatius({ nucli }).escoltaToc(fn);
    const oient = connector.oients.get(TOC);
    deixa();
    oient({ notification: { data: {} } });
    expect(fn).not.toHaveBeenCalled();
    deixa();
    await microtasques();
    expect(connector.manses).toHaveLength(1);
    expect(connector.manses[0].remove).toHaveBeenCalledTimes(1);
    expect(connector.oients.has(TOC)).toBe(false);
  });

  test('un fn que llança, un addListener que llança o que rebutja: res no ix ni queda cap rebuig sense amo', async () => {
    const senseAmo = vi.fn();
    process.on('unhandledRejection', senseAmo);
    try {
      const { nucli, connector } = nucliFals();
      creaAvisosPushNatius({ nucli }).escoltaToc(() => { throw new Error('oient trencat'); });
      expect(() => connector.oients.get(TOC)({})).not.toThrow();

      const llança = nucliFals();
      llança.connector.metodes.addListener.mockImplementation(() => { throw new Error('no'); });
      const deixa = creaAvisosPushNatius({ nucli: llança.nucli }).escoltaToc(vi.fn());
      expect(typeof deixa).toBe('function');
      expect(() => deixa()).not.toThrow();

      const rebutja = nucliFals();
      rebutja.connector.metodes.addListener.mockImplementation(() => Promise.reject(new Error('no')));
      const deixaR = creaAvisosPushNatius({ nucli: rebutja.nucli }).escoltaToc(vi.fn());
      deixaR();
      for (const noFn of [undefined, null, 'fn', {}]) expect(typeof creaAvisosPushNatius({ nucli }).escoltaToc(noFn)).toBe('function');
      await microtasques();
      await microtasques();
      expect(senseAmo).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', senseAmo);
    }
  });

  /* ARB-N04-02 (corrector) · El registre neutre no guarda la funció de deixar
     d'escoltar (registraAvisosPush fa nou.escoltaToc(toca)): un addListener que
     rebutja no pot deixar cap rebuig sense amo encara que ningú deixe
     d'escoltar. L'addListener és una funció plana: un vi.fn enganxa un .then al
     resultat (settledResults) i amagaria el rebuig. */
  test('un addListener pla que rebutja, sense deixar mai d’escoltar (com fa el registre): cap rebuig sense amo', async () => {
    const senseAmo = vi.fn();
    process.on('unhandledRejection', senseAmo);
    try {
      let crides = 0;
      const connector = { addListener: () => { crides += 1; return Promise.reject(new Error('no')); } };
      const nucli = { Capacitor: { isPluginAvailable: () => true, getPlatform: () => 'android' }, registerPlugin: () => connector };
      expect(typeof creaAvisosPushNatius({ nucli }).escoltaToc(() => {})).toBe('function');
      const registre = await registreFresc();
      expect(registre.registraAvisosPush(adaptadorPushNatiuPerAlRegistre(undefined, { nucli }))).toBe(true);
      expect(crides).toBe(2);
      await new Promise((resol) => { setTimeout(resol, 20); });
      expect(senseAmo).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', senseAmo);
    }
  });
});

describe('B8C-4 · motiuPushNatiu: síncron i sense efectes (ARB-06)', () => {
  test('sense connector diu sense-connector i amb connector null, sense cridar mai registerPlugin', () => {
    expect(motiuPushNatiu()).toBe('sense-connector');
    expect(simulat.Capacitor.isPluginAvailable).toHaveBeenCalledWith(CONNECTOR_PUSH);
    expect(simulat.registerPlugin).not.toHaveBeenCalled();
    const sense = nucliFals({ disponible: false });
    expect(motiuPushNatiu({ nucli: sense.nucli })).toBe('sense-connector');
    const amb = nucliFals();
    expect(motiuPushNatiu({ nucli: amb.nucli })).toBeNull();
    expect(amb.nucli.Capacitor.isPluginAvailable).toHaveBeenCalledWith(CONNECTOR_PUSH);
    expect(amb.nucli.registerPlugin).not.toHaveBeenCalled();
    expect(sense.nucli.registerPlugin).not.toHaveBeenCalled();
  });

  test('un nucli incomplet o que falla diu sense-connector, i mai torna una promesa', () => {
    /* null, 7 i {} porten el nucli de per defecte (el simulat, sense connector). */
    for (const opcions of [null, 7, {}, { nucli: null }, { nucli: {} }, { nucli: { Capacitor: {} } },
      { nucli: { Capacitor: { isPluginAvailable: () => true } } },
      { nucli: { Capacitor: { isPluginAvailable: () => { throw new Error('no'); } }, registerPlugin: vi.fn() } }]) {
      expect(motiuPushNatiu(opcions), JSON.stringify(opcions)).toBe('sense-connector');
    }
  });

  test('amb el nucli de veres de @capacitor/core: sense la capçalera nativa, sense-connector; amb ella, null i el connector continua sense registrar', async () => {
    const teniaGlobal = Object.prototype.hasOwnProperty.call(globalThis, 'Capacitor');
    const abans = globalThis.Capacitor;
    const real = await vi.importActual('@capacitor/core');
    const nucli = { Capacitor: real.Capacitor, registerPlugin: real.registerPlugin };
    try {
      expect(motiuPushNatiu({ nucli })).toBe('sense-connector');
      real.Capacitor.PluginHeaders = [{ name: CONNECTOR_PUSH, methods: [] }];
      expect(motiuPushNatiu({ nucli })).toBeNull();
      expect(real.Capacitor.Plugins[CONNECTOR_PUSH]).toBeUndefined();
    } finally {
      delete real.Capacitor.PluginHeaders;
      if (teniaGlobal) globalThis.Capacitor = abans;
      else delete globalThis.Capacitor;
    }
  });
});

describe('B8C-4 · adaptadorPushNatiuPerAlRegistre', () => {
  test('la forma del registre: congelat, tipus natiu i els huit mètodes', () => {
    const adaptador = adaptadorPushNatiuPerAlRegistre();
    expect(Object.isFrozen(adaptador)).toBe(true);
    expect(adaptador.tipus).toBe('natiu');
    for (const nom of ['motiu', 'estat', 'activa', 'desactiva', 'sincronitza', 'neteja', 'oblida', 'escoltaToc']) expect(typeof adaptador[nom], nom).toBe('function');
    expect(adaptador.motiu()).toBe('sense-connector');
    expect(simulat.registerPlugin).not.toHaveBeenCalled();
  });

  test('activa mapeja el testimoni a { plataforma, adreca, caducaMs: null, gest: true }; desactiva, a { plataforma, adreca }', async () => {
    for (const plataforma of ['ios', 'android']) {
      const { nucli } = nucliFals({ plataforma });
      const adaptador = adaptadorPushNatiuPerAlRegistre(undefined, { nucli });
      const desa = vi.fn(async () => {});
      expect(await adaptador.activa({ desa, ambit: 'persona-a' })).toEqual({ estat: ESTAT_PUSH_NATIU.ACTIU });
      expect(desa).toHaveBeenCalledTimes(1);
      expect(desa.mock.calls[0]).toEqual([{ plataforma, adreca: TESTIMONI, caducaMs: null, gest: true }]);
      const retira = vi.fn(async () => {});
      expect(await adaptador.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
      expect(retira.mock.calls).toEqual([[{ plataforma, adreca: TESTIMONI }]]);
    }
  });

  test('una plataforma que no és ios ni android (null, web) o un testimoni buit: error abans de desar', async () => {
    for (const plataforma of [null, 'web', 'electron']) {
      const { nucli } = nucliFals({ plataforma });
      if (plataforma === null) nucli.Capacitor.getPlatform.mockImplementation(() => { throw new Error('sense pont'); });
      const desa = vi.fn(async () => {});
      expect(await adaptadorPushNatiuPerAlRegistre(undefined, { nucli }).activa({ desa, ambit: 'persona-a' }), String(plataforma)).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
      expect(desa).not.toHaveBeenCalled();
    }
    const desa = vi.fn(async () => {});
    const falsPush = { activa: vi.fn(async ({ desa: d }) => { try { await d({ testimoni: '', plataforma: 'ios' }); return { estat: 'actiu' }; } catch (e) { return { estat: 'error', codi: e.code }; } }) };
    expect(await adaptadorPushNatiuPerAlRegistre(falsPush, { nucli: nucliFals().nucli }).activa({ desa, ambit: 'persona-a' })).toEqual({ estat: 'error', codi: 'AVISOS_INVALID' });
    expect(desa).not.toHaveBeenCalled();
  });

  test('sense desa a la crida: sense-servidor i no es pregunta; desactiva sense retira és només la baixa local', async () => {
    const { nucli, connector } = nucliFals();
    const adaptador = adaptadorPushNatiuPerAlRegistre(undefined, { nucli });
    for (const crida of [undefined, {}, { desa: null }]) expect(await adaptador.activa(crida)).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
    expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
    for (const crida of [undefined, {}, { retira: null }]) expect(await adaptador.desactiva(crida)).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    // Sanejament R15 (B3 · P1-03): ni registre en esta obertura ni opt-in desat → cap unregister.
    expect(connector.metodes.unregister).not.toHaveBeenCalled();
    localStorage.setItem('sdp.push.optin.v1', 'persona-a');
    expect(await adaptador.desactiva({ retira: null })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('sdp.push.optin.v1')).toBeNull();
  });

  test('estat(): on l’adaptador cru diu sense-servidor, inactiu (AUTO-02); la resta, tal qual', async () => {
    const amb = nucliFals();
    expect(await creaAvisosPushNatius({ nucli: amb.nucli }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_SERVIDOR });
    expect(await adaptadorPushNatiuPerAlRegistre(undefined, { nucli: amb.nucli }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(await adaptadorPushNatiuPerAlRegistre(undefined, { nucli: nucliFals({ disponible: false }).nucli }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
    expect(await adaptadorPushNatiuPerAlRegistre(undefined, { nucli: nucliFals({ connector: connectorFals({ permis: 'denied' }) }).nucli }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.DENEGAT });
    // Amb un motiu (sense connector o sense config) el cicle ja no pregunta l'adaptador: l'error es prova amb el connector present.
    expect(await adaptadorPushNatiuPerAlRegistre({ estat: async () => { throw new Error('no'); } }, { nucli: nucliFals().nucli }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.ERROR });
    expect(await adaptadorPushNatiuPerAlRegistre({ estat: async () => { throw new Error('no'); } }).estat()).toEqual({ estat: ESTAT_PUSH_NATIU.SENSE_CONNECTOR });
  });

  test('sense opt-in previ del mateix compte, sincronitza no registra encara que el permís estiga concedit', async () => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const adaptador = adaptadorPushNatiuPerAlRegistre(undefined, { nucli });
    const desa = vi.fn(async () => {});
    expect(await adaptador.sincronitza({ actiu: true, desa, retira: vi.fn(), ambit: 'persona-a' })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(await adaptador.sincronitza({ actiu: false })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.register).not.toHaveBeenCalled();
    expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
    expect(desa).not.toHaveBeenCalled();
  });

  test('neteja i oblida no toquen el pont; escoltaToc delega en l’adaptador i porta {}', async () => {
    const { nucli, connector } = nucliFals();
    const adaptador = adaptadorPushNatiuPerAlRegistre(undefined, { nucli });
    await expect(adaptador.neteja()).resolves.toBeUndefined();
    expect(adaptador.oblida()).toBeUndefined();
    expect(nucli.registerPlugin).not.toHaveBeenCalled();
    const fn = vi.fn();
    adaptador.escoltaToc(fn);
    connector.oients.get(TOC)({ notification: { data: { filId: 'x' } } });
    expect(fn.mock.calls).toEqual([[{}]]);
  });
});

/* B8C-4 · De punta a punta amb el registre neutre de veres: el que veurà la
   interfície (FullAjustos, useAvisosPushXat) i l'eixida (SessionContext). */
describe('B8C-4 · amb el registre de veres (src/config/avisosPushXat.js)', () => {
  test('sense el connector: es registra, motiu sense-connector (cap interruptor) i res no toca el pont', async () => {
    const registre = await registreFresc();
    const { nucli, connector } = nucliFals({ disponible: false });
    expect(registre.registraAvisosPush(adaptadorPushNatiuPerAlRegistre(undefined, { nucli }))).toBe(true);
    expect(registre.instantaniaAvisosPush()).toMatchObject({ disponible: true, tipus: 'natiu', motiu: 'sense-connector', estat: 'inactiu' });
    expect(registre.fixaServidorAvisosPush({ ambit: 'persona-a', desa: vi.fn(), retira: vi.fn() })).toBe(true);
    expect(await registre.activaAvisosPush()).toEqual({ estat: 'sense-connector' });
    expect(nucli.registerPlugin).not.toHaveBeenCalled();
    expect(connector.metodes.addListener).not.toHaveBeenCalled();
  });

  test('amb el connector: el gest desa amb gest i la forma del servidor; tornar a la vista no apaga l’interruptor; eixir desfà i retira', async () => {
    const registre = await registreFresc();
    const { nucli, connector } = nucliFals({ plataforma: 'android', connector: connectorFals({ permis: 'granted' }) });
    registre.registraAvisosPush(adaptadorPushNatiuPerAlRegistre(undefined, { nucli }));
    expect(registre.instantaniaAvisosPush().motiu).toBeNull();
    const desa = vi.fn(async () => {});
    const retira = vi.fn(async () => {});
    expect(registre.fixaServidorAvisosPush({ ambit: 'persona-a', desa, retira })).toBe(true);
    expect(await registre.activaAvisosPush()).toEqual({ estat: 'actiu' });
    expect(desa.mock.calls).toEqual([[{ plataforma: 'android', adreca: TESTIMONI, caducaMs: null, gest: true }]]);
    /* La sincronització de visibilitychange (també en tornar del diàleg del permís). */
    expect(await registre.sincronitzaAvisosPush()).toEqual({ estat: 'actiu' });
    expect(registre.instantaniaAvisosPush().estat).toBe('actiu');
    expect(connector.metodes.register).toHaveBeenCalledTimes(2);
    expect(desa.mock.calls[1][0].gest).toBe(false);
    await registre.baixaAvisosPushEnEixir();
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(retira.mock.calls).toEqual([[{ plataforma: 'android', adreca: TESTIMONI }]]);
    /* Una altra persona al mateix aparell: mai «actiu» sense el seu gest, i cap registre en silenci. */
    registre.fixaServidorAvisosPush(null);
    expect(registre.fixaServidorAvisosPush({ ambit: 'persona-b', desa: vi.fn(), retira: vi.fn() })).toBe(true);
    expect(await registre.sincronitzaAvisosPush()).toEqual({ estat: 'inactiu' });
    expect(connector.metodes.register).toHaveBeenCalledTimes(2);
  });

  test('el toc del connector arriba al registre com {}, també el que ha obert l’App abans que ningú escolte (una sola vegada)', async () => {
    const registre = await registreFresc();
    const { nucli, connector } = nucliFals();
    registre.registraAvisosPush(adaptadorPushNatiuPerAlRegistre(undefined, { nucli }));
    expect(connector.metodes.addListener.mock.calls.map(([nom]) => nom)).toEqual([TOC]);
    const dada = { notification: { data: { filId: 'x', text: 'secret', desti: '/xat/x' } } };
    connector.oients.get(TOC)(dada);
    const primer = vi.fn();
    registre.escoltaTocAvisPush(primer);
    expect(primer.mock.calls).toEqual([[{}]]);
    const segon = vi.fn();
    registre.escoltaTocAvisPush(segon);
    expect(segon).not.toHaveBeenCalled();
    connector.oients.get(TOC)(dada);
    expect(primer.mock.calls).toEqual([[{}], [{}]]);
    expect(segon.mock.calls).toEqual([[{}]]);
  });
});

describe('fase N2: només l’entrada nativa l’importa, amb helpers purs de cicle i consentiment', () => {
  const codi = readFileSync(path.join(ARREL, FITXER), 'utf8');

  test('importa el nucli del pont i els dos helpers, cap altre paquet ni import() dinàmic', () => {
    const especificadors = [...codi.matchAll(/\b(?:from|import)\s*\(?\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
    expect(especificadors).toEqual(['@capacitor/core', './cicleAvisosPush.js', './consentimentPush.js']);
    expect(codi).not.toMatch(/\bimport\s*\(/);
  });

  test('cap camí al pont que se salte registerPlugin (Capacitor.Plugins, globalThis.Capacitor ni window.Capacitor)', () => {
    const senseComentaris = codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(senseComentaris).not.toMatch(/\bPlugins\b/);
    expect(senseComentaris).not.toMatch(/\b(?:globalThis|window|self)\s*(?:\?\.|\.)\s*Capacitor\b/);
  });

  test('només src/natiu/entrada.jsx l’importa: ni el Xat, ni main.jsx, ni el registre', () => {
    const fitxers = [];
    const recorre = (directori) => {
      for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
        const ruta = `${directori}/${entrada.name}`;
        if (entrada.isDirectory()) recorre(ruta);
        else if (/\.(?:m?js|jsx)$/.test(entrada.name) && !/\.test\.[cm]?jsx?$/.test(entrada.name)) fitxers.push(ruta);
      }
    };
    recorre('src');
    expect(fitxers).toContain('src/natiu/entrada.jsx');
    /* Gauntlet 261030, cicle 3 (inercia-per-text-cru-falsos-rojos) · Els
       especificadors d'import (AST), no el text cru: un comentari que nomena
       l'adaptador no és un import; un import de veres, sí. */
    const importaLAdaptador = (codi, ruta) => importaElModul(codi, 'avisosPushNatius', ruta);
    expect(importaLAdaptador("import { Capacitor } from '@capacitor/core';\n/* Els avisos push (avisosPushNatius.js) arriben a la fase N4. */\n", 'avisosNatius.js')).toBe(false);
    expect(importaLAdaptador("import { creaAvisosPushNatius } from './avisosPushNatius.js';\n", 'entrada.jsx')).toBe(true);
    expect(importaLAdaptador("if (x) import('./avisosPushNatius.js').then(() => {});\n", 'entrada.jsx')).toBe(true);
    expect(fitxers.filter((ruta) => ruta !== FITXER && importaLAdaptador(readFileSync(path.join(ARREL, ruta), 'utf8'), ruta))).toEqual(['src/natiu/entrada.jsx']);
  });
});

/* Sanejament R15 (B3 · P1-03, R15A-NAT-01, P2-03) · El build d'avui: sense VITE_SDP_PUSH_NATIU=1
   (ni google-services.json ni el compte de servei d'FCM), el cicle diu 'sense-config' i no toca
   el pont: ni isPluginAvailable, ni registerPlugin, ni permisos, ni register(), ni unregister(),
   encara que el connector siga al binari, el permís estiga concedit i hi haja un opt-in desat. */
describe('sense la bandera de build VITE_SDP_PUSH_NATIU: sense-config i cap crida nativa', () => {
  const VALORS = ['', '0', 'true', ' 1', 'yes'];
  const senseCrides = ({ nucli, connector }) => {
    expect(nucli.Capacitor.isPluginAvailable).not.toHaveBeenCalled();
    expect(nucli.registerPlugin).not.toHaveBeenCalled();
    for (const [metode, espia] of Object.entries(connector.metodes)) expect(espia, metode).not.toHaveBeenCalled();
  };
  const memoriaAmbOptIn = (ambit) => {
    let valor = ambit;
    return { llegeix: vi.fn(() => valor), desa: vi.fn((v) => { valor = v; }), oblida: vi.fn(() => { valor = null; }) };
  };

  test.each(VALORS)('motiuPushNatiu amb %j: sense-config, sense mirar el pont', (valor) => {
    vi.stubEnv('VITE_SDP_PUSH_NATIU', valor);
    const fals = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    expect(motiuPushNatiu({ nucli: fals.nucli })).toBe(ESTAT_PUSH_NATIU.SENSE_CONFIG);
    expect(motiuPushNatiu()).toBe('sense-config');
    senseCrides(fals);
  });

  test('l’adaptador cru és inert: estat, activa i desactiva diuen sense-config; cap oient', async () => {
    vi.stubEnv('VITE_SDP_PUSH_NATIU', '');
    const fals = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const avisos = creaAvisosPushNatius({ nucli: fals.nucli, desa: vi.fn(async () => {}) });
    for (const crida of [() => avisos.estat(), () => avisos.activa(), () => avisos.activa({ gest: true }), () => avisos.desactiva({ ambOptIn: true, retira: vi.fn() })]) {
      expect(await crida()).toEqual({ estat: 'sense-config' });
    }
    await avisos.preparaCanal(); await avisos.neteja();
    const fn = vi.fn();
    for (const escolta of [avisos.escoltaToc, avisos.escoltaPendent, avisos.escoltaRegistre]) expect(typeof escolta(fn)).toBe('function');
    senseCrides(fals);
    expect(fn).not.toHaveBeenCalled();
  });

  test('el cicle del registre: amb opt-in desat i permís concedit, ni sincronitza, ni activa, ni la baixa toquen el pont', async () => {
    vi.stubEnv('VITE_SDP_PUSH_NATIU', '');
    const fals = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const memoria = memoriaAmbOptIn('persona-a');
    const desa = vi.fn(async () => {}), retira = vi.fn(async () => {});
    const cicle = adaptadorPushNatiuPerAlRegistre(undefined, { nucli: fals.nucli, memoria });
    expect(cicle.motiu()).toBe('sense-config');
    expect(await cicle.estat()).toEqual({ estat: 'sense-config' });
    expect(await cicle.sincronitza({ actiu: true, ambit: 'persona-a', desa, retira })).toEqual({ estat: 'sense-config' });
    expect(await cicle.sincronitza({ actiu: false, ambit: 'persona-b', desa, retira })).toEqual({ estat: 'sense-config' });
    expect(await cicle.activa({ ambit: 'persona-a', desa, retira })).toEqual({ estat: 'sense-config' });
    expect(await cicle.desactiva({ retira })).toEqual({ estat: 'sense-config' });
    expect(cicle.escoltaToc(vi.fn())).toBeTypeOf('function');
    senseCrides(fals);
    expect(desa).not.toHaveBeenCalled();
    expect(retira).not.toHaveBeenCalled();
    expect(memoria.desa).not.toHaveBeenCalled();
  });

  test('al registre: motiu sense-config (cap interruptor); activar, sincronitzar, eixir i entrar no toquen el pont', async () => {
    vi.stubEnv('VITE_SDP_PUSH_NATIU', '');
    const registre = await registreFresc();
    const fals = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    expect(registre.registraAvisosPush(adaptadorPushNatiuPerAlRegistre(undefined, { nucli: fals.nucli }))).toBe(true);
    expect(registre.instantaniaAvisosPush()).toMatchObject({ disponible: true, tipus: 'natiu', motiu: 'sense-config' });
    expect(registre.fixaServidorAvisosPush({ ambit: 'persona-a', desa: vi.fn(), retira: vi.fn() })).toBe(true);
    expect(await registre.activaAvisosPush()).toEqual({ estat: 'sense-config' });
    expect(await registre.sincronitzaAvisosPush()).toEqual({ estat: 'sense-config' });
    await registre.baixaLocalAvisosPushEnEntrar();
    await registre.baixaAvisosPushEnEixir();
    expect(registre.instantaniaAvisosPush().estat).not.toBe('error');
    senseCrides(fals);
  });
});

describe('amb la bandera: la baixa del cicle només desfà el que hi ha (P1-03)', () => {
  test('una sessió que no ha fet mai l’opt-in: sincronitzar (entrar, tornar a la vista) no crida unregister', async () => {
    const fals = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const memoria = { llegeix: vi.fn(() => null), desa: vi.fn(), oblida: vi.fn() };
    const cicle = adaptadorPushNatiuPerAlRegistre(undefined, { nucli: fals.nucli, memoria });
    expect(cicle.motiu()).toBeNull();
    for (let i = 0; i < 3; i++) expect(await cicle.sincronitza({ actiu: true, ambit: 'persona-a', desa: vi.fn(), retira: vi.fn() })).toEqual({ estat: 'inactiu' });
    expect(await cicle.desactiva({ retira: vi.fn() })).toEqual({ estat: 'inactiu' });
    for (const metode of ['unregister', 'register', 'requestPermissions', 'removeAllDeliveredNotifications']) expect(fals.connector.metodes[metode], metode).not.toHaveBeenCalled();
  });
  test('amb un opt-in desat d’una obertura anterior, la baixa sí que desfà el testimoni (unregister)', async () => {
    const fals = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    let desat = 'persona-a';
    const memoria = { llegeix: vi.fn(() => desat), desa: vi.fn((v) => { desat = v; }), oblida: vi.fn(() => { desat = null; }) };
    const cicle = adaptadorPushNatiuPerAlRegistre(undefined, { nucli: fals.nucli, memoria });
    expect(await cicle.desactiva({ retira: vi.fn() })).toEqual({ estat: 'inactiu' });
    expect(fals.connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(desat).toBeNull();
    // Ja no hi ha opt-in ni registre: una segona baixa no torna a cridar el pont.
    expect(await cicle.desactiva({ retira: vi.fn() })).toEqual({ estat: 'inactiu' });
    expect(fals.connector.metodes.unregister).toHaveBeenCalledTimes(1);
  });
});
