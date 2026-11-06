import { buildSearchText, firstMediaSource, toFeedSummary } from '../../config/contentHelpers.js';
import { IMPORTANTS_HISTORIQUES_DEL_MUR, MOCK_FEED } from './feedSeed.js';

const importantsHistorics = new Set(IMPORTANTS_HISTORIQUES_DEL_MUR
  .filter(([coleccio]) => coleccio === 'feedPosts').map(([, id]) => id));

/** Una publicació de la llavor tal com la servix el Mur. IDEA-116 (Onada R9,
 *  R9V-C2-01) · També la fa servir la llavor (data/sectionContent.js) per a la
 *  primera publicació del Mur, que viu en un tros diferit i no a MOCK_FEED. */
export const elementDelMurDeLaLlavor = (item) => {
  const imageSrc = firstMediaSource(item.image_url || item.image);
  const summary = item.entradilla || item.post_subtitle || item.description || toFeedSummary(item.content);

  return {
    ...item,
    sectionId: 'mur',
    important: item.important === true || importantsHistorics.has(item.id),
    imageSrc,
    summary,
    searchText: buildSearchText([
      item.title,
      item.post_subtitle,
      item.description,
      item.content,
      item.author,
      item.author_name,
      item.town_name,
      item.type
    ])
  };
};

export const FEED_POSTS = MOCK_FEED.map(elementDelMurDeLaLlavor);
