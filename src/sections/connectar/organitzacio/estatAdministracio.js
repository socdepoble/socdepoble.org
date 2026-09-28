/**
 * estatAdministracio.js — En quin punt està la persona respecte d'administrar
 * una organització (T43, ordre del Mestre, 260928). Lògica pura.
 *
 * L'estat es calcula del que se sap de veres (sessió, capacitat del port,
 * pertinença i petició pròpia) i dels errors NORMALITZATS per l'adaptador
 * (`code`). La interfície no llig mai el text del servidor.
 *
 * Prioritat: administres > activant > comprovant > pendent > rebutjada.
 *
 * T43b · `orgId`: una reclamació d'una altra organització no compta.
 * `llegint`: mentre es llig la petició pròpia no se sap si ja n'hi ha una, i
 * l'estat és 'comprovant' (cap formulari). `errorLectura` és el de llegir-la;
 * `error`, el d'enviar-la: no es diuen igual.
 */
import { esRolQueMana } from '../../../components/universal/identitat/rols.js';

export const ESTATS_ADMINISTRACIO = Object.freeze([
  'sense-sessio', 'no-disponible', 'administres', 'activant', 'comprovant', 'membre', 'pendent', 'rebutjada',
  'te-propietaria', 'no-del-poble', 'pot-connectar'
]);

export function estatDeLAdministracio({
  teSessio = false, disponible = false, membership = null, reclamacio = null, error = null,
  orgId = null, llegint = false, errorLectura = null
} = {}) {
  if (!teSessio) return 'sense-sessio';
  if (membership && esRolQueMana(membership.role)) return 'administres';
  const propia = reclamacio && (orgId == null || String(reclamacio.organitzacioId) === String(orgId)) ? reclamacio : null;
  if (propia?.estat === 'aprovada') return 'activant';
  if (!disponible || error?.code === 'NO-DISPONIBLE' || errorLectura?.code === 'NO-DISPONIBLE') return 'no-disponible';
  if (llegint) return 'comprovant';
  if (propia?.estat === 'pendent' || error?.code === 'JA-PENDENT') return 'pendent';
  if (error?.code === 'SDP-CLAIM-003') return 'te-propietaria';
  if (error?.code === 'SDP-CLAIM-002') return 'no-del-poble';
  if (membership?.role === 'member') return 'membre';
  if (propia?.estat === 'rebutjada') return 'rebutjada';
  return 'pot-connectar';
}

/* Els errors que ja es pinten com a estat no es repetixen en una alerta. */
const CODIS_QUE_SON_ESTAT = new Set(['NO-DISPONIBLE', 'JA-PENDENT', 'SDP-CLAIM-003', 'SDP-CLAIM-002']);

/**
 * T43b-2 · Fallada de xarxa: el servidor no ha respost a temps (TimeoutError
 * de runtime.js), no s'hi ha pogut connectar (status 0) o el fetch ha petat
 * (TypeError). No es pot saber què ha passat allà: es diu que no hi ha resposta.
 */
export function esErrorDeXarxa(error) {
  return Boolean(error) && (error.name === 'TimeoutError' || error.name === 'NetworkError'
    || error instanceof TypeError || (error.status != null && Number(error.status) === 0));
}

/**
 * El text d'un error en ENVIAR la petició, o null si l'error ja es diu com a
 * estat (o no n'hi ha). Mai el missatge cru del servidor.
 */
export function textDeLError(error) {
  if (!error || CODIS_QUE_SON_ESTAT.has(error.code)) return null;
  if (esErrorDeXarxa(error)) return 'El servidor no ha respost. Comprova la connexió i torna-ho a provar.';
  switch (error.code) {
    case 'SDP-CLAIM-000': return 'La sessió ha caducat. Torna a entrar per a demanar-ho.';
    case 'SDP-CLAIM-001': return 'Esta organització no existix en este poble.';
    default: return 'No s’ha pogut enviar la petició. Torna-ho a provar d’ací a una estona.';
  }
}

/**
 * El text d'un error en LLEGIR les peticions pròpies, o null. No s'ha enviat
 * res: el que no se sap és si ja n'hi havia una.
 */
export function textDeLaLectura(error) {
  if (!error || CODIS_QUE_SON_ESTAT.has(error.code)) return null;
  return esErrorDeXarxa(error)
    ? 'El servidor no ha respost i no hem pogut comprovar si ja havies demanat administrar-la. Comprova la connexió.'
    : 'No hem pogut comprovar si ja havies demanat administrar-la. Si la tornes a demanar i ja n’hi havia una, ací ho voràs.';
}

/** Una data ISO en format curt valencià, o null. */
export function dataCurta(iso) {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
