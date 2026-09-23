import { readFileSync } from 'node:fs';
import path from 'node:path';

import { PROJECT_DIR } from './project_paths.mjs';

// Importa i carrega el PERSONA_ROUTER des de l'espai de l'agent.
let router;
try {
  const routerPath = path.join(PROJECT_DIR, '.agents/skills/socdepoble-iaia-actriu/PERSONA_ROUTER.json');
  router = JSON.parse(readFileSync(routerPath, 'utf8'));
} catch {
  // Fallback si no està disponible
  router = {
    routingRules: { default: "La_Maquina", cli_args: [], contextKeywords: [] }
  };
}

export function determinePersona(argv = process.argv.slice(2), context = '') {
  for (const rule of router.routingRules.cli_args) {
    if (argv.includes(rule.flag)) {
      return rule.persona;
    }
  }
  for (const rule of router.routingRules.contextKeywords) {
    if (context.toLowerCase().includes(rule.keyword.toLowerCase())) {
      return rule.persona;
    }
  }
  return router.routingRules.default;
}
