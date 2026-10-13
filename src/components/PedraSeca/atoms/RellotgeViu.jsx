/**
 * RellotgeViu.jsx — la data i l'hora d'ara, vives, a la barra taronja.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · «A la part dreta
 * de la barra taronja, SEMPRE la data i l'hora vives, sense ometre-les mai».
 * L'àtom és la pastilla de sempre (DateTimeControl sense clic: un <time
 * class="btn-date-time">, que no és cap botó ni cap regió viva, i per això
 * cap lector de pantalla no l'anuncia a cada minut) amb el format únic de les
 * barres (dataHoraAra: hh:mm i dd/mm/aa, i el dateTime local). L'hora la
 * porta useAra: un sol setTimeout alineat al canvi de minut, que es neteja en
 * desmuntar i es resincronitza en tornar a primer pla. L'estat és local a
 * l'àtom: cada minut només es torna a pintar la pastilla, mai la pàgina.
 *
 * És una excepció ordenada a la regla de la pastilla (skill sdp-pedra-seca
 * §10, regles del Mestre del 28-09-2026: la pastilla és la data del document
 * i PageFrame no s'inventa «la d'ara»). PageFrame no canvia: el rellotge el
 * posa PaginaApp només quan la pàgina el demana (rellotgeViu).
 *
 *   rellotge  () => ms, opcional: el rellotge injectat (la Gestoria, les proves)
 *   etiqueta  el nom accessible; per defecte, etiquetaRellotge (l'hora i el
 *             dia, en l'ordre en què es veuen)
 *
 * Com BotoTornarADalt, no entra a la façana (index.js) ni al nucli de les
 * apps: l'importa PaginaApp directament. Espècimen: EspecimenControlsBarra.
 */
import { useAra } from '../../../hooks/useAra.js';
import { dataHoraAra } from '../../universal/barres/dataHoraBarra.js';
import { DateTimeControl } from './controls.jsx';

/** El nom accessible del rellotge: «Data i hora d’ara: 09:59 del 13/10/26». */
export function etiquetaRellotge({ time, date }) {
  return `Data i hora d’ara: ${time} del ${date}`;
}

export function RellotgeViu({ rellotge, etiqueta }) {
  const ara = useAra({ rellotge });
  const dades = dataHoraAra(ara);
  return <DateTimeControl time={dades.time} date={dades.date} dateTime={dades.dateTime} label={etiqueta || etiquetaRellotge(dades)} />;
}
