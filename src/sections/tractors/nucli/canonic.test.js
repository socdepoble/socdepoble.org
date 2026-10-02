// @vitest-environment node
import { webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import {
  aBytes, base64url, concatena, desdeBase64url, desdeUtf8, hex, igualsBytes, jsonCanonic, resolSubtle, sha256, sha256Hex, utf8
} from './canonic.js';

const subtle = webcrypto.subtle;

describe('jsonCanonic', () => {
  test('ordena les claus recursivament i no posa espais', () => {
    expect(jsonCanonic({ b: 1, a: { d: [3, { z: true, y: null }], c: 'x' } }))
      .toBe('{"a":{"c":"x","d":[3,{"y":null,"z":true}]},"b":1}');
  });

  test('ordena per unitats UTF-16, com l\'RFC 8785', () => {
    expect(jsonCanonic({ a: 1, B: 2, é: 3, z: 4 })).toBe('{"B":2,"a":1,"z":4,"é":3}');
  });

  test('números i textos com JSON.stringify, -0 com 0', () => {
    expect(jsonCanonic([-0, 1.5, 1e21, 'Sóc de Poble', ' ', 'cometa"'])).toBe(JSON.stringify([0, 1.5, 1e21, 'Sóc de Poble', ' ', 'cometa"']));
  });

  test('admet objectes sense prototip', () => {
    const objecte = Object.create(null);
    objecte.b = 2;
    objecte.a = 1;
    expect(jsonCanonic(objecte)).toBe('{"a":1,"b":2}');
  });

  test.each([
    ['undefined al primer nivell', undefined],
    ['undefined dins d\'un objecte', { a: undefined }],
    ['undefined dins d\'una llista', [1, undefined]],
    ['forat en una llista', new Array(2)],
    ['funció', { f: () => 1 }],
    ['NaN', { n: NaN }],
    ['Infinity', [Infinity]],
    ['BigInt', { n: 1n }],
    ['símbol', { s: Symbol('x') }],
    ['Date', { d: new Date(0) }],
    ['Map', new Map()],
    ['instància de classe', new (class Peca { constructor() { this.a = 1; } })()]
  ])('rebutja %s', (_nom, valor) => {
    expect(() => jsonCanonic(valor)).toThrow(TypeError);
  });

  test('rebutja els cicles però admet referències repetides no circulars', () => {
    const cicle = { a: 1 };
    cicle.jo = cicle;
    expect(() => jsonCanonic(cicle)).toThrow(/circular/);
    const compartit = { x: 1 };
    expect(jsonCanonic({ a: compartit, b: compartit })).toBe('{"a":{"x":1},"b":{"x":1}}');
  });

  test('l\'error porta el codi i el camí', () => {
    try {
      jsonCanonic({ a: { b: [0, NaN] } });
      throw new Error('no ha llançat');
    } catch (error) {
      expect(error.codi).toBe('JSON_NO_CANONIC');
      expect(error.message).toContain('$.a.b[1]');
    }
  });
});

describe('bytes i codificacions', () => {
  test('utf8 i desdeUtf8 fan el viatge d\'anada i tornada', () => {
    const bytes = utf8('Sóc de Poble · l·l');
    expect(desdeUtf8(bytes)).toBe('Sóc de Poble · l·l');
    expect(() => utf8(12)).toThrow(TypeError);
    expect(() => desdeUtf8(new Uint8Array([0xc3, 0x28]))).toThrow();
  });

  test('aBytes accepta ArrayBuffer i vistes, i rebutja la resta', () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    expect([...aBytes(buffer)]).toEqual([1, 2, 3, 4]);
    expect([...aBytes(new DataView(buffer, 1, 2))]).toEqual([2, 3]);
    expect(() => aBytes('text')).toThrow(TypeError);
    expect(() => aBytes([1, 2])).toThrow(TypeError);
  });

  test('hex', () => {
    expect(hex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff');
    expect(hex(new Uint8Array(0))).toBe('');
  });

  test('base64url amb els vectors de l\'RFC 4648, sense farciment', () => {
    const vectors = [['', ''], ['f', 'Zg'], ['fo', 'Zm8'], ['foo', 'Zm9v'], ['foob', 'Zm9vYg'], ['fooba', 'Zm9vYmE'], ['foobar', 'Zm9vYmFy']];
    for (const [text, codificat] of vectors) {
      expect(base64url(utf8(text))).toBe(codificat);
      expect(desdeUtf8(desdeBase64url(codificat))).toBe(text);
    }
    expect(base64url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
    expect([...desdeBase64url('-_8')]).toEqual([0xfb, 0xff]);
  });

  test('base64url fa el viatge per a totes les llargàries curtes', () => {
    for (let n = 0; n < 40; n++) {
      const bytes = new Uint8Array(n).map((_v, i) => (i * 37 + n * 11) & 0xff);
      expect([...desdeBase64url(base64url(bytes))]).toEqual([...bytes]);
    }
  });

  test('desdeBase64url admet farciment i rebutja l\'alfabet clàssic', () => {
    expect(desdeUtf8(desdeBase64url('Zm8='))).toBe('fo');
    expect(() => desdeBase64url('ab+c')).toThrow(TypeError);
    expect(() => desdeBase64url('ab/c')).toThrow(TypeError);
    expect(() => desdeBase64url('abcde')).toThrow(TypeError);
    expect(() => desdeBase64url(null)).toThrow(TypeError);
  });

  test('concatena i igualsBytes', () => {
    const junts = concatena(new Uint8Array([1]), new Uint8Array([2, 3]).buffer, new Uint8Array(0));
    expect([...junts]).toEqual([1, 2, 3]);
    expect(igualsBytes(junts, new Uint8Array([1, 2, 3]))).toBe(true);
    expect(igualsBytes(junts, new Uint8Array([1, 2, 4]))).toBe(false);
    expect(igualsBytes(junts, new Uint8Array([1, 2]))).toBe(false);
  });
});

describe('sha256', () => {
  test('vectors coneguts (FIPS 180-2)', async () => {
    expect(await sha256Hex('abc', subtle)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await sha256Hex('', subtle)).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('text, bytes i ArrayBuffer donen el mateix resum', async () => {
    const bytes = utf8('Sóc de Poble');
    const esperat = await sha256Hex('Sóc de Poble', subtle);
    expect(await sha256Hex(bytes, subtle)).toBe(esperat);
    expect(await sha256Hex(bytes.slice().buffer, subtle)).toBe(esperat);
    const resum = await sha256(bytes, subtle);
    expect(resum).toBeInstanceOf(Uint8Array);
    expect(resum.length).toBe(32);
  });

  test('sense subtle explícit usa globalThis.crypto.subtle', async () => {
    expect(await sha256Hex('abc')).toBe(await sha256Hex('abc', subtle));
  });

  test('subtle és injectable', async () => {
    const fals = { digest: vi.fn(async () => new Uint8Array(32).fill(7).buffer) };
    expect(await sha256Hex('x', fals)).toBe('07'.repeat(32));
    expect(fals.digest).toHaveBeenCalledWith('SHA-256', expect.anything());
  });

  test('resolSubtle avisa clar si no hi ha WebCrypto', () => {
    expect(() => resolSubtle({})).toThrow(/WebCrypto/);
    expect(resolSubtle(subtle)).toBe(subtle);
  });
});
