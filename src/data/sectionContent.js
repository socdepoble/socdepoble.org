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
import { FEED_POSTS as PUBLICACIONS_DE_MOCK_FEED, elementDelMurDeLaLlavor } from '../sections/mur/feedContent.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST } from '../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import { TOWNS } from '../sections/pobles/townsContent.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';

/* IDEA-116 (Onada R9, carril C2; R9V-C2-01) · La primera publicació del Mur
   entra a la llavor ací, i no a MOCK_FEED: este mòdul només el carrega
   appSeed.js, que ja és un tros diferit, i la instantània de la publicació
   no pesa ni a l'entrada ni a l'arrencada estàtica (build: tros pageContent). Els dos
   adaptadors en mode seed (runtime.js · buildSeedAppData i
   adaptadorLocal.js) llegixen APP_SEED.feedPosts: la tenen tots dos, la
   primera. */
const FEED_POSTS = [elementDelMurDeLaLlavor(NOVES_TECNOLOGIES_CULTURA_RURAL_POST), ...PUBLICACIONS_DE_MOCK_FEED];

export {
  AGENT_LIST,
  EVENTS,
  FEED_POSTS,
  MARKET_ITEMS,
  MEDIA_ITEMS,
  PAGE_COPY,
  TOWNS
};
