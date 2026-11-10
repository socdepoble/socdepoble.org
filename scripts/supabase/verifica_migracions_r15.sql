-- R15.2 · PREVOL DE NOMÉS LECTURA (Supabase SQL Editor / psql -X -v ON_ERROR_STOP=1).
-- Executar ABANS i DESPRÉS de 2611091500 + 2611080440; no aplica cap migració.
-- Un resultat valid=false és un veto. pending no acredita funcions desplegades.
-- La 2.6 requerix a més la porta de publicació, altes aturades i canvi coordinat
-- del client. Mentre 2611080440 siga pendent, el client ha de mostrar la 2.5.
-- Les proves seques executen els SQL canònics només en PostgreSQL WASM sintètic.
begin isolation level repeatable read read only;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
set local search_path = pg_catalog;

with
targets(signature) as (values
  ('public.admin_llista_sessions_dispositius(text,text)'),
  ('public.estat_curadoria_cultural()'),
  ('public.llista_aportacions_culturals()'),
  ('public.envia_aportacio_cultural(text,text,text,text,boolean)'),
  ('public.revisa_aportacio_cultural(uuid,text,text)')),
-- Empremtes derivades de pg_proc.prosrc després d'executar els SQL canònics
-- en PostgreSQL WASM (rebut sql-canonical-function-body-pins.json). També els
-- comentaris/espais diferents requerixen revisió: no s'inferix equivalència.
security_bodies(schema_name,function_name,argument_types,prosrc_sha256) as (values
  ('private','es_superadmin','{}'::text[],'e910f596eff42143a2937acb7e69011cbcfcd53905ed32f4a49ac659dae3f20a'),
  ('private','politiques_immutables','{}'::text[],'93588e7c1fba9673d7c9fc53afb3e8327626d3f96af1f5a465a52186ad683fc2'),
  ('private','pot_curar_cultura','{}'::text[],'cc85ba0c990bf5e0506ff412de21c55e8a0fbdc122743f73df6f706a5d96ba72'),
  ('private','aportacio_cultural_json',array['public.aportacions_culturals'],'4565bcfa686f97f8db85db915455f39aec45db58e426fc16de1704021c815575'),
  ('public','admin_llista_sessions_dispositius',array['text','text'],'0374fdccccf829846e31993f4ac67a19bfd903adb5419d47116294b61b747462'),
  ('public','estat_curadoria_cultural','{}'::text[],'6b848b79453007d489fbe689221b717870ba32cb21472ccb7c3bad6cb5838bca'),
  ('public','llista_aportacions_culturals','{}'::text[],'4c50465c3af344a1ae4943317e6261726673010620aa5dbe8e5363c1ea6e288f'),
  ('public','envia_aportacio_cultural',array['text','text','text','text','boolean'],'f2aafa5e78d36498a5a87b683cccf04228b2cc5784ae23d63e3e20093bb0f7b7'),
  ('public','revisa_aportacio_cultural',array['uuid','text','text'],'801cd3c124e8d907835946fb0eb51a52ef0bec514ca747054063e9b5f8e3ca52')),
-- to_regprocedure accepta un tipus compost absent només després que existisca.
objects as (
  select (select count(*) from targets where to_regprocedure(signature) is not null)
    + (case when to_regprocedure('private.pot_curar_cultura()') is not null then 1 else 0 end)
    + (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='private' and p.proname='aportacio_cultural_json')
    + (case when to_regclass('private.curadors_culturals') is not null then 1 else 0 end)
    + (case when to_regclass('public.aportacions_culturals') is not null then 1 else 0 end) as n
),
state as (select n, case when n=0 then 'pending' when n=9 then 'present' else 'partial' end as migration_2611091500 from objects),
checks(id,ok) as (
  select 'transaction_read_only',current_setting('transaction_read_only')='on'
  union all select 'dependency_auth_columns',
    (select count(*)=6 from information_schema.columns where table_schema='auth' and table_name='sessions'
      and column_name in ('id','user_id','user_agent','created_at','updated_at','refreshed_at'))
    and (select count(*)=3 from information_schema.columns where table_schema='auth' and table_name='users'
      and column_name in ('id','email','raw_user_meta_data'))
  union all select 'dependency_roles',
    (select count(*)=2 from pg_roles where rolname in ('anon','authenticated'))
  union all select 'dependency_superadmin_aal2',exists(
    select 1 from pg_proc where oid=to_regprocedure('private.es_superadmin()') and prosecdef
      and 'search_path=""'=any(proconfig)
      and prosrc like '%auth.jwt()%' and prosrc like '%''aal2''%' and prosrc like '%user_platform_roles%')
  union all select 'dependency_admin_summary',to_regprocedure('public.admin_resum_sessions_dispositius()') is not null
  union all select 'target_not_partial',(select n in (0,9) from state)
  union all select 'canonical_security_function_bodies',(
    select count(*)=(case when (select n from state)=0 then 2 else 9 end)
      and bool_and(encode(pg_catalog.sha256(convert_to(p.prosrc,'UTF8')),'hex')=expected.prosrc_sha256
        and coalesce('search_path=""'=any(p.proconfig),false))
    from security_bodies expected join pg_namespace ns on ns.nspname=expected.schema_name
    join pg_proc p on p.pronamespace=ns.oid and p.proname=expected.function_name
      and array(select actual.type_id from unnest(p.proargtypes) with ordinality actual(type_id,ord) order by actual.ord)
        =array(select to_regtype(arg.type_name)::oid from unnest(expected.argument_types) with ordinality arg(type_name,ord) order by arg.ord)
    where (select n from state)<>0 or expected.function_name in ('es_superadmin','politiques_immutables'))
  union all select 'rls_enabled', (select n=0 from state) or (
    select count(*)=2 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where ((n.nspname='public' and c.relname='aportacions_culturals')
      or (n.nspname='private' and c.relname='curadors_culturals')) and c.relrowsecurity)
  union all select 'rls_restrictive_deny_all', (select n=0 from state) or (
    select count(distinct polrelid)=2 from pg_policy
    where polrelid in (to_regclass('public.aportacions_culturals'),to_regclass('private.curadors_culturals'))
      and not polpermissive and polcmd='*' and polroles=array[0::oid]
      and pg_get_expr(polqual,polrelid)='false' and pg_get_expr(polwithcheck,polrelid)='false')
  union all select 'no_direct_table_grants', (select n=0 from state) or not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    left join pg_roles r on r.oid=a.grantee
    where ((n.nspname='public' and c.relname='aportacions_culturals')
      or (n.nspname='private' and c.relname='curadors_culturals'))
      and (a.grantee=0 or r.rolname in ('anon','authenticated')))
  union all select 'rpc_definer_and_empty_search_path', (select n=0 from state) or (
    select count(*)=5 from targets t join pg_proc p on p.oid=to_regprocedure(t.signature)
    where p.prosecdef and 'search_path=""'=any(p.proconfig))
  union all select 'rpc_authenticated_only', (select n=0 from state) or (
    select count(*)=5 from targets t join pg_proc p on p.oid=to_regprocedure(t.signature)
    where has_function_privilege('authenticated',p.oid,'EXECUTE')
      and not has_function_privilege('anon',p.oid,'EXECUTE')
      and not exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0))
  union all select 'private_rpc_not_callable', (select n=0 from state) or (
    select count(*)=2 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname in ('pot_curar_cultura','aportacio_cultural_json')
      and not has_function_privilege('authenticated',p.oid,'EXECUTE')
      and not has_function_privilege('anon',p.oid,'EXECUTE')
      and not exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0))
  union all select 'curator_aal2_guard', (select n=0 from state) or exists(
    select 1 from pg_proc where oid=to_regprocedure('private.pot_curar_cultura()')
      and prosecdef and 'search_path=""'=any(proconfig) and prosrc like '%auth.jwt()%' and prosrc like '%''aal2''%'
      and prosrc like '%auth.uid()%' and prosrc like '%private.curadors_culturals%' and prosrc like '%private.es_superadmin()%')
  union all select 'admin_detail_guard_and_limit', (select n=0 from state) or exists(
    select 1 from pg_proc where oid=to_regprocedure('public.admin_llista_sessions_dispositius(text,text)')
      and prosrc like '%private.es_superadmin()%' and prosrc like '%limit 200%' and prosrc like '%14 days%'
      and prosrc like '%length(p_cerca) > 120%')
  union all select 'contribution_owner_from_session', (select n=0 from state) or exists(
    select 1 from pg_proc where oid=to_regprocedure('public.envia_aportacio_cultural(text,text,text,text,boolean)')
      and prosrc like '%auth.uid()%' and prosrc like '%42501%')
  union all select 'contribution_user_date_index', (select n=0 from state) or exists(
    select 1 from pg_index i join pg_class c on c.oid=i.indexrelid
    where i.indrelid=to_regclass('public.aportacions_culturals') and c.relname='aportacions_culturals_usuari_data'
      and i.indisvalid and i.indisready and not i.indisunique
      and i.indpred is null and i.indexprs is null and i.indnkeyatts=2 and i.indnatts=2
      and (select amname from pg_am where oid=c.relam)='btree'
      and pg_get_indexdef(i.indexrelid,1,false)='usuari_id'
      and pg_get_indexdef(i.indexrelid,2,false)='creat_a' and i.indoption::text='0 3'
      and pg_get_indexdef(i.indexrelid)='CREATE INDEX aportacions_culturals_usuari_data ON public.aportacions_culturals USING btree (usuari_id, creat_a DESC)')
  union all select 'curators_primary_key', (select n=0 from state) or exists(
    select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.conrelid=to_regclass('private.curadors_culturals') and c.contype='p' and array_length(c.conkey,1)=1 and a.attname='usuari_id')
  union all select 'privacy_rls_enabled',exists(select 1 from pg_class where oid=to_regclass('public.politiques_privacitat') and relrowsecurity)
  union all select 'privacy_append_only_trigger',exists(
    select 1 from pg_trigger t join pg_proc p on p.oid=t.tgfoid
    where t.tgrelid=to_regclass('public.politiques_privacitat') and t.tgname='trg_politiques_immutables'
      and t.tgenabled in ('O','A') and t.tgtype::integer=27
      and not t.tgisinternal and t.tgqual is null and t.tgattr::text='' and t.tgnargs=0
      and p.oid=to_regprocedure('private.politiques_immutables()')
      and p.prorettype='trigger'::regtype and p.prosecdef and 'search_path=""'=any(p.proconfig))
  union all select 'privacy_primary_key',exists(
    select 1 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=any(c.conkey)
    where c.conrelid=to_regclass('public.politiques_privacitat') and c.contype='p' and array_length(c.conkey,1)=1 and a.attname='versio')
  union all select 'privacy_no_client_mutation',not exists(
    select 1 from pg_class c cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
    left join pg_roles r on r.oid=a.grantee
    where c.oid=to_regclass('public.politiques_privacitat') and (a.grantee=0 or r.rolname in ('anon','authenticated'))
      and a.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER'))
)
select jsonb_build_object(
  'schema','sdp.migrations.r15.readonly-preflight.v1','observedAt',now(),
  'databaseVersion',current_setting('server_version'),'transactionReadOnly',current_setting('transaction_read_only')='on',
  'migration2611091500',(select migration_2611091500 from state),
  'valid',coalesce((select bool_and(coalesce(ok,false)) from checks),false),
  'checks',(select jsonb_agg(jsonb_build_object('id',id,'ok',coalesce(ok,false)) order by id) from checks),
  'privacyNextStep','Comprovar les files 2.5/2.6 i el text amb la consulta següent. pending no autoritza activar cap bandera.',
  'remoteMigrationsApplied',false,'serviceActivationAccredited',false
) as verificacio_r15;

-- Consulta separada: si falta la taula de polítiques, l'error és un veto explícit.
select jsonb_build_object(
  'schema','sdp.migrations.r15.privacy-preflight.v1',
  'valid',exists(select 1 from public.politiques_privacitat where versio='2.5'
      and url='/legal' and text_sha256='ea13f0c4ca8f69ebf8c29035d6f7804d401d48dbdc6e3b5d5fb2b1b975fc1fc7'
      and vigent_des_de=timestamptz '2026-11-06 00:00:00+01'
      and encode(sha256(convert_to(text_complet,'UTF8')),'hex')=text_sha256)
    and not exists(select 1 from public.politiques_privacitat where versio='2.6' and (
      url is distinct from '/legal' or text_sha256 is distinct from 'ae73f12713ba2d7e86cc3610ae828cb231edb89a98749c27df9fddb177be5ab0'
      or text_complet is null or encode(sha256(convert_to(text_complet,'UTF8')),'hex') is distinct from text_sha256
      or vigent_des_de is distinct from timestamptz '2026-11-08 00:00:00+01')),
  'migration2611080440',case when exists(select 1 from public.politiques_privacitat where versio='2.6') then 'present' else 'pending' end,
  'clientRequiredWhilePending','2.5',
  'publicationGateAlsoRequired',true,
  'remoteMigrationsApplied',false
) as verificacio_privadesa_r15;
rollback;
