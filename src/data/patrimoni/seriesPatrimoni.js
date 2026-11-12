/**
 * seriesPatrimoni.js · P0-108 / IDEA-239 · Estructura canònica de les 7 sèries
 * biblioteconòmiques de Patrimoni Viu sota `public/assets/uploads/patrimoni/<serie>/`.
 *
 * Cada sèrie agrupa els fons documentals i etnogràfics per domini cultural
 * sense barrejar llibres, campanyes o municipis dins de l'arrel de `patrimoni/`,
 * mantenint intactes les rutes històriques (`que-dinem/`, `arbres-2020/`,
 * làmines d'Ibáñez i fotos del Pou de Neu) per no trencar cap enllaç ni prova.
 */

export const SERIES_PATRIMONI_VIU = Object.freeze([
  Object.freeze({
    id: 'gastronomia',
    slug: 'gastronomia',
    emoji: '🍲',
    titol: 'Gastronomia i Receptari Tradicional',
    rutaAssets: '/assets/uploads/patrimoni/gastronomia',
    rutesHistoriques: Object.freeze(['/assets/uploads/patrimoni/que-dinem']),
    rutaApp: '/page/receptes',
    facetaPmest: 'cultura-popular-i-gastronomia',
    descripcio: 'Receptaris locals, cuina d’aprofitament, forns i memòria culinària dels pobles.'
  }),
  Object.freeze({
    id: 'arbres-emblematics',
    slug: 'arbres-emblematics',
    emoji: '🌳',
    titol: 'Arbres Emblemàtics i Monumentals',
    rutaAssets: '/assets/uploads/patrimoni/arbres-emblematics',
    rutesHistoriques: Object.freeze([
      '/assets/uploads/patrimoni/arbres-emblematics/la-torre-de-les-macanes',
      '/assets/uploads/patrimoni/arbres-2020'
    ]),
    rutaApp: '/page/arbres-monumentals',
    facetaPmest: 'medi-natural-i-arbres-singulars',
    descripcio: 'Catàlegs municipals d’arbres singulars, fitxes CIEF v232 i seguiment fotogràfic longitudinal.'
  }),
  Object.freeze({
    id: 'herbari',
    slug: 'herbari',
    emoji: '🌿',
    titol: 'Herbari Etnobotànic',
    rutaAssets: '/assets/uploads/patrimoni/herbari',
    rutesHistoriques: Object.freeze(['/assets/uploads/patrimoni/herbari-la-torre-ibanez.webp']),
    rutaApp: '/page/herbari',
    facetaPmest: 'etnobotanica-i-remeis',
    descripcio: 'Flora silvestre, usos medicinals tradicionals, noms vernacles i recol·lecció sostenible.'
  }),
  Object.freeze({
    id: 'banc-de-llavors',
    slug: 'banc-de-llavors',
    emoji: '🌾',
    titol: 'Banc de Llavors i Varietats Locals',
    rutaAssets: '/assets/uploads/patrimoni/banc-de-llavors',
    rutesHistoriques: Object.freeze(['/assets/uploads/patrimoni/banc-de-llavors-ibanez.webp']),
    rutaApp: '/page/banc-de-llavors',
    facetaPmest: 'agrobiodiversitat-i-llavors',
    descripcio: 'Varietats hortícoles i fruiters tradicionals, guardadores de llavor i calendaris de sembra.'
  }),
  Object.freeze({
    id: 'arquitectura-pedra-seca',
    slug: 'arquitectura-pedra-seca',
    emoji: '🪨',
    titol: 'Arquitectura de Pedra Seca i Enginyeria de l’Aigua',
    rutaAssets: '/assets/uploads/patrimoni/arquitectura-pedra-seca',
    rutesHistoriques: Object.freeze(['/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp']),
    rutaApp: '/page/anatomia-rural',
    facetaPmest: 'arquitectura-verna-i-aigua',
    descripcio: 'Pous de neu, marges, ribassos, assuts, molins fariners, almàsseres i forns de calç.'
  }),
  Object.freeze({
    id: 'rutes-i-camins',
    slug: 'rutes-i-camins',
    emoji: '🥾',
    titol: 'Rutes, Sendes i Camins de Ferradura',
    rutaAssets: '/assets/uploads/patrimoni/rutes-i-camins',
    rutesHistoriques: Object.freeze(['/assets/uploads/patrimoni/rutes-de-poble-ibanez.webp']),
    rutaApp: '/page/rutes-de-poble',
    facetaPmest: 'camins-i-toponimia',
    descripcio: 'Camins reials, assagadors, sendes locals, fonts i toponímia viva del terme.'
  }),
  Object.freeze({
    id: 'memoria-oral',
    slug: 'memoria-oral',
    emoji: '🎙️',
    titol: 'Memòria Oral, Oficis i Cançoner',
    rutaAssets: '/assets/uploads/patrimoni/memoria-oral',
    rutesHistoriques: Object.freeze([]),
    rutaApp: '/page/la-iaia-sabuda',
    facetaPmest: 'memoria-oral-i-oficis',
    descripcio: 'Testimonis sonors de la gent gran, vocabulari d’oficis rurals, dites i romanços.'
  })
]);

export const MAPA_SERIES_PATRIMONI = Object.freeze(
  Object.fromEntries(SERIES_PATRIMONI_VIU.map((serie) => [serie.id, serie]))
);

export function obteSeriePatrimoni(idOSlug) {
  const clau = String(idOSlug || '').trim();
  return Object.hasOwn(MAPA_SERIES_PATRIMONI, clau) ? MAPA_SERIES_PATRIMONI[clau] : null;
}
