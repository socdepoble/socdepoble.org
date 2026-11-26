/**
 * i18nTerritoriTargetaV26.js — Els dos textos del bloc territorial de la
 * targeta (IDEA-360, v1.2.26) en 5 llengües (ca, es, en, eu, gl).
 *
 * BlocTerritoriTargeta viatja a l'arrencada estàtica del connector WordPress
 * (UniversalCard → BlocTerritoriTargeta): llig estes dues claus d'ací i no del
 * diccionari sencer de G26-2 (i18nTaxonomiaV26.js), que les incorpora a cada
 * llengua i es queda als trossos diferits de les pàgines de taxonomia.
 */
export const TEXTOS_TERRITORI_TARGETA_V26 = Object.freeze({
  ca: Object.freeze({
    taxonomiaV26TerritoriAria: 'Territori de la publicació',
    taxonomiaV26ObrirMapaParatge: 'Vore {lloc} al Mapa'
  }),
  es: Object.freeze({
    taxonomiaV26TerritoriAria: 'Territorio de la publicación',
    taxonomiaV26ObrirMapaParatge: 'Ver {lloc} en el Mapa'
  }),
  en: Object.freeze({
    taxonomiaV26TerritoriAria: 'Publication geography',
    taxonomiaV26ObrirMapaParatge: 'View {lloc} on the Map'
  }),
  eu: Object.freeze({
    taxonomiaV26TerritoriAria: 'Argitalpenaren lurraldea',
    taxonomiaV26ObrirMapaParatge: 'Ikusi {lloc} Mapan'
  }),
  gl: Object.freeze({
    taxonomiaV26TerritoriAria: 'Territorio da publicación',
    taxonomiaV26ObrirMapaParatge: 'Ver {lloc} no Mapa'
  })
});

export function textosTerritoriTargetaV26(idioma = 'ca') {
  const curt = String(idioma || 'ca').trim().toLowerCase().slice(0, 2);
  return TEXTOS_TERRITORI_TARGETA_V26[Object.hasOwn(TEXTOS_TERRITORI_TARGETA_V26, curt) ? curt : 'ca'];
}
