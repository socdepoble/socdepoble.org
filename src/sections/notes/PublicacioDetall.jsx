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
import { dataDElement } from '../../components/universal/editorial.js';
import { autorDe, objecteDe, RUTA_PROJECTE, rutaDePerfilDAutor } from '../../config/navigation.js';
import { useEntitatDelProjecte } from '../../hooks/useEntitatDelProjecte.js';
import { ETIQUETA_SECCIO } from './masDeLUsuari.js';

/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · On porta la barra
 * taronja d'una publicació: la pàgina de qui la signa (rutaDePerfilDAutor,
 * que porta l'entitat pilot al projecte); sense nom propi, la reserva «Sóc de
 * Poble» va al projecte. Un nom sense identitat coneguda no s'endevina: sense
 * enllaç, com a la targeta del Mur.
 */
export function rutaDeLaBarraDeLaPublicacio(publicacio) {
  const deQuiSigna = rutaDePerfilDAutor(publicacio);
  if (deQuiSigna) return deQuiSigna;
  return publicacio?.author_name || publicacio?.seller ? undefined : RUTA_PROJECTE;
}

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
  /* T6 en remot · l'id de servidor de l'entitat pilot: quan arriba, la barra
     de les seues publicacions torna a pintar-se i porta al projecte. */
  useEntitatDelProjecte();
  const { seccio, item: publicacio, ruta } = item?.data || {};
  if (!publicacio) return null;
  const etiqueta = ETIQUETA_SECCIO[seccio] || seccio || 'Publicació';
  /* Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) · Si la
     signa una persona (o la IA), reconeguda per identificador (autorDe), la
     capçalera porta el seu avatar redó davant de l'H1, el mateix de la
     boina. L'entitat del projecte porta el seu logotip per la boina
     (/projecte, PageFrame).
     Correcció dels verificadors (ordre del Mestre, 261004) · Només l'avatar
     de la identitat (author_avatar), mai l'avatar_url de l'element: no és
     l'autoria i al Mercat porta la marca de Sóc de Poble. La boina no canvia. */
  const nomAutor = publicacio.author_name || publicacio.seller || '';
  const avatarCru = typeof publicacio.author_avatar === 'string' ? publicacio.author_avatar : '';
  const avatarAutor = autorDe(publicacio)?.tipus === 'persona' && avatarCru
    ? { src: avatarCru, alt: nomAutor ? `Avatar de ${nomAutor}` : 'Avatar de qui signa' }
    : null;
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
      /* T51 · la data real de la publicació, la mateixa que el seu detall al
         Mur (editorial.js · dataDElement): la de publicació o creació, o la
         d'edició (updated_at) si és posterior. */
      {...dataDElement(publicacio)}
      topBarData={{
        authorName: publicacio.author_name || publicacio.seller || 'Sóc de Poble',
        authorAvatar: publicacio.author_avatar || publicacio.avatar_url || '',
        authorLocation: publicacio.author_location || publicacio.population || publicacio.town_name || '',
        authorHref: rutaDeLaBarraDeLaPublicacio(publicacio)
      }}
      avatarAutor={avatarAutor}
      onConnect={false}
      /* T63.2 · Comentar obri el xat comú de la publicació (Mur, Mercat o
         agenda), el mateix que la seua targeta: mai un de la vista del MAS. */
      objecte={objecteDe(publicacio, seccio)}
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
