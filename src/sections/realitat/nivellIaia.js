/**
 * nivellIaia.js — l'únic estat d'activitat de la IA que té l'app: el nivell
 * del Selector de Realitat (SelectorRealitat, el bloc de /iaia), desat amb getVal/setVal.
 *
 * T30.2 (ordre del Mestre, 260927 nit): la IAIA de la barra negra respira
 * quan la IA està activa. «Activa» és, ací, a partir del nivell 2
 * (Interactiva i Activa, que encara no té cap funció pròpia: R21.5 va retirar
 * la «Connexió total»); Apagada (0) i Passiva (1) són inactivitat.
 * Qui canvie el nivell ho anuncia amb l'esdeveniment EVENT_NIVELL_IAIA a
 * `window`, perquè la barra negra (que no torna a muntar-se en navegar)
 * s'assabente sense cap context nou. Sense React ni backend.
 */
import { getVal, setVal } from '../../config/storage.js';

export const CLAU_NIVELL_IAIA = 'socdepoble-iaia-level';
export const CLAU_NIVELL_IAIA_PREVI = 'socdepoble-iaia-prev-level';
export const EVENT_NIVELL_IAIA = 'sdp:iaia-nivell';
export const NIVELL_IAIA_ACTIVA = 2;

/* T44 · un valor desat fora de 0-3 (p. ex. «7») deixava tots els ràdios
   sense marcar i el resum sense nivell: torna a Passiva (1). */
export function nivellIaiaDesat() {
  const nivell = parseInt(getVal(CLAU_NIVELL_IAIA, '1'), 10);
  return Number.isInteger(nivell) && nivell >= 0 && nivell <= 3 ? nivell : 1;
}

export function esIaiaActiva(nivell) {
  return Number(nivell) >= NIVELL_IAIA_ACTIVA;
}

/** IDEA-334 · Experiència 100 % humana: quan el nivell d'IA és 0, s'amaguen tots els punts d'accés d'IA. */
export function esModeHumaPur(nivell = nivellIaiaDesat()) {
  if (nivell === null || nivell === '' || typeof nivell === 'boolean') return false;
  return Number(nivell) === 0;
}

export function anunciaNivellIaia(nivell) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(EVENT_NIVELL_IAIA, { detail: Number(nivell) }));
}

/**
 * IDEA-334 · Activa o desactiva l'Experiència 100 % humana (nivell 0),
 * conservant i restaurant el nivell previ (1..3) quan es torna a desactivar.
 */
export function activaModeHumaPur(actiu) {
  if (actiu) {
    const actual = nivellIaiaDesat();
    if (actual >= 1) {
      setVal(CLAU_NIVELL_IAIA_PREVI, String(actual));
    }
    setVal(CLAU_NIVELL_IAIA, '0');
    anunciaNivellIaia(0);
    return 0;
  }
  const previ = parseInt(getVal(CLAU_NIVELL_IAIA_PREVI, '1'), 10);
  const restaurat = Number.isInteger(previ) && previ >= 1 && previ <= 3 ? previ : 1;
  setVal(CLAU_NIVELL_IAIA, String(restaurat));
  anunciaNivellIaia(restaurat);
  return restaurat;
}
