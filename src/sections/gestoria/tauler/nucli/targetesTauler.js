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
 * dadesDelTauler({ lectura, factures, avui }) · de la lectura del tractor
 *   'gestoria.tauler' a tot el que pinta el Tauler: comptes, avisos, resum,
 *   estimacions i targetes.
 * Les xifres financeres no es pinten mai per defecte (TargetaTauler les
 * amaga fins que la persona prem l'ull); ací només es preparen. Les fiscals
 * porten sempre la llegenda d'estimació (LLEGENDA_ESTIMACIO).
 * Ordre del Mestre, 261004 (privacitat): cap títol ni subtítol porta dades.
 * L'Índex de la barra blava recull tots els encapçalaments i escriu el de
 * la secció triada a la URL (?seccio=), i el títol i el subtítol d'una
 * targeta en són dos. Per això els comptes es diuen «Compte 1», «Compte 2»…
 * (nomsDelsComptes) i l'entitat i els quatre últims dígits només van a
 * l'entradeta, que és un paràgraf. Sense moviments o factures en euros, la
 * xifra no hi és i el perquè diu «Sense mesura en euros», mai «0,00 €».
 * JS pur: sense DOM ni React.
 */
import { estimaIrpf130, estimaIva303, LLEGENDA_ESTIMACIO, resumHisenda, trimestreDeData } from '../../impostos/nucli/impostos.js';
import { formatData } from '../../nucli/dates.js';
import { formatImport } from '../../nucli/diners.js';
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
 * El text d'una xifra, tal com es pinta quan la persona la mostra.
 * @param {{ tipus: 'import'|'mesos'|'recompte', valor: number, moneda?: string }|null} xifra
 * @returns {string} '' si no n'hi ha
 */
export function textXifra(xifra) {
  if (!xifra || !Number.isFinite(xifra.valor)) return '';
  if (xifra.tipus === 'import') {
    if (!Number.isSafeInteger(xifra.valor)) return '';
    return xifra.moneda && xifra.moneda !== MONEDA_TAULER ? `${formatImport(xifra.valor, { simbol: false })} ${xifra.moneda}` : formatImport(xifra.valor);
  }
  if (xifra.tipus === 'mesos') return xifra.valor.toFixed(1).replace('.', ',');
  return String(xifra.valor);
}

/**
 * El nom accessible d'una xifra mostrada: amb la unitat que el quadrat no diu.
 * @param {object|null} xifra
 * @returns {string}
 */
export function etiquetaXifra(xifra) {
  const text = textXifra(xifra);
  if (!text) return '';
  return xifra.tipus === 'mesos' ? `${text} ${xifra.valor === 1 ? 'mes' : 'mesos'}` : text;
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

function targetaHisenda({ iva, irpf, hisenda }) {
  const periode = Number.isInteger(iva.t) ? `${iva.t}T ${iva.any}` : 'el trimestre';
  return {
    id: 'hisenda',
    bloc: 'realitat',
    icona: 'landmark',
    titol: 'Hisenda',
    subtitol: `Models 303 i 130 · ${periode}`,
    entradeta: 'El que caldria pagar este trimestre per l’IVA (303) i pel pagament fraccionat de l’IRPF (130). Estimació per a revisar amb la gestoria: no és cap declaració.',
    xifra: IMPORT(hisenda.total),
    senseXifra: senseFactures(iva) && senseFactures(irpf)
      ? 'Sense factures del trimestre al Tauler: no hi ha cap estimació.'
      : 'Sense mesura en euros: cap factura en euros amb l’import llegit.',
    etiquetes: [ETIQUETA_IMPOSTOS, ...(hisenda.completa ? [] : [etiqueta('Estimació incompleta')]), ...terminiDe(iva)],
    detall: [
      { etiqueta: '303 · IVA', xifra: IMPORT(iva.resultat) },
      { etiqueta: '130 · IRPF', xifra: IMPORT(irpf.resultat) }
    ],
    notes: [...hisenda.falten.map((f) => f.missatge), LLEGENDA_ESTIMACIO],
    font: 'Les factures del trimestre que té el Tauler, amb el càlcul de impostos/nucli/impostos.js. El Tauler encara no rep les factures del full trimestral ni de la facturació (pas 2 del MAPA).'
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
      senseXifra: 'Encara no hi ha cap factura al Tauler: el full trimestral i la facturació encara no li’n passen (pas 2 del MAPA).',
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

function targetesImpostos({ iva, irpf }) {
  const periode = (e) => (Number.isInteger(e.t) ? `Estimació del ${e.t}T ${e.any}` : 'Estimació del trimestre');
  const notes = (e) => [...e.falten.map((f) => f.missatge), LLEGENDA_ESTIMACIO];
  const fontImpostos = 'Les factures que té el Tauler, amb el càlcul de impostos/nucli/impostos.js. El Tauler encara no rep les factures del full trimestral ni de la facturació (pas 2 del MAPA).';
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
 * @param {{ resum: object, iva: object, irpf: object, hisenda: object }} p
 * @returns {object[]} cada una: { id, bloc, icona, titol, subtitol, entradeta, xifra, senseXifra, etiquetes,
 *   detall: [{ etiqueta, xifra }], notes: string[], font }
 */
export function targetesDelTauler({ resum, iva, irpf, hisenda }) {
  const noms = nomsDelsComptes(resum.tresoreria);
  return [
    targetaCaixa(resum, noms),
    targetaHisenda({ iva, irpf, hisenda }),
    targetaCobertura(resum),
    ...targetesFinances(resum),
    ...resum.tresoreria.map((c) => targetaCompte(c, noms)),
    targetaConciliacio(resum),
    ...targetesImpostos({ iva, irpf })
  ];
}

/**
 * Tot el que pinta el Tauler a partir de la lectura del tractor.
 * @param {object} [p]
 * @param {object|null} [p.lectura] el que torna executaTractorTauler (sense, el Tauler buit i honest)
 * @param {object[]} [p.factures] les factures del model, quan el Tauler en tinga
 * @param {{a:number,m:number,d:number}|null} [p.avui] el dia d'avui: el trimestre de les estimacions
 * @returns {{ comptes: object[], avisos: object[], resum: object, iva: object, irpf: object, hisenda: object, targetes: object[] }}
 */
export function dadesDelTauler({ lectura = null, factures = [], avui = null } = {}) {
  const { comptes, avisos } = comptesDe({ extractes: lectura?.extractes ?? [], csv: lectura?.csv ?? [] });
  const resum = resumTauler({ comptes, factures, avui });
  const trimestre = trimestreDeData(avui) ?? trimestreDeData(resum.fins) ?? {};
  const iva = estimaIva303({ factures, ...trimestre });
  const irpf = estimaIrpf130({ factures, ...trimestre });
  const hisenda = resumHisenda({ iva, irpf });
  return {
    comptes,
    avisos: [...(lectura?.avisos ?? []), ...avisos],
    resum,
    iva,
    irpf,
    hisenda,
    targetes: targetesDelTauler({ resum, iva, irpf, hisenda })
  };
}
