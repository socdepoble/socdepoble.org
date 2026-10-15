/**
 * targetesTauler.js — les targetes del Tauler de la Gestoria, sense React.
 *
 * Ordre del Mestre, 261004 (regla d'or 1 i principi 3 de la Gestoria): el
 * Tauler és fet de UniversalCards que calcula el sistema, cadascuna amb la
 * seua pàgina pròpia dins de la closca. Ací viu, per a cada targeta, el que
 * diu: títol, subtítol, l'entradeta que explica què és la xifra, la xifra
 * (o, si no es pot saber, per què), les etiquetes, el detall de la seua pàgina
 * i d'on ix. Cap xifra és escrita: totes ixen de resumTauler.js i de
 * impostos/nucli/impostos.js.
 *
 * dadesDelTauler({ lectura, factures, avui, periode }) · de la lectura del tractor
 *   'gestoria.tauler' i, si el Full trimestral n'ha passat, de les seues factures i
 *   del trimestre que ha analitzat (periode), a tot el que pinta el Tauler:
 *   comptes, avisos, resum, estimacions i targetes.
 * Les xifres financeres no es pinten mai per defecte (TargetaTauler les
 * amaga fins que la persona prem l'ull); ací només es preparen. Les fiscals
 * porten sempre la llegenda d'estimació (LLEGENDA_ESTIMACIO).
 * Panell ERP (ordre del Mestre, 261012): el trimestre de les estimacions el
 * tria la persona a la capçalera de context (trimestreVei); el rellotge del
 * termini (rellotgeDelTermini) diu on és avui respecte del trimestre i de la
 * seua finestra de presentació, i com que una data no és cap xifra financera
 * es pinta sempre; la part de la caixa que caldria per a Hisenda
 * (hisendaSobreCaixa) sí que ho és, i la closca només la pinta amb l'ull obert.
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): sense tria ni
 * Full, el trimestre de les estimacions és el trimestre operatiu
 * (trimestreOperatiu), el que té oberta la presentació del 303 i del 130, i
 * el rellotge en compta els dies que queden.
 * Cabina d'Avió (ordre del Mestre, 13-10-2026, pla 261013_1405, front E; des
 * del 14-10-2026, «Quadre de comandament»):
 * dadesDelTauler porta també `cabina`, el model de la tercera vista del Tauler
 * (cabinaAvio.js), fet de les mateixes peces que les targetes; els venciments
 * miren el trimestre d'avui, l'anterior i el de les estimacions. Les xifres
 * de la Cabina són de dos tipus nous: 'dies' (dies de cobertura) i 'ratio'
 * (la caixa davant de Hisenda), que textXifra i etiquetaXifra ja escriuen.
 * Ordre del Mestre, 261004 (privacitat): cap títol ni subtítol porta dades.
 * L'Índex de la barra blava recull tots els encapçalaments i escriu el de
 * la secció triada a la URL (?seccio=), i el títol i el subtítol d'una
 * targeta en són dos. Per això els comptes es diuen «Compte 1», «Compte 2»…
 * (nomsDelsComptes) i l'entitat i els quatre últims dígits només van a
 * l'entradeta, que és un paràgraf. Sense moviments o factures en euros, la
 * xifra no hi és i el perquè diu «Sense mesura en euros», mai «0,00 €».
 * JS pur: sense DOM ni React.
 */
import {
  estimaIrpf130, estimaIva303, LLEGENDA_ESTIMACIO, resumHisenda, terminiPresentacio, trimestreDeData
} from '../../impostos/nucli/impostos.js';
import { comparaDates, diesEntre, esDataValida, formatData, rangTrimestre } from '../../nucli/dates.js';
import { formatImport } from '../../nucli/diners.js';
import { cabinaDelTauler, compteEnrere } from './cabinaAvio.js';
import { MONEDA_TAULER, comptesDe, resumTauler } from './resumTauler.js';

/** Els blocs del Tauler, amb el seu títol, en l'ordre en què es pinten. */
export const BLOCS_TAULER = Object.freeze({
  realitat: 'La teua realitat',
  finances: 'Finances (últims 30 dies)',
  bancs: 'Estat de comptes reals i conciliació',
  impostos: 'Estimacions del trimestre'
});

const ETIQUETA_BANC = Object.freeze({ text: 'Banc', className: 'sdp-badge-system' });
const ETIQUETA_IMPOSTOS = Object.freeze({ text: 'Impostos', className: 'sdp-badge-system' });
const ETIQUETA_FACTURES = Object.freeze({ text: 'Factures', className: 'sdp-badge-system' });
const etiqueta = (text) => Object.freeze({ text, className: 'sdp-badge-tag' });
const IMPORT = (valor, moneda = MONEDA_TAULER) => (Number.isSafeInteger(valor) ? { tipus: 'import', valor, moneda } : null);
const RECOMPTE = (valor) => (Number.isSafeInteger(valor) ? { tipus: 'recompte', valor } : null);
const dia = (d) => formatData(d, 'dd/mm/aaaa');

/* Per què una xifra del banc no es pot saber. */
const SENSE_XIFRA_BANC = Object.freeze({
  SENSE_DADES: 'Sense dades: encara no has triat cap extracte del banc.',
  SENSE_SALDO: 'Els extractes no porten cap saldo que es puga llegir.',
  ALTRA_MONEDA: 'Sense mesura en euros: els comptes són en una altra moneda, i el Tauler només suma euros.',
  SENSE_MOVIMENTS: 'Sense mesura en euros: cap moviment dels teus comptes en euros cau en esta finestra.',
  POCS_DIES: 'Cal almenys un mes de moviments per a calcular-la.',
  SENSE_DESPESES: 'Els extractes no porten cap despesa: no hi ha res per a dividir.'
});
/* Amb factures però cap en euros amb la base llegida: tampoc hi ha mesura. */
const SENSE_XIFRA_FACTURES = 'Sense mesura en euros: cap factura en euros amb la base llegida en esta finestra.';
/* Les files del detall que tenen xifra: una fila sense mesura no es pinta com si en tinguera. */
const ambXifra = (files) => files.filter((fila) => fila.xifra);

/**
 * El text d'una xifra, tal com es pinta quan la persona la mostra. Els dies
 * (Cabina d'Avió, ordre del Mestre, 13-10-2026) són enters; la ràtio, amb dos
 * decimals i la coma.
 * @param {{ tipus: 'import'|'mesos'|'recompte'|'dies'|'ratio', valor: number, moneda?: string }|null} xifra
 * @returns {string} '' si no n'hi ha
 */
export function textXifra(xifra) {
  if (!xifra || !Number.isFinite(xifra.valor)) return '';
  if (xifra.tipus === 'import') {
    if (!Number.isSafeInteger(xifra.valor)) return '';
    return xifra.moneda && xifra.moneda !== MONEDA_TAULER ? `${formatImport(xifra.valor, { simbol: false })} ${xifra.moneda}` : formatImport(xifra.valor);
  }
  if (xifra.tipus === 'mesos') return xifra.valor.toFixed(1).replace('.', ',');
  if (xifra.tipus === 'dies') return Number.isSafeInteger(xifra.valor) ? String(xifra.valor) : '';
  if (xifra.tipus === 'ratio') return xifra.valor.toFixed(2).replace('.', ',');
  return String(xifra.valor);
}

/* La unitat que el quadrat no diu, en singular i en plural (una ràtio amb decimals va sempre en plural). */
const UNITATS = Object.freeze({ mesos: ['mes', 'mesos'], dies: ['dia', 'dies'], ratio: ['vegades', 'vegades'] });

/**
 * El nom accessible d'una xifra mostrada: amb la unitat que el quadrat no diu.
 * @param {object|null} xifra
 * @returns {string}
 */
export function etiquetaXifra(xifra) {
  const text = textXifra(xifra);
  if (!text) return '';
  const unitat = UNITATS[xifra.tipus];
  return unitat ? `${text} ${xifra.valor === 1 ? unitat[0] : unitat[1]}` : text;
}

/** El que diu una xifra amagada: «Import amagat» si és d'euros; si no, «Xifra amagada». */
export const textAmagat = (xifra) => (xifra?.tipus === 'import' ? 'Import amagat' : 'Xifra amagada');

/* La finestra de les finances, en paraules. */
const finestraDe = (finances) => (finances?.desde && finances?.fins
  ? `del ${dia(finances.desde)} al ${dia(finances.fins)}`
  : 'dels 30 dies que acaben l’últim dia dels extractes');

function targetaCaixa({ caixa, fins, tresoreria }, noms) {
  const enEuros = tresoreria.filter((c) => c.divisa === MONEDA_TAULER);
  return {
    id: 'caixa',
    bloc: 'realitat',
    icona: 'wallet',
    titol: 'Caixa real',
    subtitol: 'El saldo disponible als teus comptes',
    entradeta: fins
      ? `La suma dels saldos en euros dels teus comptes l’últim dia dels extractes, el ${dia(fins)}.`
      : 'La suma dels saldos en euros dels teus comptes, l’últim dia dels extractes que tries.',
    xifra: IMPORT(caixa.saldo),
    senseXifra: SENSE_XIFRA_BANC[caixa.motiu] ?? SENSE_XIFRA_BANC.SENSE_DADES,
    etiquetes: [ETIQUETA_BANC, ...(caixa.saldo !== null && !caixa.completa ? [etiqueta('Incompleta')] : [])],
    detall: enEuros.map((c) => ({ etiqueta: noms.get(c.id), xifra: IMPORT(c.saldo) })),
    notes: caixa.exclosos.length ? ['Un compte en una altra moneda queda fora de la suma: la seua targeta és als Bancs.'] : [],
    font: 'El saldo final de cada extracte de la Norma 43 (el peu del compte o, si no en té, el saldo inicial més els moviments) o la columna de saldo del CSV del banc.'
  };
}

/* D'on ixen les xifres fiscals: les factures que el Full trimestral ha passat al Tauler, o encara cap. */
const fontImpostosDe = (ambFactures) => (ambFactures
  ? 'Les factures que el Full trimestral ha passat al Tauler, amb el càlcul de impostos/nucli/impostos.js.'
  : 'Encara no hi ha cap factura al Tauler: analitza un trimestre al Full trimestral i les seues factures arribaran ací. El càlcul és el de impostos/nucli/impostos.js.');

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I · motors; auditoria de Codex 261013_1510, GES-A5):
   la xifra és el que surt a PAGAR de cada model, sumat (resumHisenda); un 303 a compensar no resta del 130 i
   va a part, al detall. La fila «IVA a compensar» hi és sempre que hi ha 303 (0 si surt a pagar): una fila
   que només aparegués amb el 303 negatiu en diria el signe amb l'ull tancat. */
function targetaHisenda({ iva, irpf, hisenda, ambFactures }) {
  const periode = Number.isInteger(iva.t) ? `${iva.t}T ${iva.any}` : 'el trimestre';
  return {
    id: 'hisenda',
    bloc: 'realitat',
    icona: 'landmark',
    titol: 'Hisenda',
    subtitol: `Models 303 i 130 · ${periode}`,
    entradeta: 'El que caldria pagar este trimestre per l’IVA (303) i pel pagament fraccionat de l’IRPF (130), cada model pel seu compte. Estimació per a revisar amb la gestoria: no és cap declaració.',
    xifra: IMPORT(hisenda.total),
    senseXifra: senseFactures(iva) && senseFactures(irpf)
      ? 'Sense factures del trimestre al Tauler: no hi ha cap estimació.'
      : 'Sense mesura en euros: cap factura en euros amb l’import llegit.',
    etiquetes: [ETIQUETA_IMPOSTOS, ...(hisenda.completa ? [] : [etiqueta('Estimació incompleta')]), ...terminiDe(iva)],
    detall: [
      { etiqueta: '303 · IVA', xifra: IMPORT(iva.resultat) },
      { etiqueta: '130 · IRPF', xifra: IMPORT(irpf.resultat) },
      { etiqueta: 'IVA a compensar (no resta)', xifra: IMPORT(hisenda.ivaACompensar) }
    ],
    notes: [
      ...hisenda.falten.map((f) => f.missatge),
      'Un 303 a compensar no resta del 130: és IVA per a trimestres següents (o, si toca, per a demanar), no diners cobrats.',
      LLEGENDA_ESTIMACIO
    ],
    font: fontImpostosDe(ambFactures)
  };
}

function targetaCobertura({ cobertura, caixa }) {
  return {
    id: 'cobertura',
    bloc: 'realitat',
    icona: 'hourglass',
    titol: 'Cobertura',
    subtitol: 'Els mesos que la caixa paga les despeses',
    entradeta: Number.isFinite(cobertura.despesaMensual)
      ? `La caixa real dividida per la despesa mitjana de cada mes ${cobertura.mesosObservats === 1 ? 'de l’últim mes' : `dels últims ${String(cobertura.mesosObservats).replace('.', ',')} mesos`} dels extractes (com a molt, sis).`
      : 'La caixa real dividida per la despesa mitjana de cada mes dels últims mesos dels extractes (com a molt, sis).',
    xifra: Number.isFinite(cobertura.mesos) ? { tipus: 'mesos', valor: cobertura.mesos } : null,
    senseXifra: SENSE_XIFRA_BANC[cobertura.motiu] ?? SENSE_XIFRA_BANC.SENSE_DADES,
    etiquetes: [ETIQUETA_BANC],
    detall: [
      { etiqueta: 'Caixa real', xifra: IMPORT(caixa.saldo) },
      { etiqueta: 'Despesa mensual mitjana', xifra: IMPORT(cobertura.despesaMensual) }
    ],
    notes: ['Els traspassos entre els teus comptes compten com a despesa en un i com a entrada en l’altre.'],
    font: 'Les eixides dels comptes en euros dels extractes de la Norma 43 i del CSV del banc.'
  };
}

function targetesFinances({ finances }) {
  const { banc, factures } = finances;
  const finestra = finestraDe(finances);
  const ambFactures = Boolean(factures);
  const deFactures = (text) => `${text} de les factures ${finestra}, sobre la base imposable.`;
  const delBanc = (text) => `${text} dels teus comptes en euros ${finestra}, segons els extractes (IVA inclòs).`;
  /* Sense extractes, «Sense dades»; amb extractes però sense res en euros, «Sense mesura en euros». */
  const senseBanc = ambFactures ? SENSE_XIFRA_FACTURES : (SENSE_XIFRA_BANC[finances.motiu] ?? SENSE_XIFRA_BANC.SENSE_DADES);
  const etiquetesFont = [ambFactures ? ETIQUETA_FACTURES : ETIQUETA_BANC, ...(ambFactures && !factures.completa ? [etiqueta('Incompleta')] : [])];
  const fontFactures = 'Les factures que té el Tauler, sobre la base imposable (subtotal).';
  const fontBanc = 'Els moviments dels comptes en euros de la Norma 43 i del CSV del banc.';
  return [
    {
      id: 'factures',
      bloc: 'finances',
      icona: 'receipt',
      titol: 'Factures i vendes',
      subtitol: 'Les factures emeses dels últims 30 dies',
      entradeta: `Quantes factures has emés ${finestra}. La seua pàgina en diu la base imposable.`,
      xifra: ambFactures ? RECOMPTE(factures.emeses) : null,
      senseXifra: 'Encara no hi ha cap factura al Tauler: analitza un trimestre al Full trimestral i les seues factures arribaran ací.',
      etiquetes: [ETIQUETA_FACTURES],
      detall: ambFactures ? ambXifra([
        { etiqueta: 'Factures emeses', xifra: RECOMPTE(factures.emeses) },
        { etiqueta: 'Vendes (base imposable)', xifra: IMPORT(factures.vendes) }
      ]) : [],
      notes: [],
      font: fontFactures
    },
    {
      id: 'ingressos',
      bloc: 'finances',
      icona: 'trendingUp',
      titol: 'Ingressos',
      subtitol: 'Vendes recents',
      entradeta: ambFactures ? deFactures('Les vendes') : delBanc('El que ha entrat'),
      xifra: ambFactures ? IMPORT(factures.vendes) : IMPORT(banc?.entrades),
      senseXifra: senseBanc,
      etiquetes: etiquetesFont,
      detall: banc ? ambXifra([{ etiqueta: 'Entrades al banc', xifra: IMPORT(banc.entrades) }, { etiqueta: 'Moviments', xifra: RECOMPTE(banc.moviments) }]) : [],
      notes: [],
      font: ambFactures ? fontFactures : fontBanc
    },
    {
      id: 'despeses',
      bloc: 'finances',
      icona: 'trendingDown',
      titol: 'Despeses',
      subtitol: 'Compres recents',
      entradeta: ambFactures ? deFactures('Les compres') : delBanc('El que ha eixit'),
      xifra: ambFactures ? IMPORT(factures.compres) : IMPORT(banc?.eixides),
      senseXifra: senseBanc,
      etiquetes: etiquetesFont,
      detall: banc ? ambXifra([{ etiqueta: 'Eixides del banc', xifra: IMPORT(banc.eixides) }, { etiqueta: 'Moviments', xifra: RECOMPTE(banc.moviments) }]) : [],
      notes: [],
      font: ambFactures ? fontFactures : fontBanc
    },
    {
      id: 'rendiment',
      bloc: 'finances',
      icona: 'scale',
      titol: 'Rendiment',
      subtitol: 'Benefici net',
      entradeta: ambFactures ? deFactures('Les vendes menys les compres') : delBanc('El que ha entrat menys el que ha eixit'),
      xifra: ambFactures ? IMPORT(factures.rendiment) : IMPORT(banc?.net),
      senseXifra: senseBanc,
      etiquetes: etiquetesFont,
      detall: banc ? ambXifra([
        { etiqueta: 'Entrades al banc', xifra: IMPORT(banc.entrades) },
        { etiqueta: 'Eixides del banc', xifra: IMPORT(banc.eixides) },
        { etiqueta: 'Diferència', xifra: IMPORT(banc.net) }
      ]) : [],
      notes: [],
      font: ambFactures ? fontFactures : fontBanc
    }
  ];
}

/**
 * Els noms dels comptes, en l'ordre de la tresoreria: «Compte 1», «Compte 2»…
 * (o «Moviments en CSV», el compte sense número). Mai cap dígit del compte:
 * el nom és el títol de la seua targeta i de la seua pàgina, i l'Índex el pot
 * escriure a la URL.
 * @param {Array<{ id: string }>} tresoreria
 * @returns {Map<string, string>}
 */
export function nomsDelsComptes(tresoreria) {
  return new Map((tresoreria ?? []).map((c, i) => [c.id, c.id === 'csv' ? 'Moviments en CSV' : `Compte ${i + 1}`]));
}

/* Qui és el compte, per a l'entradeta (un paràgraf, mai un títol): l'entitat i els quatre últims dígits. */
function identitatDelCompte(c) {
  if (c.id === 'csv') return 'El CSV de moviments del banc, sense número de compte.';
  const entitat = c.entitat ? `De l’entitat ${c.entitat}` : 'D’una entitat sense codi';
  return c.compte4 ? `${entitat}, acabat en ${c.compte4}.` : `${entitat}.`;
}

function targetaCompte(c, noms) {
  const enEuros = c.divisa === MONEDA_TAULER;
  const etiquetaSaldo = c.saldoDe === 'peu' ? 'Saldo del banc' : c.saldoDe ? 'Saldo calculat' : 'Sense saldo';
  return {
    id: `compte-${c.id}`,
    bloc: 'bancs',
    icona: 'building',
    titol: noms.get(c.id),
    subtitol: c.id === 'csv' ? 'Saldo bancari · sense número de compte' : 'Saldo bancari · extracte del banc',
    entradeta: c.fins
      ? `${identitatDelCompte(c)} El saldo de l’últim dia de l’extracte, el ${dia(c.fins)}, i el que hi ha entrat i eixit en els últims 30 dies.`
      : `${identitatDelCompte(c)} El saldo de l’últim dia de l’extracte i el que hi ha entrat i eixit en els últims 30 dies.`,
    xifra: IMPORT(c.saldo, c.divisa ?? 'XXX'),
    senseXifra: SENSE_XIFRA_BANC.SENSE_SALDO,
    etiquetes: [
      ETIQUETA_BANC,
      etiqueta(etiquetaSaldo),
      ...(enEuros ? [] : [etiqueta(c.divisa ? `En ${c.divisa}` : 'Moneda desconeguda')]),
      ...(c.avisos > 0 ? [etiqueta('Revisa l’extracte')] : [])
    ],
    detall: [
      { etiqueta: 'Saldo', xifra: IMPORT(c.saldo, c.divisa ?? 'XXX') },
      /* Sense moviments a la finestra, només el recompte: cap «0,00» d'entrades o d'eixides que no s'han mesurat. */
      ...(c.finestra ? ambXifra([
        { etiqueta: 'Entrades (30 dies)', xifra: IMPORT(c.finestra.entrades, c.divisa ?? 'XXX') },
        { etiqueta: 'Eixides (30 dies)', xifra: IMPORT(c.finestra.eixides, c.divisa ?? 'XXX') },
        { etiqueta: 'Moviments (30 dies)', xifra: RECOMPTE(c.finestra.moviments) }
      ]) : [])
    ],
    notes: [
      ...(c.desde && c.fins ? [`L’extracte cobrix del ${dia(c.desde)} al ${dia(c.fins)}.`] : []),
      ...(c.avisos > 0 ? ['L’extracte porta avisos de lectura (sumes, saldo o registres que no quadren): revisa’l abans de fiar-te’n.'] : []),
      ...(enEuros ? [] : ['Este compte no és en euros: no entra a la caixa real ni a les finances.'])
    ],
    font: c.compte4 ? 'L’extracte de la Norma 43 d’este compte.' : 'El CSV de moviments del banc, sense Norma 43.'
  };
}

function targetaConciliacio({ conciliacio }) {
  const ambRecompte = conciliacio.ambFactures && Number.isSafeInteger(conciliacio.parelles);
  return {
    id: 'conciliacio',
    bloc: 'bancs',
    icona: 'link',
    titol: 'Conciliació',
    subtitol: 'Moviments del banc sense factura',
    entradeta: conciliacio.ambFactures
      ? 'Els moviments del banc que encara no tenen la seua factura. La seua pàgina diu també les factures sense pagament.'
      : 'Encara no hi ha factures al Tauler: tots els moviments del banc estan per conciliar.',
    xifra: ambRecompte ? RECOMPTE(conciliacio.movimentsSenseFactura) : (conciliacio.moviments > 0 ? RECOMPTE(conciliacio.moviments) : null),
    senseXifra: SENSE_XIFRA_BANC.SENSE_DADES,
    etiquetes: [ETIQUETA_BANC, ...(conciliacio.ambFactures ? [] : [etiqueta('Sense factures')])],
    detall: [
      { etiqueta: 'Moviments en euros', xifra: RECOMPTE(conciliacio.moviments) },
      { etiqueta: 'Factures', xifra: RECOMPTE(conciliacio.factures) },
      ...(ambRecompte ? [
        { etiqueta: 'Parelles proposades', xifra: RECOMPTE(conciliacio.parelles) },
        { etiqueta: 'Moviments sense factura', xifra: RECOMPTE(conciliacio.movimentsSenseFactura) },
        { etiqueta: 'Factures sense pagament', xifra: RECOMPTE(conciliacio.facturesSensePagament) },
        { etiqueta: 'Incidències', xifra: RECOMPTE(conciliacio.incidencies) }
      ] : [])
    ],
    notes: [
      'Les parelles són propostes: la conciliació que revisa i confirma la persona encara no és al Tauler.',
      'El Tauler no guarda el text dels conceptes ni els rebuts SEPA: aparella per l’import, la data, el concepte comú i l’import en l’altra moneda, i no reconeix el número de factura ni el creditor d’un rebut.'
    ],
    font: 'Les regles de conciliació de nucli/concilia.js sobre la lectura reduïda dels extractes.'
  };
}

/* Sense cap factura del període (o amb el trimestre invàlid): l'estimació no té de què partir. */
const senseFactures = (estimacio) => (estimacio?.falten ?? []).some((f) => f.codi === 'SENSE_FACTURES' || f.codi === 'TRIMESTRE_INVALID');

/* El termini de presentació, com a etiqueta (una data no és cap xifra financera). */
const terminiDe = (estimacio) => (estimacio?.termini?.fi ? [etiqueta(`Termini ${dia(estimacio.termini.fi)}`)] : []);

function targetesImpostos({ iva, irpf, ambFactures }) {
  const periode = (e) => (Number.isInteger(e.t) ? `Estimació del ${e.t}T ${e.any}` : 'Estimació del trimestre');
  const notes = (e) => [...e.falten.map((f) => f.missatge), LLEGENDA_ESTIMACIO];
  const fontImpostos = fontImpostosDe(ambFactures);
  return [
    {
      id: 'iva-303',
      bloc: 'impostos',
      icona: 'percent',
      titol: 'IVA · model 303',
      subtitol: periode(iva),
      entradeta: 'L’IVA de les factures emeses menys l’IVA deduïble de les rebudes del trimestre. Estimació per a revisar amb la gestoria: no és cap declaració.',
      xifra: IMPORT(iva.resultat),
      senseXifra: senseFactures(iva)
        ? 'Sense factures del trimestre al Tauler: no hi ha cap estimació.'
        : 'Sense mesura en euros: cap factura del trimestre en euros amb l’IVA llegit.',
      etiquetes: [ETIQUETA_IMPOSTOS, ...(iva.completa ? [] : [etiqueta('Estimació incompleta')]), ...terminiDe(iva)],
      detall: [
        { etiqueta: 'IVA repercutit', xifra: IMPORT(iva.repercutit) },
        { etiqueta: 'IVA suportat deduïble', xifra: IMPORT(iva.suportat) },
        { etiqueta: 'Resultat', xifra: IMPORT(iva.resultat) },
        { etiqueta: 'Factures emeses', xifra: RECOMPTE(iva.factures.emeses) },
        { etiqueta: 'Factures rebudes', xifra: RECOMPTE(iva.factures.rebudes) }
      ],
      notes: notes(iva),
      font: fontImpostos
    },
    {
      id: 'irpf-130',
      bloc: 'impostos',
      icona: 'calculator',
      titol: 'IRPF · model 130',
      subtitol: periode(irpf),
      entradeta: 'El 20 % del rendiment de l’any fins al final del trimestre, menys les retencions i els pagaments anteriors. Estimació per a revisar amb la gestoria: no és cap declaració.',
      xifra: IMPORT(irpf.resultat),
      senseXifra: senseFactures(irpf)
        ? 'Sense factures de l’any al Tauler: no hi ha cap estimació.'
        : 'Sense mesura en euros: cap factura de l’any en euros amb la base llegida.',
      etiquetes: [ETIQUETA_IMPOSTOS, ...(irpf.completa ? [] : [etiqueta('Estimació incompleta')]), ...terminiDe(irpf)],
      detall: [
        { etiqueta: 'Ingressos de l’any', xifra: IMPORT(irpf.ingressos) },
        { etiqueta: 'Despeses de l’any', xifra: IMPORT(irpf.despeses) },
        { etiqueta: 'Rendiment', xifra: IMPORT(irpf.rendiment) },
        { etiqueta: 'Quota (20 %)', xifra: IMPORT(irpf.quota) },
        { etiqueta: 'Retencions', xifra: IMPORT(irpf.retencions) },
        { etiqueta: 'Pagaments anteriors', xifra: IMPORT(irpf.pagamentsAnteriors) },
        { etiqueta: 'Resultat', xifra: IMPORT(irpf.resultat) }
      ],
      notes: notes(irpf),
      font: fontImpostos
    }
  ];
}

/**
 * Totes les targetes del Tauler, en ordre de blocs.
 * @param {{ resum: object, iva: object, irpf: object, hisenda: object, ambFactures?: boolean }} p
 *   ambFactures: si el Full trimestral ha passat factures al Tauler (canvia d'on es diu que ixen les xifres fiscals)
 * @returns {object[]} cada una: { id, bloc, icona, titol, subtitol, entradeta, xifra, senseXifra, etiquetes,
 *   detall: [{ etiqueta, xifra }], notes: string[], font }
 */
export function targetesDelTauler({ resum, iva, irpf, hisenda, ambFactures = false }) {
  const noms = nomsDelsComptes(resum.tresoreria);
  return [
    targetaCaixa(resum, noms),
    targetaHisenda({ iva, irpf, hisenda, ambFactures }),
    targetaCobertura(resum),
    ...targetesFinances(resum),
    ...resum.tresoreria.map((c) => targetaCompte(c, noms)),
    targetaConciliacio(resum),
    ...targetesImpostos({ iva, irpf, ambFactures })
  ];
}

/**
 * El trimestre del costat, per a les fletxes de la capçalera de context: pas
 * -1 l'anterior i +1 el següent, amb el canvi d'any quan toca.
 * @param {{ any: number, t: number }|null} periode
 * @param {number} pas
 * @returns {{ any: number, t: number }|null} null si periode no és un trimestre
 */
export function trimestreVei(periode, pas) {
  if (!periode || !rangTrimestre(periode.any, periode.t) || !Number.isInteger(pas)) return null;
  const index = periode.any * 4 + periode.t - 1 + pas;
  const nou = { any: Math.floor(index / 4), t: (index % 4) + 1 };
  return rangTrimestre(nou.any, nou.t) ? nou : null;
}

/**
 * El trimestre operatiu d'una data (ordre del Mestre, 14-10-2026, prompt
 * 261014_2015, punt 1): si avui cau dins de la finestra de presentació del
 * trimestre anterior (de l'1 al 20 d'abril, juliol i octubre, i fins al 30 de
 * gener per al 4T), el trimestre operatiu és el que s'està liquidant
 * (l'anterior). Altrament, el trimestre natural de la data. El 14-10-2026 és
 * el 3T 2026, que vença el 20-10, i no el 4T que acaba de començar. Els
 * terminis són els de impostos.js, [NO VERIFICAT] i sense el pas al dia hàbil
 * (el 30-01-2027 és dissabte); quan terminiPresentacio el tinga, esta funció
 * el seguirà sense cap altre canvi.
 * @param {{ a: number, m: number, d: number }|null} avui
 * @returns {{ any: number, t: number }|null}
 */
export function trimestreOperatiu(avui) {
  const actual = trimestreDeData(avui);
  if (!actual) return null;
  const anterior = trimestreVei(actual, -1);
  const finestra = anterior ? terminiPresentacio(anterior.any, anterior.t) : null;
  if (finestra && comparaDates(avui, finestra.inici) >= 0 && comparaDates(avui, finestra.fi) <= 0) {
    return anterior;
  }
  return actual;
}

/* El nom del trimestre en el text del rellotge: «4T 2026». */
const nomTrimestre = ({ any, t }) => (Number.isInteger(t) && Number.isInteger(any) ? `${t}T ${any}` : 'el trimestre');

/**
 * On és avui respecte del trimestre de les estimacions i de la seua finestra
 * de presentació del 303 i del 130. Una data no és cap xifra financera: la
 * closca el pinta sempre, també amb l'ull tancat. Només hi ha barra (valor i
 * max, en dies, comptant el primer i el d'avui) dins del trimestre i dins de
 * la finestra; abans i després, només el text. Els terminis són els de
 * impostos.js, [NO VERIFICAT] com allí.
 * Si avui hi ha oberta la presentació d'un altre trimestre (de l'1 al 20
 * d'octubre, la del 3T, mentre la capçalera mira el 4T), `obert` ho diu: el
 * venciment que corre no queda mai amagat darrere del trimestre triat.
 * Derogat EN PART per l'ordre del Mestre, 14-10-2026 (prompt 261014_2015,
 * punt 1): la capçalera ja no mira per defecte el 4T dins de la finestra del
 * 3T, sinó el trimestre operatiu (trimestreOperatiu), i `obert` només apareix
 * si la persona tria un altre trimestre o el Full en fixa un altre. En la
 * fase 'presentacio', el text porta el compte enrere: «… acaba el
 * 20/10/2026: queden 6 dies».
 * @param {{ any?: number, t?: number, periode?: object|null, termini?: object|null, avui?: object|null }} p
 *   el trimestre i el termini (els de l'estimació del 303) i el dia d'avui { a, m, d }
 * @returns {{ fase: 'sense'|'abans'|'trimestre'|'presentacio'|'vencut', valor: number|null, max: number|null,
 *   etiqueta: string, text: string, obert: string|null }}
 */
export function rellotgeDelTermini({ any, t, periode = null, termini = null, avui = null } = {}) {
  const nom = nomTrimestre({ any, t });
  if (!periode || !termini || !esDataValida(avui)) {
    return { fase: 'sense', valor: null, max: null, etiqueta: 'El termini del trimestre', text: 'Sense dia d’avui no es pot dir on és el trimestre.', obert: null };
  }
  const tram = (inici, fi) => ({ valor: Math.max(1, diesEntre(inici, avui) + 1), max: diesEntre(inici, fi) + 1 });
  /* La finestra de presentació oberta avui, si és d'un trimestre que no és el triat. */
  const deAvui = trimestreVei(trimestreDeData(avui), -1);
  const finestra = deAvui ? terminiPresentacio(deAvui.any, deAvui.t) : null;
  const obert = finestra && (deAvui.any !== any || deAvui.t !== t)
    && comparaDates(avui, finestra.inici) >= 0 && comparaDates(avui, finestra.fi) <= 0
    ? `Ara és oberta la presentació del ${nomTrimestre(deAvui)}: acaba el ${dia(finestra.fi)}.`
    : null;
  if (comparaDates(avui, periode.inici) < 0) {
    return { fase: 'abans', valor: null, max: null, etiqueta: `El ${nom}`, text: `El ${nom} encara no ha començat: comença el ${dia(periode.inici)}.`, obert };
  }
  if (comparaDates(avui, periode.fi) <= 0) {
    const { valor, max } = tram(periode.inici, periode.fi);
    return {
      fase: 'trimestre', valor, max, etiqueta: `El ${nom}: dia ${valor} de ${max}`,
      text: `La presentació del 303 i del 130 va del ${dia(termini.inici)} al ${dia(termini.fi)}.`, obert
    };
  }
  if (comparaDates(avui, termini.fi) <= 0) {
    const { valor, max } = tram(termini.inici, termini.fi);
    /* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 1): el compte enrere fins al dia que acaba,
       el mateix text que els venciments del Quadre de comandament (compteEnrere, cabinaAvio.js). */
    return {
      fase: 'presentacio', valor, max, etiqueta: `Presentació del ${nom}: dia ${valor} de ${max}`,
      text: `Ara és el termini de presentació del 303 i del 130, que ${compteEnrere(termini.fi, diesEntre(avui, termini.fi))}.`, obert
    };
  }
  return {
    fase: 'vencut', valor: null, max: null, etiqueta: `El ${nom}`, text: `El termini de presentació del ${nom} va acabar el ${dia(termini.fi)}.`, obert
  };
}

/* Per què no hi ha comparació entre Hisenda i la caixa: només per absència de dada, mai pel signe d'una xifra. */
const SENSE_LIQUIDACIO = Object.freeze({
  SENSE_CAIXA: 'Sense caixa real en euros: la comparació necessita el saldo en euros dels extractes del banc.',
  SENSE_ESTIMACIO: 'Sense estimació de Hisenda per a este trimestre: les factures arriben del Full trimestral.'
});

/**
 * Quina part de la caixa real caldria per a pagar l'estimació de Hisenda del
 * trimestre (303 + 130). És una xifra financera: la closca només la pinta amb
 * l'ull obert. Amb l'ull tancat només es pot dir el que no és cap xifra (que
 * falta la caixa o l'estimació); per això el «res a pagar» (el signe de
 * l'estimació) i la caixa a zero o en descobert (el signe del saldo) són
 * estats propis que també s'amaguen. El percentatge, en enters i amb sostre
 * de 100: si l'estimació supera la caixa, `supera` ho diu.
 * Tots els estats amb dada porten `completa`: una estimació incompleta no es
 * presenta mai com a segura (auditoria de Codex, GES-04, 261012).
 * Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla 261013_1405, front
 * I · motors; auditoria de Codex 261013_1510, GES-A5), sobre l'acord del
 * 261012: el total de Hisenda ja no és el net del 303 i del 130, que deixava
 * un 130 positiu a zero amb un 303 a compensar. Ara és el que surt a pagar de
 * cada model, sumat (resumHisenda), i un 303 a compensar va a part
 * (ivaACompensar). El «res» vol dir, doncs, que ni el 303 ni el 130 surten a
 * pagar; el «<= 0» queda com a guarda per a un total de fora.
 * Revisió adversarial 13-10-2026, troballa FIN-3: resumHisenda suma només els
 * models que tenen resultat, i un total de zero amb un model sense estimació
 * no diu res d'eixe model. Amb `iva` i `irpf` (estimaIva303 i estimaIrpf130),
 * el «res» d'un sol model conegut porta `desconegut` (el model sense
 * estimació, '303' o '130') i és incomplet: qui el pinta només diu el que se
 * sap. Sense cap dels dos resultats no hi ha estimació ('sense'). Sense `iva`
 * ni `irpf`, cap model es dona per desconegut.
 * @param {{ hisenda?: object, caixa?: object, iva?: object|null, irpf?: object|null }} p resumHisenda, la caixa de
 *   resumTauler i, si se saben, les estimacions de cada model
 * @returns {{ estat: 'sense', motiu: string }|{ estat: 'res', completa: boolean, desconegut?: '303'|'130' }|
 *   { estat: 'descobert', completa: boolean }|{ estat: 'xifra', percentatge: number, supera: boolean, completa: boolean }}
 */
export function hisendaSobreCaixa({ hisenda = null, caixa = null, iva = null, irpf = null } = {}) {
  if (!Number.isSafeInteger(caixa?.saldo)) return { estat: 'sense', motiu: SENSE_LIQUIDACIO.SENSE_CAIXA };
  /* Revisió adversarial 13-10-2026, troballa FIN-3: els models que es passen i no tenen resultat. */
  const desconeguts = [['303', iva], ['130', irpf]]
    .filter(([, model]) => model != null && !Number.isSafeInteger(model.resultat))
    .map(([nom]) => nom);
  if (!Number.isSafeInteger(hisenda?.total) || desconeguts.length === 2) {
    return { estat: 'sense', motiu: SENSE_LIQUIDACIO.SENSE_ESTIMACIO };
  }
  const completa = Boolean(hisenda.completa && caixa.completa) && desconeguts.length === 0;
  if (hisenda.total <= 0) return desconeguts.length ? { estat: 'res', completa, desconegut: desconeguts[0] } : { estat: 'res', completa };
  if (caixa.saldo <= 0) return { estat: 'descobert', completa };
  const supera = hisenda.total > caixa.saldo;
  return {
    estat: 'xifra',
    percentatge: supera ? 100 : Math.round((hisenda.total * 100) / caixa.saldo),
    supera,
    completa
  };
}

/**
 * Tot el que pinta el Tauler a partir de la lectura del tractor i, si n'hi ha,
 * de les factures del Full trimestral.
 * @param {object} [p]
 * @param {object|null} [p.lectura] el que torna executaTractorTauler (sense, el Tauler buit i honest)
 * @param {object[]} [p.factures] les factures del model (nucli/model.js): la proposta del Full trimestral
 *   i les dels fulls anteriors que ha llegit com a historial (el 130 és de l'any)
 * @param {{a:number,m:number,d:number}|null} [p.avui] el dia d'avui: sense periode, les estimacions són del seu
 *   trimestre operatiu (ordre del Mestre, 14-10-2026: el que té oberta la presentació; trimestreOperatiu)
 * @param {{ any: number, t: number }|null} [p.periode] el trimestre que ha analitzat el Full: mana sobre el d'avui,
 *   perquè les estimacions parlen del mateix trimestre que el full; un periode que no és un trimestre s'ignora
 * @returns {{ comptes: object[], avisos: object[], resum: object, iva: object, irpf: object, hisenda: object,
 *   rellotge: object, liquidacio: object, targetes: object[], cabina: object }} rellotge: rellotgeDelTermini del
 *   trimestre de les estimacions; liquidacio: hisendaSobreCaixa; cabina: cabinaDelTauler (el Quadre de comandament)
 */
export function dadesDelTauler({ lectura = null, factures = [], avui = null, periode = null } = {}) {
  const llistaFactures = Array.isArray(factures) ? factures : [];
  const { comptes, avisos } = comptesDe({ extractes: lectura?.extractes ?? [], csv: lectura?.csv ?? [] });
  const resum = resumTauler({ comptes, factures: llistaFactures, avui });
  const delFull = periode && rangTrimestre(periode.any, periode.t) ? { any: periode.any, t: periode.t } : null;
  const trimestre = delFull ?? trimestreOperatiu(avui) ?? trimestreDeData(resum.fins) ?? {};
  const iva = estimaIva303({ factures: llistaFactures, ...trimestre });
  const irpf = estimaIrpf130({ factures: llistaFactures, ...trimestre });
  const hisenda = resumHisenda({ iva, irpf });
  const liquidacio = hisendaSobreCaixa({ hisenda, caixa: resum.caixa, iva, irpf });
  const targetes = targetesDelTauler({ resum, iva, irpf, hisenda, ambFactures: llistaFactures.length > 0 });
  /* Els venciments de la Cabina: el trimestre que presenta avui (l'anterior), el d'avui i el de les estimacions. */
  const ara = trimestreDeData(avui);
  return {
    comptes,
    avisos: [...(lectura?.avisos ?? []), ...avisos],
    resum,
    iva,
    irpf,
    hisenda,
    rellotge: rellotgeDelTermini({ any: iva.any, t: iva.t, periode: iva.periode, termini: iva.termini, avui }),
    liquidacio,
    targetes,
    cabina: cabinaDelTauler({
      comptes, resum, iva, irpf, hisenda, liquidacio, targetes, avui,
      finestres: [trimestreVei(ara, -1), ara, { any: iva.any, t: iva.t }]
    })
  };
}
