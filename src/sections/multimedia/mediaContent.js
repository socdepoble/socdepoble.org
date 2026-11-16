import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { FEED_POSTS } from '../mur/feedContent.js';
import { TOWNS } from '../pobles/townsContent.js';
import { LEGACY_MEDIA } from './legacyMedia.js';
import {
  fotosDeLAgenda,
  fotosDelMercat,
  fotosDelMur,
  fotosDelsPobles,
  fusionaMitjans
} from './fotosVives.js';

export { fotosDeLAgenda, fotosDelMercat, fotosDelMur, fotosDelsPobles, fusionaMitjans };

export const MEDIA_ITEMS = [
  ...LEGACY_MEDIA,
  ...fotosDelMur(FEED_POSTS),
  ...fotosDelMercat(MARKET_ITEMS),
  ...fotosDelsPobles(TOWNS)
];
