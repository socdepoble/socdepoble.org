/**
 * autocuracio.js — Registre local de les autoreparacions.
 * Onada 12 (261011; ordres 261011_0130, punt 7) · Quan un límit d'error pinta
 * el seu fallback o una dada malmesa es deixa de banda, el sistema continua i
 * no en queda cap rastre. Ací en queda un, calcat de l'anell en memòria de
 * data/telemetria.js: cap magatzem, cap xarxa, cap esdeveniment, cap
 * dependència. Es perd en recarregar.
 *
 * Contracte:
 *   - `tipus` és tancat (TIPUS_INCIDENT); un tipus de fora no es registra.
 *   - `on` i `accio` són etiquetes curtes que posa el codi (la secció, la clau
 *     d'app_content, el domini d'un panell). MAI el missatge de l'error, que
 *     pot portar text de la persona, ni cap identificador seu.
 *   - registraIncident torna quantes vegades s'ha vist la mateixa clau: qui
 *     repara l'usa per a avisar per consola només la primera (1).
 *
 * PRODUCTOR LLEST, CONSUMIDOR PENDENT D'ORDRE (261011). `incidents()` només
 * la lligen les proves: la targeta de la Consola que el mostraria és un canvi
 * visible i demana ordre del Mestre. Tampoc no s'emet res cap a l'amfitrió.
 */

export const TIPUS_INCIDENT = Object.freeze(['panell', 'ruta', 'tros', 'dades', 'arrencada']);

const MAX_REGISTRE = 20;
const MAX_CLAUS = 50;
const MAX_TEXT = 40;

const registre = [];
const comptador = new Map();

/* Mai llança: es crida des de componentDidCatch, el pitjor lloc per a petar
   (String() d'un objecte sense prototip llança). */
const etiqueta = (valor) => {
  try { return String(valor ?? '').slice(0, MAX_TEXT); } catch { return ''; }
};

/** Anota una autoreparació. Torna les vegades que s'ha vist (0 si no s'anota). */
export function registraIncident(tipus, on, accio) {
  if (!TIPUS_INCIDENT.includes(tipus)) return 0;
  const incident = { tipus, on: etiqueta(on), accio: etiqueta(accio) };
  const clau = `${incident.tipus}:${incident.on}:${incident.accio}`;
  // Les etiquetes són del codi, però una ruta desconeguda no ha de fer créixer el mapa.
  if (!comptador.has(clau) && comptador.size >= MAX_CLAUS) return 0;
  const vegades = (comptador.get(clau) || 0) + 1;
  comptador.set(clau, vegades);
  registre.unshift({ ...incident, vegades, moment: new Date().toISOString() });
  registre.length = Math.min(registre.length, MAX_REGISTRE);
  return vegades;
}

/**
 * Una llista d'un contingut que ve de fora: si no ho és, buida. Un valor
 * absent (cap fila) és l'estat normal i no s'anota; un objecte o un text on
 * tocava una llista sí, i s'avisa per consola la primera vegada.
 */
export function llistaDe(valor, on) {
  if (Array.isArray(valor)) return valor;
  if (valor && registraIncident('dades', on, 'llista-buida') === 1) {
    console.warn(`[autocuracio] «${etiqueta(on)}» no és una llista (${typeof valor}): es pren buida.`);
  }
  return [];
}

/** Còpia dels últims incidents (el més recent primer). */
export function incidents() {
  return registre.map((incident) => ({ ...incident }));
}

/** Només per a proves: torna el mòdul a l'estat d'arrencada. */
export function _reiniciaAutocuracio() {
  registre.length = 0;
  comptador.clear();
}
