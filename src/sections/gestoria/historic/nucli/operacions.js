/**
 * operacions.js — dels moviments classificats del banc a les operacions de
 * la simulació d'impostos (impostos/nucli/simulacio.js).
 *
 * Onada 6, ordre del Mestre (261009): «fer simulacions» amb els comptes del
 * banc. El banc no diu la base ni l'IVA de res: ací es fan SUPOSICIONS
 * explícites, totes a SUPOSITS_PER_DEFECTE i editables per la persona, i
 * cada operació porta origen 'banc' (la simulació avisa que cada despesa
 * necessita la seua factura). [NO VERIFICAT] Estimació per a revisar amb la
 * gestoria.
 *
 * Per categoria (despeses/nucli/categories.js):
 *   · clients · ingrés interior: el cobrat és base + IVA − retenció;
 *   · ia, allotjament, programari, telefonia, energia · despesa: pel país del
 *     proveïdor, interior (l'IVA va dins del càrrec), inversió del subjecte
 *     passiu intracomunitària o extracomunitària (el càrrec és la base i
 *     l'IVA s'autoliquida). Sense proveïdor conegut: telefonia i energia,
 *     interior; la resta, sense IVA deduïble (prudent);
 *   · comissions · exempta, deduïble a l'IRPF; reta · sense IVA, deduïble;
 *   · nomines, altres, revisa · sense IVA i, per defecte, NO deduïbles (es
 *     poden marcar com a deduïbles); una entrada d'estes no és ingrés;
 *   · impostos i traspàs · fora: no són ni ingrés ni despesa de l'activitat.
 * Una entrada en una categoria de despesa és una devolució: resta.
 * JS pur: sense DOM, React ni xarxa. Imports en cèntims.
 */
import { proveidorDe, tractamentIva } from '../../despeses/nucli/categories.js';
import { parametresDe } from '../../impostos/nucli/simulacio.js';

/** Les suposicions per defecte. Percentatges en punts bàsics (2100 = 21 %). */
export const SUPOSITS_PER_DEFECTE = Object.freeze({
  /* L'IVA i la retenció de les factures emeses als clients. */
  ivaVendes: 2100,
  retencioVendes: 0,
  /* L'IVA de les despeses interiors (llum, telèfon, hosting espanyol). */
  ivaDespesesInteriors: 2100,
  /* El proveïdor de fora cobra el seu IVA (compra sense NIF-IVA): aleshores no hi ha inversió del subjecte passiu. */
  estrangerAmbIva: false,
  nominesDeduibles: false,
  altresDeduibles: false
});

/** Les descripcions de les suposicions, per a la pantalla i el llibre. */
export const CAMPS_SUPOSITS = Object.freeze([
  { clau: 'ivaVendes', nom: 'IVA de les factures als clients', unitat: 'percentatge' },
  { clau: 'retencioVendes', nom: 'Retenció d’IRPF de les factures als clients', unitat: 'percentatge' },
  { clau: 'ivaDespesesInteriors', nom: 'IVA de les despeses a empreses d’Espanya', unitat: 'percentatge' },
  { clau: 'estrangerAmbIva', nom: 'Els proveïdors de fora cobren el seu IVA (sense ROI)', unitat: 'boolea' },
  { clau: 'nominesDeduibles', nom: 'Les transferències i nòmines són despesa deduïble', unitat: 'boolea' },
  { clau: 'altresDeduibles', nom: 'Les eixides sense categoria són despesa deduïble', unitat: 'boolea' }
].map(Object.freeze));

const PUNTS = 10000;
const enter = (x) => Number.isSafeInteger(x);
const esPunts = (x) => enter(x) && x >= 0 && x <= PUNTS;
const CATEGORIES_AMB_PROVEIDOR = Object.freeze(['ia', 'allotjament', 'programari', 'telefonia', 'energia']);
const INTERIORS_PER_DEFECTE = Object.freeze(['telefonia', 'energia']);

/**
 * Les suposicions vàlides: les per defecte i, damunt, les de la persona que
 * siguen del tipus correcte.
 * @param {object} [propis]
 * @returns {object}
 */
export function supositsDe(propis = null) {
  const s = { ...SUPOSITS_PER_DEFECTE };
  if (propis && typeof propis === 'object') {
    for (const { clau, unitat } of CAMPS_SUPOSITS) {
      const v = propis[clau];
      if (unitat === 'percentatge' ? esPunts(v) : typeof v === 'boolean') s[clau] = v;
    }
  }
  return Object.freeze(s);
}

/* Una despesa amb l'IVA dins del càrrec: la base i la quota. */
function ambIvaDins(total, tipus) {
  const base = Math.round((total * PUNTS) / (PUNTS + tipus));
  return { base, iva: total - base };
}

/* Una despesa de les categories amb proveïdor: el tractament segons el país. */
function despesaAmbProveidor(m, total, s, ivaGeneral) {
  const fitxa = proveidorDe(m.proveidor);
  let tractament = fitxa ? tractamentIva(fitxa.pais) : 'desconegut';
  if (tractament === 'desconegut' && INTERIORS_PER_DEFECTE.includes(m.categoria)) tractament = 'interior';
  if (tractament === 'interior') {
    return { tractament, ...ambIvaDins(total, s.ivaDespesesInteriors), deduibleIva: true, deduibleIrpf: true };
  }
  if (tractament === 'isp-intracomunitari' || tractament === 'isp-extracomunitari') {
    if (s.estrangerAmbIva) return { tractament: 'sense-iva', base: total, iva: 0, deduibleIva: false, deduibleIrpf: true };
    return { tractament, base: total, iva: Math.round((total * ivaGeneral) / PUNTS), deduibleIva: true, deduibleIrpf: true };
  }
  return null;
}

/* Sense tractament conegut: la despesa compta per a l'IRPF, però sense IVA deduïble (prudent). */
const SENSE_TRACTAMENT = Object.freeze({ tractament: 'sense-iva', iva: 0, deduibleIva: false, deduibleIrpf: true });

/**
 * Les operacions de la simulació a partir dels moviments de la sèrie.
 * @param {object} p
 * @param {object[]} p.moviments els de serieHistorica (data, centims, categoria, proveidor)
 * @param {object} [p.suposits] els de supositsDe
 * @param {Record<number, object>} [p.parametresPropis] per any, per a l'IVA general de la inversió del subjecte passiu
 * @returns {{ operacions: object[], exclosos: Record<string, number>, senseTractament: number, noDeduibles: number }}
 */
export function operacionsDelBanc({ moviments = [], suposits = SUPOSITS_PER_DEFECTE, parametresPropis = {} } = {}) {
  const s = supositsDe(suposits);
  const ivaPerAny = new Map();
  const ivaGeneral = (any) => {
    if (!ivaPerAny.has(any)) ivaPerAny.set(any, parametresDe(any, parametresPropis?.[any] ?? null).ivaGeneral);
    return ivaPerAny.get(any);
  };
  const operacions = [];
  const exclosos = { impostos: 0, traspas: 0, entradesSenseIngres: 0 };
  let senseTractament = 0;
  let noDeduibles = 0;
  for (const m of Array.isArray(moviments) ? moviments : []) {
    if (!enter(m?.centims) || m.centims === 0 || !m.data) continue;
    const comu = { data: m.data, categoria: m.categoria, proveidor: m.proveidor ?? null, origen: 'banc', retencio: 0 };
    if (m.categoria === 'impostos' || m.categoria === 'traspas') {
      exclosos[m.categoria] += 1;
      continue;
    }
    if (m.categoria === 'clients') {
      /* El cobrat = base × (1 + IVA − retenció). Una eixida de clients és una devolució: en negatiu. */
      const base = Math.round((m.centims * PUNTS) / (PUNTS + s.ivaVendes - s.retencioVendes));
      operacions.push({
        ...comu, tipus: 'ingres', tractament: 'interior', base, iva: Math.round((base * s.ivaVendes) / PUNTS),
        retencio: Math.round((base * s.retencioVendes) / PUNTS), deduibleIva: false, deduibleIrpf: true
      });
      continue;
    }
    /* Una entrada en una categoria de despesa és una devolució; en «altres», «revisa» o «nomines», no és ingrés. */
    if (m.centims > 0 && ['nomines', 'altres', 'revisa'].includes(m.categoria)) {
      exclosos.entradesSenseIngres += 1;
      continue;
    }
    const total = -m.centims;
    let fiscal;
    if (CATEGORIES_AMB_PROVEIDOR.includes(m.categoria)) {
      fiscal = despesaAmbProveidor(m, total, s, ivaGeneral(m.data.a));
      if (!fiscal) {
        senseTractament += 1;
        fiscal = { ...SENSE_TRACTAMENT, base: total };
      }
    } else if (m.categoria === 'comissions') {
      fiscal = { tractament: 'exempt', base: total, iva: 0, deduibleIva: false, deduibleIrpf: true };
    } else if (m.categoria === 'reta') {
      fiscal = { tractament: 'sense-iva', base: total, iva: 0, deduibleIva: false, deduibleIrpf: true };
    } else {
      const deduible = m.categoria === 'nomines' ? s.nominesDeduibles : m.categoria === 'altres' ? s.altresDeduibles : false;
      if (!deduible) noDeduibles += 1;
      fiscal = { tractament: 'sense-iva', base: total, iva: 0, deduibleIva: false, deduibleIrpf: deduible };
    }
    operacions.push({ ...comu, tipus: 'despesa', ...fiscal });
  }
  return { operacions, exclosos, senseTractament, noDeduibles };
}
