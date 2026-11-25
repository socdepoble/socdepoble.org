-- v1.2.25 C1. No executa cap DELETE SQL sobre storage.objects.
-- La cua canònica → purga-fitxers → Storage API elimina els bytes físics.
-- Validació de documents en client: no és antivirus ni acreditació de bytes al servidor.
-- Depén de: 20261117173000 (R32.7, public.xat_missatges_amagats),
-- 20261117193000 (R32.8, cos vigent de public.xat_reserva_adjunt) i
-- 20261123010000 (R32.46, cos vigent de private.xat_neteja_adjunts).
-- R32.7 i R32.8 van entrar a Producció dins del Super-Bundle R32.14: abans
-- d'eixe estat la guarda SDP-C1-DRIFT refusa tota la migració.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_catalog.pg_advisory_xact_lock(1225,1);
do $guard$ begin
  perform 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_maxim_adjunt(text)') and p.proconfig @> array['search_path=""'] and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in ('443dc0a6c28fa5275eecc53900b3a3f8b267c37177d7b7211fb3b23d479c6232','4b599e5d62ca0176c4055ef7c5bf34b2a646a929a45eeab2070dda63fc145915');
  if not found then raise exception 'SDP-C1-DRIFT: private.xat_maxim_adjunt(text)' using errcode='55000'; end if;
  perform 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)') and p.proconfig @> array['search_path=""'] and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in ('dddb2fda616808f319c0bf036d3489a6ee90ff72596c32e50f533ef6167373e5','e73dd8b0d5113441b885aca2c9ddf6f368c1e04a94e5553cdd3c73e4cd71b3ea');
  if not found then raise exception 'SDP-C1-DRIFT: public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)' using errcode='55000'; end if;
  perform 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_publica_adjunt(uuid,text,uuid)') and p.proconfig @> array['search_path=""'] and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in ('28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb','a2bf102029bd2aeb75b8979bda1b7f1058d343bb964734f396b34358e63c3c88');
  if not found then raise exception 'SDP-C1-DRIFT: public.xat_publica_adjunt(uuid,text,uuid)' using errcode='55000'; end if;
  perform 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_llegix_adjunt(uuid)') and p.proconfig @> array['search_path=""'] and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in ('edca29138c70a27b3bc5c88e9ca1325b267315f1d2bc31f6d73451fd32c4ee58','e20b7262521e84cf528c9c0aceca7c446a5dfc70018be81aa08e04bf0541274e');
  if not found then raise exception 'SDP-C1-DRIFT: public.xat_llegix_adjunt(uuid)' using errcode='55000'; end if;
  perform 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_neteja_adjunts(integer)') and p.proconfig @> array['search_path=""'] and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in ('15ac8adb219dae3e66ba9b2affdbf48429ee66f07ab6b3e704e9fa976de6c414','173ba27f88bbad1f70d412482f82b4ec2fc2ad98944e913631f10f841697b81c');
  if not found then raise exception 'SDP-C1-DRIFT: private.xat_neteja_adjunts(integer)' using errcode='55000'; end if;
  if pg_catalog.to_regprocedure('private.xat_adjunt_protegit_lssi(uuid)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_adjunt_protegit_lssi(uuid)')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='650f42f72f4c39a68836b41ed498b42dc3b7eb8754bc77814f385d6e4e064c85') then
   raise exception 'SDP-C1-NEW-DRIFT: private.xat_adjunt_protegit_lssi(uuid)' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('private.xat_preserva_blob_lssi()') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_preserva_blob_lssi()')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='a2f1cdc8d56131e11b74319e6cd925a097f6708db000e9a251124dd33623f494') then
   raise exception 'SDP-C1-NEW-DRIFT: private.xat_preserva_blob_lssi()' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('private.xat_text_plegat(text)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_text_plegat(text)')
   and p.prosecdef=false and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='5d7bc920d4ab0915f202d1364b8e435f1f6cf9cc38b45dcdacafeb51ee1b57ff') then
   raise exception 'SDP-C1-NEW-DRIFT: private.xat_text_plegat(text)' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('private.xat_cerca_visible(uuid,uuid)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_cerca_visible(uuid,uuid)')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='d61b032f166a392c7de484f7f71bd864c26f519147cd9118738b09f2b1bf7106') then
   raise exception 'SDP-C1-NEW-DRIFT: private.xat_cerca_visible(uuid,uuid)' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('public.xat_cerca_missatges_fil(uuid,text,integer,timestamptz)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_cerca_missatges_fil(uuid,text,integer,timestamptz)')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='8364a996c752678b1d0962710451622baf5cde6cb52413612372c59ec342b8a3') then
   raise exception 'SDP-C1-NEW-DRIFT: public.xat_cerca_missatges_fil(uuid,text,integer,timestamptz)' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('public.xat_cerca_missatges_fil_v2(uuid,text,integer,timestamptz,bigint)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_cerca_missatges_fil_v2(uuid,text,integer,timestamptz,bigint)')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='7b2bfed180b74ab34271888661700b4e43793649a86dd23490a0b156712d5576') then
   raise exception 'SDP-C1-NEW-DRIFT: public.xat_cerca_missatges_fil_v2(uuid,text,integer,timestamptz,bigint)' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('public.xat_missatge_fil_per_id(uuid,uuid)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_missatge_fil_per_id(uuid,uuid)')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='e875275cf33d0624e550760e580dc9944d9dcd8e4454912223cb535db2e7ff38') then
   raise exception 'SDP-C1-NEW-DRIFT: public.xat_missatge_fil_per_id(uuid,uuid)' using errcode='55000';
  end if;
  if pg_catalog.to_regprocedure('private.xat_purga_blobs_esborrats(integer)') is not null and not exists(
   select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.xat_purga_blobs_esborrats(integer)')
   and p.prosecdef=true and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.pg_get_userbyid(p.proowner)=current_user
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')='2a2a72b97d6cd3107dcac38a535264c767b6848fdf78610d68c7124d8c21cb00') then
   raise exception 'SDP-C1-NEW-DRIFT: private.xat_purga_blobs_esborrats(integer)' using errcode='55000';
  end if;
end $guard$;

-- SV-01 (Gauntlet de la integració v1.2.25) · La cita de l'id al payload només protegix l'adjunt si la
-- publicació retirada o esborrada és del seu autor: la fila de public.xat_adjunts o, si ja s'ha purgat, la del
-- missatge, que comparteix l'id. La publicació d'un altre veí que en copia l'UUID ja no el fixa. El fil d'una
-- publicació retirada continua protegint els adjunts dels seus missatges.
create or replace function private.xat_adjunt_protegit_lssi(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $hold$
 select p_id is not null and exists(select 1 from public.section_submissions s
   where (s.moderation_state is distinct from 'visible' or s.deleted_at is not null)
   and ((pg_catalog.strpos(s.payload::text,p_id::text)>0 and s.owner_user_id=coalesce(
     (select a.usuari_id from public.xat_adjunts a where a.id=p_id),
     (select m.usuari_id from public.xat_missatges m where m.id=p_id))) or exists(
     select 1 from public.xat_missatges m join public.xat_fils f on f.id=m.fil_id
     where m.id=p_id and f.subjecte_id=s.id::text)));
$hold$;
revoke all on function private.xat_adjunt_protegit_lssi(uuid) from public,anon,authenticated,service_role;

create or replace function private.xat_preserva_blob_lssi() returns trigger
language plpgsql security definer set search_path='' as $hold_trigger$
begin
 if old.bucket_id='xat_adjunts' and private.xat_adjunt_protegit_lssi(private.xat_id_de_ruta(old.name)) then
   raise exception 'SDP-C1-LSSI: evidència protegida.' using errcode='42501';
 end if;
 return old;
end $hold_trigger$;
revoke all on function private.xat_preserva_blob_lssi() from public,anon,authenticated,service_role;
drop trigger if exists xat_preserva_blob_lssi on storage.objects;
create trigger xat_preserva_blob_lssi before delete on storage.objects for each row
 when(old.bucket_id='xat_adjunts') execute function private.xat_preserva_blob_lssi();
CREATE OR REPLACE FUNCTION private.xat_maxim_adjunt(p_mime text)
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select (case when p_mime in ('image/webp','image/png','image/jpeg') then 2000000
    when p_mime in ('application/pdf','text/csv','text/plain','application/vnd.oasis.opendocument.text','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then 10000000
    when p_mime in ('audio/mp4','audio/webm','audio/ogg') then 3000000
    when p_mime in ('application/octet-stream','video/mp4','video/webm','video/quicktime') then 20000000 end)::bigint;
$function$;

CREATE OR REPLACE FUNCTION public.xat_reserva_adjunt(p_id uuid, p_fil_id uuid, p_bytes bigint, p_mime text, p_durada_ms integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  IF p_mime='application/octet-stream' THEN
    PERFORM private.xat_e2ee_exigix(p_fil_id);
    IF NOT private.xat_e2ee_abast(p_fil_id) OR p_durada_ms IS NOT NULL THEN RAISE EXCEPTION 'SDP-XAT-032: adjunt fora d’abast.' USING errcode='22023'; END IF;
    IF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)=0 AND NOT private.xat_e2ee_permes(p_fil_id) THEN
      RAISE EXCEPTION 'SDP-XAT-039: activació no autoritzada.' USING errcode='42501';
    END IF;
  ELSIF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)>0 THEN
    RAISE EXCEPTION 'SDP-XAT-031: el fil requerix adjunts xifrats.' USING errcode='42501';
  END IF;
  -- F12 · Format i mida del tipus abans de cap pany.
  if p_id is null or p_bytes is null or p_bytes < (case when p_mime in ('application/pdf','text/csv','text/plain','application/vnd.oasis.opendocument.text','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then 1 else 64 end) or private.xat_maxim_adjunt(p_mime) is null then
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
    if v_total + p_bytes > 250000000 then
      raise exception 'SDP-XAT-020: quota de 250 MB esgotada.' using errcode = '23514';
    end if;
    insert into public.xat_adjunts(id, usuari_id, fil_id, bytes, mime, durada_ms, xifrat)
      values(p_id, v_jo, p_fil_id, p_bytes, p_mime, p_durada_ms, p_mime='application/octet-stream') returning * into a;
    v_pujat := false;
  end if;
  return jsonb_build_object('ruta', p_id::text, 'pujat', v_pujat);
end;
$function$;

CREATE OR REPLACE FUNCTION public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype; m public.xat_missatges%rowtype; v_tipus text;
  v_versio text; v_peu text := nullif(btrim(p_text), '');
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  select * into a from public.xat_adjunts where id = p_id and usuari_id = v_jo for update;
  if not found or a.cancellant or not private.es_participant(a.fil_id) then raise exception 'SDP-XAT-006: no eres membre del fil o l’adjunt s’ha descartat.' using errcode = '42501'; end if;
  IF a.xifrat OR (SELECT epoca_actual FROM public.xat_fils WHERE id=a.fil_id)>0 THEN RAISE EXCEPTION 'SDP-XAT-031: cal la RPC d’adjunt xifrat.' USING errcode='42501'; END IF;
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
    v_tipus := case when a.mime like 'image/%' then 'imatge' when a.mime like 'video/%' then 'video' when a.mime in ('application/pdf','text/csv','text/plain','application/vnd.oasis.opendocument.text','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then 'document' else 'veu' end;
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
$function$;

CREATE OR REPLACE FUNCTION public.xat_llegix_adjunt(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_ruta text;
begin
  select id::text into v_ruta from public.xat_adjunts where id = p_id;
  if v_ruta is null or not private.xat_llegible_adjunt(v_ruta) then
    raise exception 'SDP-XAT-006: fitxer no disponible.' using errcode = '42501';
  end if;
  return jsonb_build_object('ruta', v_ruta, 'tipus', (select case when a.mime in ('application/pdf','text/csv','text/plain','application/vnd.oasis.opendocument.text','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then 'document' else null end from public.xat_adjunts a where a.id=p_id));
end;
$function$;

CREATE OR REPLACE FUNCTION private.xat_neteja_adjunts(p_limit integer DEFAULT 500)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_limit integer := greatest(1, least(coalesce(p_limit, 500), 5000)); v_fetes integer := 0; v_n integer;
begin
  if not pg_try_advisory_xact_lock(hashtext('sdp-neteja-xat-adjunts')) then return 0; end if;
  -- 1. Reserves d'una hora sense objecte; 2. pujades sense publicar d'un dia.
  delete from public.xat_adjunts a where a.id in (select c.id from public.xat_adjunts c
    where not c.publicat and not private.xat_adjunt_protegit_lssi(c.id) and (c.creat_al < now() - interval '1 day' or (c.creat_al < now() - interval '1 hour'
      and not exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts' and o.name = c.id::text)))
    order by c.creat_al limit v_limit for update skip locked);
  get diagnostics v_n = row_count; v_fetes := v_fetes + v_n;
  -- 3. Adjunts de missatges caducats, esborrats o desapareguts (RGPD 5.1.e).
  delete from public.xat_adjunts a where a.id in (select c.id from public.xat_adjunts c
    left join public.xat_missatges m on m.id = c.id
    where c.publicat and not private.xat_adjunt_protegit_lssi(c.id) and (m.id is null or m.esborrat_al is not null or m.caduca_al <= now())
    limit v_limit for update of c skip locked);
  get diagnostics v_n = row_count; v_fetes := v_fetes + v_n;
  -- 4. Objectes sense reserva (una pujada que acabara després de la neteja).
  insert into private.purga_storage_pendent(user_id, bucket_id, nom, referenciat)
  select coalesce(case when o.owner_id ~ '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$' then o.owner_id::uuid end, o.owner, '00000000-0000-0000-0000-000000000000'::uuid), 'xat_adjunts', o.name, false
  from storage.objects o
  where o.bucket_id = 'xat_adjunts' and not private.xat_adjunt_protegit_lssi(private.xat_id_de_ruta(o.name)) and o.created_at < now() - interval '1 hour'
    and not exists (select 1 from public.xat_adjunts a where a.id = private.xat_id_de_ruta(o.name))
    and not exists (select 1 from private.purga_storage_pendent p where p.bucket_id = 'xat_adjunts' and p.nom = o.name)
  limit v_limit
  on conflict (bucket_id, nom) do nothing;
  get diagnostics v_n = row_count; v_fetes := v_fetes + v_n;
  return v_fetes;
end;
$function$;

alter table public.xat_adjunts drop constraint if exists xat_adjunts_format_lot3;
alter table public.xat_adjunts add constraint xat_adjunts_format_lot3 check(coalesce(
 (xifrat and mime='application/octet-stream' and durada_ms is null) or
 (not xifrat and ((mime in ('application/pdf','text/csv','text/plain','application/vnd.oasis.opendocument.text','application/vnd.openxmlformats-officedocument.wordprocessingml.document') and durada_ms is null and bytes between 1 and 10000000)
 or (mime in ('image/webp','image/png','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg')
 and bytes>=64 and ((mime like 'image/%' and durada_ms is null) or (mime like 'video/%' and durada_ms between 1 and 60000) or (mime like 'audio/%' and durada_ms>0))))),false));
alter table public.xat_adjunts drop constraint if exists xat_adjunts_mida;
alter table public.xat_adjunts add constraint xat_adjunts_mida check(bytes between 1 and 20000000);
update storage.buckets set allowed_mime_types=(select array_agg(distinct mime order by mime)
 from unnest(allowed_mime_types || array['application/pdf','text/csv','text/plain','application/vnd.oasis.opendocument.text','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) mime) where id='xat_adjunts';

create or replace function private.xat_text_plegat(p_text text) returns text
language sql immutable set search_path='' as $fold$
 select pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.normalize(coalesce(p_text,''),'NFD'),U&'[\0300-\036f]','','g'));
$fold$;
revoke all on function private.xat_text_plegat(text) from public,anon,authenticated,service_role;

create or replace function private.xat_cerca_visible(p_fil_id uuid,p_id uuid) returns boolean
language sql stable security definer set search_path='' as $visible$
 select auth.uid() is not null and coalesce(private.es_participant(p_fil_id),false) and exists(
 select 1 from public.xat_missatges m where m.id=p_id and m.fil_id=p_fil_id
 and m.esborrat_al is null and m.versio_xifrat=0 and (m.caduca_al is null or m.caduca_al>now())
 and coalesce(private.seq_visible(p_fil_id,m.seq),false)
 and not exists(select 1 from public.xat_missatges_amagats h where h.missatge_id=m.id and h.usuari_id=auth.uid())
 and not exists(select 1 from public.bloquejos b where
  (b.bloquejador=auth.uid() and ((b.bloquejat_tipus='persona' and b.bloquejat_persona=m.usuari_id) or (b.bloquejat_tipus='entitat' and b.bloquejat_entitat=m.com_org_id)))
  or (b.bloquejador=m.usuari_id and b.bloquejat_tipus='persona' and b.bloquejat_persona=auth.uid())));
$visible$;
revoke all on function private.xat_cerca_visible(uuid,uuid) from public,anon,authenticated,service_role;

create or replace function public.xat_cerca_missatges_fil(p_fil_id uuid,p_consulta text,p_limit int default 50,p_abans_de timestamptz default null)
returns table(id uuid,fil_id uuid,seq bigint,usuari_id uuid,autor_nom text,cos text,tipus text,resposta_a uuid,metadades jsonb,creat_al timestamptz)
language plpgsql stable security definer set search_path='' as $search$
begin
 if auth.uid() is null or not coalesce(private.es_participant(p_fil_id),false) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_consulta is null or char_length(btrim(p_consulta)) not between 1 and 256 or p_limit is null or p_limit not between 1 and 100 then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 return query select m.id,m.fil_id,m.seq,m.usuari_id,
 coalesce(o.name,pr.full_name,'Veí'),m.text,m.tipus,m.resposta_a,m.metadades,m.creat_al
 from public.xat_missatges m left join public.profiles pr on pr.id=m.usuari_id
 left join public.organizations o on o.id=m.com_org_id
 where m.fil_id=p_fil_id and private.xat_cerca_visible(p_fil_id,m.id)
 and (p_abans_de is null or m.creat_al<p_abans_de)
 and pg_catalog.strpos(private.xat_text_plegat(m.text),private.xat_text_plegat(btrim(p_consulta)))>0
 order by m.creat_al desc,m.seq desc limit p_limit;
end $search$;
revoke all on function public.xat_cerca_missatges_fil(uuid,text,int,timestamptz) from public,anon,service_role;
grant execute on function public.xat_cerca_missatges_fil(uuid,text,int,timestamptz) to authenticated;

create or replace function public.xat_missatge_fil_per_id(p_fil_id uuid,p_id uuid)
returns table(id uuid,fil_id uuid,seq bigint,usuari_id uuid,autor_nom text,cos text,tipus text,resposta_a uuid,metadades jsonb,creat_al timestamptz)
language sql stable security definer set search_path='' as $quote$
 select m.id,m.fil_id,m.seq,m.usuari_id,coalesce(o.name,pr.full_name,'Veí'),m.text,m.tipus,m.resposta_a,m.metadades,m.creat_al
 from public.xat_missatges m left join public.profiles pr on pr.id=m.usuari_id
 left join public.organizations o on o.id=m.com_org_id
 where m.id=p_id and m.fil_id=p_fil_id and private.xat_cerca_visible(p_fil_id,m.id);
$quote$;
revoke all on function public.xat_missatge_fil_per_id(uuid,uuid) from public,anon,service_role;
grant execute on function public.xat_missatge_fil_per_id(uuid,uuid) to authenticated;

create or replace function private.xat_purga_blobs_esborrats(p_limit int default 500) returns int
language plpgsql volatile security definer set search_path='' as $purge$
declare n int;
begin
 if p_limit is null or p_limit not between 1 and 5000 then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 -- El disparador xat_adjunt_a_purga encola el DELETE de Storage; no elimina metadades a mà.
 delete from public.xat_adjunts a where a.id in(select c.id from public.xat_adjunts c
 join public.xat_missatges m on m.id=c.id where m.esborrat_al is not null and c.publicat
 and not private.xat_adjunt_protegit_lssi(c.id) order by c.id limit p_limit for update of c skip locked);
 get diagnostics n=row_count; return n;
end $purge$;
revoke all on function private.xat_purga_blobs_esborrats(int) from public,anon,authenticated,service_role;
create or replace function public.xat_cerca_missatges_fil_v2(p_fil_id uuid,p_consulta text,p_limit int default 50,p_abans_de timestamptz default null,p_abans_seq bigint default null)
returns table(id uuid,fil_id uuid,seq bigint,usuari_id uuid,autor_nom text,cos text,tipus text,resposta_a uuid,metadades jsonb,creat_al timestamptz)
language plpgsql stable security definer set search_path='' as $search$
begin
 if auth.uid() is null or not coalesce(private.es_participant(p_fil_id),false) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if (p_abans_de is null)<>(p_abans_seq is null) or (p_abans_seq is not null and p_abans_seq<1) then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if p_consulta is null or char_length(btrim(p_consulta)) not between 1 and 256 or p_limit is null or p_limit not between 1 and 100 then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 return query select m.id,m.fil_id,m.seq,m.usuari_id,
 coalesce(o.name,pr.full_name,'Veí'),m.text,m.tipus,m.resposta_a,m.metadades,m.creat_al
 from public.xat_missatges m left join public.profiles pr on pr.id=m.usuari_id
 left join public.organizations o on o.id=m.com_org_id
 where m.fil_id=p_fil_id and private.xat_cerca_visible(p_fil_id,m.id)
 and (p_abans_de is null or (m.creat_al,m.seq)<(p_abans_de,p_abans_seq))
 and pg_catalog.strpos(private.xat_text_plegat(m.text),private.xat_text_plegat(btrim(p_consulta)))>0
 order by m.creat_al desc,m.seq desc limit p_limit;
end $search$;
revoke all on function public.xat_cerca_missatges_fil_v2(uuid,text,int,timestamptz,bigint) from public,anon,service_role;
grant execute on function public.xat_cerca_missatges_fil_v2(uuid,text,int,timestamptz,bigint) to authenticated;


commit;
