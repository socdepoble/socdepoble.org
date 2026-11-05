/** Request-bound AH-09 service. SQL owns source, author and remote evidence.
 * Neither an HTTP body nor a canonical link is publication authority.
 * Preparing/reading a tray never constructs an OAuth transport.
 */
import {createHash} from 'node:crypto';
import {creaRepositoriPosse} from './repositori-posse.mjs';
import {creaMotorPosse,jsonPosse} from './motor-posse.mjs';
import {planificaReconciliacioHistorica} from './reconciliacio-historica.mjs';
import {creaTransportMastodontDepoble} from './transport-mastodont-depoble.mjs';
import {peticioMastodont} from '../xarxa-node0.mjs';

const HASH=/^[a-f0-9]{64}$/,UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const ACTOR='https://mastodont.cat/users/depoble';
const sha=value=>createHash('sha256').update(value).digest('hex');
const fail=(code,status=409)=>{throw Object.assign(Error(code),{code,status});};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
function exact(v,keys){
  if(!plain(v)||Reflect.ownKeys(v).length!==keys.length||Reflect.ownKeys(v).some(k=>!keys.includes(k)||!Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value')))fail('POSSE_INPUT_INVALID',400);
}
const key=ref=>jsonPosse(ref);
const heldAction=action=>action?.action==='review-ambiguous-match'||action?.action==='review-link-existing';

/** Dependencies are server configuration only. repositoryFactory is a bounded
 * test seam; production always uses the session/RLS SQL repository. */
export function creaServeiPosseNodeZero({db,tenantId,defaultBridgeId,publishingEnabled=false,
  transportForBridge,tokenProvider,fetchImpl=peticioMastodont,certificaArticle,readPublicMedia,
  repositoryFactory=creaRepositoriPosse,now=Date.now}={}){
  if(!db||typeof db.query!=='function'||!UUID.test(tenantId??'')||typeof repositoryFactory!=='function'
    ||defaultBridgeId!==undefined&&!UUID.test(defaultBridgeId))throw TypeError('POSSE_SERVICE_CONFIGURATION_REQUIRED');
  async function creaMotorPerSessio(context){
    if(!plain(context)||!HASH.test(context.sessionHash??'')||!UUID.test(context.expectedActor??''))fail('POSSE_CONFIRMATION_DENIED',403);
    const bound=Object.freeze({sessionHash:context.sessionHash,expectedActor:context.expectedActor.toLowerCase()});
    const repository=repositoryFactory({db,tenantId,sessionHash:bound.sessionHash,expectedActor:bound.expectedActor,readPublicMedia});
    async function loadDefaultBridge(){
      const bridge=defaultBridgeId?await repository.loadBridge(defaultBridgeId):await repository.loadDefaultBridge();
      if(!bridge||!UUID.test(bridge.id??'')||bridge.remoteAccountIdentity!==ACTOR)fail('POSSE_BRIDGE_UNAVAILABLE',404);
      return bridge;
    }
    async function bridgeFor(input={}){
      const id=input.bridgeId??(await loadDefaultBridge()).id;
      if(!UUID.test(id??''))fail('POSSE_BRIDGE_REQUIRED',400);
      const bridge=await repository.loadBridge(id);
      if(!bridge||bridge.remoteAccountIdentity!==ACTOR)fail('POSSE_BRIDGE_UNAVAILABLE',404);
      return bridge;
    }
    async function authorizeBridge(supplied,{bridge}){
      if(supplied!==bound&&supplied!==context)fail('POSSE_CONFIRMATION_DENIED',403);
      // loadBridge revalidates live session, tenant and bridge authority in SQL.
      const current=await repository.loadBridge(bridge.id);
      if(!current||current.configRevision!==bridge.configRevision||current.policyProofSha256!==bridge.policyProofSha256)fail('POSSE_CONFIRMATION_DENIED',403);
      return {allowed:true,actorProof:sha(jsonPosse([bound.expectedActor,bound.sessionHash,tenantId,bridge.id,bridge.policyProofSha256]))};
    }
    async function concreteTransport(bridgeId){
      if(typeof transportForBridge==='function')return transportForBridge(bridgeId,{repository,context:bound});
      const bridge=await repository.loadBridge(bridgeId);
      if(bridge?.remoteAccountIdentity!==ACTOR||typeof tokenProvider!=='function')fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
      // Only called by a confirmed publish, after source/history checks.
      const token=await tokenProvider({bridgeId,accountIdentity:ACTOR});
      if(typeof token!=='string'||token.length<8||token.length>4096||/[\s\x00-\x1f\x7f]/.test(token))fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
      const tokenSha256=sha(token);
      let credentialCertificationId=null;
      return creaTransportMastodontDepoble({fetchImpl,token,now,
        certifyScopes:async({accountIdentity,requiredScopes})=>{
          if(accountIdentity!==ACTOR)fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
          const proof=await repository.certifyCredential({bridgeId,tokenSha256,requiredScopes});
          const valid=proof?.tokenSha256===tokenSha256&&proof.accountIdentity===ACTOR&&HASH.test(proof.certificationId??'')
            &&Array.isArray(proof.scopes)&&requiredScopes.every(scope=>proof.scopes.includes(scope));
          credentialCertificationId=valid?proof.certificationId:null;
          return {ok:valid,scopes:valid?[...proof.scopes]:[],proofSha256:valid?proof.certificationId:null};
        },
        beforeMutation:async({leaseId,endpoint,method,scope})=>{
          const stage=scope==='write:media'&&method==='POST'&&endpoint==='https://mastodont.cat/api/v2/media'
            ?'media-post':scope==='write:statuses'&&method==='PUT'?'status-put':scope==='write:statuses'&&method==='POST'?'status-post':null;
          if(!stage)fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
          // Check credential rotation as well as the committed dispatch marker.
          const proof=await repository.certifyCredential({bridgeId,tokenSha256,requiredScopes:[scope]});
          if(proof?.tokenSha256!==tokenSha256||proof.accountIdentity!==ACTOR||proof.certificationId!==credentialCertificationId)fail('POSSE_CREDENTIAL_UNAVAILABLE',503);
          return repository.authorizeMutation({leaseId,stage});
        }});
    }
    const engine=creaMotorPosse({repository,authorizeBridge,transportForBridge:concreteTransport,publishingEnabled,now,
      certificaArticle:certificaArticle??(input=>repository.certifyPrimary(input))});
    async function historicalPlan(bridge){
      if(typeof repository.refreshHistorical==='function')await repository.refreshHistorical(bridge.id);
      const data=await repository.historicalData(bridge.id);
      if(!plain(data)||!Array.isArray(data.records)||!Array.isArray(data.mappings)||!Array.isArray(data.inventory))fail('POSSE_PUBLICATION_UNAVAILABLE',503);
      return planificaReconciliacioHistorica({bridgeId:bridge.id,remoteAccountIdentity:bridge.remoteAccountIdentity,
        records:data.records,mappings:data.mappings,inventory:data.inventory,
        verifyInventoryEntry:async entry=>{
          if(!plain(entry)||entry.accountIdentity!==bridge.remoteAccountIdentity||!HASH.test(entry.proofSha256??''))fail('POSSE_RECONCILIATION_REQUIRED',409);
          let url;try{url=new URL(entry.url);}catch{fail('POSSE_RECONCILIATION_REQUIRED',409);}
          if(url.protocol!=='https:'||url.origin!==new URL(bridge.remoteAccountIdentity).origin||url.username||url.password||url.hash||url.search)fail('POSSE_RECONCILIATION_REQUIRED',409);
          return entry;
        }});
    }
    function isHeld(row,action){
      if(!heldAction(action))return false;
      if(action.action==='review-ambiguous-match')return true;
      // A verified existing ledger link can be updated. An unlinked exact URL
      // match remains only possible_replica, regardless of its current text.
      return !row.externalStatusId||action.existing.some(match=>match.externalStatusId!==row.externalStatusId);
    }
    function dto(row,actions,bridge){
      const action=actions.get(key(row.recordId)),held=isHeld(row,action);
      const exactPublished=row.publishedDraftMatches===true&&!row.stale;
      return {...row,id:row.preparedId,hash_esborrany:row.draftHash,revisio_politica:row.bridgeRevision??bridge.configRevision,
        estat:held?'possible_replica':exactPublished?'ja_publicat_canonic':'preparat',
        confirmationReady:row.confirmationReady===true&&!held,
        possibleReplica:held,existing:action?.existing??[],remoteDraftHashVerified:exactPublished};
    }
    async function prepareCurrent(input={}){
      const bridge=await bridgeFor(input),refs=await repository.listSourceRecords(bridge.id);
      if(!Array.isArray(refs)||refs.length>100)fail('POSSE_BATCH_LIMIT',400);
      for(const recordId of refs){
        try{await engine.prepare({bridgeId:bridge.id,recordId},bound);}
        catch(error){if(!['POSSE_PUBLIC_RECORD_UNAVAILABLE','POSSE_EDITORIAL_NOT_ELIGIBLE'].includes(error?.code))throw error;}
      }
      await historicalPlan(bridge);
      return {bridgeId:bridge.id,prepared:refs.length};
    }
    async function listPrepared(input={}){
      const bridge=await bridgeFor(input),plan=await historicalPlan(bridge),actions=new Map(plan.actions.map(action=>[key(action.recordId),action]));
      return (await engine.listPrepared({bridgeId:bridge.id},bound)).map(row=>dto(row,actions,bridge));
    }
    async function guardedPublish(input,supplied=bound){
      if(supplied!==bound&&supplied!==context)fail('POSSE_CONFIRMATION_DENIED',403);
      exact(input,['bridgeId','bridgeRevision','preparedId','recordRevision','draftHash','confirm']);
      if(input.confirm!==true||!HASH.test(input.draftHash??'')||!UUID.test(input.bridgeId??'')
        ||!UUID.test(input.preparedId??'')||typeof input.recordRevision!=='string'||typeof input.bridgeRevision!=='string')fail('POSSE_EXPLICIT_CONFIRMATION_REQUIRED',409);
      if(publishingEnabled!==true)fail('POSSE_PUBLISH_DISABLED',503);
      const stored=await repository.loadPrepared(input.preparedId);
      if(!stored||stored.snapshot?.bridge?.bridgeId!==input.bridgeId)fail('POSSE_PREPARED_UNAVAILABLE',404);
      const bridge=await bridgeFor({bridgeId:input.bridgeId}),plan=await historicalPlan(bridge);
      const action=plan.actions.find(candidate=>key(candidate.recordId)===key(stored.snapshot.recordId));
      if(isHeld(stored,action))fail('POSSE_RECONCILIATION_REQUIRED',409);
      const current=(await engine.listPrepared({bridgeId:bridge.id},bound)).find(row=>row.preparedId===input.preparedId);
      if(current?.publishedDraftMatches===true&&!current.stale&&current.draftHash===input.draftHash
        &&current.recordRevision===input.recordRevision&&current.bridgeRevision===input.bridgeRevision){
        return {state:'published',estat:'ja_publicat_canonic',externalStatusId:current.externalStatusId,externalUrl:current.externalUrl,created:false};
      }
      return engine.publish(input,bound);
    }
    async function publishConfirmation(input){
      exact(input,['id','hash_esborrany','revisio_politica','confirm']);
      if(!UUID.test(input.id??'')||!HASH.test(input.hash_esborrany??'')||input.confirm!==true
        ||typeof input.revisio_politica!=='string'||! /^[1-9][0-9]{0,18}$/.test(input.revisio_politica))fail('POSSE_EXPLICIT_CONFIRMATION_REQUIRED',409);
      if(publishingEnabled!==true)fail('POSSE_PUBLISH_DISABLED',503);
      const row=await repository.loadPrepared(input.id);
      if(!row?.snapshot?.bridge)fail('POSSE_PREPARED_UNAVAILABLE',404);
      if(row.draftHash!==input.hash_esborrany||row.snapshot.bridge.bridgeRevision!==input.revisio_politica)fail('POSSE_PREPARED_STALE',409);
      return guardedPublish({bridgeId:row.snapshot.bridge.bridgeId,bridgeRevision:input.revisio_politica,
        preparedId:input.id,recordRevision:row.snapshot.recordRevision,draftHash:input.hash_esborrany,confirm:true});
    }
    const motor=Object.freeze({...engine,publish:guardedPublish});
    return Object.freeze({motor,prepareCurrent,listPrepared,loadDefaultBridge,publishConfirmation});
  }
  return Object.freeze({creaMotorPerSessio});
}
