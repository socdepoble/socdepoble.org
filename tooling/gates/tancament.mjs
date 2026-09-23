#!/usr/bin/env node
/** --check (default) is read-only. --verify/--close are explicit state mutations. */
import path from 'node:path';
import {withSignedLedger} from '../documental/ledger.mjs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { VerificadorSCC } from './verificador-scc.mjs';
import { sha } from '../documental/core.mjs';
import { ROOT, options } from '../documental/cli.mjs';
import { checkTurn, sealTurn, inventory, changes } from '../documental/turns.mjs';
import { checkDocuments } from './porta-documents.mjs';

export async function environmentChecks(root,scope='documents') {
  const checks=[],errors=[];
  const commands=[['plantilles',['tooling/gates/porta-plantilles.mjs']],
    ['autoritat',['tooling/gates/porta-autoritat.mjs']],
    ['ledger',['tooling/verify-ledger.mjs']],
    ['segell',['tooling/gates/segella.mjs']],
    ['skills', ['tooling/brain/cataleg_skills.mjs','--check']],
    ['wiki', ['tooling/wiki/compile-wiki-to-app.mjs','--check','--strict']]];
  if(scope==='code') commands.push(['documental-tests',['--test','tests/documental.test.mjs','tests/porta-reflex.test.mjs','tests/fortificacio.test.mjs']]);
  for(const [name,args] of commands) {
    const p=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
    checks.push({name,exit:p.status});
    if(p.error||p.status!==0) errors.push(`${name}: ${p.error?.message || (p.stderr+p.stdout).slice(-6000)}`);
  }
  const scc=await new VerificadorSCC(root).runAudits();
  checks.push({name:'scc',exit:scc.valid?0:1});
  errors.push(...scc.errors.map(e=>`${e.code}: ${e.message} ${(e.affected_files||[]).join(', ')}`));
  return {valid:!errors.length,checks,errors};
}
export async function checkClosure(root,id) {
  const before=inventory(root);
  const turnCheck=id?checkTurn(root,id):checkDocuments(root);
  const environment=await environmentChecks(root,turnCheck.turn?.scope||'documents');
  const after=inventory(root);
  const errors=[...turnCheck.errors,...environment.errors];
  if(changes(before,after).length) errors.push('Escriptura concurrent o comprovació amb efectes laterals');
  return {valid:!errors.length,mode:'check',turn_id:id||null,state:turnCheck.turn?.state||null,errors,checks:environment.checks,snapshot:sha(JSON.stringify(after))};
}
async function main() {
  const o=options(),root=path.resolve(o.arrel||ROOT),id=o['turn-id'];
  if(o.check&&(o.close||o.verify)) throw new Error('--check és incompatible amb --close/--verify');
  if(o.close&&o.verify) throw new Error('Selecciona --close o --verify');
  if((o.close||o.verify)&&!id) throw new Error('Cal --turn-id per verificar o tancar');
  const execute=async()=>{
  let result=await checkClosure(root,id);
  if(result.valid&&(o.close||o.verify)) {
    // The expensive checks ran above. Recheck their exact input snapshot under the lock.
    const checkedSnapshot=result.snapshot;
    result=sealTurn(root,id,()=>{
      if(checkedSnapshot!==sha(JSON.stringify(inventory(root)))) return {valid:false,errors:['Canvis després de les proves']};
      return result;
    },{close:!!o.close});
  }
  return result;
  };
  const result=o.close ? await withSignedLedger(root,execute) : await execute();
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.valid?0:1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(e=>{console.error(JSON.stringify({valid:false,errors:[e.message]}));process.exitCode=1;});
}
