/** Independent Node0 adversarial probes. Real crypto and (opt-in) actual PostgreSQL WASM SQL.
 * HTTP server handlers are exercised via emit/Readable; no listening socket or remote effect.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { generateKeyPairSync, webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaServidor, repActivitat, drenaOutbox } from '../tooling/node0/servidor-node0-soberania.mjs';
import { creaPlaMigracions, preparaHidratacio, generaSql, ROOT } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { creaPostgres, sqlText, sqlJson, sqlDesaDocuments } from '../tooling/node0/postgres-node0.mjs';
import { peticioMastodont } from '../tooling/node0/xarxa-node0.mjs';
import { signaPeticioHttpActivityPub } from '../src/data/federacio/inboxActivityPub.js';
import { verificaRfc9421Independent } from './fixtures/node0-rfc9421/receiver-independent.mjs';
import { creaActivitatMastodon } from '../src/data/federacio/pontMastodon.js';

const PUBLIC='https://www.w3.org/ns/activitystreams#Public';
const LOCAL='https://socdepoble.cat/ap/actors/socdepoble';
const REMOTE='https://mastodont.cat/users/depoble';
const NOW=Date.UTC(2026,10,4,16,0,0);
const ADMIN='adversarial-fixture-not-a-real-secret-0123456789';
const remoteKeys=generateKeyPairSync('rsa',{modulusLength:2048});
const privateKey=await webcrypto.subtle.importKey('pkcs8',remoteKeys.privateKey.export({format:'der',type:'pkcs8'}),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
const localKeys=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const publicKeyPem=pem(await webcrypto.subtle.exportKey('spki',localKeys.publicKey));
const claus={fingerprint:'fixture-fingerprint',publicKeyPem,privateKey:localKeys.privateKey};
const remoteDoc={id:REMOTE,type:'Person',preferredUsername:'depoble',inbox:REMOTE+'/inbox',publicKey:{id:REMOTE+'#main-key',owner:REMOTE,publicKeyPem:remoteKeys.publicKey.export({format:'pem',type:'spki'})}};
const request=async url=>{assert.equal(url,REMOTE);return new Response(JSON.stringify(remoteDoc),{headers:{'content-type':'application/activity+json'}})};
const note=(id='112233')=>({id:REMOTE+'/statuses/'+id,type:'Note',attributedTo:REMOTE,to:[PUBLIC],content:'<p>Salut &amp; poble</p>',published:'2026-11-04T16:00:00Z'});
const create=(id='112233',suffix='')=>({id:REMOTE+'/statuses/'+id+'/activity'+suffix,type:'Create',actor:REMOTE,to:[PUBLIC],object:note(id)});
async function signed(activity,{url='/ap/inbox',signUrl=url,changeBody=null}={}){
  let bytes=Buffer.from(JSON.stringify(activity));
  const headers=await signaPeticioHttpActivityPub({url:'https://socdepoble.cat'+signUrl,cos:bytes,keyId:REMOTE+'#main-key',clauPrivada:privateKey,ara:NOW,subtle:webcrypto.subtle});
  if(changeBody)bytes=Buffer.from(changeBody(bytes));
  return{req:{method:'POST',url,headers:{...headers,'content-type':'application/activity+json'}},bytes};
}
async function dispatch(server,{url='/',method='GET',headers={},body=''}={}){
  const req=Readable.from(body?[Buffer.from(body)]:[]);Object.assign(req,{url,method,headers:{host:'socdepoble.cat',...headers},socket:{remoteAddress:'127.0.0.1'}});
  return new Promise(resolve=>{
    let status;const replyHeaders={};const res={headersSent:false,setHeader(k,v){replyHeaders[k.toLowerCase()]=v;},getHeader(k){return replyHeaders[k.toLowerCase()];},getHeaders(){return{...replyHeaders};},writeHead(s,h){status=s;for(const[k,v]of Object.entries(h||{}))replyHeaders[k.toLowerCase()]=v;this.headersSent=true;},end(bytes){resolve({status,headers:replyHeaders,body:JSON.parse(bytes)})}};
    server.emit('request',req,res);
  });
}

test('strong admin credential and same-origin gate happen before DB or remote effects',async()=>{
  let touched=0;const server=creaServidor({db:{query:()=>{touched++;throw Error('unexpected')}},claus,token:ADMIN,request:()=>{touched++;throw Error('unexpected')},now:()=>NOW});
  for(const [headers,status] of [[{},401],[{authorization:'Bearer '+ADMIN,origin:'https://attacker.example'},403],[{authorization:'Bearer '+ADMIN,origin:'https://socdepoble.org'},403]]){
    const res=await dispatch(server,{url:'/api/v1/node0/activitypub/publish',method:'POST',headers:{'content-type':'application/json',...headers},body:'{}'});assert.equal(res.status,status);
  }
  assert.equal(touched,0);server.close();
});
test('configured OAuth and admin bearer cannot bypass AH09 editorial confirmation',async()=>{
  let touched=0;
  const server=creaServidor({db:{query:()=>{touched++;throw Error('unexpected')}},claus,token:ADMIN,mastodonToken:'synthetic-oauth-fixture-no-authority',request:()=>{touched++;throw Error('unexpected')},now:()=>NOW});
  try{
    for(const url of['/api/v1/node0/mastodon/publish','/api/v1/node0/activitypub/publish']){
      for(const body of[{title:'arbitrary draft',visibility:'public'}, {confirm:true,id:'forged-approval'}]){
        const result=await dispatch(server,{url,method:'POST',headers:{authorization:'Bearer '+ADMIN,'content-type':'application/json',origin:'https://socdepoble.cat'},body:JSON.stringify(body)});
        assert.equal(result.status,503);assert.equal(result.body.error,'posse_editorial_confirmation_required');
      }
    }
    assert.equal(touched,0);
  }finally{server.close();}
});
test('public GET is readable from .org and other origins without granting credentialed writes',async()=>{
  let reads=0;const server=creaServidor({db:{status:async()=>{reads++;return{ok:true,version:'17.11'};},documents:async()=>[]},claus,token:ADMIN,now:()=>NOW});
  try{
    for(const origin of['https://socdepoble.org','https://public-reader.example','null']){
      for(const url of['/api/v1/node0/status','/api/v1/node0/core','/api/v1/node0/mur','/ap/actors/socdepoble']){
        const res=await dispatch(server,{url,headers:{origin}});assert.equal(res.status,200,`${origin} ${url}`);
        assert.equal(res.headers['access-control-allow-origin'],'*');assert.equal(res.headers['access-control-allow-credentials'],undefined);
        assert.equal(JSON.stringify(res.body).includes(ADMIN),false);
      }
    }
    assert.equal(reads,3);
  }finally{server.close();}
});
test('public status exposes a real unhealthy database response to cross-origin readers',async()=>{
  const server=creaServidor({db:{status:async()=>{throw Error('fixture database unavailable');}},claus,token:ADMIN,now:()=>NOW});
  try{const res=await dispatch(server,{url:'/api/v1/node0/status',headers:{origin:'https://socdepoble.org'}});assert.equal(res.status,503);assert.equal(res.headers['access-control-allow-origin'],'*');assert.equal(res.headers['access-control-allow-credentials'],undefined);assert.equal(res.body.postgresql.ok,false);}
  finally{server.close();}
});
test('wrong signed path and tampered digest never reach storage',async()=>{
  let touched=0;const db={query:()=>{touched++;throw Error('unexpected')}};
  for(const options of [{url:'/ap/inbox',signUrl:'/ap/inbox/socdepoble'},{changeBody:b=>b.toString().replace('Salut','Privat')}]){
    const input=await signed(create(),options);
    await assert.rejects(repActivitat({...input,db,request,claus,now:()=>NOW}),e=>e.status===401);
  }
  assert.equal(touched,0);
});
test('public Create wrapper does not expose a privately addressed object',async()=>{
  const activity=create();activity.object.to=[REMOTE+'/followers'];activity.object.content='PRIVATE SENTINEL MUST NOT PERSIST';let sql;
  const result=await repActivitat({...await signed(activity),db:{query:async statement=>{sql=statement;return{estat:'processada'};}},request,claus,now:()=>NOW});
  assert.equal(result.estat,'processada');assert.equal(sql.includes(Buffer.from(activity.object.content).toString('base64')),false);assert.equal(sql.includes(activity.object.content),false);
});
test('DNS resolution is bounded and disallowed origins never resolve',async()=>{
  let resolved=0;
  await assert.rejects(peticioMastodont('https://127.0.0.1/',{resolver:async()=>{resolved++;return[]}}),/origin_rejected/);
  assert.equal(resolved,0);
  await assert.rejects(peticioMastodont(REMOTE,{timeoutMs:15,resolver:()=>new Promise(()=>{})}),/remote_timeout/);
});
test('libpq host and options cannot bypass the local runtime connection',()=>{
  const base={PGDATABASE:'socdepoble_node0',PGHOST:'/tmp',PGUSER:'node0_runtime'};
  for(const change of [{PGHOST:'/tmp,remote.example'},{PGHOSTADDR:'8.8.8.8'},{PGSERVICE:'x'},{PGOPTIONS:'-c role=postgres'}])assert.throws(()=>creaPostgres({env:{...base,...change}}));
});
const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('SQL adversarial probes need explicit existing PGlite',{skip:'No PostgreSQL SQL executed without SDP_PGLITE_MODULE'},()=>{});
else{
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));
  const {PGlite}=await import(moduleURL.href);const {pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
  test('RSA Follow/Create/Delete use runtime ACL, durable atomic claims and no resurrection',async()=>{
    const pg=new PGlite({extensions:{pgcrypto}});let queries=0;
    try{
      const plan=creaPlaMigracions();await pg.exec(generaSql(plan,await preparaHidratacio(),{advisoryLock:false}));
      await pg.exec(fs.readFileSync(path.join(ROOT,'tooling/node0/schema-node0.sql'),'utf8'));
      await pg.exec('SET ROLE node0_runtime');
      const db={query:async sql=>{queries++;const row=(await pg.exec(sql)).findLast(result=>result.rows?.length)?.rows[0];return row?.[Object.keys(row)[0]];}};
      const rep=async(activity,options)=>repActivitat({...await signed(activity,options),db,request,claus,now:()=>NOW});
      const follow={id:REMOTE+'/follows/1',type:'Follow',actor:REMOTE,object:LOCAL,untrustedPayload:'x'.repeat(96*1024),privateMarker:'SENTINEL_MUST_NOT_REFLECT'};
      assert.equal((await rep(follow)).estat,'processada');assert.equal((await rep(follow)).estat,'duplicada');
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.followers')).rows[0].n,1);
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.outbox')).rows[0].n,1);
      const acceptedObject=(await pg.query("SELECT activity->'object' AS object FROM node0.outbox WHERE activity->>'type'='Accept'")).rows[0].object;
      assert.deepEqual(acceptedObject,{id:follow.id,type:'Follow',actor:REMOTE,object:LOCAL});
      assert.equal(JSON.stringify(acceptedObject).includes('SENTINEL_MUST_NOT_REFLECT'),false);
      // REST has already saved this exact URI under its canonical id.
      const existing={id:'mastodon:112233',uri:note().id,visibility:'public',body:'API record'};
      await pg.query(`INSERT INTO node0.public_documents(kind,id,document,source_uri) VALUES('feedPosts',${sqlText(existing.id)},${sqlJson(existing)},${sqlText(existing.uri)})`);
      assert.equal((await rep(create())).estat,'processada');
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents WHERE source_uri=$1',[note().id])).rows[0].n,1);
      assert.equal((await rep(create())).estat,'duplicada');
      const deletion={id:REMOTE+'/deletes/112233',type:'Delete',actor:REMOTE,object:note().id};
      assert.equal((await rep(deletion)).estat,'processada');
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents WHERE source_uri=$1',[note().id])).rows[0].n,0);
      assert.equal((await rep(create('112233','/late'))).estat,'processada');
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents WHERE source_uri=$1',[note().id])).rows[0].n,0);
      // Execute the production REST synchronization SQL itself: a stale API response
      // must not revive a Note already deleted through authenticated ActivityPub.
      const syncReceipt=await db.query(sqlDesaDocuments('feedPosts',[existing]));
      assert.deepEqual(syncReceipt,{received:1,saved:0});
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents WHERE source_uri=$1',[note().id])).rows[0].n,0);
      const server=creaServidor({db,claus,token:ADMIN,request,now:()=>NOW});
      const followers=await dispatch(server,{url:'/ap/followers/socdepoble'});assert.equal(followers.status,200);assert.equal(followers.body.totalItems,1);
      const input={id:'real-local-post',visibility:'public',title:'El poble',summary:'Una publicació',url:'https://socdepoble.org/mur/prova'};
      const queued=await dispatch(server,{url:'/api/v1/node0/activitypub/publish',method:'POST',headers:{authorization:'Bearer '+ADMIN,'content-type':'application/json'},body:JSON.stringify(input)});
      assert.equal(queued.status,503);assert.equal(queued.body.error,'posse_editorial_confirmation_required');
      const duplicate=await dispatch(server,{url:'/api/v1/node0/activitypub/publish',method:'POST',headers:{authorization:'Bearer '+ADMIN,'content-type':'application/json'},body:JSON.stringify(input)});
      assert.equal(duplicate.status,503);assert.equal(duplicate.body.error,'posse_editorial_confirmation_required');
      const reordered=await dispatch(server,{url:'/api/v1/node0/activitypub/publish',method:'POST',headers:{authorization:'Bearer '+ADMIN,'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(Object.entries(input).reverse()))});
      assert.equal(reordered.status,503);assert.equal(reordered.body.error,'posse_editorial_confirmation_required');
      assert.equal((await pg.query("SELECT count(*)::int AS n FROM node0.outbox WHERE activity->>'type'='Create'")).rows[0].n,0);
      // AH09 removes the arbitrary HTTP queue entry. Seed one clearly synthetic
      // approved-job fixture solely to retain real SQL drain/lease/signature and
      // object-dereference coverage; this does not certify the future POSSE claim.
      const fixtureActivity=creaActivitatMastodon(input,{publicat:new Date(NOW).toISOString(),id:'https://socdepoble.cat/ap/objects/sdp-'+'a'.repeat(64)});
      const seed=()=>pg.query('INSERT INTO node0.outbox(id,target,activity) VALUES($1,$2,$3::jsonb) ON CONFLICT DO NOTHING RETURNING id',[fixtureActivity.id,REMOTE+'/inbox',JSON.stringify(fixtureActivity)]);
      assert.equal((await seed()).rows.length,1);assert.equal((await seed()).rows.length,0);
      const nativeObject=(await pg.query("SELECT activity->'object' AS object FROM node0.outbox WHERE activity->>'type'='Create'")).rows[0].object;
      const dereferenced=await dispatch(server,{url:new URL(nativeObject.id).pathname});
      assert.equal(dereferenced.status,200);assert.equal(dereferenced.body.id,nativeObject.id);assert.equal(dereferenced.body.type,'Note');
      let deliveries=0;
      const drainOptions={db,claus,now:()=>NOW,request:async(url,options)=>{
        deliveries++;
        const verification=verificaRfc9421Independent({method:'POST',url,headers:options.headers,body:options.body,now:NOW,keyId:LOCAL+'#ed25519',publicKeyPem});
        assert.equal(verification.valida,true);
        assert.equal(verificaRfc9421Independent({method:'POST',url,headers:options.headers,body:options.body+' ',now:NOW,keyId:LOCAL+'#ed25519',publicKeyPem}).valida,false);
        return new Response(null,{status:202});
      }};
      await Promise.all([drenaOutbox(drainOptions),drenaOutbox(drainOptions)]);
      assert.equal(deliveries,2); // Follow Accept and the queued native Create.
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.outbox WHERE delivered_at IS NOT NULL')).rows[0].n,2);
      assert.equal((await pg.query('SELECT bool_and(attempts=1 AND lease_until IS NULL AND lease_owner IS NULL) AS ok FROM node0.outbox')).rows[0].ok,true);
      server.close();assert.ok(queries>8);
    }finally{await pg.close();}
  });
}
function pem(buffer){return '-----BEGIN PUBLIC KEY-----\n'+Buffer.from(buffer).toString('base64').match(/.{1,64}/g).join('\n')+'\n-----END PUBLIC KEY-----\n';}
