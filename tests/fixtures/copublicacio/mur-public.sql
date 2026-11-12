-- La prova usa només persones i contingut sintètics.
begin;
insert into public.towns(id,slug,name) values
  ('11000000-0000-4000-8000-000000000003','r20-mur','Poble de prova Mur');
insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values
  ('22000000-0000-4000-8000-000000000099',now(),
   '{"name":"Propietari sintètic de notes","tenant_id":"11000000-0000-4000-8000-000000000003"}');
insert into public.notes(tenant_id,owner_user_id,title,content) values
  ('11000000-0000-4000-8000-000000000003','22000000-0000-4000-8000-000000000099',
   'Nota privada sintètica','Cos privat sintètic de la prova R20');
insert into public.section_submissions(id,tenant_id,owner_user_id,section_id,title,payload)
select ('44000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  '11000000-0000-4000-8000-000000000003','22000000-0000-4000-8000-000000000099',
  case when n=5 then 'notes' else 'mur' end,
  'Contingut sintètic ' || n,
  case n
    when 1 then '{"status":"approved"}'::jsonb
    when 2 then '{"status":"published"}'::jsonb
    when 3 then '{"status":"draft","visibility":"private"}'::jsonb
    when 4 then '{"status":"published","payload":{"isPublished":false}}'::jsonb
    else '{}'::jsonb end
from generate_series(1,5) n;

-- Oracle explícit: un marcador privat domina també dins de payload/attributes.
do $$
declare prova record; capa jsonb := '{}';
begin
  for prova in select * from (values
    ('{}'::jsonb,true),
    ('{"status":"approved"}'::jsonb,true),
    ('{"status":"published"}'::jsonb,true),
    ('{"visibility":"public"}'::jsonb,true),
    ('{"status":"draft"}'::jsonb,false),
    ('{"visibility":"private"}'::jsonb,false),
    ('{"status":null}'::jsonb,false),
    ('{"isPublished":false}'::jsonb,false),
    ('{"isPublished":"true"}'::jsonb,false),
    ('{"is_published":false}'::jsonb,false),
    ('{"payload":{"isPublished":false}}'::jsonb,false),
    ('{"attributes":{"visibility":"private"}}'::jsonb,false),
    ('{"payload":{"attributes":{"status":"draft"}}}'::jsonb,false),
    ('{"status":"published","payload":{"isPublished":false}}'::jsonb,false),
    ('{"payload":null}'::jsonb,true),
    ('{"attributes":[]}'::jsonb,false),
    ('[]'::jsonb,false),
    ('null'::jsonb,false)
  ) as casos(payload,esperat) loop
    if private.publicacio_mur_es_publica(prova.payload) is distinct from prova.esperat then
      raise exception 'Frontera pública incorrecta per a %',prova.payload;
    end if;
  end loop;
  for i in 2..64 loop capa := jsonb_build_object('payload',capa); end loop;
  if not private.publicacio_mur_es_publica(capa)
    or private.publicacio_mur_es_publica(jsonb_build_object('payload',capa)) then
    raise exception 'La frontera pública no limita correctament les 64 capes';
  end if;
  if (select count(*) from public.notes
      where tenant_id='11000000-0000-4000-8000-000000000003') <> 1 then
    raise exception 'La prova de notes privades no té una nota real';
  end if;
end $$;

set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare ids uuid[];
begin
  select array_agg(id order by id) into ids from public.section_submissions
  where tenant_id='11000000-0000-4000-8000-000000000003';
  if ids is distinct from array[
    '44000000-0000-4000-8000-000000000001'::uuid,
    '44000000-0000-4000-8000-000000000002'::uuid] then
    raise exception 'Foraster ha de rebre només approved/published, resultat %', ids;
  end if;
  if exists(select 1 from public.notes) then
    raise exception 'Foraster pot llegir notes privades';
  end if;
end $$;

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000099';
do $$
begin
  if (select count(*) from public.notes
      where tenant_id='11000000-0000-4000-8000-000000000003') <> 1
    or (select count(*) from public.section_submissions
      where tenant_id='11000000-0000-4000-8000-000000000003' and section_id='notes') <> 1 then
    raise exception 'El propietari ha perdut la lectura privada de notes';
  end if;
end $$;

set local request.jwt.claim.sub = '22000000-0000-4000-8000-000000000098';
do $$
begin
  if exists(select 1 from public.notes)
    or exists(select 1 from public.section_submissions
      where tenant_id='11000000-0000-4000-8000-000000000003' and section_id='notes') then
    raise exception 'Un compte alié pot llegir les notes privades';
  end if;
end $$;
rollback;
