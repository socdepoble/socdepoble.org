/**
 * Plataforma d'Apps Enxufables · les guardes del text del cos d'un mòdul
 * (contracte sdp.modul.v1, ADR-2026-12).
 *
 * El build d'un mòdul (vite.modul.config.js) s'atura si el cos obri xarxa,
 * fa servir un magatzem del navegador que el mòdul no ha declarat o porta
 * una adreça de fora que no és una dada declarada. guardesDelModul.test.js
 * passa estes mateixes guardes sobre l'arbre sencer de la Gestoria, també
 * quan el build no es pot fer.
 *
 * Dues coses que no es barregen:
 *   · la XARXA (fetch, XMLHttpRequest, WebSocket, una imatge-balisa…):
 *     vetada sempre, per a tots els mòduls;
 *   · les ADRECES que són dada: el text de l'URL de cotejo de l'AEAT dins
 *     del QR, l'adreça de redacció de Gmail que obri la persona o els espais
 *     de noms d'OOXML. Ningú s'hi connecta: només valen per al mòdul que les
 *     declara, host per host. Els espais de noms del W3C (SVG, XHTML, MathML)
 *     valen per a tots.
 *
 * Este fitxer és PUR (cap import, cap global). Els patrons es componen a
 * trossos perquè les portes que llegixen el repositori no els troben ací
 * (patró de fronteres.test.js).
 */

function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
}

const patro = (...trossos) => new RegExp(trossos.join(''));

/* La xarxa: cap mòdul l'obri. */
export const XARXA = Object.freeze([
  [patro('\\bfet', 'ch\\s*\\('), 'fetch'],
  [patro('\\[\\s*["\'`]fet', 'ch["\'`]\\s*\\]'), 'fetch per claudàtors'],
  [patro('\\bXMLHttp', 'Request\\b'), 'XMLHttpRequest'],
  [patro('\\bWeb', 'Socket\\b'), 'WebSocket'],
  [patro('\\bEvent', 'Source\\b'), 'EventSource'],
  [patro('\\bsend', 'Beacon\\b'), 'sendBeacon'],
  [patro('\\bimport', 'Scripts\\b'), 'importScripts'],
  [patro('\\bRTCPeer', 'Connection\\b'), 'WebRTC'],
  [patro('\\bWeb', 'Transport\\b'), 'WebTransport'],
  /* L'etiqueta, també a trossos: src/pwa/registre.test.js veta el nom sencer fora del registre de la PWA. */
  [patro('navigator\\.service', 'Worker\\b'), ['navigator.service', 'Worker'].join('')],
  [patro('\\bnew\\s+Ima', 'ge\\b'), 'new Image (una balisa)'],
  [new RegExp(['["\'`]\\/\\/[a-z0-9-]+(?:\\.[a-z0-9-]+)+', '(?:[:/"\'`?#]|$)'].join(''), 'i'), 'URL protocol-relativa']
]);

/* Els magatzems del navegador: cap, si el mòdul no el declara. La clau és
   la que fa servir la declaració (els noms sencers de les API no s'escriuen
   ací: plataforma/qualitat.test.js els veta al codi de la plataforma). */
export const MAGATZEMS = Object.freeze([
  ['idb', patro('\\bindexed', 'DB\\b'), 'IndexedDB'],
  ['local', patro('\\blocal', 'Storage\\b'), ['local', 'Storage'].join('')],
  ['sessio', patro('\\bsession', 'Storage\\b'), ['session', 'Storage'].join('')],
  ['galeta', patro('\\bdocument\\.coo', 'kie\\b'), 'document.cookie'],
  ['cache', patro('\\bcaches\\.', 'open\\b'), 'Cache API']
]);

/* Les adreces que són dada per a tots: els espais de noms del W3C. */
export const ADRECES_DE_TOTS = Object.freeze(['www.w3.org']);

/* El que declara cada mòdul: les adreces que porta com a dada i els
   magatzems que fa servir. Per a la Gestoria:
     · del codi, la llista blanca de src/sections/gestoria/privacitat.test.js,
       aprovada pel Mestre, host per host: Gmail (pas 5), el QR de l'AEAT
       (Orde HAC/1177/2024), els espais de noms de l'XLSX i el de l'XML de
       prova;
     · de les fitxes que el cos porta com a text (la guarda de privacitat no
       mira els .md), localhost:3340: la fitxa signada del tractor
       gestoria.factures diu a la persona que òbriga la Wiki ací per a
       signar amb WebAuthn. És el mateix ordinador, no cap servidor de fora.
   guardesDelModul.test.js comprova que la llista és exactament eixa, i el
   build de la Gestoria sencera (modulDeBuild.test.jsx), que el cos no en
   porta cap més. Magatzem: només IndexedDB ('idb'), als magatzems que la
   guarda de privacitat declara. */
export const DECLARACIONS_DELS_MODULS = congela({
  gestoria: {
    adreces: ['localhost:3340', 'mail.google.com', 'prewww2.aeat.es', 'purl.org', 'schemas.openxmlformats.org', 'www2.agenciatributaria.gob.es'],
    magatzems: ['idb']
  }
});

const SENSE_DECLARACIO = Object.freeze({ adreces: Object.freeze([]), magatzems: Object.freeze([]) });

/** El que declara el mòdul `id` (res, si no declara res). */
export function declaracioDe(id) {
  return Object.hasOwn(DECLARACIONS_DELS_MODULS, id) ? DECLARACIONS_DELS_MODULS[id] : SENSE_DECLARACIO;
}

/** Els hosts de les URL http(s) d'un text, sense repetir i en ordre. */
export function hostsDe(text) {
  const trobats = String(text || '').matchAll(/\bhttps?:\/\/([^/\s'"`)\\]+)/gi);
  return [...new Set([...trobats].map((m) => m[1].toLowerCase()))].sort();
}

/**
 * Les infraccions del text d'un cos (o d'un fitxer font) del mòdul `id`,
 * com a text. Buit si és net.
 */
export function infraccionsDelText(codi, { id = null } = {}) {
  const text = String(codi || '');
  const { adreces, magatzems } = declaracioDe(id);
  const trobades = [];
  for (const [vetat, que] of XARXA) if (vetat.test(text)) trobades.push(`obri xarxa: ${que}`);
  for (const [clau, vetat, que] of MAGATZEMS) {
    if (vetat.test(text) && !magatzems.includes(clau)) trobades.push(`fa servir un magatzem que no declara: ${que}`);
  }
  for (const host of hostsDe(text)) {
    if (!ADRECES_DE_TOTS.includes(host) && !adreces.includes(host)) trobades.push(`porta una URL externa que no declara: ${host}`);
  }
  return trobades;
}
