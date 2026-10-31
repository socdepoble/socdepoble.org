// @vitest-environment node
/* Gauntlet Loop c2 (261030, G4) · Si el protocol torna un blob que no fa la mida
   Padmé declarada, xifraAdjuntXat el rebutja com a incoherent: qui crida no rep
   mai eixe `a`, així que la FK (`a.k`) es posa a zero abans de llançar. El
   protocol es dobla ací només per a fabricar eixa incoherència. */
import { describe, expect, test, vi } from 'vitest';

const fals = vi.hoisted(() => ({ a: null }));
vi.mock('./xifratXatProtocol.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    xifraAdjunt: vi.fn(async (...args) => {
      const resultat = await real.xifraAdjunt(...args);
      fals.a = resultat.a;
      return { blob: resultat.blob.subarray(0, resultat.blob.length - 1), a: resultat.a };
    })
  };
});

const { CODI_ADJUNT, xifraAdjuntXat } = await import('./xatMultimediaXifrat.js');

const cripto = globalThis.crypto;
const FIL = 'dddddddd-3333-4333-8333-333333333333';
const ADJ = 'eeeeeeee-4444-4444-8444-444444444444';
const A = 'aaaaaaaa-1111-4111-8111-111111111111';

describe('xifraAdjuntXat · FK d’un resultat incoherent', () => {
  test('el blob no fa la mida declarada: error incoherent i la FK que no ix enlloc, a zero', async () => {
    const clar = cripto.getRandomValues(new Uint8Array(3000));
    await expect(xifraAdjuntXat({ cripto, fil: FIL, adjunt: ADJ, emissor: A, bytes: clar, mime: 'image/jpeg' }))
      .rejects.toMatchObject({ code: 'obrir', codi: CODI_ADJUNT.incoherent });
    expect(fals.a.k).toHaveLength(32);
    expect(fals.a.k.every((x) => x === 0)).toBe(true);
  });
});
