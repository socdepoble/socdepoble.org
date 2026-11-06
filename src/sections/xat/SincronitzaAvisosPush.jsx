/* Onada R9 · C3 (IDEA-120 / P0-30, G8-09) · La sincronització dels avisos push
   (useSincronitzaAvisosPush, vegeu la capçalera de useAvisosPushXat.js) com a
   tros diferit: ReceptorCompartit només la munta quan ja hi ha un adaptador
   registrat. Abans d'això el hook no feia res (el cas (i) de la capçalera),
   de manera que muntar-la més tard no canvia cap comportament i el hook, els
   textos i el control de la pàgina «Notificacions» no viatgen a l'entrada.
   No pinta res. */
import { useSincronitzaAvisosPush } from './useAvisosPushXat.js';

export default function SincronitzaAvisosPush() {
  useSincronitzaAvisosPush();
  return null;
}
