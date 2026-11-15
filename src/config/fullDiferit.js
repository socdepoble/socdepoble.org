/* Onada R28 · D-R27-1, opció (b) aprovada pel Mestre (pla 261115_0135 §1) · Fulls CSS diferits.
   Algunes peces només es munten en trossos diferits (el selector d'opcions del Farcellet i del catàleg,
   els espècimens de /disseny). El seu CSS no viatja a l'arrencada (index.css?inline del paquet de
   WordPress): ix d'un full propi de src/css (diferit-*.css, embolcallat en @layer components) i s'adopta
   a l'arrel on es munta la peça, el document o el shadow root de <soc-de-poble>, amb la mateixa regla
   d'aplicaEstil.js i de MapaFotografic.jsx:
   · un CSSStyleSheet amb replaceSync afegit darrere dels adoptedStyleSheets existents;
   · com a recurs (Safari 16.0-16.3 i Firefox 100 del baseline 2022, jsdom o un amfitrió que trenca
     adoptedStyleSheets), un <style data-sdp-full-diferit="clau"> al final del shadow root o del <head>.
   Idempotent: una sola adopció per arrel i clau, i el full no es retira en desmuntar-se (el mateix
   contingut, cap fuita). La capa components ja la registra la cascada principal, així que les regles
   s'afigen a la mateixa capa i les utilitats continuen guanyant.
   Onada R28 · Revisió adversarial (css-diferit-02 i 03):
   · el full només compta com a adoptat si, després d'assignar-lo, l'arrel el té de veres a
     adoptedStyleSheets (la comprovació de PedraSecaEmbed.jsx per al full principal); un amfitrió que no
     llança però tampoc no el desa va al <style> de recurs;
   · si el text del CSS canvia per a la mateixa arrel i clau (en desenvolupament, l'HMR de Vite torna a
     executar l'adoptant amb el .css?inline editat), es reescriu el mateix full (replaceSync) o el mateix
     <style> (textContent), com fa aplicaEstil.js. En producció el text no canvia mai. */
import { useLayoutEffect } from 'react';

const ADOPTATS = new WeakMap();   // contenidor → Map(clau → { full, node, css })

const contenidorDe = (element) => (typeof element?.getRootNode === 'function' ? element.getRootNode() : null)
  || element?.ownerDocument || document;

const potAdoptar = (contenidor) => typeof CSSStyleSheet === 'function'
  && typeof CSSStyleSheet.prototype.replaceSync === 'function'
  && Boolean(contenidor) && 'adoptedStyleSheets' in contenidor;

/* Onada R28 · css-diferit-03 · Torna el full si l'arrel l'ha adoptat de veres; si no, null (recurs). */
function adoptaAmbFull(contenidor, css) {
  if (!potAdoptar(contenidor)) return null;
  try {
    const full = new CSSStyleSheet();
    full.replaceSync(css);
    contenidor.adoptedStyleSheets = [...Array.from(contenidor.adoptedStyleSheets), full];
    return Array.from(contenidor.adoptedStyleSheets).includes(full) ? full : null;
  } catch {
    return null;   // un amfitrió que trenca adoptedStyleSheets: el <style> de recurs
  }
}

/* Onada R28 · El <style data-sdp-full-diferit="clau"> al final del shadow root o del <head>. Si ja hi era
   (una instància anterior d'este mòdul), no se'n crea cap altre: es reaprofita amb el text d'ara. */
function nodeDeRecurs(element, contenidor, clau, css) {
  const doc = element.ownerDocument || document;
  const esOmbra = contenidor.nodeType === 11 && typeof contenidor.appendChild === 'function';
  const desti = esOmbra ? contenidor : (doc.head || doc.documentElement);
  const existent = desti.querySelector?.(`style[data-sdp-full-diferit="${clau}"]`);
  if (existent) {
    if (existent.textContent !== css) existent.textContent = css;
    return existent;
  }
  const node = doc.createElement('style');
  node.setAttribute('data-sdp-full-diferit', clau);
  node.textContent = css;
  desti.appendChild(node);
  return node;
}

/* Onada R28 · css-diferit-02 · El mateix full o el mateix <style>, amb el text nou. Si replaceSync
   fallara, el full conserva les regles d'abans i no es torna a provar amb el mateix text. */
function actualitza(adopcio, css) {
  adopcio.css = css;
  try {
    if (adopcio.full) adopcio.full.replaceSync(css);
    else if (adopcio.node) adopcio.node.textContent = css;
  } catch { /* les regles d'abans continuen aplicades */ }
}

/** Adopta `css` amb la clau `clau` a l'arrel de `element`. Torna true si l'ha afegit ara; si ja hi era,
 *  n'actualitza el text quan ha canviat i torna false. */
export function adoptaFullDiferit(element, clau, css) {
  if (!element || !clau || typeof css !== 'string' || !css) return false;
  const contenidor = contenidorDe(element);
  if (!ADOPTATS.has(contenidor)) ADOPTATS.set(contenidor, new Map());
  const claus = ADOPTATS.get(contenidor);
  const previ = claus.get(clau);
  if (previ) {
    if (previ.css !== css) actualitza(previ, css);
    return false;
  }
  const full = adoptaAmbFull(contenidor, css);
  const node = full ? null : nodeDeRecurs(element, contenidor, clau, css);
  claus.set(clau, { full, node, css });
  return true;
}

/** Hook: adopta el full abans del primer pintat de la peça (sense salt visual). S'executa després de cada
 *  render, i no només en muntar-se: una peça que torna null (la barra de veu tancada) i es pinta més tard
 *  també rep el full. És barat: després de la primera adopció, només una consulta al WeakMap i una
 *  comparació del text. */
export function useFullDiferit(ref, clau, css) {
  useLayoutEffect(() => {
    if (ref?.current) adoptaFullDiferit(ref.current, clau, css);
  });
}
