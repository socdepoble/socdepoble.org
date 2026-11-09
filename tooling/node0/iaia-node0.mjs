import {hashSessioNodeZero} from './auth-node0.mjs';
import {sqlContextSessioNodeZero} from './backend-node0.mjs';
import {sqlText} from './postgres-node0.mjs';
import {idIAIA,errorIAIA} from '../../src/data/iaiaProtocol.js';
import {creaModelIAIA} from '../../supabase/functions/iaia/model.js';
import {creaServeiIAIA} from '../../supabase/functions/iaia/service.js';
/** Worker uses a separate least-privilege login. The cookie authenticator's two-role boundary is unchanged. */
export async function verificaWorkerIAIA(db){
  const r=await db.query(`SELECT jsonb_build_object('name',rolname,'login',rolcanlogin,'inherit',rolinherit,
    'unsafe',rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication,
    'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('role',parent.rolname,
      'admin',membership.admin_option,'inherit',membership.inherit_option,'set',membership.set_option,
      'login',parent.rolcanlogin,'unsafe',parent.rolsuper OR parent.rolbypassrls OR parent.rolcreatedb OR parent.rolcreaterole OR parent.rolreplication,
      'parents',(SELECT count(*) FROM pg_auth_members ancestor WHERE ancestor.member=parent.oid))),'[]'::jsonb)
      FROM pg_auth_members membership JOIN pg_roles parent ON parent.oid=membership.roleid WHERE membership.member=pg_roles.oid),
    'schema',to_regprocedure('public.xat_iaia_worker_finish(uuid,uuid,uuid,uuid,text)') IS NOT NULL)
    FROM pg_roles WHERE rolname=current_user;`,{privateValues:true});
  if(r?.name!=='node0_iaia_authenticator'||r.login!==true||r.inherit!==false||r.unsafe!==false||r.schema!==true||
    !Array.isArray(r.memberships)||r.memberships.length!==1||r.memberships.some(m=>
      m.role!=='node0_iaia_worker'||m.admin!==false||m.inherit!==false||m.set!==true||m.login!==false||m.unsafe!==false||m.parents!==0))throw errorIAIA('IAIA_WORKER_CONFIG',503);
}
export function creaServeiIAIANodeZero({db,workerDb,tenantId,env={},fetchImpl=globalThis.fetch,origin='https://socdepoble.cat',wakeAfterPersist=null}={}){
  idIAIA(tenantId);
  const infer=env.SDP_NODE0_IAIA==='1'?creaModelIAIA({endpoint:env.SDP_IAIA_MODEL_ENDPOINT,model:env.SDP_IAIA_MODEL,token:env.SDP_IAIA_MODEL_TOKEN,fetchImpl}):null;
  const qid=v=>`${sqlText(idIAIA(v))}::uuid`;
  async function worker(fn,args){if(!workerDb)throw errorIAIA('IAIA_GROUP_UNAVAILABLE',503);return workerDb.query(`BEGIN;SET LOCAL ROLE node0_iaia_worker;SELECT coalesce(to_jsonb(public.${fn}(${args.join(',')})),'null'::jsonb);COMMIT;`,{privateValues:true});}
  const authorize=async(headers)=>{
    if(headers.origin!==origin)throw errorIAIA('IAIA_ORIGIN',403);
    const hash=hashSessioNodeZero(headers);if(!hash)throw errorIAIA('IAIA_AUTH',401);
    try{return await db.query(sqlContextSessioNodeZero(hash,headers['x-sdp-expected-actor'])+`SELECT json_build_object('userId',auth.uid(),'tenantId',${qid(tenantId)});COMMIT;`,{privateValues:true});}
    catch(e){throw errorIAIA(e.sqlState==='N0A01'?'session_actor_changed':'IAIA_AUTH',e.sqlState==='N0A01'?409:401);}
  };
  const store={
    discover:s=>workerDb?worker('xat_iaia_worker_discover',[qid(s.tenantId),qid(s.userId)]):null,
    claim:(s,i)=>worker('xat_iaia_worker_claim',[qid(s.tenantId),qid(s.userId),qid(i.threadId),qid(i.messageId)]),
    finish:(s,_i,c,text)=>worker('xat_iaia_worker_finish',[qid(s.tenantId),qid(s.userId),qid(c.jobId),qid(c.leaseId),sqlText(text)]),
    cancel:(s,_i,c)=>worker('xat_iaia_worker_cancel',[qid(s.tenantId),qid(s.userId),qid(c.jobId),qid(c.leaseId)])
  };
  const service=creaServeiIAIA({authorize,store,infer,wakeAfterPersist});
  return Object.freeze({async handle({headers={},body,signal}={}){try{return {status:200,body:await service(body,headers,signal)};}catch(e){return {status:e.status??(e.sqlState==='42501'?403:503),body:{error:e.code??'IAIA_UNAVAILABLE'}};}}});
}
