import {capcaleresDeServei} from '../_shared/apple.js';
import {creaServeiIAIA} from './service.js';
import {creaModelIAIA} from './model.js';
import {errorIAIA,idIAIA} from '../../../src/data/iaiaProtocol.js';
async function jsonBounded(response,max=65536,signal){
  if(!response.ok||response.redirected||!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??''))throw errorIAIA('IAIA_BACKEND',503);
  const reader=response.body?.getReader();if(!reader)throw errorIAIA('IAIA_BACKEND',503);
  const cancel=()=>{void reader.cancel().catch(()=>{});};signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  const chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;if((size+=value.byteLength)>max)throw errorIAIA('IAIA_LIMIT',413);chunks.push(value);}}finally{signal?.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock();}
  const all=new Uint8Array(size);let n=0;for(const c of chunks){all.set(c,n);n+=c.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
const DEFAULT_ORIGINS=Object.freeze(['https://socdepoble.org','https://socdepoble.cat','capacitor://localhost','https://localhost']);
function originsIAIA(env){
  const plural=env.SDP_IAIA_ORIGINS!==undefined&&env.SDP_IAIA_ORIGINS!==null;
  const single=env.SDP_IAIA_ORIGIN!==undefined&&env.SDP_IAIA_ORIGIN!==null;
  if(plural&&single)throw errorIAIA('IAIA_CONFIG',503);
  const configured=plural?env.SDP_IAIA_ORIGINS:single?env.SDP_IAIA_ORIGIN:null;
  if(configured===null)return new Set(DEFAULT_ORIGINS);
  if(typeof configured!=='string'||configured.length>4096)throw errorIAIA('IAIA_CONFIG',503);
  const entries=(plural?configured.split(','):[configured]).map(v=>v.trim());
  if(!entries.length||entries.length>16)throw errorIAIA('IAIA_CONFIG',503);
  for(const value of entries){
    if(value==='capacitor://localhost')continue;
    let u;try{u=new URL(value);}catch{throw errorIAIA('IAIA_CONFIG',503);}
    const local=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
    if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||u.origin!==value||!(u.protocol==='https:'||u.protocol==='http:'&&local))throw errorIAIA('IAIA_CONFIG',503);
  }
  return new Set(entries);
}
function backendIAIA(value){
  if(value===undefined||value===null)return null;
  let u;try{u=new URL(value);}catch{throw errorIAIA('IAIA_CONFIG',503);}
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw errorIAIA('IAIA_CONFIG',503);
  return u.origin;
}
export function creaGestorIAIA({env={},fetchImpl=globalThis.fetch,wakeAfterPersist=null}={}){
  const origins=originsIAIA(env),base=backendIAIA(env.SUPABASE_URL);
  const publicKey=typeof env.SUPABASE_ANON_KEY==='string'?env.SUPABASE_ANON_KEY.trim():'';
  const serviceKey=typeof env.SUPABASE_SERVICE_ROLE_KEY==='string'?env.SUPABASE_SERVICE_ROLE_KEY.trim():'';
  const infer=env.SDP_IAIA_ACTIVA==='1'?creaModelIAIA({endpoint:env.SDP_IAIA_MODEL_ENDPOINT,model:env.SDP_IAIA_MODEL,token:env.SDP_IAIA_MODEL_TOKEN,fetchImpl}):null;
  async function call(path,headers,body,signal,isAuth=false){
    if(!base||!headers.apikey)throw errorIAIA('IAIA_CONFIG',503);
    const response=await fetchImpl(`${base}${path}`,{method:body===undefined?'GET':'POST',headers:{...headers,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal,redirect:'error',credentials:'omit',cache:'no-store'});
    if(isAuth&&[401,403].includes(response.status)){void response.body?.cancel().catch(()=>{});throw errorIAIA('IAIA_AUTH',401);}
    return jsonBounded(response,65536,signal);
  }
  const authorize=async({token,signal})=>{
    // User JWT is the identity credential; a project service apikey never replaces it.
    const user=await call('/auth/v1/user',{apikey:publicKey||serviceKey,Authorization:`Bearer ${token}`},undefined,signal,true);
    let userId,tenantId;try{userId=idIAIA(user?.id);}catch{throw errorIAIA('IAIA_AUTH',401);}
    try{tenantId=idIAIA(env.SDP_IAIA_TENANT);}catch{throw errorIAIA('IAIA_CONFIG',503);}
    return {userId,tenantId};
  };
  // Legacy service JWT: apikey + Bearer. New sb_secret_: apikey only.
  const rpc=(name,args)=>{if(!serviceKey)throw errorIAIA('IAIA_GROUP_UNAVAILABLE',503);return call(`/rest/v1/rpc/${name}`,capcaleresDeServei(serviceKey),args,AbortSignal.timeout(4000));};
  const store={discover:s=>serviceKey?rpc('xat_iaia_worker_discover',{p_tenant:s.tenantId,p_user:s.userId}):null,
    claim:(s,i)=>rpc('xat_iaia_worker_claim',{p_tenant:s.tenantId,p_user:s.userId,p_fil:i.threadId,p_source:i.messageId}),
    finish:(s,_i,c,text)=>rpc('xat_iaia_worker_finish',{p_tenant:s.tenantId,p_user:s.userId,p_job:c.jobId,p_lease:c.leaseId,p_text:text}),
    cancel:(s,_i,c)=>rpc('xat_iaia_worker_cancel',{p_tenant:s.tenantId,p_user:s.userId,p_job:c.jobId,p_lease:c.leaseId})};
  const service=creaServeiIAIA({authorize,store,infer,wakeAfterPersist});
  return async req=>{
    const origin=req.headers.get('origin'),allowed=origins.has(origin);
    const cors={...(allowed?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
    const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:cors});
    if(!allowed)return reply(403,{error:'IAIA_ORIGIN'});
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(req.method!=='POST'||new URL(req.url).search)return reply(405,{error:'IAIA_METHOD'});
    if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')??''))return reply(415,{error:'IAIA_JSON'});
    const match=/^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(req.headers.get('authorization')??'');if(!match)return reply(401,{error:'IAIA_AUTH'});
    const control=new AbortController(),abort=()=>control.abort(req.signal.reason);req.signal.addEventListener('abort',abort,{once:true});if(req.signal.aborted)abort();const timer=setTimeout(()=>control.abort(),15000);
    let onAbort;
    const interrupted=new Promise((_,reject)=>{onAbort=()=>reject(errorIAIA('IAIA_ABORT',499));control.signal.addEventListener('abort',onAbort,{once:true});if(control.signal.aborted)onAbort();});
    try{const work=(async()=>{const body=await jsonBounded(new Response(req.body,{headers:{'Content-Type':'application/json'}}),8192,control.signal);return service(body,{token:match[1],signal:control.signal},control.signal);})();return reply(200,await Promise.race([work,interrupted]));}
    catch(e){return reply(e.status??503,{error:e.code??'IAIA_UNAVAILABLE'});}finally{clearTimeout(timer);req.signal.removeEventListener('abort',abort);control.signal.removeEventListener('abort',onAbort);}
  };
}
