import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildResolver,resolveLink} from '../tooling/wiki/core/parse.mjs';
import {resolveDocumentLink} from '../tooling/lib/document-links.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const INDEX='_wiki_de_poble/00_index.md',NOTE='_wiki_de_poble/02_saber/nota.md';
function fixture(t,files={}){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-t11-gates-')));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const put=(rel,body)=>{const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);return file;};for(const [n,b]of Object.entries(files))put(n,b);return {root,put};}
function llaura(root,...flags){return spawnSync(process.execPath,[path.join(ROOT,'tooling/wiki/llaurador_indexs.mjs'),`--arrel=${root}`,...flags],{cwd:root,encoding:'utf8',timeout:5000});}
for(const [name,example]of [['tilde','~~~markdown\n[[02_saber/nota]]\n~~~'],['four ticks','````markdown\n```\n[[02_saber/nota]]\n````'],['comment','<!--\n[[02_saber/nota]]\n-->'],['inline multiline','``literal\n[[02_saber/nota]]\nfinal``']]){
 test(`arestes d’exemple ${name} no acrediten abast real`,t=>{const f=fixture(t,{[INDEX]:'# Índex\n'+example+'\n',[NOTE]:'# Nota real\n'});const result=llaura(f.root,'--check');assert.equal(result.status,1,result.stdout+'\n'+result.stderr);assert.equal(fs.readFileSync(path.join(f.root,INDEX),'utf8'),'# Índex\n'+example+'\n');});
}
for(const [name,example]of [['tilde','~~~markdown\n[[absent]]\n~~~'],['comment','<!--\n[[absent]]\n-->'],['four ticks','````markdown\n```\n[[absent]]\n````']]){
 test(`referència fictícia ${name} no provoca BROKEN LINK`,t=>{const f=fixture(t,{[INDEX]:'# Índex\n'+example+'\n'});const result=llaura(f.root,'--check');assert.equal(result.status,0,result.stdout+'\n'+result.stderr);});
}
test('enllaç real continua acreditant abast i un destí real absent continua roig',t=>{const f=fixture(t,{[INDEX]:'# Índex\n[[02_saber/nota]]\n',[NOTE]:'# Nota\n'});assert.equal(llaura(f.root,'--check').status,0);f.put(INDEX,'# Índex\n[[absent]]\n[[02_saber/nota]]\n');assert.equal(llaura(f.root,'--check').status,1);});
test('adopció real conserva el bloc i idempotència amb exemples al costat',t=>{const f=fixture(t,{[INDEX]:'# Índex\n~~~markdown\n[[absent]]\n~~~\n',[NOTE]:'# Nota\n'});assert.equal(llaura(f.root,'--escriu').status,0);const before=fs.readFileSync(path.join(f.root,INDEX),'utf8');assert.equal(llaura(f.root,'--check').status,0);assert.equal(llaura(f.root,'--escriu').status,0);assert.equal(fs.readFileSync(path.join(f.root,INDEX),'utf8'),before);});
test('resolutors compartixen prioritat local davant d’un homònim en arrel',t=>{const f=fixture(t,{'Note.md':'# Arrel','folder/Note.md':'# Local','folder/source.md':'# Font'}),docs=['Note.md','folder/Note.md','folder/source.md'].map(relPath=>({relPath,content:fs.readFileSync(path.join(f.root,relPath),'utf8')})),source=docs[2],link={kind:'wiki',target:'Note'};const graph=resolveLink(link,source,buildResolver(docs)),disk=resolveDocumentLink(link,path.join(f.root,source.relPath),docs.map(d=>path.join(f.root,d.relPath)),f.root);assert.equal(graph.status,'resolved');assert.equal(graph.doc.relPath,path.relative(f.root,disk));assert.equal(graph.doc.relPath,'folder/Note.md');});
test('homònims globals sense candidat local continuen ambigus',()=>{const docs=['a/Note.md','b/Note.md'].map(relPath=>({relPath,content:'# Nota'}));assert.equal(resolveLink({kind:'wiki',target:'Note'},{relPath:'source.md'},buildResolver(docs)).status,'ambiguous');});
function arrelFixture(t,body,command){const f=fixture(t,{'.agents/AGENTS.md':'# Fixture','package.json':JSON.stringify({type:'module',scripts:command?{check:command}:{}}),'tooling/gates/inert.test.mjs':body});for(const p of ['tooling/gates/tractor-arrel.mjs','tooling/lib/arrel.mjs'])f.put(p,fs.readFileSync(path.join(ROOT,p),'utf8'));const result=spawnSync(process.execPath,[path.join(f.root,'tooling/gates/tractor-arrel.mjs'),'--json'],{cwd:f.root,env:{...process.env,SDP_ARREL:f.root},encoding:'utf8'});assert.ok([0,1].includes(result.status),result.stderr);return JSON.parse(result.stdout);}
test('sufix test no eximix una porta inert declarada en package.json',t=>{const r=arrelFixture(t,'export const inert=true;\n','node tooling/gates/inert.test.mjs');assert.ok(r.infraccions.some(i=>i.llei==='A4'&&i.fitxer.endsWith('inert.test.mjs')));});
test('fitxer de proves no declarat i suite Node declarada conserven exempció justificada',t=>{assert.equal(arrelFixture(t,'export const fixture=true;\n').ok,true);assert.equal(arrelFixture(t,"import test from 'node:test';\ntest('control',()=>{});\n",'node --test tooling/gates/inert.test.mjs').ok,true);});
