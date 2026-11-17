-- R32.5 · P0-114. Safata humana i retirada cautelar, sense esborrar contingut.
-- Dependències: 2610201500, 2611122200, 20261116040000.
-- Reutilitza denuncies, denuncia_publicacio_mur i el seu trigger de quota
-- serialitzat (20/h compte; 10/h IP anon; 300/h anon global). Cap taula nova
-- de denúncies. Una denúncia no constituïx una declaració d'il·licitud.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table if not exists private.lssi_revisions (
  denuncia_id uuid primary key references public.denuncies(id),
  revisor uuid references auth.users(id) on delete set null,
  decisio text not null check (decisio in ('revisada','desestimada','retirada')),
  justificacio text not null check (char_length(justificacio) between 1 and 2000),
  estat_contingut_anterior text,
  revisada_al timestamptz not null default now()
);
-- La purga d'un compte no es bloqueja per una decisió administrativa antiga.
-- Conservem la decisió i el motiu amb autoria nul·la, també en repetir sobre
-- la primera versió de la taula, que tenia NOT NULL i FK sense acció de baixa.
alter table private.lssi_revisions alter column revisor drop not null;
alter table private.lssi_revisions drop constraint if exists lssi_revisions_revisor_fkey;
alter table private.lssi_revisions add constraint lssi_revisions_revisor_fkey
  foreign key (revisor) references auth.users(id) on delete set null;
alter table private.lssi_revisions enable row level security;
revoke all on table private.lssi_revisions from public,anon,authenticated,service_role;

create or replace function public.admin_safata_denuncies_lssi(
  p_estat text default 'pendent', p_limit integer default 50
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not coalesce(private.es_superadmin(),false)
     or not coalesce(private.copub_compte_actiu(auth.uid()),false) then
    raise exception using errcode='42501',message='SDP-LSSI-403: cal administració activa amb aal2.';
  end if;
  if p_estat is null or p_estat not in ('pendent','revisada','desestimada','retirada')
     or p_limit is null or p_limit not between 1 and 100 then
    raise exception using errcode='22023',message='SDP-LSSI-400: filtre o límit invàlid.';
  end if;
  return (select coalesce(jsonb_agg(x.fila order by x.creat_al,x.id),'[]'::jsonb) from (
    select d.id,d.creat_al,jsonb_build_object('id',d.id,'publicacioId',s.id,
      'tenantId',s.tenant_id,'seccio',s.section_id,'motiu',d.motiu,'detall',d.detall,
      'estat',d.estat,'creatAl',d.creat_al,'revisadaAl',d.revisada_al,
      'estatContingut',s.moderation_state,'justificacio',r.justificacio) as fila
    from public.denuncies d join public.section_submissions s on s.id::text=d.objecte_id
    left join private.lssi_revisions r on r.denuncia_id=d.id
    where d.estat=p_estat and d.objecte_tipus in ('publicacio','producte','esdeveniment')
      and s.section_id in ('mur','mercat','events','multimedia') and s.visibility='public'
    order by d.creat_al,d.id limit p_limit
  ) x);
end;
$$;
revoke all on function public.admin_safata_denuncies_lssi(text,integer) from public,anon,authenticated,service_role;
grant execute on function public.admin_safata_denuncies_lssi(text,integer) to authenticated;

create or replace function public.admin_revisa_denuncia_lssi(
  p_id uuid,p_decisio text,p_justificacio text,p_estat_esperat text default 'pendent'
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare d public.denuncies; s public.section_submissions; r private.lssi_revisions;
begin
  if auth.uid() is null or not coalesce(private.es_superadmin(),false)
     or not coalesce(private.copub_compte_actiu(auth.uid()),false) then
    raise exception using errcode='42501',message='SDP-LSSI-403: cal administració activa amb aal2.';
  end if;
  if p_id is null or p_decisio is null or p_decisio not in ('revisada','desestimada','retirada')
     or p_estat_esperat is distinct from 'pendent' or p_justificacio is null
     or char_length(btrim(p_justificacio)) not between 1 and 2000 then
    raise exception using errcode='22023',message='SDP-LSSI-400: decisió o justificació invàlida.';
  end if;
  select * into d from public.denuncies where id=p_id for update;
  if not found then
    raise exception using errcode='22023',message='SDP-LSSI-404: denúncia no disponible.';
  end if;
  if d.estat is distinct from p_estat_esperat then
    select * into r from private.lssi_revisions where denuncia_id=p_id;
    if r.revisor=auth.uid() and r.decisio=p_decisio and r.justificacio=btrim(p_justificacio) then
      return jsonb_build_object('id',p_id,'estat',d.estat,'repetida',true);
    end if;
    raise exception using errcode='40001',message='SDP-LSSI-409: la denúncia ja ha canviat.';
  end if;
  -- Mateix ordre que publica/revoca: advisory abans de bloquejar la fila.
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||d.objecte_id,0));
  select * into s from public.section_submissions
    where id::text=d.objecte_id and visibility='public'
      and section_id in ('mur','mercat','events','multimedia')
      and d.objecte_tipus in ('publicacio','producte','esdeveniment') for update;
  if not found then
    raise exception using errcode='22023',message='SDP-LSSI-404: contingut públic no disponible.';
  end if;
  if p_decisio='retirada' then
    -- El mateix pany que la publicació/revocació canònica; sense delete ni
    -- alteració de visibility, payload, autoria o la data original.
    if s.deleted_at is not null or s.moderation_state<>'visible'
       or exists(select 1 from private.mur_publicacions_revocades x where x.submission_id=s.id) then
      raise exception using errcode='40001',message='SDP-LSSI-409: el contingut ja ha canviat.';
    end if;
    update public.section_submissions set moderation_state='retirada_cautelar' where id=s.id;
  end if;
  insert into private.lssi_revisions(denuncia_id,revisor,decisio,justificacio,estat_contingut_anterior)
    values(p_id,auth.uid(),p_decisio,btrim(p_justificacio),s.moderation_state);
  update public.denuncies set estat=p_decisio,revisada_al=now() where id=p_id;
  return jsonb_build_object('id',p_id,'estat',p_decisio,'repetida',false);
end;
$$;
revoke all on function public.admin_revisa_denuncia_lssi(uuid,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.admin_revisa_denuncia_lssi(uuid,text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
