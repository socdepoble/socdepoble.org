/**
 * BotoInformaDUnError.jsx — Onada 6 (prompt 261009_0230, punt 4) · L'accés
 * dels beta testers per a informar d'un error, al final de la columna de
 * llista (LlistaConverses, `peu`): darrere de l'última conversa, o davall de
 * l'avís si la llista no s'ha pogut carregar o és buida. Amb moltes converses
 * cal baixar fins al final per a vore'l. Una píndola secundària del Xat
 * (.sdp-xat-pindola--secundaria, zona tàctil --sdp-touch) amb l'escarabat i
 * el text: obri la conversa amb l'esborrany de l'informe (useInformaDUnError).
 * Mentre l'obri, aria-busy i desactivada.
 * Revisió 261009 · Si la conversa no s'ha pogut obrir, `reserva`
 * ({ informe, correu }) ensenya una nota i dues eixides perquè l'informe no
 * es perda: «Copia l'informe» (onCopia) i «Envia'l per correu» (l'enllaç
 * mailto: a l'adreça pública del projecte). La nota viu en una regió
 * role="status" sempre muntada (buida i només per al lector de pantalla
 * mentre no hi ha reserva), perquè el lector l'anuncie en aparéixer.
 */
import { Bug, Copy, Mail } from 'lucide-react';
import { CORREU_DE_RESERVA } from '../informeDError.js';

export default function BotoInformaDUnError({ onPrem, obrint = false, reserva = null, onCopia, t }) {
  const nota = reserva
    ? t('section.xat.informe.reserva', "No s'ha pogut obrir el xat. Copia l'informe o envia'l per correu a {correu}.").replace('{correu}', CORREU_DE_RESERVA)
    : '';
  return (
    <>
      <button
        type="button"
        className="sdp-xat-pindola sdp-xat-pindola--secundaria sdp-xat-informe"
        onClick={onPrem}
        disabled={obrint}
        aria-busy={obrint || undefined}
      >
        <Bug size={20} aria-hidden="true" focusable="false" />
        <span>{t('section.xat.informe.boto', "Informa d'un error")}</span>
      </button>
      <p className={reserva ? 'sdp-xat-informe__nota' : 'sdp-nomes-lector'} role="status">{nota}</p>
      {reserva ? (
        <div className="sdp-xat-informe__reserva">
          <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={onCopia}>
            <Copy size={20} aria-hidden="true" focusable="false" />
            <span>{t('section.xat.informe.copia', "Copia l'informe")}</span>
          </button>
          <a className="sdp-xat-pindola sdp-xat-pindola--secundaria" href={reserva.correu}>
            <Mail size={20} aria-hidden="true" focusable="false" />
            <span>{t('section.xat.informe.correu', "Envia'l per correu")}</span>
          </a>
        </div>
      ) : null}
    </>
  );
}
