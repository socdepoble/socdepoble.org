/**
 * El Bar · nucli/linia.js — els imports d'una línia de comanda (§A.3).
 *
 *   linia { id, producteId, varianteId, categoriaId, nomCongelat,
 *           varianteNomCongelat?, preuUnitariCents, ivaPercent,
 *           costUnitariCents?, quantitat, modificadors, nota?,
 *           descompte?: { tipus: 'percent' | 'import', valor, motiu },
 *           convidada?: { motiu }, estat: 'nova' | 'marxada' | 'anullada',
 *           afegidaA, motiuAnullacio? }
 *
 * Una línia d'un tiquet de devolució no té preu unitari: porta `importCents`,
 * el que es torna exactament (sempre positiu; el signe el posa el tiquet).
 * La línia congela nom, preu, IVA i cost: canviar la carta no la toca.
 */
import { errorBar, mitjaAmunt } from './comu.js';

export const TIPUS_DESCOMPTE = Object.freeze(['percent', 'import']);

/** Compta per als totals: tot el que no està anul·lat. */
export const compta = (linia) => linia.estat !== 'anullada';

/** Preu unitari per quantitat (de les anul·lades també: és el que es va anul·lar). */
export function brutLinia(linia) {
  if (Number.isSafeInteger(linia.importCents)) return linia.importCents;
  return linia.preuUnitariCents * linia.quantitat;
}

/** El descompte en cèntims (0 si està convidada: convidar ja ho cobrix tot). */
export function descompteLinia(linia) {
  if (!compta(linia) || linia.convidada || !linia.descompte) return 0;
  const brut = brutLinia(linia);
  const { tipus, valor } = linia.descompte;
  if (tipus === 'percent') return Math.min(brut, mitjaAmunt(brut * valor, 100));
  return Math.min(brut, valor);
}

/** El que es convida en cèntims (la línia sencera). */
export function convidadaLinia(linia) {
  return compta(linia) && linia.convidada ? brutLinia(linia) : 0;
}

/** El total de la línia: brut − descompte − convidada; 0 si està anul·lada. */
export function totalLinia(linia) {
  if (!compta(linia)) return 0;
  return brutLinia(linia) - descompteLinia(linia) - convidadaLinia(linia);
}

/**
 * Parteix una línia en dues: `quantitat` unitats a la línia nova (`idNova`) i
 * la resta a la de sempre. Un descompte es reparteix en imports exactes
 * (el de la part, arrodonit; el de la resta, el que falta), de manera que
 * total(resta) + total(part) === total(línia) sempre (invariant 5).
 * @returns {[object, object]} [resta, part]
 */
export function parteixLinia(linia, quantitat, idNova) {
  if (!Number.isSafeInteger(quantitat) || quantitat < 1 || quantitat >= linia.quantitat) {
    throw errorBar('QUANTITAT', 'Per a partir una línia cal una quantitat entre 1 i una menys de les que té.');
  }
  const resta = { ...linia, quantitat: linia.quantitat - quantitat };
  const part = { ...linia, id: idNova, quantitat };
  if (linia.descompte && !linia.convidada) {
    const total = descompteLinia(linia);
    const dePart = mitjaAmunt(total * quantitat, linia.quantitat);
    part.descompte = { tipus: 'import', valor: dePart, motiu: linia.descompte.motiu };
    resta.descompte = { tipus: 'import', valor: total - dePart, motiu: linia.descompte.motiu };
    if (part.descompte.valor === 0) delete part.descompte;
    if (resta.descompte.valor === 0) delete resta.descompte;
  }
  return [resta, part];
}

/** Dues línies es poden agrupar (tornar a tocar el mateix producte suma 1). */
export function mateixaIdentitat(a, b) {
  return a.producteId === b.producteId
    && a.varianteId === b.varianteId
    && a.preuUnitariCents === b.preuUnitariCents
    && (a.nota || '') === (b.nota || '')
    && JSON.stringify(a.modificadors || []) === JSON.stringify(b.modificadors || []);
}
