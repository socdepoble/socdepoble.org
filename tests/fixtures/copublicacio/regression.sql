-- Contra PostgreSQL LOCAL amb el bootstrap i les migracions de la fixture.
-- Una transacció i ROLLBACK: només usa comptes, entitats i textos sintètics.
begin;

insert into public.towns (id, slug, name) values
  ('11000000-0000-4000-8000-000000000001', 'prova-copub-a', 'Poble de prova A'),
  ('11000000-0000-4000-8000-000000000002', 'prova-copub-b', 'Poble de prova B');
insert into auth.users (id, email_confirmed_at, raw_user_meta_data)
select ('22000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  case when i <> 4 then now() end,
  jsonb_build_object('name', 'Persona de prova ' || i, 'tenant_id', '11000000-0000-4000-8000-000000000001')
from generate_series(1, 4) i;
update public.profiles set is_public = true
where id in ('22000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000004');
insert into public.user_platform_roles (user_id, role)
values ('22000000-0000-4000-8000-000000000001', 'superadmin');

insert into public.organizations (id, tenant_id, slug, name, kind, created_by) values
  ('33000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'entitat-prova-a', 'Entitat de prova A', 'entity',
   '22000000-0000-4000-8000-000000000001'),
  ('33000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002', 'entitat-prova-b', 'Entitat de prova B', 'entity',
   '22000000-0000-4000-8000-000000000002'),
  ('33000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000001', 'sense-propietaria', 'Entitat sense compte gestor', 'entity',
   '22000000-0000-4000-8000-000000000003'),
  ('33000000-0000-4000-8000-000000000004', '11000000-0000-4000-8000-000000000002', 'rentonar', 'Entitat homònima de prova', 'entity',
   '22000000-0000-4000-8000-000000000003');
delete from public.organization_memberships where organization_id = '33000000-0000-4000-8000-000000000003';
insert into private.ajustos (clau, valor) values
  ('copublicacio_actor_socdepoble', '33000000-0000-4000-8000-000000000002'),
  ('copublicacio_actor_rentonar', '33000000-0000-4000-8000-000000000001');

insert into public.app_content (tenant_id, key, payload) values
  ('11000000-0000-4000-8000-000000000001', 'pages',
   '[{"id":"pagina-copub-prova","authorName":"Autoria sintètica","copyright":"CC BY 4.0","content":"Font sintètica"}]'),
  ('11000000-0000-4000-8000-000000000002', 'pages',
   '[{"id":"pagina-copub-prova","authorName":"Autoria sintètica B","copyright":"CC0"}]');
insert into public.section_submissions (id, tenant_id, owner_user_id, section_id, title, payload) values
  ('44000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001',
   '22000000-0000-4000-8000-000000000002', 'mur', 'Article de prova', '{}'),
  ('44000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000001',
   '22000000-0000-4000-8000-000000000002', 'notes', 'Nota de prova', '{}');

set local role anon;
do $$
declare
  poble uuid := '11000000-0000-4000-8000-000000000001';
  resultat jsonb;
begin
  if has_function_privilege(current_user, 'public.traspassa_publicacio(uuid,text,text,integer,uuid,uuid,uuid[],boolean)', 'EXECUTE')
    or has_table_privilege(current_user, (select c.oid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private' and c.relname = 'publicacio_publicadors'), 'SELECT')
    or has_table_privilege(current_user, (select c.oid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private' and c.relname = 'publicacio_traspassos'), 'SELECT') then
    raise exception 'anon disposa de drets directes';
  end if;
  resultat := public.llig_publicadors_registrats(poble, 'llibre_cataleg', 'la-torre-de-les-macanes');
  if resultat #>> '{publicadorsRegistrats,0,actor_id}' is distinct from '33000000-0000-4000-8000-000000000001' then
    raise exception 'El llibre perd el publicador original o tria l’entitat homònima';
  end if;
  resultat := public.llig_publicadors_registrats(poble, 'article', '44000000-0000-4000-8000-000000000001');
  if resultat->'publicadorsRegistrats' is distinct from '[]'::jsonb then
    raise exception 'Anon pot identificar qui ha publicat un article restringit al poble';
  end if;
end $$;

set local role authenticated;
set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000001';
set local request.jwt.claim.aal = 'aal1';
do $$ begin
  perform public.traspassa_publicacio('11000000-0000-4000-8000-000000000001', 'pagina', 'pagina-copub-prova',
    0, '55000000-0000-4000-8000-000000000001', '33000000-0000-4000-8000-000000000001', '{}', false);
  raise exception 'Superadmin aal1 ha transferit';
exception when insufficient_privilege then
  if sqlerrm not like 'SDP-COPUB-007:%' then raise; end if;
end $$;

set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000002';
set local request.jwt.claim.aal = 'aal2';
do $$ begin
  perform public.traspassa_publicacio('11000000-0000-4000-8000-000000000001', 'pagina', 'pagina-copub-prova',
    0, '55000000-0000-4000-8000-000000000001', '33000000-0000-4000-8000-000000000001', '{}', false);
  raise exception 'Compte sense rol ha transferit';
exception when insufficient_privilege then
  if sqlerrm not like 'SDP-COPUB-008:%' then raise; end if;
end $$;

set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000001';
do $$
declare
  poble uuid := '11000000-0000-4000-8000-000000000001';
  poble_b uuid := '11000000-0000-4000-8000-000000000002';
  entitat uuid := '33000000-0000-4000-8000-000000000001';
  persona uuid := '22000000-0000-4000-8000-000000000002';
  operacio uuid := '55000000-0000-4000-8000-000000000001';
  reversio uuid := '55000000-0000-4000-8000-000000000002';
  rebutjada uuid := '55000000-0000-4000-8000-000000000003';
  actor_invalid uuid;
  resultat jsonb;
begin
  if has_table_privilege(current_user, 'private.publicacio_publicadors', 'UPDATE')
    or has_table_privilege(current_user, 'private.publicacio_traspassos', 'INSERT')
    or has_column_privilege(current_user, 'public.organizations', 'id', 'INSERT')
    or has_table_privilege(current_user, (select c.oid from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'private' and c.relname = 'publicacio_traspassos'), 'SELECT') then
    raise exception 'authenticated disposa de drets directes sobre el registre';
  end if;
  resultat := public.llig_publicadors_registrats(poble, 'article', '44000000-0000-4000-8000-000000000001');
  if resultat #>> '{publicadorsRegistrats,0,actor_id}' is distinct from persona::text
    or resultat #>> '{publicadorsRegistrats,0,slug_ruta}' is distinct from '/perfil/' || persona::text || '?registre=persona' then
    raise exception 'El Mur no deriva el seu publicador de l’origen autoritatiu';
  end if;
  foreach actor_invalid in array array[
    '33000000-0000-4000-8000-000000000003'::uuid, -- organització sense compte gestor
    '33000000-0000-4000-8000-000000000099'::uuid, -- actor absent
    '22000000-0000-4000-8000-000000000003'::uuid, -- perfil privat
    '22000000-0000-4000-8000-000000000004'::uuid  -- compte sense confirmar
  ] loop
    begin
      perform public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, rebutjada, actor_invalid, '{}', false);
      raise exception 'La RPC ha acceptat un actor no elegible';
    exception when invalid_parameter_value then
      if sqlerrm not like 'SDP-COPUB-003:%' then raise; end if;
    end;
  end loop;
  begin
    perform public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, rebutjada, entitat, array[entitat], false);
    raise exception 'La RPC ha acceptat un actor repetit';
  exception when invalid_parameter_value then
    if sqlerrm not like 'SDP-COPUB-001:%' then raise; end if;
  end;
  begin
    perform public.traspassa_publicacio(poble, 'pagina', 'pagina-inventada', 0, rebutjada, entitat, '{}', false);
    raise exception 'La RPC ha acceptat un recurs inexistent';
  exception when no_data_found then
    if sqlerrm not like 'SDP-COPUB-002:%' then raise; end if;
  end;
  begin
    perform public.traspassa_publicacio(poble, 'article', '44000000-0000-4000-8000-000000000002', 0, rebutjada, entitat, '{}', false);
    raise exception 'La RPC ha acceptat una nota com a article';
  exception when no_data_found then
    if sqlerrm not like 'SDP-COPUB-002:%' then raise; end if;
  end;

  resultat := public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, operacio, entitat, array[persona], true);
  if resultat->>'versio' is distinct from '1' or resultat->>'repetida' is distinct from 'false'
    or resultat #>> '{publicadorsRegistrats,0,actor_id}' is distinct from entitat::text
    or resultat #>> '{publicadorsRegistrats,0,rol_publicacio}' is distinct from 'principal'
    or resultat #>> '{publicadorsRegistrats,0,slug_ruta}' is distinct from '/perfil/' || entitat::text || '?registre=organitzacio'
    or resultat #>> '{publicadorsRegistrats,1,actor_id}' is distinct from persona::text
    or resultat #>> '{publicadorsRegistrats,2,actor_id}' is distinct from '33000000-0000-4000-8000-000000000002'
    or resultat #>> '{publicadorsRegistrats,2,rol_publicacio}' is distinct from 'copublicador' then
    raise exception 'Traspassar no ha preservat l’ordre, els actors o la versió';
  end if;
  if (public.llig_publicadors_registrats(poble_b, 'pagina', 'pagina-copub-prova')->>'versio') is distinct from '0' then
    raise exception 'Traspàs filtrat a un altre poble';
  end if;
  resultat := public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, operacio, entitat, array[persona], true);
  if resultat->>'repetida' is distinct from 'true' or resultat->>'versioOperacio' is distinct from '1' then
    raise exception 'El reintent no ha recuperat el mateix rebut';
  end if;
  begin
    perform public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, operacio, persona, '{}', false);
    raise exception 'El mateix UUID d’operació ha acceptat una altra petició';
  exception when invalid_parameter_value then
    if sqlerrm not like 'SDP-COPUB-005:%' then raise; end if;
  end;
  begin
    perform public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, rebutjada, entitat, '{}', false);
    raise exception 'Una edició concurrent amb versió obsoleta ha pogut escriure';
  exception when serialization_failure then
    if sqlerrm not like 'SDP-COPUB-004:%' then raise; end if;
  end;
  resultat := public.reverteix_traspas_publicacio(poble, 'pagina', 'pagina-copub-prova', 1, reversio, operacio);
  if resultat->>'versio' is distinct from '2' or resultat->'publicadorsRegistrats' is distinct from '[]'::jsonb then
    raise exception 'La reversió no ha recuperat l’origen ni ha conservat el CAS';
  end if;
  resultat := public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 0, operacio, entitat, array[persona], true);
  if resultat->>'repetida' is distinct from 'true' or resultat->>'versioOperacio' is distinct from '1'
    or resultat->>'versio' is distinct from '2' then
    raise exception 'Un reintent antic ha reintroduït estat desfasat';
  end if;
  begin
    perform public.reverteix_traspas_publicacio(poble, 'pagina', 'pagina-copub-prova', 2, rebutjada, operacio);
    raise exception 'La RPC ha revertit una operació que ja no era la vigent';
  exception when serialization_failure then
    if sqlerrm not like 'SDP-COPUB-004:%' then raise; end if;
  end;
  perform public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 2, rebutjada, persona, array[entitat], false);
  perform public.traspassa_publicacio(poble, 'article', '44000000-0000-4000-8000-000000000001', 0,
    '55000000-0000-4000-8000-000000000004', entitat, '{}', false);
end $$;

set local role anon;
set local request.jwt.claim.sub = '';
do $$ declare resultat jsonb; begin
  resultat := public.llig_publicadors_registrats('11000000-0000-4000-8000-000000000001', 'pagina', 'pagina-copub-prova');
  if jsonb_array_length(resultat->'publicadorsRegistrats') <> 1
    or resultat #>> '{publicadorsRegistrats,0,actor_id}' is distinct from '33000000-0000-4000-8000-000000000001'
    or resultat #>> '{publicadorsRegistrats,0,rol_publicacio}' is distinct from 'principal' then
    raise exception 'Anon pot veure el perfil d’una persona o l’ordre dels publicadors és incorrecte';
  end if;
end $$;

reset role;
delete from public.section_submissions where id = '44000000-0000-4000-8000-000000000001';
insert into public.section_submissions (id, tenant_id, owner_user_id, section_id, title, payload) values
  ('44000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001',
   '22000000-0000-4000-8000-000000000003', 'mur', 'Article nou que reutilitza un id', '{}');

set local role authenticated;
set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000001';
do $$
declare
  poble uuid := '11000000-0000-4000-8000-000000000001';
  article text := '44000000-0000-4000-8000-000000000001';
  resultat jsonb;
begin
  resultat := public.llig_publicadors_registrats(poble, 'article', article);
  if resultat->>'versio' is distinct from '2' or resultat->'publicadorsRegistrats' is distinct from '[]'::jsonb then
    raise exception 'La peça nova hereta la publicació esborrada';
  end if;
  begin
    perform public.traspassa_publicacio(poble, 'article', article, 1,
      '55000000-0000-4000-8000-000000000005', '33000000-0000-4000-8000-000000000001', '{}', false);
    raise exception 'Una versió de l’article esborrat ha pogut escriure';
  exception when serialization_failure then
    if sqlerrm not like 'SDP-COPUB-004:%' then raise; end if;
  end;
end $$;

reset role;
update public.profiles set baixa_demanada_at = now() where id = '22000000-0000-4000-8000-000000000002';
update public.organizations set visibility = 'members' where id = '33000000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000001';
do $$
declare
  poble uuid := '11000000-0000-4000-8000-000000000001';
  resultat jsonb;
begin
  resultat := public.llig_publicadors_registrats(poble, 'pagina', 'pagina-copub-prova');
  if resultat->>'versio' is distinct from '3' or resultat->'publicadorsRegistrats' is distinct from '[]'::jsonb then
    raise exception 'Es projecta un actor que s’ha fet privat o ha demanat la baixa';
  end if;
  begin
    perform public.traspassa_publicacio(poble, 'pagina', 'pagina-copub-prova', 3,
      '55000000-0000-4000-8000-000000000006', '22000000-0000-4000-8000-000000000002', '{}', false);
    raise exception 'La RPC pot assignar un compte que ha demanat la baixa';
  exception when invalid_parameter_value then
    if sqlerrm not like 'SDP-COPUB-003:%' then raise; end if;
  end;
  if (select payload from public.app_content where tenant_id = poble and key = 'pages')
    is distinct from '[{"id":"pagina-copub-prova","authorName":"Autoria sintètica","copyright":"CC BY 4.0","content":"Font sintètica"}]'::jsonb then
    raise exception 'La font editorial, els crèdits o la llicència han canviat';
  end if;
  if (select count(*) from private.publicacio_traspassos where tenant_id = poble) <> 4 then
    raise exception 'L’historial ha perdut operacions o ha duplicat un reintent';
  end if;
  if (select count(*) from pg_locks where locktype = 'advisory' and (pid = pg_backend_pid() or (pg_backend_pid() = 0 and pid is null)) and granted) < 6 then
    raise exception 'El traspàs no manté els panys d’operació i recurs fins al commit';
  end if;
end $$;
rollback;
