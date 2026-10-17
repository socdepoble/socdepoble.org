/**
 * familiesEmojis.js — les famílies del selector d'emojis (Gauntlet 261017,
 * F29–F34: «graella d'emojis gran, accessible per teclat, categoritzada
 * (Cares, Animals, Menjar, Activitats, Viatges, Objectes, Símbols,
 * Banderes)»).
 *
 * El catàleg (emojisUnicode18.js) porta els 10 grups d'Unicode en l'ordre
 * CLDR i està fixat per hash: no es toca. Ací, sobre el que arriba a demanda,
 * es fa el selector:
 *   · l'ordre i els noms curts del requeriment, amb Activitats abans de
 *     Viatges;
 *   · Persones (les 2430 persones i parts del cos, amb tots els tons de pell:
 *     ordre del Mestre de 261007 sobre la diversitat dels emojis) és una
 *     família pròpia just després de Cares; com la graella només obri la
 *     primera, arrenca plegada, com fins ara;
 *   · fora Components (els tons i els cabells solts): no són emojis per a
 *     triar, només peces de seqüència;
 *   · un grup que la taula no coneix (les dades sintètiques de les proves:
 *     'menjar', 'natura') passa tal qual, darrere dels coneguts i en el seu
 *     ordre.
 * Els emojis de cada família són els mateixos arrays del catàleg: res es
 * copia.
 */

const FAMILIES = Object.freeze([
  ['cares-emocions', 'Cares'],
  ['persones-cos', 'Persones'],
  ['animals-natura', 'Animals'],
  ['menjar-beguda', 'Menjar'],
  ['activitats', 'Activitats'],
  ['viatges-llocs', 'Viatges'],
  ['objectes', 'Objectes'],
  ['simbols', 'Símbols'],
  ['banderes', 'Banderes']
]);
const NOMS = new Map(FAMILIES);
const FORA_DEL_SELECTOR = new Set(['components']);

/** Els grups del catàleg en famílies del selector; null si no n'hi ha cap llista. */
export function familiesDelSelector(grups) {
  if (!Array.isArray(grups)) return null;
  const perId = new Map(grups.map((grup) => [grup?.id, grup]));
  const conegudes = FAMILIES
    .filter(([id]) => perId.has(id))
    .map(([id, nom]) => Object.freeze({ ...perId.get(id), nom }));
  const altres = grups.filter((grup) => !NOMS.has(grup?.id) && !FORA_DEL_SELECTOR.has(grup?.id));
  return Object.freeze([...conegudes, ...altres]);
}
