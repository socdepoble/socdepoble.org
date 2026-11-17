-- R32 · Seven inherited SECURITY DEFINERs: qualify reviewed relations before empty search_path.
-- Production application is NOT certified. Export snippets/r32_7_fossils_sonda.sql first.
-- Source pins are SHA-256(prosrc) of literal R22.2 fixtures (13-11), NOT guessed remote DDL.
-- Unknown source/config drift aborts the entire transaction; absent fossils stay absent.
-- No function, trigger, row, ACL or ownership is deleted. Rollback uses the private full DDL backup.
-- Depends on: 20261114000100 (private schema and inherited-function revocation).
-- Rollback: snippets/r32_7_fossils_rollback.sql; never use DROP ... CASCADE.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732000000);
create table if not exists private.r32_fossils_backup (
  signature text primary key,
  function_oid oid not null,
  before_definition text not null,
  before_hash text not null,
  after_hash text not null,
  after_definition_hash text not null,
  owner_oid oid not null,
  acl_text text,
  triggers jsonb not null,
  backed_up_at timestamptz not null default now()
);
alter table private.r32_fossils_backup enable row level security;
revoke all on private.r32_fossils_backup from public, anon, authenticated, service_role;
do $r32$
declare
  v record; p record; saved private.r32_fossils_backup%rowtype;
  v_oid oid; v_hash text; v_def text; v_after text;
begin
  for v in select * from (values
    ('public.check_market_rate_limit()','599a9cefe39382799067d74dbcbb6d0c4cf661f790cc832f2b0dc3782881422d','FROM market_items','FROM public.market_items'),
    ('public.clean_expired_push_subscriptions()','f0e399b16193a92ecb0043e343c42fab95eabe09fd83ed86f68b3335258d23b3','DELETE FROM push_subscriptions','DELETE FROM public.push_subscriptions'),
    ('public.log_push_notification(uuid,text,jsonb,boolean,text)','45c55022e0c99cfab714b5d08015a4a792413296302c7e7239f4c9f5dc33f276','INSERT INTO push_notifications_log','INSERT INTO public.push_notifications_log'),
    ('public.mark_messages_as_read(uuid,uuid)','4dc78e7017bbd0b445794728e9bda4dd1ec761c4c24c90797d838aa9b219a467','UPDATE messages','UPDATE public.messages'),
    ('public.omega_invalidate_stale_translations()','e5b0539b43ebc815188c0f6cc31df31992fe3477cfc8238e2496d9a12c7f1988','',''),
    ('public.omega_set_default_parent_id()','90109206137887a8ef4c89ff7c5951c5750e9a97151fd683bd4cf2fa9874b61b','',''),
    ('public.refresh_entity_member_map()','c89e84967c7f53cfab90b1ea21863d8d85a6d78d877f1ff412d912e9353bb4ba','CONCURRENTLY entity_member_map','CONCURRENTLY public.entity_member_map')
  ) as spec(signature, expected_hash, old_relation, new_relation) loop
    v_oid := pg_catalog.to_regprocedure(v.signature);
    if v_oid is null then continue; end if;
    select * into p from pg_catalog.pg_proc where oid = v_oid;
    if not p.prosecdef or p.prokind <> 'f' then
      raise exception 'SDP-R32-FOSSIL-001: unexpected kind/security for %', v.signature using errcode = '55000';
    end if;
    v_hash := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc, 'UTF8')), 'hex');
    v_def := pg_catalog.pg_get_functiondef(v_oid);
    select * into saved from private.r32_fossils_backup where signature = v.signature;
    if found then
      if saved.function_oid <> v_oid or saved.owner_oid <> p.proowner or saved.acl_text is distinct from p.proacl::text then
        raise exception 'SDP-R32-FOSSIL-002: ownership/identity/ACL drift for %', v.signature using errcode = '55000';
      end if;
      if v_hash = saved.after_hash and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_def,'UTF8')),'hex') = saved.after_definition_hash then
        continue;
      end if;
      if v_def is distinct from saved.before_definition then
        raise exception 'SDP-R32-FOSSIL-003: previously backed-up function drifted: %', v.signature using errcode = '55000';
      end if;
    end if;
    if v_hash <> v.expected_hash then
      raise exception 'SDP-R32-FOSSIL-004: unknown source for %, export and review first', v.signature using errcode = '55000';
    end if;
    if p.proconfig is distinct from (case when v.signature in ('public.omega_invalidate_stale_translations()', 'public.omega_set_default_parent_id()') then null::text[] else array['search_path=public']::text[] end)
      or p.prolang <> (select oid from pg_catalog.pg_language where lanname='plpgsql') then
      raise exception 'SDP-R32-FOSSIL-008: unknown initial language/config: %', v.signature using errcode='55000';
    end if;
    -- Replace only one reviewed relation token in hash-pinned DDL. Other function options survive.
    if v.old_relation <> '' then
      if position(v.old_relation in v_def) = 0 then
        raise exception 'SDP-R32-FOSSIL-005: expected relation absent: %', v.signature using errcode = '55000';
      end if;
      execute replace(v_def, v.old_relation, v.new_relation);
    end if;
    -- Identitats literals qualificades: el tractor pot acreditar que estes
    -- branques només endurixen search_path. Si la funció no existia, el
    -- continue anterior evita executar-les. No es crea cap rutina absent.
    case v.signature
      when 'public.check_market_rate_limit()' then
        alter function public.check_market_rate_limit() set search_path = '';
      when 'public.clean_expired_push_subscriptions()' then
        alter function public.clean_expired_push_subscriptions() set search_path = '';
      when 'public.log_push_notification(uuid,text,jsonb,boolean,text)' then
        alter function public.log_push_notification(pg_catalog.uuid,pg_catalog.text,pg_catalog.jsonb,pg_catalog.bool,pg_catalog.text) set search_path = '';
      when 'public.mark_messages_as_read(uuid,uuid)' then
        alter function public.mark_messages_as_read(pg_catalog.uuid,pg_catalog.uuid) set search_path = '';
      when 'public.omega_invalidate_stale_translations()' then
        alter function public.omega_invalidate_stale_translations() set search_path = '';
      when 'public.omega_set_default_parent_id()' then
        alter function public.omega_set_default_parent_id() set search_path = '';
      when 'public.refresh_entity_member_map()' then
        alter function public.refresh_entity_member_map() set search_path = '';
      else
        raise exception 'SDP-R32-FOSSIL-009: unreviewed literal identity' using errcode = '55000';
    end case;
    select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex')
      into v_after from pg_catalog.pg_proc where oid = v_oid;
    insert into private.r32_fossils_backup(signature,function_oid,before_definition,before_hash,after_hash,after_definition_hash,owner_oid,acl_text,triggers)
    values(v.signature,v_oid,v_def,v_hash,v_after,
      pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(v_oid),'UTF8')),'hex'),p.proowner,p.proacl::text,
      coalesce((select jsonb_agg(jsonb_build_object('table',t.tgrelid::regclass::text,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_catalog.pg_get_triggerdef(t.oid,true)) order by t.oid)
        from pg_catalog.pg_trigger t where t.tgfoid=v_oid and not t.tgisinternal),'[]'::jsonb))
    on conflict(signature) do nothing;
  end loop;
end $r32$;
notify pgrst, 'reload schema';
commit;
