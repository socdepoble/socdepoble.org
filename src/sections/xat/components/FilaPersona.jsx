/**
 * FilaPersona.jsx — una persona del padró del poble dins de «Conversa nova».
 * Mateixa geometria que FilaConversa perquè la llista no bote en canviar.
 *
 * Lògica d'Usuari (T2, T3): el padró també porta entitats i la IAIA; la fila
 * diu de quin tipus és cadascú en lloc de fer com si tot foren persones.
 */
import CaraXat from './CaraXat.jsx';

function etiquetaDeTipus(tipus, t) {
  if (tipus === 'entitat') return t('section.xat.padro.entitat', 'Entitat o empresa');
  if (tipus === 'ia') return t('section.xat.padro.ia', 'Intel·ligència artificial');
  return null;
}

export default function FilaPersona({ membre, obrint = false, onSelect, t }) {
  const nom = membre.nom || t('section.xat.memberFallback', 'Membre de la comunitat');
  let estat = membre.fil_id ? t('section.xat.padro.obrir', 'Obrir') : t('section.xat.padro.nou', 'Nou');
  if (obrint) estat = t('section.xat.padro.obrint', 'Obrint…');
  if (membre.noDisponible) estat = t('section.xat.padro.noDisponible', 'No disponible');
  const tipus = etiquetaDeTipus(membre.tipus, t);
  const conversa = membre.noDisponible
    ? t('section.xat.padro.ajudaPendent', 'Este contacte encara no està connectat al xat del poble.')
    : membre.fil_id
    ? t('section.xat.padro.jaOberta', 'Ja teniu una conversa oberta.')
    : t('section.xat.padro.encaraNo', 'Encara no heu parlat.');
  return (
    <button
      type="button"
      className="sdp-xat-fila"
      aria-busy={obrint || undefined}
      disabled={membre.noDisponible || obrint}
      onClick={() => onSelect(membre)}
    >
      <CaraXat nom={nom} src={membre.avatar_url} mida="md" llavor={membre.usuari_id} alt="" />
      <span className="sdp-xat-fila__cos">
        <span className="sdp-xat-fila__cap">
          <span className="sdp-xat-fila__nom">{nom}</span>
          <span className="sdp-xat-fila__hora">{estat}</span>
        </span>
        <span className="sdp-xat-fila__peu">
          <span className="sdp-xat-fila__previa">{tipus ? `${tipus} · ${conversa}` : conversa}</span>
        </span>
      </span>
    </button>
  );
}
