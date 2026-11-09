// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PRODUCTES } from '../../apps/nevera/nucli/productes.js';
import { carregaMercadona, comparaOfertaRural, costMercadona, cotitzaMercadona } from './mercadona.js';
import { imatgeMercadonaSegura, importaMercadona, serialitzaMercadona } from '../../../tooling/menjarIBeure/importa-mercadona.mjs';

const dades = await carregaMercadona();
const primer = dades.productes[0];

describe('catàleg Mercadona: reconciliació amb els ids que ja viuen a les llistes', () => {
  test('592 productes, 24 categories i una nota editorial separada', () => {
    expect(dades.productes).toHaveLength(592);
    expect(dades.metadades.categories).toHaveLength(24);
    expect(dades.metadades.notes).toEqual([{ fila: 494, text: 'PRECIO MEDIO PIZZAS: 6 -7 €' }]);
    expect(dades.productes.map((p) => p.id)).toEqual(PRODUCTES.map(([id]) => id));
    expect(dades.productes.some((p) => p.nom.includes('PRECIO MEDIO'))).toBe(false);
  });

  test('conserva marca, envàs, quantitat original i preu de totes les files publicades', () => {
    dades.productes.forEach((p, index) => {
      const [id, nom, categoria, marca, envas, quantitat, unitat, preu] = PRODUCTES[index];
      expect([p.id, p.nomNevera, p.categoriaId, p.marca, p.envas, p.quantitatOriginal, p.unitatOriginal, p.preuCentims])
        .toEqual([id, nom, categoria, marca, envas, quantitat, unitat, preu]);
      expect(p.preuUnitariCentims).toBeGreaterThan(0);
      expect(['g', 'l', 'u']).toContain(p.unitat);
      expect(imatgeMercadonaSegura(p.imatgeUrl)).toBe(p.imatgeUrl);
    });
  });

  test('el primer producte reconcilia els camps comercials i PreuU de la font', () => {
    expect(primer).toMatchObject({
      id: 'mer-salsa-de-tomate-basilico-con-albahaca', marca: 'Hacendado',
      nom: 'Salsa de tomate Basilico con albahaca', envas: 'Tarro', quantitat: 290, unitat: 'g',
      preuEnvas: 1.5, preuUnitari: 5.17, preuUnitariCentims: 517, unitatPreuUnitari: 'kg', filaFont: 3
    });
  });

  test('el carregador compartix una instantània immutable', async () => {
    expect(await carregaMercadona()).toBe(dades);
    expect(Object.isFrozen(dades.productes)).toBe(true);
    expect(Object.isFrozen(primer)).toBe(true);
    expect(Object.isFrozen(dades.metadades.categories)).toBe(true);
    expect(() => { primer.preuCentims = 0; }).toThrow();
  });

  test.runIf(Boolean(process.env.SDP_MERCADONA_CSV))('regeneració byte a byte des del CSV original autoritzat', () => {
    const generat = importaMercadona(readFileSync(process.env.SDP_MERCADONA_CSV));
    expect(serialitzaMercadona(generat)).toBe(readFileSync('src/data/menjarIBeure/mercadona.generated.js', 'utf8'));
    expect(generat.metadades.sha256).toBe('641ea7f83fe5d7e925889dbfff2bf0895edf459b1550de65409ef6af29a1f526');
  });
});

describe('quotes de recepta i comparació rural', () => {
  test('145 g costen 75 cèntims; 10% de minva es calcula sobre pes útil', () => {
    expect(costMercadona(primer, { quantitat: 145, unitat: 'g' }).costCentims).toBe(75);
    expect(costMercadona(primer, { quantitat: 0.145, unitat: 'kg' }).costCentims).toBe(75);
    expect(costMercadona(primer, { quantitat: 145, unitat: 'g', minvaPercent: 10 }).costCentims).toBe(83);
  });

  test('mig cèntim puja i les conversions cl/ml mantenen el cost', () => {
    const liquid = { preuUnitariCentims: 100, unitatPreuUnitari: 'l', tall: '2026-10-03' };
    expect(costMercadona(liquid, { quantitat: 0.005, unitat: 'l' }).costCentims).toBe(1);
    expect(costMercadona(liquid, { quantitat: 25, unitat: 'cl' }).costCentims).toBe(25);
    expect(costMercadona(liquid, { quantitat: 250, unitat: 'ml' }).costCentims).toBe(25);
  });

  test('mai convertix volum en pes, unitats desconegudes ni una dada absent en cost zero', async () => {
    expect(costMercadona(primer, { quantitat: 1, unitat: 'l' })).toEqual({ estat: 'unitats-incompatibles', costCentims: null });
    expect(costMercadona(primer, { quantitat: 1, unitat: '__proto__' }).costCentims).toBeNull();
    expect(await cotitzaMercadona('absent', { quantitat: 1, unitat: 'g' })).toEqual({ estat: 'producte-desconegut', costCentims: null });
    for (const quantitat of [null, NaN, Infinity, -1, 1000001]) expect(() => costMercadona(primer, { quantitat, unitat: 'g' })).toThrow();
    for (const minvaPercent of [-1, 100, Infinity]) expect(() => costMercadona(primer, { quantitat: 1, unitat: 'g', minvaPercent })).toThrow();
  });

  test('l’oferta local compara la mateixa quantitat i conserva les dos dates', () => {
    expect(comparaOfertaRural(primer, { preuCentims: 90, quantitat: 145, unitat: 'g', proveidor: 'Cooperativa', data: '2026-11-08' }))
      .toEqual({ estat: 'calculat', proveidor: 'Cooperativa', data: '2026-11-08', preuLocalCentims: 90, costMercadonaCentims: 75, diferenciaCentims: 15, tallMercadona: '2026-10-03' });
    for (const data of ['', '2026-02-29', '2026-13-01', '2026-04-31']) {
      expect(() => comparaOfertaRural(primer, { preuCentims: 90, quantitat: 145, unitat: 'g', proveidor: 'Cooperativa', data })).toThrow();
    }
  });
});

describe('referències d’imatge estrictes, sense llegir recursos locals o d’altres servidors', () => {
  test('rebutja altres orígens, credencials, rutes i consultes inesperades', () => {
    const base = primer.imatgeUrl;
    for (const url of [base.replace('https:', 'http:'), base.replace('prod-mercadona.imgix.net', 'example.test'), base.replace('https://', 'https://persona@'), `${base}&token=secret`, base.replace('w=600', 'w=10'), `${base}&w=600`, '/local/photo.png']) {
      expect(() => imatgeMercadonaSegura(url)).toThrow();
    }
  });
});

/* Onada R15 (P1-02) · El catàleg viatja amb la Nevera: sense VITE_SDP_APP_NEVERA=1, fora de DEV, el carregador no
   té destí i el build públic no emet el tros mercadona.generated. Una instància nova del mòdul per cas. */
describe('catàleg Mercadona: només amb la bandera de la Nevera', () => {
  afterEach(() => vi.unstubAllEnvs());
  test('sense la bandera, fora de DEV, el carregador rebutja i no carrega cap fila', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_APP_NEVERA', undefined);
    const { carregaMercadona: carrega } = await import(/* @vite-ignore */ './mercadona.js?publica');
    await expect(carrega()).rejects.toThrow('El catàleg de Mercadona no està inclòs en este build.');
  });
  test('amb VITE_SDP_APP_NEVERA=1, fora de DEV, carrega les 592 files', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_SDP_APP_NEVERA', '1');
    const { carregaMercadona: carrega } = await import(/* @vite-ignore */ './mercadona.js?nevera');
    expect((await carrega()).productes).toHaveLength(592);
  });
});
