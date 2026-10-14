/**
 * mitjaOpac.js — la referència opaca del port de mitjans ('sdp-media://…').
 *
 * Una foto o un logo pujats el node els desa com a 'sdp-media://<bucket>/<camí>'
 * (PerfilEditor, pujaMitja), i només el port la sap resoldre
 * (useResolvedAsset, capacitat 'mitjans'). El navegador no coneix l'esquema:
 * un <img> amb eixa font no carrega res i la consola diu
 * ERR_UNKNOWN_URL_SCHEME. El filtre de seguretat (esFontImatgeSegura i
 * esFontImatgePropia de sanitize.js) l'admet perquè és nostra, no perquè es
 * puga pintar: les peces que posen un <img> la descarten abans i hi pinten el
 * seu substitut (Avatar, marca.jsx i, al Xat, CaraXat).
 *
 * XAT-02 (ordre del Mestre, 261014, pla 261014_0210) · Abans vivia a
 * sections/xat/components/CaraXat.jsx. Ara és ací perquè un àtom de Pedra
 * Seca no importa d'una secció; CaraXat la reexporta i la seua API no canvia.
 * Funció pura: cap import, cap global.
 */

/* L'esquema d'una URL no distingix majúscules, i el filtre tampoc (sanitize.js, admetFont amb /i): la guarda
   ha de reconéixer el mateix conjunt que deixa passar, o un 'SDP-MEDIA://…' tornaria a muntar l'<img>. */
const MITJA_OPAC = /^sdp-media:\/\//i;

/** Cert si `src` és una referència opaca del port de mitjans, també amb espais davant o en majúscules. */
export const esMitjaOpac = (src) => typeof src === 'string' && MITJA_OPAC.test(src.trim());
