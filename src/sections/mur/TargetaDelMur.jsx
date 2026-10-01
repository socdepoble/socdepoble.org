/**
 * TargetaDelMur.jsx — la targeta d'un element del Mur: un acte (EventCard) o
 * una publicació, un producte o una pàgina del sistema (UniversalCard).
 *
 * Ordre del Mestre, 261001 · La pàgina /calendari pinta les MATEIXES targetes
 * que el Mur. Abans esta peça vivia dins del bucle de MurSection; ara la
 * munten tots dos, i una targeta no pot canviar d'aspecte segons la pàgina
 * on ix. Llei del Píxel: el JSX és el de MurSection, sense cap canvi.
 *
 * `esdeveniment` · el model de l'acte (acteAEsdeveniment) que ja té qui pinta
 * la llista, o null: la pastilla i la insígnia d'un acte són les del model.
 */
import { UniversalCard } from '../../components/PedraSeca';
import { EventCard } from '../../components/universal/EventCard';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { resolveAsset } from '../../config/assetResolver';
import {
  getSectionItemPath, objecteDe, objecteDePagina, rutaConnectarObjecte, rutaDePerfilDAutor
} from '../../config/navigation';
import { COPYRIGHT_SDP, dataDElement } from '../../components/universal/editorial.js';

export function TargetaDelMur({ item, esdeveniment = null }) {
  const { t } = useUIActions();
  const navigate = useNavigate();

  if (item.type === 'event') {
    /* T43 (ordre del Mestre, 260928) · el calendari també es connecta amb el seu
       descriptor; T63.2 · i Comentar obri el xat comú de l'acte.
       T5 · la pastilla i la insígnia, del model de l'acte (el mateix
       del Calendari i del filtre ?date=). */
    const acte = objecteDe(item, 'events');
    return <EventCard item={item} esdeveniment={esdeveniment} objecte={acte} onConnect={() => navigate(rutaConnectarObjecte(acte))} />;
  }
  /* T51 · La pastilla de LECTURA amb el format i el lector únics
     (editorial.js · dataDElement), els mateixos del detall: el dia de
     l'acte, la data triada o la de creació, i una edició de veres si
     és posterior. Cap data inventada: sense cap font real, la targeta
     no porta pastilla (un deute de dades, no de pantalla). */
  const data = dataDElement(item);
  /* Lògica d'Usuari (T4, T5): l'autoria enllaça al perfil públic de qui
     signa, i Connectar s'emporta l'origen sencer cap al MAS. */
  const seccio = (item.type === 'market' || item.type === 'product') ? 'mercat' : 'mur';
  /* T43 (D9) · els avisos del sistema també es connecten: són pàgines
     del sistema, amb la seua ruta, i no porten cap autor inventat.
     T63.2 · el mateix descriptor diu on porta Comentar: el xat comú
     de la publicació, del producte o de la pàgina del sistema. */
  const objecte = item.isSystem
    ? objecteDePagina({ titol: item.title || item.name, ruta: item.mainHref, id: item.id })
    : objecteDe(item, seccio);

  return (
    <UniversalCard
      title={item.title || item.name}
      /* T51 · l'emoticona que la nota porta al payload (icon); la
         targeta només la pinta si és un sol emoji. */
      emoticona={item.icon}
      subtitle={item.subtitle}
      body={item.lead || <p className="sp-card-text">{item.description}</p>}
      imageUrl={resolveAsset(item.image_url || item.image || item.images?.[0] || item.imageSrc || '')}
      imageAlt={item.imageAlt || item.title || ''}
      author={item.author_name || item.seller || "Sóc de Poble"}
      authorHref={item.isSystem ? "/pobles" : rutaDePerfilDAutor(item) || undefined}
      objecte={objecte}
      onConnect={() => navigate(rutaConnectarObjecte(objecte))}
      avatarUrl={resolveAsset(item.author_avatar || item.avatar_url || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')}
      location={item.author_location || item.population || "La Torre de les Maçanes"}
      date={data.date}
      time={data.time}
      dateTime={data.dateTime}
      /* T39 · els drets triats a la publicació (payload.copyright); el
         text de sèrie, només per a la llavor i les d'abans de T39. */
      copyright={item.copyright || COPYRIGHT_SDP}
      calendarBadge={null}
      price={item.price}
      labels={item.labels || [
        {
          text: item.isSystem ? 'Sistema' : ((item.type === 'market' || item.type === 'product') ? 'Mercat' : (item.type || 'Publicació')),
          className: (item.isSystem || item.type === 'market' || item.type === 'product') ? 'sdp-badge-system' : 'sdp-badge-category'
        },
        (item.type === 'market' || item.type === 'product') && item.variations?.length ? { text: `${item.variations.length} ${t('section.mercat.variations', 'variants')}`, className: 'sdp-badge-accent' } : null,
        (item.type === 'market' || item.type === 'product') && item.category_slug ? { text: item.category_slug, className: 'sdp-badge-category' } : null,
        (item.type === 'market' || item.type === 'product') && item.tag ? { text: item.tag, className: 'sdp-badge-tag' } : null
      ].filter(Boolean)}
      mainHref={item.mainHref || getSectionItemPath(item.type === 'event' ? 'events' : ((item.type === 'market' || item.type === 'product') ? 'mercat' : (item.type === 'poble' ? 'pobles' : 'mur')), item.id)}
      showPin={item.isAvis}
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
    />
  );
}
