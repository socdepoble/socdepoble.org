/** Lectura dels marcadors inerts de vídeo, sense importar TipTap.
 * La URL de l'iframe només la construïx VideoEditorial. El document desat
 * continua sent HTML sanejat amb un enllaç de reserva, mai un iframe.
 */
import { createElement } from 'react';
import { sanitizeHtml } from '../../../utils/sanitize.js';
import { resolRecursosDeHtml } from '../../../config/assetResolver.js';
import { VideoEditorial, esIdVideoEditorial } from '../VideoEditorial.jsx';

const MARCA_VIDEO = 'data-sdp-youtube';
const NOMS_REACT = Object.freeze({ 'class': 'className', referrerpolicy: 'referrerPolicy', colspan: 'colSpan', rowspan: 'rowSpan' });
const BUITS = new Set(['br', 'hr', 'img']);
function prepara(html) {
  if (typeof html !== 'string' || !html.includes(MARCA_VIDEO) || typeof DOMParser === 'undefined') return null;
  const net = sanitizeHtml(resolRecursosDeHtml(html));
  // Un template inert evita iniciar càrregues de recursos mentre s'analitza.
  const arrel = new DOMParser().parseFromString(`<template>${net}</template>`, 'text/html').querySelector('template')?.content;
  if (!arrel) return null;
  const videos = new Set([...arrel.querySelectorAll(`div[${MARCA_VIDEO}]`)]
    .filter(node => esIdVideoEditorial(node.getAttribute(MARCA_VIDEO)) && !node.closest('pre,code')));
  return videos.size ? { arrel, videos } : null;
}

export function hiHaVideoEditorial(html) { return prepara(html) !== null; }

/** Null vol dir «cap vídeo»: qui crida conserva el seu camí HTML de sempre.
 * Amb vídeo, només els atributs que ha conservat sanitizeHtml arriben a React;
 * mai es copien src, allow, sandbox ni handlers del marcador cap a l'iframe.
 */
export function renderHtmlEditorial(html) {
  const contingut = prepara(html);
  if (!contingut) return null;
  const pinta = (node, key) => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    if (contingut.videos.has(node)) return (
      <div key={key} className="aplec-2023__video" data-sdp-youtube={node.getAttribute(MARCA_VIDEO)}>
        <VideoEditorial id={node.getAttribute(MARCA_VIDEO)} title={node.getAttribute('data-titol')} />
      </div>
    );
    const props = { key };
    for (const { name, value } of node.attributes) {
      if (/^on/i.test(name) || ['ref', 'key', 'dangerouslysetinnerhtml'].includes(name)) continue;
      props[NOMS_REACT[name] ?? name] = value;
    }
    const tag = node.tagName.toLowerCase();
    return BUITS.has(tag) ? createElement(tag, props) : createElement(tag, props, [...node.childNodes].map((fill, index) => pinta(fill, `${key}:${index}`)));
  };
  return [...contingut.arrel.childNodes].map((node, index) => pinta(node, String(index)));
}
