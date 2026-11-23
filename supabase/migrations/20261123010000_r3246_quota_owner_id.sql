-- R32.46 C3-F01 · Atribució de quota dels objectes sense reserva.
-- Depén de: 2610220240.
-- owner_id UUID canònic té prioritat; owner antic i UUID-zero són reserves.
-- Conserva OID, owner, ACL, configuració, límits i confirmació de purga.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $r3246_owner_id$
declare
  v_oid oid := pg_catalog.to_regprocedure('private.xat_neteja_adjunts(integer)');
  v_definition text;
  v_hash text;
  v_old constant text := $old$coalesce(o.owner, '00000000-0000-0000-0000-000000000000'::uuid)$old$;
  v_new constant text := $new$coalesce(case when o.owner_id ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$' then o.owner_id::uuid end, o.owner, '00000000-0000-0000-0000-000000000000'::uuid)$new$;
begin
  select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex'),
    pg_catalog.pg_get_functiondef(p.oid)
  into v_hash,v_definition
  from pg_catalog.pg_proc p where p.oid=v_oid and p.prosecdef
    and coalesce(p.proconfig @> array['search_path=""']::text[],false);
  if v_hash='15ac8adb219dae3e66ba9b2affdbf48429ee66f07ab6b3e704e9fa976de6c414' then
    return;
  end if;
  if v_hash is distinct from 'ef3f83b7db7f5ca8ad566204046743718d58301f7026f929a39c548d349f97b8'
    or pg_catalog.array_length(pg_catalog.string_to_array(v_definition,v_old),1)<>2 then
    raise exception 'SDP-R3246-001: definició de neteja absent o divergent.' using errcode='55000';
  end if;
  execute pg_catalog.replace(v_definition,v_old,v_new);
end;
$r3246_owner_id$;
commit;
