/**
 * FilaPersona.jsx — una persona del padró del poble dins de «Conversa nova».
 * Mateixa geometria que FilaConversa perquè la llista no bote en canviar.
 */
import { Avatar } from '../../../components/PedraSeca/index.js';

export default function FilaPersona({ membre, obrint = false, onSelect, t }) {
  const nom = membre.nom || t('section.xat.memberFallback', 'Membre de la comunitat');
  let estat = membre.fil_id ? t('section.xat.padro.obrir', 'Obrir') : t('section.xat.padro.nou', 'Nou');
  if (obrint) estat = t('section.xat.padro.obrint', 'Obrint…');
  return (
    <button
      type="button"
      className="sdp-xat-fila"
      aria-busy={obrint || undefined}
      onClick={() => onSelect(membre)}
    >
      <Avatar nom={nom} src={membre.avatar_url} mida="md" llavor={membre.usuari_id} alt="" />
      <span className="sdp-xat-fila__cos">
        <span className="sdp-xat-fila__cap">
          <span className="sdp-xat-fila__nom">{nom}</span>
          <span className="sdp-xat-fila__hora">{estat}</span>
        </span>
        <span className="sdp-xat-fila__peu">
          <span className="sdp-xat-fila__previa">
            {membre.fil_id
              ? t('section.xat.padro.jaOberta', 'Ja teniu una conversa oberta.')
              : t('section.xat.padro.encaraNo', 'Encara no heu parlat.')}
          </span>
        </span>
      </span>
    </button>
  );
}
