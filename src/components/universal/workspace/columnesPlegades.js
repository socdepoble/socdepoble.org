/** Preferències explícites i acotades; false també és una decisió de la persona.
 * La UI només escriu després d'una acció manual, mai en canviar de document
 * o en adaptar-se a la mida de pantalla. Sense preferència retorna {}.
 */
import { getVal, setVal, STORAGE_PREFIX } from '../../../config/storage.js';
import { esEspaiValid } from './espaiValid.js';

export const CLAU_COLUMNES_PLEGADES = 'workspace.columnesPlegades.v1';
export const MAX_ESPAIS_COLUMNES = 32;
const buida = () => Object.create(null);
const SENSE_PREFERENCIA = Object.freeze(buida());
const BUIDES = Object.freeze({ v: 1, espais: Object.freeze(buida()) });
const esMapa = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const prop = (v, k) => Object.prototype.hasOwnProperty.call(v, k);
let cache = null;
let canviNomesEnMemoria = false;
const oients = new Set();

export function normalitzaColumnesPlegades(cru) {
  /* v1.2.8 · Costura amb Gemini R32.9 (persistenciaColumnesUI.js): també s'admet el mapa pla
     { [espai]: { left, middle } }, sense `v` ni `espais`; qualsevol altra versió continua rebutjada. */
  const pla = esMapa(cru) && !prop(cru, 'v') && !prop(cru, 'espais');
  if (!pla && (!esMapa(cru) || cru.v !== 1 || !esMapa(cru.espais))) return BUIDES;
  const espais = buida();
  for (const [espai, valors] of Object.entries(pla ? cru : cru.espais)) {
    if (Object.keys(espais).length >= MAX_ESPAIS_COLUMNES) break;
    if (!esEspaiValid(espai) || !esMapa(valors)) continue;
    const net = buida();
    for (const costat of ['left', 'middle']) {
      if (prop(valors, costat) && typeof valors[costat] === 'boolean') net[costat] = valors[costat];
    }
    if (Object.keys(net).length) espais[espai] = Object.freeze(net);
  }
  return Object.freeze({ v: 1, espais: Object.freeze(espais) });
}

export function llegeixColumnesPlegades() {
  if (cache === null) cache = normalitzaColumnesPlegades(getVal(CLAU_COLUMNES_PLEGADES, null));
  return cache;
}

/** Snapshot estable per a useSyncExternalStore; cada espai té estat independent.
 * També admet claus com sidebar i xat, sense afegir un magatzem paral·lel.
 */
export function columnesPlegadesDe(espai) {
  return esEspaiValid(espai) ? llegeixColumnesPlegades().espais[espai] ?? SENSE_PREFERENCIA : SENSE_PREFERENCIA;
}

function avisa() { for (const oient of [...oients]) oient(); }
function canviExtern(event) {
  if (event.key !== null && event.key !== STORAGE_PREFIX + CLAU_COLUMNES_PLEGADES) return;
  const nou = normalitzaColumnesPlegades(getVal(CLAU_COLUMNES_PLEGADES, null));
  if (JSON.stringify(nou) === JSON.stringify(llegeixColumnesPlegades())) return;
  cache = nou;
  canviNomesEnMemoria = false;
  avisa();
}

export function subscriuColumnesPlegades(oient) {
  let haCanviat = false;
  if (!oients.size) {
    if (typeof window !== 'undefined') window.addEventListener('storage', canviExtern);
    // Pot haver canviat en una altra pestanya mentre no hi havia cap vista
    // muntada. No sacrifiquem una decisió local que storage no va poder desar.
    if (!canviNomesEnMemoria) {
      const nou = normalitzaColumnesPlegades(getVal(CLAU_COLUMNES_PLEGADES, null));
      haCanviat = JSON.stringify(nou) !== JSON.stringify(llegeixColumnesPlegades());
      if (haCanviat) cache = nou;
    }
  }
  oients.add(oient);
  if (haCanviat) avisa();
  return () => {
    oients.delete(oient);
    if (!oients.size && typeof window !== 'undefined') window.removeEventListener('storage', canviExtern);
  };
}

/** Fusiona un canvi parcial; mai interpreta "false" o 0 com a booleans. */
export function desaColumnesPlegades(espai, canvi) {
  const actual = llegeixColumnesPlegades();
  if (!esEspaiValid(espai) || !esMapa(canvi)) return actual;
  const abans = columnesPlegadesDe(espai);
  const nou = Object.assign(buida(), abans);
  for (const costat of ['left', 'middle']) {
    if (prop(canvi, costat) && typeof canvi[costat] === 'boolean') nou[costat] = canvi[costat];
  }
  if (JSON.stringify(nou) === JSON.stringify(abans)) return actual;
  if (!prop(actual.espais, espai) && Object.keys(actual.espais).length >= MAX_ESPAIS_COLUMNES) return actual;
  const espais = Object.assign(buida(), actual.espais, { [espai]: nou });
  cache = normalitzaColumnesPlegades({ v: 1, espais });
  canviNomesEnMemoria = !setVal(CLAU_COLUMNES_PLEGADES, cache);
  avisa();
  return cache;
}

export function desaColumnaPlegada(espai, costat, plegada) {
  if (costat !== 'left' && costat !== 'middle') return llegeixColumnesPlegades();
  return desaColumnesPlegades(espai, { [costat]: plegada });
}

/** Només per a proves: simula recàrrega sense esborrar preferències. */
export function _reiniciaColumnesPlegades() { cache = null; canviNomesEnMemoria = false; }
