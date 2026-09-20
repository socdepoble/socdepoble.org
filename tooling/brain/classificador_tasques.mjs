// Taula declarativa tasca -> plantilla ISO obligatòria.
// Determinista: cap heurística que puga derivar.

import fs from 'node:fs';
import path from 'node:path';

const ARREL = process.env.SDP_ARREL || process.cwd();

export const TAULA = (() => {
  try {
    const registryPath = path.join(ARREL, '.agents/protocolledge.json');
    if (!fs.existsSync(registryPath)) return [];
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return registry.rutes
      .filter((r) => r.claus && r.claus.length > 0)
      .map((r) => ({
        plantilla: r.plantilla,
        claus: r.claus
      }));
  } catch (err) {
    return [];
  }
})();

export function classifica(text) {
  const t = String(text).toLowerCase();
  let millor = null;
  for (const entrada of TAULA) {
    let puntuacio = 0;
    for (const clau of entrada.claus) {
      if (t.includes(clau.toLowerCase())) puntuacio += clau.length;
    }
    if (puntuacio === 0) continue;
    if (!millor || puntuacio > millor.puntuacio) {
      millor = { plantilla: entrada.plantilla, puntuacio };
    }
  }
  return millor; // null => tasca sense plantilla obligatòria
}
