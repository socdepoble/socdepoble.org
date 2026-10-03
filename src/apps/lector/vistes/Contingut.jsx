/**
 * Lector de notícies · el cos d'un article, pintat des de l'arbre net.
 *
 * Cap HTML cru: l'HTML de l'article (ja sanejat pel port) es torna a llegir
 * amb el nucli (arbreSegur) i d'ací només ixen elements de React d'una llista
 * TANCADA. Els textos van com a fills (React els escapa) i l'únic atribut que
 * passa és l'href d'un enllaç, que es torna a validar i va sempre amb
 * target=_blank i rel="noopener noreferrer". Una etiqueta que no és de la
 * llista no es pinta (ni el que porta dins).
 *
 * La tipografia és l'editorial global de Pedra Seca (src/css/base.css: p,
 * h3–h6, ul, ol, blockquote, pre, interlineat --sdp-leading-editorial).
 */
import { createElement, useMemo } from 'react';
import { PROTOCOLS_ENLLAC, arbreSegur, urlAbsoluta } from '../nucli/index.js';

const ETIQUETES = Object.freeze({
  p: 'p', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6', ul: 'ul', ol: 'ol', li: 'li', blockquote: 'blockquote', pre: 'pre',
  hr: 'hr', strong: 'strong', em: 'em', code: 'code', br: 'br', a: 'a'
});

function pinta(node, clau) {
  if (typeof node === 'string') return node;
  if (!node || !Object.hasOwn(ETIQUETES, node.t)) return null;
  const etiqueta = ETIQUETES[node.t];
  if (etiqueta === 'br' || etiqueta === 'hr') return createElement(etiqueta, { key: clau });
  const fills = Array.isArray(node.c) ? node.c.map((fill, i) => pinta(fill, i)) : null;
  if (etiqueta === 'a') {
    const href = urlAbsoluta(node.href ?? '', null, PROTOCOLS_ENLLAC);
    return href
      ? createElement('a', { key: clau, href, target: '_blank', rel: 'noopener noreferrer' }, fills)
      : createElement('span', { key: clau }, fills);
  }
  return createElement(etiqueta, { key: clau }, fills);
}

/** `html`: el contingutHtml d'un article. */
export function Contingut({ html }) {
  const arbre = useMemo(() => arbreSegur(typeof html === 'string' ? html : '').arbre, [html]);
  return <>{arbre.map((node, i) => pinta(node, i))}</>;
}
