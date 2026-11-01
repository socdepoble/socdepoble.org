/* P0-24 (G2120-07, marató 261101_2143) · Mentre `actiu`, la capa és a la pila
   de l'Arrere d'Android (config/pilaEnrere.js) amb `tanca`, que ha de ser el
   mateix camí que el seu Escape. Fora de l'App ningú no pregunta la pila: no
   canvia res. `tanca` es llig pel ref: canviar-la no reordena la pila. */
import { useEffect, useRef } from 'react';
import { obriCapaEnrere } from '../../../config/pilaEnrere.js';

export function useCapaEnrere(actiu, tanca) {
  const tancaRef = useRef(tanca);
  useEffect(() => { tancaRef.current = tanca; }, [tanca]);
  useEffect(() => (actiu ? obriCapaEnrere(() => tancaRef.current?.()) : undefined), [actiu]);
}
