-- IDEA-103 · R20b. Additive proposal, not deployed. Depends on 2611032100.
-- Administration reads consenting profiles and proposes member invitations.
-- No superadmin override of canonical organization authority or private chat ACL.
-- G2-03 (àrbitre): les invitacions s'esborren amb el compte i amb l'organització; la purga RGPD no queda bloquejada.
begin;
create table private.admin_accions (
  id bigint generated always as identity primary key,
  al timestamptz not null default clock_timestamp(),
  actor uuid not null, accio text not null, objectiu uuid,
  tenant_id uuid not null references public.towns(id),
  detall jsonb not null default '{}' check(jsonb_typeof(detall)='object')
);
create table private.admin_invitacions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id),
  persona uuid not null references auth.users(id) on delete cascade,
  organitzacio uuid not null,
  creada_per uuid not null references auth.users(id) on delete cascade,
  creada_al timestamptz not null default clock_timestamp(),
  caduca_al timestamptz not null default clock_timestamp()+interval '14 days',
  resposta_al timestamptz,
  rol text not null default 'member' check(rol='member'),
  estat text not null default 'pendent' check(estat in ('pendent','acceptada','rebutjada','revocada','caducada')),
  check(persona<>creada_per), check(caduca_al>creada_al),
  foreign key(tenant_id,organitzacio) references public.organizations(tenant_id,id) on delete cascade
);
create unique index admin_invitacio_pendent on private.admin_invitacions(persona,organitzacio) where estat='pendent';
alter table private.admin_accions enable row level security;
alter table private.admin_invitacions enable row level security;
revoke all on private.admin_accions,private.admin_invitacions from public,anon,authenticated,service_role;
revoke all on sequence private.admin_accions_id_seq from public,anon,authenticated,service_role;
create function private.admin_accions_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception 'SDP-ADMIN-AUDIT-IMMUTABLE' using errcode='42501'; end; $$;
create trigger admin_accions_append_only before update or delete on private.admin_accions
for each row execute function private.admin_accions_append_only();
revoke all on function private.admin_accions_append_only() from public,anon,authenticated,service_role;

create function public.admin_llista_usuaris_registrats(p_tenant_id uuid,p_cursor_creat timestamptz default null,p_cursor_id uuid default null,p_limit integer default 25)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare resultat jsonb;
begin
  if not coalesce(private.es_superadmin(),false) then raise exception 'SDP-ADMIN-003' using errcode='42501'; end if;
  if p_tenant_id is null or not exists(select 1 from public.towns where id=p_tenant_id) or p_limit is null or p_limit not between 1 and 50 or (p_cursor_creat is null)<>(p_cursor_id is null) then raise exception 'SDP-ADMIN-004' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc,r.id desc),'[]') into resultat from (
    select p.id,p.full_name,p.username,p.avatar_url,p.town_name,p.created_at,false as baixa,true as consentiment,
      case when position('@' in u.email)>1 then left(u.email,1)||'***'||substring(u.email from position('@' in u.email)) else null end as correu_mascarat,
      coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'nom',o.name,'rol',m.role) order by o.name,o.id)
        from public.organization_memberships m join public.organizations o on o.id=m.organization_id
        where m.user_id=p.id and m.tenant_id=p_tenant_id),'[]') as organitzacions
    from public.profiles p join auth.users u on u.id=p.id
    where p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null
      and exists(select 1 from public.town_memberships tm where tm.user_id=p.id and tm.town_id=p_tenant_id)
      and (p_cursor_creat is null or (p.created_at,p.id)<(p_cursor_creat,p_cursor_id))
    order by p.created_at desc,p.id desc limit p_limit
  ) r;
  insert into private.admin_accions(actor,accio,tenant_id,detall) values(auth.uid(),'llista_usuaris',p_tenant_id,jsonb_build_object('files',jsonb_array_length(resultat)));
  return resultat;
end; $$;

create function public.admin_convida_a_entitat(p_tenant_id uuid,p_usuari_id uuid,p_organitzacio_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare invitacio private.admin_invitacions; actor uuid:=auth.uid();
begin
  if not coalesce(private.es_superadmin(),false) then raise exception 'SDP-ADMIN-003' using errcode='42501'; end if;
  if p_usuari_id=actor then raise exception 'SDP-ORGMEM-004: no pots assignar-te una pertinença.' using errcode='42501'; end if;
  if p_tenant_id is null or p_usuari_id is null or p_organitzacio_id is null then raise exception 'SDP-ADMIN-004' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('admin103-quota:'||actor::text,0));
  perform pg_advisory_xact_lock(hashtextextended('sdp-orgowner:'||p_organitzacio_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended('sdp-orgmem:'||p_organitzacio_id::text||':'||p_usuari_id::text,0));
  perform 1 from public.user_platform_roles where user_id=actor and role='superadmin' for share;
  if not found then raise exception 'SDP-ADMIN-003' using errcode='42501'; end if;
  perform 1 from public.profiles p join public.town_memberships tm on tm.user_id=p.id
    where p.id=actor and tm.town_id=p_tenant_id and p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null for share of p,tm;
  if not found then raise exception 'SDP-ADMIN-004: emissor sense consentiment o poble.' using errcode='42501'; end if;
  perform 1 from public.organization_memberships where organization_id=p_organitzacio_id and tenant_id=p_tenant_id and user_id=actor and role in ('owner','admin') for share;
  if not found then raise exception 'SDP-ORGMEM-002: el rol global no administra esta organització.' using errcode='42501'; end if;
  perform 1 from public.profiles p join public.town_memberships tm on tm.user_id=p.id
    where p.id=p_usuari_id and tm.town_id=p_tenant_id and p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null for share of p,tm;
  if not found then raise exception 'SDP-ADMIN-004: cal consentiment i poble compartit.' using errcode='22023'; end if;
  if exists(select 1 from public.organization_memberships where organization_id=p_organitzacio_id and user_id=p_usuari_id) then raise exception 'SDP-ORGMEM-005: ja és membre; esta RPC no canvia rols.' using errcode='42501'; end if;
  with caducades as (
    update private.admin_invitacions set estat='caducada',resposta_al=clock_timestamp() where creada_per=actor and estat='pendent' and caduca_al<=clock_timestamp() returning *
  ) insert into private.admin_accions(actor,accio,objectiu,tenant_id,detall)
    select actor,'caduca_invitacio',persona,tenant_id,jsonb_build_object('invitacioId',id,'organitzacioId',organitzacio) from caducades;
  select * into invitacio from private.admin_invitacions where persona=p_usuari_id and organitzacio=p_organitzacio_id and estat='pendent' for update;
  if found then
    if invitacio.creada_per<>actor then raise exception 'SDP-ADMIN-INVITACIO-CONFLICTE' using errcode='23505'; end if;
  else
    if (select count(*) from private.admin_invitacions where creada_per=actor and estat='pendent')>=20 then raise exception 'SDP-ADMIN-INVITACIO-LIMIT' using errcode='54000'; end if;
    insert into private.admin_invitacions(tenant_id,persona,organitzacio,creada_per) values(p_tenant_id,p_usuari_id,p_organitzacio_id,actor) returning * into invitacio;
    insert into private.admin_accions(actor,accio,objectiu,tenant_id,detall) values(actor,'convida_membre',p_usuari_id,p_tenant_id,jsonb_build_object('invitacioId',invitacio.id,'organitzacioId',p_organitzacio_id,'rol','member'));
  end if;
  return jsonb_build_object('invitacioId',invitacio.id,'usuariId',invitacio.persona,'organitzacioId',invitacio.organitzacio,'rol',invitacio.rol,'estat',invitacio.estat,'caducaAl',invitacio.caduca_al);
end; $$;

-- Compatibility refuses every old direct assignment/removal or privileged role.
create function public.admin_assigna_membre_organitzacio(p_tenant_id uuid,p_usuari_id uuid,p_organitzacio_id uuid,p_rol text default 'membre',p_lleva boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  if not coalesce(private.es_superadmin(),false) then raise exception 'SDP-ADMIN-003' using errcode='42501'; end if;
  if p_rol is null or p_rol not in ('member','membre') or p_lleva is distinct from false then raise exception 'SDP-ORGMEM-006: només invitacions de membre; cap canvi administratiu.' using errcode='42501'; end if;
  return public.admin_convida_a_entitat(p_tenant_id,p_usuari_id,p_organitzacio_id);
end; $$;

create function public.admin_connecta_usuari(p_tenant_id uuid,p_usuari_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare vincle jsonb;
begin
  if not coalesce(private.es_superadmin(),false) then raise exception 'SDP-ADMIN-003' using errcode='42501'; end if;
  if p_tenant_id is null or p_usuari_id is null or not exists(select 1 from public.profiles p join public.town_memberships tm on tm.user_id=p.id where p.id=p_usuari_id and tm.town_id=p_tenant_id and p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null) then raise exception 'SDP-ADMIN-004' using errcode='22023'; end if;
  vincle:=public.segueix('persona',p_usuari_id,null);
  insert into private.admin_accions(actor,accio,objectiu,tenant_id,detall) values(auth.uid(),'segueix_persona',p_usuari_id,p_tenant_id,'{}');
  return jsonb_build_object('usuariId',p_usuari_id,'vincle',vincle);
end; $$;

-- Recipient RPCs intentionally require the real recipient, not a global admin.
create function public.les_meues_invitacions_admin(p_tenant_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'SDP-ADMIN-SESSIO' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('invitacioId',i.id,'organitzacioId',i.organitzacio,'nom',o.name,'rol',i.rol,'estat',case when i.estat='pendent' and i.caduca_al<=clock_timestamp() then 'caducada' else i.estat end,'caducaAl',i.caduca_al) order by i.creada_al desc,i.id)
    from private.admin_invitacions i join public.organizations o on o.id=i.organitzacio where i.persona=auth.uid() and i.tenant_id=p_tenant_id),'[]');
end; $$;
create function public.respon_invitacio_admin(p_id uuid,p_accepta boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare i private.admin_invitacions; actor uuid:=auth.uid(); nova text; emissor_valid boolean;
begin
  if actor is null then raise exception 'SDP-ADMIN-SESSIO' using errcode='42501'; end if;
  if p_accepta is null then raise exception 'SDP-ADMIN-004' using errcode='22023'; end if;
  select * into i from private.admin_invitacions where id=p_id and persona=actor;
  if not found then raise exception 'SDP-ADMIN-INVITACIO-ALIENA' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp-orgowner:'||i.organitzacio::text,0));
  perform pg_advisory_xact_lock(hashtextextended('sdp-orgmem:'||i.organitzacio::text||':'||actor::text,0));
  select * into i from private.admin_invitacions where id=p_id and persona=actor for update;
  if i.estat<>'pendent' then return jsonb_build_object('invitacioId',i.id,'estat',i.estat,'acceptada',i.estat='acceptada'); end if;
  nova:=case when i.caduca_al<=clock_timestamp() then 'caducada' when not p_accepta then 'rebutjada' else 'acceptada' end;
  if nova='acceptada' then
    perform 1 from public.user_platform_roles where user_id=i.creada_per and role='superadmin' for share; emissor_valid:=found;
    perform 1 from public.profiles p join public.town_memberships tm on tm.user_id=p.id where p.id=i.creada_per and tm.town_id=i.tenant_id and p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null for share of p,tm; emissor_valid:=emissor_valid and found;
    perform 1 from public.organization_memberships where user_id=i.creada_per and organization_id=i.organitzacio and tenant_id=i.tenant_id and role in ('owner','admin') for share; emissor_valid:=emissor_valid and found;
    perform 1 from public.profiles p join public.town_memberships tm on tm.user_id=p.id where p.id=actor and tm.town_id=i.tenant_id and p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null for share of p,tm;
    if not found then raise exception 'SDP-ADMIN-004: consentiment o pertinença retirats.' using errcode='42501'; end if;
    if not emissor_valid or exists(select 1 from public.organization_memberships where organization_id=i.organitzacio and user_id=actor) then nova:='revocada';
    else insert into public.organization_memberships(organization_id,tenant_id,user_id,role) values(i.organitzacio,i.tenant_id,actor,'member'); end if;
  end if;
  update private.admin_invitacions set estat=nova,resposta_al=clock_timestamp() where id=i.id;
  insert into private.admin_accions(actor,accio,objectiu,tenant_id,detall) values(actor,'respon_invitacio',i.creada_per,i.tenant_id,jsonb_build_object('invitacioId',i.id,'estat',nova,'organitzacioId',i.organitzacio));
  return jsonb_build_object('invitacioId',i.id,'estat',nova,'acceptada',nova='acceptada');
end; $$;
revoke all on function public.admin_llista_usuaris_registrats(uuid,timestamptz,uuid,integer),public.admin_convida_a_entitat(uuid,uuid,uuid),public.admin_assigna_membre_organitzacio(uuid,uuid,uuid,text,boolean),public.admin_connecta_usuari(uuid,uuid),public.les_meues_invitacions_admin(uuid),public.respon_invitacio_admin(uuid,boolean) from public,anon,authenticated,service_role;
-- G2-07 (àrbitre): la porta RLS (R8) llig una revocació per funció; el «revoke all» múltiple de dalt ja ho fa.
revoke execute on function public.admin_assigna_membre_organitzacio(uuid,uuid,uuid,text,boolean) from public, anon;
grant execute on function public.admin_llista_usuaris_registrats(uuid,timestamptz,uuid,integer),public.admin_convida_a_entitat(uuid,uuid,uuid),public.admin_assigna_membre_organitzacio(uuid,uuid,uuid,text,boolean),public.admin_connecta_usuari(uuid,uuid),public.les_meues_invitacions_admin(uuid),public.respon_invitacio_admin(uuid,boolean) to authenticated;
commit;
