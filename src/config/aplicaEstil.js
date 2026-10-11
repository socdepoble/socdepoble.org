/* Onada 11 (261010; prompt 261010_1730, tasca 2) · Aplicar l'estil del poble
   (estil.js) a una arrel .sdp-root, i desfer-ho.
   · UN full per arrel: un CSSStyleSheet amb replaceSync, afegit darrere dels
     existents a adoptedStyleSheets del node arrel (el document o el shadow
     root de l'encastat), o, com a recurs (Safari 16.0-16.3 del baseline 2022,
     jsdom), un <style data-sdp-estil> al final del shadow root o del <head>.
     Els dos van darrere de tokens.css i, a especificitat igual, guanyen.
   · El crom (crom.to) s'aplica amb crom.js (aplica/restaura) sobre la mateixa
     arrel: aplica() llig el cànon abans de la primera escriptura (BASES).
   · LLEI DEL PÍXEL: amb un payload sense res vàlid no s'afig cap full, cap
     <style> ni cap propietat en línia; un gir 0 no escriu res. llevaEstil ho
     desfà tot i oblida l'arrel. Entra al tros d'entrada: curt. */
import { aplica, restaura } from './crom.js';
import { cromValid, cssDePersonalitzacio } from './estil.js';

const ESTATS = new WeakMap();   // arrel → { full, node, crom }

const estatDe = (arrel) => {
  if (!ESTATS.has(arrel)) ESTATS.set(arrel, { full: null, node: null, crom: false });
  return ESTATS.get(arrel);
};

/* El document o el shadow root que conté l'arrel. */
const contenidorDe = (arrel) => (typeof arrel.getRootNode === 'function' ? arrel.getRootNode() : arrel.ownerDocument) || document;

const potAdoptar = (contenidor) => typeof CSSStyleSheet === 'function'
  && typeof CSSStyleSheet.prototype.replaceSync === 'function'
  && Boolean(contenidor) && 'adoptedStyleSheets' in contenidor;

function escriuFull(arrel, css) {
  const estat = estatDe(arrel);
  const contenidor = contenidorDe(arrel);
  if (potAdoptar(contenidor)) {
    try {
      if (!estat.full) estat.full = new CSSStyleSheet();
      estat.full.replaceSync(css);
      const actuals = Array.from(contenidor.adoptedStyleSheets);
      if (!actuals.includes(estat.full)) contenidor.adoptedStyleSheets = [...actuals, estat.full];
      return;
    } catch {
      estat.full = null;   // amfitrió que trenca adoptedStyleSheets → recurs
    }
  }
  if (!estat.node || !estat.node.isConnected) {
    const doc = arrel.ownerDocument || document;
    estat.node = doc.createElement('style');
    estat.node.setAttribute('data-sdp-estil', '');
    /* Shadow root (DOCUMENT_FRAGMENT_NODE): al final del shadow root; document: al final del <head>. */
    const esOmbra = contenidor.nodeType === 11 && typeof contenidor.appendChild === 'function';
    const desti = esOmbra ? contenidor : (doc.head || doc.documentElement);
    desti.appendChild(estat.node);
  }
  estat.node.textContent = css;
}

function llevaFull(arrel) {
  const estat = ESTATS.get(arrel);
  if (!estat) return;
  if (estat.full) {
    const contenidor = contenidorDe(arrel);
    try {
      if ('adoptedStyleSheets' in contenidor) {
        contenidor.adoptedStyleSheets = Array.from(contenidor.adoptedStyleSheets).filter((full) => full !== estat.full);
      }
    } catch { /* l'amfitrió ja no el té */ }
    estat.full = null;
  }
  if (estat.node) {
    estat.node.remove();
    estat.node = null;
  }
}

/** Aplica (o actualitza) l'estil del poble sobre l'arrel: el full i el crom. */
export function aplicaEstil(arrel, payload) {
  if (!arrel) return;
  const css = cssDePersonalitzacio(payload);
  if (css) escriuFull(arrel, css); else llevaFull(arrel);
  const estat = estatDe(arrel);
  const crom = payload?.crom ?? null;
  const to = cromValid(crom) && crom ? crom.to : 0;
  if (to !== 0) {
    aplica(arrel, to);
    estat.crom = true;
  } else if (estat.crom) {
    restaura(arrel);
    estat.crom = false;
  }
}

/** Desfà tot el que aplicaEstil ha escrit sobre l'arrel i l'oblida. */
export function llevaEstil(arrel) {
  if (!arrel) return;
  const estat = ESTATS.get(arrel);
  if (!estat) return;
  llevaFull(arrel);
  if (estat.crom) restaura(arrel);
  ESTATS.delete(arrel);
}

/** Cert si l'arrel té un estil del poble aplicat (proves i diagnòstic). */
export function teEstilAplicat(arrel) {
  const estat = arrel ? ESTATS.get(arrel) : null;
  return Boolean(estat && (estat.full || estat.node || estat.crom));
}
