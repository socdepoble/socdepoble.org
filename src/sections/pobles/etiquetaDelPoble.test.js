/**
 * R22 (Llibre Mestre, «4a Etiqueta Geogràfica Final») · La pastilla del poble:
 * el nom curt si la fitxa porta etiqueta_curta_poble (cap fitxa real no el
 * porta hui) o el nom oficial, i ruta /pobles/<slug> només amb un slug
 * canònic. Dades sintètiques.
 */
import { expect, test } from 'vitest';
import { etiquetaDelPoble, nomDeLEtiquetaDelPoble, pobleDeLElement } from './etiquetaDelPoble.js';

test('nomDeLEtiquetaDelPoble: el nom curt net o, sense, el nom oficial (name o title)', () => {
  expect(nomDeLEtiquetaDelPoble({ name: 'La Torre de les Maçanes', etiqueta_curta_poble: '  La   Torre ' })).toBe('La Torre');
  expect(nomDeLEtiquetaDelPoble({ name: 'La Torre de les Maçanes', etiqueta_curta_poble: '  ' })).toBe('La Torre de les Maçanes');
  expect(nomDeLEtiquetaDelPoble({ title: 'Penàguila', etiqueta_curta_poble: null })).toBe('Penàguila');
  expect(nomDeLEtiquetaDelPoble({ title: 'Penàguila', etiqueta_curta_poble: 'x'.repeat(61) })).toBe('Penàguila');
  expect(nomDeLEtiquetaDelPoble(null)).toBe('');
});

test('etiquetaDelPoble: slug canònic (slug o id) i un nom; si no, null', () => {
  expect(etiquetaDelPoble({ slug: 'la-torre-de-les-macanes', name: 'La Torre de les Maçanes', etiqueta_curta_poble: 'La Torre' }))
    .toEqual({ text: 'La Torre', href: '/pobles/la-torre-de-les-macanes', className: 'sdp-badge-tag sp-card-label--enllac' });
  expect(etiquetaDelPoble({ id: 'penaguila', title: 'Penàguila' }).href).toBe('/pobles/penaguila');
  for (const dolent of [{ id: 'La Torre', title: 'La Torre' }, { id: '../admin', title: 'X' }, { id: 'penaguila' }, null, 'penaguila']) {
    expect(etiquetaDelPoble(dolent)).toBeNull();
  }
});

test('pobleDeLElement: només dins de les fitxes, per poble_id o pel lloc de qui publica', () => {
  const torre = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes' };
  expect(pobleDeLElement({ poble_id: 'la-torre-de-les-macanes' }, [torre])).toBe(torre);
  expect(pobleDeLElement({ author_location: 'La Torre de les Maçanes · Penàguila' }, [torre])).toBe(torre);
  expect(pobleDeLElement({ poble_id: 'la-torre-de-les-macanes' }, [])).toBeNull();
  expect(pobleDeLElement({ poble_id: 'la-torre-de-les-macanes' }, undefined)).toBeNull();
  expect(pobleDeLElement({}, [torre])).toBeNull();
  expect(pobleDeLElement(null, [torre])).toBeNull();
});
