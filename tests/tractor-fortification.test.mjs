import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {knownRead} from '../tooling/gates/mutation-policy.mjs';
import {checkOlivera, checkPayload, avui} from '../tooling/gates/porta-olivera.mjs';
import {prepareRecipe, digest, confined} from '../scripts/immunitari/plaquetes-plan.mjs';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
 const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-tractors-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true})); return root;
}
function put(root,file,text) {const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);}
const bash = (command,cwd) => ({tool_name:'Bash',cwd,tool_input:{command}});
test('nom de tractor/npm no implica lectura; totes les vies de mutació conegudes fallen',t=>{
 const root=fixture(t);
 put(root,'package.json', JSON.stringify({scripts:{'porta:segella':'node tooling/gates/segella.mjs','porta:sanejador':'node tooling/gates/saneja-callback.mjs'}}));
 for (const cmd of ['node tooling/gates/segella.mjs --update','node tooling/gates/design_guard.mjs --baseline','node tooling/gates/porta-olivera.mjs --arxiva','npm run porta:sanejador','npm run porta','node tooling/gates/inventat.mjs','node tooling/wiki/document.mjs create','node tooling/gates/segella.mjs\npwd','node tooling/gates/segella.mjs --output /tmp/x','git diff --ext-diff']) assert.equal(knownRead(bash(cmd,root),root),false,cmd);
 assert.equal(knownRead(bash('node tooling/gates/segella.mjs',root),root),true);
 assert.equal(knownRead(bash('npm run porta:segella',root),root),true);
 assert.equal(knownRead(bash('node tooling/gates/segella.mjs',os.tmpdir()),root),false);
 put(root,'package.json',JSON.stringify({scripts:{'porta:segella':'node tooling/gates/segella.mjs','preporta:segella':'mutate'}}));
 assert.equal(knownRead(bash('npm run porta:segella',root),root),false);
});
function olivera(root) {
 const dir='_wiki_de_poble/04_escriptori';
 const file=`${avui()}_1200_pla_implementacio_prova.md`;
 put(root,`${dir}/${file}`,'# Pla\n');put(root,`${dir}/00_index_escriptori.md`,`- [[${file.slice(0,-3)}]]\n`);
 return dir;
}
test('Olivera unifica àncores, limita preflight a secció0 i valida pla exacte',t=>{
 const root=fixture(t),dir=olivera(root);
 const content='## 0. Abans de generar\n- [x] Fet\n## 1. Tasques\n- [ ] Executar tasca\n';
 assert.equal(checkOlivera(root,{contingut:content}).valid,true);
 assert.equal(checkOlivera(root,{contingut:content.replace('[x]','[ ]')}).valid,false);
 put(root,`${dir}/${avui()}_1300_informe_sense_ancora.md`,'# Prova');
 assert.match(checkOlivera(root).errors.join(' '),/Sense àncora/);
 const cli=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-olivera.mjs'),'--informe'],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'});
 assert.equal(cli.status,1);
 fs.unlinkSync(path.join(root,dir,`${avui()}_1300_informe_sense_ancora.md`));
 fs.appendFileSync(path.join(root,dir,'00_index_escriptori.md'),'\n- [[fantasma]]\n');
 assert.match(checkOlivera(root).errors.join(' '),/Àncores a documents absents/);
 fs.renameSync(path.join(root,dir,`${avui()}_1200_pla_implementacio_prova.md`),path.join(root,dir,`${avui()}_1200_pla_irrellevant.md`));
 assert.match(checkOlivera(root).errors.join(' '),/Cap Pla/);
});
test('Olivera rebutja shell sense contingut i payload incomplet/corrupte',t=>{
 const root=fixture(t);const dir=olivera(root);
 assert.equal(checkPayload({},root).code,2);
 assert.equal(checkPayload({tool_name:'inventat',tool_input:{}},root).code,2);
 assert.equal(checkPayload(bash(`echo x > ${dir}/${avui()}_1300_prompt_prova.md`,root),root).code,2);
 const run=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-olivera.mjs')],{cwd:root,env:{...process.env,SDP_ARREL:root},input:'{',encoding:'utf8'});
 assert.equal(run.status,2);
});
function recipe(root, mutate=x=>x) {
 const source='_wiki_de_poble/02_saber/source.md',body='[[desaparegut]]\n';put(root,source,body);
 const doc=mutate({id:'R-test',data:'2026-09-24T00:00:00Z',operacions:[{id:'OP-001',tipus:'LAPIDA',fitxer:source,objectius:['desaparegut'],hashFont:digest(body)}]});
 const text=JSON.stringify(doc);
 put(root,'.immunitari/config.json',JSON.stringify({vault:'_wiki_de_poble',memorialLapides:'memorial',indexAdopcio:'index'}));
 put(root,'.immunitari/receptes/test.json',text);
 put(root,'.immunitari/aprovacions/test.aprovat.json',JSON.stringify({recepta:'test',hash:digest(text)}));
 return {source,body};
}
test('Plaquetes plan és pur, determinista, CAS complet i adopció conserva font en lease',t=>{
 const root=fixture(t);const {source,body}=recipe(root);
 const plan=prepareRecipe(root,'test',{session:'fixture'});
 assert.deepEqual(plan,prepareRecipe(root,'test',{session:'fixture'}));
 assert.equal(plan.files.find(f=>f.path===source).before,digest(body));
 assert.match(plan.files.find(f=>f.path===source).content,/memorial/);
 assert.equal(fs.existsSync(path.join(root,'_wiki_de_poble/memorial.md')),false);
 assert.equal(fs.readFileSync(path.join(root,source),'utf8'),body);
 recipe(root,r=>({...r,operacions:r.operacions.map(op=>({...op,tipus:'ADOPTA'}))}));
 const adoption=prepareRecipe(root,'test');
 assert.equal(adoption.files.find(f=>f.path===source).content,body);
 assert.match(adoption.files.find(f=>f.path==='_wiki_de_poble/index.md').content,/\[\[source\]\]/);
});
test('Plaquetes nega recepta modificada després d’aprovació i qualsevol font mutada',t=>{
 const root=fixture(t);const {source}=recipe(root);
 fs.appendFileSync(path.join(root,'.immunitari/receptes/test.json'),' ');
 assert.throws(()=>prepareRecipe(root,'test'),/Aprovació divergent/);
 recipe(root);put(root,source,'Contingut nou');assert.throws(()=>prepareRecipe(root,'test'),/Hash font/);
 recipe(root,r=>({...r,operacions:r.operacions.map(op=>({...op,hashFont:undefined,tipus:'ADOPTA'}))}));
 assert.throws(()=>prepareRecipe(root,'test'),/Hash font/);
});
test('Plaquetes nega traversal, symlink, hardlink, zona humana i operacions destructives sense efectes',t=>{
 const root=fixture(t);const {source,body}=recipe(root);
 assert.throws(()=>prepareRecipe(root,'../test'),/ID/);
 for(const bad of ['../escape','/tmp/file','_wiki_de_poble/../escape','_wiki_de_poble/04_escriptori/01_produccio/file']) assert.throws(()=>confined(root,bad,{wiki:true,missing:true}));
 fs.symlinkSync(path.join(root,'_wiki_de_poble/02_saber'),path.join(root,'_wiki_de_poble/link'));
 assert.throws(()=>confined(root,'_wiki_de_poble/link/source.md',{wiki:true}),/Symlink/);
 fs.linkSync(path.join(root,source),path.join(root,'_wiki_de_poble/hard.md'));
 assert.throws(()=>prepareRecipe(root,'test'),/hardlink/);fs.unlinkSync(path.join(root,'_wiki_de_poble/hard.md'));
 recipe(root,r=>({...r,operacions:r.operacions.map(op=>({...op,tipus:'DESTRUEIX'}))}));
 assert.throws(()=>prepareRecipe(root,'test'),/readOnly.*zero efectes/);
 assert.equal(fs.readFileSync(path.join(root,source),'utf8'),body);
});
