export { UniversalWorkspace, DefaultItemCard } from './UniversalWorkspace.jsx';
/* Llei de la Roda Dentada (ordre del Mestre, 261007) · Les carpetes a la
   vista de cada espai de treball (la preferència de la roda dentada). */
export {
  ESPAI_COMU, carpetesAmagadesDe, desaCarpetaAmagada, espaiDe, subscriuCarpetesVisibles
} from './carpetesVisibles.js';

/* Fitxa Gestor F4 (R15b) · El catàleg és un consumidor del primitiu i viu fora del mòdul
   (src/components/universal/CatalegWorkspace.jsx); la façana el continua exportant. */
export { default as CatalegWorkspace } from '../CatalegWorkspace.jsx';
export { default as DetallCataleg } from './DetallCataleg.jsx';
