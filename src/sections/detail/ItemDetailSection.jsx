import { Navigate, useLocation, useNavigate, useParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useMur } from '../../sections/mur/MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../../sections/notes/NotesDataContext';
import { useMultimedia } from '../../sections/multimedia/MultimediaContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { avatarAutorDElement, buildDetailSectionMeta, portadaDElement } from './detailSectionMeta.jsx';
import { useSEO } from '../../hooks/useSEO.js';
import { objecteDe, rutaConnectarObjecte, tipusDeSeccio } from '../../config/navigation.js';
import { paginaDElement, trobaElement, useElementDeSeccio, useLogoEntitatDElement } from './elementDeSeccio.js';
import { ProveidorSincronitzacioTargetes } from './SincronitzacioTargetes.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { destiDeMultimedia } from '../multimedia/rutesMultimedia.js';

function useSessioSegura() {
  try {
    return useSession();
  } catch {
    return null;
  }
}

/* Onada 0.3 (Gauntlet 261016, M04 i M07; pla 261016_1530) · /multimedia/:id
   ja no és cap pàgina de detall. La ruta continua viva (fils de xat de pàgina,
   el servidor, enllaços copiats) i porta, amb replace i conservant la
   consulta: town-<slug> a /pobles/<slug>, la pàgina canònica del poble, i la
   resta a l'Arxiu amb el visor obert en eixa foto (/multimedia?foto=<id>).
   Sense tocar App.jsx: la ruta `:sectionId/:itemId` arriba ací. És
   determinista en fred (l'id naix a mediaContent.js): no espera cap càrrega. */
export default function ItemDetailSection() {
  const { sectionId, itemId } = useParams();
  const { search } = useLocation();
  const desti = sectionId === 'multimedia' ? destiDeMultimedia(itemId, search) : null;
  if (desti) return <Navigate to={desti} replace />;
  return <DetallDElement />;
}

function DetallDElement() {
  const { events, feedPosts, marketItems } = useMur();
  const { towns } = useCoreContent();
  const { notes, status: estatNotes } = useNotesData();
  const { mediaItems } = useMultimedia();
  const { t } = useUIActions();
  const { rol = null } = useSessioSegura() ?? {};
  const { sectionId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const SECTION_META = buildDetailSectionMeta({ events, feedPosts, marketItems, mediaItems, notes, towns, t, rol });
  const section = SECTION_META[sectionId];
  /* T54 · el mateix resolvedor que el diàleg Connectar i el lector del MAS. */
  const fallbackItem = trobaElement(section, itemId);
  const item = location.state?.preloadedItem || fallbackItem;
  /* Onada 5 (F1, hidratació) · En entrar en fred a /pobles/<slug>, /mur/<id>,
     /mercat/<id>… els proveïdors encara carreguen amb les llistes buides, i el
     detall pintava «Element no trobat» amb la píndola Error. Ara espera amb la
     regla de useElementDeSeccio (la del lector del MAS): només 'loading' és
     carregar; un estat absent no ho és. Les notes (/notes/:id) no són a la
     seua taula de fonts: les mira el seu proveïdor (useNotesData). Quan la
     font acaba ('ready' o 'error') i no hi és, «Element no trobat», com abans. */
  const { estat: estatElement } = useElementDeSeccio(sectionId, itemId);
  const esperant = !item && (estatElement === 'carregant' || (sectionId === 'notes' && estatNotes === 'loading'));
  /* Ordre E del Mestre (261007, prompt 261007_1628) · El logotip que la
     persona va pujar damunt de l'H1 a l'editor de Notes (logo_image), també
     quan és un sdp-media:// que només resol el port. Abans del retorn
     anticipat: és un hook. Sense logo_image, null i cap prop nova.
     `logoEnCami`: el port encara el resol (revisió adversarial del 261007). */
  const { logo: logoPropi, carregant: logoEnCami } = useLogoEntitatDElement(item);

  /* Enxufe universal (260929) · Ací hi havia window.scrollTo({ top: 0 }). A
     Sóc de Poble el document no llisca mai (base.css: html, body, #root i
     .sdp-root amb overflow: hidden; només llisca la columna activa), així que
     a socdepoble.org no feia res, i dins d'un amfitrió (WordPress, Sollutia)
     pujava la finestra de l'amfitrió. Tornar a dalt la columna en canviar
     d'element seria un comportament nou a socdepoble.org (Llei del Píxel). */

  /* T54 · títol, foto, drets (T39), autoria (T4) i data (T40): les mateixes
     props que pinta el lector de connexions del MAS (elementDeSeccio.js).
     Pura: es calcula abans del retorn anticipat perquè també la llig useSEO. */
  const pagina = section && item ? paginaDElement(section, item) : null;

  /* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
     PROHIBIDES (PRIVACITAT).» Relleu 261007 (peça «imatges-detall») · og:image
     i twitter:image (seoHead.js; el detall no passa cap jsonLd) porten la
     portada ja filtrada (pagina.heroImage, el mode estricte de les seccions
     del Mur), mai section.getImage(item) cru: una URL de tercers no acaba al
     <head>. null cau a la imatge base de useSEO.
     Fora del Mur (Pobles, Multimèdia), la mateixa imatge que abans.
     Onada 5 · Mentre s'espera, cap títol (el de sèrie): «No trobat» només quan
     la font ha acabat. La descripció és l'entradilla que pinta la pàgina
     (pagina.lead: la de Viquipèdia d'un poble, que el getSubtitle de Pobles ja
     no porta) i, sense, el subtítol. */
  useSEO({
    title: item ? section?.getTitle?.(item) : (esperant ? null : 'No trobat'),
    description: item ? (pagina?.lead || section?.getSubtitle?.(item)) : '',
    image: pagina ? pagina.heroImage : null
  });

  if (esperant) return <Carregant etiqueta={t('loading.content', 'Carregant contingut del poble...')} />;

  if (!section || !item) {
    /* T63.2 · Sense element no hi ha xat públic (ni el de la ruta, que
       s'enduria el títol «Element no trobat»): Comentar es queda, amb el menú
       de dues vies (261007), i «En públic» queda desactivada i diu per què. Una
       nota (/notes/:id) no en té mai i no es pinta. */
    const senseElement = tipusDeSeccio(sectionId) === 'nota' ? objecteDe({ id: itemId }, sectionId) : null;
    return (
      <UniversalPage
        title={t('section.detail.noFound.title', 'Element no trobat')}
        subtitle={t('section.detail.noFound.subtitle', 'L’enllaç no apunta a cap element existent.')}
        labels={[{ text: 'Error', className: 'sdp-badge-system' }]}
        chrome="system"
        objecte={senseElement}
      >
        <div className="content-wrapper">
          <button type="button" className="sdp-boto sdp-boto--primari" onClick={() => navigate(section?.listPath || '/xat')}>
            {t('common.back', 'Torna')}
          </button>
        </div>
      </UniversalPage>
    );
  }

  /* Lògica d'Usuari (T5): Connectar s'emporta secció, element i autoria
     perquè la nota del MAS sàpia d'on ve. T63.2 · el mateix descriptor diu on
     porta Comentar: el xat comú de l'element; una nota (/notes/:id) no en té
     i el botó no es pinta. El xat porta el nom propi de l'element (el de la
     seua targeta), no l'encapçalament de la pàgina.
     Onada 6 (pla 261009_0245, ítem 4: «El fil de xat específic també es dirà
     'Gent de la Torre'») · Derogat per a Pobles: una secció pot declarar el
     descriptor del seu xat (getObjecteXat), i la de Pobles hi posa el de la
     gent (pobles/xatDelPoble.js · objecteDelPobleXat), el mateix de la
     targeta de /pobles: «Gent de Sella», entre per on s'entre. La resta, com
     abans. */
  const objecte = objecteDe({ ...item, title: section.getTitle(item) || item.title }, sectionId);
  const objecteXat = section.getObjecteXat?.(item)
    || { ...objecte, titol: objecteDe(item, sectionId).titol || objecte.titol };
  /* Esmena 3 del pla 261007_1645 · L'avatar redó de qui signa i el carrusel
     de la portada viuen a detailSectionMeta.jsx (avatarAutorDElement i
     portadaDElement, amb les seues regles escrites al costat): els comparteix
     el lector del MAS (notes/PublicacioDetall.jsx). Derogat el
     showLogos={true} (ordre del Mestre, 261004): pintava el logotip de Sóc de
     Poble a la fitxa de qualsevol persona. La boina continua amb el seu
     avatar (pagina.authorAvatar).
     Decisió 3 (261007) · La secció decidix el mode estricte de l'avatar redó:
     al Mur, un avatar de fora no es pinta i l'H1 va sol, com la silueta de
     la barra taronja de la mateixa pàgina. */
  const avatarAutor = avatarAutorDElement(item, pagina.authorName, section);
  const portadaAmbCarrusel = portadaDElement(section, item, pagina, t);

  return (
    <UniversalPage
      onConnect={() => navigate(rutaConnectarObjecte(objecte))}
      objecte={objecteXat}
      {...pagina}
      {...portadaAmbCarrusel}
      /* Ordre E (261007) · El logotip propi resolt pel port mana sobre el de
         paginaDElement, que només coneix els que es pinten sense el port. */
      {...(logoPropi ? { logoEntitat: logoPropi } : null)}
      /* Revisió adversarial del 261007 · Mentre el port resol el logotip, cap
         avatar: la capçalera no pinta una identitat que el logotip llevarà en
         arribar. Si no es resol, l'avatar torna (la capçalera de sempre). */
      avatarAutor={logoEnCami ? null : avatarAutor}
      chrome="full"
    >
      {/* Ordre del Mestre (261007, «cards de veritat») · Les targetes
          incrustades del cos, sincronitzades amb el seu original. */}
      <ProveidorSincronitzacioTargetes>
        <div className="content-wrapper">
          {/* Onada 6 · { detall: true }: el cos de la pàgina de la ruta. La
              meta de Pobles hi afig la barra de pestanyes, que el lector de
              connexions del MAS (ConnexioDetall, sense l'opció) no pinta. */}
          {section.renderBody(item, { detall: true })}
        </div>
      </ProveidorSincronitzacioTargetes>
    </UniversalPage>
  );
}
