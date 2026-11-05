/** Independent R4 limiter regression. Fixtures only; no sockets, production DB or users. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { generateKeyPairSync, webcrypto } from 'node:crypto';
import { creaServidor } from '../tooling/node0/servidor-node0-soberania.mjs';
import { signaPeticioHttpActivityPub } from '../src/data/federacio/inboxActivityPub.js';

const NOW=Date.UTC(2026,10,4,18,0,0),REMOTE='https://mastodont.cat/users/depoble',LOCAL='https://socdepoble.cat/ap/actors/socdepoble';
const remote=generateKeyPairSync('rsa',{modulusLength:2048});
const privateKey=await webcrypto.subtle.importKey('pkcs8',remote.privateKey.export({format:'der',type:'pkcs8'}),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
const remoteDoc={id:REMOTE,type:'Person',preferredUsername:'depoble',inbox:REMOTE+'/inbox',publicKey:{id:REMOTE+'#main-key',owner:REMOTE,publicKeyPem:remote.publicKey.export({format:'pem',type:'spki'})}};
const claus={fingerprint:'r4-fixture-not-an-identity',publicKeyPem:generateKeyPairSync('ed25519').publicKey.export({format:'pem',type:'spki'})};
async function signedFollow(){const body=JSON.stringify({id:REMOTE+'/follows/r4',type:'Follow',actor:REMOTE,object:LOCAL});const headers=await signaPeticioHttpActivityPub({url:'https://socdepoble.cat/ap/inbox',cos:Buffer.from(body),keyId:REMOTE+'#main-key',clauPrivada:privateKey,ara:NOW,subtle:webcrypto.subtle});return{body,headers:{...headers,'content-type':'application/activity+json'}};}
function dispatch(server,{body='{}',headers={},remoteAddress='127.0.0.1',method='POST',url='/ap/inbox'}={}){
  const req=Readable.from([Buffer.from(body)]);Object.assign(req,{method,url,headers:{host:'socdepoble.cat','content-type':'application/activity+json',...headers},socket:{remoteAddress}});
  return new Promise(resolve=>{let status;const out={};const res={headersSent:false,setHeader(k,v){out[k.toLowerCase()]=v;},writeHead(s,h){status=s;Object.assign(out,h);this.headersSent=true;},end(bytes){resolve({status,body:JSON.parse(bytes)});}};server.emit('request',req,res);});
}
function fixture(){let writes=0,lookups=0;const server=creaServidor({db:{query:async()=>{writes++;return{estat:'processada'};}},claus,now:()=>NOW,request:async url=>{lookups++;assert.equal(url,REMOTE);return new Response(JSON.stringify(remoteDoc),{headers:{'content-type':'application/activity+json'}});}});return{server,writes:()=>writes,lookups:()=>lookups};}

test('N0-02 unsigned loopback traffic cannot spend the verified actor inbox quota',async()=>{
  const f=fixture();try{
    for(let i=0;i<31;i++)assert.equal((await dispatch(f.server)).status,401,`unsigned request ${i+1}`);
    assert.equal(f.lookups(),0);assert.equal(f.writes(),0);
    const accepted=await dispatch(f.server,await signedFollow());assert.equal(accepted.status,202);assert.equal(accepted.body.estat,'processada');assert.equal(f.writes(),1);
  }finally{f.server.close();}
});
test('N0-02 a verified actor cannot evade its quota by changing forwarded or socket IP',async()=>{
  const f=fixture();try{
    const input=await signedFollow();for(let i=0;i<30;i++){const result=await dispatch(f.server,{...input,headers:{...input.headers,'x-forwarded-for':`203.0.113.${i+1}`},remoteAddress:i%2?'127.0.0.1':'127.0.0.2'});assert.equal(result.status,202,`verified request ${i+1}`);}
    const rejected=await dispatch(f.server,{...input,headers:{...input.headers,'x-forwarded-for':'198.51.100.1'},remoteAddress:'127.0.0.3'});assert.equal(rejected.status,429);assert.equal(f.writes(),30);
  }finally{f.server.close();}
});
test('private HTTP routes have no public CORS and no auth writes without a trusted ingress identity',async()=>{
  let handled=0;const handler={handle:async()=>{handled++;return{status:200,headers:{'Cache-Control':'no-store'},body:{user:null}};}};
  const server=creaServidor({db:{query:async()=>assert.fail('no public database')},claus,auth:handler,backend:handler,now:()=>NOW});
  try{
    const login=await dispatch(server,{url:'/api/v1/node0/auth/login',headers:{origin:'https://socdepoble.cat','content-type':'application/json'},body:'{}'});assert.equal(login.status,503);assert.equal(login.body.error,'trusted_ingress_required');assert.equal(handled,0);
    const foreign=await dispatch(server,{url:'/api/v1/node0/private/getProfile',headers:{origin:'https://socdepoble.org','content-type':'application/json'}});assert.equal(foreign.status,403);assert.equal(handled,0);
    const query=await dispatch(server,{url:'/api/v1/node0/auth/session?token=forbidden',method:'GET'});assert.equal(query.status,400);assert.equal(handled,0);
    const session=await dispatch(server,{url:'/api/v1/node0/auth/session',method:'GET'});assert.equal(session.status,200);assert.equal(handled,1);
    for(const result of[login,foreign,query,session])assert.equal(Object.keys(result.headers||{}).some(k=>k.toLowerCase()==='access-control-allow-origin'),false);
  }finally{server.close();}
});
