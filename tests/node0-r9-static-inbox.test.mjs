import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {once} from 'node:events';
const launcher=new URL('./fixtures/node0-static-inbox-server.mjs',import.meta.url);
test('AH11 static inbox preserves retryable remote delivery without accepting an activity',async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-node0-static-r9-'));
 fs.mkdirSync(path.join(base,'public'));fs.writeFileSync(path.join(base,'public/index.html'),'<!doctype html><title>TEST_ONLY static fixture</title>');
 const child=fork(launcher,[],{stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH,...(process.env.TMPDIR?{TMPDIR:process.env.TMPDIR}:{}),SDP_NODE_BASE_DIR:base,SDP_NODE_PORT:'0',SDP_NODE0_TEST_STATIC_FIXTURE:'1'}});
 let timer;
 try{
  const message=await Promise.race([once(child,'message'),once(child,'exit').then(()=>{throw Error('fixture_exit_before_listen');}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('fixture_start_timeout')),5000);})]);clearTimeout(timer);
  const port=message[0].port;assert.ok(Number.isInteger(port)&&port>0&&port!==3340);const origin='http://127.0.0.1:'+port;
  for(const pathname of['/ap/inbox','/ap/inbox/socdepoble'])await t.test('POST '+pathname+' is503/no-store/Retry-After60',async()=>{
   const response=await fetch(origin+pathname,{method:'POST',headers:{'Content-Type':'application/activity+json'},body:JSON.stringify({type:'Follow',id:'https://test-only.invalid/follow/1'}),signal:AbortSignal.timeout(3000)});
   assert.equal(response.status,503);assert.equal(response.headers.get('retry-after'),'60');assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('allow'),'POST, OPTIONS');
   assert.match(response.headers.get('content-type'),/^application\/activity\+json/);assert.equal((await response.json()).code,'node0_inbox_temporarily_unavailable');
  });
  for(const method of['GET','HEAD'])await t.test(method+' stays405',async()=>{const response=await fetch(origin+'/ap/inbox',{method,signal:AbortSignal.timeout(3000)});assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'POST, OPTIONS');if(method==='HEAD')assert.equal(await response.text(),'');else await response.arrayBuffer();});
  await t.test('OPTIONS stays204 and rejects unsupported methods',async()=>{const options=await fetch(origin+'/ap/inbox',{method:'OPTIONS',signal:AbortSignal.timeout(3000)});assert.equal(options.status,204);assert.equal(options.headers.get('access-control-allow-methods'),'POST, OPTIONS');const put=await fetch(origin+'/ap/inbox',{method:'PUT',signal:AbortSignal.timeout(3000)});assert.equal(put.status,405);assert.equal(put.headers.get('retry-after'),null);await put.arrayBuffer();});
  await t.test('unrelated static GET remains available',async()=>{const response=await fetch(origin+'/',{signal:AbortSignal.timeout(3000)});assert.equal(response.status,200);assert.match(await response.text(),/TEST_ONLY static fixture/);});
  assert.deepEqual(fs.readdirSync(path.join(base,'dades')),['node0_ed25519.json']);
 }finally{
  clearTimeout(timer);
  if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.send('stop');const kill=setTimeout(()=>child.kill('SIGKILL'),3000);try{await exited;}finally{clearTimeout(kill);}}
  fs.rmSync(base,{recursive:true,force:true});
 }
});
