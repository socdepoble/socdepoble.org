import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from '../../app/contexts/RouterContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useMur } from '../../sections/mur/MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../../sections/notes/NotesDataContext';
import { useMultimedia } from '../../sections/multimedia/MultimediaContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { avatarAutorDElement, buildDetailSectionMeta, portadaDElement, visorDelCosDElement } from './detailSectionMeta.jsx';
/* T4 (pla 261024_1315, P1-06) · Les fotos del cos, al visor: el mateix mòdul
   del disparador de la portada, que detailSectionMeta.jsx ja porta. */
import { CosAmbVisor } from './VisorDePublicacio.jsx';
import { useSEO } from '../../hooks/useSEO.js';
import { objecteDe, rutaConnectarObjecte, tipusDeSeccio } from '../../config/navigation.js';
import { paginaDElement, trobaElement, useElementDeSeccio, useLogoEntitatDElement } from './elementDeSeccio.js';
import { ProveidorSincronitzacioTargetes } from './SincronitzacioTargetes.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { TEXTOS_MODERACIO } from '../../components/PedraSeca/organismes/textosModeracio.js';
import { destiDeMultimedia } from '../multimedia/rutesMultimedia.js';
/* Pla 261027_1154 (P1-61) · La imatge del <head>: el selector únic (fulla
   sense imports), l'origen públic i la base del Supabase de la capa del
   paquet (la mateixa que llig data/supabase/runtime.js, sense arrossegar-lo). */
import { primeraImatgeSocial } from '../../config/imatgeSocial.js';
import { origenPublic } from '../../config/origenPublic.js';
import { capaDelPaquet } from '../../config/capaDelPaquet.js';

/* Fase D (261020, tasca 2; pla 261020_1300) · Les seccions on la barra
   taronja del detall porta «Més opcions» (denunciar i bloquejar): el
   contingut de la gent. Pobles, Multimèdia i Notes, no. */
const SECCIONS_AMB_MODERACIO = new Set(['mur', 'mercat', 'events']);

/* Pla 261027_1154 (P1-61), Fase 1 · Les seccions on og:image i twitter:image
   són la imatge que l'autor ha triat per a xarxes (og_image, o si no,
   featured_image; Llibre Mestre, P1-61) o, sense, la PRIMERA que veu una
   persona a la galeria o al cos (config/imatgeSocial.js ·
   primeraImatgeSocial), no la portada que es pinta.
   La resta (Notes, que no es compartix, i qualsevol altra) porta la portada
   de sempre (pagina.heroImage). */
const SECCIONS_AMB_IMATGE_SOCIAL = new Set(['mercat', 'mur', 'events', 'pobles']);

/* Pla 261027_1154 (P1-61) · Les opcions d'urlSocialDe al client:
   · l'origen públic (origenPublic) només si és https: el servidor de dev
     (http://localhost) no en fa cap d'absolut i el selector cau a
     socdepoble.org (ORIGEN_SOCIAL_PER_DEFECTE);
   · la base del Supabase de la capa del paquet, per a les fotos del bucket
     públic (sdp-media://mitjans/…);
   · cap origen de tercers permés. */
function opcionsDeLaImatgeSocial() {
  const origen = origenPublic();
  return {
    ...(/^https:\/\//i.test(String(origen || '')) ? { origen } : null),
    supabaseUrl: capaDelPaquet().supabaseUrl,
    permesos: []
  };
}

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
   És determinista en fred (l'id naix a mediaContent.js): no espera cap
   càrrega.
   Gauntlet 261017 (M07, C07) · Conserva també el fragment (#…). A l'App,
   /multimedia/<id> (i amb barra final o camí darrere) ja el porta
   RedireccioMultimedia (App.jsx) abans de la ruta `:sectionId/:itemId`, amb
   el mateix destí: esta és la xarxa de qui munta el detall directament. */
export default function ItemDetailSection() {
  const { sectionId, itemId } = useParams();
  const { search, hash } = useLocation();
  const desti = sectionId === 'multimedia' ? destiDeMultimedia(itemId, search, hash ?? '') : null;
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
  /* Fase D (261020, tasca 2; crítica 261020, 5) · Bloquejar des d'esta
     mateixa pàgina lleva l'element de useMur (MurContext filtra el que has
     bloquejat), i el detall pintava «Element no trobat» amb la píndola
     Error. L'últim element resolt per a este id es recorda (un ajust durant
     el pintat, una vegada per id: una llista que torna objectes nous no el
     fa repetir): si qui el signa està bloquejat, un avís neutre i el camí de
     tornada. Un element arribat per location.state (preloadedItem), que
     MurContext no filtra, també. */
  const moderacio = useModeracio();
  const [darrer, setDarrer] = useState(null);
  if (item && darrer?.itemId !== itemId) setDarrer({ itemId, item });
  const candidatBloquejat = item || (darrer?.itemId === itemId ? darrer.item : null);
  const bloquejat = SECCIONS_AMB_MODERACIO.has(sectionId) && moderacio?.esElementBloquejat?.(candidatBloquejat) === true;
  /* Onada 5 (F1, hidratació) · En entrar en fred a /pobles/<slug>, /mur/<id>,
     /mercat/<id>… els proveïdors encara carreguen amb les llistes buides, i el
     detall pintava «Element no trobat» amb la píndola Error. Ara espera amb la
     regla de useElementDeSeccio (la del lector del MAS): només 'loading' és
     carregar; un estat absent no ho és. Les notes (/notes/:id) no són a la
     seua taula de fonts: les mira el seu proveïdor (useNotesData). Quan la
     font acaba ('ready' o 'error') i no hi és, «Element no trobat», com abans. */
  const { estat: estatElement } = useElementDeSeccio(sectionId, itemId);
  const esperant = !item && (estatElement === 'carregant' || (sectionId === 'notes' && estatNotes === 'loading'));
  /* Pla 261027_0845 (Guarda Nocturna), P1-55 · El logotip propi
     (useLogoEntitatDElement) es resol ara a PaginaDelDetall, davall: només hi
     ha logotip quan hi ha element, i la pàgina viva d'un poble (VistaDelPoble)
     el compartix. */

  /* Enxufe universal (260929) · Ací hi havia window.scrollTo({ top: 0 }). A
     Sóc de Poble el document no llisca mai (base.css: html, body, #root i
     .sdp-root amb overflow: hidden; només llisca la columna activa), així que
     a socdepoble.org no feia res, i dins d'un amfitrió (WordPress, Sollutia)
     pujava la finestra de l'amfitrió. Tornar a dalt la columna en canviar
     d'element seria un comportament nou a socdepoble.org (Llei del Píxel). */

  /* T54 · títol, foto, drets (T39), autoria (T4) i data (T40): les mateixes
     props que pinta el lector de connexions del MAS (elementDeSeccio.js).
     Pura: es calcula abans del retorn anticipat perquè també la llig useSEO.
     Fase D (261020, tasca 2) · Del que has bloquejat, cap: ni la portada
     arriba al <head> (useSEO, més avall). */
  const pagina = section && item && !bloquejat ? paginaDElement(section, item) : null;

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
  /* Fase D (261020, tasca 2) · Del que has bloquejat, ni el títol ni la
     descripció no arriben al <head>: el de sèrie. */
  /* Pla 261027_1154 (P1-61), Fase 1 (ordre del Mestre, 261027) · Derogat en
     part el paràgraf de dalt per al Mercat, el Mur, l'agenda i els Pobles
     (SECCIONS_AMB_IMATGE_SOCIAL): og:image i twitter:image són la imatge que
     ha triat l'autor per a xarxes (og_image, o si no, featured_image) o, si no
     n'hi ha, la PRIMERA que veu una persona a la galeria o al cos, triada pel
     selector únic (primeraImatgeSocial), ja absoluta i https. La portada que es pinta
     no canvia (Llei del Píxel): només canvia el <head>.
       · 'triada' → la seua url;
       · 'bloquejada' (la primera hi és però no es pot servir: SVG, bucket
         privat, URL signada, un altre origen) → null, la targeta genèrica de
         useSEO. Mai la segona foto ni el logotip;
       · 'absent' (cap imatge pròpia: les reserves i l'avatar de qui signa o
         ven no compten) → null.
     Un poble amb la imatge d'un altre origen ja no la porta al <head>: és
     'bloquejada'. La resta de seccions, la portada de sempre. Del que has
     bloquejat (Fase D), com abans, cap: sense pàgina no hi ha imatge.
     Revisió adversarial (261027) · La triada viatja amb el seu alt: el de la
     portada i el carrusel (pagina.heroAlt, el títol), el que sent qui no la
     veu. Sense MIME ni mides: no es lligen dels bytes (01-chica-jersey.png és
     un JPEG). */
  const ambPagina = pagina !== null;
  const portadaDelHead = pagina ? pagina.heroImage : null;
  const altDelHead = pagina ? pagina.heroAlt || pagina.title || null : null;
  const imatgeDelHead = useMemo(() => {
    if (!ambPagina) return null;
    if (!SECCIONS_AMB_IMATGE_SOCIAL.has(sectionId)) return portadaDelHead;
    const social = primeraImatgeSocial(sectionId, item, opcionsDeLaImatgeSocial());
    if (social.estat !== 'triada') return null;
    return altDelHead ? { url: social.url, alt: altDelHead } : social.url;
  }, [ambPagina, sectionId, item, portadaDelHead, altDelHead]);
  /* P1-61 Fase 2 (261028) · Un bloquejat o un «No trobat» diuen «no indexes»:
     seoHead ho llig com a ordre de retirar el head prerenderitzat d'eixa ruta. */
  useSEO({
    title: bloquejat ? null : item ? section?.getTitle?.(item) : (esperant ? null : 'No trobat'),
    description: !bloquejat && item ? (pagina?.lead || section?.getSubtitle?.(item)) : '',
    image: imatgeDelHead,
    index: !(bloquejat || (!item && !esperant))
  });

  if (esperant) return <Carregant etiqueta={t('loading.content', 'Carregant contingut...')} />;

  if (bloquejat) {
    return (
      <UniversalPage title={tradueix(t, TEXTOS_MODERACIO.bloquejatTitol)} chrome="system" objecte={null}>
        <div className="content-wrapper">
          <Alerta to="info">{tradueix(t, TEXTOS_MODERACIO.bloquejatDetall)}</Alerta>
          <Link className="sdp-boto sdp-boto--primari" to={section?.listPath || `/${sectionId}`}>
            {tradueix(t, TEXTOS_MODERACIO.bloquejatTornar)}
          </Link>
        </div>
      </UniversalPage>
    );
  }

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

  return <PaginaDelDetall section={section} sectionId={sectionId} item={item} pagina={pagina} chrome="full" />;
}

/* Pla 261027_0845 (Guarda Nocturna), P1-55 · La pàgina d'un element ja
   resolt, sense cap hook de ruta ni SEO: la pinta la ruta (DetallDElement,
   amb chrome 'full') i la pàgina viva d'un poble fora de la seua ruta
   (VistaDelPoble, davall). És el mateix codi que vivia al final de
   DetallDElement, mogut sense canvis. `senseXat`: el cos sense el botó blau
   del xat (renderBody de Pobles) i la barra blava sense «Comentar». */
function PaginaDelDetall({ section, sectionId, item, pagina, chrome, senseXat = false }) {
  const { t } = useUIActions();
  const navigate = useNavigate();
  /* Ordre E del Mestre (261007, prompt 261007_1628) · El logotip que la
     persona va pujar damunt de l'H1 a l'editor de Notes (logo_image), també
     quan és un sdp-media:// que només resol el port. Sense logo_image, null
     i cap prop nova. `logoEnCami`: el port encara el resol (revisió
     adversarial del 261007). */
  const { logo: logoPropi, carregant: logoEnCami } = useLogoEntitatDElement(item);

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
  /* T4 (pla 261024_1315, P1-06; Gemini G-01) · Les fotos del cos obrin el
     visor (CosAmbVisor): el mateix div.content-wrapper de sempre, cap node
     nou. Fora del Mur i de les notes, null: el contenidor tal qual. */
  const visorDelCos = visorDelCosDElement(section, item, pagina, t);

  return (
    <UniversalPage
      onConnect={() => navigate(rutaConnectarObjecte(objecte))}
      objecte={objecteXat}
      {...pagina}
      {...portadaAmbCarrusel}
      /* T4 (pla 261024_1315; Gemini G-02) · La portada és la candidata a LCP
         de la fitxa: prioritat alta (PageFrame, heroFetchPriority). La del
         visor ja la porta al seu <img> (VisorDePublicacio). */
      heroFetchPriority="high"
      /* Ordre E (261007) · El logotip propi resolt pel port mana sobre el de
         paginaDElement, que només coneix els que es pinten sense el port. */
      {...(logoPropi ? { logoEntitat: logoPropi } : null)}
      /* Revisió adversarial del 261007 · Mentre el port resol el logotip, cap
         avatar: la capçalera no pinta una identitat que el logotip llevarà en
         arribar. Si no es resol, l'avatar torna (la capçalera de sempre). */
      avatarAutor={logoEnCami ? null : avatarAutor}
      /* Fase D (261020, tasca 2) · «Més opcions» a la barra taronja del
         contingut de la gent (SECCIONS_AMB_MODERACIO). */
      ambModeracio={SECCIONS_AMB_MODERACIO.has(sectionId)}
      chrome={chrome}
      /* Pla 261027_0845 (Guarda Nocturna), P1-55 (revisió adversarial) ·
         Amb `senseXat`, tampoc «Comentar» a la barra blava: el xat del poble
         és la mateixa comunitat on ja s'és (UniversalPage: onComment={false}
         vol dir «sense botó»). La ruta no hi passa cap prop nova. */
      {...(senseXat ? { onComment: false } : null)}
    >
      {/* Ordre del Mestre (261007, «cards de veritat») · Les targetes
          incrustades del cos, sincronitzades amb el seu original. */}
      <ProveidorSincronitzacioTargetes>
        <CosAmbVisor className="content-wrapper" {...visorDelCos}>
          {/* Onada 6 · { detall: true }: el cos de la pàgina de la ruta. La
              meta de Pobles hi afig la barra de pestanyes, que el lector de
              connexions del MAS (ConnexioDetall, sense l'opció) no pinta.
              P1-55 · `senseXat` només s'hi afig quan és cert: la ruta crida
              renderBody amb les opcions de sempre. */}
          {section.renderBody(item, senseXat ? { detall: true, senseXat: true } : { detall: true })}
        </CosAmbVisor>
      </ProveidorSincronitzacioTargetes>
    </UniversalPage>
  );
}

/**
 * Pla 261027_0845 (Guarda Nocturna), P1-55 · «Pàgina viva de comunitat»
 * (Llibre Mestre, Fita 19) · La pàgina d'un poble fora de la seua ruta: la
 * columna dreta del Xat la pinta en obrir la comunitat del poble
 * (xat/components/FitxaVivaDeComunitat.jsx). És la de /pobles/<id>
 * (PaginaDelDetall: capçalera, portada, l'entradilla de la Viquipèdia, la
 * província i la comarca, i les pestanyes amb les publicacions i les
 * entitats del poble), amb tres diferències:
 *   · sense useSEO: el <head> és de qui la incrusta. Un segon useSEO,
 *     posterior, guanyaria a seoHead i el Xat perdria el títol i el canònic;
 *   · sense useParams: el poble arriba per `pobleId` (el de la seua fitxa);
 *   · sense el botó blau «Parlar amb la Gent de …» ni «Comentar» (senseXat):
 *     ja s'és al Xat.
 * Mentre la font dels pobles carrega, `carregant`; si el poble no hi és,
 * `senseFitxa`. Qui la incrusta decidix què hi va (al Xat, la columna buida
 * de sempre; mai el poble pilot). Pobles no porta moderació.
 * Revisió adversarial P1-55 · `contenidor`: la classe del contenidor amb
 * scroll de qui la incrusta, que embolica només la pàgina (ni `carregant` ni
 * `senseFitxa`). La pàgina és de layout 'page' (flex: none, utilities.css):
 * no fa scroll per ella mateixa, i a la columna dreta del Xat (overflow:
 * hidden, AppGridShell.css) quedava tallada davall de la portada.
 */
export function VistaDelPoble({ pobleId, chrome = 'context', carregant = null, senseFitxa = null, contenidor = '' }) {
  const { section, item, estat } = useElementDeSeccio('pobles', pobleId);
  if (!section || !item) return estat === 'carregant' ? carregant : senseFitxa;
  const pagina = <PaginaDelDetall section={section} sectionId="pobles" item={item} pagina={paginaDElement(section, item)} chrome={chrome} senseXat />;
  return contenidor ? <div className={contenidor}>{pagina}</div> : pagina;
}
