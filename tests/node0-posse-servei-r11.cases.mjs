import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {creaServeiPosseNodeZero} from '../tooling/node0/posse/servei-posse-node0.mjs';

const H='a'.repeat(64),ACTOR='https://mastodont.cat/users/depoble';
const TENANT='ac3bec76-255b-5ca2-8886-28fcceab4267',USER='10000000-0000-4000-8000-000000000001';
const BRIDGE='20000000-0000-4000-8000-000000000001',SOC='30000000-0000-4000-8000-000000000001';
const RENT='30000000-0000-4000-8000-000000000002',OTHER='30000000-0000-4000-8000-000000000003';
const ctx=()=>Object.freeze({sessionHash:H,expectedActor:USER});
const ref=id=>({tenantId:TENANT,sectionId:'mur',id});
const clone=structuredClone;
function fixture({enabled=true,concrete=false}={}){
  const records=new Map(),drafts=new Map(),latest=new Map(),published=new Map();
  let inventory=[],mappings=[],remoteWrites=0,transportLoads=0,tokenReads=0,credentialAllowed=true,mutationAllowed=true;
  const bridge={id:BRIDGE,configRevision:'1',remoteAccountIdentity:ACTOR,policyProofSha256:H,
    linkedAuthors:[SOC,RENT].map(id=>({kind:'entity',id,enabled:true})),policy:{excludeCommercial:true,excludedSections:['mercat']},defaultTags:['SocDePoble']};
  const bridgeRead=context=>{
    if(context.expectedActor!==USER||context.sessionHash!==H)throw Object.assign(Error('denied'),{code:'POSSE_CONFIRMATION_DENIED'});
    return clone(bridge);
  };
  const rows=()=>[...latest.values()].map(id=>({...clone(drafts.get(id)),...clone(published.get(drafts.get(id).snapshot.recordId.id)??{})}));
  function source(author=SOC,patch={}){
    const id=randomUUID(),recordId=ref(id),row={recordId,recordRevision:'1',visibility:'public',title:'Crònica del poble',summary:'Text editorial públic',
      tags:[],canonicalUrl:'https://socdepoble.org/mur/'+id,articleSha256:H,
      editorialProvenance:{authorKind:'entity',authorId:author,proofSha256:H,commercial:false},...patch};
    records.set(id,row);return row;
  }
  const repoFactory=({sessionHash,expectedActor})=>{
    const context={sessionHash,expectedActor};
    return {
      loadDefaultBridge:async()=>bridgeRead(context),loadBridge:async id=>id===BRIDGE?bridgeRead(context):null,
      loadRecord:async id=>{bridgeRead(context);return clone(records.get(id.id));},
      resolveEditorialProvenance:async({recordId})=>clone(records.get(recordId.id)?.editorialProvenance),
      certifyPrimary:async({recordId,recordRevision,canonicalUrl})=>{const row=records.get(recordId.id);return {ok:row?.recordRevision===recordRevision&&row?.canonicalUrl===canonicalUrl,url:canonicalUrl,articleSha256:row?.articleSha256};},
      listSourceRecords:async()=>{bridgeRead(context);return [...records.values()].map(row=>row.recordId);},
      savePrepared:async input=>{
        const existing=[...drafts.values()].find(row=>row.draftHash===input.draftHash);
        if(existing)return clone(existing);
        const preparedId=randomUUID(),row={...clone(input),preparedId};drafts.set(preparedId,row);latest.set(row.snapshot.recordId.id,preparedId);return clone(row);
      },
      loadPrepared:async id=>{bridgeRead(context);const row=drafts.get(id);return row?{...clone(row),...clone(published.get(row.snapshot.recordId.id)??{})}:null;},
      listPrepared:async()=>{bridgeRead(context);return rows();},
      refreshHistorical:async()=>{bridgeRead(context);return {refreshed:true};},
      historicalData:async()=>({records:[...records.values()].filter(row=>row.visibility==='public').map(row=>({recordId:row.recordId,recordRevision:row.recordRevision,canonicalUrl:row.canonicalUrl,primaryCertified:true})),mappings:clone(mappings),inventory:clone(inventory)}),
      claimConfirmed:async input=>{
        const row=drafts.get(input.preparedId),existing=published.get(row.snapshot.recordId.id);
        return {state:'claimed',quotaReserved:true,leaseId:input.preparedId,approvedSnapshot:clone(row.snapshot),externalStatusId:existing?.externalStatusId??null,operation:existing?'update':'create'};
      },
      startDispatch:async()=>({authorized:true}),
      complete:async input=>{const row=drafts.get(input.leaseId);published.set(row.snapshot.recordId.id,{externalStatusId:input.externalStatusId,externalUrl:input.externalUrl,publishedHash:input.draftHash});},
      certifyCredential:async({tokenSha256,requiredScopes})=>{if(!credentialAllowed)throw Error('credential revoked');return {tokenSha256,accountIdentity:ACTOR,scopes:requiredScopes,certificationId:H};},
      authorizeMutation:async()=>{if(!mutationAllowed)throw Error('authority revoked');return {allowed:true};},
      releaseUnsent:async()=>{},markIndeterminate:async()=>{}
    };
  };
  const transport={requiredScopes:()=>['profile','write:statuses'],preflight:async()=>({accountIdentity:ACTOR,certificationId:H,scopes:['profile','write:statuses']}),
    publishStatus:async({externalStatusId})=>({id:externalStatusId??String(++remoteWrites),url:'https://mastodont.cat/@depoble/'+(externalStatusId??remoteWrites)}),validateResult:()=>true};
  const fetchImpl=async(url,options)=>{
    if(url.endsWith('/verify_credentials'))return Response.json({id:'42',username:'depoble',acct:'depoble',url:'https://mastodont.cat/@depoble',uri:ACTOR});
    assert.equal(url,'https://mastodont.cat/api/v1/statuses');assert.equal(options.method,'POST');
    remoteWrites++;return Response.json({id:String(remoteWrites),account:{id:'42'},visibility:'public',url:'https://mastodont.cat/@depoble/'+remoteWrites,uri:ACTOR+'/statuses/'+remoteWrites});
  };
  const service=creaServeiPosseNodeZero({db:{query(){}},tenantId:TENANT,publishingEnabled:enabled,repositoryFactory:repoFactory,
    ...(concrete?{fetchImpl,tokenProvider:async()=>{tokenReads++;return 'SYNTHETIC_ONLY_R11_TOKEN';}}:{transportForBridge:async()=>{transportLoads++;return transport;}})});
  return {service,source,bridge,records,published,setInventory:value=>{inventory=value;},setMappings:value=>{mappings=value;},counts:()=>({remoteWrites,transportLoads,tokenReads}),
    denyCredential:()=>{credentialAllowed=false;},denyMutation:()=>{mutationAllowed=false;}};
}
const confirmation=row=>({id:row.id,hash_esborrany:row.hash_esborrany,revisio_politica:row.revisio_politica,confirm:true});
async function list(s){const session=await s.service.creaMotorPerSessio(ctx());await session.prepareCurrent({});return {session,rows:await session.listPrepared({})};}

test('GET preparation is per-session, durable and transport-free for both eligible entity authors',async()=>{
  const s=fixture();s.source(SOC);s.source(RENT);
  const {rows}=await list(s);assert.equal(rows.length,2);
  assert.ok(rows.every(row=>row.estat==='preparat'&&row.hash_esborrany.length===64&&row.revisio_politica==='1'));
  const again=await list(s);assert.deepEqual(again.rows.map(row=>row.id),rows.map(row=>row.id));
  assert.deepEqual(s.counts(),{remoteWrites:0,transportLoads:0,tokenReads:0});
  await assert.rejects(s.service.creaMotorPerSessio({sessionHash:'bad',expectedActor:USER}));
  const foreign=await s.service.creaMotorPerSessio({...ctx(),expectedActor:OTHER});await assert.rejects(foreign.loadDefaultBridge(),e=>e.code==='POSSE_CONFIRMATION_DENIED');
});
test('nonlinked entity, commercial source and market section never enter the prepared tray',async()=>{
  const s=fixture();s.source(SOC);s.source(OTHER);s.source(RENT,{editorialProvenance:{authorKind:'entity',authorId:RENT,proofSha256:H,commercial:true}});
  const market=s.source(SOC);market.recordId.sectionId='mercat';market.canonicalUrl=market.canonicalUrl.replace('/mur/','/mercat/');
  const {rows}=await list(s);assert.equal(rows.length,1);assert.deepEqual(s.counts(),{remoteWrites:0,transportLoads:0,tokenReads:0});
});
test('the institutional service refuses a separately authorized foreign account bridge even for reads',async()=>{
  const s=fixture();s.source();const session=await s.service.creaMotorPerSessio(ctx());
  s.bridge.remoteAccountIdentity='https://mastodon.example.invalid/users/cooperative';
  await assert.rejects(session.loadDefaultBridge(),e=>e.code==='POSSE_BRIDGE_UNAVAILABLE');
  await assert.rejects(session.prepareCurrent({bridgeId:BRIDGE}),e=>e.code==='POSSE_BRIDGE_UNAVAILABLE');
  await assert.rejects(session.listPrepared({bridgeId:BRIDGE}),e=>e.code==='POSSE_BRIDGE_UNAVAILABLE');
  assert.deepEqual(s.counts(),{remoteWrites:0,transportLoads:0,tokenReads:0});
});
test('canonical and proved legacy matches remain possible replicas and block both confirm payloads before credentials',async()=>{
  for(const legacy of [false,true]){
    const s=fixture(),record=s.source(),link=legacy?'https://socdepoble.net/2022/old/':record.canonicalUrl;
    if(legacy)s.setMappings([{recordId:record.recordId,canonicalUrl:record.canonicalUrl,legacyUrl:link,proofSha256:H}]);
    s.setInventory([{id:'900',url:'https://mastodont.cat/@depoble/900',accountIdentity:ACTOR,links:[link],proofSha256:H}]);
    const {session,rows:[row]}=await list(s);assert.equal(row.estat,'possible_replica');assert.equal(row.confirmationReady,false);assert.equal(row.remoteDraftHashVerified,false);
    await assert.rejects(session.publishConfirmation(confirmation(row)),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
    await assert.rejects(session.motor.publish({bridgeId:BRIDGE,bridgeRevision:row.bridgeRevision,preparedId:row.id,recordRevision:row.recordRevision,draftHash:row.draftHash,confirm:true},ctx()),e=>e.code==='POSSE_CONFIRMATION_DENIED');
    // The captured request context, not a second lookalike object, owns this motor.
    await assert.rejects(session.motor.publish({bridgeId:BRIDGE,bridgeRevision:row.bridgeRevision,preparedId:row.id,recordRevision:row.recordRevision,draftHash:row.draftHash,confirm:true}),e=>e.code==='POSSE_RECONCILIATION_REQUIRED');
    assert.equal(s.counts().transportLoads,0);assert.equal(s.counts().remoteWrites,0);
  }
});
test('current ledger hash is canonical-published; a later prepared edit retains remote ID as a pending update',async()=>{
  const s=fixture(),record=s.source(),{session,rows:[row]}=await list(s);
  await session.publishConfirmation(confirmation(row));
  let current=(await list(s)).rows[0];assert.equal(current.estat,'ja_publicat_canonic');assert.equal(current.needsUpdate,false);
  const counts=s.counts();assert.equal((await session.publishConfirmation(confirmation(current))).created,false);assert.deepEqual(s.counts(),counts);
  record.recordRevision='2';record.title='Revisió editorial';record.articleSha256='b'.repeat(64);
  current=(await list(s)).rows[0];assert.equal(current.estat,'preparat');assert.equal(current.needsUpdate,true);assert.equal(current.externalStatusId,'1');assert.equal(current.publishedDraftMatches,false);
  await assert.rejects(session.publishConfirmation(confirmation(row)),e=>e.code==='POSSE_PREPARED_STALE');
});
test('policy edits and missing exact human confirmation cannot read a credential',async()=>{
  const s=fixture({concrete:true});s.source();const {session,rows:[row]}=await list(s);
  for(const patch of [{confirm:false},{confirm:'true'},{hash_esborrany:'bad'},{revisio_politica:'2'},{authorId:SOC}])await assert.rejects(session.publishConfirmation({...confirmation(row),...patch}));
  s.bridge.configRevision='2';await assert.rejects(session.publishConfirmation(confirmation(row)),e=>e.code==='POSSE_PREPARED_STALE');
  assert.equal(s.counts().tokenReads,0);assert.equal(s.counts().remoteWrites,0);
});
test('concrete credential and immediate mutation gates remain lazy and refuse revoked proofs before a POST',async()=>{
  for(const gate of ['denyCredential','denyMutation']){
    const s=fixture({concrete:true});s.source();const {session,rows:[row]}=await list(s);
    assert.equal(s.counts().tokenReads,0);s[gate]();await assert.rejects(session.publishConfirmation(confirmation(row)));
    assert.equal(s.counts().tokenReads,1);assert.equal(s.counts().remoteWrites,0);
  }
  const s=fixture({concrete:true});s.source();const {session,rows:[row]}=await list(s);assert.equal((await session.publishConfirmation(confirmation(row))).state,'published');assert.equal(s.counts().remoteWrites,1);
});
