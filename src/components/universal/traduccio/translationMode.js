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
/* R51 (P0-46) · El pis mínim de «es pot traduir a màquina?» (Apertium o MyMemory, sempre a demanda), per a qui
   només té el MODE: UniversalCard (la prop modeTraduccio) i el transport (tradueixTot), que l'embolcallen en un
   registre nou. Només sense translation_mode (propietat pròpia absent o undefined) o amb un mode que es normalitza
   a 'on_the_fly'; 'curated_5_langs', 'none' o un mode invàlid, mai. Qui té l'element SENCER no en té prou amb ell:
   demana el veredicte del pla (planTraduccioPublicacio.js · publicacioTraduible o ofereixTraduir; per a una
   pàgina, planTraduccioPagina.js · paginaTraduible), que a més exigix la llengua original de les cinc i una
   revisada completa (troballa DQ-01: una alerta amb 'on_the_fly' i sense source_language és un error del pla, i
   l'avís i la targeta no poden discrepar). La targeta incrustada (SincronitzacioTargetes · propsDeLOriginal) en
   porta tots dos: el veredicte del pla (showTranslate) i el mode, que ací queda de defensa en profunditat
   (troballes RIG2-01 i DIS-R2-01). Diferència deliberada: ací un accessor (no és una dada) es refusa (fallada
   tancada), i el pla, que només llig propietats pròpies de dades, el compta com a absent; cap vista amb l'element
   sencer no arriba a este cas, i el pis sempre rep dades. */
export function allowsMachineTranslation(item) {
  const own = record(item) ? Object.getOwnPropertyDescriptor(item, 'translation_mode') : undefined;
  if (!own || (Object.hasOwn(own, 'value') && own.value === undefined)) return true;
  try { return Object.hasOwn(own, 'value') && normalizeTranslationMode(own.value) === 'on_the_fly'; } catch { return false; }
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
