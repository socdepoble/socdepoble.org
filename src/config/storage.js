let isBrowser = false;
let hasSession = false;
/* QA-C02 (Gauntlet 261029_1858) · «Navegador sense la capa» (fora del
 * navegador, o la propietat absent) no és «capa bloquejada» (el getter llança:
 * SecurityError amb les galetes blocades, en un marc de tercers o per política
 * d'empresa). En el segon cas hi pot haver dades d'abans que no es poden
 * esborrar: es guarda l'error per a qui ho ha de saber (magatzemWebPerAOblit). */
let errorPreferencies = null;
let errorSessio = null;

function errorDeCapaBloquejada(error) {
  /* Tal qual si és un objecte: una DOMException pot vindre d'un altre reialme (no instanceof Error). */
  if (error !== null && typeof error === 'object') return error;
  return Object.assign(new Error('La capa d’emmagatzematge del navegador està bloquejada.'), { name: 'SecurityError', cause: error });
}

try {
  isBrowser = typeof window !== 'undefined' && window.localStorage !== null && typeof window.localStorage !== 'undefined';
} catch (error) {
  isBrowser = false;
  errorPreferencies = errorDeCapaBloquejada(error);
}

try {
  hasSession = typeof window !== 'undefined' && window.sessionStorage !== null && typeof window.sessionStorage !== 'undefined';
} catch (error) {
  hasSession = false;
  errorSessio = errorDeCapaBloquejada(error);
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

/** Torna true només si el valor ha quedat escrit (D1, 260926): el registre de
 *  sessió ha de saber si la quota l'ha deixat a mitges. Els callers antics ignoren el retorn. */
export const setVal = (key, value) => {
  if (!isBrowser) return false;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    // Quota o serialització: qui necessita saber-ho mira el retorn.
    return false;
  }
};

export const delVal = (key) => {
  if (!isBrowser) return false;
  try {
    window.localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
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
 * tractor-persistencia.mjs (L2) ja vigila les dues capes: cap accés directe
 *   a l'emmagatzematge local ni a l'efímer fora d'aquest fitxer.
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

/* P1-12 pas 17 (D-09) · Façana mínima per a l'oblit del xat xifrat en eixir de
 * la sessió: només veu les claus amb el prefix sdp_xat_ de la capa de sessió
 * ('sessio') o de la de preferències ('preferencies'). Compta, nomena i esborra;
 * cap lectura ni escriptura de valors, i cap esborrat fora del prefix (defensa
 * en profunditat: el pipeline ja filtra). NO s'empassa els errors: l'oblit ha
 * de saber-ho (OBLIT_FALLIT). Null si la capa no existix en este entorn.
 * QA-C02 · Una capa BLOQUEJADA (el getter llança, ara o en carregar este
 * mòdul) no és una capa absent: torna una façana amb la mateixa forma que
 * llança l'error en cada accés, i l'oblit la declara pendent. La capa es torna
 * a mirar en cada crida: una que en carregar estava bloquejada i ara s'obri
 * s'esborra de veres. */
const PREFIX_OBLIT_XAT = 'sdp_xat_';
const capaBloquejada = (error) => Object.freeze({
  get length() { throw error; },
  key() { throw error; },
  removeItem() { throw error; }
});
function obriCapaPerAOblit(capa) {
  if (typeof window === 'undefined') return { web: null, error: null };
  try {
    const web = capa === 'sessio' ? window.sessionStorage : window.localStorage;
    return { web: web ?? null, error: null };
  } catch (error) {
    return { web: null, error: errorDeCapaBloquejada(error) };
  }
}
export function magatzemWebPerAOblit(capa) {
  if (capa !== 'sessio' && capa !== 'preferencies') return null;
  const { web, error } = obriCapaPerAOblit(capa);
  const bloqueig = error ?? (web === null ? (capa === 'sessio' ? errorSessio : errorPreferencies) : null);
  if (bloqueig) return capaBloquejada(bloqueig);
  if (web === null) return null;
  const clausDelXat = () => {
    const claus = [];
    for (let i = 0; i < web.length; i += 1) {
      const clau = web.key(i);
      if (typeof clau === 'string' && clau.startsWith(PREFIX_OBLIT_XAT)) claus.push(clau);
    }
    return claus;
  };
  return Object.freeze({
    get length() { return clausDelXat().length; },
    key: (index) => clausDelXat()[index] ?? null,
    removeItem: (clau) => {
      if (typeof clau !== 'string' || !clau.startsWith(PREFIX_OBLIT_XAT)) {
        throw new TypeError('Només es poden esborrar claus del xat xifrat (sdp_xat_).');
      }
      web.removeItem(clau);
    }
  });
}
