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
 * (caducat o ja usat); MATEIXA_CONTRASENYA, la nova és la que ja hi havia. */
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
  DESCONEGUT: 'desconegut'
});

/** Una petició que no ha arribat al servidor. Va a `error.codi`, com 'sense-capacitat'. */
export const CODI_BACKEND_INABASTABLE = 'backend-inabastable';

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

/** Posa el codi a l'error sense perdre'n el missatge ni la causa. */
export function ambCodi(error, code) {
  const eixida = error instanceof Error ? error : new Error(String(error?.message || error || ''));
  eixida.code = code;
  return eixida;
}

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
