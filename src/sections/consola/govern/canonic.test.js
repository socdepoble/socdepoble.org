/**
 * La còpia del Govern (canonic.js) ha de donar exactament els mateixos bytes
 * que la de la Porta d'Aprovació dels Tractors: una certificació signada o
 * resumida amb l'una s'ha de poder comprovar amb l'altra. Les proves sí que
 * poden importar el carril dels Tractors (privacitat.test.js les exclou).
 */
import { expect, test } from 'vitest';
import * as govern from './canonic.js';
import * as tractors from '../../tractors/nucli/canonic.js';

const MOSTRES_JSON = [
  null, true, false, 0, -1.5, 1e21, '', 'à·l·l «cometes»   🌿',
  [], [1, 'dos', null, [true]],
  { b: 1, a: { d: [3, 2], c: 'x' }, 'é': null, A: false },
];

test('el JSON canònic és idèntic al dels Tractors', () => {
  for (const mostra of MOSTRES_JSON) expect(govern.jsonCanonic(mostra)).toBe(tractors.jsonCanonic(mostra));
});

test('rebutja els mateixos valors que els Tractors', () => {
  const cicle = {};
  cicle.jo = cicle;
  for (const dolent of [undefined, () => 1, Number.NaN, Infinity, new Date(0), new Map(), cicle, { a: undefined }]) {
    expect(() => govern.jsonCanonic(dolent)).toThrow(TypeError);
    expect(() => tractors.jsonCanonic(dolent)).toThrow(TypeError);
  }
});

test('base64url anada i tornada idèntica als Tractors', () => {
  for (let n = 0; n < 40; n++) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n * 11) % 256);
    const text = govern.base64url(bytes);
    expect(text).toBe(tractors.base64url(bytes));
    expect([...govern.desdeBase64url(text)]).toEqual([...bytes]);
    expect([...govern.desdeBase64url(text)]).toEqual([...tractors.desdeBase64url(text)]);
  }
  for (const dolent of ['a', 'ab+c', 'ab/c', 'abc$']) {
    expect(() => govern.desdeBase64url(dolent)).toThrow(TypeError);
  }
});

test('el SHA-256 en hexadecimal és idèntic als Tractors', async () => {
  for (const entrada of ['', 'Sóc de Poble', new Uint8Array([0, 1, 2, 255])]) {
    expect(await govern.sha256Hex(entrada)).toBe(await tractors.sha256Hex(entrada));
  }
  expect(await govern.sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
