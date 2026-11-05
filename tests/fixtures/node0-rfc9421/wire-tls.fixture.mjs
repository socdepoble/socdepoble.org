import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import tls from 'node:tls';
import {spawnSync} from 'node:child_process';
import {createHash,createPublicKey,verify,webcrypto} from 'node:crypto';
import {signaPeticioHttpMessageActivityPub} from '../../../tooling/node0/http-message-signatures-ed25519.mjs';
import {peticioMastodont} from '../../../tooling/node0/xarxa-node0.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('./rfc9421-ed25519.json',import.meta.url),'utf8'));
const privateKey=await webcrypto.subtle.importKey('pkcs8',Buffer.from(fixture.privateKeyPkcs8Base64,'base64'),'Ed25519',false,['sign']);
const publicKey=createPublicKey(fixture.publicKeyPem);
const ACTOR='https://socdepoble.cat/ap/actors/socdepoble',KEY=ACTOR+'#ed25519';
const TARGET='https://mastodont.cat/users/depoble/inbox?fixture=local&case=Mixed';
const BODY=JSON.stringify({type:'Create',actor:ACTOR,object:{type:'Note',content:'OFFLINE TLS FIXTURE ONLY 🫒'}});
const sha=bytes=>createHash('sha256').update(bytes).digest('base64');

// This independent receiver consumes only the request seen on a real TLS socket.
// It does not call either signer formatter and does not claim to run Mastodon.
function verifyWire(req,bytes){
  const h=req.headers;
  const match=/^sig1=\("@method" "@target-uri" "content-digest" "date" "content-type"\);created=(\d+);expires=(\d+);keyid="([^"\\]+)";alg="ed25519"$/.exec(h['signature-input']??'');
  if(!match||match[3]!==KEY||h.host!=='mastodont.cat'||h['content-digest']!=='sha-256=:'+sha(bytes)+':'||h['content-type']!=='application/activity+json')return false;
  const created=Number(match[1]),expires=Number(match[2]),now=Math.floor(Date.now()/1000);
  if(expires-created!==300||created>now+60||expires<now)return false;
  const signature=/^sig1=:([A-Za-z0-9+/]+={0,2}):$/.exec(h.signature??'');if(!signature)return false;
  const target=new URL(req.url,'https://'+h.host).href;
  const base=['"@method": '+req.method,'"@target-uri": '+target,'"content-digest": '+h['content-digest'],'"date": '+h.date,'"content-type": '+h['content-type'],'"@signature-params": '+h['signature-input'].slice('sig1='.length)].join('\n');
  return verify(null,Buffer.from(base),publicKey,Buffer.from(signature[1],'base64'));
}

export async function provaWireTls(){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'node0-rfc9421-tls-'));
  const key=path.join(directory,'fixture.key'),cert=path.join(directory,'fixture.crt'),config=path.join(directory,'openssl.cnf');
  fs.writeFileSync(config,'[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=v3\n[dn]\nCN=mastodont.cat\n[v3]\nsubjectAltName=DNS:mastodont.cat\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n',{mode:0o600});
  const generated=spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-sha256','-nodes','-days','1','-keyout',key,'-out',cert,'-config',config],{encoding:'utf8',timeout:15000});
  assert.equal(generated.status,0,'ephemeral local TLS certificate setup');
  const certificate=fs.readFileSync(cert),captures=[],sockets=new Set();let server,agent;
  const original=https.request;
  try{
    server=https.createServer({key:fs.readFileSync(key),cert:certificate},(req,res)=>{
      const chunks=[];let length=0;
      req.on('data',chunk=>{length+=chunk.length;if(length>128*1024)req.destroy();else chunks.push(chunk);});
      req.on('end',()=>{
        const bytes=Buffer.concat(chunks),valid=verifyWire(req,bytes);
        captures.push({method:req.method,path:req.url,host:req.headers.host,sni:req.socket.servername,bodySha256Base64:sha(bytes),bodyBytes:bytes.byteLength,signatureInput:req.headers['signature-input'],contentDigest:req.headers['content-digest'],valid});
        res.writeHead(valid?202:401,{'Content-Type':'application/json'});res.end(JSON.stringify({verified:valid,fixture:'local-only'}));
      });
    });
    server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const port=server.address().port;
    agent=new https.Agent({keepAlive:false});
    agent.createConnection=()=>tls.connect({host:'127.0.0.1',port,servername:'mastodont.cat',ca:certificate});
    https.request=(url,options,callback)=>{assert.equal(url.hostname,'mastodont.cat');assert.equal(options.agent,false);return original(url,{...options,agent},callback);};
    const headers=await signaPeticioHttpMessageActivityPub({metode:'POST',url:TARGET,cos:BODY,actorId:ACTOR,keyId:KEY,clauPrivada:privateKey,ara:Date.now(),subtle:webcrypto.subtle});
    const resolver=async()=>[{address:'1.1.1.1',family:4}];
    const first=await peticioMastodont(TARGET,{method:'POST',headers,body:BODY,resolver,timeoutMs:2000});
    assert.equal(first.status,202);assert.equal((await first.json()).verified,true);
    const changed=BODY.replace('OFFLINE','TAMPERED');
    const second=await peticioMastodont(TARGET,{method:'POST',headers,body:changed,resolver,timeoutMs:2000});
    assert.equal(second.status,401);assert.equal((await second.json()).verified,false);
    const third=await peticioMastodont(TARGET,{method:'POST',headers,body:BODY,resolver,timeoutMs:2000});
    assert.equal(third.status,202);assert.equal((await third.json()).verified,true);
    assert.equal(captures.length,3);assert.deepEqual(captures.map(c=>c.valid),[true,false,true]);
    assert.equal(captures[0].host,'mastodont.cat');assert.equal(captures[0].sni,'mastodont.cat');assert.equal(captures[0].path,new URL(TARGET).pathname+new URL(TARGET).search);
    assert.equal(captures[0].bodySha256Base64,sha(Buffer.from(BODY)));
    return {checkedAt:new Date().toISOString(),fixture:'real TLS loopback with injected socket; no remote Mastodon connection',signingKey:'Public RFC9421 test key, not the Node0 private key',remotePublicationPerformed:false,remoteInteropVerified:false,captures};
  }finally{
    https.request=original;agent?.destroy();for(const socket of sockets)socket.destroy();
    if(server)await new Promise(resolve=>server.close(resolve));
    fs.rmSync(directory,{recursive:true,force:true});
  }
}
