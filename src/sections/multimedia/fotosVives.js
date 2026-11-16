import { buildSearchText, firstMediaSource, toMediaDescription } from '../../config/contentHelpers.js';
import { metadadesDeCommons } from './origenImatges.js';

/* Onada R30.2 · Oxigen d'arrencada del paquet de l'amfitrió · Les cinc funcions
   pures de derivació i fusió de fotos vives viuen ací sense importar la llavor
   estàtica (MARKET_ITEMS, FEED_POSTS, TOWNS, LEGACY_MEDIA), de manera que
   MultimediaProvider no arrossega poblesAplecViquipedia.js ni feedSeed.js al
   tros d'entrada; mediaContent.js les reexporta intactes per a la llavor i SQL. */

const idDeLArticle = (item, index) => (item?.id != null && String(item.id) !== '' ? String(item.id) : String(index));

const fontDeclarada = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? { source: valor } : {});

const MARQUES_DE_PERSONA = Object.freeze(['ownerUserId', 'owner_user_id', 'author_user_id']);
const dadaPropia = (objecte, clau) => {
  const descriptor = Object.getOwnPropertyDescriptor(objecte, clau);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
};
function proteccioDeLArticle(item) {
  const proteccio = {};
  for (const clau of ['translation_mode', 'source_language']) {
    const valor = dadaPropia(item, clau);
    if (valor !== undefined) proteccio[clau] = valor;
  }
  const visibilitat = dadaPropia(item, 'visibility');
  if (Object.hasOwn(item, 'visibility') && visibilitat !== 'public') proteccio.visibility = typeof visibilitat === 'string' && visibilitat ? visibilitat : 'members';
  else if (MARQUES_DE_PERSONA.some((clau) => Object.hasOwn(item, clau))) proteccio.visibility = 'members';
  return proteccio;
}

/** Les fotos de les publicacions del Mur (la portada de cada una). */
export const fotosDelMur = (publicacions) => publicacions
  .map((item, index) => {
    const src = firstMediaSource(item.image_url || item.image);
    if (!src || /\/logo[-_][^/]+$/i.test(src)) return null;
    return {
      id: `feed-${idDeLArticle(item, index)}`,
      title: item.title || 'Mur',
      subtitle: item.post_subtitle || item.author || 'Mur',
      description: toMediaDescription(item.content || item.description),
      src,
      kind: 'image',
      tag: 'Mur',
      ...fontDeclarada(item.author),
      created_at: item.created_at,
      sectionId: 'multimedia',
      article: { sectionId: 'mur', id: item.id },
      ...proteccioDeLArticle(item),
      searchText: buildSearchText([item.title, item.post_subtitle, item.content, item.author, 'Mur'])
    };
  })
  .filter(Boolean);

/** La foto principal de cada producte del Mercat. */
export const fotosDelMercat = (productes) => productes
  .map((item, index) => {
    const deQuiVen = [item.avatar_url, item.author_avatar];
    const src = [item.images, item.image_url, item.image]
      .map(firstMediaSource)
      .find((candidat) => candidat && !deQuiVen.includes(candidat));
    if (!src) return null;
    const quiVen = item.author_name || item.seller;
    return {
      id: `market-${idDeLArticle(item, index)}`,
      title: item.title || 'Mercat',
      subtitle: quiVen || 'Mercat',
      description: toMediaDescription(item.subtitle),
      src,
      kind: 'image',
      tag: 'Mercat',
      ...fontDeclarada(quiVen),
      created_at: item.created_at,
      sectionId: 'multimedia',
      article: { sectionId: 'mercat', id: item.id },
      ...proteccioDeLArticle(item),
      searchText: buildSearchText([item.title, item.subtitle, item.seller, 'Mercat'])
    };
  })
  .filter(Boolean);

/** La foto de cada poble (la de la seua fitxa). */
export const fotosDelsPobles = (pobles) => pobles.map((town) => ({
  id: `town-${town.id}`,
  title: town.title,
  subtitle: town.post_subtitle || town.type,
  description: town.content || '',
  src: town.image_url,
  kind: 'image',
  tag: 'Poble',
  source: town.title,
  ...metadadesDeCommons(town.wikipedia_provenance?.photo),
  created_at: town.created_at,
  sectionId: 'multimedia',
  article: { sectionId: 'pobles', id: town.id },
  searchText: buildSearchText([town.title, town.post_subtitle, town.content, 'Poble'])
}));

/** La foto de cada acte de l'Agenda (el cartell). */
export const fotosDeLAgenda = (actes) => actes
  .map((item, index) => {
    const deQuiSigna = [item.avatar_url, item.author_avatar];
    const src = [item.images, item.image_url, item.imageSrc, item.image]
      .map(firstMediaSource)
      .find((candidat) => candidat && !deQuiSigna.includes(candidat));
    if (!src) return null;
    return {
      id: `event-${idDeLArticle(item, index)}`,
      title: item.title || 'Agenda',
      subtitle: item.subtitle || item.author_name || 'Agenda',
      description: toMediaDescription(item.entradilla || item.description),
      src,
      kind: 'image',
      tag: 'Agenda',
      ...fontDeclarada(item.author_name),
      created_at: item.created_at || item.publish_date || null,
      sectionId: 'multimedia',
      article: { sectionId: 'events', id: item.id },
      ...proteccioDeLArticle(item),
      searchText: buildSearchText([item.title, item.subtitle, item.author_name, 'Agenda'])
    };
  })
  .filter(Boolean);

const ID_POSICIONAL = /^(market|feed)-\d+$/;
const SECCIO_DEL_PREFIX = Object.freeze({ market: 'mercat', feed: 'mur' });

function seccioRancia(item) {
  if (!item || item.article) return null;
  const trossos = ID_POSICIONAL.exec(String(item.id ?? ''));
  return trossos ? SECCIO_DEL_PREFIX[trossos[1]] : null;
}

const textNet = (valor) => (valor == null ? '' : String(valor).trim());
const signatura = (seccio, item) => (textNet(item?.title) ? `${seccio}|${textNet(item.title)}|${textNet(item.created_at)}` : null);

const noEsFotoDArticle = (src) => typeof src === 'string'
  && (/^\/assets\/system\//.test(src) || /\.svg(?:[?#].*)?$/i.test(src) || /\/avatars?\//i.test(src));

/** Els mitjans del port i, darrere, les fotos vives deduplicades per id, src i article. */
export function fusionaMitjans(delPort, vives, { alies = null } = {}) {
  const canonic = (src) => (alies && typeof alies.get === 'function' && alies.get(src)) || src;
  const port = (delPort || []).filter(Boolean);
  const idsDelPort = new Set(port.filter((item) => item.id != null).map((item) => String(item.id)));
  const srcsDelPort = new Set(port.filter((item) => item.src).map((item) => canonic(item.src)));
  const perSignatura = new Map();
  const perId = new Map();
  for (const item of vives || []) {
    const seccio = item?.article?.sectionId;
    const clau = item?.src && seccio ? signatura(seccio, item) : null;
    if (clau && !perSignatura.has(clau)) perSignatura.set(clau, item);
    if (item?.src && seccio && item.id != null && !perId.has(String(item.id))) perId.set(String(item.id), item);
  }

  const ids = new Set();
  const srcs = new Set();
  const eixida = [];
  const afig = (item) => {
    eixida.push(item);
    if (item.id != null) ids.add(String(item.id));
    if (item.src) {
      srcs.add(item.src);
      srcs.add(canonic(item.src));
    }
  };
  const jaHiEs = (item) => (item.id != null && ids.has(String(item.id))) || srcs.has(item.src) || srcs.has(canonic(item.src));

  for (const item of port) {
    const mateixa = !item.article && item.id != null ? perId.get(String(item.id)) : null;
    if (mateixa) {
      if (!jaHiEs(mateixa)) afig(mateixa);
      continue;
    }
    const seccio = seccioRancia(item);
    if (seccio) {
      const clau = signatura(seccio, item);
      const viva = clau ? perSignatura.get(clau) : null;
      if (viva) {
        const alPort = (viva.id != null && idsDelPort.has(String(viva.id))) || srcsDelPort.has(canonic(viva.src));
        if (!alPort && !jaHiEs(viva)) afig(viva);
        continue;
      }
      if (noEsFotoDArticle(item.src)) continue;
    }
    afig(item);
  }
  for (const item of vives || []) {
    if (!item?.src || jaHiEs(item)) continue;
    afig(item);
  }
  return eixida;
}
