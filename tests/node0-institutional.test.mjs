import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {IDENTITAT_INSTITUCIONAL_NODE0 as I,webFingerInstitucional} from '../tooling/node0/identitat-institucional-node0.mjs';
import {creaServidor} from '../tooling/node0/servidor-node0-soberania.mjs';
test('institutional designation binds Drive, sender and canonical resource while preserving existing actor IDs',()=>{
  assert.ok(Object.isFrozen(I));assert.equal(I.account,'socdepoble@socdepoble.org');assert.equal(I.mailFrom,I.account);assert.equal(I.canonicalResource,'acct:'+I.account);
  for(const[resource,actor]of[[I.canonicalResource,I.canonicalActor],[I.nodeResource,I.nodeActor]]){
    const doc=webFingerInstitucional(resource);assert.equal(doc.subject,resource);assert.equal(doc.links.find(l=>l.rel==='self').href,actor);
    assert.equal(doc.aliases.includes('https://mastodont.cat/users/depoble'),false);assert.equal(doc.aliases.some(a=>a.startsWith('acct:')),false);
    assert.ok(doc.links.some(l=>l.rel==='related'&&l.href===I.posseProfile));
  }
  assert.equal(webFingerInstitucional('acct:other@socdepoble.org'),null);assert.equal(webFingerInstitucional(I.canonicalResource+'@attacker.example'),null);
});
async function get(server,url){
  const req=Readable.from([]);Object.assign(req,{url,method:'GET',headers:{host:'socdepoble.cat'}});
  return new Promise(resolve=>{let status;const headers={};server.emit('request',req,{headersSent:false,setHeader(k,v){headers[k.toLowerCase()]=v;},writeHead(code,values){status=code;Object.assign(headers,values);this.headersSent=true;},end(value){resolve({status,headers,body:JSON.parse(value)});}});});
}
test('Node0 serves both known discovery resources and refuses duplicate or unknown resources',async()=>{
  const server=creaServidor({db:{},claus:{fingerprint:'fixture'}});
  try{
    for(const resource of[I.canonicalResource,I.nodeResource]){
      const r=await get(server,'/.well-known/webfinger?resource='+encodeURIComponent(resource));assert.equal(r.status,200);assert.equal(r.body.subject,resource);assert.equal(r.headers['Content-Type'],'application/jrd+json');
    }
    assert.equal((await get(server,'/.well-known/webfinger?resource='+encodeURIComponent(I.canonicalResource)+'&resource='+encodeURIComponent(I.nodeResource))).status,400);
    assert.equal((await get(server,'/.well-known/webfinger?resource=acct%3Aunknown%40socdepoble.org')).status,404);
  }finally{server.close();}
});
