/* USA-05 (R15b) · La vista del catàleg persistix per superfície, en una sola
   clau xicoteta i sense prototip; una entrada estranya o una escriptura que
   falla tornen a la llista sense trencar res. */
import { afterEach, expect, test, vi } from 'vitest';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { CLAU_VISTA_CATALEG, ESPAIS_MAXIMS, desaVista, vistaDesada } from './vistaCataleg.js';

afterEach(() => { vi.restoreAllMocks(); delVal(CLAU_VISTA_CATALEG); });

test('desa la rajola per espai i la llista és esborrar-la', () => {
  expect(vistaDesada('herbari-p069')).toBe('canonica');
  expect(desaVista('herbari-p069', 'rajola')).toBe(true);
  expect(vistaDesada('herbari-p069')).toBe('rajola');
  expect(vistaDesada('receptes-p069')).toBe('canonica');
  expect(desaVista('herbari-p069', 'canonica')).toBe(true);
  expect(getVal(CLAU_VISTA_CATALEG, null)).toEqual({ v: 2, espais: {} });
});

test('espais, vistes i dades desades invàlides no hi entren', () => {
  expect(desaVista('__proto__', 'rajola')).toBe(false);
  expect(desaVista('Herbari', 'rajola')).toBe(false);
  expect(desaVista('herbari-p069', 'mosaic')).toBe(false);
  setVal(CLAU_VISTA_CATALEG, { v: 1, espais: { 'herbari-p069': 'mosaic', constructor: 'rajola', 'receptes-p069': 'rajola' } });
  expect(vistaDesada('herbari-p069')).toBe('canonica');
  // Un nom com «constructor» és un espai qualsevol: el mapa no té prototip.
  expect(vistaDesada('constructor')).toBe('rajola');
  expect(vistaDesada('tostring')).toBe('canonica');
  expect(vistaDesada('valueof')).toBe('canonica');
  expect(vistaDesada('receptes-p069')).toBe('rajola');
  setVal(CLAU_VISTA_CATALEG, 'brossa');
  expect(vistaDesada('receptes-p069')).toBe('canonica');
});

test('com a molt ESPAIS_MAXIMS espais: el més antic cedix el lloc', () => {
  for (let i = 0; i < ESPAIS_MAXIMS + 3; i += 1) desaVista(`espai-${i}`, 'rajola');
  const espais = Object.keys(getVal(CLAU_VISTA_CATALEG, null).espais);
  expect(espais).toHaveLength(ESPAIS_MAXIMS);
  expect(espais).toContain(`espai-${ESPAIS_MAXIMS + 2}`);
  expect(espais).not.toContain('espai-0');
});

test('una escriptura que falla no trenca i torna false', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
  expect(desaVista('herbari-p069', 'rajola')).toBe(false);
  expect(vistaDesada('herbari-p069')).toBe('canonica');
});


test('migra v1 sense perdre rajoles ni la llista explícita i persistix la vista gran v2', () => {
  setVal(CLAU_VISTA_CATALEG, { v: 1, espais: { 'herbari-p069': 'rajola', 'receptes-p069': 'llista' } });
  expect(vistaDesada('herbari-p069')).toBe('rajola');
  expect(vistaDesada('receptes-p069')).toBe('gran');
  expect(vistaDesada('nou-cataleg')).toBe('canonica');
  expect(desaVista('nou-cataleg', 'gran')).toBe(true);
  expect(getVal(CLAU_VISTA_CATALEG, null)).toEqual({ v: 2, espais: { 'herbari-p069': 'rajola', 'receptes-p069': 'gran', 'nou-cataleg': 'gran' } });
  expect(vistaDesada('nou-cataleg')).toBe('gran');
});
