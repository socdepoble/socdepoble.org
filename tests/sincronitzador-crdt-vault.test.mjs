import test from 'node:test';import assert from 'node:assert/strict';
import * as vault from '../src/data/sincronitzadorCarpetaLocal.js';
import {estatCrdtRuralBuit,canviaCrdtRural,fusionaCrdtRural,projectaCrdtRural} from '../src/data/crdtRural.js';
import {CarpetaFalsa,nodeFals,textFals} from './helpers/carpetaLocalFalsa.js';
const n=content=>({title:'Nota',content,slug:'nota',folderId:'camp',tags:[],updatedAt:'2026-11-03T00:00:00Z'});
const empty=()=>estatCrdtRuralBuit();const op=(s,replica,text)=>canviaCrdtRural(s,{id:'nota',replica,comptador:1,nota:n(text)});
const join=(a,b)=>fusionaCrdtRural(a,b);const txt=s=>projectaCrdtRural(s).notes[0]?.content;

test('batches i Markdown immutables de dos dispositius convergeixen sense sobreescriure textos',async()=>{
 const root=new CarpetaFalsa('vault'),g=op(empty(),'base','abc'),a=join(g,op(g,'A','aXbc')),b=join(g,op(g,'B','abYc'));
 const one=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:a});const files=new Map([...root.fills.keys()].map(k=>[k,textFals(root,k)]));
 const two=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:b});assert.equal(txt(two.crdt),'aXbYc');
 for(const[k,text]of files)assert.equal(textFals(root,k),text);
 const three=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:one.crdt});assert.deepEqual(three.crdt,two.crdt);assert.equal(projectaCrdtRural(three.crdt).notes.length,1);
});
test('edició Markdown usa la frontiera original, no el timestamp ni l’estat nou de l’app',async()=>{
 const root=new CarpetaFalsa('vault'),g=op(empty(),'base','abc'),one=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:g});
 const file=nodeFals(root,one.projeccions[0]);file.modificaDesDeFora(file.text.replace(/abc\n$/,'aXbc\n'));
 const b=join(g,op(g,'B','abYc')),two=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:b});assert.equal(txt(two.crdt),'aXbYc');
 assert.match(file.text,/aXbc/);const three=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:two.crdt});assert.deepEqual(three.crdt,two.crdt);
});
test('la projecció Markdown conserva Unicode i totes les línies finals',async()=>{
 const root=new CarpetaFalsa('vault'),g=op(empty(),'base','A🙂B\n\n'),one=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:g});
 const two=await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:empty()});assert.equal(txt(two.crdt),'A🙂B\n\n');assert.deepEqual(two.crdt,one.crdt);
});
test('cancel·lació i close fallit no retornen un pla confirmat ni alteren batches previs',async()=>{
 const root=new CarpetaFalsa('vault'),g=op(empty(),'base','abc');await vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:g});const names=[...root.fills.keys()];
 const controller=new AbortController();controller.abort();await assert.rejects(vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:g,signal:controller.signal}),e=>e.name==='AbortError');
 const a=join(g,op(g,'A','aXbc'));root.injectaFallada('close',{vegades:1});await assert.rejects(vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:a}));
 for(const name of names)assert.ok(root.fills.has(name));
});


test('fallada d’un writer concurrent no esborra el batch que l’altre ja ha confirmat',async()=>{
 const root=new CarpetaFalsa('vault'),g=op(empty(),'base','abc'),get=root.getFileHandle.bind(root);let absent=0,ready,committed;
 const bothAbsent=new Promise(r=>ready=r),secondCommit=new Promise(r=>committed=r);let writers=0;
 root.getFileHandle=async(name,options)=>{
  if(name.startsWith('.sdp-crdt-')&&!options?.create&&absent<2){absent++;if(absent===2)ready();await bothAbsent;throw new DOMException('Absent','NotFoundError');}
  const f=await get(name,options);
  if(name.startsWith('.sdp-crdt-')&&options?.create&&!f.concurrentProbe){f.concurrentProbe=true;const create=f.createWritable.bind(f);f.createWritable=async(...args)=>{const w=await create(...args),close=w.close.bind(w),writer=++writers;w.close=async()=>{if(writer===1){await secondCommit;throw new DOMException('Quota writer1','QuotaExceededError');}await close();committed();};return w;};}
  return f;
 };
 const results=await Promise.allSettled([vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:g}),vault.sincronitzaCrdtAmbDirectoryHandle(root,{crdt:g})]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);const batches=[...root.fills.keys()].filter(n=>n.startsWith('.sdp-crdt-'));assert.equal(batches.length,1);assert.ok(JSON.parse(textFals(root,batches[0])).crdt.ops.length);
});
