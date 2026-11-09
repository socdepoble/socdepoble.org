-- R54 P0-57: durable blind wake-up delivery, bounded leases and fenced ACKs.
-- Source-only candidate. Deploy together with the v2 worker; never fall back
-- to the destructive v1 claim. Provider acceptance is not a device receipt.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table private.xat_push_cua add column if not exists preparat_al timestamptz;
alter table private.xat_push_cua add column if not exists despertat_al timestamptz;

create table if not exists private.xat_push_lliuraments (
  id uuid primary key default gen_random_uuid(),
  -- Deliberately no cascading FKs: one parent/device may have arbitrarily
  -- many transient jobs. Removing it must not fan out in send/logout paths.
  cua_id bigint not null,
  dispositiu_id uuid not null,
  usuari_id uuid not null,
  creat_al timestamptz not null default now(),
  caduca_al timestamptz not null,
  intents smallint not null default 0 check (intents between 0 and 8),
  proxim_al timestamptz not null default now(),
  lease_id uuid,
  lease_fins timestamptz,
  registre_versio timestamptz,
  completat_al timestamptz,
  resultat text check (resultat in ('acceptat', 'descartat')),
  unique (cua_id, dispositiu_id),
  check ((lease_id is null) = (lease_fins is null)),
  check ((completat_al is null) = (resultat is null))
);
-- Also remove the constraints on a local replay over an earlier R54 draft.
alter table private.xat_push_lliuraments
  drop constraint if exists xat_push_lliuraments_cua_id_fkey,
  drop constraint if exists xat_push_lliuraments_dispositiu_id_fkey;
create index if not exists xat_push_lliuraments_pendents_idx
  on private.xat_push_lliuraments (proxim_al, id) where completat_al is null;
create index if not exists xat_push_lliuraments_dispositiu_idx
  on private.xat_push_lliuraments (dispositiu_id, usuari_id);
create index if not exists xat_push_lliuraments_caduca_idx
  on private.xat_push_lliuraments (caduca_al, id);
alter table private.xat_push_lliuraments enable row level security;
revoke all on table private.xat_push_lliuraments from public, anon, authenticated, service_role;

-- Bounded physical retirement, independent of parent/device cascades.
-- Completed rows are deduplication tombstones while a live parent is still
-- being expanded. Never remove those before preparat_al becomes non-null.
create or replace function private.xat_push_purga_v2(p_limit integer default 5000)
returns integer language plpgsql volatile security definer set search_path = ''
as $$
declare v_n integer;
begin
  -- Cap selected/locked candidates as well as deleted rows. A young orphan
  -- behind live work can wait for older work's 15min expiry and a later
  -- sweep; this is a work bound, not an unconditional wall-clock TTL.
  with revisar as materialized (
    select x.id,x.cua_id,x.dispositiu_id,x.usuari_id,x.caduca_al,x.completat_al
      from private.xat_push_lliuraments x
      order by x.caduca_al,x.id
      limit greatest(0,least(coalesce(p_limit,5000),5000))
      for update of x skip locked
  )
  delete from private.xat_push_lliuraments j
   using revisar x
   where j.id=x.id and (
         x.caduca_al<=now()
         or not exists(select 1 from private.xat_push_cua q where q.id=x.cua_id)
         or not exists(select 1 from public.xat_dispositius_push d
                        where d.id=x.dispositiu_id and d.usuari_id=x.usuari_id)
         or (x.completat_al is not null and exists(
           select 1 from private.xat_push_cua q
            where q.id=x.cua_id and q.preparat_al is not null))
   );
  get diagnostics v_n=row_count;
  return v_n;
end;
$$;
revoke all on function private.xat_push_purga_v2(integer) from public,anon,authenticated,service_role;

-- Preserve the legacy cleanup contract/grants while retiring v2 delivery
-- metadata on every successful cleanup, even without new messages/claims.
create or replace function public.xat_push_neteja()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_dies        integer;
  v_dispositius integer;
  v_cua         integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
      from private.ajustos a where a.clau = 'push_xat_dies_dispositiu';
  exception when invalid_text_representation or numeric_value_out_of_range then
    -- Un valor que no és un enter de 32 bits cau en 60 (mai atura el worker).
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 60);

  delete from public.xat_dispositius_push d
   where d.id in (select x.id from public.xat_dispositius_push x
                   where (x.caduca_al is not null and x.caduca_al <= now())
                      or x.renovat_al <= now() - make_interval(days => v_dies)
                   limit 1000);
  get diagnostics v_dispositius = row_count;

  delete from private.xat_push_cua c where c.creat_al <= now() - interval '1 hour';
  get diagnostics v_cua = row_count;

  -- Keep delivery retention independent of sending, including worker-off
  -- cron passes. The existing helper locks/selects at most 5000 candidates.
  perform private.xat_push_purga_v2(5000);

  return jsonb_build_object('dispositius', v_dispositius, 'cua', v_cua);
end;
$$;
revoke all on function public.xat_push_neteja() from public,anon,authenticated,service_role;
grant execute on function public.xat_push_neteja() to service_role;

-- The existing encua trigger still retires at most 100 old queue parents.
-- A separate, nonfatal trigger sweeps at most 100 transient jobs after it,
-- including when push is disabled or the worker is unavailable. No change
-- to the actual chat message or original parent-retention operation.
create or replace function private.xat_push_retencio_v2()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform private.xat_push_purga_v2(100);
  return null;
exception when others then
  raise warning 'SDP-PUSH-901: no s''han pogut purgar els lliuraments (%).',sqlstate;
  return null;
end;
$$;
revoke all on function private.xat_push_retencio_v2() from public,anon,authenticated,service_role;
drop trigger if exists xat_missatges_push_retencio_v2 on public.xat_missatges;
create trigger xat_missatges_push_retencio_v2
  after insert on public.xat_missatges for each row
  execute function private.xat_push_retencio_v2();

-- Reused at preparation and each retry. No browser-supplied recipient,
-- endpoint, actor or content enters the delivery authorization decision.
create or replace function private.xat_push_candidats_v2(p_cua_id bigint)
returns table (id uuid, usuari_id uuid, tipus text, adreca text, llengua text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_dies integer;
  v_generals boolean;
begin
  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
      from private.ajustos a where a.clau = 'push_xat_dies_dispositiu';
  exception when invalid_text_representation or numeric_value_out_of_range then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 60);
  v_generals := coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_generals'), '') = 'si';
  return query
    select distinct d.id, d.usuari_id, d.tipus, d.adreca, d.llengua
      from private.xat_push_cua q
      join public.xat_missatges m on m.id = q.missatge_id and m.fil_id = q.fil_id
      join public.xat_fils f on f.id = q.fil_id
      join public.xat_participants p on p.fil_id = q.fil_id
      join public.xat_dispositius_push d on d.usuari_id = p.usuari_id
     where q.id = p_cua_id and q.creat_al > now() - interval '15 minutes'
       and coalesce((select a.valor from private.ajustos a where a.clau='push_xat_actiu'), '')='si'
       and m.esborrat_al is null
       and p.usuari_id is distinct from q.autor_id
       and p.visible_fins_seq is null and p.arxivat_al is null
       and coalesce(p.llegit_fins_seq, 0) < m.seq
       and (p.silenciat_fins_al is null or p.silenciat_fins_al <= now())
       and (p.avisos = 'tots' or (p.avisos = 'destacats' and q.resposta_a is not null
            and exists (select 1 from public.xat_missatges r
                         where r.id = q.resposta_a and r.usuari_id = p.usuari_id)))
       and not (q.com_org_id is not null and p.com_org_id is not distinct from q.com_org_id)
       and (f.tipus = 'directe' or (f.tipus in ('canal', 'grup')
            and ((f.comunitat_id is null and f.subjecte_tipus is null) or v_generals)))
       and private.xat_participant_vigent(q.fil_id, p.usuari_id)
       and not exists (select 1 from public.bloquejos b where b.bloquejador = p.usuari_id
            and ((b.bloquejat_tipus = 'persona' and b.bloquejat_persona = q.autor_id)
              or (b.bloquejat_tipus = 'entitat' and q.com_org_id is not null
                  and b.bloquejat_entitat = q.com_org_id)))
       and not exists (select 1 from private.baixes bx where bx.user_id = p.usuari_id)
       and (d.caduca_al is null or d.caduca_al > now())
       and d.renovat_al > now() - make_interval(days => v_dies);
end;
$$;
revoke all on function private.xat_push_candidats_v2(bigint) from public, anon, authenticated, service_role;

-- A bounded incremental expansion. Completed deliveries remain tombstones
-- until their parent queue row is retired, so a retry never prepares them again.
create or replace function private.xat_push_prepara_v2(p_limit integer)
returns integer language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_q record;
  v_restants integer := 5000;
  v_n integer;
  v_processats integer := 0;
begin
  for v_q in select q.id, q.creat_al from private.xat_push_cua q
      where q.preparat_al is null and q.creat_al > now()-interval '15 minutes'
      order by q.id limit greatest(1,least(coalesce(p_limit,50),200))
      for update skip locked
  loop
    insert into private.xat_push_lliuraments(cua_id,dispositiu_id,usuari_id,caduca_al)
      select v_q.id,d.id,d.usuari_id,v_q.creat_al+interval '15 minutes'
        from private.xat_push_candidats_v2(v_q.id) d
       where not exists(select 1 from private.xat_push_lliuraments j
                         where j.cua_id=v_q.id and j.dispositiu_id=d.id)
       order by d.id limit v_restants
      on conflict(cua_id,dispositiu_id) do nothing;
    get diagnostics v_n = row_count;
    v_restants := v_restants-v_n;
    v_processats := v_processats+1;
    if not exists(select 1 from private.xat_push_candidats_v2(v_q.id) d
                   where not exists(select 1 from private.xat_push_lliuraments j
                                     where j.cua_id=v_q.id and j.dispositiu_id=d.id)) then
      update private.xat_push_cua set preparat_al=now() where id=v_q.id;
    end if;
    exit when v_restants=0;
  end loop;
  return v_processats;
end;
$$;
revoke all on function private.xat_push_prepara_v2(integer) from public, anon, authenticated, service_role;

-- A stale client compensation must not retire a registration belonging to
-- the next account on the same device. The expected actor is captured when
-- the original operation starts, rather than read when its promise settles.
create or replace function public.xat_push_retira_segura(
  p_plataforma text,p_adreca text,p_usuari_esperat uuid
)
returns void language plpgsql volatile security definer set search_path = ''
as $$
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null or p_usuari_esperat is null or v_jo is distinct from p_usuari_esperat then
    raise exception 'SDP-PUSH-012: la sessió ha canviat.' using errcode='42501';
  end if;
  perform public.xat_push_retira(p_plataforma,p_adreca);
end;
$$;
revoke all on function public.xat_push_retira_segura(text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.xat_push_retira_segura(text,text,uuid) to authenticated;

create or replace function public.xat_push_reclama_v2(p_limit integer default 50)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_preparats integer;
  v_treballs integer;
  v_diferits integer;
  v_dispositius jsonb;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode='42501';
  end if;
  v_preparats := private.xat_push_prepara_v2(p_limit);
  with revisar as materialized (
    select j.id,j.cua_id from private.xat_push_lliuraments j
     where j.completat_al is null and (j.lease_fins is null or j.lease_fins<=now())
     order by j.proxim_al,j.id limit 5000 for update skip locked
  ), candidats as materialized (
    select q.cua_id,d.id,d.usuari_id from (select distinct r.cua_id from revisar r) q
      cross join lateral private.xat_push_candidats_v2(q.cua_id) d
  )
  update private.xat_push_lliuraments j
     set completat_al=now(),resultat='descartat',lease_id=null,lease_fins=null
   where j.id in (select r.id from revisar r)
     and (j.caduca_al<=now() or j.intents>=8 or not exists(
       select 1 from candidats c where c.cua_id=j.cua_id
         and c.id=j.dispositiu_id and c.usuari_id=j.usuari_id));

  delete from private.xat_push_cua q
   where q.id in (select c.id from private.xat_push_cua c
     where c.creat_al<=now()-interval '15 minutes'
        or (c.preparat_al is not null and not exists(
          select 1 from private.xat_push_lliuraments j
           where j.cua_id=c.id and j.completat_al is null))
     order by c.id limit 5000 for update skip locked);

  perform private.xat_push_purga_v2(5000);

  with pendents as materialized (
    select j.id,j.cua_id,j.dispositiu_id,j.usuari_id from private.xat_push_lliuraments j
     where j.completat_al is null and j.proxim_al<=now() and j.caduca_al>now()
       and j.intents<8 and (j.lease_fins is null or j.lease_fins<=now())
     order by j.proxim_al,j.id limit 5000 for update of j skip locked
  ), elegibles as materialized (
    select q.cua_id,c.id,c.usuari_id from (select distinct p.cua_id from pendents p) q
      cross join lateral private.xat_push_candidats_v2(q.cua_id) c
  ), disponibles as materialized (
    select j.id,j.dispositiu_id,j.usuari_id,d.tipus,d.adreca,d.llengua,d.renovat_al,
      octet_length(jsonb_build_object('id',j.id,'lease','ffffffff-ffff-ffff-ffff-ffffffffffff',
        'dispositiu',jsonb_build_object('id',d.id,'tipus',d.tipus,'adreca',d.adreca,'llengua',d.llengua))::text)+100 as pes
      from pendents j
      join public.xat_dispositius_push d on d.id=j.dispositiu_id and d.usuari_id=j.usuari_id
      join elegibles e on e.cua_id=j.cua_id and e.id=j.dispositiu_id and e.usuari_id=j.usuari_id
  ), pesats as (
    select d.*,sum(d.pes)over(order by d.id rows between unbounded preceding and current row) as octets
      from disponibles d
  ), triats as (
    select p.* from pesats p where p.octets<=1700000
  ), reclamats as (
    update private.xat_push_lliuraments j
       set lease_id=gen_random_uuid(),lease_fins=now()+interval '120 seconds',registre_versio=t.renovat_al,intents=j.intents+1
      from triats t where j.id=t.id
      returning j.id,j.lease_id,j.dispositiu_id,t.tipus,t.adreca,t.llengua
  ), agrupats as (
    select r.dispositiu_id,r.tipus,r.adreca,r.llengua,
      jsonb_agg(jsonb_build_object('id',r.id,'lease',r.lease_id)order by r.id) as lliuraments
      from reclamats r group by r.dispositiu_id,r.tipus,r.adreca,r.llengua
  )
  select (select count(*)::integer from reclamats),
    (select count(*)::integer from disponibles)-(select count(*)::integer from triats),
    coalesce((select jsonb_agg(jsonb_build_object('id',a.dispositiu_id,'tipus',a.tipus,
      'adreca',a.adreca,'llengua',a.llengua,'lliuraments',a.lliuraments)order by a.dispositiu_id)
      from agrupats a),'[]'::jsonb)
    into v_treballs,v_diferits,v_dispositius;
  return jsonb_build_object('protocol','lease-v2','missatges',v_preparats,
    'treballs',v_treballs,'retallats',v_diferits,'dispositius',v_dispositius);
end;
$$;
revoke all on function public.xat_push_reclama_v2(integer) from public,anon,authenticated,service_role;
grant execute on function public.xat_push_reclama_v2(integer) to service_role;

create or replace function public.xat_push_confirma_v2(p_resultats jsonb)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  v jsonb;
  v_j record;
  v_acceptats integer:=0;
  v_reintentats integer:=0;
  v_descartats integer:=0;
  v_obsolets integer:=0;
  v_expulsats integer:=0;
  v_n integer;
begin
  if coalesce((select auth.role()), '')<>'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode='42501';
  end if;
  if jsonb_typeof(p_resultats) is distinct from 'array' then
    raise exception 'SDP-PUSH-005: ACK invàlid.' using errcode='22023';
  end if;
  if jsonb_array_length(p_resultats)>5000 then
    raise exception 'SDP-PUSH-005: ACK massa gran.' using errcode='22023';
  end if;
  -- Validate the entire batch before performing any update.
  for v in select value from jsonb_array_elements(p_resultats) loop
    if jsonb_typeof(v) is distinct from 'object' then
      raise exception 'SDP-PUSH-005: ACK invàlid.' using errcode='22023';
    end if;
    if not(v ?& array['id','lease','resultat'])
       or (select count(*) from jsonb_object_keys(v))<>3
       or jsonb_typeof(v->'id') is distinct from 'string'
       or jsonb_typeof(v->'lease') is distinct from 'string'
       or jsonb_typeof(v->'resultat') is distinct from 'string'
       or (v->>'id')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or (v->>'lease')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or (v->>'resultat') not in('acceptat','reintenta','descarta','expulsa') then
      raise exception 'SDP-PUSH-005: ACK invàlid.' using errcode='22023';
    end if;
  end loop;
  if (select count(distinct e->>'id') from jsonb_array_elements(p_resultats)e)
       <>jsonb_array_length(p_resultats) then
    raise exception 'SDP-PUSH-005: ACK duplicat.' using errcode='22023';
  end if;
  for v in select value from jsonb_array_elements(p_resultats) order by value->>'id' loop
    select j.* into v_j from private.xat_push_lliuraments j
      where j.id=(v->>'id')::uuid and j.lease_id=(v->>'lease')::uuid
        and j.lease_fins>now() and j.completat_al is null
        and exists(select 1 from private.xat_push_cua q where q.id=j.cua_id)
        and exists(select 1 from public.xat_dispositius_push d
                    where d.id=j.dispositiu_id and d.usuari_id=j.usuari_id)
      for update;
    if not found then
      v_obsolets:=v_obsolets+1;
      continue;
    end if;
    if v->>'resultat'='expulsa' then
      -- Fenced provider rejection: neither another owner nor a registration
      -- renewed after the claim can be deleted by this old provider result.
      delete from public.xat_dispositius_push d where d.id=v_j.dispositiu_id
        and d.usuari_id=v_j.usuari_id and d.renovat_al=v_j.registre_versio;
      get diagnostics v_n=row_count;
      v_expulsats:=v_expulsats+v_n;
      if v_n=0 then
        update private.xat_push_lliuraments set proxim_al=now()+interval '15 seconds',lease_id=null,lease_fins=null where id=v_j.id;
        v_reintentats:=v_reintentats+1;
      else
        -- Only the acknowledged job is terminal here. Other jobs for this
        -- removed device are obsolete and retired by the bounded sweeper.
        update private.xat_push_lliuraments
          set completat_al=now(),resultat='descartat',lease_id=null,lease_fins=null
          where id=v_j.id;
        v_descartats:=v_descartats+1;
      end if;
    elsif v->>'resultat'='acceptat' then
      update private.xat_push_lliuraments set completat_al=now(),resultat='acceptat',lease_id=null,lease_fins=null where id=v_j.id;
      v_acceptats:=v_acceptats+1;
    elsif v->>'resultat'='descarta' or v_j.intents>=8 or v_j.caduca_al<=now() then
      update private.xat_push_lliuraments set completat_al=now(),resultat='descartat',lease_id=null,lease_fins=null where id=v_j.id;
      v_descartats:=v_descartats+1;
    else
      update private.xat_push_lliuraments
        set proxim_al=now()+make_interval(secs=>least(300,15*(1<<greatest(v_j.intents-1,0)))),lease_id=null,lease_fins=null
        where id=v_j.id;
      v_reintentats:=v_reintentats+1;
    end if;
  end loop;
  return jsonb_build_object('acceptats',v_acceptats,'reintentats',v_reintentats,
    'descartats',v_descartats,'obsolets',v_obsolets,'expulsats',v_expulsats);
end;
$$;
revoke all on function public.xat_push_confirma_v2(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.xat_push_confirma_v2(jsonb) to service_role;

-- The user-facing relay verifies the JWT with Auth, then supplies that
-- verified identity through its service connection. Browsers cannot call
-- this RPC or choose a different author's message to wake the worker.
create or replace function public.xat_push_desperta_v2(p_missatge_id uuid,p_usuari_esperat uuid)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
declare v_n integer;
begin
  if coalesce((select auth.role()), '')<>'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode='42501';
  end if;
  if p_missatge_id is null or p_usuari_esperat is null then return false; end if;
  update private.xat_push_cua q set despertat_al=now()
    where q.missatge_id=p_missatge_id and q.autor_id=p_usuari_esperat
      and q.despertat_al is null and q.creat_al>now()-interval '30 seconds'
      and coalesce((select a.valor from private.ajustos a where a.clau='push_xat_actiu'),'')='si'
      and exists(select 1 from public.xat_missatges m where m.id=q.missatge_id
        and m.fil_id=q.fil_id and m.usuari_id=p_usuari_esperat and m.esborrat_al is null)
      and private.xat_participant_vigent(q.fil_id,p_usuari_esperat);
  get diagnostics v_n=row_count;
  return v_n>0;
end;
$$;
revoke all on function public.xat_push_desperta_v2(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.xat_push_desperta_v2(uuid,uuid) to service_role;

-- A lagging worker must not consume or expel by the unfenced v1 protocol.
create or replace function public.xat_push_reclama(p_limit integer default 50)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '')<>'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode='42501';
  end if;
  raise exception 'SDP-PUSH-020: cal el protocol lease-v2.' using errcode='55000';
end;
$$;
create or replace function public.xat_push_expulsa(p_ids uuid[])
returns integer language plpgsql volatile security definer set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '')<>'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode='42501';
  end if;
  raise exception 'SDP-PUSH-020: cal un ACK lease-v2.' using errcode='55000';
end;
$$;
revoke all on function public.xat_push_reclama(integer) from public,anon,authenticated,service_role;
revoke all on function public.xat_push_expulsa(uuid[]) from public,anon,authenticated,service_role;
grant execute on function public.xat_push_reclama(integer) to service_role;
grant execute on function public.xat_push_expulsa(uuid[]) to service_role;
notify pgrst,'reload schema';
commit;
