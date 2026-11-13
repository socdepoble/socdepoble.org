-- R21.6 · Reassert the existing public-content boundary, without replacing data.
-- Observed production GET exposed app_content keys notes/noteFolders, while
-- 2609200300 and 2610101900 explicitly exclude them from the public catalogue.
-- Requires 2609140000 and 2610061448 (the real AAL2 es_superadmin helper).
-- No remote application has been performed by this source migration.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.app_content enable row level security;
-- Reassert the three canonical 2610101900 policies, including a deployment
-- stopped at the older 2609200300 seven-key frontier. Only these known policy
-- names are replaced; no unknown/custom policy is dropped generically.
drop policy if exists "app_content lectura publica" on public.app_content;
create policy "app_content lectura publica" on public.app_content
  for select to anon, authenticated
  using (key in ('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil'));
drop policy if exists "sdp app_content anon frontera" on public.app_content;
create policy "sdp app_content anon frontera" on public.app_content
  as restrictive for select to anon
  using (key in ('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil'));
drop policy if exists "sdp app_content auth frontera" on public.app_content;
create policy "sdp app_content auth frontera" on public.app_content
  as restrictive for select to authenticated
  using (key in ('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil')
    or (select private.es_superadmin()));
-- Restrictive guards cannot be bypassed by an old/permissive USING(true).
-- A new key needs an explicit visibility decision. 'agents' stays private;
-- R21.5 safely hydrates the three public canonical identities in the client.
drop policy if exists "r21_6 app_content anon frontera" on public.app_content;
create policy "r21_6 app_content anon frontera" on public.app_content
  as restrictive for select to anon
  using (key in ('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil'));
drop policy if exists "r21_6 app_content auth frontera" on public.app_content;
create policy "r21_6 app_content auth frontera" on public.app_content
  as restrictive for select to authenticated
  using (key in ('towns','pages','feedPosts','marketItems','events','mediaItems','onboarding','taxonomia','estil')
    or (select private.es_superadmin()));

-- Personal notes use owner RLS; they have no anonymous table capability.
-- Revoke PUBLIC as well, so inherited privileges cannot restore anon SELECT.
-- The additional restrictive policy still denies rows if a stale grant or
-- permissive policy is accidentally replayed later; authenticated is unchanged.
alter table public.notes enable row level security;
revoke all on table public.notes from public, anon;
drop policy if exists "r21_6 notes anon frontera" on public.notes;
create policy "r21_6 notes anon frontera" on public.notes
  as restrictive for select to anon using (false);
drop policy if exists "r21_6 notes auth frontera" on public.notes;
create policy "r21_6 notes auth frontera" on public.notes
  as restrictive for select to authenticated
  using (owner_user_id = (select auth.uid()) and (select private.is_town_member(tenant_id)));

notify pgrst, 'reload schema';
commit;
