/**
 * useCensImatges.js — el cens de public/assets (censImatges.js), carregat amb
 * import() NOMÉS quan es pinta /multimedia.
 *
 * Onada 0.3 (Gauntlet 261016, M03) · El cens són unes 150 entrades: ni el
 * Cercador ni la resta de l'app no el paguen al paquet trossejat (Vite en fa
 * un tros a banda). Limitació coneguda (MCR 261016, risc 2): la variant
 * monolítica del directori de WordPress (inlineDynamicImports) l'empaqueta
 * igualment dins de l'IIFE.
 * Torna { mitjans, cens, alies }: les entrades amb la forma dels mitjans de
 * l'Arxiu (mitjansDelCens), un Map src → entrada (indexaCens) i un Map còpia →
 * original (ALIES_DEL_CENS, per a la fusió: revisió adversarial del 261016),
 * buits mentre carrega o si la càrrega falla (l'Arxiu es pinta igual, amb el
 * que porta el port).
 */
import { useEffect, useState } from 'react';
import { indexaCens } from './origenImatges.js';

const BUIT = Object.freeze({ mitjans: Object.freeze([]), cens: new Map(), alies: new Map() });
let carregat = null;

export function useCensImatges() {
  const [estat, setEstat] = useState(() => carregat || BUIT);
  useEffect(() => {
    if (carregat) {
      setEstat(carregat);
      return undefined;
    }
    let viu = true;
    import('./censImatges.js')
      .then((modul) => {
        carregat = {
          mitjans: modul.mitjansDelCens(modul.CENS_IMATGES),
          cens: indexaCens(modul.CENS_IMATGES),
          alies: new Map(Object.entries(modul.ALIES_DEL_CENS || {}))
        };
        if (viu) setEstat(carregat);
      })
      .catch(() => {});
    return () => { viu = false; };
  }, []);
  return estat;
}
