let isBrowser = false;
let hasSession = false;

try {
  isBrowser = typeof window !== 'undefined' && window.localStorage !== null && typeof window.localStorage !== 'undefined';
} catch {
  isBrowser = false;
}

try {
  hasSession = typeof window !== 'undefined' && window.sessionStorage !== null && typeof window.sessionStorage !== 'undefined';
} catch {
  hasSession = false;
}

/**
 * CONTRACTE: estes tres funcions són SÍNCRONES per sempre.
 * Només identitat i preferències. Res que puga créixer.
 * Imposat per tooling/gates/tractor-persistencia.mjs (L1, L2).
 */
export const STORAGE_PREFIX = 'sdp_embed_';
const PREFIX = STORAGE_PREFIX;
// Una fallada de neteja no torna a exposar credencials residuals.
const efimersInvalidats = new Set();
const MARCA_GRUP = PREFIX + 'efimer-grup-invalid';

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
  if (!hasSession || efimersInvalidats.has(key)) return fallback;
  try {
    const invalids = JSON.parse(window.sessionStorage.getItem(MARCA_GRUP) || '[]');
    if (!Array.isArray(invalids) || invalids.includes(key)) return fallback;
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch { return raw; }
  } catch { return fallback; }
};
export const setEfimer = (key, value) => {
  if (!hasSession) return false;
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    if (raw === undefined) return false;
    window.sessionStorage.setItem(PREFIX + key, raw);
    efimersInvalidats.delete(key);
    return true;
  } catch { return false; }
};
export const delEfimer = (key) => {
  efimersInvalidats.add(key);
  if (!hasSession) return false;
  try { window.sessionStorage.removeItem(PREFIX + key); efimersInvalidats.delete(key); return true; } catch { return false; }
};

/** Serialitza tot abans d'escriure; davant qualsevol error invalida tot el grup. */
export function desaGrupEfimer(entries) {
  const keys = Object.keys(entries);
  try {
    if (!hasSession) throw new Error('Emmagatzematge efímer indisponible');
    const serialized = Object.entries(entries).map(([key, value]) => {
      const raw = value === null ? null : typeof value === 'string' ? value : JSON.stringify(value);
      if (raw === undefined) throw new Error('Valor no serialitzable');
      return [key, raw];
    });
    window.sessionStorage.setItem(MARCA_GRUP, JSON.stringify(keys));
    for (const key of keys) efimersInvalidats.add(key);
    for (const [key, raw] of serialized) {
      if (raw === null) window.sessionStorage.removeItem(PREFIX + key);
      else window.sessionStorage.setItem(PREFIX + key, raw);
    }
    window.sessionStorage.removeItem(MARCA_GRUP);
    for (const key of keys) efimersInvalidats.delete(key);
    return true;
  } catch {
    for (const key of keys) { delEfimer(key); efimersInvalidats.add(key); }
    return false;
  }
}

/** Claus externes preexistents: conservar bytes i noms evita perdre preferències.
 * Per a dades pròpies noves, usar getVal/setVal o la capa efímera amb prefix.
 */
export function getPreferenciaLlegat(key, fallback = null, session = false) {
  try {
    const store = session ? window.sessionStorage : window.localStorage;
    return store.getItem(key) ?? fallback;
  } catch { return fallback; }
}
export function setPreferenciaLlegat(key, value, session = false) {
  try {
    const store = session ? window.sessionStorage : window.localStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
    return true;
  } catch { return false; }
}
