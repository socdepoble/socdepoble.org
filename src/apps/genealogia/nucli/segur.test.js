// @vitest-environment node
/* Arbre Genealògic · les guardes de seguretat: coacció de primitius, claus
   perilloses, URL https sense credencials i el reviver de JSON. */
import { describe, expect, test } from 'vitest';
import { MIDA_MAXIMA_IMPORTACIO, enter, esClauSegura, objectePla, revivorSegur, text, urlSegura } from './segur.js';

describe('segur', () => {
  test('el límit d’importació és de 8 MiB', () => {
    expect(MIDA_MAXIMA_IMPORTACIO).toBe(8 * 1024 * 1024);
  });

  test('esClauSegura rebutja __proto__, constructor, prototype i el que no és text', () => {
    for (const clau of ['__proto__', 'constructor', 'prototype', 1, null, undefined, {}]) expect(esClauSegura(clau)).toBe(false);
    expect(esClauSegura('nom')).toBe(true);
  });

  test('text coacciona primitius, rebutja objectes, lleva controls i talla', () => {
    expect(text(null, 10)).toBe('');
    expect(text(undefined, 10)).toBe('');
    expect(text(1908, 10)).toBe('1908');
    expect(text(true, 10)).toBe('true');
    expect(text(Number.NaN, 10)).toBe('');
    expect(text('  a\u0000b\u0007c\r\nd\te  ', 50)).toBe('abc\nd\te');
    expect(text('abcdef', 3)).toBe('abc');
    expect(() => text({ toString: () => 'x' }, 10)).toThrow(TypeError);
    expect(() => text(['a'], 10)).toThrow(TypeError);
    expect(() => text('a', -1)).toThrow(TypeError);
  });

  test('enter: només enters segurs dins del rang, i textos curts de xifres', () => {
    expect(enter(5, { min: 1, max: 10 })).toBe(5);
    expect(enter('7', { min: 1, max: 10 })).toBe(7);
    expect(enter('-3', { min: -5, max: 0 })).toBe(-3);
    expect(enter(11, { min: 1, max: 10 })).toBeNull();
    expect(enter(1.5, { min: 0, max: 10 })).toBeNull();
    expect(enter('1e3', { min: 0, max: 5000 })).toBeNull();
    expect(enter('1234567', { min: 0, max: 1e9 })).toBeNull();
    expect(enter(null)).toBeNull();
  });

  test('urlSegura: https sense credencials, ≤ 2048', () => {
    expect(urlSegura('https://pares.cultura.gob.es/')).toBe('https://pares.cultura.gob.es/');
    expect(urlSegura('http://exemple.org/')).toBe('');
    expect(urlSegura('javascript:alert(1)')).toBe('');
    expect(urlSegura('https://usuari:clau@exemple.org/')).toBe('');
    expect(urlSegura(`https://exemple.org/${'a'.repeat(2100)}`)).toBe('');
    expect(urlSegura('no és una url')).toBe('');
    expect(urlSegura(42)).toBe('');
  });

  test('objectePla', () => {
    expect(objectePla({})).toBe(true);
    expect(objectePla(Object.create(null))).toBe(true);
    expect(objectePla([])).toBe(false);
    expect(objectePla(null)).toBe(false);
    expect(objectePla(new Date())).toBe(false);
  });

  test('revivorSegur fa fallar JSON.parse amb claus perilloses', () => {
    expect(JSON.parse('{"a":{"b":[1,2]}}', revivorSegur)).toEqual({ a: { b: [1, 2] } });
    expect(() => JSON.parse('{"a":{"__proto__":{"x":1}}}', revivorSegur)).toThrow(TypeError);
    expect(() => JSON.parse('{"constructor":{"prototype":{}}}', revivorSegur)).toThrow(TypeError);
    expect({}.x).toBeUndefined();
  });
});
