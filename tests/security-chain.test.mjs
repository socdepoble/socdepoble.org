import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkLocal} from '../tooling/gates/hooks-local.mjs';
import {SOURCES} from '../tooling/brain/context-local.mjs';
import {fixture, REPO} from './helpers/documental.mjs';
import {verificaSegell} from '../tooling/gates/segella.mjs';
import {resegellaSiCal} from '../tooling/gates/segell-auto.mjs';
import {executeMutation} from '../tooling/gates/executor-mutacio.mjs';
import {inventory, changes} from '../tooling/documental/turns.mjs';
import {sha} from '../tooling/documental/core.mjs';
const put=(root,file,text)=>{const p=path.join(root,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);};
function rootFor(t) {
 const root=fs.realpathSync(fixture(t));
 for(const file of SOURCES) put(root,file,fs.readFileSync(path.join(REPO,file),'utf8'));
 put(root,'.agents/skills/a/SKILL.md','A0');put(root,'.agents/skills/b/SKILL.md','B0');
 verificaSegell(root,{update:true});return root;
}
const plan=()=>({schema:'sdp.mutation.v1',session:'fixture-session',operationId:'fixture-operation',files:[{path:'.agents/skills/a/SKILL.md',before:sha('A0'),content:'A1'}]});
const authorize=async()=>({claim:'fixture-claim',complete:async()=>{}});
for(const [name,input] of [['Bash',{command:'node -e "require(\'fs\').writeFileSync(\'x\',\'y\')"'}],['exec_command',{cmd:'python3 x.py'}],['write_stdin',{chars:'echo x > a'}],['mcp__unknown__write',{path:'x'}]]) test(`${name}: efectes opacs denegats`,t=>{
 assert.equal(checkLocal({tool_name:name,tool_input:input},rootFor(t)).code,2);
});
for(const file of ['.agents/skills/a/SKILL.md','.codex/hooks.json','_wiki_de_poble/04_escriptori/01_produccio/demo.html','_wiki_de_poble/04_escriptori/01_produccio/data.bin']) test(`Write bloquejat abans del filtre: ${file}`,t=>{
 const root=rootFor(t);assert.equal(checkLocal({tool_name:'Write',tool_input:{file_path:file,content:'x'}},root).code,2);
 const command=`*** Begin Patch\n*** Add File: ${file}\n+x\n*** End Patch`;
 assert.equal(checkLocal({tool_name:'apply_patch',tool_input:{command}},root).code,2);
});
test('symlink cap a governança conserva la política',t=>{
 const root=rootFor(t);fs.symlinkSync(path.join(root,'.agents'),path.join(root,'alias'));
 assert.equal(checkLocal({tool_name:'Write',tool_input:{file_path:'alias/skills/a/SKILL.md',content:'x'}},root).code,2);
});
test('C1: ruta declarada no resegella cap canvi alié',t=>{
 const root=rootFor(t),seal=fs.readFileSync(path.join(root,'.agents/SKILLS_SEAL.json'),'utf8');
 put(root,'.agents/skills/b/SKILL.md','B alié');put(root,'.agents/skills/a/SKILL.md','A eina');
 assert.throws(()=>resegellaSiCal('.agents/skills/a/SKILL.md',root),/Origen/);
 assert.equal(fs.readFileSync(path.join(root,'.agents/SKILLS_SEAL.json'),'utf8'),seal);
 assert.equal(verificaSegell(root).ok,false);
});
test('executor accepta només el conjunt exacte i deixa registre verificable',async t=>{
 const root=rootFor(t);const r=await executeMutation(root,plan(),authorize);
 assert.equal(r.valid,true);assert.equal(verificaSegell(root).ok,true);
 const log=path.join(root,'.agents/runtime/segell.log');
 assert.deepEqual(fs.readFileSync(log,'utf8').trim().split('\n').map(x=>JSON.parse(x).state),['prepared','verified','accepted']);
 fs.unlinkSync(path.join(root,'.agents/seal-transactions',`${r.id}.json`));assert.equal(verificaSegell(root).ok,false);
});
test('segell previ trencat denega abans del claim',async t=>{
 const root=rootFor(t);put(root,'.agents/skills/b/SKILL.md','alié');
 await assert.rejects(executeMutation(root,plan(),()=>{throw new Error('no ha d’arribar');}),/Segell previ/);
 assert.equal(fs.readFileSync(path.join(root,'.agents/skills/a/SKILL.md'),'utf8'),'A0');
});
test('fallada de traça no publica segell ni escriu targets',async t=>{
 const root=rootFor(t);fs.mkdirSync(path.join(root,'.agents/runtime/segell.log'),{recursive:true});
 await assert.rejects(executeMutation(root,plan(),authorize),/Traça no regular/);
 assert.equal(fs.readFileSync(path.join(root,'.agents/skills/a/SKILL.md'),'utf8'),'A0');
});
test('fallada després de l’efecte bloqueja tota acceptació i --update',async t=>{
 const root=rootFor(t);await assert.rejects(executeMutation(root,plan(),async()=>({claim:'claim',complete:async()=>{throw new Error('claim fallit');}})),/claim fallit/);
 assert.equal(verificaSegell(root).ok,false);
 assert.throws(()=>verificaSegell(root,{update:true}),/incompleta/);
});
test('canvi alié concurrent no queda segellat ni restaurat',async t=>{
 const root=rootFor(t);await assert.rejects(executeMutation(root,plan(),async()=>({claim:'claim',complete:async()=>put(root,'.agents/skills/b/SKILL.md','alié')})),/CAS final/);
 assert.equal(verificaSegell(root).ok,false);assert.equal(fs.readFileSync(path.join(root,'.agents/skills/b/SKILL.md'),'utf8'),'alié');
});
test('replay, CAS erroni i lock concurrent fallen',async t=>{
 const root=rootFor(t);put(root,'.agents/runtime/mutation.lock','locked');
 await assert.rejects(executeMutation(root,plan(),authorize),/EEXIST/);fs.unlinkSync(path.join(root,'.agents/runtime/mutation.lock'));
 await executeMutation(root,plan(),authorize);await assert.rejects(executeMutation(root,plan(),authorize),/CAS divergent/);
});
test('canvi .codex entra en snapshot de torn',t=>{
 const root=rootFor(t);put(root,'.codex/hooks.json','{}');const before=inventory(root);put(root,'.codex/hooks.json','{"changed":true}');assert.deepEqual(changes(before,inventory(root)),['.codex/hooks.json']);
});
test('post-hook corrupte o sense origen falla amb codi no-zero',t=>{
 const root=rootFor(t);for(const input of ['{','{}']) {
 const run=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/segell-auto.mjs')],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8',input});assert.equal(run.status,2);
 }
});
test('reconciliació no accepta --update cec i conserva evidència del CAS revisat',t=>{
 const root=rootFor(t),before=verificaSegell(root).hash;
 put(root,'.agents/skills/a/SKILL.md','A revisat');const current=verificaSegell(root).hash;
 assert.throws(()=>verificaSegell(root,{update:true}),/Reconciliació explícita/);
 assert.throws(()=>verificaSegell(root,{update:true,expectedHash:before,expectedPrevious:before,reason:'revisió'}),/Reconciliació explícita/);
 verificaSegell(root,{update:true,expectedHash:current,expectedPrevious:before,reason:'Diff revisat en fixture'});
 assert.equal(verificaSegell(root).ok,true);
});
test('fallada de registre en reconciliació conserva el segell anterior i bloqueja',t=>{
 const root=rootFor(t),before=verificaSegell(root).hash;put(root,'.agents/skills/a/SKILL.md','A revisat');const current=verificaSegell(root).hash;
 fs.mkdirSync(path.join(root,'.agents/runtime/segell.log'),{recursive:true});
 assert.throws(()=>verificaSegell(root,{update:true,expectedHash:current,expectedPrevious:before,reason:'Diff revisat'}));
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'.agents/SKILLS_SEAL.json'),'utf8')).hash,before);
 assert.equal(verificaSegell(root).ok,false);
});
