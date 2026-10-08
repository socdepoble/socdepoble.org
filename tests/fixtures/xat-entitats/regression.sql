-- Prova d'integració després del bootstrap, Xat v2/correccions/F0, T16 i
-- 2610081543 (B03): sense eixa migració, les comprovacions de B03 fallen.
-- Tot el padró és sintètic, viu en una transacció i acaba en ROLLBACK.
\set ON_ERROR_STOP on
begin;
insert into auth.users (id) select ('10000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid from generate_series(1,6) i;
insert into public.profiles(id, full_name, avatar_url)
select id, case right(id::text,1) when '1' then 'Client A' when '2' then 'Client B'
  when '3' then 'Propietària' when '4' then 'Administradora' when '5' then 'Membre' else 'Altre poble' end,
  '/avatar-test.png' from auth.users;
-- 2610081543 (B03) · membres_del_poble llig consentiment_rgpd_at i
-- crea_fil_directe rebutja un directe NOU cap a una persona sense consentiment
-- (SDP-XAT-016). La taula mínima de bootstrap.sql no porta la columna (la real
-- la té des de 2609080000): s'hi afig dins d'esta transacció, que acaba en
-- ROLLBACK. Només la Propietària (…0003) hi consent: és l'única persona amb qui
-- la prova obri un directe nou (v_directe); la resta de directes són amb
-- entitats, que no tenen consentiment personal. Revisió del 261008 · La prova
-- comprova també les dues garanties en negatiu: les persones sense
-- consentiment (…0002, …0004 i …0005) no ixen al padró i un directe nou cap a
-- …0005 rep SDP-XAT-016; i que retirar el consentiment no tanca el directe que
-- ja existix (es retroba), però sí que trau la persona del padró.
alter table public.profiles add column if not exists consentiment_rgpd_at timestamptz;
update public.profiles set consentiment_rgpd_at = now() where id = '10000000-0000-0000-0000-000000000003';
insert into public.towns values ('20000000-0000-0000-0000-000000000001'), ('20000000-0000-0000-0000-000000000002');
insert into public.town_memberships
select '20000000-0000-0000-0000-000000000001', id from auth.users where right(id::text,1) <> '6';
insert into public.town_memberships values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006');
insert into public.organizations(id,tenant_id,name,slug,logo_url,visibility) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Entitat de prova','entitat-test','/logo-test.png','public'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Entitat aliena','entitat-aliena',null,'public'),
 ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Entitat privada','entitat-privada',null,'members');
insert into public.organization_memberships values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','owner'),
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','admin'),
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','member');

set local role anon;
do $$ begin
  begin perform * from public.membres_del_poble('20000000-0000-0000-0000-000000000001');
    raise exception 'Anon ha enumerat el padró'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
do $$ declare v_fil uuid; v_directe uuid; v_m record; v_seq bigint; begin
  if (select count(*) from public.membres_del_poble('20000000-0000-0000-0000-000000000001') where tipus='entitat') <> 1 then
    raise exception 'El directori exposa entitats alienes o privades'; end if;
  if not exists (select 1 from public.membres_del_poble('20000000-0000-0000-0000-000000000001')
    where usuari_id='30000000-0000-0000-0000-000000000001' and avatar_url='/logo-test.png') then
    raise exception 'Falta ID/avatar real de l’entitat'; end if;
  -- B03 · Al padró només hi ha les persones amb consentiment: la Propietària.
  if (select array_agg(usuari_id order by usuari_id) from public.membres_del_poble('20000000-0000-0000-0000-000000000001')
    where tipus='persona') is distinct from array['10000000-0000-0000-0000-000000000003'::uuid] then
    raise exception 'B03: el padró mostra persones sense consentiment o amaga la que en té'; end if;
  -- B03 · Cap directe nou amb una persona sense consentiment, i amb el codi propi.
  begin perform public.crea_fil_directe('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005');
    raise exception 'B03: s’ha obert un directe nou amb una persona sense consentiment';
  exception when insufficient_privilege then
    if position('SDP-XAT-016' in sqlerrm) <> 1 then raise exception 'B03: error inesperat: %', sqlerrm; end if;
  end;
  begin perform public.crea_fil_directe('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002');
    raise exception 'S’ha creat conversa entre tenants'; exception when insufficient_privilege then null; end;
  begin perform * from public.membres_del_poble('20000000-0000-0000-0000-000000000002');
    raise exception 'S’ha enumerat un padró alié'; exception when insufficient_privilege then null; end;
  v_fil := public.crea_fil_directe('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
  perform set_config('sdp_test.fil_a',v_fil::text,true);
  if exists (select 1 from public.xat_participants where fil_id=v_fil and usuari_id<>auth.uid()) then
    raise exception 'El client pot enumerar l’equip d’entitat per lectura directa'; end if;
  if public.crea_fil_directe('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001') <> v_fil then
    raise exception 'La creació d’entitat no és idempotent'; end if;
  v_directe := public.crea_fil_directe('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003');
  perform set_config('sdp_test.directe',v_directe::text,true);
  if v_fil = v_directe then raise exception 'El fil personal reutilitza el de l’entitat'; end if;
  select * into v_m from public.xat_envia('40000000-0000-0000-0000-000000000001',v_fil,'text','Hola entitat',null,
    '{"com_org_id":"30000000-0000-0000-0000-000000000001","autor_nom":"Suplantació"}');
  if v_m.com_org_id is not null or v_m.autor_nom <> 'Client A' then raise exception 'Client suplanta l’entitat'; end if;
  v_seq := v_m.seq;
  select * into v_m from public.xat_envia('40000000-0000-0000-0000-000000000001',v_fil,'text','Reintent');
  if v_m.seq is distinct from v_seq or (select ultim_seq from public.xat_fils where id=v_fil) <> v_seq then
    raise exception 'El reintent consumix seq'; end if;
  begin perform * from public.xat_envia('40000000-0000-0000-0000-000000000001',v_directe,'text','Un altre fil');
    raise exception 'S’ha reutilitzat el mateix id en un altre fil'; exception when insufficient_privilege then null; end;
  if exists (select 1 from public.xat_historial(v_fil) where metadades ? 'com_org_id' or metadades ? 'autor_nom') then
    raise exception 'Metadades amb autoria suplantada'; end if;
  if not exists (select 1 from public.xat_fils_meus('20000000-0000-0000-0000-000000000001')
    where id=v_fil and org_id='30000000-0000-0000-0000-000000000001' and not com_entitat
      and altres->0->>'id'='30000000-0000-0000-0000-000000000001' and altres->0->>'avatarUrl'='/logo-test.png'
      and jsonb_array_length(altres)=1) then raise exception 'El client no veu l’entitat com a interlocutora única'; end if;
end $$;

-- B03 · La Propietària retira el consentiment: el directe que ja existix es
-- retroba (la migració no el tanca), però ja no ix al padró. Després es
-- restaura, perquè la resta de la prova no en depenga.
reset role;
update public.profiles set consentiment_rgpd_at = null where id = '10000000-0000-0000-0000-000000000003';
set local role authenticated;
do $$ begin
  if public.crea_fil_directe('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003')
    is distinct from current_setting('sdp_test.directe')::uuid then
    raise exception 'B03: retirar el consentiment ha tancat o duplicat el directe existent'; end if;
  if exists (select 1 from public.membres_del_poble('20000000-0000-0000-0000-000000000001')
    where usuari_id='10000000-0000-0000-0000-000000000003') then
    raise exception 'B03: el padró mostra una persona que ha retirat el consentiment'; end if;
end $$;
reset role;
update public.profiles set consentiment_rgpd_at = now() where id = '10000000-0000-0000-0000-000000000003';
set local role authenticated;

-- El segon client no comparteix el fil, el seu contingut ni els participants.
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; v_b uuid; begin
  v_b := public.crea_fil_directe('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
  perform set_config('sdp_test.fil_b',v_b::text,true);
  if v_a=v_b then raise exception 'Dos clients comparteixen fil privat'; end if;
  if exists (select 1 from public.xat_missatges where fil_id=v_a) or exists (select 1 from public.xat_participants where fil_id=v_a) then
    raise exception 'RLS filtra dades d’un altre client'; end if;
  begin perform * from public.xat_historial(v_a); raise exception 'RPC filtra historial alié'; exception when insufficient_privilege then null; end;
  begin perform * from public.xat_marca(v_a); raise exception 'RPC marca fil alié'; exception when insufficient_privilege then null; end;
  perform * from public.xat_envia('40000000-0000-0000-0000-000000000002',v_b,'text','Hola de B');
end $$;

-- Representant: dos fils separats, autoria real d'entitat, sense revelar l'equip.
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; v_m record; begin
  if (select count(*) from public.xat_fils_meus('20000000-0000-0000-0000-000000000001') where com_entitat) <> 2 then
    raise exception 'La propietària no rep els dos clients'; end if;
  if not exists (select 1 from public.xat_fils_meus('20000000-0000-0000-0000-000000000001')
    where id=v_a and com_entitat and altres->0->>'nom'='Client A' and jsonb_array_length(altres)=1) then
    raise exception 'El costat d’entitat no mostra exclusivament el client'; end if;
  select * into v_m from public.xat_envia('40000000-0000-0000-0000-000000000003',v_a,'text','Resposta de l’entitat',null,
    '{"com_org_id":"30000000-0000-0000-0000-000000000002"}');
  if v_m.com_org_id is distinct from '30000000-0000-0000-0000-000000000001'::uuid or v_m.autor_nom is distinct from 'Entitat de prova'
    or v_m.usuari_id is distinct from '10000000-0000-0000-0000-000000000003'::uuid then raise exception 'Autoria d’entitat incorrecta'; end if;
  begin perform * from public.xat_envia('40000000-0000-0000-0000-000000000001',v_a,'text','ID del client');
    raise exception 'S’ha reutilitzat l’id d’un altre actor'; exception when insufficient_privilege then null; end;
  if not exists (select 1 from public.xat_nous(v_a,0) where com_org_id='30000000-0000-0000-0000-000000000001' and autor_nom='Entitat de prova') then
    raise exception 'Nous no torna autoria d’entitat'; end if;
  if not exists (select 1 from public.xat_historial(v_a) where com_org_id='30000000-0000-0000-0000-000000000001' and autor_nom='Entitat de prova') then
    raise exception 'Historial no torna autoria d’entitat'; end if;
end $$;

-- Un reintent acceptat no depén de la visibilitat posterior de la cita.
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select * from public.xat_envia('40000000-0000-0000-0000-000000000010',current_setting('sdp_test.fil_a')::uuid,
  'text','Resposta amb cita','40000000-0000-0000-0000-000000000001');
reset role;
update public.xat_missatges set caduca_al=now()-interval '1 second' where id='40000000-0000-0000-0000-000000000001';
update public.xat_participants set buidat_fins_seq=1
  where fil_id=current_setting('sdp_test.fil_a')::uuid and usuari_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; v_seq bigint; v_m record; begin
  select ultim_seq into v_seq from public.xat_fils where id=v_a;
  select * into v_m from public.xat_envia('40000000-0000-0000-0000-000000000010',v_a,
    'text','Resposta amb cita','40000000-0000-0000-0000-000000000001');
  if v_m.seq is distinct from v_seq or (select ultim_seq from public.xat_fils where id=v_a) <> v_seq then
    raise exception 'La cita buidada/caducada trenca el reintent idempotent'; end if;
  begin perform * from public.xat_envia('40000000-0000-0000-0000-000000000011',v_a,
    'text','Nova resposta amb cita caducada','40000000-0000-0000-0000-000000000001');
    raise exception 'Es pot crear una nova cita sobre missatge invisible'; exception when invalid_parameter_value then null; end;
end $$;

-- El membre ordinari no rep converses de clients. Una promoció posterior sí.
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000005';
do $$ begin
  if exists (select 1 from public.xat_fils_meus('20000000-0000-0000-0000-000000000001')) then
    raise exception 'Membre ordinari ha rebut converses privades'; end if;
end $$;
reset role;
update public.organization_memberships set role='admin' where user_id='10000000-0000-0000-0000-000000000005';
set local role authenticated;
do $$ begin
  if (select count(*) from public.xat_fils_meus('20000000-0000-0000-0000-000000000001') where com_entitat) <> 2 then
    raise exception 'L’alta posterior de gestora no rep els fils existents'; end if;
end $$;

-- Baixa de rol i eliminació de membership: tots els canals d'accés es tanquen.
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000004';
select * from public.xat_marca(current_setting('sdp_test.fil_a')::uuid);
reset role;
update public.organization_memberships set role='member' where user_id='10000000-0000-0000-0000-000000000004';
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
do $$ begin
  if exists (select 1 from public.xat_participants where fil_id=current_setting('sdp_test.fil_a')::uuid
    and usuari_id='10000000-0000-0000-0000-000000000004') then
    raise exception 'La gestora encara pot enumerar membres revocats'; end if;
end $$;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
do $$ begin
  if exists (select 1 from public.xat_participants where fil_id=current_setting('sdp_test.fil_a')::uuid
    and usuari_id<>auth.uid()) then raise exception 'Client veu equip actual o revocat'; end if;
end $$;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000004';
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; begin
  if exists (select 1 from public.xat_fils where id=v_a)
    or exists (select 1 from public.xat_participants where fil_id=v_a)
    or exists (select 1 from public.xat_missatges where fil_id=v_a)
    or exists (select 1 from public.xat_lectures where fil_id=v_a)
    or exists (select 1 from public.xat_fils_meus('20000000-0000-0000-0000-000000000001') where id=v_a) then
    raise exception 'La revocació conserva accés RLS/llista'; end if;
  begin perform * from public.xat_historial(v_a); raise exception 'Revocat llig historial'; exception when insufficient_privilege then null; end;
  begin perform * from public.xat_nous(v_a,0); raise exception 'Revocat llig nous'; exception when insufficient_privilege then null; end;
  begin perform * from public.xat_missatges_del_fil(v_a); raise exception 'Revocat llig RPC antiga'; exception when insufficient_privilege then null; end;
  begin perform * from public.xat_envia('40000000-0000-0000-0000-000000000004',v_a,'text','Revocat'); raise exception 'Revocat envia'; exception when insufficient_privilege then null; end;
  begin perform * from public.xat_marca(v_a); raise exception 'Revocat marca'; exception when insufficient_privilege then null; end;
  begin perform public.xat_marca_llegit(v_a); raise exception 'Revocat marca RPC antiga'; exception when insufficient_privilege then null; end;
  begin insert into public.xat_lectures(fil_id,usuari_id) values (v_a,auth.uid());
    raise exception 'Revocat inserix marca directa'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.organization_memberships where user_id='10000000-0000-0000-0000-000000000003';
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; begin
  if exists (select 1 from public.xat_missatges where fil_id=v_a) then raise exception 'Propietària esborrada llig RLS'; end if;
  begin perform * from public.xat_historial(v_a); raise exception 'Propietària esborrada llig RPC'; exception when insufficient_privilege then null; end;
  begin perform * from public.xat_envia('40000000-0000-0000-0000-000000000005',v_a,'text','Sense rol'); raise exception 'Propietària esborrada envia'; exception when insufficient_privilege then null; end;
end $$;

-- La baixa del poble tanca també el costat client.
reset role;
delete from public.town_memberships where user_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; begin
  if exists (select 1 from public.xat_missatges where fil_id=v_a) then raise exception 'Client fora del poble llig RLS'; end if;
  begin perform * from public.xat_historial(v_a); raise exception 'Client fora del poble llig RPC'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.town_memberships values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001');

-- Esborrar l'entitat no transforma les converses en fils personals accessibles.
delete from public.organizations where id='30000000-0000-0000-0000-000000000001';
set local role authenticated;
do $$ declare v_a uuid := current_setting('sdp_test.fil_a')::uuid; begin
  if exists (select 1 from public.xat_missatges where fil_id=v_a)
    or exists (select 1 from public.xat_fils_meus('20000000-0000-0000-0000-000000000001') where id=v_a) then
    raise exception 'Entitat esborrada ha convertit el fil en personal'; end if;
  begin perform * from public.xat_historial(v_a); raise exception 'Llig fil d’entitat esborrada'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo 'T16 i B03: directori, consentiment, dos clients privats, autoria, idempotència, tenants i revocació OK'
