/**
 * BotoTornarADalt.jsx — «Tornar a dalt» (ordre del Mestre, 261012, vespre:
 * «Afig un botó suau de "Tornar a dalt" (Scroll to top) a la part inferior
 * dreta (damunt de 'Pobles')»).
 *
 * L'àtom només és la pell: botó redó de --sdp-touch amb la fletxa. Qui el
 * munta decidix on va i quan apareix: a la closca (App.jsx, TornarADalt), en
 * compacte i damunt de «Pobles» (layout.css); al catàleg, en el flux de
 * l'espècimen (EspecimenTornarADalt). El nom accessible és l'etiqueta: la
 * fletxa és decorativa.
 */
import { ArrowUp } from 'lucide-react';

export function BotoTornarADalt({ onPuja, etiqueta = 'Tornar a dalt' }) {
  return (
    <button type="button" className="sdp-tornar-dalt" aria-label={etiqueta} onClick={onPuja}>
      <ArrowUp aria-hidden="true" focusable="false" />
    </button>
  );
}
