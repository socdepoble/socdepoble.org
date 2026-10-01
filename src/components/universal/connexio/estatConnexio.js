/**
 * estatConnexio.js — T7 (261001) · L'estat de connexió amb el node, pur.
 *
 * Només amb dades que l'app ja té, sense cap petició nova ni sondeig:
 *   · modeRemot: el document parla amb un servidor de veres (dataMode
 *     'remote', normalizeBackendConfig). En llavor o local no hi ha cap node
 *     real darrere i mai es diu «connectat».
 *   · status: l'estat de l'última càrrega del contingut core (UIContext, que
 *     l'escriu CoreContentContext): 'loading', 'ready' o 'error'.
 *   · enLinia: el que diu el dispositiu (useEnLinia); fals només si el
 *     navegador diu explícitament que està fora de línia.
 *
 * El verd vol dir «l'última càrrega del contingut contra el servidor ha anat
 * bé i el dispositiu no diu que està fora de línia». No certifica la
 * connexió d'ara: una caiguda del servidor sense recàrrega no es veu fins al
 * pròxim refresc. Zero mentides belles: en el dubte, mai verd.
 */

export const ESTATS_CONNEXIO = Object.freeze(['connectat', 'connectant', 'desconnectat']);

/** 'connectat', 'connectant' o 'desconnectat'. */
export function estatDeConnexio({ modeRemot, status, enLinia } = {}) {
  if (enLinia === false || !modeRemot) return 'desconnectat';
  if (status === 'ready') return 'connectat';
  if (status === 'error') return 'desconnectat';
  return 'connectant';
}

/** Un estat conegut o, si no ho és, 'desconnectat': mai es pinta un verd per error. */
export const estatValid = (estat) => (ESTATS_CONNEXIO.includes(estat) ? estat : 'desconnectat');

/**
 * L'estat dit amb paraules, per al lector de pantalla del pilot (Perfil).
 * Una crida t() per estat amb el valencià de reserva literal
 * (i18n.claus.test.js el busca tal qual en este fitxer).
 */
export function etiquetaDeConnexio(traductor, estat) {
  const t = typeof traductor === 'function' ? traductor : (_clau, reserva) => reserva;
  const valid = estatValid(estat);
  if (valid === 'connectat') return t('connexio.activa', 'Connexió activa');
  if (valid === 'connectant') return t('connexio.connectant', 'Connectant…');
  return t('connexio.sense', 'Sense connexió');
}
