/** Same version visibly served at /legal. A server mismatch must reject the
 * registration; never replace this value by a version fetched after consent. */
export const VERSIO_POLITICA_PRIVACITAT = '2.4';
export const RUTA_POLITICA_PRIVACITAT = '/legal';
export const consentimentMostrat = checked => Object.freeze({rgpd:checked===true,versio_politica:checked===true?VERSIO_POLITICA_PRIVACITAT:''});
