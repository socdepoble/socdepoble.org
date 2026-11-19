/**
 * BandaBetaMicroApp.jsx · Onada R32.5 / R32.10 (P0-112 / D-v127-BANDA + T3-UI-03)
 *
 * Franja universal, serena i reutilitzable de Pedra Seca per a la capçalera de
 * les micro-apps en fase Beta (proves): resol declarativament des del manifest
 * (`avisBeta: 'fiscal' | 'general'`, Llei 7: zero if per slug) si cal mostrar
 * la clàusula sobre Verifactu / AEAT (Gestoria i Bar/TPV) o un avís beta net
 * de funcionalitat en proves en les 5 llengües oficials (ca, es, en, eu, gl).
 */
import { useRef } from 'react';
import { useAppOpcional } from '../../../apps/plataforma/ContextApp.jsx';
import { useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssBandaBeta from '../../../css/diferit-banda-beta.css?inline';
import { textosBandaBeta } from './textosBandaBeta.js';

export {
  TIPUS_AVIS_BETA,
  TEXTOS_BANDA_BETA,
  TEXTOS_BANDA_BETA_FISCAL,
  TEXTOS_BANDA_BETA_GENERAL,
  textosBandaBeta,
} from './textosBandaBeta.js';

export function BandaBetaMicroApp({ idioma, avisBeta }) {
  const ui = useUIStateOpcional();
  const app = useAppOpcional();
  const llengua = idioma ?? ui?.llenguaDelText ?? ui?.language ?? 'ca';
  const tipusAvis = avisBeta ?? app?.manifest?.avisBeta ?? 'general';
  const tipusNormalitzat = tipusAvis === 'fiscal' ? 'fiscal' : 'general';
  const tx = textosBandaBeta(llengua, tipusNormalitzat);
  /* El seu CSS és un full diferit (src/css/diferit-banda-beta.css): no viatja a l'arrencada. */
  const arrel = useRef(null);
  useFullDiferit(arrel, 'banda-beta', cssBandaBeta);

  return (
    <aside
      ref={arrel}
      className="sdp-banda-beta"
      aria-label={tx.regio}
      data-sdp-banda-beta={tipusNormalitzat}
    >
      <p className="sdp-banda-beta__text">{tx.text}</p>
    </aside>
  );
}

export default BandaBetaMicroApp;
