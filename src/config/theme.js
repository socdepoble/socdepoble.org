import { getVal, setVal } from './storage.js';

export const THEME_KEY = 'sdp-theme';
/* Torn 260930 (T1) · Les tres preferències, exportades per a qui les
   oferix a la persona (UIContext.setTheme, el full «Ajustos» del Xat). */
export const PREFERENCIES_TEMA = Object.freeze(['system', 'light', 'dark']);
const VALID = new Set(PREFERENCIES_TEMA);

export function readThemePreference(configured) {
  if (VALID.has(configured)) return configured;
  
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'light'; // Fallback

  // 1. Font de veritat: atribut HTML (Shadow DOM o arrel)
  let root = null;
  if (typeof document !== 'undefined') {
    const sdpElement = document.querySelector('soc-de-poble');
    if (sdpElement && sdpElement.shadowRoot) {
      root = sdpElement.shadowRoot.querySelector('.sdp-root');
    }
    if (!root) {
      root = document.querySelector('.sdp-root') || document.querySelector('#socdepoble-app') || document.documentElement;
    }
  }
  const htmlTheme = root ? root.getAttribute('data-theme') : null;
  if (htmlTheme && VALID.has(htmlTheme)) return htmlTheme;

  // 2. Fallback a LocalStorage (text cru)
  const raw = getVal(THEME_KEY);
  if (raw && VALID.has(raw)) return raw;

  return 'light'; // Fallback final
}

export function resolveTheme(preference) {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'light'; // Fallback per SSR
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function writeThemePreference(preference) {
  setVal(THEME_KEY, preference);
}

/* ════════════════ CONTRAST · MODE BANCAL (D6, Q1 del Mestre, 261004) ════════════════
 *
 * Tres preferències, per persona i dispositiu (storage.js, Model B: res al
 * servidor):
 *   · 'normal'  → cap atribut: la pantalla de sempre (Llei del Píxel);
 *   · 'bancal'  → data-contrast="bancal": màxim contrast per a llegir a
 *                 l'exterior, al sol (doctrina AAA, pageContent.js art. 2);
 *   · 'sistema' → 'bancal' si el dispositiu demana més contrast
 *                 (`prefers-contrast: more`), si no 'normal'.
 *
 * L'atribut va a l'arrel que diu arrelDePresentacio (més avall, W4-12):
 * <html> només quan l'app és ama del document (socdepoble.org), l'element
 * <soc-de-poble> incrustat i, en un document alié sense Shadow DOM, l'arrel
 * del mòdul (.sdp-root). tokens.css el troba amb `:root[...]`, `:host(...)` i
 * `.sdp-root[...]`. Els colors no viuen ací: només es diu QUIN mode toca.
 *
 * Baseline 2022: Chrome 100 i Safari 16.0 coneixen `prefers-contrast`;
 * Firefox 100 no (arriba al 101). Allà la consulta no casa mai i «Segons el
 * sistema» es queda en 'normal': per això existix la tria manual «Bancal».
 * Sense matchMedia (jsdom, entorns sense finestra) també és 'normal'. */
export const CONTRAST_KEY = 'sdp-contrast';
export const ATRIBUT_CONTRAST = 'data-contrast';
export const CONTRAST_BANCAL = 'bancal';
export const CONSULTA_CONTRAST_SISTEMA = '(prefers-contrast: more)';
export const PREFERENCIES_CONTRAST = Object.freeze(['normal', CONTRAST_BANCAL, 'sistema']);
const CONTRAST_VALID = new Set(PREFERENCIES_CONTRAST);

/** La preferència de contrast: la configurada si és vàlida; si no, la desada; si no, 'normal'. */
export function readContrastPreference(configured) {
  if (CONTRAST_VALID.has(configured)) return configured;
  const desada = getVal(CONTRAST_KEY);
  return CONTRAST_VALID.has(desada) ? desada : 'normal';
}

/** Desa la tria. Torna true només si ha quedat escrita (mode privat o quota: false). */
export function writeContrastPreference(preferencia) {
  if (!CONTRAST_VALID.has(preferencia)) return false;
  return setVal(CONTRAST_KEY, preferencia);
}

/** Cert si el dispositiu demana més contrast ara mateix. */
export function sistemaDemanaContrast() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia(CONSULTA_CONTRAST_SISTEMA)?.matches === true;
  } catch {
    return false;
  }
}

/** El mode que es pinta, 'bancal' o 'normal', d'una preferència i de l'estat del sistema. */
export function resolveContrast(preferencia, sistemaMes = sistemaDemanaContrast()) {
  if (preferencia === CONTRAST_BANCAL) return CONTRAST_BANCAL;
  if (preferencia === 'sistema' && sistemaMes === true) return CONTRAST_BANCAL;
  return 'normal';
}

/** Posa (bancal) o lleva (normal) l'atribut sobre l'element que porta el tema. */
export function aplicaContrast(element, mode) {
  if (!element || typeof element.setAttribute !== 'function') return;
  if (mode === CONTRAST_BANCAL) element.setAttribute(ATRIBUT_CONTRAST, CONTRAST_BANCAL);
  else element.removeAttribute(ATRIBUT_CONTRAST);
}

/* ════════════ POLÍTICA D'ARREL I DOMINI (W4-12, auditoria de Codex 261004) ════════════
 *
 * L'atribut de contrast d'una instància va a UN element, i mai a un de
 * l'amfitrió:
 *   · dins d'un ShadowRoot → l'element amfitrió (<soc-de-poble>), que
 *     tokens.css troba amb :host([data-contrast="bancal"]);
 *   · l'app ama del document (esAmaDelDocument d'apps/plataforma/
 *     interruptors.js: manageDocumentHead === true, sense __SDP_EMBEDDED__ i
 *     fora d'iframe, com socdepoble.org) → <html>, `:root[...]`;
 *   · qualsevol altre document (l'embed React en DOM ordinari d'una pàgina
 *     aliena) → l'arrel del mòdul, .sdp-root, `.sdp-root[...]`.
 * Abans, sense ShadowRoot s'escrivia sempre a l'<html> i el mode normal
 * esborrava el data-contrast propi de la pàgina amfitriona.
 * El tema (data-theme) conserva el seu lloc de sempre (amfitrió o <html>):
 * els seus selectors foscos encara no casen amb l'arrel del mòdul. */
export function arrelDePresentacio(node, { amaDelDocument = false } = {}) {
  if (!node || typeof node.getRootNode !== 'function') return null;
  const arrel = node.getRootNode();
  if (typeof ShadowRoot !== 'undefined' && arrel instanceof ShadowRoot) return arrel.host;
  if (amaDelDocument === true && node.ownerDocument?.documentElement) return node.ownerDocument.documentElement;
  return (typeof node.closest === 'function' && node.closest('.sdp-root')) || node;
}

/* Qui ha escrit cada atribut, per element. Dues instàncies sobre el mateix
   element (dues apps ames del mateix document) no es barallen: mana l'última
   que escriu i, quan una se'n va, torna el valor de la que queda. Quan se'n va
   l'última, l'element recupera el valor que tenia abans de la primera: el de
   l'amfitrió, si n'hi havia, o cap. */
const RECLAMS = new WeakMap();

const escriuAtribut = (element, nom, valor) => {
  if (valor === null || valor === undefined) element.removeAttribute(nom);
  else element.setAttribute(nom, String(valor));
};

/**
 * Escriu `nom=valor` sobre l'element (null o undefined el lleva) i torna la
 * funció que el deixa anar. Deixar-lo anar més d'una vegada no fa res.
 */
export function reclamaAtribut(element, nom, valor) {
  if (!element || typeof element.setAttribute !== 'function' || !nom) return () => {};
  let perNom = RECLAMS.get(element);
  if (!perNom) {
    perNom = new Map();
    RECLAMS.set(element, perNom);
  }
  let reclam = perNom.get(nom);
  if (!reclam) {
    reclam = { original: element.getAttribute(nom), valors: new Map() };
    perNom.set(nom, reclam);
  }
  const clau = {};
  reclam.valors.set(clau, valor);
  escriuAtribut(element, nom, valor);
  return () => {
    if (!reclam.valors.delete(clau)) return;
    if (reclam.valors.size > 0) {
      escriuAtribut(element, nom, [...reclam.valors.values()].pop());
      return;
    }
    escriuAtribut(element, nom, reclam.original);
    if (perNom.get(nom) === reclam) perNom.delete(nom);
  };
}

/* Dues instàncies a la mateixa pàgina no divergixen: setContrast (UIContext)
   avisa les altres per este canal, com `sdp:language-changed` per a la llengua.
   L'oient només posa l'estat (no desa ni reemet): cap bucle. */
export const ESDEVENIMENT_CONTRAST = 'sdp:contrast-changed';

/**
 * Escolta els canvis de `prefers-contrast: more` i crida `alCanviar(cert|fals)`.
 * Torna la funció que deixa d'escoltar (sempre una funció, encara que no hi
 * haja res a escoltar). Safari < 14 només té addListener.
 */
export function subscriuContrastSistema(alCanviar) {
  const res = () => {};
  if (typeof alCanviar !== 'function') return res;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return res;
  let mq = null;
  try {
    mq = window.matchMedia(CONSULTA_CONTRAST_SISTEMA);
  } catch {
    return res;
  }
  if (!mq) return res;
  const oient = (event) => alCanviar(event?.matches === true);
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', oient);
    return () => mq.removeEventListener('change', oient);
  }
  if (typeof mq.addListener === 'function') {
    mq.addListener(oient);
    return () => mq.removeListener(oient);
  }
  return res;
}
