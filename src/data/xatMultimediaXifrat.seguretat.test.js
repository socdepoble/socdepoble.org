// @vitest-environment node
/* P1-12 Fase 4 (pla 261029_1305, Bloc C, E1.2) · Adjunts xifrats: AES-256-GCM
   via el protocol, hash SHA-256 verificat ABANS de desxifrar, llista blanca
   de MIME al receptor i sostres del bucket. WebCrypto real de Node. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CODI_ADJUNT, MAXIM_BLOB_ADJUNT, MIMES_ADJUNT_XIFRAT, capAlBucket, desxifraAdjuntXat, midaBlobAdjunt, verificaHashAdjunt, xifraAdjuntXat } from './xatMultimediaXifrat.js';
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
