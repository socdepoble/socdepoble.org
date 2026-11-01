/**
 * natiu/versioMinima.js — P0-23 (BOT-A2; Gauntlet Claude 261025_1705) · La
 * porta de versió mínima de l'app nativa.
 *
 * En arrencar, l'entrada nativa pregunta al node, pel port neutral (capacitat
 * 'versioClient', contracte.js), quina és la versió mínima de la seua
 * plataforma que encara servix. Si la d'este codi (VERSIO_CLIENT_NATIU) és més
 * vella, entrada.jsx pinta CalActualitzar.jsx en lloc de l'App.
 *
 * FAIL-OPEN: sense la capacitat, sense resposta, amb un error o amb una
 * resposta que no s'entén, l'app entra com sempre. Mai a la web ni al connector
 * de WordPress: només ho crida l'entrada nativa, i només a iOS i Android.
 *
 * El build 1 de les botigues no porta este codi: la porta només protegix el
 * build 2 i els següents (matís del verificador a BOT-A2).
 */

import { VERSIO_CLIENT_NATIU } from '../data/contracte.js';
import { teCapacitat, versioMinimaClient } from '../data/backendPort.js';

const PLATAFORMES = new Set(['ios', 'android']);
const PORT = Object.freeze({ teCapacitat, versioMinimaClient });

/** L'enllaç d'actualitzar, només si és una adreça https; si no, null. Mai llança. */
export function enllacSegur(valor) {
  if (typeof valor !== 'string' || valor.length > 2048) return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && url.hostname ? url.href : null;
  } catch { return null; }
}

/**
 * Si cal bloquejar l'app: { versioMinima, enllac } quan la versió d'este codi
 * és més vella que la mínima de la plataforma; null en qualsevol altre cas
 * (també la mateixa versió o una de més nova). Mai rebutja.
 */
export async function bloqueigDeVersio({ plataforma, config, versio = VERSIO_CLIENT_NATIU, port = PORT } = {}) {
  if (!PLATAFORMES.has(plataforma)) return null;
  try {
    if (port.teCapacitat('versioClient') !== true) return null;
    const minima = await port.versioMinimaClient(plataforma, config);
    const versioMinima = minima?.versioMinima;
    if (!Number.isSafeInteger(versioMinima) || versioMinima <= versio) return null;
    return { versioMinima, enllac: enllacSegur(minima.enllac) };
  } catch (error) {
    console.warn('[natiu] No s’ha pogut saber la versió mínima; l’app entra igual:', error?.message ?? error);
    return null;
  }
}
