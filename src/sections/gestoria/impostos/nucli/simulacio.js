/**
 * simulacio.js — la simulació dels impostos de l'empresa: el 303 i el 130 de
 * CADA trimestre, el resum anual del 390, una renda orientativa (model 100)
 * i escenaris («i si facture un X % més?», «i si gaste un Y % menys en IA?»).
 *
 * Onada 6, ordre del Mestre (261009): «fer simulacions», «simular la renda».
 * impostos.js (font del tractor del Tauler) no es toca: este mòdul en reusa
 * només els terminis.
 *
 * MAI és una declaració. Totes les xifres fiscals (tipus, escales, mínims,
 * límits) són DADES per any (PARAMETRES_FISCALS), amb la font legal que
 * s'ha de comprovar, i porten l'etiqueta ETIQUETA_NO_VERIFICAT: la persona
 * les pot canviar (parametresDe) i la gestoria les ha de revisar.
 *
 * L'entrada són OPERACIONS (historic/nucli/operacions.js les trau del banc;
 * les factures també s'hi poden passar):
 *   { data: {a,m,d}, tipus: 'ingres'|'despesa', base, iva, retencio, tractament, deduibleIva, deduibleIrpf,
 *     categoria?, origen?: 'banc'|'factura' }
 *   tractament: 'interior' · 'isp-intracomunitari' (inversió del subjecte
 *   passiu d'una compra a la UE: l'IVA es repercutix i se suporta alhora,
 *   net zero si és deduïble; cal el 349 i el ROI) · 'isp-extracomunitari'
 *   (igual, sense 349) · 'exempt' · 'sense-iva'.
 * Imports en cèntims enters; tipus en punts bàsics (2100 = 21 %).
 *
 * Sense dades en un període, cap xifra: null amb el motiu, mai 0,00 €. Qui
 * sap quins dies cobrixen els extractes (la sèrie de l'històric) passa la
 * COBERTURA de cada trimestre ('completa', 'parcial' o 'cap'): un trimestre
 * 'cap' no té ni 303 ni 130, encara que l'any tinga operacions abans. Sense
 * cobertura, un trimestre sense cap operació seua no té xifra.
 * JS pur: sense DOM, React ni xarxa. Res del que rep es modifica.
 */
import { dinsDeRang, esDataValida, rangTrimestre } from '../../nucli/dates.js';
import { terminiPresentacio } from './impostos.js';

/** L'etiqueta de tota xifra d'esta simulació. */
export const ETIQUETA_NO_VERIFICAT = '[NO VERIFICAT] estimació per a revisar amb la gestoria';
/** Els tractaments de l'IVA d'una operació. */
export const TRACTAMENTS = Object.freeze(['interior', 'isp-intracomunitari', 'isp-extracomunitari', 'exempt', 'sense-iva']);
/** Els codis dels avisos de la simulació. */
export const CODIS_SIMULACIO = Object.freeze([
  'SENSE_DADES', 'MODEL_349', 'ROI', 'DES_DEL_BANC', 'T4_A_COMPENSAR', 'PARAMETRES_D_UN_ALTRE_ANY', 'ANY_INCOMPLET',
  'SENSE_MINORACIO', 'TRIMESTRE_PARCIAL', 'ACUMULAT_INCOMPLET'
]);
/** Les cobertures d'un trimestre pels extractes del banc. */
export const COBERTURES = Object.freeze(['completa', 'parcial', 'cap']);
const coberturaValida = (c) => (COBERTURES.includes(c) ? c : null);

/**
 * La cobertura d'un trimestre en un mapa { 'AAAA-Tn': cobertura } (les claus
 * dels trimestres de la sèrie). Sense mapa, null (no se sap); amb mapa, un
 * trimestre que no hi és no té cap extracte ('cap').
 * @param {Record<string, string>|null} mapa
 * @param {number} any
 * @param {number} t
 * @returns {'completa'|'parcial'|'cap'|null}
 */
export function coberturaDe(mapa, any, t) {
  if (!mapa || typeof mapa !== 'object') return null;
  return coberturaValida(mapa[`${any}-T${t}`]) ?? 'cap';
}

const enter = (x) => Number.isSafeInteger(x);
const PUNTS = 10000;
const pct = (import_, punts) => Math.round((import_ * punts) / PUNTS);

/* L'escala general estatal: trams { fins (cèntims; null, sense sostre), tipus (punts bàsics) }. */
const ESCALA_ESTATAL = Object.freeze([
  { fins: 1245000, tipus: 950 }, { fins: 2020000, tipus: 1200 }, { fins: 3520000, tipus: 1500 },
  { fins: 6000000, tipus: 1850 }, { fins: 30000000, tipus: 2250 }, { fins: null, tipus: 2450 }
].map(Object.freeze));
/* L'escala autonòmica valenciana. [NO VERIFICAT] La Generalitat l'ha canviada diverses vegades: a revisar cada any. */
const ESCALA_VALENCIANA = Object.freeze([
  { fins: 1200000, tipus: 900 }, { fins: 2200000, tipus: 1200 }, { fins: 3200000, tipus: 1500 },
  { fins: 4200000, tipus: 1740 }, { fins: 5200000, tipus: 2000 }, { fins: 6200000, tipus: 2250 },
  { fins: 7200000, tipus: 2500 }, { fins: 10000000, tipus: 2650 }, { fins: 15000000, tipus: 2750 },
  { fins: 20000000, tipus: 2850 }, { fins: null, tipus: 2950 }
].map(Object.freeze));
/* La minoració del pagament fraccionat per rendiments nets baixos de l'any anterior: { fins, import } per trimestre. */
const MINORACIO_130 = Object.freeze([
  { fins: 900000, import: 10000 }, { fins: 1000000, import: 7500 }, { fins: 1100000, import: 5000 }, { fins: 1200000, import: 2500 }
].map(Object.freeze));

/**
 * Els camps dels paràmetres, amb el nom, la unitat i la font legal que cal
 * comprovar. unitat: 'percentatge' (punts bàsics), 'import' (cèntims),
 * 'boolea', 'escala' o 'minoracio'.
 */
export const CAMPS_PARAMETRES = Object.freeze([
  { clau: 'ivaGeneral', nom: 'Tipus general de l’IVA', unitat: 'percentatge', font: 'Llei 37/1992 de l’IVA, art. 90' },
  { clau: 'pagament130', nom: 'Pagament fraccionat del 130', unitat: 'percentatge', font: 'Llei 35/2006 de l’IRPF, art. 99, i Reglament de l’IRPF, art. 110' },
  { clau: 'dificilPercentatge', nom: 'Despeses de difícil justificació', unitat: 'percentatge', font: 'Reglament de l’IRPF, art. 30.2.4a' },
  { clau: 'dificilLimit', nom: 'Límit anual de les despeses de difícil justificació', unitat: 'import', font: 'Reglament de l’IRPF, art. 30.2.4a' },
  { clau: 'dificilAl130', nom: 'Descomptar-les també al 130', unitat: 'boolea', font: 'Instruccions del model 130: a confirmar amb la gestoria' },
  { clau: 'minimEstatal', nom: 'Mínim personal (tram estatal)', unitat: 'import', font: 'Llei 35/2006 de l’IRPF, art. 57' },
  { clau: 'minimAutonomic', nom: 'Mínim personal (tram valencià)', unitat: 'import', font: 'Llei 13/1997 de la Generalitat, art. 4: a verificar' },
  { clau: 'escalaEstatal', nom: 'Escala estatal de la base general', unitat: 'escala', font: 'Llei 35/2006 de l’IRPF, art. 63' },
  { clau: 'escalaAutonomica', nom: 'Escala autonòmica valenciana', unitat: 'escala', font: 'Llei 13/1997 de la Generalitat, art. 2: a verificar' },
  { clau: 'minoracio130', nom: 'Minoració del 130 per rendiments baixos', unitat: 'minoracio', font: 'Reglament de l’IRPF, art. 110.3.c' }
].map(Object.freeze));

function valorsPerDefecte() {
  return {
    ivaGeneral: 2100,
    pagament130: 2000,
    dificilPercentatge: 500,
    dificilLimit: 200000,
    dificilAl130: true,
    minimEstatal: 555000,
    minimAutonomic: 610500,
    escalaEstatal: ESCALA_ESTATAL,
    escalaAutonomica: ESCALA_VALENCIANA,
    minoracio130: MINORACIO_130
  };
}

/**
 * Els paràmetres per defecte de cada any. [NO VERIFICAT] Són les xifres que
 * coneixem i les seues fonts: a comprovar cada any amb la gestoria (2026,
 * igual que 2025 mentre no se sàpia res més).
 */
export const PARAMETRES_FISCALS = Object.freeze({
  2025: Object.freeze(valorsPerDefecte()),
  2026: Object.freeze(valorsPerDefecte())
});

const esPunts = (x) => enter(x) && x >= 0 && x <= PUNTS;
const esImport = (x) => enter(x) && x >= 0;
function escalaValida(trams, campImport) {
  if (!Array.isArray(trams) || trams.length === 0) return false;
  let anterior = 0;
  return trams.every((tram, i) => {
    const ultim = i === trams.length - 1;
    const fins = tram?.fins;
    const sostreBo = ultim ? fins === null || (esImport(fins) && fins > anterior) : esImport(fins) && fins > anterior;
    if (fins !== null) anterior = fins;
    return sostreBo && (campImport === 'tipus' ? esPunts(tram.tipus) : esImport(tram.import));
  });
}

/**
 * Els problemes d'uns paràmetres ([] si són vàlids). Comprova només els camps
 * que porten.
 * @param {object} p
 * @returns {string[]}
 */
export function validaParametres(p) {
  if (!p || typeof p !== 'object') return ['Cal un objecte de paràmetres.'];
  const errors = [];
  for (const { clau, nom, unitat } of CAMPS_PARAMETRES) {
    if (!(clau in p)) continue;
    const v = p[clau];
    const bo = unitat === 'percentatge' ? esPunts(v)
      : unitat === 'import' ? esImport(v)
        : unitat === 'boolea' ? typeof v === 'boolean'
          : unitat === 'escala' ? escalaValida(v, 'tipus')
            : escalaValida(v, 'import');
    if (!bo) errors.push(`${nom}: valor no vàlid.`);
  }
  return errors;
}

/**
 * Els paràmetres d'un any: els per defecte (o, si l'any no en té, els de
 * l'any conegut més pròxim, amb l'avís) i, damunt, els propis de la persona
 * que siguen vàlids.
 * @param {number} any
 * @param {object} [propis] { [clau]: valor } per a eixe any
 * @returns {object} { any, origen: 'per-defecte'|'propis'|'d-un-altre-any', ...valors, etiqueta }
 */
export function parametresDe(any, propis = null) {
  const anys = Object.keys(PARAMETRES_FISCALS).map(Number).sort((x, y) => x - y);
  const exacte = anys.includes(any);
  const proper = exacte ? any : anys.reduce((millor, a) => (Math.abs(a - any) < Math.abs(millor - any) ? a : millor), anys[0]);
  const base = { ...PARAMETRES_FISCALS[proper] };
  let origen = exacte ? 'per-defecte' : 'd-un-altre-any';
  if (propis && typeof propis === 'object') {
    for (const { clau } of CAMPS_PARAMETRES) {
      if (clau in propis && validaParametres({ [clau]: propis[clau] }).length === 0) {
        base[clau] = propis[clau];
        origen = 'propis';
      }
    }
  }
  return Object.freeze({ any, origen, anyDeLaFont: proper, etiqueta: ETIQUETA_NO_VERIFICAT, ...base });
}

/**
 * La quota d'una base per una escala de trams.
 * @param {number} base cèntims
 * @param {Array<{ fins: number|null, tipus: number }>} trams
 * @returns {number} cèntims
 */
export function quotaEscala(base, trams) {
  if (!enter(base) || base <= 0 || !Array.isArray(trams)) return 0;
  let quota = 0;
  let desde = 0;
  for (const { fins, tipus } of trams) {
    const sostre = fins === null ? base : Math.min(base, fins);
    if (sostre > desde) quota += ((sostre - desde) * tipus) / PUNTS;
    if (fins === null || base <= fins) break;
    desde = fins;
  }
  return Math.round(quota);
}

/* Una operació vàlida: data, tipus i base enters; la resta, amb valors segurs. */
function normalitza(op) {
  if (!op || !esDataValida(op.data) || !['ingres', 'despesa'].includes(op.tipus) || !enter(op.base)) return null;
  return {
    data: op.data,
    tipus: op.tipus,
    base: op.base,
    iva: enter(op.iva) ? op.iva : 0,
    retencio: enter(op.retencio) ? op.retencio : 0,
    tractament: TRACTAMENTS.includes(op.tractament) ? op.tractament : 'sense-iva',
    deduibleIva: op.deduibleIva === true,
    deduibleIrpf: op.deduibleIrpf !== false,
    categoria: op.categoria ?? null,
    origen: op.origen === 'factura' ? 'factura' : 'banc'
  };
}
const valides = (operacions) => (Array.isArray(operacions) ? operacions.map(normalitza).filter(Boolean) : []);
const delRang = (ops, rang) => ops.filter((op) => dinsDeRang(op.data, rang));
const sumaDe = (ops, camp) => ops.reduce((t, op) => t + op[camp], 0);
/* El cost d'una despesa per a l'IRPF: la base i, si l'IVA no es deduïx, també l'IVA. */
const costIrpf = (op) => (op.deduibleIrpf ? op.base + (op.deduibleIva ? 0 : op.iva) : 0);
const avis = (codi, missatge) => Object.freeze({ codi, missatge });

/* Un trimestre té dades si els extractes el cobrixen (en tot o en part) o, sense saber la cobertura, si té operacions seues. */
const ambDades = (cobertura, operacionsDelTrimestre) => (cobertura === null ? operacionsDelTrimestre.length > 0 : cobertura !== 'cap');
const AVIS_PARCIAL = () => avis('TRIMESTRE_PARCIAL', 'Els extractes només cobrixen una part del trimestre: l’estimació hi és incompleta.');

/**
 * El 303 d'un trimestre.
 * @param {{ operacions: object[], any: number, t: number, compensacioAnterior?: number,
 *   cobertura?: 'completa'|'parcial'|'cap'|null }} p `cobertura`: la dels extractes; sense, no se sap
 * @returns {object} { model, any, t, periode, termini, repercutit, ispIntracomunitari, ispExtracomunitari, suportat,
 *   quota, compensada, resultat, aIngressar, aCompensar, avisos, motiu }
 */
export function estima303({ operacions, any, t, compensacioAnterior = 0, cobertura = null } = {}) {
  const periode = rangTrimestre(any, t);
  const base = { model: '303', any, t, periode, termini: terminiPresentacio(any, t) };
  const compensacio = enter(compensacioAnterior) && compensacioAnterior > 0 ? compensacioAnterior : 0;
  const cob = coberturaValida(cobertura);
  const del = periode ? delRang(valides(operacions), periode) : [];
  if (!periode || !ambDades(cob, del)) {
    return Object.freeze({
      ...base, repercutit: null, ispIntracomunitari: null, ispExtracomunitari: null, suportat: null, quota: null,
      compensada: null, resultat: null, aIngressar: null, aCompensar: compensacio, avisos: [], motiu: 'SENSE_DADES'
    });
  }
  const ingressos = del.filter((op) => op.tipus === 'ingres' && op.tractament === 'interior');
  const despeses = del.filter((op) => op.tipus === 'despesa');
  const intra = despeses.filter((op) => op.tractament === 'isp-intracomunitari');
  const extra = despeses.filter((op) => op.tractament === 'isp-extracomunitari');
  const repercutit = sumaDe(ingressos, 'iva');
  const ispIntracomunitari = sumaDe(intra, 'iva');
  const ispExtracomunitari = sumaDe(extra, 'iva');
  const suportat = sumaDe(despeses.filter((op) => op.deduibleIva && ['interior', 'isp-intracomunitari', 'isp-extracomunitari'].includes(op.tractament)), 'iva');
  const quota = repercutit + ispIntracomunitari + ispExtracomunitari - suportat;
  const compensada = quota > 0 ? Math.min(quota, compensacio) : 0;
  const resultat = quota - compensada;
  const aCompensar = compensacio - compensada + (quota < 0 ? -quota : 0);
  const avisos = [];
  if (cob === 'parcial') avisos.push(AVIS_PARCIAL());
  if (intra.length) {
    avisos.push(avis('MODEL_349', 'Hi ha compres de serveis a empreses de la UE: cal el model 349 del trimestre.'));
    avisos.push(avis('ROI', 'La inversió del subjecte passiu intracomunitària exigix estar d’alta al ROI i comprar amb el NIF-IVA.'));
  }
  if (del.some((op) => op.origen === 'banc')) avisos.push(avis('DES_DEL_BANC', 'Calculat amb els moviments del banc: cada despesa necessita la seua factura per a deduir-se.'));
  if (t === 4 && aCompensar > 0) avisos.push(avis('T4_A_COMPENSAR', 'Al quart trimestre, el que queda a compensar es pot demanar que es torne.'));
  return Object.freeze({
    ...base, repercutit, ispIntracomunitari, ispExtracomunitari, suportat, quota, compensada, resultat,
    aIngressar: Math.max(0, resultat), aCompensar, avisos, motiu: null
  });
}

/* La minoració d'un trimestre del 130 pel rendiment net de l'any anterior. */
function minoracioDe(rendimentAnterior, trams) {
  if (!enter(rendimentAnterior) || !Array.isArray(trams)) return 0;
  const tram = trams.find((tr) => rendimentAnterior <= tr.fins);
  return tram ? tram.import : 0;
}

/**
 * El 130 d'un trimestre: el rendiment acumulat de l'any fins al final del trimestre.
 * Un trimestre sense dades seues (cobertura 'cap' o, sense cobertura, cap
 * operació del trimestre) no té xifra, encara que l'any en tinga abans.
 * @param {{ operacions: object[], any: number, t: number, parametres: object, pagamentsAnteriors?: number,
 *   rendimentAnyAnterior?: number|null, cobertura?: 'completa'|'parcial'|'cap'|null, acumulatIncomplet?: boolean }} p
 *   `acumulatIncomplet`: hi ha dies de l'any fins al final del trimestre que cap extracte cobrix
 * @returns {object} { model, any, t, periode, termini, ingressos, despeses, rendimentPrevi, dificil, rendiment, quota,
 *   retencions, pagamentsAnteriors, minoracio, resultat, avisos, motiu }
 */
export function estima130({
  operacions, any, t, parametres, pagamentsAnteriors = 0, rendimentAnyAnterior = null, cobertura = null, acumulatIncomplet = false
} = {}) {
  const trimestre = rangTrimestre(any, t);
  const periode = trimestre ? { inici: { a: any, m: 1, d: 1 }, fi: trimestre.fi } : null;
  const base = { model: '130', any, t, periode, termini: terminiPresentacio(any, t) };
  const p = parametres ?? parametresDe(any);
  const cob = coberturaValida(cobertura);
  const totes = valides(operacions);
  const del = periode ? delRang(totes, periode) : [];
  if (!periode || !ambDades(cob, delRang(totes, trimestre))) {
    return Object.freeze({
      ...base, ingressos: null, despeses: null, rendimentPrevi: null, dificil: null, rendiment: null, quota: null,
      retencions: null, pagamentsAnteriors: null, minoracio: null, resultat: null, avisos: [], motiu: 'SENSE_DADES'
    });
  }
  const ingressos = sumaDe(del.filter((op) => op.tipus === 'ingres'), 'base');
  const despeses = del.filter((op) => op.tipus === 'despesa').reduce((tot, op) => tot + costIrpf(op), 0);
  const rendimentPrevi = ingressos - despeses;
  const dificil = p.dificilAl130 && rendimentPrevi > 0 ? Math.min(pct(rendimentPrevi, p.dificilPercentatge), p.dificilLimit) : 0;
  const rendiment = rendimentPrevi - dificil;
  const quota = rendiment > 0 ? pct(rendiment, p.pagament130) : 0;
  const retencions = sumaDe(del.filter((op) => op.tipus === 'ingres'), 'retencio');
  const pagats = enter(pagamentsAnteriors) && pagamentsAnteriors > 0 ? pagamentsAnteriors : 0;
  const minoracio = minoracioDe(rendimentAnyAnterior, p.minoracio130);
  const avisos = [];
  if (cob === 'parcial') avisos.push(AVIS_PARCIAL());
  if (acumulatIncomplet === true) {
    avisos.push(avis('ACUMULAT_INCOMPLET', 'Hi ha dies de l’any fins al final del trimestre sense extractes: el rendiment acumulat del 130 en pot eixir baix.'));
  }
  if (!enter(rendimentAnyAnterior)) avisos.push(avis('SENSE_MINORACIO', 'Sense el rendiment de l’any anterior no s’aplica la minoració per rendiments baixos.'));
  if (del.some((op) => op.origen === 'banc')) avisos.push(avis('DES_DEL_BANC', 'Calculat amb els moviments del banc: cada despesa necessita la seua factura per a deduir-se.'));
  return Object.freeze({
    ...base, ingressos, despeses, rendimentPrevi, dificil, rendiment, quota, retencions, pagamentsAnteriors: pagats, minoracio,
    resultat: Math.max(0, quota - retencions - pagats - minoracio), avisos, motiu: null
  });
}

/**
 * La renda orientativa d'un any (model 100), només amb l'activitat econòmica
 * en estimació directa simplificada.
 * @param {{ operacions: object[], any: number, parametres: object, pagaments130?: number }} p
 * @returns {object} { model, any, ingressos, despeses, rendimentPrevi, dificil, rendiment, base, quotaEstatal,
 *   quotaAutonomica, quotaIntegra, retencions, pagaments130, resultat, tipusMitja, motiu }
 *   `resultat` positiu: a pagar; negatiu: a tornar. `tipusMitja` en percentatge amb un decimal.
 */
export function estimaRenda({ operacions, any, parametres, pagaments130 = 0 } = {}) {
  const p = parametres ?? parametresDe(any);
  const rang = Number.isInteger(any) ? { inici: { a: any, m: 1, d: 1 }, fi: { a: any, m: 12, d: 31 } } : null;
  const del = rang ? delRang(valides(operacions), rang) : [];
  const base = { model: '100', any };
  if (!del.length) {
    return Object.freeze({
      ...base, ingressos: null, despeses: null, rendimentPrevi: null, dificil: null, rendiment: null, base: null, quotaEstatal: null,
      quotaAutonomica: null, quotaIntegra: null, retencions: null, pagaments130: null, resultat: null, tipusMitja: null, motiu: 'SENSE_DADES'
    });
  }
  const ingressos = sumaDe(del.filter((op) => op.tipus === 'ingres'), 'base');
  const despeses = del.filter((op) => op.tipus === 'despesa').reduce((tot, op) => tot + costIrpf(op), 0);
  const rendimentPrevi = ingressos - despeses;
  const dificil = rendimentPrevi > 0 ? Math.min(pct(rendimentPrevi, p.dificilPercentatge), p.dificilLimit) : 0;
  const rendiment = rendimentPrevi - dificil;
  const baseLiquidable = Math.max(0, rendiment);
  /* El mínim personal tributa al tipus de l'escala: la quota de la base menys la del mínim que hi cap. */
  const quotaEstatal = Math.max(0, quotaEscala(baseLiquidable, p.escalaEstatal) - quotaEscala(Math.min(baseLiquidable, p.minimEstatal), p.escalaEstatal));
  const quotaAutonomica = Math.max(0, quotaEscala(baseLiquidable, p.escalaAutonomica) - quotaEscala(Math.min(baseLiquidable, p.minimAutonomic), p.escalaAutonomica));
  const quotaIntegra = quotaEstatal + quotaAutonomica;
  const retencions = sumaDe(del.filter((op) => op.tipus === 'ingres'), 'retencio');
  const pagats = enter(pagaments130) && pagaments130 > 0 ? pagaments130 : 0;
  return Object.freeze({
    ...base, ingressos, despeses, rendimentPrevi, dificil, rendiment, base: baseLiquidable, quotaEstatal, quotaAutonomica, quotaIntegra,
    retencions, pagaments130: pagats, resultat: quotaIntegra - retencions - pagats,
    tipusMitja: baseLiquidable > 0 ? Math.round((quotaIntegra / baseLiquidable) * 1000) / 10 : null, motiu: null
  });
}

/* El 390: la suma dels 303 de l'any. Parcial si algun trimestre no té dades o els extractes només el cobrixen en part. */
function resum390(trimestres, any) {
  const amb = trimestres.map((tr) => tr.iva).filter((iva) => iva.motiu === null);
  if (!amb.length) return Object.freeze({ model: '390', any, parcial: true, repercutit: null, isp: null, suportat: null, resultat: null, aIngressar: null, motiu: 'SENSE_DADES' });
  return Object.freeze({
    model: '390', any, parcial: amb.length < 4 || trimestres.some((tr) => tr.cobertura === 'parcial'),
    repercutit: sumaDe(amb, 'repercutit'),
    isp: amb.reduce((t, iva) => t + iva.ispIntracomunitari + iva.ispExtracomunitari, 0),
    suportat: sumaDe(amb, 'suportat'),
    resultat: sumaDe(amb, 'quota'),
    aIngressar: sumaDe(amb, 'aIngressar'),
    motiu: null
  });
}

/**
 * Un any sencer: els quatre trimestres (303 i 130, encadenats), el 390 i la renda.
 * @param {{ operacions: object[], any: number, parametres?: object, compensacioInicial?: number,
 *   rendimentAnyAnterior?: number|null, cobertura?: Record<string, string>|null }} p
 *   `cobertura`: { 'AAAA-Tn': 'completa'|'parcial'|'cap' } (coberturaDe); sense, no se sap
 * @returns {object} { any, parametres, trimestres: [{ t, cobertura, iva, irpf, total }], model390, renda, compensacioFinal, avisos }
 *   `total` és null si ni el 303 ni el 130 del trimestre tenen xifra.
 */
export function estimaAny({ operacions, any, parametres, compensacioInicial = 0, rendimentAnyAnterior = null, cobertura = null } = {}) {
  const p = parametres ?? parametresDe(any);
  const ops = valides(operacions);
  let compensacio = enter(compensacioInicial) && compensacioInicial > 0 ? compensacioInicial : 0;
  let pagats = 0;
  let acumulatIncomplet = false;
  const trimestres = [1, 2, 3, 4].map((t) => {
    const cob = coberturaDe(cobertura, any, t);
    if (cob !== null && cob !== 'completa') acumulatIncomplet = true;
    const iva = estima303({ operacions: ops, any, t, compensacioAnterior: compensacio, cobertura: cob });
    compensacio = iva.aCompensar;
    const irpf = estima130({ operacions: ops, any, t, parametres: p, pagamentsAnteriors: pagats, rendimentAnyAnterior, cobertura: cob, acumulatIncomplet });
    if (enter(irpf.resultat)) pagats += irpf.resultat;
    const xifres = [iva.aIngressar, irpf.resultat].filter(enter);
    return Object.freeze({ t, cobertura: cob, iva, irpf, total: xifres.length ? xifres.reduce((x, y) => x + y, 0) : null });
  });
  const renda = estimaRenda({ operacions: ops, any, parametres: p, pagaments130: pagats });
  const avisos = [];
  if (p.origen === 'd-un-altre-any') avisos.push(avis('PARAMETRES_D_UN_ALTRE_ANY', `Sense paràmetres de ${any}: s’usen els de ${p.anyDeLaFont}.`));
  if (trimestres.some((tr) => tr.iva.motiu !== null || (tr.cobertura !== null && tr.cobertura !== 'completa'))) {
    avisos.push(avis('ANY_INCOMPLET', `Hi ha trimestres de ${any} sense dades o amb extractes a mitges: el 390 i la renda en són parcials.`));
  }
  return Object.freeze({ any, parametres: p, trimestres, model390: resum390(trimestres, any), renda, compensacioFinal: compensacio, avisos });
}

/**
 * La simulació de diversos anys, encadenats: el que queda a compensar del 303
 * i el rendiment de l'any anterior (per a la minoració del 130).
 * @param {{ operacions: object[], anys: number[], parametresPropis?: Record<number, object>,
 *   cobertura?: Record<string, string>|null }} p `cobertura`: la de cada trimestre (vegeu estimaAny)
 * @returns {{ anys: object[], etiqueta: string }}
 */
export function simula({ operacions, anys, parametresPropis = {}, cobertura = null } = {}) {
  const ordenats = [...new Set((Array.isArray(anys) ? anys : []).filter(Number.isInteger))].sort((x, y) => x - y);
  let compensacio = 0;
  let rendimentAnterior = null;
  const resultat = ordenats.map((any) => {
    const estimacio = estimaAny({
      operacions, any, parametres: parametresDe(any, parametresPropis?.[any] ?? null), compensacioInicial: compensacio,
      rendimentAnyAnterior: rendimentAnterior, cobertura
    });
    compensacio = estimacio.compensacioFinal;
    rendimentAnterior = estimacio.renda.rendiment;
    return estimacio;
  });
  return Object.freeze({ anys: resultat, etiqueta: ETIQUETA_NO_VERIFICAT });
}

/**
 * La provisió d'impostos d'un trimestre: el 303 a ingressar més el 130.
 * @param {{ anys: object[] }} simulacio
 * @param {{ any: number, t: number }} trimestre
 * @returns {{ valor: number|null, any: number, t: number }}
 */
export function provisioDe(simulacio, { any, t } = {}) {
  const tr = simulacio?.anys?.find((a) => a.any === any)?.trimestres?.find((x) => x.t === t) ?? null;
  return Object.freeze({ valor: tr?.total ?? null, any, t });
}

const escala = (valor, percent) => Math.round((valor * (100 + percent)) / 100);
const percentValid = (x) => (typeof x === 'number' && Number.isFinite(x) && x >= -100 && x <= 1000 ? x : 0);

/**
 * Un escenari: les mateixes operacions amb la facturació i la despesa en IA
 * canviades en un percentatge (+10 vol dir un 10 % més; -30, un 30 % menys).
 * @param {object[]} operacions
 * @param {{ facturacio?: number, despesaIa?: number }} [canvis]
 * @returns {object[]}
 */
export function aplicaEscenari(operacions, { facturacio = 0, despesaIa = 0 } = {}) {
  const f = percentValid(facturacio);
  const ia = percentValid(despesaIa);
  return valides(operacions).map((op) => {
    if (op.tipus === 'ingres' && f !== 0) return { ...op, base: escala(op.base, f), iva: escala(op.iva, f), retencio: escala(op.retencio, f) };
    if (op.tipus === 'despesa' && op.categoria === 'ia' && ia !== 0) return { ...op, base: escala(op.base, ia), iva: escala(op.iva, ia) };
    return op;
  });
}

const diferencia = (x, y) => (enter(x) && enter(y) ? y - x : null);
const sumaTrimestres = (any, camp) => any.trimestres.reduce((t, tr) => (enter(tr[camp]) ? t + tr[camp] : t), 0);

/**
 * La diferència d'un escenari respecte de la base, any per any.
 * @param {{ anys: object[] }} base la de simula
 * @param {{ anys: object[] }} escenari la de simula amb les operacions de l'escenari
 * @returns {Array<{ any: number, iva: number|null, irpf130: number|null, renda: number|null, rendiment: number|null,
 *   total: number|null }>} `total`: el que canvia el que paga l'empresa (303, 130 i el resultat de la renda)
 */
export function comparaEscenari(base, escenari) {
  return (base?.anys ?? []).map((b) => {
    const e = escenari?.anys?.find((x) => x.any === b.any);
    if (!e) return Object.freeze({ any: b.any, iva: null, irpf130: null, renda: null, rendiment: null, total: null });
    const iva = diferencia(b.model390.aIngressar, e.model390.aIngressar);
    const irpf130 = b.trimestres.some((tr) => enter(tr.irpf.resultat))
      ? e.trimestres.reduce((t, tr) => t + (enter(tr.irpf.resultat) ? tr.irpf.resultat : 0), 0)
        - b.trimestres.reduce((t, tr) => t + (enter(tr.irpf.resultat) ? tr.irpf.resultat : 0), 0)
      : null;
    const renda = diferencia(b.renda.resultat, e.renda.resultat);
    const rendiment = diferencia(b.renda.rendiment, e.renda.rendiment);
    const parts = [iva, irpf130, renda].filter(enter);
    return Object.freeze({ any: b.any, iva, irpf130, renda, rendiment, total: parts.length ? parts.reduce((x, y) => x + y, 0) : null });
  });
}

/** El total d'impostos estimats d'un any (303 a ingressar i 130), o null. */
export const totalDeLAny = (any) => (any?.trimestres?.some((tr) => enter(tr.total)) ? sumaTrimestres(any, 'total') : null);
