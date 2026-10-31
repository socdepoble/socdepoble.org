/** Claus explícites de §21.1: l'actor arriba del context i no fabrica la CI. */
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { clauIdentitat } from './xifratXatMagatzem.js';

/**
 * P1-12 pas 17 · La clauIdentitat (§4.3, §21.1) de la persona en este backend,
 * sense actor ni tenant: la font única de la CI, també per a l'eixida de sessió
 * (D-09), que ja no pot comptar amb l'àmbit. Null fora del mode remot o sense
 * persona; llança si la config o el joId no fan una CI canònica.
 */
export function clauIdentitatDelContextXat({ config, joId } = {}) {
  const normalitzada = normalizeBackendConfig(config ?? {});
  if (!joId || normalitzada.dataMode !== 'remote') return null;
  return clauIdentitat({ backendId: normalitzada.backendId, endpoint: normalitzada.backendUrl, joId });
}

export function clausDelContextXat({ config, joId, ambitEstable } = {}) {
  const normalitzada = normalizeBackendConfig(config);
  if (!joId || normalitzada.dataMode !== 'remote') return null;
  let parts;
  try { parts = JSON.parse(ambitEstable); } catch { /* comprovació següent */ }
  if (!Array.isArray(parts) || parts.length !== 3
    || JSON.stringify(parts) !== ambitEstable
    || parts[0] !== backendScope(config) || parts[1] !== joId
    || typeof parts[2] !== 'string' || !parts[2]) {
    throw new TypeError('Cal l’ambitEstable canònic del context vigent.');
  }
  return Object.freeze({
    ambitEstable,
    clauIdentitat: clauIdentitatDelContextXat({ config, joId })
  });
}
