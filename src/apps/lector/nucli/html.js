/**
 * Lector de notícies · l'HTML d'un article, per LLISTA BLANCA (nucli pur).
 *
 * Per què no utils/sanitize.js: importa DOMPurify, i la regla transversal de
 * plataforma/fronteres.test.js (les utilitats que arrossega una app, en
 * tancament transitiu, no importen res de fora de src/utils) no ho admet; a
 * més, DOMPurify necessita un DOM i el nucli es prova en Node. Ací no cal un
 * sanejador de cadenes: l'HTML d'un article NO s'injecta mai (cap HTML cru a
 * l'app). Es llig a un arbre, l'arbre es reduïx a la llista blanca i la UI en
 * construïx els elements de React (vistes/Contingut.jsx). Un HTML trencat o
 * malintencionat, com a molt, es pinta com a text estrany: no s'executa.
 *
 *   llegixHtml(text)            HTML tolerant → arbre { nom, local, atributs, fills }
 *   arbreSegur(entrada, { base }) → { arbre, omesos, imatges }
 *     arbre   [bloc]: { t, c } amb t de BLOCS o EN_LINIA; els enllaços
 *             { t: 'a', href }; els textos són cadenes
 *     omesos  imatges (un <picture> o un svg, una), vídeos, àudios i marcs
 *             que s'han llevat (privacitat: carregar-los avisaria tercers de
 *             qui llig)
 *     imatges les adreces absolutes de les <img>, també les de dins d'un
 *             <picture>, per a triar la de la targeta
 *   htmlDeArbre(arbre)          l'arbre net en HTML (amb rel i target)
 *   textDeArbre(arbre)          el text pla, un bloc per línia
 *   sanejaHtml(text, { base })  tot alhora: { html, text, omesos, imatges }
 *
 * Llista blanca: p, h3–h6 (els títols baixen junts fins que el més alt és h3:
 * el títol de l'article és l'h2 del lector, UniversalPage §E), ul, ol, li,
 * blockquote, pre, hr; en
 * línia strong, em, code, br i a. Un enllaç només http, https o mailto i
 * sempre amb target=_blank i rel="noopener noreferrer". Cap altre atribut.
 * Fora amb tot el que tenen dins: DESCARTATS. La resta es desembolica.
 */
import { descodifica, netejaText, plega, talla } from './entitats.js';
import { PROTOCOLS_ENLLAC, PROTOCOLS_WEB, urlAbsoluta } from './urls.js';
import { llegixAtributs, llegixNom } from './xml.js';

export const LIMITS_HTML = Object.freeze({ caracters: 1024 * 1024, profunditat: 48, nodes: 20000, text: 200000 });

/* Elements sense contingut (no s'obrin a la pila). */
const BUIDES = new Set(['area', 'base', 'basefont', 'br', 'col', 'embed', 'frame', 'hr', 'img', 'input', 'keygen', 'link',
  'meta', 'param', 'source', 'track', 'wbr']);
/* El seu contingut és text cru fins al tancament (i tots van fora). */
const TEXT_CRU = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript',
  'template', 'plaintext']);
/* Fora, amb tot el que porten dins. */
const DESCARTATS = new Set(['script', 'style', 'iframe', 'frame', 'frameset', 'noframes', 'object', 'embed', 'applet',
  'param', 'noscript', 'noembed', 'template', 'svg', 'math', 'canvas', 'video', 'audio', 'picture', 'source', 'track',
  'map', 'area', 'form', 'input', 'button', 'select', 'option', 'optgroup', 'datalist', 'textarea', 'label',
  'fieldset', 'legend', 'output', 'meter', 'progress', 'dialog', 'slot', 'head', 'title', 'meta', 'link', 'base',
  'xmp', 'plaintext', 'portal', 'img']);
/* Dels descartats, els que es diuen a la persona («mitjans omesos»). Un
   <picture> compta una sola vegada, amb la seua <img> dins. */
const MITJANS = new Set(['img', 'picture', 'svg', 'video', 'audio', 'iframe', 'embed', 'object']);

/* Els títols de l'article baixen tots alhora fins que el més alt és h3: la
   jerarquia relativa es conserva i un arbre ja net no es torna a moure. */
const ENCAPCALAMENT = /^h([1-6])$/;
const PRIMER_NIVELL = 3;

function nivellMinim(nodes, profunditat = 0) {
  let minim = 7;
  if (profunditat > LIMITS_HTML.profunditat) return minim;
  for (const node of nodes) {
    if (typeof node === 'string' || !node || !Array.isArray(node.fills)) continue;
    const m = ENCAPCALAMENT.exec(String(node.local).toLowerCase());
    if (m) minim = Math.min(minim, Number(m[1]));
    else minim = Math.min(minim, nivellMinim(node.fills, profunditat + 1));
  }
  return minim;
}

const EN_LINIA = Object.freeze({
  b: 'strong', strong: 'strong', i: 'em', em: 'em', cite: 'em', dfn: 'em', var: 'em',
  code: 'code', kbd: 'code', samp: 'code', tt: 'code'
});
/* Contenidors de bloc que es desembolicen amb un salt de paràgraf. */
const CONTENIDORS = new Set(['div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav', 'figure',
  'figcaption', 'address', 'center', 'details', 'summary', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr',
  'caption', 'hgroup', 'body', 'html']);

/** Les etiquetes de l'arbre net: les úniques que la UI sap pintar. */
export const BLOCS = Object.freeze(['p', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'hr']);
export const ETIQUETES_EN_LINIA = Object.freeze(['strong', 'em', 'code', 'br', 'a']);
const EN_LINIA_T = new Set(ETIQUETES_EN_LINIA);
const PERMESES = new Set([...BLOCS, ...ETIQUETES_EN_LINIA]);

/* Un <p> obert es tanca quan comença un d'estos (regla d'HTML). */
const TANQUEN_P = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'menu', 'nav', 'ol',
  'p', 'pre', 'section', 'table', 'ul']);
/* Tancaments implícits: l'element que s'obri tanca l'obert d'eixa llista,
   sense passar dels que la limiten. */
const IMPLICITS = Object.freeze({
  a: [['a'], []],
  li: [['li'], ['ul', 'ol', 'menu']],
  dt: [['dt', 'dd'], ['dl']],
  dd: [['dt', 'dd'], ['dl']],
  tr: [['tr', 'td', 'th'], ['table', 'thead', 'tbody', 'tfoot']],
  td: [['td', 'th'], ['tr', 'table']],
  th: [['td', 'th'], ['tr', 'table']],
  option: [['option'], ['select', 'datalist']]
});
const LIMIT_P = new Set(['button', 'table', 'td', 'th', 'li', 'blockquote', 'div']);

const localDe = (nom) => {
  const dos = nom.lastIndexOf(':');
  return (dos >= 0 ? nom.slice(dos + 1) : nom).toLowerCase();
};

/* On acaba el text cru d'un <local>: el primer «</local» seguit d'espai, «/» o «>». */
function fiDeTextCru(text, i, local) {
  let j = text.indexOf('</', i);
  while (j !== -1) {
    const nom = text.slice(j + 2, j + 2 + local.length);
    const despres = text[j + 2 + local.length] || '>';
    if (nom.toLowerCase() === local && /[\s/>]/.test(despres)) {
      const fi = text.indexOf('>', j + 2);
      return { inici: j, fi: fi === -1 ? text.length : fi + 1 };
    }
    j = text.indexOf('</', j + 2);
  }
  return { inici: text.length, fi: text.length };
}

/**
 * Llig HTML tolerant (com el fa un navegador, simplificat) a un arbre.
 * Mai no llança.
 */
export function llegixHtml(text) {
  const arrel = { nom: '#arrel', local: '#arrel', atributs: new Map(), fills: [] };
  if (typeof text !== 'string' || text === '') return arrel;
  const font = text.length > LIMITS_HTML.caracters ? talla(text, LIMITS_HTML.caracters) : text;
  const pila = [arrel];
  let nodes = 0;
  let i = 0;
  const actual = () => pila[pila.length - 1];
  const afigText = (valor) => { if (valor) actual().fills.push(valor); };
  /* L'índex de l'element obert `noms` més proper, sense passar de `limits`; -1 si no n'hi ha. */
  const obert = (noms, limits) => {
    for (let k = pila.length - 1; k > 0; k -= 1) {
      if (noms.includes(pila[k].local)) return k;
      if (limits.includes(pila[k].local)) return -1;
    }
    return -1;
  };
  const tancaFins = (k) => { if (k > 0) pila.length = k; };

  while (i < font.length) {
    const lt = font.indexOf('<', i);
    if (lt === -1) { afigText(descodifica(font.slice(i))); break; }
    if (lt > i) afigText(descodifica(font.slice(i, lt)));
    i = lt;
    const seguent = font[i + 1] || '';
    if (font.startsWith('<!--', i)) {
      const fi = font.indexOf('-->', i + 4);
      i = fi === -1 ? font.length : fi + 3;
    } else if (seguent === '!' || seguent === '?') {
      const fi = font.indexOf('>', i + 2);
      i = fi === -1 ? font.length : fi + 1;
    } else if (seguent === '/' && /[A-Za-z]/.test(font[i + 2] || '')) {
      const local = localDe(llegixNom(font, i + 2));
      const fi = font.indexOf('>', i + 2);
      i = fi === -1 ? font.length : fi + 1;
      tancaFins(obert([local], []));
    } else if (/[A-Za-z]/.test(seguent)) {
      const nom = llegixNom(font, i + 1);
      const local = localDe(nom);
      const { atributs: crus, fi, buida } = llegixAtributs(font, i + 1 + nom.length, { normalitza: false });
      i = fi;
      nodes += 1;
      if (nodes > LIMITS_HTML.nodes) break;
      if (TANQUEN_P.has(local)) tancaFins(obert(['p'], [...LIMIT_P]));
      if (Object.hasOwn(IMPLICITS, local)) tancaFins(obert(...IMPLICITS[local]));
      const atributs = new Map([...crus].map(([clau, valor]) => [clau.toLowerCase(), valor]));
      const node = { nom: nom.toLowerCase(), local, atributs, fills: [] };
      const massaFondo = pila.length > LIMITS_HTML.profunditat;
      if (!massaFondo) actual().fills.push(node);
      if (TEXT_CRU.has(local)) {
        const cru = fiDeTextCru(font, i, local);
        if (!massaFondo) node.fills.push(font.slice(i, cru.inici));
        i = cru.fi;
      } else if (!massaFondo && !buida && !BUIDES.has(local)) {
        pila.push(node);
      }
    } else {
      afigText('<');
      i += 1;
    }
  }
  return arrel;
}

/* ── Llista blanca ─────────────────────────────────────────────────────── */

const SALT = Object.freeze({ salt: true });

/* Només en línia: un bloc de dins es desfà en el seu text, entre espais. */
function enLinia(items) {
  const eixida = [];
  for (const item of items) {
    if (typeof item === 'string') eixida.push(item);
    else if (item === SALT || item.t === 'hr') eixida.push(' ');
    else if (EN_LINIA_T.has(item.t)) eixida.push(item);
    else eixida.push(' ', ...enLinia(item.c || []), ' ');
  }
  return eixida;
}

/* Els elements solts es fan paràgrafs; els salts tallen paràgrafs. */
function blocs(items) {
  const eixida = [];
  let paragraf = [];
  const buida = () => {
    if (paragraf.length) eixida.push({ t: 'p', c: paragraf });
    paragraf = [];
  };
  for (const item of items) {
    if (item === SALT) buida();
    else if (typeof item === 'string' || EN_LINIA_T.has(item.t)) paragraf.push(item);
    else {
      buida();
      eixida.push(item);
    }
  }
  buida();
  return eixida;
}

/* Dins d'un <li>: el text en línia i les llistes niades. */
function contingutDeLi(items) {
  return items.flatMap((item) => (item && (item.t === 'ul' || item.t === 'ol') ? [item] : enLinia([item])));
}

/* Els fills d'una llista: <li>; el que va solt, en un <li> nou. */
function elementsDeLlista(items) {
  const eixida = [];
  let solt = [];
  const buida = () => {
    if (solt.length) eixida.push({ t: 'li', c: contingutDeLi(solt) });
    solt = [];
  };
  for (const item of items) {
    if (item && item.t === 'li') {
      buida();
      eixida.push(item);
    } else if (item === SALT) buida();
    else solt.push(item);
  }
  buida();
  return eixida;
}

const esNode = (node) => Boolean(node) && typeof node === 'object' && node.atributs instanceof Map && Array.isArray(node.fills);
/* Els nodes de l'xhtml d'Atom (xml.js) porten el nom com s'escriu. */
const localNet = (node) => String(node.local).toLowerCase();

/* L'adreça d'una <img>, per a triar la imatge de la targeta (no es pinta mai). */
function recullImatge(node, ctx) {
  const src = urlAbsoluta(node.atributs.get('src') ?? '', ctx.base, PROTOCOLS_WEB);
  if (src) ctx.imatges.push(src);
}

/* Les <img> de dins d'un <picture> (el patró de WordPress: <source> i una
   <img> de reserva). El <picture> ja s'ha comptat; ací només es recullen. */
function recullDePicture(node, ctx, nivell) {
  if (nivell > LIMITS_HTML.profunditat) return;
  for (const fill of node.fills) {
    if (!esNode(fill)) continue;
    ctx.nodes += 1;
    if (ctx.nodes > LIMITS_HTML.nodes) return;
    if (localNet(fill) === 'img') recullImatge(fill, ctx);
    else recullDePicture(fill, ctx, nivell + 1);
  }
}

function saneja(node, ctx, nivell) {
  if (typeof node === 'string') return [node];
  ctx.nodes += 1;
  if (ctx.nodes > LIMITS_HTML.nodes || !esNode(node)) return [];
  const t = localNet(node);
  if (t === 'img') recullImatge(node, ctx);
  if (DESCARTATS.has(t)) {
    if (MITJANS.has(t)) ctx.omesos += 1;
    if (t === 'picture') recullDePicture(node, ctx, nivell + 1);
    return [];
  }
  const fills = () => node.fills.flatMap((fill) => saneja(fill, ctx, nivell + 1));
  if (nivell > LIMITS_HTML.profunditat) return fills().filter((item) => typeof item === 'string');
  if (t === 'br' || t === 'hr') return [{ t }];
  if (t === 'p') return [SALT, ...fills(), SALT];
  const encapcalament = ENCAPCALAMENT.exec(t);
  if (encapcalament) return [{ t: `h${Math.min(6, Number(encapcalament[1]) + ctx.desplacament)}`, c: enLinia(fills()) }];
  if (t === 'ul' || t === 'ol' || t === 'dir' || t === 'menu') return [{ t: t === 'ol' ? 'ol' : 'ul', c: elementsDeLlista(fills()) }];
  if (t === 'li') return [{ t: 'li', c: contingutDeLi(fills()) }];
  if (t === 'blockquote') return [{ t: 'blockquote', c: blocs(fills()) }];
  if (t === 'pre') return [{ t: 'pre', c: enLinia(fills()) }];
  if (t === 'a') {
    /* Un enllaç dins d'un altre es desembolica (HTML no els niua). */
    const href = ctx.dinsEnllac ? null : urlAbsoluta(node.atributs.get('href') ?? '', ctx.base, PROTOCOLS_ENLLAC);
    if (!href) return fills();
    ctx.dinsEnllac = true;
    const dins = enLinia(fills());
    ctx.dinsEnllac = false;
    return [{ t: 'a', href, c: dins }];
  }
  if (Object.hasOwn(EN_LINIA, t)) return [{ t: EN_LINIA[t], c: enLinia(fills()) }];
  if (CONTENIDORS.has(t)) return [SALT, ...fills(), SALT];
  if (t === 'td' || t === 'th') return [...fills(), ' '];
  return fills();
}

/* ── Poliment: espais, buits i límit de text ────────────────────────────── */

function teText(node) {
  if (typeof node === 'string') return node.trim() !== '';
  if (node.t === 'hr') return true;
  return (node.c || []).some(teText);
}

function polix(nodes, ctx, dinsPre) {
  const eixida = [];
  for (const node of nodes) {
    if (typeof node === 'string') {
      let text = dinsPre ? netejaText(node) : netejaText(node).replace(/\s+/g, ' ');
      if (ctx.text >= LIMITS_HTML.text) continue;
      text = talla(text, LIMITS_HTML.text - ctx.text);
      ctx.text += text.length;
      if (text === '') continue;
      if (typeof eixida[eixida.length - 1] === 'string') eixida[eixida.length - 1] += text;
      else eixida.push(text);
    } else if (node.t === 'br' || node.t === 'hr') {
      eixida.push({ t: node.t });
    } else {
      const c = polix(node.c || [], ctx, dinsPre || node.t === 'pre');
      const net = node.t === 'a' ? { t: 'a', href: node.href, c } : { t: node.t, c };
      if (EN_LINIA_T.has(node.t) ? teText(net) : true) eixida.push(net);
    }
  }
  return eixida;
}

const esBuit = (item) => (typeof item === 'string' ? item.trim() === '' : item?.t === 'br');

/* Un bloc sense espais ni salts a les vores; fora si queda buit. Les
   llistes i les cites només contenen blocs (el text solt ja és un <li> o un
   <p>): el que hi quede de text entre blocs és espai i cau. */
function retalla(bloc) {
  if (!bloc || typeof bloc === 'string') return null;
  if (bloc.t === 'hr') return bloc;
  if (bloc.t === 'pre') return teText(bloc) ? bloc : null;
  let c;
  if (bloc.t === 'ul' || bloc.t === 'ol' || bloc.t === 'blockquote') {
    c = bloc.c.map(retalla).filter(Boolean);
  } else {
    c = bloc.c.map((fill) => (fill && (fill.t === 'ul' || fill.t === 'ol') ? retalla(fill) : fill)).filter(Boolean);
    while (c.length && esBuit(c[0])) c.shift();
    while (c.length && esBuit(c[c.length - 1])) c.pop();
    if (typeof c[0] === 'string') c[0] = c[0].replace(/^\s+/, '');
    if (typeof c[c.length - 1] === 'string') c[c.length - 1] = c[c.length - 1].replace(/\s+$/, '');
  }
  const net = { t: bloc.t, c };
  return teText(net) ? net : null;
}

/**
 * L'arbre net d'un HTML (text) o d'uns nodes ja llegits (l'xhtml d'Atom).
 * `base`: l'adreça contra la qual es resolen els enllaços relatius.
 * @returns {{ arbre: object[], omesos: number, imatges: string[] }}
 */
export function arbreSegur(entrada, { base = null } = {}) {
  const nodes = typeof entrada === 'string' ? llegixHtml(entrada).fills : (Array.isArray(entrada) ? entrada : []);
  const minim = nivellMinim(nodes);
  const desplacament = minim < PRIMER_NIVELL ? PRIMER_NIVELL - minim : 0;
  const ctx = { base, omesos: 0, imatges: [], nodes: 0, dinsEnllac: false, text: 0, desplacament };
  const crus = blocs(nodes.flatMap((node) => saneja(node, ctx, 0)));
  const arbre = polix(crus, ctx, false).map(retalla).filter(Boolean);
  return { arbre, omesos: ctx.omesos, imatges: ctx.imatges };
}

/** Un text pla (Atom type="text") com a paràgrafs, separats per línies en blanc. */
export function arbreDeText(text) {
  return netejaText(String(text ?? '')).split(/\n\s*\n/).map(plega).filter(Boolean).map((paragraf) => ({ t: 'p', c: [paragraf] }));
}

const escapa = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(node) {
  if (typeof node === 'string') return escapa(node);
  if (!node || !PERMESES.has(node.t)) return (node?.c || []).map(html).join('');
  if (node.t === 'br' || node.t === 'hr') return `<${node.t}>`;
  const dins = (node.c || []).map(html).join('');
  if (node.t === 'a') {
    const href = urlAbsoluta(node.href ?? '', null, PROTOCOLS_ENLLAC);
    return href ? `<a href="${escapa(href)}" rel="noopener noreferrer" target="_blank">${dins}</a>` : dins;
  }
  return `<${node.t}>${dins}</${node.t}>`;
}

/** L'arbre net escrit en HTML (només etiquetes de la llista blanca). */
export function htmlDeArbre(arbre) {
  return (Array.isArray(arbre) ? arbre : []).map(html).join('');
}

function text(node) {
  if (typeof node === 'string') return node;
  if (!node) return '';
  if (node.t === 'br') return '\n';
  if (node.t === 'hr') return '';
  return (node.c || []).map(text).join('');
}

/** El text pla d'un arbre net: un bloc per línia. */
export function textDeArbre(arbre) {
  return (Array.isArray(arbre) ? arbre : []).map((bloc) => {
    if (bloc?.t === 'ul' || bloc?.t === 'ol' || bloc?.t === 'blockquote') return (bloc.c || []).map(text).join('\n');
    return text(bloc);
  }).filter((linia) => linia.trim() !== '').join('\n');
}

/** Tot alhora: l'HTML net, el seu text, els mitjans omesos i les imatges trobades. */
export function sanejaHtml(entrada, opcions = {}) {
  const { arbre, omesos, imatges } = arbreSegur(entrada, opcions);
  return { arbre, html: htmlDeArbre(arbre), text: textDeArbre(arbre), omesos, imatges };
}
