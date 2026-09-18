import { EVENTS, FEED_POSTS, MARKET_ITEMS, MEDIA_ITEMS, NOTES, TOWNS } from '../data/sectionContent.js';

const SECTION_ITEMS = {
  mur: FEED_POSTS,
  mercat: MARKET_ITEMS,
  events: EVENTS,
  pobles: TOWNS,
  multimedia: MEDIA_ITEMS,
  notes: NOTES,
};

const SECTION_ITEM_LOOKUPS = Object.fromEntries(
  Object.entries(SECTION_ITEMS).map(([sectionId, items]) => [
    sectionId,
    new Map(items.map((item) => [String(item.id), item]))
  ])
);

const PAGE_ROUTE_MAP = {
  'el-projecte': '/projecte',
  projecte: '/projecte',
  skills: '/skills',
  disseny: '/disseny',
  constitucio: '/constitucio',
  ruta: '/roadmap',
  roadmap: '/roadmap',
  anima: '/ia',
  ia: '/ia',
  legal: '/legal',
  versions: '/versions'
};
const KNOWN_PAGE_SLUGS = new Set(Object.keys(PAGE_ROUTE_MAP));

const getBasePath = () => {
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/(?:jo|e\/[^/]+)/);
    if (match) return match[0];
  }
  return '/jo';
};

export const getSectionItemPath = (sectionId, itemId) => {
  const base = getBasePath();
  if (sectionId === 'xat') {
    return `${base}/xat/${encodeURIComponent(String(itemId))}`;
  }
  return `${base}/${sectionId}/${encodeURIComponent(String(itemId))}`;
};

export const getSectionListPath = (sectionId) => {
  const base = getBasePath();
  return sectionId === 'xat' ? `${base}/xat` : `${base}/${sectionId}`;
};

export const getSectionItems = (sectionId) => SECTION_ITEMS[sectionId] || [];

export const findSectionItem = (sectionId, itemId) =>
  SECTION_ITEM_LOOKUPS[sectionId]?.get(String(itemId)) || null;

export const resolveItemPath = (item) => {
  if (!item) return null;

  if (item.type === 'page' && item.slug) {
    if (KNOWN_PAGE_SLUGS.has(item.slug)) {
      return PAGE_ROUTE_MAP[item.slug] || '/projecte';
    }
    return `/page/${encodeURIComponent(String(item.slug))}`;
  }

  const type = String(item.type || '').toLowerCase();
  if (['agent', 'person', 'user', 'profile', 'gent'].includes(type)) return `/gent/${encodeURIComponent(String(item.id))}`;
  if (['empresa', 'official', 'entitat', 'entity', 'organization'].includes(type)) return `/empresa/${encodeURIComponent(String(item.id))}`;
  if (['ajuntament', 'cityhall', 'townhall'].includes(type)) return `/ajuntament/${encodeURIComponent(String(item.id))}`;
  if (['grup', 'group'].includes(type)) return `/grup/${encodeURIComponent(String(item.id))}`;

  const sectionId = item?.sectionId;
  if (!sectionId || item?.id == null) return null;
  return getSectionItemPath(sectionId, item.id);
};
