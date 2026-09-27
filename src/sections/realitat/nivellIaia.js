/**
 * nivellIaia.js — l'únic estat d'activitat de la IA que té l'app: el nivell
 * del Selector de Realitat (RealitatSection), desat amb getVal/setVal.
 *
 * T30.2 (ordre del Mestre, 260927 nit): la IAIA de la barra negra respira
 * quan la IA està activa. «Activa» és, ací, a partir del nivell 2
 * (Interactiva i Connexió Total); Apagada (0) i Passiva (1) són inactivitat.
 * Qui canvie el nivell ho anuncia amb l'esdeveniment EVENT_NIVELL_IAIA a
 * `window`, perquè la barra negra (que no torna a muntar-se en navegar)
 * s'assabente sense cap context nou. Sense React ni backend.
 */
import { getVal } from '../../config/storage.js';

export const CLAU_NIVELL_IAIA = 'socdepoble-iaia-level';
export const EVENT_NIVELL_IAIA = 'sdp:iaia-nivell';
export const NIVELL_IAIA_ACTIVA = 2;

export function nivellIaiaDesat() {
  const nivell = parseInt(getVal(CLAU_NIVELL_IAIA, '1'), 10);
  return Number.isFinite(nivell) ? nivell : 1;
}

export function esIaiaActiva(nivell) {
  return Number(nivell) >= NIVELL_IAIA_ACTIVA;
}

export function anunciaNivellIaia(nivell) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(EVENT_NIVELL_IAIA, { detail: Number(nivell) }));
}
