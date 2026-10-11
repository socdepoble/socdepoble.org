/* Auditoria 261007 (B) · Llevats GLOBAL_SEARCH_ITEMS, PAGE_DETAIL_LOOKUP i
   els reexports NOTES i NOTE_FOLDERS (amb l'import de notesContent.js): cap
   mòdul no els llegia, i es calculaven a cada càrrega. El catàleg de notes
   viu de veres és el d'appSeed.js (NOTE_FOLDERS_SEED, NOTES_SEED).
   Onada 12 (261011; ordres 261011_0130, punt 1) · sections/notes/notesContent.js,
   que quedava sense importador, ja no és al disc. */
import { AGENT_LIST } from '../sections/profile/profileContent.js';
import { EVENTS } from '../sections/mur/eventsContent.js';
import { MARKET_ITEMS } from '../sections/mercat/marketContent.js';
import { MEDIA_ITEMS } from '../sections/multimedia/mediaContent.js';
import { FEED_POSTS } from '../sections/mur/feedContent.js';
import { TOWNS } from '../sections/pobles/townsContent.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';

export {
  AGENT_LIST,
  EVENTS,
  FEED_POSTS,
  MARKET_ITEMS,
  MEDIA_ITEMS,
  PAGE_COPY,
  TOWNS
};
