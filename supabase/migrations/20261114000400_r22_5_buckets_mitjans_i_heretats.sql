-- ============================================================================
-- 20261114000400 · R22.5 · Buckets: límits de mitjans i tancament dels heretats
-- (arrel R10, D-BUCKETS, del receptari de l'Eix B, dossier de Fable 5.2).
-- NO aplicada: la revisa i l'aplica el Mestre, mai un agent.
--
-- S'APLICA NOMÉS DESPRÉS DE LA CÒPIA DE SEGURETAT I DE BAIXAR ELS OBJECTES
-- (R01): pg_dump no salva els fitxers de Storage, només les files de
-- storage.objects (B-storage-5). Esta migració no esborra cap objecte ni cap
-- bucket, però tanca la lectura pública de tres buckets amb fitxers vius.
--
-- Còpia literal de la proposta v2 amb l'esmena del contrast
-- (gauntlet/proves_verificadors/eixb-contrasta-storage-2-k5z8/
-- proposta_d_buckets_v2_amb_esmena_del_contrast.sql, sha256
-- 6fac60edbf7c4f3a54767dee74ba8db53fc2255039291b04523f9ccf88f9f728), amb
-- només dos afegits: aquesta capçalera i «notify pgrst» abans del commit.
--   0 · Precondició: els tres buckets vius (mitjans, mitjans_privats i
--       xat_adjunts) han d'existir (SDP-BUCKETS-001).
--   1 · mitjans: públic, 5 MiB i només WebP, JPEG, PNG i AVIF (2609130500).
--   2 · chat_attachments, images i profiles (heretats de gener de 2026)
--       deixen de ser públics. Cap objecte es mou ni s'esborra.
--   3 · Fora les 12 polítiques fetes a mà al Dashboard sobre eixos buckets.
--   4 · Frontera restrictiva per llista explícita de buckets: un bucket nou
--       o una política permissiva nova no obri res sense una migració.
--       service_role (BYPASSRLS) no hi passa: el worker i el Dashboard
--       continuen.
--   5 · «mitjans llegir» només per als objectes propis d'authenticated (el
--       mateix efecte que hui amb les restrictives r21_v2; les URL públiques
--       no passen per la RLS).
--   6 · Invariant a la base: un objecte de mitjans només pot ser una imatge
--       de 5 MiB com a molt, també per «move» o «copy» des d'un altre bucket
--       (SDP-MITJANS-001 i 002, 22023).
--   7 · Comprovació final de l'estat promés (SDP-BUCKETS-002 a 004) i,
--       esmena del contrast, cap objecte de mitjans que ja trenque
--       l'invariant (SDP-BUCKETS-005: cal retirar-lo abans).
--
-- Contradicció de Git que decidix el Mestre: el CHECK de R22.1
-- (profiles_hero_video_url_valida) admet sdp-media://mitjans/….mp4|webm, i
-- ara mitjans només admet imatges. El client no puja vídeos a Storage
-- (src/data/supabase/storage.js), i si algú n'ha deixat cap a mitjans la
-- migració avorta amb SDP-BUCKETS-005 en lloc de deixar-lo trencat. La sonda
-- prèvia ha de donar videos_de_capcalera_a_mitjans = 0.
--
-- Ordre d'aplicació (Runbook del Mestre, apartat 2.0, pas 8): després de la
-- còpia de seguretat, de baixar els objectes i de la 20261114000100. Depén de
-- 2609130500, 2609200300 i 20261113112500.
--
-- Avís de plataforma: a Supabase, storage.objects és de supabase_storage_admin.
-- CREATE OR REPLACE TRIGGER només demana el privilegi TRIGGER, que postgres
-- hi té (q10); per això la v2 no fa DROP TRIGGER. En local, la prova aplica la
-- migració com a rol sense superusuari.
--
-- Irreversible i FORA d'esta migració: esborrar els 24 fitxers de comptes que
-- ja no existixen (B-storage-3), només després de baixar-los.
--
-- Com tornar enrere (dins d'una transacció): update storage.buckets set
-- public = true where id in ('chat_attachments', 'images', 'profiles'); drop
-- policy if exists "r22 frontera de buckets" on storage.objects; i, si cal,
-- tornar a crear les polítiques heretades (text literal a q14). Els objectes
-- no es toquen.
--
-- Abans (lectura):
-- select b.id, b.public, b.file_size_limit, b.allowed_mime_types from storage.buckets b order by 1;
-- select count(*) filter (where o.metadata ->> 'mimetype' like 'video/%') as videos_a_mitjans, count(*) as objectes_a_mitjans from storage.objects o where o.bucket_id = 'mitjans';
-- Verificació posterior (lectura):
-- select b.id, b.public from storage.buckets b where b.public order by 1;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- 0 · Els tres buckets vius han d'existir: una actualització de zero files no és cap èxit.
do $$
begin
  if (select count(*) from storage.buckets where id in ('mitjans', 'mitjans_privats', 'xat_adjunts')) <> 3 then
    raise exception 'SDP-BUCKETS-001: falta un bucket viu (mitjans, mitjans_privats o xat_adjunts).';
  end if;
end $$;

-- 1 · `mitjans`: els límits de 2609130500 (a producció eren NULL el 13-11-2026).
update storage.buckets
   set public = true,
       file_size_limit = 5242880,
       allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/avif']
 where id = 'mitjans';

-- 2 · Buckets heretats: deixen de ser públics. Cap objecte es mou ni s'esborra.
update storage.buckets
   set public = false
 where id in ('chat_attachments', 'images', 'profiles');

-- 3 · Les 12 polítiques creades a mà al Dashboard (noms literals de pg_policies).
drop policy if exists "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_0" on storage.objects;
drop policy if exists "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_1" on storage.objects;
drop policy if exists "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_2" on storage.objects;
drop policy if exists "Només l'amo de la foto pot esborrar-la o editar-la 1ffg0oo_3" on storage.objects;
drop policy if exists "Permetre pujada d'imatges només a registrats 1ffg0oo_0" on storage.objects;
drop policy if exists "Permetre pujada només a usuaris registrats 1ffg0oo_0" on storage.objects;
drop policy if exists "Permetre pujada només a usuaris registrats 5i2qmh_0" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public read access" on storage.objects;
drop policy if exists "Users can update their own profile images" on storage.objects;
drop policy if exists "Users can upload their own profile images" on storage.objects;
drop policy if exists "Users can view chat attachments" on storage.objects;

-- 4 · Frontera per llista explícita. Un bucket nou (o una política permissiva
--     creada al Dashboard) no obri res fins que una migració l'afig ací.
--     service_role no hi passa (BYPASSRLS): el worker de purga i el Dashboard continuen.
drop policy if exists "r22 frontera de buckets" on storage.objects;
create policy "r22 frontera de buckets" on storage.objects
as restrictive for all to public
using (bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts'))
with check (bucket_id in ('mitjans', 'mitjans_privats', 'xat_adjunts'));

-- 5 · `mitjans llegir` sense SELECT ample: el mateix efecte que hui (la permissiva
--     de 2609130500 ∧ les restrictives r21_v2), i l'avís 0025 de l'Advisor deixa de
--     tindre motiu. Les URL públiques no passen per la RLS.
drop policy if exists "mitjans llegir" on storage.objects;
create policy "mitjans llegir" on storage.objects for select to authenticated
using (bucket_id = 'mitjans' and coalesce(owner_id, owner::text) = (select auth.uid())::text);

-- 6 · L'invariant del bucket públic, a la base. El límit del bucket és un camp
--     editable al Dashboard i Storage només el mira en la pujada directa: un
--     `move` des de mitjans_privats (PDF de 24 MB) o un `copy` des de xat_adjunts
--     (vídeo de 20 MB) hi entraven igualment. La sonda de permisos de Storage no
--     porta `size`; l'escriptura final, sí.
create or replace function private.mitjans_public_nomes_imatges()
returns trigger language plpgsql set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.metadata, '{}'::jsonb);
  v_mime text := lower(btrim(split_part(v_meta ->> 'mimetype', ';', 1)));
begin
  if v_meta ? 'mimetype' and v_mime not in ('image/webp', 'image/jpeg', 'image/png', 'image/avif') then
    raise exception 'SDP-MITJANS-001: el bucket públic només admet imatges WebP, JPEG, PNG o AVIF.' using errcode = '22023';
  end if;
  if (jsonb_typeof(v_meta -> 'size') = 'number' and (v_meta ->> 'size')::numeric > 5242880)
    or (jsonb_typeof(v_meta -> 'contentLength') = 'number' and (v_meta ->> 'contentLength')::numeric > 5242880) then
    raise exception 'SDP-MITJANS-002: el bucket públic no admet fitxers de més de 5 MiB.' using errcode = '22023';
  end if;
  if v_meta ? 'size' and not (v_meta ? 'mimetype') then
    raise exception 'SDP-MITJANS-001: objecte sense tipus declarat.' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.mitjans_public_nomes_imatges() from public, anon, authenticated;
-- CREATE OR REPLACE (PostgreSQL 14+): només demana el privilegi TRIGGER, que `postgres` té sobre
-- storage.objects (q10: postgres=a*r*w*d*D*x*t*m*). Un DROP TRIGGER demana ser propietari de la
-- taula (supabase_storage_admin) i, en una segona aplicació, dependria d'una excepció de plataforma.
create or replace trigger mitjans_public_nomes_imatges before insert or update on storage.objects
for each row when (new.bucket_id = 'mitjans') execute function private.mitjans_public_nomes_imatges();

-- 7 · Comprovació final: l'estat que la migració promet.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'mitjans' and public and file_size_limit = 5242880
      and allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/avif']) then
    raise exception 'SDP-BUCKETS-002: mitjans no ha quedat amb els límits canònics.';
  end if;
  if exists (select 1 from storage.buckets where public and id <> 'mitjans') then
    raise exception 'SDP-BUCKETS-003: queda un bucket públic que no és mitjans.';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and concat_ws(' ', qual, with_check) ~ '''(chat_attachments|images|profiles)''') then
    raise exception 'SDP-BUCKETS-004: queda una política que anomena un bucket heretat.';
  end if;
  -- ESMENA DEL CONTRAST (dins del bloc 7 de proposta_d_buckets_v2.sql, abans del `end $;`):
  -- l'invariant nou no pot nàixer damunt d'objectes que ja el trenquen. Mentre `mitjans` no té
  -- límits, qualsevol compte hi pot deixar un fitxer no conforme; després de la migració eixa fila
  -- continuaria pública i cap UPDATE la podria tocar (ni el servei).
  if exists (select 1 from storage.objects o where o.bucket_id = 'mitjans'
      and ((o.metadata ? 'mimetype' and lower(btrim(split_part(o.metadata ->> 'mimetype', ';', 1)))
              not in ('image/webp', 'image/jpeg', 'image/png', 'image/avif'))
        or (jsonb_typeof(o.metadata -> 'size') = 'number' and (o.metadata ->> 'size')::numeric > 5242880)
        or (o.metadata ? 'size' and not (o.metadata ? 'mimetype')))) then
    raise exception 'SDP-BUCKETS-005: mitjans ja porta objectes que no complixen l''invariant; cal retirar-los abans.';
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
