/**
 * Model pur per a TargetaDelMercat (puresa Vite Fast Refresh / HMR · R32.24).
 */
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import {
  ofereixTraduir,
  planTraduccioPublicacio,
  propia,
} from '../../components/universal/traduccio/planTraduccioPublicacio.js';

export const SECCIO_MERCAT = 'mercat';

export const resolImatgePropiaMercat = (font, filtrePropi) => (
  isSafeAsset(font) ? filtrePropi(font) : null
);

export const esProducteTraduibleMercat = (item, idioma = 'ca') => (
  ofereixTraduir(planTraduccioPublicacio(item, idioma || 'ca'))
);

export const modeTraduccioProducteMercat = (item) => propia(item, 'translation_mode');
