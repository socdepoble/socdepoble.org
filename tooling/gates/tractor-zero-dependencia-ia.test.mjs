import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { classificaEndpoint, inspectaContracte } from './tractor-zero-dependencia-ia.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'tooling/gates/tractor-zero-dependencia-ia.contracte.json'),'utf8'));
function fixture(t,sources,options={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-zero-ia-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  for(const [file,body]of Object.entries({'.husky/pre-commit':'#!/bin/sh\nnode src/main.js\n','package.json':'{"type":"module","scripts":{"build":"node src/main.js"}}',...sources})) {
    const abs=path.join(root,file);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,body);
  }
  return {root,contract:{...contract,surfaces:['src'],entries:['src/main.js'],criticalFunctions:[{file:'src/main.js',exports:['human']}],optionalAi:[{file:'src/optional.js',reason:'explicit assistant only'}],scripts:['build'],...options}};
}
const assistant="export async function ai(){return fetch('http://127.0.0.1:11434/api/generate')}";

test('outage selector distinguishes inference from human services on the same host',()=>{
  for(const endpoint of ['http://192.168.0.20:11434','http://192.168.0.20:11434/api/generate','https://api.openai.com/v1/responses','https://api.anthropic.com/v1/messages','https://generativelanguage.googleapis.com/v1beta/models','https://socdepoble.cat/api/v1/node0/veu/salut','https://socdepoble.cat/api/v1/node0/iaia/consultaIAIA','https://backend.invalid/functions/v1/iaia','/__iaia/traduir'])assert.equal(classificaEndpoint(endpoint),'ai',endpoint);
  for(const endpoint of ['http://192.168.0.20','http://192.168.0.20:80/index.html','https://socdepoble.cat/api/v1/node0/status','https://socdepoble.cat/api/v1/node0/auth/login','https://socdepoble.cat/api/v1/node0/private/enviaMissatge','/__iaia/botigues/publica-tot','/__iaia/consola.json','https://api.wordpress.org/plugins/info/1.2/','https://androidpublisher.googleapis.com/androidpublisher/v3/applications','https://oauth2.googleapis.com/token'])assert.equal(classificaEndpoint(endpoint),'non-ai',endpoint);
});

for(const [name,main]of Object.entries({
  direct:"export async function human(){return fetch('http://192.168.0.20:11434/api/generate')}",
  alias:"import {ai} from './optional.js';const proxy=ai;export async function human(){await proxy()}",
  namespace:"import * as optional from './optional.js';export async function human(){await optional.ai()}",
  require:"const {ai:infer}=require('./optional.js');export async function human(){await infer()}",
  dynamicImport:"export async function human(){const {ai}=await import('./optional.js');await ai()}",
  callback:"import {ai} from './optional.js';export async function human(){await Promise.resolve().then(()=>ai())}",
  shadowedExport:"import {ai} from './optional.js';export async function human(){await ai()} function unrelated(){function human(){return 1}}",
  localHelper:"import {ai} from './optional.js';export async function human(){async function helper(){await ai()} await helper()} function unrelated(){function helper(){return 1}}",
  transitive:"import {run} from '../tooling/helper.mjs';export async function human(){return run()}"
}))test(`negative calibrator rejects mandatory AI: ${name}`,t=>{
  const f=fixture(t,{'src/main.js':main,'src/optional.js':assistant,'tooling/helper.mjs':"export {ai as run} from '../src/optional.js'"});
  const r=inspectaContracte(f);assert.equal(r.ok,false);
  assert.ok(r.issues.some(i=>i.code==='AI_ON_CRITICAL_CALL_PATH'),JSON.stringify(r.issues));
});

test('positive calibrator imports an optional assistant without making it mandatory',t=>{
  const f=fixture(t,{'src/main.js':"import {ai} from './optional.js';export function human(){return 'desat'};export const assistant=ai;",'src/optional.js':assistant});
  const r=inspectaContracte(f);assert.equal(r.ok,true,JSON.stringify(r.issues));assert.ok(r.imports.some(i=>i.to==='src/optional.js'));assert.ok(r.sinks.some(s=>s.classification==='ai'));
});
test('module initialization cannot hide AI behind an optional module label',t=>{
  const f=fixture(t,{'src/main.js':"import './optional.js';export function human(){return 1}",'src/optional.js':"await fetch('https://api.openai.com/v1/responses')"});
  assert.ok(inspectaContracte(f).issues.some(i=>i.code==='AI_ON_CRITICAL_CALL_PATH'));
});
test('default anonymous exports and awaited module evaluation remain in the call graph',t=>{
  const f=fixture(t,{'src/main.js':"import ai from './optional.js';export async function human(){await ai()}",'src/optional.js':"export default async()=>fetch('https://api.openai.com/v1/responses')"});
  assert.ok(inspectaContracte(f).issues.some(i=>i.code==='AI_ON_CRITICAL_CALL_PATH'));
  fs.writeFileSync(path.join(f.root,'src/main.js'),"export async function human(){await import('./optional.js')}");
  fs.writeFileSync(path.join(f.root,'src/optional.js'),"await fetch('https://api.openai.com/v1/responses')");
  assert.ok(inspectaContracte(f).issues.some(i=>i.code==='AI_ON_CRITICAL_CALL_PATH'));
});
test('red to green: moving mandatory inference behind an explicit assistant restores human contract',t=>{
  const f=fixture(t,{'src/main.js':"import {ai} from './optional.js';export async function human(){await ai();return 'desat'}",'src/optional.js':assistant});
  assert.equal(inspectaContracte(f).ok,false);
  fs.writeFileSync(path.join(f.root,'src/main.js'),"import {ai} from './optional.js';export function human(){return 'desat'};export const assistant=ai;");
  assert.equal(inspectaContracte(f).ok,true);
});
test('computed imports/transports and callback dispatch remain visible, never universal proof',t=>{
  const f=fixture(t,{'src/main.js':"export async function human(){register(()=>1);await import(globalThis.moduleName);return fetch(globalThis.endpoint)}"});
  const r=inspectaContracte(f);assert.equal(r.status,'pass-with-limits');
  for(const kind of ['computed-import','configured-transport','callback-dispatch'])assert.ok(r.dynamic.some(i=>i.kind===kind),kind);
  assert.ok(r.limits.length);
});
test('nested package build/prebuild scripts are part of the contract',t=>{
  const f=fixture(t,{'src/main.js':"export function human(){return 1}",'package.json':JSON.stringify({scripts:{build:'npm run compile',compile:'node tooling/helper.mjs'}}),'tooling/helper.mjs':"await fetch('https://api.openai.com/v1/responses')"});
  const r=inspectaContracte(f);assert.equal(r.ok,false);assert.ok(r.scripts.some(s=>s.name==='compile'));assert.ok(r.issues.some(i=>i.file==='tooling/helper.mjs'));
});
test('npm pre/post lifecycle scripts cannot hide a mandatory AI build step',t=>{
  const f=fixture(t,{'src/main.js':"export function human(){return 1}",'package.json':JSON.stringify({scripts:{build:'npm run compile',compile:'node src/main.js',precompile:'node tooling/hidden.mjs'}}),'tooling/hidden.mjs':"await fetch('https://api.openai.com/v1/responses')"});
  const r=inspectaContracte(f);assert.equal(r.ok,false);assert.ok(r.scripts.some(s=>s.name==='precompile'));assert.ok(r.issues.some(i=>i.file==='tooling/hidden.mjs'));
});
test('literal inline node imports and command registries include the executed source',t=>{
  const f=fixture(t,{'src/main.js':"export function human(){return 1};export const steps=[{cmd:'node',args:['tooling/child.mjs']}];",'package.json':JSON.stringify({scripts:{build:'node -e "import(\'./tooling/rag.mjs\')"'}}),'tooling/rag.mjs':"export const deterministic=1;",'tooling/child.mjs':"await fetch('https://api.openai.com/v1/responses')"});
  const r=inspectaContracte(f);assert.ok(r.sources.includes('tooling/rag.mjs'));assert.ok(r.sources.includes('tooling/child.mjs'));assert.equal(r.ok,false);
});
test('Vite @/ aliases resolve to local code and missing aliases fail visibly',t=>{
  const f=fixture(t,{'src/main.js':"import {ai} from '@/optional.js';export async function human(){await ai()}",'src/optional.js':assistant});
  assert.ok(inspectaContracte(f).issues.some(i=>i.code==='AI_ON_CRITICAL_CALL_PATH'));
  fs.unlinkSync(path.join(f.root,'src/optional.js'));assert.ok(inspectaContracte(f).issues.some(i=>i.code==='IMPORT_MISSING'));
});
test('actual hook shell dispatch is deterministic with every command stubbed',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-zero-ia-hook-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const bin=path.join(root,'bin'),log=path.join(root,'dispatch.log');fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin,'node'),'#!/bin/sh\nprintf "%s\\n" "$*" >> "$SDP_FIXTURE_LOG"\nexit 0\n',{mode:0o700});
  const result=spawnSync('/bin/sh',[path.join(ROOT,'.husky/pre-commit')],{cwd:root,env:{PATH:bin,SDP_FIXTURE_LOG:log},encoding:'utf8',timeout:5000});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(fs.readFileSync(log,'utf8').trim().split('\n'),['tooling/gates/frontissa-contingut.mjs','tooling/gates/porta-taxonomia.mjs --staged','tooling/gates/porta-plantilla-viva.mjs --staged','tooling/gates/git-staged.mjs']);
});
test('narrow reusable outage preload refuses AI and preserves ordinary transports',()=>{
  const source=`globalThis.fetch=async()=>({fixture:true});await import('./tooling/gates/fixtures/zero-ia-outage.mjs');await import('node:assert/strict').then(async({default:a})=>{await a.rejects(fetch('http://192.168.0.20:11434/api/generate'));a.equal((await fetch('http://192.168.0.20')).fixture,true);a.equal((await fetch('https://socdepoble.cat/api/v1/node0/auth/login')).fixture,true);a.equal((await fetch('https://socdepoble.cat/__iaia/botigues/publica-tot')).fixture,true);a.equal(globalThis[Symbol.for('sdp.zero-ia.outage')].blocked,1);});`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',source],{cwd:ROOT,encoding:'utf8',timeout:5000});assert.equal(result.status,0,result.stderr);
});
test('read-only repository gate inspects real entrypoints, call chains and non-AI host routes',()=>{
  const r=inspectaContracte({root:ROOT});
  assert.equal(r.ok,true,JSON.stringify(r.issues));assert.ok(r.coverage.files>2000);assert.ok(r.coverage.directCallEdges>0);
  for(const file of ['src/main.jsx','src/natiu/entrada.jsx','src/embed.jsx','tooling/gates/frontissa-contingut.mjs','tooling/gates/porta-taxonomia.mjs','tooling/gates/porta-plantilla-viva.mjs','tooling/gates/git-staged.mjs','tooling/wiki/core/build_rag_index.mjs','scripts/botigues/puja-ios.mjs'])assert.ok(r.sources.includes(file),file);
  assert.ok(r.sinks.some(s=>s.file==='src/data/supabase/iaia.js'&&s.classification==='ai'));
  assert.ok(r.sinks.some(s=>s.endpoint==='/__iaia/botigues/publica-tot'&&s.classification==='non-ai'));
  assert.ok(r.dynamic.some(d=>d.file==='src/data/supabase/runtime.js'));
});
test('offline actual human transports and deployment scripts run against isolated fixtures',()=>{
  const result=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--config','tooling/gates/fixtures/zero-ia.vitest.config.mjs'],{cwd:ROOT,encoding:'utf8',timeout:90000,maxBuffer:2*1024*1024,env:{...process.env,NO_COLOR:'1'}});
  assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout,/Tests\s+\d+ passed/);
});
