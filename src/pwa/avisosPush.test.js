// @vitest-environment node
/* Ordre nocturna 261030_0252 (Fase 3, WP) · el mòdul pur de la subscripció
   als avisos push del Xat (fase N1, inert). Tot amb dobles explícits: cap
   navegador, cap xarxa, cap servei de push. La clau VAPID de les proves es
   genera ací amb WebCrypto i no ix d'esta prova. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import {
  ERROR_PUSH, ESTAT_PUSH, ETIQUETA_AVIS_XAT, MAXIM_ENDPOINT, MOTIU_PUSH, SERVEIS_DE_PUSH, activaAvisosPush, clauDeServidor,
  creaMemoriaDeDesats, desactivaAvisosPush, formaDeLaSubscripcio, motiuPerNoOferirPush, netejaAvisosPush, oblidaDesatsPush,
  sincronitzaAvisosPush
} from './avisosPush.js';
import { registreActiu, registreDelSw } from './registre.js';
import { importaElModul } from '../../tests/helpers/especificadorsImport.js';

const ARREL = process.cwd();
const FITXER = 'src/pwa/avisosPush.js';
const base64url = (bytes) => Buffer.from(bytes).toString('base64url');

let CLAU;
let BYTES;
let ALTRES_BYTES;

async function clauPublicaNova() {
  const parell = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return new Uint8Array(await webcrypto.subtle.exportKey('raw', parell.publicKey));
}

beforeAll(async () => {
  BYTES = await clauPublicaNova();
  CLAU = base64url(BYTES);
  ALTRES_BYTES = await clauPublicaNova();
});

const FCM = 'https://fcm.googleapis.com/fcm/send/dGVzdA:APA91b-prova_123';

/** Una subscripció del navegador. `clau`: els bytes amb què es va fer (options.applicationServerKey). */
function subscripcioFalsa({ endpoint = FCM, clau = BYTES, expirationTime = null, desfaFalla = false, registre = [] } = {}) {
  return {
    endpoint,
    options: { userVisibleOnly: true, applicationServerKey: clau ? Uint8Array.from(clau).buffer : null },
    toJSON: () => ({ endpoint, expirationTime, keys: { p256dh: 'BPclauP256DHdeProva', auth: 'autDeProva' } }),
    unsubscribe: vi.fn(async () => {
      registre.push(`unsubscribe ${endpoint}`);
      if (desfaFalla) throw new Error('no');
      return true;
    })
  };
}

/** Un registre del worker: actiu, sense res en espera, amb el gestor de subscripcions. */
function registreFals({ actual = null, nova = null, waiting = null, installing = null, active = { state: 'activated' }, subscriuFalla = false } = {}) {
  const pushManager = {
    getSubscription: vi.fn(async () => actual),
    subscribe: vi.fn(async (opcions) => {
      if (subscriuFalla) throw new Error('AbortError');
      return nova || subscripcioFalsa({ clau: opcions.applicationServerKey });
    })
  };
  return { active, waiting, installing, pushManager };
}

/** Una finestra amb Notification. `resposta`: el que contesta requestPermission. */
function finestraFalsa({ permis = 'default', resposta = 'granted' } = {}) {
  function Notification() {}
  Notification.permission = permis;
  Notification.requestPermission = vi.fn(async () => resposta);
  function PushManager() {}
  const finestra = { Notification, PushManager, isSecureContext: true };
  finestra.self = finestra;
  finestra.top = finestra;
  return finestra;
}

const ambGest = { userActivation: { isActive: true } };

describe('clauDeServidor (pura)', () => {
  test('una clau pública VAPID de 87 caràcters base64url: els 65 bytes del punt, amb 0x04 al davant', () => {
    expect(CLAU).toHaveLength(87);
    const bytes = clauDeServidor(CLAU);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(4);
    expect(Array.from(bytes)).toEqual(Array.from(BYTES));
  });

  test('qualsevol altra cosa: null', () => {
    const ambPrimerByte = (valor) => base64url(Uint8Array.from([valor, ...BYTES.slice(1)]));
    const estandard = Buffer.from(BYTES).toString('base64').replace(/=+$/, '');
    for (const valor of [CLAU.slice(1), `${CLAU}A`, `${CLAU}=`, ambPrimerByte(5), ambPrimerByte(0), '', ' '.repeat(87), null, undefined, 42, BYTES, {}]) {
      expect(clauDeServidor(valor), String(valor).slice(0, 20)).toBeNull();
    }
    // L'alfabet estàndard (+ i /) no és base64url; si la clau en porta, es rebutja.
    if (/[+/]/.test(estandard)) expect(clauDeServidor(estandard)).toBeNull();
    expect(clauDeServidor(`${CLAU.slice(0, 86)}+`)).toBeNull();
    expect(clauDeServidor(`${CLAU.slice(0, 86)}/`)).toBeNull();
  });
});

describe('motiuPerNoOferirPush (pura)', () => {
  const entorn = (canvis = {}) => {
    const finestra = finestraFalsa();
    Object.assign(finestra, canvis);
    return { produccio: true, actiu: true, clau: CLAU, finestra, navegador: {} };
  };

  test('en producció, encés, amb clau, segur, al nivell de dalt, al navegador i amb suport: s\'oferix', () => {
    expect(motiuPerNoOferirPush(entorn())).toBeNull();
    expect(motiuPerNoOferirPush({ ...entorn({ Capacitor: { isNativePlatform: () => false } }) })).toBeNull();
  });

  test('cada condició, en ordre, amb el seu motiu', () => {
    expect(motiuPerNoOferirPush()).toBe(MOTIU_PUSH.DESENVOLUPAMENT);
    expect(motiuPerNoOferirPush({ ...entorn(), produccio: 'true' })).toBe(MOTIU_PUSH.DESENVOLUPAMENT);
    expect(motiuPerNoOferirPush({ ...entorn(), produccio: false, actiu: false })).toBe(MOTIU_PUSH.DESENVOLUPAMENT);
    expect(motiuPerNoOferirPush({ ...entorn(), actiu: false, clau: '' })).toBe(MOTIU_PUSH.APAGAT);
    expect(motiuPerNoOferirPush({ ...entorn(), actiu: 'sí' })).toBe(MOTIU_PUSH.APAGAT);
    expect(motiuPerNoOferirPush({ ...entorn({ isSecureContext: false }), clau: 'x' })).toBe(MOTIU_PUSH.SENSE_CLAU);
    expect(motiuPerNoOferirPush(entorn({ isSecureContext: false }))).toBe(MOTIU_PUSH.CONTEXT_INSEGUR);
    expect(motiuPerNoOferirPush({ ...entorn(), finestra: undefined })).toBe(MOTIU_PUSH.CONTEXT_INSEGUR);
    expect(motiuPerNoOferirPush(entorn({ top: {} }))).toBe(MOTIU_PUSH.INCRUSTAT);
    expect(motiuPerNoOferirPush(entorn({ Capacitor: { isNativePlatform: () => true } }))).toBe(MOTIU_PUSH.NATIVA);
    expect(motiuPerNoOferirPush(entorn({ PushManager: undefined }))).toBe(MOTIU_PUSH.SENSE_SUPORT);
    expect(motiuPerNoOferirPush(entorn({ Notification: undefined }))).toBe(MOTIU_PUSH.SENSE_SUPORT);
  });

  test('un iPhone amb Safari fora de la pantalla d\'inici (standalone false, sense PushManager): cal instal·lar; instal·lada, s\'oferix', () => {
    expect(motiuPerNoOferirPush({ ...entorn({ PushManager: undefined }), navegador: { standalone: false } })).toBe(MOTIU_PUSH.IOS_SENSE_INSTALAR);
    expect(motiuPerNoOferirPush({ ...entorn(), navegador: { standalone: true } })).toBeNull();
    expect(motiuPerNoOferirPush({ ...entorn({ PushManager: undefined }), navegador: { standalone: true } })).toBe(MOTIU_PUSH.SENSE_SUPORT);
  });
});

describe('formaDeLaSubscripcio (pura)', () => {
  test('els quatre serveis de push dels navegadors: l\'endpoint tal qual, la caducitat, i cap clau de xifratge', () => {
    for (const endpoint of [
      FCM,
      'https://web.push.apple.com/QGuQyavXutnMb5wnb4CZcCKmyzpSXFOH-Iw4bDjB2y0Px0x8kBLJyQ',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABk-prova',
      'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB%2bprova'
    ]) {
      const forma = formaDeLaSubscripcio({ endpoint, expirationTime: null, keys: { p256dh: 'p', auth: 'a' } });
      expect(forma, endpoint).toEqual({ endpoint, caducaMs: null });
      expect(Object.keys(forma)).toEqual(['endpoint', 'caducaMs']);
      expect(JSON.stringify(forma)).not.toMatch(/p256dh|auth"/);
    }
    expect(formaDeLaSubscripcio({ endpoint: FCM, expirationTime: 1893456000000 }).caducaMs).toBe(1893456000000);
    for (const caduca of [0, -1, Number.NaN, Infinity, '1893456000000']) expect(formaDeLaSubscripcio({ endpoint: FCM, expirationTime: caduca }).caducaMs).toBeNull();
    const llarg = `https://fcm.googleapis.com/fcm/send/${'a'.repeat(MAXIM_ENDPOINT - 'https://fcm.googleapis.com/fcm/send/'.length)}`;
    expect(llarg).toHaveLength(MAXIM_ENDPOINT);
    expect(formaDeLaSubscripcio({ endpoint: llarg })).toEqual({ endpoint: llarg, caducaMs: null });
  });

  test('contra SSRF: cap altre amfitrió, esquema, credencial, port, fragment, forma no canònica ni caràcter estrany', () => {
    for (const endpoint of [
      'http://fcm.googleapis.com/fcm/send/x',
      'https://usuari:clau@fcm.googleapis.com/fcm/send/x',
      'https://usuari@fcm.googleapis.com/fcm/send/x',
      'https://fcm.googleapis.com/fcm/send/x#fragment',
      'https://fcm.googleapis.com/fcm/send/x#',
      `https://fcm.googleapis.com/fcm/send/${'a'.repeat(MAXIM_ENDPOINT)}`,
      'https://evil.example/fcm/send/x',
      'https://push.apple.com.evil.example/x',
      'https://evilpush.apple.com/x',
      'https://notify.windows.com.evil.example/x',
      'https://fcm.googleapis.com.evil.example/x',
      'https://fcm.googleapis.com:443/fcm/send/x',
      'https://fcm.googleapis.com:8443/fcm/send/x',
      'https://FCM.googleapis.com/fcm/send/x',
      'https://fcm.googleapis.com./fcm/send/x',
      'https://evil.example\\@fcm.googleapis.com/x',
      'https://evil.example\\.fcm.googleapis.com/x',
      'https://fcm.googleapis.com',
      'https://fcm.googleapis.com/fcm/send/a b',
      'https://fcm.googleapis.com/fcm/send/x\n',
      'https://fcm.googleapis.com/fcm/send/x\u0000',
      'https://fcm.googleapis.com/fcm/send/càrrega',
      ' https://fcm.googleapis.com/fcm/send/x',
      'https://127.0.0.1/x',
      'https://[::1]/x',
      'https://localhost/x',
      'file:///etc/passwd',
      'javascript:alert(1)'
    ]) {
      expect(formaDeLaSubscripcio({ endpoint }), endpoint).toBeNull();
    }
    for (const json of [null, undefined, 42, 'https://fcm.googleapis.com/x', {}, { endpoint: 42 }, { endpoint: null }]) {
      expect(formaDeLaSubscripcio(json)).toBeNull();
    }
  });

  test('la llista de serveis és tancada i ancorada (nom d\'amfitrió sencer)', () => {
    expect(SERVEIS_DE_PUSH).toHaveLength(4);
    expect(Object.isFrozen(SERVEIS_DE_PUSH)).toBe(true);
    for (const servei of SERVEIS_DE_PUSH) expect(servei.source.endsWith('$'), servei.source).toBe(true);
  });
});

describe('activaAvisosPush (des d\'un gest)', () => {
  test('el permís es demana de manera SÍNCRONA, abans de cap espera: el gest no es perd', async () => {
    const finestra = finestraFalsa();
    const registre = vi.fn(async () => registreFals());
    const crida = activaAvisosPush({ registre, finestra, navegador: ambGest, clau: CLAU, desa: vi.fn(async () => {}) });
    expect(finestra.Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(registre).not.toHaveBeenCalled();
    expect(await crida).toEqual({ estat: ESTAT_PUSH.ACTIU });
  });

  test('tot bé: subscriu amb userVisibleOnly i la clau de 65 bytes, i desa només { endpoint, caducaMs }', async () => {
    const registre = registreFals();
    const desa = vi.fn(async () => {});
    expect(await activaAvisosPush({ registre, finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa })).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(registre.pushManager.subscribe).toHaveBeenCalledTimes(1);
    const [opcions] = registre.pushManager.subscribe.mock.calls[0];
    expect(opcions.userVisibleOnly).toBe(true);
    expect(opcions.applicationServerKey).toBeInstanceOf(Uint8Array);
    expect(Array.from(opcions.applicationServerKey)).toEqual(Array.from(BYTES));
    expect(desa).toHaveBeenCalledWith({ endpoint: FCM, caducaMs: null });
    expect(JSON.stringify(desa.mock.calls)).not.toMatch(/p256dh|autDeProva|BPclau/);
  });

  test('sense gest (userActivation.isActive fals): no pregunta; sense userActivation (Safari vell), sí', async () => {
    const finestra = finestraFalsa();
    expect(await activaAvisosPush({ registre: registreFals(), finestra, navegador: { userActivation: { isActive: false } }, clau: CLAU, desa: vi.fn() }))
      .toEqual({ estat: ESTAT_PUSH.SENSE_GEST });
    expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
    const altra = finestraFalsa();
    expect(await activaAvisosPush({ registre: registreFals(), finestra: altra, navegador: {}, clau: CLAU, desa: vi.fn(async () => {}) }))
      .toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(altra.Notification.requestPermission).toHaveBeenCalledTimes(1);
  });

  test('sense suport, sense clau o sense servidor: error net i sense preguntar', async () => {
    const casos = [
      [{ finestra: {} }, ERROR_PUSH.SENSE_SUPORT],
      [{ clau: 'no-és-cap-clau' }, ERROR_PUSH.SENSE_CLAU],
      [{ desa: undefined }, ERROR_PUSH.SENSE_SERVIDOR]
    ];
    for (const [canvi, error] of casos) {
      const finestra = finestraFalsa();
      const registre = registreFals();
      const resultat = await activaAvisosPush({ registre, finestra, navegador: ambGest, clau: CLAU, desa: vi.fn(), ...canvi });
      expect(resultat, error).toEqual({ estat: ESTAT_PUSH.ERROR, error });
      expect(finestra.Notification.requestPermission).not.toHaveBeenCalled();
      expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
    }
  });

  test('permís denegat → denegat; sense resposta (default) → inactiu; cap subscripció', async () => {
    for (const [resposta, estat] of [['denied', ESTAT_PUSH.DENEGAT], ['default', ESTAT_PUSH.INACTIU]]) {
      const registre = registreFals();
      expect(await activaAvisosPush({ registre, finestra: finestraFalsa({ resposta }), navegador: ambGest, clau: CLAU, desa: vi.fn() })).toEqual({ estat });
      expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
    }
  });

  test('sense un worker actiu, o amb una versió en espera o instal·lant-se: sense-worker i sense subscriure', async () => {
    for (const registre of [null, registreFals({ active: null }), registreFals({ waiting: {} }), registreFals({ installing: {} }), { active: {} }]) {
      const resultat = await activaAvisosPush({ registre, finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa: vi.fn() });
      expect(resultat).toEqual({ estat: ESTAT_PUSH.SENSE_WORKER });
      if (registre && registre.pushManager) expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
    }
    const falla = vi.fn(async () => { throw new Error('no'); });
    expect(await activaAvisosPush({ registre: falla, finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa: vi.fn() })).toEqual({ estat: ESTAT_PUSH.SENSE_WORKER });
  });

  test('una subscripció de la mateixa clau es reaprofita; d\'una altra clau, es desfà i se\'n fa una de nova', async () => {
    const mateixa = subscripcioFalsa({ clau: BYTES });
    const registre = registreFals({ actual: mateixa });
    const desa = vi.fn(async () => {});
    expect(await activaAvisosPush({ registre, finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa })).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(mateixa.unsubscribe).not.toHaveBeenCalled();
    expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
    expect(desa).toHaveBeenCalledTimes(1);

    const ordre = [];
    const vella = subscripcioFalsa({ endpoint: `${FCM}-vella`, clau: ALTRES_BYTES, registre: ordre });
    const altre = registreFals({ actual: vella });
    altre.pushManager.subscribe.mockImplementation(async (opcions) => {
      ordre.push('subscribe');
      return subscripcioFalsa({ clau: opcions.applicationServerKey });
    });
    expect(await activaAvisosPush({ registre: altre, finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa })).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(ordre).toEqual([`unsubscribe ${FCM}-vella`, 'subscribe']);
    expect(Array.from(altre.pushManager.subscribe.mock.calls[0][0].applicationServerKey)).toEqual(Array.from(BYTES));
  });

  test('cap subscripció òrfena: si el servidor no la desa o l\'endpoint no és d\'un servei conegut, es desfà', async () => {
    const nova = subscripcioFalsa();
    const registre = registreFals({ nova });
    expect(await activaAvisosPush({ registre, finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa: vi.fn(async () => { throw new Error('500'); }) }))
      .toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SERVIDOR });
    expect(nova.unsubscribe).toHaveBeenCalledTimes(1);

    const forastera = subscripcioFalsa({ endpoint: 'https://evil.example/push' });
    const desa = vi.fn(async () => {});
    expect(await activaAvisosPush({ registre: registreFals({ nova: forastera }), finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa }))
      .toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SERVEI_DESCONEGUT });
    expect(forastera.unsubscribe).toHaveBeenCalledTimes(1);
    expect(desa).not.toHaveBeenCalled();
  });

  test('cap camí llança: requestPermission, subscribe o unsubscribe que fallen tornen un estat', async () => {
    const finestra = finestraFalsa();
    finestra.Notification.requestPermission = vi.fn(() => { throw new Error('síncron'); });
    await expect(activaAvisosPush({ registre: registreFals(), finestra, navegador: ambGest, clau: CLAU, desa: vi.fn() })).resolves.toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.PERMIS });
    const rebutja = finestraFalsa();
    rebutja.Notification.requestPermission = vi.fn(async () => { throw new Error('asíncron'); });
    await expect(activaAvisosPush({ registre: registreFals(), finestra: rebutja, navegador: ambGest, clau: CLAU, desa: vi.fn() })).resolves.toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.PERMIS });
    await expect(activaAvisosPush({ registre: registreFals({ subscriuFalla: true }), finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa: vi.fn() }))
      .resolves.toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
    const vella = subscripcioFalsa({ clau: ALTRES_BYTES, desfaFalla: true });
    await expect(activaAvisosPush({ registre: registreFals({ actual: vella }), finestra: finestraFalsa(), navegador: ambGest, clau: CLAU, desa: vi.fn() }))
      .resolves.toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
    await expect(activaAvisosPush()).resolves.toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SENSE_SUPORT });
  });
});

describe('desactivaAvisosPush', () => {
  test('primer la baixa local (mata l\'endpoint) i després la retirada al servidor', async () => {
    const ordre = [];
    const subscripcio = subscripcioFalsa({ registre: ordre });
    const retira = vi.fn(async (dades) => { ordre.push(`retira ${dades.endpoint}`); });
    expect(await desactivaAvisosPush({ registre: registreFals({ actual: subscripcio }), retira })).toEqual({ estat: ESTAT_PUSH.INACTIU });
    expect(ordre).toEqual([`unsubscribe ${FCM}`, `retira ${FCM}`]);
    expect(retira).toHaveBeenCalledWith({ endpoint: FCM });
  });

  test('si la retirada falla, igualment inactiu; si la baixa local falla, error (i es retira igual); sense subscripció, res', async () => {
    expect(await desactivaAvisosPush({ registre: registreFals({ actual: subscripcioFalsa() }), retira: vi.fn(async () => { throw new Error('xarxa'); }) }))
      .toEqual({ estat: ESTAT_PUSH.INACTIU });
    const retira = vi.fn(async () => {});
    expect(await desactivaAvisosPush({ registre: registreFals({ actual: subscripcioFalsa({ desfaFalla: true }) }), retira }))
      .toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
    expect(retira).toHaveBeenCalledTimes(1);
    const cap = vi.fn();
    expect(await desactivaAvisosPush({ registre: registreFals(), retira: cap })).toEqual({ estat: ESTAT_PUSH.INACTIU });
    expect(cap).not.toHaveBeenCalled();
    expect(await desactivaAvisosPush({ registre: () => { throw new Error('no'); } })).toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
  });

  /* Gauntlet c3 (push-desactiva-fals-exit-amb-worker-en-espera) · Sense
     registre no se sap si queda una subscripció viva: mai «inactiu». */
  test('sense registre (o un registre que torna null): sense-worker, mai un inactiu fals', async () => {
    for (const registre of [null, undefined, async () => null, Promise.resolve(null)]) {
      expect(await desactivaAvisosPush({ registre }), String(registre)).toEqual({ estat: ESTAT_PUSH.SENSE_WORKER });
    }
  });

  test('amb una versió nova en espera (després de cada desplegament): registreDelSw troba el registre i la baixa i l\'interruptor desfan la subscripció', async () => {
    const propi = { scriptURL: 'https://socdepoble.org/sw.js' };
    const ambEspera = (actual) => ({ ...registreFals({ actual, waiting: propi }), active: propi });
    const navegadorAmb = (registre) => ({ [['service', 'Worker'].join('')]: { getRegistration: vi.fn(async () => registre) } });
    expect(await registreActiu({ navegador: navegadorAmb(ambEspera(subscripcioFalsa())) }), 'per a subscriure, no').toBeNull();

    const ordre = [];
    const subscripcio = subscripcioFalsa({ registre: ordre });
    const retira = vi.fn(async (dades) => { ordre.push(`retira ${dades.endpoint}`); });
    const navegador = navegadorAmb(ambEspera(subscripcio));
    expect(await desactivaAvisosPush({ registre: () => registreDelSw({ navegador }), retira })).toEqual({ estat: ESTAT_PUSH.INACTIU });
    expect(ordre).toEqual([`unsubscribe ${FCM}`, `retira ${FCM}`]);

    const altra = subscripcioFalsa();
    const interruptor = {
      registre: () => registreDelSw({ navegador: navegadorAmb(ambEspera(altra)) }), finestra: finestraFalsa({ permis: 'granted' }),
      actiu: false, clau: CLAU, desa: vi.fn(async () => {}), retira: vi.fn(async () => {}), desats: creaMemoriaDeDesats()
    };
    expect(await sincronitzaAvisosPush(interruptor)).toEqual({ estat: ESTAT_PUSH.INACTIU });
    expect(altra.unsubscribe).toHaveBeenCalledTimes(1);
    expect(interruptor.retira).toHaveBeenCalledWith({ endpoint: FCM });
    expect(interruptor.desa).not.toHaveBeenCalled();
  });
});

describe('sincronitzaAvisosPush (en carregar; mai no pregunta)', () => {
  const base = (canvis = {}) => ({
    finestra: finestraFalsa({ permis: 'granted' }), actiu: true, clau: CLAU, desa: vi.fn(async () => {}), retira: vi.fn(async () => {}),
    ambit: 'persona-a', desats: creaMemoriaDeDesats(), ...canvis
  });

  test('l\'interruptor: apagat, sense servidor o sense clau, desfà la subscripció i la retira', async () => {
    for (const canvi of [{ actiu: false }, { actiu: undefined }, { desa: undefined }, { clau: '' }]) {
      const subscripcio = subscripcioFalsa();
      const opcions = base({ registre: registreFals({ actual: subscripcio }), ...canvi });
      expect(await sincronitzaAvisosPush(opcions), JSON.stringify(Object.keys(canvi))).toEqual({ estat: ESTAT_PUSH.INACTIU });
      expect(subscripcio.unsubscribe).toHaveBeenCalledTimes(1);
      expect(opcions.retira).toHaveBeenCalledWith({ endpoint: FCM });
    }
  });

  test('el permís revocat: desfà, retira i diu denegat; mai no crida requestPermission', async () => {
    const subscripcio = subscripcioFalsa();
    const opcions = base({ registre: registreFals({ actual: subscripcio }), finestra: finestraFalsa({ permis: 'denied' }) });
    expect(await sincronitzaAvisosPush(opcions)).toEqual({ estat: ESTAT_PUSH.DENEGAT });
    expect(subscripcio.unsubscribe).toHaveBeenCalledTimes(1);
    expect(opcions.retira).toHaveBeenCalledTimes(1);
    expect(opcions.finestra.Notification.requestPermission).not.toHaveBeenCalled();
    const senseResposta = base({ registre: registreFals({ actual: subscripcioFalsa() }), finestra: finestraFalsa({ permis: 'default' }) });
    expect(await sincronitzaAvisosPush(senseResposta)).toEqual({ estat: ESTAT_PUSH.INACTIU });
    expect(senseResposta.finestra.Notification.requestPermission).not.toHaveBeenCalled();
  });

  test('sense subscripció no en fa cap (només un gest activa) i no pregunta', async () => {
    const registre = registreFals();
    const opcions = base({ registre });
    expect(await sincronitzaAvisosPush(opcions)).toEqual({ estat: ESTAT_PUSH.INACTIU });
    expect(registre.pushManager.subscribe).not.toHaveBeenCalled();
    expect(opcions.desa).not.toHaveBeenCalled();
    expect(opcions.finestra.Notification.requestPermission).not.toHaveBeenCalled();
  });

  test('una subscripció vigent es desa una sola vegada per càrrega', async () => {
    const opcions = base({ registre: registreFals({ actual: subscripcioFalsa() }) });
    expect(await sincronitzaAvisosPush(opcions)).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(await sincronitzaAvisosPush(opcions)).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(opcions.desa).toHaveBeenCalledTimes(1);
    expect(opcions.desa).toHaveBeenCalledWith({ endpoint: FCM, caducaMs: null });
    expect(opcions.retira).not.toHaveBeenCalled();
  });

  test('si el servidor falla amb una subscripció vigent, no es desfà (s\'intentarà en la càrrega següent)', async () => {
    const subscripcio = subscripcioFalsa();
    const opcions = base({ registre: registreFals({ actual: subscripcio }), desa: vi.fn(async () => { throw new Error('503'); }) });
    expect(await sincronitzaAvisosPush(opcions)).toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SERVIDOR });
    expect(subscripcio.unsubscribe).not.toHaveBeenCalled();
    expect(opcions.desats.perAmbit.size).toBe(0);
  });

  test('una clau rotada: desfà i retira la vella i se subscriu de nou sense preguntar; si el servidor no desa la nova, es desfà', async () => {
    const ordre = [];
    const vella = subscripcioFalsa({ endpoint: `${FCM}-vella`, clau: ALTRES_BYTES, registre: ordre });
    const nova = subscripcioFalsa({ registre: ordre });
    const registre = registreFals({ actual: vella, nova });
    const opcions = base({ registre, retira: vi.fn(async (dades) => { ordre.push(`retira ${dades.endpoint}`); }) });
    expect(await sincronitzaAvisosPush(opcions)).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(ordre).toEqual([`unsubscribe ${FCM}-vella`, `retira ${FCM}-vella`]);
    expect(registre.pushManager.subscribe).toHaveBeenCalledTimes(1);
    const [subscriu] = registre.pushManager.subscribe.mock.calls[0];
    expect(subscriu.userVisibleOnly).toBe(true);
    expect(Array.from(subscriu.applicationServerKey)).toEqual(Array.from(BYTES));
    expect(opcions.desa).toHaveBeenCalledWith({ endpoint: FCM, caducaMs: null });
    expect(opcions.finestra.Notification.requestPermission).not.toHaveBeenCalled();

    const nova2 = subscripcioFalsa();
    const falla = base({
      registre: registreFals({ actual: subscripcioFalsa({ endpoint: `${FCM}-vella`, clau: ALTRES_BYTES }), nova: nova2 }),
      desa: vi.fn(async () => { throw new Error('500'); })
    });
    expect(await sincronitzaAvisosPush(falla)).toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SERVIDOR });
    expect(nova2.unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('sense worker o amb un registre que falla: un estat, mai una excepció', async () => {
    expect(await sincronitzaAvisosPush(base({ registre: null }))).toEqual({ estat: ESTAT_PUSH.SENSE_WORKER });
    expect(await sincronitzaAvisosPush(base({ registre: async () => { throw new Error('no'); } }))).toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
    await expect(sincronitzaAvisosPush()).resolves.toEqual({ estat: ESTAT_PUSH.SENSE_WORKER });
  });

  /* Gauntlet matinal 261030 (MITJÀ-C6 de Codex) · L'interruptor no pot
     declarar una baixa que no ha passat: si unsubscribe falla, la subscripció
     continua viva. */
  test('l\'interruptor amb una baixa local que falla: error, mai un «inactiu» o un «denegat» fals, falle o no la retirada', async () => {
    for (const retiraFalla of [true, false]) {
      for (const canvi of [{ actiu: false }, { desa: undefined }, { clau: '' }, { finestra: finestraFalsa({ permis: 'denied' }) }]) {
        const subscripcio = subscripcioFalsa({ desfaFalla: true });
        const retira = vi.fn(async () => { if (retiraFalla) throw new Error('xarxa'); });
        const opcions = base({ registre: registreFals({ actual: subscripcio }), retira, ...canvi });
        const cas = `${Object.keys(canvi)} · retira ${retiraFalla ? 'falla' : 'bé'}`;
        expect(await sincronitzaAvisosPush(opcions), cas).toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
        expect(subscripcio.unsubscribe, cas).toHaveBeenCalledTimes(1);
        expect(retira, cas).toHaveBeenCalledWith({ endpoint: FCM });
      }
    }
  });

  /* Gauntlet matinal 261030 (ALT-01 de Gemini i MITJÀ-C7 de Codex) · La
     memòria dels desats és per persona: abans, si A eixia i B entrava en la
     mateixa pestanya, B no desava el seu endpoint i se li deia «actiu». */
  test('la memòria és per àmbit: B, en la mateixa càrrega que A, desa el seu endpoint; sense un àmbit vàlid es desa cada vegada', async () => {
    const desats = creaMemoriaDeDesats();
    const desa = vi.fn(async () => {});
    const sincronitza = (ambit) => sincronitzaAvisosPush(base({ registre: registreFals({ actual: subscripcioFalsa() }), desa, desats, ambit }));
    expect(await sincronitza('persona-a')).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(await sincronitza('persona-b')).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(desa).toHaveBeenCalledTimes(2);
    expect(await sincronitza('persona-a')).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(await sincronitza('persona-b')).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(desa).toHaveBeenCalledTimes(2);
    for (const ambit of [undefined, null, '', 7, {}]) {
      const abans = desa.mock.calls.length;
      expect(await sincronitza(ambit)).toEqual({ estat: ESTAT_PUSH.ACTIU });
      expect(await sincronitza(ambit)).toEqual({ estat: ESTAT_PUSH.ACTIU });
      expect(desa.mock.calls.length, String(ambit)).toBe(abans + 2);
    }
  });

  test('en eixir (oblidaDesatsPush) s\'oblida tot; un desat que era en vol quan s\'ha eixit no s\'anota', async () => {
    const desats = creaMemoriaDeDesats();
    const desa = vi.fn(async () => {});
    const opcions = (canvis = {}) => base({ registre: registreFals({ actual: subscripcioFalsa() }), desa, desats, ...canvis });
    await sincronitzaAvisosPush(opcions());
    await sincronitzaAvisosPush(opcions());
    expect(desa).toHaveBeenCalledTimes(1);
    oblidaDesatsPush(desats);
    expect(await sincronitzaAvisosPush(opcions())).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(desa).toHaveBeenCalledTimes(2);

    oblidaDesatsPush(desats);
    let acaba;
    const lenta = vi.fn(() => new Promise((resol) => { acaba = resol; }));
    const pendent = sincronitzaAvisosPush(opcions({ desa: lenta }));
    await vi.waitFor(() => expect(lenta).toHaveBeenCalledTimes(1));
    oblidaDesatsPush(desats);
    acaba();
    expect(await pendent).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect(desats.perAmbit.size).toBe(0);
    await sincronitzaAvisosPush(opcions());
    expect(desa).toHaveBeenCalledTimes(3);
    for (const estranya of [null, undefined, new Set(), {}, 'memoria']) expect(() => oblidaDesatsPush(estranya)).not.toThrow();
  });

  test('la memòria de la pàgina, per defecte: desa una vegada per càrrega i persona, i oblidaDesatsPush() sense arguments la buida', async () => {
    oblidaDesatsPush();
    const desa = vi.fn(async () => {});
    const opcions = () => base({ registre: registreFals({ actual: subscripcioFalsa() }), desa, desats: undefined, ambit: 'persona-de-la-pagina' });
    await sincronitzaAvisosPush(opcions());
    await sincronitzaAvisosPush(opcions());
    expect(desa).toHaveBeenCalledTimes(1);
    oblidaDesatsPush();
    await sincronitzaAvisosPush(opcions());
    expect(desa).toHaveBeenCalledTimes(2);
    oblidaDesatsPush();
  });

  test('un endpoint desfet o retirat s\'oblida: si la baixa local falla però el servidor l\'ha retirat, la sincronització següent el torna a desar', async () => {
    for (const baixa of [
      (desats) => sincronitzaAvisosPush(base({ registre: registreFals({ actual: subscripcioFalsa({ desfaFalla: true }) }), actiu: false, desats })),
      (desats) => desactivaAvisosPush({ registre: registreFals({ actual: subscripcioFalsa({ desfaFalla: true }) }), retira: vi.fn(async () => {}), desats })
    ]) {
      const desats = creaMemoriaDeDesats();
      const desa = vi.fn(async () => {});
      const sincronitza = () => sincronitzaAvisosPush(base({ registre: registreFals({ actual: subscripcioFalsa() }), desa, desats }));
      await sincronitza();
      expect(desa).toHaveBeenCalledTimes(1);
      expect(await baixa(desats)).toEqual({ estat: ESTAT_PUSH.ERROR, error: ERROR_PUSH.SUBSCRIPCIO });
      await sincronitza();
      expect(desa).toHaveBeenCalledTimes(2);
    }
  });

  test('una baixa mentre un desat és en vol: en tornar, el desat no s\'anota', async () => {
    const desats = creaMemoriaDeDesats();
    let acaba;
    const lenta = vi.fn(() => new Promise((resol) => { acaba = resol; }));
    const pendent = sincronitzaAvisosPush(base({ registre: registreFals({ actual: subscripcioFalsa() }), desa: lenta, desats }));
    await vi.waitFor(() => expect(lenta).toHaveBeenCalledTimes(1));
    expect(await desactivaAvisosPush({ registre: registreFals({ actual: subscripcioFalsa() }), retira: vi.fn(async () => {}), desats }))
      .toEqual({ estat: ESTAT_PUSH.INACTIU });
    acaba();
    expect(await pendent).toEqual({ estat: ESTAT_PUSH.ACTIU });
    expect([...desats.perAmbit.values()].every((endpoints) => endpoints.size === 0)).toBe(true);
  });
});

describe('netejaAvisosPush', () => {
  test('tanca només els avisos del Xat i la insígnia; mai llança', async () => {
    const delXat = { tag: ETIQUETA_AVIS_XAT, close: vi.fn() };
    const altre = { tag: 'un-altre', close: vi.fn() };
    const registre = { getNotifications: vi.fn(async () => [delXat, altre, null]) };
    const navegador = { clearAppBadge: vi.fn(async () => {}) };
    await netejaAvisosPush({ registre, navegador });
    expect(registre.getNotifications).toHaveBeenCalledWith({ tag: ETIQUETA_AVIS_XAT });
    expect(delXat.close).toHaveBeenCalledTimes(1);
    expect(altre.close).not.toHaveBeenCalled();
    expect(navegador.clearAppBadge).toHaveBeenCalledTimes(1);
    await expect(netejaAvisosPush({
      registre: { getNotifications: vi.fn(async () => { throw new Error('no'); }) },
      navegador: { clearAppBadge: vi.fn(async () => { throw new Error('no'); }) }
    })).resolves.toBeUndefined();
    await expect(netejaAvisosPush()).resolves.toBeUndefined();
  });
});

describe('frontera i fase N1', () => {
  const codi = readFileSync(path.join(ARREL, FITXER), 'utf8');

  test('per text: no nomena el worker per l\'API ni cap emmagatzematge directe', () => {
    const vetat = new RegExp(['service', 'Worker|local', 'Storage|session', 'Storage|indexed', 'DB'].join(''));
    expect(codi).not.toMatch(vetat);
    expect(codi).not.toMatch(/\bimport\b/);
  });

  /* B8C-3 (marató 261101_2143) · La porta de la fase N1 («cap fitxer de
     producció l'importa») es gira en la frontera de la fase N2: l'únic
     importador és l'adaptador web, que main.jsx carrega amb import() darrere
     de la bandera. Compta pel nom del mòdul: cap altre mòdul de src/ no es
     pot dir avisosPush (l'adaptador de dades és dispositiusAvisos.js). */
  test('frontera N2: només src/pwa/adaptadorAvisosPush.js l\'importa (la UI, el registre i l\'adaptador de dades, no)', () => {
    const fitxers = [];
    const recorre = (directori) => {
      for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
        const ruta = `${directori}/${entrada.name}`;
        if (entrada.isDirectory()) recorre(ruta);
        else if (/\.(?:m?js|jsx)$/.test(entrada.name) && !/\.test\.[cm]?jsx?$/.test(entrada.name) && !ruta.includes('/__fixtures__/')) fitxers.push(ruta);
      }
    };
    recorre('src');
    expect(fitxers.length).toBeGreaterThan(200);
    /* Gauntlet 261030, cicle 3 (inercia-per-text-cru-falsos-rojos) · Els
       especificadors d'import (AST), no el text cru: un comentari que nomena
       el mòdul no és un import; un import de veres, sí. */
    const importaLaSubscripcio = (codi, ruta) => importaElModul(codi, 'avisosPush', ruta);
    expect(importaLaSubscripcio("import { useState } from 'react';\n/* N2: './avisosPush.js' (src/pwa) s'endollarà ací. */\n", 'XatContext.jsx')).toBe(false);
    expect(importaLaSubscripcio("import { activaAvisosPush } from '../../pwa/avisosPush.js';\n", 'XatContext.jsx')).toBe(true);
    expect(fitxers.filter((ruta) => importaLaSubscripcio(readFileSync(path.join(ARREL, ruta), 'utf8'), ruta))).toEqual(['src/pwa/adaptadorAvisosPush.js']);
    /* L'adaptador de dades del port té un altre nom, i no l'importa. */
    expect(fitxers).toContain('src/data/supabase/dispositiusAvisos.js');
    expect(fitxers.filter((ruta) => /(?:^|\/)avisosPush\.(?:m?js|jsx)$/.test(ruta))).toEqual([FITXER]);
  });
});

/* B8C-3 (marató 261101_2143; B8-SERVIDOR §2.9, petició al carril de
   src/pwa/avisosPush.js) · La paritat amb el servidor. El client no pot desar
   cap endpoint que private.xat_push_adreca_valida rebutjaria (la
   subscripció es faria per a res i es desfaria amb SDP-PUSH-003), i ha
   d'acceptar tot el que el servidor desa. La regla del servidor, transcrita
   ací (adrecaValidaDelServidor), es lliga a la migració viva: si la SQL
   canvia, esta prova cau abans que les dues llistes divergisquen. */
describe('paritat amb private.xat_push_adreca_valida (B8C-3)', () => {
  const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
  const DEFINICIO = 'create or replace function private.xat_push_adreca_valida(p_tipus text, p_adreca text)';
  /* La darrera migració que definix la funció. */
  const migracio = readdirSync(MIGRACIONS).filter((nom) => nom.endsWith('.sql')).sort()
    .map((nom) => readFileSync(path.join(MIGRACIONS, nom), 'utf8')).filter((sql) => sql.includes(DEFINICIO)).pop();
  const AMFITRIONS = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];

  /* La branca web de la funció SQL, línia a línia. */
  function adrecaValidaDelServidor(adreca) {
    if (typeof adreca !== 'string') return false;
    if (adreca.length > 2048 || !/^https:\/\/[!-~]+$/.test(adreca) || adreca.includes('#')) return false;
    const resta = adreca.slice('https://'.length);
    if (!resta.includes('/')) return false;
    const amfitrio = resta.split('/')[0];
    if (!/^[a-z0-9.-]{1,253}$/.test(amfitrio) || amfitrio.startsWith('.') || amfitrio.includes('..')) return false;
    return AMFITRIONS.includes(amfitrio) || amfitrio.endsWith('.push.apple.com') || amfitrio.endsWith('.notify.windows.com');
  }

  test('la transcripció és la regla viva de la migració (la SQL no ha canviat)', () => {
    expect(migracio, 'cap migració definix private.xat_push_adreca_valida').toBeTypeOf('string');
    for (const fragment of [
      "if char_length(p_adreca) > 2048 or p_adreca !~ '^https://[!-~]+$' or position('#' in p_adreca) > 0 then",
      "v_resta := substr(p_adreca, 9);",
      "if position('/' in v_resta) = 0 then",
      "v_host := split_part(v_resta, '/', 1);",
      "if v_host !~ '^[a-z0-9.-]{1,253}$' or left(v_host, 1) = '.' or position('..' in v_host) > 0 then",
      "return v_host in ('fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.apple.com', 'notify.windows.com')",
      "or v_host like '%.push.apple.com'",
      "or v_host like '%.notify.windows.com';"
    ]) expect(migracio, fragment).toContain(fragment);
  });

  test('etiquetes buides: https://.push.apple.com/x i https://a..push.apple.com/x → null; web.push.apple.com continua acceptat', () => {
    for (const endpoint of ['https://.push.apple.com/x', 'https://a..push.apple.com/x', 'https://.notify.windows.com/x', 'https://a..notify.windows.com/x', 'https://a...push.apple.com/x']) {
      expect(formaDeLaSubscripcio({ endpoint }), endpoint).toBeNull();
    }
    const apple = 'https://web.push.apple.com/QGuQyavXutnMb5wnb4CZcCKmyzpSXFOH-Iw4bDjB2y0Px0x8kBLJyQ';
    expect(formaDeLaSubscripcio({ endpoint: apple })).toEqual({ endpoint: apple, caducaMs: null });
  });

  /* Correcció ARB-B8C3-04 (marató 261101_2143) · Un amfitrió d'Apple de
     `llargada` caràcters exactes, amb etiquetes de 59 o menys: URL l'analitza
     (sense límit de llargada) i la vora del servidor és 253. */
  const amfitrioApple = (llargada) => {
    const sufix = '.push.apple.com';
    const etiquetes = [];
    for (let resta = llargada - sufix.length; resta > 0; resta -= 60) etiquetes.push('a'.repeat(Math.min(59, resta - (resta > 59 ? 1 : 0))));
    const amfitrio = `${etiquetes.join('.')}${sufix}`;
    if (amfitrio.length !== llargada) throw new Error(`amfitrioApple(${llargada}) fa ${amfitrio.length}`);
    return amfitrio;
  };

  /* Els casos que rebutja el servidor, per regla. Cada fila és un endpoint
     que el navegador podria donar (URL l'analitza) i que la SQL no desa. */
  const REBUTJA_EL_SERVIDOR = [
    ['amfitrió de 254 caràcters', `https://${amfitrioApple(254)}/x`],
    ['amfitrió de 258 caràcters', `https://${amfitrioApple(258)}/x`],
    ['etiqueta buida al davant', 'https://.push.apple.com/x'],
    ['etiqueta buida al mig', 'https://a..push.apple.com/x'],
    ['etiqueta buida a WNS', 'https://a..notify.windows.com/x'],
    ['guió baix a l\'amfitrió', 'https://a_b.push.apple.com/x'],
    ['admiració a l\'amfitrió', 'https://a!b.push.apple.com/x'],
    ['dòlar a l\'amfitrió', 'https://a$b.notify.windows.com/x'],
    ['titlla a l\'amfitrió', 'https://a~b.push.apple.com/x'],
    ['asterisc a l\'amfitrió', 'https://a*b.push.apple.com/x'],
    ['clau a l\'amfitrió', 'https://a{b.push.apple.com/x'],
    ['igual a l\'amfitrió', 'https://a=b.notify.windows.com/x'],
    ['cometa a l\'amfitrió', 'https://a\'b.push.apple.com/x'],
    ['majúscules', 'https://FCM.googleapis.com/x'],
    ['punt final', 'https://fcm.googleapis.com./x'],
    ['port', 'https://fcm.googleapis.com:443/x'],
    ['credencials', 'https://u@fcm.googleapis.com/x'],
    ['sense camí', 'https://fcm.googleapis.com'],
    ['consulta sense camí', 'https://fcm.googleapis.com?x=/y'],
    ['fragment', 'https://fcm.googleapis.com/x#f'],
    ['massa llarg', `https://fcm.googleapis.com/${'a'.repeat(2048)}`],
    ['espai', 'https://fcm.googleapis.com/a b'],
    ['no ASCII', 'https://fcm.googleapis.com/é'],
    ['http', 'http://fcm.googleapis.com/x'],
    ['un altre servei', 'https://evil.example/x'],
    ['sufix enganyós', 'https://evilpush.apple.com/x'],
    ['subdomini de FCM', 'https://evil.fcm.googleapis.com/x'],
    ['IP literal', 'https://127.0.0.1/x'],
    ['barra inversa', 'https://fcm.googleapis.com\\@evil.com/x']
  ];
  const ACCEPTA_EL_SERVIDOR = [
    'https://fcm.googleapis.com/fcm/send/dQw4w9WgXcQ:APA91bH-opac_0123456789',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABl-opac',
    'https://web.push.apple.com/QGx1bGx5LW9wYWM',
    'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB%2bopac',
    'https://push.apple.com/x',
    'https://notify.windows.com/x',
    'https://a-b.push.apple.com/x',
    'https://-.push.apple.com/x',
    `https://${amfitrioApple(253)}/x`,
    `https://fcm.googleapis.com/${'a'.repeat(2048 - 'https://fcm.googleapis.com/'.length)}`
  ];

  test('el que rebutja el servidor, ho rebutja el client (cap subscripció per a res)', () => {
    for (const [regla, endpoint] of REBUTJA_EL_SERVIDOR) {
      expect(adrecaValidaDelServidor(endpoint), `servidor · ${regla}`).toBe(false);
      expect(formaDeLaSubscripcio({ endpoint }), `client · ${regla}`).toBeNull();
    }
  });

  test('servidor ⊆ client: el que desa el servidor ho accepta el client, tal qual', () => {
    for (const endpoint of ACCEPTA_EL_SERVIDOR) {
      expect(adrecaValidaDelServidor(endpoint), endpoint).toBe(true);
      expect(formaDeLaSubscripcio({ endpoint })?.endpoint, endpoint).toBe(endpoint);
    }
  });

  /* Només els endpoints que URL sap analitzar: el navegador no en pot donar
     cap altre (una subscripció porta una URL vàlida). Un que no s'analitza
     (p. ex. un punycode invàlid, xn--a) el client el rebutja sempre, i el
     worker (webpush.js) també. */
  test('igualtat en un corpus generat: cada amfitrió de 1 a 3 etiquetes amb caràcters de vora, davant dels sufixos admesos', () => {
    const peces = ['', 'a', 'z9', '-', '_', '!', '~', '.', 'A', 'é', '%2e', 'xn--a', 'xn--pple-43d'];
    const sufixos = ['push.apple.com', 'notify.windows.com', 'fcm.googleapis.com'];
    let comprovats = 0;
    let illegibles = 0;
    for (const a of peces) for (const b of peces) for (const sufix of sufixos) {
      for (const amfitrio of [`${a}.${sufix}`, `${a}${b}.${sufix}`, `${a}.${b}.${sufix}`, sufix]) {
        const endpoint = `https://${amfitrio}/x`;
        let client;
        try {
          client = formaDeLaSubscripcio({ endpoint }) !== null;
        } catch {
          client = 'llança';
        }
        if (!URL.canParse(endpoint)) {
          expect(client, endpoint).toBe(false);
          illegibles += 1;
          continue;
        }
        expect(client, endpoint).toBe(adrecaValidaDelServidor(endpoint));
        comprovats += 1;
      }
    }
    expect(comprovats).toBeGreaterThan(1500);
    expect(illegibles).toBeGreaterThan(0);
  });
});
