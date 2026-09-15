// Taula declarativa tasca -> plantilla ISO obligatòria.
// Determinista: cap heurística que puga derivar.

export const TAULA = [
  { plantilla: 'plantilla_iso_sdp.md',           claus: ['prompt', 'petorreta', 'consell de', 'petició'] },
  { plantilla: 'plantilla_acta_unica.md',        claus: ['acta', 'marmota', 'relleu', 'tancament'] },
  { plantilla: 'plantilla_brainstorming.md',     claus: ['brainstorming', 'pluja d\u2019idees'] },
  { plantilla: 'plantilla_branding.md',          claus: ['branding', 'identitat visual', 'logotip'] },
  { plantilla: 'plantilla_creador_skills.md',    claus: ['crear una skill', 'nova skill', 'creador de skills'] },
  { plantilla: 'plantilla_doc_to_app.md',        claus: ['doc to app', 'document a aplicació'] },
  { plantilla: 'plantilla_estudi_ia.md',         claus: ['estudi', 'informe'] },
  { plantilla: 'plantilla_modo_produccion.md',   claus: ['mode producció', 'desplegament', 'deploy'] },
  { plantilla: 'plantilla_planificacio.md',      claus: ['planificació', 'pla director', 'roadmap', 'fases'] },
  { plantilla: 'plantilla_skill_agent.md',       claus: ['skill d\u2019agent', 'agent'] },
  { plantilla: 'plantilla_skill_trellat.md',     claus: ['trellat'] },
];

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
