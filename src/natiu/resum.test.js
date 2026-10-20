// @vitest-environment node
/* Fase D (261020, tasca 1) · El nonce i el SHA-256 de l'entrada nativa
   (resum.js): els vectors del NIST (FIPS 180-4, exemples de SHA-256), 200
   textos aleatoris contra node:crypto per les dues vies (la pura i la de
   crypto.subtle que falla) i el nonce, que mai cau a Math.random. */
import { createHash, randomBytes, webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { nonceNou, sha256Hex, sha256HexPur } from './resum.js';
import { CODI_ENTRADA_NATIVA } from '../config/entradaNativa.js';

const deNode = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
const SUBTLE_TRENCAT = Object.freeze({ digest: async () => { throw new Error('sense context segur'); } });

describe('SHA-256', () => {
  test.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1']
  ])('el vector del NIST de %j', async (text, resum) => {
    expect(sha256HexPur(text)).toBe(resum);
    expect(await sha256Hex(text, SUBTLE_TRENCAT)).toBe(resum);
    expect(await sha256Hex(text, webcrypto.subtle)).toBe(resum);
  });

  test('200 textos aleatoris (també multibyte i a la vora dels blocs de 64) donen el mateix que node:crypto', async () => {
    const textos = [];
    for (let i = 0; i < 200; i += 1) {
      const bytes = randomBytes(i % 130);
      textos.push(i % 3 === 0 ? `${bytes.toString('hex')}·àéò€🙂` : bytes.toString('base64'));
    }
    for (const llargaria of [55, 56, 63, 64, 65, 119, 120]) textos.push('x'.repeat(llargaria));
    for (const text of textos) {
      expect(sha256HexPur(text), text).toBe(deNode(text));
      expect(await sha256Hex(text, SUBTLE_TRENCAT), text).toBe(deNode(text));
    }
  });

  test('sense subtle també va, i l’eixida és sempre hex en minúscules', async () => {
    expect(await sha256Hex('poble', undefined)).toBe(deNode('poble'));
    expect(await sha256Hex('poble', {})).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('nonceNou', () => {
  test('64 caràcters hex en minúscules, diferent a cada crida', () => {
    const a = nonceNou(webcrypto);
    const b = nonceNou(webcrypto);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
    expect(nonceNou()).toMatch(/^[0-9a-f]{64}$/);
  });

  test('sense getRandomValues llança amb FALLIDA (mai Math.random)', () => {
    for (const cripto of [null, {}, { getRandomValues: 'no' }]) {
      expect(() => nonceNou(cripto)).toThrow(expect.objectContaining({ code: CODI_ENTRADA_NATIVA.FALLIDA }));
    }
  });
});
