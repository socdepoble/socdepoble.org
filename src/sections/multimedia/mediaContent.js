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
   carrega amb node): només imports .js amb extensió, cap JSX. */

/** Les fotos de les publicacions del Mur (la portada de cada una). */
export const fotosDelMur = (publicacions) => publicacions
  .map((item, index) => {
    const src = firstMediaSource(item.image_url || item.image);
    if (!src) return null;
    return {
      id: `feed-${index}`,
      title: item.title || 'Mur',
      subtitle: item.post_subtitle || item.author || 'Mur',
      description: toMediaDescription(item.content || item.description),
      src,
      kind: 'image',
      tag: 'Mur',
      source: item.author || 'Soc de Poble',
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
      id: `market-${index}`,
      title: item.title || 'Mercat',
      subtitle: item.seller || item.author_name || 'Mercat',
      description: toMediaDescription(item.subtitle),
      src,
      kind: 'image',
      tag: 'Mercat',
      source: item.seller || item.author_name || 'Soc de Poble',
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

export const MEDIA_ITEMS = [
  ...LEGACY_MEDIA,
  ...fotosDelMur(FEED_POSTS),
  ...fotosDelMercat(MARKET_ITEMS),
  ...fotosDelsPobles(TOWNS)
];
