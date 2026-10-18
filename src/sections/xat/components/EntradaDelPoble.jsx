import { useEffect, useRef } from 'react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { useXat } from '../XatContext';

/**
 * EntradaDelPoble.jsx — 
 * Ordre del Mestre (261017_2302): /xat mai no segresta cap a la fitxa d'una
 * comunitat concreta (?comunitat=<id>), perquè amaga la resta de converses
 * (Sóc de Poble, veïns, IAIA MarIA). En entrar a /xat, la persona veu
 * directament la llista de converses (on la comunitat del poble ja és visible
 * al capdamunt mitjançant anteposaPoble) i la presentació del xat a la dreta.
 * Consumix l'entrada de l'àmbit per preservar la guarda de sessió.
 */
export default function EntradaDelPoble({ poble, aLaLlista = false, onEntra = null }) {
  const { mida } = useAppGrid();
  const { status, senseSessio, consumixEntrada } = useXat();
  const midaRef = useRef(mida);
  midaRef.current = mida;

  const llesta = Boolean(poble) && aLaLlista && status === 'ready' && !senseSessio
    && typeof consumixEntrada === 'function' && typeof onEntra === 'function';

  useEffect(() => {
    if (!llesta) return undefined;
    const temporitzador = setTimeout(() => {
      consumixEntrada(`poble:${poble.id}`);
      /* Ordre del Mestre (261017_2302): Ja no segresta cap a ?comunitat=<id>. */
    }, 0);
    return () => clearTimeout(temporitzador);
  }, [llesta, poble, consumixEntrada]);

  return null;
}
