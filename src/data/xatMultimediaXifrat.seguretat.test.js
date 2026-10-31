// @vitest-environment node
/* P1-12 Fase 4 (pla 261029_1305, Bloc C, E1.2) · Adjunts xifrats: AES-256-GCM
   via el protocol, hash SHA-256 verificat ABANS de desxifrar, llista blanca
   de MIME al receptor i sostres del bucket. WebCrypto real de Node. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CODI_ADJUNT, MAXIM_BLOB_ADJUNT, MIMES_ADJUNT_XIFRAT, PRESSUPOST_BLOBS_ESCRIPTORI, PRESSUPOST_BLOBS_MOBIL, SOSTRE_BLOBS_ADJUNTS, capAlBucket, creaRegistreBlobsAdjunts, desxifraAdjuntXat, midaBlobAdjunt, pressupostBlobsAdjunts, verificaHashAdjunt, xifraAdjuntXat } from './xatMultimediaXifrat.js';
import { CLASSE_ADJUNT, MAXIM_CLAR_ADJUNT } from './xifratXatFormats.js';

const cripto = globalThis.crypto;
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const ADJ = 'eeeeeeee-4444-4444-8444-444444444444';
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const bytes = (n) => cripto.getRandomValues(new Uint8Array(n));
const muta = (d, i = 0) => { const c = Uint8Array.from(d); c[i] ^= 0x5a; return c; };
const conte = (palla, agulla) => Buffer.from(palla).includes(Buffer.from(agulla));

afterEach(() => vi.restoreAllMocks());

describe('xifraAdjuntXat / desxifraAdjuntXat', () => {
  test('anada i tornada: el blob no porta el clar, fa la mida Padmé declarada i torna els mateixos bytes amb el MIME real', async () => {
    const clar = bytes(3000);
    const { blob, a, mida } = await xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: clar, mime: 'image/jpeg' });
    expect(mida).toBe(blob.length);
    expect(blob.length).toBe(midaBlobAdjunt(3000));
    expect(conte(blob, clar.subarray(0, 32))).toBe(false);
    expect(a).toMatchObject({ id: ADJ, c: CLASSE_ADJUNT.foto, m: 'image/jpeg', b: 3000, d: null });
    expect(a.k).toHaveLength(32);
    expect(a.h).toHaveLength(32);
    expect(await verificaHashAdjunt({ cripto, blob, hash: a.h })).toBe(true);
    const obert = await desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a, blob });
    expect(obert.bytes).toEqual(clar);
    expect(obert).toMatchObject({ mime: 'image/jpeg', classe: CLASSE_ADJUNT.foto, tipus: 'foto', durada: null });
  });

  test('un MIME fora de la llista blanca es rebutja sense tocar WebCrypto', async () => {
    const encrypt = vi.spyOn(cripto.subtle, 'encrypt');
    await expect(xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: bytes(10), mime: 'text/html' })).rejects.toMatchObject({ code: 'format', codi: CODI_ADJUNT.mime });
    await expect(xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: bytes(10), mime: 'image/svg+xml' })).rejects.toMatchObject({ codi: CODI_ADJUNT.mime });
    expect(encrypt).not.toHaveBeenCalled();
    expect(MIMES_ADJUNT_XIFRAT).not.toContain('text/html');
    expect(MIMES_ADJUNT_XIFRAT).not.toContain('image/svg+xml');
    await expect(xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: new Uint8Array(0), mime: 'image/jpeg' })).rejects.toMatchObject({ codi: CODI_ADJUNT.buit });
  });

  test('els sostres: el clar de cada classe i els 20.000.000 B del blob farcit', () => {
    expect(MAXIM_CLAR_ADJUNT[CLASSE_ADJUNT.video]).toBe(19_922_943);
    expect(capAlBucket(19_922_943, CLASSE_ADJUNT.video)).toBe(true);
    expect(capAlBucket(19_922_944, CLASSE_ADJUNT.video)).toBe(false);
    expect(capAlBucket(2_000_000, CLASSE_ADJUNT.foto)).toBe(true);
    expect(capAlBucket(2_000_001, CLASSE_ADJUNT.foto)).toBe(false);
    expect(midaBlobAdjunt(19_922_943)).toBeLessThanOrEqual(MAXIM_BLOB_ADJUNT);
    expect(midaBlobAdjunt(2_000_000)).toBe(2_031_644);
  });

  test('un blob manipulat o un hash que no quadra es rebutgen ABANS de desxifrar', async () => {
    const clar = bytes(2048);
    const { blob, a } = await xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: clar, mime: 'audio/ogg', durada: 1500 });
    const decrypt = vi.spyOn(cripto.subtle, 'decrypt');
    await expect(desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a, blob: muta(blob, 40) })).rejects.toMatchObject({ code: 'obrir', codi: CODI_ADJUNT.manipulat });
    await expect(desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a: { ...a, h: muta(a.h) }, blob })).rejects.toMatchObject({ codi: CODI_ADJUNT.manipulat });
    expect(decrypt).not.toHaveBeenCalled();
    await expect(desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a: { ...a, m: 'text/html' }, blob })).rejects.toMatchObject({ codi: CODI_ADJUNT.mime });
    await expect(desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a: { ...a, b: 2047 }, blob })).rejects.toMatchObject({ codi: CODI_ADJUNT.incoherent });
    expect(decrypt).not.toHaveBeenCalled();
    const obert = await desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a, blob });
    expect(obert.bytes).toEqual(clar);
    expect(obert).toMatchObject({ tipus: 'veu', durada: 1500 });
    expect(decrypt).toHaveBeenCalled();
  });

  test('una FK d’un altre adjunt no obri el blob (GCM rebutja) i ix com a manipulat', async () => {
    const clar = bytes(1024);
    const u = await xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: clar, mime: 'image/webp' });
    const v = await xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: clar, mime: 'image/webp' });
    await expect(desxifraAdjuntXat({ cripto, fil: FIL, emissor: A, a: { ...u.a, k: v.a.k }, blob: u.blob })).rejects.toMatchObject({ code: 'obrir' });
  });
});

/* P1-12 pas 17 (disseny §4.7) · El pressupost LRU dels blob: desxifrats: 48 MB al
   mòbil, 100 MB a l'escriptori, mai per damunt; revoca les menys recents i mai la
   que acaba d'entrar. Pur: cap global (la revocació s'injecta). */
describe('pressupost LRU dels blob: desxifrats', () => {
  test('la classe d’aparell tria el pressupost; cap senyal estrany puja per damunt de 100 MB', () => {
    expect(PRESSUPOST_BLOBS_MOBIL).toBe(48_000_000);
    expect(PRESSUPOST_BLOBS_ESCRIPTORI).toBe(100_000_000);
    expect(pressupostBlobsAdjunts({ natiu: true })).toBe(PRESSUPOST_BLOBS_MOBIL);
    expect(pressupostBlobsAdjunts({ punterGruixut: true })).toBe(PRESSUPOST_BLOBS_MOBIL);
    expect(pressupostBlobsAdjunts({ memoriaGb: 4 })).toBe(PRESSUPOST_BLOBS_MOBIL);
    expect(pressupostBlobsAdjunts({ memoriaGb: 0.5 })).toBe(PRESSUPOST_BLOBS_MOBIL);
    expect(pressupostBlobsAdjunts({ memoriaGb: 8 })).toBe(PRESSUPOST_BLOBS_ESCRIPTORI);
    expect(pressupostBlobsAdjunts()).toBe(PRESSUPOST_BLOBS_ESCRIPTORI);
    for (const memoriaGb of [Number.NaN, '2', -1, 0, Infinity, null]) {
      expect(pressupostBlobsAdjunts({ memoriaGb }), String(memoriaGb)).toBe(PRESSUPOST_BLOBS_ESCRIPTORI);
    }
    expect(pressupostBlobsAdjunts({ natiu: 'sí', punterGruixut: 1 })).toBe(PRESSUPOST_BLOBS_ESCRIPTORI);
  });

  test('invariants: cap adjunt supera el pressupost del mòbil, que és menor que el de l’escriptori', () => {
    expect(MAXIM_BLOB_ADJUNT).toBeLessThanOrEqual(PRESSUPOST_BLOBS_MOBIL);
    expect(PRESSUPOST_BLOBS_MOBIL).toBeLessThan(PRESSUPOST_BLOBS_ESCRIPTORI);
    for (const classe of Object.values(CLASSE_ADJUNT)) {
      expect(midaBlobAdjunt(MAXIM_CLAR_ADJUNT[classe])).toBeLessThanOrEqual(PRESSUPOST_BLOBS_MOBIL);
    }
  });

  test('el constructor exigix un pressupost enter entre 1 i 100 MB i la revocació', () => {
    const revoca = vi.fn();
    for (const pressupost of [0, -1, 1.5, Number.NaN, '48', PRESSUPOST_BLOBS_ESCRIPTORI + 1, null]) {
      expect(() => creaRegistreBlobsAdjunts({ pressupost, revoca }), String(pressupost)).toThrow(RangeError);
    }
    expect(() => creaRegistreBlobsAdjunts({ pressupost: 10 })).toThrow(TypeError);
    expect(creaRegistreBlobsAdjunts({ revoca }).estat()).toEqual({ entrades: 0, bytes: 0, pressupost: PRESSUPOST_BLOBS_MOBIL });
    expect(creaRegistreBlobsAdjunts({ pressupost: PRESSUPOST_BLOBS_ESCRIPTORI, revoca }).estat().pressupost).toBe(PRESSUPOST_BLOBS_ESCRIPTORI);
    expect(revoca).not.toHaveBeenCalled();
  });

  test('LRU: en passar del pressupost revoca la menys recent; obte la toca', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a', 4);
    r.desa('b', 'blob:b', 4);
    expect(revoca).not.toHaveBeenCalled();
    r.desa('c', 'blob:c', 4);
    expect(revoca.mock.calls).toEqual([['blob:a']]);
    expect(r.obte('a')).toBeNull();
    expect(r.estat()).toMatchObject({ entrades: 2, bytes: 8 });
    expect(r.obte('b')).toBe('blob:b');
    r.desa('d', 'blob:d', 4);
    expect(revoca.mock.calls).toEqual([['blob:a'], ['blob:c']]);
    expect(r.obte('b')).toBe('blob:b');
    expect(r.obte('d')).toBe('blob:d');
    expect(r.estat()).toMatchObject({ entrades: 2, bytes: 8 });
  });

  test('renovar la mateixa clau revoca la URL vella sense comptar dues vegades; la mateixa URL no es revoca', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a1', 6);
    r.desa('a', 'blob:a2', 6);
    expect(revoca.mock.calls).toEqual([['blob:a1']]);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 6 });
    r.desa('a', 'blob:a2', 6);
    expect(revoca).toHaveBeenCalledTimes(1);
    expect(r.obte('a')).toBe('blob:a2');
  });

  test('una entrada més gran que el pressupost entra a soles i la trau el desa següent', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a', 3);
    r.desa('b', 'blob:b', 3);
    r.desa('gran', 'blob:gran', 25);
    expect(revoca.mock.calls).toEqual([['blob:a'], ['blob:b']]);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 25 });
    expect(r.obte('gran')).toBe('blob:gran');
    r.desa('c', 'blob:c', 1);
    expect(revoca.mock.calls.at(-1)).toEqual(['blob:gran']);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 1 });
  });

  test('una revocació que llança no trenca el registre; oblida i buida revoquen una sola vegada', () => {
    const revoca = vi.fn(() => { throw new Error('revocació tardana'); });
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a', 6);
    expect(() => r.desa('b', 'blob:b', 6)).not.toThrow();
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 6 });
    const net = vi.fn();
    const s = creaRegistreBlobsAdjunts({ pressupost: 100, revoca: net });
    s.desa('x', 'blob:x', 1);
    s.desa('y', 'blob:y', 1);
    s.desa('z', 'blob:y', 1);
    expect(s.oblida('x')).toBe(true);
    expect(s.oblida('x')).toBe(false);
    expect(net.mock.calls).toEqual([['blob:x']]);
    s.buida();
    expect(net.mock.calls).toEqual([['blob:x'], ['blob:y']]);
    expect(s.estat()).toMatchObject({ entrades: 0, bytes: 0 });
    s.buida();
    expect(net).toHaveBeenCalledTimes(2);
  });

  test('entrades invàlides es rebutgen sense canviar l’estat', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a', 4);
    for (const bytes of [-1, 1.5, Number.NaN, '4', null]) expect(() => r.desa('b', 'blob:b', bytes), String(bytes)).toThrow(RangeError);
    expect(() => r.desa('', 'blob:b', 1)).toThrow(TypeError);
    expect(() => r.desa('b', '', 1)).toThrow(TypeError);
    expect(() => r.desa('b', undefined, 1)).toThrow(TypeError);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 4 });
    expect(revoca).not.toHaveBeenCalled();
  });

  /* QA-C01 (Gauntlet 261029_1858) · Mai es revoca una URL que una peça muntada té retinguda. */
  test('QA-C01: dos adjunts i pressupost per a un: el retingut no es revoca; en alliberar-lo, sí', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a', 8);
    const alliberaA = r.reten('a');
    expect(typeof alliberaA).toBe('function');
    // La segona peça es munta: la seua URL entra (i es reté) amb la primera encara a la vista.
    r.desa('b', 'blob:b', 8);
    const alliberaB = r.reten('b');
    expect(revoca).not.toHaveBeenCalled();
    expect(r.estat()).toMatchObject({ entrades: 2, bytes: 16 });
    alliberaA();
    expect(revoca.mock.calls).toEqual([['blob:a']]);
    expect(r.obte('a')).toBeNull();
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 8 });
    alliberaA();
    alliberaB();
    expect(revoca).toHaveBeenCalledTimes(1);
    expect(r.obte('b')).toBe('blob:b');
    expect(r.reten('cap')).toBeNull();
  });

  test('QA-C01: sense retenció, el LRU de sempre (la menys recent fora, encara que s’acabe d’alliberar una altra)', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a', 8);
    const alliberaA = r.reten('a');
    r.desa('b', 'blob:b', 8);
    expect(r.obte('a')).toBe('blob:a');
    alliberaA();
    expect(revoca.mock.calls).toEqual([['blob:b']]);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 8 });
  });

  test('QA-C01: refs comptades; amb tot retingut se supera el pressupost fins al sostre de 100 MB, i per damunt la URL nova es rebutja sense tocar res', () => {
    expect(SOSTRE_BLOBS_ADJUNTS).toBe(PRESSUPOST_BLOBS_ESCRIPTORI);
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: PRESSUPOST_BLOBS_MOBIL, revoca });
    const alliberes = [];
    for (const n of [1, 2, 3, 4, 5]) {
      r.desa(`v${n}`, `blob:v${n}`, 19_000_000);
      alliberes.push(r.reten(`v${n}`));
    }
    const doble = r.reten('v1');
    expect(r.estat()).toMatchObject({ entrades: 5, bytes: 95_000_000 });
    expect(revoca).not.toHaveBeenCalled();
    expect(r.hiCap(5_000_000)).toBe(true);
    expect(r.hiCap(5_000_001)).toBe(false);
    for (const bytes of [-1, 1.5, '1', null]) expect(r.hiCap(bytes), String(bytes)).toBe(false);
    expect(() => r.desa('v6', 'blob:v6', 6_000_000)).toThrow(expect.objectContaining({ code: 'obrir', codi: CODI_ADJUNT.pressupost, reintentable: true }));
    expect(r.obte('v6')).toBeNull();
    expect(r.estat()).toMatchObject({ entrades: 5, bytes: 95_000_000 });
    expect(revoca).not.toHaveBeenCalled();
    // v1 té dues referències: la primera no l'allibera; la segona sí, i es torna dins del pressupost.
    alliberes[0]();
    expect(revoca).not.toHaveBeenCalled();
    doble();
    expect(revoca.mock.calls).toEqual([['blob:v1']]);
    r.desa('v6', 'blob:v6', 5_000_000);
    const alliberaV6 = r.reten('v6');
    expect(r.estat()).toMatchObject({ entrades: 5, bytes: 81_000_000 });
    for (const allibera of alliberes.slice(1)) allibera();
    expect(r.estat()).toMatchObject({ entrades: 3, bytes: 43_000_000 });
    expect(r.obte('v6')).toBe('blob:v6');
    alliberaV6();
    expect(revoca.mock.calls.flat()).toEqual(['blob:v1', 'blob:v2', 'blob:v3']);
  });

  test('QA-C01: renovar una clau retinguda deixa la URL vella òrfena fins que s’allibera; oblida i buida ho revoquen tot i els alliberaments tardans no fan res', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 10, revoca });
    r.desa('a', 'blob:a1', 4);
    const vella = r.reten('a');
    r.desa('a', 'blob:a2', 4);
    expect(revoca).not.toHaveBeenCalled();
    expect(r.obte('a')).toBe('blob:a2');
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 8 });
    vella();
    expect(revoca.mock.calls).toEqual([['blob:a1']]);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 4 });

    const nova = r.reten('a');
    r.desa('b', 'blob:b1', 4);
    const deB = r.reten('b');
    r.desa('b', 'blob:b2', 4);
    expect(r.oblida('a')).toBe(true);
    expect(revoca.mock.calls.slice(1)).toEqual([['blob:a2']]);
    r.buida();
    expect(revoca.mock.calls.slice(2).flat().sort()).toEqual(['blob:b1', 'blob:b2']);
    expect(r.estat()).toMatchObject({ entrades: 0, bytes: 0 });
    nova();
    deB();
    expect(revoca).toHaveBeenCalledTimes(4);
    expect(r.estat()).toMatchObject({ entrades: 0, bytes: 0 });
  });

  /* Gauntlet c2 (C10, Codex 0256) · Alliberar l'última referència d'una òrfena també reajusta:
     el que ja es pot desallotjar ix, i el registre torna dins del pressupost. */
  test('C10: amb pressupost 48, retenir, renovar i alliberar l’òrfena deixa el registre dins del pressupost', () => {
    const revoca = vi.fn();
    const r = creaRegistreBlobsAdjunts({ pressupost: 48, revoca });
    r.desa('c', 'blob:c', 30);
    const deC = r.reten('c');
    r.desa('a', 'blob:a1', 20);
    const vella = r.reten('a');
    expect(r.estat()).toMatchObject({ entrades: 2, bytes: 50 });
    // Renovar la retinguda: la vella queda òrfena i la nova (sense cap referència) entra.
    r.desa('a', 'blob:a2', 20);
    expect(r.estat()).toMatchObject({ entrades: 2, bytes: 70 });
    expect(revoca).not.toHaveBeenCalled();
    vella();
    expect(revoca.mock.calls.flat()).toEqual(['blob:a1', 'blob:a2']);
    expect(r.estat()).toMatchObject({ entrades: 1, bytes: 30 });
    expect(r.estat().bytes).toBeLessThanOrEqual(r.estat().pressupost);
    expect(r.obte('c')).toBe('blob:c');
    deC();
    expect(revoca).toHaveBeenCalledTimes(2);
  });

  test('textual: el mòdul continua pur (cap URL., new Blob, globalThis ni window.)', () => {
    const font = readFileSync(new URL('./xatMultimediaXifrat.js', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(font).not.toMatch(/\bURL\./);
    expect(font).not.toMatch(/new\s+Blob\b/);
    expect(font).not.toMatch(/\bglobalThis\b/);
    expect(font).not.toMatch(/\bwindow\./);
  });
});
