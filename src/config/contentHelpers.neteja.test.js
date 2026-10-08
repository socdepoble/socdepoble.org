/**
 * Auditoria 261007 (B) · Exports sense consumidor retirats de les utilitats
 * compartides, sense tocar la resta.
 *
 *  · contentHelpers.js: fora stripAccents (feia un slug malgrat el nom) i
 *    formatMonthLabel. normalizeSearchText, la de la cerca, no canvia.
 *  · UniversalUtils.js: fora isValidDate. Les guardes d'URL continuen igual.
 */
import { describe, expect, test } from 'vitest';
import * as contentHelpers from './contentHelpers.js';
import * as universalUtils from '../components/universal/UniversalUtils.js';

describe('neteja d’exports morts (Auditoria 261007 (B))', () => {
  test('contentHelpers ja no exporta stripAccents ni formatMonthLabel', () => {
    expect(contentHelpers).not.toHaveProperty('stripAccents');
    expect(contentHelpers).not.toHaveProperty('formatMonthLabel');
  });

  test('normalizeSearchText continua llevant accents i espais sense fer cap slug', () => {
    expect(contentHelpers.normalizeSearchText('  Sóc   de Poble ')).toBe('soc de poble');
    expect(contentHelpers.buildSearchText(['Sóc', null, 'de Poble'])).toBe('soc de poble');
  });

  test('UniversalUtils ja no exporta isValidDate; isSafeUrl continua igual', () => {
    expect(universalUtils).not.toHaveProperty('isValidDate');
    expect(universalUtils.isSafeUrl('https://socdepoble.org/x')).toBe(true);
    expect(universalUtils.isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(universalUtils.isSafeUrl('//evil.test')).toBe(false);
  });
});
