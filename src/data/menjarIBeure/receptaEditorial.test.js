import { describe, expect, it } from 'vitest';
import { OBRA_QUE_DINEM, RECEPTES_QUE_DINEM } from '../patrimoni/queDinem.js';
import { adaptaReceptaEditorial, SHA256_PDF_QUE_DINEM } from './receptaEditorial.js';
import { carregaReceptes, validaReceptari } from './horitzontal.js';

describe('Editorial source → calculation view', () => {
  it('preserves all149 stable identities,149complete ingredient/method records,47videos and148upload images', async () => {
    const before = JSON.stringify(RECEPTES_QUE_DINEM);
    const { receptes, items, metadades } = await carregaReceptes();
    expect(receptes).toHaveLength(149); expect(items).toHaveLength(149);
    expect(receptes.map(r => r.slug)).toEqual(RECEPTES_QUE_DINEM.map(r => r.slug));
    expect(new Set(receptes.map(r => r.id)).size).toBe(149);
    expect(receptes.filter(r => r.ingredients.length)).toHaveLength(149);
    expect(receptes.filter(r => r.preparacio.length)).toHaveLength(149);
    expect(receptes.filter(r => r.youtubeId)).toHaveLength(47);
    expect(receptes.filter(r => r.imatgeUrl)).toHaveLength(148);
    expect(metadades).toMatchObject({ preusImportats: 0, ingredientsLiterals: 149, preparacionsLiterals: 149, fontUnica: 'src/data/patrimoni/queDinem.js' });
    for (const [i, r] of receptes.entries()) {
      const original = RECEPTES_QUE_DINEM[i];
      expect(r.id).toBe(`qd-${String(original.numero).padStart(3, '0')}-${original.slug}`);
      expect(r.nom).toBe(original.titol);
      expect(r.ingredients).toEqual(original.ingredients.flatMap(b => b.linies));
      expect(r.preparacio).toEqual(original.preparacio.flatMap(b => b.linies));
      expect(r.blocsIngredients).toBe(original.ingredients);
      expect(r.blocsPreparacio).toBe(original.preparacio);
      expect(r.notes).toBe(original.notes);
      expect(r.editorial).toBe(original);
      expect(r.font).toMatchObject({ document: OBRA_QUE_DINEM.pdf, sha256: SHA256_PDF_QUE_DINEM, pagina: original.pagina, pagines: original.pagines });
      expect(r).not.toHaveProperty('racionsBaseProposades');
      expect(r).not.toHaveProperty('preu'); expect(r).not.toHaveProperty('alergens');
      if (r.imatgeUrl) expect(r.imatgeUrl).toMatch(/^\/assets\/uploads\/patrimoni\/que-dinem\/p\d{3}\.webp$/);
    }
    expect(receptes.filter(r => r.notes.length)).toHaveLength(47);
    expect(JSON.stringify(RECEPTES_QUE_DINEM)).toBe(before);
    expect((await carregaReceptes()).receptes).toBe(receptes);
  });
  it('keeps variant blocks and note provenance while adapting only calculation lines', () => {
    const original = RECEPTES_QUE_DINEM[114];
    const r = adaptaReceptaEditorial(original, OBRA_QUE_DINEM);
    expect(r.blocsIngredients.map(b => b.titol)).toEqual(['Ingredients per a la pasta', 'Farciment de tomaca', 'Variant', 'Farciment de verdura']);
    expect(Object.isFrozen(r.ingredients)).toBe(true);
    expect(() => r.ingredients.push('Inventat')).toThrow();
    expect(() => adaptaReceptaEditorial(null, OBRA_QUE_DINEM)).toThrow();
    expect(() => validaReceptari({ receptes: [{ ...r, imatgeUrl: '/assets/patrimoni/que-dinem/p127.webp' }] })).toThrow(/Imatge/);
  });
});
