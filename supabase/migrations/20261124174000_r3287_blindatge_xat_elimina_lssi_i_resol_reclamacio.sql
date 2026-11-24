-- R32.87 · Blindatges P0 de Gemini 4 Neon (auditoria 261124_1654, §3, Peix 1). Fila 136. NO aplicada a Producció.
-- Additiva: no reescriu cap migració històrica. Reescriu en el lloc quatre funcions amb una substitució de text
-- única sobre pg_get_functiondef (CREATE OR REPLACE conserva OID, propietari i ACL):
--   1. public.xat_elimina_per_a_tothom: l'autoria personal només val amb com_org_id nul i participació vigent
--      (un membre expulsat o un ex-administrador revocat ja no esborra comunicats oficials);
--   2. public.publica_section_submission_beta_cas i public.revoca_publicacio_mur: refusen una fila que no és
--      'visible' o que té deleted_at (la prova LSSI de retirada_cautelar es conserva);
--   3. public.resol_reclamacio: coalesce(es_superadmin, false) (R7, ADMIN-NULL).
-- Depén de 2611122200, 20261122160000 (127), 20261122230000 (130) i 20261123233000 (133).
-- Cada funció ha d'estar intacta (fragment antic exactament una vegada) o ja blindada (fragment nou, cap antic);
-- qualsevol altra forma avorta amb 55000 i fa rollback. Reaplicar-la no canvia res.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_catalog.pg_advisory_xact_lock(3287,1);
do $r3287$
declare
  v_fns constant text[] := array[
    'public.xat_elimina_per_a_tothom(uuid,uuid)',
    'public.publica_section_submission_beta_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamp with time zone,uuid)',
    'public.revoca_publicacio_mur(uuid,uuid)',
    'public.resol_reclamacio(uuid,boolean)'];
  v_old constant text[] := array[
$o1$  if (coalesce(m.usuari_id=v_uid,false)
      or (m.com_org_id is not null$o1$,
$o2$  select * into s from public.section_submissions where id=p_id for update;
  org0:=$o2$,
$o3$s.tenant_id<>p_tenant_id
  or not exists(select 1 from auth.users u where u.id=auth.uid()) then$o3$,
$o4$  if not (select private.es_superadmin()) then$o4$];
  v_new constant text[] := array[
$n1$  if ((m.com_org_id is null and coalesce(m.usuari_id=v_uid,false)
        and coalesce(private.xat_participant_vigent(p_fil_id,v_uid),false))
      or (m.com_org_id is not null$n1$,
$n2$  select * into s from public.section_submissions where id=p_id for update;
  -- R32.87 · LSSI: una fila retirada cautelarment o esborrada és prova; ni l'autor la sobreescriu.
  if s.id is not null and (s.moderation_state is distinct from 'visible' or s.deleted_at is not null) then
    raise exception 'SDP-BETA-002: publicació retirada o en revisió.' using errcode='42501';
  end if;
  org0:=$n2$,
$n3$s.tenant_id<>p_tenant_id
  or s.moderation_state is distinct from 'visible' or s.deleted_at is not null
  or not exists(select 1 from auth.users u where u.id=auth.uid()) then$n3$,
$n4$  if not coalesce((select private.es_superadmin()),false) then$n4$];
  v_fn regprocedure;
  v_def text;
  v_parts int;
begin
  for i in 1..pg_catalog.array_length(v_fns,1) loop
    v_fn := pg_catalog.to_regprocedure(v_fns[i]);
    if v_fn is null or not exists(select 1 from pg_catalog.pg_proc p where p.oid=v_fn and p.prosecdef
        and p.proconfig=array['search_path=""']::text[]) then
      raise exception 'SDP-R3287-001: % absent o sense SECURITY DEFINER i search_path buit.', v_fns[i] using errcode='55000';
    end if;
    v_def := pg_catalog.pg_get_functiondef(v_fn);
    v_parts := pg_catalog.array_length(pg_catalog.string_to_array(v_def,v_old[i]),1);
    if v_parts=1 and pg_catalog.array_length(pg_catalog.string_to_array(v_def,v_new[i]),1)=2 then
      continue;
    elsif v_parts=2 and pg_catalog.strpos(v_def,v_new[i])=0 then
      execute pg_catalog.replace(v_def,v_old[i],v_new[i]);
    else
      raise exception 'SDP-R3287-002: % divergent.', v_fns[i] using errcode='55000';
    end if;
  end loop;
end $r3287$;
commit;
