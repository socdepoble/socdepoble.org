/**
 * LlistaConverses.jsx — la llista de FilaConversa amb els seus estats buits.
 * Filtrar i cercar és cosa de qui la munta: ací només es pinta el que arriba.
 */
import FilaConversa from './FilaConversa.jsx';

export default function LlistaConverses({ fils, filActiuId = null, onSelect, locale, t, estatBuit = null, avis = null, carregant = false }) {
  if (avis) {
    return (
      <div className="sdp-workspace-state" role="alert">
        <strong>{t('section.xat.error.llista', "No s'ha pogut carregar el xat")}</strong>
        <p>{avis}</p>
      </div>
    );
  }
  if (!fils.length) {
    if (carregant) {
      return <p className="sdp-workspace-state" role="status" aria-live="polite">{t('section.xat.carregant', 'Carregant…')}</p>;
    }
    return <div className="sdp-workspace-state" role="status">{estatBuit}</div>;
  }
  return (
    <ul className="sdp-xat-llista" aria-label={t('section.xat.llista.titol', 'Converses')}>
      {fils.map((fil) => (
        <li key={fil.id}>
          <FilaConversa
            fil={fil}
            activa={filActiuId != null && String(fil.id) === String(filActiuId)}
            onSelect={onSelect}
            locale={locale}
            t={t}
          />
        </li>
      ))}
    </ul>
  );
}
