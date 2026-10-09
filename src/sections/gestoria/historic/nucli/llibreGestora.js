/**
 * llibreGestora.js — el llibre de càlcul (XLSX, diverses fulles) de l'històric
 * per a la gestora: resum anual i trimestral, moviments categoritzats,
 * despeses en IA per mes i proveïdor, estimacions i paràmetres.
 *
 * Onada 6, ordre del Mestre (261009): «descarregar-se un full de càlcul per a
 * la gestora real». També: «si src/utils/fulls/xlsx.js (creaXlsx) és pur i
 * sense xarxa, amplia la llista blanca d'imports per a usar-lo»: ho és (JS pur,
 * sense xarxa ni emmagatzematge; les seues úniques adreces són els espais de
 * noms d'OOXML, que el navegador no visita), i gestoria/privacitat.test.js
 * en permet l'import NOMÉS des d'este fitxer. El full trimestral de factures
 * (nucli/xlsx.js, font del tractor de factures) no es toca.
 *
 * El llibre NO porta el text dels conceptes del banc (no el té ningú: el
 * tractor no el torna). Ix SENSE xifrar: la pantalla ho diu abans de
 * descarregar-lo i en mostra l'empremta SHA-256. Els mateixos fulls donen els
 * mateixos bytes (el ZIP de creaXlsx té data fixa i les propietats no porten
 * ni autor ni data).
 * JS pur: sense DOM ni React.
 */
import { creaXlsx } from '../../../../utils/fulls/xlsx.js';
import { sha256Hex } from '../../../tractors/nucli/canonic.js';
import { TEXT_MOTIUS, categoriaDe, proveidorDe, tractamentIva } from '../../despeses/nucli/categories.js';
import { SENSE_PROVEIDOR } from '../../despeses/nucli/serieHistorica.js';
import { formatData } from '../../nucli/dates.js';
import { CAMPS_PARAMETRES, ETIQUETA_NO_VERIFICAT } from '../../impostos/nucli/simulacio.js';
import { CAMPS_SUPOSITS } from './operacions.js';

export const TIPUS_LLIBRE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
/** Les fulles del llibre, en ordre. */
export const FULLES_LLIBRE = Object.freeze([
  'Llegiu-me', 'Resum anual', 'Resum trimestral', 'Moviments', 'Despeses IA', 'Estimacions', 'Paràmetres'
]);
/** L'avís de la pantalla abans de descarregar-lo. */
export const AVIS_SENSE_XIFRAR = 'El llibre ix d’este ordinador SENSE xifrar: qui tinga el fitxer en podrà llegir totes les xifres. Guarda’l en un lloc segur i envia’l a la gestora per un canal de confiança.';

const iso = (d) => formatData(d, 'aaaa-mm-dd') || null;
const dia = (d) => formatData(d, 'dd/mm/aaaa');
const enter = (x) => Number.isSafeInteger(x);
const importDe = (x) => (enter(x) ? x : null);
const COBERTURA = Object.freeze({ completa: 'Completa', parcial: 'Parcial', cap: 'Sense extractes' });
const CONFIANCA = Object.freeze({ alta: 'Alta', mitjana: 'Mitjana', baixa: 'Baixa' });
const TRACTAMENT = Object.freeze({
  interior: 'Interior (IVA espanyol)', 'isp-intracomunitari': 'Inversió del subjecte passiu (UE)',
  'isp-extracomunitari': 'Inversió del subjecte passiu (fora de la UE)', desconegut: 'Desconegut'
});

const col = (titol, tipus, amplada) => (amplada ? { titol, tipus, amplada } : { titol, tipus });
const nomCategoria = (id) => categoriaDe(id)?.nom ?? id;
const nomProveidor = (clau) => (clau === SENSE_PROVEIDOR ? 'Sense proveïdor' : proveidorDe(clau)?.nom ?? '');

function fullaLlegiume({ serie, suposits }) {
  const files = [
    ['Què és', 'L’històric del banc de l’empresa, classificat per categoria i proveïdor amb Sóc de Poble · Gestoria, en l’ordinador del titular.'],
    ['Període', serie.rang ? `${dia(serie.rang.inici)} – ${dia(serie.rang.fi)}` : 'Sense dades'],
    ...serie.comptes.map((c) => [`Compte ${c.n}`, `Entitat ${c.entitat ?? '—'}, acabat en ${c.compte4 ?? '—'}${c.desde && c.fins ? ` (extractes del ${dia(c.desde)} al ${dia(c.fins)})` : ''}`]),
    ['Moviments', String(serie.moviments.length)],
    ['Avís', ETIQUETA_NO_VERIFICAT],
    ['Privacitat', 'Sense el text dels conceptes del banc: només dates, imports, categoria i proveïdor.'],
    ['Xifratge', 'Este fitxer ix SENSE xifrar.'],
    ['Imports', 'En euros. Les entrades són positives i les eixides, negatives. La despesa en IA és neta (eixides menys devolucions).'],
    ['Cobertura', 'Un període «Parcial» té dies sense extractes d’algun compte; un «Sense extractes» no té cap xifra.'],
    /* Els avisos de la lectura (forats entre extractes, traspassos probables...): només dates i els quatre últims dígits del compte. */
    ...(serie.avisos ?? []).map((a) => ['Nota de la lectura', a.missatge]),
    ...CAMPS_SUPOSITS.map(({ clau, nom, unitat }) => [`Suposició: ${nom}`, unitat === 'percentatge' ? `${(suposits?.[clau] ?? 0) / 100} %` : suposits?.[clau] ? 'Sí' : 'No'])
  ];
  return { nom: 'Llegiu-me', columnes: [col('Camp', 'text', 36), col('Valor', 'text', 90)], files };
}

function fullaAnys(serie) {
  return {
    nom: 'Resum anual',
    columnes: [
      col('Any', 'nombre'), col('Cobertura', 'text', 16), col('Entrades', 'import'), col('Eixides', 'import'), col('Net', 'import'),
      col('Despesa IA neta', 'import', 16), col('IA sobre les eixides (%)', 'decimal', 22), col('IA en dòlars', 'decimal', 14),
      col('Traspassos entrats', 'import', 18), col('Traspassos eixits', 'import', 18), col('Moviments', 'nombre')
    ],
    files: serie.anys.map((a) => [
      a.any, COBERTURA[a.cobertura], importDe(a.entrades), importDe(a.eixides), importDe(a.net), importDe(a.ia?.net),
      a.ia && enter(a.eixides) && a.eixides > 0 ? Math.round((a.ia.net / a.eixides) * 1000) / 10 : null,
      a.ia ? a.ia.usd / 100 : null, importDe(a.traspassos?.entrades), importDe(a.traspassos?.eixides), a.moviments
    ])
  };
}

function trimestreDe(simulacio, any, t) {
  return simulacio?.anys?.find((a) => a.any === any)?.trimestres?.find((tr) => tr.t === t) ?? null;
}

function fullaTrimestres(serie, simulacio) {
  return {
    nom: 'Resum trimestral',
    columnes: [
      col('Trimestre', 'text', 12), col('Inici', 'data'), col('Fi', 'data'), col('Cobertura', 'text', 16), col('Entrades', 'import'),
      col('Eixides', 'import'), col('Net', 'import'), col('Despesa IA neta', 'import', 16), col('303 a ingressar (estimació)', 'import', 26),
      col('303 a compensar (estimació)', 'import', 26), col('130 (estimació)', 'import', 16)
    ],
    files: serie.trimestres.map((tr) => {
      const sim = trimestreDe(simulacio, tr.any, tr.t);
      return [
        `${tr.t}T ${tr.any}`, iso(tr.inici), iso(tr.fi), COBERTURA[tr.cobertura], importDe(tr.entrades), importDe(tr.eixides),
        importDe(tr.net), importDe(tr.ia?.net), importDe(sim?.iva?.aIngressar), sim?.iva?.motiu ? null : importDe(sim?.iva?.aCompensar),
        importDe(sim?.irpf?.resultat)
      ];
    })
  };
}

function fullaMoviments(serie) {
  return {
    nom: 'Moviments',
    columnes: [
      col('Data', 'data'), col('Data valor', 'data'), col('Compte', 'nombre'), col('Import', 'import'), col('Categoria', 'text', 28),
      col('Proveïdor', 'text', 26), col('País del proveïdor', 'text', 18), col('Confiança', 'text', 12), col('Per què', 'text', 44),
      col('Moneda d’origen', 'text', 16), col('Import en origen', 'decimal', 16)
    ],
    /* «Per què» en paraules (TEXT_MOTIUS), no el codi intern: la gestora no el coneix. */
    files: serie.moviments.map((m) => [
      iso(m.data), iso(m.dataValor), m.compte, m.centims, nomCategoria(m.categoria), nomProveidor(m.proveidor),
      proveidorDe(m.proveidor)?.pais ?? '', CONFIANCA[m.confianca] ?? '', TEXT_MOTIUS[m.motiu] ?? '', m.divisa?.moneda ?? '',
      m.divisa ? m.divisa.centims / 100 : null
    ])
  };
}

function fullaIa(serie) {
  const files = [];
  for (const mes of serie.mesos) {
    if (!mes.ia) continue;
    const proveidors = Object.entries(mes.ia.perProveidor).sort((x, y) => y[1].net - x[1].net || x[0].localeCompare(y[0]));
    for (const [clau, p] of proveidors) {
      const pais = proveidorDe(clau)?.pais ?? null;
      files.push([mes.clau, nomProveidor(clau), pais ?? '', TRACTAMENT[tractamentIva(pais)], p.net, p.usd / 100, p.moviments]);
    }
  }
  return {
    nom: 'Despeses IA',
    columnes: [
      col('Mes', 'text', 10), col('Proveïdor', 'text', 26), col('País', 'text', 8), col('Tractament de l’IVA', 'text', 36),
      col('Despesa neta', 'import', 16), col('Import en dòlars', 'decimal', 16), col('Moviments', 'nombre')
    ],
    files
  };
}

/* Les files d'estimació d'un any: el 303 i el 130 de cada trimestre, el 390 i la renda. */
function filesEstimacio(any) {
  const files = [];
  const fila = (periode, model, concepte, valor, nota = '') => files.push([any.any, periode, model, concepte, importDe(valor), nota]);
  for (const tr of any.trimestres) {
    const periode = `${tr.t}T`;
    const { iva, irpf } = tr;
    if (iva.motiu) fila(periode, '303', 'Sense dades', null, 'Sense extractes ni moviments del trimestre: no hi ha estimació');
    else {
      fila(periode, '303', 'IVA repercutit', iva.repercutit);
      fila(periode, '303', 'IVA autoliquidat (compres a la UE)', iva.ispIntracomunitari);
      fila(periode, '303', 'IVA autoliquidat (compres de fora de la UE)', iva.ispExtracomunitari);
      fila(periode, '303', 'IVA suportat deduïble', iva.suportat);
      fila(periode, '303', 'Quota del trimestre', iva.quota);
      fila(periode, '303', 'Compensat de trimestres anteriors', iva.compensada);
      fila(periode, '303', 'A ingressar', iva.aIngressar, iva.avisos.map((a) => a.missatge).join(' '));
      fila(periode, '303', 'A compensar', iva.aCompensar);
    }
    if (irpf.motiu) fila(periode, '130', 'Sense dades', null, 'Sense extractes ni moviments del trimestre: no hi ha estimació');
    else {
      fila(periode, '130', 'Ingressos acumulats', irpf.ingressos);
      fila(periode, '130', 'Despeses deduïbles acumulades', irpf.despeses);
      fila(periode, '130', 'Despeses de difícil justificació', irpf.dificil);
      fila(periode, '130', 'Rendiment acumulat', irpf.rendiment);
      fila(periode, '130', 'Quota', irpf.quota);
      fila(periode, '130', 'Retencions', irpf.retencions);
      fila(periode, '130', 'Pagaments anteriors de l’any', irpf.pagamentsAnteriors);
      fila(periode, '130', 'Minoració', irpf.minoracio);
      fila(periode, '130', 'A ingressar', irpf.resultat, irpf.avisos.map((a) => a.missatge).join(' '));
    }
  }
  const m390 = any.model390;
  if (m390.motiu) fila('Any', '390', 'Sense dades', null);
  else {
    const nota = m390.parcial ? 'Parcial: hi ha trimestres sense dades' : '';
    fila('Any', '390', 'IVA repercutit', m390.repercutit, nota);
    fila('Any', '390', 'IVA autoliquidat (inversió del subjecte passiu)', m390.isp, nota);
    fila('Any', '390', 'IVA suportat deduïble', m390.suportat, nota);
    fila('Any', '390', 'Resultat de l’any', m390.resultat, nota);
    fila('Any', '390', 'Suma a ingressar dels 303', m390.aIngressar, nota);
  }
  const r = any.renda;
  if (r.motiu) fila('Any', '100', 'Sense dades', null);
  else {
    const nota = 'Renda orientativa: només l’activitat econòmica, sense altres rendes, reduccions ni deduccions';
    fila('Any', '100', 'Ingressos', r.ingressos, nota);
    fila('Any', '100', 'Despeses deduïbles', r.despeses, nota);
    fila('Any', '100', 'Rendiment net previ', r.rendimentPrevi, nota);
    fila('Any', '100', 'Despeses de difícil justificació', r.dificil, nota);
    fila('Any', '100', 'Rendiment net', r.rendiment, nota);
    fila('Any', '100', 'Base liquidable general', r.base, nota);
    fila('Any', '100', 'Quota íntegra estatal', r.quotaEstatal, nota);
    fila('Any', '100', 'Quota íntegra autonòmica', r.quotaAutonomica, nota);
    fila('Any', '100', 'Quota íntegra', r.quotaIntegra, nota);
    fila('Any', '100', 'Retencions', r.retencions, nota);
    fila('Any', '100', 'Pagaments del 130', r.pagaments130, nota);
    fila('Any', '100', 'Resultat (positiu, a pagar; negatiu, a tornar)', r.resultat, nota);
  }
  return files;
}

function fullaEstimacions(simulacio) {
  return {
    nom: 'Estimacions',
    columnes: [col('Any', 'nombre'), col('Període', 'text', 10), col('Model', 'text', 8), col('Concepte', 'text', 44), col('Import', 'import', 16), col('Nota', 'text', 60)],
    files: [
      [null, '', '', ETIQUETA_NO_VERIFICAT, null, ''],
      ...(simulacio?.anys ?? []).flatMap(filesEstimacio)
    ]
  };
}

/* El text d'un valor de paràmetre per a la fulla. */
function textParametre(valor, unitat) {
  if (unitat === 'percentatge') return `${valor / 100} %`;
  if (unitat === 'import') return `${valor / 100} €`;
  if (unitat === 'boolea') return valor ? 'Sí' : 'No';
  if (unitat === 'escala') return valor.map((t) => `${t.fins === null ? 'resta' : `fins a ${t.fins / 100} €`}: ${t.tipus / 100} %`).join('; ');
  return valor.map((t) => `fins a ${t.fins / 100} €: ${t.import / 100} €`).join('; ');
}

function fullaParametres(simulacio) {
  const files = (simulacio?.anys ?? []).flatMap((a) => CAMPS_PARAMETRES.map(({ clau, nom, unitat, font }) => [
    a.any, nom, textParametre(a.parametres[clau], unitat), font,
    a.parametres.origen === 'propis' ? '[NO VERIFICAT] canviat per la persona' : '[NO VERIFICAT]'
  ]));
  return {
    nom: 'Paràmetres',
    columnes: [col('Any', 'nombre'), col('Paràmetre', 'text', 44), col('Valor', 'text', 60), col('Font', 'text', 60), col('Estat', 'text', 36)],
    files
  };
}

/**
 * El model del llibre (les set fulles de FULLES_LLIBRE), per a creaXlsx.
 * @param {{ serie: object, simulacio: object|null, suposits?: object }} p
 * @returns {{ fulles: object[] }}
 */
export function modelLlibre({ serie, simulacio = null, suposits = null } = {}) {
  if (!serie || !Array.isArray(serie.moviments)) throw new TypeError('Cal la sèrie de l’històric per a fer el llibre.');
  return {
    fulles: [
      fullaLlegiume({ serie, suposits }), fullaAnys(serie), fullaTrimestres(serie, simulacio), fullaMoviments(serie), fullaIa(serie),
      fullaEstimacions(simulacio), fullaParametres(simulacio)
    ]
  };
}

/** El nom del fitxer: el període, sense cap dada del titular. */
export function nomDelLlibre(rang) {
  return rang ? `gestoria_historic_${iso(rang.inici)}_${iso(rang.fi)}.xlsx` : 'gestoria_historic.xlsx';
}

/**
 * El llibre per a la gestora, amb la seua empremta SHA-256.
 * @param {{ serie: object, simulacio: object|null, suposits?: object, subtle?: SubtleCrypto }} p
 * @returns {Promise<{ nom: string, tipus: string, mida: number, empremta: string, dades: Uint8Array }>}
 *   `dades` torna una còpia a cada lectura: qui la modifique no toca els bytes de l'empremta.
 */
export async function creaLlibreGestora({ serie, simulacio = null, suposits = null, subtle } = {}) {
  const bytes = creaXlsx(modelLlibre({ serie, simulacio, suposits }));
  const empremta = await sha256Hex(bytes, subtle);
  const propis = bytes.slice();
  return Object.freeze({
    nom: nomDelLlibre(serie.rang),
    tipus: TIPUS_LLIBRE,
    mida: propis.length,
    empremta,
    get dades() {
      return propis.slice();
    }
  });
}
