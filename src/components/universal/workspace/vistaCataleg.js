/** R18 · Tres vistes compartides; v1 conserva la rajola i migra una llista explícita a gran. */
import { getVal, setVal } from '../../../config/storage.js';
export const CLAU_VISTA_CATALEG = 'workspace-vista-cataleg';
export const VISTES_CATALEG = Object.freeze(['canonica', 'gran', 'rajola']);
export const ESPAIS_MAXIMS = 32;
const PATRO_ESPAI = /^[a-z][a-z0-9-]{0,39}$/;
const esEspaiValid = espai => typeof espai === 'string' && PATRO_ESPAI.test(espai);
const VISTES_PER_DEFECTE = new Map();
export function declaraVistaPerDefecteEspai(espai, vista) {
  if (!esEspaiValid(espai) || !VISTES_CATALEG.includes(vista)) return false;
  VISTES_PER_DEFECTE.set(espai, vista);
  return true;
}
function vistesDesades() {
  const net = Object.create(null);
  let cru;
  try { cru = getVal(CLAU_VISTA_CATALEG, null); } catch { return net; }
  if (!cru || ![1, 2].includes(cru.v) || !cru.espais || typeof cru.espais !== 'object') return net;
  for (const [espai, original] of Object.entries(cru.espais)) {
    if (Object.keys(net).length >= ESPAIS_MAXIMS) break;
    const vista = cru.v === 1 && original === 'llista' ? 'gran' : original;
    if (esEspaiValid(espai) && VISTES_CATALEG.includes(vista)) net[espai] = vista;
  }
  return net;
}
export function vistaDesada(espai) {
  if (!esEspaiValid(espai)) return 'canonica';
  const desada = vistesDesades()[espai];
  if (desada) return desada;
  return VISTES_PER_DEFECTE.get(espai) || 'canonica';
}
export function desaVista(espai, vista) {
  if (!esEspaiValid(espai) || !VISTES_CATALEG.includes(vista)) return false;
  const espais = vistesDesades();
  delete espais[espai];
  const perDefecte = VISTES_PER_DEFECTE.get(espai) || 'canonica';
  if (vista !== perDefecte) {
    const claus = Object.keys(espais);
    if (claus.length >= ESPAIS_MAXIMS) delete espais[claus[0]];
    espais[espai] = vista;
  }
  try { return setVal(CLAU_VISTA_CATALEG, { v: 2, espais: { ...espais } }) === true; } catch { return false; }
}
