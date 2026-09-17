// src/sections/disseny/cataleg/manifest.js
export const CATALOG_CATEGORIES = [
  { id: 'fonaments', label: 'Fonaments', order: 10 },
  { id: 'estructura', label: 'Estructura', order: 20 },
  { id: 'formularis', label: 'Formularis', order: 30 }
];

export const CATALOG_ITEMS = [
  {
    id: 'formularis-boto',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Boto',
    subtitle: 'PedraSeca/atoms/Boto.jsx',
    tags: ['àtom', 'acció', 'accessible'],
    searchText: 'boto atom accio accessible',
    detailKey: 'formularis/boto',
    status: 'viu'
  },
  {
    id: 'fonaments-universalcard',
    categoryIds: ['fonaments'],
    kind: 'component-doc',
    title: 'UniversalCard',
    subtitle: 'PedraSeca/organismes/UniversalCard.jsx',
    tags: ['organisme', 'targeta', 'contingut'],
    searchText: 'universalcard organisme targeta contingut',
    detailKey: 'fonaments/universalcard',
    status: 'viu'
  }
];

// Taula explícita de compatibilitat; no s’assumeix que una pàgina legacy
// siga automàticament una categoria o un espècimen modern.
export const LEGACY_PAGE_TARGETS = {
  fonaments: { categoryId: 'fonaments', itemId: 'fonaments-overview' },
  estructura: { categoryId: 'estructura', itemId: 'estructura-overview' },
  formularis: { categoryId: 'formularis', itemId: 'formularis-overview' }
};
