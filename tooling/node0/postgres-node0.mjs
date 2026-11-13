import { SQL_ESTAT_OUTBOX_NODE0 } from './outbox-federada-node0.mjs';
import { spawn } from 'node:child_process';
import {preparaConsultaPrivadaNodeZero,POLITICA_LOG_PRIVAT_NODE0} from './consulta-privada-node0.mjs';

/** Values travel as base64 UTF-8, never as SQL syntax or shell arguments. */
export const sqlText = (value) => `convert_from(decode('${Buffer.from(String(value)).toString('base64')}','base64'),'UTF8')`;
export const sqlJson = (value) => `${sqlText(JSON.stringify(value))}::jsonb`;

/** Original ledger ID on the latest clock instant, across both timestamp formats.
 * Ledger hash ordering remains a separate, unchanged cryptographic convention. */
export const SQL_ULTIMA_MIGRACIO_NODE0 = `SELECT version FROM node0.schema_migrations
  ORDER BY CASE WHEN length(version)=10 THEN '20'||version||'00' ELSE version END DESC,
    version COLLATE "C" DESC LIMIT 1`;

export function sqlDesaDocuments(kind, documents) {
  if (!Array.isArray(documents) || documents.length > 100) throw new Error('node0_document_limit');
  for (const doc of documents) if (!doc || typeof doc.id !== 'string' || !doc.id || doc.id.length > 2048 || doc.visibility !== 'public') throw new Error('node0_public_document_required');
  if (!documents.length) return "SELECT json_build_object('received',0,'saved',0);";
  const statements = documents.map((doc,index) => `changed${index} AS (INSERT INTO node0.public_documents(kind,id,document,source_uri) SELECT ${sqlText(kind)},${sqlText(doc.id)},${sqlJson(doc)},${doc.uri ? sqlText(doc.uri) : 'NULL'} WHERE NOT EXISTS(SELECT 1 FROM node0.tombstones WHERE id=${sqlText(doc.uri || doc.id)}) ON CONFLICT(kind,id) DO UPDATE SET document=EXCLUDED.document WHERE node0.public_documents.document IS DISTINCT FROM EXCLUDED.document AND NOT EXISTS(SELECT 1 FROM node0.tombstones WHERE id=${sqlText(doc.uri || doc.id)}) RETURNING id)`).join(',\n');
  const count = documents.map((_,index)=>`(SELECT count(*) FROM changed${index})`).join('+');
  return `WITH ${statements} SELECT json_build_object('received',${documents.length},'saved',${count});`;
}

export function creaPostgres({ env = process.env, executable = env.NODE0_PSQL || 'psql', timeoutMs = 12000 } = {}) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(env.PGDATABASE??'') || ['postgres', 'template0', 'template1'].includes(env.PGDATABASE)) throw new Error('node0_database_required');
  if (!((env.PGHOST?.startsWith('/') && !/[\s,\x00]/.test(env.PGHOST)) || ['127.0.0.1', '::1'].includes(env.PGHOST))) throw new Error('node0_database_must_be_local');
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(env.PGUSER??'')) throw new Error('node0_runtime_role_required');
  for (const name of ['PGHOSTADDR','PGSERVICE','PGSERVICEFILE','PGOPTIONS']) if (env[name]) throw new Error('node0_database_override_rejected');
  const query = (sql, options = {}) => new Promise((resolve, reject) => {
    if(options===null||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(key=>!['privateValues','signal'].includes(key))||options.privateValues!==undefined&&typeof options.privateValues!=='boolean'||options.signal!==undefined&&!(options.signal instanceof AbortSignal))throw new TypeError('node0_query_options_invalid');
    if(options.signal?.aborted)return reject(new Error('node0_database_aborted'));
    const script=options.privateValues===true||['node0_authenticator','node0_iaia_authenticator'].includes(env.PGUSER)?preparaConsultaPrivadaNodeZero(sql,{role:env.PGUSER}).script:sql;
    const child = spawn(executable, ['-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate'], { env: { ...env, LC_ALL:'C', LANG:'C', PGCONNECT_TIMEOUT: '5' }, stdio: ['pipe', 'pipe', 'pipe'] });
    const data=[];let bytes=0,finished=false,stopping=null,diagnostics='',timer,killTimer;
    const settle = (error,value) => {
      if(finished)return;finished=true;clearTimeout(timer);clearTimeout(killTimer);
      options.signal?.removeEventListener('abort',abort);
      if(error)reject(error);else resolve(value);
    };
    // Cancellation keeps ownership of the actual child until close; escalate a
    // child ignoring SIGTERM, with no replacement connection in the meantime.
    const stop = code => {
      if(finished||stopping)return;stopping=new Error(code);clearTimeout(timer);
      child.stdin.destroy();child.kill('SIGTERM');
      killTimer=setTimeout(()=>{if(!finished)child.kill('SIGKILL');},250);
    };
    const abort=()=>stop('node0_database_aborted');
    timer=setTimeout(()=>stop('node0_database_timeout'),timeoutMs);
    options.signal?.addEventListener('abort',abort,{once:true});
    child.stdout.on('data',chunk=>{if(finished||stopping)return;bytes+=chunk.length;if(bytes>4*1024*1024)stop('node0_database_response_limit');else data.push(Buffer.from(chunk));});
    // Only closed codes leave the adapter. PostgreSQL messages and user values
    // remain bounded internal diagnostics, including connection failures.
    child.stderr.on('data',chunk=>{if(diagnostics.length<4096)diagnostics+=chunk.toString().slice(0,4096-diagnostics.length);});
    child.on('error',error=>settle(new Error(['ENOENT','EACCES','ENOEXEC'].includes(error.code)?'node0_database_binary_unavailable':'node0_database_spawn_failed')));
    child.stdin.on('error',()=>{});
    child.on('close',code=>{
      if(finished)return;
      if(stopping)return settle(stopping);
      if(code!==0){
        const sqlState=/(?:ERROR|FATAL):\s+([0-9A-Z]{5})(?:\s|$)/.exec(diagnostics)?.[1];
        // libpq connection diagnostics do not always carry SQLSTATE. Accept
        // only C-locale transport failures naming the configured local target;
        // exit 2 alone also covers wrong credentials/database/role and is final.
        const port=String(env.PGPORT||5432);
        const target=env.PGHOST.startsWith('/')
          ? `connection to server on socket "${env.PGHOST.replace(/\/$/,'')}/.s.PGSQL.${port}" failed: `
          : `connection to server at "${env.PGHOST}" (${env.PGHOST}), port ${port} failed: `;
        const transientTransport=code===2&&!sqlState&&diagnostics.split('\n').some(line=>['No such file or directory','Connection refused','timeout expired'].some(reason=>line===`psql: error: ${target}${reason}`));
        return settle(Object.assign(new Error(transientTransport?'node0_database_transport_unavailable':'node0_database_query_failed'),sqlState?{sqlState}:{}));
      }
      try{settle(null,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(data,bytes)).trim()));}
      catch{settle(new Error('node0_database_invalid_response'));}
    });
    if(options.signal?.aborted)abort();
    if(!stopping)child.stdin.end(`SET statement_timeout='8s';\n${script}\n`);
  });
  return Object.freeze({
    query,
    async verificaRol(options = {}) {
      const role = await query("SELECT json_build_object('superuser',rolsuper,'bypassrls',rolbypassrls,'createdb',rolcreatedb,'createrole',rolcreaterole,'replication',rolreplication,'memberships',(SELECT count(*) FROM pg_auth_members WHERE member=pg_roles.oid),'name',rolname) FROM pg_roles WHERE rolname=current_user;",options);
      if (role.superuser || role.bypassrls || role.createdb || role.createrole || role.replication || role.memberships || role.name !== 'node0_runtime') throw new Error('node0_unsafe_runtime_role');
      return true;
    },
    async verificaRolAutenticador(options = {}) {
      const role=await query(`SELECT jsonb_build_object('name',rolname,'login',rolcanlogin,'inherit',rolinherit,'unsafe',rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication,
        'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('role',r.rolname,'admin',m.admin_option,'inherit',m.inherit_option,'set',m.set_option,'unsafe',r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication,'parents',(SELECT count(*) FROM pg_auth_members p WHERE p.member=r.oid))),'[]'::jsonb) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE m.member=pg_roles.oid)) FROM pg_roles WHERE rolname=current_user;`,options);
      if(role?.name!=='node0_authenticator'||role.login!==true||role.inherit!==false||role.unsafe||!Array.isArray(role.memberships)||role.memberships.length!==2||new Set(role.memberships.map(m=>m.role)).size!==2||role.memberships.some(m=>!['anon','authenticated'].includes(m.role)||m.admin||m.inherit||m.set!==true||m.unsafe||m.parents!==0))throw new Error('node0_unsafe_authenticator_role');
      const gates=await query(`SELECT jsonb_build_object('context',has_function_privilege(current_user,'private.node0_auth_context(text)','EXECUTE'),
        'logout',has_function_privilege(current_user,'private.node0_auth_logout(text,uuid)','EXECUTE'),
        'password',has_function_privilege(current_user,'private.node0_auth_password(text,bigint,text,text,uuid)','EXECUTE'),
        'norms',has_function_privilege(current_user,'private.node0_auth_norms(text,text,uuid)','EXECUTE'),
        'normsState',has_function_privilege(current_user,'private.node0_auth_norms_state(text,uuid)','EXECUTE'),
        'emailVerify',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_verify(text,text,text,text)')::oid,'EXECUTE'),false),
        'emailReset',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_reset(text,text,text,text)')::oid,'EXECUTE'),false),
        'emailResetChallenge',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_reset_challenge(text,text)')::oid,'EXECUTE'),false),
        'challengeReady',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_challenge_ready(text,text)')::oid,'EXECUTE'),false),
        'pendingSweep',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_sweep_pending()')::oid,'EXECUTE'),false),
        'oldProofAbsent',to_regprocedure('private.node0_auth_verify(text)') IS NULL,
        'finishDirect',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_finish_email(text,text,text,text,text)')::oid,'EXECUTE'),false),
        'purgeDirect',coalesce(has_function_privilege(current_user,to_regprocedure('private.node0_auth_purge_pending(text)')::oid,'EXECUTE'),false),
        'challengeBinding',(SELECT count(*)=2 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='private' AND c.relname='node0_email_challenges' AND a.attname IN ('credential_version','purpose') AND a.attnotnull AND NOT a.attisdropped),
        'pendingDeadline',(SELECT count(*)=1 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='private' AND c.relname='node0_credentials' AND a.attname='pending_until' AND a.attnotnull AND a.atttypid='timestamptz'::regtype AND NOT a.attisdropped),
        'credentialsDirect',has_table_privilege(current_user,(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='private' AND c.relname='node0_credentials'),'SELECT'),
        'pendingBansDirect',has_table_privilege(current_user,(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='private' AND c.relname='node0_pending_bans'),'SELECT'),
        'sessionsDirect',has_table_privilege(current_user,(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='private' AND c.relname='node0_sessions'),'SELECT'),
        'usersDirect',has_table_privilege(current_user,(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='auth' AND c.relname='users'),'SELECT'));`,options);
      if(!gates||['context','logout','password','norms','normsState','emailVerify','emailReset','emailResetChallenge','challengeReady','pendingSweep','oldProofAbsent','challengeBinding','pendingDeadline'].some(key=>gates[key]!==true)||['credentialsDirect','sessionsDirect','usersDirect','pendingBansDirect','finishDirect','purgeDirect'].some(key=>gates[key]!==false))throw new Error('node0_unsafe_authenticator_grants');
      const logging=await query(`SELECT jsonb_build_object(${Object.keys(POLITICA_LOG_PRIVAT_NODE0).map(key=>`'${key}',current_setting('${key}')`).join(',')});`,options);
      if(Object.entries(POLITICA_LOG_PRIVAT_NODE0).some(([key,value])=>logging?.[key]!==value))throw new Error('node0_private_logging_policy_required');
      return true;
    },
    documents: (kind) => query(`SELECT coalesce(json_agg(document ORDER BY id),'[]'::json) FROM node0.public_documents WHERE kind=${sqlText(kind)};`),
    dadesObertesMunicipi: slug => {
      if(typeof slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120)throw new TypeError('node0_municipality_slug_invalid');
      return query(`SELECT public.llegix_municipi_open_data_per_slug(${sqlText(slug)});`);
    },
    desaDocuments: (kind, documents) => query(sqlDesaDocuments(kind, documents)),
    status: () => query(`SELECT json_build_object('ok',true,'version',current_setting('server_version'),'schemaVersion',(${SQL_ULTIMA_MIGRACIO_NODE0}),'taules',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','node0') AND c.relkind='r'),'registres',(SELECT coalesce(json_object_agg(kind,n),'{}'::json) FROM (SELECT kind,count(*) AS n FROM node0.public_documents GROUP BY kind) t),'activitypub',json_build_object('received',(SELECT count(*) FROM node0.inbox WHERE actor='https://mastodont.cat/users/depoble'),'followers',(SELECT count(*) FROM node0.followers),'pending',(SELECT count(*) FROM node0.outbox WHERE delivered_at IS NULL),'outbox',${SQL_ESTAT_OUTBOX_NODE0}));`)
  });
}
