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
 *    privat amb l'autor, Onada 8; sense autor, amb Sóc de Poble) i «En
 *    públic» (el xat públic de l'element, pel seu objecte). Cap gestor propi: derogat `onComentarSistema`, que a les
 *    targetes de sistema saltava la via pública.
 *  · L'acció gran de la targeta (accioDeLaTargeta de systemPages.js: «Anar
 *    al xat» a la targeta d'El Xat) va a la ranura `accio` d'UniversalCard,
 *    en lloc de les etiquetes; la resta de la targeta continua obrint la seua
 *    pàgina.
 *
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
 * targetes de la Consola i del Cervell perden el botó gran «Obrir…» (derogat
 * de l'Onada 8, 261009) i porten Categoria i Etiqueta, les `labels` de
 * PAGE_COPY: sense `accio`, UniversalCard ja pinta les etiquetes. El botó
 * continua a la seua pàgina (/page/consola i /page/cervell). Val igual al
 * Calendari i al peu «Ja publicat», que munten esta mateixa targeta.
 *
 * Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT).» La imatge i l'avatar d'una publicació passen pel
 * MODE ESTRICTE (fontImatgePropia de utils/sanitize.js: el mateix origen, el
 * nostre servidor de mitjans i els recursos del paquet, data:image i
 * sdp-media://; cap servidor de tercers, tampoc els avatars de Google,
 * Facebook o GitHub) i es demanen sense referent (`imatgePrivada`
 * d'UniversalCard). Una imatge de fora no es demana: sense portada, la
 * targeta no en pinta cap, i sense avatar, la silueta de sempre
 * (sp-card-avatar--fallback). Els actes, igual (EventCard). La mateixa
 * targeta pinta /calendari i l'històric de l'actor (PublicacionsDeLActor).
 */
import { UniversalCard } from '../../components/PedraSeca';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { EventCard } from '../../components/universal/EventCard';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { resolveAsset } from '../../config/assetResolver';
import {
  autorDe, esRutaInterna, getSectionItemPath, objecteDe, objecteDePagina, RUTA_PERFIL_PROJECTE, rutaConnectarObjecte, rutaDePerfilDAutor
} from '../../config/navigation';
import { COPYRIGHT_SDP, dataDElement } from '../../components/universal/editorial.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { accioDeLaTargeta } from '../../config/systemPages.js';
import { fotoDeLaTargeta } from '../mercat/imatgesDeProducte.js';
import { useEntitatDelProjecte } from '../../hooks/useEntitatDelProjecte.js';
import { fontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac, fotoDelBucketPublic } from '../../utils/mitjaOpac.js';
import { signaturaDeQuiSigna } from '../../data/identitatsSeed.js';

/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · On porta la boina
 * d'una publicació del Mur: la pàgina de qui signa (una persona o una
 * entitat, rutaDePerfilDAutor, que ja porta l'entitat pilot al seu perfil);
 * si no se sap qui és, una pàgina del sistema o una publicació signada amb la
 * reserva «Sóc de Poble» (sense nom propi) van al perfil de Sóc de Poble
 * (RUTA_PERFIL_PROJECTE; Onada 8, 261009: abans, la pàgina del projecte). Un
 * nom sense identitat coneguda no s'endevina: sense enllaç.
 */
export function rutaDeLaBoinaDelMur(item) {
  const deQuiSigna = rutaDePerfilDAutor(item);
  if (deQuiSigna) return deQuiSigna;
  const ambNomPropi = Boolean(item?.author_name || item?.seller);
  return item?.isSystem || !ambNomPropi ? RUTA_PERFIL_PROJECTE : undefined;
}

export function TargetaDelMur({ item, esdeveniment = null }) {
  const { t } = useUIActions();
  const navigate = useNavigate();
  /* T6 en remot · l'id de servidor de l'entitat pilot: quan arriba, la boina
     de les seues publicacions torna a pintar-se i porta al seu perfil. */
  useEntitatDelProjecte();

  if (item.type === 'event') {
    /* T43 (ordre del Mestre, 260928) · el calendari també es connecta amb el seu
       descriptor; T63.2 · i Comentar obri el xat comú de l'acte.
       T5 · la pastilla i la insígnia, del model de l'acte (el mateix
       del Calendari i del filtre ?date=).
       T6 (261004) · la pàgina de qui signa l'acte, si se sap; la reserva i
       el sistema els resol EventCard (components/ no llig navigation.js).
       Gauntlet 261016 (Bloc -1; ordre del Mestre: «sempre la seua foto») ·
       El nom i l'avatar de la persona pilot, ja resolts (signaturaDeQuiSigna):
       EventCard no llig la llavor. Per a qualsevol altre autor, undefined, i
       l'acte es pinta com sempre.
       Revisió del Gauntlet 261017 (ID1, actes) · Derogat en part «com
       sempre»: una altra persona (autorDe) porta null, i EventCard no hi posa
       el logotip de reserva (DEFAULT_AUTHOR): la silueta, la mateixa del
       detall de l'acte (elementDeSeccio.js). L'avatar propi de l'acte
       (author_avatar), si en porta, el pinta EventCard com sempre. Una
       entitat o un acte sense signatura, undefined: el logotip de sempre. */
    const acte = objecteDe(item, 'events');
    const quiSignaLActe = signaturaDeQuiSigna(item);
    const signaPersonaLActe = autorDe(item)?.tipus === 'persona';
    return (
      <EventCard
        item={item}
        esdeveniment={esdeveniment}
        objecte={acte}
        authorHref={rutaDePerfilDAutor(item) || undefined}
        authorName={quiSignaLActe.nom}
        authorAvatar={quiSignaLActe.avatar ?? (signaPersonaLActe ? null : undefined)}
        onConnect={() => navigate(rutaConnectarObjecte(acte))}
        /* Fase D (261020, tasca 2) · «Més opcions»: denunciar i bloquejar. */
        ambModeracio
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
     gran, si en té, en lloc de les etiquetes.
     Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · La
     de la TARGETA (accioDeLaTargeta), que hui només declara El Xat: la
     Consola i el Cervell tenen el botó a la seua pàgina, no ací. */
  const porta = item.isSystem ? accioDeLaTargeta(item.id, t) : null;
  /* Ordre del Mestre (261007) · La foto principal d'un producte és la mateixa
     a les tres superfícies (Mercat, Mur i pàgina): imatgesDeProducte, mai el
     logotip de qui ven. En remot, el mapejador posa el logotip a image_url
     quan el producte no porta image_url ni image, i el Mur el pintava davant
     de la foto. Sense cap foto pròpia, la reserva de sempre. */
  const imatge = item.image_url || item.image || item.images?.[0] || item.imageSrc || '';
  /* Gauntlet 261016 (Bloc -1; ordre del Mestre: «sempre la seua foto
     personal de perfil», mai el logotip verd) · Qui signa, amb el resolutor
     únic (signaturaDeQuiSigna): la persona pilot porta SEMPRE el seu nom i la
     seua foto, també sense avatar (abans queia a DEFAULT_AUTHOR, el quadrat
     verd) o amb el logotip a avatar_url. Qualsevol altre autor, els valors i
     les reserves de sempre.
     Revisió del Gauntlet 261017 (ID1; la mateixa ordre del Mestre i el
     relleu 3: una sessió de veres és UNA identitat a totes les superfícies) ·
     La reserva de la marca (DEFAULT_AUTHOR) només per a qui no signa com a
     persona: una publicació sense signatura, del sistema o d'una entitat.
     Una persona (autorDe) sense cap avatar ja no hi cau: null i la silueta
     de sempre, la mateixa de la targeta del Mercat (targetaDeProducte.js),
     del lector del MAS i de la barra taronja del detall (elementDeSeccio.js).
     Abans el quadrat verd signava al costat del seu nom. */
  const signaPersona = autorDe(item)?.tipus === 'persona';
  const signatura = signaturaDeQuiSigna(item, {
    nom: item.author_name || item.seller || "Sóc de Poble",
    avatar: item.author_avatar || item.avatar_url || (signaPersona ? null : DEFAULT_AUTHOR.avatarUrl)
  });

  return (
    <UniversalCard
      title={item.title || item.name}
      /* T51 · l'emoticona que la nota porta al payload (icon); la
         targeta només la pinta si és un sol emoji. */
      emoticona={item.icon}
      subtitle={item.subtitle}
      body={item.lead || <p className="sp-card-text">{item.description}</p>}
      /* Decisió 3 (261007) · Només una imatge pròpia, resolta (la que es
         demanaria); una de fora, null: cap petició i cap portada. */
      imageUrl={fontImatgePropia(resolveAsset(seccio === 'mercat' ? fotoDeLaTargeta(item, imatge) : imatge))}
      imageAlt={item.imageAlt || item.title || ''}
      imatgePrivada
      author={signatura.nom}
      /* T6 · Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515):
         el sistema ja no porta a /pobles, sinó a la pàgina de qui signa. */
      authorHref={rutaDeLaBoinaDelMur(item)}
      objecte={objecte}
      accio={porta ? <PortaDePagina porta={porta} /> : null}
      onConnect={() => navigate(rutaConnectarObjecte(objecte))}
      /* Decisió 3 (261007) · L'avatar declarat, si és propi. Un de fora (un
         avatar de Google) no cau al logotip de Sóc de Poble, que signaria la
         publicació d'un veí amb la marca: null i la silueta de sempre.
         Onada 8 (261009) · Sense cap avatar, el de Sóc de Poble (el PNG).
         Revisió del Gauntlet 261017 (ID1) · Només si no signa cap persona
         (vegeu signaPersona, dalt).
         Revisió del Gauntlet 261017 (ID2) · Una referència opaca
         (sdp-media://, la foto de perfil pujada a l'app) passa tal qual:
         la resol el port (UniversalCard · useResolvedAsset), com a la barra
         taronja. Abans resolveAsset la convertia en '/sdp-media://…', un camí
         del mateix origen que no carregava res. Continua sent pròpia
         (Decisió 3: fontImatgePropia ja l'admetia).
         Revisió del Gauntlet 261017 (ID2, contrast) · Només la del bucket
         PÚBLIC (AVATAR_DEL_BUCKET_PUBLIC, la regla de fotoPublica a
         autoriaNota.js). Abans hi passava qualsevol referència opaca, també
         sdp-media://mitjans_privats/…, i el client de cada lector demanava al
         port que en signara una URL que només podia obrir la propietària.
         Qualsevol altra referència opaca, null: la silueta, cap petició ni
         cap «/sdp-media://…». La resta, el camí de sempre.
         Contrast final · La regla és la de utils/mitjaOpac.js
         (fotoDelBucketPublic): forma canònica, sense '..' cap al bucket privat. */
      avatarUrl={esMitjaOpac(signatura.avatar)
        ? fotoDelBucketPublic(signatura.avatar)
        : fontImatgePropia(resolveAsset(signatura.avatar))}
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
      /* Auditoria 261007 (B) · Defensa en profunditat: només una ruta de l'app
         (esRutaInterna). Un mainHref de fora en un payload escrit per PostgREST
         navegava la pestanya de l'amfitrió; les pàgines de sistema
         (targetesMur.js) ja porten rutes internes. */
      mainHref={(esRutaInterna(item.mainHref) ? item.mainHref : null) || getSectionItemPath(item.type === 'event' ? 'events' : ((item.type === 'market' || item.type === 'product') ? 'mercat' : (item.type === 'poble' ? 'pobles' : 'mur')), item.id)}
      showPin={item.isAvis}
      /* Fase D (261020, tasca 2) · «Més opcions» (denunciar i bloquejar) a
         tota publicació d'algú; mai a una pàgina del sistema. */
      ambModeracio={!item.isSystem}
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
    />
  );
}
