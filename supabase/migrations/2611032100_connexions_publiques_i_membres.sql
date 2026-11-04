-- FEDI23 · Connexions visibles amb consentiment i pertinences funcionals.
-- Depén de: 2610250100, 2610281730, 2610282100, 2611031700.
-- Després del catàleg anterior segons ordre_desplegament.json; no ordre cec
-- del nom. Candidat local: cap aplicació o desplegament remot acreditat.
-- Global privada de sèrie; vincle publica només darrere del global. Cada
-- aresta entrant requerix consentiment del seu origen; un vincle privat de
-- qualsevol extrem domina. Perfils privats/baixes/bloquejos no es publiquen.
-- Les quatre taules són privades amb RLS, sense concessió als rols client
-- ni service_role. Les sis RPC expliciten ACL i atribució auth.uid().
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists private.connexions_preferencies (
  tipus text not null check (tipus in ('persona','entitat','poble')),
  id uuid not null,
  persona uuid references auth.users(id) on delete cascade,
  entitat uuid references public.organizations(id) on delete cascade,
  poble uuid references public.towns(id) on delete cascade,
  visibilitat text not null default 'privada' check(visibilitat in ('privada','publica')),
  primary key(tipus,id),
  check ((tipus='persona' and persona is not null and persona=id and entitat is null and poble is null)
      or (tipus='entitat' and entitat is not null and entitat=id and persona is null and poble is null)
      or (tipus='poble' and poble is not null and poble=id and persona is null and entitat is null))
);
create table if not exists private.connexions_vincles (
  tipus text not null, id uuid not null,
  altre_tipus text not null check(altre_tipus in ('persona','entitat','poble')),
  altre_id uuid not null,
  persona uuid references auth.users(id) on delete cascade,
  entitat uuid references public.organizations(id) on delete cascade,
  poble uuid references public.towns(id) on delete cascade,
  visibilitat text not null check(visibilitat in ('privada','publica')),
  primary key(tipus,id,altre_tipus,altre_id),
  foreign key(tipus,id) references private.connexions_preferencies(tipus,id) on delete cascade,
  check ((altre_tipus='persona' and persona is not null and persona=altre_id and entitat is null and poble is null)
      or (altre_tipus='entitat' and entitat is not null and entitat=altre_id and persona is null and poble is null)
      or (altre_tipus='poble' and poble is not null and poble=altre_id and persona is null and entitat is null))
);
create table if not exists private.connexions_rols_membres (
  organitzacio uuid not null, persona uuid not null,
  rol text not null check(rol in ('treballador','usuari')),
  primary key(organitzacio,persona),
  foreign key(organitzacio,persona) references public.organization_memberships(organization_id,user_id) on delete cascade
);
create table if not exists private.connexions_sollicituds (
  organitzacio uuid not null references public.organizations(id) on delete cascade,
  persona uuid not null references auth.users(id) on delete cascade,
  rol text not null check(rol in ('administrador','treballador','usuari')),
  estat text not null default 'pendent' check(estat='pendent'),
  creat_al timestamptz not null default now(),
  primary key(organitzacio,persona)
);
alter table private.connexions_preferencies enable row level security;
alter table private.connexions_vincles enable row level security;
alter table private.connexions_rols_membres enable row level security;
alter table private.connexions_sollicituds enable row level security;
revoke all on table private.connexions_preferencies,private.connexions_vincles,private.connexions_rols_membres,private.connexions_sollicituds from public,anon,authenticated,service_role;

create or replace function private.connexions_id(p_tipus text,p_id text)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v uuid;
begin
  if p_tipus is null or p_tipus not in ('persona','entitat','poble') or p_id is null or length(p_id)>200 then raise exception 'SDP-CONN-001: input invalid.' using errcode='22023'; end if;
  if p_tipus='poble' then
    select t.id into v from public.towns t where t.id::text=lower(p_id) or t.slug=p_id order by (t.id::text=lower(p_id)) desc limit 1;
    return v;
  end if;
  begin v:=p_id::uuid; exception when invalid_text_representation then raise exception 'SDP-CONN-001: UUID invalid.' using errcode='22023'; end;
  return v;
end; $$;
create or replace function private.connexions_uid()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v uuid:=(select auth.uid());
begin
  if v is null or (select auth.role()) is distinct from 'authenticated' or not exists(select 1 from public.profiles p where p.id=v and p.baixa_demanada_at is null) then raise exception 'SDP-CONN-000: cal sessio.' using errcode='42501'; end if;
  return v;
end; $$;
create or replace function private.connexions_controla(p_tipus text,p_id uuid)
returns void language plpgsql stable security definer set search_path = '' as $$
declare v uuid:=private.connexions_uid();
begin
  if p_id is null then raise exception 'SDP-CONN-003: subjecte absent.' using errcode='22023'; end if;
  if (p_tipus='persona' and p_id=v)
    or (p_tipus='entitat' and coalesce(private.can_manage_organization(p_id),false))
    or (p_tipus='poble' and exists(select 1 from public.town_memberships m where m.town_id=p_id and m.user_id=v and m.role='admin')) then return; end if;
  raise exception 'SDP-CONN-002: sense control.' using errcode='42501';
end; $$;
create or replace function private.connexions_global(p_tipus text,p_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.visibilitat='publica' from private.connexions_preferencies p where p.tipus=p_tipus and p.id=p_id),false);
$$;
create or replace function private.connexions_vincle(p_tipus text,p_id uuid,p_altre_tipus text,p_altre_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select v.visibilitat='publica' from private.connexions_vincles v where v.tipus=p_tipus and v.id=p_id and v.altre_tipus=p_altre_tipus and v.altre_id=p_altre_id),true);
$$;
create or replace function private.connexions_bloqueig(p_a_tipus text,p_a uuid,p_b_tipus text,p_b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.bloquejos b where
    ((p_a_tipus='persona' and b.bloquejador=p_a) or (p_a_tipus='entitat' and exists(select 1 from public.organization_memberships m where m.organization_id=p_a and m.user_id=b.bloquejador and m.role in ('owner','admin'))))
    and ((p_b_tipus='persona' and b.bloquejat_persona=p_b) or (p_b_tipus='entitat' and b.bloquejat_entitat=p_b)))
  or exists(select 1 from public.bloquejos b where
    ((p_b_tipus='persona' and b.bloquejador=p_b) or (p_b_tipus='entitat' and exists(select 1 from public.organization_memberships m where m.organization_id=p_b and m.user_id=b.bloquejador and m.role in ('owner','admin'))))
    and ((p_a_tipus='persona' and b.bloquejat_persona=p_a) or (p_a_tipus='entitat' and b.bloquejat_entitat=p_a)));
$$;
create or replace function private.connexions_fitxa(p_tipus text,p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case
    when p_tipus='persona' then (select jsonb_build_object('tipus','persona','id',p.id,'nom',p.full_name,'avatar',coalesce(p.avatar_url,''),'ruta','/gent/'||p.id::text) from public.profiles p where p.id=p_id and p.is_public is true and p.baixa_demanada_at is null)
    when p_tipus='entitat' then (select jsonb_build_object('tipus','entitat','id',o.id,'nom',o.name,'avatar',coalesce(o.logo_url,''),'ruta','/entitats/'||o.id::text) from public.organizations o where o.id=p_id and o.visibility='public')
    when p_tipus='poble' then (select jsonb_build_object('tipus','poble','id',t.id) from public.towns t where t.id=p_id)
    else null end;
$$;
create or replace function private.connexions_arestes()
returns table(origen_tipus text,origen_id uuid,desti_tipus text,desti_id uuid,creat_al timestamptz,actor_persona uuid)
language sql stable security definer set search_path = '' as $$
  select case when s.seguidor_entitat is null then 'persona' else 'entitat' end,
         coalesce(s.seguidor_entitat,s.seguidor),s.seguit_tipus,coalesce(s.seguit_persona,s.seguit_entitat),coalesce(s.reactivat_al,s.creat_al),s.seguidor
    from public.seguiments s where s.deixat_al is null
      and private.bloqueig_de_seguiment(s.seguidor,s.seguit_tipus,coalesce(s.seguit_persona,s.seguit_entitat)) is null
      and ((s.seguidor_entitat is null and private.seguiment_viu(s.seguidor,s.seguit_tipus,coalesce(s.seguit_persona,s.seguit_entitat)))
        or (s.seguidor_entitat is not null and private.seguiment_d_entitat_viu(s.seguidor_entitat,s.seguit_tipus,coalesce(s.seguit_persona,s.seguit_entitat))))
      and not private.connexions_bloqueig(case when s.seguidor_entitat is null then 'persona' else 'entitat' end,coalesce(s.seguidor_entitat,s.seguidor),s.seguit_tipus,coalesce(s.seguit_persona,s.seguit_entitat));
$$;
create or replace function private.connexions_graf(p_tipus text,p_id uuid,p_public boolean)
returns jsonb language sql stable security definer set search_path = '' as $$
  with relacions as (
    select a.*,a.origen_tipus=p_tipus and a.origen_id=p_id as sortint,
      case when a.origen_tipus=p_tipus and a.origen_id=p_id then a.desti_tipus else a.origen_tipus end as altre_tipus,
      case when a.origen_tipus=p_tipus and a.origen_id=p_id then a.desti_id else a.origen_id end as altre_id
    from private.connexions_arestes() a
    where ((a.origen_tipus=p_tipus and a.origen_id=p_id) or (a.desti_tipus=p_tipus and a.desti_id=p_id))
      and ((select auth.uid()) is null or not private.connexions_bloqueig('persona',(select auth.uid()),'persona',a.actor_persona))
      and (not p_public or (private.connexions_global(a.origen_tipus,a.origen_id)
        and private.connexions_vincle(a.origen_tipus,a.origen_id,a.desti_tipus,a.desti_id)
        and private.connexions_vincle(a.desti_tipus,a.desti_id,a.origen_tipus,a.origen_id)
        and private.connexions_fitxa(a.origen_tipus,a.origen_id) is not null
        and private.connexions_fitxa(a.desti_tipus,a.desti_id) is not null))
  ), agrupades as (
    select altre_tipus,altre_id,max(creat_al) as creat_al,case when bool_or(sortint) and bool_or(not sortint) then 'mutua' when bool_or(sortint) then 'sortint' else 'entrant' end as direccio
    from relacions group by altre_tipus,altre_id
  ), files as (
    select private.connexions_fitxa(a.altre_tipus,a.altre_id)||jsonb_build_object('creatAl',a.creat_al,'direccio',a.direccio,'visibilitatConnexions',case when private.connexions_vincle(p_tipus,p_id,a.altre_tipus,a.altre_id) then 'publica' else 'privada' end) as fila,a.creat_al,a.altre_id
    from agrupades a where private.connexions_fitxa(a.altre_tipus,a.altre_id) is not null
      and ((select auth.uid()) is null or not private.connexions_bloqueig('persona',(select auth.uid()),a.altre_tipus,a.altre_id))
  ) select coalesce(jsonb_agg(fila order by creat_al desc,altre_id),'[]'::jsonb) from files;
$$;

-- Controls own/admin de pertinences vives, separats del selector públic.
-- Es poden preparar amb globals privats; només fitxes públiques segures i
-- cap correu ni rol intern de qui actua. La publicació continua exigint consentiment.
create or replace function private.connexions_pertinences(p_tipus text,p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with candidats as (
    select case when p_tipus='persona' then 'entitat' else 'persona' end as tipus,
      case when p_tipus='persona' then m.organization_id else m.user_id end as id,
      m.created_at as creat_al,case when m.role in ('owner','admin') then 'administrador' else coalesce(r.rol,'usuari') end as rol
    from public.organization_memberships m
    left join private.connexions_rols_membres r on r.organitzacio=m.organization_id and r.persona=m.user_id
    where (p_tipus='persona' and m.user_id=p_id) or (p_tipus='entitat' and m.organization_id=p_id)
    union all
    select 'entitat',case when m.organization_id=p_id then m.member_organization_id else m.organization_id end,m.created_at,'usuari'
    from public.organization_member_organizations m where p_tipus='entitat' and (m.organization_id=p_id or m.member_organization_id=p_id)
  ), agrupades as (
    select tipus,id,max(creat_al) as creat_al,min(rol) as rol from candidats group by tipus,id
  ), files as (
    select private.connexions_fitxa(c.tipus,c.id)||jsonb_build_object('direccio','membre','rol',c.rol,'creatAl',c.creat_al,'visibilitatConnexions',case when private.connexions_vincle(p_tipus,p_id,c.tipus,c.id) then 'publica' else 'privada' end) as fila
    from agrupades c where private.connexions_fitxa(c.tipus,c.id) is not null
      and not private.connexions_bloqueig(p_tipus,p_id,c.tipus,c.id)
      and ((select auth.uid()) is null or not private.connexions_bloqueig('persona',(select auth.uid()),c.tipus,c.id))
  ) select coalesce(jsonb_agg(fila),'[]'::jsonb) from files;
$$;
create or replace function private.connexions_controls(p_tipus text,p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with graf as (select fila,fila->>'tipus' as tipus,fila->>'id' as id from jsonb_array_elements(private.connexions_graf(p_tipus,p_id,false)) fila),
    membres as (select fila,fila->>'tipus' as tipus,fila->>'id' as id from jsonb_array_elements(private.connexions_pertinences(p_tipus,p_id)) fila),
    files as (select coalesce(g.fila,m.fila)||case when m.fila is not null then jsonb_build_object('rol',m.fila->'rol') else '{}'::jsonb end as fila,
      coalesce(g.tipus,m.tipus) as tipus,coalesce(g.id,m.id) as id from graf g full join membres m using(tipus,id))
  select coalesce(jsonb_agg(fila order by fila->>'creatAl' desc,tipus,id),'[]'::jsonb) from files;
$$;

-- Preferències municipals: l'administració pot configurar les exclusions
-- pròpies encara en privat, però mai publica residents sense consentiment.
create or replace function private.connexions_veinat_poble(p_id uuid,p_public boolean)
returns jsonb language sql stable security definer set search_path = '' as $$
  with candidats as (
    select 'persona'::text as tipus,p.id,coalesce(p.created_at,m.created_at) as creat_al
      from public.profiles p join public.town_memberships m on m.user_id=p.id and m.town_id=p_id
    union select 'entitat',o.id,o.created_at from public.organizations o where o.tenant_id=p_id
  ), files as (
    select private.connexions_fitxa(c.tipus,c.id)||jsonb_build_object('direccio','poble','creatAl',c.creat_al,'visibilitatConnexions',case when private.connexions_vincle('poble',p_id,c.tipus,c.id) then 'publica' else 'privada' end) as fila,c.tipus,c.id
    from candidats c where private.connexions_fitxa(c.tipus,c.id) is not null
      and private.connexions_global(c.tipus,c.id) and private.connexions_vincle(c.tipus,c.id,'poble',p_id)
      and (not p_public or private.connexions_vincle('poble',p_id,c.tipus,c.id))
      and ((select auth.uid()) is null or not private.connexions_bloqueig('persona',(select auth.uid()),c.tipus,c.id))
  ) select coalesce(jsonb_agg(fila order by tipus,id),'[]'::jsonb) from files;
$$;

create or replace function public.preferencies_connexions(p_tipus text,p_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v uuid:=private.connexions_id(p_tipus,p_id);
begin
  perform private.connexions_controla(p_tipus,v);
  return jsonb_build_object('tipus',p_tipus,'id',v,'visibilitatConnexions',case when private.connexions_global(p_tipus,v) then 'publica' else 'privada' end,'connexions',case when p_tipus='poble' then private.connexions_veinat_poble(v,false) else private.connexions_controls(p_tipus,v) end);
end; $$;
create or replace function public.desa_visibilitat_connexions(p_tipus text,p_id text,p_visibilitat text,p_connexio_tipus text default null,p_connexio_id text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v uuid:=private.connexions_id(p_tipus,p_id); altre uuid;
begin
  perform private.connexions_controla(p_tipus,v);
  if p_visibilitat is null or p_visibilitat not in ('privada','publica') or (p_connexio_tipus is null)<>(p_connexio_id is null) then raise exception 'SDP-CONN-001: visibilitat invalida.' using errcode='22023'; end if;
  if p_connexio_tipus is not null then
    altre:=private.connexions_id(p_connexio_tipus,p_connexio_id);
    if private.connexions_fitxa(p_connexio_tipus,altre) is null then raise exception 'SDP-CONN-003: connexio absent o privada.' using errcode='22023'; end if;
  end if;
  insert into private.connexions_preferencies(tipus,id,persona,entitat,poble)
    values(p_tipus,v,case when p_tipus='persona' then v end,case when p_tipus='entitat' then v end,case when p_tipus='poble' then v end) on conflict do nothing;
  if p_connexio_tipus is null then update private.connexions_preferencies set visibilitat=p_visibilitat where tipus=p_tipus and id=v;
  else insert into private.connexions_vincles(tipus,id,altre_tipus,altre_id,persona,entitat,poble,visibilitat)
    values(p_tipus,v,p_connexio_tipus,altre,case when p_connexio_tipus='persona' then altre end,case when p_connexio_tipus='entitat' then altre end,case when p_connexio_tipus='poble' then altre end,p_visibilitat)
    on conflict(tipus,id,altre_tipus,altre_id) do update set visibilitat=excluded.visibilitat;
  end if;
  return public.preferencies_connexions(p_tipus,v::text);
end; $$;
create or replace function public.connexions_publiques_de(p_tipus text,p_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v uuid:=private.connexions_id(p_tipus,p_id);
begin
  if not private.connexions_global(p_tipus,v) or private.connexions_fitxa(p_tipus,v) is null or ((select auth.uid()) is not null and private.connexions_bloqueig('persona',(select auth.uid()),p_tipus,v)) then return '[]'::jsonb; end if;
  return private.connexions_graf(p_tipus,v,true);
end; $$;
create or replace function public.membres_i_entitats_connectades_de(p_tipus text,p_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v uuid:=private.connexions_id(p_tipus,p_id); resultat jsonb;
begin
  if p_tipus not in ('entitat','poble') then raise exception 'SDP-CONN-001: cal entitat o poble.' using errcode='22023'; end if;
  if not private.connexions_global(p_tipus,v) or private.connexions_fitxa(p_tipus,v) is null or ((select auth.uid()) is not null and private.connexions_bloqueig('persona',(select auth.uid()),p_tipus,v)) then return '[]'::jsonb; end if;
  if p_tipus='entitat' then
    with candidats as (
      select 'persona'::text as tipus,m.user_id as id,m.created_at as creat_al,case when m.role in ('owner','admin') then 'administrador' else coalesce(r.rol,'usuari') end as rol
        from public.organization_memberships m left join private.connexions_rols_membres r on r.organitzacio=m.organization_id and r.persona=m.user_id where m.organization_id=v
      union all select 'entitat',m.member_organization_id,m.created_at,'usuari' from public.organization_member_organizations m where m.organization_id=v
    ), files as (
      select private.connexions_fitxa(c.tipus,c.id)||jsonb_build_object('direccio','membre','rol',c.rol,'creatAl',c.creat_al) as fila
      from candidats c where private.connexions_fitxa(c.tipus,c.id) is not null and private.connexions_global(c.tipus,c.id)
        and private.connexions_vincle(c.tipus,c.id,'entitat',v) and private.connexions_vincle('entitat',v,c.tipus,c.id)
        and not private.connexions_bloqueig(c.tipus,c.id,'entitat',v)
        and ((select auth.uid()) is null or not private.connexions_bloqueig('persona',(select auth.uid()),c.tipus,c.id))
    ) select coalesce(jsonb_agg(fila),'[]'::jsonb) into resultat from files;
    select coalesce(jsonb_agg(fila),'[]'::jsonb) into resultat from (
      select distinct on (fila->>'tipus',fila->>'id') fila from jsonb_array_elements(resultat||public.connexions_publiques_de('entitat',v::text)) fila order by fila->>'tipus',fila->>'id',(fila->>'direccio'='membre') desc
    ) nets;
    return resultat;
  end if;
  return private.connexions_veinat_poble(v,true);
end; $$;
-- Una promoció/degradació per l'API antiga no conserva una etiqueta vella.
create or replace function private.connexions_neteja_rol()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role then delete from private.connexions_rols_membres where organitzacio=new.organization_id and persona=new.user_id; end if;
  return new;
end; $$;
drop trigger if exists trg_connexions_neteja_rol on public.organization_memberships;
create trigger trg_connexions_neteja_rol after update of role on public.organization_memberships for each row execute function private.connexions_neteja_rol();

create or replace function public.inclou_persona_en_entitat(p_org_id uuid,p_persona_id uuid,p_rol text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  perform private.connexions_uid();
  if p_rol is null or p_rol not in ('administrador','treballador','usuari') then raise exception 'SDP-CONN-001: rol invalid.' using errcode='22023'; end if;
  -- L'RPC real vigent conserva les guardes d'owner, admin, poble i concurrència.
  perform * from public.desa_membre_organitzacio(p_org_id,p_persona_id,'persona',case when p_rol='administrador' then 'admin' else 'member' end);
  if p_rol='administrador' then delete from private.connexions_rols_membres where organitzacio=p_org_id and persona is not null and persona=p_persona_id;
  else insert into private.connexions_rols_membres(organitzacio,persona,rol) values(p_org_id,p_persona_id,p_rol) on conflict(organitzacio,persona) do update set rol=excluded.rol; end if;
  delete from private.connexions_sollicituds where organitzacio=p_org_id and persona is not null and persona=p_persona_id;
  return jsonb_build_object('orgId',p_org_id,'personaId',p_persona_id,'rol',p_rol);
end; $$;
create or replace function public.solicita_unir_se_a_entitat(p_org_id uuid,p_rol text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v uuid:=private.connexions_uid();
begin
  if p_rol is null or p_rol not in ('administrador','treballador','usuari') or p_org_id is null then raise exception 'SDP-CONN-001: rol invalid.' using errcode='22023'; end if;
  if private.connexions_fitxa('entitat',p_org_id) is null or private.connexions_bloqueig('persona',v,'entitat',p_org_id) then raise exception 'SDP-CONN-003: entitat no disponible.' using errcode='22023'; end if;
  if exists(select 1 from public.organization_memberships m where m.organization_id=p_org_id and m.user_id=v) then raise exception 'SDP-CONN-001: ja es membre.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sdp-connexions-sollicitud:'||v::text,0));
  if not exists(select 1 from private.connexions_sollicituds s where s.persona=v and s.organitzacio=p_org_id) and (select count(*) from private.connexions_sollicituds s where s.persona=v)>=20 then raise exception 'SDP-CONN-001: limit de sollicituds.' using errcode='22023'; end if;
  insert into private.connexions_sollicituds(organitzacio,persona,rol) values(p_org_id,v,p_rol) on conflict(organitzacio,persona) do update set rol=excluded.rol;
  return jsonb_build_object('orgId',p_org_id,'personaId',v,'rol',p_rol,'estat','pendent');
end; $$;

revoke all on function private.connexions_neteja_rol(),private.connexions_id(text,text),private.connexions_uid(),private.connexions_controla(text,uuid),private.connexions_global(text,uuid),private.connexions_vincle(text,uuid,text,uuid),private.connexions_bloqueig(text,uuid,text,uuid),private.connexions_fitxa(text,uuid),private.connexions_arestes(),private.connexions_graf(text,uuid,boolean),private.connexions_veinat_poble(uuid,boolean),private.connexions_pertinences(text,uuid),private.connexions_controls(text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.preferencies_connexions(text,text),public.desa_visibilitat_connexions(text,text,text,text,text),public.connexions_publiques_de(text,text),public.membres_i_entitats_connectades_de(text,text),public.inclou_persona_en_entitat(uuid,uuid,text),public.solicita_unir_se_a_entitat(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.preferencies_connexions(text,text),public.desa_visibilitat_connexions(text,text,text,text,text),public.connexions_publiques_de(text,text),public.membres_i_entitats_connectades_de(text,text),public.inclou_persona_en_entitat(uuid,uuid,text),public.solicita_unir_se_a_entitat(uuid,text) to authenticated;
grant execute on function public.connexions_publiques_de(text,text),public.membres_i_entitats_connectades_de(text,text) to anon;
commit;
