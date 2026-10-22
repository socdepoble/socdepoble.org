-- PostgreSQL real, padró sintètic. Gauntlet 261022_0225 (crítica Claude) · Les
-- comprovacions que no necessiten cap objecte de Storage; el flux sencer
-- (sonda, pujada, publicació i lectura) el fa tests/xat-multimedia-postgres.audit.mjs.
-- Corre com a superusuari en els dos camins (postgres:15 o supabase/postgres).
\set ON_ERROR_STOP on
insert into auth.users(id) values
 ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002'),
 ('10000000-0000-4000-8000-000000000003'),('10000000-0000-4000-8000-000000000004');
insert into profiles(id,full_name) select id,'Veí de prova' from auth.users;
insert into towns(id) values ('20000000-0000-4000-8000-000000000001');
insert into town_memberships select '20000000-0000-4000-8000-000000000001',id from auth.users;
insert into xat_fils(id,tenant_id,creat_per,tipus) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','grup'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','grup');
insert into xat_participants(fil_id,usuari_id) select f.id,u.id from xat_fils f cross join auth.users u where u.id <> '10000000-0000-4000-8000-000000000003' on conflict do nothing;
-- La crida ha de fallar amb el codi (SDP-XAT-0xx) o l'SQLSTATE indicat.
create function pg_temp.falla(p_sql text, p_codi text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'ESPERAVA % i ha passat: %', p_codi, p_sql;
exception when others then
  if sqlerrm like 'ESPERAVA%' or position(p_codi in sqlerrm || ' ' || sqlstate) = 0 then raise; end if;
end $$;
begin;
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
do $$ declare r jsonb; begin
  r := xat_reserva_adjunt('40000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000001',1000,'image/webp');
  if r->>'ruta' <> '40000000-0000-4000-8000-000000000101' or (r->>'pujat')::boolean then raise exception 'ruta revela propietari o objecte inventat'; end if;
  perform xat_reserva_adjunt('40000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000001',1000,'image/webp');
  if (xat_quota()->>'usats')::bigint <> 1000 then raise exception 'quota duplicada'; end if;
end $$;
-- Idempotència: el mateix id amb una altra mida és un altre enviament.
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000001',1001,'image/webp')$q$, 'SDP-XAT-008');
-- F12 · Sostre per tipus, mínim de 64 bytes i llista tancada (sense PNG).
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',2000001,'image/jpeg')$q$, 'SDP-XAT-020');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',3000001,'audio/mp4',1000)$q$, 'SDP-XAT-020');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',63,'image/webp')$q$, 'SDP-XAT-009');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',1000,'image/png')$q$, 'SDP-XAT-009');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',1000,'text/html')$q$, 'SDP-XAT-009');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',9223372036854775807,'video/mp4',5000)$q$, 'SDP-XAT-020');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',1000,'video/mp4',10001)$q$, '23514');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000001',1000,'video/mp4')$q$, '23514');
-- F14 · El QuickTime de l'iPhone entra, amb el sostre del vídeo.
do $$ begin
  perform xat_reserva_adjunt('40000000-0000-4000-8000-000000000103','30000000-0000-4000-8000-000000000001',5000,'video/quicktime',8000);
  if not xat_cancella_reserva('40000000-0000-4000-8000-000000000103') then raise exception 'reserva sense objecte no alliberada'; end if;
  if (xat_quota()->>'usats')::bigint <> 1000 then raise exception 'quota no recuperada'; end if;
end $$;
-- F1 · La sonda: només POST o TUS, la reserva pròpia i oberta, MIME i llargària exactes.
set local storage.operation = 'storage.object.upload';
do $$ begin
  if not private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'sonda legítima rebutjada'; end if;
  if not private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp; charset=x","contentLength":1000}') then raise exception 'paràmetres del MIME no ignorats'; end if;
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":1001}') then raise exception 'llargària falsa acceptada'; end if;
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":"1000"}') then raise exception 'llargària en text acceptada'; end if;
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp"}') then raise exception 'sonda sense llargària acceptada'; end if;
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/jpeg","contentLength":1000}') then raise exception 'MIME fals acceptat'; end if;
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', null) then raise exception 'sonda sense metadades acceptada'; end if;
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101'::text || '/x', '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'ruta no canònica acceptada'; end if;
  if private.xat_pujable_adjunt(upper('40000000-0000-4000-8000-0000000001ab'), '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'ruta en majúscules acceptada'; end if;
end $$;
set local storage.operation = 'storage.object.sign_upload_url';
do $$ begin
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'URL de pujada signada acceptada'; end if;
end $$;
set local storage.operation = 'storage.object.upload';
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
do $$ begin
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'reserva aliena pujable'; end if;
end $$;
-- La finestra de pujada: 15 minuts; el reintent la renova.
reset role;
update xat_adjunts set creat_al = now() - interval '20 minutes' where id = '40000000-0000-4000-8000-000000000101';
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000001';
do $$ begin
  if private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'reserva vella pujable'; end if;
  perform xat_reserva_adjunt('40000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000001',1000,'image/webp');
  if not private.xat_pujable_adjunt('40000000-0000-4000-8000-000000000101', '{"mimetype":"image/webp","contentLength":1000}') then raise exception 'el reintent no renova la finestra'; end if;
end $$;
-- Sense objecte confirmat no es publica.
select pg_temp.falla($q$select xat_publica_adjunt('40000000-0000-4000-8000-000000000101', null)$q$, 'SDP-XAT-021');
-- F2 · Un id a la cua de purga no es torna a reservar.
reset role;
insert into private.purga_storage_pendent(user_id, bucket_id, nom, referenciat)
  values ('10000000-0000-4000-8000-000000000001', 'xat_adjunts', '40000000-0000-4000-8000-000000000104', false);
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000002';
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000104','30000000-0000-4000-8000-000000000001',1000,'image/webp')$q$, 'SDP-XAT-008');
-- Qui no participa no reserva; anon no hi entra.
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000003';
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000105','30000000-0000-4000-8000-000000000001',1000,'image/webp')$q$, 'SDP-XAT-006');
set local role anon;
select pg_temp.falla($q$select xat_quota()$q$, '42501');
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000105','30000000-0000-4000-8000-000000000001',1000,'image/webp')$q$, '42501');
-- F3 · Deu pendents com a molt (revisió R5: SDP-XAT-022), i seixanta adjunts
-- vius reservats en l'última hora (R4: SDP-XAT-429).
set local role authenticated;
set local request.jwt.claim.sub='10000000-0000-4000-8000-000000000004';
do $$ begin
  for i in 1..10 loop
    perform xat_reserva_adjunt(('40000000-0000-4000-8000-0000000002' || lpad(i::text, 2, '0'))::uuid,'30000000-0000-4000-8000-000000000001',64,'image/webp');
  end loop;
  if jsonb_array_length(xat_quota()->'pendents') <> 10 then raise exception 'pendents mal comptats'; end if;
end $$;
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000211','30000000-0000-4000-8000-000000000001',64,'image/webp')$q$, 'SDP-XAT-022');
reset role;
update xat_adjunts set publicat = true, versio = 'v' where usuari_id = '10000000-0000-4000-8000-000000000004';
insert into xat_adjunts(id, usuari_id, fil_id, bytes, mime, publicat, versio)
  select gen_random_uuid(), '10000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', 64, 'image/webp', true, 'v' from generate_series(1, 50);
set local role authenticated;
select pg_temp.falla($q$select xat_reserva_adjunt('40000000-0000-4000-8000-000000000211','30000000-0000-4000-8000-000000000001',64,'image/webp')$q$, 'SDP-XAT-429');
reset role;
update xat_adjunts set creat_al = now() - interval '2 hours' where usuari_id = '10000000-0000-4000-8000-000000000004';
set local role authenticated;
select xat_reserva_adjunt('40000000-0000-4000-8000-000000000211','30000000-0000-4000-8000-000000000001',64,'image/webp');
-- F10 · La taula no té cap permís per al client; service_role, el mínim.
reset role;
do $$ begin
  if has_table_privilege('authenticated', 'public.xat_adjunts', 'select') or has_table_privilege('anon', 'public.xat_adjunts', 'select') then raise exception 'taula oberta al client'; end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') and (not has_table_privilege('service_role', 'public.xat_adjunts', 'select')
    or not has_table_privilege('service_role', 'public.xat_adjunts', 'delete') or has_table_privilege('service_role', 'public.xat_adjunts', 'insert')) then
    raise exception 'permisos de service_role diferents dels declarats';
  end if;
end $$;
rollback;
