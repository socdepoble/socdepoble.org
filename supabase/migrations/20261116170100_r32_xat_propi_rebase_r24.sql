-- R32 · Additive 2611121630 rebase onto R24: self schema and trigger invariants only.
-- Depends on: 20261114061000 (R24 return signature and shared human receipt helper).
-- DO NOT reapply 2611121630 on production after R24: its older RETURNS TABLE fails 42P13.
-- R21.9b participant/Beta checks, R24 canonical pair creator, channel key and receipt columns stay untouched.
-- No DROP FUNCTION/CASCADE, no data move/delete and no return-type change. Idempotent with live own threads.
-- Rollback: no destructive rollback of owned data; restore prior two private trigger function DDL from export,
-- or disable only these three triggers if required, retaining the column/index/rows. Never drop own threads.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
do $$
begin
  if pg_catalog.to_regprocedure('private.xat_cursors_altres(uuid,uuid)') is null
    or not coalesce((select array['canal_clau','rebut_pels_altres_fins_seq']::text[] <@ p.proargnames
      from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_fils_meus(uuid)')),false)
    or pg_catalog.to_regclass('public.xat_fils_parella_uq') is null
    or not coalesce((select position('propi_usuari_id' in p.prosrc)>0 and position('canal_clau' in p.prosrc)>0
      from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_participant_vigent(uuid,uuid)')),false)
    or not coalesce((select position('parella_menor' in p.prosrc)>0 and position('propi_usuari_id' in p.prosrc)>0
      from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.crea_fil_directe(uuid,uuid,text)')),false) then
    raise exception 'SDP-R32-XAT-001: R24 compatible schema/RPC chain required before additive self rebase' using errcode='55000';
  end if;
end $$;
alter table public.xat_fils add column if not exists propi_usuari_id uuid
  references auth.users(id) on delete cascade;
create unique index if not exists xat_fils_propi_usuari_uq
  on public.xat_fils(tenant_id,propi_usuari_id) where propi_usuari_id is not null;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.xat_fils'::regclass and conname='xat_fils_propi_forma') then
    alter table public.xat_fils add constraint xat_fils_propi_forma check(propi_usuari_id is null or
      (tipus='directe' and org_id is null and interlocutor_id is null
       and comunitat_id is null and subjecte_tipus is null and subjecte_id is null and subjecte_ruta is null
       and subjecte_titol is null and subjecte_uri is null));
  end if;
end $$;

-- IF NOT EXISTS checks names only. A homonymous non-unique index, weak CHECK
-- or a non-cascading owner FK must not be accepted as the self-thread schema.
-- Refuse drift instead of dropping/rebuilding unknown production objects.
do $r32_shape$
declare v_owner smallint; v_tenant smallint; v_user smallint;
begin
  select attnum into v_owner from pg_catalog.pg_attribute
    where attrelid='public.xat_fils'::regclass and attname='propi_usuari_id'
      and not attisdropped and atttypid='uuid'::regtype and not attnotnull;
  select attnum into v_tenant from pg_catalog.pg_attribute
    where attrelid='public.xat_fils'::regclass and attname='tenant_id' and not attisdropped;
  select attnum into v_user from pg_catalog.pg_attribute
    where attrelid='auth.users'::regclass and attname='id' and not attisdropped;
  if v_owner is null or v_tenant is null or v_user is null
    or not exists(select 1 from pg_catalog.pg_constraint c
      where c.conrelid='public.xat_fils'::regclass and c.contype='f' and c.convalidated
        and c.conkey=array[v_owner] and c.confrelid='auth.users'::regclass
        and c.confkey=array[v_user] and c.confdeltype='c')
    or not exists(select 1 from pg_catalog.pg_index i
      where i.indexrelid=pg_catalog.to_regclass('public.xat_fils_propi_usuari_uq')
        and i.indrelid='public.xat_fils'::regclass and i.indisunique and i.indisvalid and i.indisready
        and i.indnkeyatts=2 and i.indnatts=2 and i.indkey[0]=v_tenant and i.indkey[1]=v_owner
        and i.indexprs is null and pg_catalog.pg_get_expr(i.indpred,i.indrelid)='(propi_usuari_id IS NOT NULL)')
    or not exists(select 1 from pg_catalog.pg_constraint c
      where c.conrelid='public.xat_fils'::regclass and c.conname='xat_fils_propi_forma'
        and c.contype='c' and c.convalidated
        and pg_catalog.pg_get_constraintdef(c.oid) =
          'CHECK (((propi_usuari_id IS NULL) OR ((tipus = ''directe''::text) AND (org_id IS NULL) AND (interlocutor_id IS NULL) AND (comunitat_id IS NULL) AND (subjecte_tipus IS NULL) AND (subjecte_id IS NULL) AND (subjecte_ruta IS NULL) AND (subjecte_titol IS NULL) AND (subjecte_uri IS NULL))))') then
    raise exception 'SDP-R32-XAT-002: unknown self-thread column/index/check/FK shape; export and reconcile first' using errcode='55000';
  end if;
end $r32_shape$;

-- A deferred constraint checks the complete transaction: creation inserts
-- the thread then its owner. Cascading deletion is valid once no thread exists.
create or replace function private.xat_propi_integritat()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_owner uuid; v_creator uuid;
begin
  if tg_table_name='xat_fils' then
    if tg_op='UPDATE' and old.propi_usuari_id is not null and new.propi_usuari_id is distinct from old.propi_usuari_id then
      raise exception 'SDP-XAT-017: la propietat del fil propi és immutable.' using errcode='23514';
    end if;
    v_id:=case when tg_op='DELETE' then old.id else new.id end;
  else
    v_id:=case when tg_op='DELETE' then old.fil_id else new.fil_id end;
  end if;
  select f.propi_usuari_id,f.creat_per into v_owner,v_creator from public.xat_fils f where f.id=v_id;
  -- Existing account deletion first SET NULLs creat_per, then CASCADEs
  -- the owner FK. Validate creator equality at transaction end, after
  -- both actions: an absent thread is valid, an altered live owner is not.
  if v_owner is not null and v_creator is distinct from v_owner then
    raise exception 'SDP-XAT-017: la propietat del fil propi és immutable.' using errcode='23514';
  end if;
  if v_owner is not null and not (
    (select count(*) from public.xat_participants p where p.fil_id=v_id)=1
    and exists(select 1 from public.xat_participants p where p.fil_id=v_id and p.usuari_id=v_owner and p.com_org_id is null)
  ) then
    raise exception 'SDP-XAT-017: el fil propi només admet la persona propietària.' using errcode='23514';
  end if;
  -- UPDATE may move a participant away from a self thread. Fence both ends.
  if tg_table_name='xat_participants' then
    if tg_op='UPDATE' and old.fil_id is distinct from new.fil_id then
      select f.propi_usuari_id into v_owner from public.xat_fils f where f.id=old.fil_id;
      if v_owner is not null and not ((select count(*) from public.xat_participants p where p.fil_id=old.fil_id)=1
        and exists(select 1 from public.xat_participants p where p.fil_id=old.fil_id and p.usuari_id=v_owner and p.com_org_id is null)) then
        raise exception 'SDP-XAT-017: el fil propi només admet la persona propietària.' using errcode='23514';
      end if;
    end if;
  end if;
  return null;
end $$;
revoke all on function private.xat_propi_integritat() from public,anon,authenticated,service_role;
drop trigger if exists xat_propi_integritat_fil on public.xat_fils;
create constraint trigger xat_propi_integritat_fil after insert or update on public.xat_fils
  deferrable initially deferred for each row execute function private.xat_propi_integritat();
drop trigger if exists xat_propi_integritat_participant on public.xat_participants;
create constraint trigger xat_propi_integritat_participant after insert or update or delete on public.xat_participants
  deferrable initially deferred for each row execute function private.xat_propi_integritat();

-- A self message is already received/read by its sole author. Apply only
-- to marked self threads, including attachment/encrypted publication paths.
create or replace function private.xat_propi_missatge()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_owner uuid;
begin
  select f.propi_usuari_id into v_owner from public.xat_fils f where f.id=new.fil_id;
  if v_owner is not null then
    if new.usuari_id is distinct from v_owner or new.com_org_id is not null then
      raise exception 'SDP-XAT-017: el fil propi només admet la persona propietària.' using errcode='23514';
    end if;
    update public.xat_participants set llegit_fins_seq=greatest(llegit_fins_seq,new.seq),
      rebut_fins_seq=greatest(rebut_fins_seq,new.seq),no_llegit_manual=false
      where fil_id=new.fil_id and usuari_id=v_owner;
    insert into public.xat_lectures as l(fil_id,usuari_id,ultim_llegit_al) values(new.fil_id,v_owner,new.creat_al)
      on conflict(fil_id,usuari_id) do update set ultim_llegit_al=greatest(l.ultim_llegit_al,excluded.ultim_llegit_al);
  end if;
  return null;
end $$;
revoke all on function private.xat_propi_missatge() from public,anon,authenticated,service_role;
drop trigger if exists xat_propi_missatge on public.xat_missatges;
create trigger xat_propi_missatge after insert on public.xat_missatges
  for each row execute function private.xat_propi_missatge();


notify pgrst, 'reload schema';
commit;
