// @vitest-environment node
/* Ordre nocturna 261030_0252 (Fase 3, WP) · L'adaptador dels avisos push de
   l'App (avisosPushNatius.js), fase N1 i inert, amb el nucli del pont simulat:
   un connector fals que, com el de veres, és un Proxy que respon a qualsevol
   nom, també a `then` (una promesa que es resol amb ell no es resol mai). Mai
   es carrega el nucli de veres. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { importaElModul } from '../../tests/helpers/especificadorsImport.js';

const simulat = vi.hoisted(() => ({
  Capacitor: { isPluginAvailable: vi.fn(() => false), getPlatform: vi.fn(() => 'web') },
  registerPlugin: vi.fn()
}));
vi.mock('@capacitor/core', () => ({ Capacitor: simulat.Capacitor, registerPlugin: simulat.registerPlugin }));

const { CONNECTOR_PUSH, ESTAT_PUSH_NATIU, TOPALL_TESTIMONI_MS, creaAvisosPushNatius } = await import('./avisosPushNatius.js');

const ARREL = process.cwd();
const FITXER = 'src/natiu/avisosPushNatius.js';
const TESTIMONI = 'testimoni-fcm-de-prova:APA91b';

/** Un connector com el de Capacitor: els mètodes que coneixem i, per a la resta
 *  (també `then`), una crida que no contesta mai. */
function connectorFals({
  permis = 'prompt', resposta = 'granted', testimoni = TESTIMONI, errorDeRegistre = false, registreFalla = false, unregisterFalla = false, netejaFalla = false
} = {}) {
  const oients = new Map();
  const manses = [];
  const ordre = [];
  const metodes = {
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
      const mansa = { remove: vi.fn(async () => { oients.delete(nom); }) };
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

afterEach(() => {
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
    expect(await avisos.desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(2);
    expect(retira).toHaveBeenCalledTimes(1);
    expect(connector.desconeguts).toEqual([]);
  });

  test('sense haver activat en esta obertura de l\'App (no en sap el testimoni): fa la baixa i no retira res; no pregunta ni registra', async () => {
    const { nucli, connector } = nucliFals({ connector: connectorFals({ permis: 'granted' }) });
    const retira = vi.fn(async () => {});
    expect(await creaAvisosPushNatius({ nucli, desa: vi.fn(async () => {}) }).desactiva({ retira })).toEqual({ estat: ESTAT_PUSH_NATIU.INACTIU });
    expect(connector.metodes.unregister).toHaveBeenCalledTimes(1);
    expect(retira).not.toHaveBeenCalled();
    expect(connector.metodes.requestPermissions).not.toHaveBeenCalled();
    expect(connector.metodes.register).not.toHaveBeenCalled();
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

describe('fase N1: inert i sense paquets nous', () => {
  const codi = readFileSync(path.join(ARREL, FITXER), 'utf8');

  test('només importa el nucli del pont (cap paquet de push, cap import() dinàmic)', () => {
    const especificadors = [...codi.matchAll(/\b(?:from|import)\s*\(?\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
    expect(especificadors).toEqual(['@capacitor/core']);
    expect(codi).not.toMatch(/\bimport\s*\(/);
  });

  test('ningú no l\'importa encara: ni l\'entrada nativa, ni el Xat, ni main.jsx', () => {
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
    expect(fitxers.filter((ruta) => ruta !== FITXER && importaLAdaptador(readFileSync(path.join(ARREL, ruta), 'utf8'), ruta))).toEqual([]);
  });
});
