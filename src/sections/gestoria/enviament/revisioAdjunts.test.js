/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 11) · La còpia
 * revisada és de qui la captura i de ningú més; la comparació mira cada
 * byte; l'empremta d'aprovació és SHA-256 de la forma canònica. Dades
 * sintètiques.
 */
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { ALGORISME_EMPREMTA, copiaAdjunts, empremtaAdjunts, formaCanonica, mateixosAdjunts, potCalcularEmpremta } from './revisioAdjunts.js';

const { subtle } = webcrypto;
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const adjunt = (bytes, nom = 'sintetic.xlsx', tipus = XLSX) => ({ nom, tipus, dades: new Uint8Array(bytes) });

describe('copiaAdjunts', () => {
  test('copia els bytes: mutar l’original (encara que siga el mateix array) no toca la còpia', () => {
    const original = [adjunt([1, 2, 3])];
    const copia = copiaAdjunts(original);
    expect(copia[0].dades).not.toBe(original[0].dades);
    expect(copia[0].dades.buffer).not.toBe(original[0].dades.buffer);
    original[0].dades[0] = 9;
    expect([...copia[0].dades]).toEqual([1, 2, 3]);
    expect(Object.isFrozen(copia)).toBe(true);
    expect(Object.isFrozen(copia[0])).toBe(true);
  });

  test('una vista parcial d’un buffer més gran copia només els seus bytes', () => {
    const gran = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const [copia] = copiaAdjunts([{ nom: 'a.csv', tipus: 'text/csv', dades: gran.subarray(2, 4) }]);
    expect([...copia.dades]).toEqual([2, 3]);
    expect(copia.dades.byteLength).toBe(copia.dades.buffer.byteLength);
  });

  test('un ArrayBuffer també es copia; el que no són bytes es queda com està; sense llista, cap', () => {
    const buffer = new Uint8Array([7, 8]).buffer;
    const [deBuffer, senseBytes] = copiaAdjunts([{ nom: 'a', tipus: '', dades: buffer }, { nom: 'b', tipus: '', dades: 'text' }]);
    expect([...deBuffer.dades]).toEqual([7, 8]);
    expect(senseBytes.dades).toBe('text');
    expect(copiaAdjunts(null)).toEqual([]);
  });
});

describe('mateixosAdjunts', () => {
  test('els mateixos bytes en un altre array: sí; un byte, el nom, el tipus o el nombre diferents: no', () => {
    const copia = copiaAdjunts([adjunt([1, 2, 3])]);
    expect(mateixosAdjunts([adjunt([1, 2, 3])], copia)).toBe(true);
    expect(mateixosAdjunts([adjunt([1, 2, 4])], copia)).toBe(false);
    expect(mateixosAdjunts([adjunt([1, 2])], copia)).toBe(false);
    expect(mateixosAdjunts([adjunt([1, 2, 3], 'altre.xlsx')], copia)).toBe(false);
    expect(mateixosAdjunts([adjunt([1, 2, 3], 'sintetic.xlsx', 'text/csv')], copia)).toBe(false);
    expect(mateixosAdjunts([adjunt([1, 2, 3]), adjunt([1])], copia)).toBe(false);
    expect(mateixosAdjunts(null, copia)).toBe(false);
  });

  test('el mateix array mutat després de copiar: ja no són els mateixos', () => {
    const adjunts = [adjunt([1, 2, 3])];
    const copia = copiaAdjunts(adjunts);
    adjunts[0].dades[2] = 0;
    expect(mateixosAdjunts(adjunts, copia)).toBe(false);
  });
});

describe('empremtaAdjunts', () => {
  test('SHA-256 de la forma canònica (el nombre i, per a cada adjunt, nom, tipus i bytes amb la seua llargada)', async () => {
    const copia = copiaAdjunts([adjunt([0x50, 0x4b, 3])]);
    const esperada = createHash('sha256').update(formaCanonica(copia)).digest('hex');
    expect(ALGORISME_EMPREMTA).toBe('SHA-256');
    expect(await empremtaAdjunts(copia, subtle)).toBe(esperada);
    // 8 (nombre) + 8+13 (nom) + 8+65 (tipus) + 8+3 (bytes)
    expect(formaCanonica(copia)).toHaveLength(8 + 8 + 13 + 8 + XLSX.length + 8 + 3);
  });

  test('canviar un byte, el nom o el tipus canvia l’empremta; els mateixos bytes en un altre array, no', async () => {
    const base = await empremtaAdjunts(copiaAdjunts([adjunt([1, 2, 3])]), subtle);
    expect(await empremtaAdjunts(copiaAdjunts([adjunt([1, 2, 3])]), subtle)).toBe(base);
    expect(await empremtaAdjunts(copiaAdjunts([adjunt([1, 2, 4])]), subtle)).not.toBe(base);
    expect(await empremtaAdjunts(copiaAdjunts([adjunt([1, 2, 3], 'b.xlsx')]), subtle)).not.toBe(base);
    expect(await empremtaAdjunts(copiaAdjunts([adjunt([1, 2, 3], 'sintetic.xlsx', 'text/csv')]), subtle)).not.toBe(base);
  });

  test('les llargades separen els camps: moure un caràcter del nom al tipus dona una altra empremta', async () => {
    const a = await empremtaAdjunts(copiaAdjunts([{ nom: 'ab', tipus: 'c', dades: new Uint8Array([1]) }]), subtle);
    const b = await empremtaAdjunts(copiaAdjunts([{ nom: 'a', tipus: 'bc', dades: new Uint8Array([1]) }]), subtle);
    expect(a).not.toBe(b);
  });

  test('sense crypto.subtle, rebutja; amb un subtle injectat, el crida com a mètode amb SHA-256', async () => {
    expect(potCalcularEmpremta(undefined)).toBe(false);
    expect(potCalcularEmpremta({})).toBe(false);
    await expect(empremtaAdjunts(copiaAdjunts([adjunt([1])]), null)).rejects.toThrow(/SHA-256/);
    const fals = { digest: vi.fn(function digest() { return Promise.resolve(new Uint8Array(32).fill(this === fals ? 0xab : 0).buffer); }) };
    expect(await empremtaAdjunts(copiaAdjunts([adjunt([1])]), fals)).toBe('ab'.repeat(32));
    expect(fals.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
  });
});
