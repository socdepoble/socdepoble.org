/** Gateway ingress/CAS probes: fixtures only; no launchctl, tunnel or Caddy execution. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { configuraIngress, reemplaçaIngress, verificaWebDelGateway, main } from '../tooling/node0/activa-porta-caddy-node0.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const entry=(host,port=3350)=>`  - hostname: ${host}\n    service: http://127.0.0.1:${port}\n`;
const original='tunnel: fixture-id\ncredentials-file: /private/fixture/credentials.json\ningress:\n'+entry('socdepoble.cat')+entry('www.socdepoble.cat')+'  - service: http_status:404\n';
const candidate=original.replaceAll('127.0.0.1:3350','127.0.0.1:4341');
function fixture(text=original){const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-gateway-adversarial-')));const file=path.join(dir,'config.yml');fs.writeFileSync(file,text,{mode:0o640});return{dir,file,expectedSha:sha(text)};}

test('exactly the apex and www origins change, preserving unrelated ingress bytes',()=>{
  const text=original.replace('  - service: http_status:404',entry('elsewhere.example')+'  - service: http_status:404');
  const result=configuraIngress(text);assert.equal(result.changed,2);assert.equal(result.already,0);
  assert.ok(result.candidate.includes(entry('elsewhere.example')));
  assert.ok(result.candidate.includes('credentials-file: /private/fixture/credentials.json\n'));
  assert.ok(result.candidate.includes(entry('socdepoble.cat',4341)));assert.ok(result.candidate.includes(entry('www.socdepoble.cat',4341)));
});
test('mixed and complete prior activation are idempotent and counted accurately',()=>{
  const mixed=original.replace(entry('socdepoble.cat'),entry('socdepoble.cat',4341));const result=configuraIngress(mixed);assert.equal(result.changed,1);assert.equal(result.already,1);
  const again=configuraIngress(candidate);assert.equal(again.changed,0);assert.equal(again.already,2);assert.equal(again.candidate,candidate);
});
test('two duplicate apex hosts cannot substitute for the missing www host',()=>{
  for(const secondPort of[3350,4341]){
    const text='ingress:\n'+entry('socdepoble.cat')+entry('socdepoble.cat',secondPort)+'  - service: http_status:404\n';
    assert.throws(()=>configuraIngress(text),/hosts_missing_or_duplicate/);
  }
});
test('two duplicate www hosts cannot substitute for the missing apex host',()=>{
  const text='ingress:\n'+entry('www.socdepoble.cat')+entry('www.socdepoble.cat')+'  - service: http_status:404\n';
  assert.throws(()=>configuraIngress(text),/hosts_missing_or_duplicate/);
});
test('missing target hostname and unexpected target origin fail closed',()=>{
  assert.throws(()=>configuraIngress('ingress:\n'+entry('socdepoble.cat')),/hosts_missing_or_duplicate/);
  for(const origin of['https://remote.example','http://127.0.0.1:9999','http://192.168.0.23:3350'])assert.throws(()=>configuraIngress(original.replace('http://127.0.0.1:3350',origin)),/origin_unexpected/);
});
test('two service rows under apex cannot hide a www entry without its own service',()=>{
  const text='ingress:\n'+entry('socdepoble.cat')+'    service: http://127.0.0.1:3350\n  - hostname: www.socdepoble.cat\n  - service: http_status:404\n';
  assert.throws(()=>configuraIngress(text),/hosts_missing_or_duplicate/);
});
test('nested unrelated service key is preserved while the real ingress origins change',()=>{
  const text=original.replace(entry('socdepoble.cat'),'  - hostname: socdepoble.cat\n    originRequest:\n      service: http://127.0.0.1:3350\n    service: http://127.0.0.1:3350\n');
  const result=configuraIngress(text);assert.equal(result.changed,2);assert.ok(result.candidate.includes('      service: http://127.0.0.1:3350\n'));
});
test('preimage mismatch and foreign backup refuse before replacing the original',()=>{
  const f=fixture();assert.throws(()=>reemplaçaIngress({...f,expectedSha:'0'.repeat(64),candidate,afterReplace:()=>{throw Error('must not run')}}),/preimage_drift/);assert.equal(fs.readFileSync(f.file,'utf8'),original);
  fs.writeFileSync(f.file+'.node0-'+f.expectedSha.slice(0,12)+'.backup','FOREIGN');
  assert.throws(()=>reemplaçaIngress({...f,candidate,afterReplace:()=>{throw Error('must not run')}}),/backup_drift/);assert.equal(fs.readFileSync(f.file,'utf8'),original);
});
test('successful CAS preserves original mode, backup bytes and excludes config secrets from result',()=>{
  const secret='SENTINEL_CONFIGURATION_SECRET';const text=original+'token: '+secret+'\n';const f=fixture(text);const proposed=text.replaceAll(':3350',':4341');let called=0;
  const result=reemplaçaIngress({...f,candidate:proposed,afterReplace:()=>{called++;assert.equal(fs.readFileSync(f.file,'utf8'),proposed)}});
  assert.equal(called,1);assert.equal(result.changed,true);assert.equal(fs.readFileSync(result.backup,'utf8'),text);assert.equal(fs.statSync(f.file).mode&0o777,0o640);
  assert.ok(!JSON.stringify(result).includes(secret));assert.equal(fs.statSync(result.backup).mode&0o777,0o600);
});
test('restart failure restores exact original config and leaves its backup for recovery',()=>{
  const f=fixture();assert.throws(()=>reemplaçaIngress({...f,candidate,afterReplace:()=>{throw Error('simulated restart failure')}}),/simulated restart failure/);
  assert.equal(fs.readFileSync(f.file,'utf8'),original);assert.equal(fs.statSync(f.file).mode&0o777,0o640);assert.equal(fs.readFileSync(f.file+'.node0-'+f.expectedSha.slice(0,12)+'.backup','utf8'),original);
});
test('human edit after replacement survives a failed restart, marking recovery required',()=>{
  const f=fixture();assert.throws(()=>reemplaçaIngress({...f,candidate,afterReplace:()=>{fs.writeFileSync(f.file,'HUMAN CURATED CONFIG\n');throw Error('restart failed')}}),/recovery_required/);
  assert.equal(fs.readFileSync(f.file,'utf8'),'HUMAN CURATED CONFIG\n');
});
test('identical candidate has no backup, mutation or restart',()=>{
  const f=fixture();let touched=false;assert.deepEqual(reemplaçaIngress({...f,candidate:original,afterReplace:()=>{touched=true}}),{changed:false,backup:null});assert.equal(touched,false);assert.equal(fs.readFileSync(f.file,'utf8'),original);assert.deepEqual(fs.readdirSync(f.dir),['config.yml']);
});
test('symlink/hardlinked ingress roots cannot redirect or mutate outside data',()=>{
  for(const kind of['symlink','hardlink']){
    const f=fixture(),alias=path.join(f.dir,'alias.yml');if(kind==='symlink')fs.symlinkSync(f.file,alias);else fs.linkSync(f.file,alias);
    assert.throws(()=>reemplaçaIngress({file:alias,expectedSha:f.expectedSha,candidate,afterReplace:()=>{throw Error('must not run')}}));assert.equal(fs.readFileSync(f.file,'utf8'),original);
  }
});

const healthyInfo=()=>new Response(JSON.stringify({links:[{rel:'http://nodeinfo.diaspora.software/ns/schema/2.1',href:'https://socdepoble.cat/nodeinfo/2.1'}]}),{headers:{'Content-Type':'application/json'}});
test('web preflight uses the public Host with manual redirects for HTML and NodeInfo',async()=>{
  const calls=[];let cancelled=false;
  await verificaWebDelGateway(async(url,options)=>{
    calls.push({url,options});
    if(url==='http://127.0.0.1:4341/')return{status:200,headers:new Headers({'Content-Type':'text/html; charset=utf-8'}),body:{cancel:async()=>{cancelled=true;}}};
    assert.equal(cancelled,true,'HTML body is closed before the next probe');return healthyInfo();
  });
  assert.deepEqual(calls.map(v=>v.url),['http://127.0.0.1:4341/','http://127.0.0.1:4341/.well-known/nodeinfo']);
  for(const {options} of calls){assert.equal(options.headers.Host,'socdepoble.cat');assert.equal(options.redirect,'manual');assert.ok(options.signal instanceof AbortSignal);}
});
test('API health cannot excuse an HTML redirect loop or non-HTML SPA response',async()=>{
  for(const home of[new Response(null,{status:301,headers:{Location:'https://socdepoble.cat/'}}),new Response('{}',{headers:{'Content-Type':'application/json'}})]){
    let calls=0;await assert.rejects(verificaWebDelGateway(async()=>{calls++;return home;}),/node0_gateway_web_preflight_failed/);assert.equal(calls,1);
  }
});
test('NodeInfo must be successful JSON with nonempty discovery links',async()=>{
  for(const info of[new Response(null,{status:301}),new Response('<html></html>',{headers:{'Content-Type':'text/html'}}),new Response('{"links":[]}',{headers:{'Content-Type':'application/json'}}),new Response('{"links":{}}',{headers:{'Content-Type':'application/json'}}),new Response('bad json',{headers:{'Content-Type':'application/json'}})]){
    let calls=0;await assert.rejects(verificaWebDelGateway(async()=>++calls===1?new Response('<!doctype html>',{headers:{'Content-Type':'text/html'}}):info));assert.equal(calls,2);
  }
});
test('main refuses API-healthy/web-301 before reading, validating or replacing tunnel ingress',async()=>{
  const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-gateway-order-')));
  const local=path.join(dir,'local'),launch=path.join(dir,'Library/LaunchAgents');fs.mkdirSync(local,{recursive:true});fs.mkdirSync(launch,{recursive:true});
  const caddy=path.join(local,'caddy');fs.writeFileSync(caddy,'fixture executable; never run');
  fs.writeFileSync(path.join(local,'socdepoble-runtime-receipt.json'),JSON.stringify({caddy:{path:caddy,binarySha256:sha(fs.readFileSync(caddy)),version:'fixture'}}));
  // No .cloudflared directory is created: reaching its read would fail with ENOENT.
  const before={home:os.homedir,interfaces:os.networkInterfaces,spawn:childProcess.spawnSync,fetch:globalThis.fetch};const commands=[],requests=[];
  try{
    os.homedir=()=>dir;os.networkInterfaces=()=>({fixture:[{address:'192.168.0.23'}]});
    childProcess.spawnSync=(command,args)=>{commands.push({command,args});return{status:0,stdout:'',stderr:''};};syncBuiltinESMExports();
    globalThis.fetch=async(url,options)=>{requests.push({url,options});if(url.endsWith('/api/v1/node0/status'))return new Response('{"postgresql":{"ok":true}}',{headers:{'Content-Type':'application/json'}});assert.equal(url,'http://127.0.0.1:4341/');assert.equal(options.headers.Host,'socdepoble.cat');assert.equal(options.redirect,'manual');return new Response(null,{status:301,headers:{Location:'https://socdepoble.cat/'}});};
    await assert.rejects(main(['--apply']),/node0_gateway_web_preflight_failed/);
    assert.deepEqual(requests.map(v=>v.url),['http://127.0.0.1:4341/api/v1/node0/status','http://127.0.0.1:4341/']);
    assert.equal(commands.some(v=>v.command.endsWith('cloudflared')||v.args.includes('kickstart')),false);
    assert.equal(fs.existsSync(path.join(dir,'.cloudflared')),false);
  }finally{os.homedir=before.home;os.networkInterfaces=before.interfaces;childProcess.spawnSync=before.spawn;globalThis.fetch=before.fetch;syncBuiltinESMExports();}
});
