/**
 * El Bar · nucli/divisio.js — dividir el compte (disseny del Bar §A.6, flux 4).
 *
 *   · Per línies: es trien línies i quantitats (també parcials), naix una
 *     comanda filla amb el mateix origen i es cobren per separat. La suma es
 *     conserva (mouLinies, invariant 5).
 *   · A parts iguals: N parts que sumen EXACTAMENT el pendent; els cèntims que
 *     sobren van a les primeres parts (invariant 6).
 */
import { errorBar, esCents } from './comu.js';
import { creaComanda, mouLinies, totals } from './comanda.js';

export const MAX_PARTS = 50;

/**
 * `t` cèntims en `n` parts que sumen exactament `t`: partsIguals(1000, 3) → [334, 333, 333].
 */
export function partsIguals(t, n) {
  if (!esCents(t) || t < 0) throw errorBar('IMPORT', 'L’import ha de ser un enter de cèntims ≥ 0.');
  if (!Number.isSafeInteger(n) || n < 1 || n > MAX_PARTS) throw errorBar('PARTS', `Les parts són un enter d’1 a ${MAX_PARTS}.`);
  const base = Math.floor(t / n);
  const sobren = t - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < sobren ? 1 : 0));
}

/** El pla de parts iguals del PENDENT d'una comanda: [{ part, importCents }]. */
export function planPartsIguals(comanda, n) {
  return partsIguals(totals(comanda).pendentCents, n).map((importCents, i) => ({ part: i + 1, importCents }));
}

/**
 * Separa línies en una comanda filla.
 *   seleccio [{ liniaId, quantitat }] · idNova (id de la filla) · nouIdLinia()
 * @returns {{ mare: object, filla: object }}
 */
export function divideixPerLinies(comanda, seleccio, { idNova, ara, nouIdLinia, per } = {}) {
  const filla = creaComanda({ id: idNova, tornId: comanda.tornId, origen: comanda.origen, ara, per: per || comanda.atesPer });
  const { origen, desti } = mouLinies(comanda, filla, seleccio, { ara, nouIdLinia });
  return { mare: origen, filla: desti };
}
