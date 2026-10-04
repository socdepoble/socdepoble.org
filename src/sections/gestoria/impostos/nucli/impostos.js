/**
 * impostos.js — l'estimació del model 303 (IVA) i del 130 (IRPF) d'un trimestre.
 *
 * Principi 4 de la Gestoria (GESTORIA_REFERENCIA.txt, ordre del Mestre del
 * 261004): tota regla de càlcul d'impostos viu només dins del mòdul de la
 * Gestoria, fora del Brain global. Pas 1 de l'onada 2 (MAPA_EMPRESA_GESTORIA,
 * §2.4 i §4).
 *
 * MAI és una declaració: és una ESTIMACIÓ per a revisar amb la gestoria. Diu
 * «estimació incompleta» (completa: false) mentre falten dades, amb la llista
 * del que falta (`falten`), i no posa cap xifra quan no hi ha cap factura del
 * període: un «0,00 €» sense factures seria una xifra falsa.
 *
 *  · 303 · IVA repercutit de les factures emeses menys l'IVA suportat de les
 *    rebudes que se sap que és deduïble. Mentre una factura rebuda no diu el
 *    seu «tipus d'operació» (TIPUS_OPERACIO_REBUDA), el seu IVA no se suma i
 *    l'estimació és incompleta: hui el model de la factura (nucli/model.js)
 *    encara no porta eixe camp.
 *  · 130 · el 20 % del rendiment acumulat de l'any fins al final del
 *    trimestre (bases de les emeses menys bases de les rebudes), menys les
 *    retencions de les emeses i els pagaments del 130 dels trimestres
 *    anteriors. Sense eixos pagaments, l'estimació es fa sense descomptar-los
 *    i diu que és incompleta. Un resultat negatiu queda en zero.
 * Les factures en una altra moneda, amb un import desconegut o pendents de
 * revisar no es compten (o es compten i es diu, les pendents): sempre ho diu
 * `falten`. Si cap factura del període no és en euros amb l'import llegit,
 * tampoc hi ha xifra (ordre del Mestre, 261004: «sense mesura en euros»,
 * mai un 0,00 € fet de factures que no s'han pogut sumar). Els terminis són
 * [NO VERIFICAT]: a verificar amb la gestoria (si el dia acaba en festiu o
 * cap de setmana, es mou).
 *
 * JS pur: sense DOM, React ni xarxa. Imports en cèntims enters. Res del que
 * rep es modifica.
 */
import { dinsDeRang, esDataValida, rangTrimestre } from '../../nucli/dates.js';

/** El percentatge del pagament fraccionat del 130 en estimació directa. */
export const TIPUS_PAGAMENT_130 = 20;
/** La moneda dels imports que se sumen. */
export const MONEDA_IMPOSTOS = 'EUR';
/** Els tipus d'operació d'una factura rebuda que el Tauler sap calcular. */
export const TIPUS_OPERACIO_REBUDA = Object.freeze(['interior-deduible', 'interior-no-deduible']);
/** La llegenda de tota xifra fiscal. */
export const LLEGENDA_ESTIMACIO = 'Estimació per a revisar amb la gestoria: no és cap declaració.';
/** Els codis de `falten`, en l'ordre en què es donen. */
export const CODIS_FALTA = Object.freeze([
  'TRIMESTRE_INVALID', 'SENSE_FACTURES', 'ALTRA_MONEDA', 'IMPORT_DESCONEGUT', 'SENSE_TIPUS_OPERACIO',
  'FACTURA_PENDENT', 'PAGAMENTS_ANTERIORS'
]);

const enEuros = (f) => f?.moneda == null || f.moneda === MONEDA_IMPOSTOS;
const enter = (x) => Number.isSafeInteger(x);
const suma = (llista, camp) => llista.reduce((total, f) => total + f[camp], 0);
const plural = (n, una, moltes) => (n === 1 ? una : `${n} ${moltes}`);
const falta = (codi, missatge) => Object.freeze({ codi, missatge });

/**
 * El trimestre natural d'una data { a, m, d }.
 * @param {{a:number,m:number,d:number}} data
 * @returns {{ any: number, t: number }|null}
 */
export function trimestreDeData(data) {
  if (!esDataValida(data)) return null;
  return { any: data.a, t: Math.ceil(data.m / 3) };
}

/**
 * La finestra de presentació del 303 i del 130 d'un trimestre: de l'1 al 20
 * del mes següent; la del quart trimestre, de l'1 al 30 de gener. [NO
 * VERIFICAT] A verificar amb la gestoria.
 * @param {number} any
 * @param {number} t
 * @returns {{ inici: object, fi: object }|null}
 */
export function terminiPresentacio(any, t) {
  if (!rangTrimestre(any, t)) return null;
  if (t === 4) return { inici: { a: any + 1, m: 1, d: 1 }, fi: { a: any + 1, m: 1, d: 30 } };
  return { inici: { a: any, m: 3 * t + 1, d: 1 }, fi: { a: any, m: 3 * t + 1, d: 20 } };
}

/* Les factures d'un rang, separades en emeses i rebudes, i les que no es poden sumar. */
function classifica(factures, rang, campImport) {
  const del = (Array.isArray(factures) ? factures : []).filter((f) => f && typeof f === 'object' && dinsDeRang(f.data, rang));
  const altraMoneda = del.filter((f) => !enEuros(f));
  const desconegudes = del.filter((f) => enEuros(f) && !enter(f[campImport]));
  const valides = del.filter((f) => enEuros(f) && enter(f[campImport]));
  return {
    del,
    altraMoneda,
    desconegudes,
    pendents: valides.filter((f) => f.estat === 'pendent'),
    emeses: valides.filter((f) => f.tipus === 'ingres'),
    rebudes: valides.filter((f) => f.tipus !== 'ingres')
  };
}

/* El que falta i és comú als dos models. */
function faltesComunes({ del, altraMoneda, desconegudes, pendents }, quines) {
  const falten = [];
  if (del.length === 0) falten.push(falta('SENSE_FACTURES', `Encara no hi ha cap factura ${quines} al Tauler.`));
  if (altraMoneda.length) {
    falten.push(falta('ALTRA_MONEDA', `${plural(altraMoneda.length, 'Una factura no és', 'factures no són')} en euros i no es compten.`));
  }
  if (desconegudes.length) {
    falten.push(falta('IMPORT_DESCONEGUT', `${plural(desconegudes.length, 'Una factura no té', 'factures no tenen')} l’import llegit i no es compten.`));
  }
  if (pendents.length) {
    falten.push(falta('FACTURA_PENDENT', `${plural(pendents.length, 'Una factura està', 'factures estan')} pendents de revisar: es compten tal com s’han llegit.`));
  }
  return falten;
}

/**
 * L'estimació del 303 d'un trimestre.
 * @param {{ factures?: object[], any: number, t: number }} p les factures del model (nucli/model.js); el
 *   tipus d'operació d'una rebuda, si se sap, a `tipusOperacio` (TIPUS_OPERACIO_REBUDA)
 * @returns {{ model: '303', any: number, t: number, periode: object|null, termini: object|null, completa: boolean,
 *   falten: Array<{ codi: string, missatge: string }>, repercutit: number|null, suportat: number|null,
 *   resultat: number|null, factures: { emeses: number, rebudes: number } }}
 */
export function estimaIva303({ factures = [], any, t } = {}) {
  const periode = rangTrimestre(any, t);
  const base = { model: '303', any, t, periode, termini: terminiPresentacio(any, t) };
  if (!periode) {
    return {
      ...base, completa: false, falten: [falta('TRIMESTRE_INVALID', 'El trimestre no és vàlid.')],
      repercutit: null, suportat: null, resultat: null, factures: { emeses: 0, rebudes: 0 }
    };
  }
  const grups = classifica(factures, periode, 'iva');
  const falten = faltesComunes(grups, 'del trimestre');
  const deduibles = grups.rebudes.filter((f) => f.tipusOperacio === 'interior-deduible');
  const senseTipus = grups.rebudes.filter((f) => !TIPUS_OPERACIO_REBUDA.includes(f.tipusOperacio));
  if (senseTipus.length) {
    falten.push(falta('SENSE_TIPUS_OPERACIO', `${plural(senseTipus.length, 'Una factura rebuda no diu', 'factures rebudes no diuen')} el tipus d’operació: el seu IVA no es dona per deduïble.`));
  }
  /* Hi ha mesura si almenys una factura del trimestre és en euros i té l'IVA llegit. */
  const ambDades = grups.emeses.length + grups.rebudes.length > 0;
  const repercutit = ambDades ? suma(grups.emeses, 'iva') : null;
  const suportat = ambDades ? suma(deduibles, 'iva') : null;
  return {
    ...base,
    completa: falten.length === 0,
    falten: ordena(falten),
    repercutit,
    suportat,
    resultat: ambDades ? repercutit - suportat : null,
    factures: { emeses: grups.emeses.length, rebudes: grups.rebudes.length }
  };
}

/**
 * L'estimació del 130 d'un trimestre (estimació directa).
 * @param {{ factures?: object[], any: number, t: number, pagamentsAnteriors?: number|null }} p
 *   pagamentsAnteriors: el que ja s'ha pagat pel 130 als trimestres anteriors de l'any, en cèntims
 * @returns {{ model: '130', any: number, t: number, periode: object|null, termini: object|null, completa: boolean,
 *   falten: object[], ingressos: number|null, despeses: number|null, rendiment: number|null, quota: number|null,
 *   retencions: number|null, pagamentsAnteriors: number|null, resultat: number|null,
 *   factures: { emeses: number, rebudes: number } }}
 */
export function estimaIrpf130({ factures = [], any, t, pagamentsAnteriors = null } = {}) {
  const trimestre = rangTrimestre(any, t);
  const periode = trimestre ? { inici: { a: any, m: 1, d: 1 }, fi: trimestre.fi } : null;
  const base = { model: '130', any, t, periode, termini: terminiPresentacio(any, t) };
  const buit = { ingressos: null, despeses: null, rendiment: null, quota: null, retencions: null, resultat: null };
  if (!periode) {
    return {
      ...base, ...buit, completa: false, falten: [falta('TRIMESTRE_INVALID', 'El trimestre no és vàlid.')],
      pagamentsAnteriors: null, factures: { emeses: 0, rebudes: 0 }
    };
  }
  const grups = classifica(factures, periode, 'subtotal');
  const falten = faltesComunes(grups, 'de l’any');
  const pagats = t === 1 ? 0 : (enter(pagamentsAnteriors) && pagamentsAnteriors >= 0 ? pagamentsAnteriors : null);
  if (pagats === null) {
    falten.push(falta('PAGAMENTS_ANTERIORS', 'Falten els pagaments del 130 dels trimestres anteriors de l’any: l’estimació no els descompta.'));
  }
  const factures130 = { emeses: grups.emeses.length, rebudes: grups.rebudes.length };
  /* Sense cap factura de l'any en euros amb la base llegida, cap xifra: ni la quota ni el resultat. */
  if (grups.emeses.length + grups.rebudes.length === 0) {
    return { ...base, ...buit, completa: false, falten: ordena(falten), pagamentsAnteriors: pagats, factures: factures130 };
  }
  const ingressos = suma(grups.emeses, 'subtotal');
  const despeses = suma(grups.rebudes, 'subtotal');
  const rendiment = ingressos - despeses;
  const quota = rendiment > 0 ? Math.round((rendiment * TIPUS_PAGAMENT_130) / 100) : 0;
  const retencions = grups.emeses.reduce((total, f) => total + (enter(f.retencio) ? Math.abs(f.retencio) : 0), 0);
  return {
    ...base,
    completa: falten.length === 0,
    falten: ordena(falten),
    ingressos,
    despeses,
    rendiment,
    quota,
    retencions,
    pagamentsAnteriors: pagats,
    resultat: Math.max(0, quota - retencions - (pagats ?? 0)),
    factures: factures130
  };
}

/* `falten` en l'ordre de CODIS_FALTA, sense repetir codis. */
function ordena(falten) {
  const vistos = new Set();
  return falten
    .filter((f) => (vistos.has(f.codi) ? false : vistos.add(f.codi)))
    .sort((x, y) => CODIS_FALTA.indexOf(x.codi) - CODIS_FALTA.indexOf(y.codi));
}

/**
 * El que diu la targeta «Hisenda»: la suma de les dues estimacions del
 * trimestre. Sense cap de les dues xifres, null; amb una sola, la que hi ha,
 * i incompleta.
 * @param {{ iva: object, irpf: object }} p el que tornen estimaIva303 i estimaIrpf130
 * @returns {{ total: number|null, completa: boolean, falten: object[] }}
 */
export function resumHisenda({ iva, irpf } = {}) {
  const xifres = [iva?.resultat, irpf?.resultat].filter(enter);
  const falten = ordena([...(iva?.falten ?? []), ...(irpf?.falten ?? [])]);
  return {
    total: xifres.length ? xifres.reduce((total, x) => total + x, 0) : null,
    completa: xifres.length === 2 && Boolean(iva?.completa) && Boolean(irpf?.completa),
    falten
  };
}
