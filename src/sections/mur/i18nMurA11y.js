/**
 * Onada R32.30b · Lot 02 · Diccionari diferit d'accessibilitat i filtres del Mur
 * en les 5 llengües oficials (ca, es, en, eu, gl).
 * Zero impacte a l'arrencada estàtica de WordPress (0 B a pesDelNucli) i
 * conservació byte a byte del valencià canònic (ca).
 */
const DICCIONARI_MUR_A11Y = Object.freeze({
  ca: Object.freeze({
    titolMapaTerritori: 'Mapa del territori',
    filtresMurAria: 'Filtres del mur',
    filtreMostrarTot: 'Mostrar tot',
    filtreMercat: 'Mercat',
    filtreMapa: 'Mapa',
    revisioWpRegioAria: "Mode Revisió d'Importació de WordPress",
    filtraCasUsEditorialAria: "Filtra per cas d'ús editorial",
  }),
  es: Object.freeze({
    titolMapaTerritori: 'Mapa del territorio',
    filtresMurAria: 'Filtros del muro',
    filtreMostrarTot: 'Mostrar todo',
    filtreMercat: 'Mercado',
    filtreMapa: 'Mapa',
    revisioWpRegioAria: 'Modo de revisión de importación de WordPress',
    filtraCasUsEditorialAria: 'Filtrar por caso de uso editorial',
  }),
  en: Object.freeze({
    titolMapaTerritori: 'Territory map',
    filtresMurAria: 'Wall filters',
    filtreMostrarTot: 'Show all',
    filtreMercat: 'Market',
    filtreMapa: 'Map',
    revisioWpRegioAria: 'WordPress import review mode',
    filtraCasUsEditorialAria: 'Filter by editorial use case',
  }),
  eu: Object.freeze({
    titolMapaTerritori: 'Lurraldearen mapa',
    filtresMurAria: 'Hormako iragazkiak',
    filtreMostrarTot: 'Erakutsi dena',
    /* v1.2.19 · Gauntlet R1 (L5-08) · El rètol de la navegació en basc (eu.js, nav.mercat), no un sinònim. */
    filtreMercat: 'Merkatua',
    filtreMapa: 'Mapa',
    revisioWpRegioAria: 'WordPress inportazioa berrikusteko modua',
    filtraCasUsEditorialAria: 'Iragazi erabilera-kasu editorialaren arabera',
  }),
  gl: Object.freeze({
    titolMapaTerritori: 'Mapa do territorio',
    filtresMurAria: 'Filtros do muro',
    filtreMostrarTot: 'Amosar todo',
    filtreMercat: 'Mercado',
    filtreMapa: 'Mapa',
    revisioWpRegioAria: 'Modo de revisión de importación de WordPress',
    filtraCasUsEditorialAria: 'Filtrar por caso de uso editorial',
  }),
});

export function codiLlenguaMur(language = 'ca') {
  const base = String(language || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(DICCIONARI_MUR_A11Y, base) ? base : 'ca';
}

export function textosMurA11y(language = 'ca') {
  return DICCIONARI_MUR_A11Y[codiLlenguaMur(language)];
}
