import { afterEach, expect, test, vi } from 'vitest';
import { desaGrupEfimer, getEfimer, setEfimer } from './storage.js';
afterEach(() => { vi.restoreAllMocks(); window.sessionStorage.clear(); });
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
