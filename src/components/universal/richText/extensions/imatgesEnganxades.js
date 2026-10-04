/**
 * imatgesEnganxades.js — L'HTML que s'enganxa o s'arrossega al text enriquit
 * passa per ací ABANS que ProseMirror el llija (Onada 4, RICH-EXIF; ADR
 * multimèdia D4).
 *
 * ProseMirror crida el mateix transformPastedHTML per a enganxar i per a
 * deixar anar HTML d'una altra finestra (parseFromClipboard): una sola porta.
 * Cada <img> amb un data URL d'imatge ix sense metadades (netejaMetadades.js)
 * o no ix: una imatge que no es pot netejar es lleva, la resta de l'HTML
 * queda. Els data URL que no són d'imatge no es toquen: els lleva el
 * sanejador en desar (sanitize.js).
 *
 * Sense res a netejar, l'HTML torna IDÈNTIC (mateixa cadena): ni un byte
 * canviat en el que s'enganxa cada dia (Llei del Píxel).
 */
import { netejaFontImatge } from '../../enquadrament/netejaMetadades.js';

/* Per a llegir l'HTML sense executar-lo ni carregar-ne res: un document de
   DOMParser és inert, i el contingut d'un <template> s'analitza com un
   fragment (un <td> solt es queda <td>, igual que el llig ProseMirror). */
function plantillaDe(html) {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(`<template>${html}</template>`, 'text/html');
  const plantilla = doc.head.firstElementChild;
  // Un «</template>» dins de l'enganxat trencaria el sobre: res es llig a mitges.
  if (!plantilla || plantilla.tagName !== 'TEMPLATE' || doc.head.childElementCount !== 1 || doc.body.hasChildNodes()) {
    return null;
  }
  return plantilla;
}

/* Revisió · El filtre ràpid mira l'ETIQUETA, no el text «data:»: dins d'un
   atribut, «data&colon;», «&#x64;ata:» o «data&#10;:» ja són un data URL quan
   l'HTML es llig. Una <img> només naix de «<img» o de «<image>» (el parser la
   torna <img>): sense «<im», cap imatge que netejar. */
const POT_TINDRE_IMATGE = /<im/i;

/**
 * L'HTML enganxat amb les imatges netes. Si no es pot llegir amb seguretat,
 * torna '' (no s'enganxa res): millor això que una foto amb el GPS de casa.
 */
export function netejaHtmlEnganxat(html) {
  if (typeof html !== 'string' || !POT_TINDRE_IMATGE.test(html)) return html;
  const plantilla = plantillaDe(html);
  if (!plantilla) return '';
  let canviat = false;
  for (const img of plantilla.content.querySelectorAll('img[src]')) {
    const src = img.getAttribute('src');
    const net = netejaFontImatge(src);
    if (net === src) continue;
    canviat = true;
    if (net === null) img.remove();
    else img.setAttribute('src', net);
  }
  return canviat ? plantilla.innerHTML : html;
}
