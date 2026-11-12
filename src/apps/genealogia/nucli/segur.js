/**
 * segur.js — Arbre Genealògic · les guardes de seguretat del nucli.
 *
 * Tot el que entra des d'un fitxer (GEDCOM, còpia JSON) o des d'un formulari
 * passa per ací abans d'arribar al model:
 *   · coacció de primitius: un objecte on s'esperava un text és un error,
 *     mai un «[object Object]» desat en silenci;
 *   · claus perilloses (__proto__, constructor, prototype) rebutjades;
 *   · límits de mida per a les importacions i per a cada llista;
 *   · URL només https:, sense credencials.
 * Cap regex amb quantificadors niats (sense backtracking catastròfic).
 * Sense dependències ni accés a la xarxa.
 */

/** Mida màxima d'un fitxer importat (GEDCOM o JSON), en octets: 8 MiB. */
export const MIDA_MAXIMA_IMPORTACIO = 8 * 1024 * 1024;
export const MAX_PERSONES = 20000;
export const MAX_RELACIONS = 60000;
export const MAX_FONTS_PER_PERSONA = 20;

const CLAUS_PERILLOSES = new Set(['__proto__', 'constructor', 'prototype']);
/* Caràcters de control fora del salt de línia (\n) i la tabulació (\t). */
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
const ENTER_TEXT = /^-?\d{1,6}$/;

/** false per a les claus que poden contaminar prototips i per a tot el que no és un text. */
export function esClauSegura(clau) {
  return typeof clau === 'string' && !CLAUS_PERILLOSES.has(clau);
}

/**
 * Un text net: null/undefined → ''; nombre o booleà → String; qualsevol altre
 * tipus (objecte, llista, funció, símbol) → TypeError. Unifica els salts de
 * línia, lleva els caràcters de control, retalla els espais dels extrems i
 * talla a `max` caràcters.
 */
export function text(valor, max) {
  if (!Number.isSafeInteger(max) || max < 0) throw new TypeError('text() necessita un màxim enter i positiu.');
  if (valor === null || valor === undefined) return '';
  let cru;
  if (typeof valor === 'string') cru = valor;
  else if (typeof valor === 'number') cru = Number.isFinite(valor) ? String(valor) : '';
  else if (typeof valor === 'boolean') cru = String(valor);
  else throw new TypeError(`S'esperava un text i ha arribat ${Array.isArray(valor) ? 'una llista' : typeof valor}.`);
  return cru.replace(/\r\n?/g, '\n').replace(CONTROL, '').trim().slice(0, max);
}

/**
 * Un enter dins de [min, max], o null. Admet un nombre enter segur o un text
 * de com a molt sis xifres (amb signe opcional).
 */
export function enter(valor, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  let nombre = null;
  if (typeof valor === 'number') nombre = valor;
  else if (typeof valor === 'string' && ENTER_TEXT.test(valor.trim())) nombre = Number(valor.trim());
  if (!Number.isSafeInteger(nombre)) return null;
  return nombre >= min && nombre <= max ? nombre : null;
}

/** '' o una URL https: sense usuari ni contrasenya, de com a molt 2048 caràcters. */
export function urlSegura(valor) {
  if (typeof valor !== 'string') return '';
  const net = valor.trim();
  if (net === '' || net.length > 2048) return '';
  let url;
  try {
    url = new URL(net);
  } catch {
    return '';
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.hostname === '') return '';
  return url.href.length <= 2048 ? url.href : '';
}

/** true per a un objecte pla: no null, no llista, amb prototip Object.prototype o null. */
export function objectePla(valor) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const prototip = Object.getPrototypeOf(valor);
  return prototip === Object.prototype || prototip === null;
}

/**
 * Reviver per a JSON.parse: rebutja qualsevol clau perillosa. La clau '' és
 * la de l'arrel, que JSON.parse passa al final.
 */
export function revivorSegur(clau, valor) {
  if (clau !== '' && !esClauSegura(clau)) throw new TypeError(`Clau no permesa al JSON: «${String(clau)}».`);
  return valor;
}

/** Un TypeError amb el camp i la clau d'error, perquè la interfície el traduïsca. */
export function errorCamp(camp, clau = 'invalid') {
  return Object.assign(new TypeError(`Camp no vàlid: ${camp} (${clau}).`), { camp, clau });
}
