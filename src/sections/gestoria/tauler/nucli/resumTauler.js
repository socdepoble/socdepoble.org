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
 * comptesDe(lectures) · els comptes: un per entitat i quatre últims dígits
 *   (el número sencer no ix mai de c43.js). Si dos extractes del mateix compte
 *   cobrixen els mateixos dies, els moviments de després només compten des
 *   del final del primer, i ho diu un avís. Un CSV sense cap Norma 43 fa un
 *   compte propi, sense número, amb el saldo de la seua última fila.
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
import { comparaDates, diesDelMes, diesEntre, dinsDeRang, esDataValida } from '../../nucli/dates.js';
import { fusionaMoviments } from '../../nucli/movimentsBanc.js';

/** Els dies de la finestra de les finances. */
export const FINESTRA_DIES = 30;
/** Els mesos, com a molt, de la mitjana de despesa de la cobertura. */
export const MESOS_MITJANA = 6;
/** La moneda de les xifres del Tauler. */
export const MONEDA_TAULER = 'EUR';
/* Un mes mitjà de l'any gregorià, en dies. */
const DIES_PER_MES = 365.2425 / 12;

/** Els codis dels avisos de comptesDe i dels motius de resumTauler. */
export const CODIS_TAULER = Object.freeze([
  'EXTRACTES_SOLAPATS', 'CSV_SENSE_PARELLA', 'SENSE_SALDO', 'ALTRA_MONEDA', 'SENSE_DADES', 'POCS_DIES', 'SENSE_DESPESES',
  'SENSE_MOVIMENTS'
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

/* Els trams (un per extracte) d'un compte, units: el saldo del més recent i els moviments sense repetir dies. */
function uneixTrams(id, trams, avisos) {
  const ordenats = [...trams].sort((x, y) => comparaDates(x.fins, y.fins));
  const moviments = [];
  let cobert = null;
  for (const tram of ordenats) {
    if (cobert && esDataValida(tram.desde) && comparaDates(tram.desde, cobert) <= 0) {
      avisos.push(avis('EXTRACTES_SOLAPATS',
        `Dos extractes del compte acabat en ${tram.compte4} cobrixen els mateixos dies: els moviments repetits només compten una vegada.`));
    }
    const nous = cobert ? tram.moviments.filter((m) => comparaDates(m?.dataOperacio, cobert) > 0) : tram.moviments;
    moviments.push(...nous);
    cobert = cobert ? posterior(cobert, tram.fins) : tram.fins;
  }
  const darrer = ordenats[ordenats.length - 1];
  const divises = new Set(ordenats.map((t) => t.divisa));
  return {
    id,
    entitat: darrer.entitat,
    compte4: darrer.compte4,
    divisa: divises.size === 1 ? darrer.divisa : null,
    desde: primera(ordenats.map((t) => t.desde)),
    fins: darrera(ordenats.map((t) => t.fins)),
    saldo: darrer.saldo,
    saldoDe: darrer.saldoDe,
    moviments,
    avisos: ordenats.reduce((total, t) => total + t.avisos, 0)
  };
}

/* Un compte fet només del CSV del banc: sense número, amb el saldo de l'última fila per data. */
function compteDelCsv(files) {
  const valides = files.filter((f) => esDataValida(f?.dataOperacio));
  if (!valides.length) return null;
  const perData = valides.map((f, i) => ({ f, i }))
    .sort((x, y) => comparaDates(x.f.dataOperacio, y.f.dataOperacio) || x.i - y.i)
    .map(({ f }) => f);
  /* Un CSV amb la més nova primer: el saldo de la mateixa data és el de la fila de dalt. */
  const descendent = comparaDates(valides[0].dataOperacio, valides[valides.length - 1].dataOperacio) > 0;
  const fins = perData[perData.length - 1].dataOperacio;
  const delDarrerDia = valides.filter((f) => comparaDates(f.dataOperacio, fins) === 0);
  const ultima = descendent ? delDarrerDia[0] : delDarrerDia[delDarrerDia.length - 1];
  return {
    id: 'csv',
    entitat: null,
    compte4: null,
    divisa: MONEDA_TAULER,
    desde: perData[0].dataOperacio,
    fins,
    saldo: enter(ultima.saldo) ? ultima.saldo : null,
    saldoDe: enter(ultima.saldo) ? 'csv' : null,
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
 *   desde: object|null, fins: object|null, saldo: number|null, saldoDe: string|null, moviments: object[],
 *   avisos: number }>, avisos: Array<{ codi: string, missatge: string }> }}
 *   `avisos` de cada compte: els avisos alts i mitjans de la lectura (fitxer tallat, sumes que no quadren).
 */
export function comptesDe({ extractes = [], csv = [] } = {}) {
  const avisos = [];
  const grups = new Map();
  for (const { lectura } of Array.isArray(extractes) ? extractes : []) {
    const avisosLectura = severes(lectura);
    for (const [k, compte] of (lectura?.comptes ?? []).entries()) {
      const cap = compte?.capcalera ?? {};
      const id = `c43-${cap.entitat ?? ''}-${cap.compte4 ?? ''}`;
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
      if (!grups.has(id)) grups.set(id, []);
      grups.get(id).push(tram);
    }
  }
  const comptes = [...grups.entries()].map(([id, trams]) => uneixTrams(id, trams, avisos));
  const filesCsv = (Array.isArray(csv) ? csv : []).flatMap(({ lectura }) => lectura?.moviments ?? []);
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
    const delCsv = compteDelCsv(filesCsv);
    if (delCsv) comptes.push(delCsv);
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
