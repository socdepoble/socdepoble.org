-- Aquesta migració resol un deute tècnic indicat per l'auditoria (Fase 4/5):
-- La funció private.es_superadmin() retorna boolean, i en algunes condicions extremes
-- podria retornar NULL, la qual cosa generaria fallades silencioses en algunes polítiques RLS.
-- Apliquem COALESCE per forçar sempre un false si no hi ha valor.

-- 1. Taula: organization_claims
drop policy if exists "llig les propies reclamacions" on public.organization_claims;
create policy "llig les propies reclamacions" on public.organization_claims
for select to authenticated
using (user_id = (select auth.uid()) or coalesce((select private.es_superadmin()), false));

-- 2. Taula: profiles (la política va ser sobreescrita a la migració 260912_1500)
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated
using (
  (select auth.uid()) is not null and (
      id = (select auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.town_memberships m1
        JOIN public.town_memberships m2 ON m1.town_id = m2.town_id
        WHERE m1.user_id = (select auth.uid())
        AND m2.user_id = profiles.id
      )
  )
  OR coalesce((select private.es_superadmin()), false)
);

-- 3. Taula: app_content
drop policy if exists "public read app_content" on public.app_content;
create policy "public read app_content" on public.app_content for select using (
  key != 'agents' or coalesce((select private.es_superadmin()), false)
);
