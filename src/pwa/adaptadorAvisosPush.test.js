// @vitest-environment node
/* B8C-3 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · L'adaptador
   web dels avisos push del Xat (src/pwa/adaptadorAvisosPush.js), sobre el
   mòdul real de la subscripció (src/pwa/avisosPush.js) i el registre neutre
   de debò (src/config/avisosPushXat.js), fresc a cada prova. Tot amb dobles
   explícits: cap navegador, cap xarxa, cap servei de push. La clau VAPID es
   genera ací amb WebCrypto i no ix d'esta prova. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaAvisosPushWeb } from './adaptadorAvisosPush.js';
import { ESDEVENIMENT_AVIS_XAT, MISSATGE_AVIS_XAT, escoltaAvisosDelWorker } from './registre.js';
import { importaElModul } from '../../tests/helpers/especificadorsImport.js';

const ARREL = process.cwd();
const FCM = 'https://fcm.googleapis.com/fcm/send/dQw4w9WgXcQ:APA91b-opac_0123';
const CADUCA = 1893456000000;
const METODES = ['motiu', 'estat', 'activa', 'desactiva', 'sincronitza', 'neteja', 'oblida', 'escoltaToc'];

let CLAU;
let BYTES;

beforeAll(async () => {
  const parell = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  BYTES = new Uint8Array(await webcrypto.subtle.exportKey('raw', parell.publicKey));
  CLAU = Buffer.from(BYTES).toString('base64url');
});

/** Una subscripció del navegador, amb les claus de xifratge que MAI han d'eixir. */
function subscripcioFalsa({ endpoint = FCM, expirationTime = CADUCA, clau = BYTES } = {}) {
  return {
    endpoint,
    options: { userVisibleOnly: true, applicationServerKey: Uint8Array.from(clau).buffer },
    toJSON: () => ({ endpoint, expirationTime, keys: { p256dh: 'P256DH-SECRET', auth: 'AUTH-SECRET' } }),
    unsubscribe: vi.fn(async () => true)
  };
}

/** Un registre del worker propi. `waiting`: una versió nova en espera (després d'un desplegament). */
function registreFals({ actual = null, waiting = null } = {}) {
  const estat = { actual };
  const pushManager = {
    getSubscription: vi.fn(async () => estat.actual),
    subscribe: vi.fn(async (opcions) => {
      estat.actual = subscripcioFalsa({ clau: opcions.applicationServerKey });
      return estat.actual;
    })
  };
  const avisos = [{ tag: 'sdp-xat', close: vi.fn() }, { tag: 'una-altra', close: vi.fn() }];
  return { active: { state: 'activated' }, waiting, installing: null, pushManager, estat, avisos, getNotifications: vi.fn(async () => avisos) };
}

/** Una finestra de veres (EventTarget) amb Notification i PushManager. */
function finestraFalsa({ permis = 'default', resposta = 'granted', top } = {}) {
  const finestra = new EventTarget();
  function Notification() {}
  Notification.permission = permis;
  Notification.requestPermission = vi.fn(async () => {
    Notification.permission = resposta;
    return resposta;
  });
  function PushManager() {}
  Object.assign(finestra, { Notification, PushManager, isSecureContext: true, Event });
  finestra.self = finestra;
  finestra.top = top ?? finestra;
  return finestra;
}

/** L'adaptador amb els seus dobles. */
function munta({ permis, resposta, actual = null, waiting = null, produccio = true, clau, finestra, esdevenimentToc = ESDEVENIMENT_AVIS_XAT, senseRegistreActiu = false, senseRegistre = false } = {}) {
  const f = finestra ?? finestraFalsa({ permis, resposta });
  const registre = registreFals({ actual, waiting });
  const navegador = { userActivation: { isActive: true }, clearAppBadge: vi.fn(async () => {}) };
  const registreActiu = vi.fn(async () => (senseRegistreActiu || senseRegistre ? null : registre));
  const registreDelSw = vi.fn(async () => (senseRegistre ? null : registre));
  const adaptador = creaAvisosPushWeb({ registreActiu, registreDelSw, clau: clau === undefined ? CLAU : clau, produccio, esdevenimentToc, finestra: f, navegador });
  return { adaptador, finestra: f, registre, navegador, registreActiu, registreDelSw };
}

/** El registre dels avisos del Xat, nou de trinca (és d'estat de mòdul i només admet un adaptador).
    Onada R9 (C3): la façana i el motor, que s'hi endolla en avaluar-se, com fa src/main.jsx. */
async function registreNou() {
  vi.resetModules();
  await import('../config/motorAvisosPushXat.js');
  return import('../config/avisosPushXat.js');
}

const servidorFals = ({ desa = vi.fn(async () => {}), retira = vi.fn(async () => {}) } = {}) => ({ ambit: 'persona-a', desa, retira });

beforeEach(() => {
  /* La memòria de desats de la pàgina és de mòdul: cada prova comença sense cap. */
  creaAvisosPushWeb({}).oblida();
});

describe('la forma de l\'adaptador', () => {
  test('congelat, tipus web, els huit mètodes del contracte, i el registre de debò l\'accepta (una sola vegada)', async () => {
    const { adaptador } = munta();
    expect(Object.isFrozen(adaptador)).toBe(true);
    expect(adaptador.tipus).toBe('web');
    for (const nom of METODES) expect(typeof adaptador[nom], nom).toBe('function');
    const reg = await registreNou();
    expect(reg.registraAvisosPush(adaptador)).toBe(true);
    expect(reg.registraAvisosPush(adaptador)).toBe(true);
    expect(reg.avisosPushDisponibles()).toBe(true);
    expect(reg.instantaniaAvisosPush()).toMatchObject({ disponible: true, tipus: 'web', motiu: null, estat: 'inactiu' });
    /* Registrar no pregunta res ni toca el worker. */
    expect(munta().finestra.Notification.requestPermission).not.toHaveBeenCalled();
  });
});

describe('activa: el gest no es perd', () => {
  test('a través del registre de debò: requestPermission en el MATEIX tic que activaAvisosPush(), i el servidor rep { plataforma, adreca, caducaMs, gest: true } i cap clau', async () => {
    const { adaptador, finestra, registre } = munta();
    const reg = await registreNou();
    reg.registraAvisosPush(adaptador);
    const servidor = servidorFals();
    expect(reg.fixaServidorAvisosPush(servidor)).toBe(true);
    const promesa = reg.activaAvisosPush();
    /* Cap microtasca entremig: si hi haguera cap espera, este recompte seria 0. */
    expect(finestra.Notification.requestPermission).toHaveBeenCalledTimes(1);
    await expect(promesa).resolves.toEqual({ estat: 'actiu' });
    expect(registre.pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: BYTES });
    expect(servidor.desa).toHaveBeenCalledTimes(1);
    expect(servidor.desa.mock.calls[0][0]).toEqual({ plataforma: 'web', adreca: FCM, caducaMs: CADUCA, gest: true });
    expect(JSON.stringify(servidor.desa.mock.calls)).not.toMatch(/SECRET|p256dh|auth|keys/);
    expect(reg.instantaniaAvisosPush().estat).toBe('actiu');
  });

  test('directament: activa no és asíncrona davant (requestPermission ja ha sonat en tornar) i usa registreActiu per a subscriure', async () => {
    const { adaptador, finestra, registreActiu, registreDelSw, navegador } = munta();
    const desa = vi.fn(async () => {});
    const promesa = adaptador.activa({ desa });
    expect(finestra.Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(desa).not.toHaveBeenCalled();
    await expect(promesa).resolves.toEqual({ estat: 'actiu' });
    expect(desa.mock.calls).toEqual([[{ plataforma: 'web', adreca: FCM, caducaMs: CADUCA, gest: true }]]);
    expect(registreActiu).toHaveBeenCalledWith({ navegador });
    expect(registreDelSw).not.toHaveBeenCalled();
  });

  test('amb una versió del worker en espera (registreActiu null), activa diu sense-worker i no subscriu', async () => {
    const { adaptador, registre } = munta({ senseRegistreActiu: true });
    await expect(adaptador.activa({ desa: vi.fn() })).resolves.toEqual({ estat: 'sense-worker' });
    expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
  });

  test('un servidor apagat (NO-DISPONIBLE) via el registre de debò: sense-servidor, i la subscripció es desfà (cap òrfena)', async () => {
    const { adaptador, registre } = munta();
    const reg = await registreNou();
    reg.registraAvisosPush(adaptador);
    const desa = vi.fn(async () => { throw Object.assign(new Error('SDP-PUSH-010'), { code: 'NO-DISPONIBLE' }); });
    reg.fixaServidorAvisosPush(servidorFals({ desa }));
    await expect(reg.activaAvisosPush()).resolves.toEqual({ estat: 'sense-servidor' });
    expect(registre.estat.actual.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('motiu: si no s\'oferix, no es pregunta i l\'interruptor desfà', () => {
  const casos = [
    ['desenvolupament', { produccio: false }],
    ['sense-clau', { clau: '' }],
    ['sense-clau', { clau: 'no-és-una-clau' }],
    ['incrustat', { finestra: finestraFalsa({ top: {} }) }]
  ];

  test.each(casos)('%s: motiu() ho diu, estat() és no-oferit, activa no pregunta', async (motiu, opcions) => {
    const { adaptador, finestra, registre } = munta({ ...opcions, actual: subscripcioFalsa() });
    expect(adaptador.motiu()).toBe(motiu);
    await expect(adaptador.estat()).resolves.toEqual({ estat: 'no-oferit', motiu });
    await expect(adaptador.activa({ desa: vi.fn() })).resolves.toEqual({ estat: 'no-oferit' });
    expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
    expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
  });

  test.each(casos)('%s: sincronitza({ actiu: true }) desfà la subscripció que hi haja i la retira, sense desar ni preguntar, i diu no-oferit com estat()', async (motiu, opcions) => {
    const actual = subscripcioFalsa();
    const { adaptador, finestra } = munta({ ...opcions, permis: 'granted', actual });
    const desa = vi.fn(async () => {});
    const retira = vi.fn(async () => {});
    await expect(adaptador.sincronitza({ actiu: true, desa, retira, ambit: 'persona-a' })).resolves.toEqual({ estat: 'no-oferit' });
    expect(actual.unsubscribe).toHaveBeenCalledTimes(1);
    expect(desa).not.toHaveBeenCalled();
    expect(retira).toHaveBeenCalledWith({ plataforma: 'web', adreca: FCM });
    expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
  });

  test('a l\'app nativa i sense PushManager (iOS fora de la pantalla d\'inici), el motiu ve del mòdul de la subscripció', () => {
    const nativa = finestraFalsa();
    nativa.Capacitor = { isNativePlatform: () => true };
    expect(munta({ finestra: nativa }).adaptador.motiu()).toBe('nativa');
    const iphone = finestraFalsa();
    delete iphone.PushManager;
    const { adaptador } = munta({ finestra: iphone });
    expect(creaAvisosPushWeb({ registreActiu: vi.fn(), registreDelSw: vi.fn(), clau: CLAU, produccio: true, finestra: iphone, navegador: { standalone: false } }).motiu()).toBe('ios-sense-instalar');
    expect(adaptador.motiu()).toBe('sense-suport');
  });

  /* Correcció ARB-B8C3-03 (marató 261101_2143) · El registre publica el
     resultat de sincronitza, no el d'estat(): a l'iPhone sense instal·lar
     (cap pushManager) deia sense-worker, i la interfície hauria pintat
     «Torna a carregar la pàgina» al costat de la nota d'instal·lar. */
  test('Safari d\'iOS sense instal·lar (cap pushManager), pel registre de debò: l\'instantània diu no-oferit com estat(), mai sense-worker; una baixa que falla continua sent error', async () => {
    const iphone = finestraFalsa();
    delete iphone.PushManager;
    const registre = { active: { state: 'activated' }, waiting: null, installing: null };
    const adaptador = creaAvisosPushWeb({
      registreActiu: vi.fn(async () => registre), registreDelSw: vi.fn(async () => registre), clau: CLAU, produccio: true,
      esdevenimentToc: ESDEVENIMENT_AVIS_XAT, finestra: iphone, navegador: { standalone: false }
    });
    const reg = await registreNou();
    reg.registraAvisosPush(adaptador);
    reg.fixaServidorAvisosPush(servidorFals());
    await expect(reg.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'no-oferit' });
    expect(reg.instantaniaAvisosPush()).toMatchObject({ motiu: 'ios-sense-instalar', estat: 'no-oferit' });
    await expect(adaptador.estat()).resolves.toEqual({ estat: 'no-oferit', motiu: 'ios-sense-instalar' });
    expect(iphone.Notification.requestPermission).not.toHaveBeenCalled();
    /* Sense oferta i amb una subscripció que no es deixa desfer: error, mai un no-oferit que l'amagaria. */
    const encallada = subscripcioFalsa();
    encallada.unsubscribe.mockRejectedValue(new Error('InvalidStateError'));
    const { adaptador: incrustat } = munta({ finestra: finestraFalsa({ top: {} }), actual: encallada });
    await expect(incrustat.sincronitza({ actiu: true, desa: vi.fn(), retira: vi.fn(), ambit: 'persona-a' })).resolves.toEqual({ estat: 'error', error: 'subscripcio' });
  });
});

describe('sincronitza: mai pregunta', () => {
  test('una subscripció vigent es desa amb gest: false (des de l\'adaptador) i una sola vegada per persona i càrrega; oblida() ho torna a fer possible', async () => {
    const { adaptador, finestra, registreDelSw, registreActiu } = munta({ permis: 'granted', actual: subscripcioFalsa() });
    const desa = vi.fn(async () => {});
    await expect(adaptador.sincronitza({ actiu: true, desa, retira: vi.fn(), ambit: 'persona-a' })).resolves.toEqual({ estat: 'actiu' });
    expect(desa.mock.calls).toEqual([[{ plataforma: 'web', adreca: FCM, caducaMs: CADUCA, gest: false }]]);
    expect(JSON.stringify(desa.mock.calls)).not.toMatch(/SECRET|keys/);
    await adaptador.sincronitza({ actiu: true, desa, retira: vi.fn(), ambit: 'persona-a' });
    expect(desa).toHaveBeenCalledTimes(1);
    adaptador.oblida();
    await adaptador.sincronitza({ actiu: true, desa, retira: vi.fn(), ambit: 'persona-a' });
    expect(desa).toHaveBeenCalledTimes(2);
    expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
    expect(registreDelSw).toHaveBeenCalled();
    expect(registreActiu).not.toHaveBeenCalled();
  });

  test('a través del registre de debò, el desat sense gest arriba amb gest: false', async () => {
    const { adaptador } = munta({ permis: 'granted', actual: subscripcioFalsa() });
    const reg = await registreNou();
    reg.registraAvisosPush(adaptador);
    const servidor = servidorFals();
    reg.fixaServidorAvisosPush(servidor);
    await expect(reg.sincronitzaAvisosPush()).resolves.toEqual({ estat: 'actiu' });
    expect(servidor.desa.mock.calls).toEqual([[{ plataforma: 'web', adreca: FCM, caducaMs: CADUCA, gest: false }]]);
  });

  test('l\'interruptor: sincronitza({ actiu: false }) (o sense desa) desfà la subscripció i la retira { plataforma, adreca }', async () => {
    for (const crida of [{ actiu: false }, { actiu: true }, { actiu: 'si' }]) {
      const actual = subscripcioFalsa();
      const { adaptador, finestra } = munta({ permis: 'granted', actual });
      const retira = vi.fn(async () => {});
      await expect(adaptador.sincronitza({ ...crida, retira, ambit: 'persona-a' }), JSON.stringify(crida)).resolves.toEqual({ estat: 'inactiu' });
      expect(actual.unsubscribe, JSON.stringify(crida)).toHaveBeenCalledTimes(1);
      expect(retira.mock.calls, JSON.stringify(crida)).toEqual([[{ plataforma: 'web', adreca: FCM }]]);
      expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
    }
  });

  test('una versió del worker en espera no impedix l\'interruptor: desfà amb registreDelSw', async () => {
    const actual = subscripcioFalsa();
    const { adaptador } = munta({ permis: 'granted', actual, waiting: { state: 'installed' }, senseRegistreActiu: true });
    await adaptador.sincronitza({ actiu: false, ambit: 'persona-a' });
    expect(actual.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('desactiva, neteja i estat', () => {
  test('desactiva amb retira: desfà i retira { plataforma: \'web\', adreca }; sense retira (baixa local), només desfà', async () => {
    const amb = subscripcioFalsa();
    const a = munta({ actual: amb });
    const retira = vi.fn(async () => {});
    await expect(a.adaptador.desactiva({ retira })).resolves.toEqual({ estat: 'inactiu' });
    expect(amb.unsubscribe).toHaveBeenCalledTimes(1);
    expect(retira.mock.calls).toEqual([[{ plataforma: 'web', adreca: FCM }]]);
    expect(amb.unsubscribe.mock.invocationCallOrder[0]).toBeLessThan(retira.mock.invocationCallOrder[0]);
    for (const opcions of [{ retira: null }, {}, undefined]) {
      const local = subscripcioFalsa();
      const b = munta({ actual: local });
      await expect(b.adaptador.desactiva(opcions)).resolves.toEqual({ estat: 'inactiu' });
      expect(local.unsubscribe).toHaveBeenCalledTimes(1);
    }
    await expect(munta({ senseRegistre: true }).adaptador.desactiva({ retira })).resolves.toEqual({ estat: 'sense-worker' });
  });

  /* Correcció ARB-B8C3-01 (marató 261101_2143) · Després d'un desplegament de
     public/sw.js hi ha una versió en espera (cap skipWaiting) i registreActiu
     torna null: la baixa ha de trobar el registre amb registreDelSw o el
     logout deixaria viva la subscripció de qui ix, i la seua fila al servidor. */
  test('amb una versió del worker en espera (registreActiu null), desactiva desfà i retira amb registreDelSw; també la baixa en eixir del registre de debò', async () => {
    const actual = subscripcioFalsa();
    const a = munta({ actual, waiting: { state: 'installed' }, senseRegistreActiu: true });
    const retira = vi.fn(async () => {});
    await expect(a.adaptador.desactiva({ retira })).resolves.toEqual({ estat: 'inactiu' });
    expect(actual.unsubscribe).toHaveBeenCalledTimes(1);
    expect(retira.mock.calls).toEqual([[{ plataforma: 'web', adreca: FCM }]]);
    expect(a.registreDelSw).toHaveBeenCalledWith({ navegador: a.navegador });
    expect(a.registreActiu).not.toHaveBeenCalled();

    const deQuiIx = subscripcioFalsa();
    const b = munta({ permis: 'granted', actual: deQuiIx, waiting: { state: 'installed' }, senseRegistreActiu: true });
    const reg = await registreNou();
    reg.registraAvisosPush(b.adaptador);
    const servidor = servidorFals();
    expect(reg.fixaServidorAvisosPush(servidor)).toBe(true);
    await reg.baixaAvisosPushEnEixir({ limitMs: 2000 });
    expect(deQuiIx.unsubscribe).toHaveBeenCalledTimes(1);
    expect(servidor.retira.mock.calls).toEqual([[{ plataforma: 'web', adreca: FCM }]]);
    expect(reg.instantaniaAvisosPush()).toMatchObject({ estat: 'inactiu', eixint: true });
    expect(b.registreActiu).not.toHaveBeenCalled();
  });

  test('neteja tanca només els avisos del Xat i la insígnia, amb registreDelSw', async () => {
    const { adaptador, registre, navegador, registreDelSw } = munta();
    await expect(adaptador.neteja()).resolves.toBeUndefined();
    expect(registreDelSw).toHaveBeenCalled();
    expect(registre.getNotifications).toHaveBeenCalledWith({ tag: 'sdp-xat' });
    expect(registre.avisos[0].close).toHaveBeenCalledTimes(1);
    expect(registre.avisos[1].close).not.toHaveBeenCalled();
    expect(navegador.clearAppBadge).toHaveBeenCalledTimes(1);
  });

  test('estat, sense preguntar mai: denegat, inactiu (sense permís o sense subscripció), actiu, sense-worker i error; mai llança', async () => {
    const casos = [
      [{ permis: 'denied', actual: subscripcioFalsa() }, { estat: 'denegat' }],
      [{ permis: 'default', actual: subscripcioFalsa() }, { estat: 'inactiu' }],
      [{ permis: 'granted' }, { estat: 'inactiu' }],
      [{ permis: 'granted', actual: subscripcioFalsa() }, { estat: 'actiu' }],
      [{ permis: 'granted', actual: subscripcioFalsa(), waiting: { state: 'installed' }, senseRegistreActiu: true }, { estat: 'actiu' }],
      [{ permis: 'granted', senseRegistre: true }, { estat: 'sense-worker' }]
    ];
    for (const [opcions, esperat] of casos) {
      const { adaptador, finestra } = munta(opcions);
      await expect(adaptador.estat(), JSON.stringify(opcions)).resolves.toEqual(esperat);
      expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
    }
    const trencat = munta({ permis: 'granted' });
    trencat.registre.pushManager.getSubscription.mockRejectedValue(new Error('InvalidStateError'));
    await expect(trencat.adaptador.estat()).resolves.toEqual({ estat: 'error' });
  });
});

describe('escoltaToc: el toc no porta cap dada', () => {
  test('reacciona a l\'esdeveniment injectat amb fn({}) (encara que l\'esdeveniment porte un detail), i deixa d\'escoltar', () => {
    const { adaptador, finestra } = munta();
    const fn = vi.fn();
    const deixa = adaptador.escoltaToc(fn);
    finestra.dispatchEvent(new Event(ESDEVENIMENT_AVIS_XAT));
    finestra.dispatchEvent(new CustomEvent(ESDEVENIMENT_AVIS_XAT, { detail: { filId: 'fil-secret', desti: '/xat/fil-secret' } }));
    finestra.dispatchEvent(new Event('sdp:un-altre'));
    expect(fn.mock.calls).toEqual([[{}], [{}]]);
    deixa();
    finestra.dispatchEvent(new Event(ESDEVENIMENT_AVIS_XAT));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('un oient que llança no trenca la finestra; sense nom d\'esdeveniment, sense finestra o sense fn, no escolta res', () => {
    const { adaptador, finestra } = munta();
    adaptador.escoltaToc(() => { throw new Error('oient trencat'); });
    expect(() => finestra.dispatchEvent(new Event(ESDEVENIMENT_AVIS_XAT))).not.toThrow();
    for (const esdevenimentToc of [null, '', 42]) {
      const senseNom = munta({ esdevenimentToc });
      const espia = vi.spyOn(senseNom.finestra, 'addEventListener');
      expect(typeof senseNom.adaptador.escoltaToc(vi.fn())).toBe('function');
      expect(espia, String(esdevenimentToc)).not.toHaveBeenCalled();
    }
    expect(typeof adaptador.escoltaToc('no és una funció')).toBe('function');
    expect(() => creaAvisosPushWeb({ esdevenimentToc: ESDEVENIMENT_AVIS_XAT, finestra: null }).escoltaToc(vi.fn())()).not.toThrow();
  });

  test('de punta a punta: el missatge cec del worker arriba al registre del Xat com un toc {} (també el que arriba abans que ningú escolte); un missatge amb un fil, no', async () => {
    const { adaptador, finestra } = munta();
    const reg = await registreNou();
    reg.registraAvisosPush(adaptador);
    const oients = new Set();
    const navegador = { serviceWorker: { addEventListener: (tipus, fn) => { if (tipus === 'message') oients.add(fn); }, removeEventListener: () => {} } };
    finestra.location = { origin: 'https://socdepoble.org' };
    escoltaAvisosDelWorker({ navegador, finestra });
    const missatge = (data) => { for (const fn of oients) fn({ data, origin: 'https://socdepoble.org' }); };
    /* L'app oberta des de l'avís: el toc arriba abans que la interfície escolte. */
    missatge({ tipus: MISSATGE_AVIS_XAT });
    const tocs = vi.fn();
    reg.escoltaTocAvisPush(tocs);
    expect(tocs.mock.calls).toEqual([[{}]]);
    missatge({ tipus: MISSATGE_AVIS_XAT, filId: 'fil-secret' });
    missatge({ tipus: MISSATGE_AVIS_XAT });
    expect(tocs.mock.calls).toEqual([[{}], [{}]]);
  });
});

describe('per text', () => {
  const codi = readFileSync(path.join(ARREL, 'src/pwa/adaptadorAvisosPush.js'), 'utf8');

  test('no nomena el worker, el pont natiu ni cap emmagatzematge; només importa ./avisosPush.js', () => {
    expect(codi).not.toMatch(new RegExp(['service', 'Worker|Push', 'Notifications|Capa', 'citor|local', 'Storage|session', 'Storage|indexed', 'DB'].join('')));
    const importats = [...codi.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(importats).toEqual(['./avisosPush.js']);
    expect(importaElModul(codi, 'registre', 'src/pwa/adaptadorAvisosPush.js')).toBe(false);
  });

  test('activa no porta async ni cap await abans de cridar el mòdul de la subscripció', () => {
    const activa = codi.slice(codi.indexOf('activa({ desa } = {})'), codi.indexOf('desactiva({ retira } = {})'));
    expect(activa).not.toMatch(/\b(?:async|await|import)\b|\.then\(/);
    expect(codi).not.toMatch(/async\s+activa\b/);
  });
});
