-- Xat d'entitats: una conversa privada per client i organització.
-- Les persones owner/admin responen amb autoria d'entitat derivada al servidor.
-- La pertinença es comprova també en llegir: revocar un rol talla tot accés.
-- Aplicació local revisable; no provisiona comptes ni cap entitat fictícia.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

alter table public.xat_fils add column if not exists interlocutor_id uuid
  references auth.users (id) on delete cascade;
alter table public.xat_missatges add column if not exists com_org_id uuid
  references public.organizations (id) on delete set null;
create unique index if not exists xat_fils_entitat_interlocutor_uq
  on public.xat_fils (tenant_id, org_id, interlocutor_id)
  where org_id is not null and interlocutor_id is not null;

-- Esta funció no és una RPC: l'usuari no pot consultar permisos de tercers.
-- interlocutor_id conserva el tipus de conversa encara que s'esborre l'org
-- (la FK org_id històrica és SET NULL), evitant convertir-la en un fil personal.
create or replace function private.xat_participant_vigent(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.xat_participants p
    join public.xat_fils f on f.id = p.fil_id
    where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
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
  );
$$;
revoke execute on function private.xat_participant_vigent(uuid, uuid) from public, anon, authenticated;

create or replace function private.es_participant(p_fil_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.xat_participant_vigent(p_fil_id, (select auth.uid())) and exists (
    select 1 from public.xat_participants p where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid()) and p.visible_fins_seq is null);
$$;
revoke execute on function private.es_participant(uuid) from public, anon;
grant execute on function private.es_participant(uuid) to authenticated;

-- RLS del roster: el client veu la seua fila, no els identificadors de l'equip.
-- Les gestores només veuen participants que encara tenen accés vigent.
create or replace function private.xat_pot_veure_participant(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_participant(p_fil_id)
    and private.xat_participant_vigent(p_fil_id, p_usuari_id)
    and exists (select 1 from public.xat_participants p
      where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
        and (p.com_org_id is null or p.usuari_id = (select auth.uid())
          or private.can_manage_organization(p.com_org_id)));
$$;
revoke execute on function private.xat_pot_veure_participant(uuid, uuid) from public, anon;
grant execute on function private.xat_pot_veure_participant(uuid, uuid) to authenticated;
drop policy if exists "xat_participants_lectura" on public.xat_participants;
create policy "xat_participants_lectura" on public.xat_participants
for select to authenticated
using (private.xat_pot_veure_participant(fil_id, usuari_id));

create or replace function private.seq_visible(p_fil_id uuid, p_seq bigint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.xat_participant_vigent(p_fil_id, (select auth.uid())) and exists (
    select 1 from public.xat_participants p where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
      and p_seq > greatest(p.visible_des_de_seq, p.buidat_fins_seq)
      and (p.visible_fins_seq is null or p_seq <= p.visible_fins_seq));
$$;
revoke execute on function private.seq_visible(uuid, bigint) from public, anon;
grant execute on function private.seq_visible(uuid, bigint) to authenticated;

create or replace function private.es_admin_del_fil(p_fil_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_participant(p_fil_id) and exists (
    select 1 from public.xat_participants p where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid()) and p.rol in ('propietari', 'admin'));
$$;
revoke execute on function private.es_admin_del_fil(uuid) from public, anon;
grant execute on function private.es_admin_del_fil(uuid) to authenticated;

-- Les altes/promocions administratives reben les converses ja existents.
-- No es transforma mai en representant una fila que pertany al client.
-- Les baixes no esborren història: el control dinàmic anterior revoca l'accés.
create or replace function private.xat_alta_gestor_entitat()
returns trigger language plpgsql volatile security definer set search_path = ''
as $$
begin
  if new.role in ('owner', 'admin') then
    insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
    select f.id, new.user_id, new.organization_id, 'admin'
    from public.xat_fils f
    where f.org_id = new.organization_id and f.tenant_id = new.tenant_id
      and f.interlocutor_id is not null and f.interlocutor_id <> new.user_id
    on conflict (fil_id, usuari_id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function private.xat_alta_gestor_entitat() from public, anon, authenticated;
drop trigger if exists xat_alta_gestor_entitat on public.organization_memberships;
create trigger xat_alta_gestor_entitat after insert or update on public.organization_memberships
  for each row execute function private.xat_alta_gestor_entitat();

-- Cap via directa permet afegir tercers, canviar de costat o suplantar autoria.
revoke insert, update, delete on public.xat_participants from authenticated;
revoke insert, update, delete on public.xat_missatges from authenticated;
revoke insert (fil_id, usuari_id, text) on public.xat_missatges from authenticated;

-- Directori: nom i avatar, mai correus ni membres de l'equip d'una entitat.
drop function if exists public.membres_del_poble(uuid, text, integer);
create function public.membres_del_poble(p_tenant_id uuid, p_cerca text default null, p_limit integer default 100)
returns table (usuari_id uuid, nom text, fil_id uuid, tipus text, avatar_url text)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  return query
  select d.id, d.nom, d.fil_id, d.tipus, d.avatar_url from (
    select pr.id, coalesce(pr.full_name, 'Veí') as nom, 'persona'::text as tipus, pr.avatar_url,
      (select f.id from public.xat_fils f
       where f.tenant_id = p_tenant_id and f.tipus = 'directe'
         and f.org_id is null and f.interlocutor_id is null
         and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
         and private.es_participant(f.id)
         and exists (select 1 from public.xat_participants p where p.fil_id = f.id
           and p.usuari_id = pr.id and p.visible_fins_seq is null)
       order by f.creat_al, f.id limit 1) as fil_id
    from public.town_memberships tm join public.profiles pr on pr.id = tm.user_id
    where tm.town_id = p_tenant_id and pr.id <> v_jo and pr.baixa_demanada_at is null
    union all
    select o.id, o.name, 'entitat'::text, o.logo_url,
      (select f.id from public.xat_fils f where f.tenant_id = p_tenant_id
        and f.org_id = o.id and f.interlocutor_id = v_jo and private.es_participant(f.id)
       order by f.creat_al, f.id limit 1)
    from public.organizations o
    where o.tenant_id = p_tenant_id
      and (o.visibility = 'public' or private.is_organization_member(o.id))
      and not private.can_manage_organization(o.id)
  ) d
  where nullif(btrim(p_cerca), '') is null or d.nom ilike '%' || btrim(p_cerca) || '%'
  order by d.nom, d.id limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

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
  if p_altre_usuari is null or p_altre_usuari = v_jo then
    raise exception 'SDP-XAT-002: cal un altre interlocutor, distint de tu.' using errcode = '22023';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
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
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus)
    values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe') returning id into v_fil;
    insert into public.xat_participants (fil_id, usuari_id)
    values (v_fil, v_jo), (v_fil, p_altre_usuari);
  end if;
  return v_fil;
end;
$$;
revoke execute on function public.crea_fil_directe(uuid, uuid, text) from public, anon;
grant execute on function public.crea_fil_directe(uuid, uuid, text) to authenticated;

-- L'autoria s'obté del participant, mai de p_metadades ni d'un id del client.
drop function if exists public.xat_envia(uuid, uuid, text, text, uuid, jsonb);
create function public.xat_envia(p_id uuid, p_fil_id uuid, p_tipus text default 'text',
  p_text text default null, p_resposta_a uuid default null, p_metadades jsonb default '{}'::jsonb)
returns table (id uuid, seq bigint, creat_al timestamptz, usuari_id uuid, com_org_id uuid, autor_nom text)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
  v_org uuid;
  v_m public.xat_missatges%rowtype;
  v_text text := btrim(p_text);
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_id is null or p_fil_id is null or jsonb_typeof(coalesce(p_metadades, '{}'::jsonb)) <> 'object' then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if coalesce(nullif(btrim(p_tipus), ''), 'text') <> 'text' then
    raise exception 'SDP-XAT-010: tipus de missatge no admés des del client.' using errcode = '22023';
  end if;
  if v_text is null or v_text = '' or char_length(v_text) > 4096 then
    raise exception 'SDP-XAT-007: missatge buit o massa llarg.' using errcode = '22023';
  end if;
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;
  select p.com_org_id into v_org from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  if v_org is not null then
    -- La revocació no pot intercalar-se entre l'autorització i l'enviament.
    perform 1 from public.organization_memberships om where om.organization_id = v_org
      and om.user_id = v_jo and om.role in ('owner', 'admin') for share;
    if not found then
      raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
    end if;
  end if;
  -- Serialitza també reintents concurrents: no consumixen seq ni el límit de freqüència.
  perform pg_advisory_xact_lock(hashtextextended('xat:missatge:' || p_id::text, 0));
  select m.* into v_m from public.xat_missatges m where m.id = p_id;
  if found then
    if v_m.usuari_id is distinct from v_jo or v_m.fil_id is distinct from p_fil_id then
      raise exception 'SDP-XAT-008: identificador d''un altre enviament.' using errcode = '42501';
    end if;
  else
    -- Una cita s'autoritza en crear el missatge. Un reintent ja acceptat
    -- continua sent idempotent si després la cita caduca o es buida.
    if p_resposta_a is not null and not exists (select 1 from public.xat_missatges m
      where m.id = p_resposta_a and m.fil_id = p_fil_id and private.seq_visible(m.fil_id, m.seq)
        and (m.caduca_al is null or m.caduca_al > now())) then
      raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
    end if;
    insert into public.xat_missatges (id, fil_id, usuari_id, com_org_id, text, tipus, resposta_a, metadades, es_ia)
    values (p_id, p_fil_id, v_jo, v_org, v_text, 'text', p_resposta_a,
      coalesce(p_metadades, '{}'::jsonb) - array['com_org_id', 'comOrgId', 'autor_nom', 'autorNom', 'usuari_id', 'usuariId'], false)
    returning * into v_m;
  end if;
  update public.xat_participants p set llegit_fins_seq = greatest(p.llegit_fins_seq, v_m.seq),
    rebut_fins_seq = greatest(p.rebut_fins_seq, v_m.seq)
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  return query select v_m.id, v_m.seq, v_m.creat_al, v_m.usuari_id, v_m.com_org_id,
    coalesce(o.name, pr.full_name, 'Veí')::text
  from public.profiles pr left join public.organizations o on o.id = v_m.com_org_id
  where pr.id = v_jo;
end;
$$;
revoke execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) from public, anon;
grant execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) to authenticated;

drop function if exists public.xat_historial(uuid, bigint, integer);
create function public.xat_historial(
  p_fil_id       uuid,
  p_abans_de_seq bigint  default null,
  p_limit        integer default 50
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  com_org_id  uuid,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo     uuid := (select auth.uid());
  v_limit  integer := coalesce(p_limit, 50);
  v_des_de bigint;
  v_fins   bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or v_limit < 1 or v_limit > 100
     or (p_abans_de_seq is not null and p_abans_de_seq < 1) then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select greatest(p.visible_des_de_seq, p.buidat_fins_seq), p.visible_fins_seq
    into v_des_de, v_fins
  from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo
    and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select * from (
      select
        m.id,
        m.fil_id,
        m.seq,
        m.usuari_id,
        coalesce(o.name, pr.full_name, 'Veí')::text as autor_nom,
        m.com_org_id,
        m.text as cos,
        m.tipus,
        m.resposta_a,
        m.editat_al,
        m.esborrat_al,
        m.metadades,
        m.es_ia,
        m.creat_al
      from public.xat_missatges m
      left join public.profiles pr on pr.id = m.usuari_id
      left join public.organizations o on o.id = m.com_org_id
      where m.fil_id = p_fil_id
        and m.seq > v_des_de
        and (v_fins is null or m.seq <= v_fins)
        and (p_abans_de_seq is null or m.seq < p_abans_de_seq)
        and (m.caduca_al is null or m.caduca_al > now())
      order by m.seq desc
      limit v_limit
    ) sub
    order by sub.seq asc;
end;
$$;
revoke execute on function public.xat_historial(uuid, bigint, integer) from public, anon;
grant execute on function public.xat_historial(uuid, bigint, integer) to authenticated;

drop function if exists public.xat_nous(uuid, bigint, integer);
create function public.xat_nous(
  p_fil_id         uuid,
  p_despres_de_seq bigint,
  p_limit          integer default 100
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  com_org_id  uuid,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo     uuid := (select auth.uid());
  v_limit  integer := coalesce(p_limit, 100);
  v_des_de bigint;
  v_fins   bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or p_despres_de_seq is null or p_despres_de_seq < 0
     or v_limit < 1 or v_limit > 500 then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select greatest(p.visible_des_de_seq, p.buidat_fins_seq), p.visible_fins_seq
    into v_des_de, v_fins
  from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo
    and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select
      m.id,
      m.fil_id,
      m.seq,
      m.usuari_id,
      coalesce(o.name, pr.full_name, 'Veí')::text as autor_nom,
        m.com_org_id,
      m.text as cos,
      m.tipus,
      m.resposta_a,
      m.editat_al,
      m.esborrat_al,
      m.metadades,
      m.es_ia,
      m.creat_al
    from public.xat_missatges m
    left join public.profiles pr on pr.id = m.usuari_id
      left join public.organizations o on o.id = m.com_org_id
    where m.fil_id = p_fil_id
      and m.seq > greatest(v_des_de, p_despres_de_seq)
      and (v_fins is null or m.seq <= v_fins)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq asc
    limit v_limit;
end;
$$;
revoke execute on function public.xat_nous(uuid, bigint, integer) from public, anon;
grant execute on function public.xat_nous(uuid, bigint, integer) to authenticated;

create or replace function public.xat_marca(
  p_fil_id      uuid,
  p_rebut_fins  bigint default null,
  p_llegit_fins bigint default null
)
returns table (rebut_fins_seq bigint, llegit_fins_seq bigint)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo       uuid := (select auth.uid());
  v_ultim    bigint;
  v_rebut    bigint;
  v_llegit   bigint;
  v_llegit_al timestamptz;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null
     or (p_rebut_fins is not null and p_rebut_fins < 0)
     or (p_llegit_fins is not null and p_llegit_fins < 0) then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select f.ultim_seq into v_ultim
  from public.xat_fils f
  join public.xat_participants p on p.fil_id = f.id
  where f.id = p_fil_id
    and p.usuari_id = v_jo
    and p.visible_fins_seq is null
    and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  v_llegit := least(coalesce(p_llegit_fins, v_ultim), v_ultim);
  v_rebut  := greatest(least(coalesce(p_rebut_fins, v_ultim), v_ultim), v_llegit);

  update public.xat_participants p
     set rebut_fins_seq   = greatest(p.rebut_fins_seq, v_rebut),
         llegit_fins_seq  = greatest(p.llegit_fins_seq, v_llegit),
         no_llegit_manual = case
           when greatest(p.llegit_fins_seq, v_llegit) >= v_ultim then false
           else p.no_llegit_manual
         end
   where p.fil_id = p_fil_id
     and p.usuari_id = v_jo
  returning p.rebut_fins_seq, p.llegit_fins_seq into v_rebut, v_llegit;

  select coalesce(
           (select m.creat_al from public.xat_missatges m
             where m.fil_id = p_fil_id and m.seq = v_llegit),
           now())
    into v_llegit_al;

  insert into public.xat_lectures as l (fil_id, usuari_id, ultim_llegit_al)
  values (p_fil_id, v_jo, v_llegit_al)
  on conflict (fil_id, usuari_id)
  do update set ultim_llegit_al = greatest(l.ultim_llegit_al, excluded.ultim_llegit_al);

  return query select v_rebut, v_llegit;
end;
$$;
revoke execute on function public.xat_marca(uuid, bigint, bigint) from public, anon;
grant execute on function public.xat_marca(uuid, bigint, bigint) to authenticated;

-- Llista del fil amb l'altre costat lògic: l'entitat o el client, no l'equip.
-- La inserció idempotent repara també una alta concurrent de gestor/fil.
drop function if exists public.xat_fils_meus(uuid);
create function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb
)
language plpgsql volatile security definer set search_path = ''
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
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb)
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
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;
revoke execute on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;

-- Compatibilitat de lectura antiga, amb la mateixa autoria, finestra i caducitat.
create or replace function public.xat_missatges_del_fil(p_fil_id uuid, p_limit integer default 200)
returns table (id uuid, usuari_id uuid, autor_nom text, cos text, es_ia boolean, creat_al timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;
  return query select m.id, m.usuari_id, coalesce(o.name, pr.full_name, 'Veí')::text,
    m.text, m.es_ia, m.creat_al
  from public.xat_missatges m left join public.profiles pr on pr.id = m.usuari_id
  left join public.organizations o on o.id = m.com_org_id
  where m.fil_id = p_fil_id and private.seq_visible(m.fil_id, m.seq)
    and (m.caduca_al is null or m.caduca_al > now())
  order by m.seq asc limit greatest(1, least(coalesce(p_limit, 200), 500));
end;
$$;
revoke execute on function public.xat_missatges_del_fil(uuid, integer) from public, anon;
grant execute on function public.xat_missatges_del_fil(uuid, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
