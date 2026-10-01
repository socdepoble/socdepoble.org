/**
 * blocsTraduibles.js — Els blocs de text d'una pàgina, per al Traductor
 * Sobirà (ordre del Mestre, 260930 · via B).
 *
 * Es traduïx TEXT, mai HTML (contracte D1 amb Codex, format 'text'): el
 * servidor compta 5000 caràcters per petició, marcatge inclòs, i cada text
 * es guarda a la seua memòria cau per separat. Per això es recullen els
 * blocs de lectura de l'article (títols, paràgrafs, elements de llista,
 * cites, cel·les…) com a parelles { etiqueta, text }, i la pàgina traduïda
 * es torna a pintar amb elements de React: cap cadena del servidor entra a
 * l'arbre com a HTML.
 *  · Només el bloc més extern: un <li> amb un <p> dins és un sol bloc.
 *  · Fora: controls (botons, camps), el que no es veu o només llig el lector
 *    (aria-hidden, hidden, sr-only, display:none, visibility:hidden) i tot el
 *    contingut editable (contenteditable buit, «true» o «plaintext-only»).
 *  · Un h1 del cos baixa a h2: l'h1 és del títol de la pàgina (Pedra Seca §4).
 *
 * Correcció final del torn 260930 (avís de Codex en plegar): el filtre
 * s'aplica també DINS de cada bloc. Abans el text es prenia amb
 * textContent, que arrossega tots els descendents, i un fill ocult, de
 * lector, un botó o un tros editable dins d'un paràgraf visible s'enviava a
 * traduir (i es gastava pressupost); l'ocultació per CSS no es mirava mai.
 * Ara un TreeWalker recorre els nodes de text del bloc i talla els
 * subarbres exclosos.
 *
 * L'arrel mateixa no compta: mentres es veu una traducció, l'article
 * original està amagat (hidden, o per CSS) i continua sent la font.
 */
const SELECTOR_BLOCS = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, caption, th, td, summary, legend';
const FORA = [
  'button', 'select', 'textarea', 'input', 'script', 'style', 'template', 'svg',
  '[aria-hidden="true"]', '[hidden]', '.sr-only', '.sdp-sr-only', '.sdp-nomes-lector',
  /* Tot el que és editable: l'atribut sense valor també ho és, i una illa
     contenteditable="false" dins d'un editor continua sent part de l'editor
     (closest() la troba pel pare). */
  '[contenteditable]:not([contenteditable="false"])'
].join(', ');
const TITOLS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
const INVISIBLE = new Set(['hidden', 'collapse']);

/* Un sostre de seguretat: una pàgina amb més blocs no és una pàgina de lectura. */
export const MAX_BLOCS = 400;

function etiquetaDe(element) {
  const etiqueta = element.tagName.toLowerCase();
  if (etiqueta === 'h1') return 'h2';
  if (TITOLS.has(etiqueta) || etiqueta === 'li' || etiqueta === 'blockquote') return etiqueta;
  return 'p';
}

/* L'estil calculat d'un element, o null fora d'un document amb finestra (cap
   estil que llegir: només manen els atributs i les classes de FORA). */
function estilDe(element) {
  const vista = element.ownerDocument?.defaultView;
  if (!vista?.getComputedStyle) return null;
  try { return vista.getComputedStyle(element); } catch { return null; }
}

/* display:none és de l'element mateix (no s'hereta): tot el seu subarbre
   desapareix. */
const senseDisplay = (element) => estilDe(element)?.display === 'none';

/* Fora per atribut, classe o display, sense comptar l'arrel. */
const exclos = (element, arrel) => element !== arrel && (element.matches(FORA) || senseDisplay(element));

/* Un avantpassat del bloc (entre el bloc i l'arrel, l'arrel no inclosa) el
   deixa fora. */
function dinsDeFora(element, arrel) {
  for (let node = element; node && node !== arrel; node = node.parentElement) {
    if (exclos(node, arrel)) return true;
  }
  return false;
}

/* La visibilitat s'hereta, però un fill `visibility: visible` dins d'un pare
   amagat es torna a vore. Es mira respecte de l'arrel: l'element que fixa el
   valor és el més proper (entre este i l'arrel) que canvia respecte del seu
   pare; si cap no canvia, el valor ve de l'arrel o de més amunt i no compta. */
function invisibleDinsDe(element, arrel) {
  for (let node = element; node && node !== arrel; node = node.parentElement) {
    const propi = estilDe(node)?.visibility;
    if (!propi) return false;
    const pare = node.parentElement;
    const delPare = pare && pare !== arrel ? estilDe(pare)?.visibility : null;
    if (pare === arrel || propi !== delPare) {
      /* Just davall de l'arrel, el valor només compta si el fixa este node
         (és diferent del de l'arrel). */
      if (pare === arrel && propi === estilDe(arrel)?.visibility) return false;
      return INVISIBLE.has(propi);
    }
  }
  return false;
}

/* El text visible d'un bloc: només els nodes de text que no cauen dins d'un
   subarbre exclòs ni són invisibles. Mateixa concatenació que textContent. */
function textVisible(bloc, arrel) {
  const document_ = bloc.ownerDocument;
  const Filtre = document_.defaultView?.NodeFilter || globalThis.NodeFilter;
  if (!document_?.createTreeWalker || !Filtre) return bloc.textContent || '';
  const caminant = document_.createTreeWalker(bloc, Filtre.SHOW_ELEMENT | Filtre.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === 1) return exclos(node, arrel) ? Filtre.FILTER_REJECT : Filtre.FILTER_SKIP;
      return invisibleDinsDe(node.parentElement, arrel) ? Filtre.FILTER_REJECT : Filtre.FILTER_ACCEPT;
    }
  });
  let text = '';
  for (let node = caminant.nextNode(); node; node = caminant.nextNode()) text += node.nodeValue;
  return text;
}

export function blocsTraduibles(arrel) {
  if (!arrel?.querySelectorAll) return [];
  const blocs = [];
  for (const element of arrel.querySelectorAll(SELECTOR_BLOCS)) {
    const pare = element.parentElement?.closest(SELECTOR_BLOCS);
    if (pare && arrel.contains(pare)) continue;
    /* Només compta el que és DINS de l'arrel: mentres es veu una traducció,
       l'article original està amagat i continua sent la font. */
    if (dinsDeFora(element, arrel)) continue;
    const text = textVisible(element, arrel).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    blocs.push({ etiqueta: etiquetaDe(element), text });
    if (blocs.length >= MAX_BLOCS) break;
  }
  return blocs;
}
