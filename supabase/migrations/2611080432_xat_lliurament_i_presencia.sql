-- R54 · Rebuts dels altres i presència efímera. No modifica el nucli del port.
-- Depends-on: 2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql
-- Auth.uid + membre vigent, mai una identitat del cos de la petició.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

create table if not exists private.xat_presencia (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  instancia uuid not null,
  revisio bigint not null check (revisio >= 0 and revisio <= 9007199254740991),
  escrivint boolean not null,
  vigent_fins timestamptz not null,
  actualitzat_al timestamptz not null default now(),
  primary key (fil_id,usuari_id,instancia)
);
create index if not exists xat_presencia_caducitat on private.xat_presencia(actualitzat_al);
alter table private.xat_presencia enable row level security;
revoke all on private.xat_presencia from public,anon,authenticated,service_role;

-- Only a server-registered principal bound to this exact tenant/thread is a bot.
-- Standalone ritme installations without IAIA have no such registry or binding.
create or replace function private.xat_ritme_es_bot(p_fil_id uuid,p_usuari_id uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_bot boolean;
begin
  if to_regclass('private.xat_iaia_principals') is null or to_regclass('private.xat_iaia_binding') is null then return false; end if;
  execute 'select exists(select 1 from private.xat_iaia_principals bp
    join private.xat_iaia_binding b on b.bot_id=bp.bot_id and b.fil_id=$1
    join public.xat_fils f on f.id=b.fil_id and f.tenant_id=b.tenant_id
    join public.xat_participants p on p.fil_id=f.id and p.usuari_id=bp.bot_id
    where bp.bot_id=$2 and p.visible_fins_seq is null and p.eixit_al is null
      and private.xat_participant_vigent(f.id,p.usuari_id))'
    into v_bot using p_fil_id,p_usuari_id;
  return coalesce(v_bot,false);
end $$;
revoke all on function private.xat_ritme_es_bot(uuid,uuid) from public,anon,authenticated,service_role;

create or replace function private.xat_ritme_autoritza(p_fil_id uuid)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then raise exception 'SDP-XAT-001' using errcode='42501'; end if;
  if private.xat_ritme_es_bot(p_fil_id,v_jo) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
  if p_fil_id is null or not exists (
    select 1 from public.xat_participants p where p.fil_id=p_fil_id and p.usuari_id=v_jo
      and p.visible_fins_seq is null and p.eixit_al is null
      and private.xat_participant_vigent(p_fil_id,v_jo)
  ) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
  return v_jo;
end $$;
revoke all on function private.xat_ritme_autoritza(uuid) from public,anon,authenticated,service_role;

-- Entrega és independent de lectura: no toca xat_lectures ni no_llegit_manual.
create or replace function public.xat_marca_rebut(p_fil_id uuid,p_rebut_fins bigint)
returns table(rebut_fins_seq bigint,llegit_fins_seq bigint)
language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := private.xat_ritme_autoritza(p_fil_id); v_ultim bigint;
begin
  if p_rebut_fins is null or p_rebut_fins<0 or p_rebut_fins>9007199254740991 then
    raise exception 'SDP-XAT-009' using errcode='22023'; end if;
  select f.ultim_seq into v_ultim from public.xat_fils f where f.id=p_fil_id;
  return query update public.xat_participants p
    set rebut_fins_seq=greatest(p.rebut_fins_seq,least(p_rebut_fins,v_ultim))
    where p.fil_id=p_fil_id and p.usuari_id=v_jo
    returning p.rebut_fins_seq,p.llegit_fins_seq;
end $$;

create or replace function public.xat_ritme(p_fil_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_jo uuid := private.xat_ritme_autoritza(p_fil_id); v_resultat jsonb;
begin
  select jsonb_build_object(
    'rebutPelsAltresFinsSeq',coalesce(min(p.rebut_fins_seq),0),
    'llegitPelsAltresFinsSeq',coalesce(min(p.llegit_fins_seq),0),
    'escrivint',coalesce((select jsonb_agg(jsonb_build_object('usuariId',q.usuari_id,'vigentMs',q.ms)) from (
      select pr.usuari_id,least(8000,greatest(0,ceil(extract(epoch from (max(pr.vigent_fins)-statement_timestamp()))*1000)))::integer ms
      from private.xat_presencia pr join public.xat_participants pp on pp.fil_id=pr.fil_id and pp.usuari_id=pr.usuari_id
      where pr.fil_id=p_fil_id and pr.usuari_id<>v_jo and pr.escrivint and pr.vigent_fins>statement_timestamp()
        and pp.visible_fins_seq is null and pp.eixit_al is null and private.xat_participant_vigent(p_fil_id,pr.usuari_id) and not private.xat_ritme_es_bot(p_fil_id,pr.usuari_id)
        and (f.org_id is null or pp.com_org_id is distinct from jo.com_org_id)
        and not exists(select 1 from public.bloquejos b where b.bloquejat_tipus='persona' and
          ((b.bloquejador=v_jo and b.bloquejat_persona=pr.usuari_id) or (b.bloquejador=pr.usuari_id and b.bloquejat_persona=v_jo)))
      group by pr.usuari_id order by pr.usuari_id limit 20
    ) q),'[]'::jsonb)) into v_resultat
  from public.xat_fils f join public.xat_participants jo on jo.fil_id=f.id and jo.usuari_id=v_jo
  left join public.xat_participants p on p.fil_id=f.id and p.usuari_id<>v_jo
    and p.visible_fins_seq is null and p.eixit_al is null and private.xat_participant_vigent(f.id,p.usuari_id) and not private.xat_ritme_es_bot(f.id,p.usuari_id)
    and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)
  where f.id=p_fil_id group by f.id,jo.com_org_id;
  return v_resultat;
end $$;

create or replace function public.xat_presencia(p_fil_id uuid,p_instancia uuid,p_revisio bigint,p_escrivint boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := private.xat_ritme_autoritza(p_fil_id); v_tipus text;
begin
  if p_instancia is null or p_revisio is null or p_revisio<0 or p_revisio>9007199254740991 or p_escrivint is null then
    raise exception 'SDP-XAT-009' using errcode='22023'; end if;
  select f.tipus into v_tipus from public.xat_fils f where f.id=p_fil_id;
  -- La IA no simula presència humana; canals i visitants tampoc no publiquen.
  if v_tipus not in ('directe','grup') then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('xat-presencia:'||p_fil_id::text||':'||v_jo::text,0));
  -- Tombstones retenen la revisió un dia: una renovació tardana no desfà blur/send.
  delete from private.xat_presencia where (fil_id,usuari_id,instancia) in (
    select x.fil_id,x.usuari_id,x.instancia from private.xat_presencia x
    where x.actualitzat_al<now()-interval '1 day' order by x.actualitzat_al limit 100);
  delete from private.xat_presencia where fil_id=p_fil_id and usuari_id=v_jo and actualitzat_al<now()-interval '1 day';
  if not exists(select 1 from private.xat_presencia where fil_id=p_fil_id and usuari_id=v_jo and instancia=p_instancia)
     and (select count(*) from private.xat_presencia where fil_id=p_fil_id and usuari_id=v_jo)>=32 then
    raise exception 'SDP-XAT-429' using errcode='54000'; end if;
  insert into private.xat_presencia as pr(fil_id,usuari_id,instancia,revisio,escrivint,vigent_fins)
    values(p_fil_id,v_jo,p_instancia,p_revisio,p_escrivint,case when p_escrivint then now()+interval '8 seconds' else now() end)
    on conflict(fil_id,usuari_id,instancia) do update set revisio=excluded.revisio,escrivint=excluded.escrivint,
      vigent_fins=excluded.vigent_fins,actualitzat_al=now() where pr.revisio<excluded.revisio;
  return jsonb_build_object('acceptat',true);
end $$;

revoke all on function public.xat_marca_rebut(uuid,bigint),public.xat_ritme(uuid),public.xat_presencia(uuid,uuid,bigint,boolean) from public,anon,authenticated,service_role;
grant execute on function public.xat_marca_rebut(uuid,bigint),public.xat_ritme(uuid),public.xat_presencia(uuid,uuid,bigint,boolean) to authenticated;
commit;
