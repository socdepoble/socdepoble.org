import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {VerificadorSCC} from '../tooling/gates/verificador-scc.mjs';
import {REPO} from './helpers/documental.mjs';
const desk='_wiki_de_poble/04_escriptori';
function setup(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp scc '));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const put=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};
 put('_wiki_de_poble/00_index.md','[[00_index_escriptori]]');put(`${desk}/00_index_escriptori.md`,'');return {root,put};
}
test('SCC usa fixtures privades: orfe roig, àncora real verda',async t=>{
 const {root,put}=setup(t);put(`${desk}/fact.md`,'# Fact');
 assert.equal((await new VerificadorSCC(root).runAudits()).valid,false);
 put(`${desk}/00_index_escriptori.md`,'[Fact](fact.md)');
 const result=await new VerificadorSCC(root).runAudits();assert.equal(result.valid,true,JSON.stringify(result));assert.equal(result.filesChecked,3);
});
test('ruta falsa no resol per basename',async t=>{
 const {root,put}=setup(t);put(`${desk}/fact.md`,'# Fact');put(`${desk}/00_index_escriptori.md`,'[Fact](wrong/fact.md)');
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.code==='LINK_INVALID'));assert.ok(r.errors.some(e=>e.code==='ESCRIPTORI_UNANCHORED'));
});
test('homònims no compartixen arestes; wikilink ambigu és error',async t=>{
 const {root,put}=setup(t);put(`${desk}/a/fact.md`,'# A');put(`${desk}/b/fact.md`,'# B');put(`${desk}/00_index_escriptori.md`,'[[fact]]');
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.message.includes('ambigu')));assert.equal(r.errors.filter(e=>e.code==='ESCRIPTORI_UNANCHORED').length,2);
});
test('HTML i binari humans requerixen àncora sense llegir el contingut',async t=>{
 const {root,put}=setup(t);put(`${desk}/01_produccio/demo.html`,'html');put(`${desk}/01_produccio/raw.bin`,Buffer.from([0,255]));
 let r=await new VerificadorSCC(root).runAudits();assert.equal(r.errors.filter(e=>e.code==='ESCRIPTORI_UNANCHORED').length,2);
 put(`${desk}/00_index_escriptori.md`,'[HTML](01_produccio/demo.html)\n[Binari](01_produccio/raw.bin)');r=await new VerificadorSCC(root).runAudits();assert.equal(r.valid,true,JSON.stringify(r));
});
test('enllaç fora de l’arrel i symlink fallen explícitament',async t=>{
 const {root,put}=setup(t);put(`${desk}/00_index_escriptori.md`,'[fora](../../../outside.md)');
 fs.symlinkSync(path.join(root,'_wiki_de_poble/00_index.md'),path.join(root,desk,'alias.md'));
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.code==='SCC_SYMLINK'));assert.ok(r.errors.some(e=>e.code==='LINK_INVALID'));
});
test('CLI per symlink i espais audita i retorna resultat estructurat',t=>{
 const {root}=setup(t);const aliasDir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp alias '));t.after(()=>fs.rmSync(aliasDir,{recursive:true,force:true}));const alias=path.join(aliasDir,'alias repo');fs.symlinkSync(REPO,alias);
 const r=spawnSync(process.execPath,[path.join(alias,'tooling/gates/verificador-scc.mjs'),root],{encoding:'utf8'});
 assert.notEqual(r.stdout+r.stderr,'');assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).filesChecked,2);
});
test('índex absent o I/O fallida no produeix verd buit',async t=>{
 const {root}=setup(t);fs.unlinkSync(path.join(root,desk,'00_index_escriptori.md'));fs.mkdirSync(path.join(root,desk,'00_index_escriptori.md'));
 const r=await new VerificadorSCC(root).runAudits();assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.code==='INDEX_NOT_FOUND'));
});
test('wikilink amb ../ es resol des de l’origen sense fals positiu d’eixida',async t=>{
 const {root,put}=setup(t);put('_wiki_de_poble/10_actes/fact.md','# Fact');put(`${desk}/00_index_escriptori.md`,'[[../10_actes/fact.md]]');
 const r=await new VerificadorSCC(root).runAudits();assert.equal(r.valid,true,JSON.stringify(r));
});
