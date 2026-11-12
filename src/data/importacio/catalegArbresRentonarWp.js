/**
 * catalegArbresRentonarWp.js — P0-111 / IDEA-242 · Descriptor canònic dels 20 ítems
 * reals del Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes
 * (1 pàgina mare `WP-619` + 19 fitxes d’arbres singulars `WP-1751..WP-2014`, incloent `WP-1768`
 * Llorer de Villa María).
 *
 * AUTORIA SAGRADA (no negociable):
 *   · Entitat autora i custòdia: «Associació El Rentonar» (MAI «Sóc de Poble»).
 *   · Estudi tècnic i fotografies base (maig 2007): «Pedro Ferrer Rodríguez».
 *   · Sèrie patrimonial: `arbres-emblematics` -> ruta canònica `/page/arbres-monumentals`.
 *   · Estat editorial inicial: `'aprovat'` únicament per a aquests 20 ítems verificats;
 *     els 423 articles restants del corpus continuen `'pendent_admin'` fins a revisió humana.
 */

export const AUTORIA_RENTONAR = 'Associació El Rentonar';
export const ESTUDI_TECNIC_RENTONAR = 'Pedro Ferrer Rodríguez';
export const RUTA_PERFIL_RENTONAR = '/grup/el-rentonar';
export const AVATAR_RENTONAR = '/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.png';
export const COPYRIGHT_RENTONAR_ARBRES = 'CC BY-NC-SA 4.0 · Associació El Rentonar · Estudi tècnic: Pedro Ferrer Rodríguez';

export const ITEMS_CATALEG_ARBRES_RENTONAR_WP = Object.freeze([
  Object.freeze({
    wpId: 619,
    tipus: 'portada_llibre',
    arbreId: null,
    ordre: 0,
    slugWp: 'cataleg-darbres-de-la-torre',
    slugPaquet: 'cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes',
    nom: 'Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes',
    especieCientifica: null,
    lat: 38.6068,
    lng: -0.4192,
    rutaCanonica: '/page/arbres-monumentals',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1786,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-01-albers-blancs-del-pont',
    ordre: 1,
    slugWp: 'albers-blancs-del-pont-de-la-torre-de-les-macanes',
    nom: 'Àlbers blancs del Pont',
    especieCientifica: 'Populus alba',
    lat: 38.609295,
    lng: -0.420501,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-01-albers-blancs-del-pont',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1784,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-02-alborc-del-xipreret',
    ordre: 2,
    slugWp: 'alborc-del-xipreret-de-la-torre-de-les-macanes',
    nom: 'Àlborç del Xipreret',
    especieCientifica: 'Arbutus unedo',
    lat: 38.600756,
    lng: -0.426224,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-02-alborc-del-xipreret',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1782,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-03-carrasca-de-la-foia-blanca',
    ordre: 3,
    slugWp: 'carrasca-de-la-foia-blanca-de-la-torre-de-les-macanes',
    nom: 'Carrasca de La Foia Blanca',
    especieCientifica: 'Quercus rotundifolia',
    lat: 38.600886,
    lng: -0.415913,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-03-carrasca-de-la-foia-blanca',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1780,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-04-carrasca-de-la-zurca',
    ordre: 4,
    slugWp: 'carrasca-de-la-zurca-de-la-torre-de-les-macanes',
    nom: 'Carrasca de La Zurca',
    especieCientifica: 'Quercus rotundifolia',
    lat: 38.59782,
    lng: -0.375253,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-04-carrasca-de-la-zurca',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1778,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-05-carrasca-de-nofre',
    ordre: 5,
    slugWp: 'carrasca-de-nofre-de-la-torre-de-les-macanes',
    nom: 'Carrasca de Nofre',
    especieCientifica: 'Quercus rotundifolia',
    lat: 38.597137,
    lng: -0.377406,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-05-carrasca-de-nofre',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1776,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-06-carrasca-del-buitre',
    ordre: 6,
    slugWp: 'carrasca-del-buitre-de-la-torre-de-les-macanes',
    nom: 'Carrasca del Buitre',
    especieCientifica: 'Quercus rotundifolia',
    lat: 38.598647,
    lng: -0.408047,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-06-carrasca-del-buitre',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1774,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-07-carrasca-del-moral',
    ordre: 7,
    slugWp: 'carrasca-del-moral-de-la-torre-de-les-macanes',
    nom: 'Carrasca del Moral',
    especieCientifica: 'Quercus rotundifolia',
    lat: 38.603924,
    lng: -0.411277,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-07-carrasca-del-moral',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1772,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-08-fleixos-del-barranc-d-horta',
    ordre: 8,
    slugWp: 'fleixos-del-barranc-dhorta-de-la-torre-de-les-macanes',
    nom: 'Fleixos del Barranc d’Horta',
    especieCientifica: 'Fraxinus ornus',
    lat: 38.616122,
    lng: -0.39042,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-08-fleixos-del-barranc-d-horta',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1770,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-09-ginebre-de-mitja-orella',
    ordre: 9,
    slugWp: 'ginebre-de-mitja-orella-de-la-torre-de-les-macanes',
    nom: 'Ginebre de Mitja Orella',
    especieCientifica: 'Juniperus oxycedrus',
    lat: 38.600747,
    lng: -0.399958,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-09-ginebre-de-mitja-orella',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1768,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-10-llorer-de-villa-maria',
    ordre: 10,
    slugWp: 'llorer-de-villa-maria-laurus-nobilis-arbre-emblematic-dinteres-local',
    nom: 'Llorer de Villa María',
    especieCientifica: 'Laurus nobilis',
    lat: 38.608122,
    lng: -0.421325,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-10-llorer-de-villa-maria',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1766,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-11-oms-de-la-placa-de-l-esglesia',
    ordre: 11,
    slugWp: 'oms-de-la-placa-de-lesglesia-de-la-torre-de-les-macanes',
    nom: 'Oms de la Plaça de l’Església',
    especieCientifica: 'Ulmus minor',
    lat: 38.606792,
    lng: -0.418935,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-11-oms-de-la-placa-de-l-esglesia',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1764,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-12-pi-de-la-foia-boix',
    ordre: 12,
    slugWp: 'pi-de-la-foia-boix-de-la-torre-de-les-macanes',
    nom: 'Pi de la Foia Boix',
    especieCientifica: 'Pinus halepensis',
    lat: 38.624963,
    lng: -0.40905,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-12-pi-de-la-foia-boix',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1762,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-13-pi-del-mas-de-pipa',
    ordre: 13,
    slugWp: 'pi-del-mas-de-pipa-de-la-torre-de-les-macanes',
    nom: 'Pi del Mas de Pipa',
    especieCientifica: 'Pinus halepensis',
    lat: 38.593517,
    lng: -0.421112,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-13-pi-del-mas-de-pipa',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1760,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-14-pi-del-pla-verd',
    ordre: 14,
    slugWp: 'pi-del-pla-verd-de-la-torre-de-les-macanes',
    nom: 'Pi del Pla Verd',
    especieCientifica: 'Pinus halepensis',
    lat: 38.613886,
    lng: -0.413942,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-14-pi-del-pla-verd',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1758,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-15-pi-dels-arrendaors',
    ordre: 15,
    slugWp: 'pi-dels-arrendaors-de-la-torre-de-les-macanes',
    nom: 'Pi dels Arrendaors',
    especieCientifica: 'Pinus halepensis',
    lat: 38.586674,
    lng: -0.427845,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-15-pi-dels-arrendaors',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1756,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-16-roures-de-nofre',
    ordre: 16,
    slugWp: 'roures-de-nofre-de-la-torre-de-les-macanes',
    nom: 'Roures de Nofre',
    especieCientifica: 'Quercus faginea',
    lat: 38.596942,
    lng: -0.376692,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-16-roures-de-nofre',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1754,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-17-xiprer-de-la-foia',
    ordre: 17,
    slugWp: 'xiprer-de-la-foia-de-la-torre-de-les-macanes',
    nom: 'Xiprer de la Foia',
    especieCientifica: 'Cupressus sempervirens',
    lat: 38.604485,
    lng: -0.417474,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-17-xiprer-de-la-foia',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 1751,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-18-xiprers-del-calvari',
    ordre: 18,
    slugWp: 'xiprers-del-calvari-de-la-torre-de-les-macanes',
    nom: 'Xiprers del Calvari',
    especieCientifica: 'Cupressus sempervirens',
    lat: 38.608019,
    lng: -0.418515,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-18-xiprers-del-calvari',
    desti: 'arbres-monumentals'
  }),
  Object.freeze({
    wpId: 2014,
    tipus: 'fitxa_exemplar',
    arbreId: 'arbre-19-xiprers-del-cementeri',
    ordre: 19,
    slugWp: 'xiprers-del-cementeri-de-la-torre-de-les-macanes',
    nom: 'Xiprers del Cementeri',
    especieCientifica: 'Cupressus sempervirens',
    lat: 38.609832,
    lng: -0.417896,
    rutaCanonica: '/page/arbres-monumentals?item=arbre-19-xiprers-del-cementeri',
    desti: 'arbres-monumentals'
  })
]);

export const MAPA_ARBRES_RENTONAR_PER_WP_ID = Object.freeze(
  Object.fromEntries(ITEMS_CATALEG_ARBRES_RENTONAR_WP.map((item) => [String(item.wpId), item]))
);

export const MAPA_ARBRES_RENTONAR_PER_ARBRE_ID = Object.freeze(
  Object.fromEntries(
    ITEMS_CATALEG_ARBRES_RENTONAR_WP
      .filter((item) => Boolean(item.arbreId))
      .map((item) => [item.arbreId, item])
  )
);

export const MAPA_ARBRES_RENTONAR_PER_SLUG = Object.freeze(
  Object.fromEntries(
    ITEMS_CATALEG_ARBRES_RENTONAR_WP.flatMap((item) => [
      [item.slugWp, item],
      ...(item.slugPaquet ? [[item.slugPaquet, item]] : [])
    ])
  )
);

export function trobaItemCatalegArbresRentonar(identificador) {
  if (identificador === null || identificador === undefined || identificador === '') return null;
  const clau = String(identificador).trim();
  if (Object.hasOwn(MAPA_ARBRES_RENTONAR_PER_WP_ID, clau)) return MAPA_ARBRES_RENTONAR_PER_WP_ID[clau];
  if (Object.hasOwn(MAPA_ARBRES_RENTONAR_PER_SLUG, clau)) return MAPA_ARBRES_RENTONAR_PER_SLUG[clau];
  if (Object.hasOwn(MAPA_ARBRES_RENTONAR_PER_ARBRE_ID, clau)) return MAPA_ARBRES_RENTONAR_PER_ARBRE_ID[clau];
  return null;
}

export function obteCoordenadesArbreSingular(arbreId) {
  const fitxa = trobaItemCatalegArbresRentonar(arbreId);
  if (!fitxa || !Number.isFinite(fitxa.lat) || !Number.isFinite(fitxa.lng)) return null;
  return { lat: fitxa.lat, lng: fitxa.lng };
}
