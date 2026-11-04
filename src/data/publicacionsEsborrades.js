/**
 * publicacionsEsborrades.js — Registre reactiu i persistent de publicacions
 * esborrades per a garantir la cascada mecànica universal (ordre del Mestre,
 * 261103: «Quan s'esborra una Card/publicació s'esborren totes les seues
 * targetes i la seua pàgina corresponent de tots els llocs automàticament»).
 *
 * Quan s'esborra una publicació (directament o en esborrar la nota que la va
 * originar):
 *  1. S'elimina del servidor (`DELETE /rest/v1/section_submissions`) quan és
 *     una fila remota.
 *  2. S'anota la seua clau (`${seccio}:${id}`) en este registre (memòria +
 *     localStorage) i es notifica a tots els subscriptors (`MurContext`,
 *     `MultimediaContext`, `ItemDetailSection`, `PerfilPublicSection`,
 *     `PublicacionsDelPoble`, `SearchSection`).
 *  3. Qualsevol targeta, pàgina de detall (`/mercat/:id`, `/mur/:id`,
 *     `/events/:id`), pestanya de perfil (`Mur`, `Mercat`, `Agenda`), fitxa de
 *     poble, cercador o galeria multimèdia deixa de mostrar-la a l'instant.
 */
import { getVal, setVal } from '../config/storage.js';

const CLAU_STORAGE = 'publicacions.esborrades.v1';
const SECCIONS_VALIDES = new Set(['mur', 'mercat', 'events', 'multimedia']);

/* El Mac Mini M4 ('mercat:mac-mini-m4') va passar a ser el servidor físic
   Node 0 (/page/node-zero) i ja no està en venda en cap mode ni sessió. */
const RETIRADES_CANONIQUES = Object.freeze(['mercat:mac-mini-m4']);

let versio = 0;
const oients = new Set();
let cacheMem = null;

function normalitzaClau(seccio, id) {
  const s = String(seccio || '').trim().toLowerCase();
  const i = String(id || '').trim();
  if (!SECCIONS_VALIDES.has(s) || !i) return null;
  return `${s}:${i}`;
}

function carregaConjunt() {
  if (cacheMem) return cacheMem;
  const base = new Set(RETIRADES_CANONIQUES);
  try {
    const desat = getVal(CLAU_STORAGE, []);
    if (Array.isArray(desat)) {
      for (const item of desat) {
        if (typeof item === 'string' && item.includes(':')) base.add(item);
      }
    }
  } catch {
    /* sense storage disponible */
  }
  cacheMem = base;
  return cacheMem;
}

function persisteixConjunt(conjunt) {
  try {
    const llista = [...conjunt].filter((c) => !RETIRADES_CANONIQUES.includes(c));
    setVal(CLAU_STORAGE, llista);
  } catch {
    /* sense storage disponible */
  }
}

function notifica() {
  versio += 1;
  for (const fn of oients) {
    try { fn(); } catch { /* ignora error d'oient */ }
  }
}

export function subscriuPublicacionsEsborrades(callback) {
  oients.add(callback);
  return () => oients.delete(callback);
}

export function versioPublicacionsEsborrades() {
  return versio;
}

export function esPublicacioEsborrada(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return false;
  return carregaConjunt().has(clau);
}

export function marcaPublicacioEsborrada(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  if (!clau) return false;
  const conjunt = carregaConjunt();
  if (conjunt.has(clau)) return true;
  conjunt.add(clau);
  persisteixConjunt(conjunt);
  notifica();
  return true;
}

export function restauraPublicacioEsborrada(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  if (!clau || RETIRADES_CANONIQUES.includes(clau)) return false;
  const conjunt = carregaConjunt();
  if (!conjunt.has(clau)) return false;
  conjunt.delete(clau);
  persisteixConjunt(conjunt);
  notifica();
  return true;
}

export function filtraPublicacionsEsborrades(llista, seccio) {
  if (!Array.isArray(llista) || !llista.length) return llista || [];
  const conjunt = carregaConjunt();
  const s = String(seccio || '').trim().toLowerCase();
  if (!SECCIONS_VALIDES.has(s)) return llista;
  let capEsborrada = false;
  for (const el of llista) {
    if (el?.id != null && conjunt.has(`${s}:${String(el.id)}`)) {
      capEsborrada = true;
      break;
    }
  }
  if (!capEsborrada) return llista;
  return llista.filter((el) => el?.id == null || !conjunt.has(`${s}:${String(el.id)}`));
}

/** Només per a proves unitàries: reinicia l'estat en memòria i l'emmagatzematge. */
export function _reiniciaPublicacionsEsborradesPerAProves() {
  cacheMem = new Set(RETIRADES_CANONIQUES);
  persisteixConjunt(cacheMem);
  notifica();
}

