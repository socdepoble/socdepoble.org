// @vitest-environment node
/* F2 (ordre del Mestre, 261004; pla 2045, Marató 2230) · Pujada d'avatars.
   Abans, qualsevol rebuig de Storage (xarxa, bucket absent, RLS, JWT, mida,
   format o 5xx) eixia com el mateix «No s’ha pogut pujar el fitxer», perquè
   storage.js llegia un `message` que handleError no torna mai. Estes proves
   fixen la traducció al vocabulari neutral del port (CODI_MITJANS), l'ordre de
   classificació (el JWT abans del 403) i que el missatge no porta ni la ruta,
   ni l'uid, ni el poble, ni el text cru del proveïdor. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ upload: vi.fn(), usuari: null }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: (config = {}) => ({ ...config }) }));
vi.mock('./config.js', () => ({ getClient: async () => ({ storage: { from: (bucket) => ({ upload: (...args) => m.upload(bucket, ...args) }) } }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.usuari }));

import { errorDePujada, uploadToStorage } from './storage.js';
import { CODI_BACKEND_INABASTABLE, CODI_MITJANS, esBackendInabastable } from '../errorsBackend.js';

const LITERAL_SOL = 'No s’ha pogut pujar el fitxer';
const PREFIX = `${LITERAL_SOL}: `;
const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';

/* Les dues formes de storage-js 2.x: StorageApiError (el servidor ha respost;
   `status` és l'HTTP i `statusCode` ve del cos) i StorageUnknownError (no hi ha
   resposta; porta l'error de fetch a `originalError`). */
const errorApi = (message, status, statusCode, code) =>
  Object.assign(new Error(message), { name: 'StorageApiError', __isStorageError: true, status, statusCode, code });
const errorSenseResposta = (message, originalError) =>
  Object.assign(new Error(message), { name: 'StorageUnknownError', __isStorageError: true, originalError });

const CASOS = [
  ['RLS amb HTTP 400 i statusCode 403', errorApi('new row violates row-level security policy', 400, '403'), CODI_MITJANS.SENSE_PERMIS],
  ['403 real amb AccessDenied', errorApi('', 403, undefined, 'AccessDenied'), CODI_MITJANS.SENSE_PERMIS],
  ['bucket absent amb HTTP 400 i statusCode 404', errorApi('Bucket not found', 400, '404'), CODI_MITJANS.SENSE_ESPAI],
  ['JWT caducat amb statusCode 403: sessió, no permís', errorApi('"exp" claim timestamp check failed', 400, '403'), CODI_MITJANS.SESSIO],
  ['JWT invàlid pel codi del cos', errorApi('invalid signature', 400, '400', 'InvalidJWT'), CODI_MITJANS.SESSIO],
  ['401', errorApi('Unauthorized', 401, '401'), CODI_MITJANS.SESSIO],
  ['413', errorApi('', 413), CODI_MITJANS.MASSA_GRAN],
  ['massa gran pel codi del cos', errorApi('The object exceeded the maximum allowed size', 400, '413', 'EntityTooLarge'), CODI_MITJANS.MASSA_GRAN],
  ['415 per MIME', errorApi('mime type image/webp is not supported', 415, '415', 'InvalidMimeType'), CODI_MITJANS.FORMAT],
  ['502', errorApi('Bad Gateway', 502, '502'), CODI_MITJANS.SERVIDOR],
  ['fetch sense resposta', errorSenseResposta('Failed to fetch', new TypeError('Failed to fetch')), CODI_BACKEND_INABASTABLE],
  ['Safari sense resposta', errorSenseResposta('Load failed', new TypeError('Load failed')), CODI_BACKEND_INABASTABLE],
  ['418 sense traducció', errorApi('I am a teapot', 418, '418'), CODI_MITJANS.DESCONEGUT]
];

describe('errorDePujada · taula de classificació', () => {
  test.each(CASOS)('%s', (_nom, cru, codi) => {
    const error = errorDePujada(cru);
    expect(error).toBeInstanceOf(Error);
    expect(error.codi).toBe(codi);
    expect(error.cause).toBe(cru);
    expect(error.message.startsWith(PREFIX)).toBe(true);
    // Cap text cru del proveïdor arriba a la vista (errorsBackend.js:2-5).
    if (cru.message) expect(error.message).not.toContain(cru.message);
    if (cru.code) expect(error.message).not.toContain(cru.code);
  });

  test('el desconegut porta només l’estat HTTP; sense estat, cap número inventat', () => {
    expect(errorDePujada(errorApi('I am a teapot', 418, '418'))).toMatchObject({
      codi: CODI_MITJANS.DESCONEGUT, status: 418, message: `${PREFIX}error inesperat del servidor (HTTP 418).`
    });
    const senseEstat = errorDePujada(errorSenseResposta('Unexpected token < in JSON', new SyntaxError('x')));
    expect(senseEstat.codi).toBe(CODI_MITJANS.DESCONEGUT);
    expect(senseEstat.message).toBe(`${PREFIX}error inesperat.`);
    expect(senseEstat.status).toBeUndefined();
  });

  test('una pujada sense resposta és «inabastable» per a tot el port', () => {
    const error = errorDePujada(errorSenseResposta('Failed to fetch', new TypeError('Failed to fetch')));
    expect(esBackendInabastable(error)).toBe(true);
    expect(esBackendInabastable(errorDePujada(errorApi('Bad Gateway', 502, '502')))).toBe(false);
  });

  test('el vocabulari està congelat i no repetix cap codi', () => {
    expect(Object.isFrozen(CODI_MITJANS)).toBe(true);
    const codis = Object.values(CODI_MITJANS);
    expect(new Set([...codis, CODI_BACKEND_INABASTABLE]).size).toBe(codis.length + 1);
  });
});

/* Poliment F2 (revisió de Codex, Marató 2230) · Cada branca de codiDePujada,
   sola: un cas que només casa per l'estat i un altre que només casa pel text,
   perquè llevar qualsevol de les dos meitats d'una condició tombe una prova. */
/* Sentinella del text cru (Relleu 20 de Codex): un string únic que cap frase
   valenciana pot contindre. Amb 'x', «connexió» el contenia i l'asserció de
   privacitat fallava pel motiu equivocat. */
const CRU = 'SENTINELLA_CRU_7f3a';
const BRANQUES = [
  // Xarxa: el propi error (sense embolcall) i només l'originalError (embolcall mut).
  ['xarxa · el propi error porta el codi neutral', Object.assign(new Error(CRU), { codi: CODI_BACKEND_INABASTABLE }), CODI_BACKEND_INABASTABLE],
  ['xarxa · el propi error porta l’estat 0', Object.assign(new Error(CRU), { status: 0 }), CODI_BACKEND_INABASTABLE],
  ['xarxa · el TypeError de fetch cru, sense embolcall', new TypeError('Failed to fetch'), CODI_BACKEND_INABASTABLE],
  ['xarxa · només l’originalError: Firefox amb l’embolcall mut', errorSenseResposta('error opac', new TypeError('NetworkError when attempting to fetch resource.')), CODI_BACKEND_INABASTABLE],
  ['xarxa · només l’originalError: React Native amb l’embolcall mut', errorSenseResposta('error opac', new TypeError('Network request failed')), CODI_BACKEND_INABASTABLE],
  // Espai: l'estat sol i el text sol.
  ['espai · 404 sense «Bucket not found»', errorApi('', 404), CODI_MITJANS.SENSE_ESPAI],
  ['espai · «Bucket not found» sense 404', errorApi('Bucket not found', 400, '400'), CODI_MITJANS.SENSE_ESPAI],
  ['espai · NoSuchBucket sense 404', errorApi('', 400, '400', 'NoSuchBucket'), CODI_MITJANS.SENSE_ESPAI],
  // Format: l'estat sol i el text sol.
  ['format · 415 sol', errorApi('', 415), CODI_MITJANS.FORMAT],
  ['format · «mime type» sol', errorApi('mime type text/html is not supported', 400, '400'), CODI_MITJANS.FORMAT],
  /* Sessió: el Storage antic respon {statusCode: '400', error: 'Invalid JWT',
     message: …} sense `code`, i storage-js 2.112 en conserva només `message`. */
  ['sessió · JWT antic tal com el construïx storage-js', errorApi('invalid signature', 400, '400'), CODI_MITJANS.SESSIO],
  ['sessió · JWS mal format del Storage antic', errorApi('Invalid Compact JWS', 400, '400'), CODI_MITJANS.SESSIO],
  ['sessió · el cos cru del Storage antic', { statusCode: '400', error: 'Invalid JWT', message: 'invalid signature' }, CODI_MITJANS.SESSIO],
  // Configuració: la clau pública rebutjada per Kong no és la sessió.
  ['configuració · 401 «Invalid API key»', errorApi('Invalid API key', 401, '401'), CODI_MITJANS.DESCONEGUT],
  ['configuració · 401 «No API key found in request»', errorApi('No API key found in request', 401, '401'), CODI_MITJANS.DESCONEGUT],
  /* No són «el servidor no respon», encara que l'embolcall diga «fetch»: un
     TypeError d'argument (bug del client) i l'AbortError de Safari. */
  ['no inabastable · TypeError d’argument de fetch', errorSenseResposta("Failed to execute 'fetch' on 'Window': Invalid value", new TypeError("Failed to execute 'fetch' on 'Window': Invalid value")), CODI_MITJANS.DESCONEGUT],
  ['no inabastable · AbortError de Safari', errorSenseResposta('Fetch is aborted', new DOMException('Fetch is aborted', 'AbortError')), CODI_MITJANS.DESCONEGUT]
];

describe('errorDePujada · cada branca, sola', () => {
  test.each(BRANQUES)('%s', (_nom, cru, codi) => {
    const error = errorDePujada(cru);
    expect(error.codi).toBe(codi);
    expect(error.cause).toBe(cru);
    expect(error.message.startsWith(PREFIX)).toBe(true);
    if (cru.message) expect(error.message).not.toContain(cru.message);
    expect(esBackendInabastable(error)).toBe(codi === CODI_BACKEND_INABASTABLE);
  });

  test('la clau pública rebutjada porta l’estat HTTP i no parla de la sessió', () => {
    const error = errorDePujada(errorApi('Invalid API key', 401, '401'));
    expect(error).toMatchObject({ codi: CODI_MITJANS.DESCONEGUT, status: 401, message: `${PREFIX}error inesperat del servidor (HTTP 401).` });
    expect(error.message).not.toContain('sessió');
  });

  test('l’AbortError i el TypeError d’argument cauen a «error inesperat», sense estat', () => {
    for (const nom of ['no inabastable · TypeError d’argument de fetch', 'no inabastable · AbortError de Safari']) {
      const [, cru] = BRANQUES.find(([n]) => n === nom);
      expect(errorDePujada(cru)).toMatchObject({ message: `${PREFIX}error inesperat.`, status: undefined });
    }
  });

  test('el JWT antic conserva l’estat HTTP 400 i diu que la sessió no val', () => {
    const error = errorDePujada({ statusCode: '400', error: 'Invalid JWT', message: 'invalid signature' });
    expect(error).toMatchObject({ codi: CODI_MITJANS.SESSIO, status: 400, message: `${PREFIX}la sessió ha caducat. Torna a entrar i repeteix-ho.` });
  });
});

/* Bloquejant de Codex (Relleus 13, 17 i 21 de 261004_2240_auditoria_codex;
   sondes /tmp/sdp-f2-adversarial-probe.json i -current.json). Abans, les
   expressions miraven el missatge sencer, ruta inclosa, abans que l'estat: un
   413 amb «jwt» al nom del fitxer eixia com a sessió i un 500 amb
   «Unauthorized» a la ruta, com a permís. Regla: les dades estructurades manen
   (code exacte de Storage, després l'estat del cos i el de la resposta, i el
   missatge sencer només de reserva). El nom porta el de la sonda de Codex. */
const SONDES = [
  // Les cinc de la sonda viva (-current.json) i les de l'anterior.
  ['HTTP413_with_jwt_path · jwtAlPathNoSessio', errorApi('Object users/jwt/avatar.png exceeds the size limit', 413, '413'), CODI_MITJANS.MASSA_GRAN],
  ['HTTP413_with_jwt_path · sense statusCode al cos', errorApi('users/jwt expired/avatar.png', 413), CODI_MITJANS.MASSA_GRAN],
  ['HTTP500_with_Unauthorized_path · unauthorizedAlPathNoPermis', errorApi('Internal failure at users/Unauthorized/avatar.png', 500, '500'), CODI_MITJANS.SERVIDOR],
  ['NoSuchBucket_structured_code · bucketCodeSenseMissatge', errorApi('', 400, undefined, 'NoSuchBucket'), CODI_MITJANS.SENSE_ESPAI],
  ['NoSuchBucket a statusCode (storage-js hi copia el code si el cos no porta statusCode)', errorApi('', 400, 'NoSuchBucket'), CODI_MITJANS.SENSE_ESPAI],
  ['el code exacte mana també sobre un HTTP 500', errorApi(CRU, 500, 'NoSuchBucket'), CODI_MITJANS.SENSE_ESPAI],
  ['InvalidJWT_with_403 · invalidJwtCode403', errorApi('', 403, '403', 'InvalidJWT'), CODI_MITJANS.SESSIO],
  ['expired_claim_with_body403', errorApi('"exp" claim timestamp check failed', 400, '403'), CODI_MITJANS.SESSIO],
  ['bucketBody404', errorApi('Bucket not found', 400, '404'), CODI_MITJANS.SENSE_ESPAI],
  ['RLS amb statusCode 403 en text', errorApi('new row violates row-level security policy', 400, '403'), CODI_MITJANS.SENSE_PERMIS],
  // El code ha de ser exacte i propi: ni un tros, ni una clau heretada.
  ['un code que només conté InvalidJWT no és InvalidJWT', errorApi('Object upload failed', 413, '413', 'ObjectKeyInvalidJWT'), CODI_MITJANS.MASSA_GRAN],
  ['«constructor» no és cap code de Storage', errorApi(CRU, 400, '400', 'constructor'), CODI_MITJANS.DESCONEGUT],
  // L'estat del cos mana sobre l'HTTP genèric; cap paraula de la ruta el torça.
  ['HTTP 400 amb cos 413 i jwt a la ruta', errorApi('users/jwt/avatar.png', 400, '413'), CODI_MITJANS.MASSA_GRAN],
  ['403 amb jwt a la ruta continua sent permís', errorApi('users/jwt/avatar.png is not accessible', 403, '403'), CODI_MITJANS.SENSE_PERMIS],
  ['403 amb «jwt expired» dins la ruta continua sent permís', errorApi('users/jwt expired/avatar.png', 403, '403'), CODI_MITJANS.SENSE_PERMIS],
  ['cos 404 mana sobre un missatge de JWT', errorApi('invalid signature', 400, '404'), CODI_MITJANS.SENSE_ESPAI],
  ['cos 500 mana sobre HTTP 403', errorApi('Object upload failed', 403, '500'), CODI_MITJANS.SERVIDOR],
  ['cos 403 mana sobre HTTP 500', errorApi('Object upload failed', 500, '403'), CODI_MITJANS.SENSE_PERMIS],
  ['500 amb un missatge de JWT continua sent servidor', errorApi('jwt expired', 500, '500'), CODI_MITJANS.SERVIDOR],
  ['418 no es traduïx pel text de JWT', errorApi('jwt expired', 418, '418'), CODI_MITJANS.DESCONEGUT],
  ['un statusCode hexadecimal no és un estat', errorApi('', 400, '0x193'), CODI_MITJANS.DESCONEGUT],
  // Clau pública de Kong: el missatge sencer, mai un tros de ruta.
  ['500 amb «Invalid API key» a la ruta continua sent servidor', errorApi('users/Invalid API key/avatar.png', 500, '500'), CODI_MITJANS.SERVIDOR],
  ['401 amb «API key» a la ruta és sessió', errorApi('users/API key/avatar.png', 401, '401'), CODI_MITJANS.SESSIO],
  // Reserva: 400 genèric o sense estat, i només frases completes del servidor.
  ['JWT caducat de jsonwebtoken amb 400', errorApi('jwt expired', 400, '400'), CODI_MITJANS.SESSIO],
  ['JWT caducat de jsonwebtoken amb 403 i sense code', errorApi('jwt expired', 403, '403'), CODI_MITJANS.SESSIO],
  ['«Invalid JWT» del camp error quan el cos no porta message', errorApi('Invalid JWT', 400, '400'), CODI_MITJANS.SESSIO],
  ['«invalid signature» dins la ruta no és sessió', errorApi('users/invalid signature/avatar.png', 400, '400'), CODI_MITJANS.DESCONEGUT],
  ['«Bucket not found» dins la ruta no és espai absent', errorApi('users/Bucket not found/avatar.png', 400, '400'), CODI_MITJANS.DESCONEGUT],
  ['«Unauthorized» dins la ruta no és permís', errorApi('users/Unauthorized/avatar.png', 400, '400'), CODI_MITJANS.DESCONEGUT],
  ['«maximum allowed size» dins la ruta no és massa gran', errorApi('users/maximum allowed size/avatar.png', 400, '400'), CODI_MITJANS.DESCONEGUT],
  ['«mime type» dins la ruta no és format', errorApi('users/mime type/avatar.png', 400, '400'), CODI_MITJANS.DESCONEGUT],
  ['RLS amb el sufix de Postgres i sense estat', { message: 'new row violates row-level security policy for table "objects"' }, CODI_MITJANS.SENSE_PERMIS],
  // Sense resposta: cap estat HTTP i, si l'única prova és un TypeError, el text sencer.
  ['«Failed to fetch» dins la ruta d’un TypeError no és xarxa', new TypeError('Cannot read users/Failed to fetch/avatar.png'), CODI_MITJANS.DESCONEGUT],
  ['un JSON trencat que diu «fetch» no és xarxa', errorSenseResposta('Unexpected JSON while reading fetch/avatar', new SyntaxError(CRU)), CODI_MITJANS.DESCONEGUT],
  ['l’AbortError cru, sense embolcall, no és xarxa', new DOMException('Fetch is aborted', 'AbortError'), CODI_MITJANS.DESCONEGUT],
  ['el TypeError d’argument cru, sense embolcall, no és xarxa', new TypeError("Failed to execute 'fetch' on 'Window': Invalid value"), CODI_MITJANS.DESCONEGUT],
  ['Firefox exacte sense resposta continua sent xarxa', errorSenseResposta('NetworkError when attempting to fetch resource.', new TypeError('NetworkError when attempting to fetch resource.')), CODI_BACKEND_INABASTABLE],
  ['un TypeError de xarxa amb estat HTTP no és «el servidor no respon»', Object.assign(new TypeError('Failed to fetch'), { status: 502 }), CODI_MITJANS.SERVIDOR]
];

describe('errorDePujada · sonda adversarial de Codex: les dades estructurades manen', () => {
  test.each(SONDES)('%s', (_nom, cru, codi) => {
    const error = errorDePujada(cru);
    expect(error.codi).toBe(codi);
    expect(error.cause).toBe(cru);
    expect(error.message.startsWith(PREFIX)).toBe(true);
    if (cru.message) expect(error.message).not.toContain(cru.message);
    expect(error.message).not.toContain(CRU);
    expect(esBackendInabastable(error)).toBe(codi === CODI_BACKEND_INABASTABLE);
  });

  test('un estat que no és un enter de tres xifres no arriba al missatge', () => {
    const error = errorDePujada(errorApi(CRU, `${UID}/avatars`, '0x193'));
    expect(error).toMatchObject({ codi: CODI_MITJANS.DESCONEGUT, status: undefined, message: `${PREFIX}error inesperat.` });
    expect(errorDePujada(errorApi(CRU, 400, `${UID}/avatars`))).toMatchObject({ status: 400, message: `${PREFIX}error inesperat del servidor (HTTP 400).` });
  });
});

describe('regressió · el literal sol ja no pot eixir', () => {
  test.each([...CASOS.map(([nom, cru]) => [nom, cru]), ...SONDES.map(([nom, cru]) => [nom, cru]), ['null', null], ['objecte buit', {}], ['text', 'error']])('%s', (_nom, cru) => {
    const { message } = errorDePujada(cru);
    expect(message).not.toBe(LITERAL_SOL);
    expect(message.length).toBeGreaterThan(PREFIX.length);
  });
});

describe('uploadToStorage · privacitat del rebuig', () => {
  let avis;
  beforeEach(() => {
    m.upload.mockReset();
    m.usuari = { id: UID };
    avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { avis.mockRestore(); });

  test('un 403 de Storage ix amb codi neutral; ni el missatge ni la consola porten ruta, uid o poble', async () => {
    const cru = errorApi('new row violates row-level security policy', 403, '403', 'AccessDenied');
    m.upload.mockResolvedValue({ data: null, error: cru });
    const fitxer = new Blob(['x'], { type: 'image/webp' });
    const error = await uploadToStorage(fitxer, { carpeta: 'avatars' }, { tenantId: POBLE }).catch((e) => e);

    const [bucket, ruta] = m.upload.mock.calls[0];
    expect(bucket).toBe('mitjans');
    expect(ruta.startsWith(`${POBLE}/${UID}/avatars/`)).toBe(true);
    expect(error).toMatchObject({ codi: CODI_MITJANS.SENSE_PERMIS, status: 403, cause: cru });
    expect(error.message).toBe(`${PREFIX}el servidor no t’ha donat permís per a guardar-lo ací.`);
    for (const secret of [UID, POBLE, 'sdp-media', '/avatars/', 'row-level']) expect(error.message).not.toContain(secret);

    expect(avis).toHaveBeenCalledTimes(1);
    expect(avis).toHaveBeenCalledWith('[Storage] pujada rebutjada', { codi: CODI_MITJANS.SENSE_PERMIS, status: 403, statusCode: 403, code: 'AccessDenied' });
    const consola = JSON.stringify(avis.mock.calls);
    for (const secret of [UID, POBLE, 'avatars', ruta]) expect(consola).not.toContain(secret);
  });

  /* Relleu 21 de Codex (/tmp/sdp-f2-console-privacy-red.log): la consola copiava
     code, statusCode i status crus. Un proveïdor que hi pose la ruta del fitxer
     hi deixava el poble i l'uid. Ara només ix el que s'ha validat: un estat HTTP
     de tres xifres o un code de Storage que traduïm. */
  test.each(['code', 'statusCode', 'status'])('un %s desconegut no porta metadades privades a la consola', async (camp) => {
    const privat = `inesperat:${POBLE}/${UID}/avatars/logotip.webp`;
    const cru = errorApi(`Object upload failed at ${privat}`, 400, '400');
    cru[camp] = privat;
    m.upload.mockResolvedValue({ data: null, error: cru });
    const error = await uploadToStorage(new Blob(['x'], { type: 'image/webp' }), { carpeta: 'avatars' }, { tenantId: POBLE }).catch((e) => e);
    expect(error).toMatchObject({ codi: CODI_MITJANS.DESCONEGUT, status: 400, cause: cru });
    expect(avis).toHaveBeenCalledTimes(1);
    const consola = JSON.stringify(avis.mock.calls);
    for (const secret of [UID, POBLE, 'avatars', privat, 'inesperat:', cru.message]) {
      expect(error.message).not.toContain(secret);
      expect(consola).not.toContain(secret);
    }
    const [[, dades]] = avis.mock.calls;
    expect(dades).toEqual({
      codi: CODI_MITJANS.DESCONEGUT,
      status: camp === 'status' ? undefined : 400,
      statusCode: camp === 'statusCode' ? undefined : 400,
      code: undefined
    });
  });

  test('les validacions locals conserven el seu missatge i no arriben a Storage', async () => {
    await expect(uploadToStorage(new Blob(['x'], { type: 'text/plain' }), { carpeta: 'avatars' }, { tenantId: POBLE }))
      .rejects.toThrow('Format de fitxer no admés en este destí');
    expect(m.upload).not.toHaveBeenCalled();
    expect(avis).not.toHaveBeenCalled();
  });

  test('una pujada acceptada no avisa i torna la referència opaca', async () => {
    m.upload.mockResolvedValue({ data: { path: 'x' }, error: null });
    const resultat = await uploadToStorage(new Blob(['x'], { type: 'image/webp' }), { carpeta: 'avatars' }, { tenantId: POBLE });
    expect(resultat.url.startsWith(`sdp-media://mitjans/${POBLE}/${UID}/avatars/`)).toBe(true);
    expect(avis).not.toHaveBeenCalled();
  });
});
