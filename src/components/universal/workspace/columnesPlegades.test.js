import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { delVal, getVal, setVal, STORAGE_PREFIX } from '../../../config/storage.js';
import {
  CLAU_COLUMNES_PLEGADES as CLAU, MAX_ESPAIS_COLUMNES, _reiniciaColumnesPlegades,
  columnesPlegadesDe, desaColumnaPlegada, desaColumnesPlegades, llegeixColumnesPlegades,
  normalitzaColumnesPlegades, subscriuColumnesPlegades
} from './columnesPlegades.js';

beforeEach(() => { delVal(CLAU); _reiniciaColumnesPlegades(); });
afterEach(() => { vi.restoreAllMocks(); delVal(CLAU); _reiniciaColumnesPlegades(); });

describe('columnes plegades · decisió explícita per espai', () => {
  it('sense decisió deixa els valors inicials a la UI i dona un snapshot immutable estable', () => {
    const inicial = columnesPlegadesDe('wiki');
    expect(inicial).toEqual({});
    expect(columnesPlegadesDe('notes')).toBe(inicial);
    expect(Object.isFrozen(inicial)).toBe(true);
    expect(getVal(CLAU)).toBeNull();
  });

  it('plegar i tornar a obrir persisteix, sense tocar altres espais ni columnes', () => {
    desaColumnaPlegada('wiki', 'left', true);
    desaColumnaPlegada('wiki', 'middle', true);
    desaColumnaPlegada('notes', 'left', false);
    desaColumnaPlegada('sidebar', 'left', true);
    desaColumnaPlegada('xat', 'middle', true);
    _reiniciaColumnesPlegades();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true, middle: true });
    desaColumnaPlegada('wiki', 'left', false);
    _reiniciaColumnesPlegades();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: false, middle: true });
    expect(columnesPlegadesDe('notes')).toEqual({ left: false });
    expect(columnesPlegadesDe('sidebar')).toEqual({ left: true });
    expect(columnesPlegadesDe('xat')).toEqual({ middle: true });
    expect(getVal(CLAU).espais.wiki.left).toBe(false);
  });

  it('llegir en navegar no reescriu ni desplega i els no-canvis no avisen', () => {
    const oient = vi.fn();
    const deixa = subscriuColumnesPlegades(oient);
    desaColumnesPlegades('wiki', { middle: true });
    const primera = columnesPlegadesDe('wiki');
    for (let i = 0; i < 5; i++) {
      columnesPlegadesDe('notes');
      expect(columnesPlegadesDe('wiki')).toBe(primera);
      desaColumnesPlegades('wiki', { middle: true });
    }
    expect(oient).toHaveBeenCalledTimes(1);
    deixa();
    desaColumnesPlegades('wiki', { left: true });
    expect(oient).toHaveBeenCalledTimes(1);
  });

  it('rebutja tipus falsos, ids fora del contracte i claus alienes', () => {
    for (const espai of ['', null, '../wiki', 'Wiki', 'a'.repeat(41)]) desaColumnesPlegades(espai, { left: true });
    for (const canvi of [null, [], 1, { left: 'false' }, { middle: 0 }, { right: true }]) desaColumnesPlegades('wiki', canvi);
    desaColumnaPlegada('wiki', 'right', true);
    expect(getVal(CLAU)).toBeNull();
    expect(llegeixColumnesPlegades().espais).toEqual({});
  });

  it('normalitza storage corrupte i preserva false sense prototips heretats', () => {
    for (const cru of [null, [], 'x', { v: 2, espais: {} }, { v: 1, espais: [] }]) expect(normalitzaColumnesPlegades(cru).espais).toEqual({});
    setVal(CLAU, JSON.parse('{"v":1,"espais":{"wiki":{"left":false,"middle":"yes","right":true},"constructor":{"middle":true},"__proto__":{"left":true}}}'));
    _reiniciaColumnesPlegades();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: false });
    expect(columnesPlegadesDe('constructor')).toEqual({ middle: true });
    expect(Object.getPrototypeOf(llegeixColumnesPlegades().espais)).toBeNull();
    expect(columnesPlegadesDe('__proto__')).toEqual({});
  });

  it('quota síncrona acotada per baix de 10KB i permet tornar a obrir a capacitat', () => {
    for (let i = 0; i < MAX_ESPAIS_COLUMNES + 5; i++) desaColumnesPlegades(`espai-${i}`, { left: true, middle: false });
    expect(Object.keys(llegeixColumnesPlegades().espais)).toHaveLength(MAX_ESPAIS_COLUMNES);
    expect(JSON.stringify(getVal(CLAU)).length).toBeLessThan(10_000);
    desaColumnaPlegada('espai-0', 'left', false);
    expect(columnesPlegadesDe('espai-0')).toEqual({ left: false, middle: false });
  });

  it('storage bloquejat manté la decisió i avisa en esta càrrega', () => {
    const oient = vi.fn();
    const deixa = subscriuColumnesPlegades(oient);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    desaColumnaPlegada('wiki', 'left', true);
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true });
    expect(oient).toHaveBeenCalledTimes(1);
    deixa();
  });

  it('propaga un canvi d’altra pestanya i neteja la subscripció', () => {
    const oient = vi.fn();
    const deixa = subscriuColumnesPlegades(oient);
    columnesPlegadesDe('wiki');
    setVal(CLAU, { v: 1, espais: { wiki: { left: true } } });
    window.dispatchEvent(new StorageEvent('storage', { key: 'aliena' }));
    expect(oient).not.toHaveBeenCalled();
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_PREFIX + CLAU }));
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true });
    expect(oient).toHaveBeenCalledTimes(1);
    deixa();
    setVal(CLAU, { v: 1, espais: {} });
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(oient).toHaveBeenCalledTimes(1);
  });

  it('remuntar rellegix la decisió externa produïda quan no hi havia cap vista subscrita', () => {
    columnesPlegadesDe('wiki');
    subscriuColumnesPlegades(() => {})();
    setVal(CLAU, { v: 1, espais: { wiki: { left: true } } });
    const avisa = vi.fn();
    const deixa = subscriuColumnesPlegades(avisa);
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true });
    expect(avisa).toHaveBeenCalledTimes(1);
    deixa();
  });

  it('remuntar no restaura storage antic quan la decisió local no es va poder desar', () => {
    desaColumnaPlegada('wiki', 'left', false);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
    desaColumnaPlegada('wiki', 'left', true);
    subscriuColumnesPlegades(() => {})();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true });
  });
});
