// @vitest-environment node
/* F2 (ordre del Mestre, 261004; pla 2045, Marató 2230) · Privacitat de la
   consola a la resta de storage.js. La pujada ja només registrava dades
   validades (storage.pujada.test.js); resolveAsset i promoteToPublic encara hi
   escrivien la ruta privada (poble/uid/carpeta/fitxer), l'Error sencer de
   Storage o el text cru que torna handleError quan l'SDK llança. Casos de la
   proposta de Codex 261005_0112_produccio_proposta_f2_storage_privacitat_completa
   (Relleu 24), revalidats sobre el storage.js de l'01:00:23: els rebuigs i les
   excepcions eren rojos abans de la correcció; els èxits són controls que ja
   eren verds. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ firma: vi.fn(), baixa: vi.fn(), puja: vi.fn(), publica: vi.fn() }));
vi.mock('./config.js', () => ({ getClient: async () => ({ storage: { from: (bucket) => ({
  createSignedUrl: (...args) => m.firma(bucket, ...args),
  download: (...args) => m.baixa(bucket, ...args),
  upload: (...args) => m.puja(bucket, ...args),
  getPublicUrl: (...args) => m.publica(bucket, ...args)
}) } }) }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: (config = {}) => ({ ...config }) }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => () => {}, usuariDeSessio: () => null }));

import { promoteToPublic, resolveAsset } from './storage.js';
import { CODI_MITJANS, CODI_PROMOCIO_PUBLICA } from '../errorsBackend.js';
import { createHash } from 'node:crypto';
import { WEBP_NET } from '../../../tests/helpers/mitjansPublicsNets.js';

const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const RUTA = `${POBLE}/${UID}/notes/document-privat.webp`;
const REF = `sdp-media://mitjans_privats/${RUTA}`;
const FITXER = new Blob([WEBP_NET], { type: 'image/webp' });
const RUTA_PUBLICA = `${POBLE}/${UID}/notes/sdp-net-v1-${createHash('sha256').update(WEBP_NET).digest('hex')}.webp`;
const CONFIG = { tenantId: POBLE };

/* Un rebuig amb dades privades a tots els camps lliures: el missatge, un code i
   un statusCode que no són de Storage, i uns details que ningú ha de tocar. */
const errorPrivat = (camps = {}) => Object.assign(new Error(`Object ${RUTA} rejected`), {
  status: 403, code: `inesperat:${RUTA}`, statusCode: `privat:${UID}`, details: { ruta: RUTA, poble: POBLE }
}, camps);
// Les úniques claus que pot portar una diagnosi (storage.js, diagnosiDeStorage).
const CLAUS = ['code', 'codi', 'status', 'statusCode'];
const PERMIS_403 = { codi: CODI_MITJANS.SENSE_PERMIS, status: 403, statusCode: undefined, code: undefined };
const DESCONEGUT_SENSE_ESTAT = { codi: CODI_MITJANS.DESCONEGUT, status: undefined, statusCode: undefined, code: undefined };

let avis;
beforeEach(() => {
  Object.values(m).forEach((fn) => fn.mockReset());
  m.baixa.mockResolvedValue({ data: FITXER, error: null });
  m.puja.mockResolvedValue({ data: { path: RUTA }, error: null });
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { avis.mockRestore(); });

/** Un sol avís: un text fix i unes dades validades, sense cap secret enlloc. */
function comprovaAvis(cru, esperat) {
  expect(avis).toHaveBeenCalledOnce();
  const [crida] = avis.mock.calls;
  expect(crida).toHaveLength(2);
  const [text, dades] = crida;
  expect(text.startsWith('[Storage] ')).toBe(true);
  // toEqual no distingix una clau absent d'una undefined: les claus, a banda.
  expect(Object.keys(dades).sort()).toEqual(CLAUS);
  expect(dades).toEqual(esperat);
  const consola = JSON.stringify(avis.mock.calls);
  for (const secret of [RUTA, UID, POBLE, REF, 'document-privat', 'inesperat:', 'privat:', cru.message]) {
    expect(consola).not.toContain(secret);
  }
  // L'original no es toca: qui depure el té a `cause` o al retorn.
  expect(cru.details).toEqual({ ruta: RUTA, poble: POBLE });
}

describe('resolveAsset · la URL firmada', () => {
  test('rebutjada: torna la ref i la consola no porta ni la ruta ni el text cru', async () => {
    const cru = errorPrivat();
    m.firma.mockResolvedValue({ data: null, error: cru });
    expect(await resolveAsset(REF, CONFIG)).toBe(REF);
    expect(m.firma).toHaveBeenCalledWith('mitjans_privats', RUTA, 3600);
    comprovaAvis(cru, PERMIS_403);
  });

  test('un estat fraccionari no es registra com a estat HTTP', async () => {
    const cru = errorPrivat({ status: 403.5, statusCode: '403.5' });
    m.firma.mockResolvedValue({ data: null, error: cru });
    expect(await resolveAsset(REF, CONFIG)).toBe(REF);
    comprovaAvis(cru, DESCONEGUT_SENSE_ESTAT);
  });

  test('el que és validat continua arribant: un code de Storage i els dos estats', async () => {
    const cru = errorPrivat({ status: 400, statusCode: '404', code: 'NoSuchBucket' });
    m.firma.mockResolvedValue({ data: null, error: cru });
    expect(await resolveAsset(REF, CONFIG)).toBe(REF);
    comprovaAvis(cru, { codi: CODI_MITJANS.SENSE_ESPAI, status: 400, statusCode: 404, code: 'NoSuchBucket' });
  });

  test('control · l’èxit conserva el TTL de 3600 s i no avisa', async () => {
    const signada = 'https://media.invalid/signed/privat?token=sintetic';
    m.firma.mockResolvedValue({ data: { signedUrl: signada }, error: null });
    expect(await resolveAsset(REF, CONFIG)).toBe(signada);
    expect(m.firma).toHaveBeenCalledWith('mitjans_privats', RUTA, 3600);
    expect(avis).not.toHaveBeenCalled();
  });

  test('control · el bucket públic va per getPublicUrl i no avisa', async () => {
    m.publica.mockReturnValue({ data: { publicUrl: 'https://media.invalid/public/x.webp' } });
    expect(await resolveAsset('sdp-media://mitjans/x.webp', CONFIG)).toBe('https://media.invalid/public/x.webp');
    expect(m.publica).toHaveBeenCalledWith('mitjans', 'x.webp');
    expect(m.firma).not.toHaveBeenCalled();
    expect(avis).not.toHaveBeenCalled();
  });
});

describe('promoteToPublic · la còpia del privat al públic', () => {
  test('la baixada rebutjada no puja, torna la ref i la consola queda neta', async () => {
    const cru = errorPrivat();
    m.baixa.mockResolvedValue({ data: null, error: cru });
    expect(await promoteToPublic(REF, CONFIG)).toBe(REF);
    expect(m.baixa).toHaveBeenCalledWith('mitjans_privats', RUTA, undefined, { signal: expect.any(AbortSignal) });
    expect(m.puja).not.toHaveBeenCalled();
    comprovaAvis(cru, PERMIS_403);
  });

  /* Gauntlet R22 (sql-02) · Una pujada rebutjada que no és el duplicat atura la
     publicació: mai la ref privada al payload del Mur. L'error no porta cap
     dada privada al missatge; la pujada traduïda va a `cause`. */
  const rebuigDePromocio = async (cru) => {
    let error;
    await promoteToPublic(REF, CONFIG).then((valor) => { throw new Error(`havia de rebutjar i ha tornat ${valor}`); }, (e) => { error = e; });
    expect(error).toBeInstanceOf(Error);
    expect(error.codi).toBe(CODI_PROMOCIO_PUBLICA);
    expect(error.cause).toBeInstanceOf(Error);
    expect(Object.values(CODI_MITJANS)).toContain(error.cause.codi);
    expect(error.cause.cause).toBe(cru);
    for (const secret of [RUTA, UID, POBLE, REF, 'document-privat']) {
      expect(error.message).not.toContain(secret);
      expect(error.cause.message).not.toContain(secret);
    }
    return error;
  };

  test('la pujada rebutjada atura la publicació (rebutja amb el codi de promoció) i la consola queda neta', async () => {
    const cru = errorPrivat();
    m.puja.mockResolvedValue({ data: null, error: cru });
    expect((await rebuigDePromocio(cru)).cause.codi).toBe(CODI_MITJANS.SENSE_PERMIS);
    expect(m.puja).toHaveBeenCalledWith('mitjans', RUTA_PUBLICA, expect.any(Blob));
    comprovaAvis(cru, PERMIS_403);
  });

  /* Gauntlet R22 (sql-02) · La sonda del bloc B sobre PG 18.6: tornar a publicar la
     mateixa foto després d'una retirada topa amb el guard de la cua de purga
     (SDP-PURGA-004, 55000), no amb el 23505 del duplicat. Abans tornava la ref privada. */
  test('R22 · SDP-PURGA-004 (55000, ruta a la cua de purga) no és cap duplicat: atura la publicació', async () => {
    const cru = Object.assign(new Error('SDP-PURGA-004: ruta en procés de purga.'), { status: 400, statusCode: '500', code: '55000' });
    m.puja.mockResolvedValue({ data: null, error: cru });
    await rebuigDePromocio(cru);
    expect(m.baixa).toHaveBeenCalledTimes(1);
    expect(m.baixa).not.toHaveBeenCalledWith('mitjans', expect.anything(), expect.anything(), expect.anything());
  });

  /* Quan l'SDK llança, downloadFile i uploadFile tornen handleError(error), i el
     seu `error` és el missatge cru (utils.js:66-70): un text amb la ruta. */
  test('una excepció de l’SDK durant la baixada no imprimix el text cru i torna la ref', async () => {
    const cru = errorPrivat();
    m.baixa.mockRejectedValue(cru);
    expect(await promoteToPublic(REF, CONFIG)).toBe(REF);
    comprovaAvis(cru, DESCONEGUT_SENSE_ESTAT);
  });

  test('una excepció de l’SDK durant la pujada no imprimix el text cru i atura la publicació', async () => {
    const cru = errorPrivat();
    m.puja.mockRejectedValue(cru);
    let error;
    await promoteToPublic(REF, CONFIG).then((valor) => { throw new Error(`havia de rebutjar i ha tornat ${valor}`); }, (e) => { error = e; });
    expect(error).toMatchObject({ codi: CODI_PROMOCIO_PUBLICA });
    expect(error.cause.codi).toBe(CODI_MITJANS.DESCONEGUT);
    for (const secret of [RUTA, UID, POBLE, REF, 'document-privat']) expect(`${error.message} ${error.cause.message}`).not.toContain(secret);
    comprovaAvis(cru, DESCONEGUT_SENSE_ESTAT);
  });

  test('control · l’èxit torna la ruta pública i no avisa', async () => {
    expect(await promoteToPublic(REF, CONFIG)).toBe(`sdp-media://mitjans/${RUTA_PUBLICA}`);
    expect(m.baixa).toHaveBeenCalledWith('mitjans_privats', RUTA, undefined, { signal: expect.any(AbortSignal) });
    expect(m.puja).toHaveBeenCalledWith('mitjans', RUTA_PUBLICA, expect.any(Blob));
    expect(avis).not.toHaveBeenCalled();
  });

  /* Auditoria 261007 (B) · Republicar promou la mateixa ruta: el segon intent
     topa amb «Duplicate» i abans tornava la ref privada al payload del Mur. */
  test('republicar: el segon intent amb 409 torna la ref pública i no avisa', async () => {
    const PUBLICA = `sdp-media://mitjans/${RUTA_PUBLICA}`;
    expect(await promoteToPublic(REF, CONFIG)).toBe(PUBLICA);
    m.puja.mockResolvedValue({ data: null, error: Object.assign(new Error('The resource already exists'), { status: 400, statusCode: '409' }) });
    expect(await promoteToPublic(REF, CONFIG)).toBe(PUBLICA);
    expect(m.puja).toHaveBeenCalledTimes(2);
    expect(avis).not.toHaveBeenCalled();
  });

  test.each([
    ['HTTP 409 sense cos', { status: 409 }],
    ['code Duplicate', { status: 400, statusCode: '400', code: 'Duplicate' }],
    ['code copiat a statusCode', { status: 400, statusCode: 'Duplicate' }]
  ])('el duplicat (%s) és un èxit', async (_cas, camps) => {
    m.puja.mockResolvedValue({ data: null, error: Object.assign(new Error('Duplicate'), camps) });
    expect(await promoteToPublic(REF, CONFIG)).toBe(`sdp-media://mitjans/${RUTA_PUBLICA}`);
    expect(avis).not.toHaveBeenCalled();
  });

  test('un 403 del cos dins d’un HTTP 409 no és un duplicat: atura la publicació i avisa', async () => {
    const cru = errorPrivat({ status: 409, statusCode: '403' });
    m.puja.mockResolvedValue({ data: null, error: cru });
    expect((await rebuigDePromocio(cru)).cause.codi).toBe(CODI_MITJANS.SENSE_PERMIS);
    comprovaAvis(cru, { codi: CODI_MITJANS.SENSE_PERMIS, status: 409, statusCode: 403, code: undefined });
  });
});
