/**
 * El Bar · nucli/cobrament.js — cobrar i tancar (disseny del Bar §A.4-§A.6).
 *
 * Cap pagament real: «targeta» vol dir que algú confirma que el datàfon ha
 * cobrat. Invariant 4: pendent = total − Σ pagaments; només es tanca amb
 * pendent 0; només l'efectiu admet lliurar-ne més (amb canvi); la targeta
 * no pot passar del pendent. El tiquet tancat és congelat en profunditat i
 * no hi ha cap funció que l'edite ni l'esborre (invariant 2).
 */
import { congela, errorBar, esCents, esId, esMoment, sostre } from './comu.js';
import { totals } from './comanda.js';

export const METODES = Object.freeze(['efectiu', 'targeta', 'altre']);
const PASSOS_EFECTIU = Object.freeze([100, 500, 1000, 2000, 5000]);
const MAX_SUGGERIMENTS = 5;

const exigeix = (condicio, codi, missatge) => {
  if (!condicio) throw errorBar(codi, missatge);
};

/**
 * Afig un pagament. `importCents` és el que s'aplica a la comanda (> 0 i ≤
 * pendent). En efectiu, `lliuratCents` (per defecte, l'import) és el que dona
 * la persona: ha de cobrir l'import, i la diferència és el canvi.
 */
export function afegeixPagament(comanda, { metode, importCents, lliuratCents, part } = {}, { id, ara } = {}) {
  exigeix(comanda && comanda.estat === 'oberta', 'NO_OBERTA', 'Esta comanda ja no està oberta.');
  exigeix(METODES.includes(metode), 'METODE', 'El mètode és efectiu, targeta o altre.');
  exigeix(esId(id), 'ID', 'El pagament necessita un id.');
  exigeix(esMoment(ara), 'MOMENT', 'Cal el moment del pagament.');
  exigeix(esCents(importCents) && importCents > 0, 'IMPORT', 'L’import ha de ser un enter de cèntims positiu.');
  const { pendentCents } = totals(comanda);
  exigeix(importCents <= pendentCents, 'PASSA_PENDENT', metode === 'efectiu'
    ? 'No es pot aplicar més del pendent: el que sobra és el canvi.'
    : 'Amb targeta no es pot cobrar més del pendent.');
  const pagament = { id, metode, importCents, moment: ara };
  if (metode === 'efectiu') {
    const lliurat = lliuratCents === undefined ? importCents : lliuratCents;
    exigeix(esCents(lliurat), 'LLIURAT', 'El lliurat ha de ser un enter de cèntims.');
    exigeix(lliurat >= importCents, 'LLIURAT_INSUFICIENT', 'El que s’ha lliurat no arriba a l’import.');
    pagament.lliuratCents = lliurat;
    pagament.canviCents = lliurat - importCents;
  } else {
    exigeix(lliuratCents === undefined, 'LLIURAT', 'Només l’efectiu porta lliurat i canvi.');
  }
  if (part !== undefined) {
    exigeix(Number.isSafeInteger(part) && part >= 1 && part <= 50, 'PART', 'La part és un enter d’1 a 50.');
    pagament.part = part;
  }
  return {
    ...comanda,
    pagaments: [...comanda.pagaments, pagament],
    historial: [...comanda.historial, { moment: ara, tipus: 'paga', despres: importCents, metode }]
  };
}

/**
 * Els botons de l'efectiu: l'exacte i l'arrodoniment cap amunt a 1, 5, 10,
 * 20 i 50 €; sense repetits, de menor a major i com a màxim 5.
 *   suggerimentsEfectiu(740) → [740, 800, 1000, 2000, 5000]
 */
export function suggerimentsEfectiu(pendentCents) {
  if (!esCents(pendentCents) || pendentCents <= 0) return [];
  const valors = new Set([pendentCents]);
  for (const pas of PASSOS_EFECTIU) valors.add(sostre(pendentCents, pas) * pas);
  return [...valors].sort((a, b) => a - b).slice(0, MAX_SUGGERIMENTS);
}

/**
 * Es pot tancar? { ok, motiu }: motiu 'NO_OBERTA', 'BUIDA' (cap línia: es
 * descarta, no es tanca) o 'PENDENT' (encara falta cobrar o sobra pagat).
 */
export function potTancar(comanda) {
  if (!comanda || comanda.estat !== 'oberta') return { ok: false, motiu: 'NO_OBERTA' };
  if (comanda.linies.length === 0) return { ok: false, motiu: 'BUIDA' };
  if (totals(comanda).pendentCents !== 0) return { ok: false, motiu: 'PENDENT' };
  return { ok: true, motiu: null };
}

/**
 * Tanca la comanda i torna el TIQUET, congelat en profunditat: els camps de
 * la comanda, `numero` (seqüència del torn; es mostra com a «Nota 0042»,
 * mai com a factura), `tipus: 'venda'`, `totals` i `tancatA`. Les línies
 * noves que quedaven passen a marxades.
 */
export function tanca(comanda, { numero, ara } = {}) {
  const pot = potTancar(comanda);
  exigeix(pot.ok, pot.motiu, pot.motiu === 'PENDENT' ? 'Encara hi ha import pendent.' : 'Esta comanda no es pot tancar.');
  exigeix(Number.isSafeInteger(numero) && numero >= 1, 'NUMERO', 'El tiquet necessita el número del torn.');
  exigeix(esMoment(ara), 'MOMENT', 'Cal el moment del tancament.');
  const linies = comanda.linies.map((l) => (l.estat === 'nova' ? { ...l, estat: 'marxada' } : { ...l }));
  const tancada = { ...comanda, linies, estat: 'tancada' };
  const t = totals(tancada);
  return congela({
    ...structuredClone(tancada),
    tipus: 'venda',
    numero,
    totals: {
      brutCents: t.brutCents,
      descomptesCents: t.descomptesCents,
      convidadesCents: t.convidadesCents,
      totalCents: t.totalCents,
      anullatsCents: t.anullatsCents,
      perIva: t.perIva
    },
    tancatA: ara,
    historial: [...structuredClone(comanda.historial), { moment: ara, tipus: 'tanca' }]
  });
}

/** El número com es mostra: «Nota 0042». */
export function textNumero(numero) {
  return `Nota ${String(numero).padStart(4, '0')}`;
}
