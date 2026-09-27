/**
 * PublicacioDetall.jsx — una publicació pròpia (Mur, Mercat o agenda) vista
 * des del MAS (T1): fitxa al llistat i lectura a la columna dreta. No és cap
 * nota i no s'edita ací: el botó porta a la publicació de veres.
 */
import { ExternalLink } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { Boto } from '../../components/PedraSeca/index.js';
import { renderRichText } from '../detail/detailRichText.jsx';
import { ETIQUETA_SECCIO } from './masDeLUsuari.js';

/** La fitxa del llistat: la mateixa forma que qualsevol fitxa del gestor. */
export function PublicacioFitxa({ item, active, onSelect }) {
  return (
    <button
      type="button"
      className="sdp-gestor-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={item} titleFallback="Publicació" />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-gestor-fitxa__titol">{item.title}</span>
        {item.subtitle ? <span className="sdp-gestor-fitxa__subtitol">{item.subtitle}</span> : null}
      </span>
    </button>
  );
}

export function PublicacioDetall({ item }) {
  const navigate = useNavigate();
  const { seccio, item: publicacio, ruta } = item?.data || {};
  if (!publicacio) return null;
  const etiqueta = ETIQUETA_SECCIO[seccio] || seccio || 'Publicació';
  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title={item.title}
      subtitle={publicacio.subtitle || undefined}
      lead={item.excerpt || undefined}
      heroImage={item.image || undefined}
      heroAlt={item.title}
      labels={item.labels || []}
      copyright={publicacio.copyright || '© Sóc de Poble'}
      topBarData={{
        authorName: publicacio.author_name || publicacio.seller || 'Sóc de Poble',
        authorAvatar: publicacio.author_avatar || publicacio.avatar_url || '',
        authorLocation: publicacio.author_location || publicacio.population || publicacio.town_name || ''
      }}
      onConnect={false}
    >
      <div className="sdp-alerta__accions">
        <Boto varietat="secundari" icona={ExternalLink} onClick={() => navigate(ruta)}>
          {`Obri al ${etiqueta}`}
        </Boto>
      </div>
      {renderRichText(publicacio.content || publicacio.description || '')}
    </UniversalPage>
  );
}

export default PublicacioDetall;
