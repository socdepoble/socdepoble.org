/**
 * vistaCataleg.js — USA-05 (R15b) · La vista de cada catàleg (Llista o Rajola
 * quadrada) persistix superfície a superfície, com DISSENY_P069 §3.3.
 *
 * El patró és el de carpetesVisibles.js: una sola clau de storage.js,
 * síncrona i xicoteta, i només es guarda l'excepció (la rajola):
 *   { v: 1, espais: { 'herbari-p069': 'rajola' } }
 * Tornar a la llista és esborrar l'entrada. Com a molt ESPAIS_MAXIMS espais,
 * i el mapa no té prototip. Si la lectura o l'escriptura fallen (mode privat,
 * quota), mana 'llista' i el canvi val igual en esta càrrega.
 */
import { getVal, setVal } from '../../../config/storage.js';

export const CLAU_VISTA_CATALEG = 'workspace-vista-cataleg';
export const VISTES_CATALEG = Object.freeze(['llista', 'rajola']);
export const ESPAIS_MAXIMS = 32;
const VERSIO = 1;
/* La mateixa forma que la clau del mestre-detall (nivellMestreDetall.js). */
const PATRO_ESPAI = /^[a-z][a-z0-9-]{0,39}$/;

const esEspaiValid = (espai) => typeof espai === 'string' && PATRO_ESPAI.test(espai);

function rajolesDesades() {
  const net = Object.create(null);
  let cru = null;
  try { cru = getVal(CLAU_VISTA_CATALEG, null); } catch { cru = null; }
  if (!cru || typeof cru !== 'object' || cru.v !== VERSIO || !cru.espais || typeof cru.espais !== 'object') return net;
  let quants = 0;
  for (const [espai, vista] of Object.entries(cru.espais)) {
    if (quants >= ESPAIS_MAXIMS) break;
    if (esEspaiValid(espai) && vista === 'rajola') { net[espai] = 'rajola'; quants += 1; }
  }
  return net;
}

/** La vista desada de l'espai, o 'llista'. */
export function vistaDesada(espai) {
  if (!esEspaiValid(espai)) return 'llista';
  return rajolesDesades()[espai] === 'rajola' ? 'rajola' : 'llista';
}

/** Desa la vista de l'espai; torna true només si ha quedat escrita. */
export function desaVista(espai, vista) {
  if (!esEspaiValid(espai) || !VISTES_CATALEG.includes(vista)) return false;
  const espais = rajolesDesades();
  delete espais[espai];
  if (vista === 'rajola') {
    const claus = Object.keys(espais);
    if (claus.length >= ESPAIS_MAXIMS) delete espais[claus[0]];
    espais[espai] = 'rajola';
  }
  try { return setVal(CLAU_VISTA_CATALEG, { v: VERSIO, espais: { ...espais } }) === true; } catch { return false; }
}
