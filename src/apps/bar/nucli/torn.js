/**
 * El Bar · nucli/torn.js — el torn de caixa (disseny del Bar §A.3-§A.6, flux 6).
 *
 *   torn { id, obertA, obertPer, fonsInicialCents, moviments, estat: 'obert' | 'tancat',
 *          traspasAnteriorLlegit, traspasAnteriorDe?, tancatA?, tancatPer?,
 *          arqueig?: { perDenominacio, totalCents }, diferenciaCaixaCents?,
 *          resum?, traspas? }
 *
 * Invariants (§A.4):
 *   7. No es tanca un torn amb comandes obertes que no siguen a la nota de traspàs.
 *   8. El torn següent no ven fins que algú marca la nota anterior com a llegida:
 *      obriTorn no obri sense eixa lectura.
 * El torn tancat és congelat: el resum és una instantània.
 */
import { aliesNet, congela, errorBar, esCents, esId, esMoment, mitjaAmunt, suma, textNet } from './comu.js';
import { totals } from './comanda.js';
import { compta } from './linia.js';
import { importLiniaTiquet, signeDe } from './tiquet.js';
import { validaTraspas } from './traspas.js';

/** Les denominacions d'euro en cèntims, de més gran a més menuda. */
export const DENOMINACIONS = Object.freeze([5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]);
export const TIPUS_MOVIMENT = Object.freeze(['entrada', 'eixida']);

const exigeix = (condicio, codi, missatge) => {
  if (!condicio) throw errorBar(codi, missatge);
};

/**
 * Obri un torn. Si hi ha una nota de traspàs del torn anterior, ha d'estar
 * llegida (marcaLlegida) abans: si no, llança TRASPAS_NO_LLEGIT.
 */
export function obriTorn({ id, per, fonsInicialCents, ara, traspasAnterior = null } = {}) {
  exigeix(esId(id), 'ID', 'El torn necessita un id.');
  exigeix(esMoment(ara), 'MOMENT', 'Cal el moment d’obrir.');
  exigeix(esCents(fonsInicialCents) && fonsInicialCents >= 0, 'IMPORT', 'El fons inicial és un enter de cèntims ≥ 0.');
  if (traspasAnterior) {
    exigeix(traspasAnterior.llegidaA, 'TRASPAS_NO_LLEGIT', 'Primer cal llegir la nota de traspàs del torn anterior.');
  }
  return {
    id,
    obertA: ara,
    obertPer: aliesNet(per),
    fonsInicialCents,
    moviments: [],
    estat: 'obert',
    traspasAnteriorLlegit: true,
    ...(traspasAnterior ? { traspasAnteriorDe: traspasAnterior.tornId } : {})
  };
}

/** Es pot vendre en este torn? */
export function potVendre(torn) {
  return Boolean(torn) && torn.estat === 'obert' && torn.traspasAnteriorLlegit === true;
}

/** Entrada o eixida de caixa amb motiu (canvi per al calaix, pagar un proveïdor…). */
export function afegeixMoviment(torn, { tipus, importCents, motiu } = {}, { id, ara } = {}) {
  exigeix(torn && torn.estat === 'obert', 'TORN_TANCAT', 'El torn no està obert.');
  exigeix(TIPUS_MOVIMENT.includes(tipus), 'TIPUS', 'El moviment és entrada o eixida.');
  exigeix(esCents(importCents) && importCents > 0, 'IMPORT', 'L’import és un enter de cèntims positiu.');
  const motiuNet = textNet(motiu, 80);
  exigeix(motiuNet, 'SENSE_MOTIU', 'Un moviment de caixa necessita el motiu.');
  exigeix(esId(id) && esMoment(ara), 'ID', 'El moviment necessita id i moment.');
  return { ...torn, moviments: [...torn.moviments, { id, tipus, importCents, motiu: motiuNet, moment: ara }] };
}

/**
 * Total comptat per denominacions: { [cèntims]: unitats } → cèntims.
 * Només denominacions d'euro i unitats enteres ≥ 0.
 */
export function arqueig(perDenominacio, denominacions = DENOMINACIONS) {
  exigeix(perDenominacio && typeof perDenominacio === 'object', 'ARQUEIG', 'L’arqueig és { denominació: unitats }.');
  let total = 0;
  for (const [clau, unitats] of Object.entries(perDenominacio)) {
    const cents = Number(clau);
    exigeix(denominacions.includes(cents), 'ARQUEIG', `«${clau}» no és cap denominació.`);
    exigeix(Number.isSafeInteger(unitats) && unitats >= 0, 'ARQUEIG', 'Les unitats són enters ≥ 0.');
    total += cents * unitats;
  }
  exigeix(esCents(total), 'ARQUEIG', 'L’arqueig és massa gran.');
  return total;
}

function afig(mapa, clau, canvi) {
  const actual = mapa.get(clau) || { unitats: 0, importCents: 0, costCents: 0, ambCost: true };
  mapa.set(clau, {
    ...actual,
    ...canvi.dades,
    unitats: actual.unitats + canvi.unitats,
    importCents: actual.importCents + canvi.importCents,
    costCents: actual.costCents + (canvi.costCents ?? 0),
    ambCost: actual.ambCost && canvi.costCents !== null
  });
}

/**
 * El resum del torn: el que es veu al «Resum parcial» i el que es congela en
 * tancar (sdp.bar.tancament.v1).
 *   tiquets  els del torn (vendes i devolucions); obertes  les comandes obertes
 *   categories  per a posar nom a les vendes per categoria
 * Efectiu esperat = fons + efectiu venut − efectiu retornat + entrades − eixides.
 */
export function resumTorn(torn, tiquets = [], obertes = [], { categories = [] } = {}) {
  const delTorn = tiquets.filter((t) => t.tornId === torn.id && t.estat === 'tancada');
  const vendes = delTorn.filter((t) => t.tipus === 'venda');
  const devolucions = delTorn.filter((t) => t.tipus === 'devolucio');
  const perMetode = (llista) => {
    const resultat = { efectiu: 0, targeta: 0, altre: 0 };
    for (const t of llista) for (const p of t.pagaments) resultat[p.metode] += Math.abs(p.importCents);
    return resultat;
  };
  const vendesPerMetode = perMetode(vendes);
  const retornatPerMetode = perMetode(devolucions);
  const totalVendesCents = suma(vendes, (t) => t.totals.totalCents);
  const devolucionsCents = -suma(devolucions, (t) => t.totals.totalCents) || 0;
  /* Cada anul·lació compta al torn on es fa (BAR-R3): una comanda que passa
     de torn porta les anul·lades d'abans, i el torn que l'adopta no les torna
     a comptar. Les vendes i les obertes, totes dues: les dades de la fulla
     «Anul·lacions» ixen d'ací, i el resum i la fulla quadren. */
  const obertDes = Date.parse(torn.obertA);
  const delMateixTorn = (linia) => !(Date.parse(linia.anulladaA) < obertDes);
  const anullacionsDe = (c) => c.linies.filter((l) => !compta(l) && delMateixTorn(l)).map((l) => ({ comanda: c, linia: l }));
  const anullades = [...vendes.flatMap(anullacionsDe), ...obertes.flatMap(anullacionsDe)];
  const liniesAnullades = anullades.map((a) => a.linia);
  const entradesCents = suma(torn.moviments.filter((m) => m.tipus === 'entrada'), (m) => m.importCents);
  const eixidesCents = suma(torn.moviments.filter((m) => m.tipus === 'eixida'), (m) => m.importCents);

  /* Vendes per producte i per categoria: netes de devolucions. */
  const productes = new Map();
  const perCategoria = new Map();
  for (const t of delTorn) {
    for (const linia of t.linies) {
      if (!compta(linia)) continue;
      const unitats = signeDe(t) * linia.quantitat;
      const importCents = importLiniaTiquet(t, linia);
      const costCents = Number.isSafeInteger(linia.costUnitariCents) ? linia.costUnitariCents * unitats : null;
      afig(productes, linia.producteId, { unitats, importCents, costCents, dades: { nom: linia.nomCongelat, categoriaId: linia.categoriaId } });
      afig(perCategoria, linia.categoriaId, { unitats, importCents, costCents: null, dades: {} });
    }
  }
  const nomCategoria = new Map(categories.map((c) => [c.id, c.nom]));
  const tiquetsN = vendes.length;
  return {
    fonsInicialCents: torn.fonsInicialCents,
    vendesPerMetode,
    retornatPerMetode,
    totalVendesCents,
    tiquets: tiquetsN,
    tiquetMitjaCents: tiquetsN ? mitjaAmunt(totalVendesCents, tiquetsN) : 0,
    devolucions: devolucions.length,
    devolucionsCents,
    anullacions: {
      nombre: liniesAnullades.length,
      importCents: suma(liniesAnullades, (l) => l.preuUnitariCents * l.quantitat),
      /* El detall per a la fulla «Anul·lacions»; `numero` és null si la comanda encara és oberta. */
      detall: anullades.map(({ comanda, linia }) => ({
        moment: linia.anulladaA || comanda.tancatA || comanda.obertaA,
        numero: Number.isSafeInteger(comanda.numero) ? comanda.numero : null,
        nom: linia.nomCongelat,
        quantitat: linia.quantitat,
        importCents: linia.preuUnitariCents * linia.quantitat,
        motiu: linia.motiuAnullacio || ''
      }))
    },
    descomptesCents: suma(vendes, (t) => t.totals.descomptesCents),
    convidadesCents: suma(vendes, (t) => t.totals.convidadesCents),
    entradesCents,
    eixidesCents,
    efectiuEsperatCents: torn.fonsInicialCents + vendesPerMetode.efectiu - retornatPerMetode.efectiu + entradesCents - eixidesCents,
    comandesObertes: obertes.length,
    obertesCents: suma(obertes, (c) => totals(c).totalCents),
    perCategoria: [...perCategoria.entries()]
      .map(([categoriaId, v]) => ({ categoriaId, nom: nomCategoria.get(categoriaId) || categoriaId, unitats: v.unitats, importCents: v.importCents }))
      .sort((a, b) => b.importCents - a.importCents || a.nom.localeCompare(b.nom, 'ca')),
    perProducte: [...productes.entries()]
      .map(([producteId, v]) => ({ producteId, nom: v.nom, categoriaId: v.categoriaId, unitats: v.unitats, importCents: v.importCents, costCents: v.ambCost ? v.costCents : null }))
      .sort((a, b) => b.importCents - a.importCents || a.nom.localeCompare(b.nom, 'ca'))
  };
}

/**
 * Tanca el torn i el congela.
 *   arqueig { perDenominacio } (el total es calcula) · resum (resumTorn) ·
 *   traspas (notaDeTraspas) · obertes (les comandes obertes ara) · per · ara
 */
export function tancaTorn(torn, { arqueig: comptat, resum, traspas, obertes = [], per, ara } = {}) {
  exigeix(torn && torn.estat === 'obert', 'TORN_TANCAT', 'Este torn ja està tancat.');
  exigeix(esMoment(ara), 'MOMENT', 'Cal el moment del tancament.');
  exigeix(resum && typeof resum === 'object', 'RESUM', 'Cal el resum del torn.');
  const totalComptat = arqueig(comptat?.perDenominacio || {});
  const validacio = validaTraspas(traspas);
  exigeix(validacio.ok, 'TRASPAS', `La nota de traspàs no és vàlida: ${validacio.errors.join('; ')}`);
  exigeix(traspas.tornId === torn.id, 'TRASPAS', 'La nota de traspàs és d’un altre torn.');
  const alTraspas = new Set(traspas.comandesObertes.map((c) => c.id));
  const fora = obertes.filter((c) => !alTraspas.has(c.id));
  exigeix(fora.length === 0, 'OBERTES_SENSE_TRASPAS', 'Hi ha comandes obertes que no són a la nota de traspàs.');
  return congela(structuredClone({
    ...torn,
    estat: 'tancat',
    tancatA: ara,
    tancatPer: aliesNet(per, torn.obertPer),
    arqueig: { perDenominacio: { ...comptat.perDenominacio }, totalCents: totalComptat },
    diferenciaCaixaCents: totalComptat - resum.efectiuEsperatCents,
    resum,
    traspas
  }));
}
