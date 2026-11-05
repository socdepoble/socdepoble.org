import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {creaLectorMitjansPublicsPosse} from '../tooling/node0/posse/mitjans-publics-posse-node0.mjs';

const PNG=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const JPEG=Buffer.from([255,216,255,224,0,0]);
const WEBP=Buffer.from('RIFF0000WEBPVP8 ', 'ascii');
const denied=error=>error?.code==='POSSE_MEDIA_UNAVAILABLE'&&error.status===503&&error.message==='POSSE_MEDIA_UNAVAILABLE';
async function fixture(run){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'sdp-r11-public-media-'));
  try{await run(root);}finally{await fs.rm(root,{recursive:true,force:true});}
}
test('public media reads are lazy without a root and expose only a closed error',async()=>{
  for(const root of [undefined,'', '.', '/',42]){
    const reader=creaLectorMitjansPublicsPosse({root});
    await assert.rejects(reader('cover'),denied);
  }
});
test('magic determines JPEG, PNG and WebP even without an extension',async()=>fixture(async root=>{
  await fs.mkdir(path.join(root,'public'));
  const read=creaLectorMitjansPublicsPosse({root});
  for(const [name,bytes,mimeType] of [['jpeg',JPEG,'image/jpeg'],['png',PNG,'image/png'],['webp',WEBP,'image/webp']]){
    await fs.writeFile(path.join(root,'public',name),bytes);
    const result=await read('public/'+name);
    assert.ok(result.bytes instanceof Uint8Array);assert.deepEqual(Buffer.from(result.bytes),bytes);assert.equal(result.mimeType,mimeType);
  }
}));
test('traversal, hidden files, absolute paths, encoded paths and accessors cannot choose private files',async()=>fixture(async root=>{
  const read=creaLectorMitjansPublicsPosse({root});
  for(const ref of ['../cover','public/../cover','/cover','./cover','public//cover','public/./cover','public\\cover','.env','public/.hidden','public/%2e%2e/cover','public/cover?x',null,{},'a'.repeat(257)])await assert.rejects(read(ref),denied);
}));
test('root, parent and leaf symlinks and hardlinks are refused',async()=>fixture(async root=>{
  await fs.mkdir(path.join(root,'public'));await fs.writeFile(path.join(root,'public','cover'),PNG);
  await fs.symlink(path.join(root,'public','cover'),path.join(root,'leaf'));
  await fs.symlink(path.join(root,'public'),path.join(root,'parent'));
  await fs.symlink(path.join(root,'public'),path.join(root,'root-link'));
  const read=creaLectorMitjansPublicsPosse({root});
  await assert.rejects(read('leaf'),denied);await assert.rejects(read('parent/cover'),denied);
  await assert.rejects(creaLectorMitjansPublicsPosse({root:path.join(root,'root-link')})('cover'),denied);
  await fs.link(path.join(root,'public','cover'),path.join(root,'hardlink'));
  await assert.rejects(read('hardlink'),denied);await assert.rejects(read('public/cover'),denied);
}));
test('empty, oversized, missing, directory and nonimage payloads fail closed without leaking paths',async()=>fixture(async root=>{
  const read=creaLectorMitjansPublicsPosse({root});
  await fs.writeFile(path.join(root,'empty'),Buffer.alloc(0));
  await fs.writeFile(path.join(root,'large'),Buffer.alloc(8*1024*1024+1));
  await fs.writeFile(path.join(root,'svg'),'<svg>not an accepted image container</svg>');
  await fs.writeFile(path.join(root,'wave'),Buffer.from('RIFF0000WAVEdata'));
  await fs.mkdir(path.join(root,'directory'));
  for(const ref of ['empty','large','missing','svg','wave','directory'])await assert.rejects(read(ref),denied);
}));
test('the exact8MiB cap is accepted when its magic is an allowed image',async()=>fixture(async root=>{
  const bytes=Buffer.alloc(8*1024*1024);PNG.copy(bytes);await fs.writeFile(path.join(root,'cover'),bytes);
  const result=await creaLectorMitjansPublicsPosse({root})('cover');assert.equal(result.bytes.byteLength,bytes.byteLength);assert.equal(result.mimeType,'image/png');
}));
test('a file changed during its asynchronous read cannot return unverified bytes',async()=>fixture(async root=>{
  const file=path.join(root,'cover');await fs.writeFile(file,PNG);
  const originalOpen=fs.open;let changed=false;
  fs.open=async(...args)=>{
    const handle=await originalOpen(...args);
    return {stat:options=>handle.stat(options),close:()=>handle.close(),async read(...readArgs){
      const result=await handle.read(...readArgs);
      if(!changed){changed=true;await fs.appendFile(file,Buffer.from([1]));}
      return result;
    }};
  };
  try{await assert.rejects(creaLectorMitjansPublicsPosse({root})('cover'),denied);assert.equal(changed,true);}
  finally{fs.open=originalOpen;}
}));
