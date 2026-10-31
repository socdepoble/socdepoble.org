/**
 * fontsConsola.js — Decisió del Mestre (31-10-2026) · d'on llig la Consola
 * les seues quatre fonts (/__iaia/consola.json, mapa.json, govern.json i
 * empaquetats.json). Pur i sense React: el lligen els quatre carregadors i
 * useFontDev.js.
 *
 * «Sí, vull que la web publicada mostre una instantània sanejada amb totes les
 * dades reals de la Consola a qualsevol usuari» (prompt 261030_2208, T2.2).
 *
 *  · 'viu' · el servidor de desenvolupament (import.meta.env.DEV): el
 *    middleware de tooling/vite/consola-iaia.mjs compila cada font en cada
 *    petició, només per a este ordinador.
 *  · 'instantania' · el build web (vite.config.js): el connector
 *    sdp:consola-instantania n'emet la instantània sanejada a dist/__iaia/ i
 *    segella import.meta.env.SDP_CONSOLA_INSTANTANIA = '1'. Es llig amb un
 *    GET al mateix origen i sense credencials. Les escriptures (cap POST, les
 *    certificacions del Govern, les eines locals) continuen només en
 *    desenvolupament.
 *  · null · qualsevol paquet sense la bandera (el connector de WordPress,
 *    l'app nativa, Sollutia): cap petició a /__iaia/* i l'estat és 'absent'
 *    des del principi, com sempre.
 * Es llig en cada crida (no en importar el mòdul) perquè les proves puguen
 * canviar l'entorn.
 */
export const ORIGEN_VIU = 'viu';
export const ORIGEN_INSTANTANIA = 'instantania';
/** El sobre d'una font que el build no ha pogut produir (tooling/vite/instantania-consola.mjs · ESQUEMA_ERROR). */
export const ESQUEMA_ERROR_INSTANTANIA = 'sdp.instantania-error.v1';
const MIDA_MAXIMA_ERROR = 300;

/** 'viu', 'instantania' o null (cap font a llegir en este paquet). */
export function origenDeLesFonts() {
  if (import.meta.env.DEV === true) return ORIGEN_VIU;
  if (import.meta.env.SDP_CONSOLA_INSTANTANIA === '1') return ORIGEN_INSTANTANIA;
  return null;
}

/** Cert només en desenvolupament: les escriptures de la Consola (certificacions del Govern, eines locals) no ixen mai a la web publicada. */
export const ambEscriptures = () => import.meta.env.DEV === true;
/** Cert si en este paquet hi ha alguna font de la Consola a llegir. */
export const fontsLlegibles = () => origenDeLesFonts() !== null;
/** Cert si les dades són les de la instantània publicada (cap lectura en viu ni cap escriptura). */
export const ambInstantania = () => origenDeLesFonts() === ORIGEN_INSTANTANIA;

/** Les opcions del fetch: en viu, sense memòria cau; de la instantània, revalidada i sense credencials. */
export function opcionsDeLectura(signal) {
  return ambInstantania()
    ? { signal, cache: 'no-cache', credentials: 'omit' }
    : { signal, cache: 'no-store' };
}

/** Si el cos és el sobre d'error de la instantània, l'Error que la Consola ha de pintar; si no, null. */
export function errorDeLaInstantania(cos) {
  if (!cos || typeof cos !== 'object' || Array.isArray(cos) || cos.schema !== ESQUEMA_ERROR_INSTANTANIA) return null;
  const text = typeof cos.error === 'string' && cos.error.trim() && cos.error.trim().length <= MIDA_MAXIMA_ERROR
    ? cos.error.trim()
    : 'Esta font no s’ha pogut incloure en la instantània publicada.';
  const error = new Error(text);
  error.codi = typeof cos.codi === 'string' ? cos.codi : null;
  return error;
}
