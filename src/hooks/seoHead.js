import { ATRIBUT_SSR, CAP_SOCIAL_BASE, ORIGEN_SOCIAL_PER_DEFECTE } from '../config/imatgeSocial.js';

// Un sol propietari per document. La ruta té un fallback i les vistes poden
// concretar-lo; en desmuntar desapareixen les metadades de la vista anterior.
const owners = new Map();
let baseline = null;
let activePath = null;
let sequence = 0;
/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · La ruta que declara
   el head servit (el seu canonical o og:url marcats), mentre els seus nodes
   continuen al document; null si no n'hi ha cap. */
let rutaServida = null;
// Les propietats d'imatge van darrere d'og:image: restaurar per este ordre
// manté cada propietat estructurada després de la imatge que descriu.
const PROPIETATS_IMATGE = [['og:image:type', 'type'], ['og:image:width', 'width'],
  ['og:image:height', 'height'], ['og:image:alt', 'alt']];
// Pla 261027_1154 (P1-61) · S3. og:type també és de la ruta: un 'product'
// servit no pot quedar a /mur. Va davant d'og:image per no partir el conjunt.
const selectors = [
  'meta[name="description"]', 'meta[name="robots"]', 'meta[name="twitter:title"]',
  'meta[name="twitter:description"]', 'meta[name="twitter:image"]', 'meta[name="twitter:image:alt"]',
  'meta[name="twitter:card"]', 'meta[property="og:title"]', 'meta[property="og:description"]',
  'meta[property="og:type"]',
  'meta[property="og:image"]', ...PROPIETATS_IMATGE.map(([nom]) => `meta[property="${nom}"]`),
  'meta[property="og:url"]', 'link[rel="canonical"]', 'script[data-sdp-seo]'
];

/* Pla 261027_1154 (P1-61) · S3. El <head> genèric, escrit des de les
   constants: el mateix que servix index.html (imatgeSocial.test.js en fixa
   cada valor), amb la imatge absoluta sobre l'origen públic. Sense og:url,
   canonical, robots ni JSON-LD propi: este head es servix a totes les rutes. */
const IMATGE_GENERICA = new URL(CAP_SOCIAL_BASE.image.url, ORIGEN_SOCIAL_PER_DEFECTE).href;
const METES_GENERIQUES = [
  ['name', 'description', CAP_SOCIAL_BASE.description],
  ['name', 'twitter:title', CAP_SOCIAL_BASE.title], ['name', 'twitter:description', CAP_SOCIAL_BASE.description],
  ['name', 'twitter:image', IMATGE_GENERICA], ['name', 'twitter:image:alt', CAP_SOCIAL_BASE.image.alt],
  ['name', 'twitter:card', CAP_SOCIAL_BASE.twitterCard],
  ['property', 'og:title', CAP_SOCIAL_BASE.title], ['property', 'og:description', CAP_SOCIAL_BASE.description],
  ['property', 'og:type', CAP_SOCIAL_BASE.ogType], ['property', 'og:image', IMATGE_GENERICA],
  ...PROPIETATS_IMATGE.map(([nom, clau]) => ['property', nom, CAP_SOCIAL_BASE.image[clau]])
];
function baseGenerica() {
  return { title: CAP_SOCIAL_BASE.title, nodes: selectors.map(selector => ({ selector,
    nodes: METES_GENERIQUES.filter(([attribute, name]) => `meta[${attribute}="${name}"]` === selector)
      .map(([attribute, name, content]) => {
        const node = document.createElement('meta'); node.setAttribute(attribute, name); node.content = content;
        return node;
      }) })) };
}
/* Pla 261027_1154 (P1-61) · S3. Un head ja particularitzat pel servidor (el
   prerender marca cada node seu amb ATRIBUT_SSR) no és la base: abans, el
   títol, la descripció, la imatge, l'og:type i el JSON-LD del producte
   d'entrada quedaven per a totes les rutes següents. Amb la marca, la base és
   la genèrica i els nodes marcats se'n van (purgaServits: també els que no
   gestiona cap selector, com product:price:*); el <title> es queda, sense la
   marca, i el reescriu restore(). Sense cap node marcat (index.html), la base
   és el head servit, com sempre.
   Revisió adversarial (261027) · Els nodes marcats ja no se'n van en el
   primer registre de qualsevol propietari: el head servit és el de la seua
   ruta (la que diu el seu canonical o og:url marcat), i mentre l'SPA hi és,
   mana ell. Abans, la reserva de RouteSEO o la vista que encara esperava les
   dades (sense títol) el substituïen pel genèric, i quan arribaven les dades
   el client no hi tornava a posar l'og:type 'product', el JSON-LD Product ni
   product:price; si la càrrega fallava, quedava «No trobat». Se'n van en
   canviar de ruta. Un head marcat que no declara cap ruta se'n va en el
   primer registre, com abans. */
const senseBarraFinal = cami => (cami.length > 1 ? cami.replace(/\/+$/, '') || '/' : cami);
function rutaDelHeadServit() {
  const canonical = document.head.querySelector(`link[rel="canonical"][${ATRIBUT_SSR}]`);
  const ogUrl = document.head.querySelector(`meta[property="og:url"][${ATRIBUT_SSR}]`);
  const valor = canonical?.getAttribute('href') || ogUrl?.getAttribute('content');
  if (!valor) return null;
  try {
    return senseBarraFinal(new URL(valor, document.baseURI).pathname);
  } catch {
    return null;
  }
}
function purgaServits() {
  document.head.querySelectorAll(`[${ATRIBUT_SSR}]`)
    .forEach(node => (node.tagName === 'TITLE' ? node.removeAttribute(ATRIBUT_SSR) : node.remove()));
  rutaServida = null;
}
function capture() {
  if (document.head.querySelector(`[${ATRIBUT_SSR}]`)) {
    rutaServida = rutaDelHeadServit();
    if (rutaServida === null) purgaServits();
    return baseGenerica();
  }
  return { title: document.title, nodes: selectors.map(selector => ({ selector,
    nodes: [...document.head.querySelectorAll(selector)].map(node => node.cloneNode(true)) })) };
}
const esLaRutaServida = () => rutaServida !== null && typeof activePath === 'string' && senseBarraFinal(activePath) === rutaServida;
function restore() {
  if (!baseline) return;
  document.title = baseline.title;
  for (const { selector, nodes } of baseline.nodes) {
    document.head.querySelectorAll(selector).forEach(node => node.remove());
    nodes.forEach(node => document.head.appendChild(node.cloneNode(true)));
  }
}
function meta(name, content, attribute = 'name') {
  const selector = `meta[${attribute}="${name}"]`;
  const matches = [...document.head.querySelectorAll(selector)];
  let node = matches.shift();
  matches.forEach(extra => extra.remove());
  if (!content) { node?.remove(); return; }
  if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, name); document.head.appendChild(node); }
  node.content = content;
}
function apply() {
  /* Revisió adversarial (261027) · A la ruta del head servit, el head és el
     del servidor: no es toca. En eixir-ne, els seus nodes se'n van. */
  if (rutaServida !== null) {
    if (esLaRutaServida()) return;
    purgaServits();
  }
  const eligible = [...owners.values()].filter(owner => owner.path === activePath)
    .sort((a, b) => b.priority - a.priority || b.sequence - a.sequence);
  restore();
  const chosen = eligible[0];
  if (!chosen) return;
  const { data } = chosen;
  const fullTitle = data.title ? `${data.title} | Sóc de Poble` : 'Sóc de Poble';
  document.title = fullTitle;
  meta('og:title', fullTitle, 'property'); meta('twitter:title', fullTitle);
  // Pla 261027_1154 (P1-61) · S3. La reserva és la genèrica, no la del head
  // capturat: un head servit amb la descripció d'un producte no la presta.
  const description = data.description || CAP_SOCIAL_BASE.description;
  meta('description', description); meta('og:description', description, 'property'); meta('twitter:description', description);
  meta('robots', data.index ? null : 'noindex, nofollow');
  meta('og:type', data.ogType || CAP_SOCIAL_BASE.ogType, 'property');
  /* La imatge és un conjunt (URL, MIME, mides i alt) i cada imatge porta el
     seu o cap. Pla 261027_1154 (P1-61) · S3. S'escriu sencer a cada ruta,
     també la targeta genèrica (useSEO la passa amb el seu conjunt): abans, la
     base es deixava tal com l'havia restaurada restore(), i amb un head servit
     particular eixa «base» era la foto del producte d'entrada. */
  const image = typeof data.image === 'string' ? { url: data.image } : data.image || null;
  meta('og:image', image?.url, 'property');
  PROPIETATS_IMATGE.forEach(([nom, clau]) => meta(nom, image?.url ? image[clau] : null, 'property'));
  meta('twitter:image', image?.url); meta('twitter:image:alt', image?.url ? image.alt : null);
  meta('twitter:card', image?.url ? CAP_SOCIAL_BASE.twitterCard : null);
  document.head.querySelectorAll('link[rel="canonical"], script[data-sdp-seo]').forEach(node => node.remove());
  if (data.index && data.canonical) {
    const link = document.createElement('link'); link.rel = 'canonical'; link.href = data.canonical; document.head.appendChild(link);
  }
  meta('og:url', data.index ? data.canonical : null, 'property');
  if (data.index && data.jsonLd) {
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.sdpSeo = 'true';
    script.textContent = data.jsonLd; document.head.appendChild(script);
  }
}
export function registerSeo(owner, { path, priority = 1, ...data }, options = {}) {
  // L'únic propietari de head exigix autoritat explícita (l'amfitrió la declara amb
  // manageDocumentHead: true); en iframe o amb __SDP_EMBEDDED__ no s'escriu mai al
  // document amfitrió, ni cridant directament.
  if (options?.manageDocumentHead !== true || typeof window === 'undefined'
    || typeof document === 'undefined' || window.self !== window.top || window.__SDP_EMBEDDED__) return () => {};
  baseline ||= capture();
  owners.set(owner, { path, priority, data, sequence: ++sequence });
  // El fallback fixa la ruta fins i tot quan la secció encara està carregant.
  if (priority === 0 || ![...owners.values()].some(entry => entry.priority === 0)) activePath = path;
  apply();
  return () => {
    owners.delete(owner);
    /* Revisió adversarial (261027) · Si l'SPA es desmunta sencera sense haver
       eixit de la ruta servida, el head és el que hi havia: el del servidor. */
    if (!owners.size) { if (rutaServida === null) restore(); baseline = null; activePath = null; rutaServida = null; }
    else apply();
  };
}
