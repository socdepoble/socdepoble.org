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
 */
import { useMemo } from 'react';
import { useMur } from '../mur/MurContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useMultimedia } from '../multimedia/MultimediaContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { buildDetailSectionMeta } from './detailSectionMeta.jsx';
import { rutaDePerfilDAutor } from '../../config/navigation.js';
import { resolveAsset } from '../../config/assetResolver.js';
import { COPYRIGHT_SDP, dataDElement } from '../../components/universal/editorial.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { pageKeyDeRuta, paginaDeRuta, propsDePaginaDeText } from '../text/paginaDeText.js';

const CAP = Object.freeze([]);

/* D'on ve cada secció que es pot resoldre. Les notes (són d'un MAS aliè),
   els perfils i les pàgines no hi són: el lector hi posa la seua caiguda
   (T71 · les pàgines de text les resol useOriginalDeConnexio, més avall).
   Un Map, no un objecte: un sectionId com «constructor» no casa amb res. */
const FONT_DE_SECCIO = new Map([
  ['mur', 'mur'], ['mercat', 'mur'], ['events', 'mur'], ['pobles', 'core'], ['multimedia', 'media']
]);

/** L'element d'una secció per id o per slug; null si no hi és. */
export function trobaElement(section, itemId) {
  if (!Array.isArray(section?.items) || itemId == null || itemId === '') return null;
  const clau = String(itemId);
  return section.items.find((item) => (item?.id != null && String(item.id) === clau)
    || (item?.slug != null && String(item.slug) === clau)) || null;
}

/** Les props de la UniversalPage d'un element: les de la pàgina de detall
 *  (ItemDetailSection), sense les del marc (Connectar, logos i chrome). */
export function paginaDElement(section, item) {
  const titol = section.getTitle(item);
  let authorName = item.author_name;
  let authorLocation = item.author_location || item.location;
  let authorAvatar = item.author_avatar || item.avatar_url || item.avatarUrl;

  if (section.id === 'pobles' && !authorName) {
    if (titol === 'La Torre de les Maçanes') authorName = 'Gent de La Torre';
    else if (/^[aeiouhàèéíòóú]/i.test(titol)) authorName = `Gent d'${titol}`;
    else authorName = `Gent de ${titol}`;
    
    if (!authorLocation) authorLocation = titol;
    if (!authorAvatar) authorAvatar = item.avatar_url || item.image_url;
  }

  return {
    title: titol,
    subtitle: section.getSubtitle(item),
    lead: item.entradilla,
    heroImage: section.getImage(item),
    heroAlt: titol,
    labels: [
      { text: section.label, className: 'sdp-badge-system' },
      { text: item.id, className: 'sdp-badge-category' }
    ],
    /* T39 · els drets triats a la publicació; el text de sèrie, només si no en porta. */
    copyright: item.copyright || COPYRIGHT_SDP,
    authorName,
    authorLocation,
    authorAvatar,
    /* T4: l'autoria de la barra taronja enllaça al perfil públic de qui signa. */
    authorHref: rutaDePerfilDAutor(item),
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
   diu si l'autor ve de l'element. */
function targetaDElement(section, item) {
  const props = paginaDElement(section, item);
  return {
    titol: props.title ? String(props.title) : '',
    subtitol: props.subtitle ? String(props.subtitle) : '',
    entradilla: props.lead ? String(props.lead) : '',
    imatge: resolveAsset(props.heroImage || ''),
    autor: { nom: props.authorName || DEFAULT_AUTHOR.name, propi: Boolean(props.authorName), ruta: props.authorHref || null },
    data: dataDeProps(props)
  };
}

/* La targeta d'una pàgina de text: les props de TextSection. Una pàgina de
   text no declara autor i la seua barra taronja signa amb el de sèrie. */
function targetaDePagina(page, pageKey, t) {
  const props = propsDePaginaDeText(page, pageKey, t);
  return {
    titol: props.title ? String(props.title) : '',
    subtitol: props.subtitle ? String(props.subtitle) : '',
    entradilla: props.lead ? String(props.lead) : '',
    imatge: props.heroImage || '',
    autor: { nom: DEFAULT_AUTHOR.name, propi: false, ruta: null },
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
