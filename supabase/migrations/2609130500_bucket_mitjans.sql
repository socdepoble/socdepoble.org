-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: BUCKET DE MITJANS
-- Data: 2026-09-13
-- Motiu: Fase 4. Trau les imatges de base64 dins de user_metadata i
--        profiles.avatar_url. Escriptura només a la carpeta pròpia.
-- ═════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mitjans', 'mitjans', true, 5242880,
        array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = excluded.allowed_mime_types;
-- alter table storage.objects enable row level security;
drop policy if exists "mitjans llegir" on storage.objects;
create policy "mitjans llegir" on storage.objects for select to anon, authenticated
  using (bucket_id = 'mitjans');

drop policy if exists "mitjans pujar propis" on storage.objects;
create policy "mitjans pujar propis" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mitjans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "mitjans actualitzar propis" on storage.objects;
create policy "mitjans actualitzar propis" on storage.objects for update to authenticated
  using (bucket_id = 'mitjans' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'mitjans' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "mitjans esborrar propis" on storage.objects;
create policy "mitjans esborrar propis" on storage.objects for delete to authenticated
  using (bucket_id = 'mitjans' and (storage.foldername(name))[1] = (select auth.uid())::text);
