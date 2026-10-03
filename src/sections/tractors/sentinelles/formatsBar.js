/**
 * formatsBar.js — els dos fitxers que exporta el TPV del Bar i que reben els
 * sentinelles 3 (Cònsol de Vendes) i 6 (Enllaç del Torn).
 *
 * El TPV viu en un altre carril i no s'importa: el pont és el fitxer JSON que
 * tria la persona. Ací només es comprova la forma; tots els imports són
 * cèntims enters.
 *   sdp.bar.tancament.v1 = { schema, tornId, obertA, tancatA, diferenciaCaixaCents,
 *     resum: { vendesPerMetode: { efectiu, targeta, altre }, tiquets, tiquetMitjaCents,
 *       devolucionsCents, anullacions: { nombre, importCents }, descomptesCents, convidadesCents,
 *       perCategoria: [{ categoriaId, nom, unitats, importCents }],
 *       perProducte: [{ producteId, nom, unitats, importCents, costCents|null }] } }
 *   sdp.bar.traspas.v1 = { schema, tornId, tancatA, de, fonsDeixatCents,
 *     comandesObertes: [{ id, origen: { tipus, taulaId? }, totalCents }],
 *     incidencies: [{ tipus, detall, importCents }], reposicio: [{ producteId, nom, unitats }],
 *     avisos: [string], llegidaPer, llegidaA }
 * Hipòtesi pendent de confirmar amb el lot BAR: costCents és el cost total de
 * les unitats venudes (com importCents), no el cost d'una unitat.
 */
import { esObjecte, textPle } from './comu.js';

export const SCHEMA_TANCAMENT = 'sdp.bar.tancament.v1';
export const SCHEMA_TRASPAS = 'sdp.bar.traspas.v1';
export const TIPUS_INCIDENCIA = Object.freeze(['diferencia-caixa', 'anullacions', 'devolucions', 'convidades']);

const enter = Number.isSafeInteger;
const natural = (valor) => enter(valor) && valor >= 0;
const esData = (valor) => typeof valor === 'string' && Number.isFinite(Date.parse(valor));
const llista = (valor) => (Array.isArray(valor) ? valor : null);

function comprova(errors, condicio, missatge) {
  if (!condicio) errors.push(missatge);
}

/** Errors de forma d'un tancament de torn (llista buida si és bo). */
export function validaTancament(t) {
  if (!esObjecte(t)) return ['El tancament ha de ser un objecte.'];
  const errors = [];
  comprova(errors, t.schema === SCHEMA_TANCAMENT, `schema ha de ser «${SCHEMA_TANCAMENT}».`);
  comprova(errors, textPle(t.tornId), 'Falta tornId.');
  comprova(errors, esData(t.obertA) && esData(t.tancatA), 'obertA i tancatA han de ser dates ISO.');
  comprova(errors, enter(t.diferenciaCaixaCents), 'diferenciaCaixaCents ha de ser un enter de cèntims.');
  const r = t.resum;
  if (!esObjecte(r)) return [...errors, 'Falta el resum del torn.'];
  const v = r.vendesPerMetode;
  comprova(errors, esObjecte(v) && ['efectiu', 'targeta', 'altre'].every((m) => enter(v[m])), 'vendesPerMetode ha de portar efectiu, targeta i altre en cèntims.');
  comprova(errors, natural(r.tiquets) && enter(r.tiquetMitjaCents), 'tiquets i tiquetMitjaCents han de ser enters.');
  comprova(errors, ['devolucionsCents', 'descomptesCents', 'convidadesCents'].every((c) => natural(r[c])), 'devolucions, descomptes i convidades han de ser cèntims no negatius.');
  comprova(errors, esObjecte(r.anullacions) && natural(r.anullacions.nombre) && natural(r.anullacions.importCents), 'anullacions ha de portar nombre i importCents.');
  const categories = llista(r.perCategoria);
  comprova(errors, categories !== null && categories.every((c) => esObjecte(c) && textPle(c.nom) && enter(c.unitats) && enter(c.importCents)), 'perCategoria ha de ser una llista de { categoriaId, nom, unitats, importCents }.');
  const productes = llista(r.perProducte);
  comprova(errors, productes !== null && productes.every((p) => esObjecte(p) && textPle(p.nom) && enter(p.unitats) && enter(p.importCents)
    && (p.costCents === null || enter(p.costCents))), 'perProducte ha de ser una llista de { producteId, nom, unitats, importCents, costCents|null }.');
  return errors;
}

/** Errors de forma d'una nota de traspàs (llista buida si és bona). */
export function validaTraspas(t) {
  if (!esObjecte(t)) return ['La nota de traspàs ha de ser un objecte.'];
  const errors = [];
  comprova(errors, t.schema === SCHEMA_TRASPAS, `schema ha de ser «${SCHEMA_TRASPAS}».`);
  comprova(errors, textPle(t.tornId), 'Falta tornId.');
  comprova(errors, esData(t.tancatA), 'tancatA ha de ser una data ISO.');
  comprova(errors, enter(t.fonsDeixatCents), 'fonsDeixatCents ha de ser un enter de cèntims.');
  const comandes = llista(t.comandesObertes);
  comprova(errors, comandes !== null && comandes.every((c) => esObjecte(c) && esObjecte(c.origen) && textPle(c.origen.tipus) && enter(c.totalCents)), 'comandesObertes ha de ser una llista de { id, origen: { tipus }, totalCents }.');
  const incidencies = llista(t.incidencies);
  comprova(errors, incidencies !== null && incidencies.every((i) => esObjecte(i) && TIPUS_INCIDENCIA.includes(i.tipus) && enter(i.importCents)), `incidencies ha de ser una llista de { tipus: ${TIPUS_INCIDENCIA.join('|')}, detall, importCents }.`);
  const reposicio = llista(t.reposicio);
  comprova(errors, reposicio !== null && reposicio.every((p) => esObjecte(p) && textPle(p.nom) && enter(p.unitats)), 'reposicio ha de ser una llista de { producteId, nom, unitats }.');
  comprova(errors, llista(t.avisos) !== null && t.avisos.every((a) => typeof a === 'string'), 'avisos ha de ser una llista de textos.');
  comprova(errors, t.llegidaPer === null || t.llegidaPer === undefined || typeof t.llegidaPer === 'string', 'llegidaPer ha de ser text o null.');
  return errors;
}

/** El total venut d'un tancament, en cèntims. */
export function vendesDe(t) {
  const v = t?.resum?.vendesPerMetode ?? {};
  return (v.efectiu ?? 0) + (v.targeta ?? 0) + (v.altre ?? 0);
}
