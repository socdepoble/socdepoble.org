-- R32.14 · Vista prèvia privada abans de carregar el fil al client.
-- Depén de: 20261117173000 i R24 20261114061000.
-- La data canònica és ultim_al (mapejada a ultimAl); text, data, autor i tipus
-- provenen de la mateixa darrera fila visible per auth.uid(). No canvia seq,
-- cursors, rebuts ni comptadors. No concedeix SELECT a la taula d'amagats.
-- CREATE OR REPLACE conserva OID/contracte i és idempotent.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $r3214_preview_preflight$
begin
 if pg_catalog.to_regclass('public.xat_missatges_amagats') is null
   or pg_catalog.to_regprocedure('public.xat_fils_meus(uuid)') is null then
  raise exception 'SDP-R3214-PREVIEW-DEPENDENCY' using errcode='55000';
 end if;
 if not exists(select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_fils_meus(uuid)')
   and p.prosecdef and p.provolatile='v' and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in (
    '1f2a329adf5b165c7941fa693615fe4211c6d85e4f0fbda6077f26f1691a97ac',
    '17a5b8b1beee4921a9e771f0fa16632803babc7b6a076d03e485759eae0ea4c4')) then
  raise exception 'SDP-R3214-DRIFT: xat_fils_meus' using errcode='55000';
 end if;
end $r3214_preview_preflight$;
CREATE OR REPLACE FUNCTION public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint, canal_clau text,
  rebut_pels_altres_fins_seq bigint
)
language plpgsql volatile security definer SET search_path = ''
as $$
#variable_conflict use_column
begin
  if (select auth.uid()) is null then
    raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode='42501';
  end if;
  -- R22 · Beta reconciliation is best effort only for the two expected
  -- configuration outcomes, which roll back just this block while the inbox
  -- keeps listing direct, own and existing threads:
  --   · 23514 raised as SDP-XAT-018 (incoherent channel, for example after
  --     rotating the institutional principal);
  --   · 55P03 lock_not_available (lock_timeout while another session holds
  --     the per-town lock); the next listing retries.
  -- R22 (ronda 3) · Each warning carries the real SQLSTATE (as its code and in
  -- the text) and only SDP-XAT-018 keeps that label. Any other error, also a
  -- 23514 from another check, 23505, 40001, 40P01 or a code bug, propagates
  -- with its own SQLSTATE. statement_timeout (57014) is never caught here.
  begin
    perform private.xat_reconcilia_beta_testers(p_tenant_id);
  exception
    when check_violation then
      if sqlerrm not like 'SDP-XAT-018:%' then raise; end if;
      raise warning using errcode = sqlstate,
        message = format('SDP-XAT-018: reconciliació del canal Beta omesa (SQLSTATE %s).', sqlstate);
    when lock_not_available then
      raise warning using errcode = sqlstate,
        message = format('Canal Beta: reconciliació ajornada, pany per poble ocupat (SQLSTATE %s).', sqlstate);
  end;
  insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
  select f.id, om.user_id, f.org_id, 'admin' from public.xat_fils f
  join public.organization_memberships om on om.organization_id = f.org_id and om.tenant_id = f.tenant_id
  where f.tenant_id = p_tenant_id and f.interlocutor_id is not null
    and f.interlocutor_id <> (select auth.uid())
    and om.user_id = (select auth.uid()) and om.role in ('owner', 'admin')
  on conflict (fil_id, usuari_id) do nothing;

  return query select f.id, f.tipus, f.titol,
    coalesce(f.imatge_url, costat.dades -> 0 ->> 'avatarUrl'), f.actualitzat_al,
    coalesce(costat.noms, array[]::text[]), u.text, u.creat_al, u.usuari_id,
    f.ultim_seq, jo.llegit_fins_seq, jo.rebut_fins_seq,
    -- R24 · Abans, el mínim de tots els altres vigents (també la IAIA i qui ha
    -- eixit); ara el del helper, el mateix conjunt que el rebut (D-1).
    coalesce(ca.llegit_altres, 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null),
    u.tipus, f.epoca_actual, f.cap_epoca_hash, f.e2ee_des_de_seq, f.canal_clau,
    -- R24 · Columna nova, al final: el rebut d'entrega dels altres (✓✓ gris).
    coalesce(ca.rebut_altres, 0)
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
  left join lateral private.xat_cursors_altres(f.id, (select auth.uid())) ca on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'tipus', c.tipus,
      'avatarUrl', c.avatar_url, 'slug', c.slug) order by c.nom) as dades,
      array_agg(c.nom order by c.nom) as noms
    from (
      select o.id, o.name as nom, 'entitat'::text as tipus, o.logo_url as avatar_url, o.slug
      where o.id is not null and jo.com_org_id is null
      union all
      select pr.id, coalesce(pr.full_name, 'Veí'), 'persona'::text, pr.avatar_url, null::text
      from public.xat_participants p join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id and (p.usuari_id <> (select auth.uid()) or f.propi_usuari_id = (select auth.uid()))
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
      and m.esborrat_al is null
      and not exists (select 1 from public.xat_missatges_amagats a
        where a.usuari_id = (select auth.uid()) and a.missatge_id = m.id)
    order by m.seq desc, m.id desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;
revoke all on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
