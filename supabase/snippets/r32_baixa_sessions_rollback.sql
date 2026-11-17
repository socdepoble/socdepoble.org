-- R32 T2 · Només retorna DDL/ACL/config conegudes. Conserva el backup i les dades.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_catalog.pg_advisory_xact_lock(1935960372,1732000200);
do $r32$
declare saved record; p record; v_def text;
begin
  if pg_catalog.to_regclass('private.r32_baixa_sessions_backup') is null then return; end if;
  for saved in select * from private.r32_baixa_sessions_backup order by signature loop
    select * into p from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure(saved.signature);
    if p.oid is null or p.oid<>saved.function_oid or p.proowner<>saved.owner_oid or p.proacl::text is distinct from saved.acl_text then
      raise exception 'SDP-R32-BAIXA-007: rollback rebutja deriva de propietari/ACL';
    end if;
    v_def:=pg_catalog.pg_get_functiondef(p.oid);
    if v_def=saved.before_definition then continue; end if;
    if pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_def,'UTF8')),'hex')<>saved.after_definition_hash then
      raise exception 'SDP-R32-BAIXA-008: rollback rebutja una definició nova';
    end if;
    execute saved.before_definition;
  end loop;
end $r32$;
notify pgrst,'reload schema';
commit;
