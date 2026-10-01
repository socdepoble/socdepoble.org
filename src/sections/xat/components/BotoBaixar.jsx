/**
 * BotoBaixar.jsx — el botó redó amb el xebró avall de WhatsApp (torn
 * 260930, T1): ix quan has deixat el fons de la conversa i, si mentrestant
 * han arribat missatges, porta la pastilla amb quants. Prémer-lo baixa al
 * final. L'àncora (.sdp-xat-baixa) no ocupa lloc: el botó hi flota, a la
 * cantonada de baix a la dreta de la llista, damunt del compositor.
 *
 * Nom accessible «Baixa al final»; el recompte en va com a descripció
 * (text, no només el número).
 */
import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export default function BotoBaixar({ nous = 0, onBaixa, t }) {
  const idDescripcio = useId();
  const n = Math.max(0, Number(nous) || 0);
  const mostrat = n > 99 ? '99+' : String(n);
  const text = n === 1
    ? t('section.xat.baixa.nou', '1 missatge nou')
    : t('section.xat.baixa.nous', '{n} missatges nous').replace('{n}', String(n));
  return (
    <div className="sdp-xat-baixa">
      <button
        type="button"
        className="sdp-xat-baixa__boto"
        onClick={onBaixa}
        aria-label={t('section.xat.baixa.etiqueta', 'Baixa al final')}
        aria-describedby={n ? idDescripcio : undefined}
      >
        <ChevronDown size={24} aria-hidden="true" focusable="false" />
        {n ? (
          <>
            <span className="sdp-xat-baixa__pastilla" aria-hidden="true">{mostrat}</span>
            <span className="sdp-nomes-lector" id={idDescripcio}>{text}</span>
          </>
        ) : null}
      </button>
    </div>
  );
}
