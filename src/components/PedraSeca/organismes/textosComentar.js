/**
 * textosComentar.js — Ordre del Mestre (261007) · «COMENTARIS = XAT» · Els
 * textos del menú de Comentar (Comentar.jsx), en parells [clau i18n, reserva
 * en valencià]: la reserva és el valor valencià del diccionari (i18n.js).
 * Correcció C9 · Viuen fora del .jsx, com TEXTOS_ARTICLES (articles.js): són
 * dades, no cap component del catàleg.
 */
export const TEXTOS_COMENTAR = Object.freeze({
  menu: Object.freeze(['section.xat.comentar.menu', 'On vols comentar?']),
  privat: Object.freeze(['section.xat.comentar.privat', 'En privat']),
  privatDetall: Object.freeze(['section.xat.comentar.privat.detall', 'Un xat només entre tu i Sóc de Poble']),
  /* Onada 8 (261009) · «En privat» amb l'autor: {nom} és el seu nom. */
  privatDetallAmb: Object.freeze(['section.xat.comentar.privat.detallAmb', 'Un xat només entre tu i {nom}']),
  public: Object.freeze(['section.xat.comentar.public', 'En públic']),
  publicDetall: Object.freeze(['section.xat.comentar.public.detall', 'Un xat obert: hi pot entrar tothom']),
  senseXatPublic: Object.freeze(['section.xat.comentar.public.senseXat', 'Ací encara no hi ha cap xat públic.'])
});
