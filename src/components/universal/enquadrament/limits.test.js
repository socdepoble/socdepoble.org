import { describe, expect, test } from 'vitest';
import {
  COSTAT_MAXIM, ERROR_HEIC, ERROR_PES, ERROR_PIXELS, ErrorImatge, PES_MAXIM_ENTRADA, PIXELS_MAXIMS,
  comprovaDimensions, comprovaPes, esHeic, missatgeLimit,
} from './limits.js';

/* Onada 4, T3a · Límits d'entrada del retallador (RETALLADOR §2). */

describe('T3a · límits', () => {
  test('els valors: 25 MB, 16.384 px per costat i 50 MP', () => {
    expect(PES_MAXIM_ENTRADA).toBe(25 * 1024 * 1024);
    expect(COSTAT_MAXIM).toBe(16384);
    expect(PIXELS_MAXIMS).toBe(50e6);
  });

  test('comprovaPes: fins a 25 MB passa; un byte més, no; sense mida, no se sap', () => {
    expect(comprovaPes({ size: PES_MAXIM_ENTRADA })).toBeNull();
    expect(comprovaPes({ size: PES_MAXIM_ENTRADA + 1 })).toBe('pes');
    expect(comprovaPes({})).toBeNull();
    expect(comprovaPes(null)).toBeNull();
  });

  test('comprovaDimensions: costat i píxels', () => {
    expect(comprovaDimensions(4000, 3000)).toBeNull();
    expect(comprovaDimensions(16384, 3000)).toBeNull();
    expect(comprovaDimensions(16385, 100)).toBe('pixels');
    expect(comprovaDimensions(100, 16385)).toBe('pixels');
    expect(comprovaDimensions(8000, 7000)).toBe('pixels'); // 56 MP
    expect(comprovaDimensions(0, 0)).toBeNull();
    expect(comprovaDimensions(Number.NaN, 10)).toBeNull();
  });

  test('esHeic pel tipus o per l’extensió', () => {
    expect(esHeic({ type: 'image/heic', name: 'a' })).toBe(true);
    expect(esHeic({ type: 'image/heif-sequence' })).toBe(true);
    expect(esHeic({ type: '', name: 'IMG_0001.HEIC' })).toBe(true);
    expect(esHeic({ type: 'image/jpeg', name: 'foto.jpg' })).toBe(false);
    expect(esHeic('foto.heic')).toBe(false);
    expect(esHeic(null)).toBe(false);
  });

  test('ErrorImatge porta el codi i el missatge en valencià', () => {
    expect(new ErrorImatge('pes')).toMatchObject({ name: 'ErrorImatge', codi: 'pes', message: ERROR_PES });
    expect(missatgeLimit('pixels')).toBe(ERROR_PIXELS);
    expect(missatgeLimit('heic')).toBe(ERROR_HEIC);
    expect(missatgeLimit('altra')).toBeNull();
    expect(missatgeLimit(undefined)).toBeNull();
  });
});
