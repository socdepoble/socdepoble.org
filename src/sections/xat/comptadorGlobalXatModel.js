/**
 * comptadorGlobalXatModel.js — Lògica pura i insígnia d'aplicació per al comptador global del Xat (Onada R32.22 · T2 HMR).
 */

export const RUTA_XAT = /(^|\/)xat(\/|$)/;

export const traductorXat = (t) => (typeof t === 'function' ? t : (_, reserva) => reserva);

export const quantsNoLlegits = (valor) => {
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
};

/** El text del comptador per al lector de pantalla (les claus de PastillaNoLlegits). */
export function textNoLlegits(n, t) {
  const tr = traductorXat(t);
  return n === 1
    ? tr('section.xat.noLlegit.un', 'Un missatge no llegit')
    : tr('section.xat.noLlegit.molts', '{n} missatges no llegits').replace('{n}', String(n));
}

/** Insígnia de l'app instal·lada: detectada i silenciosa. */
export function actualitzaInsigniaApp(n, navegador = typeof navigator === 'undefined' ? null : navigator) {
  if (!navegador) return;
  const crida = n > 0 ? navegador.setAppBadge : navegador.clearAppBadge;
  if (typeof crida !== 'function') return;
  try {
    const promesa = n > 0 ? crida.call(navegador, n) : crida.call(navegador);
    if (promesa && typeof promesa.catch === 'function') promesa.catch(() => {});
  } catch {
    /* sense insígnia: cap avís */
  }
}

/* Sense la prop d'App: cap marca d'incrustat i fora d'un iframe. */
export function esDocumentPropi() {
  if (typeof window === 'undefined' || window.__SDP_EMBEDDED__) return false;
  try { return window.self === window.top; } catch { return false; }
}
