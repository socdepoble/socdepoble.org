/* T2 i T4 (ordre del Mestre, 260930) · Vocabulari neutral d'errors del port.
   La interfície decidix pel codi, mai pel text: cap adaptador (GoTrue,
   PostgREST, Sollutia) fa pujar el seu vocabulari cap a la vista. Cada
   adaptador traduïx les seues respostes a estos codis; el missatge, en
   valencià, el pot portar l'adaptador o triar-lo la vista pel codi. */

/** Codis de les operacions d'entrada (entrar, crear el compte). Van a `error.code`.
 * DESCONEGUT: el servidor ha respost amb un error que no té codi propi; la
 * vista hi posa una frase genèrica i mai el text del proveïdor. */
export const CODI_ENTRADA = Object.freeze({
  CREDENCIALS: 'credencials',
  CORREU_PENDENT: 'correu-pendent',
  SERVIDOR_INABASTABLE: 'servidor-inabastable',
  MASSA_INTENTS: 'massa-intents',
  CONTRASENYA_FEBLE: 'contrasenya-feble',
  COMPTE_EXISTENT: 'compte-existent',
  MODE_LOCAL: 'mode-local',
  DESCONEGUT: 'desconegut'
});

/** Una petició que no ha arribat al servidor. Va a `error.codi`, com 'sense-capacitat'. */
export const CODI_BACKEND_INABASTABLE = 'backend-inabastable';

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
