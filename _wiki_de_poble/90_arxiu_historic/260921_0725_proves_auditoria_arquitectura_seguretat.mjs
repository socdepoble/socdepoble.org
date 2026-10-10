#!/usr/bin/env node
/** Reproduccions locals. No modifica el repositori ni usa la xarxa.
 * Executar: node 260921_0725_proves_auditoria_arquitectura_seguretat.mjs
 * PASS significa «defecte reproduït», no «seguretat certificada».
 * Extrau únicament el BUNDLE verificat a un temporal i conserva les fixtures.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const home = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.join(home, '_arxiu_wiki_de_poble/260921_0314_BUNDLE_null.md');
const bytes = await fs.readFile(bundle);
const digest = b => createHash('sha256').update(b).digest('hex');
assert.equal(digest(bytes),'1f601c16bc55874eaf5d76f2f79f0ddbcc5c34fc3e66c079113921fb7f5668cd');
assert.ok(bytes.toString().trimEnd().endsWith('<<<FI_DEL_BUNDLE>>>'));
const text=bytes.toString();
const manifest=JSON.parse(text.split('```json\n')[1].split('\n```')[0]);
const tmp=await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(),'sdp-auditoria-reproduccio-')));
const snapshot=path.join(tmp,'snapshot');
await fs.mkdir(snapshot);
for (const item of manifest.fitxers) {
  assert.ok(!path.isAbsolute(item.ruta) && !item.ruta.split('/').includes('..'));
  const marker=Buffer.from(`## Fitxer: ${item.ruta}\n\n`);
  const at=bytes.indexOf(marker); assert.ok(at>=0);
  const start=bytes.indexOf(10,at+marker.length)+1;
  const body=bytes.subarray(start,start+item.bytes);
  assert.equal(digest(body),item.sha256,item.ruta);
  const dest=path.join(snapshot,item.ruta);
  await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,body);
}
const initialCwd=process.cwd();process.chdir(snapshot);
const imp=p=>import(pathToFileURL(path.join(snapshot,p)).href);
const {validarFrontmatter}=await imp('tooling/wiki/entropia_zero_router.mjs');
const {resolveInside,atomicWriteFile,withRollback}=await imp('tooling/wiki/core/safety.mjs');
const {verificaTancaSeguretat}=await imp('tooling/wiki/core/tanca.mjs');
const {buildIndex}=await imp('tooling/wiki/core/build_rag_index.mjs');
const results=[];
async function probe(name,run){try {const details=await run();results.push({name,defecte_reproduit:true,details});}catch(e){results.push({name,defecte_reproduit:false,error:e.message});}}
async function fixture(name){const p=path.join(tmp,name);await fs.mkdir(p,{recursive:true});return p;}
try {
 await probe('S05: tags invàlids acceptats',async()=>{
  const cases=[['inventat'],'not-an-array',[42],['core','core']];
  for(const tags of cases) assert.deepEqual(validarFrontmatter({type:'document',status:'esborrany',description:'Document de prova segur',tags}),[]);
  return cases;
 });
 await probe('S04: tanca eludida amb un altre cwd',async()=>{
  const target=path.join(snapshot,'tooling/wiki/core/mutation_kernel.mjs');
  process.chdir(tmp);try {verificaTancaSeguretat(target);}finally {process.chdir(snapshot);}
  return 'Target protegit acceptat; no s’ha escrit en el target';
 });
 await probe('S06: symlink i pare inexistent',async()=>{
  const root=await fixture('path/root'),outside=await fixture('path/outside');
  await fs.symlink(outside,path.join(root,'link'));
  await atomicWriteFile(resolveInside(root,'link/new/file.md'),'synthetic');
  assert.equal(await fs.readFile(path.join(outside,'new/file.md'),'utf8'),'synthetic');
  return 'Escriptura fora de root, dins del temporal privat';
 });
 await probe('S07: rollback conserva fitxer nou',async()=>{
  const root=await fixture('rollback');
  await assert.rejects(withRollback(root,'audit',async tx=>{await tx.write('new.md','synthetic');throw new Error('injected');}),/injected/);
  assert.equal(await fs.readFile(path.join(root,'new.md'),'utf8'),'synthetic');
  return 'new.md continua existint després de rollback';
 });
 await probe('S02: symlink extern indexat',async()=>{
  const root=await fixture('rag/root'),outside=await fixture('rag/outside');
  await fs.writeFile(path.join(outside,'private.md'),'---\ntype: document\nstatus: esborrany\ndescription: Document de prova segur\n---\ncanaryprivatxyz\n');
  await fs.symlink(path.join(outside,'private.md'),path.join(root,'linked.md'));
  const index=await buildIndex(root);assert.ok(index.inverted.canaryprivatxyz);
  return index.docs;
 });
 await probe('S08: RLS desactivat amb porta verda',async()=>{
  const root=await fixture('rls');await fs.mkdir(path.join(root,'supabase'));
  await fs.writeFile(path.join(root,'supabase/demo.sql'),'create table public.demo (id integer);\nalter table public.demo enable row level security;\ncreate policy all_read on public.demo for select to authenticated using (1=1);\ngrant select on public.demo to authenticated;\nalter table public.demo disable row level security;\n');
  const r=spawnSync(process.execPath,[path.join(snapshot,'tooling/gates/tractor-rls.mjs')],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);return r.stdout.trim();
 });
 await probe('S04: ressegellat sense rebut',async()=>{
  const root=await fixture('seal');await fs.mkdir(path.join(root,'.agents/skills/demo'),{recursive:true});
  const skill=path.join(root,'.agents/skills/demo/SKILL.md');await fs.writeFile(skill,'Synthetic first');
  const script=path.join(snapshot,'tooling/gates/segella.mjs');
  assert.equal(spawnSync(process.execPath,[script],{cwd:root}).status,0);
  await fs.writeFile(skill,'Synthetic changed');
  assert.equal(spawnSync(process.execPath,[script,'--update'],{cwd:root}).status,0);
  return 'Creació i actualització amb codi 0 sense lease';
 });
 await probe('S03: ACK antic elimina draft nou (mock IDB)',async()=>{
  const drafts=new Map();
  globalThis.indexedDB={open(){const req={};queueMicrotask(()=>{req.result={transaction(){const tx={objectStore(){return {put(v,k){drafts.set(k,v);queueMicrotask(()=>tx.oncomplete?.());},delete(k){drafts.delete(k);queueMicrotask(()=>tx.oncomplete?.());}};}};return tx;}};req.onsuccess();});return req;}};
  const {bgSaveManager}=await imp('src/sections/notes/GlobalSaveManager.js');
  const wait=ms=>new Promise(r=>setTimeout(r,ms));let finishA;
  const update=async(_id,p)=>p.content==='A'?await new Promise(r=>{finishA=r;}):({revision:2});
  const base=()=>({revision:0});const noop=()=>{};
  const a=bgSaveManager.enqueue('scope','note','content','A',base,update,noop,noop);
  await wait(650);
  const b=bgSaveManager.enqueue('scope','note','content','B',base,update,noop,noop);
  await wait(10);assert.equal(drafts.get('scope:note').content,'B');
  finishA({revision:1});await a;const after=drafts.get('scope:note');await b;
  assert.equal(after,undefined);delete globalThis.indexedDB;
  return 'B present abans de confirmar A; absent després';
 });
}finally {process.chdir(initialCwd);}
console.log(JSON.stringify({bundleSha256:digest(bytes),fitxersVerificats:manifest.fitxers.length,temporal:tmp,nota:'Les proves positives reprodueixen defectes del BUNDLE fixat; no certifiquen el checkout actual.',results},null,2));
if(results.some(r=>!r.defecte_reproduit))process.exitCode=1;
