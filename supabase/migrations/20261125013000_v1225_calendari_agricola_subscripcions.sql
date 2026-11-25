-- Subscripcions agrícoles pròpies; cap SMS ni alta de fils automàtica.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';
create table if not exists public.calendari_agricola_subscripcions (
  id uuid primary key default gen_random_uuid(),
  usuari_id uuid not null references auth.users(id) on delete cascade,
  poble_id uuid not null references public.towns(id) on delete cascade,
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  cultiu text not null check (length(cultiu) between 1 and 80 and cultiu ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  comarca text not null check (length(comarca) between 1 and 80 and comarca ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  activa boolean not null default true,
  creat timestamptz not null default now(),
  modificat timestamptz not null default now(),
  unique (usuari_id, cultiu, comarca)
);
create index if not exists calendari_agricola_subscripcions_poble on public.calendari_agricola_subscripcions(poble_id);
create index if not exists calendari_agricola_subscripcions_fil on public.calendari_agricola_subscripcions(fil_id);
alter table public.calendari_agricola_subscripcions enable row level security;
revoke all on public.calendari_agricola_subscripcions from public, anon, authenticated;

create or replace function public.calendari_agricola_subscripcions_meues()
returns setof public.calendari_agricola_subscripcions
language sql stable security definer set search_path = '' as $$
  select s.* from public.calendari_agricola_subscripcions s
  where s.usuari_id = auth.uid() order by s.cultiu, s.comarca;
$$;

create or replace function public.calendari_agricola_desa_subscripcio(
  p_poble_id uuid, p_fil_id uuid, p_cultiu text, p_comarca text, p_activa boolean default true
) returns public.calendari_agricola_subscripcions
language plpgsql security definer set search_path = '' as $$
declare resultat public.calendari_agricola_subscripcions;
begin
  if auth.uid() is null or p_activa is null then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_activa then
    if not coalesce(private.is_town_member(p_poble_id), false)
       or not exists (select 1 from public.xat_fils f where f.id = p_fil_id and f.tenant_id = p_poble_id)
       or not coalesce(private.xat_participant_vigent(p_fil_id, auth.uid()), false)
       or not coalesce(private.es_participant(p_fil_id), false)
    then raise exception 'not_authorized' using errcode = '42501'; end if;
    insert into public.calendari_agricola_subscripcions(usuari_id,poble_id,fil_id,cultiu,comarca,activa)
    values(auth.uid(),p_poble_id,p_fil_id,p_cultiu,p_comarca,true)
    on conflict(usuari_id,cultiu,comarca) do update set poble_id=excluded.poble_id,fil_id=excluded.fil_id,activa=true,modificat=now()
    returning * into resultat;
  else
    -- La baixa sempre és possible, també després de deixar el poble o el fil.
    update public.calendari_agricola_subscripcions set activa=false,modificat=now()
    where usuari_id=auth.uid() and cultiu=p_cultiu and comarca=p_comarca returning * into resultat;
  end if;
  return resultat;
end;
$$;
revoke all on function public.calendari_agricola_subscripcions_meues() from public,anon;
revoke all on function public.calendari_agricola_desa_subscripcio(uuid,uuid,text,text,boolean) from public,anon;
grant execute on function public.calendari_agricola_subscripcions_meues() to authenticated;
grant execute on function public.calendari_agricola_desa_subscripcio(uuid,uuid,text,text,boolean) to authenticated;
commit;
