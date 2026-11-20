/** A captured SQL proof is valid only for exact bytes + mandatory live tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CONTRACTE_R3215 as C,verificaProvaR6R3215,DIAGNOSTICS_R6_PROVATS} from '../tooling/lib/rls-prova-postgres-r3215.mjs';
const ROOT=fileURLToPath(new URL('..',import.meta.url));
const gate=fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs',import.meta.url));
const source=fs.readFileSync(new URL('../'+C.sql,import.meta.url),'utf8');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'r3215-rls-proof-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const name of[C.sql,C.certificate,...Object.keys(C.companions)]){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.copyFileSync(path.join(ROOT,name),path.join(root,name));}
 fs.mkdirSync(path.join(root,'tooling/tests'),{recursive:true});
 fs.writeFileSync(path.join(root,'tooling/tests/node-suite-manifest.json'),JSON.stringify({requiredPrimary:[...C.requiredTests],files:C.requiredTests.map(p=>({path:p,suite:'primary'}))}));
 return root;
}
const verify=root=>verificaProvaR6R3215(C.sql,{root,sql:source});
const audit=root=>spawnSync(process.execPath,[gate],{cwd:root,encoding:'utf8'});
test('R32.15 exact SQL proof is visible and only the two reviewed R6 diagnostics are discharged',t=>{
 const root=fixture(t),proof=verify(root);assert.equal(proof.valid,true);assert.equal(proof.nativeVersion,'18.6');assert.equal(proof.assertions,67);
 const result=audit(root);assert.equal(result.status,0,result.stdout);assert.match(result.stdout,/R6 prova local.*18\.6.*PGlite/);assert.match(result.stdout,/R1 detection-unknown/);
 assert.equal(DIAGNOSTICS_R6_PROVATS.length,2);
});
for(const file of[C.sql,C.certificate,...Object.keys(C.companions)])test('R32.15 drift in proof member fails closed: '+file,t=>{
 const root=fixture(t);fs.appendFileSync(path.join(root,file),'\n ');assert.equal(verify(root).valid,false);
 const result=audit(root);assert.equal(result.status,1,result.stdout);assert.match(result.stdout,/R6/);
});
test('R32.15 SQL analyzed by the gate must match the proof, not a later on-disk replacement',t=>{
 const root=fixture(t);assert.equal(verificaProvaR6R3215(C.sql,{root,sql:source+'\n-- unreviewed'}).valid,false);
});
for(const file of[C.certificate,'tests/r3215-definers-postgres.test.mjs','tooling/tests/node-suite-manifest.json'])test('R32.15 missing proof dependency fails closed: '+file,t=>{
 const root=fixture(t);fs.unlinkSync(path.join(root,file));assert.equal(verify(root).valid,false);assert.equal(audit(root).status,1);
});
for(const field of['requiredPrimary','files'])test('R32.15 mandatory test registration cannot be downgraded: '+field,t=>{
 const root=fixture(t),file=path.join(root,'tooling/tests/node-suite-manifest.json'),manifest=JSON.parse(fs.readFileSync(file,'utf8'));manifest[field]=[];fs.writeFileSync(file,JSON.stringify(manifest));assert.equal(verify(root).valid,false);assert.equal(audit(root).status,1);
});
test('R32.15 proof cannot be borrowed by another SQL file or an added dynamic block',t=>{
 const root=fixture(t);assert.equal(verificaProvaR6R3215('supabase/snippets/other.sql',{root,sql:source}).valid,false);
 fs.writeFileSync(path.join(root,'supabase/snippets/other.sql'),"do $$ begin execute 'create function public.not_reviewed() returns int language sql security definer as $f$select 1$f$'; end $$;");const result=audit(root);assert.equal(result.status,1,result.stdout);assert.match(result.stdout,/R6.*other\.sql/);
});
test('R32.15 proof never suppresses R6 or other rules in a separate unreviewed migration',t=>{
 const root=fixture(t);fs.mkdirSync(path.join(root,'supabase/migrations'),{recursive:true});fs.writeFileSync(path.join(root,'supabase/migrations/20261119160000_unreviewed.sql'),'create function public.unreviewed() returns integer language sql security definer as $$select 1$$;');
 const result=audit(root);assert.equal(result.status,1,result.stdout);assert.match(result.stdout,/R6.*unreviewed/);
});
test('R32.15 symlink proof member is refused, even with identical target bytes',t=>{
 const root=fixture(t),name=Object.keys(C.companions)[0],target=path.join(root,name),saved=target+'.saved';fs.renameSync(target,saved);fs.symlinkSync(saved,target);assert.equal(verify(root).valid,false);
});
