/**
 * Lector de notícies · les formes de les dades i la seua llista blanca
 * (nucli pur). El port (fontNoticies.js) i el magatzem (estat.js) passen tot
 * el que entra per ací: res que no siga d'esta forma arriba a la UI ni al disc.
 *
 *   categoria { id, nom, ordre, icona }   icona: un nom d'ICONES_CATEGORIA o null
 *   font      { id, nom, categoriaId, lloc, descripcio, imatge }
 *   resum     { id, fontId, titol, enllac, data, autor, resum, imatge }
 *   article   resum + { contingutHtml, mitjansOmesos }
 * Els ids passen esIdLector i, els de categories i fonts, no són RESERVATS
 * (són trams de les rutes). Els textos van sense controls ni invisibles, amb
 * els espais plegats i una llargària màxima. Les adreces, absolutes i web.
 */
import { llegixData } from './dates.js';
import { plega, talla } from './entitats.js';
import { sanejaHtml } from './html.js';
import { esIdLector } from './ids.js';
import { urlAbsoluta } from './urls.js';

/** Trams de les rutes que cap categoria ni font pot prendre com a id. */
export const RESERVATS = Object.freeze(['hui', 'despres', 'fonts', 'totes', 'colleccio']);
/** Les icones de categoria que la UI sap pintar (noms de lucide). */
export const ICONES_CATEGORIA = Object.freeze(['Landmark', 'PartyPopper', 'Sprout', 'Trophy', 'BookOpen', 'CloudSun', 'Store', 'Newspaper']);
export const LIMITS_MODEL = Object.freeze({ nom: 80, titol: 300, autor: 120, descripcio: 400, resum: 280, resumMinim: 200 });

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/** Un id de categoria o de font: opac i no reservat. */
export const esIdLliure = (valor) => esIdLector(valor) && !RESERVATS.includes(valor);

/** Un text d'una línia: net, plegat i tallat. */
export function textCurt(valor, maxim) {
  return typeof valor === 'string' ? talla(plega(valor), maxim).trim() : '';
}

/**
 * El resum d'una notícia: el text sencer si no passa de 280 caràcters; si en
 * passa, tallat per l'últim espai entre el 200 i el 279, amb «…».
 */
export function resumDeText(text) {
  const net = textCurt(String(text ?? ''), Number.MAX_SAFE_INTEGER);
  if (net.length <= LIMITS_MODEL.resum) return net;
  const tall = talla(net, LIMITS_MODEL.resum - 1);
  const espai = tall.lastIndexOf(' ');
  const base = espai >= LIMITS_MODEL.resumMinim ? tall.slice(0, espai) : tall;
  return `${base.replace(/[\s.,;:·—–-]+$/, '')}…`;
}

/** Un títol sense el punt final (Pedra Seca §4); els punts suspensius es queden. */
export function senseFinal(titol) {
  return typeof titol === 'string' ? titol.replace(/([^.])\.$/, '$1') : '';
}

export function normalitzaCategoria(cru, posicio = 0) {
  if (!esObjecte(cru) || !esIdLliure(cru.id)) return null;
  const nom = textCurt(cru.nom, LIMITS_MODEL.nom);
  if (!nom) return null;
  return Object.freeze({
    id: cru.id,
    nom,
    ordre: Number.isSafeInteger(cru.ordre) ? cru.ordre : posicio,
    icona: ICONES_CATEGORIA.includes(cru.icona) ? cru.icona : null
  });
}

/** `categories`: els ids de categoria que existixen; una altra queda sense categoria. */
export function normalitzaFont(cru, categories = new Set()) {
  if (!esObjecte(cru) || !esIdLliure(cru.id)) return null;
  const nom = textCurt(cru.nom, LIMITS_MODEL.nom);
  if (!nom) return null;
  return Object.freeze({
    id: cru.id,
    nom,
    categoriaId: categories.has(cru.categoriaId) ? cru.categoriaId : null,
    lloc: urlAbsoluta(cru.lloc),
    descripcio: textCurt(cru.descripcio, LIMITS_MODEL.descripcio),
    imatge: urlAbsoluta(cru.imatge)
  });
}

export function normalitzaResum(cru) {
  if (!esObjecte(cru) || !esIdLector(cru.id) || !esIdLliure(cru.fontId)) return null;
  const titol = textCurt(cru.titol, LIMITS_MODEL.titol);
  if (!titol) return null;
  return Object.freeze({
    id: cru.id,
    fontId: cru.fontId,
    titol,
    enllac: urlAbsoluta(cru.enllac),
    data: llegixData(cru.data),
    autor: textCurt(cru.autor, LIMITS_MODEL.autor) || null,
    resum: resumDeText(cru.resum),
    imatge: urlAbsoluta(cru.imatge)
  });
}

/** Un article sencer: el resum i el contingut, que es torna a passar per la llista blanca. */
export function normalitzaArticle(cru) {
  const resum = normalitzaResum(cru);
  if (!resum) return null;
  const { html, omesos } = sanejaHtml(typeof cru.contingutHtml === 'string' ? cru.contingutHtml : '', { base: resum.enllac });
  const declarats = Number.isSafeInteger(cru.mitjansOmesos) && cru.mitjansOmesos > 0 ? cru.mitjansOmesos : 0;
  return Object.freeze({ ...resum, contingutHtml: html, mitjansOmesos: Math.max(declarats, omesos) });
}
