/* R51 (P0-46 / IDEA-177) · El pla de traducció d'una pàgina de text: només
   per a les que declaren translation_mode; la resta, null (el camí de sempre).
   Cap substitució callada: una configuració incompleta és un error explícit. */
import { describe, expect, test } from 'vitest';
import { planTraduccioPagina } from './planTraduccioPagina.js';
import { PAGE_COPY } from './pageContent.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const revisades = () => Object.fromEntries(LLENGUES.map((llengua) => [llengua, {
  title: `Títol ${llengua}`, html: `<p>Cos ${llengua}</p>`, subtitle: `Subtítol ${llengua}`, reviewed: true
}]));
const pagina = (extra) => ({ title: 'Títol ca', subtitle: 'Subtítol ca', html: '<p>Cos ca</p>', labels: ['Patrimoni'], source_language: 'ca', ...extra });

describe('planTraduccioPagina', () => {
  test('sense translation_mode propi, null: el camí de sempre (avui, les 32 pàgines de PAGE_COPY, amb /page/receptes d’R14)', () => {
    expect(planTraduccioPagina(pagina({}), 'en')).toBeNull();
    expect(planTraduccioPagina(Object.create({ translation_mode: 'none' }), 'en')).toBeNull();
    for (const brossa of [null, undefined, 'pàgina', [], 0]) expect(planTraduccioPagina(brossa, 'en')).toBeNull();
    const claus = Object.keys(PAGE_COPY);
    expect(claus.length).toBe(33);
    expect(claus.filter((clau) => planTraduccioPagina(PAGE_COPY[clau], 'en') !== null)).toEqual([]);
  });

  test('none: l’original, sense les traduccions antigues i sense Traduir', () => {
    const pla = planTraduccioPagina(pagina({ translation_mode: 'none', translations: revisades() }), 'en');
    expect(pla.tipus).toBe('original');
    expect(pla.traduccio).toBe(false);
    expect(pla.pagina).toMatchObject({ title: 'Títol ca', html: '<p>Cos ca</p>', contentLanguage: 'ca' });
    expect(pla.pagina).not.toHaveProperty('translations');
  });

  test('on_the_fly (o absent amb null): l’original i el Traduir de sempre; la mateixa llengua, l’original', () => {
    for (const translation_mode of ['on_the_fly', null]) {
      const pla = planTraduccioPagina(pagina({ translation_mode }), 'en');
      expect(pla).toMatchObject({ tipus: 'on_the_fly', traduccio: true });
      expect(pla.pagina.title).toBe('Títol ca');
    }
    expect(planTraduccioPagina(pagina({ translation_mode: 'on_the_fly' }), 'ca')).toMatchObject({ tipus: 'original', traduccio: true });
  });

  test('curated: el títol i el cos revisats de la llengua de la interfície; html passa a content i torna', () => {
    const pla = planTraduccioPagina(pagina({ translation_mode: 'curated_5_langs', translations: revisades() }), 'eu');
    expect(pla.tipus).toBe('curated');
    expect(pla.traduccio).toBe(false);
    expect(pla.pagina).toMatchObject({ title: 'Títol eu', html: '<p>Cos eu</p>', subtitle: 'Subtítol eu', contentLanguage: 'eu' });
    expect(pla.pagina.lead).toBeUndefined();
    // Les etiquetes de l'original diuen la seua llengua.
    expect(pla.pagina.labels).toEqual([{ text: 'Patrimoni', lang: 'ca' }]);
    expect(planTraduccioPagina(pagina({ translation_mode: 'curated_5_langs', translations: revisades() }), 'ca').tipus).toBe('original');
  });

  test.each([
    ['sense revisar', (t) => { delete t.gl.reviewed; }],
    ['revisió heretada', (t) => { t.es = Object.create({ title: 'x', html: 'y', reviewed: true }); }],
    ['una llengua de menys', (t) => { delete t.ca; }],
    ['una llengua de més', (t) => { t.fr = t.en; }],
    ['cos buit', (t) => { t.en.html = ' '; }]
  ])('curated incomplet (%s): error explícit, l’original i sense Traduir', (_, trenca) => {
    const translations = revisades();
    trenca(translations);
    const pla = planTraduccioPagina(pagina({ translation_mode: 'curated_5_langs', translations }), 'en');
    expect(pla).toMatchObject({ tipus: 'error', codi: 'R51_CURATED_INCOMPLETE', traduccio: false });
    expect(pla.pagina).toMatchObject({ title: 'Títol ca', html: '<p>Cos ca</p>', contentLanguage: 'ca' });
  });

  test('un mode desconegut o una llengua original que no es diu són errors, no inferències', () => {
    expect(planTraduccioPagina(pagina({ translation_mode: 'auto' }), 'en')).toMatchObject({ tipus: 'error', codi: 'R51_TRANSLATION_MODE_INVALID' });
    expect(planTraduccioPagina(pagina({ translation_mode: 'none', source_language: undefined }), 'en')).toMatchObject({ tipus: 'error', codi: 'R51_LANGUAGE_INVALID' });
    expect(planTraduccioPagina(pagina({ translation_mode: 'none' }), 'fr')).toMatchObject({ tipus: 'error', codi: 'R51_LANGUAGE_INVALID' });
  });

  test('el pla és immutable i no toca la pàgina', () => {
    const font = pagina({ translation_mode: 'curated_5_langs', translations: revisades() });
    const abans = JSON.stringify(font);
    const pla = planTraduccioPagina(font, 'gl');
    expect(Object.isFrozen(pla)).toBe(true);
    expect(JSON.stringify(font)).toBe(abans);
  });
});
