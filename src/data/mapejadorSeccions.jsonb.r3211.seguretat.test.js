import { expect, test } from 'vitest';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
const HOSTILS = [{ toString: 0 }, [{ toString: 0 }], true, { text: 'injectat' }];
const TEXT = ['title', 'description', 'summary', 'content', 'author_name', 'seller', 'tag', 'source', 'date', 'searchText', 'plainText', 'category', 'folderId', 'updatedAt'];

test.each(['mur','mercat','events','multimedia','notes'])('JSONB R32.11: %s coacciona abans de coerció, spread i HTML', seccio => {
  for (const hostil of HOSTILS) {
    const payload = { ...Object.fromEntries(TEXT.map(k => [k, hostil])), image_url: hostil, avatar_url: hostil,
      tags: [hostil, 'etiqueta'], variations: [{ name: hostil, price: hostil, description: hostil, image: hostil, stock_status: hostil }] };
    const original = JSON.stringify(payload);
    let item;
    expect(() => { item = mapSectionSubmissionToItem({ id: 'prova', sectionId: seccio, createdAt: '2026-11-18T16:00:00Z', payload }); }).not.toThrow();
    for (const key of TEXT) expect(item[key] == null || typeof item[key] === 'string' || typeof item[key] === 'number', key).toBe(true);
    if (seccio === 'mercat') for (const v of item.variations) for (const k of ['name','price','description','stock_status']) expect(v[k] == null || typeof v[k] === 'string', k).toBe(true);
    expect(JSON.stringify(payload)).toBe(original);
  }
});

test('JSONB R32.11: ni el text d’envelope ni el d’una variació invoca toString extern', () => {
  const toString = () => { throw new Error('No ha d’executar-se'); };
  const hostil = { toString };
  expect(() => mapSectionSubmissionToItem({ id: hostil, sectionId: hostil, createdAt: hostil, payload: { title: hostil } })).not.toThrow();
  const item = mapSectionSubmissionToItem({ id: 'x', sectionId: 'mercat', payload: { variations: [{ name: hostil, image: hostil }] } });
  expect(item.variations[0].name).toBe(''); expect(item.variations[0].image).toBeNull();
});

test('JSONB R32.11: valors normals compatibles i camps estructurats consentits es preserven', () => {
  const item = mapSectionSubmissionToItem({ id: 'x', sectionId: 'mercat', payload: { title: ' Poma ', description: '<p>Del camp</p>', price: 12,
    variations: [{ id: 'caixa', name: 'Caixa', price: 10, image: '/poma.jpg', stock_status: 'disponible' }], tags: ['camp'], metadades: { arbre: 'pomera' } } });
  expect(item).toMatchObject({ title: 'Poma', description: '<p>Del camp</p>', price: 12, tags: ['camp'], metadades: { arbre: 'pomera' },
    variations: [{ id: 'caixa', name: 'Caixa', price: '10', image: '/poma.jpg', stock_status: 'disponible' }] });
  const llegit = elementDeFilaPublicada({ id: 'x', payload: { title: { toString: 0 }, author_name: { toString: 0 } }, titol: 'Columna' });
  expect(llegit.author_name).toBe('Columna'); expect(llegit.title).toBeUndefined();
});
