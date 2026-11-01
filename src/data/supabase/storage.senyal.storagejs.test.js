// @vitest-environment node
/* P1-27 (T1 · D01, assalt 261101) · La cancel·lació de qui crida, amb el
   client real (@supabase/storage-js). storage.termini.test.js ja prova que el
   TERMINI avorta upload, createSignedUrl i remove pel fetch de cada instància;
   ací es prova el SENYAL de qui crida (config.signal), sense avançar el
   rellotge: en avortar-lo, la petició física queda avortada a l'instant, una
   operació que encara era a la cua no arriba mai al fetch, i en acabar no
   queda cap plaça, cap cua ni cap temporitzador. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { StorageClient } from '@supabase/storage-js';

const m = vi.hoisted(() => ({ usuari: null, client: null, peticions: [], esborratRapid: false }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: (config = {}) => ({ ...config, runtimeDataMode: config.dataMode ?? 'remote' })
}));
vi.mock('./config.js', () => ({ getClient: async () => m.client }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => () => {}, usuariDeSessio: () => m.usuari }));

import { deleteFile, esborraElMeuMitja, resolveAsset, uploadToStorage } from './storage.js';
import { MAX_STORAGE_EN_VOL, controlStorageDe } from './controlStorage.js';

const UID = '11111111-1a1a-4000-8000-000000000001';
const POBLE = '22222222-2b2b-4000-8000-000000000002';
const CONFIG = { tenantId: POBLE };
const ARREL = 'https://storage.invalid/storage/v1';
const RUTA_PRIVADA = `${POBLE}/${UID}/notes/4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp`;
const REF_PRIVADA = `sdp-media://mitjans_privats/${RUTA_PRIVADA}`;
const REF_AVATAR = `sdp-media://mitjans/${POBLE}/${UID}/avatars/4b5c6d7e-8f90-4a1b-8c2d-3e4f5a6b7c8d.webp`;
const webp = (bytes) => new Blob([new Uint8Array(bytes)], { type: 'image/webp' });

/* El transport: cada petició es queda penjada fins que el seu senyal s'avorta
   (o fins al drenatge de l'afterEach). Amb `esborratRapid`, un DELETE contesta
   de seguida: la compensació d'una pujada tardana no ocupa plaça. */
const pendents = new Set();
const transport = (url, init = {}) => {
  m.peticions.push({ url: String(url), metode: init.method, signal: init.signal });
  if (init.method === 'DELETE' && m.esborratRapid) return Promise.resolve({ ok: true, status: 200, json: async () => [] });
  return new Promise((_resol, rebutja) => {
    const fi = () => rebutja(new DOMException('Avortada', 'AbortError'));
    pendents.add(fi);
    init.signal?.addEventListener('abort', fi, { once: true });
  });
};
const peticio = (metode, tros) => m.peticions.find((p) => p.metode === metode && p.url.includes(tros));
const control = () => controlStorageDe(m.client.storage);
/* Deixa córrer les microtasques (cap mil·lisegon del rellotge fals) fins que la petició ha eixit. */
async function finsQueIxca(metode, tros) {
  for (let ronda = 0; ronda < 20 && !peticio(metode, tros); ronda++) await vi.advanceTimersByTimeAsync(0);
  return peticio(metode, tros);
}

let avis;
beforeEach(() => {
  vi.useFakeTimers();
  m.usuari = { id: UID };
  m.peticions = [];
  m.esborratRapid = false;
  m.client = { storage: new StorageClient(ARREL, {}, transport) };
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(async () => {
  for (let ronda = 0; ronda < 12 && pendents.size; ronda++) {
    const ara = [...pendents];
    pendents.clear();
    ara.forEach((fi) => fi());
    await vi.advanceTimersByTimeAsync(0);
  }
  expect(control().estat()).toEqual({ enVol: 0, enCua: 0 });
  avis.mockRestore();
  vi.useRealTimers();
});

describe('P1-27 · el senyal de qui crida avorta upload, createSignedUrl i remove (storage-js real)', () => {
  test('uploadToStorage: la petició POST queda avortada a l’instant i la pujada rebutja amb la cancel·lació', async () => {
    const ac = new AbortController();
    const pujada = uploadToStorage(webp(10), { carpeta: 'avatars' }, { ...CONFIG, signal: ac.signal });
    const resultat = pujada.then(() => null, (error) => error);
    const post = await finsQueIxca('POST', `/object/mitjans/${POBLE}/${UID}/avatars/`);
    expect(post?.signal?.aborted).toBe(false);
    ac.abort();
    expect(post.signal.aborted).toBe(true);
    const error = await resultat;
    expect(error).toBeInstanceOf(Error);
    expect(error.cause?.name).toBe('AbortError');
  });

  test('resolveAsset: la signatura queda avortada i torna la ref opaca', async () => {
    const ac = new AbortController();
    const resolta = resolveAsset(REF_PRIVADA, { ...CONFIG, signal: ac.signal });
    const signatura = await finsQueIxca('POST', `/object/sign/mitjans_privats/${RUTA_PRIVADA}`);
    expect(signatura?.signal?.aborted).toBe(false);
    ac.abort();
    expect(signatura.signal.aborted).toBe(true);
    expect(await resolta).toBe(REF_PRIVADA);
  });

  test('deleteFile i esborraElMeuMitja: el DELETE queda avortat i no s’anuncia cap esborrat', async () => {
    const ac = new AbortController();
    const esborrat = deleteFile('mitjans', 'x/y.webp', { ...CONFIG, signal: ac.signal });
    const primer = await finsQueIxca('DELETE', '/object/mitjans');
    ac.abort();
    expect(primer.signal.aborted).toBe(true);
    expect((await esborrat)?.error).toBeTruthy();
    m.peticions = [];
    const segon = new AbortController();
    const meu = esborraElMeuMitja(REF_AVATAR, { ...CONFIG, signal: segon.signal }).then(() => null, (error) => error);
    const peticioMeua = await finsQueIxca('DELETE', '/object/mitjans');
    segon.abort();
    expect(peticioMeua.signal.aborted).toBe(true);
    expect(await meu).toBeInstanceOf(Error);
  });

  test('una operació a la cua avortada pel senyal no arriba mai al fetch, i la cua torna a zero', async () => {
    const enVol = Array.from({ length: MAX_STORAGE_EN_VOL }, (_, i) => uploadToStorage(webp(10 + i), { carpeta: 'avatars' }, CONFIG).catch((e) => e));
    for (let ronda = 0; ronda < 20 && m.peticions.length < MAX_STORAGE_EN_VOL; ronda++) await vi.advanceTimersByTimeAsync(0);
    expect(m.peticions).toHaveLength(MAX_STORAGE_EN_VOL);
    const ac = new AbortController();
    const encuada = resolveAsset(REF_PRIVADA, { ...CONFIG, signal: ac.signal });
    await vi.advanceTimersByTimeAsync(0);
    expect(control().estat()).toEqual({ enVol: MAX_STORAGE_EN_VOL, enCua: 1 });
    ac.abort();
    expect(await encuada).toBe(REF_PRIVADA);
    expect(control().estat()).toEqual({ enVol: MAX_STORAGE_EN_VOL, enCua: 0 });
    expect(peticio('POST', '/object/sign/')).toBeUndefined();
    void enVol;
  });

  test('sonda de fuita: 200 pujades avortades seguides no deixen cap plaça, cua ni temporitzador', async () => {
    m.esborratRapid = true;
    for (let i = 0; i < 200; i++) {
      const ac = new AbortController();
      const pujada = uploadToStorage(webp(10), { carpeta: 'avatars' }, { ...CONFIG, signal: ac.signal }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(0);
      ac.abort();
      expect((await pujada).cause?.name).toBe('AbortError');
    }
    await vi.advanceTimersByTimeAsync(0);
    const posts = m.peticions.filter((p) => p.metode === 'POST');
    expect(posts).toHaveLength(200);
    expect(posts.every((p) => p.signal.aborted)).toBe(true);
    expect(control().estat()).toEqual({ enVol: 0, enCua: 0 });
    expect(vi.getTimerCount()).toBe(0);
  });
});
