// @vitest-environment node
/* R51 (P0-46 / IDEA-177; R51V-03) · El pla de traducció d'una publicació, pur:
   cada cas passa pel contracte (getTranslationPlan). Sense mode declarat, null
   (el camí de sempre); amb mode, original, curated, on_the_fly o error, i
   només on_the_fly ofereix Traduir. */
import { describe, expect, test } from 'vitest';
import { ofereixTraduir, planTraduccioPublicacio, publicacioTraduible, traduccionsDelContracte } from './planTraduccioPublicacio.js';

const revisades = (llengues = ['ca', 'es', 'en', 'eu', 'gl'], extra = {}) => Object.fromEntries(llengues.map((codi) => [codi, { title: `T ${codi}`, content: `<p>C ${codi}</p>`, reviewed: true, ...extra }]));
const base = { id: 'p', title: 'Original', content: '<p>Cos</p>', description: 'Entradeta', subtitle: 'Sub' };

describe('planTraduccioPublicacio', () => {
  test('sense translation_mode propi (absent, null o undefined): null i Traduir com sempre', () => {
    for (const element of [base, { ...base, translation_mode: null }, { ...base, translation_mode: undefined }, null, undefined, 'x', []]) {
      expect(planTraduccioPublicacio(element, 'es')).toBeNull();
    }
    expect(ofereixTraduir(null)).toBe(true);
    // Un mode heretat (prototip) no és propi: no hi compta.
    expect(planTraduccioPublicacio(Object.create({ translation_mode: 'none', source_language: 'ca' }), 'es')).toBeNull();
  });

  test('none: l’original, la seua llengua i cap Traduir; la mateixa llengua, l’original en qualsevol mode', () => {
    const pla = planTraduccioPublicacio({ ...base, translation_mode: 'none', source_language: 'ca' }, 'es');
    expect(pla).toMatchObject({ tipus: 'original', traduible: false, llengua: 'ca' });
    expect(ofereixTraduir(pla)).toBe(false);
    const mateixa = planTraduccioPublicacio({ ...base, translation_mode: 'on_the_fly', source_language: 'es' }, 'es');
    expect(mateixa).toMatchObject({ tipus: 'original', traduible: true, llengua: 'es' });
  });

  test('on_the_fly: l’element tal qual i Traduir', () => {
    const element = { ...base, translation_mode: 'on_the_fly', source_language: 'ca' };
    const pla = planTraduccioPublicacio(element, 'en');
    expect(pla).toMatchObject({ tipus: 'on_the_fly', traduible: true, llengua: 'ca' });
    expect(pla.element).toBe(element);
  });

  test('curated completa: títol i cos revisats; els textos secundaris, només els de la mateixa entrada', () => {
    const element = { ...base, translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades() };
    const pla = planTraduccioPublicacio(element, 'eu');
    expect(pla).toMatchObject({ tipus: 'curated', traduible: false, llengua: 'eu' });
    expect(pla.element).toMatchObject({ id: 'p', title: 'T eu', content: '<p>C eu</p>' });
    expect(pla.element.description).toBeUndefined();
    expect(pla.element.subtitle).toBeUndefined();
    const ambLead = planTraduccioPublicacio({ ...element, translations: revisades(undefined, { lead: 'Lead revisat', subtitle: 'Sub revisat' }) }, 'eu');
    expect(ambLead.element).toMatchObject({ lead: 'Lead revisat', subtitle: 'Sub revisat' });
    // El mapa de les pàgines (html) també val.
    const html = Object.fromEntries(Object.entries(revisades()).map(([codi, { title }]) => [codi, { title, html: `<p>H ${codi}</p>`, reviewed: true }]));
    expect(planTraduccioPublicacio({ ...element, translations: html }, 'gl').element.content).toBe('<p>H gl</p>');
  });

  test.each([
    ['revisada incompleta', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades(['ca', 'es', 'en', 'eu']) }, 'R51_CURATED_INCOMPLETE'],
    ['revisada sense reviewed', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades(undefined, { reviewed: false }) }, 'R51_CURATED_INCOMPLETE'],
    ['mode inventat', { translation_mode: 'auto', source_language: 'ca' }, 'R51_TRANSLATION_MODE_INVALID'],
    ['mode en majúscules', { translation_mode: 'NONE', source_language: 'ca' }, 'R51_TRANSLATION_MODE_INVALID'],
    ['sense llengua original', { translation_mode: 'on_the_fly' }, 'R51_LANGUAGE_INVALID'],
    ['llengua de fora', { translation_mode: 'none', source_language: 'fr' }, 'R51_LANGUAGE_INVALID']
  ])('%s: error explícit, l’original i cap Traduir', (_, extra, codi) => {
    const element = { ...base, ...extra };
    const pla = planTraduccioPublicacio(element, 'es');
    expect(pla).toMatchObject({ tipus: 'error', codi, traduible: false });
    expect(pla.element).toBe(element);
    expect(ofereixTraduir(pla)).toBe(false);
  });

  test('l’adaptador del mapa no executa getters', () => {
    let cridat = false;
    const entrada = { reviewed: true, content: '<p>x</p>' };
    Object.defineProperty(entrada, 'title', { enumerable: true, get() { cridat = true; return 'T'; } });
    expect(traduccionsDelContracte({ ca: entrada }).ca.title).toBeUndefined();
    expect(cridat).toBe(false);
  });
});

/* Troballa R12G-BH-02 · El veredicte per a un text que es pinta sense el seu
   pla (el calendari): el d'ofereixTraduir, el mateix en les cinc llengües. */
describe('publicacioTraduible', () => {
  test.each([
    ['sense mode', base, true],
    ['amb l’automàtica', { ...base, translation_mode: 'on_the_fly', source_language: 'ca' }, true],
    ['amb none', { ...base, translation_mode: 'none', source_language: 'ca' }, false],
    ['amb la revisada', { ...base, translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades() }, false],
    ['amb una revisada incompleta', { ...base, translation_mode: 'curated_5_langs', source_language: 'es', translations: revisades(['ca']) }, false],
    ['amb un mode invàlid', { ...base, translation_mode: 'auto', source_language: 'ca' }, false],
    ['amb l’automàtica sense llengua original', { ...base, translation_mode: 'on_the_fly' }, false]
  ])('%s: el veredicte d’ofereixTraduir en les cinc llengües', (_, element, esperat) => {
    expect(publicacioTraduible(element)).toBe(esperat);
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(ofereixTraduir(planTraduccioPublicacio(element, llengua)), llengua).toBe(esperat);
    }
  });
});
