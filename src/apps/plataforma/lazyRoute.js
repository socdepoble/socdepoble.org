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
