import { buildSearchText, firstMediaSource, toFeedSummary } from '../../config/contentHelpers.js';
import { MOCK_FEED } from './feedSeed.js';
import { IMPORTANTS_HISTORIQUES_DEL_MUR } from './datesDeProvaMur.js';

const importantsHistorics = new Set(IMPORTANTS_HISTORIQUES_DEL_MUR
  .filter(([coleccio]) => coleccio === 'feedPosts').map(([, id]) => id));

export const FEED_POSTS = MOCK_FEED.map((item) => {
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
});
