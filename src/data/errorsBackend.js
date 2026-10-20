/* T2 i T4 (ordre del Mestre, 260930) · Vocabulari neutral d'errors del port.
   La interfície decidix pel codi, mai pel text: cap adaptador (GoTrue,
   PostgREST, Sollutia) fa pujar el seu vocabulari cap a la vista. Cada
   adaptador traduïx les seues respostes a estos codis; el missatge, en
   valencià, el pot portar l'adaptador o triar-lo la vista pel codi. */

/** Codis de les operacions d'entrada (entrar, crear el compte). Van a `error.code`.
 * DESCONEGUT: el servidor ha respost amb un error que no té codi propi; la
 * vista hi posa una frase genèrica i mai el text del proveïdor.
 * R (Onada 3, 261003) · Recuperació de contrasenya (capacitat
 * 'recuperacioContrasenya'): ENLLAC_CADUCAT, l'enllaç del correu ja no val
 * (caducat o ja usat); MATEIXA_CONTRASENYA, la nova és la que ja hi havia.
 * Fase D (261020, tasca 1) · Entrada amb el testimoni d'un proveïdor (capacitat
 * 'entradaAmbToken'): TOKEN_REBUTJAT, el servidor no accepta el testimoni (mal
 * format, nonce o audiència que no casen); PROVEIDOR_INACTIU, el servidor no té
 * activat eixe proveïdor. Cap dels dos és culpa de la persona. */
export const CODI_ENTRADA = Object.freeze({
  CREDENCIALS: 'credencials',
  CORREU_PENDENT: 'correu-pendent',
  SERVIDOR_INABASTABLE: 'servidor-inabastable',
  MASSA_INTENTS: 'massa-intents',
  CONTRASENYA_FEBLE: 'contrasenya-feble',
  COMPTE_EXISTENT: 'compte-existent',
  MODE_LOCAL: 'mode-local',
  ENLLAC_CADUCAT: 'enllac-caducat',
  MATEIXA_CONTRASENYA: 'mateixa-contrasenya',
  TOKEN_REBUTJAT: 'token-rebutjat',
  PROVEIDOR_INACTIU: 'proveidor-inactiu',
  DESCONEGUT: 'desconegut'
});

/** Una petició que no ha arribat al servidor. Va a `error.codi`, com 'sense-capacitat'. */
export const CODI_BACKEND_INABASTABLE = 'backend-inabastable';

/** ENX-16 (261006) · El servidor no té l'esquema que demana l'operació (una
 * columna o una taula sense migrar). Va a `error.codi`. La vista el mira abans
 * de cap text del proveïdor; el text cru de PostgREST (PGRST204, 42703) queda
 * com a reserva per als adaptadors que encara no el traduïxen. */
export const CODI_ESQUEMA_ABSENT = 'esquema-absent';

/** F2 (ordre del Mestre, 261004; pla 2045, Marató 2230) · Pujada de fitxers
 * (capacitat 'mitjans'). Va a `error.codi`, com CODI_BACKEND_INABASTABLE. Eixe
 * codi és genèric (qualsevol petició que no arriba al servidor, no només les
 * pujades): una pujada que no ha arribat al servidor també el porta, en lloc
 * d'un d'estos. Cada adaptador (Supabase Storage, Sollutia) traduïx el rebuig
 * del seu servidor a un d'estos.
 * SESSIO: la sessió no val (JWT caducat, invàlid o absent); SENSE_ESPAI: el
 * servidor no té el lloc on guardar-lo (bucket absent); SENSE_PERMIS: el
 * servidor el rebutja per permisos (RLS); MASSA_GRAN: passa del límit de mida
 * del servidor; FORMAT: el servidor no admet el tipus MIME; SERVIDOR: el
 * servidor ha fallat (5xx); DESCONEGUT: un rebuig sense traducció (també la
 * clau pública del desplegament rebutjada, que és configuració i no sessió),
 * del qual el missatge només porta l'estat HTTP, mai el text del proveïdor. */
export const CODI_MITJANS = Object.freeze({
  SESSIO: 'mitjans-sessio',
  SENSE_ESPAI: 'mitjans-sense-espai',
  SENSE_PERMIS: 'mitjans-sense-permis',
  MASSA_GRAN: 'mitjans-massa-gran',
  FORMAT: 'mitjans-format',
  SERVIDOR: 'mitjans-servidor',
  DESCONEGUT: 'mitjans-desconegut'
});

/** Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor (TOTP) del
 * superadmin (capacitat 'segonFactor', contracte.js). Van a `error.code`.
 * CODI_INVALID: el codi de l'aplicació d'autenticació no és el que toca;
 * REPTE_CADUCAT: el repte ha caducat abans d'escriure el codi;
 * FACTOR_NO_TROBAT: el factor ja no existix (retirat o d'un altre compte);
 * NOM_REPETIT: ja hi ha un factor amb eixe nom; MASSA_FACTORS: el servidor no
 * n'admet més; NO_HABILITAT: el servidor no té el TOTP activat; SENSE_SESSIO:
 * cal una sessió per a gestionar-lo; NO_DISPONIBLE: el mode (seed, local) no
 * té servidor d'autenticació; DESCONEGUT: un rebuig sense traducció (el text
 * del proveïdor es queda a `cause`, mai a la vista). */
export const CODI_SEGON_FACTOR = Object.freeze({
  CODI_INVALID: 'codi-invalid',
  REPTE_CADUCAT: 'repte-caducat',
  FACTOR_NO_TROBAT: 'factor-no-trobat',
  NOM_REPETIT: 'nom-repetit',
  MASSA_FACTORS: 'massa-factors',
  NO_HABILITAT: 'no-habilitat',
  SENSE_SESSIO: 'sense-sessio',
  NO_DISPONIBLE: 'no-disponible',
  DESCONEGUT: 'desconegut'
});

/** La frase en valencià de cada codi del segon factor. La vista pot usar-la tal qual. */
export const MISSATGE_SEGON_FACTOR = Object.freeze({
  [CODI_SEGON_FACTOR.CODI_INVALID]: 'El codi no és correcte. Mira l’aplicació d’autenticació i torna-ho a provar.',
  [CODI_SEGON_FACTOR.REPTE_CADUCAT]: 'El repte ha caducat. Demana’n un altre i escriu el codi nou.',
  [CODI_SEGON_FACTOR.FACTOR_NO_TROBAT]: 'Este segon factor ja no existix. Recarrega i torna-ho a provar.',
  [CODI_SEGON_FACTOR.NOM_REPETIT]: 'Ja tens un segon factor amb este nom. Tria’n un altre.',
  [CODI_SEGON_FACTOR.MASSA_FACTORS]: 'Ja tens el màxim de segons factors inscrits. Retira’n un abans d’afegir-ne un altre.',
  [CODI_SEGON_FACTOR.NO_HABILITAT]: 'Este node no té habilitat el segon factor. Cal activar-lo al servidor.',
  [CODI_SEGON_FACTOR.SENSE_SESSIO]: 'Cal iniciar sessió per a gestionar el segon factor.',
  [CODI_SEGON_FACTOR.NO_DISPONIBLE]: 'El segon factor no està disponible en este mode: cal un servidor d’autenticació.',
  [CODI_SEGON_FACTOR.DESCONEGUT]: 'No s’ha pogut completar l’operació del segon factor. Torna-ho a provar.'
});

/** Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
 * poble (taxonomia i estil) que desa el superadmin (capacitat
 * 'personalitzacio', contracte.js). Van a `error.code`.
 * CAL_SEGON_FACTOR: el servidor exigix aal2 (private.es_superadmin, migració
 * 2610061448) i la sessió no el té; CONFLICTE_VERSIO: algú ha desat una versió
 * més nova que la que s'editava (SDP-ADMIN-006); CLAU_INVALIDA: la clau no és
 * 'taxonomia' ni 'estil'; SENSE_SESSIO: cal una sessió; NO_DISPONIBLE: el
 * servidor encara no té les funcions (migració pendent); DESCONEGUT: un
 * rebuig sense traducció. */
export const CODI_PERSONALITZACIO = Object.freeze({
  CAL_SEGON_FACTOR: 'cal-segon-factor',
  CONFLICTE_VERSIO: 'conflicte-versio',
  CLAU_INVALIDA: 'clau-invalida',
  SENSE_SESSIO: 'sense-sessio',
  NO_DISPONIBLE: 'no-disponible',
  DESCONEGUT: 'desconegut'
});

/** La frase en valencià de cada codi de la personalització. */
export const MISSATGE_PERSONALITZACIO = Object.freeze({
  [CODI_PERSONALITZACIO.CAL_SEGON_FACTOR]: 'Cal confirmar el segon factor per a desar.',
  [CODI_PERSONALITZACIO.CONFLICTE_VERSIO]: 'Algú ha desat una versió més nova. Recarrega i torna a aplicar el canvi.',
  [CODI_PERSONALITZACIO.CLAU_INVALIDA]: 'Només es poden desar la taxonomia i l’estil.',
  [CODI_PERSONALITZACIO.SENSE_SESSIO]: 'Cal iniciar sessió com a superadmin per a desar.',
  [CODI_PERSONALITZACIO.NO_DISPONIBLE]: 'El servidor encara no té les funcions de personalització. Cal aplicar la migració pendent.',
  [CODI_PERSONALITZACIO.DESCONEGUT]: 'No s’ha pogut desar la personalització. Torna-ho a provar.'
});

/** Posa el codi a l'error sense perdre'n el missatge ni la causa. */
export function ambCodi(error, code) {
  const eixida = error instanceof Error ? error : new Error(String(error?.message || error || ''));
  eixida.code = code;
  return eixida;
}

/* Un Error nou amb la frase de la taula i el `code`; la resposta cruda del
   proveïdor viatja a `cause`. Un codi fora de la taula cau a DESCONEGUT. */
function errorTraduit(missatges, code, cause) {
  const codi = Object.hasOwn(missatges, code) ? code : 'desconegut';
  return ambCodi(new Error(missatges[codi], cause ? { cause } : undefined), codi);
}

/** Onada 11 · Un Error amb el `code` i la frase de MISSATGE_SEGON_FACTOR. Pura. */
export const errorDeSegonFactor = (code, cause) => errorTraduit(MISSATGE_SEGON_FACTOR, code, cause);

/** Onada 11 · Un Error amb el `code` i la frase de MISSATGE_PERSONALITZACIO. Pura. */
export const errorDePersonalitzacio = (code, cause) => errorTraduit(MISSATGE_PERSONALITZACIO, code, cause);

// El TypeError cru que llancen els navegadors quan fetch no arriba al servidor.
const RE_FETCH = /Failed to fetch|NetworkError|Load failed|Network request failed/i;

/**
 * Cert si l'error diu que el servidor no s'ha pogut abastar (xarxa caiguda,
 * servidor aturat o adreça que no respon). Val per a qualsevol backend: el
 * codi neutral, l'estat 0 d'una petició sense resposta o el TypeError cru del
 * navegador. Un temps esgotat no ho és: el servidor pot estar viu i lent.
 */
export function esBackendInabastable(error) {
  if (!error || typeof error !== 'object') return false;
  if (error.codi === CODI_BACKEND_INABASTABLE || error.code === CODI_ENTRADA.SERVIDOR_INABASTABLE) return true;
  if (error.status === 0) return true;
  return error.name === 'TypeError' && RE_FETCH.test(String(error.message || ''));
}
