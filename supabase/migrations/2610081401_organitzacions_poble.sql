-- ============================================================================
-- 261008_1401 · Organitzacions (grup C) · El poble d'una organització
-- Ordre del Mestre (261008, prompt 261008_1201_prompt_claude.md, tasca 1):
-- «Als perfils d'organització (ex. El Rentonar) falta l'opció per triar el
-- Poble. S'ha d'afegir aquest camp perquè aparega correctament el nom del
-- poble a la barra taronja superior.»
--
-- public.organizations no tenia cap columna per al poble: l'editor mostrava
-- el de la persona. Additiva:
--   1. organizations.town_name text, null = sense poble, amb el CHECK
--      organizations_town_name_llargaria (char_length(town_name) <= 120, el
--      mateix límit que el nom). Guarda el NOM del poble, com
--      profiles.town_name: la interfície l'oferix en un selector amb els
--      pobles del contingut base.
--   2. Permisos de columna: SELECT per a anon i authenticated (la fitxa
--      pública el mostra) i UPDATE per a authenticated. La fila la continua
--      protegint la política «gestores actualitzen l'organització»
--      (private.can_manage_organization): només owner i admin el canvien.
--   3. public.organization_directory amb town_name AL FINAL: mateixes
--      columnes, mateix ordre i mateix filtre visibility = 'public' que
--      2609262232 (CREATE OR REPLACE VIEW només admet columnes noves al final).
--   4. public.list_my_organizations(uuid) amb town_name AL FINAL: el returns
--      table canvia i cal drop + create, amb els mateixos revoke i grant.
-- Cap política, taula ni funció nova; cap permís retirat. Additiva i
-- idempotent: es pot tornar a executar.
--
-- Revisada i NO aplicada a cap base de dades: l'aplica el Mestre. Va després
-- de 2610081400 (i, per tant, de 2610072230) i ABANS de publicar el client:
-- sense ella, desar el poble d'una organització torna PGRST204 (la columna no
-- existix) i la interfície ho diu amb l'avís de columna absent. Abans
-- d'aplicar-la, la consulta de només lectura
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'organization_directory'
--    order by ordinal_position;
-- ha de tornar les 14 columnes de 2609262232, acabades en copyright. Si la
-- vista viva en té alguna altra (una columna afegida a mà), el CREATE OR
-- REPLACE falla, la transacció es desfà sencera i cal revisar-la abans.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · La columna i el seu límit ───────────────────────────────────────────
alter table public.organizations
  add column if not exists town_name text;

alter table public.organizations
  drop constraint if exists organizations_town_name_llargaria;
alter table public.organizations
  add constraint organizations_town_name_llargaria check (char_length(town_name) <= 120);

-- ── 2 · Permisos de columna ─────────────────────────────────────────────────
grant select (town_name) on table public.organizations to anon, authenticated;
grant update (town_name) on table public.organizations to authenticated;

-- ── 3 · El directori públic ─────────────────────────────────────────────────
-- Còpia de 2609262232 amb town_name al final.
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
  copyright,
  town_name
from public.organizations
where visibility = 'public';

revoke all on table public.organization_directory from public, anon, authenticated;
grant select on table public.organization_directory to anon, authenticated;

-- ── 4 · Les organitzacions de la persona ────────────────────────────────────
-- Còpia de 2609262232 amb town_name al final. El returns table canvia:
-- create or replace no ho admet, cal esborrar-la.
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
  copyright text,
  town_name text
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
    organization.copyright,
    organization.town_name
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

notify pgrst, 'reload schema';
commit;
