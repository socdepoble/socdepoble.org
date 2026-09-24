import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const put=(root,file,content)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);};
function fixture(t){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-arrel-test-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const file of ['tooling/gates/tractor-arrel.mjs','tooling/lib/arrel.mjs']) put(root,file,fs.readFileSync(path.join(REPO,file),'utf8'));
 put(root,'.agents/AGENTS.md','# Fixture');put(root,'package.json','{"type":"module","scripts":{}}');
 return root;
}
function audit(root){
 const run=spawnSync(process.execPath,[path.join(root,'tooling/gates/tractor-arrel.mjs'),'--json'],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'});
 assert.ok([0,1].includes(run.status),run.stderr);return JSON.parse(run.stdout);
}
test('reconeix CLI amb esMain del custodi i CLI top-level try, sense acceptar funció mai invocada',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/guarded.mjs',"import {esMain} from '../lib/arrel.mjs';\nif(esMain(import.meta.url)){console.log('checked');}\n");
 put(root,'tooling/gates/top-level.mjs',"try {\n  console.log('checked');\n} catch(e){process.exitCode=1;}\n");
 assert.equal(audit(root).ok,true);
 put(root,'tooling/gates/dead.mjs','export function main(){return true;}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('/dead.mjs')));
 put(root,'tooling/gates/dead.mjs','// if(esMain(import.meta.url)) main();\nexport function main(){return true;}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('/dead.mjs')));
 put(root,'tooling/gates/dead.mjs','const esMain=()=>false;\nif(esMain(import.meta.url)){console.log("never");}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('/dead.mjs')));
});
test('biblioteca declarada necessita exports/consumidor i deixa de ser biblioteca si script l’invoca',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/mutation-policy.mjs','export function mutationPath(){}\nexport function knownRead(){}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'));
 put(root,'tooling/gates/hooks-local.mjs',"import {mutationPath, knownRead} from './mutation-policy.mjs';\nconsole.log(mutationPath, knownRead);\nprocess.exit(0);\n");
 assert.equal(audit(root).ok,true);
 put(root,'package.json',JSON.stringify({type:'module',scripts:{bad:'node tooling/gates/mutation-policy.mjs'}}));
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('mutation-policy.mjs')));
});
test('pending transitori no exigix crear bloqueig; configuració persistent absent continua roja',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/check.mjs',"const pending='.agents/runtime/mutation.pending.json';\nconsole.log(pending);\nprocess.exit(0);\n");
 assert.equal(audit(root).ok,true);
 put(root,'tooling/gates/check.mjs',"const required='.agents/runtime/required-config.json';\nconsole.log(required);\nprocess.exit(0);\n");
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A5'));
});
