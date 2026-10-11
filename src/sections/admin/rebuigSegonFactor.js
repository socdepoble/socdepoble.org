/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El rebuig del servidor
   quan el superadmin encara no ha confirmat el segon factor en ESTA sessió.
   private.es_superadmin() exigix aal2 (migració 2610061448): les RPC del
   Tauler (admin_list_users i admin_list_organizations, 2609121600) llancen
   llavors 42501 amb «SDP-ADMIN-00x: cal rol de superadmin.», que PostgREST
   servix com a 403 i runtime.request() embolcalla en «<proveïdor> 403: {…}».
   La mateixa lectura que fa l'adaptador de la personalització (D0), però la
   vista només ha de distingir este rebuig de la resta (xarxa, un altre
   permís): el text d'abans («error de permisos o de xarxa») amagava que la
   solució era al mateix Tauler. Pur: no llig res fora de l'error. */
import { CODI_PERSONALITZACIO } from '../../data/errorsBackend.js';

/** El que diu el Tauler en lloc de l'error de permisos genèric. */
export const TEXT_CAL_SEGON_FACTOR = 'Cal confirmar el segon factor per a administrar: fes-ho des del Tauler (Panell General) o des d’«El compte» del teu perfil.';

/* El cos JSON de «<proveïdor> NNN: {…}» (runtime.request), o null: PostgREST hi
   posa { code, message, details, hint }. */
function cosDelServidor(error) {
  try {
    const cos = JSON.parse(String(error?.message ?? '').replace(/^[A-Za-z]+\s+\d{3}:\s*/, ''));
    return cos && typeof cos === 'object' ? cos : null;
  } catch {
    return null;
  }
}

/**
 * Cert si l'error és el 42501 (o el 403 de PostgREST) d'una funció del Tauler
 * amb «SDP-ADMIN» al missatge, o un error que el port ja ha traduït a
 * CODI_PERSONALITZACIO.CAL_SEGON_FACTOR. Un 42501 sense «SDP-ADMIN» (una
 * política d'una altra taula) continua sent l'error de permisos de sempre.
 */
export function esRebuigDeSegonFactor(error) {
  if (!error || typeof error !== 'object') return false;
  if (error.code === CODI_PERSONALITZACIO.CAL_SEGON_FACTOR) return true;
  const cos = cosDelServidor(error);
  const missatge = String(cos?.message ?? error.message ?? '');
  const codiPg = String(cos?.code ?? error.code ?? '');
  return (codiPg === '42501' || error.status === 403) && /SDP-ADMIN/.test(missatge);
}
