/* R51 (P0-46; auditoria R11, defensa en profunditat) · El pis mínim de
   «es pot traduir a màquina?» per a qui només té el mode
   (allowsMachineTranslation: UniversalCard i tradueixTot): sí sense
   translation_mode (propietat pròpia absent o undefined) o amb un mode que es
   normalitza a 'on_the_fly'; mai amb 'curated_5_langs', 'none', un mode
   invàlid o un accessor. Qui té l'element sencer demana el veredicte del pla
   (planTraduccioPublicacio.js · publicacioTraduible; troballa DQ-01). */
import { describe, expect, it } from 'vitest';
import { allowsMachineTranslation } from './translationMode.js';

describe('R51 · allowsMachineTranslation', () => {
  it.each([
    ['sense element', undefined],
    ['un element sense mode', { title: 'Festa' }],
    ['un mode undefined (propietat pròpia)', { translation_mode: undefined }],
    ['un mode null (la regla general)', { translation_mode: null }],
    ['l’automàtica', { translation_mode: 'on_the_fly' }]
  ])('%s: es pot traduir a màquina', (_, element) => {
    expect(allowsMachineTranslation(element)).toBe(true);
  });

  it.each([
    ['none', { translation_mode: 'none' }],
    ['la revisada', { translation_mode: 'curated_5_langs' }],
    ['un mode que no existix', { translation_mode: 'auto' }],
    ['un mode en majúscules', { translation_mode: 'ON_THE_FLY' }],
    ['un mode buit', { translation_mode: '' }],
    ['un mode que no és text', { translation_mode: 0 }],
    ['un objecte com a mode', { translation_mode: {} }]
  ])('%s: mai a màquina', (_, element) => {
    expect(allowsMachineTranslation(element)).toBe(false);
  });

  it('un accessor no és una dada: es tracta com un mode invàlid (protegit)', () => {
    const element = Object.defineProperty({}, 'translation_mode', { get: () => 'on_the_fly', enumerable: true });
    expect(allowsMachineTranslation(element)).toBe(false);
  });

  it('només la propietat pròpia: un mode heretat no compta', () => {
    expect(allowsMachineTranslation(Object.create({ translation_mode: 'none' }))).toBe(true);
  });
});
