/** R5 daemon integration without remote effects. Public RFC test key only. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Readable} from 'node:stream';
import {webcrypto,createPublicKey,createHash} from 'node:crypto';
import {actorPublic,creaServidor,drenaOutbox} from '../tooling/node0/servidor-node0-soberania.mjs';
import {verificaRfc9421Independent} from './fixtures/node0-rfc9421/receiver-independent.mjs';

const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/node0-rfc9421/rfc9421-ed25519.json',import.meta.url),'utf8'));
const privateKey=await webcrypto.subtle.importKey('pkcs8',Buffer.from(fixture.privateKeyPkcs8Base64,'base64'),'Ed25519',false,['sign']);
const spki=createPublicKey(fixture.publicKeyPem).export({format:'der',type:'spki'});
const fingerprint=createHash('sha256').update(spki).digest('hex');
const claus={privateKey,publicKeyPem:fixture.publicKeyPem,fingerprint};
const LOCAL='https://socdepoble.cat/ap/actors/socdepoble',REMOTE='https://mastodont.cat/users/depoble';
const NOW=Date.parse('2026-11-04T12:00:00Z');
function decodeMultikey(value){
  assert.equal(value[0],'z');const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',out=[0];
  for(const char of value.slice(1)){
    let carry=alphabet.indexOf(char);assert.ok(carry>=0);
    for(let i=out.length-1;i>=0;i--){carry+=out[i]*58;out[i]=carry&255;carry>>=8;}
    while(carry){out.unshift(carry&255);carry>>=8;}
  }
  return Buffer.from(out);
}
async function dispatch(server,url){
  const req=Readable.from([]);Object.assign(req,{url,method:'GET',headers:{host:'socdepoble.cat',origin:'https://socdepoble.org'},socket:{remoteAddress:'127.0.0.1'}});
  return new Promise(resolve=>{
    const headers={};let status;
    const res={headersSent:false,setHeader(k,v){headers[k.toLowerCase()]=v;},getHeader(k){return headers[k.toLowerCase()];},getHeaders(){return{...headers};},writeHead(s,h){status=s;for(const[k,v]of Object.entries(h??{}))headers[k.toLowerCase()]=v;this.headersSent=true;},end(body){resolve({status,headers,body:JSON.parse(body)});}};
    server.emit('request',req,res);
  });
}
test('daemon actor advertises the same public key and id as Ed25519 Multikey',()=>{
  const actor=actorPublic(claus);
  assert.equal(actor.id,LOCAL);assert.equal(actor.publicKey.publicKeyPem,fixture.publicKeyPem);
  assert.ok(actor['@context'].includes('https://www.w3.org/ns/cid/v1'));
  const key=actor.assertionMethod.find(k=>k.id===actor.publicKey.id);
  assert.equal(key.id,LOCAL+'#ed25519');assert.equal(key.type,'Multikey');assert.equal(key.controller,LOCAL);
  const decoded=decodeMultikey(key.publicKeyMultibase);
  assert.deepEqual(decoded.subarray(0,2),Buffer.from([0xed,0x01]));assert.deepEqual(decoded.subarray(2),spki.subarray(12));
  const rebuilt=Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),decoded.subarray(2)]);
  assert.equal(createHash('sha256').update(rebuilt).digest('hex'),fingerprint);
  assert.equal(JSON.stringify(actor).includes(fixture.privateKeyPkcs8Base64),false);
});
test('public actor route and status agree on configured key without claiming remote interoperability',async()=>{
  const server=creaServidor({db:{status:async()=>({ok:true,version:'17.11'})},claus,now:()=>NOW});
  try{
    const actor=await dispatch(server,'/ap/actors/socdepoble'),status=await dispatch(server,'/api/v1/node0/status');
    assert.equal(actor.status,200);assert.equal(actor.headers['content-type'],'application/activity+json');assert.equal(actor.headers['access-control-allow-origin'],'*');
    assert.deepEqual(actor.body,actorPublic(claus));assert.equal(status.status,200);assert.equal(status.body.ed25519.fingerprint,fingerprint);
    assert.equal(status.body.activitypub.remoteInteropVerified,false);assert.equal(status.body.capabilities.userSessions,false);
  }finally{server.close();}
});

const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('oversize queue integration requires explicit existing PGlite',{skip:'Set SDP_PGLITE_MODULE; no SQL executed implicitly'},()=>{});
else{
  const moduleUrl=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const {PGlite}=await import(moduleUrl.href);
  test('oversize outbox job is attempted once, then next valid job is signed and delivered with leases released',async()=>{
    const pg=new PGlite();const requests=[];
    try{
      await pg.exec('CREATE ROLE node0_runtime; CREATE SCHEMA node0; GRANT USAGE ON SCHEMA node0 TO node0_runtime;');
      await pg.exec(fs.readFileSync(new URL('../tooling/node0/schema-node0.sql',import.meta.url),'utf8'));
      const bad={id:LOCAL+'#oversize',type:'Create',actor:LOCAL,object:{type:'Note',content:'x'.repeat(128*1024)}};
      const good={id:LOCAL+'#valid',type:'Accept',actor:LOCAL,object:{id:REMOTE+'/follows/batch-fixture',type:'Follow',actor:REMOTE,object:LOCAL}};
      await pg.query("INSERT INTO node0.outbox(id,target,activity,next_attempt) VALUES($1,$2,$3::jsonb,'2000-01-01'),($4,$2,$5::jsonb,'2000-01-02')",['oversize',REMOTE+'/inbox',JSON.stringify(bad),'valid',JSON.stringify(good)]);
      await pg.exec('SET ROLE node0_runtime');
      const db={query:async sql=>{const rows=(await pg.query(sql)).rows;return rows[0]?.[Object.keys(rows[0])[0]];}};
      const request=async(url,options)=>{
        requests.push(JSON.parse(options.body));
        assert.deepEqual(requests.at(-1),good);
        assert.equal(verificaRfc9421Independent({url,method:options.method,headers:options.headers,body:options.body,publicKeyPem:fixture.publicKeyPem,keyId:LOCAL+'#ed25519',now:NOW}).valida,true);
        assert.equal(verificaRfc9421Independent({url,method:options.method,headers:options.headers,body:options.body+' ',publicKeyPem:fixture.publicKeyPem,keyId:LOCAL+'#ed25519',now:NOW}).valida,false);
        return new Response(null,{status:202});
      };
      await drenaOutbox({db,claus,request,now:()=>NOW});
      assert.equal(requests.length,1,'oversize signing fails before dispatch; valid second job still dispatches');
      const rows=(await pg.query('SELECT id,attempts,delivered_at IS NOT NULL AS delivered,lease_until IS NULL AS lease_released,lease_owner IS NULL AS owner_released FROM node0.outbox ORDER BY id')).rows;
      assert.deepEqual(rows,[{id:'oversize',attempts:1,delivered:false,lease_released:true,owner_released:true},{id:'valid',attempts:1,delivered:true,lease_released:true,owner_released:true}]);
      await drenaOutbox({db,claus,request,now:()=>NOW});
      assert.equal(requests.length,1,'retry schedule and delivered marker prevent immediate redispatch');
      assert.deepEqual((await pg.query('SELECT id,attempts FROM node0.outbox ORDER BY id')).rows,[{id:'oversize',attempts:1},{id:'valid',attempts:1}]);
    }finally{await pg.close();}
  });
}
