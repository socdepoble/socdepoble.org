-- R21.6: operator-only metadata audit. No row payload, identities or secrets.
-- psql service=sdp_audit -X -v ON_ERROR_STOP=1 -f this-file.sql
begin read only;
set local statement_timeout = '30s';
set local lock_timeout = '3s';

select current_setting('server_version') as server_version,
       current_setting('transaction_read_only') as transaction_read_only,
       current_database() as database_name;

-- Actual keys, shapes and fingerprints, never their content.
select key, count(*) as tenant_rows,
       array_agg(distinct jsonb_typeof(payload)) as payload_shapes,
       min(version) as minimum_version, max(version) as maximum_version,
       sum(case when jsonb_typeof(payload) = 'array' then jsonb_array_length(payload) else 0 end) as array_items,
       encode(sha256(convert_to(string_agg(tenant_id::text || ':' || payload::text, E'\n' order by tenant_id), 'UTF8')), 'hex') as payload_sha256
from public.app_content group by key order by key;

select n.nspname as schema_name, c.relname, c.relkind, c.relrowsecurity,
       has_table_privilege('anon',c.oid,'select') as anon_table_select,
       has_table_privilege('authenticated',c.oid,'select') as authenticated_table_select,
       has_any_column_privilege('anon',c.oid,'select') as anon_any_column_select
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p','v','m') order by c.relname;

-- Hash definitions, rather than printing bodies that might contain settings.
select p.oid::regprocedure::text as signature,
       pg_get_function_result(p.oid) as result_type,
       p.provolatile, p.prosecdef,
       has_function_privilege('anon',p.oid,'execute') as anon_execute,
       has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute,
       encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') as definition_sha256
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind in ('f','p') order by signature;

-- Policy names/roles and definition fingerprints; no literal expressions.
select schemaname,tablename,policyname,permissive,roles,cmd,
       encode(sha256(convert_to(coalesce(qual,'') || E'\n' || coalesce(with_check,''),'UTF8')),'hex') as policy_sha256
from pg_policies where schemaname='public' order by tablename,policyname;

-- Supabase metadata is optional in a local fixture. Never infer that an
-- absent/unreadable history means migrations have or have not been applied.
do $audit$
declare history jsonb;
begin
  if to_regclass('supabase_migrations.schema_migrations') is null then
    raise notice 'R21.6_MIGRATION_HISTORY_UNKNOWN: metadata table absent';
  elsif not has_table_privilege(current_user,'supabase_migrations.schema_migrations','select') then
    raise notice 'R21.6_MIGRATION_HISTORY_UNKNOWN: metadata SELECT unavailable';
  else
    execute 'select coalesce(jsonb_agg(version order by version),''[]''::jsonb) from supabase_migrations.schema_migrations' into history;
    raise notice 'R21.6_MIGRATION_VERSIONS: %',history;
  end if;
exception when insufficient_privilege then
  raise notice 'R21.6_MIGRATION_HISTORY_UNKNOWN: metadata schema access unavailable';
end $audit$;
commit;
