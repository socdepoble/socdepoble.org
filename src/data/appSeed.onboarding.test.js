/**
 * Auditoria 261007 (B) · El pla d'alta d'appSeed (fila 'onboarding').
 *
 *  · L'slug de l'entitat pilot ve de la taula única d'identitats
 *    (identitatsSeed.js, ENTITAT_PILOT_SLUG): appSeed no en copia cap.
 *  · createOnboardingSeed() s'ha retirat: no la cridava ningú.
 *  · La fila d'app_content porta el mateix pla congelat.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import * as appSeed from './appSeed.js';
import { ENTITAT_PILOT_SLUG } from './identitatsSeed.js';

const FONT = readFileSync(resolve(process.cwd(), 'src/data/appSeed.js'), 'utf8');

describe('appSeed · pla d’alta (Auditoria 261007 (B))', () => {
  test('l’entitat i el pare del grup prenen l’slug de la taula única', () => {
    expect(appSeed.ONBOARDING_SEED.company.slug).toBe(ENTITAT_PILOT_SLUG);
    expect(appSeed.ONBOARDING_SEED.group.parentSlug).toBe(ENTITAT_PILOT_SLUG);
    expect(appSeed.ONBOARDING_SEED.group.slug).toBe('rentonar');
  });

  test('cap slug de l’entitat escrit a mà al fitxer', () => {
    expect(FONT).not.toMatch(/['"]soc-de-poble['"]/);
    expect(FONT).not.toMatch(/['"]socdepoble['"]/);
  });

  test('createOnboardingSeed ja no s’exporta', () => {
    expect(appSeed).not.toHaveProperty('createOnboardingSeed');
  });

  test('la fila d’app_content i APP_SEED porten el mateix pla, congelat', () => {
    const fila = appSeed.APP_CONTENT_ROWS.find((row) => row.key === 'onboarding');
    expect(fila.payload).toBe(appSeed.ONBOARDING_SEED);
    expect(appSeed.APP_SEED.onboarding).toBe(appSeed.ONBOARDING_SEED);
    expect(Object.isFrozen(appSeed.ONBOARDING_SEED.company)).toBe(true);
    expect(Object.isFrozen(appSeed.ONBOARDING_SEED.group)).toBe(true);
  });
});
