/** One shared state; no writer registration runs during module evaluation. */
export const estat = { cacheMem: null, lecturaDisponible: false, diariActual: null, reaplicaPendents: null };
export const campsPersistits = new WeakSet(), campsLocalsPendents = new WeakMap(), oblitsPendents = new Set();
export const generacions = new WeakMap(), generacionsBase = new WeakMap(), operacionsPendents = new WeakMap();
