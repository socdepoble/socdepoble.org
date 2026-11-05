#!/usr/bin/env node
/** Read-only catalogue evidence for AH10. Never reads application row values. */
import {creaPostgres} from './postgres-node0.mjs';
const args=process.argv.slice(2);if(args.length!==1||!['socdepoble_node0','node0_gauntlet_r4'].includes(args[0]))throw Error('explicit_node0_database_required');
const database=args[0];
const db=creaPostgres({env:{PATH:'/usr/bin:/bin',LANG:'C',PGPASSFILE:'/dev/null',PGDATABASE:database,PGUSER:'javi',PGHOST:'/Users/javi/socdepoble-node0/dades/run/postgres17',PGPORT:'5432',NODE0_PSQL:'/Users/javi/local/postgres17/Postgres.app/Contents/Versions/17/bin/psql'}});
const data=await db.query(`SELECT jsonb_build_object('database',current_database(),'version',current_setting('server_version'),'migrations',(SELECT count(*) FROM node0.schema_migrations),
 'tables',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity,
  'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
  'constraints',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',k.conname,'type',k.contype,'definition',pg_get_constraintdef(k.oid)) ORDER BY k.conname),'[]'::jsonb) FROM pg_constraint k WHERE k.conrelid=c.oid),
  'indexes',(SELECT coalesce(jsonb_agg(pg_get_indexdef(i.indexrelid) ORDER BY i.indexrelid::regclass::text),'[]'::jsonb) FROM pg_index i WHERE i.indrelid=c.oid),
  'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',p.policyname,'roles',p.roles,'command',p.cmd,'using',p.qual,'check',p.with_check) ORDER BY p.policyname),'[]'::jsonb) FROM pg_policies p WHERE p.schemaname=n.nspname AND p.tablename=c.relname)
 ) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','node0','auth','private')),
 'functions',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'returns',pg_get_function_result(p.oid),'definer',p.prosecdef) ORDER BY n.nspname,p.proname,p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','node0','auth','private')));`);
if(data.database!==database||data.migrations!==76||!Array.isArray(data.tables))throw Error('node0_catalogue_target_failed');
process.stdout.write(JSON.stringify({schema:'sdp.node0.ah10.catalogue.v1',checkedAt:new Date().toISOString(),userRowsRead:0,...data})+'\n');
