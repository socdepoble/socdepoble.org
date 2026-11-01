-- ============================================================================
-- 261101_1500 · D-6 (informe 261101_0409; prompt 261101_1246, carril T7) · Un
-- ajuntament només signa publicacions del seu poble
--
-- Procedència: la decisió D-6 de l'informe de la marató nocturna del 261101
-- (Fediversity), feta tasca a l'assalt 261101_1246 (T7, peça S1). El «town_id»
-- del pla és tenant_id, tant a public.organizations com a
-- public.section_submissions (organizations.town_name és un altre camp, de
-- text lliure, que no diu res de l'autoritat).
--
-- QUÈ CORREGIX:
--   Les alertes municipals del Mur (src/sections/mur/alertesMunicipals.js) les
--   decidix l'AUTORIA: una publicació signada (section_submissions.author_org_id)
--   per una entitat de kind 'city_hall'. La CHECK
--   section_submissions_autoria_org_valida (2609261200, amb el cos de
--   2609261500) només demana que qui escriu siga la propietària o una
--   administradora de l'entitat: no mira el poble. Una administradora d'un
--   ajuntament podia signar com a ajuntament una publicació d'un ALTRE poble
--   del mateix node, i el Mur d'eixe poble la pintava com a alerta municipal.
--
-- QUÈ FA:
--   1. public.pot_signar_com_organitzacio(p_org_id uuid, p_tenant_id uuid):
--      el cos de 2609261500 (LANGUAGE sql, STABLE, SECURITY DEFINER, el
--      search_path buit; la propietària o una administradora; sense entitat,
--      cert) amb un JOIN a public.organizations i una condició més: si
--      l'entitat és un ajuntament (kind 'city_hall'), el seu tenant_id ha de
--      ser el de la publicació.
--   2. EXECUTE només per a authenticated (la CHECK l'avalua amb el rol de qui
--      escriu); revocat a public i anon.
--   3. Torna a crear la CHECK section_submissions_autoria_org_valida amb
--      (author_org_id, tenant_id), NOT VALID: les files d'abans no es
--      revaliden; cada INSERT i cada UPDATE nou, sí.
--   4. Esborra la signatura vella pot_signar_com_organitzacio(uuid): cap
--      sobrecàrrega per a PostgREST ni cap camí que se salte el poble. Quan
--      s'esborra, la CHECK nova ja no en depén.
--
-- QUÈ NO FA:
--   · Les empreses, els grups i les entitats no canvien: signen on signaven.
--     D-6 és l'autoritat de les alertes, que només fan els ajuntaments; amb
--     la divisió de tenants del node remot (memòria 261022), restringir-les
--     totes podria tallar publicacions legítimes.
--   · Cap política RLS, cap taula, cap columna, cap codi d'error nou: una
--     escriptura rebutjada torna el 23514 (check_violation) de sempre.
--   · No toca cap fila: les publicacions d'abans es conserven (NOT VALID). Una
--     d'un ajuntament signada en un altre poble ja no es pot tornar a desar
--     signada per l'ajuntament; sí que es pot passar a la persona
--     (author_org_id null). Les actualitzacions del servidor (baixa,
--     anonimització) ja filtren author_org_id is null (2609261500,
--     2609291200, 2610241440): la CHECK nova no les toca.
--   · No canvia el client: el directori públic (useAjuntamentsDelMur.js)
--     continua dient qui és un ajuntament, i el Mur no mira el poble.
--
-- Depén de: 2609261200 (la CHECK i la columna author_org_id), 2609261500 (el
-- cos amb el search_path buit).
--
-- Abans (lectura): les publicacions signades per una entitat d'un altre
-- poble, per tipus d'entitat:
--   select o.kind, count(*) from public.section_submissions s
--     join public.organizations o on o.id = s.author_org_id
--    where s.tenant_id <> o.tenant_id group by 1;
-- Si torna alguna fila city_hall, eixes publicacions es conserven, però ja no
-- es poden desar signades per l'ajuntament. Al node remot les entitats viuen
-- al poble llavor i les persones potser en un altre (memòria 261022): cal
-- mirar-ho abans d'aplicar.
-- I cada ajuntament, encara que no haja signat res: el seu poble, els pobles
-- de les seues propietàries i administradores i els pobles on han publicat:
--   select o.id, o.name, o.tenant_id,
--     (select array_agg(distinct tm.town_id) from public.organization_memberships m
--        join public.town_memberships tm on tm.user_id = m.user_id
--       where m.organization_id = o.id and m.role in ('owner', 'admin')) as pobles_administradores,
--     (select array_agg(distinct s.tenant_id) from public.organization_memberships m
--        join public.section_submissions s on s.owner_user_id = m.user_id
--       where m.organization_id = o.id and m.role in ('owner', 'admin')) as pobles_on_publiquen
--   from public.organizations o where o.kind = 'city_hall';
-- Un poble d'eixes dues llistes que no siga el tenant_id de l'ajuntament és
-- un poble on, després de D-6, l'ajuntament ja no podrà signar (el primer
-- bàndol signat hi rebria el 23514): cal decidir-ho abans d'aplicar.
--
-- Després (lectura): una sola signatura, la de dos arguments:
--   select p.oid::regprocedure from pg_proc p
--    where p.proname = 'pot_signar_com_organitzacio';
--
-- Desfer (inversa, a mà i en una sola transacció; torna a l'estat de
-- 2609261500):
--   create or replace function public.pot_signar_com_organitzacio(p_org_id uuid)
--   returns boolean language sql stable security definer set search_path = ''
--   as $$ select p_org_id is null or exists (select 1 from public.organization_memberships m where m.organization_id = p_org_id and m.user_id = (select auth.uid()) and m.role in ('owner', 'admin')); $$;
--   revoke execute on function public.pot_signar_com_organitzacio(uuid) from public, anon;
--   grant execute on function public.pot_signar_com_organitzacio(uuid) to authenticated;
--   alter table public.section_submissions drop constraint if exists section_submissions_autoria_org_valida;
--   alter table public.section_submissions add constraint section_submissions_autoria_org_valida check (public.pot_signar_com_organitzacio(author_org_id)) not valid;
--   drop function if exists public.pot_signar_com_organitzacio(uuid, uuid);
--
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.pot_signar_com_organitzacio(p_org_id uuid, p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_org_id is null
    or exists (
      select 1
      from public.organization_memberships m
      join public.organizations o on o.id = m.organization_id
      where m.organization_id = p_org_id
        and m.user_id = (select auth.uid())
        and m.role in ('owner', 'admin')
        and (o.kind <> 'city_hall' or o.tenant_id = p_tenant_id)
    );
$$;

revoke execute on function public.pot_signar_com_organitzacio(uuid, uuid) from public, anon;
grant execute on function public.pot_signar_com_organitzacio(uuid, uuid) to authenticated;

alter table public.section_submissions
  drop constraint if exists section_submissions_autoria_org_valida;
alter table public.section_submissions
  add constraint section_submissions_autoria_org_valida
  check (public.pot_signar_com_organitzacio(author_org_id, tenant_id)) not valid;

drop function if exists public.pot_signar_com_organitzacio(uuid);

notify pgrst, 'reload schema';

commit;
