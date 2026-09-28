/**
 * contacteOrganitzacio.js — Textos i enllaç del correu opcional d'una
 * organització (T43, ordre del Mestre, 260928). Pur: sense React ni xarxa.
 *
 * Privacitat (RGPD, minimització): el correu d'una altra persona no arriba
 * mai ací. `perDefecte.correu` només ve ple si qui mira n'és la titular;
 * la resta llig qui és, no quin correu té.
 */
import { validaCorreu } from '../../data/correuOrganitzacio.js';

export { validaCorreu };

export const SENSE_CAPACITAT_CORREU = 'Este poble encara no permet desar el correu de les organitzacions.';
export const ERROR_CORREU_INVALID = 'Escriu un correu vàlid, com ara forn@exemple.cat, o deixa-ho en blanc.';

/** El text d'ajuda de l'ajust «Correu de l'organització». */
export function textAjudaCorreu(perDefecte) {
  const origen = perDefecte?.origen;
  const propi = typeof perDefecte?.correu === 'string' && perDefecte.correu.trim() ? perDefecte.correu.trim() : null;
  const privat = 'El correu de l’organització només el veuen les persones que l’administren, llevat que actives «Mostrar el correu a la fitxa pública».';
  if (origen === 'creador') {
    return propi
      ? `Si el deixes buit, els avisos aniran al teu correu (${propi}), perquè vas crear l’organització. ${privat}`
      : `Si el deixes buit, els avisos aniran al correu de la persona que la va crear. ${privat}`;
  }
  if (origen === 'propietaria') {
    return propi
      ? `Si el deixes buit, els avisos aniran al teu correu (${propi}), perquè en tens la propietat. ${privat}`
      : `Si el deixes buit, els avisos aniran al correu de la persona que en té la propietat. ${privat}`;
  }
  return `Si el deixes buit, l’organització no rebrà avisos per correu. ${privat}`;
}

/**
 * L'enllaç `mailto:` d'un correu públic, o null si no és un correu segur.
 * isSafeUrl no admet mailto: ací es valida la forma abans de muntar-lo, i
 * la forma validada no deixa colar cap capçalera (`?`, `&`, `%`, `=`).
 */
export function enllacMailto(correu) {
  const net = String(correu ?? '').trim();
  return validaCorreu(net) ? `mailto:${net}` : null;
}
