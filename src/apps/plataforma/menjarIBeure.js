/**
 * Read-only food-domain services supplied by the host kernel to app modules.
 * A compiled app receives functions, never the source data, a backend port,
 * credentials or another app's implementation. Catalogue rows stay lazy.
 */
export { carregaMercadona, comparaOfertaRural } from '../../data/menjarIBeure/mercadona.js';
export { carregaReceptes, mesuraIngredient, validaEsborranyTrasllat } from '../../data/menjarIBeure/horitzontal.js';
export { fiscalVenda } from '../../data/menjarIBeure/escandall.js';
export { carregaCatalegParroquia, enriqueixCartaParroquia, itemsCatalegCartaParroquia } from '../../data/menjarIBeure/parroquia.js';
export { costCopaDeTarifaParroquia, ingredientDeTarifaParroquia, tarifesCompraParroquia } from '../../data/menjarIBeure/compresParroquia.js';

/* The build must remove the graph edge before Vite emits historical assets. */
const carregaFotos = import.meta.env.DEV || import.meta.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA === '1'
  ? () => import('../../data/menjarIBeure/parroquiaFotos.js')
  : null;

export function carregaFotosParroquia() {
  if (!carregaFotos) return Promise.reject(new Error('Les fotografies històriques no estan incloses en este build.'));
  return carregaFotos();
}
