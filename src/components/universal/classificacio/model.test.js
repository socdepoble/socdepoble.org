import { expect, test } from 'vitest';
import {
  CATEGORIA_GENERAL, classificacioDe, cataleg, canvisDeClassificacio, reanomena, esborra, usos
} from './model.js';

const N1 = { id: 'n1', labels: ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble'], tags: ['Tutorial'] };

test('E5 · una nota antiga es llig amb el mateix criteri que les píndoles: els labels no es perden', () => {
  expect(classificacioDe(N1)).toEqual({
    antiga: true, categories: [], tags: ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble']
  });
  // Un label objecte amb classe de categoria es llig com a categoria.
  expect(classificacioDe({ labels: [{ text: 'Mur', className: 'sdp-badge-category' }, 'Vell'] }))
    .toEqual({ antiga: true, categories: ['Mur'], tags: ['Vell'] });
  expect(classificacioDe({ categories: ['A'], tags: ['x'], labels: ['Ignorat'] }))
    .toEqual({ antiga: false, categories: ['A'], tags: ['x'] });
});

test('E5 · el primer desat d’una nota antiga l’escriu sencera i conserva totes les etiquetes', () => {
  const canvis = canvisDeClassificacio(N1, { tags: ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble', 'Nova'] });
  expect(canvis).toEqual({
    categories: [CATEGORIA_GENERAL],
    tags: ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble', 'Nova']
  });
});

test('regla d’orfandat: cap escriptura deixa una nota sense categoria; les etiquetes sí que poden quedar buides', () => {
  const nota = { id: 'a', categories: ['Receptes'], tags: ['Hort'] };
  expect(canvisDeClassificacio(nota, { categories: [] })).toEqual({ categories: [CATEGORIA_GENERAL] });
  expect(canvisDeClassificacio(nota, { tags: [] })).toEqual({ tags: [] });
  // Sense canvis reals no s'escriu res.
  expect(canvisDeClassificacio(nota, { categories: ['Receptes'], tags: ['Hort'] })).toEqual({});
});

test('el catàleg és la unió de totes les notes i dels valors de sèrie, ordenada', () => {
  const notes = [N1, { id: 'b', categories: ['Receptes'], tags: ['Hort'] }, { id: 'c', categories: ['Agenda'] }];
  expect(cataleg(notes, 'categories', ['Sistema'])).toEqual(['Agenda', 'Receptes', 'Sistema']);
  expect(cataleg(notes, 'tags', ['Tutorial'])).toEqual(['Hort', 'Productivitat', 'Sistema', 'Sóc de Poble', 'Tutorial']);
  expect(usos(notes, 'tags')).toMatchObject({ Tutorial: 1, Hort: 1 });
});

test('reanomenar canvia el valor a totes les notes que el porten, i només a eixes', () => {
  const notes = [
    { id: 'a', categories: ['Receptes', 'Hort'], tags: [] },
    { id: 'b', categories: ['Receptes'], tags: ['x'] },
    { id: 'c', categories: ['Agenda'], tags: [] }
  ];
  expect(reanomena(notes, 'categories', 'Receptes', ' Cuina ').map(({ doc, canvis }) => [doc.id, canvis])).toEqual([
    ['a', { categories: ['Cuina', 'Hort'] }],
    ['b', { categories: ['Cuina'] }]
  ]);
  // Si el nom nou ja el porta la nota, no es duplica.
  expect(reanomena([{ id: 'd', categories: ['A', 'B'] }], 'categories', 'A', 'B')[0].canvis).toEqual({ categories: ['B'] });
  expect(reanomena(notes, 'categories', 'Receptes', '  ')).toEqual([]);
  expect(reanomena(notes, 'categories', 'Receptes', 'Receptes')).toEqual([]);
});

test('reanomenar una etiqueta d’una nota antiga la migra sencera', () => {
  const [op] = reanomena([N1], 'tags', 'Tutorial', 'Guia');
  expect(op.canvis).toEqual({ categories: [CATEGORIA_GENERAL], tags: ['Sistema', 'Productivitat', 'Guia', 'Sóc de Poble'] });
});

test('esborrar lleva el valor de totes les notes; qui es queda sense categoria rep «General»', () => {
  const notes = [
    { id: 'a', categories: ['Receptes', 'Hort'], tags: ['x'] },
    { id: 'b', categories: ['Receptes'], tags: ['x'] },
    { id: 'c', categories: ['Agenda'], tags: [] }
  ];
  expect(esborra(notes, 'categories', 'Receptes').map(({ doc, canvis }) => [doc.id, canvis])).toEqual([
    ['a', { categories: ['Hort'] }],
    ['b', { categories: [CATEGORIA_GENERAL] }]
  ]);
  expect(esborra(notes, 'tags', 'x').map(({ doc, canvis }) => [doc.id, canvis])).toEqual([
    ['a', { tags: [] }],
    ['b', { tags: [] }]
  ]);
});
