-- ============================================================================
-- 261018_1915 · Organitzacions: Correu de contacte corporatiu i Gestió de membres
-- Sóc de Poble (Ordre del Mestre Javi Llinares, 18-10-2026)
--
-- QUÈ FA:
--   1. Afig columnes contact_email i public_email a public.organizations.
--   2. Implementa RPCs contacte_organitzacio i desa_contacte_organitzacio
--      (amb comprovació de permisos private.can_manage_organization).
--   3. Implementa taula i RPCs de membres (2610081402_membres_organitzacio):
--      public.organization_member_organizations, membres_organitzacio,
--      desa_membre_organitzacio i lleva_membre_organitzacio.
--   4. Recarrega l'esquema de PostgREST (notify pgrst).
--
-- P0-01 (ordre del Mestre, 20-10-2026) · El correu privat (`contact_email`) no
-- s'exposa a cap rol: ni a `anon` (la política «public read public
-- organizations» deixa llegir les organitzacions públiques sense sessió) ni a
-- `authenticated`. Només el llig qui administra l'organització, per l'RPC
-- contacte_organitzacio (SECURITY DEFINER, can_manage_organization). Les
-- columnes llegibles són només `public_email` (l'opt-in). El REVOKE explícit
-- tanca també una base on ja s'haguera aplicat la versió d'abans d'este fitxer,
-- que donava SELECT (contact_email) a anon i authenticated.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Columnes de correu de contacte a organizations ──────────────────────
alter table public.organizations add column if not exists contact_email text;
alter table public.organizations add column if not exists public_email boolean default false;
revoke select (contact_email) on table public.organizations from public, anon, authenticated;
grant select (public_email) on table public.organizations to anon, authenticated;
grant update (contact_email, public_email) on table public.organizations to authenticated;

-- ── 2 · RPCs de contacte corporatiu ─────────────────────────────────────────
create or replace function public.contacte_organitzacio(p_organization_id uuid)
returns table (
  correu text,
  es_public boolean,
  origen_per_defecte text,
  correu_per_defecte text
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner_email text;
  v_contact_email text;
  v_public_email boolean;
begin
  if v_uid is null then
    raise exception 'SDP-ORGMAIL-000: Cal iniciar sessió.' using errcode = '42501';
  end if;
  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMAIL-001: Només qui administra aquesta organització pot vore el seu correu.' using errcode = '42501';
  end if;

  select o.contact_email, coalesce(o.public_email, false)
  into v_contact_email, v_public_email
  from public.organizations o
  where o.id = p_organization_id;

  select u.email
  into v_owner_email
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id
  where m.organization_id = p_organization_id and m.role = 'owner'
  limit 1;

  return query
  select
    coalesce(v_contact_email, '')::text as correu,
    v_public_email as es_public,
    'propietaria'::text as origen_per_defecte,
    coalesce(v_owner_email, '')::text as correu_per_defecte;
end;
$$;
revoke execute on function public.contacte_organitzacio(uuid) from public, anon;
grant execute on function public.contacte_organitzacio(uuid) to authenticated;

create or replace function public.desa_contacte_organitzacio(
  p_organization_id uuid,
  p_correu text,
  p_public boolean
)
returns table (
  correu text,
  es_public boolean,
  origen_per_defecte text,
  correu_per_defecte text
)
language plpgsql
security definer
volatile
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_net text := lower(btrim(coalesce(p_correu, '')));
begin
  if v_uid is null then
    raise exception 'SDP-ORGMAIL-000: Cal iniciar sessió.' using errcode = '42501';
  end if;
  if p_organization_id is null or not private.can_manage_organization(p_organization_id) then
    raise exception 'SDP-ORGMAIL-001: Només qui administra aquesta organització pot canviar el seu correu.' using errcode = '42501';
  end if;

  update public.organizations
  set contact_email = nullif(v_net, ''),
      public_email = coalesce(p_public, false)
  where id = p_organization_id;

  return query
  select * from public.contacte_organitzacio(p_organization_id);
end;
$$;
revoke execute on function public.desa_contacte_organitzacio(uuid, text, boolean) from public, anon;
grant execute on function public.desa_contacte_organitzacio(uuid, text, boolean) to authenticated;

-- ── 3 · Taula d'organitzacions membres d'una altra ──────────────────────────
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

-- ── 4 · RPC llista de membres ───────────────────────────────────────────────
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

-- ── 5 · RPC alta o canvi de rol d'un membre ─────────────────────────────────
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

-- ── 6 · RPC baixa d'un membre o eixida pròpia ───────────────────────────────
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

  -- Eixida pròpia: qualsevol membre que no siga la propietària
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
