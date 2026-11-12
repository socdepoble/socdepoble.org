/**
 * Lector de notícies · un lector XML mínim i tolerant (nucli pur).
 *
 * Per què no DOMParser: no existix fora del navegador (el nucli es prova en
 * Node), cada motor recupera l'XML trencat a la seua manera i un feed que
 * DOMParser rebutja sencer per un sol «&» solt ací encara es llig. Un
 * lector propi és xicotet, determinista i es pot auditar línia a línia.
 *
 *   llegixXml(text) → { arrel, errors }
 *     node  { nom, local, ns, atributs: Map, fills: [node | text] }
 *     ns    l'espai de noms resolt, sense esquema («www.w3.org/2005/Atom»):
 *           http i https són el mateix espai per a un feed de veres
 *
 * Seguretat i robustesa:
 *   · el DOCTYPE se salta sencer: cap entitat del document (ni «billion
 *     laughs» ni entitats externes), només les d'entitats.js;
 *   · CDATA, comentaris i instruccions de procés;
 *   · un tancament que no casa amb res s'ignora; un que casa amb un
 *     avantpassat tanca el que hi ha pel mig; el que queda obert es tanca
 *     al final. Cada recuperació es diu a `errors`, i res no llança;
 *   · límits de mida, de profunditat i de nodes (LIMITS_XML).
 */
import { descodifica } from './entitats.js';

export const LIMITS_XML = Object.freeze({ caracters: 5 * 1024 * 1024, profunditat: 64, nodes: 100000 });

/** Els espais de noms dels feeds, sense esquema ni barra final. */
export const NS = Object.freeze({
  cap: '',
  atom: 'www.w3.org/2005/Atom',
  content: 'purl.org/rss/1.0/modules/content',
  media: 'search.yahoo.com/mrss',
  dc: 'purl.org/dc/elements/1.1',
  rss1: 'purl.org/rss/1.0',
  rdf: 'www.w3.org/1999/02/22-rdf-syntax-ns#',
  xhtml: 'www.w3.org/1999/xhtml',
  xml: 'www.w3.org/XML/1998/namespace'
});

/* Un feed que usa «media:» sense declarar-lo (passa) també és Media RSS. */
const CONVENCIONALS = Object.freeze({ atom: NS.atom, content: NS.content, media: NS.media, dc: NS.dc, rdf: NS.rdf, xml: NS.xml });

/** Un URI d'espai de noms sense esquema ni barra final. */
export function nsNet(uri) {
  const net = String(uri ?? '').trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  /* Gauntlet 261025_0545 (RX-M2) · Les barres finals, des del final cap arrere:
     /\/+$/ tornava a recórrer des de cada «/» una tira que no acaba el valor
     (quadràtic), i ho feia per a cada xmlns d'un feed remot, al fil principal. */
  let fi = net.length;
  while (fi > 0 && net[fi - 1] === '/') fi -= 1;
  return net.slice(0, fi);
}

const INICI_NOM = /[A-Za-z_:]/;
const FI_NOM = /[\s/>=]/;
const QNAME = /^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/;
const CARACTERS_NO_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/u;
const URI_XML = ['http', NS.xml].join('://');
const URI_XMLNS = ['http', 'www.w3.org/2000/xmlns/'].join('://');

function entitatsXmlValides(text) {
  if (CARACTERS_NO_XML.test(text)
    || /&(?!(?:amp|lt|gt|quot|apos|#\d{1,7}|#x[\da-fA-F]{1,6});)/u.test(text)) return false;
  for (const referencia of text.matchAll(/&#(?:x([\da-fA-F]{1,6})|(\d{1,7}));/gu)) {
    const punt = referencia[1] ? parseInt(referencia[1], 16) : Number(referencia[2]);
    if (![9, 10, 13].includes(punt) && !(punt >= 32 && punt <= 0xD7FF)
      && !(punt >= 0xE000 && punt <= 0xFFFD) && !(punt >= 0x10000 && punt <= 0x10FFFF)) return false;
  }
  return true;
}

/** El nom d'una etiqueta o d'un atribut a partir de `i` (també per a html.js). */
export function llegixNom(text, i) {
  let fi = i;
  while (fi < text.length && !FI_NOM.test(text[fi])) fi += 1;
  return text.slice(i, fi);
}

/* Fi d'una declaració <!…>: salta el subconjunt intern [ … ] del DOCTYPE i
   el que hi ha entre cometes. Mai no en llig cap entitat. */
function fiDeDeclaracio(text, i) {
  let profunditat = 0;
  let cometa = null;
  for (let j = i + 2; j < text.length; j += 1) {
    const c = text[j];
    if (cometa) {
      if (c === cometa) cometa = null;
    } else if (c === '"' || c === '\'') cometa = c;
    else if (c === '[') profunditat += 1;
    else if (c === ']') profunditat = Math.max(0, profunditat - 1);
    else if (c === '>' && profunditat === 0) return j + 1;
  }
  return text.length;
}

/**
 * Els atributs d'una etiqueta d'obertura a partir de `i` (just darrere del
 * nom). Torna { atributs, fi, buida }. Tolerant: valors sense cometes,
 * atributs sense valor i una etiqueta sense tancar fins al final. També el
 * fa servir html.js, amb `normalitza` false: HTML no canvia els salts dels
 * valors per espais (XML sí).
 */
export function llegixAtributs(text, i, { normalitza = true, errors } = {}) {
  const atributs = new Map();
  const esEspai = (caracter) => errors ? /^[ \t\r\n]$/.test(caracter) : /\s/.test(caracter);
  let j = i;
  while (j < text.length) {
    while (j < text.length && esEspai(text[j])) j += 1;
    if (j >= text.length) break;
    if (text[j] === '>') return { atributs, fi: j + 1, buida: false };
    if (text[j] === '/' && text[j + 1] === '>') return { atributs, fi: j + 2, buida: true };
    if (text[j] === '/' || text[j] === '=') { errors?.push('atribut no vàlid'); j += 1; continue; }
    const nom = llegixNom(text, j);
    if (!nom) { errors?.push('espai XML no vàlid'); j += 1; continue; }
    if (!QNAME.test(nom)) errors?.push('nom d’atribut no vàlid');
    j += nom.length;
    while (j < text.length && esEspai(text[j])) j += 1;
    let valor = '';
    if (text[j] === '=') {
      j += 1;
      while (j < text.length && esEspai(text[j])) j += 1;
      const cometa = text[j];
      if (cometa === '"' || cometa === '\'') {
        const fi = text.indexOf(cometa, j + 1);
        if (fi === -1) errors?.push('atribut sense tancar');
        valor = text.slice(j + 1, fi === -1 ? text.length : fi);
        j = fi === -1 ? text.length : fi + 1;
        if (j < text.length && !(esEspai(text[j]) || text[j] === '/' || text[j] === '>')) errors?.push('falta espai entre atributs');
      } else {
        errors?.push('valor d’atribut sense cometes');
        let fi = j;
        while (fi < text.length && !/[\s>]/.test(text[fi])) fi += 1;
        valor = text.slice(j, fi);
        j = fi;
      }
    } else errors?.push('atribut sense valor');
    if (errors && (valor.includes('<') || !entitatsXmlValides(valor))) errors.push('valor XML no vàlid');
    if (atributs.has(nom)) errors?.push('atribut repetit');
    if (nom && !atributs.has(nom)) atributs.set(nom, normalitza ? descodifica(valor).replace(/[\t\n\r]/g, ' ') : descodifica(valor));
  }
  errors?.push('etiqueta sense tancar');
  return { atributs, fi: text.length, buida: false };
}

/* L'àmbit d'espais de noms d'un element: el del pare i les seues xmlns. */
function ambitDe(pare, atributs, estricte = false) {
  let ambit = pare;
  for (const [nom, valor] of atributs) {
    if (nom !== 'xmlns' && !nom.startsWith('xmlns:')) continue;
    if (ambit === pare) ambit = new Map(pare);
    ambit.set(nom === 'xmlns' ? '' : nom.slice(6), estricte ? valor : nsNet(valor));
  }
  return ambit;
}

function nsDelNom(nom, ambit) {
  const dos = nom.indexOf(':');
  const prefix = dos > 0 ? nom.slice(0, dos) : '';
  if (ambit.has(prefix)) return ambit.get(prefix);
  return prefix && Object.hasOwn(CONVENCIONALS, prefix) ? CONVENCIONALS[prefix] : '';
}

/* El mode estricte no recupera prefixos ni confon dos atributs del mateix espai. */
function validaEspais(nom, atributs, ambit, errors) {
  const prefixDe = (clau) => clau.includes(':') ? clau.slice(0, clau.indexOf(':')) : '';
  const prefix = prefixDe(nom);
  if (!QNAME.test(nom) || prefix === 'xmlns' || (prefix && !ambit.get(prefix))) errors.push('prefix d’element no vàlid');
  const expandits = new Map();
  for (const [clau, valor] of atributs) {
    if (clau === 'xmlns' || clau.startsWith('xmlns:')) {
      const declarat = clau === 'xmlns' ? '' : clau.slice(6);
      if (declarat === 'xmlns' || valor === URI_XMLNS
        || (declarat === 'xml' ? valor !== URI_XML : valor === URI_XML)
        || (declarat && !valor)) errors.push('declaració d’espai no vàlida');
      continue;
    }
    const prefixAtribut = prefixDe(clau);
    if (!QNAME.test(clau) || (prefixAtribut && !ambit.get(prefixAtribut))) errors.push('prefix d’atribut no vàlid');
    const espai = prefixAtribut ? ambit.get(prefixAtribut) : '';
    const local = prefixAtribut ? clau.slice(prefixAtribut.length + 1) : clau;
    if (!expandits.has(espai)) expandits.set(espai, new Set());
    if (expandits.get(espai).has(local)) errors.push('atribut expandit repetit');
    expandits.get(espai).add(local);
  }
}

function validaInstruccio(text, inici, errors) {
  const nom = llegixNom(text, 0);
  const resta = text.slice(nom.length);
  if (!QNAME.test(nom) || (resta && !/^[ \t\r\n]/.test(resta))) errors.push('instrucció no vàlida');
  if (nom.toLowerCase() !== 'xml') return;
  if (nom !== 'xml' || inici !== 0 || text.includes('&')) errors.push('declaració XML no vàlida');
  const { atributs } = llegixAtributs(`${text}>`, nom.length, { errors });
  const claus = [...atributs.keys()].join(',');
  if (!['version', 'version,encoding', 'version,standalone', 'version,encoding,standalone'].includes(claus)
    || atributs.get('version') !== '1.0'
    || (atributs.has('encoding') && !/^[A-Za-z][A-Za-z0-9._-]*$/.test(atributs.get('encoding')))
    || (atributs.has('standalone') && !['yes', 'no'].includes(atributs.get('standalone')))) errors.push('declaració XML no vàlida');
}

/**
 * Llig un document XML. Mai no llança: un text que no és XML torna
 * { arrel: null, errors: [...] }.
 * @returns {{ arrel: object|null, errors: string[] }}
 */
export function llegixXml(text, { estricte = false } = {}) {
  const errors = [];
  if (typeof text !== 'string') return { arrel: null, errors: ['no és text'] };
  if (text.length > LIMITS_XML.caracters) return { arrel: null, errors: ['el feed és massa gran'] };
  const font = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  if (estricte && CARACTERS_NO_XML.test(font)) return { arrel: null, errors: ['caràcter XML no vàlid'] };
  const docXml = { nom: '#doc', local: '#doc', ns: '', atributs: new Map(), fills: [] };
  const pila = [{ node: docXml, ambit: new Map([['xml', estricte ? URI_XML : NS.xml]]) }];
  let nodes = 0;
  let saltats = 0;
  let i = 0;

  const afigText = (valor, cdata = false) => {
    if (estricte && (!entitatsXmlValides(cdata ? valor.replace(/&/g, '') : valor) || (!cdata && valor.includes(']]>')))) errors.push('text XML no vàlid');
    if (valor) pila[pila.length - 1].node.fills.push(cdata ? valor : descodifica(valor));
  };

  while (i < font.length) {
    const lt = font.indexOf('<', i);
    if (lt === -1) { afigText(font.slice(i)); break; }
    if (lt > i) afigText(font.slice(i, lt));
    i = lt;
    if (font.startsWith('<!--', i)) {
      const fi = font.indexOf('-->', i + 4);
      if (estricte && (fi === -1 || font.slice(i + 4, fi).includes('--') || font.slice(i + 4, fi).endsWith('-'))) errors.push('comentari no vàlid');
      i = fi === -1 ? font.length : fi + 3;
    } else if (font.startsWith('<![CDATA[', i)) {
      const fi = font.indexOf(']]>', i + 9);
      if (estricte && (fi === -1 || pila.length === 1)) errors.push('CDATA no vàlid');
      afigText(font.slice(i + 9, fi === -1 ? font.length : fi), true);
      i = fi === -1 ? font.length : fi + 3;
    } else if (font.startsWith('<?', i)) {
      const fi = font.indexOf('?>', i + 2);
      if (estricte) {
        if (fi === -1) errors.push('instrucció sense tancar');
        else validaInstruccio(font.slice(i + 2, fi), i, errors);
      }
      i = fi === -1 ? font.length : fi + 2;
    } else if (font.startsWith('<!', i)) {
      if (estricte) errors.push('declaració no admesa');
      i = fiDeDeclaracio(font, i);
    } else if (font[i + 1] === '/') {
      const nom = llegixNom(font, i + 2);
      const fi = font.indexOf('>', i + 2);
      if (estricte && (fi === -1 || !/^[ \t\r\n]*$/.test(font.slice(i + 2 + nom.length, fi)))) errors.push('tancament no vàlid');
      i = fi === -1 ? font.length : fi + 1;
      let k = pila.length - 1;
      while (k > 0 && pila[k].node.nom !== nom) k -= 1;
      if (k > 0) {
        if (k < pila.length - 1) errors.push(`«${nom}» tanca etiquetes obertes`);
        pila.length = k;
      } else if (saltats > 0) {
        saltats -= 1;
      } else {
        errors.push(`tancament sense obrir: «${nom}»`);
      }
    } else if (INICI_NOM.test(font[i + 1] || '')) {
      const nom = llegixNom(font, i + 1);
      if (estricte && !QNAME.test(nom)) errors.push('nom d’element no vàlid');
      const { atributs, fi, buida } = llegixAtributs(font, i + 1 + nom.length, { errors: estricte ? errors : undefined });
      i = fi;
      if (pila.length > LIMITS_XML.profunditat) {
        if (estricte) errors.push('massa profunditat');
        /* Massa fondo: l'element no es crea i el seu text va al pare. */
        if (!buida) saltats += 1;
        continue;
      }
      nodes += 1;
      if (nodes > LIMITS_XML.nodes) { errors.push('massa elements: la resta no es llig'); break; }
      const pare = pila[pila.length - 1];
      const ambit = ambitDe(pare.ambit, atributs, estricte);
      if (estricte) validaEspais(nom, atributs, ambit, errors);
      const dos = nom.indexOf(':');
      const node = { nom, local: dos > 0 ? nom.slice(dos + 1) : nom, ns: estricte ? nsNet(nsDelNom(nom, ambit)) : nsDelNom(nom, ambit), atributs, fills: [] };
      pare.node.fills.push(node);
      if (!buida) pila.push({ node, ambit });
    } else {
      if (estricte) errors.push('obertura no vàlida');
      afigText('<');
      i += 1;
    }
  }
  if (pila.length > 1) errors.push('etiquetes sense tancar al final');
  const arrel = docXml.fills.find((fill) => typeof fill !== 'string') || null;
  if (estricte && (docXml.fills.filter((fill) => typeof fill !== 'string').length !== 1
    || docXml.fills.some((fill) => typeof fill === 'string' && /[^ \t\r\n]/.test(fill)))) errors.push('arrel no vàlida');
  if (!arrel) errors.push('cap element arrel');
  return { arrel, errors };
}

const casaNs = (node, ns) => (Array.isArray(ns) ? ns.includes(node.ns) : node.ns === ns);

/** Els fills element d'un node amb eixe nom local i eixe espai (o un d'una llista). */
export function fillsDe(node, local, ns = NS.cap) {
  if (!node || !Array.isArray(node.fills)) return [];
  return node.fills.filter((fill) => typeof fill !== 'string' && fill.local === local && casaNs(fill, ns));
}

/** El primer fill element amb eixe nom local i eixe espai, o null. */
export function fillDe(node, local, ns = NS.cap) {
  return fillsDe(node, local, ns)[0] || null;
}

/** Tot el text d'un node i dels seus descendents, en ordre. */
export function textDe(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  return node.fills.map(textDe).join('');
}

/** El valor d'un atribut pel nom tal com s'escriu, o null. */
export function atributDe(node, nom) {
  return node?.atributs?.has(nom) ? node.atributs.get(nom) : null;
}
