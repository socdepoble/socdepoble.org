-- R21.4 · Fil propi (Tu). Additive, transactional and idempotent.
-- Requires the current chat schema through 2611080432. No IAIA dependency.
-- Normal direct/entity consent semantics stay identical to 2610081543;
-- the listing retains the 2610311800 return shape and E2EE metadata.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';

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

create or replace function private.xat_participant_vigent(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.xat_participants p
    join public.xat_fils f on f.id = p.fil_id
    where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
      and (f.propi_usuari_id is null or (f.propi_usuari_id=p_usuari_id
        and exists(select 1 from public.profiles pr where pr.id=p_usuari_id and pr.baixa_demanada_at is null)
        and not exists(select 1 from private.baixes bx where bx.user_id=p_usuari_id)))
      and (f.interlocutor_id is null or f.org_id is not null)
      and (
        (p.com_org_id is null
          and (f.interlocutor_id is null or f.interlocutor_id = p_usuari_id)
          and exists (select 1 from public.town_memberships tm
            where tm.town_id = f.tenant_id and tm.user_id = p_usuari_id))
        or (p.com_org_id = f.org_id and exists (
          select 1 from public.organization_memberships om
          where om.organization_id = f.org_id and om.tenant_id = f.tenant_id
            and om.user_id = p_usuari_id and om.role in ('owner', 'admin')))
      )
      and (f.subjecte_tipus is null or f.subjecte_tipus not in ('entitat', 'grup')
        or exists (select 1 from public.organizations so
          where so.id = (case when f.subjecte_tipus in ('entitat', 'grup') then f.subjecte_id::uuid end)
            and (so.visibility = 'public' or exists (select 1 from public.organization_memberships sm
              where sm.organization_id = so.id and sm.user_id = p_usuari_id))))
  );
$$;

create or replace function public.crea_fil_directe(p_tenant_id uuid, p_altre_usuari uuid, p_titol text default null)
returns uuid language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
  v_fil uuid;
  v_org uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_altre_usuari is null then
    raise exception 'SDP-XAT-002: cal un interlocutor.' using errcode = '22023';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  if p_altre_usuari = v_jo then
    -- Self is private storage, not directory publication: no consent for
    -- another recipient is requested or bypassed. Pending deletion is denied.
    if not exists (select 1 from public.profiles pr where pr.id=v_jo and pr.baixa_demanada_at is null)
      or exists (select 1 from private.baixes b where b.user_id=v_jo) then
      raise exception 'SDP-XAT-004: l''interlocutor no és disponible en aquest poble.' using errcode='42501';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('xat:propi:'||p_tenant_id::text||':'||v_jo::text,0));
    select f.id into v_fil from public.xat_fils f where f.tenant_id=p_tenant_id and f.propi_usuari_id=v_jo;
    if v_fil is null then
      insert into public.xat_fils(tenant_id,titol,creat_per,tipus,propi_usuari_id)
        values(p_tenant_id,nullif(btrim(p_titol),''),v_jo,'directe',v_jo) returning id into v_fil;
      insert into public.xat_participants(fil_id,usuari_id,rol) values(v_fil,v_jo,'propietari');
    else
      update public.xat_participants set visible_fins_seq=null,eixit_al=null
        where fil_id=v_fil and usuari_id=v_jo;
    end if;
    return v_fil;
  end if;
  select o.id into v_org from public.organizations o
  where o.id = p_altre_usuari and o.tenant_id = p_tenant_id
    and (o.visibility = 'public' or private.is_organization_member(o.id));
  if v_org is not null then
    if private.can_manage_organization(v_org) then
      raise exception 'SDP-XAT-002: ja representes aquesta entitat.' using errcode = '22023';
    end if;
    -- Mateixa clau en les dues crides concurrents; cada client té el seu fil.
    perform pg_advisory_xact_lock(hashtextextended('xat:org:' || p_tenant_id::text || ':' || v_org::text || ':' || v_jo::text, 0));
    select f.id into v_fil from public.xat_fils f
    where f.tenant_id = p_tenant_id and f.org_id = v_org and f.interlocutor_id = v_jo;
    if v_fil is null then
      insert into public.xat_fils (tenant_id, titol, creat_per, tipus, org_id, interlocutor_id)
      values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe', v_org, v_jo)
      returning id into v_fil;
      insert into public.xat_participants (fil_id, usuari_id) values (v_fil, v_jo);
      insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
      select v_fil, om.user_id, v_org, 'admin' from public.organization_memberships om
      where om.organization_id = v_org and om.tenant_id = p_tenant_id
        and om.role in ('owner', 'admin') and om.user_id <> v_jo
      on conflict (fil_id, usuari_id) do nothing;
    end if;
    return v_fil;
  end if;
  if not exists (select 1 from public.town_memberships tm
    join public.profiles pr on pr.id = tm.user_id and pr.baixa_demanada_at is null
    where tm.town_id = p_tenant_id and tm.user_id = p_altre_usuari) then
    raise exception 'SDP-XAT-004: l''interlocutor no és disponible en aquest poble.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:persona:' || p_tenant_id::text || ':' || least(v_jo, p_altre_usuari)::text || ':' || greatest(v_jo, p_altre_usuari)::text, 0));
  select f.id into v_fil from public.xat_fils f
  where f.tenant_id = p_tenant_id and f.tipus = 'directe'
    and f.org_id is null and f.interlocutor_id is null
    and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
    and private.es_participant(f.id)
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id
      and p.usuari_id = p_altre_usuari and p.visible_fins_seq is null)
  order by f.creat_al, f.id limit 1;
  if v_fil is null then
    if not exists (select 1 from public.profiles pr
      where pr.id = p_altre_usuari and pr.consentiment_rgpd_at is not null) then
      raise exception 'SDP-XAT-016: l''interlocutor no és disponible al xat.' using errcode = '42501';
    end if;
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus)
    values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe') returning id into v_fil;
    insert into public.xat_participants (fil_id, usuari_id)
    values (v_fil, v_jo), (v_fil, p_altre_usuari);
  end if;
  return v_fil;
end;
$$;

CREATE OR REPLACE FUNCTION public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint
)
language plpgsql volatile security definer SET search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
  select f.id, om.user_id, f.org_id, 'admin' from public.xat_fils f
  join public.organization_memberships om on om.organization_id = f.org_id and om.tenant_id = f.tenant_id
  where f.tenant_id = p_tenant_id and f.interlocutor_id is not null
    and f.interlocutor_id <> (select auth.uid())
    and om.user_id = (select auth.uid()) and om.role in ('owner', 'admin')
  on conflict (fil_id, usuari_id) do nothing;

  return query select f.id, f.tipus, f.titol,
    coalesce(f.imatge_url, costat.dades -> 0 ->> 'avatarUrl'), f.actualitzat_al,
    coalesce(costat.noms, array[]::text[]), u.text, u.creat_al, u.usuari_id,
    f.ultim_seq, jo.llegit_fins_seq, jo.rebut_fins_seq,
    coalesce((select min(p.llegit_fins_seq) from public.xat_participants p
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)), 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null),
    u.tipus, f.epoca_actual, f.cap_epoca_hash, f.e2ee_des_de_seq
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
  left join lateral (
    select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'tipus', c.tipus,
      'avatarUrl', c.avatar_url, 'slug', c.slug) order by c.nom) as dades,
      array_agg(c.nom order by c.nom) as noms
    from (
      select o.id, o.name as nom, 'entitat'::text as tipus, o.logo_url as avatar_url, o.slug
      where o.id is not null and jo.com_org_id is null
      union all
      select pr.id, coalesce(pr.full_name, 'Veí'), 'persona'::text, pr.avatar_url, null::text
      from public.xat_participants p join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id and (p.usuari_id <> (select auth.uid()) or f.propi_usuari_id = (select auth.uid()))
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;

revoke execute on function private.xat_participant_vigent(uuid,uuid) from public,anon,authenticated,service_role;
revoke execute on function public.crea_fil_directe(uuid,uuid,text) from public,anon;
grant execute on function public.crea_fil_directe(uuid,uuid,text) to authenticated;
revoke execute on function public.xat_fils_meus(uuid) from public,anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
