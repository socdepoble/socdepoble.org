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
import { getVal, setVal } from '../config/storage.js';
import {
  campsValids,
  carregaMapa,
  desaRevisioEditorial,
  igual,
  normalitzaClau,
  notifica,
  persisteixMapa,
  versioValida
} from './revisionsEditorialsDelNavegador.js';

export const CLAU_HISTORIAL_REVISIONS = 'publicacions.revisions.historial.v1';
export const ESQUEMA_EDICIONS_HUMANES = 'sdp.edicions-humanes.v1';
export const MAX_HISTORIAL_REVISIONS = 20;
const CAP_HISTORIAL = Object.freeze([]);
let historialMem = null;

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
  if (historialMem) return historialMem;
  const mapa = new Map();
  try {
    const brut = getVal(CLAU_HISTORIAL_REVISIONS, null);
    if (brut && typeof brut === 'object' && !Array.isArray(brut)) {
      for (const [clau, llista] of Object.entries(brut)) {
        const [seccio, ...resta] = String(clau).split(':');
        if (normalitzaClau(seccio, resta.join(':')) !== clau || !Array.isArray(llista)) continue;
        const netes = llista.map(normalitzaEntradaHistorial).filter(Boolean).slice(-MAX_HISTORIAL_REVISIONS);
        if (netes.length) mapa.set(clau, Object.freeze(netes));
      }
    }
  } catch {
    /* sense storage disponible */
  }
  historialMem = mapa;
  return historialMem;
}

function persisteixHistorial(mapa) {
  try {
    setVal(CLAU_HISTORIAL_REVISIONS, Object.fromEntries(mapa));
  } catch {
    /* sense storage disponible */
  }
}

export function registraEntradaHistorial(clau, campsAnteriors, campsNous, autorNom = null) {
  if (!clau || !campsNous || igualCampsMapa(campsAnteriors, campsNous)) return null;
  const mapaHist = carregaHistorial();
  const actuals = mapaHist.get(clau) || CAP_HISTORIAL;
  const maxVersio = actuals.reduce((max, item) => Math.max(max, item.versio), 0);
  const entrada = Object.freeze({
    versio: maxVersio + 1,
    desadaEl: new Date().toISOString(),
    autorNom: typeof autorNom === 'string' && autorNom.trim() ? autorNom.trim().slice(0, 120) : null,
    campsAnteriors: campsAnteriors ? Object.freeze({ ...campsAnteriors }) : null,
    campsNous: Object.freeze({ ...campsNous })
  });
  const noves = Object.freeze([...actuals, entrada].slice(-MAX_HISTORIAL_REVISIONS));
  mapaHist.set(clau, noves);
  persisteixHistorial(mapaHist);
  return entrada;
}

/** Llista congelada de les últimes versions (fins a 20) d'una peça ({ versio, desadaEl, autorNom, campsAnteriors, campsNous }). */
export function historialRevisionsEditorials(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  return clau ? carregaHistorial().get(clau) || CAP_HISTORIAL : CAP_HISTORIAL;
}

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
  const mapaHist = carregaHistorial();
  const llista = mapaHist.get(clau) || CAP_HISTORIAL;
  const mapa = carregaMapa();
  if (!llista.length) {
    if (!mapa.has(clau)) return { restaurada: false, versio: 0, camps: null };
    mapa.delete(clau);
    persisteixMapa(mapa);
    notifica();
    return { restaurada: true, versio: 0, camps: null };
  }
  const ultima = llista[llista.length - 1];
  const restants = llista.slice(0, -1);
  if (restants.length) mapaHist.set(clau, Object.freeze(restants));
  else mapaHist.delete(clau);
  persisteixHistorial(mapaHist);

  if (!ultima.campsAnteriors) {
    mapa.delete(clau);
    persisteixMapa(mapa);
    notifica();
    return { restaurada: true, versio: 0, camps: null };
  }
  const restaurats = campsValids(ultima.campsAnteriors);
  if (!restaurats) {
    mapa.delete(clau);
    persisteixMapa(mapa);
    notifica();
    return { restaurada: true, versio: 0, camps: null };
  }
  mapa.set(clau, Object.freeze({ camps: restaurats, desadaEl: new Date().toISOString() }));
  persisteixMapa(mapa);
  notifica();
  return { restaurada: true, versio: restants.at(-1)?.versio ?? 0, camps: restaurats };
}

/** Restaura qualsevol versió de l'historial (`versio === 0` torna a l'original canònic; `versio > 0` recupera aquella versió). */
export function restauraVersioEditorial(seccio, id, versio, { autorNom = null } = {}) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return { restaurada: false, versio: 0, camps: null };
  const mapa = carregaMapa();
  const mapaHist = carregaHistorial();
  if (Number(versio) === 0) {
    const tenia = mapa.has(clau) || mapaHist.has(clau);
    mapa.delete(clau);
    mapaHist.delete(clau);
    persisteixMapa(mapa);
    persisteixHistorial(mapaHist);
    if (tenia) notifica();
    return { restaurada: tenia, versio: 0, camps: null };
  }
  const llista = mapaHist.get(clau) || CAP_HISTORIAL;
  const objectiu = llista.find((item) => item.versio === Number(versio));
  if (!objectiu?.campsNous) return { restaurada: false, versio: 0, camps: null };
  const anteriors = mapa.get(clau)?.camps ?? null;
  const restaurats = campsValids(objectiu.campsNous);
  if (!restaurats) return { restaurada: false, versio: 0, camps: null };
  mapa.set(clau, Object.freeze({ camps: restaurats, desadaEl: new Date().toISOString() }));
  persisteixMapa(mapa);
  registraEntradaHistorial(clau, anteriors, restaurats, autorNom);
  notifica();
  return { restaurada: true, versio: objectiu.versio, camps: restaurats };
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
  historialMem = new Map();
  persisteixHistorial(historialMem);
}
