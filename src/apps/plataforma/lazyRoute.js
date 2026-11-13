import { lazy } from 'react';

// L'entrada web pròpia injecta esta capacitat; els mòduls no importen PWA.
let recuperaErrorChunkDeploy = () => false;
export function configuraRecuperacioLazy(recupera) {
  recuperaErrorChunkDeploy = typeof recupera === 'function' ? recupera : () => false;
}

/** An import failure stays rejected in React and the browser module cache.
 * Only the owned web entry may confirm a deployment and reserve one reload;
 * otherwise recovery continues to belong to the route owner. */
export class LazyRouteError extends Error {
  constructor(cause) {
    super('No s’ha pogut carregar el mòdul d’esta vista.', { cause });
    this.name = 'LazyRouteError';
  }
}

export const ESPERA_TRANSICIO_DEPLOY_MS = 5000;

export const esErrorLazy = (error) => error instanceof LazyRouteError;

function rebuigDeCarrega(error, rebutja = () => {}) {
  const falla = () => { rebutja(); throw esErrorLazy(error) ? error : new LazyRouteError(error); };
  const intent = recuperaErrorChunkDeploy(error);
  if (intent === false) return falla();
  // A confirmed reload owns the document transition. Do not flash a red
  // boundary while that new document is being requested. If navigation is
  // cancelled or cannot leave, restore the honest boundary after a finite wait.
  return intent.then(recarregant => recarregant
    ? new Promise(resolve => setTimeout(resolve, ESPERA_TRANSICIO_DEPLOY_MS)).then(falla) : falla(), falla);
}

export function lazyRoute(importa) {
  return lazy(() => Promise.resolve().then(importa).catch(error => rebuigDeCarrega(error)));
}

/** A lazy view whose owner may ask again on a new intent (a different key),
 * never in a loop. `vigent(clau)` keeps one shared lazy while it loads or
 * after it loads; after a rejection it keeps the rejected one for the key
 * that saw it (no retry when re-entering the same key) and builds a fresh
 * lazy for any other key. The owner says what a key is (XatSection: the
 * community and the mount). `reinicia()` forgets everything (owner, tests),
 * and a forgotten lazy that rejects later blames nobody. */
export function lazyRouteRenovable(importa) {
  const SENSE = Symbol('sense');
  let Vista = null, demanada = SENSE, rebutjada = SENSE;
  const crea = () => {
    const vista = lazy(() => Promise.resolve().then(importa).catch(error => rebuigDeCarrega(error, () => {
      if (Vista === vista) rebutjada = demanada;
    })));
    return vista;
  };
  return {
    vigent(clau) {
      if (!Vista || (rebutjada !== SENSE && rebutjada !== clau)) { Vista = crea(); rebutjada = SENSE; }
      demanada = clau;
      return Vista;
    },
    reinicia() { Vista = null; demanada = SENSE; rebutjada = SENSE; }
  };
}
