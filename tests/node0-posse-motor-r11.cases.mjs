/** Deterministic LAB orchestration tests. The fake ledger tests the DI contract;
 * PostgreSQL durability/ACL is independently exercised by posse-ledger tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {creaMotorPosse,jsonPosse} from '../tooling/node0/posse/motor-posse.mjs';

const H='a'.repeat(64),ACTOR='https://mastodont.cat/users/depoble';
const BRIDGE='00000000-0000-4000-8000-000000000001',OTHER='00000000-0000-4000-8000-000000000002';
const AUTHOR='10000000-0000-4000-8000-000000000001',OIL='10000000-0000-4000-8000-000000000002';
const ref={tenantId:'ac3bec76-255b-5ca2-8886-28fcceab4267',sectionId:'mur',id:'20000000-0000-4000-8000-000000000001'};
const clone=value=>structuredClone(value);
function scenario({enabled=true}={}){
  const context={},badContext={},events=[],prepared=new Map(),leases=new Map(),states=new Map();let sequence=0,quota=true,certified=true,postError=false,completeError=false;
  const bridges=new Map([[BRIDGE,{id:BRIDGE,configRevision:'1',remoteAccountIdentity:ACTOR,policyProofSha256:H,linkedAuthors:[{kind:'entity',id:AUTHOR,enabled:true}],policy:{excludeCommercial:true,excludedSections:['mercat','marketItems']},defaultTags:['SocDePoble']}]]);
  let record={recordId:clone(ref),recordRevision:'1',visibility:'public',commercial:false,canonicalUrl:'https://socdepoble.org/mur/cronica',title:'Crònica',summary:'Resum net',tags:[]},provenance={authorKind:'entity',authorId:AUTHOR,proofSha256:H,commercial:false};
  const identity=(row,account)=>jsonPosse([row.snapshot.recordId,account]);
  const repository={
    loadBridge:async id=>clone(bridges.get(id)),loadRecord:async()=>clone(record),resolveEditorialProvenance:async()=>clone(provenance),
    savePrepared:async value=>{const old=[...prepared.values()].find(row=>row.draftHash===value.draftHash);if(old)return clone(old);const row={...clone(value),preparedId:'draft'+(++sequence)};prepared.set(row.preparedId,row);return clone(row);},
    listPrepared:async bridgeId=>clone([...prepared.values()].filter(row=>row.snapshot.bridge.bridgeId===bridgeId)),loadPrepared:async id=>clone(prepared.get(id)),
    claimConfirmed:async input=>{
      const row=prepared.get(input.preparedId),bridge=bridges.get(input.bridgeId);if(record.recordRevision!==input.expectedRevision||bridge.configRevision!==input.expectedBridgeRevision||row.draftHash!==input.draftHash||provenance.proofSha256!==input.editorialProof)return{state:'stale'};
      const key=identity(row,input.remoteAccountIdentity),existing=states.get(key);
      if(existing?.state==='indeterminate')return{state:'indeterminate'};if(existing?.state==='claimed')return{state:'busy'};
      if(existing?.state==='published'&&existing.draftHash===row.draftHash)return{state:'published',externalStatusId:existing.externalStatusId,externalUrl:existing.externalUrl};
      if(!quota)return{state:'quota-denied'};
      const leaseId='lease'+(++sequence),state={state:'claimed',key,leaseId,row,externalStatusId:existing?.externalStatusId??null,mediaId:existing?.mediaId??null};states.set(key,state);leases.set(leaseId,state);events.push('claim');
      return{state:'claimed',leaseId,quotaReserved:true,approvedSnapshot:clone(row.snapshot),operation:state.externalStatusId?'update':'create',externalStatusId:state.externalStatusId,mediaId:state.mediaId};
    },
    startDispatch:async({leaseId,stage})=>{const state=leases.get(leaseId);assert.equal(state.state,'claimed');events.push('durable:'+stage);state.dispatchStarted=true;return{authorized:true};},
    saveMedia:async({leaseId,mediaId})=>{leases.get(leaseId).mediaId=mediaId;events.push('saved-media');},
    releaseMediaPending:async({leaseId})=>{const state=leases.get(leaseId);state.state='media-pending';state.row.state='media-pending';},
    readPublicMedia:async()=>({bytes:new Uint8Array([1,2,3]),mimeType:'image/png'}),
    complete:async({leaseId,externalStatusId,externalUrl,draftHash})=>{if(completeError)throw Error('PRIVATE DB DIAGNOSTIC');const state=leases.get(leaseId);Object.assign(state,{state:'published',externalStatusId,externalUrl,draftHash});Object.assign(state.row,{state:'published',externalStatusId,externalUrl});events.push('complete');},
    markIndeterminate:async({leaseId})=>{const state=leases.get(leaseId);if(state.state!=='published'){state.state='indeterminate';state.row.state='indeterminate';}events.push('indeterminate');},
    releaseUnsent:async({leaseId})=>{const state=leases.get(leaseId);states.delete(state.key);events.push('released-unsent');}
  };
  let creates=0,updates=0,uploads=0,preflights=0;
  const transport={requiredScopes:({media})=>['profile','write:statuses',...(media?['write:media']:[])],preflight:async({requiredScopes})=>{preflights++;return{accountIdentity:ACTOR,scopes:requiredScopes,certificationId:H};},uploadMedia:async()=>{uploads++;assert.equal(events.at(-1),'durable:media-post');return{id:'50',ready:true};},getMedia:async()=>({id:'50',ready:true}),
    publishStatus:async input=>{assert.equal(events.at(-1),'durable:'+ (input.operation==='create'?'status-post':'status-put'));if(input.operation==='create')creates++;else updates++;if(postError)throw Error('PRIVATE TOKEN OR RESPONSE');return{id:input.externalStatusId??'900',url:'https://mastodont.cat/@depoble/'+(input.externalStatusId??'900'),uri:'https://mastodont.cat/users/depoble/statuses/'+(input.externalStatusId??'900'),accountIdentity:ACTOR};},
    validateResult:result=>result.accountIdentity===ACTOR};
  const motor=creaMotorPosse({repository,transportForBridge:async()=>transport,authorizeBridge:async supplied=>({allowed:supplied===context,actorProof:H}),certificaArticle:async({canonicalUrl})=>certified?{ok:true,url:canonicalUrl,articleSha256:H}:{ok:false},publishingEnabled:enabled,now:()=>Date.parse('2026-11-04T20:00:00Z')});
  const prepare=()=>motor.prepare({bridgeId:BRIDGE,recordId:ref},context);
  const confirmation=row=>({bridgeId:BRIDGE,bridgeRevision:row.bridgeRevision,preparedId:row.preparedId,recordRevision:row.recordRevision,draftHash:row.draftHash,confirm:true});
  return{motor,repository,transport,context,badContext,bridges,events,prepare,confirmation,counts:()=>({creates,updates,uploads,preflights}),setRecord:patch=>{record={...record,...patch};},setProvenance:patch=>{provenance={...provenance,...patch};},setQuota:value=>{quota=value;},setCertified:value=>{certified=value;},setPostError:value=>{postError=value;},setCompleteError:value=>{completeError=value;}};
}

test('prepare/list/historical only stage drafts and never call credential or publication transports',async()=>{
  const s=scenario(),row=await s.prepare();assert.equal(row.state,'prepared');assert.equal(row.confirmationRequired,true);
  assert.equal((await s.motor.listPrepared({bridgeId:BRIDGE},s.context)).length,1);
  const batch=await s.motor.queueHistorical({bridgeId:BRIDGE,recordIds:[ref]},s.context);assert.equal(batch.state,'prepared-only');assert.deepEqual(s.counts(),{creates:0,updates:0,uploads:0,preflights:0});
});
test('auth-disabled mode permits authorised preview but refuses publication before credential access',async()=>{
  const s=scenario({enabled:false}),row=await s.prepare();await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_PUBLISH_DISABLED');assert.equal(s.counts().preflights,0);
});
test('body cannot force commercial author eligibility or provide replacement draft/publisher fields',async()=>{
  const s=scenario();s.setRecord({recordId:{...ref,sectionId:'mercat'},canonicalUrl:'https://socdepoble.org/mercat/oli',commercial:true});s.setProvenance({authorId:OIL,commercial:true});
  await assert.rejects(s.motor.prepare({bridgeId:BRIDGE,recordId:{...ref,sectionId:'mercat'}},s.context),e=>e.code==='POSSE_EDITORIAL_NOT_ELIGIBLE');await assert.rejects(s.motor.prepare({bridgeId:BRIDGE,recordId:ref,allowCommercial:true},s.context),e=>e.code==='POSSE_INPUT_INVALID');assert.equal(s.counts().creates,0);
});
test('the same universal engine permits an owner bridge with a different explicit commercial policy',async()=>{
  const s=scenario();s.bridges.set(OTHER,{...clone(s.bridges.get(BRIDGE)),id:OTHER,remoteAccountIdentity:'https://another.example/users/cooperativa',linkedAuthors:[{kind:'entity',id:OIL,enabled:true}],policy:{excludeCommercial:false,excludedSections:[]}});
  s.setRecord({recordId:{...ref,sectionId:'mercat'},canonicalUrl:'https://socdepoble.org/mercat/oli',commercial:true});s.setProvenance({authorId:OIL,commercial:true});
  const row=await s.motor.prepare({bridgeId:OTHER,recordId:{...ref,sectionId:'mercat'}},s.context);assert.equal(row.state,'prepared');assert.equal(row.bridgeId,OTHER);assert.equal(s.counts().creates,0);
});
test('bridge and owner authorisation apply even to empty lists and cannot be forged by body fields',async()=>{
  const s=scenario();await assert.rejects(s.motor.listPrepared({bridgeId:BRIDGE},s.badContext),e=>e.code==='POSSE_CONFIRMATION_DENIED');await assert.rejects(s.motor.prepare({bridgeId:BRIDGE,recordId:ref},s.badContext),e=>e.code==='POSSE_CONFIRMATION_DENIED');
});
test('human confirmation binds current record revision and bridge policy revision before any transport effect',async()=>{
  const s=scenario(),row=await s.prepare();s.setRecord({recordRevision:'2'});await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_PREPARED_STALE');assert.equal(s.counts().preflights,0);
  s.setRecord({recordRevision:'1'});s.bridges.get(BRIDGE).configRevision='2';await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_PREPARED_STALE');assert.equal(s.counts().creates,0);
});
test('SPA fallback or changed primary article proof blocks confirmation rather than treating HTTP200 as publication',async()=>{
  const s=scenario();s.setCertified(false);const row=await s.prepare();assert.equal(row.state,'needs-primary-publication');await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_PRIMARY_ARTICLE_UNVERIFIED');assert.equal(s.counts().preflights,0);
});
test('duplicate and concurrent confirms create at most one automatic remote status',async()=>{
  const s=scenario(),row=await s.prepare(),results=await Promise.allSettled([s.motor.publish(s.confirmation(row),s.context),s.motor.publish(s.confirmation(row),s.context)]);
  assert.ok(results.some(result=>result.status==='fulfilled'));assert.equal(s.counts().creates,1);const repeated=await s.motor.publish(s.confirmation(row),s.context);assert.equal(repeated.created,false);assert.equal(s.counts().creates,1);
});
test('a later source revision or slug change updates the existing remote ID using PUT and never creates a second status',async()=>{
  const s=scenario(),first=await s.prepare();await s.motor.publish(s.confirmation(first),s.context);
  s.setRecord({recordRevision:'2',canonicalUrl:'https://socdepoble.org/mur/new-slug',title:'New title'});const second=await s.prepare(),result=await s.motor.publish(s.confirmation(second),s.context);
  assert.equal(result.externalStatusId,'900');assert.equal(result.created,false);assert.deepEqual({creates:s.counts().creates,updates:s.counts().updates},{creates:1,updates:1});
});
test('ambiguous status dispatch is durable indeterminate and a later confirmation never retries POST',async()=>{
  const s=scenario(),row=await s.prepare();s.setPostError(true);await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_RECONCILIATION_REQUIRED'&&!e.message.includes('PRIVATE'));
  s.setPostError(false);await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');assert.equal(s.counts().creates,1);
});
test('remote success followed by a database completion error also blocks another POST',async()=>{
  const s=scenario(),row=await s.prepare();s.setCompleteError(true);await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');assert.equal(s.counts().creates,1);
  s.setCompleteError(false);await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');assert.equal(s.counts().creates,1);
});
test('a local no-dispatch transport claim cannot release a committed durable dispatch marker',async()=>{
  const s=scenario(),row=await s.prepare();let calls=0;
  s.transport.publishStatus=async()=>{calls++;throw Object.assign(Error('local refusal'),{effect:'not-dispatched'});};
  s.repository.releaseUnsent=async()=>assert.fail('a dispatch marker must never be released');
  await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
  await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
  assert.equal(calls,1);assert.ok(s.events.includes('indeterminate'));
});
test('quota refusal yields zero dispatch and media bytes must match the human-approved snapshot',async()=>{
  const s=scenario(),row=await s.prepare();s.setQuota(false);await assert.rejects(s.motor.publish(s.confirmation(row),s.context),e=>e.code==='POSSE_CLAIM_REFUSED');assert.equal(s.counts().creates,0);
  s.setQuota(true);s.setRecord({recordRevision:'2',cover:{public:true,blobRef:'public/cover',sha256:createHash('sha256').update(new Uint8Array([1,2,4])).digest('hex'),mimeType:'image/png',bytes:3,alt:'Public poster',thumbnailUrl:'https://socdepoble.org/media/cover.png'}});
  const withMedia=await s.prepare();await assert.rejects(s.motor.publish(s.confirmation(withMedia),s.context),e=>e.code==='POSSE_MEDIA_CHANGED');assert.equal(s.counts().uploads,0);assert.equal(s.counts().creates,0);
});
test('media is durably recorded before status publication and no credential is exposed in the result',async()=>{
  const s=scenario();s.setRecord({cover:{public:true,blobRef:'public/cover',sha256:createHash('sha256').update(new Uint8Array([1,2,3])).digest('hex'),mimeType:'image/png',bytes:3,alt:'Public poster',thumbnailUrl:'https://socdepoble.org/media/cover.png'}});
  const row=await s.prepare(),result=await s.motor.publish(s.confirmation(row),s.context);assert.equal(result.state,'published');assert.equal(s.counts().uploads,1);assert.ok(s.events.indexOf('saved-media')<s.events.indexOf('durable:status-post'));assert.equal(JSON.stringify(result).includes('Bearer'),false);
});
test('listing retains published remote identity while exposing current draft and a stale needs-update flag',async()=>{
  const s=scenario(),row=await s.prepare();await s.motor.publish(s.confirmation(row),s.context);s.setRecord({recordRevision:'2',title:'Current edited title'});
  const listed=(await s.motor.listPrepared({bridgeId:BRIDGE},s.context))[0];assert.equal(listed.published,true);assert.equal(listed.externalStatusId,'900');assert.equal(listed.stale,true);assert.equal(listed.needsUpdate,true);assert.equal(listed.confirmationReady,false);assert.ok(listed.draft.status.includes('Current edited title'));
  assert.notEqual(listed.draftHash,listed.preparedDraftHash);assert.equal(s.counts().creates,1);
});
test('listing a withdrawn source keeps published identity without showing its previous content or enabling confirmation',async()=>{
  const s=scenario(),row=await s.prepare();await s.motor.publish(s.confirmation(row),s.context);s.setRecord({visibility:'private'});
  const listed=(await s.motor.listPrepared({bridgeId:BRIDGE},s.context))[0];assert.equal(listed.state,'source-withdrawn');assert.equal(listed.published,true);assert.equal(listed.externalStatusId,'900');assert.equal(listed.draft,null);assert.equal(listed.needsWithdrawal,true);assert.equal(listed.confirmationReady,false);
});
test('listing preserves indeterminate and pending media states instead of falsely resetting them to prepared',async()=>{
  const uncertain=scenario(),row=await uncertain.prepare();uncertain.setPostError(true);await assert.rejects(uncertain.motor.publish(uncertain.confirmation(row),uncertain.context));
  assert.equal((await uncertain.motor.listPrepared({bridgeId:BRIDGE},uncertain.context))[0].state,'indeterminate');
  const pending=scenario();pending.transport.uploadMedia=async()=>({id:'50',ready:false});pending.setRecord({cover:{public:true,blobRef:'public/cover',sha256:createHash('sha256').update(new Uint8Array([1,2,3])).digest('hex'),mimeType:'image/png',bytes:3,alt:'Poster',thumbnailUrl:'https://socdepoble.org/media/cover.png'}});
  const mediaRow=await pending.prepare();assert.equal((await pending.motor.publish(pending.confirmation(mediaRow),pending.context)).state,'media-pending');assert.equal((await pending.motor.listPrepared({bridgeId:BRIDGE},pending.context))[0].state,'media-pending');assert.equal(pending.counts().creates,0);
});
