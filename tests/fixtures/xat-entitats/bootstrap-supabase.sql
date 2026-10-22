-- Només per a una base supabase/postgres de prova buida i descartable.
-- Gauntlet 261022_0225 (crítica Claude) · El mateix padró que bootstrap.sql,
-- sense els rols ni l'esquema auth, que la imatge de Supabase ja porta.
create schema if not exists private;
grant usage on schema public, auth, private to anon, authenticated;
create table public.towns (id uuid primary key);
create table public.profiles (
  id uuid primary key references auth.users(id), full_name text, avatar_url text,
  baixa_demanada_at timestamptz
);
create table public.town_memberships (
  town_id uuid references public.towns(id), user_id uuid references auth.users(id),
  primary key (town_id, user_id)
);
create table public.organizations (
  id uuid primary key, tenant_id uuid references public.towns(id), name text,
  slug text, logo_url text, visibility text default 'public', unique(tenant_id, id)
);
create table public.organization_memberships (
  organization_id uuid, tenant_id uuid, user_id uuid references auth.users(id), role text,
  primary key (organization_id, user_id),
  foreign key(tenant_id, organization_id) references public.organizations(tenant_id, id) on delete cascade
);
create function private.is_town_member(p_tenant_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.town_memberships where town_id = p_tenant_id and user_id = auth.uid());
$$;
create function private.is_organization_member(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_memberships where organization_id = p_org and user_id = auth.uid());
$$;
create function private.can_manage_organization(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_memberships where organization_id = p_org
    and user_id = auth.uid() and role in ('owner', 'admin'));
$$;
