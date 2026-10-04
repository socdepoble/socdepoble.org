/**
 * avisos.js — els avisos de terminis: a 15, 7 i 2 dies (garantia G8
 * d'ARQUITECTURA_ERP_GESTORIA), sense connexió i sense rellotge propi.
 *
 * Llig qualsevol element que porte `id` i `venciment` (una ocurrència
 * d'obligacions.js, un termini de terminis.js, una fita d'un expedient) i
 * diu quins toca avisar el dia que li passen. Un element sense venciment
 * (pendent de dades) no s'avisa: ja el mostra el calendari com a pendent. Un
 * element `complit` tampoc. El missatge diu «el teu termini» o, si el
 * presenta la gestoria, que cal confirmar que el té en compte: mai
 * «t'ho presentem nosaltres». Cap xifra ni cap nom.
 * JS pur: sense DOM, React ni xarxa.
 */
import { congela, errorAmbCodi, esDataIso } from '../../identitat/nucli/guardes.js';
import { diesEntre, sumaDies } from './terminis.js';

export const LLINDARS = Object.freeze([15, 7, 2]);
export const NIVELLS = Object.freeze(['vencut', 'hui', 'urgent', 'proper', 'avis']);

export const MISSATGES = Object.freeze({
  titular: 'El teu termini.',
  gestoria: 'Termini de la gestoria: confirma que el té en compte.',
  vencut: 'El termini ha vençut: revisa-ho amb la gestoria.'
});

/* Llindars en dies, de més a menys: enters positius i sense repetir. */
function llindarsDe(llindars) {
  if (!Array.isArray(llindars) || llindars.length === 0 || llindars.length > 5
    || !llindars.every((n) => Number.isInteger(n) && n > 0 && n <= 366)) {
    throw new RangeError('Els llindars són d’un a cinc enters entre 1 i 366.');
  }
  return [...new Set(llindars)].sort((a, b) => b - a);
}

/**
 * Les dates en què s'avisa d'un venciment: [{ dies, data }], de la més
 * llunyana a la més pròxima.
 */
export function datesDAvis(venciment, { llindars = LLINDARS } = {}) {
  if (!esDataIso(venciment)) throw errorAmbCodi('VENCIMENT_INVALID', 'El venciment ha de ser una data «aaaa-mm-dd».');
  return congela(llindarsDe(llindars).map((dies) => ({ dies, data: sumaDies(venciment, -dies) })));
}

/**
 * El nivell d'un termini segons els dies que falten, o null si encara no toca.
 * Amb [15, 7, 2]: fins a 15, «avis»; fins a 7, «proper»; fins a 2, «urgent».
 */
export function nivellDe(diesRestants, { llindars = LLINDARS } = {}) {
  if (!Number.isInteger(diesRestants)) throw new TypeError('Els dies que falten són un enter.');
  if (diesRestants < 0) return { nivell: 'vencut', llindar: null };
  if (diesRestants === 0) return { nivell: 'hui', llindar: 0 };
  const ordenats = llindarsDe(llindars);
  const creuats = ordenats.filter((n) => diesRestants <= n);
  if (creuats.length === 0) return null;
  const llindar = creuats[creuats.length - 1];
  const nivell = llindar === ordenats[ordenats.length - 1] ? 'urgent' : llindar === ordenats[0] ? 'avis' : 'proper';
  return { nivell, llindar };
}

/**
 * Els avisos d'un dia: un per element amb venciment que ja ha creuat algun
 * llindar, ordenats del més urgent al menys. Els vençuts no complits
 * s'avisen durant `diesVencuts` dies (7 per defecte; null, sempre): el
 * calendari d'un any porta tots els mesos passats i, sense límit, el que
 * importa s'ofegaria entre el que ja està fet.
 * @param {Array<{ id: string, venciment: string|null, presenta?: string, categoria?: string, complit?: boolean }>} elements
 * @param {string} avui «aaaa-mm-dd»: el dia el dona qui crida, no el rellotge
 */
export function avisosDe(elements, avui, { llindars = LLINDARS, diesVencuts = 7 } = {}) {
  if (!esDataIso(avui)) throw errorAmbCodi('DATA_INVALIDA', 'El dia dels avisos ha de ser una data «aaaa-mm-dd».');
  if (!Array.isArray(elements)) throw new TypeError('Cal la llista d’elements amb venciment.');
  if (diesVencuts !== null && (!Number.isInteger(diesVencuts) || diesVencuts < 0)) throw new RangeError('diesVencuts és un enter no negatiu, o null.');
  const avisos = [];
  for (const element of elements) {
    if (!element || element.complit === true || element.venciment == null) continue;
    if (!esDataIso(element.venciment)) throw errorAmbCodi('VENCIMENT_INVALID', `El venciment de ${String(element.id)} no és una data «aaaa-mm-dd».`);
    const diesRestants = diesEntre(avui, element.venciment);
    const nivell = nivellDe(diesRestants, { llindars });
    if (!nivell || (diesVencuts !== null && diesRestants < -diesVencuts)) continue;
    const presenta = element.presenta === 'gestoria' ? 'gestoria' : 'titular';
    avisos.push({
      id: element.id,
      categoria: element.categoria ?? 'administratiu',
      venciment: element.venciment,
      diesRestants,
      ...nivell,
      presenta,
      missatge: nivell.nivell === 'vencut' ? MISSATGES.vencut : MISSATGES[presenta]
    });
  }
  return congela(avisos.sort((x, y) => x.diesRestants - y.diesRestants || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0)));
}
