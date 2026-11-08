/**
 * planTraduccioPagina.js — R51 (P0-46 / IDEA-177) · El pla de traducció d'una
 * pàgina de text (TextSection), amb el mòdul pur del contracte
 * (traduccio/translationMode.js · getTranslationPlan).
 *
 * Només per a una pàgina que declara el seu `translation_mode` (propietat
 * pròpia): sense, torna null i TextSection seguix pel camí de sempre
 * (localitzaPagina). Avui no en declara cap (PAGE_COPY: 0 de 31), i res no
 * canvia a la vista.
 *
 * Amb mode declarat, cap traducció antiga no s'hi barreja i la llengua
 * original és la que la pàgina diu (`source_language`, mai inferida):
 *  · original (mode `none`, o la mateixa llengua): la pàgina tal qual; amb
 *    `none`, sense Traduir (traduccio: false; PageFrame ho avisa);
 *  · curated: el títol i el cos de la versió revisada de la llengua de la
 *    interfície, pel mateix renderer i el mateix sanejador; subtítol i
 *    entradeta només si la mateixa entrada revisada en porta (D-R51-6);
 *  · on_the_fly: l'original i el Traduir de sempre (Apertium només si la
 *    persona ho demana; les guardes de privacitat són a l'adaptador);
 *  · error (R51_*): l'original, sense Traduir, i un avís accessible. Mai una
 *    substitució callada per Apertium.
 * El mapa de traduccions de les pàgines porta `html`; el contracte, `content`:
 * l'adaptador només llig propietats pròpies de dades (cap getter, cap
 * herència), i el mòdul pur valida la resta.
 */
import { TRANSLATION_LANGUAGES, getTranslationPlan, normalizeTranslationMode } from '../../components/universal/traduccio/translationMode.js';
/* El mateix adaptador de dades que les publicacions (R51V-03): una sola còpia. */
import { propia, traduccionsDelContracte } from '../../components/universal/traduccio/planTraduccioPublicacio.js';

const esRegistre = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

const textOpcional = (valor) => (typeof valor === 'string' && valor.trim() ? valor : undefined);

/** Les etiquetes de l'original declaren la seua llengua (la d'origen). */
function etiquetesEnLaLlengua(labels, llengua) {
  if (!Array.isArray(labels)) return labels;
  return labels.map((label) => (typeof label === 'string' ? { text: label, lang: llengua } : { ...label, lang: label?.lang || llengua }));
}

/**
 * { tipus: 'original' | 'curated' | 'on_the_fly' | 'error', pagina, traduccio, codi? }
 * o null si la pàgina no declara cap mode.
 */
export function planTraduccioPagina(page, llenguaInterficie) {
  if (!esRegistre(page) || !Object.hasOwn(page, 'translation_mode')) return null;
  const { translations, ...original } = page;
  try {
    const mode = normalizeTranslationMode(page.translation_mode);
    const pla = getTranslationPlan({
      translation_mode: mode,
      source_language: page.source_language,
      target_language: llenguaInterficie,
      translations: traduccionsDelContracte(translations)
    });
    if (pla.kind === 'curated') {
      const entrada = propia(translations, pla.target_language);
      return Object.freeze({
        tipus: 'curated',
        traduccio: false,
        pagina: {
          ...original,
          title: pla.translation.title,
          html: pla.translation.content,
          subtitle: textOpcional(propia(entrada, 'subtitle')),
          lead: textOpcional(propia(entrada, 'lead')),
          labels: etiquetesEnLaLlengua(original.labels, pla.source_language),
          contentLanguage: pla.target_language
        }
      });
    }
    return Object.freeze({
      tipus: pla.kind,
      traduccio: mode === 'on_the_fly',
      pagina: { ...original, contentLanguage: pla.source_language }
    });
  } catch (error) {
    const pagina = TRANSLATION_LANGUAGES.includes(page.source_language) ? { ...original, contentLanguage: page.source_language } : original;
    return Object.freeze({ tipus: 'error', codi: error?.code || 'R51_TRANSLATION_MODE_INVALID', traduccio: false, pagina });
  }
}
