-- R32.10 · reparació manual idempotent de SQL-R29-06, sense migració nova.
-- Mateixa frontera: taules de reconciliació només internes, cap política API.
-- No FORCE RLS: el propietari i les RPC SECURITY DEFINER mantenen el seu ús.
-- Absències o polítiques/grants desconeguts avorten abans de modificar res.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732100000);
do $r3210_rls$
declare t record; c record; v_oid oid; v_role text;
begin
  for t in select * from (values
    ('private.xat_fils_fusionats'), ('private.xat_fusions_pendents')
  ) as wanted(relation) loop
    v_oid := pg_catalog.to_regclass(t.relation);
    if v_oid is null or not exists(select 1 from pg_catalog.pg_class where oid=v_oid and relkind='r') then
      raise exception 'SDP-R3210-RLS-001: falta taula interna %',t.relation using errcode='55000';
    end if;
    if exists(select 1 from pg_catalog.pg_policy where polrelid=v_oid) then
      raise exception 'SDP-R3210-RLS-002: política no revisada %',t.relation using errcode='55000';
    end if;
    if exists(select 1 from pg_catalog.pg_class x cross join lateral pg_catalog.aclexplode(x.relacl) a
      where x.oid=v_oid and a.grantee<>x.relowner and a.grantee<>0
        and a.grantee not in (select oid from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role')))
      or exists(select 1 from pg_catalog.pg_attribute x cross join lateral pg_catalog.aclexplode(x.attacl) a
        join pg_catalog.pg_class rel on rel.oid=x.attrelid
        where x.attrelid=v_oid and a.grantee<>rel.relowner and a.grantee<>0
          and a.grantee not in (select oid from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role'))) then
      raise exception 'SDP-R3210-RLS-003: ACL desconeguda %',t.relation using errcode='55000';
    end if;
  end loop;
  alter table private.xat_fils_fusionats enable row level security;
  alter table private.xat_fusions_pendents enable row level security;
  revoke all on private.xat_fils_fusionats,private.xat_fusions_pendents from public,anon,authenticated,service_role;
  -- REVOKE ON TABLE no retira concessions individuals de columna.
  for c in select attrelid,attname from pg_catalog.pg_attribute
    where attrelid in ('private.xat_fils_fusionats'::regclass,'private.xat_fusions_pendents'::regclass)
      and attnum>0 and not attisdropped and attacl is not null loop
    execute pg_catalog.format('revoke all (%I) on table %s from public,anon,authenticated,service_role',c.attname,c.attrelid::regclass);
  end loop;
  foreach v_role in array array['anon','authenticated','service_role'] loop
    for t in select * from (values('private.xat_fils_fusionats'),('private.xat_fusions_pendents')) as wanted(relation) loop
      if pg_catalog.has_table_privilege(v_role,t.relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or pg_catalog.has_any_column_privilege(v_role,t.relation,'SELECT,INSERT,UPDATE,REFERENCES') then
        raise exception 'SDP-R3210-RLS-004: privilegi heretat encara actiu % %',v_role,t.relation using errcode='55000';
      end if;
    end loop;
  end loop;
end $r3210_rls$;
commit;
