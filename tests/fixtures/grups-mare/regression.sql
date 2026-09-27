-- Contra l'esquema complet LOCAL, després de 2609272201_grups_mare.sql.
-- Dades de prova íntegrament en transacció; el ROLLBACK no deixa cap compte.
\set ON_ERROR_STOP on
begin;
insert into public.towns(id,slug,name) values
  ('fa160000-0000-0000-0000-000000000001','prova-grups-mare-a','Poble de prova A'),
  ('fa160000-0000-0000-0000-000000000002','prova-grups-mare-b','Poble de prova B');
insert into auth.users(id,raw_user_meta_data)
select ('fa160000-0000-0000-0001-' || lpad(i::text,12,'0'))::uuid,
  '{"full_name":"Persona de prova","tenant_id":"fa160000-0000-0000-0000-000000000001"}'::jsonb
from generate_series(1,4) i;
insert into public.organizations(id,tenant_id,slug,name,kind,created_by) values
  ('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001',
   'empresa-de-prova','Empresa de prova','company','fa160000-0000-0000-0001-000000000001');
insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values
  ('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001','fa160000-0000-0000-0001-000000000002','admin'),
  ('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001','fa160000-0000-0000-0001-000000000003','member');

set local role authenticated;
set local request.jwt.claim.sub = 'fa160000-0000-0000-0001-000000000001';
do $$ declare resposta jsonb; begin
  if private.can_create_group(null,'fa160000-0000-0000-0000-000000000001') is distinct from false then
    raise exception 'El helper encara admet un grup sense mare'; end if;
  if private.can_create_group('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001') is distinct from true then
    raise exception 'La persona propietària no pot crear un grup'; end if;
  if private.can_create_group('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000002') is distinct from false then
    raise exception 'El helper permet una empresa d’un altre poble'; end if;
  begin
    perform public.create_organization('fa160000-0000-0000-0000-000000000001','group','Sense mare','grup-sense-mare');
    raise exception 'La RPC accepta un grup sense mare';
  exception when insufficient_privilege then
    if sqlerrm not like 'El grup necessita una empresa mare%' then raise; end if;
  end;
  resposta := public.create_organization('fa160000-0000-0000-0000-000000000001','group','Grup valid','grup-valid',
    p_parent_organization_id => 'fa160000-0000-0000-0002-000000000001');
  if resposta->>'parent_organization_id' is distinct from 'fa160000-0000-0000-0002-000000000001' then
    raise exception 'La RPC no confirma l’empresa mare'; end if;
end $$;

set local request.jwt.claim.sub = 'fa160000-0000-0000-0001-000000000002';
do $$ begin
  if private.can_create_group('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001') is distinct from true then
    raise exception 'L’administradora no pot crear un grup'; end if;
end $$;
set local request.jwt.claim.sub = 'fa160000-0000-0000-0001-000000000003';
do $$ begin
  if private.can_create_group('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001') is distinct from false then
    raise exception 'Un membre sense gestió pot crear grups'; end if;
end $$;
set local request.jwt.claim.sub = 'fa160000-0000-0000-0001-000000000004';
do $$ begin
  if private.can_create_group('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001') is distinct from false then
    raise exception 'Una persona aliena pot crear grups'; end if;
end $$;
set local request.jwt.claim.sub = '';
do $$ begin
  if private.can_create_group('fa160000-0000-0000-0002-000000000001','fa160000-0000-0000-0000-000000000001') is distinct from false then
    raise exception 'Sense sessió es poden crear grups'; end if;
end $$;
rollback;
