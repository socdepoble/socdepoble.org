import { delVal, getVal, setVal } from './storage.js';
import CA from './idiomes/ca.js';

/* Fase D (261020, tasca 4.1) · L1 · Els textos de la interfície NO viuen
   ací: un diccionari per llengua a src/config/idiomes/<codi>.js, amb les
   mateixes claus a les cinc. Una clau nova va als cinc fitxers. */

export const LANGUAGE_STORAGE_KEY = 'socdepoble-language';
export const DEFAULT_LANGUAGE = 'ca';

export const SUPPORTED_LANGUAGES = [
  { code: 'ca', name: 'Valencià' },
  { code: 'es', name: 'Castellà' },
  { code: 'en', name: 'English' },
  { code: 'eu', name: 'Euskara' },
  { code: 'gl', name: 'Galego' }
];

const SECTION_LABEL_KEYS = {
  control: { label: 'nav.control', short: 'nav.controlShort' },
  gestoria: { label: 'nav.gestoria', short: 'nav.gestoriaShort' },
  xat: { label: 'nav.xat', short: 'nav.xat' },
  mur: { label: 'nav.mur', short: 'nav.mur' },
  mercat: { label: 'nav.mercat', short: 'nav.mercat' },
  pobles: { label: 'nav.pobles', short: 'nav.pobles' },
  events: { label: 'nav.events', short: 'nav.events' },
  calendari: { label: 'section.events.calendarMeta', short: 'section.events.calendarMeta' },
  mapa: { label: 'nav.mapa', short: 'nav.mapa' },
  multimedia: { label: 'nav.multimedia', short: 'nav.multimedia' },
  notes: { label: 'nav.notes', short: 'nav.notesShort' },
  dispositius: { label: 'nav.dispositius', short: 'nav.dispositiusShort' },
  projecte: { label: 'nav.projecte', short: 'nav.projecteShort' },
  constitucio: { label: 'nav.constitucio', short: 'nav.constitucioShort' },
  disseny: { label: 'nav.disseny', short: 'nav.disseny' },
  wikidepoble: { label: 'nav.wikidepoble', short: 'nav.wikidepobleShort' },
  ia: { label: 'nav.ia', short: 'nav.ia' },
  roadmap: { label: 'nav.roadmap', short: 'nav.roadmapShort' },
  versions: { label: 'nav.versions', short: 'nav.versionsShort' },
  legal: { label: 'nav.legal', short: 'nav.legalShort' }
};

export function normalizeLanguage(code) {
  return SUPPORTED_LANGUAGES.some((language) => language.code === code) ? code : DEFAULT_LANGUAGE;
}

/* ── T1 · Llengua (decisió del Mestre, 260930) ─────────────────────────
   Precedència: tria explícita desada de l'usuari > `language` vàlida de
   l'amfitrió > 'ca'. El `lang` del document de l'amfitrió no és cap font:
   l'app és autònoma siga quin siga el <html lang> de la pàgina que la porta.
   Només una tria explícita (setLanguage) escriu a l'emmagatzematge, amb una
   càrrega versionada a la mateixa clau. El valor antic (text cru) no es pot
   distingir d'una detecció automàtica: s'esborra en llegir-lo i compta com
   a «sense tria». L'accés passa per storage.js, que ja protegix cada crida. */
const VERSIO_IDIOMA = 2;

/** Només els codis exactes del selector: 'en-US', 'ES', 'fr', 42 o '' no valen. */
export function esLlenguaSuportada(codi) {
  return typeof codi === 'string' && SUPPORTED_LANGUAGES.some((language) => language.code === codi);
}

/** La tria explícita desada, o null si no n'hi ha cap de vàlida. */
export function llegeixIdiomaTriat() {
  const desat = getVal(LANGUAGE_STORAGE_KEY);
  if (desat && typeof desat === 'object' && desat.v === VERSIO_IDIOMA && esLlenguaSuportada(desat.codi)) {
    return desat.codi;
  }
  if (desat !== null) delVal(LANGUAGE_STORAGE_KEY);
  return null;
}

/** Desa una tria explícita. Torna true només si ha quedat escrita. */
export function desaIdiomaTriat(codi) {
  if (!esLlenguaSuportada(codi)) return false;
  return setVal(LANGUAGE_STORAGE_KEY, { v: VERSIO_IDIOMA, codi });
}

/** Funció pura: tria > amfitrió > valencià. */
export function resolIdioma({ triat, amfitrio } = {}) {
  if (esLlenguaSuportada(triat)) return triat;
  if (esLlenguaSuportada(amfitrio)) return amfitrio;
  return DEFAULT_LANGUAGE;
}

/* ── Fase D (261020, tasca 4.1) · L1 · Diccionaris sota demanda ─────────
   El valencià (idiomes/ca.js) viatja dins del tros d'entrada: és la llengua
   per defecte i la reserva clau per clau de totes les altres. Les altres
   quatre són trossos a banda que es demanen quan la llengua es tria, quan
   l'amfitrió la porta o, en arrencar, si és la tria desada.
   · Especificadors literals, un per llengua: Rollup en fa un tros per a
     cadascun, i els grafs de LLEI_08 i de tractor-importacions només seguixen
     import('…') literals.
   · Cap altre mòdul de producció no nomena estos fitxers (cap import estàtic,
     cap import.meta.glob): els tornaria a ficar a l'entrada
     (i18n.idiomes.test.js ho guarda).
   · Al directori de WordPress (IIFE, inlineDynamicImports) van inlinats:
     import() es resol en microtasques, abans del primer pintat.
   · Mentre un diccionari no hi és, el text és el valencià sencer: cap cadena
     buida, cap clau crua.
   · Límit mesurat (Chromium, VisorDePublicacio.jsx): un import() fallit queda
     fallit fins que es recarrega la pàgina; tornar a triar no el reintenta. */
const CARREGADORS = Object.freeze({
  es: () => import('./idiomes/es.js'),
  en: () => import('./idiomes/en.js'),
  eu: () => import('./idiomes/eu.js'),
  gl: () => import('./idiomes/gl.js')
});

/** Les llengües del selector que no viatgen a l'entrada (totes llevat del valencià). */
export const IDIOMES_DIFERITS = Object.freeze(Object.keys(CARREGADORS));

/** Sostre (ms) que el primer pintat de main.jsx i natiu/entrada.jsx espera un diccionari. */
export const ESPERA_DEL_PRIMER_PINTAT = 300;

/**
 * Un registre de diccionaris. `base` és en memòria des del principi (el
 * valencià); la resta arriba per `carregadors` (codi → () => Promise del mòdul,
 * amb el diccionari com a `default`).
 *  · carrega(codi) torna Promise<boolean> i no rebutja mai. Dues crides en vol
 *    compartixen la promesa; una fallida s'oblida i la següent ho torna a provar.
 *  · subscriu(avisa) avisa amb el codi cada vegada que entra un diccionari.
 *    Cada oient va aïllat: un que llança no talla els altres ni fa fallar la càrrega.
 */
export function creaRegistreDeDiccionaris({ base, carregadors }) {
  const diccionaris = new Map([[DEFAULT_LANGUAGE, base]]);
  const enVol = new Map();
  const oients = new Set();
  const diccionari = (codi) => diccionaris.get(codi) || null;

  function avisaTots(codi) {
    for (const avisa of [...oients]) {
      try { avisa(codi); } catch (error) { console.error('[i18n] Un oient dels diccionaris ha fallat.', error); }
    }
  }

  function carrega(codi) {
    if (diccionaris.has(codi)) return Promise.resolve(true);
    if (enVol.has(codi)) return enVol.get(codi);
    if (!Object.hasOwn(carregadors, codi)) return Promise.resolve(false);
    const promesa = new Promise((resol) => resol(carregadors[codi]()))
      .then((modul) => {
        const nou = modul?.default;
        if (!nou || typeof nou !== 'object') throw new TypeError(`el tros de «${codi}» no porta cap diccionari`);
        diccionaris.set(codi, nou);
        avisaTots(codi);
        return true;
      })
      .catch((error) => {
        console.warn(`[i18n] No s'ha pogut carregar el diccionari «${codi}»: el text continua en valencià.`, error);
        return false;
      })
      .finally(() => { enVol.delete(codi); });
    enVol.set(codi, promesa);
    return promesa;
  }

  function subscriu(avisa) {
    oients.add(avisa);
    return () => { oients.delete(avisa); };
  }

  return Object.freeze({ diccionari, carrega, subscriu });
}

const REGISTRE = creaRegistreDeDiccionaris({ base: CA, carregadors: CARREGADORS });

/** True si el diccionari d'esta llengua (codi exacte del selector) ja és en memòria. */
export function teDiccionari(codi) {
  return esLlenguaSuportada(codi) && REGISTRE.diccionari(codi) !== null;
}

/** La llengua que es pot pintar ara: la demanada si el seu diccionari hi és; si no, el valencià. */
export function llenguaCarregada(codi) {
  const llengua = normalizeLanguage(codi);
  return REGISTRE.diccionari(llengua) ? llengua : DEFAULT_LANGUAGE;
}

/** Demana el diccionari d'una llengua. Un codi que l'app no parla és el valencià: true. */
export function carregaDiccionari(codi) {
  return REGISTRE.carrega(normalizeLanguage(codi));
}

/** Per a useSyncExternalStore (UIContext.jsx). */
export function subscriuDiccionaris(avisa) {
  return REGISTRE.subscriu(avisa);
}

/** L'element <soc-de-poble>, abans de root.render(): comença a baixar el
 *  diccionari de la llengua que es pintarà (tria desada > amfitrió > ca). */
export function precarregaIdioma({ amfitrio } = {}) {
  return carregaDiccionari(resolIdioma({ triat: llegeixIdiomaTriat(), amfitrio }));
}

/** Primer pintat de les entrades pròpies (main.jsx, natiu/entrada.jsx): a
 *  l'acte si el diccionari d'arrencada ja hi és (el valencià, sempre); si no,
 *  quan arriba o falla, com a molt `espera` ms (llavors en valencià, i el
 *  canvi arriba sol per UIContext). Crida `pinta` una sola vegada. L'element
 *  no l'usa: dins d'una pàgina amfitriona no es retarda cap muntatge. */
export function pintaAmbDiccionari(pinta, { amfitrio, espera = ESPERA_DEL_PRIMER_PINTAT, registre = REGISTRE } = {}) {
  const llengua = normalizeLanguage(resolIdioma({ triat: llegeixIdiomaTriat(), amfitrio }));
  const carrega = registre.carrega(llengua);
  if (registre.diccionari(llengua)) {
    pinta();
    return carrega;
  }
  let pintat = false;
  let rellotge = null;
  const una = () => {
    if (pintat) return;
    pintat = true;
    clearTimeout(rellotge);
    pinta();
  };
  rellotge = setTimeout(una, espera);
  carrega.then(una);
  return carrega;
}

export function createTranslator(language) {
  const llengua = normalizeLanguage(language);
  /* Lectura viva: un traductor fet abans que arribe el seu diccionari dona
     el valencià i, des que arriba, la seua llengua. */
  let diccionari = REGISTRE.diccionari(llengua);
  return (key, fallback = key) => (diccionari ??= REGISTRE.diccionari(llengua))?.[key] || CA[key] || fallback;
}

export function getSectionLabels(sectionId, language) {
  const translator = createTranslator(language);
  const entry = SECTION_LABEL_KEYS[sectionId];
  if (!entry) {
    return { label: sectionId, shortLabel: sectionId };
  }
  return {
    label: translator(entry.label, sectionId),
    shortLabel: translator(entry.short, sectionId)
  };
}
