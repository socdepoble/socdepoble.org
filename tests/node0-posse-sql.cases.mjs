import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {creaFixturePosse} from './node0-posse-fixture.mjs';
import {creaMotorPosse} from '../tooling/node0/posse/motor-posse.mjs';
import {creaRepositoriPosse} from '../tooling/node0/posse/repositori-posse.mjs';
import {hashSessioNodeZero} from '../tooling/node0/auth-node0.mjs';
import {verificaEsquemaPosseNodeZero,instalaEsquemaPosseNodeZero} from '../tooling/node0/posse/instal-la-posse-node0.mjs';
const HASH='3'.repeat(64);

test('R11 canonical SQL sources, institutional policy, durable approval and dedup gates',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL SQL proof'},async t=>{
 const f=await creaFixturePosse();let effects=0;
 const credential=()=>f.repo.certifyCredential({bridgeId:f.bridge.id,tokenSha256:f.tokenSha256,requiredScopes:['read:accounts','write:statuses']});
 const motor=creaMotorPosse({repository:f.repo,certificaArticle:input=>f.repo.certifyPrimary(input),authorizeBridge:async()=>({allowed:true,actorProof:HASH}),publishingEnabled:true,transportForBridge:async()=>({requiredScopes:()=>['read:accounts','write:statuses'],preflight:credential,publishStatus:async()=>{effects++;return{id:String(8000+effects),url:'https://mastodont.cat/@depoble/'+(8000+effects)};},validateResult:()=>true})});
 const prepare=row=>motor.prepare({bridgeId:f.bridge.id,recordId:row.recordId},{});
 const stored=p=>f.repo.loadPrepared(p.preparedId);
 const claim=async p=>{const d=await stored(p),c=await credential();return f.repo.claimConfirmed({bridgeId:f.bridge.id,preparedId:p.preparedId,expectedBridgeRevision:p.bridgeRevision,expectedRevision:p.recordRevision,draftHash:p.draftHash,editorialProof:d.snapshot.editorialProvenance.proofSha256,bridgePolicyProof:d.snapshot.bridge.policyProofSha256,actorProof:HASH,remoteAccountIdentity:f.bridge.remoteAccountIdentity,credentialCertificationId:c.certificationId});};
 const cadence=()=>f.pg.query('UPDATE node0_posse.bridges SET next_reserved_at=NULL WHERE id=$1',[f.bridge.id]);
 const scalar=async(sql,args=[])=>Object.values((await f.pg.query(sql,args)).rows[0])[0];
 try{
  await t.test('schema readiness checks all request-role grants and survives repeat installation',async()=>{
   assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
   let ownerCalls=0;const ownerDb={async query(sql,options){ownerCalls++;assert.equal(options.privateValues,false);const results=await f.pg.exec(sql);const row=[...results].reverse().find(x=>x.rows?.length)?.rows[0];return row?Object.values(row)[0]:null;}};
   assert.equal(await instalaEsquemaPosseNodeZero({db:ownerDb}),true);assert.equal(ownerCalls,2);

   for(const role of ['anon','authenticated','node0_runtime','node0_authenticator'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal(await scalar("SELECT has_table_privilege($1,'node0_posse.publication_certifications',$2)",[role,privilege]),false);
   await f.pg.exec('GRANT INSERT ON node0_posse.publication_certifications TO anon');await assert.rejects(verificaEsquemaPosseNodeZero({db:f.db}),/posse_schema_drift/);await f.pg.exec('REVOKE INSERT ON node0_posse.publication_certifications FROM anon');
   await f.pg.exec('CREATE OR REPLACE FUNCTION node0_posse.source_current(t uuid,s text,i uuid) RETURNS jsonb LANGUAGE sql AS $$SELECT NULL::jsonb$$');await assert.rejects(verificaEsquemaPosseNodeZero({db:f.db}),/posse_schema_drift/);
   await f.pg.exec(fs.readFileSync(new URL('../tooling/node0/posse/posse-ledger.sql',import.meta.url),'utf8'));assert.equal(await verificaEsquemaPosseNodeZero({db:f.db}),true);
  });
  await t.test('only certified current originals of the two real mapped institutional authors are enumerated',async()=>{
   const yes=await f.source(),rent=await f.source({author:'rentonar'}),missing=await f.source({certified:false}),members=await f.source({visibility:'members'}),market=await f.source({section:'mercat',commercial:false}),oil=await f.source({author:'oli-comercial',commercial:false}),commercial=await f.source({commercial:true}),loop=await f.source({source:'mastodon'});
   await f.pg.exec('BEGIN');await f.pg.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[f.alice.id]);
   await f.pg.query(`UPDATE public.section_submissions SET payload=payload||'{"source":"mastodon"}'::jsonb WHERE id=$1`,[loop.recordId.id]);await f.pg.exec('COMMIT');
   await f.pg.query('UPDATE node0_posse.publication_certifications SET source_revision=(SELECT node0_posse.source_revision(s) FROM public.section_submissions s WHERE s.id=$1) WHERE record_id=$1',[loop.recordId.id]);
   const rows=await f.repo.listSourceRecords(f.bridge.id),ids=rows.map(r=>r.id);assert.ok(ids.includes(yes.recordId.id));assert.ok(ids.includes(rent.recordId.id));for(const no of [missing,members,market,oil,commercial,loop])assert.ok(!ids.includes(no.recordId.id));
   assert.equal(await f.repo.loadRecord(missing.recordId,{bridgeId:f.bridge.id}),null);assert.equal(await f.repo.loadRecord(members.recordId,{bridgeId:f.bridge.id}),null);
   const raw=await scalar('SELECT payload FROM public.section_submissions WHERE id=$1',[missing.recordId.id]);assert.equal(raw.visibility,'public','payload public alone cannot grant publication');
  });
  await t.test('default bridge reads canonical mapping and rejects wrong session actor, tenant and unrelated person',async()=>{
   const b=await f.repo.loadDefaultBridge();assert.equal(b.ownerOrgId,f.orgs.socdepoble.id);assert.equal(b.secretRef,undefined);
   await assert.rejects(f.repoFor(f.bob).loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
   const wrong=creaRepositoriPosse({db:f.db,sessionHash:hashSessioNodeZero({cookie:f.bob.cookie}),expectedActor:f.alice.id,tenantId:f.tenantId});await assert.rejects(wrong.loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
   const foreign=creaRepositoriPosse({db:f.db,sessionHash:hashSessioNodeZero({cookie:f.alice.cookie}),expectedActor:f.alice.id,tenantId:randomUUID()});await assert.rejects(foreign.loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
  });
  await t.test('durable drafts survive repository restart and repeated prepare is idempotent',async()=>{
   const row=await f.source(),a=await prepare(row),b=await prepare(row);assert.equal(a.preparedId,b.preparedId);assert.match(a.draftHash,/^[a-f0-9]{64}$/);
   const restarted=f.repoFor(f.alice);assert.equal((await restarted.loadPrepared(a.preparedId)).draftHash,a.draftHash);assert.equal(await scalar('SELECT count(*)::int FROM node0_posse.records WHERE record_id=$1',[row.recordId.id]),1);
   await assert.rejects(f.pg.query("UPDATE node0_posse.drafts SET snapshot='{}' WHERE id=$1",[a.preparedId]),e=>e.message==='posse_immutable_snapshot');
  });
  await t.test('uncertified edited source invalidates both preparation and confirmation',async()=>{
   const row=await f.source(),p=await prepare(row);await f.source({id:row.recordId.id,title:'Changed source',certified:false});await cadence();
   await assert.rejects(claim(p),e=>e.code==='POSSE_PREPARED_STALE');assert.equal(effects,0);
  });
  await t.test('institutional exclusions cannot be loosened through bridge configuration',async()=>{
   await assert.rejects(f.repo.configureBridge({...f.config,policy:{excludeCommercial:false,excludedSections:[]}}),e=>e.code==='POSSE_CONFIRMATION_DENIED');
   const b=await f.repo.loadBridge(f.bridge.id);assert.equal(b.policy.excludeCommercial,true);assert.ok(b.policy.excludedSections.includes('mercat'));
   await assert.rejects(f.repo.configureBridge({...f.config,linkedAuthors:[{kind:'entity',id:f.orgs['oli-comercial'].id,enabled:true}]}),e=>e.code==='POSSE_CONFIRMATION_DENIED');
  });
  await t.test('exact canonical remote link is a durable possible replica and blocks claim without GET dependency',async()=>{
   const row=await f.source(),p=await prepare(row);await f.observe(row);await cadence();
   await assert.rejects(claim(p),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
   const before=await scalar('SELECT count(*)::int FROM node0_posse.approvals');await f.repo.refreshHistorical(f.bridge.id);const h=await f.repo.historicalData(f.bridge.id);assert.ok(h.records.some(r=>r.recordId.id===row.recordId.id));assert.ok(h.inventory.some(o=>o.id==='7001'));
   assert.equal(await scalar('SELECT action FROM node0_posse.historical_plans WHERE bridge_id=$1 AND record_id=$2',[f.bridge.id,row.recordId.id]),'review-link-existing');assert.equal(await scalar('SELECT published_hash FROM node0_posse.records WHERE record_id=$1',[row.recordId.id]),null);assert.equal(await scalar('SELECT count(*)::int FROM node0_posse.approvals'),before);
  });
  await t.test('proved legacy URL aliases block new POST and other remote accounts cannot create false holds',async()=>{
   const row=await f.source(),p=await prepare(row);await f.observe(row,{id:'7100',account:'https://other.example/users/other'});await cadence();const c=await claim(p);assert.equal(c.state,'claimed');await f.repo.releaseUnsent({leaseId:c.leaseId});
   const legacy='https://socdepoble.net/2022/11/17/legacy-r11/';await f.pg.query('INSERT INTO node0_posse.legacy_aliases VALUES($1,$2,$3,$4,$5,$6)',[f.tenantId,'mur',row.recordId.id,legacy,row.canonicalUrl,HASH]);await f.observe(row,{id:'7101',links:[legacy]});await cadence();await assert.rejects(claim(p),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
  });
  await t.test('a canonical duplicate observed after claim blocks start and actual mutation gate',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.observe(row,{id:'7201'});await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');assert.equal(await scalar('SELECT dispatch_stage FROM node0_posse.attempts WHERE lease_id=$1',[c.leaseId]),null);await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('two confirmations share a stable record and one active lease',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const claims=await Promise.all([claim(p),claim(p)]);assert.deepEqual(claims.map(c=>c.state).sort(),['busy','claimed']);const c=claims.find(v=>v.state==='claimed');await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('credential proof is stable across scope subsets and rotation invalidates approved dispatch',async()=>{
   const a=await credential(),b=await f.repo.certifyCredential({bridgeId:f.bridge.id,tokenSha256:f.tokenSha256,requiredScopes:['write:statuses']});assert.equal(a.certificationId,b.certificationId);
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.pg.query("UPDATE node0_posse.remote_bindings SET credential_sha256=repeat('9',64) WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$1)",[f.bridge.id]);
   await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}),e=>e.code==='POSSE_PREPARED_STALE');await f.repo.releaseUnsent({leaseId:c.leaseId});await f.pg.query('UPDATE node0_posse.remote_bindings SET credential_sha256=$1 WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$2)',[f.tokenSha256,f.bridge.id]);
  });
  await t.test('published hash belongs to the exact approved version and later source changes require update',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const sent=await motor.publish({bridgeId:f.bridge.id,bridgeRevision:p.bridgeRevision,preparedId:p.preparedId,recordRevision:p.recordRevision,draftHash:p.draftHash,confirm:true},{});assert.equal(sent.created,true);assert.equal(effects,1);const d=await stored(p);assert.equal(d.publishedHash,p.draftHash);
   await f.source({id:row.recordId.id,title:'Edited public article'});const p2=await prepare(row),row2=(await f.repo.listPrepared(f.bridge.id)).find(d=>d.preparedId===p2.preparedId);assert.notEqual(row2.publishedHash,row2.draftHash);assert.equal(row2.externalStatusId,sent.externalStatusId);
  });
  await t.test('attested cover changes invalidate an already approved snapshot before dispatch',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);
   await f.pg.query(`UPDATE node0_posse.publication_certifications SET cover='{"public":true,"blobRef":"public/changed"}'::jsonb WHERE record_id=$1`,[row.recordId.id]);
   await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}),e=>e.code==='POSSE_PREPARED_STALE');
   await f.pg.query('UPDATE node0_posse.publication_certifications SET cover=NULL WHERE record_id=$1',[row.recordId.id]);await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('binding and ownership revocation are rechecked before dispatch',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.pg.query('UPDATE node0_posse.remote_bindings SET revoked_at=clock_timestamp() WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$1)',[f.bridge.id]);await assert.rejects(f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'}));assert.equal(await scalar('SELECT dispatch_stage FROM node0_posse.attempts WHERE lease_id=$1',[c.leaseId]),null);await f.pg.query('UPDATE node0_posse.remote_bindings SET revoked_at=NULL WHERE id=(SELECT binding_id FROM node0_posse.bridges WHERE id=$1)',[f.bridge.id]);await f.repo.releaseUnsent({leaseId:c.leaseId});
  });
  await t.test('positive exact draft observation resolves uncertainty, URL match alone does not',async()=>{
   const row=await f.source(),p=await prepare(row);await cadence();const c=await claim(p);await f.repo.startDispatch({leaseId:c.leaseId,stage:'status-post'});await f.repo.markIndeterminate({leaseId:c.leaseId,stage:'status-post',mediaId:null,externalStatusId:null,externalUrl:null});
   await f.observe(row,{id:'7501'});await assert.rejects(f.repo.reconcile({leaseId:c.leaseId,externalStatusId:'7501'}),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');await f.observe(row,{id:'7501',draftHash:p.draftHash});await f.repo.reconcile({leaseId:c.leaseId,externalStatusId:'7501'});assert.equal((await stored(p)).publishedHash,p.draftHash);
  });
 }finally{await f.close();}
});
