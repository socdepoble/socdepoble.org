import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { esIpPublica, peticioMastodont } from '../tooling/node0/xarxa-node0.mjs';

// The certificate/key exist only in this disposable local fixture. Production
// TLS validation is untouched; child requests inject an agent with a local socket.
let directory, certificate, server, port;
const sockets = new Set();
before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'node0-network-tls-'));
  const key = path.join(directory, 'fixture.key'), cert = path.join(directory, 'fixture.crt'), config = path.join(directory, 'openssl.cnf');
  fs.writeFileSync(config, '[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3\n[dn]\nCN=mastodont.cat\n[v3]\nsubjectAltName=DNS:mastodont.cat\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n', { mode: 0o600 });
  const result = spawnSync('openssl', ['req','-x509','-newkey','rsa:2048','-sha256','-nodes','-days','1','-keyout',key,'-out',cert,'-config',config], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, 'The local TLS fixture requires OpenSSL.');
  certificate = fs.readFileSync(cert, 'utf8');
  server = https.createServer({ key: fs.readFileSync(key), cert: certificate }, (req, res) => {
    const route = new URL(req.url, 'https://mastodont.cat').pathname;
    if (route.startsWith('/status/')) {
      const status = Number(route.split('/').at(-1));
      res.writeHead(status, { 'X-Fixture': 'local-tls', 'Content-Length': '0' }); res.end(); return;
    }
    if (route === '/head') { res.writeHead(200, { 'X-Fixture': 'head', 'Content-Length': '123' }); res.end(); return; }
    if (route === '/upgrade') { res.writeHead(101, { Connection: 'Upgrade', Upgrade: 'fixture' }); res.end(); return; }
    if (route === '/early') res.writeEarlyHints({ link: '</fixture.css>; rel=preload' });
    if (route === '/limit') { res.end('x'.repeat(65536)); return; }
    if (route === '/slow') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.flushHeaders(); res.write('body-started'); return; }
    if (route === '/truncated') { res.writeHead(200, { 'Content-Length': '1000' }); res.write('short', () => res.destroy()); return; }
    const body = []; req.on('data', chunk => body.push(chunk));
    req.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json', 'X-Fixture': 'local-tls' }); res.end(JSON.stringify({ method: req.method, body: Buffer.concat(body).toString('utf8'), host: req.headers.host })); });
  });
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  port = server.address().port;
});
after(async () => {
  for (const socket of sockets) socket.destroy();
  if (server) await new Promise(resolve => server.close(resolve));
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

function childProbe(options = {}) {
  const module = pathToFileURL(path.resolve(import.meta.dirname, '../tooling/node0/xarxa-node0.mjs')).href;
  const code = `
import https from 'node:https';
import tls from 'node:tls';
import { peticioMastodont } from ${JSON.stringify(module)};
const settings = ${JSON.stringify(options)};
const controller = new AbortController();
let dnsCalls=0, requests=0, wireBytes=0, markDns, lastRequest;
const dnsStarted=new Promise(resolve=>{markDns=resolve;});
const resolver=async()=>{dnsCalls++;markDns();if(settings.dnsNever)return new Promise(()=>{});return settings.addresses??[{address:'1.1.1.1',family:4}];};
const original=https.request;
const agent=new https.Agent({keepAlive:false});
agent.createConnection=()=>tls.connect({host:'127.0.0.1',port:${port},servername:'mastodont.cat',ca:${JSON.stringify(certificate)}});
https.request=(url,opts,callback)=>{
 requests++;
 if(url.hostname!=='mastodont.cat'||opts.agent!==false||typeof opts.lookup!=='function')throw Error('transport-boundary-regressed');
 lastRequest=original(url,{...opts,agent},response=>{
   response.on('data',chunk=>{wireBytes+=chunk.length;if(settings.abort==='body')controller.abort();});
   callback(response);
 });
 return lastRequest;
};
if(settings.abort==='before')controller.abort();
let output;
try{
 const pending=peticioMastodont('https://mastodont.cat'+(settings.path??'/ok'),{method:settings.method??'GET',body:settings.body??null,headers:settings.body?{'Content-Type':'text/plain'}:{},resolver,signal:controller.signal,timeoutMs:settings.timeoutMs??1000,maxBytes:settings.maxBytes??1048576});
 if(settings.abort==='dns'){await dnsStarted;controller.abort();}
 const response=await pending;
 output={resolved:true,status:response.status,bodyNull:response.body===null,header:response.headers.get('x-fixture'),body:await response.text()};
 if(settings.continuity){const next=await peticioMastodont('https://mastodont.cat/ok',{resolver,timeoutMs:1000});output.continuity=next.status===200;await next.text();}
}catch(error){output={resolved:false,errorName:error.name,message:error.message};}
const transportDestroyed=lastRequest?.destroyed??null;
https.request=original;agent.destroy();
console.log(JSON.stringify({...output,dnsCalls,requests,wireBytes,transportDestroyed}));
`;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module','-'], { stdio: ['pipe','pipe','pipe'] });
    let stdout='', stderr='';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('fixture_child_timeout')); }, 6000);
    child.stdout.on('data', b => { stdout += b; }); child.stderr.on('data', b => { stderr += b; });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr, result: (()=>{ try{return JSON.parse(stdout.trim());}catch{return null;} })() }); });
    child.stdin.end(code);
  });
}
async function healthy(options) { const r=await childProbe(options); assert.equal(r.code,0,r.stderr); assert.ok(r.result,r.stdout); return r.result; }

test('public-IP guard rejects local, reserved, mapped and documentation addresses', () => {
  for (const ip of ['127.0.0.1','10.0.0.1','192.168.0.23','169.254.1.1','192.0.2.3','100.64.1.1','::1','::ffff:127.0.0.1','fc00::1','2001:db8::1']) assert.equal(esIpPublica(ip),false,ip);
  assert.equal(esIpPublica('1.1.1.1'),true); assert.equal(esIpPublica('2606:4700:4700::1111'),true);
});
test('origin boundary rejects before invoking DNS or HTTPS', async () => {
  for (const url of ['http://mastodont.cat/x','https://mastodont.cat.evil.example/x','https://user:password@mastodont.cat/x','https://mastodont.cat:444/x']) await assert.rejects(peticioMastodont(url,{resolver:()=>assert.fail('no DNS')}),/node0_remote_origin_rejected/);
});
test('mixed DNS answer with one private address rejects before opening socket', async () => {
  const r=await healthy({addresses:[{address:'1.1.1.1',family:4},{address:'127.0.0.1',family:4}]});
  assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_address_rejected/); assert.equal(r.requests,0);
});
test('real local TLS fixture returns 200 body, headers and canonical Host', async () => {
  const r=await healthy(); assert.equal(r.resolved,true); assert.equal(r.status,200); assert.equal(r.header,'local-tls'); assert.equal(JSON.parse(r.body).host,'mastodont.cat');
});
test('real local TLS fixture receives POST bytes unchanged', async () => {
  const r=await healthy({method:'POST',body:'local-fixture-public-body'}); assert.equal(JSON.parse(r.body).body,'local-fixture-public-body'); assert.equal(JSON.parse(r.body).method,'POST');
});
for(const status of [204,205,304]) test(`N0-01 real TLS ${status} returns null body and process continues`, async () => {
  const r=await healthy({path:`/status/${status}`,continuity:true}); assert.equal(r.resolved,true); assert.equal(r.status,status); assert.equal(r.bodyNull,true); assert.equal(r.body,''); assert.equal(r.continuity,true);
});
test('HEAD returns null body independent of successful status', async () => {
  const r=await healthy({method:'HEAD',path:'/head'}); assert.equal(r.resolved,true); assert.equal(r.status,200); assert.equal(r.bodyNull,true); assert.equal(r.body,'');
});
test('N0-01 invalid final status 999 rejects promise instead of uncaught exception', async () => {
  const r=await healthy({path:'/status/999'}); assert.equal(r.resolved,false); assert.equal(r.errorName,'RangeError'); assert.match(r.message,/status|200.*599/i);
});
test('103 Early Hints is informational; final 200 remains readable', async () => {
  const r=await healthy({path:'/early'}); assert.equal(r.resolved,true); assert.equal(r.status,200); assert.equal(JSON.parse(r.body).method,'GET');
});
test('101 upgrade rejects and closes its socket instead of constructing a Response', async () => {
  const r=await healthy({path:'/upgrade'}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_upgrade_rejected/); assert.equal(r.transportDestroyed,true);
});
test('response byte budget rejects and destroys the transport', async () => {
  const r=await healthy({path:'/limit',maxBytes:64}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_response_limit/); assert.ok(r.wireBytes>64); assert.equal(r.transportDestroyed,true);
});
test('deadline covers DNS which never resolves', async () => {
  const r=await healthy({dnsNever:true,timeoutMs:30}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_timeout/); assert.equal(r.requests,0);
});
test('deadline covers an unfinished response body after bytes arrive', async () => {
  const r=await healthy({path:'/slow',timeoutMs:500}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_timeout/); assert.ok(r.wireBytes>0,'the failure is after body delivery started'); assert.equal(r.transportDestroyed,true);
});
test('truncated response rejects without waiting for a full body', async () => {
  const r=await healthy({path:'/truncated',timeoutMs:1000}); assert.equal(r.resolved,false); assert.doesNotMatch(r.message,/node0_remote_timeout/);
});
test('pre-aborted signal prevents DNS and socket dispatch', async () => {
  const r=await healthy({abort:'before'}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_aborted/); assert.equal(r.dnsCalls,0); assert.equal(r.requests,0);
});
test('abort while DNS is pending rejects and never dispatches HTTPS', async () => {
  const r=await healthy({dnsNever:true,abort:'dns',timeoutMs:500}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_aborted/); assert.equal(r.requests,0);
});
test('abort after response bytes arrive cancels body transport', async () => {
  const r=await healthy({path:'/slow',abort:'body',timeoutMs:500}); assert.equal(r.resolved,false); assert.match(r.message,/node0_remote_aborted/); assert.ok(r.wireBytes>0); assert.equal(r.transportDestroyed,true);
});
