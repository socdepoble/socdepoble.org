// @vitest-environment node
/* Esquelet de catàleg i col·lecció (T4/T8) · els ajudants purs de les formes
   de dades: ordre de categories, agrupació, línia secundària, moure una
   categoria i filtrar suggeriments. */
import { describe, expect, test } from 'vitest';
import {
  agrupaPerCategoria, categoriesEnOrdre, categoriesVisibles, estatArticle, estatLinia, filtraSuggeriments,
  liniaSecundaria, mouCategoria, normalitzaText
} from './articles.js';

const CATEGORIES = [
  { id: 'begudes', nom: 'Begudes', ordre: 2, visible: true },
  { id: 'cafes', nom: 'Cafès', ordre: 0, visible: true },
  { id: 'licors', nom: 'Licors', ordre: 1, visible: false },
  { id: 'esmorzars', nom: 'Esmorzars', visible: true }
];

const ARTICLES = [
  { id: 'aigua', nom: 'Aigua', categoriaId: 'begudes' },
  { id: 'tallat', nom: 'Tallat', categoriaId: 'cafes' },
  { id: 'cassalla', nom: 'Cassalla', categoriaId: 'licors' },
  { id: 'sol', nom: 'Cafè sol', categoriaId: 'cafes' },
  { id: 'misteri', nom: 'Misteri', categoriaId: 'desconeguda' }
];

describe('estats', () => {
  test('un estat desconegut és normal', () => {
    expect(estatArticle({ estat: 'en-colleccio' })).toBe('en-colleccio');
    expect(estatArticle({ estat: 'comprat' })).toBe('normal');
    expect(estatArticle(null)).toBe('normal');
    expect(estatLinia({ estat: 'anullat' })).toBe('anullat');
    expect(estatLinia({ estat: 'marxada' })).toBe('normal');
  });
});

describe('categories', () => {
  test('en ordre, sense ordre al final; les visibles lleven les amagades', () => {
    expect(categoriesEnOrdre(CATEGORIES).map((c) => c.id)).toEqual(['cafes', 'licors', 'begudes', 'esmorzars']);
    expect(categoriesVisibles(CATEGORIES).map((c) => c.id)).toEqual(['cafes', 'begudes', 'esmorzars']);
    expect(categoriesEnOrdre(null)).toEqual([]);
  });

  test('agrupa en l’ordre de les categories, sense grups buits ni amagades, i «Altres» al final', () => {
    const grups = agrupaPerCategoria(ARTICLES, CATEGORIES);
    expect(grups.map((g) => [g.categoria.id, g.articles.map((a) => a.id)])).toEqual([
      ['cafes', ['tallat', 'sol']],
      ['begudes', ['aigua']],
      ['__altres', ['misteri']]
    ]);
    expect(grups[2].categoria.nom).toBe('Altres');
    expect(agrupaPerCategoria(ARTICLES, CATEGORIES, 'Sense categoria')[2].categoria.nom).toBe('Sense categoria');
  });

  test('mouCategoria intercanvia amb la veïna i renumera; a la vora no mou res', () => {
    const amunt = mouCategoria(CATEGORIES, 'begudes', -1);
    expect(amunt.map((c) => [c.id, c.ordre])).toEqual([['cafes', 0], ['begudes', 1], ['licors', 2], ['esmorzars', 3]]);
    expect(mouCategoria(CATEGORIES, 'cafes', -1).map((c) => c.id)).toEqual(['cafes', 'licors', 'begudes', 'esmorzars']);
    expect(mouCategoria(CATEGORIES, 'esmorzars', 1).map((c) => c.id)).toEqual(['cafes', 'licors', 'begudes', 'esmorzars']);
    expect(mouCategoria(CATEGORIES, 'fantasma', 1)).toHaveLength(4);
    /* No toca l'original. */
    expect(CATEGORIES[0]).toEqual({ id: 'begudes', nom: 'Begudes', ordre: 2, visible: true });
  });
});

describe('textos', () => {
  test('la línia secundària junta especificació i valor', () => {
    expect(liniaSecundaria({ secundari: 'Got gran', valor: '1,80 €' })).toBe('Got gran · 1,80 €');
    expect(liniaSecundaria({ valor: '2 variants' })).toBe('2 variants');
    expect(liniaSecundaria({})).toBe('');
  });

  test('normalitzaText lleva accents, dièresis i majúscules', () => {
    expect(normalitzaText('  Creïlles ')).toBe('creilles');
    expect(normalitzaText('CAFÈ')).toBe('cafe');
    expect(normalitzaText(null)).toBe('');
  });

  test('filtraSuggeriments: primer els que comencen, després els que contenen, fins al màxim', () => {
    const llista = [
      { id: 'a', nom: 'Llet sense lactosa' }, { id: 'b', nom: 'Pa de llet' }, { id: 'c', nom: 'Llentilles' },
      { id: 'd', nom: 'Tomaques' }, { nom: 'sense id' }
    ];
    expect(filtraSuggeriments('llet', llista).map((s) => s.id)).toEqual(['a', 'b']);
    expect(filtraSuggeriments('LL', llista).map((s) => s.id)).toEqual(['a', 'c', 'b']);
    expect(filtraSuggeriments('', llista, 2).map((s) => s.id)).toEqual(['a', 'b']);
    expect(filtraSuggeriments('x', null)).toEqual([]);
  });
});
