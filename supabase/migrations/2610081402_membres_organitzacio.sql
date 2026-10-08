-- ============================================================================
-- 261008_1402 · Organitzacions (grup C) · Els membres d'una organització
-- Ordre del Mestre (261008, prompt 261008_1201_prompt_claude.md, tasca 3):
-- «Cal que un propietari puga gestionar, afegir i visualitzar usuaris o altres
-- grups que en siguen membres (ex: l'usuari "Sóc de Poble" essent membre de
-- "El Rentonar").» Decisions del Mestre (261008):
--   · alta directa, sense invitació; la persona pot «Eixir»;
--   · una organització membre d'una altra NO hereta cap permís, i només
--     l'afig qui administra totes dues;
--   · només la propietària nomena, degrada o lleva administradores;
--   · la llista només la veuen owner i admin.
--
-- QUÈ FA:
--   1. public.organization_member_organizations: una organització membre
--      d'una altra del MATEIX poble (claus foranes compostes (tenant_id, id),
--      on delete cascade) i mai d'ella mateixa (CHECK). RLS activa, revoke
--      all i només SELECT per a qui administra alguna de les dues. Cap
--      escriptura directa: tot passa per les RPC. Cap funció de permisos
--      (can_manage_organization, is_organization_member, pot_signar_com_
--      organitzacio...) la llig: ser-ne membre no dona cap permís.
--   2. Tres RPC SECURITY DEFINER amb search_path buit i guarda d'auth.uid():
--      · membres_organitzacio(p_organization_id): les persones
--        (organization_memberships + profiles) i les organitzacions membres.
--        Només per a qui l'administra (private.can_manage_organization).
--      · desa_membre_organitzacio(p_organization_id, p_membre_id, p_tipus,
--        p_role): alta o canvi de rol. Persona: rol member o admin (mai
--        owner), del poble de l'organització i sense la baixa demanada; no
--        un mateix; la propietària és intocable; nomenar o degradar una
--        admin només ho fa la propietària. Organització: només member, del
--        mateix poble, no ella mateixa, i qui crida també l'administra.
--      · lleva_membre_organitzacio(p_organization_id, p_membre_id, p_tipus):
--        la baixa. Les gestores lleven membres; una admin només la lleva la
--        propietària; qualsevol que no siga la propietària pot eixir-se'n
--        ella mateixa. Idempotent: llevar qui no hi és torna false.
--   Les persones membres ja vivien a organization_memberships (amb el rol i
--   el trigger sdp_una_propietaria); no hi ha cap taula nova per a elles.
--
-- CODIS (missatges en valencià; l'adaptador els llig pel prefix):
--   SDP-ORGMEM-000 cal la sessió iniciada (42501)
--   SDP-ORGMEM-001 el tipus de membre o el rol no és vàlid (22023)
--   SDP-ORGMEM-002 només qui administra l'organització en gestiona els
--                  membres; també si l'organització no existix (42501)
--   SDP-ORGMEM-003 la persona no és del poble, no existix o ha demanat la
--                  baixa (22023)
--   SDP-ORGMEM-004 no pots canviar el teu propi rol (42501)
--   SDP-ORGMEM-005 la propietària no es canvia ni es lleva (42501)
--   SDP-ORGMEM-006 només la propietària nomena, degrada o lleva
--                  administradores (42501)
--   SDP-ORGMEM-007 una organització no pot ser membre d'ella mateixa ni
--                  d'una d'un altre poble, o no existix (22023)
--   SDP-ORGMEM-008 per a afegir una organització com a membre, cal
--                  administrar-la també (42501)
--
-- Columnes que usa, comprovades al disc: profiles.full_name (2609080000),
-- profiles.avatar_url (2609110600), profiles.baixa_demanada_at (2609261500),
-- town_memberships.town_id i user_id (2609080000), organizations.logo_url
-- (2609261500) i organization_memberships (2609080000).
--
-- Additiva i idempotent: es pot tornar a executar. Revisada i NO aplicada a
-- cap base de dades: l'aplica el Mestre. Va després de 2610081401 (i, per
-- tant, de 2610072230) i ABANS de publicar el client: sense ella, la pestanya
-- «Membres» diu que el servidor encara no els gestiona (NO-DISPONIBLE).
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Organitzacions membres d'una altra ──────────────────────────────────
create table if not exists public.organization_member_organizations (
  organization_id        uuid not null,
  member_organization_id uuid not null,
  tenant_id              uuid not null,
  created_by             uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),
  primary key (organization_id, member_organization_id),
  constraint organization_member_organizations_no_ella_mateixa
    check (organization_id <> member_organization_id),
  constraint organization_member_organizations_organitzacio_fkey
    foreign key (tenant_id, organization_id)
    references public.organizations (tenant_id, id) on delete cascade,
  constraint organization_member_organizations_membre_fkey
    foreign key (tenant_id, member_organization_id)
    references public.organizations (tenant_id, id) on delete cascade
);

-- La clau primària servix la primera FK; la segona necessita el seu índex.
create index if not exists idx_organization_member_organizations_membre
  on public.organization_member_organizations (tenant_id, member_organization_id);

alter table public.organization_member_organizations enable row level security;
revoke all on table public.organization_member_organizations from public, anon, authenticated;
grant select on table public.organization_member_organizations to authenticated;

drop policy if exists "gestores llegixen les organitzacions membres" on public.organization_member_organizations;
create policy "gestores llegixen les organitzacions membres" on public.organization_member_organizations
for select to authenticated
using (
  (select private.can_manage_organization(organization_id))
  or (select private.can_manage_organization(member_organization_id))
);

-- ── 2 · La llista de membres ────────────────────────────────────────────────
-- Una fila per membre: tipus 'persona' (membre_id = user_id) o 'organitzacio'
-- (membre_id = organizations.id). Una organització membre sempre és 'member'.
-- Una persona amb la baixa demanada continua sent membre fins a la purga, amb
-- el nom anònim que ja li posa demana_baixa().
create or replace function public.membres_organitzacio(p_organization_id uuid)
returns table (tipus text, membre_id uuid, nom text, avatar_url text, role text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-ORGMEM-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMEM-002: només qui administra l''organització en veu i en gestiona els membres.' using errcode = '42501';
  end if;
  return query
  select d.tipus, d.membre_id, d.nom, d.avatar_url, d.role, d.created_at from (
    select 'persona'::text as tipus, m.user_id as membre_id, coalesce(pr.full_name, 'Veí/na') as nom,
           pr.avatar_url, m.role, m.created_at
    from public.organization_memberships m
    join public.profiles pr on pr.id = m.user_id
    where m.organization_id = p_organization_id
    union all
    select 'organitzacio'::text, o.id, o.name, o.logo_url, 'member'::text, mo.created_at
    from public.organization_member_organizations mo
    join public.organizations o on o.id = mo.member_organization_id and o.tenant_id = mo.tenant_id
    where mo.organization_id = p_organization_id
  ) d
  order by d.tipus desc, d.nom, d.membre_id;
end;
$$;
revoke execute on function public.membres_organitzacio(uuid) from public, anon;
grant execute on function public.membres_organitzacio(uuid) to authenticated;

-- ── 3 · Alta o canvi de rol (alta directa, sense invitació) ─────────────────
-- Torna la fila del membre amb la forma de membres_organitzacio.
create or replace function public.desa_membre_organitzacio(
  p_organization_id uuid,
  p_membre_id uuid,
  p_tipus text,
  p_role text default 'member'
)
returns table (tipus text, membre_id uuid, nom text, avatar_url text, role text, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo      uuid := (select auth.uid());
  v_tipus   text := lower(btrim(coalesce(p_tipus, '')));
  v_role    text := lower(btrim(coalesce(nullif(btrim(p_role), ''), 'member')));
  v_tenant  uuid;
  v_meu     text;
  v_actual  text;
begin
  if v_jo is null then
    raise exception 'SDP-ORGMEM-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_membre_id is null
    or v_tipus not in ('persona', 'organitzacio')
    or v_role not in ('member', 'admin')
    or (v_tipus = 'organitzacio' and v_role <> 'member') then
    raise exception 'SDP-ORGMEM-001: el tipus de membre o el rol no és vàlid.' using errcode = '22023';
  end if;
  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMEM-002: només qui administra l''organització en gestiona els membres.' using errcode = '42501';
  end if;
  select o.tenant_id into v_tenant from public.organizations o where o.id = p_organization_id;
  select m.role into v_meu from public.organization_memberships m
   where m.organization_id = p_organization_id and m.user_id = v_jo;

  if v_tipus = 'persona' then
    if p_membre_id = v_jo then
      raise exception 'SDP-ORGMEM-004: no pots canviar el teu propi rol.' using errcode = '42501';
    end if;
    if not exists (
      select 1
      from public.profiles pr
      join public.town_memberships tm on tm.user_id = pr.id and tm.town_id = v_tenant
      where pr.id = p_membre_id and pr.baixa_demanada_at is null
    ) then
      raise exception 'SDP-ORGMEM-003: la persona no és del poble de l''organització o ha demanat la baixa.' using errcode = '22023';
    end if;
    select m.role into v_actual from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = p_membre_id
     for update;
    if v_actual = 'owner' then
      raise exception 'SDP-ORGMEM-005: la propietària no es canvia ni es lleva.' using errcode = '42501';
    end if;
    if v_actual is distinct from v_role then
      if (v_role = 'admin' or v_actual = 'admin') and v_meu is distinct from 'owner' then
        raise exception 'SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501';
      end if;
      insert into public.organization_memberships (organization_id, tenant_id, user_id, role)
      values (p_organization_id, v_tenant, p_membre_id, v_role)
      on conflict (organization_id, user_id) do update set role = excluded.role;
    end if;
  else
    if p_membre_id = p_organization_id or not exists (
      select 1 from public.organizations o where o.id = p_membre_id and o.tenant_id = v_tenant
    ) then
      raise exception 'SDP-ORGMEM-007: una organització no pot ser membre d''ella mateixa ni d''una d''un altre poble.' using errcode = '22023';
    end if;
    if not private.can_manage_organization(p_membre_id) then
      raise exception 'SDP-ORGMEM-008: per a afegir una organització com a membre, cal que també l''administres.' using errcode = '42501';
    end if;
    insert into public.organization_member_organizations (organization_id, member_organization_id, tenant_id, created_by)
    values (p_organization_id, p_membre_id, v_tenant, v_jo)
    on conflict (organization_id, member_organization_id) do nothing;
  end if;

  return query
  select d.tipus, d.membre_id, d.nom, d.avatar_url, d.role, d.created_at
  from public.membres_organitzacio(p_organization_id) d
  where d.tipus = v_tipus and d.membre_id = p_membre_id;
end;
$$;
revoke execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) from public, anon;
grant execute on function public.desa_membre_organitzacio(uuid, uuid, text, text) to authenticated;

-- ── 4 · Baixa d'un membre o eixida pròpia ───────────────────────────────────
-- true si ha llevat una fila; false si no hi era (idempotent).
create or replace function public.lleva_membre_organitzacio(
  p_organization_id uuid,
  p_membre_id uuid,
  p_tipus text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo     uuid := (select auth.uid());
  v_tipus  text := lower(btrim(coalesce(p_tipus, '')));
  v_meu    text;
  v_actual text;
  v_n      integer := 0;
begin
  if v_jo is null then
    raise exception 'SDP-ORGMEM-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_membre_id is null or v_tipus not in ('persona', 'organitzacio') then
    raise exception 'SDP-ORGMEM-001: el tipus de membre o el rol no és vàlid.' using errcode = '22023';
  end if;

  -- Eixida pròpia: qualsevol membre que no siga la propietària, sense ser gestora.
  if v_tipus = 'persona' and p_membre_id = v_jo then
    select m.role into v_actual from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = v_jo
     for update;
    if not found then
      return false;
    end if;
    if v_actual = 'owner' then
      raise exception 'SDP-ORGMEM-005: la propietària no es canvia ni es lleva.' using errcode = '42501';
    end if;
    delete from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = v_jo;
    get diagnostics v_n = row_count;
    return v_n > 0;
  end if;

  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMEM-002: només qui administra l''organització en gestiona els membres.' using errcode = '42501';
  end if;

  if v_tipus = 'persona' then
    select m.role into v_meu from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = v_jo;
    select m.role into v_actual from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = p_membre_id
     for update;
    if not found then
      return false;
    end if;
    if v_actual = 'owner' then
      raise exception 'SDP-ORGMEM-005: la propietària no es canvia ni es lleva.' using errcode = '42501';
    end if;
    if v_actual = 'admin' and v_meu is distinct from 'owner' then
      raise exception 'SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501';
    end if;
    delete from public.organization_memberships m
     where m.organization_id = p_organization_id and m.user_id = p_membre_id;
  else
    delete from public.organization_member_organizations mo
     where mo.organization_id = p_organization_id and mo.member_organization_id = p_membre_id;
  end if;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;
revoke execute on function public.lleva_membre_organitzacio(uuid, uuid, text) from public, anon;
grant execute on function public.lleva_membre_organitzacio(uuid, uuid, text) to authenticated;

notify pgrst, 'reload schema';
commit;
