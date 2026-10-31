// @vitest-environment node
/* PN-04 (auditoria Port Neutral 261025) · Cap crida a Storage no espera per
   sempre. storage-js 2.112 no hi posa cap termini i el client es crea sense
   fetch propi: una pujada, una URL signada, una baixada, un llistat o un
   esborrat que no tornaven deixaven la vista «carregant» indefinidament. Ara
   cada crida té el seu termini (les pujades i les baixades, segons la mida;
   la resta, 12 s), el termini també talla la petició (P1-27: download i list
   per l'API de storage-js; upload, createSignedUrl i remove pel fetch de la
   seua instància), i el temps esgotat arriba a la vista amb el codi neutral de «no ha
   arribat al servidor». Les proves eren roges abans: la crida continuava
   pendent després de deu minuts de rellotge fals. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { StorageClient } from '@supabase/storage-js';

const m = vi.hoisted(() => ({ firma: vi.fn(), baixa: vi.fn(), puja: vi.fn(), llista: vi.fn(), esborra: vi.fn(), usuari: null, client: null, peticions: [] }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: (config = {}) => ({ ...config, runtimeDataMode: config.dataMode ?? 'remote' })
}));
vi.mock('./config.js', () => ({ getClient: async () => m.client ?? ({ storage: { from: (bucket) => ({
  createSignedUrl: (...args) => m.firma(bucket, ...args),
  download: (...args) => m.baixa(bucket, ...args),
  upload: (...args) => m.puja(bucket, ...args),
  list: (...args) => m.llista(bucket, ...args),
  remove: (...args) => m.esborra(bucket, ...args),
  getPublicUrl: (path) => ({ data: { publicUrl: `https://storage.invalid/${bucket}/${path}` } })
}) } }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.usuari }));

import { deleteFile, esborraElMeuMitja, llistaElsMeusMitjans, promoteToPublic, resolveAsset, uploadFile, uploadToStorage } from './storage.js';
import { tempsLimitPujada } from '../xatMultimedia.js';
import { CODI_BACKEND_INABASTABLE, esBackendInabastable } from '../errorsBackend.js';

const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const CONFIG = { tenantId: POBLE };
const RUTA_PRIVADA = `${POBLE}/${UID}/notes/4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp`;
const REF_PRIVADA = `sdp-media://mitjans_privats/${RUTA_PRIVADA}`;
const REF_AVATAR = `sdp-media://mitjans/${POBLE}/${UID}/avatars/4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp`;
const penjada = () => new Promise(() => {});
const webp = (bytes) => new Blob([new Uint8Array(bytes)], { type: 'image/webp' });

let avis;
beforeEach(() => {
  vi.useFakeTimers();
  Object.values(m).forEach((fn) => { if (typeof fn === 'function') fn.mockReset(); });
  m.usuari = { id: UID };
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  avis.mockRestore();
  vi.useRealTimers();
});

/* L'estat d'una promesa després d'avançar el rellotge fals. */
async function estatDespres(promesa, ms) {
  const estat = { nom: 'pendent', valor: undefined };
  promesa.then((valor) => Object.assign(estat, { nom: 'resolta', valor }), (valor) => Object.assign(estat, { nom: 'rebutjada', valor }));
  await vi.advanceTimersByTimeAsync(ms);
  return estat;
}

const comprovaInabastable = (error, prefix) => {
  expect(error).toBeInstanceOf(Error);
  expect(error.codi).toBe(CODI_BACKEND_INABASTABLE);
  expect(esBackendInabastable(error)).toBe(true);
  expect(error.message).toBe(`${prefix} el servidor no respon. Comprova la connexió i torna-ho a provar.`);
  expect(error.cause?.name).toBe('TimeoutError');
};

describe('pujada (uploadToStorage)', () => {
  test('el termini creix amb la mida: pendent just abans, «el servidor no respon» just després', async () => {
    m.puja.mockImplementation(penjada);
    const fitxer = webp(2_000_000);
    const pujada = uploadToStorage(fitxer, { carpeta: 'avatars' }, CONFIG);
    const termini = tempsLimitPujada(fitxer.size);
    expect(termini).toBeGreaterThan(12_000);
    expect((await estatDespres(pujada, termini - 1)).nom).toBe('pendent');
    const estat = await estatDespres(pujada, 1);
    expect(estat.nom).toBe('rebutjada');
    comprovaInabastable(estat.valor, 'No s’ha pogut pujar el fitxer:');
    expect(avis).toHaveBeenCalledWith('[Storage] pujada rebutjada', { codi: CODI_BACKEND_INABASTABLE, status: undefined, statusCode: undefined, code: undefined });
  });

  test('control · una pujada que contesta no espera el termini ni deixa cap temporitzador viu', async () => {
    m.puja.mockResolvedValue({ data: { path: 'x' }, error: null });
    const resultat = await uploadToStorage(webp(10), { carpeta: 'avatars' }, CONFIG);
    expect(resultat.url).toMatch(/^sdp-media:\/\/mitjans\//);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('URL signada (resolveAsset)', () => {
  test('una signatura que no torna en 12 s deixa la ref opaca, com qualsevol signatura fallida', async () => {
    m.firma.mockImplementation(penjada);
    const resolta = resolveAsset(REF_PRIVADA, CONFIG);
    expect((await estatDespres(resolta, 11_999)).nom).toBe('pendent');
    const estat = await estatDespres(resolta, 1);
    expect(estat).toEqual({ nom: 'resolta', valor: REF_PRIVADA });
    expect(avis).toHaveBeenCalledWith("[Storage] No s'ha pogut generar l'URL firmada", expect.objectContaining({ codi: CODI_BACKEND_INABASTABLE }));
    expect(JSON.stringify(avis.mock.calls)).not.toContain(UID);
  });
});

describe('promoure (promoteToPublic)', () => {
  test('una baixada penjada s’avorta pel termini (storage-js accepta el senyal) i torna la ref privada', async () => {
    m.baixa.mockImplementation(penjada);
    const promocio = promoteToPublic(REF_PRIVADA, CONFIG);
    const estat = await estatDespres(promocio, 10 * 60_000);
    expect(estat).toEqual({ nom: 'resolta', valor: REF_PRIVADA });
    expect(m.baixa).toHaveBeenCalledWith('mitjans_privats', RUTA_PRIVADA, undefined, { signal: expect.any(AbortSignal) });
    expect(m.baixa.mock.calls[0][3].signal.aborted).toBe(true);
    expect(m.puja).not.toHaveBeenCalled();
  });

  test('la baixada té el marge del fitxer més gran del bucket privat: no es talla als 12 s', async () => {
    m.baixa.mockImplementation(penjada);
    const promocio = promoteToPublic(REF_PRIVADA, CONFIG);
    expect((await estatDespres(promocio, 60_000)).nom).toBe('pendent');
  });

  test('una pujada penjada al bucket públic té el termini de la seua mida i torna la ref privada', async () => {
    const fitxer = webp(1_000_000);
    m.baixa.mockResolvedValue({ data: fitxer, error: null });
    m.puja.mockImplementation(penjada);
    const promocio = promoteToPublic(REF_PRIVADA, CONFIG);
    expect((await estatDespres(promocio, tempsLimitPujada(fitxer.size) - 1)).nom).toBe('pendent');
    expect(await estatDespres(promocio, 1)).toEqual({ nom: 'resolta', valor: REF_PRIVADA });
  });
});

describe('la biblioteca de fotos pròpies', () => {
  test('un llistat penjat s’avorta als 12 s i la vista diu que el servidor no respon', async () => {
    m.llista.mockImplementation(penjada);
    const llistat = llistaElsMeusMitjans(CONFIG);
    expect((await estatDespres(llistat, 11_999)).nom).toBe('pendent');
    const estat = await estatDespres(llistat, 1);
    expect(estat.nom).toBe('rebutjada');
    comprovaInabastable(estat.valor, 'No s’ha pogut llegir la teua biblioteca de fotos:');
    expect(estat.valor.code).toBe(CODI_BACKEND_INABASTABLE);
    for (const [, , , parametres] of m.llista.mock.calls) expect(parametres.signal.aborted).toBe(true);
  });

  test('un esborrat penjat acaba als 12 s amb el codi neutral', async () => {
    m.esborra.mockImplementation(penjada);
    const esborrat = esborraElMeuMitja(REF_AVATAR, CONFIG);
    expect((await estatDespres(esborrat, 11_999)).nom).toBe('pendent');
    const estat = await estatDespres(esborrat, 1);
    expect(estat.nom).toBe('rebutjada');
    comprovaInabastable(estat.valor, 'No s’ha pogut esborrar la foto:');
  });
});

/* P1-27 (C2120-03, G2120-06) · Amb el client real (@supabase/storage-js
   2.112.4) i un transport que no contesta mai: en vèncer el termini, la
   petició d'upload, createSignedUrl i remove ha rebut el senyal i està
   avortada. Abans storage-js no en passava cap (init.signal undefined) i la
   petició quedava viva després del termini. */
describe('P1-27 · el termini també talla upload, createSignedUrl i remove (storage-js real)', () => {
  const ARREL = 'https://storage.invalid/storage/v1';
  const anota = (url, init = {}) => m.peticions.push({ url: String(url), metode: init.method, signal: init.signal });
  const penjat = (url, init = {}) => {
    anota(url, init);
    return new Promise((_resol, rebutja) => init.signal?.addEventListener('abort',
      () => rebutja(new DOMException('Avortada', 'AbortError')), { once: true }));
  };
  /* Una resposta de signatura: un objecte i no un Response, per a no dependre
     dels streams d'undici amb el rellotge fals (storage-js només mira ok i json()). */
  const signa = (url, init = {}) => {
    anota(url, init);
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ signedURL: `/object/sign/mitjans_privats/${RUTA_PRIVADA}?token=t` }) });
  };
  const SIGNADA = `${ARREL}/object/sign/mitjans_privats/${RUTA_PRIVADA}?token=t`;
  const peticio = (metode, tros) => m.peticions.find((p) => p.metode === metode && p.url.includes(tros));
  beforeEach(() => {
    m.peticions = [];
    m.client = { storage: new StorageClient(ARREL, {}, penjat) };
  });
  afterEach(() => { m.client = null; });

  test('uploadToStorage: la pujada penjada queda avortada en vèncer el termini de la seua mida', async () => {
    const fitxer = webp(2_000_000);
    const estat = await estatDespres(uploadToStorage(fitxer, { carpeta: 'avatars' }, CONFIG), tempsLimitPujada(fitxer.size));
    expect(estat.nom).toBe('rebutjada');
    comprovaInabastable(estat.valor, 'No s’ha pogut pujar el fitxer:');
    expect(peticio('POST', `/object/mitjans/${POBLE}/${UID}/avatars/`)?.signal?.aborted).toBe(true);
  });

  test('uploadFile (la pujada de promoteToPublic): avortada en vèncer el termini', async () => {
    const fitxer = webp(10);
    await estatDespres(uploadFile('mitjans', 'x/y.webp', fitxer, CONFIG), tempsLimitPujada(fitxer.size));
    expect(peticio('POST', '/object/mitjans/x/y.webp')?.signal?.aborted).toBe(true);
  });

  test('resolveAsset: la signatura penjada és viva als 11.999 ms i avortada als 12 s; torna la ref opaca', async () => {
    const resolta = resolveAsset(REF_PRIVADA, CONFIG);
    expect((await estatDespres(resolta, 11_999)).nom).toBe('pendent');
    expect(peticio('POST', `/object/sign/mitjans_privats/${RUTA_PRIVADA}`)?.signal?.aborted).toBe(false);
    expect(await estatDespres(resolta, 1)).toEqual({ nom: 'resolta', valor: REF_PRIVADA });
    expect(peticio('POST', `/object/sign/mitjans_privats/${RUTA_PRIVADA}`).signal.aborted).toBe(true);
  });

  test('esborraElMeuMitja i deleteFile: l’esborrat penjat queda avortat als 12 s', async () => {
    const estat = await estatDespres(esborraElMeuMitja(REF_AVATAR, CONFIG), 12_000);
    expect(estat.nom).toBe('rebutjada');
    expect(estat.valor.codi).toBe(CODI_BACKEND_INABASTABLE);
    expect(peticio('DELETE', '/object/mitjans')?.signal?.aborted).toBe(true);
    m.peticions = [];
    await estatDespres(deleteFile('mitjans', 'x/y.webp', CONFIG), 12_000);
    expect(peticio('DELETE', '/object/mitjans')?.signal?.aborted).toBe(true);
  });

  test('control · cada crida porta el seu senyal: una signatura que contesta no avorta res ni deixa temporitzadors, la següent no n’hereta cap i el client compartit queda net', async () => {
    m.client = { storage: new StorageClient(ARREL, {}, signa) };
    const primera = await resolveAsset(REF_PRIVADA, CONFIG);
    const segona = await resolveAsset(REF_PRIVADA, CONFIG);
    expect(primera).toBe(SIGNADA);
    expect(segona).toBe(primera);
    const [a, b] = m.peticions;
    expect(a.signal).toBeInstanceOf(AbortSignal);
    expect(b.signal).toBeInstanceOf(AbortSignal);
    expect(b.signal).not.toBe(a.signal);
    expect([a.signal.aborted, b.signal.aborted]).toEqual([false, false]);
    expect(vi.getTimerCount()).toBe(0);
    /* Una altra peça que use el mateix client després no rep cap senyal d'estes
       crides: el fetch només s'ha tocat a la instància de cada from(). */
    m.peticions = [];
    await m.client.storage.from('mitjans_privats').createSignedUrl(RUTA_PRIVADA, 60);
    expect(m.peticions).toHaveLength(1);
    expect(m.peticions[0].signal).toBeUndefined();
  });

  test('control · un cubell que no deixa posar-hi el fetch (un doble congelat) fa la crida com abans, sense senyal', async () => {
    const real = new StorageClient(ARREL, {}, signa);
    m.client = { storage: { from: (bucket) => Object.freeze(real.from(bucket)) } };
    expect(await resolveAsset(REF_PRIVADA, CONFIG)).toBe(SIGNADA);
    expect(m.peticions).toHaveLength(1);
    expect(m.peticions[0].signal).toBeUndefined();
    expect(avis).not.toHaveBeenCalled();
  });
});
