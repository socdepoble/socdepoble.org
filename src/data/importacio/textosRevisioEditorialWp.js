/* Només els dos consumidors UI diferits importen estos avisos; el motor de dades no els carrega. */
import { codiLlenguaPerfil } from '../../sections/profile/i18nPerfilA11y.js';

export const AVISOS_REVISIO_EDITORIAL_WP = Object.freeze({
  ca: Object.freeze({
    remot: 'Revisió confirmada pel servidor.',
    remotSenseCopia: 'Revisió confirmada pel servidor. Este navegador no n’ha pogut guardar la còpia.',
    local: 'Revisió desada només en este navegador.',
    conflicteLocal: 'Una altra revisió ha canviat al servidor. La teua nota continua desada en este navegador.',
    conflicteSenseCopia: 'Una altra revisió ha canviat al servidor. La teua nota continua oberta, però no s’ha desat en este navegador.',
    noDesada: 'No s’ha desat la revisió ni en este navegador ni al servidor. La teua nota continua oberta; torna-ho a provar.'
  }),
  es: Object.freeze({
    remot: 'Revisión confirmada por el servidor.',
    remotSenseCopia: 'Revisión confirmada por el servidor. Este navegador no ha podido guardar la copia.',
    local: 'Revisión guardada solo en este navegador.',
    conflicteLocal: 'Otra revisión ha cambiado en el servidor. Tu nota sigue guardada en este navegador.',
    conflicteSenseCopia: 'Otra revisión ha cambiado en el servidor. Tu nota sigue abierta, pero no se ha guardado en este navegador.',
    noDesada: 'No se ha guardado la revisión ni en este navegador ni en el servidor. Tu nota sigue abierta; vuelve a intentarlo.'
  }),
  en: Object.freeze({
    remot: 'Review confirmed by the server.',
    remotSenseCopia: 'Review confirmed by the server. This browser could not save the copy.',
    local: 'Review saved only in this browser.',
    conflicteLocal: 'Another review has changed on the server. Your note is still saved in this browser.',
    conflicteSenseCopia: 'Another review has changed on the server. Your note is still open, but it has not been saved in this browser.',
    noDesada: 'The review was not saved in this browser or on the server. Your note is still open; try again.'
  }),
  eu: Object.freeze({
    remot: 'Zerbitzariak berrikuspena baieztatu du.',
    remotSenseCopia: 'Zerbitzariak berrikuspena baieztatu du. Nabigatzaile honek ezin izan du kopia gorde.',
    local: 'Berrikuspena nabigatzaile honetan soilik gorde da.',
    conflicteLocal: 'Beste berrikuspen bat aldatu da zerbitzarian. Zure oharra nabigatzaile honetan gordeta dago.',
    conflicteSenseCopia: 'Beste berrikuspen bat aldatu da zerbitzarian. Zure oharra irekita dago, baina ez da nabigatzaile honetan gorde.',
    noDesada: 'Berrikuspena ez da nabigatzailean ezta zerbitzarian ere gorde. Zure oharra irekita dago; saiatu berriro.'
  }),
  gl: Object.freeze({
    remot: 'Revisión confirmada polo servidor.',
    remotSenseCopia: 'Revisión confirmada polo servidor. Este navegador non puido gardar a copia.',
    local: 'Revisión gardada só neste navegador.',
    conflicteLocal: 'Outra revisión cambiou no servidor. A túa nota segue gardada neste navegador.',
    conflicteSenseCopia: 'Outra revisión cambiou no servidor. A túa nota segue aberta, pero non se gardou neste navegador.',
    noDesada: 'Non se gardou a revisión nin neste navegador nin no servidor. A túa nota segue aberta; téntao de novo.'
  })
});

export function avisDeRevisioEditorial(resultat, opcions = {}) {
  const tx = AVISOS_REVISIO_EDITORIAL_WP[codiLlenguaPerfil(opcions)];
  if (resultat?.remot === true) return resultat.desatLocal === true ? tx.remot : tx.remotSenseCopia;
  if (resultat?.conflicte === true) return resultat.desatLocal === true ? tx.conflicteLocal : tx.conflicteSenseCopia;
  return resultat?.desatLocal === true ? tx.local : tx.noDesada;
}
