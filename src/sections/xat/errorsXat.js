/**
 * errorsXat.js — Onada 6 (xat per als beta testers) · El text, en la llengua
 * de la interfície, dels codis SDP que l'adaptador ja diu en valencià
 * (MISSATGES_SDP_HUMANS de data/supabase/xat.js): ningú no ha de vore el
 * codi cru. El text de l'error és la reserva, i és el valor valencià de la
 * clau (i18n.claus.test.js ho comprova). La resta d'errors, el seu missatge.
 * Pur: no sap res de React ni del backend.
 */

/** Codi SDP → clau d'i18n. */
export const CLAUS_ERROR_SDP = Object.freeze({
  'SDP-XAT-003': 'section.xat.error.noMembre',
  'SDP-XAT-013': 'section.xat.error.paginaNoVisible',
  'SDP-XAT-016': 'section.xat.error.noDisponible',
  'SDP-XAT-429': 'section.xat.error.massaMissatges'
});

/** El text per a la persona d'un error del xat ({ code, message }), o `perDefecte` si no en porta cap. */
export function textDErrorDelXat(error, t, perDefecte = '') {
  const clau = Object.hasOwn(CLAUS_ERROR_SDP, String(error?.code ?? '')) ? CLAUS_ERROR_SDP[error.code] : null;
  if (clau && typeof t === 'function') return t(clau, error?.message || perDefecte);
  return error?.message || perDefecte;
}

/** El text d'una fallada en obrir una conversa (B03; XatSection el reexporta). */
export function textDeFalladaDirecte(error, t) {
  return textDErrorDelXat(error, t, t('section.xat.obrirError', "No s'ha pogut obrir la conversa."));
}
