-- ============================================================================
-- 261024_2320 · C11-02 (auditoria Codex 261024_2254, CWE-200; full de ruta
-- P1-11 del Mestre, 261024) · El correu d'accés de la propietària, només per
-- a ella
--
-- QUÈ CORREGIX:
--   public.contacte_organitzacio (2610181915) admet qualsevol owner o admin
--   (private.can_manage_organization) i, a més del correu corporatiu, tornava
--   com a `correu_per_defecte` el correu d'ACCÉS (auth.users.email) de la
--   propietària a QUALSEVOL d'ells: una coadministradora veia el correu
--   personal amb què la propietària entra al seu compte.
--   desa_contacte_organitzacio torna el resultat d'esta mateixa funció, i
--   heretava la mateixa exposició.
--
-- QUÈ FA:
--   1. Torna a crear contacte_organitzacio amb el mateix contracte (mateixa
--      signatura, mateixes columnes, mateixos errors SDP-ORGMAIL-000/001) i una
--      sola diferència: el correu d'accés només es llig si la propietària és
--      qui mira (m.user_id = v_uid). Per a una administradora, '' (el client ja
--      ho normalitza a null: «perDefecte.correu només ve ple si qui mira n'és
--      la titular», src/sections/profile/contacteOrganitzacio.js, i el model
--      local fa el mateix, localPerfils.js · contacteVist). El correu
--      corporatiu (contact_email) i l'opt-in públic, com abans, per a tota
--      persona que l'administra.
--   2. desa_contacte_organitzacio NO es toca: crida esta funció i hereta la
--      correcció.
--   3. Els mateixos REVOKE/GRANT d'execució (només authenticated).
--
-- QUÈ NO FA: cap columna, taula, política ni permís nou; no toca
-- contact_email ni public_email. La carrera de l'alta concurrent de membres
-- (C11-03) i la projecció pública del contacte (C11-05) queden pendents.
--
-- Idempotent (CREATE OR REPLACE amb la mateixa signatura). Va després de
-- 2610181915 i de 2610211715. Verificació posterior (amb dues sessions de
-- prova: la propietària A i una administradora B de la mateixa organització),
-- com B: select correu_per_defecte from public.contacte_organitzacio('<org>');
-- ha de tornar '' i, com A, el seu correu d'accés.
--
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

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

  -- C11-02 · El correu d'accés només el veu la mateixa propietària.
  select u.email
  into v_owner_email
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id
  where m.organization_id = p_organization_id
    and m.role = 'owner'
    and m.user_id = v_uid
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

notify pgrst, 'reload schema';

commit;
