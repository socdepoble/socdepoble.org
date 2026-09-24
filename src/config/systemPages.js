/**
 * Claus de PAGE_COPY que la interfície necessita per a pintar-se.
 *
 * Viuen ací, i no dins dels components, perquè node les puga importar sense
 * JSX: la frontissa de contingut (tooling/gates/frontissa-contingut.mjs) en
 * deriva les claus obligatòries. L'incident del 24-09 va nàixer d'un canvi de
 * nom (`wikidepoble` → `skills`): el Mur va descartar la targeta en silenci i
 * la portada de la Wiki es va quedar sense text, i cap porta ho va dir.
 *
 * Mòdul de dades pures: sense imports, perquè node el puga carregar tal qual.
 */

/** Pàgines de sistema que el Mur barreja amb les publicacions. */
export const SYSTEM_PAGES = Object.freeze([
  { key: 'projecte', isAvis: false, href: '/projecte' },
  { key: 'wikidepoble', isAvis: false, href: '/wikidepoble' },
  { key: 'constitucio', isAvis: false, href: '/constitucio' },
  { key: 'roadmap', isAvis: false, href: '/roadmap' },
  { key: 'notes', isAvis: false, href: '/notes' },
  { key: 'disseny', isAvis: false, href: '/disseny' },
  { key: 'versions', isAvis: false, href: '/versions' },
  { key: 'legal', isAvis: false, href: '/legal' }
].map((page) => Object.freeze(page)));

/**
 * Portades que es llegixen de PAGE_COPY directament. `disseny` la llig
 * DesignSection.jsx amb el nom literal; `consola` la lligen la ruta /consola
 * i l'element de la Wiki que la incrusta.
 */
export const COVER_PAGE_KEYS = Object.freeze({
  wiki: 'wikidepoble',
  disseny: 'disseny',
  consola: 'consola'
});
