-- 140 · IDEA-375. Administració editorial Sóc de Poble = rol de plataforma
-- superadmin amb AAL2, exigit en línia a les dues RPC: private.es_superadmin()
-- i, a més, auth.jwt()->>'aal'='aal2', perquè el cos de Producció de
-- es_superadmin() no l'exigix (deriva R22). Cap nom de perfil ni metadada de
-- client conferix este poder. Sense desplegament remot.
-- Depén de 2609080000 (private.es_superadmin), 2611112149 i 2611121430 (la
-- frontera canònica del Mur: les columnes visibility, moderation_state i
-- deleted_at, private.mur_public_eligible i private.mur_publicacions_revocades).
begin;
set local lock_timeout = '5s';
do $guard$
declare expected jsonb; actual jsonb;
begin
 if to_regclass('private.c26_taxonomia_contract') is null then
  if to_regclass('public.page_taxonomy') is not null or to_regclass('private.page_taxonomy_audit') is not null
   or to_regprocedure('private.taxonomia_font_publica(jsonb)') is not null or to_regprocedure('private.taxonomia_pagina_publica(uuid,text)') is not null
   or to_regprocedure('public.llig_taxonomia_pagina(uuid,text)') is not null
   or to_regprocedure('public.actualitza_taxonomia_pagina(uuid,text,jsonb,integer)') is not null then
   raise exception 'SDP-C26-DRIFT: objecte preexistent sense contracte.' using errcode='55000';
  end if;
 else
  select snapshot into expected from private.c26_taxonomia_contract where id=1;
  select jsonb_build_object(
 'functions',(select jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid),'acl',p.proacl,'owner',p.proowner) order by p.oid) from pg_proc p where p.oid in (to_regprocedure('private.taxonomia_font_publica(jsonb)'),to_regprocedure('private.taxonomia_pagina_publica(uuid,text)'),to_regprocedure('public.llig_taxonomia_pagina(uuid,text)'),to_regprocedure('public.actualitza_taxonomia_pagina(uuid,text,jsonb,integer)'))),
 'tables',(select jsonb_agg(jsonb_build_object('name',c.oid::regclass::text,'acl',c.relacl,'rls',c.relrowsecurity,'owner',c.relowner,'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'notnull',a.attnotnull) order by a.attnum) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),'constraints',(select jsonb_agg(pg_get_constraintdef(k.oid) order by k.conname) from pg_constraint k where k.conrelid=c.oid)) order by c.oid) from pg_class c where c.oid in (to_regclass('public.page_taxonomy'),to_regclass('private.page_taxonomy_audit')))) into actual;
  if expected is null or expected is distinct from actual then raise exception 'SDP-C26-DRIFT: contracte divergent.' using errcode='55000'; end if;
 end if;
end $guard$;

create table if not exists public.page_taxonomy (
  tenant_id uuid not null references public.towns(id) on delete cascade,
  pagina_id text not null check (pagina_id ~ '^[A-Za-z0-9][A-Za-z0-9_/-]{0,199}$' and pagina_id not like '%//%' and right(pagina_id,1)<>'/'),
  taxonomia jsonb not null,
  versio integer not null check (versio>0),
  primary key(tenant_id,pagina_id)
);
create table if not exists private.page_taxonomy_audit (
  tenant_id uuid not null references public.towns(id) on delete cascade,
  pagina_id text not null,
  versio integer not null,
  actor_id uuid references auth.users(id) on delete set null,
  abans jsonb,
  despres jsonb not null,
  creat_al timestamptz not null default clock_timestamp(),
  primary key(tenant_id,pagina_id,versio)
);
alter table public.page_taxonomy enable row level security;
alter table private.page_taxonomy_audit enable row level security;
revoke all on public.page_taxonomy,private.page_taxonomy_audit from public,anon,authenticated,service_role;

-- La visibilitat es torna a derivar de la font viva en cada lectura; retirar,
-- moderar o esborrar una publicació oculta immediatament també la seua
-- taxonomia. No es pot publicar una nota privada passant visibility al RPC.
create or replace function private.taxonomia_font_publica(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare pendents jsonb[]:=array[p]; capa jsonb; n integer; visites integer:=0; k text;
begin
 while coalesce(array_length(pendents,1),0)>0 loop
  n:=array_length(pendents,1);capa:=pendents[n];pendents:=pendents[1:n-1];visites:=visites+1;
  if visites>64 or jsonb_typeof(capa) is distinct from 'object' then return false; end if;
  foreach k in array array['visibility','status','estat'] loop
   if capa ? k and (jsonb_typeof(capa->k) is distinct from 'string' or
    (k='visibility' and capa->>k not in ('public','publica')) or
    (k<>'visibility' and capa->>k not in ('public','publica','published','publicat','publicada','approved','aprovat','aprovada'))) then return false; end if;
  end loop;
  -- Els marcadors de moderació i d'esborrat de private.mur_public_eligible (2611121430).
  if capa ? 'moderation_state' and capa->'moderation_state' is distinct from '"visible"'::jsonb then return false; end if;
  foreach k in array array['private','draft','isDraft','esborrany','deleted'] loop
   if capa ? k and capa->k is distinct from 'false'::jsonb then return false; end if;
  end loop;
  foreach k in array array['deleted_at','deletedAt'] loop
   if capa ? k and capa->k is distinct from 'null'::jsonb then return false; end if;
  end loop;
  foreach k in array array['isPublished','is_published','published'] loop
   if capa ? k and capa->k is distinct from 'true'::jsonb then return false; end if;
  end loop;
  foreach k in array array['attributes','payload'] loop
   if capa ? k and capa->k is distinct from 'null'::jsonb then pendents:=array_append(pendents,capa->k); end if;
  end loop;
 end loop;
 return true;
end; $$;
revoke all on function private.taxonomia_font_publica(jsonb) from public,anon,authenticated,service_role;

-- Una entrada de section_submissions passa exactament la frontera canònica de
-- public.llig_mur_public (2611121430) i de private.mur_membre_llegeix
-- (2611122200): columnes visibility, moderation_state i deleted_at, marcadors
-- del payload i revocació. La de la taxonomia només hi afig restriccions.
create or replace function private.taxonomia_pagina_publica(t uuid,p text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_content c cross join lateral jsonb_array_elements(case when jsonb_typeof(c.payload)='array' then c.payload else '[]'::jsonb end) e
 where c.tenant_id=t and c.key in ('pages','feedPosts','events','marketItems','mediaItems') and (e->>'id'=p or e->>'slug'=p) and private.taxonomia_font_publica(e))
 or exists(select 1 from public.section_submissions s where s.tenant_id=t and s.id::text=p and s.section_id in ('mur','mercat','events','multimedia')
  and s.visibility='public' and s.moderation_state='visible' and s.deleted_at is null
  and private.mur_public_eligible(s.payload)
  and not exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=s.id)
  and private.taxonomia_font_publica(s.payload));
$$;
revoke all on function private.taxonomia_pagina_publica(uuid,text) from public,anon,authenticated,service_role;

create or replace function public.llig_taxonomia_pagina(p_tenant_id uuid,p_pagina_id text) returns jsonb
language sql stable security definer set search_path='' as $$
 select taxonomia||jsonb_build_object('idPagina',pagina_id,'versio',versio)
 from public.page_taxonomy where tenant_id=p_tenant_id and pagina_id=p_pagina_id
 and (coalesce(private.es_superadmin() and (select auth.jwt()->>'aal')='aal2',false)
  or private.taxonomia_pagina_publica(p_tenant_id,p_pagina_id));
$$;
revoke all on function public.llig_taxonomia_pagina(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.llig_taxonomia_pagina(uuid,text) to anon,authenticated;

create or replace function public.actualitza_taxonomia_pagina(p_tenant_id uuid,p_pagina_id text,p_canvis jsonb,p_versio integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare k text; v jsonb; llista jsonb; item jsonb; cru text; retallat text; nets text[]; anterior public.page_taxonomy;
 geo jsonb:='{}'; net jsonb:='{}'; nova integer;
 -- Els espais que retalla String.prototype.trim(): U+0020, U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029,
 -- U+202F, U+205F, U+3000 i U+FEFF. Els controls (tabulador, salts de línia) es refusen abans de retallar.
 espais constant text:=(select string_agg(chr(c),'') from unnest(array[32,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279]) c);
 -- Un caràcter fora del pla bàsic ocupa dues unitats UTF-16 a String.length.
 astrals constant text:='['||chr(65536)||'-'||chr(1114111)||']';
begin
 if not coalesce(auth.uid() is not null and private.es_superadmin() and (select auth.jwt()->>'aal')='aal2',false) then
  raise exception 'Cal administració editorial de Sóc de Poble amb segon factor.' using errcode='42501'; end if;
 if p_tenant_id is null or not exists(select 1 from public.towns where id=p_tenant_id)
 or p_pagina_id is null or p_pagina_id !~ '^[A-Za-z0-9][A-Za-z0-9_/-]{0,199}$' or p_pagina_id like '%//%' or right(p_pagina_id,1)='/'
 or p_versio is null or p_versio<0 or p_versio>=2147483647 or jsonb_typeof(p_canvis) is distinct from 'object' or octet_length(p_canvis::text)>100000 then
 raise exception 'Taxonomia invàlida.' using errcode='22023'; end if;
 if exists(select 1 from jsonb_object_keys(p_canvis) x where x not in ('idPagina','categoriesSistema','categoriesTematiques','etiquetes','geografia','mencions','versio'))
 or (p_canvis ? 'idPagina' and p_canvis->>'idPagina' is distinct from p_pagina_id)
 or (p_canvis ? 'versio' and p_canvis->'versio' is distinct from to_jsonb(p_versio)) then raise exception 'Camp no admés.' using errcode='22023'; end if;
 v:=coalesce(p_canvis->'geografia','{}'::jsonb);
 if jsonb_typeof(v) is distinct from 'object' or exists(select 1 from jsonb_object_keys(v) g where g not in ('xarxa','demarcacions','comarques','pobles','paratges')) then
  raise exception 'Geografia invàlida.' using errcode='22023'; end if;
 -- Una sola normalització, la de capturaTaxonomiaPagina: llargària crua fins a 200 unitats UTF-16, cap control,
 -- espais retallats i duplicats fora en l'ordre d'arribada. El servidor no desa cap fila que el client no projecte.
 for k,llista in select c,coalesce(p_canvis->c,'[]'::jsonb) from unnest(array['categoriesSistema','categoriesTematiques','etiquetes','mencions']) c
  union all select 'geografia.'||g.key,g.value from jsonb_each(v) g loop
  if jsonb_typeof(llista) is distinct from 'array' then raise exception 'Llista invàlida.' using errcode='22023'; end if;
  if jsonb_array_length(llista)>100 then raise exception 'Llista massa llarga.' using errcode='22023'; end if;
  nets:='{}';
  for item in select value from jsonb_array_elements(llista) loop
   cru:=case when jsonb_typeof(item)='string' then item#>>'{}' end;
   retallat:=btrim(cru,espais);
   if cru is null or retallat='' or cru ~ '[[:cntrl:]]' or 2*length(cru)-length(regexp_replace(cru,astrals,'','g'))>200 then
    raise exception 'Text invàlid.' using errcode='22023'; end if;
   if k='categoriesSistema' and retallat not in ('Sistema','Mur','Mercat','Calendari','Mapa','Transport','Animalets','Treball','Habitatge','Catàlegs','Vídeo','PDF') then
    raise exception 'Categoria invàlida.' using errcode='22023'; end if;
   if not retallat=any(nets) then nets:=array_append(nets,retallat); end if;
  end loop;
  if k like 'geografia.%' then geo:=geo||jsonb_build_object(substr(k,11),to_jsonb(nets));
  else net:=net||jsonb_build_object(k,to_jsonb(nets)); end if;
 end loop;
 if coalesce(jsonb_array_length(p_canvis->'categoriesSistema'),0) not between 1 and 12 then raise exception 'Cal una categoria de sistema.' using errcode='22023'; end if;
 net:=net||jsonb_build_object('geografia',geo);
 -- Serialització per pàgina: dos CAS 0 de la mateixa pàgina no guanyen tots dos, i cap escriptura amb FK cap al
 -- poble (publicacions, xat, contingut) espera una RPC de taxonomia.
 perform pg_advisory_xact_lock(hashtextextended('page_taxonomy:'||p_tenant_id::text||':'||p_pagina_id,0));
 select * into anterior from public.page_taxonomy where tenant_id=p_tenant_id and pagina_id=p_pagina_id for update;
 if coalesce(anterior.versio,0)<>p_versio then raise exception 'La pàgina ha canviat.' using errcode='40001'; end if;
 nova:=p_versio+1;
 insert into public.page_taxonomy values(p_tenant_id,p_pagina_id,net,nova) on conflict(tenant_id,pagina_id) do update set taxonomia=excluded.taxonomia,versio=excluded.versio;
 insert into private.page_taxonomy_audit(tenant_id,pagina_id,versio,actor_id,abans,despres) values(p_tenant_id,p_pagina_id,nova,auth.uid(),anterior.taxonomia,net);
 return net||jsonb_build_object('idPagina',p_pagina_id,'versio',nova);
end; $$;
revoke all on function public.actualitza_taxonomia_pagina(uuid,text,jsonb,integer) from public,anon,authenticated,service_role;
grant execute on function public.actualitza_taxonomia_pagina(uuid,text,jsonb,integer) to authenticated;
create table if not exists private.c26_taxonomia_contract(id integer primary key check(id=1),snapshot jsonb not null);
revoke all on private.c26_taxonomia_contract from public,anon,authenticated,service_role;
insert into private.c26_taxonomia_contract(id,snapshot) select 1,(select jsonb_build_object(
 'functions',(select jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid),'acl',p.proacl,'owner',p.proowner) order by p.oid) from pg_proc p where p.oid in (to_regprocedure('private.taxonomia_font_publica(jsonb)'),to_regprocedure('private.taxonomia_pagina_publica(uuid,text)'),to_regprocedure('public.llig_taxonomia_pagina(uuid,text)'),to_regprocedure('public.actualitza_taxonomia_pagina(uuid,text,jsonb,integer)'))),
 'tables',(select jsonb_agg(jsonb_build_object('name',c.oid::regclass::text,'acl',c.relacl,'rls',c.relrowsecurity,'owner',c.relowner,'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'notnull',a.attnotnull) order by a.attnum) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),'constraints',(select jsonb_agg(pg_get_constraintdef(k.oid) order by k.conname) from pg_constraint k where k.conrelid=c.oid)) order by c.oid) from pg_class c where c.oid in (to_regclass('public.page_taxonomy'),to_regclass('private.page_taxonomy_audit')))))
on conflict(id) do nothing;
commit;
