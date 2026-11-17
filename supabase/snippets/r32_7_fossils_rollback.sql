-- R32 rollback: preserve backup, identities, ownership, ACL and triggers. No DROP or CASCADE.
-- Execute only after exporting private.r32_fossils_backup. Unknown changes abort atomically.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732000000);
do $r32$
declare saved private.r32_fossils_backup%rowtype; p record; v_oid oid; v_def text;
begin
  for saved in select * from private.r32_fossils_backup order by signature loop
    v_oid := pg_catalog.to_regprocedure(saved.signature);
    select * into p from pg_catalog.pg_proc where oid = v_oid;
    if v_oid is null or saved.function_oid <> v_oid or saved.owner_oid <> p.proowner or saved.acl_text is distinct from p.proacl::text then
      raise exception 'SDP-R32-FOSSIL-006: rollback identity/ACL drift: %',saved.signature using errcode='55000';
    end if;
    v_def := pg_catalog.pg_get_functiondef(v_oid);
    if v_def = saved.before_definition then continue; end if;
    if pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_def,'UTF8')),'hex') <> saved.after_definition_hash then
      raise exception 'SDP-R32-FOSSIL-007: rollback source/config drift: %',saved.signature using errcode='55000';
    end if;
    execute saved.before_definition;
  end loop;
end $r32$;
notify pgrst, 'reload schema';
commit;
