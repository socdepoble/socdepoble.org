/**
 * FiltreConverses.jsx — els quatre filtres de la llista de converses (Tot,
 * No llegits, Preferits, Grups; XAT-A17) com una fila horitzontal de
 * píndoles davall de la fila de títol (P1-36, decisió 3 del Mestre del
 * 261028, que deroga el desplegable de T12/261026_2126). Amb la lupa oberta,
 * la cerca ocupa este mateix lloc (XatSection): una sola fila de control.
 *
 * Un grup amb nom (role="group") i un botó per filtre amb aria-pressed: la
 * triada és la premuda. Si no hi caben, la fila es desplaça en horitzontal
 * (modules.css, .sdp-xat-pindoles); cada píndola fa --sdp-touch d'alt.
 */
export default function FiltreConverses({ opcions, filtre, onTria, t }) {
  return (
    <div className="sdp-xat-pindoles" role="group" aria-label={t('section.xat.filtres.etiqueta', 'Filtra les converses')}>
      {opcions.map(([id, clau, alternativa]) => (
        <button
          key={id}
          type="button"
          className="sdp-xat-pindoles__boto"
          aria-pressed={id === filtre}
          onClick={() => onTria(id)}
        >
          {t(clau, alternativa)}
        </button>
      ))}
    </div>
  );
}
