-- R32.7: interaccions sobre missatges visibles; cap contingut ni identitat
-- d'operador d'entitat ix del batch. Els cursors/seq del xat no es modifiquen.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $$ begin
  if to_regclass('public.xat_fils') is null or to_regclass('public.xat_missatges') is null
    or to_regprocedure('private.es_participant(uuid)') is null
    or to_regprocedure('private.seq_visible(uuid,bigint)') is null
    or to_regprocedure('private.es_admin_del_fil(uuid)') is null then
    raise exception 'SDP-XAT-ACCIONS-DEPENDENCY' using errcode='55000';
  end if;
end $$;

create table if not exists public.xat_reaccions (
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  creat_al timestamptz not null default now(), primary key(missatge_id,usuari_id,emoji)
);
create table if not exists public.xat_missatges_destacats (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  creat_al timestamptz not null default now(), primary key(usuari_id,missatge_id)
);
create table if not exists public.xat_missatges_fixats (
  conversa_id uuid not null references public.xat_fils(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  fixat_per uuid references auth.users(id) on delete set null,
  creat_al timestamptz not null default now(), primary key(conversa_id,missatge_id)
);
create table if not exists public.xat_missatges_amagats (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  creat_al timestamptz not null default now(), primary key(usuari_id,missatge_id)
);
create index if not exists xat_destacats_missatge_idx on public.xat_missatges_destacats(missatge_id);
create index if not exists xat_fixats_missatge_idx on public.xat_missatges_fixats(missatge_id);
create index if not exists xat_amagats_missatge_idx on public.xat_missatges_amagats(missatge_id);

create or replace function private.xat_accio_visible(p_id uuid,p_fil_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.xat_missatges m
  where m.id=p_id and (p_fil_id is null or m.fil_id=p_fil_id)
    and private.es_participant(m.fil_id) and private.seq_visible(m.fil_id,m.seq)
    and m.esborrat_al is null and (m.caduca_al is null or m.caduca_al>now()));
$$;
revoke all on function private.xat_accio_visible(uuid,uuid) from public,anon;
grant execute on function private.xat_accio_visible(uuid,uuid) to authenticated;

alter table public.xat_reaccions enable row level security;
alter table public.xat_missatges_destacats enable row level security;
alter table public.xat_missatges_fixats enable row level security;
alter table public.xat_missatges_amagats enable row level security;
-- Les taules no són API: RLS també protegeix una concessió futura accidental.
revoke all on table public.xat_reaccions,public.xat_missatges_destacats,
 public.xat_missatges_fixats,public.xat_missatges_amagats from public,anon,authenticated;
drop policy if exists xat_reaccions_propies on public.xat_reaccions;
create policy xat_reaccions_propies on public.xat_reaccions for all to authenticated
 using(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null))
 with check(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null));
drop policy if exists xat_destacats_propis on public.xat_missatges_destacats;
create policy xat_destacats_propis on public.xat_missatges_destacats for all to authenticated
 using(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null))
 with check(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null));
drop policy if exists xat_amagats_propis on public.xat_missatges_amagats;
create policy xat_amagats_propis on public.xat_missatges_amagats for all to authenticated
 using(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null))
 with check(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null));
drop policy if exists xat_fixats_autor on public.xat_missatges_fixats;
create policy xat_fixats_autor on public.xat_missatges_fixats for all to authenticated
 using(fixat_per=(select auth.uid()) and private.xat_accio_visible(missatge_id,conversa_id))
 with check(fixat_per=(select auth.uid()) and private.xat_accio_visible(missatge_id,conversa_id));

create or replace function private.xat_accio_estat(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('missatgeId',m.id,'filId',m.fil_id,
  'reaccions',coalesce((select jsonb_agg(jsonb_build_object('emoji',r.emoji,'total',r.total,'meua',r.meua) order by r.emoji)
   from(select x.emoji,count(*)::integer total,bool_or(x.usuari_id=auth.uid()) meua
    from public.xat_reaccions x where x.missatge_id=m.id group by x.emoji) r),'[]'::jsonb),
  'destacat',exists(select 1 from public.xat_missatges_destacats d where d.missatge_id=m.id and d.usuari_id=auth.uid()),
  'fixat',exists(select 1 from public.xat_missatges_fixats f where f.missatge_id=m.id and f.conversa_id=m.fil_id),
  'amagat',exists(select 1 from public.xat_missatges_amagats a where a.missatge_id=m.id and a.usuari_id=auth.uid()))
 from public.xat_missatges m where m.id=p_id and private.xat_accio_visible(m.id,m.fil_id);
$$;
revoke all on function private.xat_accio_estat(uuid) from public,anon,authenticated;

create or replace function public.xat_accions_missatges(p_fil_id uuid default null,p_ids uuid[] default '{}',
 p_nomes_destacats boolean default false,p_despres_de_id uuid default null,p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_files jsonb; v_limit integer:=coalesce(p_limit,100); v_mes boolean;
begin
 if auth.uid() is null then raise exception 'SDP-XAT-001' using errcode='42501'; end if;
 if v_limit<1 or v_limit>100 or coalesce(cardinality(p_ids),0)>100
  or (p_fil_id is null and not coalesce(p_nomes_destacats,false)) then
  raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if p_fil_id is not null and not private.es_participant(p_fil_id) then
  raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 select coalesce(jsonb_agg(private.xat_accio_estat(q.id) order by q.id),'[]'::jsonb) into v_files
 from(select m.id from public.xat_missatges m
  where (p_fil_id is null or m.fil_id=p_fil_id) and private.xat_accio_visible(m.id,m.fil_id)
   and (coalesce(cardinality(p_ids),0)=0 or m.id=any(p_ids))
   and (p_despres_de_id is null or m.id>p_despres_de_id)
   and (not coalesce(p_nomes_destacats,false) or exists(select 1 from public.xat_missatges_destacats d
    where d.missatge_id=m.id and d.usuari_id=auth.uid())) order by m.id limit v_limit+1) q;
 v_mes:=jsonb_array_length(v_files)>v_limit;
 if v_mes then v_files:=v_files-(jsonb_array_length(v_files)-1); end if;
 return jsonb_build_object('missatges',v_files,'teMes',v_mes,'seguentId',
  case when v_mes then v_files->(jsonb_array_length(v_files)-1)->>'missatgeId' else null end);
end $$;

create or replace function public.xat_alterna_reaccio(p_fil_id uuid,p_missatge_id uuid,p_emoji text,p_activa boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_activa is null or p_emoji is null or char_length(p_emoji) not between 1 and 16 or btrim(p_emoji)='' then
  raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('xat:reaccio:'||p_missatge_id::text||auth.uid()::text,0));
 if p_activa then
  -- Una sola reacció per persona i missatge, encara que canvie l'emoji.
  delete from public.xat_reaccions where missatge_id=p_missatge_id and usuari_id=auth.uid() and emoji<>p_emoji;
  insert into public.xat_reaccions(missatge_id,usuari_id,emoji) values(p_missatge_id,auth.uid(),p_emoji) on conflict do nothing;
 else delete from public.xat_reaccions where missatge_id=p_missatge_id and usuari_id=auth.uid() and emoji=p_emoji; end if;
 return private.xat_accio_estat(p_missatge_id);
end $$;

create or replace function public.xat_alterna_destacat(p_fil_id uuid,p_missatge_id uuid,p_actiu boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_actiu is null then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if p_actiu then insert into public.xat_missatges_destacats(usuari_id,missatge_id) values(auth.uid(),p_missatge_id) on conflict do nothing;
 else delete from public.xat_missatges_destacats where usuari_id=auth.uid() and missatge_id=p_missatge_id; end if;
 return private.xat_accio_estat(p_missatge_id);
end $$;

create or replace function public.xat_alterna_fixat(p_fil_id uuid,p_missatge_id uuid,p_actiu boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_actiu is null then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if exists(select 1 from public.xat_fils f where f.id=p_fil_id and f.tipus in('grup','canal','comunitat'))
  and not private.es_admin_del_fil(p_fil_id) then raise exception 'SDP-XAT-011' using errcode='42501'; end if;
 if p_actiu then insert into public.xat_missatges_fixats(conversa_id,missatge_id,fixat_per) values(p_fil_id,p_missatge_id,auth.uid()) on conflict do nothing;
 else delete from public.xat_missatges_fixats where conversa_id=p_fil_id and missatge_id=p_missatge_id; end if;
 return private.xat_accio_estat(p_missatge_id);
end $$;

create or replace function public.xat_elimina_per_a_mi(p_fil_id uuid,p_missatge_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 insert into public.xat_missatges_amagats(usuari_id,missatge_id) values(auth.uid(),p_missatge_id) on conflict do nothing;
 return private.xat_accio_estat(p_missatge_id);
end $$;

revoke all on function public.xat_accions_missatges(uuid,uuid[],boolean,uuid,integer),
 public.xat_alterna_reaccio(uuid,uuid,text,boolean),public.xat_alterna_destacat(uuid,uuid,boolean),
 public.xat_alterna_fixat(uuid,uuid,boolean),public.xat_elimina_per_a_mi(uuid,uuid) from public,anon;
grant execute on function public.xat_accions_missatges(uuid,uuid[],boolean,uuid,integer),
 public.xat_alterna_reaccio(uuid,uuid,text,boolean),public.xat_alterna_destacat(uuid,uuid,boolean),
 public.xat_alterna_fixat(uuid,uuid,boolean),public.xat_elimina_per_a_mi(uuid,uuid) to authenticated;
commit;
