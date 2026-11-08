/**
 * planTraduccioPublicacio.js — R51 (P0-46 / IDEA-177; troballa R51V-03) · El
 * pla de traducció d'una publicació (la targeta del Mur, el detall de la ruta
 * i el lector del MAS), amb el mòdul pur del contracte (translationMode.js ·
 * getTranslationPlan). Cap cas no es decidix a banda: tots passen pel pla.
 *
 * Només per a una publicació que porta el seu `translation_mode` (propietat
 * pròpia de dades, no nul·la): sense, torna null i la vista seguix pel camí
 * de sempre (la regla general, `on_the_fly`, amb el Traduir de sempre).
 * Amb mode, la llengua original és la que diu la publicació
 * (`source_language`, mai inferida):
 *  · original (`none`, o la mateixa llengua): la publicació tal qual; amb
 *    `none`, sense Traduir;
 *  · curated: el títol i el cos de la versió revisada de la llengua de la
 *    interfície; subtítol i entradeta només si la mateixa entrada revisada en
 *    porta (D-R51-6): cap text de l'original barrejat amb la traducció;
 *  · on_the_fly: l'original i el Traduir de sempre (Apertium només si la
 *    persona ho demana; les guardes de privacitat són a l'adaptador);
 *  · error (R51_*: un mode que no existix, una llengua que no és de les
 *    cinc, una revisada incompleta): l'original, sense Traduir, i un avís
 *    accessible. Mai una substitució callada per Apertium.
 * El mapa de traduccions pot portar `html` (les pàgines) o `content`:
 * l'adaptador només llig propietats pròpies de dades (cap getter, cap
 * herència), i el mòdul pur valida la resta. Pur: ni xarxa, ni HTML, ni permisos.
 */
import { TRANSLATION_LANGUAGES, getTranslationPlan, normalizeTranslationMode } from './translationMode.js';

const esRegistre = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/** El valor d'una propietat pròpia de dades, o undefined. */
export function propia(objecte, clau) {
  if (!esRegistre(objecte)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(objecte, clau);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}

/** El mapa de traduccions amb la forma del contracte ({ title, content, reviewed }). */
export function traduccionsDelContracte(translations) {
  if (!esRegistre(translations)) return translations;
  return Object.fromEntries(Object.keys(translations).map((llengua) => {
    const entrada = propia(translations, llengua);
    if (!esRegistre(entrada)) return [llengua, entrada];
    const content = Object.hasOwn(entrada, 'content') ? propia(entrada, 'content') : propia(entrada, 'html');
    return [llengua, { title: propia(entrada, 'title'), content, reviewed: propia(entrada, 'reviewed') }];
  }));
}

const textOpcional = (valor) => (typeof valor === 'string' && valor.trim() ? valor : undefined);

/* Els textos d'una publicació que no són ni el títol ni el cos: amb la versió
   revisada, només els de la mateixa entrada (cap de l'original). */
const TEXTOS_SECUNDARIS = Object.freeze(['subtitle', 'post_subtitle', 'lead', 'entradilla', 'description', 'excerpt', 'summary']);

/**
 * { tipus: 'original' | 'curated' | 'on_the_fly' | 'error', traduible, element, llengua, codi? }
 * o null si la publicació no porta cap mode. `element` és l'objecte que cal
 * pintar (el mateix, si no és curated); `llengua`, la del contingut que es
 * pinta (null si no se sap); `traduible`, si es pot oferir el Traduir.
 */
export function planTraduccioPublicacio(element, llenguaInterficie) {
  const declarat = propia(element, 'translation_mode');
  if (declarat === undefined || declarat === null) return null;
  const translations = propia(element, 'translations');
  try {
    const mode = normalizeTranslationMode(declarat);
    const pla = getTranslationPlan({
      translation_mode: mode,
      source_language: propia(element, 'source_language'),
      target_language: llenguaInterficie,
      translations: traduccionsDelContracte(translations)
    });
    if (pla.kind === 'curated') {
      const entrada = propia(translations, pla.target_language);
      const secundaris = Object.fromEntries(TEXTOS_SECUNDARIS.map((clau) => [clau, textOpcional(propia(entrada, clau))]));
      return Object.freeze({
        tipus: 'curated',
        traduible: false,
        llengua: pla.target_language,
        element: { ...element, ...secundaris, title: pla.translation.title, content: pla.translation.content }
      });
    }
    return Object.freeze({ tipus: pla.kind, traduible: mode === 'on_the_fly', llengua: pla.source_language, element });
  } catch (error) {
    const font = propia(element, 'source_language');
    return Object.freeze({
      tipus: 'error',
      codi: error?.code || 'R51_TRANSLATION_MODE_INVALID',
      traduible: false,
      llengua: TRANSLATION_LANGUAGES.includes(font) ? font : null,
      element
    });
  }
}

/** Si una vista pot oferir el Traduir segons el pla: sense pla (cap mode declarat), sí. */
export const ofereixTraduir = (pla) => !pla || pla.traduible === true;

/**
 * R51 (P0-46; troballa R12G-BH-02) · El mateix veredicte d'ofereixTraduir per
 * a un text d'una publicació que es pinta sense el seu pla (el títol d'un acte
 * a l'Agenda o a la Setmana del calendari). No depén de la llengua de la
 * interfície: entre les cinc, el pla només tria quin text revisat es pinta,
 * mai si es pot traduir a màquina. Sense mode, sí; amb 'none', la revisada o
 * un error, no.
 */
export const publicacioTraduible = (element) => ofereixTraduir(planTraduccioPublicacio(element, TRANSLATION_LANGUAGES[0]));
