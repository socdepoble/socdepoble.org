/**
 * traductorDelLloc.js — La via interna del transport lliure del lloc propi
 * (IDEA-31), sense cap dependència.
 *
 * Gauntlet 261030 (cicle 2, traductor-lliure-al-tros-entrada) · Abans, la
 * bandera vivia a traductorLliure.js, i main.jsx (i PageFrame, a través de
 * useTraduccioPagina) l'importaven de manera estàtica: l'adaptador
 * d'Apertium i MyMemory anava al tros d'entrada i als paquets de WordPress i
 * natiu, on no s'activa mai (codi mort amb les URL dels serveis). Ara:
 *  · fixaTraductorLliure(nom) i traductorLliureDelLloc() viuen ací: el botó
 *    sap si Traduir hi és sense carregar res.
 *  · fixaCarregadorLliure(carrega): com carregar l'adaptador. Només l'entrada
 *    pròpia (main.jsx) hi posa un import() dinàmic: el tros de l'adaptador
 *    només existix al seu paquet, i només es baixa en triar una llengua.
 *    traductorLliure.js, quan ja és carregat, s'hi registra ell mateix.
 * Una via interna, com la capa del paquet: cap amfitrió no l'abasta (no és
 * cap clau de config, atribut ni global).
 */
const TRANSPORTS = new Set(['apertium']);
let delLloc = null;
let carregador = null;

/** Només l'entrada pròpia (main.jsx). Qualsevol altre valor el desactiva. */
export function fixaTraductorLliure(nom) {
  delLloc = TRANSPORTS.has(nom) ? nom : null;
  return delLloc;
}

/** El transport lliure que ha fixat l'entrada pròpia, o null. */
export const traductorLliureDelLloc = () => delLloc;

/** Com es carrega l'adaptador (una funció que torna el mòdul), o res. */
export function fixaCarregadorLliure(carrega) {
  carregador = typeof carrega === 'function' ? carrega : null;
}

/** El mòdul de l'adaptador (amb creaTraductorApertium), o null si no hi ha
 *  cap transport fixat o cap carregador. Una fallada de càrrega llança. */
export async function carregaTraductorLliure() {
  if (delLloc !== 'apertium' || !carregador) return null;
  return (await carregador()) ?? null;
}
