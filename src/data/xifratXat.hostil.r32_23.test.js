// @vitest-environment node
import { expect, test } from 'vitest';
import { creaServeiAmbitXat } from './xifratXat.js';
import { deBase64url, desxifraAesGcm, horariBase, importaClauAesGcm, xifraAesGcm } from './xifratXatCripto.js';
import { llegixCarrega } from './xifratXatFormats.js';

test('R3223-CRI-01: el secret HPKE parcial es posa a zero quan falla la derivació del nonce', async () => {
  const signes = []; let n = 0;
  const subtle = Object.fromEntries(['digest', 'importKey', 'exportKey', 'generateKey', 'deriveBits', 'deriveKey', 'encrypt', 'decrypt', 'verify', 'unwrapKey'].map(nom => [nom, async () => ({})]));
  subtle.sign = async () => { if (++n === 5) throw new Error('transport cripto sintètic'); const bytes = new Uint8Array(32).fill(n + 10); signes.push(bytes); return bytes.buffer; };
  const cripto = { subtle, getRandomValues: bytes => bytes.fill(1) };
  const original = new Uint8Array(32).fill(77);
  await expect(horariBase(cripto, original, new Uint8Array([1]))).rejects.toThrow('transport cripto sintètic');
  expect(signes[2]).toEqual(new Uint8Array(32));
  expect(original).toEqual(new Uint8Array(32).fill(77));
});

test('R3223-CRI-02: el resultat tardà amb FK aniuada es neteja abans de rebutjar-lo', async () => {
  const servei = creaServeiAmbitXat(); servei.fixaAmbit('a', 'id');
  const k = new Uint8Array(32).fill(91); let resol;
  const tardana = servei.guardaAmbit(() => new Promise(resolve => { resol = resolve; }));
  servei.oblidaClausXat();
  const resultat = { contingut: { a: { k } } }; resultat.cicle = resultat;
  resol(resultat);
  await expect(tardana).rejects.toMatchObject({ code: 'AMBIT_CANVIAT' });
  expect(k).toEqual(new Uint8Array(32));
});

test('R3223-CRI-03 regressió: IV natius frescos, GCM autentica AAD/CT i el format refusa truncaments/versions/base64', async () => {
  const clau = await importaClauAesGcm(globalThis.crypto, new Uint8Array(32).fill(7));
  const ivs = new Set(); const aad = Uint8Array.of(1, 2); const dades = Uint8Array.of(9, 8, 7);
  for (let i = 0; i < 128; i++) {
    const { iv, xifrat } = await xifraAesGcm(globalThis.crypto, clau, { aad, dades });
    ivs.add(Buffer.from(iv).toString('hex'));
    await expect(desxifraAesGcm(globalThis.crypto, clau, { iv, xifrat, aad })).resolves.toEqual(dades);
    await expect(desxifraAesGcm(globalThis.crypto, clau, { iv, xifrat, aad: Uint8Array.of(3) })).rejects.toMatchObject({ codi: 'XIFRAT_MANIPULAT' });
    xifrat[0] ^= 1;
    await expect(desxifraAesGcm(globalThis.crypto, clau, { iv, xifrat, aad })).rejects.toMatchObject({ codi: 'XIFRAT_MANIPULAT' });
  }
  expect(ivs.size).toBe(128);
  for (const input of ['', '=', 'a', 'AA=', 'AB', 'é']) {
    if (input === '') continue;
    expect(() => deBase64url(input)).toThrow(expect.objectContaining({ codi: 'BASE64URL_INVALID' }));
  }
  expect(() => llegixCarrega(Uint8Array.of(99))).toThrow(expect.objectContaining({ codi: 'FORMAT_INVALID' }));
  expect(() => llegixCarrega(Uint8Array.of(1))).toThrow(expect.objectContaining({ codi: 'FORMAT_INVALID' }));
});


test('Gauntlet: la neteja d’un resultat profund de 20k nivells no esgota la pila', async () => {
  const servei = creaServeiAmbitXat(); servei.fixaAmbit('a', 'id');
  const k = new Uint8Array(32).fill(9); let resultat = { k };
  for (let i = 0; i < 20_000; i++) resultat = { dada: resultat };
  let resol; const promesa = servei.guardaAmbit(() => new Promise(resolve => { resol = resolve; }));
  servei.oblidaClausXat(); resol(resultat);
  await expect(promesa).rejects.toMatchObject({ code: 'AMBIT_CANVIAT' }); expect(k.every(byte => byte === 0)).toBe(true);
});


test('Àrbitre independent: ni Symbol.toStringTag ni una branca hostil impedixen esborrar altres claus', async () => {
  const servei = creaServeiAmbitXat(); servei.fixaAmbit('a', 'id');
  const k = new Uint8Array(32).fill(93); let resolve, getters = 0;
  const pendent = servei.guardaAmbit(() => new Promise(r => { resolve = r; }));
  servei.oblidaClausXat();
  const poison = {};
  Object.defineProperty(poison, Symbol.toStringTag, { get() { getters++; throw new Error('No executar accessor sintètic'); } });
  const inaccessible = new Proxy({}, { ownKeys() { throw new Error('Branca no inspeccionable'); } });
  resolve({ k, poison, inaccessible });
  await expect(pendent).rejects.toMatchObject({ code: 'AMBIT_CANVIAT' });
  expect(getters).toBe(0); expect(k.every(byte => byte === 0)).toBe(true);
});
test('Àrbitre independent: la neteja usa la primitiva intrínseca i també recorre propietats Symbol', async () => {
  const servei = creaServeiAmbitXat(); servei.fixaAmbit('a', 'id');
  const k = new Uint8Array(32).fill(94), altre = new Uint8Array(32).fill(95);
  Object.defineProperty(k, 'fill', { get() { throw new Error('No executar fill substituït'); } });
  let resolve; const pendent = servei.guardaAmbit(() => new Promise(r => { resolve = r; }));
  servei.oblidaClausXat(); resolve({ altre, branca: { [Symbol('clau')]: k } });
  await expect(pendent).rejects.toMatchObject({ code: 'AMBIT_CANVIAT' });
  expect(k.every(byte => byte === 0)).toBe(true); expect(altre.every(byte => byte === 0)).toBe(true);
});
