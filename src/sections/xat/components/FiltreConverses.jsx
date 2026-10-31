/**
 * FiltreConverses.jsx — els quatre filtres de la llista de converses (Tot,
 * No llegits, Preferits, Grups; XAT-A17) com una fila horitzontal de
 * píndoles (P1-36, decisió 3 del Mestre del 261028, que deroga el
 * desplegable de T12/261026_2126). Ordre 0 del Mestre (261030 03:49) · Viuen
 * dins del desplegament de la lupa, davall de la cerca; amb la lupa plegada,
 * XatSection només les pinta amb un filtre diferent de «Tot».
 *
 * Un grup amb nom (role="group") i un botó per filtre amb aria-pressed: la
 * triada és la premuda. Si no hi caben, la fila es desplaça en horitzontal
 * (modules.css, .sdp-xat-pindoles); cada píndola fa --sdp-touch d'alt.
 * `refGrup` i `onBlur` deixen que XatSection sàpia quan el focus hi entra o
 * en ix (la llista de filtres de la cerca no es tanca pel camí).
 * Gauntlet 261030 (cicle 3, ordre0-escape-des-de-les-pindoles) · `idGrup`
 * deixa que la lupa l'anomene a aria-controls, i `onKeyDown` que XatSection
 * hi trate Escape com en la resta del desplegament.
 */
export default function FiltreConverses({ opcions, filtre, onTria, onBlur, onKeyDown, refGrup = null, idGrup, t }) {
  return (
    <div className="sdp-xat-pindoles" role="group" id={idGrup} aria-label={t('section.xat.filtres.etiqueta', 'Filtra les converses')} ref={refGrup} onBlur={onBlur} onKeyDown={onKeyDown}>
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
