import { buildSearchText, firstMediaSource, toMediaDescription } from '../../config/contentHelpers.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { FEED_POSTS } from '../mur/feedContent.js';
import { TOWNS } from '../pobles/townsContent.js';
import { LEGACY_MEDIA } from './legacyMedia.js';

/* Onada 12 (261011; ordres 261011_0130, punt 1) · «Hi ha dos Mac Mini.» El
   segon eixia d'ací: cada producte del Mercat feia una entrada de Multimèdia
   amb el seu títol i la seua descripció SENCERA, i de foto, l'avatar_url (el
   logotip de qui ven), perquè la llavor porta les fotos a `images` i ací només
   es llegia image_url i image. El producte es veia dues vegades (al Cercador,
   a /multimedia/market-0 i a la graella, com un quadrat verd).
   Ara una entrada derivada és una FOTO d'un article, i ho diu:
    · `src` és sempre una imatge de l'article (la primera), mai l'avatar ni el
      logotip de qui signa. Un article sense cap foto pròpia no fa entrada;
    · `article` ({ sectionId, id }) nomena l'article on s'usa (requisit T6 del
      Mestre, 261007: la Multimèdia diu «en quin article s'ha publicat»). El
      Cercador el llig (indexCerca.js · deMedia i cercaEntrades) per a no
      tornar dues vegades el mateix article a la vista «tot»;
    · la foto d'un producte porta de peu la seua línia curta (subtitle), no el
      text de venda.
   Són funcions pures i exportades: supabase/seed.sql (que el node local
   servix tal qual) ha de dir el mateix que elles sobre les SEUES files, i la
   prova seedSql.multimedia.test.js ho fixa.
   Mòdul de la cadena de la llavor (scripts/generate-supabase-seed.mjs el
   carrega amb node): només imports .js amb extensió, cap JSX.

   Onada 0.3 (Gauntlet 261016, I35) · L'id d'una foto derivada és el de
   l'article («market-mac-mini-m4», «feed-<id>»), no la posició dins de la
   llista: amb la paginació del Mur, o amb un producte nou al davant, l'índex
   canviava i el mateix ?foto=<id> obria una altra foto. Sense id d'article,
   la posició, com abans. supabase/seed.sql porta els ids nous (la prova
   seedSql.multimedia.test.js el fixa contra estes funcions). */

/* L'id estable de l'article; sense, la posició de sempre. */
const idDeLArticle = (item, index) => (item?.id != null && String(item.id) !== '' ? String(item.id) : String(index));

/* Revisió adversarial del 261016 (M06: «mostrar desconegut sense inventar
   informació») · `source` és qui signa l'article, i el visor la pinta com a
   Autor (panellDeLaFoto.js). Només s'escriu quan l'article la declara: abans,
   sense autor, s'hi posava «Soc de Poble» (inventat i mal escrit), i el panell
   deia «Autor: Soc de Poble» en lloc de «Desconegut». */
const fontDeclarada = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? { source: valor } : {});

/** Les fotos de les publicacions del Mur (la portada de cada una). */
export const fotosDelMur = (publicacions) => publicacions
  .map((item, index) => {
    const src = firstMediaSource(item.image_url || item.image);
    if (!src) return null;
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
      searchText: buildSearchText([item.title, item.post_subtitle, item.content, item.author, 'Mur'])
    };
  })
  .filter(Boolean);

/** La foto principal de cada producte del Mercat: la primera de `images` i,
 *  sense, image_url o image. Mai avatar_url ni author_avatar (són de qui ven).
 *  Límit conegut (correcció D4, 261011): l'avatar es descarta per igualtat de
 *  cadena, no amb camiDeLaMarca (UniversalUtils.js, que iguala el logotip PNG
 *  i el seu SVG però no es pot carregar amb node pla). La prova «[LÍMIT]» de
 *  mediaContent.test.js el fixa. */
export const fotosDelMercat = (productes) => productes
  .map((item, index) => {
    const deQuiVen = [item.avatar_url, item.author_avatar];
    const src = [item.images, item.image_url, item.image]
      .map(firstMediaSource)
      .find((candidat) => candidat && !deQuiVen.includes(candidat));
    if (!src) return null;
    return {
      id: `market-${idDeLArticle(item, index)}`,
      title: item.title || 'Mercat',
      subtitle: item.seller || item.author_name || 'Mercat',
      description: toMediaDescription(item.subtitle),
      src,
      kind: 'image',
      tag: 'Mercat',
      ...fontDeclarada(item.seller || item.author_name),
      created_at: item.created_at,
      sectionId: 'multimedia',
      article: { sectionId: 'mercat', id: item.id },
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
  created_at: town.created_at,
  sectionId: 'multimedia',
  article: { sectionId: 'pobles', id: town.id },
  searchText: buildSearchText([town.title, town.post_subtitle, town.content, 'Poble'])
}));

/** Onada 0.3 (Gauntlet 261016, I35) · La foto de cada acte de l'Agenda (el
 *  cartell): la primera de `images` i, sense, image_url, imageSrc o image.
 *  Mai l'avatar ni el logotip de qui signa (author_avatar, avatar_url), la
 *  mateixa regla que el Mercat. Data: la de l'article (created_at o
 *  publish_date); la del dia de l'acte no és la de la foto, i sense cap, la
 *  Cronologia la posa a «Sense data». No entra a MEDIA_ITEMS (la llavor):
 *  només la fa servir el proveïdor, amb els actes vius. */
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
      searchText: buildSearchText([item.title, item.subtitle, item.author_name, 'Agenda'])
    };
  })
  .filter(Boolean);

/* Revisió adversarial del 261016 · Una entrada derivada RÀNCIA del port: la
   fila app_content 'mediaItems' d'abans de l'Onada 12 (261011), amb l'id per
   posició (market-0, feed-3) i sense `article`. En producció porta market-0,
   «Mac Mini Apple M4», amb la foto de perfil de qui ven, i market-1, la
   Samarreta, amb el logotip SVG: just el que la regla del 261011 ja no deixa
   fer a una foto derivada. La secció de l'article es deduïx del prefix. */
const ID_POSICIONAL = /^(market|feed)-\d+$/;
const SECCIO_DEL_PREFIX = Object.freeze({ market: 'mercat', feed: 'mur' });

function seccioRancia(item) {
  if (!item || item.article) return null;
  const trossos = ID_POSICIONAL.exec(String(item.id ?? ''));
  return trossos ? SECCIO_DEL_PREFIX[trossos[1]] : null;
}

/* El mateix article: la secció, el títol i la data de l'article. */
const textNet = (valor) => (valor == null ? '' : String(valor).trim());
const signatura = (seccio, item) => (textNet(item?.title) ? `${seccio}|${textNet(item.title)}|${textNet(item.created_at)}` : null);

/* Un src que una foto derivada no pot portar mai (261011): un recurs de la
   interfície (/assets/system/), un SVG (els logotips) o un avatar. */
const noEsFotoDArticle = (src) => typeof src === 'string'
  && (/^\/assets\/system\//.test(src) || /\.svg(?:[?#].*)?$/i.test(src) || /\/avatars?\//i.test(src));

/** Onada 0.3 (Gauntlet 261016, M03) · Els mitjans del port (app_content i
 *  les pujades) i, darrere, les fotos vives dels articles que el port encara
 *  no porta. Els del port es queden en el seu ordre (la graella de sempre); una
 *  foto viva entra si porta src i ni el seu id ni el seu src ja hi són.
 *  Revisió adversarial del 261016 · Una sola entrada per ARTICLE, no només per
 *  id i per src: una entrada rància del port (seccioRancia) i la foto viva
 *  del mateix article (la mateixa secció, el mateix títol i la mateixa data)
 *  són la mateixa foto, i la viva, que porta la imatge de l'article i
 *  l'article, ocupa el lloc de la rància. Si la viva ja era al port, la
 *  rància sobra. Una rància sense la seua viva (el Mur o el Mercat encara no
 *  han carregat) que porta un logotip, un SVG o un avatar no entra: no és cap
 *  foto de l'article. Igual una entrada del port sense `article` amb el
 *  mateix id que una viva que el porta (town-<slug>): la viva, al seu lloc.
 *  La resta del port, tal qual.
 *  `alies` (un Map còpia → original, el del cens: censImatges.js ·
 *  ALIES_DEL_CENS) fa que un src del port que és la còpia d'una imatge del cens
 *  compte com l'original: el cens no torna a afegir la mateixa foto amb un
 *  altre camí. */
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
    /* El mateix id i, al port, sense `article` (les 9 town-* de la fila
       remota): la viva, que nomena l'article, ocupa el seu lloc. */
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

export const MEDIA_ITEMS = [
  ...LEGACY_MEDIA,
  ...fotosDelMur(FEED_POSTS),
  ...fotosDelMercat(MARKET_ITEMS),
  ...fotosDelsPobles(TOWNS)
];
