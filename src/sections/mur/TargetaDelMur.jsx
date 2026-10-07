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
 *
 * Ordre del Mestre (261007) ·
 *  · «Comentaris = xat» · Comentar és el MATEIX a totes les targetes: el
 *    menú de dues vies d'UniversalCard (useAccions), «En privat» (el xat
 *    privat amb Sóc de Poble) i «En públic» (el xat públic de l'element, pel
 *    seu objecte). Cap gestor propi: derogat `onComentarSistema`, que a les
 *    targetes de sistema saltava la via pública.
 *  · L'acció gran (accioDeLaPagina de systemPages.js: «Anar al xat» a la
 *    targeta d'El Xat) va a la ranura `accio` d'UniversalCard, en lloc de les
 *    etiquetes; la resta de la targeta continua obrint la seua pàgina.
 */
import { UniversalCard } from '../../components/PedraSeca';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { EventCard } from '../../components/universal/EventCard';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { resolveAsset } from '../../config/assetResolver';
import {
  getSectionItemPath, objecteDe, objecteDePagina, RUTA_PROJECTE, rutaConnectarObjecte, rutaDePerfilDAutor
} from '../../config/navigation';
import { COPYRIGHT_SDP, dataDElement } from '../../components/universal/editorial.js';
import { accioDeLaPagina } from '../../config/systemPages.js';
import { fotoDeLaTargeta } from '../mercat/imatgesDeProducte.js';
import { useEntitatDelProjecte } from '../../hooks/useEntitatDelProjecte.js';

/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · On porta la boina
 * d'una publicació del Mur: la pàgina de qui signa (una persona o una
 * entitat, rutaDePerfilDAutor, que ja porta l'entitat pilot al projecte); si
 * no se sap qui és, una pàgina del sistema o una publicació signada amb la
 * reserva «Sóc de Poble» (sense nom propi) van a RUTA_PROJECTE. Un nom sense
 * identitat coneguda no s'endevina: sense enllaç.
 */
export function rutaDeLaBoinaDelMur(item) {
  const deQuiSigna = rutaDePerfilDAutor(item);
  if (deQuiSigna) return deQuiSigna;
  const ambNomPropi = Boolean(item?.author_name || item?.seller);
  return item?.isSystem || !ambNomPropi ? RUTA_PROJECTE : undefined;
}

export function TargetaDelMur({ item, esdeveniment = null }) {
  const { t } = useUIActions();
  const navigate = useNavigate();
  /* T6 en remot · l'id de servidor de l'entitat pilot: quan arriba, la boina
     de les seues publicacions torna a pintar-se i porta al projecte. */
  useEntitatDelProjecte();

  if (item.type === 'event') {
    /* T43 (ordre del Mestre, 260928) · el calendari també es connecta amb el seu
       descriptor; T63.2 · i Comentar obri el xat comú de l'acte.
       T5 · la pastilla i la insígnia, del model de l'acte (el mateix
       del Calendari i del filtre ?date=).
       T6 (261004) · la pàgina de qui signa l'acte, si se sap; la reserva i
       el sistema els resol EventCard (components/ no llig navigation.js). */
    const acte = objecteDe(item, 'events');
    return (
      <EventCard
        item={item}
        esdeveniment={esdeveniment}
        objecte={acte}
        authorHref={rutaDePerfilDAutor(item) || undefined}
        onConnect={() => navigate(rutaConnectarObjecte(acte))}
      />
    );
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
     T63.2 · el mateix descriptor diu quin és el xat públic de Comentar
     (261007, la via «En públic»): el de la publicació, del producte o de la
     pàgina del sistema, si en té. */
  const objecte = item.isSystem
    ? objecteDePagina({ titol: item.title || item.name, ruta: item.mainHref, id: item.id })
    : objecteDe(item, seccio);
  /* Ordre del Mestre (261007) · Una targeta de sistema porta la seua acció
     gran, si en té, en lloc de les etiquetes. */
  const porta = item.isSystem ? accioDeLaPagina(item.id, t) : null;
  /* Ordre del Mestre (261007) · La foto principal d'un producte és la mateixa
     a les tres superfícies (Mercat, Mur i pàgina): imatgesDeProducte, mai el
     logotip de qui ven. En remot, el mapejador posa el logotip a image_url
     quan el producte no porta image_url ni image, i el Mur el pintava davant
     de la foto. Sense cap foto pròpia, la reserva de sempre. */
  const imatge = item.image_url || item.image || item.images?.[0] || item.imageSrc || '';

  return (
    <UniversalCard
      title={item.title || item.name}
      /* T51 · l'emoticona que la nota porta al payload (icon); la
         targeta només la pinta si és un sol emoji. */
      emoticona={item.icon}
      subtitle={item.subtitle}
      body={item.lead || <p className="sp-card-text">{item.description}</p>}
      imageUrl={resolveAsset(seccio === 'mercat' ? fotoDeLaTargeta(item, imatge) : imatge)}
      imageAlt={item.imageAlt || item.title || ''}
      author={item.author_name || item.seller || "Sóc de Poble"}
      /* T6 · Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515):
         el sistema ja no porta a /pobles, sinó a la pàgina de qui signa. */
      authorHref={rutaDeLaBoinaDelMur(item)}
      objecte={objecte}
      accio={porta ? <PortaDePagina porta={porta} /> : null}
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
