/**
 * cabinaAvio.js — la Cabina d'Avió del Tauler de la Gestoria, sense React.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front E; prompt de Claude,
 * tasca 5): una tercera vista del Tauler, «Targetes | Cabina d’Avió | Vista
 * comprimida», d'alta densitat d'instruments per a decidir: els dies de
 * cobertura de la caixa i la ràtio de liquiditat que es pot calcular,
 * l'estimació viva del 303 i del 130, el flux de caixa de cada mes i els
 * venciments. Ací viu el model; la vista és CabinaAvio.jsx, que munta la
 * closca (ShellGestoria) i mai Tauler.jsx (seria un cicle, i entraria al graf
 * de l'Històric).
 *
 * cabinaDelTauler(...) · tot el que pinta la Cabina, fet de les mateixes peces
 *   que les targetes (dadesDelTauler): cap xifra nova que contradiga una
 *   targeta. La despesa i els dies de cobertura tenen la base de la targeta
 *   Cobertura (la despesa bruta mitjana de resumTauler); el que surt a pagar a
 *   Hisenda és el total de resumHisenda (la part a pagar de cada model, GES-A5),
 *   i la caixa davant de Hisenda, els estats de hisendaSobreCaixa.
 *   · instruments · cada un obri la pàgina de la seua targeta (`targeta`).
 *   · mesos · fluxMensual de resumTauler.js, des del primer mes amb extractes.
 *   · venciments · les finestres de presentació del 303 i del 130 de
 *     impostos.js, [NO VERIFICAT] com allí (sense el pas al dia hàbil).
 * Privacitat (ordre del Mestre, 261004): ací només es preparen les xifres; la
 * vista no en pinta cap fins que la persona obri l'ull de la boina. Un perquè
 * que ix del signe d'una xifra (res a pagar, caixa en descobert) porta
 * `privat` i també s'amaga. Les dates (la de referència i els venciments) no
 * són cap xifra i es veuen sempre. Cap títol porta dades.
 * Límits honestos (auditoria de Codex 261013_1510, «Cabina»): la caixa
 * desconeguda no és zero, una divisió per zero no és cobertura infinita i el
 * flux del banc no és benefici. L'única ràtio de liquiditat que es pot
 * calcular és la caixa davant de Hisenda: sense balanç no hi ha ràtio corrent
 * ni prova àcida, i la conciliació només porta recomptes.
 * La data de referència és l'últim dia dels extractes, mai la d'avui; avui
 * només mana en els venciments i en la frescor de les dades.
 * JS pur: sense DOM, React ni xarxa. No importa targetesTauler.js, que
 * l'importa a ell. Res del que rep es modifica, i el que torna és congelat.
 */
import { LLEGENDA_ESTIMACIO, terminiPresentacio } from '../../impostos/nucli/impostos.js';
import { comparaDates, diesEntre, esDataValida, formatData } from '../../nucli/dates.js';
import { DIES_PER_MES, MONEDA_TAULER, fluxMensual } from './resumTauler.js';

/** Els mesos de calendari del flux de la Cabina, com a molt. */
export const MESOS_CABINA = 12;
/** Passats estos dies des de l'últim dia dels extractes, la Cabina avisa que les dades són antigues. */
export const DIES_FRESCOR = 31;
/** Els instruments de la Cabina, en l'ordre en què es pinten. */
export const INSTRUMENTS_CABINA = Object.freeze([
  'caixa', 'despesa-mensual', 'dies-cobertura', 'iva-303', 'irpf-130', 'hisenda-a-pagar', 'caixa-sobre-hisenda', 'dies-despres-hisenda'
]);
/** La nota de tot venciment: els terminis de impostos.js són [NO VERIFICAT]. */
export const NOTA_TERMINIS = 'Terminis orientatius: a verificar amb la gestoria.';

const enter = (x) => Number.isSafeInteger(x);
const dia = (d) => formatData(d, 'dd/mm/aaaa');
const copia = (d) => (esDataValida(d) ? { a: d.a, m: d.m, d: d.d } : null);
const IMPORT = (valor) => (enter(valor) ? { tipus: 'import', valor, moneda: MONEDA_TAULER } : null);
const DIES = (valor) => (enter(valor) ? { tipus: 'dies', valor } : null);
/* Congela el que ha fet esta funció (mai el que rep: les dates d'entrada es copien abans). */
function congela(x) {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) {
    Object.freeze(x);
    for (const valor of Object.values(x)) congela(valor);
  }
  return x;
}

const SENSE_DADES = 'Sense dades: encara no has triat cap extracte del banc.';
/* Els dos perquè que diuen el signe d'una xifra: privats, amb l'ull tancat no es pinten. */
const RES_A_PAGAR = 'Ni el 303 ni el 130 d’este trimestre surten a pagar: no hi ha res a comparar amb la caixa.';
/* Revisió adversarial 13-10-2026, troballa FIN-3: amb un model sense estimació (`desconegut` de
   hisendaSobreCaixa), el «res» només diu el que se sap de l'altre, mai que cap dels dos surt a pagar. */
const resAPagar = (desconegut) => {
  const conegut = desconegut === '303' ? '130' : desconegut === '130' ? '303' : null;
  return conegut
    ? `El ${conegut} d’este trimestre no surt a pagar, i del ${desconegut} encara no hi ha estimació: amb el que se sap, no hi ha res a comparar amb la caixa.`
    : RES_A_PAGAR;
};
const CAIXA_EN_DESCOBERT = 'La caixa real és zero o en descobert: no en queda cap part per a Hisenda.';
const NOTA_RATIOS = 'La caixa davant de Hisenda és l’única ràtio de liquiditat que es pot calcular ací: sense balanç, ni la ràtio corrent ni la prova àcida.';
const NOTA_FLUX = `Les entrades i les eixides dels comptes en euros de cada mes de calendari, com a molt dels ${MESOS_CABINA} últims fins a l’últim dia dels extractes i des del primer mes que tenen. Els traspassos entre els teus comptes compten com a entrada en un i com a eixida en l’altre.`;

/**
 * Els dies que la caixa paga la despesa mensual mitjana sense cap entrada: la
 * mateixa base que la targeta Cobertura (els seus mesos × DIES_PER_MES), en
 * dies sencers cap avall. Una caixa en descobert cobrix 0 dies.
 * @param {{ saldo?: number|null, despesaMensual?: number|null }} [p] en cèntims
 * @returns {number|null} null si falta el saldo o la despesa, o si la despesa no és positiva (mai «infinit»)
 */
export function diesDeCobertura({ saldo = null, despesaMensual = null } = {}) {
  if (!enter(saldo) || !enter(despesaMensual) || despesaMensual <= 0) return null;
  return Math.floor((Math.max(0, saldo) * DIES_PER_MES) / despesaMensual);
}

/* El text d'un venciment: una data no és cap xifra financera, es pinta sempre. */
function textDelVenciment(fase, termini, diesRestants) {
  if (fase === 'propera') return `La presentació va del ${dia(termini.inici)} al ${dia(termini.fi)}.`;
  if (fase === 'vencuda') return `La presentació va acabar el ${dia(termini.fi)}.`;
  if (diesRestants === 0) return `La presentació acaba hui, el ${dia(termini.fi)}.`;
  return `La presentació acaba el ${dia(termini.fi)}: ${diesRestants === 1 ? 'queda un dia' : `queden ${diesRestants} dies`}.`;
}

/**
 * Els venciments del 303 i del 130 de cada trimestre de `finestres`, sense
 * repetir-ne cap i ordenats pel final de la finestra: 'oberta' si avui és
 * dins, 'propera' si encara no ha començat, 'vencuda' si ja ha acabat. Les
 * finestres són les de terminiPresentacio (impostos.js), [NO VERIFICAT].
 * @param {{ finestres?: Array<{ any: number, t: number }|null>, avui?: {a:number,m:number,d:number}|null }} [p]
 * @returns {Array<{ clau: string, any: number, t: number, inici: object, fi: object,
 *   fase: 'oberta'|'propera'|'vencuda', diesRestants: number, titol: string, text: string }>} [] sense avui vàlid
 */
export function venciments({ finestres = [], avui = null } = {}) {
  if (!esDataValida(avui)) return congela([]);
  const perClau = new Map();
  for (const finestra of Array.isArray(finestres) ? finestres : []) {
    const termini = finestra ? terminiPresentacio(finestra.any, finestra.t) : null;
    if (!termini) continue;
    const clau = `${finestra.any}-T${finestra.t}`;
    if (perClau.has(clau)) continue;
    const fase = comparaDates(avui, termini.inici) < 0 ? 'propera' : comparaDates(avui, termini.fi) <= 0 ? 'oberta' : 'vencuda';
    const diesRestants = diesEntre(avui, termini.fi);
    perClau.set(clau, {
      clau, any: finestra.any, t: finestra.t, inici: termini.inici, fi: termini.fi, fase, diesRestants,
      titol: `303 i 130 · ${finestra.t}T ${finestra.any}`,
      text: textDelVenciment(fase, termini, diesRestants)
    });
  }
  return congela([...perClau.values()].sort((x, y) => comparaDates(x.fi, y.fi)));
}

/* L'últim dia que cobrixen els extractes (de tots els comptes, com resumTauler), sense caure mai en avui. */
const ultimDiaDels = (comptes) => comptes.map((c) => c?.fins).filter(esDataValida)
  .reduce((x, y) => (x && comparaDates(x, y) >= 0 ? x : y), null);

/* La caixa davant de Hisenda, dels estats de hisendaSobreCaixa (els mateixos que la capçalera de context). */
function liquiditat({ liquidacio, caixa, hisenda }) {
  if (liquidacio?.estat === 'xifra' && enter(caixa?.saldo) && caixa.saldo > 0 && enter(hisenda?.total) && hisenda.total > 0) {
    return {
      xifra: { tipus: 'ratio', valor: Math.round((caixa.saldo * 100) / hisenda.total) / 100 },
      senseXifra: '', privat: false, avis: liquidacio.completa ? null : 'Estimació incompleta'
    };
  }
  /* Revisió adversarial 13-10-2026, troballa FIN-3: el «res» i el descobert d'una estimació incompleta també ho
     diuen, com la ràtio; la vista només pinta l'avís amb l'ull obert. */
  const avis = liquidacio?.completa ? null : 'Estimació incompleta';
  if (liquidacio?.estat === 'res') return { xifra: null, senseXifra: resAPagar(liquidacio.desconegut), privat: true, avis };
  if (liquidacio?.estat === 'descobert') return { xifra: null, senseXifra: CAIXA_EN_DESCOBERT, privat: true, avis };
  return { xifra: null, senseXifra: liquidacio?.motiu ?? SENSE_DADES, privat: false, avis: null };
}

/**
 * Tot el que pinta la Cabina d'Avió.
 * @param {object} [p]
 * @param {object[]} [p.comptes] els de comptesDe (amb els moviments)
 * @param {object} [p.resum] el de resumTauler (caixa i cobertura)
 * @param {object} [p.iva] estimaIva303
 * @param {object} [p.irpf] estimaIrpf130
 * @param {object} [p.hisenda] resumHisenda: `total` és el que surt a pagar de cada model, sumat
 * @param {object} [p.liquidacio] hisendaSobreCaixa
 * @param {object[]} [p.targetes] les de targetesDelTauler: d'elles ix el perquè d'un instrument sense xifra
 * @param {{a:number,m:number,d:number}|null} [p.avui] només per als venciments i la frescor
 * @param {Array<{ any: number, t: number }|null>} [p.finestres] els trimestres dels venciments
 * @param {number} [p.mesos]
 * @returns {{ fins: object|null, diesDesDeFins: number|null, antiga: boolean, referencia: string, avisFrescor: string|null,
 *   instruments: Array<{ id: string, targeta: string, titol: string, explica: string, tipus: 'import'|'dies'|'ratio',
 *     xifra: object|null, senseXifra: string, privat: boolean, avis: string|null }>,
 *   notes: string[], mesos: object[], maxim: number|null, notaFlux: string, venciments: object[], notaTerminis: string }}
 *   `privat`: el perquè sense xifra diu el signe d'una xifra i s'amaga com ella; `avis`: «Incompleta» o
 *   «Estimació incompleta» quan la xifra no ho suma tot (i el perquè privat de la liquiditat, també);
 *   `maxim`: el sostre comú dels dos gràfics
 */
export function cabinaDelTauler({
  comptes = [], resum = null, iva = null, irpf = null, hisenda = null, liquidacio = null, targetes = [],
  avui = null, finestres = [], mesos = MESOS_CABINA
} = {}) {
  const llista = Array.isArray(comptes) ? comptes : [];
  const sense = (id) => (Array.isArray(targetes) ? targetes : []).find((t) => t?.id === id)?.senseXifra ?? SENSE_DADES;
  const caixa = resum?.caixa ?? null;
  const saldo = enter(caixa?.saldo) ? caixa.saldo : null;
  const despesa = resum?.cobertura?.despesaMensual ?? null;
  const caixaIncompleta = saldo !== null && !caixa.completa;
  const total = enter(hisenda?.total) ? hisenda.total : null;
  const dies = diesDeCobertura({ saldo, despesaMensual: despesa });
  const fiscal = (estimacio, xifra) => (xifra && !estimacio?.completa ? 'Estimació incompleta' : null);
  /* Una xifra feta amb la caixa és incompleta si la caixa ho és (un compte en una altra moneda no hi suma). */
  const ambCaixa = (xifra) => (xifra && caixaIncompleta ? 'Incompleta' : null);

  const fins = copia(ultimDiaDels(llista));
  const diesDesDeFins = fins ? diesEntre(fins, avui) : null;
  const antiga = Number.isInteger(diesDesDeFins) && diesDesDeFins > DIES_FRESCOR;

  /* Després de pagar Hisenda: sense la caixa o la despesa, el perquè de la Cobertura; sense l'estimació, el de Hisenda. */
  const despresDeHisenda = dies === null
    ? { xifra: null, senseXifra: sense('cobertura'), avis: null }
    : total === null
      ? { xifra: null, senseXifra: sense('hisenda'), avis: null }
      : {
        xifra: DIES(diesDeCobertura({ saldo: saldo - total, despesaMensual: despesa })),
        senseXifra: '',
        avis: hisenda.completa && !caixaIncompleta ? null : 'Estimació incompleta'
      };

  const instruments = [
    {
      id: 'caixa', targeta: 'caixa', titol: 'Caixa real', explica: 'La suma dels saldos en euros l’últim dia dels extractes.',
      tipus: 'import', xifra: IMPORT(saldo), senseXifra: sense('caixa'), privat: false, avis: ambCaixa(IMPORT(saldo))
    },
    {
      id: 'despesa-mensual', targeta: 'cobertura', titol: 'Despesa mensual mitjana',
      explica: 'Les eixides dels comptes en euros, de mitjana per mes (com a molt, sis mesos).',
      tipus: 'import', xifra: IMPORT(despesa), senseXifra: sense('cobertura'), privat: false, avis: null
    },
    {
      id: 'dies-cobertura', targeta: 'cobertura', titol: 'Dies de cobertura',
      explica: 'Els dies que la caixa real paga la despesa mitjana, sense cap entrada.',
      tipus: 'dies', xifra: DIES(dies), senseXifra: sense('cobertura'), privat: false, avis: ambCaixa(DIES(dies))
    },
    {
      id: 'iva-303', targeta: 'iva-303', titol: 'IVA · model 303', explica: 'L’IVA repercutit menys el deduïble del trimestre.',
      tipus: 'import', xifra: IMPORT(iva?.resultat), senseXifra: sense('iva-303'), privat: false, avis: fiscal(iva, IMPORT(iva?.resultat))
    },
    {
      id: 'irpf-130', targeta: 'irpf-130', titol: 'IRPF · model 130', explica: 'El pagament fraccionat del trimestre.',
      tipus: 'import', xifra: IMPORT(irpf?.resultat), senseXifra: sense('irpf-130'), privat: false, avis: fiscal(irpf, IMPORT(irpf?.resultat))
    },
    {
      id: 'hisenda-a-pagar', targeta: 'hisenda', titol: 'Hisenda a pagar',
      explica: 'El que surt a pagar del 303 i del 130, cada model pel seu compte: un 303 a compensar no hi resta.',
      tipus: 'import', xifra: IMPORT(total), senseXifra: sense('hisenda'), privat: false, avis: fiscal(hisenda, IMPORT(total))
    },
    {
      id: 'caixa-sobre-hisenda', targeta: 'hisenda', titol: 'Liquiditat davant de Hisenda',
      explica: 'Quantes vegades la caixa real cobrix el que surt a pagar a Hisenda.',
      tipus: 'ratio', ...liquiditat({ liquidacio, caixa, hisenda })
    },
    {
      id: 'dies-despres-hisenda', targeta: 'cobertura', titol: 'Dies de cobertura després de Hisenda',
      explica: 'Els dies que la caixa real paga la despesa mitjana un colp pagat el que surt a Hisenda.',
      tipus: 'dies', privat: false, ...despresDeHisenda
    }
  ];

  /* El flux, des del primer mes amb extractes: abans, cap mes té de què parlar. */
  const flux = fluxMensual({ comptes: llista, fins, mesos });
  const primer = flux.findIndex((m) => m.cobertura !== 'cap');
  const mesosAmbExtractes = primer < 0 ? [] : flux.slice(primer).map((m) => ({ ...m }));
  const sostres = mesosAmbExtractes.flatMap((m) => [m.entrades, m.eixides]).filter(enter);
  const maxim = sostres.length && Math.max(...sostres) > 0 ? Math.max(...sostres) : null;

  return congela({
    fins,
    diesDesDeFins,
    antiga,
    referencia: fins
      ? `Les xifres del banc són del ${dia(fins)}, l’últim dia dels extractes.`
      : 'Encara no hi ha cap extracte amb data: les xifres del banc no tenen dia de referència.',
    avisFrescor: antiga
      ? `L’últim dia dels extractes és de fa ${diesDesDeFins} dies: la caixa d’ara pot ser una altra. Tria extractes més recents per a decidir.`
      : null,
    instruments,
    notes: [LLEGENDA_ESTIMACIO, NOTA_RATIOS],
    mesos: mesosAmbExtractes,
    maxim,
    notaFlux: NOTA_FLUX,
    venciments: venciments({ finestres, avui }),
    notaTerminis: NOTA_TERMINIS
  });
}
