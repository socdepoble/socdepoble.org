/**
 * resumTauler.js — les xifres del Tauler de la Gestoria, derivades dels
 * extractes del banc.
 *
 * Pas 1 de l'onada 2 (MAPA_EMPRESA_GESTORIA §2.4 i §4; ordre del Mestre del
 * 261004). Res d'ací té cap xifra escrita: tot ix de les lectures que fa el
 * tractor 'gestoria.tauler' amb el nucli de sempre, que només s'importa:
 *   · nucli/c43.js · els comptes, el saldo i els moviments de la Norma 43;
 *   · nucli/movimentsBanc.js · el CSV del banc, fusionat amb la Norma 43
 *     (fusionaMoviments: el comerç de les compres amb targeta);
 *   · nucli/concilia.js · el recompte de la conciliació amb les factures.
 *
 * comptesDe(lectures) · els comptes: un per compte de veres (l'id opac que
 *   c43.js deriva del número sencer, que no ix mai d'allí). Si dos extractes
 *   del mateix compte cobrixen els mateixos dies, cada moviment compta una
 *   vegada, i ho diu un avís. Un CSV sense cap Norma 43 fa un compte propi,
 *   sense número, amb el saldo de la seua última fila.
 * Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla 261013_1405, front
 *   I · motors), que adopta l'auditoria de Codex 261013_1510 sobre l'ordre
 *   del 261004. Abans el compte era «entitat i quatre últims dígits» i, de
 *   dos extractes que se solapaven, els moviments de després només comptaven
 *   des del final del primer. Ara:
 *   · GES-A2 · la clau del compte és `idCompte` (opac, de la clau sencera);
 *     l'entitat i el sufix només fan l'id de presentació («c43-9999-4321» i,
 *     si dos comptes diferents el compartixen, «c43-9999-4321-2»). Una
 *     lectura sense `idCompte` (feta a mà) torna a la clau d'abans.
 *   · GES-A3 · els moviments de diversos extractes d'un compte s'unixen per
 *     identitat (dates, import, concepte comú i divisa): cada un hi és tantes
 *     vegades com en l'extracte que més vegades el porta. Un acumulat que
 *     inclou un tram ja vist no perd res, i l'ordre dels fitxers no canvia el
 *     resultat. Cada compte du `cobert`, els intervals que cobrixen de veres
 *     els seus extractes.
 *   · GES-A1 · el mateix fitxer (extracte o CSV) triat dues vegades compta
 *     una, amb un avís; dues files iguals del MATEIX fitxer són dos càrrecs
 *     de veres i compten dos. Les files de CSV diferents s'unixen com els
 *     extractes, per dates, import i saldo.
 *   · Revisió adversarial 13-10-2026, troballes FIN-1 i TI-3: només s'unixen
 *     les files de CSV diferents que porten el saldo de després (la seua
 *     identitat queda ancorada). Sense saldo, dates i import no basten per a
 *     dir que és el mateix càrrec (dos comptes poden pagar la mateixa quota
 *     el mateix dia): es conserven totes, i si fitxers diferents porten files
 *     amb les mateixes dates i el mateix import, alguna sense saldo, l'avís
 *     CSV_POSSIBLES_REPETITS ho diu (només sense Norma 43, que és quan les
 *     files del CSV compten com a diners). Dos CSV sense saldo
 *     iguals fila a fila continuen comptant com un (no es poden distingir del
 *     mateix triat dues vegades), amb un avís que diu el dubte.
 * fluxMensual({ comptes, fins, mesos }) · les entrades i les eixides de cada
 *   mes dels últims `mesos` fins al mes de `fins`, amb la cobertura de cada
 *   mes (per a la Cabina d'Avió, front E del mateix pla).
 * resumTauler({ comptes, factures, avui }) · la caixa real (la suma dels
 *   saldos en euros), la cobertura (els mesos que la caixa paga la despesa
 *   mitjana dels últims sis mesos observats), les finances dels últims 30
 *   dies (del banc i, si n'hi ha, de les factures, sobre la base imposable),
 *   la tresoreria de cada compte i el recompte de la conciliació.
 * La data de referència (`fins`) és l'última que cobrixen els extractes, mai
 * la d'ara: un extracte de fa dos mesos no diu res dels últims 30 dies d'avui.
 * Quan una xifra no es pot saber, és null amb un `motiu`; mai un zero.
 * Ordre del Mestre, 261004 (zeros falsos): sense cap moviment en euros a la
 * finestra (cap compte en euros, o cap moviment seu), les entrades, les
 * eixides i la diferència són null («sense mesura en euros»), no 0; igual
 * les vendes o les compres sense cap factura en euros amb import.
 *
 * JS pur: sense DOM, React ni xarxa. Imports en cèntims enters. Res del que
 * rep es modifica.
 */
import { concilia } from '../../nucli/concilia.js';
import { comparaDates, diesDelMes, diesEntre, dinsDeRang, esDataValida, formatData } from '../../nucli/dates.js';
import { fusionaMoviments } from '../../nucli/movimentsBanc.js';

/** Els dies de la finestra de les finances. */
export const FINESTRA_DIES = 30;
/** Els mesos, com a molt, de la mitjana de despesa de la cobertura. */
export const MESOS_MITJANA = 6;
/** La moneda de les xifres del Tauler. */
export const MONEDA_TAULER = 'EUR';
/** Un mes mitjà de l'any gregorià, en dies (exportat per a la Cabina d'Avió, front E del pla 261013_1405). */
export const DIES_PER_MES = 365.2425 / 12;
/** Els mesos de fluxMensual si no se'n diu cap altre nombre. */
export const MESOS_FLUX = 12;

/** Els codis dels avisos de comptesDe i dels motius de resumTauler. */
export const CODIS_TAULER = Object.freeze([
  'EXTRACTES_SOLAPATS', 'CSV_SENSE_PARELLA', 'SENSE_SALDO', 'ALTRA_MONEDA', 'SENSE_DADES', 'POCS_DIES', 'SENSE_DESPESES',
  'SENSE_MOVIMENTS', 'FITXERS_REPETITS', 'CSV_POSSIBLES_REPETITS'
]);

const enter = (x) => Number.isSafeInteger(x);
const avis = (codi, missatge) => Object.freeze({ codi, missatge });
/* La més tardana i la més primerenca de dues dates; una data absent no guanya mai. */
const posterior = (x, y) => (!esDataValida(y) ? x : !esDataValida(x) ? y : comparaDates(x, y) >= 0 ? x : y);
const anterior = (x, y) => (!esDataValida(y) ? x : !esDataValida(x) ? y : comparaDates(x, y) <= 0 ? x : y);
const darrera = (dates) => dates.filter(esDataValida).reduce((x, y) => (x ? posterior(x, y) : y), null);
const primera = (dates) => dates.filter(esDataValida).reduce((x, y) => (x ? anterior(x, y) : y), null);

/**
 * La data que és `n` dies després (o abans, amb n negatiu) de `d`.
 * @param {{a:number,m:number,d:number}} d
 * @param {number} n
 * @returns {{a:number,m:number,d:number}|null}
 */
export function sumaDies(d, n) {
  if (!esDataValida(d) || !Number.isInteger(n)) return null;
  const data = new Date(Date.UTC(d.a, d.m - 1, d.d + n));
  return { a: data.getUTCFullYear(), m: data.getUTCMonth() + 1, d: data.getUTCDate() };
}

/**
 * La data que és `n` mesos abans de `d`, amb el dia retallat al final del mes
 * («31 d'agost» menys sis mesos és el 28 o el 29 de febrer).
 * @param {{a:number,m:number,d:number}} d
 * @param {number} n
 * @returns {{a:number,m:number,d:number}|null}
 */
export function restaMesos(d, n) {
  if (!esDataValida(d) || !Number.isInteger(n)) return null;
  const total = d.a * 12 + (d.m - 1) - n;
  const a = Math.floor(total / 12);
  const m = total - a * 12 + 1;
  return { a, m, d: Math.min(d.d, diesDelMes(a, m)) };
}

/* El saldo final d'un compte de la Norma 43: el del peu (33) o, sense peu,
   l'inicial més els moviments, si tots es poden llegir. */
function saldoDeCompte(compte) {
  if (enter(compte?.peu?.saldoFinal)) return { saldo: compte.peu.saldoFinal, de: 'peu' };
  const inicial = compte?.capcalera?.saldoInicial;
  const moviments = compte?.moviments ?? [];
  if (!enter(inicial) || !moviments.every((m) => enter(m?.centims))) return { saldo: null, de: null };
  return { saldo: moviments.reduce((total, m) => total + m.centims, inicial), de: 'calculat' };
}

/* ── La identitat dels comptes, dels fitxers i dels moviments ─────────────
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I · motors; auditoria
   de Codex 261013_1510, GES-A1, A2 i A3). Vegeu la capçalera. */

/* Una data com a text estable per a les claus: 'aaaa-mm-dd', o '' si no n'hi ha. */
const textData = (d) => formatData(d, 'aaaa-mm-dd');
/* La identitat d'un moviment de la Norma 43 (la lectura reduïda no en porta cap altra). */
const clauMovimentC43 = (m) => [
  textData(m?.dataOperacio), textData(m?.dataValor), m?.centims ?? '', m?.conceptComu ?? '', m?.divisa?.moneda ?? '', m?.divisa?.centims ?? ''
].join('|');
/* La identitat d'una fila del CSV del banc: el saldo de després separa dos càrrecs iguals del mateix dia. */
const clauFilaCsv = (f) => [textData(f?.dataOperacio), textData(f?.dataValor), f?.centims ?? '', f?.saldo ?? ''].join('|');
/* Revisió adversarial 13-10-2026, troballes FIN-1 i TI-3: una fila de CSV amb el saldo de després té la identitat
   ancorada; sense, dues files de fitxers diferents amb les mateixes dates i el mateix import poden ser dos càrrecs. */
const filaAncorada = (f) => enter(f?.saldo);
const comparaText = (x, y) => (x < y ? -1 : x > y ? 1 : 0);

/* La clau d'un compte de la Norma 43 (GES-A2): l'id opac de c43.js; una lectura sense (feta a mà) torna a
   l'entitat i el sufix d'abans. Els dos espais de noms no es poden confondre. */
const clauDelCompte = (cap) => (typeof cap?.idCompte === 'string' && cap.idCompte !== ''
  ? `opac:${cap.idCompte}`
  : `sufix:${cap?.entitat ?? ''}-${cap?.compte4 ?? ''}`);

/* L'id de presentació de cada compte: «c43-entitat-sufix», el de sempre. Dos comptes diferents amb la mateixa
   entitat i el mateix sufix (GES-A2) es distingixen amb «-2», «-3»…, en l'ordre de les seues claus. */
function idsDelsComptes(grups) {
  const perBase = new Map();
  for (const [clau, trams] of grups) {
    const base = `c43-${trams[0].entitat ?? ''}-${trams[0].compte4 ?? ''}`;
    if (!perBase.has(base)) perBase.set(base, []);
    perBase.get(base).push(clau);
  }
  const ids = new Map();
  for (const [base, claus] of perBase) {
    [...claus].sort(comparaText).forEach((clau, i) => ids.set(clau, i === 0 ? base : `${base}-${i + 1}`));
  }
  return ids;
}

/**
 * La unió de diverses llistes de moviments del mateix compte (GES-A3 i GES-A1):
 * cada moviment, per la seua clau, hi és tantes vegades com en la llista que
 * més vegades el porta. Dos càrrecs iguals del MATEIX extracte hi són dos; un
 * moviment que un altre extracte també cobrix, una. El conjunt no depén de
 * l'ordre de les llistes; cada llista conserva el seu ordre.
 * `ancorat(m)` fals (revisió adversarial 13-10-2026, troballes FIN-1 i TI-3):
 * la clau no basta per a dir que és el mateix moviment, i hi és sempre.
 */
function unioPerIdentitat(llistes, clauDe, ancorat = () => true) {
  const presos = new Map();
  const unio = [];
  for (const llista of llistes) {
    const vistos = new Map();
    for (const m of llista) {
      if (!ancorat(m)) {
        unio.push(m);
        continue;
      }
      const clau = clauDe(m);
      const n = (vistos.get(clau) ?? 0) + 1;
      vistos.set(clau, n);
      if (n > (presos.get(clau) ?? 0)) {
        presos.set(clau, n);
        unio.push(m);
      }
    }
  }
  return unio;
}

/* Els intervals { desde, fins } units: dos que se solapen o es toquen (l'un acaba el dia abans que l'altre
   comence) en fan un. Un interval sense dates vàlides no cobrix res. */
function uneixIntervals(intervals) {
  const valids = intervals.filter((i) => esDataValida(i?.desde) && esDataValida(i?.fins) && comparaDates(i.desde, i.fins) <= 0)
    .sort((x, y) => comparaDates(x.desde, y.desde) || comparaDates(x.fins, y.fins));
  const units = [];
  for (const { desde, fins } of valids) {
    const darrer = units[units.length - 1];
    if (darrer && comparaDates(desde, sumaDies(darrer.fins, 1)) <= 0) darrer.fins = posterior(darrer.fins, fins);
    else units.push({ desde, fins });
  }
  return units;
}

/* L'empremta d'un tram (un extracte d'un compte): el mateix fitxer triat dues vegades en fa dos d'iguals. */
const empremtaDeTram = (t) => [
  textData(t.desde), textData(t.fins), t.saldo ?? '', t.saldoDe ?? '', t.divisa ?? '', t.avisos, ...t.moviments.map(clauMovimentC43)
].join('\n');

/* Els trams (un per extracte) d'un compte, units: el saldo del més recent i cada moviment una vegada. */
function uneixTrams(id, trams, avisos) {
  const unics = new Map();
  for (const tram of trams) {
    const empremta = empremtaDeTram(tram);
    if (!unics.has(empremta)) unics.set(empremta, tram);
  }
  if (unics.size < trams.length) {
    avisos.push(avis('FITXERS_REPETITS',
      `El mateix extracte del compte acabat en ${trams[0].compte4} s’ha triat més d’una vegada: compta una sola vegada.`));
  }
  /* Per l'inici, pel final i, empatats, per l'empremta: l'ordre de triar els fitxers no canvia res. */
  const ordenats = [...unics.entries()]
    .sort(([ex, x], [ey, y]) => comparaDates(x.desde, y.desde) || comparaDates(x.fins, y.fins) || comparaText(ex, ey))
    .map(([, tram]) => tram);
  let cobert = null;
  for (const tram of ordenats) {
    if (cobert && esDataValida(tram.desde) && comparaDates(tram.desde, cobert) <= 0) {
      avisos.push(avis('EXTRACTES_SOLAPATS',
        `Dos extractes del compte acabat en ${tram.compte4} cobrixen els mateixos dies: els moviments repetits només compten una vegada.`));
    }
    cobert = cobert ? posterior(cobert, tram.fins) : tram.fins;
  }
  /* El saldo és el del tram que acaba més tard; empatats, el que comença abans (el que cobrix més). */
  const darrer = ordenats.reduce((millor, t) => (
    !millor || (esDataValida(t.fins) && (!esDataValida(millor.fins) || comparaDates(t.fins, millor.fins) > 0)) ? t : millor
  ), null);
  const divises = new Set(ordenats.map((t) => t.divisa));
  return {
    id,
    entitat: darrer.entitat,
    compte4: darrer.compte4,
    divisa: divises.size === 1 ? darrer.divisa : null,
    desde: primera(ordenats.map((t) => t.desde)),
    fins: darrera(ordenats.map((t) => t.fins)),
    cobert: uneixIntervals(ordenats.map((t) => ({ desde: t.desde, fins: t.fins }))),
    saldo: darrer.saldo,
    saldoDe: darrer.saldoDe,
    moviments: unioPerIdentitat(ordenats.map((t) => t.moviments), clauMovimentC43),
    avisos: ordenats.reduce((total, t) => total + t.avisos, 0)
  };
}

/* El final d'un fitxer CSV: la seua última data i la fila del saldo d'eixe dia. Un CSV amb la més nova
   primer: el saldo de la mateixa data és el de la fila de dalt. */
function finalDelCsv(files) {
  const valides = files.filter((f) => esDataValida(f?.dataOperacio));
  if (!valides.length) return null;
  const fins = darrera(valides.map((f) => f.dataOperacio));
  const descendent = comparaDates(valides[0].dataOperacio, valides[valides.length - 1].dataOperacio) > 0;
  const delDarrerDia = valides.filter((f) => comparaDates(f.dataOperacio, fins) === 0);
  return { desde: primera(valides.map((f) => f.dataOperacio)), fins, ultima: descendent ? delDarrerDia[0] : delDarrerDia[delDarrerDia.length - 1] };
}

/*
 * Les files de la unió que potser hi són dues vegades (revisió adversarial 13-10-2026, troballes FIN-1 i TI-3):
 * per a cada data, data valor i import que porten files de més d'un fitxer, alguna d'elles sense saldo, les de
 * tots els fitxers menys les del fitxer que més en porta (les que una unió només per dates i import hauria
 * llevat). Només les files que compten (amb data i import). `fitxerDe`: de cada fila, l'índex del seu fitxer.
 */
const clauSenseSaldo = (f) => [textData(f?.dataOperacio), textData(f?.dataValor), f?.centims ?? ''].join('|');
function possiblesRepetits(files, fitxerDe) {
  const grups = new Map();
  for (const f of files) {
    if (!esDataValida(f?.dataOperacio) || !enter(f?.centims)) continue;
    const clau = clauSenseSaldo(f);
    const grup = grups.get(clau) ?? { perFitxer: new Map(), senseSaldo: false };
    const i = fitxerDe.get(f);
    grup.perFitxer.set(i, (grup.perFitxer.get(i) ?? 0) + 1);
    grup.senseSaldo = grup.senseSaldo || !filaAncorada(f);
    grups.set(clau, grup);
  }
  let repetits = 0;
  for (const { perFitxer, senseSaldo } of grups.values()) {
    if (!senseSaldo || perFitxer.size < 2) continue;
    const quantes = [...perFitxer.values()];
    repetits += quantes.reduce((total, n) => total + n, 0) - Math.max(...quantes);
  }
  return repetits;
}

/**
 * Els fitxers CSV del banc, cada un una vegada (GES-A1), en ordre de dates (i,
 * empatats, d'empremta): l'ordre de triar-los no canvia res. Torna les files
 * de cada fitxer, la seua unió per identitat (només les files amb saldo: les
 * altres hi són totes) i `repetits`, les files sense saldo que també porta un
 * altre fitxer (revisió adversarial 13-10-2026, troballes FIN-1 i TI-3).
 */
function fitxersCsv(csv, avisos) {
  const unics = new Map();
  let total = 0;
  let repetitSenseSaldo = false;
  for (const { lectura } of Array.isArray(csv) ? csv : []) {
    const files = lectura?.moviments ?? [];
    if (!files.length) continue;
    total += 1;
    const empremta = files.map(clauFilaCsv).join('\n');
    if (!unics.has(empremta)) unics.set(empremta, { files, final: finalDelCsv(files) });
    else if (!files.some(filaAncorada)) repetitSenseSaldo = true;
  }
  if (unics.size < total) {
    /* Sense saldo, dos CSV iguals fila a fila poden ser de dos comptes: compten com un, però es diu el dubte. */
    avisos.push(avis('FITXERS_REPETITS', repetitSenseSaldo
      ? 'Dos CSV del banc sense la columna del saldo són iguals fila a fila: compten com un de sol. Si eren de dos comptes diferents, falten els moviments d’un.'
      : 'El mateix CSV del banc s’ha triat més d’una vegada: compta una sola vegada.'));
  }
  const ordenats = [...unics.entries()]
    .sort(([ex, x], [ey, y]) => comparaDates(x.final?.desde, y.final?.desde) || comparaDates(x.final?.fins, y.final?.fins) || comparaText(ex, ey))
    .map(([, fitxer]) => fitxer);
  const llistes = ordenats.map((f) => f.files);
  const files = unioPerIdentitat(llistes, clauFilaCsv, filaAncorada);
  const fitxerDe = new Map(llistes.flatMap((llista, i) => llista.map((f) => [f, i])));
  return { fitxers: ordenats, files, repetits: possiblesRepetits(files, fitxerDe) };
}

/* Un compte fet només del CSV del banc: sense número, amb el saldo de l'última fila del fitxer que acaba més tard. */
function compteDelCsv({ fitxers, files }) {
  const valides = files.filter((f) => esDataValida(f?.dataOperacio));
  const finals = fitxers.map((f) => f.final).filter(Boolean);
  if (!valides.length || !finals.length) return null;
  const perData = valides.map((f, i) => ({ f, i }))
    .sort((x, y) => comparaDates(x.f.dataOperacio, y.f.dataOperacio) || x.i - y.i)
    .map(({ f }) => f);
  const darrer = finals.reduce((millor, f) => (!millor || comparaDates(f.fins, millor.fins) > 0 ? f : millor), null);
  return {
    id: 'csv',
    entitat: null,
    compte4: null,
    divisa: MONEDA_TAULER,
    desde: perData[0].dataOperacio,
    fins: darrer.fins,
    cobert: uneixIntervals(finals.map(({ desde, fins }) => ({ desde, fins }))),
    saldo: enter(darrer.ultima.saldo) ? darrer.ultima.saldo : null,
    saldoDe: enter(darrer.ultima.saldo) ? 'csv' : null,
    moviments: perData.filter((f) => enter(f.centims)),
    avisos: 0
  };
}

const severes = (lectura) => (lectura?.avisos ?? []).filter((a) => a?.severitat === 'alta' || a?.severitat === 'mitjana').length;

/**
 * Els comptes del banc a partir de les lectures del tractor.
 * @param {{ extractes?: Array<{ nom?: string, lectura: object }>, csv?: Array<{ nom?: string, lectura: object }> }} [lectures]
 *   `lectura`: el que tornen llegeixC43 i llegeixMovimentsCsv
 * @returns {{ comptes: Array<{ id: string, entitat: string|null, compte4: string|null, divisa: string|null,
 *   desde: object|null, fins: object|null, cobert: Array<{ desde: object, fins: object }>, saldo: number|null,
 *   saldoDe: string|null, moviments: object[], avisos: number }>, avisos: Array<{ codi: string, missatge: string }> }}
 *   `avisos` de cada compte: els avisos alts i mitjans de la lectura (fitxer tallat, sumes que no quadren).
 *   `cobert`: els intervals que cobrixen de veres els extractes del compte, units.
 */
export function comptesDe({ extractes = [], csv = [] } = {}) {
  const avisos = [];
  const grups = new Map();
  for (const { lectura } of Array.isArray(extractes) ? extractes : []) {
    const avisosLectura = severes(lectura);
    for (const [k, compte] of (lectura?.comptes ?? []).entries()) {
      const cap = compte?.capcalera ?? {};
      const clau = clauDelCompte(cap);
      const { saldo, de } = saldoDeCompte(compte);
      const tram = {
        entitat: cap.entitat ?? null,
        compte4: cap.compte4 ?? null,
        divisa: cap.divisa ?? null,
        desde: esDataValida(cap.dataInicial) ? cap.dataInicial : primera((compte.moviments ?? []).map((m) => m?.dataOperacio)),
        fins: esDataValida(cap.dataFinal) ? cap.dataFinal : darrera((compte.moviments ?? []).map((m) => m?.dataOperacio)),
        saldo,
        saldoDe: de,
        moviments: compte.moviments ?? [],
        avisos: k === 0 ? avisosLectura : 0
      };
      if (!grups.has(clau)) grups.set(clau, []);
      grups.get(clau).push(tram);
    }
  }
  const ids = idsDelsComptes(grups);
  const comptes = [...grups.entries()].map(([clau, trams]) => uneixTrams(ids.get(clau), trams, avisos));
  const delCsv = fitxersCsv(csv, avisos);
  const filesCsv = delCsv.files;
  if (comptes.length && filesCsv.length) {
    /* Una sola fusió per a tots els comptes: una fila del CSV fa parella, com a molt, amb un moviment. */
    const tots = comptes.flatMap((c) => c.moviments);
    const { moviments, senseParella } = fusionaMoviments(tots, filesCsv);
    let k = 0;
    for (const compte of comptes) {
      compte.moviments = moviments.slice(k, k + compte.moviments.length);
      k += compte.moviments.length;
    }
    if (senseParella.csv.length) {
      avisos.push(avis('CSV_SENSE_PARELLA', senseParella.csv.length === 1
        ? 'Una fila del CSV del banc no té el seu moviment a la Norma 43: no es compta dues vegades.'
        : `${senseParella.csv.length} files del CSV del banc no tenen el seu moviment a la Norma 43: no es compten dues vegades.`));
    }
  } else if (filesCsv.length) {
    const compte = compteDelCsv(delCsv);
    if (compte) comptes.push(compte);
    /* Revisió adversarial 13-10-2026, troballes FIN-1 i TI-3: només ací les files del CSV són diners; amb Norma 43,
       una fila de més es queda sense parella i ja ho diu CSV_SENSE_PARELLA. */
    if (compte && delCsv.repetits > 0) {
      avisos.push(avis('CSV_POSSIBLES_REPETITS', delCsv.repetits === 1
        ? 'Una fila sense saldo d’un CSV del banc té les mateixes dates i el mateix import que una d’un altre CSV: compten totes dues, perquè sense el saldo no es pot saber si és el mateix càrrec. Si els dos fitxers són del mateix compte, tria’n un amb la columna del saldo.'
        : `${delCsv.repetits} files sense saldo dels CSV del banc tenen les mateixes dates i el mateix import que unes d’un altre CSV: compten totes, perquè sense el saldo no es pot saber si són els mateixos càrrecs. Si els fitxers són del mateix compte, tria’n uns amb la columna del saldo.`));
    }
  }
  return { comptes, avisos };
}

/* Les entrades, les eixides i el recompte dels moviments d'un rang. Sense
   cap moviment no hi ha res mesurat: els imports són null, mai 0. */
function fluxDe(moviments, rang) {
  const dins = moviments.filter((m) => enter(m?.centims) && dinsDeRang(m.dataOperacio, rang));
  if (!dins.length) return { entrades: null, eixides: null, net: null, moviments: 0 };
  const entrades = dins.filter((m) => m.centims > 0).reduce((total, m) => total + m.centims, 0);
  const eixides = dins.filter((m) => m.centims < 0).reduce((total, m) => total - m.centims, 0);
  return { entrades, eixides, net: entrades - eixides, moviments: dins.length };
}

/* Com cobrixen uns intervals units un mes de calendari: 'completa', 'parcial' o 'cap'. */
function coberturaDelMes(intervals, inici, fi) {
  if (intervals.some((i) => comparaDates(i.desde, inici) <= 0 && comparaDates(i.fins, fi) >= 0)) return 'completa';
  return intervals.some((i) => comparaDates(i.desde, fi) <= 0 && comparaDates(i.fins, inici) >= 0) ? 'parcial' : 'cap';
}

/**
 * El flux de caixa de cada mes, per a la Cabina d'Avió (ordre del Mestre,
 * 13-10-2026, pla 261013_1405, front E): els `mesos` mesos de calendari que
 * acaben en el de `fins`, del més antic al més nou, només dels comptes en
 * euros. Cada mes, la seua cobertura pels extractes:
 *   · 'completa' · tots els comptes en euros cobrixen el mes sencer;
 *   · 'parcial' · algun el cobrix en part (el mes de `fins`, si `fins` no és
 *     l'últim dia del mes; o un buit entre dos extractes d'un compte);
 *   · 'cap' · cap extracte en diu res: les entrades, les eixides i el net
 *     són null i els moviments 0, mai un 0,00 € (ordre del Mestre, 261004).
 * Amb cobertura, les xifres són les de fluxDe del mes fins a `fi` (l'últim dia
 * del mes o `fins`): sense cap moviment, null, com a les finances.
 * La cobertura ix dels intervals units de cada compte (`cobert` de comptesDe;
 * un compte sense, del seu [desde, fins]): un buit entre dos extractes del
 * mateix compte es veu. Dins d'un extracte, uns dies sense moviments són dies
 * coberts sense res. Els traspassos entre comptes propis compten com a
 * entrada en un i eixida en l'altre.
 * @param {object} [p]
 * @param {object[]} [p.comptes] els de comptesDe
 * @param {{a:number,m:number,d:number}|null} [p.fins] la data de referència (resumTauler().fins), mai la d'avui
 * @param {number} [p.mesos]
 * @returns {Array<{ clau: string, any: number, mes: number, inici: object, fi: object,
 *   cobertura: 'completa'|'parcial'|'cap', entrades: number|null, eixides: number|null, net: number|null,
 *   moviments: number }>} [] sense `fins` vàlid, sense cap compte en euros o amb `mesos` que no és un enter positiu
 */
export function fluxMensual({ comptes = [], fins = null, mesos = MESOS_FLUX } = {}) {
  if (!esDataValida(fins) || !Number.isSafeInteger(mesos) || mesos < 1) return [];
  const enEuros = (Array.isArray(comptes) ? comptes : []).filter((c) => c?.divisa === MONEDA_TAULER);
  if (!enEuros.length) return [];
  const coberts = enEuros.map((c) => uneixIntervals(Array.isArray(c.cobert) ? c.cobert : [{ desde: c.desde, fins: c.fins }]));
  const moviments = enEuros.flatMap((c) => c.moviments ?? []);
  const primer = fins.a * 12 + (fins.m - 1) - (mesos - 1);
  const llista = [];
  for (let k = 0; k < mesos; k += 1) {
    const any = Math.floor((primer + k) / 12);
    const mes = primer + k - any * 12 + 1;
    const inici = { a: any, m: mes, d: 1 };
    const finalDelMes = { a: any, m: mes, d: diesDelMes(any, mes) };
    const fi = comparaDates(finalDelMes, fins) <= 0 ? finalDelMes : { a: fins.a, m: fins.m, d: fins.d };
    const estats = coberts.map((intervals) => coberturaDelMes(intervals, inici, finalDelMes));
    const cobertura = estats.every((e) => e === 'completa') ? 'completa' : estats.some((e) => e !== 'cap') ? 'parcial' : 'cap';
    const flux = cobertura === 'cap' ? { entrades: null, eixides: null, net: null, moviments: 0 } : fluxDe(moviments, { inici, fi });
    llista.push({ clau: `${any}-${String(mes).padStart(2, '0')}`, any, mes, inici, fi, cobertura, ...flux });
  }
  return llista;
}

/* Les factures d'un rang, sobre la base imposable (subtotal), en euros.
   Sense cap factura emesa (o rebuda) en euros amb import, les vendes (o les
   compres) no s'han mesurat: null, mai 0; i sense cap de les dues, el
   rendiment tampoc. Les que no se sumen fan la xifra incompleta. */
function facturesDe(factures, rang) {
  const del = factures.filter((f) => f && typeof f === 'object' && dinsDeRang(f.data, rang));
  if (!del.length) return null;
  const sumables = del.filter((f) => (f.moneda == null || f.moneda === MONEDA_TAULER) && enter(f.subtotal));
  const emeses = sumables.filter((f) => f.tipus === 'ingres');
  const rebudes = sumables.filter((f) => f.tipus !== 'ingres');
  const vendes = emeses.length ? emeses.reduce((total, f) => total + f.subtotal, 0) : null;
  const compres = rebudes.length ? rebudes.reduce((total, f) => total + f.subtotal, 0) : null;
  return {
    emeses: del.filter((f) => f.tipus === 'ingres').length,
    rebudes: del.filter((f) => f.tipus !== 'ingres').length,
    vendes,
    compres,
    rendiment: sumables.length ? (vendes ?? 0) - (compres ?? 0) : null,
    completa: sumables.length === del.length
  };
}

/**
 * Les xifres del Tauler.
 * @param {object} [p]
 * @param {object[]} [p.comptes] els de comptesDe
 * @param {object[]} [p.factures] les factures del model (nucli/model.js), si n'hi ha
 * @param {{a:number,m:number,d:number}|null} [p.avui] només si no hi ha cap extracte amb data
 * @param {number} [p.finestraDies]
 * @param {number} [p.mesosMitjana]
 * @returns {{ fins: object|null, caixa: object, cobertura: object, finances: object, tresoreria: object[],
 *   conciliacio: object }}
 */
export function resumTauler({
  comptes = [], factures = [], avui = null, finestraDies = FINESTRA_DIES, mesosMitjana = MESOS_MITJANA
} = {}) {
  const llista = Array.isArray(comptes) ? comptes : [];
  const llistaFactures = Array.isArray(factures) ? factures : [];
  const enEuros = llista.filter((c) => c.divisa === MONEDA_TAULER);
  const exclosos = llista.filter((c) => c.divisa !== MONEDA_TAULER).map((c) => c.id);
  const fins = darrera(llista.map((c) => c.fins)) ?? (esDataValida(avui) ? avui : null);

  /* La caixa real: la suma dels saldos en euros que se saben. */
  const ambSaldo = enEuros.filter((c) => enter(c.saldo));
  const caixa = {
    saldo: ambSaldo.length ? ambSaldo.reduce((total, c) => total + c.saldo, 0) : null,
    completa: ambSaldo.length > 0 && ambSaldo.length === enEuros.length && exclosos.length === 0,
    comptes: enEuros.length,
    exclosos,
    /* Tots els comptes en una altra moneda: no és que no porten saldo, és que no hi ha cap mesura en euros. */
    motiu: !llista.length ? 'SENSE_DADES'
      : !enEuros.length ? 'ALTRA_MONEDA'
        : !ambSaldo.length ? 'SENSE_SALDO'
          : exclosos.length ? 'ALTRA_MONEDA' : null
  };

  const moviments = enEuros.flatMap((c) => c.moviments ?? []);
  const desde = fins ? sumaDies(fins, -(finestraDies - 1)) : null;
  const finestra = fins ? { inici: desde, fi: fins } : null;
  const banc = llista.length && finestra ? fluxDe(moviments, finestra) : null;
  const finances = {
    desde,
    fins,
    banc,
    factures: finestra ? facturesDe(llistaFactures, finestra) : null,
    /* Per què el banc no té cap import (la targeta diu «sense mesura en euros»). */
    motiu: !banc ? 'SENSE_DADES' : !enEuros.length ? 'ALTRA_MONEDA' : banc.moviments === 0 ? 'SENSE_MOVIMENTS' : null
  };

  /* La cobertura: la caixa dividida per la despesa mensual mitjana dels últims mesos observats. */
  const cobertura = { mesos: null, despesaMensual: null, mesosObservats: 0, motiu: null };
  const inicis = enEuros.map((c) => c.desde);
  const observat = fins && inicis.some(esDataValida)
    ? posterior(sumaDies(restaMesos(fins, mesosMitjana), 1), primera(inicis))
    : null;
  if (!llista.length) cobertura.motiu = 'SENSE_DADES';
  else if (!enEuros.length) cobertura.motiu = 'ALTRA_MONEDA';
  else if (!observat) cobertura.motiu = 'SENSE_DADES';
  else {
    /* Els mesos de veres (no els arredonits) decidixen si n'hi ha prou: 30 dies no fan un mes. */
    const mesosReals = (diesEntre(observat, fins) + 1) / DIES_PER_MES;
    cobertura.mesosObservats = Math.round(mesosReals * 10) / 10;
    const { eixides } = fluxDe(moviments, { inici: observat, fi: fins });
    if (mesosReals < 1) cobertura.motiu = 'POCS_DIES';
    else if (!enter(eixides) || eixides === 0) cobertura.motiu = 'SENSE_DESPESES';
    else {
      cobertura.despesaMensual = Math.round(eixides / mesosReals);
      if (!enter(caixa.saldo)) cobertura.motiu = 'SENSE_SALDO';
      else cobertura.mesos = Math.round((Math.max(0, caixa.saldo) / cobertura.despesaMensual) * 10) / 10;
    }
  }

  const tresoreria = llista.map((c) => ({
    id: c.id,
    entitat: c.entitat,
    compte4: c.compte4,
    divisa: c.divisa,
    saldo: c.saldo,
    saldoDe: c.saldoDe,
    desde: c.desde,
    fins: c.fins,
    finestra: finestra ? fluxDe(c.moviments ?? [], finestra) : null,
    avisos: c.avisos
  }));

  /* La conciliació: sense factures no hi ha res a conciliar, i es diu així. */
  const conciliacio = { ambFactures: llistaFactures.length > 0, moviments: moviments.length, factures: llistaFactures.length };
  if (conciliacio.ambFactures && moviments.length) {
    const inici = primera(enEuros.map((c) => c.desde));
    const r = concilia({ moviments, factures: llistaFactures, rang: fins ? { inici, fi: fins } : null });
    Object.assign(conciliacio, {
      parelles: r.parelles.length,
      movimentsSenseFactura: r.movimentsSenseFactura.length,
      facturesSensePagament: r.facturesSensePagament.length,
      incidencies: r.incidencies.length
    });
  }

  return { fins, caixa, cobertura, finances, tresoreria, conciliacio };
}
