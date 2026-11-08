/** Pla de presentació pur: no autoritza permisos o transmissió de dades. */
export const TRANSLATION_MODES = Object.freeze(['on_the_fly', 'curated_5_langs', 'none']);
export const TRANSLATION_LANGUAGES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const fail = code => { throw Object.assign(new TypeError(code), { code }); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const language = value => {
  if (!TRANSLATION_LANGUAGES.includes(value)) fail('R51_LANGUAGE_INVALID');
  return value;
};
export function normalizeTranslationMode(value) {
  if (value === undefined || value === null) return 'on_the_fly';
  if (!TRANSLATION_MODES.includes(value)) fail('R51_TRANSLATION_MODE_INVALID');
  return value;
}
export function captureCuratedTranslations(translations) {
  if (!record(translations) || Object.keys(translations).some(key => !TRANSLATION_LANGUAGES.includes(key))) fail('R51_CURATED_INCOMPLETE');
  return Object.freeze(Object.fromEntries(TRANSLATION_LANGUAGES.map(lang => {
    if (!Object.hasOwn(translations, lang)) fail('R51_CURATED_INCOMPLETE');
    const entry = translations[lang];
    if (!record(entry) || !Object.hasOwn(entry, 'reviewed') || entry.reviewed !== true
        || !Object.hasOwn(entry, 'title') || typeof entry.title !== 'string' || !entry.title.trim()
        || !Object.hasOwn(entry, 'content') || typeof entry.content !== 'string' || !entry.content.trim()) fail('R51_CURATED_INCOMPLETE');
    return [lang, Object.freeze({ title: entry.title, content: entry.content, reviewed: true })];
  })));
}
export function getTranslationPlan({ translation_mode, source_language, target_language, translations } = {}) {
  const mode = normalizeTranslationMode(translation_mode);
  const source = language(source_language), target = language(target_language);
  const curated = mode === 'curated_5_langs' ? captureCuratedTranslations(translations) : null;
  const base = { source_language: source, target_language: target };
  if (mode === 'none' || source === target) return Object.freeze({ kind: 'original', ...base, display_language: source });
  if (curated) return Object.freeze({ kind: 'curated', ...base, display_language: target, translation: curated[target] });
  return Object.freeze({ kind: 'on_the_fly', ...base });
}
