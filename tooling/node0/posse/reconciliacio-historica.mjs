/** Pure AH09 historical inventory plan. Never publishes or rewrites remote data.
 * Inputs come from trusted server catalog/mapping loaders, not an HTTP body.
 * Existing remote identity is an explicit URL match needing server review;
 * it is NOT proof that the remote text already equals the current draft hash.
 */
import {identitatPosse,canonicaPosse} from './formatador-posse.mjs';
import {jsonPosse} from './motor-posse.mjs';

const HASH=/^[a-f0-9]{64}$/;
const fail=()=>{throw Error('POSSE_HISTORICAL_PLAN_INVALID');};
const key=record=>jsonPosse(identitatPosse(record));
function legacyUrl(value){
  if(typeof value!=='string'||value.length>2048||!value.isWellFormed()||/[\s\x00-\x1f\x7f]/.test(value))fail();let url;try{url=new URL(value);}catch{fail();}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||!url.hostname.includes('.'))fail();return url.href;
}
export async function planificaReconciliacioHistorica({bridgeId,remoteAccountIdentity,records,mappings,inventory,verifyInventoryEntry}={}){
  if(typeof bridgeId!=='string'||typeof remoteAccountIdentity!=='string'||typeof verifyInventoryEntry!=='function'||!Array.isArray(records)||records.length>200||!Array.isArray(mappings)||mappings.length>2000||!Array.isArray(inventory)||inventory.length>2000)fail();
  const catalog=new Map(),links=new Map(),conflicts=new Set(),canonicalOwners=new Map();
  const conflict=owners=>{if(owners.size>1)for(const id of owners)conflicts.add(id);};
  function addAlias(url,id){
    const owners=links.get(url)??new Set();owners.add(id);links.set(url,owners);conflict(owners);
  }
  for(const record of records){
    const id=key(record.recordId);if(catalog.has(id))fail();
    const canonicalUrl=canonicaPosse(record.canonicalUrl),primaryCertified=record.primaryCertified===true;
    catalog.set(id,{recordId:identitatPosse(record.recordId),canonicalUrl,primaryCertified,recordRevision:record.recordRevision,matches:new Map()});
    const owners=canonicalOwners.get(canonicalUrl)??new Set();owners.add(id);canonicalOwners.set(canonicalUrl,owners);conflict(owners);
    // The trusted certified primary URL is also an exact alias. This proves
    // identity for review, never equality with the current approved draft.
    if(primaryCertified)addAlias(canonicalUrl,id);
  }
  for(const mapping of mappings){
    const old=legacyUrl(mapping.legacyUrl),id=key(mapping.recordId),record=catalog.get(id);if(!record||mapping.canonicalUrl!==record.canonicalUrl||!HASH.test(mapping.proofSha256??''))fail();
    addAlias(old,id);
  }
  const remoteOwnership=new Map(),remoteUrls=new Map();
  for(const entry of inventory){
    const verified=await verifyInventoryEntry(entry,{bridgeId,remoteAccountIdentity});
    if(!verified||verified.accountIdentity!==remoteAccountIdentity||typeof verified.id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(verified.id)||!Array.isArray(verified.links)||verified.links.length>64||typeof verified.url!=='string')fail();
    if(remoteUrls.has(verified.id)&&remoteUrls.get(verified.id)!==verified.url)fail();remoteUrls.set(verified.id,verified.url);
    const matched=new Set();
    for(const raw of verified.links)for(const id of links.get(legacyUrl(raw))??[])matched.add(id);
    conflict(matched);
    for(const id of matched){
      const owners=remoteOwnership.get(verified.id)??new Set();owners.add(id);remoteOwnership.set(verified.id,owners);conflict(owners);
      catalog.get(id).matches.set(verified.id,{externalStatusId:verified.id,externalUrl:verified.url});
    }
  }
  const actions=[...catalog.entries()].map(([id,record])=>{
    const matches=[...record.matches.values()];let action='prepare-create';
    if(conflicts.has(id)||matches.length>1)action='review-ambiguous-match';else if(!record.primaryCertified)action='stage-needs-primary';else if(matches.length===1)action='review-link-existing';
    return {bridgeId,recordId:record.recordId,recordRevision:record.recordRevision,canonicalUrl:record.canonicalUrl,action,existing:matches,requiresHumanConfirmation:true,remoteDispatch:false,remoteDraftHashVerified:false};
  });
  return{state:'prepared-plan-only',bridgeId,remoteAccountIdentity,remoteDispatch:false,actions};
}
