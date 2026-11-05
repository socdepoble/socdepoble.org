/** AH09 HTTP boundary. A request owns a fresh session-bound repository/motor.
 * This module never loads OAuth credentials and never accepts an author,
 * tenant, status text, URL, permission or secret as publication authority.
 * Every repository transaction must revalidate session + expectedActor.
 */
import {hashSessioNodeZero} from './auth-node0.mjs';

const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const ERRORS=Object.freeze({
  POSSE_INPUT_INVALID:400,POSSE_BRIDGE_REQUIRED:400,POSSE_REVISION_REQUIRED:400,
  POSSE_BATCH_LIMIT:400,POSSE_RECORD_ID_REQUIRED:400,
  POSSE_CONFIRMATION_DENIED:403,POSSE_BRIDGE_UNAVAILABLE:404,
  POSSE_PUBLIC_RECORD_UNAVAILABLE:404,POSSE_PREPARED_UNAVAILABLE:404,
  POSSE_EXPLICIT_CONFIRMATION_REQUIRED:409,POSSE_PREPARED_STALE:409,
  POSSE_PRIMARY_ARTICLE_UNVERIFIED:409,POSSE_CLAIM_REFUSED:409,
  POSSE_EDITORIAL_NOT_ELIGIBLE:403,POSSE_MEDIA_CHANGED:409,
  POSSE_RECONCILIATION_REQUIRED:409,POSSE_PUBLISH_DISABLED:503,
  POSSE_CREDENTIAL_UNAVAILABLE:503,POSSE_PUBLICATION_UNAVAILABLE:503,
  POSSE_STORAGE_UNAVAILABLE:503,POSSE_DEFAULT_BRIDGE_UNAVAILABLE:404,
  POSSE_POSSIBLE_REPLICA:409
});
const answer=(status,body)=>({status,body});
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function exact(value,keys){return plain(value)&&Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key))&&Object.values(Object.getOwnPropertyDescriptors(value)).every(d=>Object.hasOwn(d,'value'));}
function header(headers,name){const v=headers?.get?headers.get(name):headers?.[name];return typeof v==='string'?v:'';}
function reference(value){return exact(value,['tenantId','sectionId','id'])&&UUID.test(value.tenantId??'')&&UUID.test(value.id??'')&&typeof value.sectionId==='string'&&/^[a-z][a-z-]{0,31}$/.test(value.sectionId);}
function validPublish(body){
  return exact(body,['bridgeId','bridgeRevision','preparedId','recordRevision','draftHash','confirm'])&&body.confirm===true&&UUID.test(body.bridgeId??'')&&HASH.test(body.draftHash??'')&&
    typeof body.preparedId==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(body.preparedId)&&['recordRevision','bridgeRevision'].every(k=>typeof body[k]==='string'&&body[k].length>0&&body[k].length<=128&&!/[\s\x00-\x1f\x7f]/.test(body[k]));
}
// The public confirmation contract carries no authority claims. Bridge and
// source revisions come from the authorized, immutable durable draft.
function validConfirmation(body){
  return exact(body,['id','hash_esborrany','revisio_politica','confirm'])&&body.confirm===true
    &&UUID.test(body.id??'')&&HASH.test(body.hash_esborrany??'')
    &&(typeof body.revisio_politica==='string'&&/^[1-9][0-9]{0,18}$/.test(body.revisio_politica)
      ||Number.isSafeInteger(body.revisio_politica)&&body.revisio_politica>0);
}
/** The factory closes over server dependencies; it MUST NOT cache a motor
 * carrying a previous person's session. No admin bearer fallback exists.
 * Optional refresh only prepares canonical records, never dispatches them.
 */
export function creaGestorHttpPosse({creaMotorPerSessio,publishingEnabled=false}={}){
  if(typeof creaMotorPerSessio!=='function')throw TypeError('posse_session_factory_required');
  async function handle(action,{headers={},body={},query={}}={}){
    if(!['preparades','publish','publica','prepara','exporta-historic'].includes(action))return answer(404,{error:'posse_route_unknown'});
    const origin=header(headers,'origin');
    if((action!=='preparades'||origin)&&origin!=='https://socdepoble.cat')return answer(403,{error:'origin_rejected'});
    const sessionHash=hashSessioNodeZero(headers),expectedActor=header(headers,'x-sdp-expected-actor');
    if(!sessionHash)return answer(401,{error:'session_required'});
    if(!UUID.test(expectedActor))return answer(409,{error:'actor_binding_required'});
    if(action==='preparades'){
      if(!exact(query,[])&&(!exact(query,['bridgeId'])||!UUID.test(query.bridgeId??'')))return answer(400,{error:'posse_input_invalid'});
    }else if(action==='publish'||action==='publica'){
      if(!validPublish(body)&&!validConfirmation(body))return answer(409,{error:'posse_explicit_confirmation_required'});
      if(publishingEnabled!==true)return answer(503,{error:'posse_publish_disabled'});
    }else if(action==='prepara'){
      if(!exact(body,['bridgeId','recordId'])||!UUID.test(body.bridgeId??'')||!reference(body.recordId))return answer(400,{error:'posse_input_invalid'});
    }else if(!exact(body,['bridgeId','recordIds'])||!UUID.test(body.bridgeId??'')||!Array.isArray(body.recordIds)||body.recordIds.length>20||!body.recordIds.every(reference))return answer(400,{error:'posse_input_invalid'});
    const context=Object.freeze({sessionHash,expectedActor:expectedActor.toLowerCase()});
    try{
      const service=await creaMotorPerSessio(context),motor=service?.motor;
      if(!motor||!['listPrepared','prepare','publish','queueHistorical'].every(k=>typeof motor[k]==='function'))throw Error('unavailable');
      if(action==='preparades'){
        let bridgeId=query.bridgeId;
        if(!bridgeId){
          if(typeof service.loadDefaultBridge!=='function')throw Object.assign(Error('unavailable'),{code:'POSSE_DEFAULT_BRIDGE_UNAVAILABLE'});
          const bridge=await service.loadDefaultBridge();bridgeId=typeof bridge==='string'?bridge:bridge?.id;
          if(!UUID.test(bridgeId??''))throw Object.assign(Error('unavailable'),{code:'POSSE_DEFAULT_BRIDGE_UNAVAILABLE'});
        }
        const selection={bridgeId};
        if(typeof service.prepareCurrent==='function')await service.prepareCurrent(selection,context);
        const rows=typeof service.listPrepared==='function'?await service.listPrepared(selection,context):await motor.listPrepared(selection,context);
        if(!Array.isArray(rows)||rows.length>100)throw Error('invalid_rows');
        return answer(200,{bridgeId,publications:rows,catalogLimit:100,confirmationRequired:true,publishingEnabled:publishingEnabled===true});
      }
      if(action==='publish'||action==='publica'){
        if(validConfirmation(body)){
          if(typeof service.publishConfirmation!=='function')throw Error('unavailable');
          return answer(200,await service.publishConfirmation({...body,revisio_politica:String(body.revisio_politica)},context));
        }
        return answer(200,await motor.publish(body,context));
      }
      if(action==='prepara')return answer(200,await motor.prepare(body,context));
      return answer(200,await motor.queueHistorical(body,context));
    }catch(error){
      const status=Object.hasOwn(ERRORS,error?.code)?ERRORS[error.code]:503;
      return answer(status,{error:Object.hasOwn(ERRORS,error?.code)?error.code.toLowerCase():'posse_operation_failed'});
    }
  }
  return Object.freeze({handle,capabilities:Object.freeze({prepared:true,publish:publishingEnabled===true,confirmationRequired:true})});
}
