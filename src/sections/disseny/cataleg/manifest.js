
/* `icon`: emoji de la categoria (NavGlyph). Amb la columna plegada, el rail
   només ensenya el glif: cada categoria de Disseny s'ha de reconéixer per ell. */
export const CATALOG_CATEGORIES = [
  { id: 'fonaments', label: 'Fonaments', order: 10, icon: '🧱' },
  { id: 'estructura', label: 'Estructura', order: 20, icon: '📐' },
  { id: 'formularis', label: 'Formularis', order: 30, icon: '📝' },
  { id: 'superposicions', label: 'Superposicions', order: 40, icon: '🗂️' },
  { id: 'retroalimentacio', label: 'Retroalimentació', order: 50, icon: '🔔' },
  { id: 'navegacio', label: 'Navegació', order: 60, icon: '🧭' },
  { id: 'inventari', label: 'Inventari', order: 70, icon: '📦' }
];

/* Fonaments: les lleis del sistema i les peces que no són formularis ni
   navegació. L'ordre és el de lectura: contracte → color → tipografia →
   espaiat → targeta mestra → controls → àtoms → maquetes heretades. */
const FONAMENTS = [
  ['contracte', 'Contracte de Pedra Seca', 'Lleis, arquitectura universal i pàgines de sistema', ['llei', 'arquitectura', 'sistema']],
  ['color', 'Identitat cromàtica', 'Paleta OKLCH, contrast i escala Pedra', ['token', 'color', 'contrast']],
  ['tipografia', 'Estudi tipogràfic', 'Noto Sans, nivells de títol i ritme vertical', ['token', 'tipografia', 'ritme']],
  ['espaiat', 'Espaiat i graella', 'Escala 4/8, mètriques del layout i radis', ['token', 'espaiat', 'graella']],
  ['universalcard', 'UniversalCard', 'PedraSeca/organismes/UniversalCard.jsx', ['organisme', 'targeta', 'contingut']],
  ['controls-barra', 'Controls de barra', 'IconButton · ActionControl · DateTimeControl · icones', ['atom', 'barra', 'icona']],
  ['avatar', 'Avatar', 'PedraSeca/atoms/Avatar.jsx', ['atom', 'persona']],

  ['botonera', 'Botonera', 'PedraSeca/molecules/Botonera.jsx', ['molecula', 'navegacio', 'pindola']],
  ['taula', 'Taula', 'PedraSeca/organismes/Taula.jsx', ['organisme', 'dades']],
  ['indicador', 'Indicadors i estadístiques', 'UniversalIndicatorCard i targetes d’estadística', ['organisme', 'dades', 'maqueta']],
  ['xat', 'Xat i missatgeria', 'Bambolles i compositor de missatges', ['maqueta', 'xat']],
  ['cerca-filtres', 'Cerca i filtratge', 'Cercador, filtres i resultats', ['maqueta', 'cerca']],
  ['tasques-fitxers', 'Tasques i fitxers', 'Checklists, pujades i descàrregues', ['maqueta', 'fitxers']],
  ['media-externa', 'Media externa', 'Vídeo, mapa i àudio incrustats', ['maqueta', 'media']],
  ['utilitats', 'Utilitats i peus', 'Pistes, llistes, divisors, classes i composició', ['maqueta', 'utilitat']]
].map(([slug, title, subtitle, tags]) => ({
  id: `fonaments-${slug}`,
  categoryIds: ['fonaments'],
  kind: 'component-doc',
  title,
  subtitle,
  tags,
  searchText: `${title} ${subtitle} ${tags.join(' ')}`.toLowerCase(),
  detailKey: `fonaments/${slug}`,
  status: 'viu'
}));

export const CATALOG_ITEMS = [
  ...FONAMENTS,
  {
    id: 'inventari-global',
    categoryIds: ['inventari'],
    kind: 'component-doc',
    title: 'Inventari Global',
    subtitle: 'Taula de components',
    tags: ['inventari', 'llista'],
    searchText: 'inventari global llista components',
    detailKey: 'inventari/global',
    status: 'viu'
  },
  {
    id: 'estructura-shell',
    categoryIds: ['estructura'],
    kind: 'component-doc',
    title: 'Shell',
    subtitle: '',
    tags: [],
    searchText: 'shell',
    detailKey: 'estructura/shell',
    status: 'viu'
  },
  {
    id: 'estructura-page',
    categoryIds: ['estructura'],
    kind: 'component-doc',
    title: 'Page',
    subtitle: '',
    tags: [],
    searchText: 'page',
    detailKey: 'estructura/page',
    status: 'viu'
  },
  {
    id: 'estructura-gestor',
    categoryIds: ['estructura'],
    kind: 'component-doc',
    title: 'Gestor',
    subtitle: '',
    tags: [],
    searchText: 'gestor',
    detailKey: 'estructura/gestor',
    status: 'viu'
  },
  {
    id: 'estructura-universalworkspace',
    categoryIds: ['estructura'],
    kind: 'component-doc',
    title: 'UniversalWorkspace',
    subtitle: 'Espai de treball de tres columnes',
    tags: ['espai', 'columnes'],
    searchText: 'universal workspace',
    detailKey: 'estructura/universalworkspace',
    status: 'viu'
  },
  {
    id: 'estructura-divisor',
    categoryIds: ['estructura'],
    kind: 'component-doc',
    title: 'Divisor',
    subtitle: '',
    tags: [],
    searchText: 'divisor',
    detailKey: 'estructura/divisor',
    status: 'viu'
  },
  {
    id: 'formularis-boto',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Boto',
    subtitle: '',
    tags: [],
    searchText: 'boto',
    detailKey: 'formularis/boto',
    status: 'viu'
  },
  {
    id: 'formularis-camp',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Camp',
    subtitle: '',
    tags: [],
    searchText: 'camp',
    detailKey: 'formularis/camp',
    status: 'viu'
  },
  {
    id: 'formularis-opcions',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Opcions',
    subtitle: '',
    tags: [],
    searchText: 'opcions',
    detailKey: 'formularis/opcions',
    status: 'viu'
  },
  {
    id: 'formularis-pindola',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Pindola',
    subtitle: '',
    tags: [],
    searchText: 'pindola',
    detailKey: 'formularis/pindola',
    status: 'viu'
  },
  {
    id: 'formularis-cerca',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Cerca',
    subtitle: '',
    tags: [],
    searchText: 'cerca',
    detailKey: 'formularis/cerca',
    status: 'viu'
  },
  {
    id: 'formularis-formulari-complex',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Formulari Complex',
    subtitle: '',
    tags: [],
    searchText: 'formulari complex',
    detailKey: 'formularis/formulari-complex',
    status: 'viu'
  },
  {
    id: 'navegacio-pestanyes',
    categoryIds: ['navegacio'],
    kind: 'component-doc',
    title: 'Pestanyes',
    subtitle: '',
    tags: [],
    searchText: 'pestanyes',
    detailKey: 'navegacio/pestanyes',
    status: 'viu'
  },
  {
    id: 'navegacio-molla',
    categoryIds: ['navegacio'],
    kind: 'component-doc',
    title: 'Molla',
    subtitle: '',
    tags: [],
    searchText: 'molla',
    detailKey: 'navegacio/molla',
    status: 'viu'
  },
  {
    id: 'navegacio-paginacio',
    categoryIds: ['navegacio'],
    kind: 'component-doc',
    title: 'Paginacio',
    subtitle: '',
    tags: [],
    searchText: 'paginacio',
    detailKey: 'navegacio/paginacio',
    status: 'viu'
  },
  {
    id: 'navegacio-acordio',
    categoryIds: ['navegacio'],
    kind: 'component-doc',
    title: 'Acordio',
    subtitle: '',
    tags: [],
    searchText: 'acordio',
    detailKey: 'navegacio/acordio',
    status: 'viu'
  },
  {
    id: 'navegacio-nav-mobil',
    categoryIds: ['navegacio'],
    kind: 'component-doc',
    title: 'Nav Mobil',
    subtitle: '',
    tags: [],
    searchText: 'nav mobil',
    detailKey: 'navegacio/nav-mobil',
    status: 'viu'
  },
  {
    id: 'retroalimentacio-alerta',
    categoryIds: ['retroalimentacio'],
    kind: 'component-doc',
    title: 'Alerta',
    subtitle: '',
    tags: [],
    searchText: 'alerta',
    detailKey: 'retroalimentacio/alerta',
    status: 'viu'
  },
  {
    id: 'retroalimentacio-insignia',
    categoryIds: ['retroalimentacio'],
    kind: 'component-doc',
    title: 'Insignia',
    subtitle: '',
    tags: [],
    searchText: 'insignia',
    detailKey: 'retroalimentacio/insignia',
    status: 'viu'
  },
  {
    id: 'retroalimentacio-buit',
    categoryIds: ['retroalimentacio'],
    kind: 'component-doc',
    title: 'Buit',
    subtitle: '',
    tags: [],
    searchText: 'buit',
    detailKey: 'retroalimentacio/buit',
    status: 'viu'
  },
  {
    id: 'retroalimentacio-carrega',
    categoryIds: ['retroalimentacio'],
    kind: 'component-doc',
    title: 'Carrega',
    subtitle: '',
    tags: [],
    searchText: 'carrega',
    detailKey: 'retroalimentacio/carrega',
    status: 'viu'
  },
  {
    id: 'retroalimentacio-progres',
    categoryIds: ['retroalimentacio'],
    kind: 'component-doc',
    title: 'Progres',
    subtitle: '',
    tags: [],
    searchText: 'progres',
    detailKey: 'retroalimentacio/progres',
    status: 'viu'
  },
  {
    id: 'superposicions-dialeg',
    categoryIds: ['superposicions'],
    kind: 'component-doc',
    title: 'Dialeg',
    subtitle: '',
    tags: [],
    searchText: 'dialeg',
    detailKey: 'superposicions/dialeg',
    status: 'viu'
  },
  {
    id: 'superposicions-confirmacio',
    categoryIds: ['superposicions'],
    kind: 'component-doc',
    title: 'Confirmacio',
    subtitle: '',
    tags: [],
    searchText: 'confirmacio',
    detailKey: 'superposicions/confirmacio',
    status: 'viu'
  },
  {
    id: 'superposicions-calaix',
    categoryIds: ['superposicions'],
    kind: 'component-doc',
    title: 'Calaix',
    subtitle: '',
    tags: [],
    searchText: 'calaix',
    detailKey: 'superposicions/calaix',
    status: 'viu'
  },
  {
    id: 'superposicions-pista',
    categoryIds: ['superposicions'],
    kind: 'component-doc',
    title: 'Pista',
    subtitle: '',
    tags: [],
    searchText: 'pista',
    detailKey: 'superposicions/pista',
    status: 'viu'
  },
  {
    id: 'superposicions-menu',
    categoryIds: ['superposicions'],
    kind: 'component-doc',
    title: 'Menu',
    subtitle: '',
    tags: [],
    searchText: 'menu',
    detailKey: 'superposicions/menu',
    status: 'viu'
  },
  {
    id: 'superposicions-toast',
    categoryIds: ['superposicions'],
    kind: 'component-doc',
    title: 'Toast',
    subtitle: '',
    tags: [],
    searchText: 'toast',
    detailKey: 'superposicions/toast',
    status: 'viu'
  },
];
