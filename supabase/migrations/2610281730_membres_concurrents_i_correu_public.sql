-- ============================================================================
-- 261028_1730 · P1-13 (C11-03 i C11-05; auditoria Codex 261024_2254 i
-- 261028_1611 C28-08; pla 261028_1526, §3.6.1) · L'alta concurrent de membres
-- d'una organització i el correu que l'organització ha triat fer públic
--
-- QUÈ CORREGIX:
--   C11-03 · public.desa_membre_organitzacio (2610181915, còpia de
--   2610081402) bloqueja la fila de la persona amb `select … for update`
--   abans de decidir. Si la persona encara NO és membre, no hi ha cap fila
--   que bloquejar: v_actual queda null, la guarda SDP-ORGMEM-006
--   ((v_role = 'admin' or v_actual = 'admin') and v_meu is distinct from
--   'owner') no salta per a una alta de member, i l'UPSERT (`on conflict …
--   do update set role = excluded.role`) espera l'alta sense confirmar de
--   l'altra sessió i, quan esta confirma, la sobreescriu. Amb dues sessions:
--   la propietària O dona d'alta X com a admin mentre l'administradora A la
--   dona d'alta com a member; O confirma i l'UPSERT d'A degrada X a member.
--   Trenca «només la propietària nomena, degrada o lleva administradores».
--   C11-05 · El correu de contacte que una organització ha fet públic
--   (public_email = true) no arriba mai a la fitxa pública en remot: la vista
--   public.organization_directory (2610081401) no el projecta, i el client
--   (src/data/supabase/perfils.js) llegia `public_email`, que és un booleà,
--   com si fora el correu: sempre ''. El model local sí que el mostra
--   (src/data/localPerfils.js): remot i local divergien. contact_email no es
--   pot projectar a la vista: és security_invoker, i anon necessitaria el
--   SELECT de la columna privada, que 2610181915 i 2610211715 li lleven a
--   posta.
--
-- QUÈ FA:
--   1. C11-03 · Torna a crear desa_membre_organitzacio amb la mateixa
--      signatura i el mateix contracte (columnes, codis i errcodes), còpia de
--      2610181915 amb tres canvis i cap més: (a) la variable v_n; (b)
--      pg_advisory_xact_lock per parell (organització, persona) just abans del
--      `select … for update`: dues crides sobre el mateix parell es fan una
--      darrere l'altra fins al commit de la primera, i la segona (READ
--      COMMITTED: cada sentència veu el que ja s'ha confirmat) llig el rol que
--      la primera ha desat, i la guarda 006 salta; (c) defensa en profunditat
--      per als escriptors que no passen per esta funció: el DO UPDATE de
--      l'UPSERT només s'aplica si la fila no és d'owner i, si qui crida no és
--      la propietària, si ni la fila ni el rol nou són d'admin; si no ha
--      escrit cap fila (row_count = 0), SDP-ORGMEM-006 i la transacció es desfà.
--   2. Els mateixos REVOKE/GRANT d'execució (només authenticated).
--   3. C11-05 · public.organizations.correu_public: una columna generada
--      (stored) = case when public_email is true then
--      nullif(btrim(contact_email), '') end. Només porta el correu quan
--      l'organització l'ha fet públic; si no, null. Ningú no la pot escriure
--      (és generada) i Postgres la recalcula a cada canvi de contact_email o
--      de public_email.
--   4. SELECT d'eixa columna, i només d'eixa, per a anon i authenticated (com
--      public_email). Cap permís de taula sencera ni d'escriptura; contact_email
--      continua sense SELECT per a cap rol públic.
--   5. public.organization_directory, la de 2610081401 amb correu_public AL
--      FINAL: les mateixes 15 columnes en el mateix ordre, el mateix filtre
--      visibility = 'public', security_invoker i security_barrier, i els
--      mateixos revoke i grant (CREATE OR REPLACE VIEW només admet columnes
--      noves al final).
--
-- QUÈ NO FA:
--   · No toca lleva_membre_organitzacio (sobre una fila absent torna false,
--     que no fa mal) ni membres_organitzacio, ni la branca de les
--     organitzacions membres (on conflict do nothing).
--   · El pany consultiu només ordena les crides que passen per esta funció.
--     Els altres escriptors de public.organization_memberships (el disparador
--     d'owner de create_organization, la baixa de 2610241440,
--     marca_titular_public de 2610250300) només els frena el WHERE de l'UPSERT.
--   · El rol de qui crida (v_meu) es llig sense pany: si la propietària la
--     degrada just en eixe instant, la crida en curs encara veu el d'abans
--     (impacte baix).
--   · No valida en SQL la forma de contact_email: el client la valida abans
--     de fer-ne un mailto (src/sections/profile/contacteOrganitzacio.js).
--   · No restringix el correu triat a qui té sessió: qui el fa públic, el fa
--     públic per a tothom, també per a anon (com la fitxa pública i el model
--     local). Si el Mestre el vol només amb sessió, cal una lectura SECURITY
--     DEFINER en lloc d'una columna de la vista.
--   · No afig correu_public al llistat del directori del client
--     (src/data/supabase/organizations.js · COLUMNES_DIRECTORI): el llistat
--     continua sense cap correu (contracte.js · directoriEntitats).
--   · Cap taula, política ni funció privada nova.
--
-- CODIS: cap de nou. Reutilitza SDP-ORGMEM-006 (42501), «només la propietària
-- nomena, degrada o lleva administradores», que el client ja tradueix
-- (src/data/contracte.js · MISSATGES_MEMBRES_ORGANITZACIO).
--
-- Depén de: 2610081401 (la vista, amb town_name al final), 2610181915
-- (contact_email, public_email i desa_membre_organitzacio), 2610211715 (el
-- REVOKE de contact_email), 2610242320 (contacte_organitzacio sense el correu
-- d'accés de la propietària) i 2610250300 (el disparador de titular_public,
-- que l'UPSERT travessa sense canvis).
--
-- ABANS D'APLICAR-LA (lectura; el resultat s'ha de guardar):
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'organization_directory'
--    order by ordinal_position;
--   ha de tornar les 15 columnes de 2610081401, acabades en town_name. Si la
--   vista viva en té alguna altra, el CREATE OR REPLACE falla, la transacció
--   es desfà sencera i cal revisar-la abans. I
--   select r.rolname, has_column_privilege(r.rolname, 'public.organizations', 'contact_email', 'select')
--     from (values ('anon'), ('authenticated')) as r(rolname);
--   ha de tornar false a les dues files (2610211715 aplicada).
--
-- DESPRÉS D'APLICAR-LA (lectura):
--   select r.rolname,
--          has_column_privilege(r.rolname, 'public.organizations', 'contact_email', 'select') as privat,
--          has_column_privilege(r.rolname, 'public.organizations', 'correu_public', 'select') as public
--     from (values ('anon'), ('authenticated')) as r(rolname);
--   (privat false i public true a les dues files) i
--   select count(*) from public.organizations where public_email is not true and correu_public is not null;
--   (0).
--
-- VERIFICACIÓ MANUAL AMB DUES SESSIONS (C11-03; en una base de prova, mai en
-- la de producció): una organització G, la seua propietària O, una
-- administradora A i una persona X del poble que encara no n'és membre. En
-- dues finestres de psql (o del SQL Editor) obertes alhora:
--   Sessió 1: begin;
--             select set_config('request.jwt.claims', '{"sub":"<O>","role":"authenticated"}', true);
--             set local role authenticated;
--             select * from public.desa_membre_organitzacio('<G>', '<X>', 'persona', 'admin');
--             (no confirmes encara)
--   Sessió 2: begin;
--             select set_config('request.jwt.claims', '{"sub":"<A>","role":"authenticated"}', true);
--             set local role authenticated;
--             select * from public.desa_membre_organitzacio('<G>', '<X>', 'persona', 'member');
--             (es queda esperant el pany de la sessió 1)
--   Sessió 1: commit;
--   Sessió 2: falla amb SDP-ORGMEM-006 (42501); rollback;
--   Després: select role from public.organization_memberships
--             where organization_id = '<G>' and user_id = '<X>';
--   ha de tornar admin. Abans d'esta migració, la sessió 2 confirmava i hi
--   tornava member.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE amb la mateixa
-- signatura) i en una sola transacció. Afegir la columna generada reescriu
-- public.organizations amb un pany ACCESS EXCLUSIVE: la taula és menuda i el
-- lock_timeout és de 5 s. Va després de 2610250300. L'ordre amb el client és
-- lliure: perfils.js llig correu_public si hi és i, sense la columna, torna ''
-- com abans. Les proves estàtiques són
-- src/data/supabase/membresConcurrents.migracio.test.js.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · C11-03 · L'alta o el canvi de rol d'un membre, sense carrera ────────
-- Còpia de 2610181915 amb tres canvis, marcats amb C11-03.
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
  v_n       integer := 0;
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
    -- C11-03 · Una crida darrere l'altra per a cada parell: la fila absent no es pot bloquejar.
    perform pg_advisory_xact_lock(hashtextextended('sdp-orgmem:' || p_organization_id::text || ':' || p_membre_id::text, 0));
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
      -- C11-03 · Defensa en profunditat: mai sobre una owner, ni sobre o cap a admin si no ho fa la propietària.
      insert into public.organization_memberships as actual (organization_id, tenant_id, user_id, role)
      values (p_organization_id, v_tenant, p_membre_id, v_role)
      on conflict (organization_id, user_id) do update set role = excluded.role
      where actual.role <> 'owner'
        and (v_meu = 'owner' or (actual.role <> 'admin' and excluded.role <> 'admin'));
      get diagnostics v_n = row_count;
      if v_n = 0 then
        raise exception 'SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores.' using errcode = '42501';
      end if;
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

-- ── 2 · C11-05 · El correu triat, una columna generada ──────────────────────
alter table public.organizations
  add column if not exists correu_public text
  generated always as (case when public_email is true then nullif(btrim(contact_email), '') end) stored;
grant select (correu_public) on table public.organizations to anon, authenticated;

-- ── 3 · C11-05 · El directori públic ────────────────────────────────────────
-- Còpia de 2610081401 amb correu_public al final.
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
  correu_public
from public.organizations
where visibility = 'public';

revoke all on table public.organization_directory from public, anon, authenticated;
grant select on table public.organization_directory to anon, authenticated;

notify pgrst, 'reload schema';
commit;
