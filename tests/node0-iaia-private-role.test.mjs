import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {creaPostgres,sqlText} from '../tooling/node0/postgres-node0.mjs';
import {preparaConsultaPrivadaNodeZero,POLITICA_LOG_PRIVAT_NODE0} from '../tooling/node0/consulta-privada-node0.mjs';
if(!process.env.SDP_PGLITE_MODULE||!path.isAbsolute(process.env.SDP_PGLITE_MODULE))throw new Error('Explicit local SDP_PGLITE_MODULE required; no implicit install, native connection or skipped authority proof');
test('worker private role is selected by validated adapter configuration, never by SQL request authority',()=>{
 for(const role of ['node0_authenticator','node0_iaia_authenticator'])assert.ok(preparaConsultaPrivadaNodeZero('SELECT 1',{role}).script.includes(`current_user <> '${role}'`));
 for(const role of ['postgres','node0_runtime',"bad'role",null])assert.throws(()=>preparaConsultaPrivadaNodeZero('SELECT 1',{role}));
 assert.throws(()=>creaPostgres({env:{PGDATABASE:'test',PGHOST:'/tmp',PGUSER:'node0_iaia_authenticator',PGOPTIONS:'-c log_statement=all'}}));
});
test('real adapter child captures automatic worker-private transport and PostgreSQL enforces its exact role/GUC guard',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-worker-private-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'psql.mjs'),capture=path.join(dir,'input');
 fs.writeFileSync(file,"#!/usr/bin/env node\nimport fs from 'node:fs';let s='';for await(const b of process.stdin)s+=b;fs.writeFileSync(process.env.CAPTURE,s);process.stdout.write('true');",{mode:0o700});
 const env={PATH:process.env.PATH,CAPTURE:capture,PGDATABASE:'disposable_worker',PGHOST:'/tmp',PGUSER:'node0_iaia_authenticator'};
 assert.equal(await creaPostgres({env,executable:file}).query(`SELECT ${sqlText('synthetic private worker value')};`),true);
 const sent=fs.readFileSync(capture,'utf8');assert.ok(sent.includes('\\bind'));assert.ok(sent.includes("current_user <> 'node0_iaia_authenticator'"));assert.ok(!sent.includes("decode('c3ludGhldGljIHByaXZhdGUgd29ya2VyIHZhbHVl'"));
 const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);const pg=new PGlite();try{
 await pg.exec('CREATE ROLE node0_authenticator LOGIN NOINHERIT;CREATE ROLE node0_iaia_authenticator LOGIN NOINHERIT;');
 for(const[k,v]of Object.entries(POLITICA_LOG_PRIVAT_NODE0))await pg.query('SELECT set_config($1,$2,false)',[k,v]);
 const guard=sent.slice(0,sent.indexOf('\nBEGIN;'));await pg.exec('SET ROLE node0_iaia_authenticator');await pg.exec(guard);
 const web=preparaConsultaPrivadaNodeZero('SELECT 1').script.split('\nBEGIN;')[0];await assert.rejects(pg.exec(web),e=>e.code==='42501');
 await pg.exec('RESET ROLE;SET ROLE node0_authenticator');await assert.rejects(pg.exec(guard),e=>e.code==='42501');
 await pg.exec('RESET ROLE');await pg.query("SELECT set_config('log_statement','all',false)");await pg.exec('SET ROLE node0_iaia_authenticator');await assert.rejects(pg.exec(guard),e=>e.code==='42501');
 }finally{await pg.close();}
});
test('worker readiness reads real PostgreSQL membership edges and refuses indirect authority or altered role flags',async t=>{
 const {verificaWorkerIAIA}=await import('../tooling/node0/iaia-node0.mjs');
 const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);const pg=new PGlite();
 try{
 await pg.exec(`CREATE ROLE node0_iaia_worker NOLOGIN;CREATE ROLE node0_iaia_authenticator LOGIN NOINHERIT;CREATE ROLE worker_proxy NOLOGIN CREATEDB;CREATE ROLE worker_ancestor NOLOGIN;GRANT node0_iaia_worker TO node0_iaia_authenticator WITH ADMIN FALSE,INHERIT FALSE,SET TRUE;CREATE FUNCTION public.xat_iaia_worker_finish(uuid,uuid,uuid,uuid,text) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;`);
 const db={query:async(sql,options)=>{assert.equal(options.privateValues,true);return Object.values((await pg.query(sql)).rows[0])[0];}};
 const check=async()=>{await pg.exec('SET ROLE node0_iaia_authenticator');try{await verificaWorkerIAIA(db);}finally{await pg.exec('RESET ROLE');}};
 await t.test('one exact direct worker edge with explicit SET only is accepted',async()=>{await check();});
 const negatives=[
 ['indirect privileged parent with a transitive worker membership',`REVOKE node0_iaia_worker FROM node0_iaia_authenticator;GRANT node0_iaia_worker TO worker_proxy;GRANT worker_proxy TO node0_iaia_authenticator WITH INHERIT FALSE,SET TRUE;`],
 ['worker role has its own parent',`GRANT worker_ancestor TO node0_iaia_worker;`],
 ['membership permits administrative grants',`GRANT node0_iaia_worker TO node0_iaia_authenticator WITH ADMIN TRUE;`],
 ['membership inherits authority without explicit SET',`GRANT node0_iaia_worker TO node0_iaia_authenticator WITH INHERIT TRUE;`],
 ['membership cannot SET the required worker',`GRANT node0_iaia_worker TO node0_iaia_authenticator WITH SET FALSE;`],
 ['worker becomes a login',`ALTER ROLE node0_iaia_worker LOGIN;`],
 ['worker has privileged role flags',`ALTER ROLE node0_iaia_worker BYPASSRLS;`],
 ['login inherits role privileges',`ALTER ROLE node0_iaia_authenticator INHERIT;`],
 ['login has privileged role flags',`ALTER ROLE node0_iaia_authenticator CREATEROLE;`],
 ['worker can create databases',`ALTER ROLE node0_iaia_worker CREATEDB;`],
 ['worker can create roles',`ALTER ROLE node0_iaia_worker CREATEROLE;`],
 ['worker has replication authority',`ALTER ROLE node0_iaia_worker REPLICATION;`],
 ['worker is superuser',`ALTER ROLE node0_iaia_worker SUPERUSER;`],
 ['login cannot connect',`ALTER ROLE node0_iaia_authenticator NOLOGIN;`],
 ['login can create databases',`ALTER ROLE node0_iaia_authenticator CREATEDB;`],
 ['login can bypass RLS',`ALTER ROLE node0_iaia_authenticator BYPASSRLS;`],
 ['login has replication authority',`ALTER ROLE node0_iaia_authenticator REPLICATION;`],
 ['login is superuser',`ALTER ROLE node0_iaia_authenticator SUPERUSER;`],
 ['required worker RPC is absent',`DROP FUNCTION public.xat_iaia_worker_finish(uuid,uuid,uuid,uuid,text);`],
 ['extra direct membership',`GRANT worker_ancestor TO node0_iaia_authenticator;`]
 ];
 for(const[name,sql]of negatives)await t.test(name,async()=>{await pg.exec('BEGIN;'+sql);try{await assert.rejects(check(),e=>e.code==='IAIA_WORKER_CONFIG');}finally{await pg.exec('ROLLBACK;RESET ROLE');}});
 await check();
 }finally{await pg.close();}
});
