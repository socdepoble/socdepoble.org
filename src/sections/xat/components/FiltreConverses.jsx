/**
 * FiltreConverses.jsx — els quatre filtres de la llista de converses (Tot,
 * No llegits, Preferits, Grups; XAT-A17) dins d'un desplegable darrere d'una
 * icona de filtre a la mateixa línia de la cerca (ordre del Mestre, 260927,
 * T12): la fila de píndoles gastava una fila sencera de la llista.
 *
 * La icona s'il·lumina quan hi ha un filtre que no és «Tot» i el seu nom
 * accessible ho diu. El menú és una llista de `menuitemradio` amb la triada
 * marcada; es tanca en triar, en clicar fora o amb Escape, sense tocar
 * document.body (el mateix patró que el menú «⋯» de la capçalera).
 */
import { useEffect, useRef, useState } from 'react';
import { Check, ListFilter } from 'lucide-react';

export default function FiltreConverses({ opcions, filtre, onTria, t }) {
  const [obert, setObert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!obert) return undefined;
    const node = ref.current;
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setObert(false); };
    /* L'Escape que tanca el menú queda consumit: la selecció de xats, que
       també l'escolta, no l'ha de rebre dos vegades (XatSection). */
    const tancaEsc = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setObert(false);
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [obert]);

  const etiqueta = t('section.xat.filtres.etiqueta', 'Filtra les converses');
  const actiu = opcions.find(([id]) => id === filtre);
  const hiHaFiltre = Boolean(actiu) && filtre !== 'tot';
  const nomBoto = hiHaFiltre ? `${etiqueta} (${t(actiu[1], actiu[2])})` : etiqueta;

  return (
    <div className="sdp-xat-filtre" ref={ref}>
      <button
        type="button"
        className={`sdp-xat-icona sdp-xat-filtre__boto${hiHaFiltre ? ' sdp-xat-filtre__boto--actiu' : ''}`}
        aria-label={nomBoto}
        title={nomBoto}
        aria-haspopup="menu"
        aria-expanded={obert}
        onClick={() => setObert((estava) => !estava)}
      >
        <ListFilter size={24} aria-hidden="true" focusable="false" />
      </button>
      {obert ? (
        <div className="sdp-xat-menu sdp-xat-filtre__menu" role="menu" aria-label={etiqueta}>
          {opcions.map(([id, clau, alternativa]) => {
            const triat = id === filtre;
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={triat}
                className="sdp-xat-menu__item"
                onClick={() => { onTria(id); setObert(false); }}
              >
                {triat
                  ? <Check size={20} aria-hidden="true" focusable="false" />
                  : <span className="sdp-xat-menu__buit" aria-hidden="true" />}
                {t(clau, alternativa)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
