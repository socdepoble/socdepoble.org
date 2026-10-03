/**
 * El Bar · nucli/reposicio.js — la llista de reposició de la nevera (§A.5).
 *
 * Les unitats venudes dels productes que diuen `reposaNevera`, netes de
 * devolucions. No és cap inventari: és el que cal tornar a posar al fred.
 */
import { compta } from './linia.js';
import { signeDe } from './tiquet.js';

/**
 * @param {object[]} tiquets  els tiquets del torn (vendes i devolucions)
 * @param {{ productes: object[] }} carta
 * @returns {Array<{ producteId: string, nom: string, unitats: number }>} per nom
 */
export function llistaReposicio(tiquets, carta) {
  const nevera = new Map((carta?.productes || []).filter((p) => p.reposaNevera).map((p) => [p.id, p]));
  const unitats = new Map();
  for (const tiquet of tiquets || []) {
    if (tiquet.estat !== 'tancada') continue;
    for (const linia of tiquet.linies) {
      if (!compta(linia) || !nevera.has(linia.producteId)) continue;
      unitats.set(linia.producteId, (unitats.get(linia.producteId) || 0) + signeDe(tiquet) * linia.quantitat);
    }
  }
  return [...unitats.entries()]
    .filter(([, n]) => n > 0)
    .map(([producteId, n]) => ({ producteId, nom: nevera.get(producteId).nom, unitats: n }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
}
