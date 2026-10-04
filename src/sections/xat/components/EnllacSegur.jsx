/**
 * EnllacSegur.jsx — un enllaç d'un missatge (XAT-B05): s'obri en una pestanya
 * nova amb rel="noopener noreferrer" i, si el domini porta etiquetes punycode
 * («xn--»), l'avís de domini enganyós al costat.
 *
 * Extret de Bombolla (ordre del Mestre del 261004, prompt 261004_0515, T5)
 * perquè la vista «Contingut multimèdia» pinte els enllaços amb la mateixa
 * peça. El DOM és el que ja pintava la bombolla, byte a byte:
 * <span><a class="sdp-xat-enllac">…</a>[avís]</span>.
 *
 * Cap HTML: `segment` ve de segmentaEnllacos (enllacos.js) i el text es
 * pinta sempre com a node de React.
 *
 * Revisió 261004 (Relleus 4-12) · El host entra a l'avís amb una funció de
 * reemplaçament: amb una cadena, String.replace interpretaria $&, $`, $' i
 * $$ (un hostname WHATWG els admet) i deformaria el domini que l'avís ha
 * de mostrar tal qual.
 */
import { AlertTriangle } from 'lucide-react';

export default function EnllacSegur({ segment, t }) {
  return (
    <span>
      <a className="sdp-xat-enllac" href={segment.href} target="_blank" rel="noopener noreferrer">{segment.text}</a>
      {segment.sospitos ? (
        <span className="sdp-xat-enllac__avis" role="note">
          <AlertTriangle size={14} aria-hidden="true" focusable="false" />
          {t('section.xat.enllac.avis', 'Este enllaç porta a un domini amb caràcters enganyosos ({host}).').replace('{host}', () => segment.host)}
        </span>
      ) : null}
    </span>
  );
}
