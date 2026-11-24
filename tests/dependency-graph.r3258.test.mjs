import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {analitzaFonts,ciclesTarjan,inventariaFonts} from '../tooling/analysis/dependency-graph.mjs';
const graph=files=>analitzaFonts(new Map(Object.entries(files).map(([p,s])=>['src/'+p,s])));
test('source AST sees nested literal imports and distinguishes lazy SCC from static SCC',()=>{
 const r=graph({'a.js':"export const open=()=>import('./b.js');",'b.js':"import './a.js';"});
 assert.equal(r.counts.dynamicEdges,1);assert.deepEqual(r.staticCycles,[]);assert.deepEqual(r.combinedCycles,[['src/a.js','src/b.js']]);
});
test('type-only, raw assets and commented/string imports create no executable edge',()=>{
 const r=graph({'a.ts':"import type {T} from './missing.ts';import raw from './missing.js?raw';const x=\"import('./fake.js')\";/* import('./ghost.js') */"});
 assert.deepEqual(r.unresolved,[]);assert.equal(r.edges.length,0);assert.equal(r.assets.length,1);
});
test('glob eager and lazy enumeration keeps exclusions and computed/unsupported gaps explicit',()=>{
 const r=graph({'a.js':"const x=import.meta.glob(['./views/*.js','!./views/no.js'],{eager:true});const y=import.meta.glob('./views/*.js');const z=import(variable);const q=import.meta.glob('./views/*.{js,jsx}');",'views/yes.js':'','views/no.js':''});
 assert.equal(r.counts.staticEdges,1);assert.equal(r.counts.dynamicEdges,2);assert.equal(r.opaque.length,2);assert.equal(r.unresolved.length,0);
});
test('unresolved literal module and syntax errors cannot become clean inventory',()=>{
 const r=graph({'a.js':"export const x=()=>import('./absent.js');",'bad.js':'import {'});
 assert.equal(r.unresolved.length,1);assert.equal(r.parseErrors.length,1);
});
test('Tarjan traverses 12000-deep dependency chain without JS call-stack recursion',()=>{
 const nodes=Array.from({length:12000},(_,i)=>String(i)),edges=nodes.slice(1).map((to,i)=>({from:nodes[i],to}));
 assert.deepEqual(ciclesTarjan(nodes,edges),[]);edges.push({from:nodes.at(-1),to:nodes[0]});assert.equal(ciclesTarjan(nodes,edges)[0].length,nodes.length);
});
test('runtime evidence: static cycle can throw TDZ; lazy cycle can complete safely',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-c7-graph-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const put=(p,s)=>fs.writeFileSync(path.join(dir,p),s);
 put('a.mjs',"import {b} from './b.mjs';export const a=b;");put('b.mjs',"import {a} from './a.mjs';export const b=a;");
 await assert.rejects(import(pathToFileURL(path.join(dir,'a.mjs')).href),e=>e instanceof ReferenceError&&/initialization/.test(e.message));
 put('lazy.mjs',"export const value='A';export const open=()=>import('./peer.mjs');");put('peer.mjs',"import {value} from './lazy.mjs';export const result=value+'B';");
 const lazy=await import(pathToFileURL(path.join(dir,'lazy.mjs')).href);assert.equal((await lazy.open()).result,'AB');
 const r=graph({'lazy.mjs':fs.readFileSync(path.join(dir,'lazy.mjs'),'utf8'),'peer.mjs':fs.readFileSync(path.join(dir,'peer.mjs'),'utf8')});assert.deepEqual(r.staticCycles,[]);assert.equal(r.combinedCycles.length,1);
});
test('inline all-type TypeScript imports/reexports disappear; mixed values and side effects stay',()=>{
 for(const syntax of ["import { type B } from './b.ts';export interface A {}", "export { type B } from './b.ts';export interface A {}"]){
  const r=graph({'a.ts':syntax,'b.ts':syntax.replaceAll('B','A').replaceAll('A {}','B {}').replace('./b.ts','./a.ts')});assert.deepEqual(r.staticCycles,[]);assert.equal(r.edges.length,0);
 }
 const mixed=graph({'a.ts':"import { type B, value } from './b.ts';",'b.ts':"export const value=1;import './a.ts';"});assert.equal(mixed.edges.length,2);assert.equal(mixed.staticCycles.length,1);
 const side=graph({'a.ts':"import {} from './b.ts';",'b.ts':"import './a.ts';"});assert.equal(side.edges.length,2);
});
test('CommonJS is explicitly counted rather than silently certified as ESM graph',()=>{
 const r=graph({'a.js':"const x=require('node:fs');const y=require(name);"});assert.equal(r.commonjsRequires.length,2);assert.equal(r.commonjsRequires[0].specifier,'node:fs');assert.equal(r.commonjsRequires[1].specifier,null);
});

test('glob repeated directories with an end mismatch terminates and retains ordinary recursive/? coverage',()=>{
 const repeated='./'+'**/'.repeat(80)+'x.js',long='q/'.repeat(100)+'y.js';
 const r=graph({'entry.js':`const x=import.meta.glob('${repeated}');const y=import.meta.glob('./views/?.js');`,[long]:'','nested/x.js':'','views/a.js':'','views/ab.js':''});
 assert.equal(r.edges.filter(e=>e.to==='src/nested/x.js').length,1);assert.equal(r.edges.filter(e=>e.to==='src/views/a.js').length,1);assert.equal(r.edges.some(e=>e.to.endsWith(long)),false);assert.equal(r.edges.some(e=>e.to==='src/views/ab.js'),false);
});
test('glob work exhaustion is explicit opaque and commits no partial matches',()=>{
 const pattern='./'+'?'.repeat(508),r=graph({'entry.js':`const x=import.meta.glob('${pattern}');`,['a'.repeat(4000)+'.js']:''});
 assert.equal(r.edges.length,0);assert.equal(r.opaque[0].reason,'glob-work-budget');
});
test('source inventory refuses escape, source/root/parent symlinks and excess depth',t=>{
 const directory=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'sdp-c7-inventory-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const root=path.join(directory,'root'),outside=path.join(directory,'outside');fs.mkdirSync(path.join(root,'src','nested'),{recursive:true});fs.mkdirSync(path.join(outside,'child'),{recursive:true});fs.writeFileSync(path.join(root,'src','a.js'),'export const a=1;');fs.writeFileSync(path.join(outside,'private.js'),'outside fixture');
 assert.equal(inventariaFonts(root).size,1);for(const sourceRoot of ['../outside',outside,'src/../src'])assert.throws(()=>inventariaFonts(root,{sourceRoot}),/relative contained/);
 fs.symlinkSync(outside,path.join(root,'alias'));assert.throws(()=>inventariaFonts(root,{sourceRoot:'alias/child'}),/symlink/);assert.throws(()=>inventariaFonts(path.join(root,'alias')),/symlink/);assert.throws(()=>inventariaFonts(path.join(root,'alias','child')),/symlink/);
 fs.unlinkSync(path.join(root,'alias'));fs.mkdirSync(path.join(root,'src','nested','deeper'));assert.throws(()=>inventariaFonts(root,{maxDepth:1}),/depth/);assert.throws(()=>inventariaFonts(root,{maxDepth:Infinity}),/budget/);
});
