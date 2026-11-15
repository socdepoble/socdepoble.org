/* Onada R28 · D-R27-1, opció (b) aprovada pel Mestre (pla 261115_0135 §1) · Fulls CSS diferits.
   Algunes peces només es munten en trossos diferits (el selector d'opcions del Farcellet i del catàleg,
   els espècimens de /disseny). El seu CSS no viatja a l'arrencada (index.css?inline del paquet de
   WordPress): ix d'un full propi de src/css (diferit-*.css, embolcallat en @layer components) i s'adopta
   a l'arrel on es munta la peça, el document o el shadow root de <soc-de-poble>, amb la mateixa regla
   d'aplicaEstil.js i de MapaFotografic.jsx:
   · un CSSStyleSheet amb replaceSync afegit darrere dels adoptedStyleSheets existents;
   · com a recurs (Safari 16.0-16.3 del baseline 2022, jsdom o un amfitrió que trenca
     adoptedStyleSheets), un <style data-sdp-full-diferit="clau"> al final del shadow root o del <head>.
   Idempotent: una sola adopció per arrel i clau, i el full no es retira en desmuntar-se (el mateix
   contingut, cap fuita). La capa components ja la registra la cascada principal, així que les regles
   s'afigen a la mateixa capa i les utilitats continuen guanyant. */
import { useLayoutEffect } from 'react';

const ADOPTATS = new WeakMap();   // contenidor → Set de claus ja adoptades

const contenidorDe = (element) => (typeof element?.getRootNode === 'function' ? element.getRootNode() : null)
  || element?.ownerDocument || document;

const potAdoptar = (contenidor) => typeof CSSStyleSheet === 'function'
  && typeof CSSStyleSheet.prototype.replaceSync === 'function'
  && Boolean(contenidor) && 'adoptedStyleSheets' in contenidor;

/** Adopta `css` amb la clau `clau` a l'arrel de `element`. Torna true si l'ha afegit ara. */
export function adoptaFullDiferit(element, clau, css) {
  if (!element || !clau || typeof css !== 'string' || !css) return false;
  const contenidor = contenidorDe(element);
  if (!ADOPTATS.has(contenidor)) ADOPTATS.set(contenidor, new Set());
  const claus = ADOPTATS.get(contenidor);
  if (claus.has(clau)) return false;
  if (potAdoptar(contenidor)) {
    try {
      const full = new CSSStyleSheet();
      full.replaceSync(css);
      contenidor.adoptedStyleSheets = [...Array.from(contenidor.adoptedStyleSheets), full];
      claus.add(clau);
      return true;
    } catch { /* un amfitrió que trenca adoptedStyleSheets: el <style> de recurs */ }
  }
  const doc = element.ownerDocument || document;
  const esOmbra = contenidor.nodeType === 11 && typeof contenidor.appendChild === 'function';
  const desti = esOmbra ? contenidor : (doc.head || doc.documentElement);
  if (!desti.querySelector?.(`style[data-sdp-full-diferit="${clau}"]`)) {
    const node = doc.createElement('style');
    node.setAttribute('data-sdp-full-diferit', clau);
    node.textContent = css;
    desti.appendChild(node);
  }
  claus.add(clau);
  return true;
}

/** Hook: adopta el full abans del primer pintat de la peça (sense salt visual). S'executa després de cada
 *  render, i no només en muntar-se: una peça que torna null (la barra de veu tancada) i es pinta més tard
 *  també rep el full. És barat: després de la primera adopció, només una consulta al WeakMap. */
export function useFullDiferit(ref, clau, css) {
  useLayoutEffect(() => {
    if (ref?.current) adoptaFullDiferit(ref.current, clau, css);
  });
}
