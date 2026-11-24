/**
 * historialRevisionsEditorials.js — R32.44 · IDEA-324 · Historial append-only
 * acotat (≤ 20 versions per peça) per a revisions editorials (`mur`, `events`,
 * `sistema`), botó «Desfer última edició» d'1 sol clic, restauració a qualsevol
 * versió anterior (`0` = original canònic) i exportació JSON per a
 * `sentinella-edicions-humanes.mjs`.
 *
 * Separat de `revisionsEditorials.js` per conservar intactes els 13 noms
 * públics del contracte R30 · A4 (`revisionsEditorials.test.js`).
 */
import { getValAmbEstat, setVal } from '../config/storage.js';
import { PREFIX_HISTORIAL, llegeixDiariRevisions } from './diariRevisionsEditorials.js';
import { creaOperacioRevisions, desaOperacioRevisions, esborraDiariRevisions, midaOperacioRevisions, compactaDiariEditorial } from './escripturaDiariEditorial.js';
import {
  campsValids,
  carregaMapa,
  desaRevisioEditorial,
  igual,
  normalitzaClau,
  notifica,
  restauraCampsRevisio,
  versioValida
} from './revisionsEditorialsDelNavegador.js';

export const CLAU_HISTORIAL_REVISIONS = 'publicacions.revisions.historial.v1';
export const ESQUEMA_EDICIONS_HUMANES = 'sdp.edicions-humanes.v1';
export const MAX_HISTORIAL_REVISIONS = 20;
const CAP_HISTORIAL = Object.freeze([]);
let diariHistorial, historialLlegible = false, ramId = 0, ordreHistorial = 0;
const pendentsHistorial = [], vinculacions = new Map(), ambigues = new Set();
const restauracionsPendents = new Set();
const idsHistorial = new WeakMap(), rebutsHistorial = new WeakSet();
export const historialPersistit = entrada => rebutsHistorial.has(entrada);
let costuraRestauracions = null;
let lecturaRemota = null;
export function registraCosturaRestauracions(callback) { costuraRestauracions = callback; }
export function registraLecturaHistorialServidor(callback) { lecturaRemota = callback; }
function ambSincronitzacio(resultat, seccio, id, versio = null) {
  if ((!resultat.restaurada && !resultat.acceptadaEnMemoria) || !costuraRestauracions) return resultat;
  const pendent = costuraRestauracions(seccio, String(id), resultat.camps, versio);
  // La UI antiga ignora esta promesa; qui l'espera continua rebent el rebuig.
  if (pendent && typeof pendent.catch === 'function') pendent.catch(() => {});
  return pendent ? { ...resultat, sincronitzacio: pendent } : resultat;
}

function igualCampsMapa(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const clausA = Object.keys(a);
  const clausB = Object.keys(b);
  return clausA.length === clausB.length && clausA.every((clau) => Object.hasOwn(b, clau) && igual(a[clau], b[clau]));
}

function normalitzaEntradaHistorial(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null;
  if (!versioValida(entrada.versio)) return null;
  const campsNous = campsValids(entrada.campsNous);
  if (!campsNous) return null;
  const campsAnteriors = entrada.campsAnteriors == null ? null : campsValids(entrada.campsAnteriors);
  return Object.freeze({
    versio: entrada.versio,
    desadaEl: typeof entrada.desadaEl === 'string' && entrada.desadaEl ? entrada.desadaEl : null,
    autorNom: typeof entrada.autorNom === 'string' && entrada.autorNom.trim() ? entrada.autorNom.trim().slice(0, 120) : null,
    campsAnteriors,
    campsNous
  });
}

function carregaHistorial() {
  const mapa = new Map(), versions = new Map(), visibles = new Map(), retirades = new Set();
  const afegeix = (clau, id, entrada, durable) => {
    const versio = Math.max(entrada.versio, (versions.get(clau) || 0) + 1);
    versions.set(clau, versio);
    const neta = Object.freeze({ ...entrada, versio }); idsHistorial.set(neta, id);
    if (durable) rebutsHistorial.add(neta);
    if (!visibles.has(clau)) visibles.set(clau, new Map());
    visibles.get(clau).set(id, neta);
  };
  const lectura = getValAmbEstat(CLAU_HISTORIAL_REVISIONS), brut = lectura.valor;
  historialLlegible = lectura.disponible && (!lectura.present || lectura.jsonValid && brut && typeof brut === 'object' && !Array.isArray(brut));
  if (brut && typeof brut === 'object' && !Array.isArray(brut)) for (const [clau, llista] of Object.entries(brut)) {
    const [seccio, ...id] = clau.split(':');
    if (normalitzaClau(seccio, id.join(':')) !== clau || !Array.isArray(llista)) { historialLlegible = false; continue; }
    llista.forEach((item, i) => { const neta = normalitzaEntradaHistorial(item); if (neta) afegeix(clau, `v1:${clau}:${i}:${neta.versio}`, neta, true); else historialLlegible = false; });
  }
  diariHistorial = llegeixDiariRevisions(PREFIX_HISTORIAL, op => {
    const [seccio, ...id] = typeof op.k === 'string' ? op.k.split(':') : [];
    return normalitzaClau(seccio, id.join(':')) === op.k && Object.keys(op).every(k => ['v','n','id','k','t','d'].includes(k))
      && (op.t === 'h' ? !!normalitzaEntradaHistorial(op.d) : op.t === 'x' && Array.isArray(op.d) && op.d.length <= MAX_HISTORIAL_REVISIONS && op.d.every(id => typeof id === 'string' && id.length <= 3000));
  });
  historialLlegible &&= diariHistorial.disponible;
  const rebuts = new Set(diariHistorial.ops.map(op => op.id));
  for (const op of [...diariHistorial.ops, ...pendentsHistorial.filter(p => !rebuts.has(p.id)).map(p => ({ ...p.dades, id: p.id, ram: true }))]) {
    if (op.t === 'h') afegeix(op.k, op.id, normalitzaEntradaHistorial(op.d), !op.ram);
    else for (const id of op.d) retirades.add(id);
  }
  for (const [clau, entries] of visibles) {
    for (const id of retirades) entries.delete(id);
    const llista = Object.freeze([...entries.values()].slice(-MAX_HISTORIAL_REVISIONS));
    if (llista.length) mapa.set(clau, llista);
  }
  return mapa;
}
function persisteixPendentsHistorial() {
  if (!historialLlegible) return false;
  while (pendentsHistorial.length) {
    const pendent = pendentsHistorial[0];
    if (!pendent.op) {
      pendent.op = creaOperacioRevisions(pendent.dades, { ultim: pendent.n - 1 });
      if (!pendent.op) return false;
      const antic = pendent.id; pendent.id = pendent.op.id;
      for (const altra of pendentsHistorial) if (altra.dades.t === 'x' && altra.dades.d.includes(antic)) {
        altra.dades = { ...altra.dades, d: altra.dades.d.map(id => id === antic ? pendent.id : id) };
        if (altra.op) altra.op = { ...altra.op, d: altra.dades.d };
      }
    }
    const op = desaOperacioRevisions(PREFIX_HISTORIAL, pendent.dades, diariHistorial, pendent.op);
    if (!op) return false;
    if (!diariHistorial.ops.some(actual => actual.id === op.id)) {
      diariHistorial.ops.push(op); diariHistorial.ultim = Math.max(diariHistorial.ultim, op.n); diariHistorial.chars += midaOperacioRevisions(PREFIX_HISTORIAL, op); diariHistorial.decodedChars += JSON.stringify(op).length; diariHistorial.records.push({key:PREFIX_HISTORIAL+op.id,text:JSON.stringify(op),ids:[op.id]});
    }
    pendentsHistorial.shift();
  }
  return true;
}
function commitHistorial(dades) {
  const n = ordreHistorial = Math.max(ordreHistorial, diariHistorial.ultim) + 1;
  const op = creaOperacioRevisions(dades, { ultim: n - 1 });
  const pendent = { dades, op, n, id: op?.id || `ram:${++ramId}` };
  pendentsHistorial.push(pendent);
  return persisteixPendentsHistorial() ? pendent.op : null;
}
function retiraHistorial(clau, entrades) {
  const ids = entrades.map(entrada => idsHistorial.get(entrada)).filter(Boolean);
  return ids.length ? !!commitHistorial({ k: clau, t: 'x', d: ids }) : persisteixPendentsHistorial();
}
function resultatRestauracio(clau, restaurada, versio, camps, acceptada = true) {
  if (restaurada) restauracionsPendents.delete(clau); else if (acceptada) restauracionsPendents.add(clau);
  return { restaurada, versio, camps, ...(!restaurada && acceptada ? { acceptadaEnMemoria: true, motiu: 'sense-persistencia' } : {}) };
}

export function registraEntradaHistorial(clau, campsAnteriors, campsNous, autorNom = null, versioBase = 0) {
  if (!clau || !campsNous || igualCampsMapa(campsAnteriors, campsNous)) return null;
  const mapaHist = carregaHistorial();
  const actuals = mapaHist.get(clau) || CAP_HISTORIAL;
  const [seccio, ...id] = clau.split(':');
  const maxVersio = Math.max(versioBase, actuals.reduce((max, item) => Math.max(max, item.versio), 0), historialRevisionsEditorials(seccio, id.join(':')).at(-1)?.versio || 0);
  const entrada = Object.freeze({
    versio: maxVersio + 1,
    desadaEl: new Date().toISOString(),
    autorNom: typeof autorNom === 'string' && autorNom.trim() ? autorNom.trim().slice(0, 120) : null,
    campsAnteriors: campsAnteriors ? Object.freeze({ ...campsAnteriors }) : null,
    campsNous: Object.freeze({ ...campsNous })
  });
  const op = commitHistorial({ k: clau, t: 'h', d: entrada });
  const actualitzat = carregaHistorial().get(clau) || CAP_HISTORIAL;
  return op ? actualitzat.find(e => idsHistorial.get(e) === op.id) || null : null;
}

/** Llista congelada de les últimes versions (fins a 20) d'una peça ({ versio, desadaEl, autorNom, campsAnteriors, campsNous }). */
export function historialRevisionsEditorials(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return CAP_HISTORIAL;
  const remote = lecturaRemota?.(seccio, String(id));
  if (remote) return remote;
  const list = carregaHistorial().get(clau) || CAP_HISTORIAL;
  for (const entry of list) {
    const key = `${clau}:${entry.versio}`, opId = idsHistorial.get(entry);
    if (vinculacions.has(key) && vinculacions.get(key) !== opId) ambigues.add(key);
    else vinculacions.set(key, opId);
  }
  return list;
}
export const identificadorVersioEditorial = entrada => idsHistorial.get(entrada) || null;

/** Desa síncronament una revisió editorial deixant empremta a l'historial append-only. */
export function desaRevisioEditorialAmbHistorial(seccio, id, camps, { autorNom = null } = {}) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return false;
  const anteriors = carregaMapa().get(clau)?.camps ?? null;
  if (!desaRevisioEditorial(seccio, id, camps)) return false;
  const nous = carregaMapa().get(clau)?.camps ?? null;
  if (registraEntradaHistorial(clau, anteriors, nous, autorNom)) notifica();
  return true;
}

/** Desfà amb 1 clic l'última revisió d'una peça, restaurant l'estat immediatament anterior (o l'original canònic). */
export function desferUltimaRevisioEditorial(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return { restaurada: false, versio: 0, camps: null };
  const llista = historialRevisionsEditorials(seccio, id), mapa = carregaMapa(true);
  if (!llista.length && !mapa.has(clau)) return { restaurada: false, versio: 0, camps: null };
  const camps = llista.at(-1)?.campsAnteriors ?? null, versio = llista.at(-2)?.versio ?? 0;
  const history = retiraHistorial(clau, llista.length ? [llista.at(-1)] : []);
  const durable = restauraCampsRevisio(clau, camps);
  carregaHistorial(); notifica();
  return ambSincronitzacio(resultatRestauracio(clau, durable && history, versio, camps), seccio, id, versio);
}

/** Restaura qualsevol versió de l'historial (`versio === 0` torna a l'original canònic; `versio > 0` recupera aquella versió). */
export function restauraVersioEditorial(seccio, id, versio, { autorNom = null } = {}) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return { restaurada: false, versio: 0, camps: null };
  const mapa = carregaMapa(true), llista = historialRevisionsEditorials(seccio, id);
  if (Number(versio) === 0) {
    const tenia = mapa.has(clau) || llista.length > 0 || restauracionsPendents.has(clau);
    if (!tenia) return { restaurada: false, versio: 0, camps: null };
    const history = retiraHistorial(clau, llista), durable = restauraCampsRevisio(clau, null);
    carregaHistorial(); notifica();
    return ambSincronitzacio(resultatRestauracio(clau, durable && history, 0, null), seccio, id, 0);
  }
  const byId = typeof versio === 'string' && !Number.isFinite(Number(versio));
  if (!byId && ambigues.has(`${clau}:${Number(versio)}`)) return { restaurada: false, versio: Number(versio), camps: null, motiu: 'historial-canviat' };
  const objectiu = llista.find(item => byId ? idsHistorial.get(item) === versio : item.versio === Number(versio));
  if (!objectiu?.campsNous) return { restaurada: false, versio: 0, camps: null };
  const restaurats = campsValids(objectiu.campsNous), anteriors = mapa.get(clau)?.camps ?? null;
  if (!restaurats) return { restaurada: false, versio: 0, camps: null };
  const durable = restauraCampsRevisio(clau, restaurats);
  const history = igualCampsMapa(anteriors, restaurats) ? persisteixPendentsHistorial() : registraEntradaHistorial(clau, anteriors, restaurats, autorNom);
  notifica();
  return ambSincronitzacio(resultatRestauracio(clau, durable && !!history, objectiu.versio, restaurats), seccio, id, objectiu.versio);
}

/** Exporta un paquet JSON canònic amb totes les revisions humanes i el seu historial per a `sentinella-edicions-humanes.mjs`. */
export function exportaRevisionsHumanes() {
  const revisions = {};
  for (const [clau, entrada] of carregaMapa().entries()) {
    revisions[clau] = {
      camps: { ...entrada.camps },
      desadaEl: entrada.desadaEl ?? null,
      ...(entrada.servidor ? { servidor: { ...entrada.servidor } } : null)
    };
  }
  const historial = {};
  for (const [clau, llista] of carregaHistorial().entries()) {
    historial[clau] = llista.map((item) => ({
      versio: item.versio,
      desadaEl: item.desadaEl,
      autorNom: item.autorNom,
      campsAnteriors: item.campsAnteriors ? { ...item.campsAnteriors } : null,
      campsNous: { ...item.campsNous }
    }));
  }
  return {
    schema: ESQUEMA_EDICIONS_HUMANES,
    generatEl: new Date().toISOString(),
    revisions,
    historial
  };
}

export function _buidaHistorialRevisionsPerAProves() {
  pendentsHistorial.length = 0; vinculacions.clear(); ambigues.clear();
  restauracionsPendents.clear();
  ordreHistorial = 0;
  esborraDiariRevisions(PREFIX_HISTORIAL);
  setVal(CLAU_HISTORIAL_REVISIONS, {});
}

/** Lossless maintenance never clears the RAM queue on an unverified commit. */
export function gestionaHistorialEditorial(){
 carregaHistorial();const compactacio=compactaDiariEditorial(PREFIX_HISTORIAL,diariHistorial);
 carregaHistorial();const complet=persisteixPendentsHistorial();carregaHistorial();
 return {compactacio,complet,disponible:historialLlegible,pendents:pendentsHistorial.length};
}
export function* pendentsHistorialEditorial(){
 for(const p of pendentsHistorial)yield {id:p.id,n:p.n,dades:p.dades,op:p.op};
}
