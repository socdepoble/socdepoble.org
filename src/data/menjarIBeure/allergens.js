/** One taxonomy shared with the Bar. Empty source cells mean unknown. */
import { ALERGENS, NOMS_ALERGENS } from '../../utils/productes/producteUniversal.js';
export { ALERGENS, NOMS_ALERGENS };
const ESTATS = new Set(['ingredient', 'traca', 'absent', 'desconegut']);
export function matriuAlergens(dades = {}) {
  return Object.fromEntries(ALERGENS.map((id) => {
    const cell = dades[id];
    if (cell == null || cell === '') return [id, { estat: 'desconegut', simbol: '?', font: null }];
    if (!ESTATS.has(cell.estat)) throw new TypeError('Estat d’al·lergen desconegut.');
    if (cell.estat !== 'desconegut' && (typeof cell.font !== 'string' || !cell.font.trim())) throw new TypeError('Una declaració d’al·lergen requerix procedència.');
    return [id, { estat: cell.estat, simbol: { ingredient: '•', traca: 'T', absent: '—', desconegut: '?' }[cell.estat], font: cell.font ?? null }];
  }));
}
export function matriuDeProducte(producte) {
  const fields = [['alergens', 'ingredient'], ['tracesAlergens', 'traca'], ['alergensAbsents', 'absent']];
  const dades = {};
  for (const [field, estat] of fields) for (const id of producte?.[field] || []) {
    if (!ALERGENS.includes(id) || dades[id]) throw new TypeError('Al·lergen invàlid o estats incompatibles.');
    if (typeof producte?.fontAlergens !== 'string' || !producte.fontAlergens.trim()) continue;
    dades[id] = { estat, font: producte.fontAlergens };
  }
  return matriuAlergens(dades);
}
/** Present dominates trace. Absence requires every component and preparation reviewed. */
export function agregaMatrius(matrius, preparacioRevisada = false) {
  const normal = matrius.map(matriuAlergens);
  return matriuAlergens(Object.fromEntries(ALERGENS.map((id) => {
    const cells = normal.map((m) => m[id]);
    const found = cells.find((c) => c.estat === 'ingredient') || cells.find((c) => c.estat === 'traca');
    const estat = found?.estat || (preparacioRevisada && cells.length && cells.every((c) => c.estat === 'absent') ? 'absent' : 'desconegut');
    return [id, { estat, font: estat === 'desconegut' ? null : cells.map((c) => c.font).filter(Boolean).join('; ') }];
  })));
}
