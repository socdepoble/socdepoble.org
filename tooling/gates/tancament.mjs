#!/usr/bin/env node
import { CAMINS, esMain } from '../lib/arrel.mjs';
/** --check (default) is read-only. --verify/--close are explicit state mutations. */
import fs from 'node:fs';
import path from 'node:path';
import {withSignedLedger} from '../documental/ledger.mjs';
import { spawnSync } from 'node:child_process';
import { VerificadorSCC } from './verificador-scc.mjs';
import { sha } from '../documental/core.mjs';
import { ROOT, options } from '../documental/cli.mjs';
import { checkTurn, sealTurn, inventory, changes } from '../documental/turns.mjs';
import { checkDocuments } from './porta-documents.mjs';

// 261009: la porta Olivera de tancament va primer. Una Onada no deixa residus a la següent:
// amb --torn, la porta també avisa (o bloqueja, en fase «bloqueig») dels vius que només sosté el torn.
export async function environmentChecks(root,scope='documents',{turnId=null}={}) {
  const checks=[],errors=[];
  const commands=[['olivera',['tooling/gates/porta-olivera.mjs','--tancament',...(turnId?['--torn',turnId]:[])]],
    ['plantilles',['tooling/gates/porta-plantilles.mjs']],
    ['autoritat',['tooling/gates/porta-autoritat.mjs']],
    ['ledger',['tooling/verify-ledger.mjs']],
    ['segell',['tooling/gates/segella.mjs']],
    ['skills', ['tooling/brain/cataleg_skills.mjs','--check']],
    ['wiki', ['tooling/wiki/compile-wiki-to-app.mjs','--check','--strict']]];
  if(scope==='code') commands.push(['documental-tests',['--test','tests/documental.test.mjs','tests/porta-reflex.test.mjs','tests/fortificacio.test.mjs','tests/hooks-local.test.mjs','tests/security-chain.test.mjs','tests/verificador-scc.test.mjs','tests/git-hooks.test.mjs']]);
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
// R30 · Títol Termodinàmic suggerit (camp informatiu, mai bloquejant): `aammdd_hhmm_rXX_slug_curt`,
// derivat només del nom de l'última Acta Marmota de 10_actes. Mateix directori, mateix títol.
export const ACTES_MARMOTA=CAMINS.actes;
export const LLARGARIA_TITOL_XAT=70;
const ACTA_MARMOTA=/^(\d{6})_(\d{4})_acta_marmota_([a-z0-9_]+)\.md$/;
const PARAULES_DE_FARCIT=new Set(['acta','marmota','onada','i','de','del','dels','la','el','les','els','a','al','als','amb','per','en','d','l']);
export function titolXatDesDeActa(nom) {
  const m=ACTA_MARMOTA.exec(nom);
  if(!m) return null;
  const paraules=m[3].split('_').filter(Boolean);
  const onada=paraules.find((p)=>/^r\d{1,3}$/.test(p));
  let titol=[m[1],m[2],...(onada?[onada]:[])].join('_');
  for(const p of paraules) {
    if(p===onada||PARAULES_DE_FARCIT.has(p)) continue;
    if(titol.length+1+p.length>LLARGARIA_TITOL_XAT) break;
    titol+=`_${p}`;
  }
  return titol;
}
export function suggereixTitolXat(root) {
  let entrades;
  try { entrades=fs.readdirSync(path.join(root,ACTES_MARMOTA),{withFileTypes:true}); } catch { return null; }
  const actes=entrades.filter((e)=>e.isFile()&&ACTA_MARMOTA.test(e.name)).map((e)=>e.name).sort();
  return actes.length?titolXatDesDeActa(actes[actes.length-1]):null;
}
export async function checkClosure(root,id) {
  const before=inventory(root);
  const turnCheck=id?checkTurn(root,id):checkDocuments(root);
  const environment=await environmentChecks(root,turnCheck.turn?.scope||'documents',{turnId:id||null});
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
  console.log(JSON.stringify({...result,chat_title_suggestion:suggereixTitolXat(root)},null,2));
  process.exitCode=result.valid?0:1;
}
if(esMain(import.meta.url)) {
  main().catch(e=>{console.error(JSON.stringify({valid:false,errors:[e.message]}));process.exitCode=1;});
}
