export const MAP_BBOX = '-0.61,38.50,-0.22,38.71';
export const MAP_CENTER = '38.5919,-0.4184';

/* El mapa incrustat d'OpenStreetMap de sempre: ara és el recurs de la barrera
   del Mapa Fotogràfic (MurSection) si el mapa nou no es pot carregar. */
export function buildMapEmbedUrl() {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${MAP_CENTER}`;
}

/* P1-64 (pla 261028_1526 §3.7.1; decisions 1 i 9 del Mestre, 261028) · El
   Mapa Fotogràfic del Mur (MapaFotografic.jsx).
   · MAPA_INICI: on s'obri sense fotos (el centre de la Torre de les Maçanes,
     townsSeed.js), i LIMITS_DEL_POBLE: «Vore el poble», el mateix requadre
     del mapa de sempre (MAP_BBOX: oest, sud, est, nord).
   · TESSELES: el fons detallat d'OpenStreetMap, NOMÉS quan la persona prem
     «Vore mapa» (apagat de sèrie; a l'app nativa, el botó no hi és). L'adreça
     és la que demana la política de tessel·les de l'OSMF, sense subdominis
     {s}. L'atribució es pinta sempre, també sense tessel·les. */
export const MAPA_INICI = Object.freeze({ lat: 38.5919, lng: -0.4184, zoom: 12 });

const [OEST, SUD, EST, NORD] = MAP_BBOX.split(',').map(Number);
export const LIMITS_DEL_POBLE = Object.freeze([Object.freeze([SUD, OEST]), Object.freeze([NORD, EST])]);

export const TESSELES = Object.freeze({
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  maxZoom: 19,
  atribucio: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
});
