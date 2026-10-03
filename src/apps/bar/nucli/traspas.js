/**
 * El Bar · nucli/traspas.js — la nota de traspàs del torn (§A.3, contracte
 * compartit amb el lot dels sentinelles: NO es canvia la forma).
 *
 *   sdp.bar.traspas.v1 = { schema, tornId, tancatA, de, fonsDeixatCents,
 *     comandesObertes: [{ id, origen: { tipus, taulaId? }, totalCents }],
 *     incidencies: [{ tipus: 'diferencia-caixa' | 'anullacions' | 'devolucions' | 'convidades', detall, importCents }],
 *     reposicio: [{ producteId, nom, unitats }],
 *     avisos: [string], llegidaPer, llegidaA }
 *
 * Les incidències s'afigen soles (diferència ≠ 0, anul·lacions, devolucions,
 * convidades). Una comanda amb pagaments no passa de torn: el cobrat ja és
 * al calaix d'este torn, i el següent el comptaria dues vegades.
 * El sentinella 6 («Enllaç del Torn») i el contracte sdp.sentinella.v1 no
 * existixen encara al repo: aSentinella torna null fins que es publiquen.
 */
import { aliesNet, errorBar, esCents, esId, esMoment, esSlug, textNet } from './comu.js';
import { ORIGENS, totals } from './comanda.js';

export const ESQUEMA_TRASPAS = 'sdp.bar.traspas.v1';
export const TIPUS_INCIDENCIA = Object.freeze(['diferencia-caixa', 'anullacions', 'devolucions', 'convidades']);
export const MAX_AVISOS = 10;
const MAX_AVIS = 80;
const MAX_DETALL = 120;
const CLAUS = Object.freeze(['schema', 'tornId', 'tancatA', 'de', 'fonsDeixatCents', 'comandesObertes', 'incidencies', 'reposicio', 'avisos', 'llegidaPer', 'llegidaA']);

const euros = (cents) => {
  const abs = Math.abs(cents);
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')} €`;
};

/** Les incidències que s'afigen soles a partir del resum i la diferència de caixa. */
export function incidenciesAutomatiques(resum, diferenciaCaixaCents) {
  const incidencies = [];
  if (esCents(diferenciaCaixaCents) && diferenciaCaixaCents !== 0) {
    incidencies.push({
      tipus: 'diferencia-caixa',
      detall: diferenciaCaixaCents > 0 ? `Sobren ${euros(diferenciaCaixaCents)} al calaix` : `Falten ${euros(-diferenciaCaixaCents)} al calaix`,
      importCents: diferenciaCaixaCents
    });
  }
  if (resum?.anullacions?.nombre > 0) {
    incidencies.push({ tipus: 'anullacions', detall: `${resum.anullacions.nombre} línies anul·lades`, importCents: resum.anullacions.importCents });
  }
  if (resum?.devolucions > 0) {
    incidencies.push({ tipus: 'devolucions', detall: `${resum.devolucions} devolucions`, importCents: resum.devolucionsCents });
  }
  if (resum?.convidadesCents > 0) {
    incidencies.push({ tipus: 'convidades', detall: 'Consumicions convidades', importCents: resum.convidadesCents });
  }
  return incidencies;
}

/**
 * La nota de traspàs del torn que es tanca.
 *   torn · resum · obertes (comandes obertes, sense pagaments) · reposicio ·
 *   avisos (frases curtes: «falta gel») · fonsDeixatCents · diferenciaCaixaCents · per · ara
 */
export function notaDeTraspas({
  torn, resum, obertes = [], reposicio = [], avisos = [], fonsDeixatCents = 0, diferenciaCaixaCents = 0, per, ara
} = {}) {
  if (!torn || !esId(torn.id)) throw errorBar('TORN', 'Cal el torn.');
  if (!esMoment(ara)) throw errorBar('MOMENT', 'Cal el moment del tancament.');
  if (!esCents(fonsDeixatCents) || fonsDeixatCents < 0) throw errorBar('IMPORT', 'El fons que es deixa és un enter de cèntims ≥ 0.');
  const ambPagaments = obertes.filter((c) => c.pagaments.length > 0);
  if (ambPagaments.length) {
    throw errorBar('OBERTA_AMB_PAGAMENTS', 'Hi ha comandes obertes amb pagaments: cal acabar de cobrar-les abans de tancar el torn.');
  }
  const avisosNets = avisos.map((avis) => textNet(avis, MAX_AVIS)).filter(Boolean).slice(0, MAX_AVISOS);
  return {
    schema: ESQUEMA_TRASPAS,
    tornId: torn.id,
    tancatA: ara,
    de: aliesNet(per, torn.obertPer),
    fonsDeixatCents,
    comandesObertes: obertes.map((c) => ({
      id: c.id,
      origen: c.origen.tipus === 'taula' ? { tipus: 'taula', taulaId: c.origen.taulaId } : { tipus: c.origen.tipus },
      totalCents: totals(c).totalCents
    })),
    incidencies: incidenciesAutomatiques(resum, diferenciaCaixaCents),
    reposicio: reposicio.map(({ producteId, nom, unitats }) => ({ producteId, nom, unitats })),
    avisos: avisosNets,
    llegidaPer: null,
    llegidaA: null
  };
}

/** Comprova la forma exacta de sdp.bar.traspas.v1 (claus tancades). */
export function validaTraspas(nota) {
  const errors = [];
  if (!nota || typeof nota !== 'object' || Array.isArray(nota)) return { ok: false, errors: ['la nota ha de ser un objecte'] };
  for (const clau of Object.keys(nota)) if (!CLAUS.includes(clau)) errors.push(`clau desconeguda «${clau}»`);
  for (const clau of CLAUS) if (!Object.hasOwn(nota, clau)) errors.push(`falta «${clau}»`);
  if (nota.schema !== ESQUEMA_TRASPAS) errors.push(`schema ha de ser ${ESQUEMA_TRASPAS}`);
  if (!esId(nota.tornId)) errors.push('tornId ha de ser un id');
  if (!esMoment(nota.tancatA)) errors.push('tancatA ha de ser un moment ISO');
  if (!(typeof nota.de === 'string' && nota.de.trim() && nota.de.length <= 24)) errors.push('de és un àlies curt');
  if (!(esCents(nota.fonsDeixatCents) && nota.fonsDeixatCents >= 0)) errors.push('fonsDeixatCents ha de ser cèntims ≥ 0');
  if (!Array.isArray(nota.comandesObertes)) errors.push('comandesObertes ha de ser una llista');
  else nota.comandesObertes.forEach((c, i) => {
    if (!esId(c?.id)) errors.push(`comandesObertes[${i}].id`);
    if (!ORIGENS.includes(c?.origen?.tipus)) errors.push(`comandesObertes[${i}].origen.tipus`);
    if (c?.origen?.tipus === 'taula' && !esSlug(c.origen.taulaId)) errors.push(`comandesObertes[${i}].origen.taulaId`);
    if (!(esCents(c?.totalCents) && c.totalCents >= 0)) errors.push(`comandesObertes[${i}].totalCents`);
  });
  if (!Array.isArray(nota.incidencies)) errors.push('incidencies ha de ser una llista');
  else nota.incidencies.forEach((inc, i) => {
    if (!TIPUS_INCIDENCIA.includes(inc?.tipus)) errors.push(`incidencies[${i}].tipus`);
    if (!(typeof inc?.detall === 'string' && inc.detall.length <= MAX_DETALL)) errors.push(`incidencies[${i}].detall`);
    if (!esCents(inc?.importCents)) errors.push(`incidencies[${i}].importCents`);
  });
  if (!Array.isArray(nota.reposicio)) errors.push('reposicio ha de ser una llista');
  else nota.reposicio.forEach((r, i) => {
    if (!esSlug(r?.producteId)) errors.push(`reposicio[${i}].producteId`);
    if (!(typeof r?.nom === 'string' && r.nom.trim())) errors.push(`reposicio[${i}].nom`);
    if (!(Number.isSafeInteger(r?.unitats) && r.unitats >= 1)) errors.push(`reposicio[${i}].unitats`);
  });
  if (!Array.isArray(nota.avisos) || nota.avisos.length > MAX_AVISOS
    || nota.avisos.some((a) => !(typeof a === 'string' && a.trim() && a.length <= MAX_AVIS))) errors.push('avisos: frases curtes, com a màxim 10');
  if (!(nota.llegidaPer === null || (typeof nota.llegidaPer === 'string' && nota.llegidaPer.length <= 24))) errors.push('llegidaPer');
  if (!(nota.llegidaA === null || esMoment(nota.llegidaA))) errors.push('llegidaA');
  if ((nota.llegidaPer === null) !== (nota.llegidaA === null)) errors.push('llegidaPer i llegidaA van junts');
  return { ok: errors.length === 0, errors };
}

/** Marca la nota com a llegida (un toc). Si ja ho estava, no canvia res. */
export function marcaLlegida(nota, { per, ara } = {}) {
  if (!esMoment(ara)) throw errorBar('MOMENT', 'Cal el moment de la lectura.');
  if (nota.llegidaA) return nota;
  return { ...nota, llegidaPer: aliesNet(per), llegidaA: ara };
}

/**
 * Adaptador al contracte dels sentinelles (sdp.sentinella.v1). El contracte
 * encara no està publicat al repo: no s'inventa, i es torna null.
 */
export function aSentinella(nota) {
  void nota;
  return null;
}
