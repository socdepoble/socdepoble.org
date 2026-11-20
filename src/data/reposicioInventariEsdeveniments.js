/** R32.16 · Inventari per esdeveniments, pur i determinista.
 * L’ordre d’arribada no és autoritat: cada fet té id immutable i instant UTC;
 * les revisions de comanda són contigües. El backend encara ha de reservar
 * atòmicament clauIdempotencia: este càlcul no executa cap compra.
 * CaducaEl és una data civil inclusiva: caduca quan dataTall > caducaEl.
 */
import { clauReposicio, reposicioAntiDobleComanda } from './inventari/reposicioAntiDobleComanda.js';
import { canonitzaJsonJcs } from './federacio/portabilitatFediversity.js';

const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const ESTATS = ['pendent', 'enviada', 'confirmada', 'rebuda', 'cancel_lada', 'fallida'];
const ACTIVES = new Set(['pendent', 'enviada', 'confirmada']);
const TRANSICIONS = { pendent: ['enviada', 'confirmada', 'rebuda', 'cancel_lada', 'fallida'],
  enviada: ['confirmada', 'rebuda', 'cancel_lada', 'fallida'], confirmada: ['rebuda', 'cancel_lada'],
  fallida: ['pendent', 'cancel_lada'], rebuda: [], cancel_lada: [] };
const congela = x => { if (x && typeof x === 'object') { for (const v of Object.values(x)) congela(v); Object.freeze(x); } return x; };
function registre(v, camps) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) throw new TypeError('Cal un registre pla.');
  for (const k of Reflect.ownKeys(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (typeof k !== 'string' || !camps.includes(k) || !Object.hasOwn(d, 'value') || !d.enumerable) throw new TypeError('Camp desconegut o accessor.');
  }
}
function id(v, camp) {
  if (typeof v !== 'string' || !v.trim() || v.length > 1000 || v !== v.normalize('NFC') || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(v)) throw new TypeError(`${camp}: identificador no canònic.`);
  return v;
}
function unitats(v, camp, minim = 0) {
  if (!Number.isSafeInteger(v) || Object.is(v, -0) || v < minim) throw new TypeError(`${camp}: unitats enteres segures obligatòries.`);
  return v;
}
function numero(v) { if (v > MAX || v < -MAX) throw new RangeError('Estoc fora del rang enter segur.'); return Number(v); }
function data(v) {
  if (typeof v !== 'string' || !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(v)) throw new TypeError('Data civil no canònica.');
  const d = new Date(v + 'T00:00:00.000Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw new RangeError('Data impossible.');
  return v;
}
function instant(v) {
  if (typeof v !== 'string' || v.length !== 24) throw new TypeError('Instant UTC canònic obligatori.');
  const d = new Date(v);
  if (!Number.isFinite(d.getTime()) || d.toISOString() !== v) throw new RangeError('Instant impossible.');
  return v;
}
function normalitza(e, scope) {
  registre(e, ['id', 'instant', 'tenantId', 'magatzemId', 'articleId', 'tipus', 'quantitat', 'lotId', 'caducaEl', 'ordreId', 'versio', 'clauIdempotencia', 'estat', 'caducaEn', 'cicle']);
  const base = { id: id(e.id, 'id'), instant: instant(e.instant), tenantId: id(e.tenantId, 'tenantId'), magatzemId: id(e.magatzemId, 'magatzemId'), articleId: id(e.articleId, 'articleId'), tipus: e.tipus, quantitat: unitats(e.quantitat, 'quantitat', 1) };
  if (['tenantId', 'magatzemId', 'articleId'].some(k => base[k] !== scope[k])) throw new RangeError('Esdeveniment d’un altre àmbit.');
  if (['entrada', 'eixida'].includes(e.tipus)) {
    if (['ordreId', 'versio', 'clauIdempotencia', 'estat', 'caducaEn', 'cicle'].some(k => Object.hasOwn(e, k)) || (e.tipus === 'eixida' && Object.hasOwn(e, 'caducaEl'))) throw new TypeError('Camps incompatibles amb el moviment.');
    return { ...base, lotId: id(e.lotId, 'lotId'), ...(e.tipus === 'entrada' ? { caducaEl: e.caducaEl === null || e.caducaEl === undefined ? null : data(e.caducaEl) } : {}) };
  }
  if (['reserva', 'allibera'].includes(e.tipus)) {
    if (['lotId', 'caducaEl', 'ordreId', 'versio', 'clauIdempotencia', 'estat', 'caducaEn', 'cicle'].some(k => Object.hasOwn(e, k))) throw new TypeError('Camps incompatibles amb la reserva.');
    return base;
  }
  if (e.tipus === 'comanda') {
    if (['lotId', 'caducaEl'].some(k => Object.hasOwn(e, k)) || !ESTATS.includes(e.estat)) throw new TypeError('Comanda invàlida.');
    const cicle = id(e.cicle, 'cicle');
    if (e.clauIdempotencia !== clauReposicio({ ...scope, cicle })) throw new RangeError('Clau de comanda aliena a l’àmbit o al cicle.');
    return { ...base, cicle, ordreId: id(e.ordreId, 'ordreId'), versio: unitats(e.versio, 'versio', 1), clauIdempotencia: id(e.clauIdempotencia, 'clauIdempotencia'), estat: e.estat, caducaEn: e.caducaEn == null ? null : instant(e.caducaEn) };
  }
  throw new TypeError('Tipus d’esdeveniment desconegut.');
}

/** Snapshot de tots els fets aportats a dataTall. Els fets del futur fallen
 * tancats; no es descarten silenciosament. Una recepció requereix una entrada
 * física explícita: una revisió “rebuda” només lleva el trànsit de comanda.
 */
export function reconciliaInventariEsdeveniments(entrada) {
  registre(entrada, ['tenantId', 'magatzemId', 'articleId', 'ara', 'esdeveniments']);
  const scope = Object.fromEntries(['tenantId', 'magatzemId', 'articleId'].map(k => [k, id(entrada[k], k)]));
  const ara = instant(entrada.ara), dataTall = ara.slice(0, 10), cru = entrada.esdeveniments;
  if (!Array.isArray(cru) || Object.getPrototypeOf(cru) !== Array.prototype || Reflect.ownKeys(cru).some(k => typeof k !== 'string' || (k !== 'length' && !/^(?:0|[1-9][0-9]*)$/.test(k))) || cru.length > 100_000) throw new TypeError('Llista d’esdeveniments no acotada.');
  const unics = new Map();
  for (let i = 0; i < cru.length; i++) {
    if (!Object.hasOwn(Object.getOwnPropertyDescriptor(cru, String(i)) ?? {}, 'value')) throw new TypeError('Llista no densa o accessor.');
    const e = normalitza(cru[i], scope);
    if (e.instant > ara) throw new RangeError('Esdeveniment posterior al tall.');
    const anterior = unics.get(e.id), json = canonitzaJsonJcs(e);
    if (anterior && anterior.json !== json) throw new RangeError('Col·lisió d’id amb contingut divergent.');
    if (!anterior) unics.set(e.id, { e, json });
  }
  const esdeveniments = [...unics.values()].map(v => v.e).sort((a, b) => cmp(a.instant, b.instant) || cmp(a.id, b.id));
  const lots = new Map(), ordres = new Map();
  let reservat = 0n, negatiuHistoric = false;
  for (const e of esdeveniments) {
    if (e.tipus === 'entrada' || e.tipus === 'eixida') {
      const lot = lots.get(e.lotId) ?? { lotId: e.lotId, quantitat: 0n, caducaEl: undefined };
      if (e.tipus === 'entrada') {
        if (lot.caducaEl !== undefined && lot.caducaEl !== e.caducaEl) throw new RangeError('Caducitat contradictòria del mateix lot.');
        lot.caducaEl = e.caducaEl;
        lot.quantitat += BigInt(e.quantitat);
      } else lot.quantitat -= BigInt(e.quantitat);
      if (lot.quantitat < 0n) negatiuHistoric = true;
      lots.set(e.lotId, lot);
    } else if (e.tipus === 'reserva' || e.tipus === 'allibera') {
      reservat += (e.tipus === 'reserva' ? 1n : -1n) * BigInt(e.quantitat);
    } else {
      const versions = ordres.get(e.ordreId) ?? [];
      versions.push(e); ordres.set(e.ordreId, versions);
    }
  }
  const comandes = [];
  for (const [ordreId, versions] of [...ordres].sort(([a], [b]) => cmp(a, b))) {
    versions.sort((a, b) => a.versio - b.versio);
    for (let i = 0; i < versions.length; i++) {
      const e = versions[i], pre = versions[i - 1];
      if (e.versio !== i + 1) throw new RangeError('Historial de comanda incomplet o revisió duplicada.');
      if (i === 0 && (e.estat !== 'pendent' || (e.caducaEn !== null && e.caducaEn <= e.instant))) throw new RangeError('Una comanda naix pendent.');
      if (pre && (e.quantitat !== pre.quantitat || e.clauIdempotencia !== pre.clauIdempotencia || e.cicle !== pre.cicle || e.caducaEn !== pre.caducaEn || e.instant < pre.instant || !TRANSICIONS[pre.estat].includes(e.estat))) throw new RangeError('Transició de comanda invàlida.');
    }
    const e = versions[versions.length - 1];
    comandes.push({ ordreId, cicle: e.cicle, versio: e.versio, clauIdempotencia: e.clauIdempotencia, quantitat: e.quantitat, estat: e.estat, caducaEn: e.caducaEn, caducada: e.caducaEn !== null && e.caducaEn < ara });
  }
  let estocActual = 0n, estocDisponible = 0n, estocCaducat = 0n, enComanda = 0n;
  const alertes = [], detallLots = [];
  for (const [lotId, lot] of [...lots].sort(([a], [b]) => cmp(a, b))) {
    const caducat = lot.caducaEl != null && lot.caducaEl < dataTall;
    if (lot.caducaEl === undefined) alertes.push({ codi: 'lot_sense_entrada', lotId });
    if (lot.quantitat < 0n) alertes.push({ codi: 'estoc_negatiu', lotId });
    if (caducat && lot.quantitat > 0n) alertes.push({ codi: 'lot_caducat', lotId });
    estocActual += lot.quantitat;
    if (caducat) estocCaducat += lot.quantitat > 0n ? lot.quantitat : 0n;
    else estocDisponible += lot.quantitat;
    detallLots.push({ lotId, quantitat: numero(lot.quantitat), caducaEl: lot.caducaEl ?? null, caducat });
  }
  if (reservat < 0n) alertes.push({ codi: 'reserva_negativa' });
  const clausConsumides = new Set();
  for (const e of comandes) {
    if (ACTIVES.has(e.estat)) {
      enComanda += BigInt(e.quantitat);
      // Una caducitat local no prova que el proveïdor no haja acceptat la compra.
      // Conserva la reserva fins a cancel·lació explícita; mai autoritza retry cec.
      if (e.caducada) alertes.push({ codi: 'comanda_caducada_sense_cancel_lacio', ordreId: e.ordreId });
    }
    if (!['cancel_lada', 'fallida'].includes(e.estat)) {
      if (clausConsumides.has(e.clauIdempotencia)) alertes.push({ codi: 'doble_comanda', clauIdempotencia: e.clauIdempotencia });
      clausConsumides.add(e.clauIdempotencia);
    }
  }
  const bloquejat = alertes.some(a => a.codi !== 'lot_caducat');
  return congela({ esquema: 'sdp.inventari.esdeveniments.v1', ...scope, ara, dataTall,
    esdevenimentsUnics: unics.size, duplicatsOmesos: cru.length - unics.size,
    estocActual: numero(estocActual), estocDisponible: numero(estocDisponible), estocCaducat: numero(estocCaducat),
    reservat: numero(reservat), enComanda: numero(enComanda), estocNegatiuHistoric: negatiuHistoric,
    lots: detallLots, comandes, alertes, bloquejat });
}

/** Compon el snapshot amb el motor de reposició existent. Un inventari
 * contradictori retorna bloqueig explícit i mai genera una segona comanda.
 * Els lots caducats es declaren i no compten com a estoc disponible.
 */
export function planificaReposicioInventari(entrada) {
  registre(entrada, ['tenantId', 'magatzemId', 'articleId', 'ara', 'esdeveniments', 'cicle', 'demandaDiaria', 'terminiDies', 'demandaMaximaDiaria', 'terminiMaximDies', 'estocSeguretat', 'lot', 'minimComanda', 'estocObjectiu']);
  const inventari = reconciliaInventariEsdeveniments(Object.fromEntries(['tenantId', 'magatzemId', 'articleId', 'ara', 'esdeveniments'].map(k => [k, entrada[k]])));
  const clauIdempotencia = clauReposicio(entrada);
  if (inventari.bloquejat) return congela({ inventari, reposicio: { clauIdempotencia, calComandar: false, quantitatComanda: 0, motiu: 'inventari_pendent_revisio' } });
  const reposicio = reposicioAntiDobleComanda({ ...entrada, estocActual: inventari.estocDisponible, enComanda: inventari.enComanda, reservat: inventari.reservat, comandes: inventari.comandes });
  return congela({ inventari, reposicio });
}
