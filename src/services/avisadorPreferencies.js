import { delVal, getVal, setVal, STORAGE_PREFIX } from '../config/storage.js';

const EVENT = 'sdp:avisador-preferencies';

export function llegixAvisador(clau) {
  return clau ? getVal(clau) : null;
}

export function desaAvisador(clau, estat) {
  if (!clau || !(estat === null ? delVal(clau) : setVal(clau, estat))) return false;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: clau }));
  return true;
}

/** Coordina lectures i escriptures de preferències, separat del bloqueig de xarxa. */
export async function ambBloqueigPreferenciesAvisador(clau, fn, locks = globalThis.navigator?.locks) {
  if (typeof locks?.request !== 'function') return fn();
  return locks.request(`${clau}:preferencies`, { mode: 'exclusive' }, fn);
}

export function escoltaAvisador(clau, avisa) {
  if (!clau) return () => {};
  const local = (event) => { if (event.detail === clau) avisa(); };
  const altraPestanya = (event) => {
    if (event.key === null || event.key === `${STORAGE_PREFIX}${clau}`) avisa();
  };
  window.addEventListener(EVENT, local);
  window.addEventListener('storage', altraPestanya);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener('storage', altraPestanya);
  };
}
