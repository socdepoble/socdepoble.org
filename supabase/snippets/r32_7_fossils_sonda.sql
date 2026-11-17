-- Read-only: exactly seven rows, including absent signatures. Export the whole result as JSON.
-- SHA256 is over prosrc; definition_sha256 covers pg_get_functiondef including options.
-- Catalog dependencies do NOT discover dynamic SQL/cron or external consumers: review those separately.
with wanted(signature) as (values
  ('public.check_market_rate_limit()'),
  ('public.clean_expired_push_subscriptions()'),
  ('public.log_push_notification(uuid,text,jsonb,boolean,text)'),
  ('public.mark_messages_as_read(uuid,uuid)'),
  ('public.omega_invalidate_stale_translations()'),
  ('public.omega_set_default_parent_id()'),
  ('public.refresh_entity_member_map()')
)
select w.signature, p.oid is not null as present,
  case when p.oid is not null then pg_catalog.pg_get_functiondef(p.oid) end as definition,
  pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') as source_sha256,
  case when p.oid is not null then pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex') end as definition_sha256,
  p.prosecdef, p.proconfig, pg_catalog.pg_get_userbyid(p.proowner) as owner, p.proacl::text as acl,
  coalesce((select jsonb_agg(jsonb_build_object('table',t.tgrelid::regclass::text,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_catalog.pg_get_triggerdef(t.oid,true)) order by t.oid)
    from pg_catalog.pg_trigger t where t.tgfoid=p.oid and not t.tgisinternal),'[]'::jsonb) as triggers,
  coalesce((select jsonb_agg(jsonb_build_object('type',d.deptype,'dependent',pg_catalog.pg_describe_object(d.classid,d.objid,d.objsubid)) order by d.classid,d.objid,d.objsubid)
    from pg_catalog.pg_depend d where d.refclassid='pg_catalog.pg_proc'::regclass and d.refobjid=p.oid),'[]'::jsonb) as catalog_dependents
from wanted w left join pg_catalog.pg_proc p on p.oid=pg_catalog.to_regprocedure(w.signature)
order by w.signature
limit 7;
