import { describe, expect, it } from 'vitest';
import { TRANSLATION_LANGUAGES as langs, TRANSLATION_MODES as modes, normalizeTranslationMode, captureCuratedTranslations, getTranslationPlan } from './translationMode.js';
const curated = () => Object.fromEntries(langs.map(lang => [lang, { title: `Títol ${lang}`, content: `Cos ${lang}`, reviewed: true }]));
const plan = extra => getTranslationPlan({ source_language: 'ca', target_language: 'en', ...extra });
describe('R51 translation mode', () => {
  it.each(modes)('accepta mode %s', value => expect(normalizeTranslationMode(value)).toBe(value));
  it.each([undefined, null])('absent %s usa la política general', value => expect(normalizeTranslationMode(value)).toBe('on_the_fly'));
  it.each(['', 'auto', 'ON_THE_FLY', false, 0, {}, 'constructor'])('rebutja mode desconegut %j', value => expect(() => normalizeTranslationMode(value)).toThrow('R51_TRANSLATION_MODE_INVALID'));
  it('Apertium és només un pla, sense fingir contingut traduït', () => {
    expect(plan({})).toEqual({ kind: 'on_the_fly', source_language: 'ca', target_language: 'en' });
  });
  it.each(langs)('none conserva original amb destinació %s', target_language => {
    expect(plan({ translation_mode: 'none', target_language })).toEqual({ kind: 'original', source_language: 'ca', target_language, display_language: 'ca' });
  });
  it.each(modes)('mateixa llengua mostra original en %s', translation_mode => {
    expect(plan({ translation_mode, target_language: 'ca', translations: curated() }).kind).toBe('original');
  });
  it.each(langs)('selecciona la versió real %s', target_language => {
    const result = plan({ translation_mode: 'curated_5_langs', target_language, translations: curated() });
    expect(result.kind).toBe(target_language === 'ca' ? 'original' : 'curated');
    if (target_language !== 'ca') expect(result.translation).toEqual({ title: `Títol ${target_language}`, content: `Cos ${target_language}`, reviewed: true });
  });
  it.each(['fr', '', 'constructor', null])('rebutja llengua %j', target_language => expect(() => plan({ target_language })).toThrow('R51_LANGUAGE_INVALID'));
  it.each(['missing', 'unreviewed', 'empty-title', 'empty-content', 'extra-language', 'inherited'])('configuració revisada invàlida: %s', kind => {
    let translations = curated();
    if (kind === 'missing') delete translations.gl;
    if (kind === 'unreviewed') translations.eu.reviewed = false;
    if (kind === 'empty-title') translations.es.title = ' ';
    if (kind === 'empty-content') translations.en.content = '\n';
    if (kind === 'extra-language') translations.fr = translations.ca;
    if (kind === 'inherited') translations = Object.create(translations);
    expect(() => plan({ translation_mode: 'curated_5_langs', translations })).toThrow('R51_CURATED_INCOMPLETE');
  });
  it('valida les cinc versions abans del shortcut de mateixa llengua', () => {
    expect(() => plan({ translation_mode: 'curated_5_langs', target_language: 'ca', translations: {} })).toThrow('R51_CURATED_INCOMPLETE');
  });
  it('captura immutable i sense mutar les entrades', () => {
    const translations = curated(), original = JSON.stringify(translations);
    const captured = captureCuratedTranslations(translations);
    expect(JSON.stringify(translations)).toBe(original);
    translations.en.content = 'canvi posterior';
    expect(captured.en.content).toBe('Cos en');
    expect(Object.isFrozen(captured)).toBe(true);
    expect(Object.isFrozen(captured.en)).toBe(true);
    expect(Object.isFrozen(plan({}))).toBe(true);
  });
  it('no aplica excepcions de pàgina o secció', () => {
    for (const slug of ['fediversity', 'patrimoni', 'qualsevol']) {
      expect(plan({ slug, sectionId: slug, title: slug })).toEqual(plan({}));
    }
  });
});
