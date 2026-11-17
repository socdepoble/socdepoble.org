-- R32 T2 · Baixa/reversió serialitzades; auth.sessions deixa de ser «millor esforç».
-- Preimatges: demana2609291200 + cancela2611110100 (guarda purga iniciada), search_path buit. La deriva remota
-- rebutja tot el lot: exporteu primer pg_get_functiondef de les dues signatures.
-- Cap dada de compte s'esborra en instal·lar-ho. Backup íntegre privat i rollback
-- a supabase/snippets/r32_baixa_sessions_rollback.sql. Producció NO certificada.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732000200);
create table if not exists private.r32_baixa_sessions_backup (
  signature text primary key,
  function_oid oid not null,
  owner_oid oid not null,
  acl_text text,
  before_definition text not null,
  after_definition_hash text not null,
  backed_up_at timestamptz not null default now()
);
alter table private.r32_baixa_sessions_backup enable row level security;
revoke all on private.r32_baixa_sessions_backup from public, anon, authenticated, service_role;
do $r32$
declare
  v record; p record; saved private.r32_baixa_sessions_backup%rowtype;
  v_oid oid; v_def text; v_new text;
  v_first text := '  select * into v_baixa from private.baixes b where b.user_id = v_uid;';
  v_cancel text := '  select * into v_b from private.baixes b where b.user_id = v_uid for update;';
  v_lock text := E'  -- R32: el mateix pany per demanar, repetir o cancel·lar la baixa.\n  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(''sdp-baixa''), pg_catalog.hashtext(v_uid::text));\n';
  v_old text := E'  -- Tancament de sessions (millor esforç; el client fa a més logout global).\n  begin\n    delete from auth.sessions where user_id = v_uid;\n  exception when insufficient_privilege or undefined_table then\n    null;\n  end;';
begin
  if pg_catalog.to_regclass('auth.sessions') is null then
    raise exception 'SDP-R32-BAIXA-001: auth.sessions absent; no es pot garantir una baixa atòmica' using errcode='55000';
  end if;
  for v in select * from (values
    ('public.demana_baixa(text)', 'b093299349ba67c21a37d5717259cadd6f1b5b32ee4494c79d761737aba752c3'),
    ('public.cancela_baixa()', '4ca2c12821b081fd12a86e152bde81e5e3fc0a131e718cd64a4274263d798fb6')
  ) spec(signature, expected_hash) loop
    v_oid := pg_catalog.to_regprocedure(v.signature);
    if v_oid is null then raise exception 'SDP-R32-BAIXA-002: funció absent %', v.signature using errcode='55000'; end if;
    select * into p from pg_catalog.pg_proc where oid=v_oid;
    v_def := pg_catalog.pg_get_functiondef(v_oid);
    select * into saved from private.r32_baixa_sessions_backup where signature=v.signature;
    if found then
      if saved.function_oid<>v_oid or saved.owner_oid<>p.proowner or saved.acl_text is distinct from p.proacl::text then
        raise exception 'SDP-R32-BAIXA-003: deriva d’identitat/propietari/ACL %', v.signature using errcode='55000';
      end if;
      if pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_def,'UTF8')),'hex')=saved.after_definition_hash then continue; end if;
      if v_def is distinct from saved.before_definition then raise exception 'SDP-R32-BAIXA-004: deriva després del backup %', v.signature using errcode='55000'; end if;
    end if;
    if not p.prosecdef or p.prokind<>'f'
      or p.prolang<>(select oid from pg_catalog.pg_language where lanname='plpgsql')
      or p.proconfig is distinct from array['search_path=""']::text[]
      or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')<>v.expected_hash then
      raise exception 'SDP-R32-BAIXA-005: font/configuració no revisada %; exporteu la definició',v.signature using errcode='55000';
    end if;
    if v.signature='public.demana_baixa(text)' then
      if position(v_first in v_def)=0 or position(v_old in v_def)=0 then raise exception 'SDP-R32-BAIXA-006: bloc absent'; end if;
      v_new := replace(v_def,v_first,v_lock||v_first);
      -- Una baixa ja demanada també revoca una sessió acabada d'obrir.
      v_new := replace(v_new,E'  if found then\n    return jsonb_build_object(''demanada_al''',E'  if found then\n    delete from auth.sessions where user_id = v_uid;\n    return jsonb_build_object(''demanada_al''');
      v_new := replace(v_new,v_old,E'  -- R32: qualsevol fallada revoca tota la transacció de baixa.\n  delete from auth.sessions where user_id = v_uid;');
    else
      if position(v_cancel in v_def)=0 then raise exception 'SDP-R32-BAIXA-006: bloc absent'; end if;
      v_new := replace(v_def,v_cancel,v_lock||v_cancel);
    end if;
    execute v_new;
    insert into private.r32_baixa_sessions_backup(signature,function_oid,owner_oid,acl_text,before_definition,after_definition_hash)
    values(v.signature,v_oid,p.proowner,p.proacl::text,v_def,
      pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(v_oid),'UTF8')),'hex'))
    on conflict(signature) do nothing;
  end loop;
end $r32$;
notify pgrst, 'reload schema';
commit;
