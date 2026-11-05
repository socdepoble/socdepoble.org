import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {once} from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {main} from '../tooling/node0/servidor-node0-soberania.mjs';
import {creaFixturePosse} from './node0-posse-fixture.mjs';

async function freePort(){
  const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
  const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));return port;
}
const proof=row=>({id:row.id,hash_esborrany:row.hash_esborrany,revisio_politica:row.revisio_politica,confirm:true});

test('main→real HTTP→per-session SQL persists institutional drafts, requires exact approval and deduplicates canonical history',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL HTTP proof'},async()=>{
  const f=await creaFixturePosse();let server;
  const requests=[];let nextId=9100;
  const signalCounts=['SIGTERM','SIGINT'].map(name=>process.listenerCount(name));
  const actor='https://mastodont.cat/users/depoble',profile='https://mastodont.cat/@depoble';
  const account={id:'123',username:'depoble',acct:'depoble',url:profile,uri:actor};
  const remote=async(url,options)=>{
    requests.push({url,method:options.method,body:options.body});
    if(url==='https://mastodont.cat/api/v1/accounts/verify_credentials'){
      assert.equal(options.method,'GET');return Response.json(account);
    }
    assert.match(url,/^https:\/\/mastodont\.cat\/api\/v1\/statuses(?:\/[0-9]+)?$/);
    assert.ok(['POST','PUT'].includes(options.method));
    const body=JSON.parse(options.body);assert.equal(body.visibility,'public');
    assert.match(body.status,/https:\/\/socdepoble\.org\/mur\//);
    const id=options.method==='PUT'?url.split('/').at(-1):String(++nextId);
    return Response.json({id,visibility:'public',account,url:profile+'/'+id,uri:actor+'/statuses/'+id});
  };
  try{
    const original=await f.source({title:'Primera publicació de Sóc de Poble'});
    const rentonar=await f.source({author:'rentonar',title:'Publicació d’El Rentonar'});
    const historical=await f.source({title:'Article ja enllaçat al compte remot'});
    await f.observe(historical,{id:'7001'});
    await f.source({section:'mercat',certified:false,title:'Oli del Mercat exclòs'});
    await f.source({author:'oli-comercial',commercial:true,title:'Comerç exclòs encara que siga públic'});
    await f.source({visibility:'private',certified:false,title:'Privat exclòs'});
    await f.source({certified:false,title:'Fila privada sense prova d’article públic'});
    const port=await freePort();
    server=await main({SDP_NODE0_PORT:String(port),SDP_NODE0_AUTH:'1',SDP_NODE0_POSSE:'1',SDP_NODE0_POSSE_PUBLISH:'1',
      SDP_NODE0_AUTH_RATE_SECRET:Buffer.alloc(32,9).toString('hex'),SDP_NODE0_PROXY_SECRET:Buffer.alloc(32,7).toString('hex'),MASTODON_ACCESS_TOKEN:f.remoteToken},{
      creaPostgres:()=>f.db,carregaClaus:async()=>({fingerprint:'synthetic-fixture',publicKeyPem:'synthetic-fixture'}),
      creaSalutResiliencia:()=>({refresh:async()=>{},read:()=>({})}),
      creaMastodonInboundPeriodic:()=>({start(){},stop:async()=>{},read:()=>({enabled:false})}),request:remote
    });
    if(!server.address())await once(server,'listening');
    const call=async(path,{person=f.alice,body}={})=>{
      const response=await fetch(`http://127.0.0.1:${port}/api/v1/node0/mastodon/${path}`,{
        method:body===undefined?'GET':'POST',headers:{origin:'https://socdepoble.cat',...(person?{cookie:person.cookie,'x-sdp-expected-actor':person.id}:{}),...(body===undefined?{}:{'content-type':'application/json'})},
        ...(body===undefined?{}:{body:JSON.stringify(body)})});
      return {status:response.status,body:await response.json()};
    };
    const tray=await call('preparades');assert.equal(tray.status,200,JSON.stringify(tray));
    assert.equal(requests.length,0,'GET must never touch the outgoing transport');
    assert.equal(tray.body.publications.length,3);
    const find=(rows,source)=>rows.find(row=>row.recordId.id===source.recordId.id);
    const first=find(tray.body.publications,original),second=find(tray.body.publications,rentonar),held=find(tray.body.publications,historical);
    assert.equal(first.estat,'preparat');assert.equal(second.estat,'preparat');
    assert.match(first.hash_esborrany,/^[a-f0-9]{64}$/);assert.equal(first.revisio_politica,f.bridge.configRevision);
    assert.equal(held.estat,'possible_replica');assert.equal(held.confirmationReady,false);
    assert.equal(held.existing[0].externalStatusId,'7001');assert.equal(held.remoteDraftHashVerified,false);
    assert.equal((await call('preparades',{person:null})).status,401);
    assert.equal((await call('preparades',{person:f.bob})).status,403);
    assert.equal((await call('publish',{body:{...proof(first),confirm:false}})).status,409);
    assert.equal((await call('publish',{person:f.bob,body:proof(first)})).status,403);
    assert.equal((await call('publish',{body:{...proof(first),hash_esborrany:'0'.repeat(64)}})).status,409);
    assert.equal((await call('publish',{body:proof(held)})).status,409);
    assert.equal(requests.length,0,'invalid or historical confirmation must not even preflight OAuth');

    const published=await call('publish',{body:proof(first)});
    assert.equal(published.status,200,JSON.stringify(published));assert.equal(published.body.created,true);
    assert.equal(requests.filter(r=>r.method==='POST').length,1);
    const after=await call('preparades');assert.equal(after.status,200);
    const current=find(after.body.publications,original);
    assert.equal(current.estat,'ja_publicat_canonic');assert.equal(current.remoteDraftHashVerified,true);
    const count=requests.length;
    const repeat=await call('publish',{body:proof(current)});
    assert.equal(repeat.status,200);assert.equal(repeat.body.created,false);assert.equal(requests.length,count);
    const restartRepository=f.repoFor(f.alice);
    assert.equal((await restartRepository.loadPrepared(first.id)).externalStatusId,published.body.externalStatusId);

    // A new source revision needs its own primary-publication certificate and
    // approval. The old remote ID survives; a new GET cannot claim it is current.
    await f.source({id:original.recordId.id,title:'Revisió pública de Sóc de Poble'});
    const edited=await call('preparades');assert.equal(edited.status,200,JSON.stringify(edited));
    const update=find(edited.body.publications,original);
    assert.equal(update.estat,'preparat');assert.equal(update.needsUpdate,true);assert.equal(update.externalStatusId,current.externalStatusId);
    assert.notEqual(update.hash_esborrany,first.hash_esborrany);
    assert.equal((await call('publish',{body:proof(first)})).status,409);
    assert.equal(requests.length,count);
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    assert.deepEqual(['SIGTERM','SIGINT'].map(name=>process.listenerCount(name)),signalCounts);
    await f.close();
  }
});

test('main rejects missing or drifted POSSE schema before key generation and never runs the installer',async()=>{
  let keys=0,queries=0;
  await assert.rejects(main({SDP_NODE0_AUTH:'1',SDP_NODE0_POSSE:'1'}, {
    creaPostgres:()=>({verificaRol:async()=>true,verificaRolAutenticador:async()=>true,query:async sql=>{queries++;assert.equal(sql,'SELECT node0_posse.readiness();');return{version:'old'};}}),
    carregaClaus:async()=>{keys++;throw Error('unexpected keys');}
  }),/posse_schema_drift/);
  assert.equal(queries,1);assert.equal(keys,0);
});

test('main wires certified local public media through upload checkpoint before the confirmed status',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL HTTP proof'},async()=>{
  const f=await creaFixturePosse(),root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-r11-public-media-'));
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9QkAAAAASUVORK5CYII=','base64');
  fs.mkdirSync(path.join(root,'covers'));fs.writeFileSync(path.join(root,'covers','fixture'),bytes);
  let server;const calls=[];
  const account={id:'123',username:'depoble',acct:'depoble',url:'https://mastodont.cat/@depoble',uri:'https://mastodont.cat/users/depoble'};
  const remote=async(url,options)=>{
    calls.push([options.method,url]);
    if(url.endsWith('/accounts/verify_credentials'))return Response.json(account);
    if(url==='https://mastodont.cat/api/v2/media'){
      assert.equal(options.method,'POST');assert.ok(Buffer.isBuffer(options.body));assert.ok(options.body.includes(bytes));
      return Response.json({id:'6101',type:'image',url:'https://mastodont.cat/media/6101.png'});
    }
    assert.equal(url,'https://mastodont.cat/api/v1/statuses');assert.equal(options.method,'POST');
    assert.deepEqual(JSON.parse(options.body).media_ids,['6101']);
    return Response.json({id:'9201',visibility:'public',account,url:'https://mastodont.cat/@depoble/9201',uri:'https://mastodont.cat/users/depoble/statuses/9201'});
  };
  try{
    const source=await f.source();
    await f.pg.query('UPDATE node0_posse.publication_certifications SET cover=$1 WHERE record_id=$2',[{
      blobRef:'covers/fixture',sha256:createHash('sha256').update(bytes).digest('hex'),mimeType:'image/png',bytes:bytes.length,
      alt:'Cartell públic sintètic',thumbnailUrl:'https://socdepoble.org/assets/fixture.png',public:true
    },source.recordId.id]);
    const port=await freePort();
    server=await main({SDP_NODE0_PORT:String(port),SDP_NODE0_AUTH:'1',SDP_NODE0_POSSE:'1',SDP_NODE0_POSSE_PUBLISH:'1',SDP_NODE0_POSSE_MEDIA_DIR:root,
      SDP_NODE0_AUTH_RATE_SECRET:Buffer.alloc(32,9).toString('hex'),SDP_NODE0_PROXY_SECRET:Buffer.alloc(32,7).toString('hex'),MASTODON_ACCESS_TOKEN:f.remoteToken},{
      creaPostgres:()=>f.db,carregaClaus:async()=>({fingerprint:'synthetic-fixture'}),
      creaSalutResiliencia:()=>({refresh:async()=>{},read:()=>({})}),
      creaMastodonInboundPeriodic:()=>({start(){},stop:async()=>{},read:()=>({enabled:false})}),request:remote
    });
    if(!server.address())await once(server,'listening');
    const headers={origin:'https://socdepoble.cat',cookie:f.alice.cookie,'x-sdp-expected-actor':f.alice.id};
    const tray=await fetch(`http://127.0.0.1:${port}/api/v1/node0/mastodon/preparades`,{headers});
    assert.equal(tray.status,200);const row=(await tray.json()).publications[0];
    assert.equal(calls.length,0);assert.equal(row.draft.cover.bytes,bytes.length);
    const response=await fetch(`http://127.0.0.1:${port}/api/v1/node0/mastodon/publish`,{
      method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(proof(row))});
    const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));
    assert.equal(result.created,true);assert.deepEqual(calls.map(c=>c[0]),['GET','POST','POST']);
    assert.equal((await f.repo.loadPrepared(row.id)).publishedHash,row.hash_esborrany);
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    await f.close();fs.rmSync(root,{recursive:true,force:true});
  }
});
