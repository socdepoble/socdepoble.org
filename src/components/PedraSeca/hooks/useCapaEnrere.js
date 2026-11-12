/* P0-24 (G2120-07, marató 261101_2143) · Mentre `actiu`, la capa és a la pila
   de l'Arrere d'Android (config/pilaEnrere.js) amb `tanca`, que ha de ser el
   mateix camí que el seu Escape. Fora de l'App ningú no pregunta la pila: no
   canvia res. `tanca` es llig pel ref: canviar-la no reordena la pila.
   P0-24b (Onada R21) · Torna `teCapaDamunt()`, estable: cert si damunt d'esta
   capa n'hi ha una altra a la pila. Una capa que escolta l'Escape a tot el
   document (o a la finestra) el deixa passar quan ja és consumit
   (defaultPrevented) o quan té una capa damunt: així el primer Escape tanca
   NOMÉS la de dalt, en l'ordre de l'Arrere, i no dues capes alhora.
   L'àmbit (AmbitCapesEnrere) és la instància de l'App: PedraSecaEmbed el dona
   a cada <soc-de-poble> (la seua arrel ombra), i a la SPA és null, l'única.
   teCapaDamunt només mira les capes del mateix àmbit. */
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { obriCapaEnrere, teCapaEnrereDamunt } from '../../../config/pilaEnrere.js';

export const AmbitCapesEnrere = createContext(null);

export function useCapaEnrere(actiu, tanca) {
  const ambit = useContext(AmbitCapesEnrere);
  const tancaRef = useRef(tanca);
  /* La funció amb què la capa és a la pila ara mateix (null si no hi és). */
  const apuntadaRef = useRef(null);
  useEffect(() => { tancaRef.current = tanca; }, [tanca]);
  useEffect(() => {
    if (!actiu) return undefined;
    const apuntada = () => tancaRef.current?.();
    apuntadaRef.current = apuntada;
    const lleva = obriCapaEnrere(apuntada, ambit);
    return () => {
      if (apuntadaRef.current === apuntada) apuntadaRef.current = null;
      lleva();
    };
  }, [actiu, ambit]);
  return useCallback(() => teCapaEnrereDamunt(apuntadaRef.current), []);
}
