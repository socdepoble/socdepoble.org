-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: BUCKET DE MITJANS PRIVATS (F11)
-- Data: 2026-09-19
-- Motiu: Emmagatzematge privat per a adjunts de notes (Opció C).
-- ═════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mitjans_privats', 'mitjans_privats', false, 25242880,
        array['image/webp','image/jpeg','image/png','image/avif', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 25242880,
      allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

-- Lectura: Propietari o Membre del tenant
drop policy if exists "mitjans_privats llegir propis o tenant" on storage.objects;
create policy "mitjans_privats llegir propis o tenant" on storage.objects for select to authenticated
  using (
    bucket_id = 'mitjans_privats'
    and (
      (storage.foldername(name))[2] = (select auth.uid())::text
      or (select private.is_town_member(((storage.foldername(name))[1])::uuid))
    )
  );

-- Pujada: Cal ser el propietari i membre del tenant on es puja
drop policy if exists "mitjans_privats pujar propis" on storage.objects;
create policy "mitjans_privats pujar propis" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mitjans_privats'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and (select private.is_town_member(((storage.foldername(name))[1])::uuid))
  );

drop policy if exists "mitjans_privats actualitzar propis" on storage.objects;
create policy "mitjans_privats actualitzar propis" on storage.objects for update to authenticated
  using (bucket_id = 'mitjans_privats' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'mitjans_privats' and (storage.foldername(name))[2] = (select auth.uid())::text);

drop policy if exists "mitjans_privats esborrar propis" on storage.objects;
create policy "mitjans_privats esborrar propis" on storage.objects for delete to authenticated
  using (bucket_id = 'mitjans_privats' and (storage.foldername(name))[2] = (select auth.uid())::text);
