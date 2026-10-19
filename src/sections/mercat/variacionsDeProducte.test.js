/**
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · Auditoria Codex
 * 2030 (§3.2) · Les variacions d'un producte es trien per un id ESTABLE, mai
 * per la posició ni pel nom; «Esgotat» és el stock_status declarat. La regla
 * pura (variacionsDeProducte.js) i la llavor que la porta (marketSeed.js).
 */
import { describe, expect, test } from 'vitest';
import { clauInicial, esVariacioEsgotada, variacioActiva, variacionsDelProducte } from './variacionsDeProducte.js';
import { MOCK_MARKET_ITEMS } from './marketSeed.js';
import { idDeVariacio } from '../../data/mapejadorSeccions.js';

const producte = (variations) => ({ id: 'p', variations });

describe('variacionsDelProducte', () => {
  test('cada variació porta la seua clau estable (l’id net, en forma canònica) i els seus camps', () => {
    const [gris, verda] = variacionsDelProducte(producte([
      { id: ' Gris-Plom ', name: ' Edició Gris Plom ', price: '15.00€', description: 'Cotó.', image: '/a.png' },
      { id: 'verda-pi', name: 'Edició Verda', price: 16, stock_status: 'Esgotat' }
    ]));
    expect(gris).toMatchObject({ clau: 'gris-plom', id: 'gris-plom', nom: 'Edició Gris Plom', preu: '15.00€', descripcio: 'Cotó.', esgotada: false });
    expect(gris.variacio.image).toBe('/a.png');
    expect(verda).toMatchObject({ clau: 'verda-pi', id: 'verda-pi', preu: '16', esgotada: true });
  });

  test('un id que no és net no viatja: la variació és de llegat i la seua clau no pot coincidir amb cap id', () => {
    const variacions = variacionsDelProducte(producte([
      { id: '../x', name: 'A' }, { id: 'a b', name: 'B' }, { id: 7, name: 'C' }, { id: 'x'.repeat(65), name: 'D' },
      { name: 'E' }, { id: 'llegat-5', name: 'F' }
    ]));
    expect(variacions.map((v) => v.id)).toEqual([null, null, null, null, null, 'llegat-5']);
    expect(variacions.map((v) => v.clau)).toEqual(['llegat:0', 'llegat:1', 'llegat:2', 'llegat:3', 'llegat:4', 'llegat-5']);
    expect(new Set(variacions.map((v) => v.clau)).size).toBe(variacions.length);
  });

  test('un id repetit dins del producte: la primera el conserva, la segona és de llegat', () => {
    const variacions = variacionsDelProducte(producte([{ id: 'gris', name: 'A' }, { id: 'GRIS', name: 'B' }]));
    expect(variacions.map((v) => [v.clau, v.id])).toEqual([['gris', 'gris'], ['llegat:1', null]]);
  });

  test('una cadena és una variació de llegat amb el nom; el que no és variació no hi entra', () => {
    const variacions = variacionsDelProducte(producte(['Gris', null, 7, ['x'], { name: 'Verda' }]));
    expect(variacions.map((v) => [v.clau, v.nom])).toEqual([['llegat:0', 'Gris'], ['llegat:4', 'Verda']]);
    expect(variacionsDelProducte(producte('Gris'))).toEqual([]);
    expect(variacionsDelProducte(null)).toEqual([]);
  });
});

describe('esVariacioEsgotada: només el que declara el stock_status', () => {
  test.each(['Esgotat', 'esgotada', ' ESGOTATS ', 'Agotado', 'out_of_stock', 'Out of stock', 'sold out'])('«%s» és esgotat', (estat) => {
    expect(esVariacioEsgotada({ stock_status: estat })).toBe(true);
  });

  test.each(['', 'Disponible', 'Últimes unitats', null, undefined, 0])('«%s» no ho és', (estat) => {
    expect(esVariacioEsgotada({ stock_status: estat })).toBe(false);
  });

  test('sense variació, no ho és', () => {
    expect(esVariacioEsgotada(null)).toBe(false);
  });
});

describe('la triada', () => {
  const variacions = variacionsDelProducte(producte([
    { id: 'verda', name: 'Verda', stock_status: 'Esgotat' }, { id: 'gris', name: 'Gris' }, { id: 'blanca', name: 'Blanca' }
  ]));

  test('la d’entrada és la primera que no està esgotada; si totes ho estan, la primera', () => {
    expect(clauInicial(variacions)).toBe('gris');
    expect(clauInicial(variacionsDelProducte(producte([{ id: 'a', stock_status: 'Esgotat' }, { id: 'b', stock_status: 'Esgotat' }])))).toBe('a');
    expect(clauInicial([])).toBeNull();
  });

  test('la variació activa és la de la clau triada; una clau que ja no hi és torna a la d’entrada', () => {
    expect(variacioActiva(variacions, 'blanca').nom).toBe('Blanca');
    expect(variacioActiva(variacions, 'verda').nom).toBe('Verda');
    expect(variacioActiva(variacions, 'desapareguda').nom).toBe('Gris');
    expect(variacioActiva(variacions, null).nom).toBe('Gris');
    expect(variacioActiva([], 'gris')).toBeNull();
  });
});

describe('la llavor del Mercat: cada variació porta un id estable, net i únic dins del producte', () => {
  test('tots els ids són nets (la regla del mapejador) i únics per producte', () => {
    for (const item of MOCK_MARKET_ITEMS) {
      const ids = (item.variations || []).map((v) => v.id);
      for (const id of ids) expect(idDeVariacio(id), `${item.id}/${id}`).toBe(id);
      expect(new Set(ids).size, item.id).toBe(ids.length);
    }
  });

  test('la Samarreta: Gris Plom i Verda, i la Verda està esgotada', () => {
    const samarreta = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    const variacions = variacionsDelProducte(samarreta);
    expect(variacions.map((v) => [v.id, v.nom, v.esgotada])).toEqual([
      ['gris-plom', 'Edició Gris Plom', false],
      ['verda-pi', 'Edició Verda', true]
    ]);
  });
});
