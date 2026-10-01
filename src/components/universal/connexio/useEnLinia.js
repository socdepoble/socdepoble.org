import { useSyncExternalStore } from 'react';

/**
 * useEnLinia.js — T7 (261001) · Si el dispositiu diu que té xarxa.
 *
 * Escolta 'online' i 'offline' de window: cap temporitzador ni cap petició.
 * Només és fals quan el navegador ho diu explícitament (navigator.onLine ===
 * false); sense navegador (servidor) es pren com a cert, i qui decidix el
 * color és estatDeConnexio, que sense mode remot ja no diu mai verd.
 */
function subscriu(avisa) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', avisa);
  window.addEventListener('offline', avisa);
  return () => {
    window.removeEventListener('online', avisa);
    window.removeEventListener('offline', avisa);
  };
}

const enLiniaAra = () => typeof navigator === 'undefined' || navigator.onLine !== false;
const enLiniaAlServidor = () => true;

export function useEnLinia() {
  return useSyncExternalStore(subscriu, enLiniaAra, enLiniaAlServidor);
}
