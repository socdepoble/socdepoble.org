/**
 * BarraResposta.jsx — la barra de «Respon» damunt del camp d'escriure (torn
 * 260930, T1), com a WhatsApp: qui va escriure el missatge («Tu» si és teu)
 * i el seu text retallat a una línia, amb la ✕ que cancel·la la resposta.
 * Escape dins del compositor fa el mateix (Compositor, onEscapa).
 */
import { X } from 'lucide-react';
import { autorDeCita, textDeCita } from '../conversa.js';

export default function BarraResposta({ missatge, onCancela, t }) {
  if (!missatge) return null;
  const autor = autorDeCita(missatge, t);
  return (
    <div
      className="sdp-xat-resposta"
      role="group"
      aria-label={t('section.xat.resposta.barra', 'Resposta a {autor}').replace('{autor}', autor)}
    >
      <div className="sdp-xat-resposta__cita">
        <span className="sdp-xat-resposta__autor">{autor}</span>
        <span className="sdp-xat-resposta__text">{textDeCita(missatge, t)}</span>
      </div>
      <button
        type="button"
        className="sdp-xat-icona"
        onClick={onCancela}
        aria-label={t('section.xat.resposta.cancela', 'Cancel·la la resposta')}
      >
        <X size={20} aria-hidden="true" focusable="false" />
      </button>
    </div>
  );
}
