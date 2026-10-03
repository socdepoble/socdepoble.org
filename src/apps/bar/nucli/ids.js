/**
 * El Bar · nucli/ids.js — ids opacs i ordenables (disseny del Bar §A.3).
 *
 *   nouId('c', '2026-10-02T08:15:00.000Z', aleatori) → 'c-mgahhx2o-4f2a'
 *
 * Prefix (una o més lletres) · el moment en base 36 · quatre caràcters a
 * l'atzar. El rellotge i l'atzar s'injecten: les proves en donen de fixos.
 * L'id no porta cap dada: ni noms, ni imports, ni la taula.
 */

const XIFRES = 4;

function milisegonsDe(ara) {
  if (typeof ara === 'number') return ara;
  if (ara instanceof Date) return ara.getTime();
  return typeof ara === 'string' ? Date.parse(ara) : Number.NaN;
}

/**
 * @param {string} prefix  'c' (comanda), 'l' (línia), 'p' (pagament), 'k' (tiquet), 't' (torn), 'm' (moviment)…
 * @param {string|number|Date} ara  el moment (ISO, mil·lisegons o Date)
 * @param {() => number} [aleatori]  [0, 1), per defecte Math.random
 * @returns {string}
 */
export function nouId(prefix, ara, aleatori = Math.random) {
  if (typeof prefix !== 'string' || !/^[a-z]{1,8}$/.test(prefix)) throw new TypeError('El prefix de l’id ha de ser d’1 a 8 lletres minúscules.');
  const ms = milisegonsDe(ara);
  if (!Number.isFinite(ms) || ms < 0) throw new TypeError('nouId necessita un moment vàlid.');
  let cua = '';
  for (let i = 0; i < XIFRES; i += 1) {
    const valor = Number(aleatori());
    const index = Number.isFinite(valor) ? Math.min(35, Math.max(0, Math.floor(valor * 36))) : 0;
    cua += index.toString(36);
  }
  return `${prefix}-${Math.trunc(ms).toString(36)}-${cua}`;
}
