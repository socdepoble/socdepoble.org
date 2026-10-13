/**
 * serieHistorica.js — l'històric del banc per mes, trimestre i any, amb les
 * despeses per categoria i per proveïdor (la despesa en IA a part) i els
 * indicadors d'un director financer: caixa, despesa mensual, consum net,
 * autonomia (runway) i el pes de l'IA.
 *
 * Onada 6, ordre del Mestre (261009): «importar tot l'històric (des de l'any
 * passat fins al trimestre passat)» i «calcular les despeses massives en IA».
 *
 * L'entrada és la lectura REDUÏDA i ja classificada del tractor
 * 'gestoria.historic' (historic/nucli/tractorHistoric.js): cap text de
 * concepte. Els comptes s'unixen ací, extracte a extracte (comptesHistoric):
 * un compte per compte de veres, i un dia que ja cobrix un extracte no torna
 * a comptar en cap altre, siga quin siga l'ordre i la llargària dels fitxers
 * (un extracte anual i un de trimestral del mateix any no perden ni dupliquen
 * res). Si hi ha Norma 43, el CSV del banc només diu quines files no hi tenen
 * parella. L'eixida només copia els camps de la llista blanca (moviment net):
 * ni text, ni referències, ni SEPA.
 *
 * Derogat EN PART per l'ordre del Mestre, 13-10-2026 (pla 261013_1405, front
 * I · motors; auditoria de Codex 261013_1510, GES-A2), sobre la de l'Onada 6
 * (261009). Abans el compte era «entitat i quatre últims dígits», i dos
 * comptes de la mateixa entitat acabats igual eren un de sol: els dies del
 * segon es descartaven com a «ja coberts» pel primer i la caixa en perdia
 * el saldo. Ara la clau és `idCompte`, l'id opac que c43.js deriva del número
 * sencer (la lectura reduïda del tractor el porta); l'entitat i el sufix només
 * fan l'id de presentació («c43-9999-4321» i, si dos comptes diferents el
 * compartixen, «c43-9999-4321-2»), la mateixa regla que resumTauler.js
 * (clauDelCompte, idsDelsComptes). Una lectura sense `idCompte` (feta a mà)
 * torna a la clau d'abans. Els id dels moviments, que fa el tractor
 * (historic/nucli/tractorHistoric.js), no canvien: les reclassificacions
 * desades al cofre en depenen. Revisió adversarial 13-10-2026, troballes
 * FIN-4 i TI-1: amb dos comptes separats, el mateix moviment (dia i import)
 * en tots dos tenia el mateix id i una reclassificació s'aplicava als dos;
 * ara el tractor el desambigua per al segon compte (desambiguaIds) i el
 * primer conserva el de sempre. Ací els id es fan servir tal com arriben.
 *
 * Regles de les xifres (ordre del Mestre, 261004, «zeros falsos»):
 *   · només sumen els comptes en euros; la resta, amb un avís;
 *   · la cobertura és la dels extractes de CADA compte, dia a dia: un període
 *     és «complet» si tots els comptes en euros el cobrixen sencer; «parcial»
 *     si en falta algun dia d'algun compte (un forat entre dos extractes, o un
 *     compte amb menys extractes que els altres), amb un avís; i un període
 *     que cap extracte cobrix no té xifra (null), mai 0,00 €;
 *   · les entrades i les eixides són les operatives: els traspassos entre
 *     comptes propis van a part (ni ingrés ni despesa); una eixida d'un compte
 *     i una entrada d'un altre amb el mateix import i pocs dies de diferència
 *     es marquen com a traspàs probable (per revisar), si la persona no els
 *     ha classificat;
 *   · la despesa en IA és neta: les eixides menys les devolucions;
 *   · l'import en dòlars ve del registre 24 de la Norma 43 (equivalència de
 *     divisa), quan el banc el porta.
 * Imports en cèntims enters. JS pur: sense DOM, React ni xarxa. Res del que
 * rep es modifica.
 */
import { comparaDates, diesDelMes, dinsDeRang, esDataValida, formatData, rangTrimestre } from '../../nucli/dates.js';
import { fusionaMoviments } from '../../nucli/movimentsBanc.js';
import { categoriaDe, proveidorDe, reclassifica, tractamentIva } from './categories.js';

/** La moneda de les xifres de la sèrie. */
export const MONEDA_SERIE = 'EUR';
/** Els mesos de la mitjana dels indicadors. */
export const MESOS_INDICADORS = 6;
/** Els dies de diferència, com a molt, entre les dues cames d'un traspàs probable. */
export const DIES_TRASPAS = 3;
/** Els codis dels avisos de la sèrie i dels motius dels indicadors. */
export const CODIS_SERIE = Object.freeze([
  'EXTRACTES_SOLAPATS', 'CSV_SENSE_PARELLA', 'ALTRA_MONEDA', 'FORA_DEL_RANG', 'SENSE_IMPORT', 'SENSE_DADES', 'POCS_MESOS',
  'SENSE_CONSUM', 'SENSE_SALDO', 'FORAT_ENTRE_EXTRACTES', 'COMPTE_INCOMPLET', 'LECTURA_AMB_AVISOS', 'TRASPASSOS_PROBABLES'
]);

const DIA_MS = 86400000;
const enter = (x) => Number.isSafeInteger(x);
const dosXifres = (n) => String(n).padStart(2, '0');
const copiaData = (d) => (esDataValida(d) ? { a: d.a, m: d.m, d: d.d } : null);
const diaNum = (d) => Math.round(Date.UTC(d.a, d.m - 1, d.d) / DIA_MS);
const dataDeDia = (n) => {
  const data = new Date(n * DIA_MS);
  return { a: data.getUTCFullYear(), m: data.getUTCMonth() + 1, d: data.getUTCDate() };
};
const dia = (d) => formatData(d, 'dd/mm/aaaa');
const avis = (codi, missatge) => Object.freeze({ codi, missatge });
const plural = (n, una, moltes) => (n === 1 ? una : `${n} ${moltes}`);
const primeraData = (dates) => dates.filter(esDataValida).sort(comparaDates)[0] ?? null;
const darreraData = (dates) => dates.filter(esDataValida).sort(comparaDates).pop() ?? null;
const severes = (lectura) => (lectura?.avisos ?? []).filter((a) => a?.severitat === 'alta' || a?.severitat === 'mitjana').length;

/* Afig l'interval de dies [x, y] a uns intervals ordenats i units: els que se solapen o es toquen, en un. */
function afigInterval(intervals, [x, y]) {
  const units = [];
  for (const [a, b] of [...intervals, [x, y]].sort((p, q) => p[0] - q[0])) {
    const darrer = units[units.length - 1];
    if (darrer && a <= darrer[1] + 1) darrer[1] = Math.max(darrer[1], b);
    else units.push([a, b]);
  }
  return units;
}
const dinsIntervals = (intervals, n) => intervals.some(([a, b]) => n >= a && n <= b);
/* Uns intervals retallats a [a, b]. */
const retalla = (intervals, a, b) => intervals.map(([x, y]) => [Math.max(x, a), Math.min(y, b)]).filter(([x, y]) => y >= x);

/* El saldo final d'un compte d'un extracte de la Norma 43: el del peu o, sense, l'inicial més els moviments. */
function saldoC43(compte) {
  if (enter(compte?.peu?.saldoFinal)) return compte.peu.saldoFinal;
  const inicial = compte?.capcalera?.saldoInicial;
  const moviments = compte?.moviments ?? [];
  return enter(inicial) && moviments.every((m) => enter(m?.centims)) ? moviments.reduce((t, m) => t + m.centims, inicial) : null;
}

/* El saldo final d'un CSV: el de l'última fila de l'últim dia (la de dalt, si el banc posa la més nova primer). */
function saldoCsv(files) {
  if (!files.length) return null;
  const descendent = comparaDates(files[0].dataOperacio, files[files.length - 1].dataOperacio) > 0;
  const fins = darreraData(files.map((f) => f.dataOperacio));
  const delDarrerDia = files.filter((f) => comparaDates(f.dataOperacio, fins) === 0);
  const ultima = descendent ? delDarrerDia[0] : delDarrerDia[delDarrerDia.length - 1];
  return enter(ultima?.saldo) ? ultima.saldo : null;
}

/* Com es diu un compte en un avís. */
const nomCompte = (c) => (c.compte4 ? `del compte acabat en ${c.compte4}` : 'del CSV del banc');

/* La clau d'un compte de la Norma 43 (GES-A2, vegeu la capçalera): l'id opac de c43.js; una lectura sense (feta a
   mà) torna a l'entitat i el sufix d'abans. Els dos espais de noms no es poden confondre. */
const comparaText = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
const clauDelCompte = (cap) => (typeof cap?.idCompte === 'string' && cap.idCompte !== ''
  ? `opac:${cap.idCompte}`
  : `sufix:${cap?.entitat ?? ''}-${cap?.compte4 ?? ''}`);

/* L'id de presentació de cada compte: «c43-entitat-sufix», el de sempre. Dos comptes diferents amb la mateixa
   entitat i el mateix sufix (GES-A2) es distingixen amb «-2», «-3»…, en l'ordre de les seues claus (l'ordre dels
   fitxers no canvia qui és qui). Ordre del Mestre, 13-10-2026 (pla 261013_1405, front I). */
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

/* Un tram ordenable: els que tenen dates, primer; de la data inicial més antiga a la més nova i, a la mateixa, el més llarg. */
function ordreTrams(x, y) {
  const ambX = esDataValida(x.desde) && esDataValida(x.fins);
  const ambY = esDataValida(y.desde) && esDataValida(y.fins);
  if (ambX !== ambY) return ambX ? -1 : 1;
  if (!ambX) return 0;
  return comparaDates(x.desde, y.desde) || comparaDates(y.fins, x.fins);
}

/*
 * Els trams (un per extracte) d'un compte, units: cada moviment d'un dia que
 * ja cobrix un extracte anterior es descarta; els dies coberts, en intervals.
 */
function uneixCompte(id, trams) {
  const ordenats = [...trams].sort(ordreTrams);
  let coberts = [];
  let solapats = false;
  const moviments = [];
  for (const tram of ordenats) {
    const interval = esDataValida(tram.desde) && esDataValida(tram.fins) && comparaDates(tram.desde, tram.fins) <= 0
      ? [diaNum(tram.desde), diaNum(tram.fins)] : null;
    if (interval && coberts.some(([a, b]) => interval[0] <= b && interval[1] >= a)) solapats = true;
    for (const m of tram.moviments) {
      if (esDataValida(m?.dataOperacio) && dinsIntervals(coberts, diaNum(m.dataOperacio))) continue;
      moviments.push(m);
    }
    if (interval) coberts = afigInterval(coberts, interval);
  }
  const fins = darreraData(ordenats.map((t) => t.fins));
  const darrers = ordenats.filter((t) => fins && esDataValida(t.fins) && comparaDates(t.fins, fins) === 0);
  const darrer = darrers.find((t) => enter(t.saldo)) ?? darrers[0] ?? ordenats[ordenats.length - 1];
  const divises = new Set(ordenats.map((t) => t.divisa));
  return {
    id, entitat: darrer.entitat, compte4: darrer.compte4, divisa: divises.size === 1 ? darrer.divisa : null,
    desde: primeraData(ordenats.map((t) => t.desde)), fins, saldo: enter(darrer.saldo) ? darrer.saldo : null,
    moviments, coberts, solapats
  };
}

/**
 * Els comptes de la lectura del tractor, units extracte a extracte (vegeu la
 * capçalera). Amb Norma 43, el CSV només serveix per a dir quines files no hi
 * tenen parella; sense, el CSV és un compte (sense número) i cada fitxer, un tram.
 * @param {{ extractes?: Array<{ lectura: object }>, csv?: Array<{ lectura: object }> }} [lectura]
 * @returns {{ comptes: Array<{ id: string, entitat: string|null, compte4: string|null, divisa: string|null,
 *   desde: object|null, fins: object|null, saldo: number|null, moviments: object[], coberts: number[][], solapats: boolean }>,
 *   csvSenseParella: number, ambAvisos: number }}
 *   `coberts`: els dies coberts (en dies des de 1970), en intervals units; `ambAvisos`: els extractes amb avisos alts o mitjans.
 *   `id`: el de presentació, «c43-entitat-sufix» (amb «-2», «-3»… si dos comptes diferents el compartixen) o 'csv';
 *   la identitat del compte és `idCompte` de la capçalera, que no ix d'ací (GES-A2, 13-10-2026).
 */
export function comptesHistoric({ extractes = [], csv = [] } = {}) {
  const grups = new Map();
  let ambAvisos = 0;
  for (const { lectura } of Array.isArray(extractes) ? extractes : []) {
    if (severes(lectura)) ambAvisos += 1;
    for (const compte of lectura?.comptes ?? []) {
      const cap = compte?.capcalera ?? {};
      const moviments = compte?.moviments ?? [];
      const clau = clauDelCompte(cap);
      if (!grups.has(clau)) grups.set(clau, []);
      grups.get(clau).push({
        entitat: cap.entitat ?? null, compte4: cap.compte4 ?? null, divisa: cap.divisa ?? null,
        desde: esDataValida(cap.dataInicial) ? cap.dataInicial : primeraData(moviments.map((m) => m?.dataOperacio)),
        fins: esDataValida(cap.dataFinal) ? cap.dataFinal : darreraData(moviments.map((m) => m?.dataOperacio)),
        saldo: saldoC43(compte), moviments
      });
    }
  }
  const lecturesCsv = (Array.isArray(csv) ? csv : []).map(({ lectura } = {}) => {
    if (severes(lectura)) ambAvisos += 1;
    return (lectura?.moviments ?? []).filter((f) => esDataValida(f?.dataOperacio));
  });
  let csvSenseParella = 0;
  if (grups.size) {
    const ids = idsDelsComptes(grups);
    const comptes = [...grups.entries()].map(([clau, trams]) => uneixCompte(ids.get(clau), trams));
    const files = lecturesCsv.flat();
    if (files.length) csvSenseParella = fusionaMoviments(comptes.flatMap((c) => c.moviments), files).senseParella.csv.length;
    return { comptes, csvSenseParella, ambAvisos };
  }
  const trams = lecturesCsv.filter((files) => files.length).map((files) => ({
    entitat: null, compte4: null, divisa: MONEDA_SERIE, desde: primeraData(files.map((f) => f.dataOperacio)),
    fins: darreraData(files.map((f) => f.dataOperacio)), saldo: saldoCsv(files), moviments: files
  }));
  return { comptes: trams.length ? [uneixCompte('csv', trams)] : [], csvSenseParella, ambAvisos };
}

/**
 * El rang per defecte de l'històric: de l'1 de gener de l'any passat al final
 * del trimestre passat.
 * @param {{a:number,m:number,d:number}} avui
 * @returns {{ inici: object, fi: object }|null}
 */
export function rangPerDefecte(avui) {
  if (!esDataValida(avui)) return null;
  const t = Math.ceil(avui.m / 3);
  const fi = t === 1 ? { a: avui.a - 1, m: 12, d: 31 } : rangTrimestre(avui.a, t - 1).fi;
  return { inici: { a: avui.a - 1, m: 1, d: 1 }, fi };
}

/* Un rang vàlid ({ inici, fi } amb inici ≤ fi), o null. */
function rangValid(rang) {
  if (!rang || !esDataValida(rang.inici) || !esDataValida(rang.fi) || comparaDates(rang.inici, rang.fi) > 0) return null;
  return { inici: copiaData(rang.inici), fi: copiaData(rang.fi) };
}

/* Els moviments nets (llista blanca de camps) dels comptes en euros, dins del rang. */
function movimentsNets(comptes, rang, reclassificacions) {
  const moviments = [];
  let fora = 0;
  let senseImport = 0;
  comptes.forEach((compte, i) => {
    for (const m of compte.moviments ?? []) {
      if (!enter(m?.centims) || !esDataValida(m?.dataOperacio)) {
        senseImport += 1;
        continue;
      }
      if (rang && !dinsDeRang(m.dataOperacio, rang)) {
        fora += 1;
        continue;
      }
      const propia = {
        categoria: categoriaDe(m.categoria) ? m.categoria : 'revisa',
        proveidor: proveidorDe(m.proveidor) ? m.proveidor : null,
        confianca: ['alta', 'mitjana', 'baixa'].includes(m.confianca) ? m.confianca : 'baixa',
        motiu: typeof m.motiu === 'string' ? m.motiu : 'SENSE_IMPORT'
      };
      const id = typeof m.id === 'string' ? m.id : null;
      const classificacio = reclassifica(propia, id ? reclassificacions?.[id] : null);
      const divisa = m.divisa && typeof m.divisa.moneda === 'string' && enter(m.divisa.centims)
        ? { moneda: m.divisa.moneda, centims: m.divisa.centims } : null;
      moviments.push(Object.freeze({
        id, compte: i + 1, data: copiaData(m.dataOperacio), dataValor: copiaData(m.dataValor), centims: m.centims,
        ...classificacio, divisa
      }));
    }
  });
  moviments.sort((x, y) => comparaDates(x.data, y.data) || x.compte - y.compte);
  return { moviments, fora, senseImport };
}

/*
 * La cobertura d'un tram [inici, fi] pels dies coberts de CADA compte
 * (intervals units per compte): 'completa' si tots els comptes el cobrixen
 * sencer; 'parcial' si algun el cobrix en part (o hi ha moviments); si no, 'cap'.
 */
function cobertura(perCompte, inici, fi, ambMoviments) {
  const a = diaNum(inici);
  const b = diaNum(fi);
  let algun = false;
  let tots = perCompte.length > 0;
  for (const intervals of perCompte) {
    const coberts = retalla(intervals, a, b).reduce((t, [x, y]) => t + y - x + 1, 0);
    if (coberts > 0) algun = true;
    if (coberts < b - a + 1) tots = false;
  }
  if (tots) return 'completa';
  return algun || ambMoviments ? 'parcial' : 'cap';
}

/* Els avisos de la cobertura de cada compte dins del període: els forats entre extractes i els comptes que no l'arriben a cobrir. */
function avisosDeCobertura(comptes, periode) {
  const avisos = [];
  const a = diaNum(periode.inici);
  const b = diaNum(periode.fi);
  for (const c of comptes) {
    const dins = retalla(c.coberts, a, b);
    for (let i = 1; i < dins.length; i += 1) {
      const desde = dataDeDia(dins[i - 1][1] + 1);
      const fins = dataDeDia(dins[i][0] - 1);
      avisos.push(avis('FORAT_ENTRE_EXTRACTES',
        `Falten els extractes ${nomCompte(c)} del ${dia(desde)} al ${dia(fins)}: eixos dies no tenen xifra i els seus períodes ixen «parcials».`));
    }
    if (comptes.length > 1 && dins.length && (dins[0][0] > a || dins[dins.length - 1][1] < b)) {
      avisos.push(avis('COMPTE_INCOMPLET',
        `Els extractes ${nomCompte(c)} només van del ${dia(dataDeDia(dins[0][0]))} al ${dia(dataDeDia(dins[dins.length - 1][1]))}: fora d’eixos dies, els períodes ixen «parcials» (si el compte encara no existia o ja estava tancat, no cal fer res).`));
    }
  }
  return avisos;
}

/* Pot ser una cama d'un traspàs entre comptes propis: ja ho és, o és una transferència sense origen ni proveïdor que la persona no ha classificat. */
const potSerTraspas = (m) => m.motiu !== 'RECLASSIFICAT' && m.motiu !== 'REGLA_MANUAL' && m.proveidor === null
  && (m.categoria === 'traspas' || (m.confianca !== 'alta' && ['clients', 'nomines', 'altres', 'revisa'].includes(m.categoria)));

/*
 * Les parelles de traspàs probable: una eixida d'un compte i una entrada d'un
 * altre amb el mateix import i DIES_TRASPAS dies de diferència com a molt (la
 * més pròxima). Les dues cames passen a 'traspas', amb confiança baixa i el
 * motiu TRASPAS_PROBABLE (per revisar). Torna els moviments (els no tocats,
 * els mateixos objectes) i el nombre de parelles marcades.
 */
function marcaTraspassos(moviments) {
  const perImport = new Map();
  for (const m of moviments) {
    if (m.centims > 0 && potSerTraspas(m)) {
      if (!perImport.has(m.centims)) perImport.set(m.centims, []);
      perImport.get(m.centims).push(m);
    }
  }
  const usades = new Set();
  const canvis = new Map();
  let parelles = 0;
  for (const eixida of moviments) {
    if (eixida.centims >= 0 || !potSerTraspas(eixida)) continue;
    let millor = null;
    let distancia = Infinity;
    for (const entrada of perImport.get(-eixida.centims) ?? []) {
      if (usades.has(entrada) || entrada.compte === eixida.compte) continue;
      const dies = Math.abs(diaNum(entrada.data) - diaNum(eixida.data));
      if (dies <= DIES_TRASPAS && dies < distancia) {
        millor = entrada;
        distancia = dies;
      }
    }
    if (!millor) continue;
    usades.add(millor);
    if (eixida.categoria === 'traspas' && millor.categoria === 'traspas') continue;
    parelles += 1;
    for (const cama of [eixida, millor]) {
      if (cama.categoria !== 'traspas') canvis.set(cama, Object.freeze({ ...cama, categoria: 'traspas', proveidor: null, confianca: 'baixa', motiu: 'TRASPAS_PROBABLE' }));
    }
  }
  return { moviments: canvis.size ? moviments.map((m) => canvis.get(m) ?? m) : moviments, parelles };
}

function agregatBuit() {
  return {
    entrades: 0, eixides: 0, moviments: 0, traspassos: { entrades: 0, eixides: 0 },
    perCategoria: {}, perProveidor: {}, divises: {},
    ia: { entrades: 0, eixides: 0, usd: 0, comissionsDivisa: 0, perProveidor: {} }
  };
}

/* La clau dels moviments d'IA sense proveïdor conegut (una regla o una reclassificació sense proveïdor). */
export const SENSE_PROVEIDOR = 'sense-proveidor';

/* Suma un moviment a un agregat. Les eixides, en positiu. */
function suma(agregat, m) {
  const entrada = m.centims > 0 ? m.centims : 0;
  const eixida = m.centims < 0 ? -m.centims : 0;
  agregat.moviments += 1;
  if (m.categoria === 'traspas') {
    agregat.traspassos.entrades += entrada;
    agregat.traspassos.eixides += eixida;
  } else {
    agregat.entrades += entrada;
    agregat.eixides += eixida;
  }
  const cat = agregat.perCategoria[m.categoria] || { entrades: 0, eixides: 0, moviments: 0 };
  cat.entrades += entrada;
  cat.eixides += eixida;
  cat.moviments += 1;
  agregat.perCategoria[m.categoria] = cat;
  /* Les divises: l'import en la moneda d'origen, amb el signe del moviment (registre 24). */
  const usd = m.divisa?.moneda === 'USD' ? -m.divisa.centims : 0;
  if (m.divisa && m.divisa.moneda !== MONEDA_SERIE) agregat.divises[m.divisa.moneda] = (agregat.divises[m.divisa.moneda] ?? 0) - m.divisa.centims;
  if (m.categoria === 'ia') {
    agregat.ia.entrades += entrada;
    agregat.ia.eixides += eixida;
    agregat.ia.usd += usd;
    const clau = m.proveidor ?? SENSE_PROVEIDOR;
    const p = agregat.ia.perProveidor[clau] || { entrades: 0, eixides: 0, usd: 0, moviments: 0 };
    p.entrades += entrada;
    p.eixides += eixida;
    p.usd += usd;
    p.moviments += 1;
    agregat.ia.perProveidor[clau] = p;
  }
  if (m.categoria === 'comissions' && proveidorDe(m.proveidor)?.categoria === 'ia') agregat.ia.comissionsDivisa += eixida - entrada;
  if (m.proveidor) {
    const p = agregat.perProveidor[m.proveidor] || { entrades: 0, eixides: 0, usd: 0, moviments: 0 };
    p.entrades += entrada;
    p.eixides += eixida;
    p.usd += usd;
    p.moviments += 1;
    agregat.perProveidor[m.proveidor] = p;
  }
}

/* Els nets de la despesa en IA per proveïdor d'un agregat. */
function netsIa(perProveidor) {
  return Object.fromEntries(Object.entries(perProveidor).map(([clau, p]) => [clau, { ...p, net: p.eixides - p.entrades }]));
}

/* L'agregat tancat: els nets calculats i, sense cobertura, cap xifra. */
function tanca(agregat, base) {
  if (base.cobertura === 'cap') {
    return Object.freeze({ ...base, entrades: null, eixides: null, net: null, moviments: 0, traspassos: null, perCategoria: {}, perProveidor: {}, divises: {}, ia: null });
  }
  return Object.freeze({
    ...base,
    entrades: agregat.entrades,
    eixides: agregat.eixides,
    net: agregat.entrades - agregat.eixides,
    moviments: agregat.moviments,
    traspassos: agregat.traspassos,
    perCategoria: agregat.perCategoria,
    perProveidor: agregat.perProveidor,
    divises: agregat.divises,
    ia: { ...agregat.ia, net: agregat.ia.eixides - agregat.ia.entrades, perProveidor: netsIa(agregat.ia.perProveidor) }
  });
}

/* Els trams de calendari (mesos, trimestres o anys) entre dues dates. */
function trams(inici, fi, tipus) {
  const llista = [];
  let a = inici.a;
  let m = tipus === 'any' ? 1 : tipus === 'trimestre' ? 3 * Math.ceil(inici.m / 3) - 2 : inici.m;
  const pas = tipus === 'any' ? 12 : tipus === 'trimestre' ? 3 : 1;
  while (a < fi.a || (a === fi.a && m <= fi.m)) {
    const mesFinal = m + pas - 1;
    const desde = { a, m, d: 1 };
    const fins = { a, m: mesFinal, d: diesDelMes(a, mesFinal) };
    const t = Math.ceil(m / 3);
    const clau = tipus === 'any' ? String(a) : tipus === 'trimestre' ? `${a}-T${t}` : `${a}-${dosXifres(m)}`;
    /* El tram retallat pel període (on es busquen els moviments) i el de calendari (on es mira la
       cobertura): un mes que el període talla per la meitat és, com a molt, «parcial». */
    llista.push({
      tram: {
        clau, any: a, ...(tipus === 'mes' ? { mes: m } : {}), ...(tipus === 'trimestre' ? { t } : {}),
        inici: comparaDates(desde, inici) < 0 ? { ...inici } : desde,
        fi: comparaDates(fins, fi) > 0 ? { ...fi } : fins
      },
      calendari: { inici: desde, fi: fins }
    });
    m += pas;
    if (m > 12) {
      m -= 12;
      a += 1;
    }
  }
  return llista;
}

/* `perCompte`: els dies coberts de cada compte, ja retallats al període (fora d'ell no hi ha cap moviment que compte). */
function serieDe(moviments, inici, fi, tipus, perCompte) {
  return trams(inici, fi, tipus).map(({ tram, calendari }) => {
    const del = moviments.filter((mv) => dinsDeRang(mv.data, tram));
    const agregat = agregatBuit();
    for (const mv of del) suma(agregat, mv);
    return tanca(agregat, { ...tram, cobertura: cobertura(perCompte, calendari.inici, calendari.fi, del.length > 0) });
  });
}

/**
 * Cert si un moviment s'ha de revisar a mà: un proveïdor ambigu («revisa»)
 * o qualsevol confiança baixa, també una entrada sense origen conegut que
 * compta com a cobrament d'un client (una aportació, un préstec o un traspàs
 * inflarien el 303, el 130 i la renda) i un traspàs probable.
 * @param {{ categoria: string, confianca: string }} moviment
 * @returns {boolean}
 */
export const perRevisar = (moviment) => moviment?.categoria === 'revisa' || moviment?.confianca === 'baixa';

const percentatge = (part, total) => (enter(part) && enter(total) && total > 0 ? Math.round((part / total) * 1000) / 10 : null);

/* La despesa en IA de tot el rang, per proveïdor (només els moviments de la categoria IA), de més a menys. */
function iaPerProveidor(totals) {
  if (!totals?.ia) return [];
  return Object.entries(totals.ia.perProveidor).map(([clau, p]) => {
    const fitxa = proveidorDe(clau);
    return Object.freeze({
      clau, nom: fitxa?.nom ?? 'Sense proveïdor', pais: fitxa?.pais ?? null, tractament: tractamentIva(fitxa?.pais ?? null),
      net: p.net, usd: p.usd, moviments: p.moviments, percentatge: percentatge(p.net, totals.ia.net)
    });
  }).sort((x, y) => y.net - x.net || x.clau.localeCompare(y.clau));
}

/**
 * La sèrie històrica a partir de la lectura del tractor.
 * @param {object} p
 * @param {{ extractes?: Array<{ lectura: object }>, csv?: Array<{ lectura: object }> }} p.lectura la del tractor
 *   'gestoria.historic' (moviments reduïts i classificats)
 * @param {{ inici: object, fi: object }} [p.rang] el període; sense, el que cobrixen els extractes
 * @param {Record<string, { categoria: string, proveidor?: string|null }>} [p.reclassificacions] per id de moviment
 * @returns {object} { rang, comptes, moviments, mesos, trimestres, anys, totals, ia, caixa, perRevisar, avisos }
 */
export function serieHistorica({ lectura = null, rang = null, reclassificacions = {} } = {}) {
  const { comptes, csvSenseParella, ambAvisos } = comptesHistoric(lectura ?? {});
  const avisos = [];
  for (const c of comptes.filter((x) => x.solapats)) {
    avisos.push(avis('EXTRACTES_SOLAPATS', `Dos extractes ${nomCompte(c)} cobrixen els mateixos dies: els moviments repetits només compten una vegada.`));
  }
  if (csvSenseParella > 0) {
    avisos.push(avis('CSV_SENSE_PARELLA', csvSenseParella === 1
      ? 'Una fila del CSV del banc no té el seu moviment a la Norma 43: no es compta dues vegades.'
      : `${csvSenseParella} files del CSV del banc no tenen el seu moviment a la Norma 43: no es compten dues vegades.`));
  }
  if (ambAvisos > 0) {
    avisos.push(avis('LECTURA_AMB_AVISOS', `${plural(ambAvisos, 'Un extracte porta', 'extractes porten')} avisos de lectura (un fitxer tallat o unes sumes que no quadren): torna a descarregar-${ambAvisos === 1 ? 'lo' : 'los'} del banc.`));
  }
  const enEuros = comptes.filter((c) => c.divisa === MONEDA_SERIE);
  const altres = comptes.length - enEuros.length;
  if (altres > 0) {
    avisos.push(avis('ALTRA_MONEDA', `${plural(altres, 'Un compte no és', 'comptes no són')} en euros: ${altres === 1 ? 'queda' : 'queden'} fora de l’històric.`));
  }
  const demanat = rangValid(rang);
  const nets = movimentsNets(enEuros, demanat, reclassificacions);
  const { fora, senseImport } = nets;
  if (fora > 0) avisos.push(avis('FORA_DEL_RANG', `${plural(fora, 'Un moviment cau', 'moviments cauen')} fora del període triat i no ${fora === 1 ? 'compta' : 'compten'}.`));
  if (senseImport > 0) avisos.push(avis('SENSE_IMPORT', `${plural(senseImport, 'Un moviment no té', 'moviments no tenen')} la data o l’import llegits i no ${senseImport === 1 ? 'compta' : 'compten'}.`));
  const { moviments, parelles } = enEuros.length > 1 ? marcaTraspassos(nets.moviments) : { moviments: nets.moviments, parelles: 0 };
  if (parelles > 0) {
    avisos.push(avis('TRASPASSOS_PROBABLES', `${plural(parelles, 'Una parella', 'parelles')} de moviments entre els teus comptes (el mateix import, amb ${DIES_TRASPAS} dies de diferència com a molt) ${parelles === 1 ? 's’ha' : 's’han'} marcat com a traspàs: ${parelles === 1 ? 'revisa-la' : 'revisa-les'} a «Per revisar».`));
  }

  const desdeComptes = primeraData(enEuros.map((c) => c.desde));
  const finsComptes = darreraData(enEuros.map((c) => c.fins));
  const periode = demanat ?? (desdeComptes && finsComptes ? { inici: copiaData(desdeComptes), fi: copiaData(finsComptes) } : null);
  const ambSaldo = enEuros.filter((c) => enter(c.saldo));

  const buida = !periode || !enEuros.length;
  if (!buida) avisos.push(...avisosDeCobertura(enEuros, periode));
  /* Els dies coberts de cada compte, retallats al període. */
  const perCompte = buida ? [] : enEuros.map((c) => retalla(c.coberts, diaNum(periode.inici), diaNum(periode.fi)));
  const totals = buida ? null : tanca((() => {
    const agregat = agregatBuit();
    for (const mv of moviments) suma(agregat, mv);
    return agregat;
  })(), { clau: 'total', inici: periode.inici, fi: periode.fi, cobertura: cobertura(perCompte, periode.inici, periode.fi, moviments.length > 0) });

  const ia = totals?.ia ? Object.freeze({
    net: totals.ia.net,
    usd: totals.ia.usd,
    comissionsDivisa: totals.ia.comissionsDivisa,
    percentatge: percentatge(totals.ia.net, totals.eixides),
    perProveidor: iaPerProveidor(totals)
  }) : null;

  return Object.freeze({
    rang: periode,
    comptes: enEuros.map((c, i) => Object.freeze({
      n: i + 1, entitat: c.entitat ?? null, compte4: c.compte4 ?? null, desde: copiaData(c.desde), fins: copiaData(c.fins),
      saldo: enter(c.saldo) ? c.saldo : null
    })),
    moviments,
    mesos: buida ? [] : serieDe(moviments, periode.inici, periode.fi, 'mes', perCompte),
    trimestres: buida ? [] : serieDe(moviments, periode.inici, periode.fi, 'trimestre', perCompte),
    anys: buida ? [] : serieDe(moviments, periode.inici, periode.fi, 'any', perCompte),
    totals,
    ia,
    /* La caixa és completa si tots els comptes en euros porten saldo, cap queda fora i tots acaben el mateix dia. */
    caixa: ambSaldo.length
      ? Object.freeze({
        saldo: ambSaldo.reduce((t, c) => t + c.saldo, 0), fins: copiaData(finsComptes),
        completa: ambSaldo.length === enEuros.length && altres === 0 && Boolean(finsComptes)
          && enEuros.every((c) => esDataValida(c.fins) && comparaDates(c.fins, finsComptes) === 0)
      })
      : null,
    perRevisar: moviments.filter(perRevisar).length,
    avisos
  });
}

/**
 * Els indicadors del director financer a partir de la sèrie.
 * @param {object} p
 * @param {object} p.serie la de serieHistorica
 * @param {number} [p.mesos] els últims mesos complets de la mitjana
 * @param {{ valor: number|null, any?: number, t?: number }|null} [p.provisio] la provisió d'impostos del trimestre (simulacio.js)
 * @returns {{ caixa: object, despesaMensual: object, consumNet: object, runway: object, pesIa: object, iaMensual: object,
 *   provisio: object, mesosBase: number }}
 *   Cada indicador: { valor: number|null, motiu: string|null }; `runway` en mesos amb un decimal.
 */
export function indicadors({ serie, mesos = MESOS_INDICADORS, provisio = null } = {}) {
  const res = (valor, motiu = null) => Object.freeze({ valor: valor ?? null, motiu: valor == null ? motiu ?? 'SENSE_DADES' : null });
  const complets = (serie?.mesos ?? []).filter((m) => m.cobertura === 'completa').slice(-Math.max(1, mesos));
  const n = complets.length;
  const mitjana = (camp) => (n ? Math.round(complets.reduce((t, m) => t + camp(m), 0) / n) : null);
  const despesa = mitjana((m) => m.eixides);
  const consum = mitjana((m) => m.eixides - m.entrades);
  const iaMensual = mitjana((m) => m.ia?.net ?? 0);
  const saldo = serie?.caixa?.saldo ?? null;
  let runway = null;
  let motiuRunway = n ? null : 'POCS_MESOS';
  if (n && consum <= 0) motiuRunway = 'SENSE_CONSUM';
  else if (n && !enter(saldo)) motiuRunway = 'SENSE_SALDO';
  else if (n) runway = Math.round((Math.max(0, saldo) / consum) * 10) / 10;
  return Object.freeze({
    caixa: res(enter(saldo) ? saldo : null, serie?.comptes?.length ? 'SENSE_SALDO' : 'SENSE_DADES'),
    despesaMensual: res(despesa, 'POCS_MESOS'),
    consumNet: res(consum, 'POCS_MESOS'),
    runway: res(runway, motiuRunway),
    pesIa: res(serie?.ia?.percentatge ?? null, 'SENSE_DADES'),
    iaMensual: res(iaMensual, 'POCS_MESOS'),
    provisio: res(enter(provisio?.valor) ? provisio.valor : null, 'SENSE_DADES'),
    mesosBase: n
  });
}
