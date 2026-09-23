import { getRuntimePolicy, esOrigenPermes } from '../../../config/runtimePolicy.js';

/**
 * client.js — La Frontissa amb Sollutia (Lectura estricta)
 * ADR-2026-09-SOLLUTIA-MODEL-B
 */

export const ESCRIPTURES_PERMESES = []; // Segons l'ADR, continua buida (cap escriptura autoritzada)

export async function llig(recurs, params = {}) {
  const policy = getRuntimePolicy();
  const issuer = policy?.auth?.issuer;
  
  if (!issuer) {
    throw new Error('[Frontissa] Denegat: manca l\'emissor de confiança a la política de Sollutia');
  }

  if (!esOrigenPermes(issuer)) {
    throw new Error(`[Frontissa] Denegat: l'origen ${issuer} no està a la llista blanca`);
  }

  const endpoint = new URL(recurs, issuer);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      endpoint.searchParams.append(k, v);
    }
  }

  // Model B: només GET, credentials omit per evitar fuita de cookies/tokens implícits
  const res = await fetch(endpoint.toString(), {
    method: 'GET',
    credentials: 'omit',
    redirect: 'error',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`[Frontissa] Request fallida per a ${recurs}: ${res.status}`);
  }

  return res.json();
}
