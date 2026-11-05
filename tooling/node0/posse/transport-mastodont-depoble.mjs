/** Concrete first-deployment adapter, NOT a generic arbitrary-host OAuth client.
 * Credentials are injected server-side. No process.env, default fetch or main.
 * Generic engine selects an isolated adapter per bridge. Future instances need
 * their own pinned-origin/DNS policy, credential isolation and account verifier.
 */
import {randomUUID} from 'node:crypto';
import {executaAmbTerminiMastodon} from '../../../src/data/federacio/pontMastodon.js';
import {textPosse} from './formatador-posse.mjs';

const ORIGIN='https://mastodont.cat',ACTOR=ORIGIN+'/users/depoble',PROFILE=ORIGIN+'/@depoble',ID=/^[1-9][0-9]{0,29}$/;
const privateFailure=Symbol('posse-adapter-failure');
const failure=(code,effect='unknown')=>Object.assign(Error(code),{code,effect,[privateFailure]:true});
const stop=(code,effect)=>{throw failure(code,effect);};
function cancel(body){try{Promise.resolve(body?.cancel()).catch(()=>{});}catch{/* consumed or locked */}}
export function creaTransportMastodontDepoble({fetchImpl,token,certifyScopes,beforeMutation,noteRateLimit=async()=>{},now=Date.now,deadlineMs=10000}={}){
  if(typeof fetchImpl!=='function'||typeof certifyScopes!=='function'||typeof beforeMutation!=='function'||typeof token!=='string'||token.length<8||token.length>4096||/[\s\x00-\x1f\x7f]/.test(token))throw TypeError('POSSE_PRIVATE_ADAPTER_CONFIGURATION_REQUIRED');
  let certificate=null;
  async function json(endpoint,{method='GET',body,headers={},allowed=[200],leaseId,scope}={}){
    if(!endpoint.startsWith(ORIGIN+'/api/')||new URL(endpoint).origin!==ORIGIN)stop('POSSE_REMOTE_ENDPOINT_REJECTED','not-dispatched');
    let dispatched=false;
    try{return await executaAmbTerminiMastodon(async signal=>{
      if(method!=='GET'){
        if(!certificate||certificate.expiresAt<now()||!certificate.scopes.includes(scope))stop('POSSE_CREDENTIAL_NOT_CERTIFIED','not-dispatched');
        let permit;try{permit=await beforeMutation({leaseId,endpoint,method,scope,accountIdentity:ACTOR});}catch{stop('POSSE_QUOTA_NOT_RESERVED','not-dispatched');}
        if(permit?.allowed!==true)stop('POSSE_QUOTA_NOT_RESERVED','not-dispatched');
      }
      if(signal.aborted)stop('POSSE_ADAPTER_ABORTED','not-dispatched');dispatched=true;
      const response=await fetchImpl(endpoint,{method,body,signal,redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',headers:{Authorization:'Bearer '+token,Accept:'application/json',...headers}});
      if(signal.aborted){cancel(response?.body);stop('POSSE_ADAPTER_TIMEOUT');}
      const remaining=response?.headers?.get('x-ratelimit-remaining'),reset=response?.headers?.get('x-ratelimit-reset');
      if(remaining!==null&&remaining!==undefined&&/^\d{1,9}$/.test(remaining))await noteRateLimit({remaining:Number(remaining),resetAt:reset&&Number.isFinite(Date.parse(reset))?new Date(reset).toISOString():null});
      if(!response||response.redirected||response.url&&response.url!==endpoint||!allowed.includes(response.status)){cancel(response?.body);stop('POSSE_REMOTE_RESPONSE_REJECTED');}
      if(response.status===206){cancel(response.body);return{status:206,value:null};}
      if(response.headers?.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json'||Number(response.headers?.get('content-length'))>1048576||!response.body?.getReader){cancel(response.body);stop('POSSE_REMOTE_JSON_REQUIRED');}
      const reader=response.body.getReader(),chunks=[];let size=0;
      const abort=()=>{try{Promise.resolve(reader.cancel()).catch(()=>{});}catch{/* already closed */}};
      signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
      try{while(true){if(signal.aborted)stop('POSSE_ADAPTER_TIMEOUT');const{done,value}=await reader.read();if(signal.aborted)stop('POSSE_ADAPTER_TIMEOUT');if(done)break;if(!(value instanceof Uint8Array)||(size+=value.byteLength)>1048576){abort();stop('POSSE_REMOTE_RESPONSE_LIMIT');}chunks.push(Buffer.from(value));}}
      finally{signal.removeEventListener('abort',abort);reader.releaseLock();}
      let value;try{value=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks,size)));}catch{stop('POSSE_REMOTE_JSON_REQUIRED');}
      return{status:response.status,value};
    },{terminiMs:deadlineMs});}catch(error){
      if(error?.[privateFailure])throw error;throw failure('POSSE_ADAPTER_UNAVAILABLE',dispatched?'unknown':'not-dispatched');
    }
  }
  function account(account){
    if(!account||typeof account.id!=='string'||!ID.test(account.id)||account.username!=='depoble'||account.acct!=='depoble'||account.url!==PROFILE||account.uri!==ACTOR)stop('POSSE_TOKEN_ACCOUNT_MISMATCH','not-dispatched');return account.id;
  }
  async function preflight({requiredScopes}){
    certificate=null;const value=(await json(ORIGIN+'/api/v1/accounts/verify_credentials')).value,id=account(value);
    let proof;try{proof=await certifyScopes({accountId:id,accountIdentity:ACTOR,requiredScopes:[...requiredScopes]});}catch{stop('POSSE_SCOPE_CERTIFICATION_REQUIRED','not-dispatched');}
    if(proof?.ok!==true||!Array.isArray(proof.scopes)||!requiredScopes.every(scope=>proof.scopes.includes(scope))||!/^[a-f0-9]{64}$/.test(proof.proofSha256??''))stop('POSSE_SCOPE_CERTIFICATION_REQUIRED','not-dispatched');
    certificate={accountId:id,accountIdentity:ACTOR,scopes:[...proof.scopes],certificationId:proof.proofSha256,expiresAt:now()+300000};
    return{accountIdentity:ACTOR,accountId:id,scopes:[...certificate.scopes],certificationId:certificate.certificationId};
  }
  function media(value){if(!value||typeof value.id!=='string'||!ID.test(value.id)||value.type!=='image')stop('POSSE_MEDIA_RESPONSE_UNVERIFIED');return value.id;}
  async function uploadMedia({leaseId,bytes,mimeType,description=''}){
    if(!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>8*1024*1024||!['image/png','image/jpeg','image/webp'].includes(mimeType))stop('POSSE_MEDIA_INPUT_INVALID','not-dispatched');
    const copy=Buffer.from(bytes),boundary='sdp-posse-'+randomUUID().replaceAll('-',''),extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mimeType];
    if(copy.includes(Buffer.from(boundary)))stop('POSSE_MEDIA_BOUNDARY_CONFLICT','not-dispatched');
    const descriptionText=textPosse(description);if([...descriptionText].length>1500)stop('POSSE_MEDIA_INPUT_INVALID','not-dispatched');
    const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="cover.${extension}"\r\nContent-Type: ${mimeType}\r\n\r\n`),copy,Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\n${descriptionText}\r\n--${boundary}--\r\n`)]);
    const response=await json(ORIGIN+'/api/v2/media',{method:'POST',body,leaseId,scope:'write:media',allowed:[200,202],headers:{'Content-Type':'multipart/form-data; boundary='+boundary,'Content-Length':String(body.length)}});
    return{id:media(response.value),ready:response.status===200&&typeof response.value.url==='string'&&response.value.url.startsWith('https://')};
  }
  async function getMedia({id}){
    if(typeof id!=='string'||!ID.test(id))stop('POSSE_MEDIA_ID_INVALID','not-dispatched');
    const response=await json(ORIGIN+'/api/v1/media/'+id,{allowed:[200,206]});if(response.status===206)return{id,ready:false};
    if(media(response.value)!==id)stop('POSSE_MEDIA_RESPONSE_UNVERIFIED');return{id,ready:typeof response.value.url==='string'&&response.value.url.startsWith('https://')};
  }
  function validateResult(result,{accountIdentity,operation,externalStatusId}={}){
    return accountIdentity===ACTOR&&result?.accountIdentity===ACTOR&&typeof result.id==='string'&&ID.test(result.id)&&result.accountId===certificate?.accountId&&result.url===PROFILE+'/'+result.id&&result.uri===ACTOR+'/statuses/'+result.id&&(operation!=='update'||result.id===externalStatusId);
  }
  async function publishStatus({leaseId,operation,externalStatusId,idempotencyKey,status,visibility,language,mediaIds=[],accountIdentity}){
    if(accountIdentity!==ACTOR||!['create','update'].includes(operation)||visibility!=='public'||language!=='ca'||typeof status!=='string'||!status.isWellFormed()||[...status].length>500||!Array.isArray(mediaIds)||mediaIds.length>4||mediaIds.some(id=>typeof id!=='string'||!ID.test(id))||operation==='update'&&(typeof externalStatusId!=='string'||!ID.test(externalStatusId))||typeof idempotencyKey!=='string'||!/^sdp-posse-[a-f0-9]{64}$/.test(idempotencyKey))stop('POSSE_STATUS_INPUT_INVALID','not-dispatched');
    const endpoint=ORIGIN+'/api/v1/statuses'+(operation==='update'?'/'+externalStatusId:''),method=operation==='update'?'PUT':'POST';
    const response=await json(endpoint,{method,leaseId,scope:'write:statuses',body:JSON.stringify({status,visibility,language,media_ids:mediaIds}),headers:{'Content-Type':'application/json','Idempotency-Key':idempotencyKey}});
    const remote=response.value,result={id:remote?.id,accountId:remote?.account?.id,accountIdentity:ACTOR,url:remote?.url,uri:remote?.uri};
    if(remote?.visibility!=='public'||!validateResult(result,{accountIdentity,operation,externalStatusId}))stop('POSSE_STATUS_RESPONSE_UNVERIFIED');return result;
  }
  return Object.freeze({requiredScopes:({media})=>['read:accounts','write:statuses',...(media?['write:media']:[])],preflight,uploadMedia,getMedia,publishStatus,validateResult});
}
