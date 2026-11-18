/**
 * persistenciaColumnesUI.js — Ajudants de vista per a les columnes plegades
 * per la persona en escriptori (`P0-127`, Onada R32.9).
 *
 * v1.2.8 · Costura Codex ↔ Gemini: un sol magatzem. La persistència, la memòria
 * cau, els oients i la sincronització entre pestanyes són de
 * `columnesPlegades.js` (Codex) sobre la clau `workspace.columnesPlegades.v1`.
 * Este fitxer només hi afig els ajudants de vista de Gemini (clau d'espai a
 * partir del workspaceKey, lectura d'una columna i combinació amb l'arrencada),
 * perquè dues còpies del mateix estat no es desincronitzen mai.
 */
import { esEspaiValid } from './espaiValid.js';
import {
  CLAU_COLUMNES_PLEGADES,
  columnesPlegadesDe,
  desaColumnaPlegada,
  llegeixColumnesPlegades,
  normalitzaColumnesPlegades,
  subscriuColumnesPlegades
} from './columnesPlegades.js';

export {
  CLAU_COLUMNES_PLEGADES,
  columnesPlegadesDe,
  desaColumnaPlegada,
  llegeixColumnesPlegades,
  normalitzaColumnesPlegades
};

/* Extreu un identificador d'espai vàlid a partir d'una clau de workspaceKey
   (ex. 'wikidepoble', 'notes:u1' -> 'notes'). */
export function clauEspaiDeWorkspaceKey(workspaceKey) {
  if (typeof workspaceKey !== 'string' || !workspaceKey) return null;
  const base = workspaceKey.split(':')[0].trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return esEspaiValid(base) ? base : null;
}

export function columnaPlegadaDe(espai, columna) {
  if (columna !== 'left' && columna !== 'middle') return undefined;
  const mapa = columnesPlegadesDe(espai);
  return typeof mapa[columna] === 'boolean' ? mapa[columna] : undefined;
}

/**
 * Combina l'estat d'arrencada per defecte (`base`) amb les decisions explícites
 * desades per la persona (`desades`). La decisió explícita de la persona mana
 * sempre sobre el comportament d'arrencada per defecte.
 */
export function combinaColumnesInicialsIDesades(base, desades) {
  const teLeft = typeof desades?.left === 'boolean';
  const teMiddle = typeof desades?.middle === 'boolean';
  if (!teLeft && !teMiddle) return base;
  return {
    left: teLeft ? desades.left : Boolean(base?.left === true),
    middle: teMiddle ? desades.middle : Boolean(base?.middle === true),
  };
}

export const subscriuColumnesPlegadesUI = subscriuColumnesPlegades;
