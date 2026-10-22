-- ============================================================================
-- 261022_0240 · Gauntlet 261022_0225 (Tasca 3) · Adjunts privats del xat
-- (foto, nota de veu i vídeo de fins a 10 s) i quota rural de 20 MB per
-- persona. Disseny de GPT Codex; reparat per Gauntlet 261022_0225 (crítica
-- Claude), troballes F1-F14 i revisió R1-R8.
-- NO aplicada: cap agent no l'executa contra cap base remota.
-- L'aplica el Mestre, mai un agent.
-- Va ABANS de publicar el client que envia adjunts: sense ella, l'adaptador
-- (src/data/supabase/xatMultimedia.js) diu 'sense-capacitat'.
--
-- PREREQUISITS (aplicades de veres): 2609261500 (private.purga_storage_pendent),
-- 2609270200 i 2609272200 (seq, es_participant, seq_visible, es_admin_del_fil),
-- 2609282100 (xat_fils_meus v4, aplicada al node remot el 261009), 2610081543
-- (la signatura vigent de xat_envia) i un storage-api amb storage.operation()
-- i storage.objects.owner_id i version (provat amb v1.79.36). El rol que
-- l'aplica ha de poder crear un disparador sobre storage.objects; si no pot,
-- la transacció sencera es desfà. pg_cron, opcional.
--
-- QUÈ FA:
--   1. public.xat_adjunts · Una reserva per adjunt. L'id és alhora el del
--      missatge i el nom opac de l'objecte (ni l'uid ni el fil a la ruta).
--      MIME tancat i sostre per tipus (private.xat_maxim_adjunt, que només
--      llig la reserva): foto WebP o JPEG fins a 2 MB, veu fins a 3 MB, vídeo
--      MP4, WebM o QuickTime fins a 20 MB i 10 s declarats; 64 bytes com a
--      mínim. El CHECK xat_adjunts_mida de la taula només fixa 64 bytes - 20 MB.
--   2. El bucket privat xat_adjunts (20 MB per objecte, la mateixa llista MIME).
--   3. Polítiques de storage.objects: llig qui ha reservat (abans de publicar)
--      o qui participa i veu el missatge (després, i només la versió
--      publicada), i ningú no llista el bucket; puja només qui ha reservat eixe
--      nom fa menys de 15 minuts, amb el MIME i el Content-Length reservats;
--      esborra només qui descarta el seu pendent; ningú no modifica i anon no
--      hi entra.
--   4. El disparador private.xat_escriptura_final, només per a l'escriptura
--      final de Storage.
--   5. Les RPC del client: xat_quota, xat_reserva_adjunt, xat_cancella_reserva,
--      xat_prepara_descart, xat_publica_adjunt i xat_llegix_adjunt.
--   6. xat_fils_meus v5: la v4 de 2609282100 sencera més ultim_tipus.
--   7. private.xat_neteja_adjunts, cada hora amb pg_cron si hi és: allibera
--      les reserves velles, els pendents d'un dia i els adjunts dels missatges
--      caducats o esborrats, i posa a la cua els objectes sense reserva.
--
-- EL FLUX REAL DE STORAGE (F1 i R1). storage-api fa tres passos: (a) una sonda
-- de permisos, un INSERT com a authenticated amb metadata {mimetype,
-- contentLength} que desfà tot seguit; (b) els bytes al backend; (c)
-- l'escriptura final com a superusuari, amb metadata {size, mimetype}: no
-- passa per la RLS, però sí pels disparadors. La política d'inserció valida
-- la sonda. El disparador valida l'escriptura final (la que porta 'size'):
-- la reserva encara viva, ni publicada ni en descart, de qui puja, amb la
-- mida i el MIME exactes, sota el pany de la fila; cancel·lar a mitja pujada
-- la fa fallar i no queda cap objecte. xat_publica_adjunt ho torna a
-- comprovar (owner_id i created_at inclosos) i fixa la versió que es podrà
-- llegir. La pujada és un POST de cos cru (o TUS) amb Content-Type i
-- Content-Length iguals als de la reserva: el .upload() de supabase-js amb un
-- Blob o un File envia multipart (la llargària de tot el formulari) i Storage
-- el rebutja amb 403.
--
-- CODIS: SDP-XAT-001 sense sessió; 006 no eres participant o l'adjunt ja no hi
-- és; 008 identificador d'un altre enviament, d'un objecte orfe o a la cua de
-- purga; 009 paràmetre invàlid; 011 comunitat o canal sense permís; 020 quota
-- de 20 MB esgotada o fitxer per damunt del sostre del seu tipus; 021 el
-- fitxer no coincidix, falta confirmar-lo o s'està descartant; 022 deu
-- fitxers pendents sense publicar (esperar no ajuda: cal enviar-ne o
-- descartar-ne); 429 seixanta adjunts vius reservats en l'última hora (una
-- reserva cancel·lada no compta: no deixa res). En aplicar-la, SDP-XAT-903
-- (avís) si pg_cron no està actiu: la neteja queda per programar.
--
-- LÍMITS CONEGUTS: la durada del vídeo i de la veu és la que declara el client
-- (el servidor no descodifica); el binari d'una reserva alliberada queda a
-- private.purga_storage_pendent fins que existisca el worker que buida la cua
-- amb service_role, i fins llavors continua comptant en la quota de qui el va
-- pujar; el missatge sense peu es desa amb text null, i la llista de converses
-- diu «Cap missatge.» fins que el client llija ultim_tipus. Un sostre de
-- private.xat_maxim_adjunt es pot canviar després amb una migració nova: només
-- afecta les reserves noves.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Gauntlet 261022_0225 (crítica Claude), F12 i F14 · El sostre de cada tipus,
-- en un sol lloc: només la reserva el llig (revisió R7: cap CHECK en depén, i
-- canviar-lo no invalida cap fila desada ni cap restauració). Sense PNG (el
-- client ja no en puja: MEDIA-3) i amb el QuickTime de l'iPhone.
create function private.xat_maxim_adjunt(p_mime text) returns bigint
language sql immutable set search_path = '' as $$
  select (case
    when p_mime in ('image/webp', 'image/jpeg') then 2000000
    when p_mime in ('audio/mp4', 'audio/webm', 'audio/ogg') then 3000000
    when p_mime in ('video/mp4', 'video/webm', 'video/quicktime') then 20000000
  end)::bigint;
$$;
-- Gauntlet 261022_0225 (crítica Claude), F5 · El nom de l'objecte com a uuid
-- canònic (en minúscules), o null: les cerques van per la clau primària.
create function private.xat_id_de_ruta(p_ruta text) returns uuid
language sql immutable set search_path = '' as $$
  select case when p_ruta ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p_ruta::uuid end;
$$;
revoke all on function private.xat_maxim_adjunt(text), private.xat_id_de_ruta(text) from public, anon, authenticated;

create table public.xat_adjunts (
  id uuid primary key,
  usuari_id uuid not null references public.profiles(id) on delete cascade,
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  bytes bigint not null,
  mime text not null check (mime in ('image/webp','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg')),
  durada_ms integer,
  versio text,
  publicat boolean not null default false,
  cancellant boolean not null default false,
  creat_al timestamptz not null default now(),
  constraint xat_adjunts_mida check (bytes between 64 and 20000000),
  check ((mime like 'image/%' and durada_ms is null)
    or (mime like 'video/%' and durada_ms is not null and durada_ms between 1 and 10000)
    or (mime like 'audio/%' and durada_ms is not null and durada_ms > 0))
);
-- F5 · Quota, pendents i freqüència per persona; la cascada d'un fil; la neteja.
create index xat_adjunts_usuari_creat on public.xat_adjunts(usuari_id, creat_al);
create index xat_adjunts_fil on public.xat_adjunts(fil_id);
create index xat_adjunts_pendents on public.xat_adjunts(creat_al) where not publicat;
alter table public.xat_adjunts enable row level security;
-- Gauntlet 261022_0225 (crítica Claude), F10 · Llei E i mandat Supabase
-- 30-Oct-2026: tot revocat i el permís explícit, com a 2610201500. El client
-- només entra per les RPC; service_role, per a la moderació i el worker.
revoke all on table public.xat_adjunts from public, anon, authenticated, service_role;
grant select, delete on table public.xat_adjunts to service_role;

-- La baixa de perfil o de fil elimina la reserva per cascada. El fitxer
-- físic passa a la cua canònica; mai s'esborra storage.objects a mà.
create function private.xat_adjunt_a_purga() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'xat_adjunts'
    and name = old.id::text) then
    insert into private.purga_storage_pendent(user_id, bucket_id, nom, referenciat)
    values (old.usuari_id, 'xat_adjunts', old.id::text, false)
    on conflict (bucket_id, nom) do nothing;
  end if;
  return old;
end;
$$;
revoke all on function private.xat_adjunt_a_purga() from public, anon, authenticated;
create trigger xat_adjunt_a_purga after delete on public.xat_adjunts
  for each row execute function private.xat_adjunt_a_purga();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('xat_adjunts', 'xat_adjunts', false, 20000000,
  array['image/webp','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Després de publicar només es llig la versió que xat_publica_adjunt ha fixat:
-- un upsert tardà ja el rebutja el disparador; si n'escapara cap, l'adjunt
-- quedaria il·legible, no canviat.
create function private.xat_llegible_adjunt(p_ruta text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.xat_adjunts a
    left join public.xat_missatges m on m.id = a.id
    where a.id = private.xat_id_de_ruta(p_ruta)
      and ((not a.publicat and a.usuari_id = (select auth.uid()))
        or (a.publicat and m.esborrat_al is null and (m.caduca_al is null or m.caduca_al > now())
          and private.es_participant(a.fil_id) and private.seq_visible(a.fil_id, m.seq)
          and exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts'
            and o.name = p_ruta and o.version is not distinct from a.versio))));
$$;
-- Gauntlet 261022_0225 (crítica Claude), F1 · La sonda de storage-api:
-- reserva pròpia i oberta, de fa menys de 15 minuts, amb el MIME (sense
-- paràmetres) i el Content-Length reservats. Sense eixes dues claus, no.
-- Només la pujada directa (POST) o TUS, que repetix la sonda a cada tros amb
-- la llargària total: la URL de pujada signada faria la sonda amb les
-- capçaleres de la petició de signar i pujaria després sense RLS.
create function private.xat_pujable_adjunt(p_ruta text, p_metadata jsonb) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.xat_adjunts a where not a.publicat and not a.cancellant
    and a.usuari_id = (select auth.uid()) and private.es_participant(a.fil_id)
    and a.id = private.xat_id_de_ruta(p_ruta)
    and a.creat_al > now() - interval '15 minutes'
    and storage.operation() in ('storage.object.upload', 'storage.tus.upload.create', 'storage.tus.upload.part')
    and lower(btrim(split_part(p_metadata->>'mimetype', ';', 1))) = a.mime
    and case when jsonb_typeof(p_metadata->'contentLength') = 'number'
      then (p_metadata->>'contentLength')::numeric = a.bytes else false end);
$$;
create function private.xat_esborrable_adjunt(p_ruta text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.xat_adjunts a where not a.publicat and a.cancellant
    and a.usuari_id = (select auth.uid()) and a.id = private.xat_id_de_ruta(p_ruta));
$$;
revoke all on function private.xat_llegible_adjunt(text), private.xat_pujable_adjunt(text, jsonb), private.xat_esborrable_adjunt(text) from public, anon;
grant execute on function private.xat_llegible_adjunt(text), private.xat_pujable_adjunt(text, jsonb), private.xat_esborrable_adjunt(text) to authenticated;

-- Gauntlet 261022_0225 (crítica Claude, revisió R6) · Ningú no llista el
-- bucket: el client no en fa cap i, sense esta guarda, el llistat d'una
-- persona de fora avaluaria la funció per a cada objecte. coalesce: les RPC
-- (xat_llegix_adjunt, xat_publica_adjunt) no porten operació de Storage.
create policy "xat adjunts lectura" on storage.objects for select to authenticated
  using (bucket_id = 'xat_adjunts' and coalesce(storage.operation(), '') not in ('storage.object.list', 'storage.object.list_v2', 'storage.s3.object.list')
    and private.xat_llegible_adjunt(name));
create policy "xat adjunts pujada" on storage.objects for insert to authenticated
  with check (bucket_id = 'xat_adjunts' and private.xat_pujable_adjunt(name, metadata));
-- Fronteres restrictives: altres polítiques permissives del node no obrin el bucket.
create policy "xat adjunts frontera lectura" on storage.objects as restrictive for select to authenticated
  using (bucket_id <> 'xat_adjunts' or (coalesce(storage.operation(), '') not in ('storage.object.list', 'storage.object.list_v2', 'storage.s3.object.list')
    and private.xat_llegible_adjunt(name)));
create policy "xat adjunts frontera pujada" on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'xat_adjunts' or private.xat_pujable_adjunt(name, metadata));
create policy "xat adjunts sense canvi" on storage.objects as restrictive for update to authenticated
  using (bucket_id <> 'xat_adjunts') with check (bucket_id <> 'xat_adjunts');
create policy "xat adjunts baixa pendent" on storage.objects for delete to authenticated
  using (bucket_id = 'xat_adjunts' and private.xat_esborrable_adjunt(name));
create policy "xat adjunts frontera baixa" on storage.objects as restrictive for delete to authenticated
  using (bucket_id <> 'xat_adjunts' or private.xat_esborrable_adjunt(name));
create policy "xat adjunts anon tancat" on storage.objects as restrictive for all to anon
  using (bucket_id <> 'xat_adjunts') with check (bucket_id <> 'xat_adjunts');

-- Gauntlet 261022_0225 (crítica Claude, revisió R1) · L'escriptura final de
-- storage-api (superusuari, sense RLS) porta metadata.size; la sonda, no, i
-- la valida la política. Sota el pany de la fila: una cancel·lació a mitja
-- pujada, un descart o un upsert damunt d'un publicat fan fallar l'escriptura
-- i no queda cap objecte sense reserva ni fora de la quota.
create function private.xat_escriptura_final() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.xat_adjunts%rowtype;
begin
  if not (coalesce(new.metadata, '{}'::jsonb) ? 'size') then return new; end if;
  select * into a from public.xat_adjunts where id = private.xat_id_de_ruta(new.name) for update;
  if not found or a.publicat or a.cancellant or new.owner_id is distinct from a.usuari_id::text
    or lower(btrim(split_part(new.metadata->>'mimetype', ';', 1))) is distinct from a.mime
    or (case when jsonb_typeof(new.metadata->'size') = 'number'
      then (new.metadata->>'size')::numeric <> a.bytes else true end) then
    raise exception 'SDP-XAT-021: el fitxer no coincidix amb la reserva.' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.xat_escriptura_final() from public, anon, authenticated;
create trigger xat_escriptura_final before insert or update on storage.objects
  for each row when (new.bucket_id = 'xat_adjunts') execute function private.xat_escriptura_final();

-- Gauntlet 261022_0225 (crítica Claude, revisió R2) · Alliberar una fila no
-- buida el bucket: el binari que espera el worker a la cua de purga continua
-- comptant en la quota de qui el va pujar fins que el worker el purga.
create function private.xat_bytes_en_purga(p_usuari uuid) returns bigint
language sql stable set search_path = '' as $$
  select coalesce(sum(case when jsonb_typeof(o.metadata->'size') = 'number' then (o.metadata->>'size')::numeric else 0 end), 0)::bigint
  from private.purga_storage_pendent p
  join storage.objects o on o.bucket_id = p.bucket_id and o.name = p.nom
  where p.bucket_id = 'xat_adjunts' and p.user_id = p_usuari and p.feta_al is null;
$$;
revoke all on function private.xat_bytes_en_purga(uuid) from public, anon, authenticated;
create index purga_storage_pendent_xat_usuari on private.purga_storage_pendent(user_id)
  where bucket_id = 'xat_adjunts' and feta_al is null;

create function public.xat_quota() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  return jsonb_build_object('usats', coalesce((select sum(bytes) from public.xat_adjunts where usuari_id = (select auth.uid())), 0)
      + private.xat_bytes_en_purga((select auth.uid())), 'limit', 20000000,
    'pendents', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'bytes', bytes, 'mime', mime))
      from public.xat_adjunts where usuari_id = (select auth.uid()) and not publicat), '[]'::jsonb));
end;
$$;

create function public.xat_reserva_adjunt(p_id uuid, p_fil_id uuid, p_bytes bigint, p_mime text, p_durada_ms integer default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype; v_total bigint; v_caduc uuid;
  v_pendents integer; v_recents integer; v_pujat boolean;
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  if not private.es_participant(p_fil_id) then raise exception 'SDP-XAT-006: no eres membre del fil.' using errcode = '42501'; end if;
  if exists (select 1 from public.xat_fils where id = p_fil_id and tipus = 'comunitat') then
    raise exception 'SDP-XAT-011: esta comunitat no admet missatges directes.' using errcode = '42501';
  end if;
  if exists (select 1 from public.xat_fils where id = p_fil_id and tipus = 'canal')
    and not private.es_admin_del_fil(p_fil_id) then
    raise exception 'SDP-XAT-011: només els administradors poden escriure.' using errcode = '42501';
  end if;
  -- F12 · Format i mida del tipus abans de cap pany.
  if p_id is null or p_bytes is null or p_bytes < 64 or private.xat_maxim_adjunt(p_mime) is null then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if p_bytes > private.xat_maxim_adjunt(p_mime) then
    raise exception 'SDP-XAT-020: el fitxer passa del sostre del seu tipus.' using errcode = '23514';
  end if;
  -- Un sol lock per persona, també si puja a dos fils o des de dos dispositius.
  perform pg_advisory_xact_lock(hashtextextended('xat:quota:' || v_jo::text, 0));
  -- La sonda de Storage no pren cap pany (F1) i només admet reserves de menys
  -- de 15 minuts; esta neteja, les d'una hora sense objecte. Si una pujada
  -- lenta encara és en curs, el disparador la fa fallar (R1).
  for v_caduc in select id from public.xat_adjunts
    where usuari_id = v_jo and not publicat and creat_al < now() - interval '1 hour' for update
  loop
    delete from public.xat_adjunts cad where cad.id = v_caduc and not cad.publicat
      and not exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts' and o.name = cad.id::text);
  end loop;
  select * into a from public.xat_adjunts where id = p_id for update;
  if found then
    if a.cancellant then raise exception 'SDP-XAT-021: este adjunt s’està descartant.' using errcode = '22023'; end if;
    if a.usuari_id <> v_jo or a.fil_id <> p_fil_id or a.bytes <> p_bytes or a.mime <> p_mime
      or a.durada_ms is distinct from p_durada_ms then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    v_pujat := exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text);
    -- El reintent sense objecte renova la finestra de pujada.
    if not a.publicat and not v_pujat then
      update public.xat_adjunts set creat_al = now() where id = p_id;
    end if;
  else
    -- Gauntlet 261022_0225 (crítica Claude), F2 · Un objecte orfe (compte o
    -- fil esborrat) o ja a la cua de purga no el torna a adoptar ningú.
    if exists (select 1 from public.xat_missatges where id = p_id)
      or exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text)
      or exists (select 1 from private.purga_storage_pendent where bucket_id = 'xat_adjunts' and nom = p_id::text) then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    -- Gauntlet 261022_0225 (crítica Claude), F3 i revisió R4 i R5 · Deu
    -- pendents com a molt, amb codi propi (esperar no ajuda: cal enviar-ne o
    -- descartar-ne), i seixanta adjunts vius reservats en l'última hora (una
    -- reserva cancel·lada no compta perquè no deixa res).
    select count(*) filter (where not publicat), count(*) filter (where creat_al > now() - interval '1 hour')
      into v_pendents, v_recents from public.xat_adjunts where usuari_id = v_jo;
    if v_pendents >= 10 then
      raise exception 'SDP-XAT-022: tens massa fitxers pendents d’enviar.' using errcode = '42900';
    end if;
    if v_recents >= 60 then
      raise exception 'SDP-XAT-429: has reservat massa fitxers en poc de temps.' using errcode = '42900';
    end if;
    select coalesce(sum(bytes), 0) + private.xat_bytes_en_purga(v_jo) into v_total from public.xat_adjunts where usuari_id = v_jo;
    if v_total + p_bytes > 20000000 then
      raise exception 'SDP-XAT-020: quota de 20 MB esgotada.' using errcode = '23514';
    end if;
    insert into public.xat_adjunts(id, usuari_id, fil_id, bytes, mime, durada_ms)
      values(p_id, v_jo, p_fil_id, p_bytes, p_mime, p_durada_ms) returning * into a;
    v_pujat := false;
  end if;
  return jsonb_build_object('ruta', p_id::text, 'pujat', v_pujat);
end;
$$;

-- L'error de xarxa no ha de consumir la quota. L'objecte confirmat es conserva
-- per al reintent; sense objecte, la reserva s'allibera i una pujada encara
-- en curs ja no es podrà confirmar (R1).
create function public.xat_cancella_reserva(p_id uuid) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype;
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:quota:' || v_jo::text, 0));
  select * into a from public.xat_adjunts where id = p_id and usuari_id = v_jo for update;
  if not found or a.publicat then return false; end if;
  if exists (select 1 from storage.objects where bucket_id = 'xat_adjunts'
    and name = p_id::text) then return false; end if;
  delete from public.xat_adjunts where id = p_id;
  return true;
end;
$$;

-- La marca es confirma abans de cridar Storage DELETE: la publicació i una
-- pujada tardana ja no poden competir amb l'esborrat físic.
create function public.xat_prepara_descart(p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare a public.xat_adjunts%rowtype;
begin
  select * into a from public.xat_adjunts where id = p_id and usuari_id = (select auth.uid()) for update;
  if not found then return jsonb_build_object('ruta', null); end if;
  if a.publicat then raise exception 'SDP-XAT-021: el missatge ja està publicat.' using errcode = '22023'; end if;
  update public.xat_adjunts set cancellant = true where id = p_id;
  return jsonb_build_object('ruta', a.id::text);
end;
$$;

create function public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype; m public.xat_missatges%rowtype; v_tipus text;
  v_versio text; v_peu text := nullif(btrim(p_text), '');
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  select * into a from public.xat_adjunts where id = p_id and usuari_id = v_jo for update;
  if not found or a.cancellant or not private.es_participant(a.fil_id) then raise exception 'SDP-XAT-006: no eres membre del fil o l’adjunt s’ha descartat.' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:missatge:' || p_id::text, 0));
  if not a.publicat then
    -- Gauntlet 261022_0225 (crítica Claude), F1 i F2 · L'escriptura final de
    -- Storage: de qui ha reservat, posterior a la reserva, amb la mida i el
    -- MIME exactes. La versió trobada és l'única que es podrà llegir.
    select o.version into v_versio from storage.objects o
      where o.bucket_id = 'xat_adjunts' and o.name = p_id::text
        and o.owner_id = v_jo::text and o.created_at >= a.creat_al
        and lower(btrim(split_part(o.metadata->>'mimetype', ';', 1))) = a.mime
        and case when jsonb_typeof(o.metadata->'size') = 'number'
          then (o.metadata->>'size')::numeric = a.bytes else false end;
    if not found then
      raise exception 'SDP-XAT-021: falta confirmar el fitxer.' using errcode = '22023';
    end if;
    if exists (select 1 from public.xat_missatges where id = p_id) then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    -- Reutilitza permisos, seq, límit de freqüència i autoria canònics.
    -- Gauntlet 261022_0225 (crítica Claude), F13 · xat_envia vol text; sense
    -- peu, el missatge es queda amb text null i el client en pinta l'etiqueta
    -- traduïda: cap «Foto» en valencià desat al servidor.
    perform public.xat_envia(p_id, a.fil_id, 'text', coalesce(v_peu, '-'), p_resposta_a, '{}'::jsonb);
    v_tipus := case when a.mime like 'image/%' then 'imatge' when a.mime like 'video/%' then 'video' else 'veu' end;
    update public.xat_missatges set tipus = v_tipus, text = v_peu,
      metadades = jsonb_build_object('adjunt', jsonb_build_object('id', a.id, 'bytes', a.bytes, 'mime', a.mime, 'duradaMs', a.durada_ms))
      where id = p_id;
    update public.xat_adjunts set publicat = true, versio = v_versio where id = p_id;
  end if;
  select * into m from public.xat_missatges where id = p_id and usuari_id = v_jo;
  return jsonb_build_object('id', m.id, 'seq', m.seq, 'usuari_id', m.usuari_id, 'cos', m.text, 'tipus', m.tipus,
    'resposta_a', m.resposta_a, 'metadades', m.metadades, 'com_org_id', m.com_org_id, 'creat_al', m.creat_al,
    'autor_nom', coalesce((select name from public.organizations where id = m.com_org_id), (select full_name from public.profiles where id = v_jo), 'Veí'));
end;
$$;

create function public.xat_llegix_adjunt(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_ruta text;
begin
  select id::text into v_ruta from public.xat_adjunts where id = p_id;
  if v_ruta is null or not private.xat_llegible_adjunt(v_ruta) then
    raise exception 'SDP-XAT-006: fitxer no disponible.' using errcode = '42501';
  end if;
  return jsonb_build_object('ruta', v_ruta);
end;
$$;
revoke all on function public.xat_quota(), public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer),
  public.xat_publica_adjunt(uuid,text,uuid), public.xat_llegix_adjunt(uuid), public.xat_cancella_reserva(uuid), public.xat_prepara_descart(uuid) from public, anon;
grant execute on function public.xat_quota(), public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer),
  public.xat_publica_adjunt(uuid,text,uuid), public.xat_llegix_adjunt(uuid), public.xat_cancella_reserva(uuid), public.xat_prepara_descart(uuid) to authenticated;

-- Gauntlet 261022_0225 (crítica Claude, revisió R3) · xat_fils_meus v5: la v4
-- de 2609282100 sencera, més ultim_tipus (el tipus de l’últim missatge). Un
-- adjunt sense peu té text null; amb el tipus, la llista pot pintar «Foto»,
-- «Vídeo» o «Missatge de veu» traduïts en lloc de «Cap missatge.».
drop function if exists public.xat_fils_meus(uuid);
create function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text
)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
begin
  insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
  select f.id, om.user_id, f.org_id, 'admin' from public.xat_fils f
  join public.organization_memberships om on om.organization_id = f.org_id and om.tenant_id = f.tenant_id
  where f.tenant_id = p_tenant_id and f.interlocutor_id is not null
    and f.interlocutor_id <> (select auth.uid())
    and om.user_id = (select auth.uid()) and om.role in ('owner', 'admin')
  on conflict (fil_id, usuari_id) do nothing;

  return query select f.id, f.tipus, f.titol,
    coalesce(f.imatge_url, costat.dades -> 0 ->> 'avatarUrl'), f.actualitzat_al,
    coalesce(costat.noms, array[]::text[]), u.text, u.creat_al, u.usuari_id,
    f.ultim_seq, jo.llegit_fins_seq, jo.rebut_fins_seq,
    coalesce((select min(p.llegit_fins_seq) from public.xat_participants p
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)), 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null),
    u.tipus
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
  left join lateral (
    select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'tipus', c.tipus,
      'avatarUrl', c.avatar_url, 'slug', c.slug) order by c.nom) as dades,
      array_agg(c.nom order by c.nom) as noms
    from (
      select o.id, o.name as nom, 'entitat'::text as tipus, o.logo_url as avatar_url, o.slug
      where o.id is not null and jo.com_org_id is null
      union all
      select pr.id, coalesce(pr.full_name, 'Veí'), 'persona'::text, pr.avatar_url, null::text
      from public.xat_participants p join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;
revoke execute on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;

-- Gauntlet 261022_0225 (crítica Claude), F3 i F4 · La neteja del servidor, per
-- a totes les persones. Esborrar una fila allibera la quota i el disparador
-- xat_adjunt_a_purga posa l'objecte a la cua; ací no s'esborra cap binari.
create function private.xat_neteja_adjunts(p_limit integer default 500) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000)); v_fetes integer := 0; v_n integer;
begin
  if not pg_try_advisory_xact_lock(hashtext('sdp-neteja-xat-adjunts')) then return 0; end if;
  -- 1. Reserves d'una hora sense objecte; 2. pujades sense publicar d'un dia.
  delete from public.xat_adjunts a where a.id in (select c.id from public.xat_adjunts c
    where not c.publicat and (c.creat_al < now() - interval '1 day' or (c.creat_al < now() - interval '1 hour'
      and not exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts' and o.name = c.id::text)))
    order by c.creat_al limit v_limit for update skip locked);
  get diagnostics v_n = row_count; v_fetes := v_fetes + v_n;
  -- 3. Adjunts de missatges caducats, esborrats o desapareguts (RGPD 5.1.e).
  delete from public.xat_adjunts a where a.id in (select c.id from public.xat_adjunts c
    left join public.xat_missatges m on m.id = c.id
    where c.publicat and (m.id is null or m.esborrat_al is not null or m.caduca_al <= now())
    limit v_limit for update of c skip locked);
  get diagnostics v_n = row_count; v_fetes := v_fetes + v_n;
  -- 4. Objectes sense reserva (una pujada que acabara després de la neteja).
  insert into private.purga_storage_pendent(user_id, bucket_id, nom, referenciat)
  select coalesce(o.owner, '00000000-0000-0000-0000-000000000000'::uuid), 'xat_adjunts', o.name, false
  from storage.objects o
  where o.bucket_id = 'xat_adjunts' and o.created_at < now() - interval '1 hour'
    and not exists (select 1 from public.xat_adjunts a where a.id = private.xat_id_de_ruta(o.name))
    and not exists (select 1 from private.purga_storage_pendent p where p.bucket_id = 'xat_adjunts' and p.nom = o.name)
  limit v_limit
  on conflict (bucket_id, nom) do nothing;
  get diagnostics v_n = row_count; v_fetes := v_fetes + v_n;
  return v_fetes;
end;
$$;
revoke all on function private.xat_neteja_adjunts(integer) from public, anon, authenticated;

-- Programació només si pg_cron ja està actiu. Si no, cal programar-la a mà:
-- vegeu l'entrada d'esta migració a supabase/README.md.
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('sdp-neteja-xat-adjunts', '23 * * * *', $cron$select private.xat_neteja_adjunts(500)$cron$);
  else
    raise notice 'SDP-XAT-903: pg_cron no està actiu; la neteja dels adjunts queda sense programar.';
  end if;
end
$$;
notify pgrst, 'reload schema';
commit;
