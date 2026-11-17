/**
 * BandaBetaMicroApp.jsx · Onada R32.5 (P0-112 / IDEA-285 + T3-UI-03)
 *
 * Franja universal, serena i reutilitzable de Pedra Seca per a la capçalera de
 * les micro-apps en fase Beta (proves): recorda en les 5 llengües oficials
 * (ca, es, en, eu, gl) que és una eina d'autoorganització personal i que no
 * s'ha d'utilitzar per a producció crítica ni com a facturació oficial Verifactu.
 */
import { useRef } from 'react';
import { useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssBandaBeta from '../../../css/diferit-banda-beta.css?inline';
import { textosBandaBeta } from './textosBandaBeta.js';

export { TEXTOS_BANDA_BETA, textosBandaBeta } from './textosBandaBeta.js';

export function BandaBetaMicroApp({ idioma }) {
  const ui = useUIStateOpcional();
  const llengua = idioma ?? ui?.llenguaDelText ?? ui?.language ?? 'ca';
  const tx = textosBandaBeta(llengua);
  /* El seu CSS és un full diferit (src/css/diferit-banda-beta.css): no viatja a l'arrencada. */
  const arrel = useRef(null);
  useFullDiferit(arrel, 'banda-beta', cssBandaBeta);

  return (
    <aside ref={arrel} className="sdp-banda-beta" aria-label={tx.regio} data-sdp-banda-beta="">
      <p className="sdp-banda-beta__text">{tx.text}</p>
    </aside>
  );
}

export default BandaBetaMicroApp;
