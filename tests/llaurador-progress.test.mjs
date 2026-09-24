import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(ROOT,'tooling/wiki/llaurador_indexs.mjs');
function fixture(t, files){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-llaurador-progress-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const [file,body] of Object.entries(files)){
  fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),body);
 }
 return root;
}
function run(root, flags=[]){return spawnSync(process.execPath,[script,`--arrel=${root}`,...flags],{cwd:root,encoding:'utf8',timeout:3000});}
const index='_wiki_de_poble/00_index.md';
test('índexs orfes amb cicle s’adopten des de l’àncora sense repetir ni escriure en dry-run',t=>{
 const root=fixture(t,{[index]:'# Arrel\n','.agents/README.md':'# Agents\n[[.agents/index]]\n','.agents/index.md':'# Índex\n[[.agents/README]]\n'});
 const before=fs.readFileSync(path.join(root,index),'utf8');
 const r=run(root,['--json']);assert.equal(r.status,0,r.stderr);
 const result=JSON.parse(r.stdout);
 assert.equal(result.abastables,result.documents);
 assert.equal(result.voltes,1);
 assert.deepEqual(Object.keys(result.adopcions),[index]);
 assert.equal(result.adopcions[index].length,1);
 assert.ok(['.agents/README.md','.agents/index.md'].includes(result.adopcions[index][0]));
 assert.equal(fs.readFileSync(path.join(root,index),'utf8'),before);
 const check=run(root,['--check']);assert.equal(check.status,1,'el pla en memòria no és un graf escrit');
 const apply=run(root,['--escriu']);assert.equal(apply.status,0,apply.stderr);
 const after=fs.readFileSync(path.join(root,index),'utf8');
 const healthy=run(root,['--check']);assert.equal(healthy.status,0,healthy.stderr);
 assert.equal(run(root,['--escriu']).status,0);
 assert.equal(fs.readFileSync(path.join(root,index),'utf8'),after,'segona passada idempotent');
});
test('prefereix índex local abastable i reconecta una cadena d’índexs sense cicle',t=>{
 const local='_wiki_de_poble/02_saber/00_index_saber.md';
 const root=fixture(t,{[index]:`# Arrel\n[[02_saber/00_index_saber]]\n`,[local]:'# Saber\n','_wiki_de_poble/02_saber/nota.md':'# Nota\n','.agents/README.md':'# Agents\n','.agents/index.md':'# Índex\n'});
 const r=run(root,['--json']);assert.equal(r.status,0,r.stderr);const result=JSON.parse(r.stdout);
 assert.equal(result.abastables,result.documents);
 assert.ok(result.voltes<=result.documents);
 assert.deepEqual(result.adopcions[local],['_wiki_de_poble/02_saber/nota.md']);
 const first=result.adopcions[index][0];
 assert.ok(['.agents/README.md','.agents/index.md'].includes(first));
 const second=first==='.agents/README.md'?'.agents/index.md':'.agents/README.md';
 assert.ok(result.adopcions[first].includes(second));
});
test('sense àncora falla abans de modificar i un enllaç penjat no queda ocult per adopcions',t=>{
 const absent=fixture(t,{'.agents/index.md':'# Índex\n'});
 assert.equal(run(absent,['--escriu']).status,2);
 assert.equal(fs.readFileSync(path.join(absent,'.agents/index.md'),'utf8'),'# Índex\n');
 const broken=fixture(t,{[index]:'# Arrel\n[[no_existeix]]\n'});
 assert.equal(run(broken,['--check']).status,1);
});
