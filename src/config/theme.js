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

/* Auditoria 261007 (B) · Dues instàncies a la mateixa pàgina no divergixen
   tampoc en el tema: setTheme i toggleTheme (UIContext) avisen les altres per
   este canal, amb el mateix patró que ESDEVENIMENT_CONTRAST (més avall) i
   `sdp:language-changed`. El detall és { theme: preferència } ('system',
   'light' o 'dark'). L'oient només posa l'estat (no desa ni reemet): cap
   bucle. Abans, passar a fosc des d'un bloc deixava l'altre en clar fins a
   recarregar la pàgina. */
export const ESDEVENIMENT_TEMA = 'sdp:theme-changed';

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

/* ════════════════ MODE SÈNIOR · LECTURA GRAN (P1-80 / IDEA-252) ════════════════
 *
 * Preferència persistent universal d'1 sol toc per a gent gran i baixa visió
 * (storage.js, Model B: local per dispositiu):
 *   · false → pantalla de sempre (cap atribut, Llei del Píxel);
 *   · true  → data-sdp-senior="true" a l'arrel de presentació (<html> a
 *             socdepoble.org, :host a <soc-de-poble>, .sdp-root en un amfitrió
 *             ordinari): dianes d'acció primària >= 56x56 px (3.5rem), escalat
 *             tipogràfic fluid i contrast reforçat >= 10:1 AAA en clar i fosc.
 * Si l'emmagatzematge falla (mode privat o quota), la preferència es conserva
 * en memòria cau durant tota la sessió i avisa totes les instàncies obertes. */
export const SENIOR_KEY = 'sdp-senior';
export const ATRIBUT_SENIOR = 'data-sdp-senior';
export const ESDEVENIMENT_SENIOR = 'sdp:senior-changed';

let seniorEnMemoria = null;
const oientsSenior = new Set();

function normalitzaBooleaSenior(valor) {
  if (valor === true || valor === 'true') return true;
  if (valor === false || valor === 'false') return false;
  return null;
}

/** Llig la preferència de Mode Sènior: configurada vàlida, o storage.js, o memòria, o false. */
export function readSeniorPreference(configured) {
  const conf = normalitzaBooleaSenior(configured);
  if (conf !== null) return conf;
  const desada = normalitzaBooleaSenior(getVal(SENIOR_KEY));
  if (desada !== null) {
    seniorEnMemoria = desada;
    return desada;
  }
  return seniorEnMemoria === true;
}

/** Desa la preferència booleana de Mode Sènior i notifica oients i instàncies. */
export function writeSeniorPreference(actiu, { emet = true } = {}) {
  if (typeof actiu !== 'boolean') return false;
  seniorEnMemoria = actiu;
  const desat = setVal(SENIOR_KEY, actiu);
  if (emet) {
    for (const oient of [...oientsSenior]) oient(actiu);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(ESDEVENIMENT_SENIOR, { detail: { senior: actiu } }));
    }
  }
  return desat;
}

/* v1.2.22 · Gauntlet R1 (L2-10) · Fora commutaModeSenior: no tenia cap consumidor i, amb el Mode Bancal (més avall),
   commutar només SENIOR_KEY no apagava un 'bancal' antic desat. El commuta d'ara és UIContext.toggleSeniorMode i, fora
   del proveïdor, el de ControlModeSenior. */

/** Subscriu un oient als canvis de Mode Sènior dins de la mateixa finestra. */
export function subscriuModeSenior(alCanviar) {
  if (typeof alCanviar !== 'function') return () => {};
  oientsSenior.add(alCanviar);
  const enEvent = (event) => {
    const val = normalitzaBooleaSenior(event?.detail?.senior);
    if (val !== null) {
      seniorEnMemoria = val;
      alCanviar(val);
    }
  };
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener(ESDEVENIMENT_SENIOR, enEvent);
  }
  return () => {
    oientsSenior.delete(alCanviar);
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener(ESDEVENIMENT_SENIOR, enEvent);
    }
  };
}

/** Posa o lleva data-sdp-senior="true" sobre l'element arrel de presentació. */
export function aplicaSenior(element, actiu) {
  if (!element || typeof element.setAttribute !== 'function') return;
  if (actiu === true) element.setAttribute(ATRIBUT_SENIOR, 'true');
  else element.removeAttribute(ATRIBUT_SENIOR);
}

/* ════════════ UN SOL MODE BANCAL (IDEA-323.4 · DOL-31, ordre del Mestre del 261122) ════════════
 *
 * El Mode Sènior (lletra i dianes grans) i el contrast Bancal són UN sol mode, «Mode Bancal · Sol
 * i Lletra Gran»: s'encén i s'apaga d'un sol toc i posa els dos atributs alhora. L'interruptor és
 * SENIOR_KEY; un 'bancal' desat a CONTRAST_KEY per una versió anterior també l'encén (i en apagar
 * el mode torna a 'normal'). Apagat, el contrast és la tria 'normal' o 'sistema' (prefers-contrast:
 * more), que es respecta. */
export const esModeBancal = (senior, contrast) => senior === true || contrast === CONTRAST_BANCAL;

/** El contrast que es pinta: 'bancal' amb el Mode Bancal; si no, el de la tria i el sistema. */
export const contrastDelMode = (modeBancal, contrast, sistemaMes) => (modeBancal ? CONTRAST_BANCAL : resolveContrast(contrast, sistemaMes));

/** Neteja la memòria cau en proves unitàries quan es reseteja l'emmagatzematge (storage.js). */
export function reiniciaMemoriaSenior() {
  seniorEnMemoria = null;
}

