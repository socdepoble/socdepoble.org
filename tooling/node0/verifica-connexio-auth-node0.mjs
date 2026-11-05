#!/usr/bin/env node
/** Native lab-only direct peer connection proof. Creates no account/session. */
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {creaPostgres,sqlText} from './postgres-node0.mjs';
import {TARGET_AUTH_NODE0,DATABASE_AUTH_LAB} from './prepara-connexio-auth-node0.mjs';
export async function verificaConnexioAuthNodeZero(){
  const db=creaPostgres({env:{PATH:'/usr/bin:/bin',LANG:'C',PGPASSFILE:'/dev/null',PGUSER:'node0_authenticator',PGDATABASE:DATABASE_AUTH_LAB,PGHOST:TARGET_AUTH_NODE0.socket,PGPORT:'5432',NODE0_PSQL:path.join(TARGET_AUTH_NODE0.bin,'psql')}});
  await db.verificaRolAutenticador();
  const identity=await db.query("SELECT jsonb_build_object('database',current_database(),'role',current_user,'sessionUser',session_user,'version',current_setting('server_version')); ");
  if(identity.database!==DATABASE_AUTH_LAB||identity.role!=='node0_authenticator'||identity.sessionUser!==identity.role)throw Error('node0_direct_peer_identity_failed');
  const refusals=[];
  for(const table of ['auth.users','private.node0_credentials','private.node0_sessions']){
    let rejected=false;try{await db.query(`SELECT to_jsonb(t) FROM ${table} t LIMIT 1;`);}catch(error){rejected=error.sqlState==='42501';}
    if(!rejected)throw Error('node0_authenticator_direct_table_not_denied');refusals.push(table);
  }
  for(const role of ['service_role','node0_runtime']){
    let rejected=false;try{await db.query(`SET ROLE ${role}; SELECT 'true'::jsonb;`);}catch(error){rejected=error.sqlState==='42501';}
    if(!rejected)throw Error('node0_authenticator_role_escalation_not_denied');
  }
  const policy=await db.query('SELECT private.node0_auth_policy();');
  if(typeof policy?.privacy?.version!=='string'||typeof policy?.normsVersion!=='string')throw Error('node0_authenticator_policy_failed');
  const nobody=await db.query(`SELECT coalesce(private.node0_auth_context(${sqlText('0'.repeat(64))}),'null'::jsonb);`);
  if(nobody!==null)throw Error('node0_unknown_session_was_accepted');
  const anonymous=await db.query("BEGIN; SET LOCAL ROLE authenticated; SELECT jsonb_build_object('user',auth.uid(),'notes',(SELECT count(*) FROM public.notes)); COMMIT;");
  if(anonymous.user!==null||anonymous.notes!==0)throw Error('node0_empty_context_rls_failed');
  return {schema:'sdp.node0.direct-auth-peer-proof.v1',checkedAt:new Date().toISOString(),...identity,narrowRoleVerified:true,directTablesDenied:refusals,roleEscalationsDenied:true,policyVersion:policy.privacy.version,normsVersion:policy.normsVersion,emptySessionDenied:true,emptyClaimsReadZeroNotes:true,accountsCreated:0,sessionsCreated:0,productionDatabaseAccessed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){verificaConnexioAuthNodeZero().then(result=>process.stdout.write(JSON.stringify(result)+'\n')).catch(()=>{process.stderr.write('node0_direct_auth_peer_verification_failed\n');process.exitCode=1;});}
