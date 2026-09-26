import { afterEach, expect, test, vi } from 'vitest';
import { desaGrupEfimer, getEfimer, setEfimer, getVal, setVal, delVal } from './storage.js';
afterEach(() => { vi.restoreAllMocks(); window.sessionStorage.clear(); window.localStorage.clear(); });
test('D1: setVal i delVal diuen si han escrit, i la quota no llança', () => {
  expect(setVal('probe', { v: 1 })).toBe(true);
  expect(getVal('probe')).toEqual({ v: 1 });
  expect(delVal('probe')).toBe(true);
  expect(getVal('probe')).toBeNull();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(setVal('probe', { v: 1 })).toBe(false);
  expect(delVal('probe')).toBe(false);
});
test('l’escriptura efímera comunica indisponibilitat, quota i valors no serialitzables', () => {
  expect(setEfimer('probe', undefined)).toBe(false);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(setEfimer('probe', 'value')).toBe(false);
  expect(desaGrupEfimer({ a: 'A', b: 'B' })).toBe(false);
});
test('la marca persistent impedix llegir un grup parcial després de recarregar el mòdul', async () => {
  const original = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key, value) {
    if (key === 'sdp_embed_b') throw new Error('quota');
    return original.call(this, key, value);
  });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(desaGrupEfimer({ a: 'A', b: 'B' })).toBe(false);
  vi.resetModules(); const fresh = await import('./storage.js');
  expect(fresh.getEfimer('a')).toBeNull(); expect(fresh.getEfimer('b')).toBeNull();
  vi.restoreAllMocks();
  expect(fresh.desaGrupEfimer({ a: 'next', b: null })).toBe(true);
  expect(fresh.getEfimer('a')).toBe('next'); expect(fresh.getEfimer('b')).toBeNull();
});
test('accés denegat i error en confirmar el grup fallen tancats', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denegat'); });
  expect(desaGrupEfimer({ a: 'A', b: 'B' })).toBe(false);
  expect(getEfimer('a')).toBeNull();
});
