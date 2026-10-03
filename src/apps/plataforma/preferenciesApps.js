/**
 * Plataforma d'Apps Enxufables · la capa de la persona (preferències).
 *
 * Una sola clau de storage.js ('apps-interruptors'), síncrona i xicoteta: el
 * contracte de storage.js diu «només identitat i preferències». Només es
 * guarda el que la persona ha APAGAT:
 *   { v: 1, apps: { bar: false }, interruptors: { bar: { cuina: false } } }
 * Encendre és esborrar l'apagada: la persona mai encén res que la resta de
 * capes no encenguen (interruptors.js).
 *
 * L'estat es llig una vegada i es guarda en memòria; subscriuPreferencies
 * servix per a useSyncExternalStore. Si l'escriptura falla (mode privat,
 * quota), el canvi val igual en esta càrrega.
 */
import { getVal, setVal } from '../../config/storage.js';

export const CLAU_PREFERENCIES = 'apps-interruptors';
const VERSIO = 1;
const PATRO_ID = /^[a-z][a-z0-9-]{1,30}$/;
const PATRO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BUIDES = Object.freeze({ v: VERSIO, apps: Object.freeze({}), interruptors: Object.freeze({}) });

let cache = null;
const oients = new Set();

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/** Només ids vàlids amb el valor `false`; la resta es descarta. */
export function normalitzaPreferencies(cru) {
  if (!esObjecte(cru) || cru.v !== VERSIO) return BUIDES;
  const apps = {};
  if (esObjecte(cru.apps)) {
    for (const [id, valor] of Object.entries(cru.apps)) if (PATRO_ID.test(id) && valor === false) apps[id] = false;
  }
  const interruptors = {};
  if (esObjecte(cru.interruptors)) {
    for (const [id, mapa] of Object.entries(cru.interruptors)) {
      if (!PATRO_ID.test(id) || !esObjecte(mapa)) continue;
      const nets = {};
      for (const [clau, valor] of Object.entries(mapa)) if (PATRO_SLUG.test(clau) && valor === false) nets[clau] = false;
      if (Object.keys(nets).length) interruptors[id] = Object.freeze(nets);
    }
  }
  return Object.freeze({ v: VERSIO, apps: Object.freeze(apps), interruptors: Object.freeze(interruptors) });
}

export function llegeixPreferencies() {
  if (cache === null) cache = normalitzaPreferencies(getVal(CLAU_PREFERENCIES, null));
  return cache;
}

export function subscriuPreferencies(oient) {
  oients.add(oient);
  return () => { oients.delete(oient); };
}

function desa(noves) {
  cache = normalitzaPreferencies(noves);
  setVal(CLAU_PREFERENCIES, cache);
  for (const oient of [...oients]) oient();
  return cache;
}

/** La persona apaga (true) o torna a deixar com estava (false) una app. */
export function desaAppApagada(id, apagada) {
  if (!PATRO_ID.test(String(id))) return llegeixPreferencies();
  const actuals = llegeixPreferencies();
  const apps = { ...actuals.apps };
  if (apagada) apps[id] = false; else delete apps[id];
  return desa({ ...actuals, apps });
}

/** El mateix per a un interruptor intern d'una app. */
export function desaInterruptorApagat(appId, id, apagat) {
  if (!PATRO_ID.test(String(appId)) || !PATRO_SLUG.test(String(id))) return llegeixPreferencies();
  const actuals = llegeixPreferencies();
  const delApp = { ...(actuals.interruptors[appId] || {}) };
  if (apagat) delApp[id] = false; else delete delApp[id];
  const interruptors = { ...actuals.interruptors, [appId]: delApp };
  return desa({ ...actuals, interruptors });
}

/** Només per a proves: oblida la còpia en memòria (no toca l'emmagatzematge). */
export function _reiniciaPreferencies() {
  cache = null;
}
