/**
 * elementDeSeccio.js — T54 · L'element original d'una secció (Mur, Mercat,
 * agenda, Pobles, Multimèdia) resolt amb sectionId + itemId sobre les dades
 * que ja tenen els proveïdors. Una sola font per a tres llocs:
 *   · ItemDetailSection, la pàgina de detall de la ruta;
 *   · el diàleg Connectar, la mini-card amb la foto de l'original;
 *   · el lector de connexions del MAS (notes/ConnexioDetall.jsx).
 *
 * La imatge es resol ací, en local: no viatja per l'URL de Connectar, i així
 * una URL manipulada no pot colar cap foto a la previsualització.
 *
 * trobaElement i paginaDElement són pures (sense React ni xarxa);
 * useElementDeSeccio només hi afig la lectura dels proveïdors.
 *
 * T71 · useOriginalDeConnexio és el resolvedor únic de l'original d'una
 * connexió: primer l'element d'una secció (useElementDeSeccio, intacte) i,
 * si l'origen no ve de cap secció, la pàgina de text de la seua ruta
 * (text/paginaDeText.js: /ia, /projecte, /page/:slug…). Torna també una
 * `targeta` amb les dades de l'original (títol, imatge, autor, data) per a
 * la fitxa del Bloc i la mini-card de Connectar: quan l'original es resol,
 * manen estes dades, mai les que l'URL de Connectar va escriure a l'origen.
 *
 * Ordre E del Mestre (261007, prompt 261007_1628) · El logotip propi d'un
 * element (logo_image, el que la persona puja damunt de l'H1 a l'editor de
 * Notes): logoEntitatDElement, pur, per als que es pinten sense el port, i
 * useLogoEntitatDElement, que hi afig els sdp-media:// resolts pel port.
 */
import { useMemo } from 'react';
import { useMur } from '../mur/MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useMultimedia } from '../multimedia/MultimediaContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { buildDetailSectionMeta, imatgePropiaDelDetall } from './detailSectionMeta.jsx';
import { rutaDePerfilDAutor } from '../../config/navigation.js';
import { resolveAsset } from '../../config/assetResolver.js';
import {
  COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA, RUTA_CALENDARI, dataDElement, dataHoraDeBarra, rutaCalendariDeLaData
} from '../../components/universal/editorial.js';
import { acteAEsdeveniment } from '../mur/agendaMur.js';
import { DEFAULT_AUTHOR, esAvatarSegur, esMarcaDeLEntitat } from '../../components/universal/UniversalUtils.js';
import { useResolvedAssetState } from '../../hooks/useResolvedAsset.js';
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { pageKeyDeRuta, paginaDeRuta, propsDePaginaDeText } from '../text/paginaDeText.js';
import { nomDeLaGent } from '../pobles/nomsDelPoble.js';

const CAP = Object.freeze([]);

/* D'on ve cada secció que es pot resoldre. Les notes (són d'un MAS aliè),
   els perfils i les pàgines no hi són: el lector hi posa la seua caiguda
   (T71 · les pàgines de text les resol useOriginalDeConnexio, més avall).
   Un Map, no un objecte: un sectionId com «constructor» no casa amb res. */
const FONT_DE_SECCIO = new Map([
  ['mur', 'mur'], ['mercat', 'mur'], ['events', 'mur'], ['pobles', 'core'], ['multimedia', 'media']
]);

/** L'element d'una secció per id o, si cap id no casa, per slug; null si no hi és.
 *  Auditoria 261007 (B) · Abans es tornava el PRIMER element que casava per
 *  id O per slug. El `slug` d'una fila de section_submissions ve del payload
 *  (content.js l'estén sencer) i les files arriben de la més nova a la més
 *  vella: una publicació posterior amb slug igual a l'id d'una altra li feia
 *  ombra i en segrestava el detall, Connectar i el lector del MAS. L'id mana
 *  a tota la llista; el slug només es mira si cap id no hi casa. */
export function trobaElement(section, itemId) {
  if (!Array.isArray(section?.items) || itemId == null || itemId === '') return null;
  const clau = String(itemId);
  return section.items.find((item) => item?.id != null && String(item.id) === clau)
    || section.items.find((item) => item?.slug != null && String(item.slug) === clau)
    || null;
}

/* Ordre E del Mestre (261007, prompt 261007_1628: «no es pot posar el
   logotip damunt de l'H1») · El logotip que la persona puja des de l'editor
   de Notes («Editar logotip», logoImage) arriba a la publicació com a
   `logo_image` (NotesContext · publishNote) i la pàgina publicada el pinta
   per la via c) de PageFrame (logoEntitat), davant de la marca de sèrie (via
   d) i de l'avatar redó (via f). El filtre és el de l'avatar de capçalera de
   PageFrame (esAvatarSegur i esMarcaDeLEntitat): isSafeAsset abans i després
   de resoldre'l (i, des de la Decisió 3 del Mestre del 261007, també el
   mode estricte del Mur: vegeu logoDeSrc), i mai la marca de Sóc de Poble,
   que ja té la seua via amb el clar i el fosc (sola, la negra es perdria en
   el tema fosc).
   Relleu 261007 («Límits» §5) · Ací hi havia còpies de camiDe i de
   esMarcaDeLEntitat (esMarcaDeSocDePoble), perquè PageFrame no les exportava.
   Ara totes dues guardes són d'UniversalUtils.js, amb el mateix cos, i el
   detall, PageFrame i mercat/imatgesDeProducte.js en lligen la mateixa.
   El logoDescrit de PageFrame no valida res: el filtre va abans. */
const DEL_PORT = 'sdp-media://';
const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/* El descriptor logoEntitat d'un src que ja es pot pintar, o null.
   Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT).» Revisió adversarial del 261007 · El logotip
   també és una imatge del Mur (logo_image només el porta una publicació:
   NotesContext · publishNote, sectionId 'mur'), i isSafeAsset admet qualsevol
   https: un logo_image d'un servidor de fora (o un avatar de Google) es
   demanava des de /mur/:id, el lector del MAS i ConnexioDetall. Ara, a més del
   filtre de sempre, el mode estricte (esFontImatgePropia de utils/sanitize.js)
   abans i després de resoldre'l. Tots dos: el que no hi passa queda com abans
   (null i la capçalera de sempre), i un sdp-media:// el continua resolent el
   port (useLogoEntitatDElement). Ho hereten paginaDElement i
   useLogoEntitatDElement, perquè els dos passen per ací. */
function logoDeSrc(valor) {
  const src = textNet(valor);
  if (!src || esMarcaDeLEntitat(src)) return null;
  const resolt = resolveAsset(src);
  if (!esAvatarSegur(src) || !esFontImatgePropia(src) || !esFontImatgePropia(resolt)) return null;
  return { clar: resolt, alt: '' };
}

/** El logotip propi d'un element (logo_image) com a logoEntitat de PageFrame
 *  ({ clar, alt }), o null. Un sdp-media:// no es pot pintar sense el port:
 *  ací torna null i el resol useLogoEntitatDElement. */
export function logoEntitatDElement(item) {
  return logoDeSrc(item?.logo_image);
}

/** logoEntitatDElement, també per a un logo_image sdp-media:// (el resol el
 *  port, useResolvedAssetState, i la URL resolta passa pel mateix filtre):
 *  { logo, carregant }. `logo`, el descriptor o null: mentre es resol, o si
 *  no es pot resoldre, null i la capçalera de sempre. `carregant`, cert només
 *  mentre el port resol un sdp-media://.
 *  Revisió adversarial del 261007 · Sense `carregant`, un lector pintava
 *  l'avatar redó de qui signa (PageFrame, via f) mentre el port resolia el
 *  logotip, i el canviava pel logotip en arribar: la capçalera mostrava una
 *  identitat que no era la triada. Amb `carregant`, el lector calla l'avatar
 *  fins que se sap si hi ha logotip (ItemDetailSection, PublicacioDetall). */
export function useLogoEntitatDElement(item) {
  const valor = textNet(item?.logo_image);
  const delPort = valor.startsWith(DEL_PORT);
  const { url, isLoading } = useResolvedAssetState(delPort ? valor : '');
  return { logo: logoDeSrc(delPort ? url : valor), carregant: delPort && isLoading };
}

/* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT).» La portada i l'avatar de la barra taronja del
   detall passen pel mode estricte del Mur (esFontImatgePropia de
   utils/sanitize.js: cap servidor de tercers, tampoc els avatars OAuth), tant
   el valor que arriba com el resolt (resolveAsset), que és el que demanaria
   la pàgina. El que hi passa torna intacte: es pinta com abans. Un valor buit
   torna tal qual (sense avatar, PageFrame posa el de sèrie, com sempre). Un
   de fora torna null, no undefined: PageFrame no hi posa el logotip de Sóc de
   Poble (signaria amb la marca la publicació d'un veí) i la barra pinta la
   silueta de sempre; sense portada, cap. Ho hereten tots els que lligen estes
   props: ItemDetailSection, el lector del MAS (ConnexioDetall), Connectar i
   les targetes incrustades (targetaDElement, SincronitzacioTargetes).
   Revisió adversarial del 261007 · És una regla del Mur: només les seccions
   que el Mur llig (section_submissions 'mur', 'mercat' i 'events', loadMur de
   data/supabase/content.js). Pobles i Multimèdia queden com abans (Llei del
   Píxel) fins que el Mestre diga si també hi van.
   Relleu 261007 (peça «imatges-detall») · La regla (imatgePropiaDelDetall) és
   ara de detailSectionMeta.jsx, una sola vegada: la lligen també l'avatar redó
   de davant de l'H1, el carrusel, les variacions, og:image i el lector del
   MAS (PublicacioDetall). */

/* Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16) · La
   primera etiqueta del detall és la de la secció. La d'un acte («Agenda»: la
   meta dels actes té per llista /calendari) porta al dia de l'acte al
   Calendari, la vista Mes amb el dia triat, com la de la seua targeta
   (EventCard · etiquetaAgendaDelDia). El dia és el de la insígnia i la
   pastilla de l'acte (EventCard · fontsDeLActe, llegit en hora local amb
   dataHoraDeBarra); EventCard no s'importa ací per no arrossegar el barril de
   Pedra Seca (Esmena 3 del pla 261007_1645). Sense acte vàlid, l'etiqueta de
   sempre. */
function etiquetaDeLaSeccio(section, item) {
  const etiqueta = { text: section.label, className: 'sdp-badge-system' };
  const esdeveniment = section?.listPath === RUTA_CALENDARI ? acteAEsdeveniment(item) : null;
  if (!esdeveniment) return etiqueta;
  const { dateTime } = dataHoraDeBarra({ publicat: esdeveniment.totElDia ? esdeveniment.inici.data : esdeveniment.inici.dataHora });
  const ruta = rutaCalendariDeLaData(typeof dateTime === 'string' ? dateTime.slice(0, 10) : null);
  return ruta === RUTA_CALENDARI ? etiqueta : { ...etiqueta, className: 'sdp-badge-system sp-card-label--enllac', href: ruta };
}

/** Les props de la UniversalPage d'un element: les de la pàgina de detall
 *  (ItemDetailSection), sense les accions ni chrome. L'autoria aporta el logotip. */
export function paginaDElement(section, item) {
  const titol = section.getTitle(item);
  const rutaDAutoria = rutaDePerfilDAutor(item);
  const logoPropi = logoEntitatDElement(item);
  /* Onada 5 (ordre del Mestre, 261008) · Les metes no porten id: un poble es
     reconeix per la seua llista (listPath), com esSeccioDelMur. Abans es
     mirava section.id === 'pobles', que no era cert mai, i la barra taronja
     d'un poble signava amb l'autor de sèrie. */
  const esPoble = section?.listPath === '/pobles';
  let authorName = item.author_name;
  let authorLocation = item.author_location || item.location;
  let authorAvatar = item.author_avatar || item.avatar_url || item.avatarUrl;

  if (esPoble) {
    /* La barra signa com la targeta: l'entitat (la gent del poble) i el
       poble. Les dades manen (l'`author` de la fitxa: la llavor porta el nom
       curt «Gent de la Torre»); si no en porta, la regla única de
       nomsDelPoble.js sobre el nom del poble, no sobre l'H1 (getTitle ja és
       «Gent de …»). Sense nom de poble, l'H1. */
    const nomDelPoble = item.title || item.name || '';
    authorName = authorName || item.author || nomDeLaGent(nomDelPoble) || titol;

    if (!authorLocation) authorLocation = nomDelPoble || titol;
    if (!authorAvatar) authorAvatar = item.avatar_url || item.image_url;
  }

  return {
    title: titol,
    subtitle: section.getSubtitle(item),
    /* Revisió de l'Onada 5 · L'entradilla és la de l'element. Només un poble
       hi posa el seu text (content, el de la Viquipèdia) quan no en porta:
       el content d'una publicació, d'una nota o d'un acte és el cos HTML, que
       ja es pinta davall. */
    lead: esPoble ? (item.entradilla || item.content) : item.entradilla,
    heroImage: imatgePropiaDelDetall(section, section.getImage(item)),
    heroAlt: titol,
    /* Onada 5 (ordre del Mestre, 261008) · Un poble es classifica per la
       província (categoria) i la comarca (etiqueta); la que no porta, no es
       pinta. */
    labels: esPoble
      ? [
        { text: section.label, className: 'sdp-badge-system' },
        { text: textNet(item.provincia), className: 'sdp-badge-category' },
        { text: textNet(item.comarca), className: 'sdp-badge-tag' }
      ].filter((label) => label.text)
      : [
        etiquetaDeLaSeccio(section, item),
        { text: item.id, className: 'sdp-badge-category' }
      ],
    /* T39 · els drets triats a la publicació; el text de sèrie, només si no en porta.
       Onada 5 · El d'un poble és el de la Viquipèdia (CC BY-SA), el de la seua targeta. */
    copyright: item.copyright || (esPoble ? COPYRIGHT_VIQUIPEDIA : COPYRIGHT_SDP),
    authorName,
    authorLocation,
    authorAvatar: imatgePropiaDelDetall(section, authorAvatar),
    /* La marca depén de la identitat declarada, encara que la boina del
       Mercat porte al perfil públic. Cap nom visible dona un logotip.
       Ordre E (261007) · El logotip propi de l'element (logo_image) hi passa
       davant: el que va triar qui publica.
       Onada 5 (ordre del Mestre, 261008) · Un poble porta el logotip de Sóc
       de Poble damunt de l'H1. La barra ja signa amb la gent del poble, i
       PageFrame només el posa sol quan signa Sóc de Poble: cal dir-ho ací. */
    ...(logoPropi ? { logoEntitat: logoPropi }
      : esPoble || rutaDAutoria === DEFAULT_AUTHOR.href ? { logoEntitat: DEFAULT_AUTHOR.logo } : {}),
    /* T4: l'autoria de la barra taronja enllaça al perfil públic de qui signa. */
    authorHref: section.getAuthorHref ? section.getAuthorHref(item) : rutaDAutoria,
    /* T51 · la regla de data viu a editorial.js (pura, sense React). */
    ...dataDElement(item)
  };
}

/**
 * L'element original d'una connexió o d'un enllaç: { section, item, estat }.
 * `estat` és 'trobat', 'carregant' (la seua font encara carrega), 'error' (la
 * seua font no s'ha pogut carregar: no sabem si hi és) o 'absent' (la font és
 * llesta i no hi és, o la secció no es resol ací).
 */
export function useElementDeSeccio(sectionId, itemId) {
  const { events, feedPosts, marketItems, status: estatMur } = useMur();
  const { towns, status: estatCore } = useCoreContent();
  const { mediaItems, status: estatMedia } = useMultimedia();
  const { t } = useUIActions();
  const font = FONT_DE_SECCIO.get(sectionId) || null;
  const section = useMemo(() => (font
    ? buildDetailSectionMeta({ events, feedPosts, marketItems, mediaItems, notes: CAP, towns, t })[sectionId]
    : null), [font, sectionId, events, feedPosts, marketItems, mediaItems, towns, t]);
  const item = trobaElement(section, itemId);
  const estatFont = font === 'mur' ? estatMur : font === 'core' ? estatCore : estatMedia;
  const estatSenseElement = !font ? 'absent'
    : estatFont === 'loading' ? 'carregant'
      : estatFont === 'error' ? 'error' : 'absent';
  const estat = item ? 'trobat' : estatSenseElement;
  return { section, item, estat };
}

const dataDeProps = (props) => ({ time: props.time, date: props.date, dateTime: props.dateTime });

/* La targeta d'un element de secció: el que pinta la seua pàgina de detall
   (paginaDElement). Sense autor declarat, la barra taronja d'eixa pàgina
   signa amb el de sèrie (PageFrame): la targeta diu el mateix, i `propi`
   diu si l'autor ve de l'element.
   T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · I porta on porta la
   barra: la pàgina de qui signa o, amb l'autor de sèrie, la del projecte
   (DEFAULT_AUTHOR.href, el mateix que hi posa PageFrame). Un autor propi
   sense pàgina coneguda, cap ruta. */
function targetaDElement(section, item) {
  const props = paginaDElement(section, item);
  const propi = Boolean(props.authorName);
  return {
    titol: props.title ? String(props.title) : '',
    subtitol: props.subtitle ? String(props.subtitle) : '',
    entradilla: props.lead ? String(props.lead) : '',
    imatge: resolveAsset(props.heroImage || ''),
    autor: { nom: props.authorName || DEFAULT_AUTHOR.name, propi, ruta: props.authorHref || (propi ? null : DEFAULT_AUTHOR.href) },
    data: dataDeProps(props)
  };
}

/* La targeta d'una pàgina de text: les props de TextSection. Una pàgina de
   text no declara autor i la seua barra taronja signa amb el de sèrie.
   T6 (261004) · Derogat per l'ordre del Mestre del 261004 (prompt
   261004_0515): la ruta ja no és null, és la del projecte, la mateixa de la
   barra taronja de la pàgina (PageFrame, DEFAULT_AUTHOR.href). */
function targetaDePagina(page, pageKey, t) {
  const props = propsDePaginaDeText(page, pageKey, t);
  return {
    titol: props.title ? String(props.title) : '',
    subtitol: props.subtitle ? String(props.subtitle) : '',
    entradilla: props.lead ? String(props.lead) : '',
    imatge: props.heroImage || '',
    autor: { nom: DEFAULT_AUTHOR.name, propi: false, ruta: DEFAULT_AUTHOR.href },
    data: dataDeProps(props)
  };
}

/**
 * T71 · L'original d'una connexió (origen de la nota), siga un element d'una
 * secció o una pàgina de text:
 *   { tipus: 'seccio'|'pagina'|null, section, item, page, pageKey, estat, targeta }
 * `estat` com useElementDeSeccio; per a una ruta de pàgina de text que encara
 * no és al contingut, el del contingut core. `targeta` (null si no es
 * resol): { titol, subtitol, entradilla, imatge (resolta), autor: { nom,
 * propi, ruta }, data: { time, date, dateTime } } de l'ORIGINAL.
 */
export function useOriginalDeConnexio(origen) {
  const { section, item, estat: estatElement } = useElementDeSeccio(origen?.sectionId, origen?.itemId);
  const { pageCopy, pages, status: estatCore } = useCoreContent();
  const { t } = useUIActions();
  const ruta = origen?.ruta;
  /* Només si l'origen no ve de cap secció: una ruta no pot fer passar un
     element de secció que no hi és per una pàgina. */
  const senseSeccio = !section;
  const pagina = useMemo(
    () => (senseSeccio ? paginaDeRuta(ruta, { pageCopy, pages }) : null),
    [senseSeccio, ruta, pageCopy, pages]
  );
  const targeta = useMemo(() => {
    if (item) return targetaDElement(section, item);
    if (pagina) return targetaDePagina(pagina.page, pagina.pageKey, t);
    return null;
  }, [section, item, pagina, t]);
  if (item) return { tipus: 'seccio', section, item, page: null, pageKey: null, estat: 'trobat', targeta };
  if (pagina) return { tipus: 'pagina', section: null, item: null, page: pagina.page, pageKey: pagina.pageKey, estat: 'trobat', targeta };
  const esperaPagina = senseSeccio && pageKeyDeRuta(ruta) !== null;
  const estat = !esperaPagina ? estatElement
    : estatCore === 'loading' ? 'carregant'
      : estatCore === 'error' ? 'error' : 'absent';
  return { tipus: null, section, item: null, page: null, pageKey: null, estat, targeta: null };
}
