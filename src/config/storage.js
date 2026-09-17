const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
const hasSession = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

/**
 * CONTRACTE: estes tres funcions són SÍNCRONES per sempre.
 * Només identitat i preferències. Res que puga créixer.
 * Imposat per tooling/gates/tractor-persistencia.mjs (L1, L2).
 */
const PREFIX = 'sdp_embed_';

export const getVal = (key, fallback = null) => {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
};

export const setVal = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore quota / serialization issues in demo mode.
  }
};

export const delVal = (key) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore
  }
};

/* ═══════════════════════ CAPA EFÍMERA ═══════════════════════
 * Afegida per l'auditoria 260829, per al verificador PKCE.
 *
 * PER QUÈ NO localStorage:
 *   El verificador és l'única cosa que impedix que un codi d'autenticació
 *   robat servisca per a res. Ha de morir amb la pestanya. A localStorage
 *   sobreviuria a tancar el navegador i quedaria a l'abast de qualsevol
 *   script de la pàgina amfitriona (Sollutia, app nativa) indefinidament.
 *
 * MATEIX CONTRACTE: síncrones, xicotetes, res que puga créixer.
 *
 * ⚠ tractor-persistencia.mjs (L2) només vigila `localStorage.`. Amplia'l
 *   perquè vigile també `sessionStorage.` fora d'aquest fitxer, o esta
 *   capa es podrà evitar igual que s'evitava l'altra.
 */

export const getEfimer = (key, fallback = null) => {
  if (!hasSession) return fallback;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch { return fallback; }
};
export const setEfimer = (key, value) => {
  if (!hasSession) return;
  try { window.sessionStorage.setItem(PREFIX + key, typeof value === 'string' ? value : JSON.stringify(value)); } catch { /* quota */ }
};
export const delEfimer = (key) => {
  if (!hasSession) return;
  try { window.sessionStorage.removeItem(PREFIX + key); } catch { /* res */ }
};
