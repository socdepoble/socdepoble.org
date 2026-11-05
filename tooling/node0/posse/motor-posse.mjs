/** AH09 durable orchestration. Preparation is the default; publication needs trusted server
 * authorship, primary-article certification, human confirmation and quota CAS.
 * No network implementation or credentials are loaded by this module.
 */
import {createHash} from 'node:crypto';
import {formataPosse,clauPosse,identitatPosse} from './formatador-posse.mjs';

const HASH=/^[a-f0-9]{64}$/,UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const remoteId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const fail=(code,status=409)=>{throw Object.assign(Error(code),{code,status});};
function plain(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
function exact(value,keys){if(!plain(value)||Object.keys(value).some(key=>!keys.includes(key))||Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>!Object.hasOwn(d,'value')))fail('POSSE_INPUT_INVALID',400);}
export function jsonPosse(value){
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isSafeInteger(value))return JSON.stringify(value);
  if(Array.isArray(value))return'['+value.map(jsonPosse).join(',')+']';
  if(plain(value))return'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+jsonPosse(value[key])).join(',')+'}';
  fail('POSSE_SNAPSHOT_INVALID',400);
}
const sha=value=>createHash('sha256').update(value).digest('hex');
const sameRecord=(a,b)=>jsonPosse(identitatPosse(a))===jsonPosse(identitatPosse(b));
function revision(value){if(typeof value!=='string'||!value||value.length>128||/[\s\x00-\x1f\x7f]/.test(value))fail('POSSE_REVISION_REQUIRED',400);return value;}
/** Observation clocks do not change a draft. Bind the exact editorial proof,
 * primary article body hash, record revision, formatted text and media digest. */
export function hashEsborranyPosse(snapshot){
  return sha(jsonPosse({bridge:snapshot.bridge,recordId:snapshot.recordId,recordRevision:snapshot.recordRevision,editorialProvenance:snapshot.editorialProvenance,canonical:{url:snapshot.canonicalProof?.url??snapshot.draft.canonicalUrl,articleSha256:snapshot.canonicalProof?.articleSha256??null},draft:snapshot.draft}));
}
function editorial(record,bridge,proof){
  if(!plain(proof)||!['entity','person'].includes(proof.authorKind)||!UUID.test(proof.authorId??'')||!HASH.test(proof.proofSha256??'')||typeof proof.commercial!=='boolean')fail('POSSE_EDITORIAL_NOT_ELIGIBLE',403);
  const links=bridge.linkedAuthors,policy=bridge.policy;
  if(!Array.isArray(links)||!plain(policy)||!links.some(link=>link.enabled===true&&link.kind===proof.authorKind&&link.id.toLowerCase()===proof.authorId.toLowerCase()))fail('POSSE_EDITORIAL_NOT_ELIGIBLE',403);
  if(policy.excludeCommercial===true&&proof.commercial!==false||policy.excludedSections?.includes(record.recordId.sectionId)||Array.isArray(policy.allowedSections)&&!policy.allowedSections.includes(record.recordId.sectionId))fail('POSSE_EDITORIAL_NOT_ELIGIBLE',403);
  return {authorKind:proof.authorKind,authorId:proof.authorId.toLowerCase(),proofSha256:proof.proofSha256,commercial:proof.commercial};
}
function coverSnapshot(cover){
  if(cover===undefined||cover===null)return null;
  exact(cover,['blobRef','sha256','mimeType','bytes','alt','thumbnailUrl','public']);
  if(cover.public!==true||typeof cover.blobRef!=='string'||!/^[A-Za-z0-9][A-Za-z0-9/_-]{0,255}$/.test(cover.blobRef)||!HASH.test(cover.sha256??'')||!['image/jpeg','image/png','image/webp'].includes(cover.mimeType)||!Number.isSafeInteger(cover.bytes)||cover.bytes<1||cover.bytes>8*1024*1024||typeof cover.alt!=='string'||cover.alt.length>1500)fail('POSSE_PUBLIC_MEDIA_REQUIRED',400);
  if(typeof cover.thumbnailUrl!=='string'||!cover.thumbnailUrl.startsWith('https://socdepoble.org/')||new URL(cover.thumbnailUrl).origin!=='https://socdepoble.org')fail('POSSE_PUBLIC_MEDIA_REQUIRED',400);
  return {blobRef:cover.blobRef,sha256:cover.sha256,mimeType:cover.mimeType,bytes:cover.bytes,alt:cover.alt,thumbnailUrl:cover.thumbnailUrl};
}
export function creaMotorPosse({repository,certificaArticle,transportForBridge,authorizeBridge,publishingEnabled=false,now=Date.now}={}){
  if(!repository||typeof repository.loadRecord!=='function'||typeof repository.loadBridge!=='function'||typeof repository.resolveEditorialProvenance!=='function'||typeof repository.savePrepared!=='function'||typeof authorizeBridge!=='function'||typeof certificaArticle!=='function')throw TypeError('POSSE_SERVER_DEPENDENCIES_REQUIRED');
  async function accessBridge(bridgeId,context,operation){
    if(typeof bridgeId!=='string'||!UUID.test(bridgeId))fail('POSSE_BRIDGE_REQUIRED',400);
    const bridge=await repository.loadBridge(bridgeId);
    if(!plain(bridge)||bridge.id!==bridgeId||typeof bridge.remoteAccountIdentity!=='string'||!bridge.remoteAccountIdentity.startsWith('https://')||!HASH.test(bridge.policyProofSha256??''))fail('POSSE_BRIDGE_UNAVAILABLE',404);
    const bridgeRevision=revision(bridge.configRevision);let authority;
    try{authority=await authorizeBridge(context,{bridge,operation});}catch{fail('POSSE_CONFIRMATION_DENIED',403);}
    if(authority?.allowed!==true||!HASH.test(authority.actorProof??''))fail('POSSE_CONFIRMATION_DENIED',403);
    return{bridge,bridgeRevision,authority};
  }
  async function snapshotFor(bridgeId,recordId,context,operation='prepare'){
    const{bridge,bridgeRevision,authority}=await accessBridge(bridgeId,context,operation);
    const ref=identitatPosse(recordId),record=await repository.loadRecord(ref,{bridgeId});
    if(!plain(record)||!sameRecord(record.recordId,ref)||record.visibility!=='public')fail('POSSE_PUBLIC_RECORD_UNAVAILABLE',404);
    const proof=editorial(record,bridge,await repository.resolveEditorialProvenance({bridgeId,recordId:ref,bridgeRevision})),recordRevision=revision(record.recordRevision);
    const post=formataPosse({...record,recordId:ref,tags:record.tags??[]},{defaultTags:bridge.defaultTags??[]});
    const cover=coverSnapshot(record.cover);let certification;
    try{certification=await certificaArticle({recordId:ref,recordRevision,canonicalUrl:post.canonicalUrl});}catch{certification=null;}
    const certified=certification?.ok===true&&certification.url===post.canonicalUrl&&HASH.test(certification.articleSha256??'');
    const canonicalProof=certified?{url:post.canonicalUrl,articleSha256:certification.articleSha256,verifiedAt:new Date(now()).toISOString()}:null;
    const snapshot={bridge:{bridgeId,bridgeRevision,remoteAccountIdentity:bridge.remoteAccountIdentity,policyProofSha256:bridge.policyProofSha256},recordId:ref,recordRevision,editorialProvenance:proof,canonicalProof,draft:{status:post.status,visibility:'public',language:post.language,canonicalUrl:post.canonicalUrl,tags:[...post.tags],cover}};
    return {snapshot,draftHash:hashEsborranyPosse(snapshot),ready:certified,authority:{actorProof:authority.actorProof}};
  }
  function view(row,fresh){
    const published=Boolean(row.externalStatusId),publishedDraftMatches=published&&row.publishedHash===fresh.draftHash,stale=fresh.draftHash!==row.draftHash,ledgerState=row.ledgerState??row.state??(published?'published':'prepared');
    const held=['indeterminate','media-pending','mediaPending','dispatching','claimed','reserved'].includes(ledgerState);
    return {recordId:fresh.snapshot.recordId,bridgeId:fresh.snapshot.bridge.bridgeId,bridgeRevision:fresh.snapshot.bridge.bridgeRevision,preparedId:row.preparedId,recordRevision:fresh.snapshot.recordRevision,draftHash:fresh.draftHash,preparedDraftHash:row.draftHash,preparedRecordRevision:row.snapshot.recordRevision,draft:fresh.snapshot.draft,state:held?ledgerState:stale?'stale':!fresh.ready?'needs-primary-publication':publishedDraftMatches?'published':'prepared',ledgerState,published,publishedDraftMatches,stale,needsUpdate:published&&!publishedDraftMatches,needsWithdrawal:false,confirmationReady:fresh.ready&&!stale&&publishingEnabled===true&&!['indeterminate','dispatching','claimed','reserved'].includes(ledgerState),externalStatusId:row.externalStatusId??null,externalUrl:row.externalUrl??null,publishingEnabled:publishingEnabled===true,confirmationRequired:true};
  }
  async function prepare(input,context){
    exact(input,['bridgeId','recordId']);const prepared=await snapshotFor(input.bridgeId,input.recordId,context);
    const row=await repository.savePrepared({snapshot:prepared.snapshot,draftHash:prepared.draftHash,ready:prepared.ready,state:prepared.ready?'prepared':'needs-primary-publication'});
    return view({...row,snapshot:prepared.snapshot,draftHash:prepared.draftHash},prepared);
  }
  async function listPrepared(input,context){
    exact(input,['bridgeId']);await accessBridge(input.bridgeId,context,'list');const rows=await repository.listPrepared(input.bridgeId);if(!Array.isArray(rows)||rows.length>100)fail('POSSE_PREPARED_LIST_INVALID',503);const result=[];
    for(const row of rows){try{if(row.snapshot.bridge.bridgeId!==input.bridgeId)fail('POSSE_BRIDGE_UNAVAILABLE',403);const fresh=await snapshotFor(input.bridgeId,row.snapshot.recordId,context,'list');result.push(view(row,fresh));}catch(error){if(error?.code!=='POSSE_EDITORIAL_NOT_ELIGIBLE'&&error?.code!=='POSSE_PUBLIC_RECORD_UNAVAILABLE')throw error;
        if(row.externalStatusId||['indeterminate','media-pending','mediaPending'].includes(row.ledgerState??row.state))result.push({recordId:row.snapshot.recordId,bridgeId:input.bridgeId,preparedId:row.preparedId,recordRevision:row.snapshot.recordRevision,draftHash:row.draftHash,draft:null,state:(row.ledgerState??row.state)==='indeterminate'?'indeterminate':'source-withdrawn',ledgerState:row.ledgerState??row.state,published:Boolean(row.externalStatusId),stale:true,needsUpdate:false,needsWithdrawal:Boolean(row.externalStatusId),sourceUnavailable:true,confirmationReady:false,externalStatusId:row.externalStatusId??null,externalUrl:row.externalUrl??null,publishingEnabled:publishingEnabled===true,confirmationRequired:true});
      }}
    return result;
  }
  async function publish(input,context){
    exact(input,['bridgeId','bridgeRevision','preparedId','recordRevision','draftHash','confirm']);
    if(publishingEnabled!==true||typeof transportForBridge!=='function')fail('POSSE_PUBLISH_DISABLED',503);
    if(typeof input.preparedId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(input.preparedId)||input.confirm!==true||!HASH.test(input.draftHash??''))fail('POSSE_EXPLICIT_CONFIRMATION_REQUIRED',409);revision(input.recordRevision);
    const stored=await repository.loadPrepared(input.preparedId);if(!stored)fail('POSSE_PREPARED_UNAVAILABLE',404);
    if(stored.snapshot.bridge.bridgeId!==input.bridgeId)fail('POSSE_BRIDGE_UNAVAILABLE',403);
    const fresh=await snapshotFor(input.bridgeId,stored.snapshot.recordId,context,'publish');
    if(!fresh.ready)fail('POSSE_PRIMARY_ARTICLE_UNVERIFIED',409);
    if(fresh.draftHash!==input.draftHash||stored.draftHash!==input.draftHash||fresh.snapshot.recordRevision!==input.recordRevision||stored.snapshot.recordRevision!==input.recordRevision||fresh.snapshot.bridge.bridgeRevision!==input.bridgeRevision)fail('POSSE_PREPARED_STALE',409);
    const authority=fresh.authority,transport=await transportForBridge(input.bridgeId);
    // Preflight is a trusted server transport: verify_credentials and scope
    // certification. It returns no token; secrets remain inside that closure.
    const scopes=transport.requiredScopes({media:Boolean(fresh.snapshot.draft.cover)});if(!Array.isArray(scopes)||!scopes.length||scopes.some(scope=>typeof scope!=='string'))fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
    let credential;try{credential=await transport.preflight({requiredScopes:scopes});}catch{fail('POSSE_CREDENTIAL_UNAVAILABLE',503);}
    if(credential?.accountIdentity!==fresh.snapshot.bridge.remoteAccountIdentity||!HASH.test(credential.certificationId??'')||!scopes.every(scope=>credential.scopes?.includes(scope)))fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
    // This repository operation MUST atomically recheck source revision and
    // editorial proof against the stored snapshot, reserve quota, and claim a
    // unique record/account. No adapter may authorize it from HTTP body claims.
    const claim=await repository.claimConfirmed({bridgeId:input.bridgeId,expectedBridgeRevision:input.bridgeRevision,preparedId:input.preparedId,expectedRevision:input.recordRevision,draftHash:input.draftHash,editorialProof:fresh.snapshot.editorialProvenance.proofSha256,bridgePolicyProof:fresh.snapshot.bridge.policyProofSha256,actorProof:authority.actorProof,remoteAccountIdentity:credential.accountIdentity,credentialCertificationId:credential.certificationId});
    if(claim?.state==='published')return{state:'published',externalStatusId:claim.externalStatusId,externalUrl:claim.externalUrl,created:false};
    if(claim?.state==='indeterminate')fail('POSSE_RECONCILIATION_REQUIRED',409);
    if(claim?.state!=='claimed'||claim.quotaReserved!==true||typeof claim.leaseId!=='string'||hashEsborranyPosse(claim.approvedSnapshot)!==input.draftHash)fail('POSSE_CLAIM_REFUSED',409);
    const approved=claim.approvedSnapshot,operation=claim.externalStatusId?'update':'create';
    if(claim.operation!==operation||claim.externalStatusId&&!remoteId(claim.externalStatusId))fail('POSSE_CLAIM_REFUSED',409);
    const key=clauPosse({recordId:approved.recordId,canonicalUrl:approved.draft.canonicalUrl,visibility:'public',title:'Approved snapshot'},credential.accountIdentity);
    let stage='before-dispatch',observedMediaId=claim.mediaId??null,observedStatus=null;
    try{
      if(approved.draft.cover){
        if(!observedMediaId){const media=await repository.readPublicMedia(approved.draft.cover.blobRef);const bytes=media?.bytes;
          if(!(bytes instanceof Uint8Array)||bytes.byteLength!==approved.draft.cover.bytes||sha(bytes)!==approved.draft.cover.sha256||media.mimeType!==approved.draft.cover.mimeType)fail('POSSE_MEDIA_CHANGED',409);
          stage='media-post';if((await repository.startDispatch({leaseId:claim.leaseId,stage})).authorized!==true)fail('POSSE_DISPATCH_REFUSED',409);
          const uploaded=await transport.uploadMedia({leaseId:claim.leaseId,bytes:new Uint8Array(bytes),mimeType:media.mimeType,description:approved.draft.cover.alt});observedMediaId=uploaded.id;
          if(!remoteId(observedMediaId))fail('POSSE_MEDIA_UNVERIFIED',503);await repository.saveMedia({leaseId:claim.leaseId,mediaId:observedMediaId,ready:uploaded.ready===true});
          if(uploaded.ready!==true){await repository.releaseMediaPending({leaseId:claim.leaseId});return{state:'media-pending',preparedId:input.preparedId};}
        }else{const media=await transport.getMedia({id:observedMediaId});if(media.ready!==true){await repository.releaseMediaPending({leaseId:claim.leaseId});return{state:'media-pending',preparedId:input.preparedId};}}
      }
      stage=operation==='create'?'status-post':'status-put';if((await repository.startDispatch({leaseId:claim.leaseId,stage})).authorized!==true)fail('POSSE_DISPATCH_REFUSED',409);
      observedStatus=await transport.publishStatus({leaseId:claim.leaseId,operation,externalStatusId:claim.externalStatusId??null,idempotencyKey:key,status:approved.draft.status,visibility:'public',language:approved.draft.language,mediaIds:observedMediaId?[observedMediaId]:[],accountIdentity:credential.accountIdentity});
      if(!remoteId(observedStatus?.id)||transport.validateResult(observedStatus,{accountIdentity:credential.accountIdentity,operation,externalStatusId:claim.externalStatusId})!==true)fail('POSSE_REMOTE_RESULT_UNVERIFIED',503);
      await repository.complete({leaseId:claim.leaseId,externalStatusId:observedStatus.id,externalUrl:observedStatus.url,canonicalUrl:approved.draft.canonicalUrl,draftHash:input.draftHash});
      return{state:'published',externalStatusId:observedStatus.id,externalUrl:observedStatus.url,created:operation==='create'};
    }catch(error){
      if(stage!=='before-dispatch'){
        // MUST NOT demote an already completed row. Keep any observed IDs to
        // reconcile; expiry of remote Idempotency-Key never permits auto retry.
        // Once the durable marker has been requested, a transport's local
        // no-effect claim cannot erase that marker or prove crash safety.
        try{await repository.markIndeterminate({leaseId:claim.leaseId,stage,mediaId:observedMediaId,externalStatusId:observedStatus?.id??null,externalUrl:observedStatus?.url??null});}catch{/* operator reconciliation remains required */}
        fail('POSSE_RECONCILIATION_REQUIRED',503);
      }
      await repository.releaseUnsent({leaseId:claim.leaseId});if(error?.code)throw error;fail('POSSE_PUBLICATION_UNAVAILABLE',503);
    }
  }
  async function queueHistorical(input,context){
    exact(input,['bridgeId','recordIds']);if(!Array.isArray(input.recordIds)||input.recordIds.length>20)fail('POSSE_BATCH_LIMIT',400);const rows=[];
    for(const recordId of input.recordIds)rows.push(await prepare({bridgeId:input.bridgeId,recordId},context));return{state:'prepared-only',confirmationRequired:true,publications:rows};
  }
  return Object.freeze({prepare,listPrepared,publish,queueHistorical});
}
