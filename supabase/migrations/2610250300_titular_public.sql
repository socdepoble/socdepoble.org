-- ============================================================================
-- 261025_0300 · IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16;
-- pla 261025_0200) · La persona titular d'una entitat a /connectar, NOMÉS si
-- ella ho ha triat
--
-- PER QUÈ: la Directiva diu que, si connectes amb una empresa i la persona
-- propietària té el perfil públic, a la mateixa pantalla t'hi has de poder
-- connectar també. Però cap lectura no torna qui administra una entitat, i ho
-- fa a posta (2610250100, i R-1 de l'informe 261025_0100): un perfil públic
-- no és cap permís per a lligar una persona a un negoci, ni a la vista de
-- tot el veïnat. Per això la titular es mostra per una tria seua (opt-in):
-- la fa la propietària i ningú més, i es pot desfer quan vulga.
--
-- QUÈ FA:
--   1. public.organization_memberships.titular_public (boolean not null
--      default false): totes les files d'abans queden en false, i ningú no
--      es mostra sense haver-ho triat.
--   2. Un disparador BEFORE INSERT OR UPDATE (private.titular_public_nomes_owner)
--      que torna la columna a false en tota fila que no és d'owner: si la
--      propietat canvia de mans, la tria de la vella no es queda viva ni
--      ressuscita si un dia hi torna; la nova propietària no hereta cap tria.
--   3. Permisos de la taula (mandat Supabase 30-Oct-2026, Llei E), reafirmats:
--      anon i authenticated no hi escriuen (cap INSERT, UPDATE ni DELETE); la
--      columna només es canvia per la RPC del punt 4. La lectura de la taula
--      no canvia (la política «members read own memberships» de 2609080000:
--      la pròpia fila, o qui administra l'organització).
--   4. public.marca_titular_public(p_org_id uuid, p_public boolean) → boolean
--      i public.estat_titular_public(p_org_id uuid) → boolean: NOMÉS la
--      propietària (user_id = auth.uid() i role = 'owner') desa o llig la
--      seua tria; una administradora no la pot fer per ella (SDP-TIT-001).
--   5. public.titular_public(p_org_id uuid) → table(id, full_name,
--      avatar_url): com a molt una fila, i només si (i) la pertinença és
--      d'owner (mai una administradora ni qui ha publicat res), (ii) ella ho
--      ha triat (titular_public), (iii) el seu perfil és públic (is_public;
--      un null no ho és) i no ha demanat la baixa, (iv) l'organització és
--      pública i (v) cap bloqueig no la separa de qui mira (cap dels dos
--      sentits de public.bloquejos). Si no, cap fila, sense dir per què. Mai
--      cap correu ni cap rol.
--   Totes tres, SECURITY DEFINER amb el search_path buit i execució només per
--   a authenticated (com perfil_public, 2610021520): sense sessió, res.
--
-- QUÈ NO FA (decisions del Mestre pendents, supabase/README.md):
--   · No mostra cap administradora ni cap membre: només la propietària.
--   · No canvia perfil_public, organization_directory, qui_em_segueix ni cap
--     lectura que ja hi havia: sense la tria, ningú no veu res nou.
--   · No tanca la via que ja existix (informe del rastrejador, §3): una
--     publicació signada com a entitat porta owner_user_id, que llig
--     qualsevol veïna del poble. Esta migració no la toca ni en depén.
--   · No avisa ningú: la tria no envia cap missatge.
--   · No toca cap altre disparador: l'UPDATE de la tria torna a passar per
--     sdp_una_propietaria (2609080000) i xat_alta_gestor_entitat
--     (2609272200), que amb el mateix rol no canvien res (on conflict do
--     nothing); per això només s'actualitza si la tria canvia.
--   · No restringix la lectura de la columna a la mateixa propietària: qui
--     administra l'organització ja llig totes les seues pertinences
--     (2609080000) i hi veurà la tria, que de tota manera és pública quan val.
--
-- CODIS (missatges en valencià; l'adaptador els llig pel prefix):
--   SDP-TIT-000 cal la sessió iniciada (42501)
--   SDP-TIT-001 no n'ets la propietària, o l'organització no existix (42501)
--   SDP-TIT-002 la tria no és vàlida (22023)
--   titular_public no en llança cap: torna zero files.
--
-- Depén de: 2609080000 (public.organizations, public.organization_memberships
-- i la seua política de lectura), 2609261500
-- (public.profiles.baixa_demanada_at), 2610021520 (public.profiles.is_public
-- i el model de perfil_public) i, si hi és, public.bloquejos (2610201500):
-- sense ella, cap bloqueig no compta.
--
-- Idempotent i en una sola transacció. Va després de 2610250100 i ABANS de
-- publicar el client que la llig (capacitats 'titularPublic' i
-- 'consentimentTitular'); sense ella, el client no mostra cap titular.
-- Verificació posterior (lectura):
--   select count(*) filter (where titular_public) from public.organization_memberships;
--   (0 just després d'aplicar-la) i, amb la propietària A d'una organització
--   pública: select public.marca_titular_public('<org>', true); i, com una
--   altra persona amb sessió, select * from public.titular_public('<org>');
--   (una fila, la d'A, només si el seu perfil és públic).
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · La tria, en la pertinença de la propietària ────────────────────────
alter table public.organization_memberships
  add column if not exists titular_public boolean not null default false;

-- ── 2 · La tria només viu en una fila d'owner ──────────────────────────────
create or replace function private.titular_public_nomes_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from 'owner' then
    new.titular_public := false;
  end if;
  return new;
end;
$$;
-- Com private.xat_alta_gestor_entitat (2609272200): cap client no la crida; el disparador, sí.
revoke all on function private.titular_public_nomes_owner() from public, anon, authenticated;

drop trigger if exists sdp_titular_public_nomes_owner on public.organization_memberships;
create trigger sdp_titular_public_nomes_owner
  before insert or update on public.organization_memberships
  for each row execute function private.titular_public_nomes_owner();

-- ── 3 · Permisos de la taula (mandat Supabase 30-Oct-2026), reafirmats ─────
-- Ningú no hi escriu des del client: la tria va per marca_titular_public.
revoke insert, update, delete on table public.organization_memberships from public, anon, authenticated;

-- ── 4 · La tria de la propietària ──────────────────────────────────────────
create or replace function public.marca_titular_public(p_org_id uuid, p_public boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo    uuid := (select auth.uid());
  v_valor boolean;
begin
  if v_jo is null then
    raise exception 'SDP-TIT-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_public is null then
    raise exception 'SDP-TIT-002: la tria no és vàlida.' using errcode = '22023';
  end if;
  -- Només la fila de la propietària que crida, i només si canvia.
  update public.organization_memberships m
     set titular_public = p_public
   where m.organization_id = p_org_id
     and m.user_id = v_jo
     and m.role = 'owner'
     and m.titular_public is distinct from p_public;
  select m.titular_public into v_valor
    from public.organization_memberships m
   where m.organization_id = p_org_id
     and m.user_id = v_jo
     and m.role = 'owner'
   limit 1;
  if not found then
    raise exception 'SDP-TIT-001: només la propietària de l''organització pot triar si es mostra com a titular.' using errcode = '42501';
  end if;
  return v_valor;
end;
$$;
revoke all on function public.marca_titular_public(uuid, boolean) from public, anon, authenticated, service_role;
grant execute on function public.marca_titular_public(uuid, boolean) to authenticated;

create or replace function public.estat_titular_public(p_org_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_jo    uuid := (select auth.uid());
  v_valor boolean;
begin
  if v_jo is null then
    raise exception 'SDP-TIT-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select m.titular_public into v_valor
    from public.organization_memberships m
   where m.organization_id = p_org_id
     and m.user_id = v_jo
     and m.role = 'owner'
   limit 1;
  if not found then
    raise exception 'SDP-TIT-001: només la propietària de l''organització pot triar si es mostra com a titular.' using errcode = '42501';
  end if;
  return v_valor;
end;
$$;
revoke all on function public.estat_titular_public(uuid) from public, anon, authenticated, service_role;
grant execute on function public.estat_titular_public(uuid) to authenticated;

-- ── 5 · La lectura de qui mira ─────────────────────────────────────────────
create or replace function public.titular_public(p_org_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo      uuid := (select auth.uid());
  v_titular uuid;
begin
  if v_jo is null or p_org_id is null then
    return;
  end if;
  -- (i) owner, (ii) la seua tria, (iii) perfil públic i sense baixa, (iv) organització pública.
  select m.user_id into v_titular
    from public.organizations o
    join public.organization_memberships m on m.organization_id = o.id
    join public.profiles p on p.id = m.user_id
   where o.id = p_org_id
     and o.visibility = 'public'
     and m.role = 'owner'
     and m.titular_public
     and coalesce(p.is_public, false)
     and p.baixa_demanada_at is null
   limit 1;
  if v_titular is null then
    return;
  end if;
  -- (v) Cap bloqueig entre qui mira i la titular, en cap dels dos sentits.
  -- La consulta a public.bloquejos va en un IF propi: PL/pgSQL planifica
  -- l'expressió sencera abans d'avaluar-la, i amb un sol `and` una base
  -- sense la taula fallaria amb 42P01 en lloc de no comptar cap bloqueig
  -- (revisió adversarial del torn 261025_0200, reproduït en PostgreSQL 17).
  if to_regclass('public.bloquejos') is not null then
    if exists (
         select 1 from public.bloquejos b
          where (b.bloquejador = v_jo and b.bloquejat_persona = v_titular)
             or (b.bloquejador = v_titular and b.bloquejat_persona = v_jo)) then
      return;
    end if;
  end if;
  return query
  select p.id, p.full_name, p.avatar_url
    from public.profiles p
   where p.id = v_titular;
end;
$$;
revoke all on function public.titular_public(uuid) from public, anon, authenticated, service_role;
grant execute on function public.titular_public(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
