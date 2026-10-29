import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const SCRIPT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../scripts/generate-prompt.sh');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-legacy-prompt-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const template=path.join(root,'_wiki_de_poble/03_actuar/plantilles/prompt_consell.md'),desk=path.join(root,'_wiki_de_poble/04_escriptori');
 fs.mkdirSync(path.dirname(template),{recursive:true});fs.mkdirSync(desk,{recursive:true});fs.writeFileSync(template,'# Synthetic council template\n');return{root,template,desk};
}
for(const args of [[],['prova'],['--title','Prova de qualitat','--type','PROMPT'],['--help','prova'],['--help'],['-h']])test('retired prompt generator refuses '+JSON.stringify(args),t=>{
 const f=fixture(t),r=spawnSync('/bin/sh',[SCRIPT,...args],{cwd:f.root,encoding:'utf8',timeout:5000});
 assert.equal(r.status,2,r.stdout+r.stderr);assert.match(r.stderr,/retirat/i);assert.match(r.stderr,/tooling\/wiki\/document\.mjs/);assert.equal(r.stdout,'');assert.deepEqual(fs.readdirSync(f.desk),[]);assert.equal(fs.readFileSync(f.template,'utf8'),'# Synthetic council template\n');
});
test('SG-02 conserva la làpida única sense recuperar el generador antic',()=>{const script=fs.readFileSync(SCRIPT,'utf8');assert.match(script,/SG-02/);assert.match(script,/SDP-LOCK/);assert.doesNotMatch(script,/^\s*(?:cp|sed)\s/m);});
