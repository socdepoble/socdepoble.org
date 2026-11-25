#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
/* F-04 · `--help` obria un torn real (torn_3a485c99, actor agent-local): esta ordre no té mode d'ajuda ni d'assaig.
   Abans de resoldre l'arrel o d'importar el registre de torns, tota bandera que no siga de les vàlides (també -h)
   ix amb el codi 2 i l'ús a stderr, sense crear cap torn ni escriure res. Les vàlides prenen el valor com options()
   de cli.mjs; --json, declarada a .agents/capabilities.json, s'admet i no canvia res (l'eixida sempre és JSON). */
const VALIDES = new Set(['arrel', 'actor', 'scope', 'output', 'json']);
const US = 'Ús: node tooling/gates/obrir_torn.mjs [--scope code|documents] [--actor NOM] [--arrel DIR] [--output FITXER] [--json]';
function banderesDesconegudes(args) {
  const desconegudes = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('-')) continue;
    const [clau, ...valor] = arg.slice(2).split('=');
    if (!arg.startsWith('--') || !VALIDES.has(clau)) { desconegudes.push(arg); continue; }
    if (!valor.length && args[i + 1] && !args[i + 1].startsWith('--')) i++;
  }
  return desconegudes;
}
const desconegudes = banderesDesconegudes(process.argv.slice(2));
if (desconegudes.length) {
  process.stderr.write(`obrir_torn: bandera desconeguda ${desconegudes.join(' ')}: no s'ha obert cap torn.\n${US}\nAmb banderes vàlides obri un torn real a .agents/runtime/turns: no té mode d'ajuda ni d'assaig.\n`);
  process.exitCode = 2;
} else {
  const { ROOT, options } = await import('../documental/cli.mjs');
  const { openTurn } = await import('../documental/turns.mjs');
  try {
    const o=options();
    const turn=openTurn(path.resolve(o.arrel||ROOT),{actor:o.actor||process.env.SDP_AGENT||'agent-local',scope:o.scope||'code'});
    if(o.output) fs.writeFileSync(path.resolve(o.output),JSON.stringify({turn_id:turn.turn_id,actor:turn.actor})+'\n',{flag:'wx'});
    console.log(JSON.stringify({valid:true,turn_id:turn.turn_id,state:turn.state,expiresAt:turn.expiresAt},null,2));
  } catch(e) {console.error(JSON.stringify({valid:false,error:e.message}));process.exitCode=1;}
}
