/**
 * VeuLecturaPaginaContext.js · IDEA-255 (Onada R23) · Context lleuger perquè
 * les publicacions que ja vivien amb un botó solt («La Veu de Sóc de Poble»,
 * «Noves tecnologies aplicades a la cultura rural») sàpien que PageFrame ja
 * pinta el disparador universal sota l'entradilla (.page-intro) i no dupliquen
 * cap botó a la mateixa vista, mentre conserven el seu botó en proves unitaris
 * quan es munten fora de PageFrame.
 */
import { createContext, useContext } from 'react';

export const VeuLecturaPaginaContext = createContext(false);

export function useVeuLecturaPaginaActiva() {
  return useContext(VeuLecturaPaginaContext);
}
