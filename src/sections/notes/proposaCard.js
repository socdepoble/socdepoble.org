/**
 * proposaCard.js — «🎴 Proposa Card» del Bloc de Notes (IDEA-41, amb IDEA-29 i
 * P1-56 del Llibre Mestre). Decisió del Mestre (261028, Bloc H): determinista,
 * sense cap IA; el pas amb IA, més avant.
 *
 * De l'inici del cos d'una nota puja als camps de la targeta el que ja hi ha
 * escrit: el primer títol o la primera línia, a l'H1 (el títol); la línia curta
 * següent, a l'H2 (el subtítol); i el primer paràgraf, a l'entradilla. Només
 * omple els camps buits i lleva del cos exactament les línies que ha pujat: cap
 * paràgraf no hi queda dues voltes. Torna la diferència ({ camps, cos }) i
 * l'editor l'aplica d'una sola passada, que es desfà d'una sola passada
 * (DocumentEditor · proposaCard).
 *
 * Regles:
 *  · Una LÍNIA és un bloc de text del primer nivell (un paràgraf o un títol
 *    h1–h6) o, dins d'un paràgraf, cada tros entre salts de línia (<br>,
 *    Maj+Retorn). Un paràgraf buit es bota i es queda on és. El recorregut para
 *    en el primer bloc que no és text (una imatge, una llista, una cita, una
 *    targeta incrustada…): de més avall no es puja ni es toca res.
 *  · El títol, si és buit: la primera línia, si fa com a molt MAX_TITOL
 *    caràcters. També un títol del cos (<h2>…), en Markdown («# Títol») o en
 *    HTML escrit com a text (les etiquetes d'un títol enganxades com a
 *    lletres): se li lleva la marca.
 *  · El subtítol, si és buit i la nota té títol (o se n'acaba de proposar un):
 *    la línia següent, si fa com a molt MAX_SUBTITOL caràcters.
 *  · L'entradilla, si és buida: el paràgraf següent (o el que resta del
 *    paràgraf en curs), si no és cap títol i fa com a molt MAX_ENTRADILLA.
 *  · Una línia que no complix la regla del seu camp no es puja i passa al camp
 *    següent. Un camp ple es bota sense consumir cap línia; si és el títol i
 *    el cos el repetix a la primera línia, eixa línia es queda al cos i no es
 *    proposa com a subtítol.
 *  · El títol i el subtítol perden el punt final (TEXTOS_LLAVOR: «No es
 *    recomana posar punt final per a títols i subtítols»); l'entradilla, no.
 *  · Els camps reben text pla escapat: les marques (negreta, enllaç…) no hi
 *    pugen.
 *  · La llavor verge (llavorNota.js) no es proposa mai: no és text de ningú.
 *
 * Pur: sense React, sense disc i sense xarxa. El document de DOMParser és
 * inert: no s'hi executa ni s'hi carrega res (com llavorNota.js).
 */
import { esLlavorDeNota } from './llavorNota.js';

export const MAX_TITOL = 120;
export const MAX_SUBTITOL = 160;
export const MAX_ENTRADILLA = 500;
/* La previsió (el botó encés o apagat, a cada tecla) només llig el principi
   del cos: el que es pot pujar no passa de MAX_TITOL + MAX_SUBTITOL +
   MAX_ENTRADILLA caràcters de text, i un cos amb fotos en data: (seed i local)
   pot fer megabytes. L'últim bloc d'un principi tallat no compta: pot estar a
   mitges. Aplicar la proposta sempre llig el cos sencer. */
export const MIDA_PREVISIO = 16384;

export const MOTIUS = Object.freeze({
  /** Hi ha alguna línia que es pot pujar. */
  proposta: 'proposta',
  /** El títol, el subtítol i l'entradilla ja són plens. */
  complet: 'complet',
  /** El cos és la plantilla de format verge. */
  llavor: 'llavor',
  /** El cos no porta cap text. */
  buit: 'buit',
  /** Hi ha text, però cap línia de l'inici complix les regles. */
  res: 'res'
});

/* Les marques de dins d'una línia: el que no és cap d'estes (una imatge, un
   vídeo, una targeta…) fa del paràgraf un bloc que no és text. */
const EN_LINIA = new Set(['a', 'abbr', 'b', 'br', 'cite', 'code', 'del', 'em', 'i', 'kbd', 'mark', 'q', 's', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'u']);
const TITOL_HTML = /^h[1-6]$/;
const TITOL_MARKDOWN = /^#{1,6}\s+(.+?)(?:\s+#+)?$/;
const TITOL_EN_TEXT = /^<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>$/i;
const TANCA_BLOC = /<\/(?:p|h[1-6]|ul|ol|blockquote|pre|figure|div|table)\s*>\s*$/i;

/* Revisió adversarial 261028 · Dins d'un títol HTML escrit com a text, només
   cauen els trossos amb forma d'etiqueta («<em>», «</a>»): un «<» solt i el que
   el seguix són lletres de la persona i es queden. En temps lineal: cap tros
   no passa del «<» següent. */
const ETIQUETA_EN_TEXT = /<\/?[a-z][a-z0-9]*(?:\s[^<>]*)?\/?>/gi;

const net = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const escapa = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* Per a comparar dos textos: sense punt final i en minúscules. */
const perComparar = (text) => senseFinal(net(text)).toLocaleLowerCase('ca');

/** Cert si un camp (HTML) no porta cap text: '', null, «<br>» o només espais. */
export function campBuit(html) {
  return !net(String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' '));
}

/* Sense punt final: un sol punt, mai uns punts suspensius. */
function senseFinal(text) {
  return text.endsWith('.') && !text.endsWith('..') ? text.slice(0, -1).trimEnd() : text;
}

/* El text d'un node: un salt de línia de dins d'una marca, un espai. */
function textDe(node) {
  if (node.nodeType === 3) return node.data;
  if (node.nodeType !== 1) return '';
  if (node.localName === 'br') return ' ';
  return Array.from(node.childNodes, textDe).join('');
}

/* El text pla d'un camp (HTML escapat, com el desa el Bloc), amb les entitats desfetes. */
const textDelCamp = (html) => textDe(new DOMParser().parseFromString(String(html ?? ''), 'text/html').body);

/* Una línia del cos com a candidata: el text sense la marca de títol, i si ho és. */
function comLinia(text) {
  let m = TITOL_MARKDOWN.exec(text);
  if (m) return { text: net(m[1]), titol: true };
  m = TITOL_EN_TEXT.exec(text);
  if (m) return { text: net(m[2].replace(ETIQUETA_EN_TEXT, ' ')), titol: true };
  return { text, titol: false };
}

/* Cert si cap descendent no és una marca de línia. */
function nomesText(element) {
  for (const fill of element.querySelectorAll('*')) if (!EN_LINIA.has(fill.localName)) return false;
  return true;
}

/*
 * Les línies d'un bloc del primer nivell, o null si el bloc no és text (el
 * recorregut para). Un títol és una sola línia. Un paràgraf es parteix pels
 * seus <br> del primer nivell; `br` és el salt que tanca cada línia (null en
 * l'última). Les línies buides no hi són.
 */
function liniesDelBloc(bloc) {
  if (bloc.nodeType === 3) return /\S/.test(bloc.data) ? null : [];
  if (bloc.nodeType !== 1) return [];
  if (TITOL_HTML.test(bloc.localName)) {
    const text = net(textDe(bloc));
    return text ? [{ bloc, text, titol: true, br: null }] : [];
  }
  if (bloc.localName !== 'p' || !nomesText(bloc)) return null;
  const linies = [];
  let tros = '';
  for (const node of bloc.childNodes) {
    if (node.nodeType === 1 && node.localName === 'br') {
      if (net(tros)) linies.push({ bloc, ...comLinia(net(tros)), br: node });
      tros = '';
    } else {
      tros += textDe(node);
    }
  }
  if (net(tros)) linies.push({ bloc, ...comLinia(net(tros)), br: null });
  return linies;
}

/* Lleva d'un paràgraf el principi fins al salt `br` inclòs, i els salts i
   espais que hi queden davant; si no hi queda text, el paràgraf sencer. */
function llevaPrincipi(bloc, br) {
  while (bloc.firstChild && bloc.firstChild !== br) bloc.removeChild(bloc.firstChild);
  if (bloc.firstChild === br) bloc.removeChild(br);
  const sobrer = (n) => (n.nodeType === 1 && n.localName === 'br') || (n.nodeType === 3 && !/\S/.test(n.data));
  while (bloc.firstChild && sobrer(bloc.firstChild)) bloc.removeChild(bloc.firstChild);
  if (!net(textDe(bloc)) && !bloc.querySelector('*:not(br)')) bloc.remove();
}

const resultat = (motiu, cos) => Object.freeze({ motiu, camps: Object.freeze({}), mogudes: Object.freeze([]), cos });

/**
 * La proposta de targeta d'una nota. `contingut` = { title, subtitle, lead,
 * content } (HTML, com els desa el Bloc). Torna, immutable:
 *  · motiu: un de MOTIUS;
 *  · camps: { title?, subtitle?, lead? }, només els buits que s'omplin (HTML escapat);
 *  · mogudes: [{ camp, text }], el text pla de cada línia pujada, en ordre;
 *  · cos: el cos sense les línies pujades (el mateix si no n'hi ha cap; null
 *    amb `previsio`, que no el construïx).
 * Amb { previsio: true } només llig el principi del cos (MIDA_PREVISIO): per a
 * saber si el botó va encés, no per a aplicar-la.
 */
export function proposaCard(contingut, { previsio = false } = {}) {
  const font = contingut ?? {};
  const html = typeof font.content === 'string' ? font.content : '';
  const cosDeRetorn = previsio ? null : html;
  const buits = { title: campBuit(font.title), subtitle: campBuit(font.subtitle), lead: campBuit(font.lead) };
  if (!buits.title && !buits.subtitle && !buits.lead) return resultat(MOTIUS.complet, cosDeRetorn);
  if (esLlavorDeNota(html)) return resultat(MOTIUS.llavor, cosDeRetorn);
  if (!html.trim() || typeof DOMParser === 'undefined') return resultat(MOTIUS.buit, cosDeRetorn);

  /* La previsió d'un cos llarg: el principi, sense cap etiqueta a mitges (es
     talla davant de l'últim «<»); si no acaba en el tancament d'un bloc,
     l'últim bloc pot estar a mitges i no compta. */
  let llegit = html;
  let darrerAMitges = false;
  if (previsio && html.length > MIDA_PREVISIO) {
    const principi = html.slice(0, MIDA_PREVISIO);
    llegit = principi.slice(0, Math.max(0, principi.lastIndexOf('<')));
    darrerAMitges = !TANCA_BLOC.test(llegit);
  }
  const doc = new DOMParser().parseFromString(llegit, 'text/html');
  if (!net(doc.body.textContent)) return resultat(MOTIUS.buit, cosDeRetorn);
  const blocs = Array.from(doc.body.childNodes).filter((n) => n.nodeType === 1 || (n.nodeType === 3 && /\S/.test(n.data)));
  if (darrerAMitges) blocs.pop();

  const linies = [];
  for (const bloc of blocs) {
    const delBloc = liniesDelBloc(bloc);
    if (delBloc === null) break;
    linies.push(...delBloc);
  }

  const camps = {};
  const mogudes = [];
  const consumides = [];
  let i = 0;
  const puja = (camp, text, deLinies) => {
    camps[camp] = escapa(text);
    mogudes.push(Object.freeze({ camp, text }));
    consumides.push(...deLinies);
    i += deLinies.length;
  };

  /* Revisió adversarial 261028 · Un títol ple que el cos repetix a la primera
     línia: eixa línia és la del títol, no el subtítol. No es puja ni es lleva
     (el camp ja és ple) i la proposta seguix per la línia següent, si és d'un
     altre bloc; si és del mateix paràgraf, res: llevar-la deixaria el cos
     sense la línia repetida. */
  if (!buits.title && i < linies.length && perComparar(linies[i].text) === perComparar(textDelCamp(font.title))) {
    if (linies[i + 1]?.bloc === linies[i].bloc) return resultat(MOTIUS.res, cosDeRetorn);
    i += 1;
  }
  /* El títol i el subtítol han de dir alguna cosa sense el punt final: una
     línia de només «.» (o un títol buit escrit com a text) no es puja. */
  if (buits.title && i < linies.length && linies[i].text.length <= MAX_TITOL && senseFinal(linies[i].text)) {
    puja('title', senseFinal(linies[i].text), [linies[i]]);
  }
  const teTitol = !buits.title || 'title' in camps;
  if (buits.subtitle && teTitol && i < linies.length && linies[i].text.length <= MAX_SUBTITOL && senseFinal(linies[i].text)) {
    puja('subtitle', senseFinal(linies[i].text), [linies[i]]);
  }
  if (buits.lead && i < linies.length && !linies[i].titol) {
    // El paràgraf sencer (o el que en resta): les línies seguides del mateix bloc.
    const resta = [];
    for (let j = i; j < linies.length && linies[j].bloc === linies[i].bloc && !linies[j].titol; j++) resta.push(linies[j]);
    const text = net(resta.map((l) => l.text).join(' '));
    if (text.length <= MAX_ENTRADILLA) puja('lead', text, resta);
  }

  if (!mogudes.length) return resultat(MOTIUS.res, cosDeRetorn);
  let cos = null;
  if (!previsio) {
    // Per bloc, l'última línia pujada: sense salt darrere, el bloc sencer.
    const finsA = new Map();
    for (const l of consumides) finsA.set(l.bloc, l);
    for (const [bloc, ultima] of finsA) {
      if (ultima.br) llevaPrincipi(bloc, ultima.br);
      else bloc.remove();
    }
    cos = doc.body.innerHTML.trim();
  }
  return Object.freeze({ motiu: MOTIUS.proposta, camps: Object.freeze(camps), mogudes: Object.freeze(mogudes), cos });
}

/** Cert si la nota té alguna cosa a proposar (la previsió de proposaCard). */
export function hiHaPropostaDeCard(contingut) {
  return proposaCard(contingut, { previsio: true }).motiu === MOTIUS.proposta;
}
