/**
 * Plataforma d'Apps Enxufables · el SERVEI DE NOTÍCIES que la plataforma dona
 * a una app (T5, P1-07, 261024; nucli 1.3.0).
 *
 *   useServeiNoticies() · { fonts(), feed(id, { signal }) } o null
 *
 * És un ganxo pur: llig ServeisAppContext (ContextApp.jsx), que RutaApps omple
 * amb el que construïx fontServeis.js, i res més. Este mòdul és a la clausura
 * de l'API pública (index.js) i per això no importa mai el client, el backend
 * ni la capa del paquet: l'app rep el servei ja fet i no en sap l'origen
 * (fronteres.test.js). Fora de ProveidorApp, o en una app a qui la plataforma
 * no el dona (un mòdul, una externa, una app que no és a APPS_AMB_NOTICIES),
 * torna null i no llança: el Lector diu llavors que no hi ha cap font
 * connectada. Un valor que no té la forma del servei també és null.
 */
import { useContext } from 'react';
import { ServeisAppContext } from './ContextApp.jsx';

const esServei = (valor) => valor !== null && typeof valor === 'object'
  && typeof valor.fonts === 'function' && typeof valor.feed === 'function';

export function useServeiNoticies() {
  const servei = useContext(ServeisAppContext)?.noticies ?? null;
  return esServei(servei) ? servei : null;
}
