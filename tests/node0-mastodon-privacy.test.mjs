/** R6 privacy regression. Only signed synthetic activities + explicit PGlite. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {generateKeyPairSync,webcrypto} from 'node:crypto';
import {repActivitat} from '../tooling/node0/servidor-node0-soberania.mjs';
import {signaPeticioHttpActivityPub} from '../src/data/federacio/inboxActivityPub.js';
import {sincronitzaMastodonPrivacitat,sqlReconciliacioMastodon,preparaReconciliacioMastodon} from '../tooling/node0/reconciliacio-mastodon-node0.mjs';

const REMOTE='https://mastodont.cat/users/depoble',PUBLIC='https://www.w3.org/ns/activitystreams#Public',NOW=Date.parse('2026-11-04T19:15:00Z');
const pair=generateKeyPairSync('rsa',{modulusLength:2048}),publicKeyPem=pair.publicKey.export({format:'pem',type:'spki'});
const privateKey=await webcrypto.subtle.importKey('pkcs8',pair.privateKey.export({format:'der',type:'pkcs8'}),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
const actor={id:REMOTE,preferredUsername:'depoble',publicKey:{id:REMOTE+'#main-key',owner:REMOTE,publicKeyPem},inbox:REMOTE+'/inbox'};
const note=(patch={})=>({id:REMOTE+'/statuses/123',type:'Note',attributedTo:REMOTE,to:[PUBLIC],cc:[REMOTE+'/followers'],content:'<p>Public original</p>',published:'2026-11-04T19:00:00Z',...patch});
const account={id:'42',username:'depoble',acct:'depoble',url:'https://mastodont.cat/@depoble',uri:REMOTE};
const apiStatus=(id,patch={})=>({id,uri:REMOTE+'/statuses/'+id,url:'https://mastodont.cat/@depoble/'+id,account,visibility:'public',content:'<p>REST public</p>',created_at:'2026-11-04T19:00:00Z',...patch});
function publicApi({pages=[[]],objects={},pageFailure=false}={}){
  let page=0;const calls=[];
  return {calls,fetchImpl:async(url,options)=>{
    calls.push(url);assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);
    if(url.includes('/.well-known/webfinger'))return new Response(JSON.stringify({subject:'acct:depoble@mastodont.cat',links:[{rel:'self',type:'application/activity+json',href:REMOTE}]}),{headers:{'content-type':'application/jrd+json'}});
    if(url.includes('/accounts/lookup'))return Response.json(account);
    if(url.includes('/accounts/42/statuses')){if(pageFailure)return Response.json({error:'PRIVATE ERROR MUST NOT LEAK'},{status:500});return Response.json(pages[page++]??[]);}
    const id=/\/api\/v1\/statuses\/([0-9]+)$/.exec(url)?.[1];assert.ok(id,'only pinned public Mastodon endpoints are read');
    const value=objects[id];if(value instanceof Response)return value;
    if(value===404||value===410)return Response.json({error:'Record not found'},{status:value});
    if(value===500)return Response.json({error:'PRIVATE ERROR MUST NOT LEAK'},{status:500});
    assert.ok(value,'all individual GETs are explicitly specified by the fixture');return Response.json(value);
  }};
}
async function signed(activity){const bytes=Buffer.from(JSON.stringify(activity));const headers=await signaPeticioHttpActivityPub({url:'https://socdepoble.cat/ap/inbox',cos:bytes,keyId:REMOTE+'#main-key',clauPrivada:privateKey,ara:NOW,subtle:webcrypto.subtle});return{req:{method:'POST',url:'/ap/inbox',headers},bytes};}
const modulePath=process.env.SDP_PGLITE_MODULE;
test('individual reads run at most4 concurrently and no write occurs until every proof is complete',async()=>{
  const known=Array.from({length:9},(_,index)=>REMOTE+'/statuses/'+(100+index)),api=publicApi({objects:Object.fromEntries(known.map(uri=>{const id=uri.split('/').at(-1);return[id,apiStatus(id)];}))});
  let release;const barrier=new Promise(resolve=>{release=resolve;});let active=0,maxActive=0,started=0,writes=0,finished=0;
  const db={query:async sql=>{if(sql.startsWith('SELECT coalesce(jsonb_agg'))return known;writes++;assert.equal(finished,known.length);return{saved:9,retired:0};}};
  const fetchImpl=async(url,options)=>{if(!/\/api\/v1\/statuses\//.test(url))return api.fetchImpl(url,options);started++;active++;maxActive=Math.max(maxActive,active);await barrier;const result=await api.fetchImpl(url,options);active--;finished++;return result;};
  const pending=sincronitzaMastodonPrivacitat({db,fetchImpl,now:()=>NOW});
  while(started<4)await new Promise(resolve=>setImmediate(resolve));assert.equal(started,4);assert.equal(writes,0);release();await pending;
  assert.equal(maxActive,4);assert.equal(started,9);assert.equal(writes,1);
});
test('deadline before a late page never triggers a later reconciliation write',async()=>{
  const api=publicApi();let release,reads=0,writes=0;const barrier=new Promise(resolve=>{release=resolve;});
  const db={query:async sql=>{if(sql.startsWith('SELECT coalesce(jsonb_agg')){reads++;return[];}writes++;return{};}};
  const fetchImpl=async(url,options)=>{if(url.includes('/accounts/42/statuses')){await barrier;return Response.json([]);}return api.fetchImpl(url,options);};
  await assert.rejects(sincronitzaMastodonPrivacitat({db,fetchImpl,now:()=>NOW,deadlineMs:5}));assert.equal(reads,1);assert.equal(writes,0);release();await new Promise(resolve=>setImmediate(resolve));assert.equal(writes,0);
});
test('malformed public page rows cannot silently certify a complete snapshot',async()=>{
  for(const row of[apiStatus(123),apiStatus('123',{created_at:'not-a-date'})]){
    const api=publicApi({pages:[[row],[]]});await assert.rejects(preparaReconciliacioMastodon({fetchImpl:api.fetchImpl,now:()=>NOW}));
  }
});
if(!modulePath)test('privacy SQL needs explicit existing PGlite',{skip:'Set SDP_PGLITE_MODULE'},()=>{});
else{
  const {PGlite}=await import(modulePath.startsWith('file:')?modulePath:pathToFileURL(path.resolve(modulePath)).href);
  async function lab(fn){const pg=new PGlite();try{
    await pg.exec('CREATE SCHEMA node0; CREATE ROLE node0_runtime; CREATE TABLE node0.public_documents(kind text NOT NULL,id text NOT NULL,document jsonb NOT NULL,source_uri text,PRIMARY KEY(kind,id)); GRANT USAGE ON SCHEMA node0 TO node0_runtime; GRANT SELECT,INSERT,UPDATE,DELETE ON node0.public_documents TO node0_runtime;');
    await pg.exec(fs.readFileSync(new URL('../tooling/node0/schema-node0.sql',import.meta.url),'utf8'));await pg.exec('SET ROLE node0_runtime');
    const db={query:async sql=>{const results=await pg.exec(sql),row=results.findLast(result=>result.rows?.length)?.rows[0];return row?.[Object.keys(row)[0]];}};
    const apiReads=[];
    const receive=async(type,object,suffix=type,{restStatus}={})=>{
      const id=typeof object?.id==='string'?object.id.split('/').at(-1):'123';
      const canonical=restStatus===undefined?apiStatus(id,{content:object?.content,spoiler_text:object?.summary,sensitive:object?.sensitive,created_at:object?.published,edited_at:object?.updated}):restStatus;
      const api=publicApi({objects:{[id]:canonical}});
      return repActivitat({...await signed({id:REMOTE+'/activities/'+suffix,type,actor:REMOTE,object}),db,now:()=>NOW,request:async(url,options)=>{
        if(url===REMOTE)return new Response(JSON.stringify(actor),{headers:{'content-type':'application/activity+json'}});apiReads.push(url);return api.fetchImpl(url,options);
      }});
    };
    await fn({pg,db,receive,apiReads});
  }finally{await pg.close();}}
  test('unlisted object with Public only in cc is never projected publicly',()=>lab(async({pg,receive})=>{
    await receive('Create',note({to:[REMOTE+'/followers'],cc:[PUBLIC]}));
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,0);
  }));
  test('public Update persists edited text, sensitive and content warning under the same URI',()=>lab(async({pg,receive})=>{
    await receive('Create',note());const updated=note({content:'<p>Edited &amp; escaped</p>',summary:'<b>Advertiment</b>',sensitive:true,updated:'2026-11-04T19:10:00Z'});
    assert.equal((await receive('Update',updated)).estat,'processada');
    const result=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;
    assert.equal(result.body,'Edited & escaped');assert.equal(result.content_warning,'Advertiment');assert.equal(result.sensitive,true);
    assert.equal((await receive('Update',updated)).estat,'duplicada');
  }));
  test('private Update withdraws the known public URI and permanently prevents stale resurrection',()=>lab(async({pg,receive})=>{
    await receive('Create',note());await receive('Update',note({to:[REMOTE+'/followers'],cc:[],content:'PRIVATE MUST NOT PERSIST',updated:'2026-11-04T19:10:00Z'}));
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,0);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.tombstones')).rows[0].n,1);
    await receive('Update',note({content:'STALE PUBLIC',updated:'2026-11-04T19:11:00Z'}),'late-public');
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,0);
    assert.equal(JSON.stringify((await pg.query('SELECT * FROM node0.inbox')).rows).includes('PRIVATE MUST NOT PERSIST'),false);
  }));
  test('complete REST page absence requires individual proof, preserves public historical objects and withdraws404',()=>lab(async({pg,db,receive})=>{
    await receive('Create',note());await receive('Create',note({id:REMOTE+'/statuses/124'}),'create124');
    await pg.query("INSERT INTO node0.public_documents VALUES('agents','other-source',$1::jsonb,'https://example.org/public')",[JSON.stringify({id:'other-source',body:'unrelated'})]);
    const api=publicApi({objects:{123:apiStatus('123',{content:'<p>Edited by REST</p>',sensitive:true,spoiler_text:'<b>Warning</b>',edited_at:'2026-11-04T19:10:00Z'}),124:404}});
    const result=await sincronitzaMastodonPrivacitat({db,fetchImpl:api.fetchImpl,now:()=>NOW});
    assert.equal(result.window.complete,true);assert.equal(result.absenceDeletion,false);assert.equal(result.retired,1);
    const saved=(await pg.query("SELECT document FROM node0.public_documents WHERE id='mastodon:123'")).rows[0].document;
    assert.equal(saved.body,'Edited by REST');assert.equal(saved.sensitive,true);assert.equal(saved.content_warning,'Warning');
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM node0.tombstones WHERE id=$1",[REMOTE+'/statuses/124'])).rows[0].n,1);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM node0.public_documents WHERE kind='agents'")).rows[0].n,1);
  }));
  test('REST withdrawal recognises explicit unlisted/private/direct visibility but stores none of their text',()=>lab(async({pg,db,receive})=>{
    for(const id of['123','124','125'])await receive('Create',note({id:REMOTE+'/statuses/'+id}),'create'+id);
    const api=publicApi({objects:Object.fromEntries(['unlisted','private','direct'].map((visibility,index)=>[String(123+index),apiStatus(String(123+index),{visibility,content:'PRIVATE REST MUST NOT PERSIST'})]))});
    const result=await sincronitzaMastodonPrivacitat({db,fetchImpl:api.fetchImpl,now:()=>NOW});assert.equal(result.retired,3);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,0);assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.tombstones')).rows[0].n,3);
    assert.equal(JSON.stringify((await pg.query('SELECT * FROM node0.tombstones')).rows).includes('PRIVATE REST MUST NOT PERSIST'),false);
  }));
  test('a failed page or one failed targeted GET aborts all SQL even after another valid404 proof',()=>lab(async({pg,db,receive})=>{
    await receive('Create',note());await receive('Create',note({id:REMOTE+'/statuses/124'}),'create124');
    for(const api of[publicApi({pageFailure:true}),publicApi({objects:{123:404,124:500}})]){
      await assert.rejects(sincronitzaMastodonPrivacitat({db,fetchImpl:api.fetchImpl,now:()=>NOW}),error=>!error.message.includes('PRIVATE ERROR'));
      assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,2);assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.tombstones')).rows[0].n,0);
    }
  }));
  test('truncated200-row window never implies absence; explicit historical GETs still prove retirement or preservation',()=>lab(async({pg,db,receive})=>{
    await receive('Create',note({id:REMOTE+'/statuses/5'}),'create5');await receive('Create',note({id:REMOTE+'/statuses/6'}),'create6');
    const pages=Array.from({length:5},(_,page)=>Array.from({length:40},(_,index)=>apiStatus(String(1000-page*40-index))));
    const api=publicApi({pages,objects:{5:410,6:apiStatus('6')}}),result=await sincronitzaMastodonPrivacitat({db,fetchImpl:api.fetchImpl,now:()=>NOW});
    assert.equal(result.window.complete,false);assert.equal(result.window.pages,5);assert.equal(result.window.seen,200);assert.equal(result.retired,1);assert.equal(result.absenceDeletion,false);
    assert.ok(api.calls.includes('https://mastodont.cat/api/v1/statuses/5'));assert.ok(api.calls.includes('https://mastodont.cat/api/v1/statuses/6'));
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM node0.public_documents WHERE id='mastodon:6'")).rows[0].n,1);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,201);
  }));
  test('HTML404, wrong owned status id and foreign account all fail without retiring a known URI',()=>lab(async({pg,db,receive})=>{
    await receive('Create',note());
    const unsafe=[new Response('<html>proxy404</html>',{status:404,headers:{'content-type':'text/html'}}),apiStatus('124'),apiStatus('123',{account:{...account,id:'foreign'}})];
    for(const value of unsafe){const api=publicApi({objects:{123:value}});await assert.rejects(sincronitzaMastodonPrivacitat({db,fetchImpl:api.fetchImpl,now:()=>NOW}));assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,1);}
  }));
  test('permanent signed Delete survives a stale REST snapshot and a later public Update',()=>lab(async({pg,db,receive})=>{
    await receive('Create',note());await receive('Delete',REMOTE+'/statuses/123');
    const plan=await preparaReconciliacioMastodon({knownUris:[],fetchImpl:publicApi({pages:[[apiStatus('123')],[]]}).fetchImpl,now:()=>NOW});
    assert.equal((await db.query(sqlReconciliacioMastodon(plan))).saved,0);
    await receive('Update',note({updated:'2026-11-04T19:14:00Z'}));assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,0);
  }));
  test('older public REST source never rolls back a newer AP edit or its sensitive flag',()=>lab(async({pg,db,receive})=>{
    await receive('Create',note());await receive('Update',note({content:'Newest AP edit',sensitive:true,summary:'AP CW',updated:'2026-11-04T19:12:00Z'}));
    const api=publicApi({pages:[[apiStatus('123',{content:'Older REST copy',sensitive:false,spoiler_text:'',edited_at:'2026-11-04T19:10:00Z'})],[]]});
    await sincronitzaMastodonPrivacitat({db,fetchImpl:api.fetchImpl,now:()=>NOW});const saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;
    assert.equal(saved.body,'Newest AP edit');assert.equal(saved.sensitive,true);assert.equal(saved.content_warning,'AP CW');assert.equal(saved.source_checked_at,new Date(NOW).toISOString());
  }));
  test('coarse AP updated seconds cannot retain an older REST millisecond body after a newer canonical edit',()=>lab(async({pg,db,receive,apiReads})=>{
    const old=apiStatus('123',{content:'OLD REST BODY',sensitive:false,edited_at:'2026-11-04T19:10:00.123Z'});
    const first=await preparaReconciliacioMastodon({fetchImpl:publicApi({pages:[[old],[]]}).fetchImpl,now:()=>NOW});await db.query(sqlReconciliacioMastodon(first));
    const latest=apiStatus('123',{content:'LATEST REDACTED REST',sensitive:true,spoiler_text:'Latest warning',edited_at:'2026-11-04T19:10:00.987Z'});
    await receive('Update',note({content:'SIGNED BODY MUST NOT BE COPIED',updated:'2026-11-04T19:10:00Z'}),'newer-coarse',{restStatus:latest});
    const saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;
    assert.equal(saved.body,'LATEST REDACTED REST');assert.equal(saved.sensitive,true);assert.equal(saved.content_warning,'Latest warning');assert.equal(saved.updated_at,'2026-11-04T19:10:00.987Z');
    assert.equal(JSON.stringify(saved).includes('SIGNED BODY MUST NOT BE COPIED'),false);assert.ok(apiReads.includes('https://mastodont.cat/api/v1/statuses/123'));
  }));
  test('two out-of-order same-second AP Updates always retain the latest canonical REST redaction',()=>lab(async({pg,receive})=>{
    await receive('Create',note());const latest=apiStatus('123',{content:'REDACTED',sensitive:true,spoiler_text:'Do not disclose original',edited_at:'2026-11-04T19:10:00.987Z'});
    await receive('Update',note({content:'REDACTED',sensitive:true,updated:'2026-11-04T19:10:00Z'}),'newer',{restStatus:latest});
    await receive('Update',note({content:'OLD MUST NOT RETURN',sensitive:false,updated:'2026-11-04T19:10:00Z'}),'stale-arrives-last',{restStatus:latest});
    const saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;assert.equal(saved.body,'REDACTED');assert.equal(saved.sensitive,true);assert.equal(saved.content_warning,'Do not disclose original');
  }));
  test('public AP Update defers to explicit canonical404/nonpublic state and never persists its packet body',()=>lab(async({pg,receive})=>{
    for(const[id,canonical]of[['123',404],['124',apiStatus('124',{visibility:'private',content:'PRIVATE API BODY'})]]){
      await receive('Create',note({id:REMOTE+'/statuses/'+id}),'create'+id);
      await receive('Update',note({id:REMOTE+'/statuses/'+id,content:'PUBLIC PACKET MUST NOT OVERRIDE CANONICAL'}),'update'+id,{restStatus:canonical});
    }
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,0);assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.tombstones')).rows[0].n,2);
  }));
  test('temporary or invalid canonical Update reads return503 before claiming, allowing a safe retry',()=>lab(async({pg,receive,apiReads})=>{
    await receive('Create',note());
    for(const canonical of[500,new Response('<html>proxy404</html>',{status:404,headers:{'content-type':'text/html'}}),apiStatus('124')]){
      await assert.rejects(receive('Update',note({content:'DO NOT STORE UPDATE'}),'retry-after-source-error',{restStatus:canonical}),error=>error.status===503&&error.message==='mastodon_public_update_unavailable');
      assert.equal((await pg.query("SELECT count(*)::int AS n FROM node0.inbox WHERE type='Update'")).rows[0].n,0);
      assert.equal((await pg.query('SELECT document FROM node0.public_documents')).rows[0].document.body,'Public original');
    }
    const before=apiReads.length;await receive('Update',note({to:[REMOTE+'/followers'],cc:[],content:'PRIVATE PACKET'}),'immediate-private',{restStatus:500});assert.equal(apiReads.length,before,'nonpublic Update retires immediately without depending on REST availability');
  }));
  test('equal source version cannot downgrade account-sensitive metadata or erase a known content warning',()=>lab(async({pg,db})=>{
    const version='2026-11-04T19:10:00.123Z';
    const snapshot=async(sensitive,spoiler,at)=>preparaReconciliacioMastodon({fetchImpl:publicApi({pages:[[apiStatus('123',{content:'Same version body',sensitive,spoiler_text:spoiler,edited_at:version})],[]]}).fetchImpl,now:()=>at});
    const older=await snapshot(false,'',NOW),newer=await snapshot(true,'Known moderation warning',NOW+2000);
    await db.query(sqlReconciliacioMastodon(newer));await db.query(sqlReconciliacioMastodon(older));
    const saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;
    assert.equal(saved.sensitive,true);assert.equal(saved.content_warning,'Known moderation warning');assert.equal(saved.updated_at,version);assert.equal(saved.source_checked_at,new Date(NOW+2000).toISOString());
  }));
  test('observation clock is monotonic across older observations and never substitutes for a source version',()=>lab(async({pg,db})=>{
    const snapshot=async(version,content,sensitive,at)=>preparaReconciliacioMastodon({fetchImpl:publicApi({pages:[[apiStatus('123',{content,sensitive,edited_at:version})],[]]}).fetchImpl,now:()=>at});
    await db.query(sqlReconciliacioMastodon(await snapshot('2026-11-04T19:10:00.123Z','Old version',true,NOW+2000)));
    await db.query(sqlReconciliacioMastodon(await snapshot('2026-11-04T19:12:00.987Z','Strictly newer version',false,NOW)));
    let saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;
    assert.equal(saved.body,'Strictly newer version');assert.equal(saved.sensitive,false);assert.equal(saved.source_checked_at,new Date(NOW+2000).toISOString());
    await db.query(sqlReconciliacioMastodon(await snapshot('2026-11-04T19:10:00.123Z','Old source observed later',true,NOW+3000)));
    saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;assert.equal(saved.body,'Strictly newer version');assert.equal(saved.source_checked_at,new Date(NOW+3000).toISOString());
  }));
  test('oldest-check ordering makes bounded100-object batches progress across more than100 known URIs',()=>lab(async({pg,db})=>{
    const ids=Array.from({length:101},(_,index)=>String(1000+index));
    for(const id of ids)await pg.query("INSERT INTO node0.public_documents VALUES('feedPosts',$1,$2::jsonb,$3)",['mastodon:'+id,JSON.stringify({id:'mastodon:'+id,uri:REMOTE+'/statuses/'+id,body:'old',source:'mastodon',visibility:'public',created_at:'2026-11-04T19:00:00Z'}),REMOTE+'/statuses/'+id]);
    const objects=Object.fromEntries(ids.map(id=>[id,apiStatus(id)])),first=publicApi({objects});const result=await sincronitzaMastodonPrivacitat({db,fetchImpl:first.fetchImpl,now:()=>NOW});
    assert.equal(result.known.complete,false);assert.equal(result.known.selected,100);assert.equal(first.calls.includes('https://mastodont.cat/api/v1/statuses/1100'),false);
    const second=publicApi({objects});await sincronitzaMastodonPrivacitat({db,fetchImpl:second.fetchImpl,now:()=>NOW+1000});assert.equal(second.calls.includes('https://mastodont.cat/api/v1/statuses/1100'),true);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM node0.public_documents WHERE document ? 'source_checked_at'")).rows[0].n,101);
  }));
  test('verified R3 legacy federation pins are narrowly adopted and verification clocks can then progress',()=>lab(async({pg,db})=>{
    const uri=REMOTE+'/statuses/123',legacy={id:'mastodon:123',uri,visibility:'public',body:'Legacy text',created_at:'2026-11-04T19:00:00.000Z',federacio:{origen:'mastodon',compte:'depoble@mastodont.cat',verificacio:'https-webfinger-autor',uri}};
    await pg.query("INSERT INTO node0.public_documents VALUES('feedPosts','mastodon:123',$1::jsonb,$2)",[JSON.stringify(legacy),uri]);
    const first=publicApi({pages:[[apiStatus('123')],[]]}),result=await sincronitzaMastodonPrivacitat({db,fetchImpl:first.fetchImpl,now:()=>NOW});assert.equal(result.saved,1);
    let saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;assert.equal(saved.source,'mastodon');assert.equal(saved.uri,uri);assert.equal(saved.source_checked_at,new Date(NOW).toISOString());
    await sincronitzaMastodonPrivacitat({db,fetchImpl:publicApi({pages:[[apiStatus('123')],[]]}).fetchImpl,now:()=>NOW+1000});saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;
    assert.equal(saved.source_checked_at,new Date(NOW+1000).toISOString());assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,1);
  }));
  test('legacy adoption refuses any mismatching source, table/document identity or federation provenance pin',()=>lab(async({pg,db})=>{
    const uri=REMOTE+'/statuses/123',base={id:'mastodon:123',uri,visibility:'public',body:'Must remain untouched',federacio:{origen:'mastodon',compte:'depoble@mastodont.cat',verificacio:'https-webfinger-autor',uri}};
    const variants=[{...base,source:'unrelated'},{...base,id:'wrong-document-id'},{...base,uri:REMOTE+'/statuses/999'},...['origen','compte','verificacio','uri'].map(key=>({...base,federacio:{...base.federacio,[key]:'wrong-pin'}}))];
    const plan=await preparaReconciliacioMastodon({fetchImpl:publicApi({pages:[[apiStatus('123')],[]]}).fetchImpl,now:()=>NOW});
    for(const legacy of variants){await pg.exec('DELETE FROM node0.public_documents');await pg.query("INSERT INTO node0.public_documents VALUES('feedPosts','mastodon:123',$1::jsonb,$2)",[JSON.stringify(legacy),uri]);assert.equal((await db.query(sqlReconciliacioMastodon(plan))).saved,0);assert.deepEqual((await pg.query('SELECT document FROM node0.public_documents')).rows[0].document,legacy);}
    await pg.exec('DELETE FROM node0.public_documents');await pg.query("INSERT INTO node0.public_documents VALUES('feedPosts','mastodon:123',$1::jsonb,$2)",[JSON.stringify(base),REMOTE+'/statuses/999']);assert.equal((await db.query(sqlReconciliacioMastodon(plan))).saved,0);assert.deepEqual((await pg.query('SELECT document FROM node0.public_documents')).rows[0].document,base);
  }));
  test('an older incoming version still adopts a null legacy marker while retaining newer body and sensitive metadata',()=>lab(async({pg,db})=>{
    const uri=REMOTE+'/statuses/123',legacy={id:'mastodon:123',uri,source:null,visibility:'public',body:'Newer legacy body',sensitive:true,content_warning:'Retained moderation',created_at:'2026-11-04T19:12:00.000Z',federacio:{origen:'mastodon',compte:'depoble@mastodont.cat',verificacio:'https-webfinger-autor',uri}};
    await pg.query("INSERT INTO node0.public_documents VALUES('feedPosts','mastodon:123',$1::jsonb,$2)",[JSON.stringify(legacy),uri]);
    for(const at of[NOW,NOW+1000]){
      const result=await sincronitzaMastodonPrivacitat({db,fetchImpl:publicApi({pages:[[apiStatus('123',{content:'Older source body',sensitive:false})],[]]}).fetchImpl,now:()=>at});assert.equal(result.saved,1);
      const saved=(await pg.query('SELECT document FROM node0.public_documents')).rows[0].document;assert.equal(saved.source,'mastodon');assert.equal(saved.body,'Newer legacy body');assert.equal(saved.sensitive,true);assert.equal(saved.content_warning,'Retained moderation');assert.equal(saved.source_checked_at,new Date(at).toISOString());
    }
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM node0.public_documents')).rows[0].n,1);
  }));
}
