import { buildSearchText, firstMediaSource, toMediaDescription } from '../../config/contentHelpers.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { FEED_POSTS } from '../mur/feedContent.js';
import { TOWNS } from '../pobles/townsContent.js';
import { LEGACY_MEDIA } from './legacyMedia.js';

export const MEDIA_ITEMS = [
  ...LEGACY_MEDIA,
  ...(FEED_POSTS
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
        searchText: buildSearchText([item.title, item.post_subtitle, item.content, item.author, 'Mur'])
      };
    })
    .filter(Boolean)),
  ...(MARKET_ITEMS
    .map((item, index) => {
      const src = firstMediaSource(item.image_url || item.image || item.avatar_url);
      if (!src) return null;
      return {
        id: `market-${index}`,
        title: item.title || 'Mercat',
        subtitle: item.seller || item.author_name || 'Mercat',
        description: item.description || '',
        src,
        kind: 'image',
        tag: 'Mercat',
        source: item.seller || item.author_name || 'Soc de Poble',
        created_at: item.created_at,
        sectionId: 'multimedia',
        searchText: buildSearchText([item.title, item.description, item.seller, 'Mercat'])
      };
    })
    .filter(Boolean)),
  ...TOWNS.map((town) => ({
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
    searchText: buildSearchText([town.title, town.post_subtitle, town.content, 'Poble'])
  }))
];
