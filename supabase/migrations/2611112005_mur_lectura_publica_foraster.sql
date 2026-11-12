-- ============================================================================
-- 261111_2005 · P0 Visibilitat del Mur de Poble (Foraster i Inter-Poble)
--
-- PROBLEMA DETECTAT EN PRODUCCIÓ (11-11-2026):
--   La política original "public read section_submissions" (2609080000:764)
--   exigia `(select private.is_town_member(tenant_id))` per a TOT SELECT,
--   incloent-hi les seccions públiques ('mur', 'mercat', 'events', 'multimedia').
--   Com que `private.is_town_member` retorna FALSE quan `auth.uid()` és NULL
--   (visitants sense sessió / Foraster) o quan el veí pertany a un altre poble,
--   qualsevol persona sense login rebia 0 publicacions veïnals al Mur i a les
--   pestanyes públiques de `/pobles/...` (`usePublicacionsDelPoble.js`).
--
-- SOLUCIÓ DE MÍNIM PRIVILEGI (core-seguretat-audit §3.D i §3.E):
--   1. Concessió explícita per columnes públiques de lectura a `anon` i
--      `authenticated` (cap accés d'escriptura per a `anon`).
--   2. Llista blanca explícita de les quatre seccions públiques
--      (`section_id in ('mur', 'mercat', 'events', 'multimedia')`) vinculades
--      a un poble existent (`public.towns`), sense usar mai `using (true)`.
--   3. Les files amb `section_id = 'notes'` es mantenen estrictament privades
--      per al seu propietari autenticat membre del poble.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

grant select (
  id, tenant_id, section_id, owner_user_id, author_org_id,
  title, description, payload, created_at, updated_at
) on table public.section_submissions to anon, authenticated;

drop policy if exists "public read section_submissions" on public.section_submissions;
create policy "public read section_submissions" on public.section_submissions for select
to anon, authenticated
using (
  (
    section_id in ('mur', 'mercat', 'events', 'multimedia')
    and exists (
      select 1 from public.towns t
      where t.id = section_submissions.tenant_id
    )
  )
  or (
    section_id = 'notes'
    and owner_user_id = (select auth.uid())
    and (select private.is_town_member(tenant_id))
  )
);

commit;

