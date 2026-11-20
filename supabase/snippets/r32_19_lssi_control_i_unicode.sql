-- R32.19 D-v1213-3. Pegat incremental; no aplica cap agent a Producció.
-- Refusa C0 excepte TAB/LF/CR, i DEL, abans de deduplicació/quotas/rebuts.
-- PostgreSQL UTF8 ja refusa NUL, UTF8 de surrogats i JSON amb surrogats
-- desaparellats abans de convertir-los a text: no existix cap surrogate SQL.
-- Un U+FFFD que el client haja substituït és un escalar vàlid; no es pot
-- reconstruir ni refusar selectivament el valor perdut a la frontera client.
-- Les notes privades usen CHECK NOT VALID. Un trigger de detall refusa
-- insercions/canvis de text, però deixa revisar històric sense reescriure
-- denúncies antigues: canviar només estat no revalida el seu detall vell.
-- La preguarda fixa els tres cossos coneguts o la nostra postimatge exacta;
-- cap substitució difusa, cap canvi d'ACL, RLS, flux, límits ni flags AP.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
do $guarda$ begin
  if pg_catalog.to_regprocedure('public.registra_denuncia_diligent(uuid,text,text,uuid)') is null or (select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex') from pg_catalog.pg_proc where oid='public.registra_denuncia_diligent(uuid,text,text,uuid)'::pg_catalog.regprocedure) not in ('6f9974a0f6a46d8ca8e87e7ed617dd3eb5dbf4dfe0d8a73d61f6a6f8dc178fe9','98629dfe430647b45314dd7b3741747c5540e112f25cb08d31e70c182c73f990') then raise exception 'SDP-R3219-DRIFT: public.registra_denuncia_diligent'; end if;
  if pg_catalog.to_regprocedure('public.revisa_denuncia_diligent(uuid,text,integer,text,text,uuid)') is null or (select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex') from pg_catalog.pg_proc where oid='public.revisa_denuncia_diligent(uuid,text,integer,text,text,uuid)'::pg_catalog.regprocedure) not in ('2d18b9f4aab5080aba0a93e490161911087b56e3690922ea06f612a7ad4d0b81','c881fb7948342e5f16cefe2d7b2038ab5a778f8459474d2fd4fc72b561ade96a') then raise exception 'SDP-R3219-DRIFT: public.revisa_denuncia_diligent'; end if;
  if pg_catalog.to_regprocedure('public.admin_revisa_denuncia_lssi(uuid,text,text,text)') is null or (select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex') from pg_catalog.pg_proc where oid='public.admin_revisa_denuncia_lssi(uuid,text,text,text)'::pg_catalog.regprocedure) not in ('9505c142f3497cc8022e60879244e811bde1c0695bfb67a19ea3f3b238817c37','9af0abaa0fae89fbe11d609b1e777aef9b9c04ebddd4e36d3bec27278b90ad45') then raise exception 'SDP-R3219-DRIFT: public.admin_revisa_denuncia_lssi'; end if;
  if pg_catalog.to_regprocedure('private.r3219_lssi_text_valid(text)') is not null and (select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex') from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure('private.r3219_lssi_text_valid(text)')) <> '1736bd56f6a27ed56c97cfb0befa719cea188fb9ecf2500360169228eff325d4' then raise exception 'SDP-R3219-DRIFT: helper'; end if;
  if pg_catalog.to_regprocedure('private.r3219_denuncia_detall_valid()') is not null and (select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex') from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure('private.r3219_denuncia_detall_valid()')) <> '63e51771e44a2d3c267daf8c4f8ef0aebb81c8848816ca089d0533b3d60119d4' then raise exception 'SDP-R3219-DRIFT: trigger de detall'; end if;
end; $guarda$;

create or replace function private.r3219_lssi_text_valid(p_text pg_catalog.text)
returns pg_catalog.bool language sql immutable strict parallel safe set search_path='' as $$
 select p_text !~ ('[' || pg_catalog.chr(1) || '-' || pg_catalog.chr(8)
   || pg_catalog.chr(11) || pg_catalog.chr(12) || pg_catalog.chr(14) || '-'
   || pg_catalog.chr(31) || pg_catalog.chr(127) || ']')
$$;
revoke all on function private.r3219_lssi_text_valid(text) from public,anon,authenticated,service_role;

create or replace function public.registra_denuncia_diligent(p_publicacio pg_catalog.uuid,p_motiu pg_catalog.text,p_detall pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); ip pg_catalog.text:=private.empremta_ip_moderacio(); subject pg_catalog.text; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; did pg_catalog.uuid; result pg_catalog.jsonb; tip pg_catalog.text;
 detall pg_catalog.text:=btrim(p_detall); rebut_mur pg_catalog.jsonb; repetida pg_catalog.bool; original pg_catalog.text; flux private.r3213_lssi_flux; ampliacio pg_catalog.text;
begin
 if who is not null and not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_publicacio is null or p_operacio is null or p_motiu is null or p_motiu not in('ofensiu','spam_frau','desinformacio','altre')
  or not private.r3219_lssi_text_valid(p_detall) or p_detall is null or pg_catalog.char_length(detall) not between 1 and 1000 then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:=coalesce(who::pg_catalog.text,'anon:'||coalesce(ip,'shared'));
 req:=pg_catalog.jsonb_build_object('publicacio',p_publicacio,'motiu',p_motiu,'detall',detall);
 perform pg_advisory_xact_lock(pg_catalog.hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||pg_catalog.jsonb_build_object('repetida',true);
 end if;
 -- R32.15 · El rebut de la RPC del Mur diu si el disparador ha deduplicat.
 rebut_mur:=public.denuncia_publicacio_mur(p_publicacio,p_motiu,detall);
 if pg_catalog.jsonb_typeof(rebut_mur->'repetida') is distinct from 'boolean' then raise exception using errcode='55000',message='SDP-LSSI-NO-RECEIPT'; end if;
 repetida:=(rebut_mur->>'repetida')::pg_catalog.bool;
 select case s.section_id when 'mercat' then 'producte' when 'events' then 'esdeveniment' else 'publicacio' end into tip from public.section_submissions s where s.id=p_publicacio;
 select d.id,d.detall into did,original from public.denuncies d where d.objecte_id=p_publicacio::pg_catalog.text
  and d.objecte_tipus=tip and d.denunciant is not distinct from who
  and (who is not null or d.ip_hash is not distinct from ip) and (repetida or d.creat_al=pg_catalog.now()) and d.estat='pendent' order by d.creat_al desc,d.id limit 1 for share of d;
 if did is null then raise exception using errcode='55000',message='SDP-LSSI-NO-RECEIPT'; end if;
 if repetida and (select pg_catalog.count(*) from private.r3213_lssi_rebuts r where r.subjecte=subject and r.rebut->>'id'=did::pg_catalog.text)>=20 then
  raise exception using errcode='42900',message='SDP-LSSI-429';
 end if;
 insert into private.r3213_lssi_flux values(did,'rebuda',1,pg_catalog.clock_timestamp()) on conflict do nothing;
 if not exists(select 1 from private.r3213_lssi_audit where denuncia_id=did) then
  insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(did,who,'rebuda','Denúncia rebuda; pendent de revisió humana.');
 end if;
 if repetida and detall is distinct from original then
  -- Ampliació append-only: conserva el detall nou sense tocar l'original.
  select * into flux from private.r3213_lssi_flux where denuncia_id=did;
  ampliacio:='Ampliació del denunciant (motiu: '||p_motiu||'): '||detall;
  if not exists(select 1 from private.r3213_lssi_audit a where a.denuncia_id=did and a.justificacio=ampliacio)
   and (select pg_catalog.count(*) from private.r3213_lssi_audit a where a.denuncia_id=did and a.actor_id is not distinct from who
         and a.anterior is not distinct from a.estat and pg_catalog.starts_with(a.justificacio,'Ampliació del denunciant (motiu: '))<5 then
   insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(did,who,flux.estat,flux.estat,ampliacio);
  end if;
 end if;
 select pg_catalog.jsonb_build_object('id',did,'estat',f.estat,'versio',f.versio,'repetida',repetida) into result from private.r3213_lssi_flux f where f.denuncia_id=did;
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.registra_denuncia_diligent(uuid,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.registra_denuncia_diligent(uuid,text,text,uuid) to anon,authenticated;

create or replace function public.revisa_denuncia_diligent(p_id pg_catalog.uuid,p_estat_esperat pg_catalog.text,p_versio pg_catalog.int4,p_estat pg_catalog.text,p_justificacio pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); f private.r3213_lssi_flux; d public.denuncies; s public.section_submissions; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; subject pg_catalog.text; result pg_catalog.jsonb;
begin
 if who is null or not coalesce(private.es_superadmin(),false) or not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_id is null or p_operacio is null or p_versio is null or p_versio<1 or not private.r3219_lssi_text_valid(p_justificacio) or p_justificacio is null or pg_catalog.char_length(btrim(p_justificacio)) not between 1 and 2000
  or p_estat_esperat is null or p_estat is null or not ((p_estat_esperat='rebuda' and p_estat in('en_revisio','arxivada'))
   or (p_estat_esperat='en_revisio' and p_estat in('ocultacio_cautelar','arxivada','resolta'))
   or (p_estat_esperat='ocultacio_cautelar' and p_estat in('resolta','arxivada'))) then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:='review:'||who::pg_catalog.text;
 req:=jsonb_build_object('id',p_id,'estatEsperat',p_estat_esperat,'versio',p_versio,'estat',p_estat,'justificacio',btrim(p_justificacio));
 perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||jsonb_build_object('repetida',true);
 end if;
 select * into d from public.denuncies where id=p_id for update;
 select * into f from private.r3213_lssi_flux where denuncia_id=p_id for update;
 if not found or d.objecte_tipus not in('publicacio','producte','esdeveniment') then raise exception using errcode='22023',message='SDP-LSSI-404'; end if;
 if f.estat<>p_estat_esperat or f.versio<>p_versio then raise exception using errcode='40001',message='SDP-LSSI-409'; end if;
 if p_estat='ocultacio_cautelar' then
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||d.objecte_id,0));
  select * into s from public.section_submissions where id::pg_catalog.text=d.objecte_id and visibility='public' for update;
  if not found then raise exception using errcode='22023',message='SDP-LSSI-404'; end if;
  if s.moderation_state<>'visible' or s.deleted_at is not null or exists(select 1 from private.mur_publicacions_revocades where submission_id=s.id) then
   raise exception using errcode='40001',message='SDP-LSSI-409';
  end if;
  update public.section_submissions set moderation_state='retirada_cautelar' where id=s.id;
 end if;
 update private.r3213_lssi_flux set estat=p_estat,versio=versio+1,modificada_al=pg_catalog.clock_timestamp() where denuncia_id=p_id;
 insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(p_id,who,f.estat,p_estat,btrim(p_justificacio));
 -- Closing a case never silently restores a withdrawn resource.
 update public.denuncies set estat=case p_estat when 'arxivada' then 'desestimada' when 'resolta' then 'revisada' when 'ocultacio_cautelar' then 'retirada' else 'pendent' end,
  revisada_al=case when p_estat in('arxivada','resolta','ocultacio_cautelar') then pg_catalog.clock_timestamp() else null end where id=p_id;
 result:=jsonb_build_object('id',p_id,'estat',p_estat,'versio',f.versio+1,'repetida',false);
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.revisa_denuncia_diligent(uuid,text,integer,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.revisa_denuncia_diligent(uuid,text,integer,text,text,uuid) to authenticated;

create or replace function public.admin_revisa_denuncia_lssi(
  p_id uuid,p_decisio text,p_justificacio text,p_estat_esperat text default 'pendent'
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare d public.denuncies; s public.section_submissions; r private.lssi_revisions;
begin
  if auth.uid() is null or not coalesce(private.es_superadmin(),false)
     or not coalesce(private.copub_compte_actiu(auth.uid()),false) then
    raise exception using errcode='42501',message='SDP-LSSI-403: cal administració activa amb aal2.';
  end if;
  if p_id is null or p_decisio is null or p_decisio not in ('revisada','desestimada','retirada')
     or p_estat_esperat is distinct from 'pendent' or not private.r3219_lssi_text_valid(p_justificacio) or p_justificacio is null
     or char_length(btrim(p_justificacio)) not between 1 and 2000 then
    raise exception using errcode='22023',message='SDP-LSSI-400: decisió o justificació invàlida.';
  end if;
  select * into d from public.denuncies where id=p_id for update;
  if not found then
    raise exception using errcode='22023',message='SDP-LSSI-404: denúncia no disponible.';
  end if;
  if d.estat is distinct from p_estat_esperat then
    select * into r from private.lssi_revisions where denuncia_id=p_id;
    if r.revisor=auth.uid() and r.decisio=p_decisio and r.justificacio=btrim(p_justificacio) then
      return jsonb_build_object('id',p_id,'estat',d.estat,'repetida',true);
    end if;
    raise exception using errcode='40001',message='SDP-LSSI-409: la denúncia ja ha canviat.';
  end if;
  -- Mateix ordre que publica/revoca: advisory abans de bloquejar la fila.
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||d.objecte_id,0));
  select * into s from public.section_submissions
    where id::text=d.objecte_id and visibility='public'
      and section_id in ('mur','mercat','events','multimedia')
      and d.objecte_tipus in ('publicacio','producte','esdeveniment') for update;
  if not found then
    raise exception using errcode='22023',message='SDP-LSSI-404: contingut públic no disponible.';
  end if;
  if p_decisio='retirada' then
    -- El mateix pany que la publicació/revocació canònica; sense delete ni
    -- alteració de visibility, payload, autoria o la data original.
    if s.deleted_at is not null or s.moderation_state<>'visible'
       or exists(select 1 from private.mur_publicacions_revocades x where x.submission_id=s.id) then
      raise exception using errcode='40001',message='SDP-LSSI-409: el contingut ja ha canviat.';
    end if;
    update public.section_submissions set moderation_state='retirada_cautelar' where id=s.id;
  end if;
  insert into private.lssi_revisions(denuncia_id,revisor,decisio,justificacio,estat_contingut_anterior)
    values(p_id,auth.uid(),p_decisio,btrim(p_justificacio),s.moderation_state);
  update public.denuncies set estat=p_decisio,revisada_al=now() where id=p_id;
  return jsonb_build_object('id',p_id,'estat',p_decisio,'repetida',false);
end;
$$;
revoke all on function public.admin_revisa_denuncia_lssi(uuid,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.admin_revisa_denuncia_lssi(uuid,text,text,text) to authenticated;

-- Gauntlet v1.2.15 · SECURITY DEFINER: public.denuncia_contingut és SECURITY INVOKER (anon i
-- authenticated) i service_role escriu directament; cap d'eixos rols té EXECUTE sobre l'ajudant
-- privat. Una funció de disparador no es pot cridar directament i no té EXECUTE per a l'API.
create or replace function private.r3219_denuncia_detall_valid()
returns pg_catalog.trigger language plpgsql security definer set search_path='' as $$
begin
 if new.detall is not null and not private.r3219_lssi_text_valid(new.detall) then
  raise exception using errcode='22023',message='SDP-LSSI-400: detall amb caràcters de control.';
 end if;
 return new;
end;
$$;
revoke all on function private.r3219_denuncia_detall_valid() from public,anon,authenticated,service_role;
drop trigger if exists r3219_denuncia_detall_valid on public.denuncies;
create trigger r3219_denuncia_detall_valid before insert or update of detall on public.denuncies
 for each row execute function private.r3219_denuncia_detall_valid();
do $constraint$
declare actual pg_catalog.text; tipus pg_catalog."char";
begin
 select pg_catalog.pg_get_expr(conbin,conrelid,false),contype into actual,tipus
 from pg_catalog.pg_constraint where conrelid='private.r3213_lssi_audit'::pg_catalog.regclass and conname='r3219_r3213_lssi_audit_justificacio_text_valid';
 if found then
  if tipus <> 'c' or actual is distinct from '((justificacio IS NULL) OR private.r3219_lssi_text_valid(justificacio))' then
   raise exception 'SDP-R3219-DRIFT: constraint r3213_lssi_audit';
  end if;
 else
  alter table private.r3213_lssi_audit add constraint r3219_r3213_lssi_audit_justificacio_text_valid check (justificacio is null or private.r3219_lssi_text_valid(justificacio)) not valid;
 end if;
end;
$constraint$;
do $constraint$
declare actual pg_catalog.text; tipus pg_catalog."char";
begin
 select pg_catalog.pg_get_expr(conbin,conrelid,false),contype into actual,tipus
 from pg_catalog.pg_constraint where conrelid='private.lssi_revisions'::pg_catalog.regclass and conname='r3219_lssi_revisions_justificacio_text_valid';
 if found then
  if tipus <> 'c' or actual is distinct from '((justificacio IS NULL) OR private.r3219_lssi_text_valid(justificacio))' then
   raise exception 'SDP-R3219-DRIFT: constraint lssi_revisions';
  end if;
 else
  alter table private.lssi_revisions add constraint r3219_lssi_revisions_justificacio_text_valid check (justificacio is null or private.r3219_lssi_text_valid(justificacio)) not valid;
 end if;
end;
$constraint$;

do $post$ begin
 if not exists(select 1 from pg_catalog.pg_proc where oid='public.registra_denuncia_diligent(uuid,text,text,uuid)'::pg_catalog.regprocedure and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex')='98629dfe430647b45314dd7b3741747c5540e112f25cb08d31e70c182c73f990' and prosecdef and proconfig=array['search_path=""']::pg_catalog.text[]) then raise exception 'SDP-R3219-POST: public.registra_denuncia_diligent'; end if;
 if not exists(select 1 from pg_catalog.pg_proc where oid='public.revisa_denuncia_diligent(uuid,text,integer,text,text,uuid)'::pg_catalog.regprocedure and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex')='c881fb7948342e5f16cefe2d7b2038ab5a778f8459474d2fd4fc72b561ade96a' and prosecdef and proconfig=array['search_path=""']::pg_catalog.text[]) then raise exception 'SDP-R3219-POST: public.revisa_denuncia_diligent'; end if;
 if not exists(select 1 from pg_catalog.pg_proc where oid='public.admin_revisa_denuncia_lssi(uuid,text,text,text)'::pg_catalog.regprocedure and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex')='9af0abaa0fae89fbe11d609b1e777aef9b9c04ebddd4e36d3bec27278b90ad45' and prosecdef and proconfig=array['search_path=""']::pg_catalog.text[]) then raise exception 'SDP-R3219-POST: public.admin_revisa_denuncia_lssi'; end if;
 if not exists(select 1 from pg_catalog.pg_proc where oid='private.r3219_denuncia_detall_valid()'::pg_catalog.regprocedure and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex')='63e51771e44a2d3c267daf8c4f8ef0aebb81c8848816ca089d0533b3d60119d4' and prosecdef and proconfig=array['search_path=""']::pg_catalog.text[]) then raise exception 'SDP-R3219-POST: trigger de detall'; end if;
end; $post$;
notify pgrst,'reload schema';
commit;
