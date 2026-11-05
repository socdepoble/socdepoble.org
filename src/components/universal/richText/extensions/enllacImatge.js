/**
 * enllacImatge.js · P0-26 D1 (Onada R6, Bloc 2; avís A1 de Gemini) · Una
 * imatge del cos pot portar un enllaç: els logotips de les entitats, el cartell
 * que porta a l'Aplec i el logotip que torna al Manifest. Abans, el primer
 * getHTML() de l'editor llevava l'<a> de fora (SdpImage no tenia href i la
 * marca Link no es posa en un node de bloc), i en desar la imatge perdia el clic.
 *
 * El node SdpImage (index.js) llig l'enllaç de l'<a> pare o, si no n'hi ha, de
 * data-sdp-href / data-sdp-target / data-sdp-rel de la mateixa <img>, i el
 * torna a escriure com a <a class="sdp-image-link"> al voltant de l'<img>.
 * Només entren adreces segures: un camí de l'app, un fragment, una consulta o
 * una URL http(s) o mailto sense credencials (hrefSegur, i ací http i mailto).
 * Una foto sense enllaç no en porta cap: continua obrint el visor (A2 de
 * Gemini; VisorDePublicacio salta tota imatge dins d'un enllaç).
 */
import { hrefSegur } from '../../traduccio/blocsTraduibles.js';

export const CLASSE_ENLLAC_IMATGE = 'sdp-image-link';

const PROTOCOLS_AFEGITS = new Set(['http:', 'mailto:']);
const REL_PERMESOS = new Set(['noopener', 'noreferrer', 'nofollow', 'ugc', 'external']);
const REL_PESTANYA_NOVA = ['noopener', 'noreferrer'];
const esControlOEspai = (car) => car.codePointAt(0) < 0x21 || car.codePointAt(0) === 0x7f || /\s/.test(car);

/** L'href d'una imatge si és segur de pintar; si no, null. */
export function hrefDeImatge(valor) {
  if (typeof valor !== 'string') return null;
  const segur = hrefSegur(valor);
  if (segur) return segur;
  const adreca = valor.trim();
  if (!adreca || Array.from(adreca).some(esControlOEspai)) return null;
  try {
    const url = new URL(adreca);
    return PROTOCOLS_AFEGITS.has(url.protocol) && !url.username && !url.password ? adreca : null;
  } catch {
    return null;
  }
}

/** Només «_blank» com a destinació; qualsevol altre valor no entra. */
export const destinacioDeImatge = (valor) => (typeof valor === 'string' && valor.trim().toLowerCase() === '_blank' ? '_blank' : null);

/** El rel: només paraules conegudes, i amb «_blank» sempre noopener i noreferrer. */
export function relDeImatge(valor, destinacio) {
  const paraules = (typeof valor === 'string' ? valor.toLowerCase().split(/\s+/) : []).filter((p) => REL_PERMESOS.has(p));
  if (destinacio === '_blank') paraules.unshift(...REL_PESTANYA_NOVA);
  const uniques = [...new Set(paraules)];
  return uniques.length ? uniques.join(' ') : null;
}

/* D'on es llig l'enllaç d'una <img>: les seues marques data-sdp-* o l'<a> pare. */
const fontDeLEnllac = (element) => {
  if (element?.hasAttribute?.('data-sdp-href')) return { element, prefix: 'data-sdp-' };
  const pare = element?.parentElement;
  return pare?.tagName === 'A' && pare.hasAttribute('href') ? { element: pare, prefix: '' } : null;
};

const llig = (element, nom) => {
  const font = fontDeLEnllac(element);
  return font ? font.element.getAttribute(`${font.prefix}${nom}`) : null;
};

/** Els tres atributs nous del node SdpImage. No es pinten a l'<img>: els pinta renderHTML. */
export const atributsDEnllac = () => ({
  href: { default: null, parseHTML: (element) => hrefDeImatge(llig(element, 'href')), renderHTML: () => ({}) },
  target: {
    default: null,
    parseHTML: (element) => (hrefDeImatge(llig(element, 'href')) ? destinacioDeImatge(llig(element, 'target')) : null),
    renderHTML: () => ({}),
  },
  rel: {
    default: null,
    parseHTML: (element) => (hrefDeImatge(llig(element, 'href')) ? relDeImatge(llig(element, 'rel'), destinacioDeImatge(llig(element, 'target'))) : null),
    renderHTML: () => ({}),
  },
});

/** Els atributs de l'<a> d'una imatge enllaçada, o null si no té cap href segur. */
export function atributsDeLEnllac(attrs) {
  const href = hrefDeImatge(attrs?.href);
  if (!href) return null;
  const target = destinacioDeImatge(attrs?.target);
  const rel = relDeImatge(attrs?.rel, target);
  return { href, ...(target ? { target } : {}), ...(rel ? { rel } : {}), class: CLASSE_ENLLAC_IMATGE };
}
