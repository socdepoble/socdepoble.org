/**
 * enganxatCamps.js — P0-58 (IDEA-189) · El que s'enganxa o es deixa anar al
 * títol (h1), al subtítol (h2) i a l'entradilla (.lead) entra com a TEXT PLA
 * d'una línia, amb el nostre estil: sense <code>, <span>, <font>, estils en
 * línia ni salts trencats, i sense cap <img> (una foto amb el GPS de casa no
 * entra per la porta lateral dels camps).
 *
 * Pur pel que fa a React: només DOM. Cap assignació d'innerHTML (porta
 * tractor-innerhtml): l'HTML del porta-retalls es llig en un document de
 * DOMParser, que és inert (no s'hi executa ni s'hi carrega res), i al camp
 * només s'hi inserix un node de text.
 *
 * Baseline Safari 16 / Chrome 100 / Firefox 100: cap lookbehind, cap flag
 * «v», cap contenteditable de només text (Firefox 136+). execCommand està desaprovat però
 * existix als tres; caretRangeFromPoint (Safari i Chrome) i
 * caretPositionFromPoint (Firefox), també.
 */
import { semblaMarkdown, textPlaDeMarkdown } from './richText/markdownEnganxat.js';

/* Salts de totes les plataformes (també els separadors de línia i de
   paràgraf d'Unicode), l'espai dur i els controls que no són text: els C0
   (fora del tabulador i del salt), el DEL i els de direcció del text
   (U+202A–202E i U+2066–2069), que poden capgirar el que es veu. */
const SALTS = /\r\n?|[\u2028\u2029]/g;
const ESPAI_DUR = /\u00A0/g;
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

/**
 * El text amb els salts d'una sola mena (\n), l'espai dur com a espai i sense
 * controls. No col·lapsa res més: les línies es conserven.
 * @param {unknown} text
 * @returns {string}
 */
export function normalitzaText(text) {
  return String(text ?? '').replace(SALTS, '\n').replace(ESPAI_DUR, ' ').replace(CONTROLS, '');
}

/**
 * Una sola línia: qualsevol tira d'espais (salts, tabuladors, espais durs)
 * és un espai, i sense espais a les vores.
 * @param {unknown} text
 * @returns {string}
 */
export function unaLinia(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

/* El que no és text de la pàgina: no se'n llig res. */
const BOTATS = new Set(['head', 'script', 'style', 'template', 'noscript', 'title', 'iframe', 'object', 'embed', 'svg', 'math', 'img', 'picture', 'video', 'audio', 'canvas']);
/* Els blocs: cadascun en la seua línia. */
const BLOCS = new Set([
  'address', 'article', 'aside', 'blockquote', 'dd', 'details', 'div', 'dl', 'dt', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'summary',
  'table', 'tbody', 'thead', 'tfoot', 'tr', 'ul', 'caption',
]);
/* Les cel·les d'una fila, separades per un espai. */
const CELES = new Set(['td', 'th']);
const ESPAIS_HTML = /[ \t\n\r\f]+/g;

/* El text d'un document de DOMParser (inert), recorregut a mà: els blocs fan
   salts, un <br> també, i fora d'un <pre> els espais del codi font es
   col·lapsen com els pinta el navegador. */
function textDeDocument(doc) {
  const trossos = [];
  const recorre = (node, dinsDePre) => {
    if (node.nodeType === 3) {
      trossos.push(dinsDePre ? node.data : node.data.replace(ESPAIS_HTML, ' '));
      return;
    }
    if (node.nodeType !== 1) return;
    const nom = node.localName;
    if (BOTATS.has(nom)) return;
    if (nom === 'br') {
      trossos.push('\n');
      return;
    }
    const bloc = BLOCS.has(nom);
    if (bloc) trossos.push('\n');
    if (CELES.has(nom)) trossos.push(' ');
    for (const fill of node.childNodes) recorre(fill, dinsDePre || nom === 'pre');
    if (bloc) trossos.push('\n');
  };
  if (doc.body) recorre(doc.body, false);
  return trossos.join('')
    .split('\n')
    .map((linia) => linia.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function textDeHtml(html) {
  if (typeof DOMParser === 'undefined' || typeof html !== 'string' || !html.trim()) return '';
  try {
    return textDeDocument(new DOMParser().parseFromString(html, 'text/html'));
  } catch {
    return '';
  }
}

/**
 * El text pla d'un porta-retalls ({ html, text }, el que porten text/html i
 * text/plain), amb les seues línies:
 *  · preferix text/plain, que és la representació plana de la mateixa app;
 *    si té forma de Markdown (el botó de copiar de ChatGPT), sense les marques
 *    (textPlaDeMarkdown). C-02: amb HTML al costat, el text/plain d'UNA sola
 *    línia és el text visible de la font i es queda tal qual (cap marca
 *    llevada a una línia que el navegador hauria posat sencera);
 *  · si només hi ha HTML, el text visible: sense <style>, <script>,
 *    <template>, <head> ni imatges, i cada bloc en una línia;
 *  · sempre normalitzat (normalitzaText).
 * @param {{ html?: string, text?: string }} [porta]
 * @returns {string}
 */
export function textPlaDelPortaretalls({ html = '', text = '' } = {}) {
  const pla = typeof text === 'string' ? normalitzaText(text) : '';
  if (pla.trim()) {
    const ambHtml = typeof html === 'string' && html.trim() !== '';
    const diversesLinies = pla.split('\n').filter((linia) => linia.trim()).length >= 2;
    return semblaMarkdown(pla) && (!ambHtml || diversesLinies) ? textPlaDeMarkdown(pla) : pla;
  }
  return normalitzaText(textDeHtml(html));
}

const dinsDe = (camp, rang) => Boolean(rang) && camp.contains(rang.startContainer) && camp.contains(rang.endContainer);

/* El rang del punt on s'ha deixat anar, si cau dins del camp. */
function rangDelPunt(document_, camp, punt) {
  if (!punt || !Number.isFinite(punt.x) || !Number.isFinite(punt.y)) return null;
  try {
    if (typeof document_.caretRangeFromPoint === 'function') {
      const rang = document_.caretRangeFromPoint(punt.x, punt.y);
      if (dinsDe(camp, rang)) return rang;
    }
    if (typeof document_.caretPositionFromPoint === 'function') {
      const posicio = document_.caretPositionFromPoint(punt.x, punt.y);
      if (posicio?.offsetNode && camp.contains(posicio.offsetNode)) {
        const rang = document_.createRange();
        rang.setStart(posicio.offsetNode, posicio.offset);
        rang.collapse(true);
        return rang;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/* El rang al final del camp. */
function rangAlFinal(document_, camp) {
  const rang = document_.createRange();
  rang.selectNodeContents(camp);
  rang.collapse(false);
  return rang;
}

/**
 * Inserix `text` (un node de text, mai HTML) al cursor del camp: on hi ha la
 * selecció si és dins del camp, al punt `{ x, y }` si s'ha deixat anar, o al
 * final. Torna:
 *  · 'natiu': l'ha escrit el navegador (execCommand('insertText')), que
 *    conserva el desfer natiu (Cmd/Ctrl+Z) i dispara `input`: el onInput de
 *    sempre fa la resta (el valor, els comptadors i l'autodesament);
 *  · 'manual': sense execCommand (o si el navegador no l'ha fet), s'ha
 *    inserit amb un Range i el cursor va darrere. No hi ha cap `input`: qui
 *    crida ha d'avisar el canvi (una sola vegada) i el desfer natiu no el veu;
 *  · null: no hi ha res a inserir o on inserir-ho.
 * @param {HTMLElement} camp
 * @param {string} text
 * @param {{ x: number, y: number }|null} [punt]
 * @returns {'natiu'|'manual'|null}
 */
export function inserixTextAlCursor(camp, text, punt = null) {
  if (!camp || typeof text !== 'string' || !text) return null;
  const document_ = camp.ownerDocument;
  const seleccio = document_?.defaultView?.getSelection?.() ?? document_?.getSelection?.() ?? null;
  if (!seleccio) return null;
  /* El lloc es decidix ABANS d'enfocar: enfocar un contenteditable que no
     tenia el focus pot portar el cursor a l'inici (deixar anar sobre un camp
     que no s'estava editant). */
  const actual = seleccio.rangeCount ? seleccio.getRangeAt(0).cloneRange() : null;
  const rang = rangDelPunt(document_, camp, punt) || (dinsDe(camp, actual) ? actual : null) || rangAlFinal(document_, camp);
  if (document_.activeElement !== camp && typeof camp.focus === 'function') {
    try {
      camp.focus({ preventScroll: true });
    } catch { /* sense focus: s'inserix igualment al rang */ }
  }
  seleccio.removeAllRanges();
  seleccio.addRange(rang);

  if (typeof document_.execCommand === 'function') {
    let fet = false;
    try {
      fet = document_.execCommand('insertText', false, text) === true;
    } catch {
      fet = false;
    }
    if (fet) return 'natiu';
  }

  const viu = seleccio.rangeCount && dinsDe(camp, seleccio.getRangeAt(0)) ? seleccio.getRangeAt(0) : rang;
  viu.deleteContents();
  const node = document_.createTextNode(text);
  viu.insertNode(node);
  viu.setStartAfter(node);
  viu.collapse(true);
  seleccio.removeAllRanges();
  seleccio.addRange(viu);
  return 'manual';
}
