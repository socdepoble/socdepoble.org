/**
 * useInstalacioApp.js · Ordre del Mestre (261021, prompt 261021_0015, tasca 3)
 * · Llig el magatzem de la instal·lació (src/pwa/instalacio.js), que només
 * avisa quan l'oferta arriba o se'n va: es repinta qui el gasta (el botó de la
 * barra negra), i només llavors. Com TornarADalt (App.jsx) amb les barres.
 *
 * `pot`: hi ha una oferta guardada. `instala`: obri el diàleg natiu; s'ha de
 * cridar directament des del clic (demana() crida prompt() de manera
 * síncrona). Al servidor, i en el primer pintat d'una hidratació, no hi ha
 * oferta.
 *
 * @param {ReturnType<import('../pwa/instalacio.js').creaInstalacio>} [magatzem]
 * @returns {{ pot: boolean, instala: () => Promise<string> }}
 */
import { useCallback, useSyncExternalStore } from 'react';
import { INSTALACIO } from '../pwa/instalacio.js';

const senseOfertaAlServidor = () => false;

export function useInstalacioApp(magatzem = INSTALACIO) {
  const pot = useSyncExternalStore(magatzem.subscriu, magatzem.pot, senseOfertaAlServidor);
  const instala = useCallback(() => magatzem.demana(), [magatzem]);
  return { pot, instala };
}
