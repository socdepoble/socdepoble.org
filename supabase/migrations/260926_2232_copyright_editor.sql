-- Copyright lliure de l'editor: límit compartit amb el client.
-- Additiva; conserva les polítiques RLS existents. Aplicar després de Fase 1.
-- No s'ha executat contra producció durant l'auditoria local.
begin;

alter table public.notes add column copyright text not null default ''
  constraint notes_copyright_longitud check (char_length(copyright) <= 256);
alter table public.profiles add column copyright text not null default ''
  constraint profiles_copyright_longitud check (char_length(copyright) <= 256);
alter table public.organizations add column copyright text not null default ''
  constraint organizations_copyright_longitud check (char_length(copyright) <= 256);

grant select (copyright) on table public.organizations to anon, authenticated;
grant update (copyright) on table public.organizations to authenticated;
grant update (copyright) on table public.profiles to authenticated;
-- Notes i profiles ja disposen de SELECT de taula; Notes té INSERT/UPDATE
-- de taula. Els permisos anteriors continuen subjectes a RLS.

-- Directori públic: les columnes noves van al final (requisit de CREATE OR REPLACE).
create or replace view public.organization_directory with (security_invoker = true, security_barrier = true)
as
select
  id,
  tenant_id,
  slug,
  name,
  kind,
  parent_organization_id,
  lema,
  description,
  created_at,
  updated_at,
  logo_url,
  hero_url,
  presentacio_html,
  copyright
from public.organizations
where visibility = 'public';

revoke all on table public.organization_directory from public, anon, authenticated;
grant select on table public.organization_directory to anon, authenticated;

-- El returns table canvia: create or replace no ho admet, cal esborrar-la.
drop function if exists public.list_my_organizations(uuid);
create function public.list_my_organizations(p_tenant_id uuid)
returns table (
  id uuid,
  tenant_id uuid,
  slug text,
  name text,
  kind text,
  parent_organization_id uuid,
  lema text,
  description text,
  visibility text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  logo_url text,
  hero_url text,
  presentacio_html text,
  copyright text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    organization.id,
    organization.tenant_id,
    organization.slug,
    organization.name,
    organization.kind,
    organization.parent_organization_id,
    organization.lema,
    organization.description,
    organization.visibility,
    membership.role,
    organization.created_at,
    organization.updated_at,
    organization.logo_url,
    organization.hero_url,
    organization.presentacio_html,
    organization.copyright
  from public.organization_memberships membership
  join public.organizations organization
    on organization.id = membership.organization_id
   and organization.tenant_id = membership.tenant_id
  where membership.user_id = (select auth.uid())
    and membership.tenant_id = p_tenant_id
  order by organization.created_at asc;
$$;

revoke execute on function public.list_my_organizations(uuid) from public, anon;
grant execute on function public.list_my_organizations(uuid) to authenticated;


commit;
