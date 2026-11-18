-- R32.8 · Quota acumulada 250 MB, vídeo fins a 60 s i ubicació explícita.
-- Depén de: 20261116040000 (search_path buit i RPCs E2EE vigents).
-- Additiva: la RPC de tres arguments conserva OID, cos, owner i ACL.
-- La sobrecàrrega de quatre arguments no té defaults: PostgREST tria per claus.
-- No amplia el bucket de 20 MB ni la mida per tipus; no modifica RLS/ACL existents.
-- Aplicar abans del client que envia p_ubicacio. Cap aplicació remota per l'agent.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $r328_preflight$
declare r record; v_hash text;
begin
  if pg_catalog.to_regclass('public.xat_adjunts') is null
    or pg_catalog.to_regclass('storage.objects') is null then
    raise exception 'SDP-R328-DEPENDENCY: falta el catàleg de xat.' using errcode='55000';
  end if;
  for r in select * from (values
    ('public.xat_quota()','41a4d7e443a47dcccaf226a26bfc7799c7c5211d5edcdbbaa38987f6b4df2e14','c9607dbf16a0dfc4e716a71876a180c2f9e0dc3f1a6b2674a16357671290b01a'),
    ('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)','17241d05975614f723170fd52d15da2676db495996c7a7ab40097326b00b5d4f','dddb2fda616808f319c0bf036d3489a6ee90ff72596c32e50f533ef6167373e5'),
    ('public.xat_publica_adjunt(uuid,text,uuid)','28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb','28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb')
  ) as expected(signature,before_hash,after_hash) loop
    select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') into v_hash
      from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure(r.signature)
        and p.prosecdef and coalesce(p.proconfig @> array['search_path=""']::text[],false);
    if v_hash is null or (v_hash<>r.before_hash and v_hash<>r.after_hash) then
      raise exception 'SDP-R328-DRIFT: RPC vigent absent o divergent %.',r.signature using errcode='55000';
    end if;
  end loop;
end;
$r328_preflight$;

create or replace function public.xat_quota() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  return jsonb_build_object('usats', coalesce((select sum(bytes) from public.xat_adjunts where usuari_id = (select auth.uid())), 0)
      + private.xat_bytes_en_purga((select auth.uid())), 'limit', 250000000,
    'pendents', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'bytes', bytes, 'mime', mime))
      from public.xat_adjunts where usuari_id = (select auth.uid()) and not publicat), '[]'::jsonb));
end;
$$;

create or replace function public.xat_reserva_adjunt(p_id uuid,p_fil_id uuid,p_bytes bigint,p_mime text,p_durada_ms integer default null)
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
    if v_total + p_bytes > 250000000 then
      raise exception 'SDP-XAT-020: quota de 250 MB esgotada.' using errcode = '23514';
    end if;
    insert into public.xat_adjunts(id, usuari_id, fil_id, bytes, mime, durada_ms, xifrat)
      values(p_id, v_jo, p_fil_id, p_bytes, p_mime, p_durada_ms, p_mime='application/octet-stream') returning * into a;
    v_pujat := false;
  end if;
  return jsonb_build_object('ruta', p_id::text, 'pujat', v_pujat);
end;
$$;

-- Mateixa llista MIME i branca opaca; només s'eixampla la durada de vídeo.
alter table public.xat_adjunts drop constraint if exists xat_adjunts_format_lot3;
alter table public.xat_adjunts add constraint xat_adjunts_format_lot3 check(coalesce(
  (xifrat and mime='application/octet-stream' and durada_ms is null) or
  (not xifrat and mime in ('image/webp','image/png','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg')
    and ((mime like 'image/%' and durada_ms is null) or (mime like 'video/%' and durada_ms between 1 and 60000)
      or (mime like 'audio/%' and durada_ms>0))),false));

create or replace function public.xat_publica_adjunt(p_id uuid,p_text text,p_resposta_a uuid,p_ubicacio jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_ubicacio jsonb; v_publicat boolean; v_ack jsonb; v_metadades jsonb;
begin
  if p_ubicacio is not null and p_ubicacio<>'null'::jsonb then
    -- Tipus abans de convertir: ni strings, ni bools, ni NaN/Infinity JSON.
    if jsonb_typeof(p_ubicacio)<>'object' or octet_length(p_ubicacio::text)>256 then
      raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode='22023';
    end if;
    if not p_ubicacio ?& array['lat','lng'] or (p_ubicacio-array['lat','lng'])<>'{}'::jsonb
      or jsonb_typeof(p_ubicacio->'lat')<>'number' or jsonb_typeof(p_ubicacio->'lng')<>'number' then
      raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode='22023';
    end if;
    if (p_ubicacio->>'lat')::numeric not between -90 and 90 or (p_ubicacio->>'lng')::numeric not between -180 and 180 then
      raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode='22023';
    end if;
    v_ubicacio:=jsonb_build_object('lat',(p_ubicacio->>'lat')::numeric,'lng',(p_ubicacio->>'lng')::numeric);
  end if;
  -- Mateix ordre de panys que la RPC original: fila, després missatge.
  -- La primera publicació decidix text/GPS. Un reintent només retorna l'ACK.
  select a.publicat into v_publicat from public.xat_adjunts a
    where a.id=p_id and a.usuari_id=(select auth.uid()) for update;
  v_ack:=public.xat_publica_adjunt(p_id,p_text,p_resposta_a);
  if v_publicat is false and v_ubicacio is not null then
    update public.xat_missatges m set metadades=m.metadades||jsonb_build_object('ubicacio',v_ubicacio)
      where m.id=p_id and m.usuari_id=(select auth.uid()) returning m.metadades into v_metadades;
    v_ack:=jsonb_set(v_ack,array['metadades'],v_metadades,false);
  end if;
  return v_ack;
end;
$$;
revoke all on function public.xat_publica_adjunt(uuid,text,uuid,jsonb) from public,anon,service_role;
grant execute on function public.xat_publica_adjunt(uuid,text,uuid,jsonb) to authenticated;

commit;
