/* R51 (P0-46; troballa R12G-SB-03) · Un translation_mode que no és text dins
   del payload d'una fila de section_submissions (true, false, {}, [], un
   número; una escriptura directa per PostgREST o un escriptor futur) és un
   mode INVÀLID, i el contracte diu que un mode invàlid és protegit. Abans
   netejaTipusDelPayload l'esborrava com qualsevol clau de text que no és
   text: el mode quedava absent, el pla tornava null (el camí de sempre) i la
   targeta incrustada o la foto derivada oferien Traduir. Ara el mode viatja
   com un text que no és cap mode del contracte: el pla torna 'error' (sense
   Traduir) i el pis mínim diu que no. Un mode de text (vàlid o no), null o
   absent, com sempre. */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada } from './mapejadorSeccions.js';
import { planTraduccioPublicacio, publicacioTraduible } from '../components/universal/traduccio/planTraduccioPublicacio.js';
import { TRANSLATION_MODES, allowsMachineTranslation } from '../components/universal/traduccio/translationMode.js';

const fila = (extra) => elementDeFilaPublicada({
  id: 'p1', payload: JSON.parse(JSON.stringify({ title: 'Crònica de la fira', content: '<p>Cos</p>', source_language: 'ca', ...extra })),
  titol: 'Nom del servidor', createdAt: '2026-10-20T10:00:00Z', updatedAt: '2026-10-20T11:00:00Z', ownerUserId: null, authorOrgId: null
});

describe('R51 · elementDeFilaPublicada i un translation_mode que no és text', () => {
  test.each([
    ['true', true],
    ['false', false],
    ['un objecte buit', {}],
    ['una llista', ['none']],
    ['una llista buida', []],
    ['un número', 5],
    ['un objecte que tomba String()', JSON.parse('{"toString":0}')]
  ])('%s: el mode no desapareix, és invàlid i protegit (el pla torna error, sense Traduir)', (_, translation_mode) => {
    const element = fila({ translation_mode });
    expect(Object.hasOwn(element, 'translation_mode')).toBe(true);
    expect(typeof element.translation_mode).toBe('string');
    expect(TRANSLATION_MODES).not.toContain(element.translation_mode);
    expect(planTraduccioPublicacio(element, 'ca')).toMatchObject({ tipus: 'error', traduible: false });
    expect(publicacioTraduible(element)).toBe(false);
    // El que rep UniversalCard (modeTraduccio) i tradueixTot: el pis mínim també el refusa.
    expect(allowsMachineTranslation({ translation_mode: element.translation_mode })).toBe(false);
  });

  test.each([
    ['l’automàtica', 'on_the_fly', true],
    ['none', 'none', false],
    ['un mode de text que no existix', 'auto', false]
  ])('un mode de text (%s) viatja tal qual', (_, translation_mode, traduible) => {
    const element = fila({ translation_mode });
    expect(element.translation_mode).toBe(translation_mode);
    expect(publicacioTraduible(element)).toBe(traduible);
  });

  test('sense mode o amb null (la regla general), res no canvia: cap mode nou, el camí de sempre', () => {
    const sense = fila({});
    expect(Object.hasOwn(sense, 'translation_mode')).toBe(false);
    expect(planTraduccioPublicacio(sense, 'ca')).toBeNull();
    const ambNull = fila({ translation_mode: null });
    expect(ambNull.translation_mode).toBeNull();
    expect(planTraduccioPublicacio(ambNull, 'ca')).toBeNull();
  });
});
