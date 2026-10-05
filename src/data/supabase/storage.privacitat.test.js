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
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => null }));

import { promoteToPublic, resolveAsset } from './storage.js';
import { CODI_MITJANS } from '../errorsBackend.js';

const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const RUTA = `${POBLE}/${UID}/notes/document-privat.pdf`;
const REF = `sdp-media://mitjans_privats/${RUTA}`;
const FITXER = new Blob(['pdf'], { type: 'application/pdf' });
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
    expect(m.baixa).toHaveBeenCalledWith('mitjans_privats', RUTA);
    expect(m.puja).not.toHaveBeenCalled();
    comprovaAvis(cru, PERMIS_403);
  });

  test('la pujada rebutjada torna la ref i la consola queda neta', async () => {
    const cru = errorPrivat();
    m.puja.mockResolvedValue({ data: null, error: cru });
    expect(await promoteToPublic(REF, CONFIG)).toBe(REF);
    expect(m.puja).toHaveBeenCalledWith('mitjans', RUTA, FITXER);
    comprovaAvis(cru, PERMIS_403);
  });

  /* Quan l'SDK llança, downloadFile i uploadFile tornen handleError(error), i el
     seu `error` és el missatge cru (utils.js:66-70): un text amb la ruta. */
  test.each(['baixa', 'puja'])('una excepció de l’SDK durant la %s no imprimix el text cru', async (operacio) => {
    const cru = errorPrivat();
    m[operacio].mockRejectedValue(cru);
    expect(await promoteToPublic(REF, CONFIG)).toBe(REF);
    comprovaAvis(cru, DESCONEGUT_SENSE_ESTAT);
  });

  test('control · l’èxit torna la ruta pública i no avisa', async () => {
    expect(await promoteToPublic(REF, CONFIG)).toBe(`sdp-media://mitjans/${RUTA}`);
    expect(m.baixa).toHaveBeenCalledWith('mitjans_privats', RUTA);
    expect(m.puja).toHaveBeenCalledWith('mitjans', RUTA, FITXER);
    expect(avis).not.toHaveBeenCalled();
  });
});
