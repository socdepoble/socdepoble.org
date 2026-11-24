/**
 * lectorPaginaVeu.js · IDEA-255 (Onada R23) · Motor d'extracció per blocs
 * indexats `[0..N-1]` per al Reproductor Flotant Universal de Veu.
 *
 * Cada encapçalament (`h1`, `h2..h6`), entradilla (`.lead`), paràgraf (`p`),
 * cita (`blockquote`) o punt editorial (`li`, `dt`, `dd`) es converteix en una
 * pista individual navegable que conserva:
 *   · `index`: posició exacta `[0..N-1]` (per a Pausa / Continua determinista)
 *   · `etiqueta`: tipus de bloc (`h1`..`h6`, `lead`, `p`, `blockquote`, `li`)
 *   · `esTitol`: si obri apartat (destacat al cercador ràpid)
 *   · `seccioTitol`: títol de l'apartat on es troba el paràgraf
 *   · `resumCurt`: text abreujat per al selector d'apartats
 *   · `text`: text net per a la síntesi de veu i per a «Copiar fragment»
 *   · `element`: node DOM real per al ressaltat suau (zero CLS) i el scroll
 */
import { SELECTOR_EXCLOS_VEU } from './deteccioLecturaVeu.js';

const SELECTOR_BLOC = 'h1, h2, h3, h4, h5, h6, p, blockquote, li, dt, dd, figcaption, tbody > tr, .sdp-alerta__text';
const ETIQUETES_TITOL = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function estilVisible(element, arrel) {
  const vista = element?.ownerDocument?.defaultView;
  if (!vista?.getComputedStyle) return true;
  for (let node = element; node && node !== arrel; node = node.parentElement) {
    try {
      const estil = vista.getComputedStyle(node);
      if (estil?.display === 'none' || estil?.visibility === 'hidden' || estil?.visibility === 'collapse') {
        return false;
      }
    } catch {
      return true;
    }
  }
  return true;
}

function dinsDExclos(element, arrel) {
  for (let node = element; node && node !== arrel; node = node.parentElement) {
    if (node.matches?.(SELECTOR_EXCLOS_VEU)) return true;
  }
  return !estilVisible(element, arrel);
}

function esSubllistaDinsDeLi(node, arrelBloc) {
  if (arrelBloc.tagName !== 'LI') return false;
  const llista = node.parentElement?.closest?.('ul, ol');
  return Boolean(llista && arrelBloc.contains(llista));
}

/**
 * Extrau el text llegible d'un bloc excloent icones decoratives, botons interns,
 * textos només de lector de pantalla o subllistes niuades (que tindran el seu
 * propi bloc `li` tot seguit).
 */
export function textNetDeBloc(arrelBloc) {
  if (!arrelBloc) return '';
  const doc = arrelBloc.ownerDocument;
  const filtreNode = globalThis.NodeFilter;
  if (!doc?.createTreeWalker || !filtreNode) {
    return String(arrelBloc.textContent || '').replace(/\s+/g, ' ').trim();
  }
  const trossos = [];
  const walker = doc.createTreeWalker(
    arrelBloc,
    filtreNode.SHOW_ELEMENT | filtreNode.SHOW_TEXT,
    {
      acceptNode(node) {
        if (node.nodeType === 1) {
          if (node !== arrelBloc && node.matches?.(SELECTOR_EXCLOS_VEU)) {
            return filtreNode.FILTER_REJECT;
          }
          if (node !== arrelBloc && (node.tagName === 'UL' || node.tagName === 'OL') && arrelBloc.tagName === 'LI') {
            return filtreNode.FILTER_REJECT;
          }
          if (node.classList?.contains('sp-card-price')) {
            return filtreNode.FILTER_REJECT;
          }
          return filtreNode.FILTER_SKIP;
        }
        if (esSubllistaDinsDeLi(node, arrelBloc)) return filtreNode.FILTER_REJECT;
        return filtreNode.FILTER_ACCEPT;
      },
    }
  );
  let actual = walker.nextNode();
  while (actual) {
    if (actual.nodeType === 3) {
      trossos.push(actual.nodeValue || '');
    }
    actual = walker.nextNode();
  }
  return trossos.join('').replace(/\s+/g, ' ').trim();
}

function resumDeText(text, max = 76) {
  const net = String(text || '').trim();
  if (net.length <= max) return net;
  return `${net.slice(0, max - 1).trimEnd()}…`;
}

function teFillDeBlocPropi(element) {
  const tag = element.tagName?.toLowerCase();
  if (tag === 'blockquote' || tag === 'li' || tag === 'dd' || element.classList?.contains('sdp-alerta__text')) {
    const fills = element.querySelectorAll?.('p, h2, h3, h4, h5, h6, ul, ol');
    return Boolean(fills && fills.length > 0);
  }
  if (tag === 'tr') {
    const fills = element.querySelectorAll?.('p, h2, h3, h4, h5, h6, ul, ol, table');
    return Boolean(fills && fills.length > 0);
  }
  return false;
}

function textDeFilaTaula(fila) {
  const celles = [...(fila.children || [])].filter((c) => {
    const tag = c.tagName?.toLowerCase();
    return (tag === 'th' || tag === 'td') && !dinsDExclos(c, fila);
  });
  const parts = celles.map((c) => textNetDeBloc(c)).filter(Boolean);
  if (!parts.length) return '';
  return parts.join(parts.length === 2 ? ': ' : ' · ');
}

/**
 * Construeix la llista indexada `[0..N-1]` de blocs de lectura d'una pàgina.
 */
export function extreuBlocsLecturaVeu({ capcalera = null, cos = null } = {}) {
  const blocs = [];
  let seccioActual = '';

  const afigBloc = (element, etiquetaForcada = null) => {
    const tagInicial = etiquetaForcada || element.tagName.toLowerCase();
    const text = tagInicial === 'tr' ? textDeFilaTaula(element) : textNetDeBloc(element);
    if (!text) return;
    const tag = element.classList?.contains('sdp-alerta__text') ? 'p' : tagInicial;
    const esLead = tag === 'p' && element.classList?.contains('lead');
    const etiqueta = esLead ? 'lead' : tag;
    const esTitol = ETIQUETES_TITOL.has(etiqueta);
    if (esTitol) {
      seccioActual = text;
    }
    const index = blocs.length;
    blocs.push({
      index,
      id: `bloc-veu-${index}`,
      etiqueta,
      esTitol,
      seccioTitol: seccioActual,
      resumCurt: resumDeText(text),
      text,
      element,
    });
  };

  if (capcalera) {
    const h1 = [...(capcalera.children || [])].find((el) => el.tagName === 'H1');
    if (h1 && !h1.classList?.contains('sr-only') && !dinsDExclos(h1, capcalera)) {
      afigBloc(h1, 'h1');
    }
  }

  if (cos) {
    const nodes = cos.querySelectorAll?.(SELECTOR_BLOC) || [];
    for (const element of nodes) {
      if (dinsDExclos(element, cos)) continue;
      if (teFillDeBlocPropi(element)) continue;
      afigBloc(element);
    }
  }

  return blocs;
}

export const CLASSE_BLOC_VEU_ACTIU = 'sdp-veu-bloc-actiu';

/**
 * Marca amb ressaltat suau (zero CLS) l'element DOM del bloc actiu i neteja
 * qualsevol ressaltat anterior. Mai muta un element editable.
 */
export function marcaBlocActiuDom(anteriorElement, nouElement) {
  if (anteriorElement && anteriorElement !== nouElement) {
    anteriorElement.classList?.remove?.(CLASSE_BLOC_VEU_ACTIU);
  }
  if (nouElement && !nouElement.closest?.('[contenteditable]:not([contenteditable="false"])')) {
    nouElement.classList?.add?.(CLASSE_BLOC_VEU_ACTIU);
    return nouElement;
  }
  return null;
}
