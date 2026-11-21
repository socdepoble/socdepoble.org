/**
 * segonFactorModel.js — Constants i utilitats pures del segon factor TOTP (Onada R32.22 · T2 HMR).
 */
import { CODI_SEGON_FACTOR, MISSATGE_SEGON_FACTOR, esBackendInabastable } from '../../data/errorsBackend.js';

/* El nom amb què el factor s'inscriu al servidor d'autenticació (friendly_name). */
export const NOM_FACTOR = 'Autenticador del Mestre';
/* Les xifres d'un codi TOTP, i la mida (en píxels CSS) de la imatge del QR. */
export const XIFRES_CODI = 6;
export const MIDA_QR = 200;

export const TEXT_RECUPERACIO = 'Si perds l’autenticador, este client no té codis de recuperació: cal demanar a l’equip que retire el factor des del servidor d’autenticació.';
export const TEXT_PISTA = 'Val qualsevol aplicació d’autenticació: Google Authenticator, Aegis, FreeOTP…';
export const TEXT_SERVIDOR_INABASTABLE = 'No s’ha pogut contactar amb el servidor. Comprova la connexió i torna-ho a provar.';

/* La frase de CODI_SEGON_FACTOR del `code` de l'error; sense un codi conegut,
   la del servidor inabastable o la genèrica. Mai el text del proveïdor. */
export function textDErrorSegonFactor(error) {
  const code = error?.code;
  if (typeof code === 'string' && Object.hasOwn(MISSATGE_SEGON_FACTOR, code)) return MISSATGE_SEGON_FACTOR[code];
  if (esBackendInabastable(error)) return TEXT_SERVIDOR_INABASTABLE;
  return MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.DESCONEGUT];
}

/* Només xifres, i com a molt les del codi: el camp no accepta res més. */
export const nomesXifres = (text) => String(text ?? '').replace(/\D/g, '').slice(0, XIFRES_CODI);
