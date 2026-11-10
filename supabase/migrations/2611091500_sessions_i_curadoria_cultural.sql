-- R15 · Additiu a 2611082238: el resum agregat conserva el contracte intacte.
-- NO APLICADA: paquet revisable. No concedix cap rol a noms o correus concrets.
-- Cal 2610061448 (private.es_superadmin, aal2), auth.sessions i auth.users.
-- Depén de 2609261500 (consentiment i baixa del perfil) i 2610241400 (normes de convivència).
-- SEG-R15b-01: el directori agrupa per persona i camí i només llista perfils amb
-- consentiment vigent i sense baixa. El correu ix emmascarat amb l'expressió aprovada
-- de la 77 (j***@domini.cat). No ix cap identificador de sessió ni l'UUID de la persona:
-- cada fila porta una clau opaca que només val dins de la mateixa consulta. Cada consulta
-- deixa una fila a private.admin_lectures_sessions, que no admet UPDATE, DELETE ni TRUNCATE.
-- SEG-R15b-04: enviar una aportació exigix les normes vigents (com la resta de contingut
-- veïnal) i ningú, tampoc el superadmin, decidix una aportació pròpia.
begin;

-- Registre privat de les lectures del directori (D-10). Sense clau forana a cap persona:
-- la baixa d'un compte no queda bloquejada. La purga als 12 mesos és una operació manual
-- de l'operador de base, que ha de desactivar el disparador dins de la mateixa transacció.
create table if not exists private.admin_lectures_sessions (
  id bigint generated always as identity primary key,
  al timestamptz not null default clock_timestamp(),
  actor uuid not null,
  filtres jsonb not null check (jsonb_typeof(filtres) = 'object'),
  files integer not null check (files between 0 and 200),
  total integer not null check (total >= 0)
);
alter table private.admin_lectures_sessions enable row level security;
drop policy if exists admin_lectures_sessions_nomes_rpc on private.admin_lectures_sessions;
create policy admin_lectures_sessions_nomes_rpc on private.admin_lectures_sessions
as restrictive for all to public using (false) with check (false);
revoke all on private.admin_lectures_sessions from public,anon,authenticated,service_role;
revoke all on sequence private.admin_lectures_sessions_id_seq from public,anon,authenticated,service_role;
create or replace function private.admin_lectures_sessions_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception 'SDP-ADMIN-AUDIT-IMMUTABLE' using errcode = '42501'; end $$;
revoke all on function private.admin_lectures_sessions_append_only() from public,anon,authenticated,service_role;
drop trigger if exists admin_lectures_sessions_append_only on private.admin_lectures_sessions;
create trigger admin_lectures_sessions_append_only before update or delete on private.admin_lectures_sessions
for each row execute function private.admin_lectures_sessions_append_only();
drop trigger if exists admin_lectures_sessions_sense_truncate on private.admin_lectures_sessions;
create trigger admin_lectures_sessions_sense_truncate before truncate on private.admin_lectures_sessions
for each statement execute function private.admin_lectures_sessions_append_only();

create or replace function public.admin_llista_sessions_dispositius(p_cerca text default '', p_cami text default 'tots')
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_resultat jsonb;
  v_sal text := pg_catalog.gen_random_uuid()::text;
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'Cal superadmin amb aal2.' using errcode = '42501';
  end if;
  if p_cerca is null or length(p_cerca) > 120 or p_cami is null or p_cami not in ('tots','app_ios','web_ios','app_android','web_android','escriptori','altres') then
    raise exception 'Filtre invàlid.' using errcode = '22023';
  end if;
  with sessions as (
    select s.user_id,
      left(coalesce(nullif(btrim(p.full_name),''),nullif(btrim(p.username),''),''),200) as nom,
      lower(coalesce(p.full_name,'')||' '||coalesce(p.username,'')) as cercable,
      case when position('@' in u.email)>1 then left(u.email,1)||'***'||substring(u.email from position('@' in u.email)) else null end as correu_mascarat,
      greatest(s.created_at, s.updated_at, s.refreshed_at at time zone 'UTC') as activitat,
      case when nullif(btrim(s.user_agent),'') is null then 'altres'
        when s.user_agent ilike '%android%' then case when position('; wv)' in s.user_agent)>0 then 'app_android' else 'web_android' end
        when s.user_agent ~* '(iphone|ipad|ipod)' then case when position('Safari/' in s.user_agent)>0 then 'web_ios' else 'app_ios' end
        else 'escriptori' end as cami
    from auth.sessions s
    join auth.users u on u.id=s.user_id
    join public.profiles p on p.id=s.user_id
    where p.baixa_demanada_at is null and p.consentiment_rgpd_at is not null
      and greatest(s.created_at,s.updated_at,s.refreshed_at at time zone 'UTC') >= now()-interval '14 days'
  ), persones as (
    select md5(v_sal||':'||user_id::text||':'||cami) as clau, nom, cercable, correu_mascarat, cami,
      count(*)::integer as sessions, max(activitat) as activitat
    from sessions group by user_id, nom, cercable, correu_mascarat, cami
  ), filtrades as (
    select * from persones where (p_cami='tots' or cami=p_cami)
      and (btrim(p_cerca)='' or position(lower(btrim(p_cerca)) in cercable)>0)
  ), visibles as (select * from filtrades order by activitat desc,clau limit 200)
  select jsonb_build_object('consultat_a',now(),'total',(select count(*) from filtrades),
    'files',coalesce((select jsonb_agg(jsonb_build_object('clau',v.clau,'nom',v.nom,'correu_mascarat',v.correu_mascarat,
      'cami',v.cami,'sessions',v.sessions,'activitat',v.activitat) order by v.activitat desc,v.clau) from visibles v),'[]'::jsonb))
  into v_resultat;
  insert into private.admin_lectures_sessions(actor,filtres,files,total)
  values((select auth.uid()),jsonb_build_object('cerca',btrim(p_cerca),'cami',p_cami),
    jsonb_array_length(v_resultat->'files'),(v_resultat->>'total')::integer);
  return v_resultat;
end $$;
revoke execute on function public.admin_llista_sessions_dispositius(text,text) from public,anon;
grant execute on function public.admin_llista_sessions_dispositius(text,text) to authenticated;

create table if not exists private.curadors_culturals (
  usuari_id uuid primary key references auth.users(id) on delete cascade,
  concedit_a timestamptz not null default now()
);
-- Assignació/revocació només per l'operador de base després de verificar el compte.
revoke all on private.curadors_culturals from public,anon,authenticated;
alter table private.curadors_culturals enable row level security;
-- Defensa restrictiva: ni un GRANT o una política permissiva futura poden
-- obrir la taula als clients. Les RPC SECURITY DEFINER continuen subjectes
-- a la seua guarda real de sessió/rol i operen com la propietària de la taula.
drop policy if exists curadors_culturals_nomes_rpc on private.curadors_culturals;
create policy curadors_culturals_nomes_rpc on private.curadors_culturals
as restrictive for all to public using (false) with check (false);
create or replace function private.pot_curar_cultura()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select private.es_superadmin()),false) or
    ((select auth.jwt()->>'aal')='aal2' and exists(select 1 from private.curadors_culturals where usuari_id=(select auth.uid())))
$$;
revoke all on function private.pot_curar_cultura() from public,anon,authenticated;

create table if not exists public.aportacions_culturals (
  id uuid primary key default gen_random_uuid(),
  usuari_id uuid not null references auth.users(id) on delete cascade,
  titol text not null check(length(btrim(titol)) between 1 and 200),
  autoria text not null check(length(btrim(autoria)) between 1 and 200),
  poble text not null check(length(btrim(poble)) between 1 and 200),
  contingut text not null check(length(btrim(contingut)) between 1 and 20000),
  permisos boolean not null check(permisos),
  estat text not null default 'pendent_revisio' check(estat in ('pendent_revisio','aprovat','correccio','descartat')),
  nota text not null default '' check(length(nota)<=4000),
  creat_a timestamptz not null default now(),
  revisat_a timestamptz,
  revisor_id uuid references auth.users(id) on delete set null
);
alter table public.aportacions_culturals enable row level security;
drop policy if exists aportacions_culturals_nomes_rpc on public.aportacions_culturals;
create policy aportacions_culturals_nomes_rpc on public.aportacions_culturals
as restrictive for all to public using (false) with check (false);
-- Denegació directa: només les RPC següents poden llegir/desar. RLS sense polítiques
-- protegix també clients que intenten saltar la guarda de la interfície.
revoke all on public.aportacions_culturals from public,anon,authenticated;
create index if not exists aportacions_culturals_usuari_data on public.aportacions_culturals(usuari_id,creat_a desc);
-- Mateixa porta UGC que section_submissions i xat_missatges (2610241400): qui aporta
-- ha d'haver acceptat la versió vigent de les normes de convivència.
create or replace function private.exigix_normes_aportacio_cultural()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.ha_acceptat_normes(new.usuari_id) then
    raise exception 'SDP-MOD-428: cal acceptar les normes de convivència.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function private.exigix_normes_aportacio_cultural() from public,anon,authenticated,service_role;
drop trigger if exists aportacions_culturals_exigix_normes on public.aportacions_culturals;
create trigger aportacions_culturals_exigix_normes before insert on public.aportacions_culturals
for each row execute function private.exigix_normes_aportacio_cultural();

create or replace function public.estat_curadoria_cultural()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('autenticat',(select auth.uid()) is not null,
    'pot_curar',coalesce((select private.pot_curar_cultura()),false),'ingestio_disponible',false)
$$;
create or replace function private.aportacio_cultural_json(f public.aportacions_culturals)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('id',f.id,'titol',f.titol,'autoria',f.autoria,'poble',f.poble,
    'contingut',f.contingut,'nota',f.nota,'estat',f.estat,'creat_a',f.creat_a)
$$;
revoke all on function private.aportacio_cultural_json(public.aportacions_culturals) from public,anon,authenticated;
create or replace function public.llista_aportacions_culturals()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Cal iniciar sessió.' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(private.aportacio_cultural_json(f) order by f.creat_a desc,f.id),'[]'::jsonb)
    from (select * from public.aportacions_culturals
      where usuari_id=(select auth.uid()) or (select private.pot_curar_cultura())
      order by creat_a desc,id limit 200) f);
end $$;
create or replace function public.envia_aportacio_cultural(p_titol text,p_autoria text,p_poble text,p_contingut text,p_permisos boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare f public.aportacions_culturals;
begin
  if (select auth.uid()) is null then raise exception 'Cal iniciar sessió.' using errcode='42501'; end if;
  insert into public.aportacions_culturals(usuari_id,titol,autoria,poble,contingut,permisos)
    values((select auth.uid()),btrim(p_titol),btrim(p_autoria),btrim(p_poble),btrim(p_contingut),p_permisos) returning * into f;
  return private.aportacio_cultural_json(f);
end $$;
create or replace function public.revisa_aportacio_cultural(p_id uuid,p_estat text,p_nota text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare f public.aportacions_culturals; v_autor uuid;
begin
  if not coalesce((select private.pot_curar_cultura()),false) then raise exception 'Cal rol de curadoria amb aal2.' using errcode='42501'; end if;
  if p_estat is null or p_estat not in ('pendent_revisio','aprovat','correccio','descartat') or p_nota is null or length(p_nota)>4000 then raise exception 'Revisió invàlida.' using errcode='22023'; end if;
  select usuari_id into v_autor from public.aportacions_culturals where id=p_id for update;
  if not found then raise exception 'Aportació absent.' using errcode='P0002'; end if;
  -- D-6 (quatre ulls): una aportació pròpia la decidix una altra persona.
  if v_autor=(select auth.uid()) then raise exception 'SDP-CULTURA-PROPIA: una aportació pròpia la revisa una altra persona.' using errcode='42501'; end if;
  update public.aportacions_culturals set estat=p_estat,nota=p_nota,revisat_a=now(),revisor_id=(select auth.uid()) where id=p_id returning * into f;
  return private.aportacio_cultural_json(f);
end $$;
revoke execute on function public.estat_curadoria_cultural() from public,anon;
revoke execute on function public.llista_aportacions_culturals() from public,anon;
revoke execute on function public.envia_aportacio_cultural(text,text,text,text,boolean) from public,anon;
revoke execute on function public.revisa_aportacio_cultural(uuid,text,text) from public,anon;
grant execute on function public.estat_curadoria_cultural(),public.llista_aportacions_culturals(),public.envia_aportacio_cultural(text,text,text,text,boolean),public.revisa_aportacio_cultural(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
