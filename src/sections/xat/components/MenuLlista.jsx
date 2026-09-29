/**
 * MenuLlista.jsx — el «…» rodó de la fila de títol de la llista (captures
 * 19.11.50 i 19.12.18 de WhatsApp Desktop, onada 3): a l'esquerra del títol i
 * amb una sola opció, «Seleccionar xats» (una marca dins d'un cercle).
 *
 * El «⋯» de la capçalera de la CONVERSA oberta (Seleccionar missatges, per al
 * Retall) és un altre menú i viu a CapcaleraConversa.jsx.
 *
 * El mateix patró que FiltreConverses i CapcaleraConversa: role=menu amb
 * menuitem, es tanca en triar, en clicar fora o amb Escape, sense tocar
 * document.body. En obrir-lo el focus entra a l'opció; en tancar-lo amb
 * Escape torna al botó (i l'Escape queda consumit). `refBoto` deixa que qui
 * el munta hi torne el focus quan acaba la selecció de xats.
 */
import { useEffect, useRef, useState } from 'react';
import { CircleCheck, Ellipsis } from 'lucide-react';

export default function MenuLlista({ onSeleccionar, t, refBoto = null }) {
  const [obert, setObert] = useState(false);
  const ref = useRef(null);
  const botoPropi = useRef(null);
  const botoRef = refBoto || botoPropi;
  const opcioRef = useRef(null);

  useEffect(() => {
    if (!obert) return undefined;
    opcioRef.current?.focus();
    const node = ref.current;
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setObert(false); };
    const tancaEsc = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setObert(false);
      botoRef.current?.focus();
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [obert, botoRef]);

  const etiqueta = t('section.xat.mesOpcions', 'Més opcions');

  return (
    <div className="sdp-xat-menu-llista" ref={ref}>
      <button
        ref={botoRef}
        type="button"
        className="sdp-xat-mes"
        aria-label={etiqueta}
        title={etiqueta}
        aria-haspopup="menu"
        aria-expanded={obert}
        onClick={() => setObert((estava) => !estava)}
      >
        <Ellipsis size={24} aria-hidden="true" focusable="false" />
      </button>
      {obert ? (
        <div className="sdp-xat-menu sdp-xat-menu--esquerra" role="menu" aria-label={etiqueta}>
          <button
            ref={opcioRef}
            type="button"
            role="menuitem"
            className="sdp-xat-menu__item"
            onClick={() => { setObert(false); onSeleccionar?.(); }}
          >
            <CircleCheck size={20} aria-hidden="true" focusable="false" />
            {t('section.xat.seleccio.xats', 'Seleccionar xats')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
