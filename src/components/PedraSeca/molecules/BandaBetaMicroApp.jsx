/**
 * BandaBetaMicroApp.jsx · Onada R32.5 / R32.10 (P0-112 / D-v127-BANDA + T3-UI-03)
 *
 * Franja universal, serena i reutilitzable de Pedra Seca per a la capçalera de
 * les micro-apps en fase Beta (proves): resol declarativament des del manifest
 * (`avisBeta: 'fiscal' | 'general'`, Llei 7: zero if per slug) si cal mostrar
 * la clàusula sobre Verifactu / AEAT (Gestoria i Bar/TPV) o un avís beta net
 * de funcionalitat en proves en les 5 llengües oficials (ca, es, en, eu, gl).
 * v1.2.17 · Gauntlet R1 (L3-10) · La general es plega amb UN sol botó (aria-expanded) que no es
 * desmunta en commutar: el focus s'hi queda (WCAG 2.4.3) i, plegada, el seu nom és el text visible
 * (WCAG 2.5.3). La fiscal no es plega: sempre sencera, sense botó.
 */
import { useId, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useAppOpcional } from '../../../apps/plataforma/ContextApp.jsx';
import { useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssBandaBeta from '../../../css/diferit-banda-beta.css?inline';
import {
  bandaBetaPlegable,
  bandaBetaPlegada,
  desaBandaBetaPlegada,
  textosBandaBeta,
} from './textosBandaBeta.js';

export {
  TIPUS_AVIS_BETA,
  TEXTOS_BANDA_BETA,
  TEXTOS_BANDA_BETA_FISCAL,
  TEXTOS_BANDA_BETA_GENERAL,
  bandaBetaPlegable,
  bandaBetaPlegada,
  desaBandaBetaPlegada,
  textosBandaBeta,
} from './textosBandaBeta.js';

export function BandaBetaMicroApp({ idioma, avisBeta }) {
  const ui = useUIStateOpcional();
  const app = useAppOpcional();
  const llengua = idioma ?? ui?.llenguaDelText ?? ui?.language ?? 'ca';
  const tipusAvis = avisBeta ?? app?.manifest?.avisBeta ?? 'general';
  const tipusNormalitzat = tipusAvis === 'fiscal' ? 'fiscal' : 'general';
  const tx = textosBandaBeta(llengua, tipusNormalitzat);
  const plegable = bandaBetaPlegable(tipusNormalitzat);
  const [estatPlec, setEstatPlec] = useState(() => ({
    tipus: tipusNormalitzat,
    plegada: bandaBetaPlegada(tipusNormalitzat),
  }));
  const plegada = plegable && (estatPlec.tipus === tipusNormalitzat
    ? estatPlec.plegada
    : bandaBetaPlegada(tipusNormalitzat));
  const idText = useId();
  const commutaPlec = () => {
    desaBandaBetaPlegada(tipusNormalitzat, !plegada);
    setEstatPlec({ tipus: tipusNormalitzat, plegada: !plegada });
  };
  /* El seu CSS és un full diferit (src/css/diferit-banda-beta.css): no viatja a l'arrencada. */
  const arrel = useRef(null);
  useFullDiferit(arrel, 'banda-beta', cssBandaBeta);

  /* v1.2.17 · Gauntlet R1 (L3-10) · El text i el botó són germans fixos: plegar només lleva el text,
     i el mateix <button> canvia d'aspecte, d'aria-expanded i de nom. */
  return (
    <aside
      ref={arrel}
      className={plegada ? 'sdp-banda-beta sdp-banda-beta--plegada' : 'sdp-banda-beta'}
      aria-label={tx.regio}
      data-sdp-banda-beta={tipusNormalitzat}
      {...(plegable ? { 'data-plegada': plegada ? 'true' : 'false' } : {})}
    >
      {plegada ? null : <p id={plegable ? idText : undefined} className="sdp-banda-beta__text">{tx.text}</p>}
      {plegable ? (
        <button
          type="button"
          className={plegada ? 'sdp-banda-beta__mostra' : 'sdp-banda-beta__plega'}
          aria-expanded={plegada ? 'false' : 'true'}
          aria-controls={plegada ? undefined : idText}
          aria-label={plegada ? undefined : tx.plega}
          title={plegada ? undefined : tx.plega}
          onClick={commutaPlec}
        >
          {plegada ? (
            <>
              <span aria-hidden="true">🧪</span>
              <span>{tx.etiquetaCurta}</span>
              <ChevronDown size={16} aria-hidden="true" focusable="false" />
            </>
          ) : (
            <X size={16} aria-hidden="true" focusable="false" />
          )}
        </button>
      ) : null}
    </aside>
  );
}

export default BandaBetaMicroApp;
