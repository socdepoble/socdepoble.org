-- R32.64 · IDEA342. Làpida sense termini; cap eliminació física de Storage.
-- Requereix el catàleg acumulatiu R32.62. No reescriu migracions històriques.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_catalog.pg_advisory_xact_lock(3264,1);
lock table public.xat_missatges in share row exclusive mode;
do $guard$
declare v_hash text; v_definition text;
  v_old constant text := $old$    IF old.versio_xifrat=1 AND (new.fil_id,new.id,new.usuari_id,new.versio_xifrat,new.text,new.tipus,new.com_org_id,new.resposta_a_xifrada,new.metadades,new.es_ia)
      IS DISTINCT FROM (old.fil_id,old.id,old.usuari_id,old.versio_xifrat,old.text,old.tipus,old.com_org_id,old.resposta_a_xifrada,old.metadades,old.es_ia) THEN$old$;
  v_new constant text := $new$    IF old.versio_xifrat=1 AND (new.fil_id,new.id,new.usuari_id,new.versio_xifrat,new.text,new.tipus,new.com_org_id,new.resposta_a_xifrada,new.metadades,new.es_ia)
      IS DISTINCT FROM (old.fil_id,old.id,old.usuari_id,old.versio_xifrat,old.text,old.tipus,old.com_org_id,old.resposta_a_xifrada,old.metadades,old.es_ia)
      AND NOT (new.esborrat_al IS NOT NULL AND new.text IS NULL AND new.xifrat IS NULL AND new.metadades='{}'::jsonb
        AND (new.fil_id,new.id,new.usuari_id,new.versio_xifrat,new.tipus,new.com_org_id,new.resposta_a_xifrada,new.es_ia)
          IS NOT DISTINCT FROM (old.fil_id,old.id,old.usuari_id,old.versio_xifrat,old.tipus,old.com_org_id,old.resposta_a_xifrada,old.es_ia)) THEN$new$;
begin
  select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex'),pg_catalog.pg_get_functiondef(oid)
    into v_hash,v_definition from pg_catalog.pg_proc where oid=pg_catalog.to_regprocedure('private.xat_missatges_e2ee()')
      and prosecdef and prorettype='trigger'::regtype and proconfig @> array['search_path=""'];
  if v_hash='52436302704ec087a45a103c24d37bd458f5105089ebfe28d2c7b06d01c7c89f' then null;
  elsif v_hash='7ac6e5b80831a1f6838d2e28e4268944166e983b16ed18189059b612aab87ebb' and pg_catalog.array_length(pg_catalog.string_to_array(v_definition,v_old),1)=2 then
    execute pg_catalog.replace(v_definition,v_old,v_new);
  else raise exception 'SDP-R3264-001: trigger absent o divergent.' using errcode='55000'; end if;
  if pg_catalog.to_regprocedure('public.xat_elimina_per_a_tothom(uuid,uuid)') is not null then
    select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc,'UTF8')),'hex') into v_hash
      from pg_catalog.pg_proc where oid='public.xat_elimina_per_a_tothom(uuid,uuid)'::regprocedure
        and prosecdef and prorettype='jsonb'::regtype and provolatile='v'
        and proargnames=array['p_fil_id','p_missatge_id']::text[] and proconfig=array['search_path=""']::text[];
    if v_hash is distinct from 'c6f167f230667473eb13e5cd880be52ef4ad2cfaa9c93ffe56dbb7697f89b72d' then
      raise exception 'SDP-R3264-002: RPC divergent.' using errcode='55000';
    end if;
  end if;
end $guard$;
create index if not exists xat_push_cua_missatge_idx on private.xat_push_cua(missatge_id);
do $index_guard$
begin
  if not exists(select 1 from pg_catalog.pg_index i
    where i.indexrelid=pg_catalog.to_regclass('private.xat_push_cua_missatge_idx')
      and i.indrelid='private.xat_push_cua'::regclass and i.indisvalid and i.indisready
      and not i.indisunique and i.indpred is null and i.indexprs is null and i.indnatts=1
      and i.indkey::text=(select attnum::text from pg_catalog.pg_attribute
        where attrelid='private.xat_push_cua'::regclass and attname='missatge_id' and not attisdropped)) then
    raise exception 'SDP-R3264-003: índex divergent.' using errcode='55000';
  end if;
end $index_guard$;
create or replace function public.xat_elimina_per_a_tothom(p_fil_id uuid,p_missatge_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $rpc$
declare
  v_uid uuid := auth.uid();
  m public.xat_missatges%rowtype;
begin
  if v_uid is null or p_fil_id is null or p_missatge_id is null then
    raise exception 'SDP-XAT-064: acció no permesa.' using errcode='42501';
  end if;
  select * into m from public.xat_missatges
    where id=p_missatge_id and fil_id=p_fil_id for no key update;
  if not found then
    raise exception 'SDP-XAT-064: acció no permesa.' using errcode='42501';
  end if;
  if (coalesce(m.usuari_id=v_uid,false)
      or (m.com_org_id is not null and coalesce(private.can_manage_organization(m.com_org_id),false))
      or coalesce(private.es_admin_del_fil(p_fil_id),false)) is not true then
    raise exception 'SDP-XAT-064: acció no permesa.' using errcode='42501';
  end if;
  update public.xat_missatges set text=null,xifrat=null,metadades='{}'::jsonb,
    esborrat_al=coalesce(esborrat_al,now()),esborrat_per=coalesce(esborrat_per,v_uid)
    where id=m.id returning * into m;
  delete from public.xat_reaccions where missatge_id=m.id;
  delete from public.xat_missatges_destacats where missatge_id=m.id;
  delete from public.xat_missatges_fixats where missatge_id=m.id;
  -- Una notificació ja lliurada fora de PostgreSQL no es pot retirar ací.
  -- El preparador pren FOR UPDATE sobre estos parents abans de crear fills.
  perform q.id from private.xat_push_cua q where q.missatge_id=m.id order by q.id for update;
  delete from private.xat_push_lliuraments j using private.xat_push_cua q
    where j.cua_id=q.id and q.missatge_id=m.id;
  delete from private.xat_push_cua where missatge_id=m.id;
  return jsonb_build_object('missatgeId',m.id,'filId',m.fil_id,'reaccions','[]'::jsonb,
    'destacat',false,'fixat',false,'amagat',exists(select 1 from public.xat_missatges_amagats h where h.missatge_id=m.id and h.usuari_id=v_uid),
    'esborrat',true,'esborratAl',m.esborrat_al);
end
$rpc$;
revoke all on function public.xat_elimina_per_a_tothom(uuid,uuid) from public,anon,service_role;
grant execute on function public.xat_elimina_per_a_tothom(uuid,uuid) to authenticated;
commit;
