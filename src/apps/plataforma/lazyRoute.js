import { lazy } from 'react';

/** An import failure stays rejected in React and the browser module cache.
 * Recovery belongs to the route owner; loading never reloads the document. */
export class LazyRouteError extends Error {
  constructor(cause) {
    super('No s’ha pogut carregar el mòdul d’esta vista.', { cause });
    this.name = 'LazyRouteError';
  }
}

export const esErrorLazy = (error) => error instanceof LazyRouteError;

export function lazyRoute(importa) {
  return lazy(() => Promise.resolve().then(importa).catch((error) => {
    throw esErrorLazy(error) ? error : new LazyRouteError(error);
  }));
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
    const vista = lazy(() => Promise.resolve().then(importa).catch((error) => {
      if (Vista === vista) rebutjada = demanada;
      throw esErrorLazy(error) ? error : new LazyRouteError(error);
    }));
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
