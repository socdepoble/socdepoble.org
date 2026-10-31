import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { analitzaVigilant, codiVigilant, readOnly } from '../tooling/gates/tractor-vigilant.mjs';
function fixture(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-vigilant-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {root,write:(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);}};}
const regla=(r,id)=>r.comprovacions.find(c=>c.id===id);
test('sense fonts no acredita verd; import és només lectura',t=>{const {root}=fixture(t);assert.equal(readOnly,true);const r=analitzaVigilant(root);assert.equal(regla(r,'VA1').estat,'no-mesurat');assert.ok(r.recompte['no-mesurat']>0);});
test('VIG01/02: fitxers sensibles i executables només s’anomenen, no es revelen ni es modifiquen',t=>{
 const {root,write}=fixture(t);write('public/.env','NO_REVELAR_EL_VALOR');write('public/assets/a.php','<?php');
 const abans=fs.readFileSync(path.join(root,'public/.env'));const r=analitzaVigilant(root);
 assert.equal(regla(r,'VIG-01').estat,'falla');assert.equal(regla(r,'VIG-02').estat,'falla');assert.equal(codiVigilant(r),0);
 assert.ok(!JSON.stringify(r).includes('NO_REVELAR_EL_VALOR'));assert.deepEqual(fs.readFileSync(path.join(root,'public/.env')),abans);
});
test('guarda PHP i permisos REST absents bloquegen; patrons nous són avís',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/a.php',"<?php register_rest_route('sdp','/x', []); shell_exec($x);");const r=analitzaVigilant(root);
 assert.equal(regla(r,'VA1').estat,'falla');assert.equal(regla(r,'VA2').estat,'falla');assert.equal(regla(r,'VIG-03').estat,'falla');assert.equal(codiVigilant(r),1);
});
test('inventari verifica hash i fitxers orfes, i no seguix symlinks',t=>{
 const {root,write}=fixture(t);write('dist/a.txt','abc');write('dist/sdp-inventari.json',JSON.stringify({fitxers:[{cami:'a.txt',sha256:createHash('sha256').update('abc').digest('hex')}]}));
 assert.equal(regla(analitzaVigilant(root),'VIG-04').estat,'ok');write('dist/orfe.txt','orfe');assert.equal(regla(analitzaVigilant(root),'VIG-04').estat,'falla');
 fs.symlinkSync('/etc',path.join(root,'dist/enllac'));assert.equal(regla(analitzaVigilant(root),'VIG-SYMLINK').estat,'no-mesurat');
});
test('CLI JSON sense xarxa: arrel absent i mode viu es rebutgen',t=>{
 const {root}=fixture(t);const script=path.resolve('tooling/gates/tractor-vigilant.mjs');const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
 assert.equal(JSON.parse(run('--json',`--arrel=${root}`).stdout).mode,'estatic');assert.equal(run('--viu').status,2);assert.equal(run('--arrel=/no-existix-sdp').status,2);
});
/* F2 / R2-COR-09 (revisió de la Ronda 2): una carpeta il·legible no tomba la diagnosi de cron_higiene; el Vigilant hi queda no-mesurat. */
test('cron_higiene: un EACCES dins de public/ deixa el Vigilant no-mesurat i la diagnosi continua',async t=>{
 const {root}=fixture(t);const tancat=path.join(root,'public/tancat');fs.mkdirSync(tancat,{recursive:true});
 const {diagnosi}=await import('../tooling/higiene/cron_higiene.mjs');
 let d;fs.chmodSync(tancat,0);try{d=diagnosi(root);}finally{fs.chmodSync(tancat,0o755);}
 assert.equal(d.vigilant.esquema,'sdp.vigilant.v1');assert.equal(d.vigilant.estat,'no-mesurat');assert.equal(d.vigilant.error,'EACCES');
});
