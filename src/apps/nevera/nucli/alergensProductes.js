/** Corpus 6 · Adaptador pur; preserva les huit columnes i els 592 ids publicats. */
import { FONT, PRODUCTES } from './productes.js';
import { producteBotigaAmbAlergens, matriuProducteBotiga } from '../../../utils/alergensComercials.js';

const PROCEDENCIA_CATALEG = Object.freeze({
  canal: 'botiga', fitxer: 'src/apps/nevera/nucli/productes.js', colleccio: 'PRODUCTES',
  tall: FONT.tall, origenVerificat: true,
  abast: 'identitat i presentació del catàleg importat; sense composició ni etiqueta d’envàs acreditada'
});
export const PRODUCTES_AMB_ALERGENS = Object.freeze(PRODUCTES.map((fila) => {
  const producte = producteBotigaAmbAlergens(fila);
  if (!producte) throw new TypeError('Fila comercial fora de contracte.');
  return Object.freeze({ ...producte, procedenciaAlergens: PROCEDENCIA_CATALEG });
}));
const PER_ID = new Map(PRODUCTES.map((fila, index) => [fila[0], index]));

/** Només resol ids primitius del catàleg; cap coerció de dades externes. */
export function producteBotigaPerId(id) {
  return typeof id === 'string' && PER_ID.has(id) ? PRODUCTES_AMB_ALERGENS[PER_ID.get(id)] : null;
}
export function matriuBotigaPerId(id) {
  return matriuProducteBotiga(typeof id === 'string' && PER_ID.has(id) ? PRODUCTES[PER_ID.get(id)] : null);
}
