// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { habitantsDe } from './PoblacioSection.jsx';

describe('Onada R32.33 · Poblacio · blindatge habitantsDe contra -0 i cadenes negatives', () => {
  test('habitantsDe(-0) retorna +0 i les cadenes amb signe negatiu no s’interpreten com a positives', () => {
    const zeroNegatiu = habitantsDe(-0);
    expect(Object.is(zeroNegatiu, -0)).toBe(false);
    expect(zeroNegatiu).toBe(0);
    expect(habitantsDe('-800 hab')).toBe(0);
    expect(habitantsDe('  -1.250  ')).toBe(0);
    expect(habitantsDe('1.700 hab')).toBe(1700);
    expect(habitantsDe(720)).toBe(720);
  });
});
