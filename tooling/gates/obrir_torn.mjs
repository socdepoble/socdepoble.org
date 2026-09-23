#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, options } from '../documental/cli.mjs';
import { openTurn } from '../documental/turns.mjs';
try {
  const o=options();
  const turn=openTurn(path.resolve(o.arrel||ROOT),{actor:o.actor||process.env.SDP_AGENT||'agent-local',scope:o.scope||'code'});
  if(o.output) fs.writeFileSync(path.resolve(o.output),JSON.stringify({turn_id:turn.turn_id,actor:turn.actor})+'\n',{flag:'wx'});
  console.log(JSON.stringify({valid:true,turn_id:turn.turn_id,state:turn.state,expiresAt:turn.expiresAt},null,2));
} catch(e) {console.error(JSON.stringify({valid:false,error:e.message}));process.exitCode=1;}
