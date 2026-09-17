// src/sections/disseny/cataleg/detailRegistry.jsx
import { lazy } from 'react';

export const CATALOG_DETAIL_LOADERS = {
  'formularis/boto': lazy(() => import('./detalls/EspecimenBoto.jsx')),
  'estructura/app-grid': lazy(() => import('./detalls/EspecimenAppGrid.jsx')),
  'fonaments/universalcard': lazy(() => import('./detalls/EspecimenUniversalCard.jsx'))
};
