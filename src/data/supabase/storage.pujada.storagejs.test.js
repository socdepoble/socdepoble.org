// @vitest-environment node
/* F2 (Marató 2230) · Revisió adversarial independent, ronda 1. Les proves de
   storage.pujada.test.js construïxen l'error a mà (errorApi). Ací el construïx
   el client real, @supabase/storage-js 2.112.4 (fetch.ts, handleError), a partir
   d'una resposta HTTP de veres: cos JSON de Storage, HTML d'un proxy, cos buit,
   fetch rebutjat. Així es prova la forma que arriba de debò a errorDePujada, no
   la que suposem. Font de les formes: fetch.ts:66-91 (status del transport,
   statusCode = cos.statusCode || cos.code || status, missatge de
   _getErrorMessage) i les sondes de Codex (/tmp/sdp-f2-adversarial-probe*.json). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { StorageClient } from '@supabase/storage-js';

const m = vi.hoisted(() => ({ fetch: null, uid: '11111111-1a1a-4000-8000-000000000001' }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: (config = {}) => ({ ...config }) }));
vi.mock('./config.js', () => ({ getClient: async () => ({ storage: new StorageClient('https://exemple.invalid/storage/v1', {}, (...args) => m.fetch(...args)) }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => ({ id: m.uid }) }));

import { uploadToStorage } from './storage.js';
import { CODI_BACKEND_INABASTABLE, CODI_MITJANS, esBackendInabastable } from '../errorsBackend.js';

const UID = m.uid;
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const PREFIX = 'No s’ha pogut pujar el fitxer: ';
const RUTA_JWT = `${POBLE}/${UID}/avatars/jwt expired.webp`;
const RUTA_UNAUTH = `${POBLE}/${UID}/avatars/Unauthorized.webp`;

const json = (status, cos, statusText = '') => () => Promise.resolve(new Response(JSON.stringify(cos), { status, statusText, headers: { 'content-type': 'application/json' } }));
const html = (status, cos, statusText) => () => Promise.resolve(new Response(cos, { status, statusText, headers: { 'content-type': 'text/html' } }));
const rebutja = (error) => () => Promise.reject(error);

const CASOS = [
  // Bloquejants de Codex amb la forma real del client.
  ['413 JSON amb «jwt expired» a la ruta', json(413, { statusCode: '413', error: 'Payload too large', message: `Object ${RUTA_JWT} exceeds the size limit` }), CODI_MITJANS.MASSA_GRAN, 413],
  ['413 HTML d’un proxy amb «jwt» al cos', html(413, `<html><title>413</title>${RUTA_JWT}</html>`, 'Payload Too Large'), CODI_MITJANS.MASSA_GRAN, 413],
  /* storage-api respon els errors de Fastify (bodyLimit) amb code InternalError i
     l'estat real: un code que no traduïm no ha de tapar el 413. */
  ['413 de Fastify amb code InternalError', json(413, { statusCode: '413', error: 'FastifyError', code: 'InternalError', message: 'Request body is too large' }), CODI_MITJANS.MASSA_GRAN, 413],
  ['HTTP 400 amb cos 413 i «jwt expired» a la ruta', json(400, { statusCode: '413', error: 'Payload too large', message: RUTA_JWT }), CODI_MITJANS.MASSA_GRAN, 400],
  ['500 amb «Unauthorized» a la ruta', json(500, { statusCode: '500', error: 'Internal', message: `Internal failure at ${RUTA_UNAUTH}` }), CODI_MITJANS.SERVIDOR, 500],
  ['500 amb el missatge exacte «Unauthorized»', json(500, { statusCode: '500', error: 'Internal', message: 'Unauthorized' }), CODI_MITJANS.SERVIDOR, 500],
  ['InvalidJWT amb 403', json(403, { statusCode: '403', code: 'InvalidJWT', error: 'Unauthorized', message: '"exp" claim timestamp check failed' }), CODI_MITJANS.SESSIO, 403],
  ['InvalidJWT sense statusCode al cos (statusCode = code)', json(400, { code: 'InvalidJWT', message: 'jwt expired' }), CODI_MITJANS.SESSIO, 400],
  ['RLS amb HTTP 400 i statusCode «403»', json(400, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' }), CODI_MITJANS.SENSE_PERMIS, 400],
  ['RLS moderna amb AccessDenied', json(403, { statusCode: '403', code: 'AccessDenied', error: 'Unauthorized', message: 'new row violates row-level security policy' }), CODI_MITJANS.SENSE_PERMIS, 403],
  ['NoSuchBucket sense message ni statusCode', json(400, { code: 'NoSuchBucket' }), CODI_MITJANS.SENSE_ESPAI, 400],
  ['NoSuchBucket amb només «error»', json(404, { code: 'NoSuchBucket', error: 'Bucket not found' }), CODI_MITJANS.SENSE_ESPAI, 404],
  ['bucket absent antic, HTTP 400 i statusCode «404»', json(400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' }), CODI_MITJANS.SENSE_ESPAI, 400],
  // JWT antic: sense code, el missatge sencer.
  ['JWT antic amb statusCode «403» i «exp»', json(400, { statusCode: '403', error: 'Unauthorized', message: '"exp" claim timestamp check failed' }), CODI_MITJANS.SESSIO, 400],
  ['JWT antic amb statusCode «400» i «Invalid JWT»', json(400, { statusCode: '400', error: 'Invalid JWT', message: 'invalid signature' }), CODI_MITJANS.SESSIO, 400],
  ['JWT antic sense message: storage-js agafa «error»', json(400, { error: 'Invalid JWT' }), CODI_MITJANS.SESSIO, 400],
  ['code numèric 401 al cos (GoTrue/Kong)', json(400, { code: 401, msg: 'jwt expired' }), CODI_MITJANS.SESSIO, 400],
  // Kong i el transport.
  ['Kong 401 «Invalid API key» amb hint', json(401, { message: 'Invalid API key', hint: 'Double check your Supabase anon or service_role API key.' }), CODI_MITJANS.DESCONEGUT, 401],
  ['Kong 401 «No API key found in request»', json(401, { message: 'No API key found in request' }), CODI_MITJANS.DESCONEGUT, 401],
  ['401 «Unauthorized»', json(401, { message: 'Unauthorized' }), CODI_MITJANS.SESSIO, 401],
  ['502 HTML de Cloudflare', html(502, '<html>Bad gateway</html>', 'Bad Gateway'), CODI_MITJANS.SERVIDOR, 502],
  ['544 DatabaseTimeout', json(544, { statusCode: '544', code: 'DatabaseTimeout', error: 'DatabaseTimeout', message: 'Timeout' }), CODI_MITJANS.SERVIDOR, 544],
  ['415 InvalidMimeType', json(415, { statusCode: '415', code: 'InvalidMimeType', error: 'invalid_mime_type', message: 'mime type image/webp is not supported' }), CODI_MITJANS.FORMAT, 415],
  ['MIME antic amb HTTP 400 i statusCode «415»', json(400, { statusCode: '415', error: 'invalid_mime_type', message: 'mime type image/webp is not supported' }), CODI_MITJANS.FORMAT, 400],
  ['EntityTooLarge amb HTTP 400 genèric', json(400, { statusCode: '400', code: 'EntityTooLarge', message: 'The object exceeded the maximum allowed size' }), CODI_MITJANS.MASSA_GRAN, 400],
  ['409 Duplicate no s’endevina', json(409, { statusCode: '409', code: 'Duplicate', error: 'Duplicate', message: 'The resource already exists' }), CODI_MITJANS.DESCONEGUT, 409],
  ['cos «null»', json(400, null), CODI_MITJANS.DESCONEGUT, 400],
  ['429 amb text de JWT no és sessió', json(429, { statusCode: '429', message: 'jwt expired' }), CODI_MITJANS.DESCONEGUT, 429],
  // Sense resposta: fetch rebutjat.
  ['Chrome «Failed to fetch»', rebutja(new TypeError('Failed to fetch')), CODI_BACKEND_INABASTABLE, undefined],
  ['Safari «Load failed»', rebutja(new TypeError('Load failed')), CODI_BACKEND_INABASTABLE, undefined],
  ['Firefox «NetworkError…»', rebutja(new TypeError('NetworkError when attempting to fetch resource.')), CODI_BACKEND_INABASTABLE, undefined],
  ['AbortError no és inabastable', rebutja(new DOMException('The operation was aborted.', 'AbortError')), CODI_MITJANS.DESCONEGUT, undefined],
  ['TypeError d’argument no és inabastable', rebutja(new TypeError("Failed to execute 'fetch' on 'Window': Invalid value")), CODI_MITJANS.DESCONEGUT, undefined],
  ['TypeError amb «Failed to fetch» dins una ruta', rebutja(new TypeError(`Cannot open ${POBLE}/Failed to fetch/x.webp`)), CODI_MITJANS.DESCONEGUT, undefined],
  ['resposta opaca amb estat 0', () => Promise.resolve({ ok: false, status: 0, statusText: '', json: () => Promise.reject(new SyntaxError('opac')) }), CODI_BACKEND_INABASTABLE, undefined]
];

describe('errorDePujada amb l’error que construïx storage-js 2.112.4', () => {
  let avis;
  beforeEach(() => { avis = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { avis.mockRestore(); m.fetch = null; });

  test.each(CASOS)('%s', async (_nom, resposta, codi, status) => {
    m.fetch = resposta;
    const error = await uploadToStorage(new Blob(['SENTINELLA_CRU_7f3a'], { type: 'image/webp' }), { carpeta: 'avatars' }, { tenantId: POBLE }).catch((e) => e);
    expect(error.cause?.__isStorageError).toBe(true);
    expect({ codi: error.codi, status: error.status }).toEqual({ codi, status });
    expect(error.message.startsWith(PREFIX)).toBe(true);
    expect(esBackendInabastable(error)).toBe(codi === CODI_BACKEND_INABASTABLE);
    const consola = JSON.stringify(avis.mock.calls);
    for (const secret of [UID, POBLE, 'avatars', 'jwt expired', 'Unauthorized.webp', 'Failed to fetch/', error.cause.message].filter(Boolean)) {
      expect(error.message).not.toContain(secret);
      expect(consola).not.toContain(secret);
    }
  });
});
