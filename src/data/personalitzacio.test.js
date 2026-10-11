/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La taxonomia
   personalitzable, pura: Llei del Píxel (sense personalització, el mateix
   objecte), fusió de les etiquetes, descarts i validació. */
import { expect, test } from 'vitest';
import { SYSTEM_PAGES } from '../config/systemPages.js';
import {
  CATEGORIES_BASE, CLASSES_ETIQUETA, ETIQUETES_BASE, MAX_TEXT, aplicaPersonalitzacio, categoriesBase, etiquetesBase, validaTaxonomia
} from './personalitzacio.js';

const PAGE_COPY = Object.freeze({
  consola: { title: 'Consola Termodinàmica', labels: [{ text: 'Sistema', className: 'sdp-badge-category' }, { text: 'Manteniment', className: 'sdp-badge-tag' }] },
  cervell: { title: 'El Cervell', labels: [{ text: 'Sistema', className: 'sdp-badge-category' }] },
  notes: { title: 'Bloc de notes', labels: [{ text: 'Tutorial', className: 'sdp-badge-neutral', style: { border: '1px' } }] }
});
const TAXONOMIA = Object.freeze({
  v: 1,
  pagines: { consola: { labels: [{ text: 'Maquinària', className: 'sdp-badge-system' }, { text: 'IAIA', className: 'sdp-badge-accent' }] } },
  categories: ['Festes'],
  etiquetes: ['Tomaca', 'Reg']
});

/* ── Llei del Píxel ── */
test.each([
  ['null', null], ['undefined', undefined], ['una cadena', 'x'], ['una llista', []],
  ['sense v', { pagines: {} }], ['amb una altra v', { v: 2, pagines: { consola: { labels: [] } } }],
  ['buida', { v: 1 }], ['amb pagines buides', { v: 1, pagines: {} }],
  ['amb pagines que no és objecte', { v: 1, pagines: [] }],
  ['que nomena només pàgines desconegudes o absents del pageCopy', { v: 1, pagines: { inventada: { labels: [] }, xat: { labels: [] } } }],
  ['amb una pàgina sense labels', { v: 1, pagines: { consola: { labels: null } } }]
])('aplicaPersonalitzacio torna el MATEIX pageCopy amb una taxonomia %s', (_, taxonomia) => {
  expect(aplicaPersonalitzacio(PAGE_COPY, taxonomia)).toBe(PAGE_COPY);
});

test('sense taxonomia, categoriesBase i etiquetesBase tornen les llistes de sèrie mateixes (===)', () => {
  for (const taxonomia of [null, undefined, {}, { v: 1 }, { v: 1, categories: [], etiquetes: [] }, { v: 1, categories: ['Sistema'], etiquetes: ['Tutorial', ''] }, { v: 2, categories: ['Festes'] }]) {
    expect(categoriesBase(taxonomia)).toBe(CATEGORIES_BASE);
    expect(etiquetesBase(taxonomia)).toBe(ETIQUETES_BASE);
  }
  expect(CATEGORIES_BASE).toEqual(['Sistema']);
  expect(ETIQUETES_BASE).toEqual(['Productivitat', 'Tutorial']);
  expect(Object.isFrozen(CATEGORIES_BASE) && Object.isFrozen(ETIQUETES_BASE)).toBe(true);
});

/* ── Fusió ── */
test('amb una taxonomia vàlida només canvien les labels de les pàgines nomenades; la resta són les mateixes referències', () => {
  const nou = aplicaPersonalitzacio(PAGE_COPY, TAXONOMIA);
  expect(nou).not.toBe(PAGE_COPY);
  expect(nou.consola.labels).toEqual([{ text: 'Maquinària', className: 'sdp-badge-system' }, { text: 'IAIA', className: 'sdp-badge-accent' }]);
  expect(nou.consola.title).toBe('Consola Termodinàmica');
  expect(nou.cervell).toBe(PAGE_COPY.cervell);
  expect(nou.notes).toBe(PAGE_COPY.notes);
  expect(Object.keys(nou)).toEqual(Object.keys(PAGE_COPY));
  /* Pura: l'entrada no es toca. */
  expect(PAGE_COPY.consola.labels).toHaveLength(2);
  expect(PAGE_COPY.consola.labels[0].text).toBe('Sistema');
});

test('una pàgina nomenada amb labels buides es queda sense etiquetes; les extres (href, style) d’una etiqueta no viatgen', () => {
  const nou = aplicaPersonalitzacio(PAGE_COPY, { v: 1, pagines: { cervell: { labels: [] }, notes: { labels: [{ text: 'Guia', className: 'sdp-badge-tag', href: '/x', style: {} }] } } });
  expect(nou.cervell.labels).toEqual([]);
  expect(nou.notes.labels).toEqual([{ text: 'Guia', className: 'sdp-badge-tag' }]);
  expect(nou.consola).toBe(PAGE_COPY.consola);
});

test('descarts: una classe fora del conjunt, un text buit o una etiqueta que no és objecte es descarten una per una', () => {
  const nou = aplicaPersonalitzacio(PAGE_COPY, {
    v: 1,
    pagines: {
      consola: { labels: [{ text: 'Bona', className: 'sdp-badge-tag' }, { text: 'Mala', className: 'sp-card-label--enllac' }, { text: '   ', className: 'sdp-badge-tag' }, 'cadena', null, { text: '  Espais  ', className: 'sdp-badge-neutral' }] },
      inventada: { labels: [{ text: 'X', className: 'sdp-badge-tag' }] }
    }
  });
  expect(nou.consola.labels).toEqual([{ text: 'Bona', className: 'sdp-badge-tag' }, { text: 'Espais', className: 'sdp-badge-neutral' }]);
  expect(nou.inventada).toBeUndefined();
});

test('categoriesBase i etiquetesBase: la base davant, els textos nets, sense repetits ni els que ja són a la base', () => {
  expect(categoriesBase(TAXONOMIA)).toEqual(['Sistema', 'Festes']);
  expect(etiquetesBase(TAXONOMIA)).toEqual(['Productivitat', 'Tutorial', 'Tomaca', 'Reg']);
  expect(categoriesBase({ v: 1, categories: [' Festes ', 'Festes', 'Sistema', '', 7, 'Agricultura'] })).toEqual(['Sistema', 'Festes', 'Agricultura']);
  expect(etiquetesBase({ v: 1, etiquetes: ['x'.repeat(MAX_TEXT + 1), 'Reg'] })).toEqual(['Productivitat', 'Tutorial', 'Reg']);
});

/* ── Validació ── */
test('validaTaxonomia: la forma completa és vàlida, i també la mínima', () => {
  expect(validaTaxonomia(TAXONOMIA)).toEqual([]);
  expect(validaTaxonomia({ v: 1 })).toEqual([]);
  expect(validaTaxonomia({ v: 1, pagines: Object.fromEntries(SYSTEM_PAGES.map((p) => [p.key, { labels: [] }])), categories: [], etiquetes: [] })).toEqual([]);
  for (const className of CLASSES_ETIQUETA) {
    expect(validaTaxonomia({ v: 1, pagines: { xat: { labels: [{ text: 'A', className }] } } })).toEqual([]);
  }
});

test('validaTaxonomia diu cada defecte, en valencià i amb la ruta', () => {
  expect(validaTaxonomia(null)).toEqual(['La taxonomia ha de ser un objecte.']);
  expect(validaTaxonomia([])).toEqual(['La taxonomia ha de ser un objecte.']);
  expect(validaTaxonomia({})).toEqual(['La versió de la forma ha de ser 1 (v).']);
  expect(validaTaxonomia({ v: 1, pagines: [] })).toEqual(['«pagines» ha de ser un objecte amb una entrada per pàgina.']);
  expect(validaTaxonomia({ v: 1, pagines: { inventada: { labels: [] } } })).toEqual(['La pàgina «inventada» no existix (SYSTEM_PAGES).']);
  expect(validaTaxonomia({ v: 1, pagines: { xat: {} } })).toEqual(['La pàgina «xat» ha de portar una llista «labels».']);
  const errors = validaTaxonomia({
    v: 1,
    pagines: { xat: { labels: ['cadena', { text: '', className: 'sdp-badge-tag' }, { text: 'x'.repeat(41), className: 'sdp-badge-tag' }, { text: 'Bé', className: 'tailwind' }] } },
    categories: 'Festes',
    etiquetes: ['', 'Reg', 42]
  });
  expect(errors).toEqual([
    'L’etiqueta 1 de «xat» ha de ser un objecte { text, className }.',
    'L’etiqueta 2 de «xat» necessita un text d’1 a 40 caràcters.',
    'L’etiqueta 3 de «xat» necessita un text d’1 a 40 caràcters.',
    'L’etiqueta 4 de «xat» té una classe fora del conjunt: "tailwind".',
    '«categories» ha de ser una llista de textos.',
    'El valor 1 de «etiquetes» necessita un text d’1 a 40 caràcters.',
    'El valor 3 de «etiquetes» necessita un text d’1 a 40 caràcters.'
  ]);
});

test('el conjunt tancat de classes és el de modules.css, congelat', () => {
  expect(CLASSES_ETIQUETA).toEqual(['sdp-badge-buit', 'sdp-badge-system', 'sdp-badge-accent', 'sdp-badge-category', 'sdp-badge-tag', 'sdp-badge-neutral']);
  expect(Object.isFrozen(CLASSES_ETIQUETA)).toBe(true);
});
