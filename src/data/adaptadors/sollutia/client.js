import { creaFrontissa, ErrorDades } from './creaFrontissa.js';

/** Composició interna Model B. Activar recursos exigix una captura versionada. */
const CONFIGURACIO = Object.freeze({
  apiOrigin: null,
  allowedOrigins: Object.freeze([]),
  resources: Object.freeze({})
});
export const ESCRIPTURES_PERMESES = Object.freeze([]);
let lectura;

/** Conserva el port públic; un issuer de sessió mai és un endpoint de dades. */
export async function llig(recurs, params = {}, options = {}) {
  if (!Object.hasOwn(CONFIGURACIO.resources, recurs)) throw new ErrorDades('UNKNOWN_RESOURCE');
  lectura ||= creaFrontissa(CONFIGURACIO);
  return lectura(recurs, params, options);
}
