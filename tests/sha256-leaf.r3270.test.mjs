import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildSync} from 'esbuild';
import {sha256Bytes,sha256Hex} from '../src/utils/hashSha256.js';
import * as legacy from '../src/data/federacio/portabilitatFediversity.js';
const oracle=value=>createHash('sha256').update(value).digest('hex');
test('SHA leaf · vectors coneguts i oracle UTF-8 de Node',()=>{
 const vectors=[['','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],['abc','ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad']];
 for(const [text,expected]of vectors)assert.equal(sha256Hex(text),expected);
 for(const text of ['Sóc de Poble 🏡 🌳','\r\n\0à','\ud800','x\udc00y','é'.repeat(65),'字'.repeat(129)]){
  assert.equal(sha256Hex(text),oracle(text));assert.equal(Buffer.from(sha256Bytes(text)).toString('hex'),oracle(text));
 }
});
test('SHA leaf · fronteres de padding i bytes exactes, inclòs offset subarray',()=>{
 for(const size of [0,1,55,56,63,64,65,119,120,127,128,129,255,256,1024,65536]){
  const input=Uint8Array.from({length:size},(_,i)=>(i*71+129)%256),before=Uint8Array.from(input);
  assert.equal(sha256Hex(input),oracle(input));assert.deepEqual(input,before);
  const padded=new Uint8Array(size+13).fill(0xa5);padded.set(input,7);const view=padded.subarray(7,7+size);
  assert.equal(sha256Hex(view),oracle(input));assert.equal(sha256Hex(Buffer.from(input)),oracle(input));
 }
 const a=sha256Bytes('abc'),b=sha256Bytes('abc');assert(a instanceof Uint8Array);assert.equal(a.length,32);assert.notEqual(a,b);a[0]^=255;assert.equal(Buffer.from(b).toString('hex'),oracle('abc'));
});
test('SHA leaf · conserva errors de tipus sense coerció i exports legacy idèntics',()=>{
 let coerced=false;
 for(const input of [null,undefined,1,1n,true,[],{},new ArrayBuffer(3),new DataView(new ArrayBuffer(3)),new Uint8ClampedArray(3),Symbol('x'),{toString(){coerced=true;throw Error('coercion');}}]){
  assert.throws(()=>sha256Bytes(input),e=>e instanceof TypeError&&e.message==='[portabilitatFediversity] Entrada per a SHA-256 ha de ser string o Uint8Array.');
  assert.throws(()=>sha256Hex(input),TypeError);
 }
 assert.equal(coerced,false);assert.equal(legacy.sha256Hex,sha256Hex);assert.equal(legacy.sha256Bytes,sha256Bytes);
});
test('SHA leaf · imports estàtics del diari no arrosseguen el motor Fediversity',()=>{
 const files=['lotsDiariEditorial','generacionsEditorials'].map(name=>path.resolve('src/data',name+'.js'));
 const result=buildSync({stdin:{contents:files.map(file=>`export * from ${JSON.stringify(file)};`).join(''),resolveDir:process.cwd()},bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022'});
 const inputs=Object.keys(result.metafile.inputs);assert(inputs.some(file=>file.endsWith('src/utils/hashSha256.js')));
 assert.equal(inputs.some(file=>file.includes('portabilitatFediversity')),false);
 assert.equal(inputs.filter(file=>!file.startsWith('<')).length,3);
});
