-- R32.10 · aplicació humana després d'exportar r32_7_fossils_sonda.sql.
-- Requerix les 7 signatures exactes i la postimatge verificada de 20261116170000.
-- No canvia cossos, propietaris, OIDs, paths ni disparadors. Cap concessió nova.
-- authenticated/anon/PUBLIC: zero EXECUTE. Quatre triggers: tampoc service_role.
-- Tres helpers: conserva només l'EXECUTE de service_role si JA existia.
-- Cron i consumidors remots han de revisar-se abans d'aplicar: poden perdre accés
-- si estaven usant authenticated. L'antic rollback R32 s'atura amb deriva d'ACL.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732000000);
create table if not exists private.r3210_fossils_acl_backup (
 signature text primary key, function_oid oid not null, owner_oid oid not null,
 definition_hash text not null, before_acl text, after_acl text not null,
 captured_at timestamptz not null default now()
);
alter table private.r3210_fossils_acl_backup enable row level security;
revoke all on private.r3210_fossils_acl_backup from public,anon,authenticated,service_role;
do $r3210_acl$
declare v record; p record; old private.r32_fossils_backup%rowtype;
 saved private.r3210_fossils_acl_backup%rowtype; v_oid oid; v_hash text; v_before text;
begin
 for v in select * from (values
  ('public.check_market_rate_limit()',true),
  ('public.clean_expired_push_subscriptions()',false),
  ('public.log_push_notification(uuid,text,jsonb,boolean,text)',false),
  ('public.mark_messages_as_read(uuid,uuid)',false),
  ('public.omega_invalidate_stale_translations()',true),
  ('public.omega_set_default_parent_id()',true),
  ('public.refresh_entity_member_map()',true)
 ) as wanted(signature,is_trigger) loop
  v_oid:=pg_catalog.to_regprocedure(v.signature);
  select * into p from pg_catalog.pg_proc where oid=v_oid;
  select * into old from private.r32_fossils_backup where signature=v.signature;
  if v_oid is null or old.signature is null or old.function_oid is distinct from v_oid or old.owner_oid is distinct from p.proowner
    or not p.prosecdef or p.prokind<>'f' or (v.is_trigger and p.prorettype<>'pg_catalog.trigger'::regtype)
    or not coalesce(p.proconfig @> array['search_path=""']::text[],false) then
   raise exception 'SDP-R3210-ACL-001: identitat/backup/path no revisats %',v.signature using errcode='55000';
  end if;
  v_hash:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(v_oid),'UTF8')),'hex');
  if v_hash is distinct from old.after_definition_hash
    or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') is distinct from old.after_hash then
   raise exception 'SDP-R3210-ACL-002: DDL divergent %',v.signature using errcode='55000';
  end if;
  select * into saved from private.r3210_fossils_acl_backup where signature=v.signature;
  if found then
   if saved.function_oid is distinct from v_oid or saved.owner_oid is distinct from p.proowner or saved.definition_hash is distinct from v_hash or saved.after_acl is distinct from p.proacl::text then
    raise exception 'SDP-R3210-ACL-003: deriva posterior %',v.signature using errcode='55000';
   end if;
  else
  if p.proacl::text is distinct from old.acl_text or exists(
    select 1 from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
    where a.grantee<>p.proowner and (a.is_grantable or (a.grantee<>0 and a.grantee not in(
      select oid from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role'))))) then
   raise exception 'SDP-R3210-ACL-004: ACL inicial no revisada %',v.signature using errcode='55000';
  end if;
  v_before:=p.proacl::text;
  execute pg_catalog.format('revoke all on function %s from public,anon,authenticated',v_oid::regprocedure);
  if v.is_trigger then
   execute pg_catalog.format('revoke all on function %s from service_role',v_oid::regprocedure);
  end if;
  insert into private.r3210_fossils_acl_backup(signature,function_oid,owner_oid,definition_hash,before_acl,after_acl)
   select v.signature,v_oid,p.proowner,v_hash,v_before,proacl::text from pg_catalog.pg_proc where oid=v_oid;
  end if;
  -- ACLs efectives, inclosa herència de rols: REVOKE directe no la retira.
  if pg_catalog.has_function_privilege('anon',v_oid,'EXECUTE') is distinct from false
    or pg_catalog.has_function_privilege('authenticated',v_oid,'EXECUTE') is distinct from false
    or (v.is_trigger and pg_catalog.has_function_privilege('service_role',v_oid,'EXECUTE') is distinct from false) then
   raise exception 'SDP-R3210-ACL-005: EXECUTE heretat encara actiu %',v.signature using errcode='55000';
  end if;
 end loop;
end $r3210_acl$;
notify pgrst, 'reload schema';
commit;
