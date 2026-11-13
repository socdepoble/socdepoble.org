-- ============================================================================
-- 20261113060000 · R22.1 · El vídeo principal de la capçalera (hero_video_url)
-- Gauntlet R22.1, r221-dades-03, r221-dades-06 i r221-ui-04 (decisió de
-- l'integrador, Carril 1): el client ja escriu hero_video_url a profiles i a
-- organizations, però cap migració creava la columna, el seu CHECK ni els seus
-- permisos, i cap camí de lectura no la tornava: el vídeo d'una organització
-- s'escrivia i no es llegia.
--
-- Additiva i idempotent: es pot tornar a executar sense canviar res.
--   1. profiles.hero_video_url i organizations.hero_video_url (text, null =
--      sense vídeo) amb un CHECK per taula, el mateix sobre que hero_url
--      (2609261500) més el format de vídeo: buit, o com a molt 2.048
--      caràcters sense caràcters de control ni barra inversa, i o una
--      referència opaca del bucket PÚBLIC (sdp-media://mitjans/…, mai
--      mitjans_privats, que cap visitant pot signar, ni '..'), o un https://
--      amb camí, o un camí propi (/x, una sola barra), sempre acabat en .mp4
--      o .webm (abans de ? o #). L'origen propi d'un https (la finestra i els
--      orígens del node) és configuració de cada node: el CHECK no el pot
--      saber i el comproven el client en desar (valorPerDesar,
--      esVideoDeCapcaleraDesable) i en pintar (fontVideoPropia).
--   2. Permisos de columna: UPDATE per a authenticated a les dues taules (la
--      fila la continuen protegint les polítiques «profiles update own» i
--      «gestores actualitzen l'organització»); SELECT de la columna nova
--      d'organizations per a anon i authenticated, com hero_url. profiles ja
--      té SELECT de taula per a authenticated (2609110600).
--   3. public.organization_directory amb hero_video_url AL FINAL: còpia de
--      2610281730 (CREATE OR REPLACE VIEW només admet columnes noves al final).
--   4. public.list_my_organizations(uuid) amb hero_video_url al final: còpia
--      de 2610081401 (drop + create, el returns table canvia), amb els
--      mateixos revoke i grant. L'editor torna a llegir el vídeo desat.
--   5. public.perfil_public(uuid) amb hero_video_url al final, només a la
--      fitxa sencera (com hero_url): còpia de 2610282100 (drop + create), amb
--      els mateixos revoke i grant.
-- Cap política, taula ni dada nova; cap permís retirat; cap fila escrita.
--
-- Depén de 2609261500, 2610081401, 2610160250, 2610281730 i 2610282100.
-- Va després de 20261113003000 (ordre de l'onada R22). NO aplicada a cap base
-- remota: l'aplica el Mestre. El client no la requerix per a arrencar: sense
-- ella, la fila no porta la columna, el panell del vídeo no s'oferix
-- (admetVideoDeCapcalera) i el directori la lleva del select (42703).
--
-- Abans d'aplicar-la, consulta de lectura prèvia (les 16 columnes de
-- 2610281730, acabades en correu_public; si la vista viva en té alguna altra,
-- el CREATE OR REPLACE falla i la transacció es desfà sencera):
--   select column_name from information_schema.columns where table_schema = 'public' and table_name = 'organization_directory' order by ordinal_position;
-- Abans d'aplicar-la, consulta de lectura: si ja hi ha la columna (creada a
-- mà amb l'SQL del README del kit), cal mirar-ne les files abans, perquè una
-- que trencara el CHECK nou faria fallar l'ALTER i res no canviaria:
--   select table_name from information_schema.columns where table_schema = 'public' and table_name in ('profiles', 'organizations') and column_name = 'hero_video_url';
-- Després d'aplicar-la, verificació posterior de només lectura:
--   select table_name, column_name from information_schema.columns where table_schema = 'public' and column_name = 'hero_video_url' order by table_name;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Les columnes i el seu CHECK ─────────────────────────────────────────
alter table public.profiles
  add column if not exists hero_video_url text;
alter table public.organizations
  add column if not exists hero_video_url text;

alter table public.profiles
  drop constraint if exists profiles_hero_video_url_valida;
alter table public.profiles
  add constraint profiles_hero_video_url_valida check (
    hero_video_url is null
    or hero_video_url = ''
    or (
      char_length(hero_video_url) <= 2048
      and hero_video_url !~ '[[:cntrl:]\\]'
      and (
        (hero_video_url ~* '^sdp-media://mitjans/[a-z0-9._/-]{1,200}\.(mp4|webm)$' and hero_video_url !~ '\.\.')
        or hero_video_url ~* '^https://[^/?#[:space:]]+/[^?#]*\.(mp4|webm)([?#].*)?$'
        or hero_video_url ~* '^/[^/][^?#]*\.(mp4|webm)([?#].*)?$'
      )
    )
  );

alter table public.organizations
  drop constraint if exists organizations_hero_video_url_valida;
alter table public.organizations
  add constraint organizations_hero_video_url_valida check (
    hero_video_url is null
    or hero_video_url = ''
    or (
      char_length(hero_video_url) <= 2048
      and hero_video_url !~ '[[:cntrl:]\\]'
      and (
        (hero_video_url ~* '^sdp-media://mitjans/[a-z0-9._/-]{1,200}\.(mp4|webm)$' and hero_video_url !~ '\.\.')
        or hero_video_url ~* '^https://[^/?#[:space:]]+/[^?#]*\.(mp4|webm)([?#].*)?$'
        or hero_video_url ~* '^/[^/][^?#]*\.(mp4|webm)([?#].*)?$'
      )
    )
  );

-- ── 2 · Permisos de columna ─────────────────────────────────────────────────
grant update (hero_video_url) on table public.profiles to authenticated;
grant select (hero_video_url) on table public.organizations to anon, authenticated;
grant update (hero_video_url) on table public.organizations to authenticated;

-- ── 3 · El directori públic ─────────────────────────────────────────────────
-- Còpia de 2610281730 amb hero_video_url al final.
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
  town_name,
  correu_public,
  hero_video_url
from public.organizations
where visibility = 'public';

revoke all on table public.organization_directory from public, anon, authenticated;
grant select on table public.organization_directory to anon, authenticated;

-- ── 4 · Les organitzacions de la persona ────────────────────────────────────
-- Còpia de 2610081401 amb hero_video_url al final.
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
  town_name text,
  hero_video_url text
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
    organization.town_name,
    organization.hero_video_url
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

-- ── 5 · La fitxa d'una altra persona ────────────────────────────────────────
-- Còpia de 2610282100 amb hero_video_url al final, només a la fitxa sencera.
drop function if exists public.perfil_public(uuid);
create function public.perfil_public(p_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  town_name text,
  hero_url text,
  lema text,
  bio text,
  presentacio_html text,
  copyright text,
  icon text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz,
  usuari text,
  hero_video_url text
)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-PERFIL-010: cal la sessió iniciada.' using errcode = '42501';
  end if;
  return query
  select p.id, p.full_name, p.avatar_url, p.town_name,
    case when d.sencera then p.hero_url end,
    case when d.sencera then p.lema end,
    case when d.sencera then p.bio end,
    case when d.sencera then p.presentacio_html end,
    case when d.sencera then p.copyright end,
    case when d.sencera then p.icon end,
    case when d.sencera then coalesce(p.is_public, false) else false end,
    case when d.sencera then p.created_at end,
    case when d.sencera then p.updated_at end,
    case when d.sencera then p.username end,
    case when d.sencera then p.hero_video_url end
  from public.profiles p
  cross join lateral (select (p.id = v_jo or coalesce(p.is_public, false)) as sencera) d
  where p.id = p_id
    and p.baixa_demanada_at is null
    and (d.sencera or exists (
      select 1
      from public.town_memberships tm_jo
      join public.town_memberships tm_ella on tm_ella.town_id = tm_jo.town_id
      where tm_jo.user_id = v_jo
        and tm_ella.user_id = p.id));
end;
$$;
revoke execute on function public.perfil_public(uuid) from public, anon;
grant execute on function public.perfil_public(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
