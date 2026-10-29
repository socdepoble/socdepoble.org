/** Claus explícites de §21.1: l'actor arriba del context i no fabrica la CI. */
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { clauIdentitat } from './xifratXatMagatzem.js';

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
    clauIdentitat: clauIdentitat({ backendId: normalitzada.backendId, endpoint: normalitzada.backendUrl, joId })
  });
}
