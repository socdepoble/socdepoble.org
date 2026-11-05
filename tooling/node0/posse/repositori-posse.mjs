/** Request-scoped durable POSSE repository. No credentials or I/O transport.
 * Sources and evidence are read through locked SQL resolvers. Database errors never escape with SQL/PII.
 */
import {sqlContextSessioNodeZero} from '../backend-node0.mjs';
import {sqlText,sqlJson} from '../postgres-node0.mjs';
import {hashEsborranyPosse} from './motor-posse.mjs';
import {identitatPosse} from './formatador-posse.mjs';

const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,HASH=/^[a-f0-9]{64}$/;
const fail=(code,status=400)=>{throw Object.assign(Error(code),{code,status,effect:'not-dispatched'});};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>{if(!plain(v)||Reflect.ownKeys(v).some(k=>typeof k!=='string'||!keys.includes(k))||Reflect.ownKeys(v).some(k=>!Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value')))fail('POSSE_INPUT_INVALID');};
const uuid=v=>typeof v==='string'&&UUID.test(v)?v.toLowerCase():fail('POSSE_ID_INVALID');
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&v.isWellFormed()&&!/[\x00-\x1f\x7f]/.test(v)?v:fail('POSSE_TEXT_INVALID');
const hash=v=>typeof v==='string'&&HASH.test(v)?v:fail('POSSE_HASH_INVALID');
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v)?v:fail('POSSE_REMOTE_ID_INVALID');
const boolean=v=>typeof v==='boolean'?v:fail('POSSE_BOOLEAN_INVALID');
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max?v:fail('POSSE_INTEGER_INVALID');
function url(v){text(v,2048);let parsed;try{parsed=new URL(v);}catch{fail('POSSE_URL_INVALID');}if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash||parsed.href!==v)fail('POSSE_URL_INVALID');return v;}
function snapshot(value,depth=0){
 if(depth>32)fail('POSSE_SNAPSHOT_LIMIT');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='string'){if(!value.isWellFormed()||value.includes('\0'))fail('POSSE_SNAPSHOT_INVALID');return value;}
 if(typeof value==='number'&&Number.isSafeInteger(value))return value;
 if(Array.isArray(value)){
  const descriptors=Object.getOwnPropertyDescriptors(value);if(value.length>256||Reflect.ownKeys(descriptors).length!==value.length+1)fail('POSSE_SNAPSHOT_INVALID');
  return Array.from({length:value.length},(_,i)=>{if(!Object.hasOwn(descriptors,String(i))||!Object.hasOwn(descriptors[i],'value'))fail('POSSE_SNAPSHOT_INVALID');return snapshot(descriptors[i].value,depth+1);});
 }
 if(plain(value)){
  const keys=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);if(keys.length>64||keys.some(k=>typeof k!=='string'||!Object.hasOwn(descriptors[k],'value')))fail('POSSE_SNAPSHOT_INVALID');
  return Object.fromEntries(keys.map(k=>[k,snapshot(descriptors[k].value,depth+1)]));
 }
 fail('POSSE_SNAPSHOT_INVALID');
}
const optional=(v,convert)=>v===null||v===undefined?null:convert(v);

export function creaRepositoriPosse({db,sessionHash,expectedActor,tenantId,readPublicMedia}={}){
 if(!db||typeof db.query!=='function')throw TypeError('POSSE_DATABASE_REQUIRED');
 const tenant=uuid(tenantId),context=sqlContextSessioNodeZero(hash(sessionHash),uuid(expectedActor));
 async function rpc(operation,input){
  // context and operation are closed over, never accepted as HTTP-supplied SQL.
  const argument={...input,contextTenant:tenant};
  try{return await db.query(`${context}SELECT node0_posse.rpc(${sqlText(operation)},${sqlJson(argument)}) AS result;\nCOMMIT;`,{privateValues:true});}
  catch(error){
   const state=error?.sqlState??error?.code;
   const code=['42501','28000','N0A01'].includes(state)?'POSSE_CONFIRMATION_DENIED':state==='N0P01'?'POSSE_PREPARED_STALE':state==='N0P02'?'POSSE_RECONCILIATION_REQUIRED':'POSSE_STORAGE_UNAVAILABLE';
   throw Object.assign(Error(code),{code,status:code==='POSSE_CONFIRMATION_DENIED'?403:code==='POSSE_STORAGE_UNAVAILABLE'?503:409});
  }
 }
 const record=value=>{const ref=identitatPosse(value);if(ref.tenantId!==tenant)fail('POSSE_TENANT_DENIED',403);return{...ref};};
 const lease=value=>{exact(value,['leaseId']);return{leaseId:uuid(value.leaseId)};};
 const repo={
  configureBridge(input){
   exact(input,['id','tenantId','ownerUserId','ownerOrgId','remoteAccountIdentity','secretRef','policy','linkedAuthors','defaultTags','enabled','quotaDaily','cadenceSeconds']);
   if(uuid(input.tenantId)!==tenant)fail('POSSE_TENANT_DENIED',403);
   if((input.ownerUserId==null)===(input.ownerOrgId==null))fail('POSSE_OWNER_REQUIRED');
   exact(input.policy,['excludeCommercial','excludedSections','allowedSections']);
   const sections=value=>{if(!Array.isArray(value)||value.length>16||value.some(s=>typeof s!=='string'||!['mur','mercat','events','calendari','mapa','vehicle','animalets','treball','habitatge','multimedia'].includes(s)))fail('POSSE_POLICY_INVALID');return [...new Set(value)];};
   const policy={excludeCommercial:boolean(input.policy.excludeCommercial),excludedSections:sections(input.policy.excludedSections??[]),...(input.policy.allowedSections===undefined?{}:{allowedSections:sections(input.policy.allowedSections)})};
   if(!Array.isArray(input.linkedAuthors)||input.linkedAuthors.length<1||input.linkedAuthors.length>64)fail('POSSE_AUTHORS_INVALID');
   const linkedAuthors=input.linkedAuthors.map(v=>{exact(v,['kind','id','enabled']);if(!['person','entity'].includes(v.kind)||v.enabled!==true)fail('POSSE_AUTHORS_INVALID');return{kind:v.kind,id:uuid(v.id)};});
   if(new Set(linkedAuthors.map(v=>v.kind+v.id)).size!==linkedAuthors.length)fail('POSSE_AUTHORS_INVALID');
   if(!Array.isArray(input.defaultTags)||input.defaultTags.length>6||input.defaultTags.some(v=>typeof v!=='string'||!/^\p{L}[\p{L}\p{N}_]{0,31}$/u.test(v)))fail('POSSE_TAGS_INVALID');
   const secretRef=text(input.secretRef,256);if(!/^(bridges|credentials)\/[A-Za-z0-9][A-Za-z0-9/_-]{0,223}$/.test(secretRef))fail('POSSE_SECRET_REFERENCE_REQUIRED');
   return rpc('configure',{id:uuid(input.id),tenantId:tenant,ownerUserId:optional(input.ownerUserId,uuid),ownerOrgId:optional(input.ownerOrgId,uuid),remoteAccountIdentity:url(input.remoteAccountIdentity),secretRef,policy,linkedAuthors,defaultTags:[...input.defaultTags],enabled:boolean(input.enabled),quotaDaily:integer(input.quotaDaily,1,1000),cadenceSeconds:integer(input.cadenceSeconds,1,86400)});
  },
  authorizeMutation(input){exact(input,['leaseId','stage']);if(!['media-post','status-post','status-put'].includes(input.stage))fail('POSSE_STAGE_INVALID');return rpc('mutation',{leaseId:uuid(input.leaseId),stage:input.stage});},
  certifyCredential(input){exact(input,['bridgeId','tokenSha256','requiredScopes']);if(!Array.isArray(input.requiredScopes)||input.requiredScopes.length<1||input.requiredScopes.length>8||input.requiredScopes.some(v=>typeof v!=='string'||!/^([a-z]+:)?[a-z]+$/.test(v)))fail('POSSE_INPUT_INVALID');return rpc('credential',{bridgeId:uuid(input.bridgeId),tokenSha256:hash(input.tokenSha256),requiredScopes:[...input.requiredScopes]});},
  loadDefaultBridge(){return rpc('default-bridge',{});},
  listSourceRecords(bridgeId){return rpc('sources',{bridgeId:uuid(bridgeId)});},
  historicalData(bridgeId){return rpc('history',{bridgeId:uuid(bridgeId)});},
  refreshHistorical(bridgeId){return rpc('refresh-history',{bridgeId:uuid(bridgeId)});},
  saveHistoricalPlan(input){exact(input,['bridgeId','actions']);if(!Array.isArray(input.actions)||input.actions.length>200)fail('POSSE_INPUT_INVALID');return rpc('refresh-history',{bridgeId:uuid(input.bridgeId)});},
  certifyPrimary(input){exact(input,['recordId','recordRevision','canonicalUrl']);return rpc('certify',{recordId:record(input.recordId),recordRevision:text(input.recordRevision,128),canonicalUrl:url(input.canonicalUrl)});},
  loadBridge(bridgeId){return rpc('bridge',{bridgeId:uuid(bridgeId)});},
  loadRecord(recordId,input){exact(input,['bridgeId']);return rpc('record',{bridgeId:uuid(input.bridgeId),recordId:record(recordId)});},
  async resolveEditorialProvenance(input){exact(input,['bridgeId','recordId','bridgeRevision']);text(input.bridgeRevision,128);const row=await repo.loadRecord(input.recordId,{bridgeId:input.bridgeId});return row?.editorialProvenance??null;},
  savePrepared(input){
   exact(input,['snapshot','draftHash','ready','state']);const copy=snapshot(input.snapshot),draftHash=hash(input.draftHash);
   if(Buffer.byteLength(JSON.stringify(copy))>128*1024)fail('POSSE_SNAPSHOT_LIMIT');
   record(copy.recordId);uuid(copy.bridge?.bridgeId);if(hashEsborranyPosse(copy)!==draftHash)fail('POSSE_SNAPSHOT_HASH_MISMATCH');
   return rpc('prepare',{bridgeId:copy.bridge.bridgeId,snapshot:copy,draftHash,ready:boolean(input.ready)});
  },
  listPrepared(bridgeId){return rpc('list',{bridgeId:uuid(bridgeId)});},
  loadPrepared(preparedId){return rpc('prepared',{preparedId:uuid(preparedId)});},
  claimConfirmed(input){
   exact(input,['bridgeId','expectedBridgeRevision','preparedId','expectedRevision','draftHash','editorialProof','bridgePolicyProof','actorProof','remoteAccountIdentity','credentialCertificationId']);
   return rpc('claim',{bridgeId:uuid(input.bridgeId),preparedId:uuid(input.preparedId),expectedBridgeRevision:text(input.expectedBridgeRevision,128),expectedRevision:text(input.expectedRevision,128),draftHash:hash(input.draftHash),editorialProof:hash(input.editorialProof),bridgePolicyProof:hash(input.bridgePolicyProof),actorProof:hash(input.actorProof),remoteAccountIdentity:url(input.remoteAccountIdentity),credentialCertificationId:hash(input.credentialCertificationId)});
  },
  startDispatch(input){exact(input,['leaseId','stage']);if(!['media-post','status-post','status-put'].includes(input.stage))fail('POSSE_STAGE_INVALID');return rpc('start',{leaseId:uuid(input.leaseId),stage:input.stage});},
  saveMedia(input){exact(input,['leaseId','mediaId','ready']);return rpc('media',{leaseId:uuid(input.leaseId),mediaId:id(input.mediaId),ready:boolean(input.ready)});},
  releaseMediaPending(input){return rpc('media-pending',lease(input));},
  releaseUnsent(input){return rpc('release',lease(input));},
  markIndeterminate(input){exact(input,['leaseId','stage','mediaId','externalStatusId','externalUrl']);text(input.stage,32);return rpc('uncertain',{leaseId:uuid(input.leaseId),mediaId:optional(input.mediaId,id),externalStatusId:optional(input.externalStatusId,id),externalUrl:optional(input.externalUrl,url)});},
  async complete(input){exact(input,['leaseId','externalStatusId','externalUrl','canonicalUrl','draftHash']);const result=await rpc('complete',{leaseId:uuid(input.leaseId),externalStatusId:id(input.externalStatusId),externalUrl:url(input.externalUrl),canonicalUrl:url(input.canonicalUrl),draftHash:hash(input.draftHash)});if(result?.state==='indeterminate')throw Object.assign(Error('POSSE_RECONCILIATION_REQUIRED'),{code:'POSSE_RECONCILIATION_REQUIRED',status:409});return result;},
  reconcile(input){exact(input,['leaseId','externalStatusId']);return rpc('reconcile',{leaseId:uuid(input.leaseId),externalStatusId:id(input.externalStatusId)});},
  async readPublicMedia(blobRef){
   if(typeof readPublicMedia!=='function')fail('POSSE_MEDIA_UNAVAILABLE',503);
   if(typeof blobRef!=='string'||!/^[A-Za-z0-9][A-Za-z0-9/_-]{0,255}$/.test(blobRef))fail('POSSE_MEDIA_REFERENCE_INVALID');
   try{const media=await readPublicMedia(blobRef);exact(media,['bytes','mimeType']);if(!(media.bytes instanceof Uint8Array)||media.bytes.byteLength>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(media.mimeType))throw Error('invalid');return{bytes:new Uint8Array(media.bytes),mimeType:media.mimeType};}
   catch{fail('POSSE_MEDIA_UNAVAILABLE',503);}
  },
 };
 return Object.freeze(repo);
}
