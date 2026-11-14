-- ============================================================================
-- 20261114061000 · R24 · IDEA-260 (b) · P0-1 · Rebut d'entrega dels altres a
-- la llista de converses (✓ → ✓✓ gris sense dependre del ritme).
-- NO aplicada: R24, l'aplica el Mestre, mai un agent.
--
-- Què fa:
--   0 · Precondició (SDP-XAT-947): avorta neta si falta cap dependència.
--   1 · Crea private.xat_cursors_altres(fil, jo): el rebut i el llegit dels
--       ALTRES d'un fil amb el mateix conjunt humà que public.xat_ritme
--       (2611080432:88-91): fila visible, no eixida, participant vigent, no bot
--       i, als fils d'entitat, l'altre costat. Invocadora (la crida
--       xat_fils_meus, que ja és SECURITY DEFINER); cap rol de l'API la pot
--       executar.
--       Regla D-1 (integrador R24; decidida pel Mestre el 14-11-2026 a les
--       15:48, decisió D2 de l'Onada R24.2): el MÍNIM
--       dels destinataris vigents per a tothom, la mateixa semàntica que
--       public.xat_ritme (2611080432:75-76), perquè la llista i la bombolla
--       oberta diguen sempre el mateix (crítica de Codex XAT-02). En un directe
--       amb una entitat, el ✓✓ espera tots els gestors vigents. Si el Mestre
--       tria la semàntica de WhatsApp Business (n'hi ha prou amb un gestor),
--       cal canviar alhora este helper i xat_ritme a max(...).
--       Els bots lligats al fil es resolen UNA vegada per fil amb
--       private.xat_bots_del_fil(fil) (Gauntlet R24, G-sql-4), no per
--       participant: private.xat_ritme_es_bot és PL/pgSQL amb EXECUTE i, per
--       participant, feia la bústia ×3-4 més lenta als grups grans. Mateixa
--       condició: principal registrat i lligam d'aquest fil i poble (la fila
--       del participant ja la filtra el helper: visible, no eixida, vigent).
--   2 · Torna a crear public.xat_fils_meus copiant literalment la R21.9b
--       (20261113003000:178-268, l'última definició de Git; cap migració
--       posterior ni el kit R22 la redefinixen) amb dos canvis:
--       · llegit_pels_altres_fins_seq ix del helper (mateix conjunt humà que
--         el rebut: ara també deixa fora la IAIA i qui ha eixit del fil);
--       · columna nova AL FINAL: rebut_pels_altres_fins_seq bigint.
--       Mateixa signatura d'entrada, permisos explícits: EXECUTE només a
--       authenticated (mai anon ni PUBLIC).
-- El client tolera un servidor sense la columna: sense ella, la llista no
-- diu res de l'entrega (rebutsConeguts = false) i no falseja cap 0.
--
-- Depén de: 2611080432 (private.xat_ritme_es_bot, public.xat_marca_rebut) i
-- 20261113003000 (xat_fils_meus R21.9b, private.xat_participant_vigent i
-- private.xat_reconcilia_beta_testers). Si mai es reaplica 20261113003000,
-- cal tornar a aplicar esta (aquella torna a crear xat_fils_meus sense la
-- columna; la cascada la deriva verifica-migracions.mjs). Si en falta cap,
-- avorta neta abans de tocar res amb SDP-XAT-947 (55000), com SDP-XAT-941 a
-- 20261114060000: el cos PL/pgSQL de xat_fils_meus no es valida en CREATE
-- FUNCTION i, sense la precondició, la llista fallaria a cada crida (42883).
--
-- Abans (lectura):
-- select to_regprocedure('public.xat_marca_rebut(uuid,bigint)') is not null as te_rebut, to_regprocedure('private.xat_ritme_es_bot(uuid,uuid)') is not null as te_bot, coalesce((select 'canal_clau' = any(p.proargnames) from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.xat_fils_meus(uuid)')), false) as fils_r21_9b, coalesce((select 'rebut_pels_altres_fins_seq' = any(p.proargnames) from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.xat_fils_meus(uuid)')), false) as ja_te_rebut_altres;
-- (cert, cert, cert, fals)
-- Verificació posterior (lectura):
-- select coalesce((select 'rebut_pels_altres_fins_seq' = any(p.proargnames) from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.xat_fils_meus(uuid)')), false) as te_rebut_altres, has_function_privilege('anon', 'public.xat_fils_meus(uuid)', 'execute') as anon_fils, has_function_privilege('authenticated', 'public.xat_fils_meus(uuid)', 'execute') as auth_fils, has_function_privilege('authenticated', 'private.xat_cursors_altres(uuid,uuid)', 'execute') as auth_helper;
-- (cert, fals, cert, fals)
-- Com tornar enrere: tornar a aplicar, dins d'una transacció, el bloc
-- «drop function … xat_fils_meus» de 20261113003000 (línies 178-268) amb el
-- seu revoke i grant (621-622), «drop function if exists
-- private.xat_cursors_altres(uuid, uuid)» i «drop function if exists
-- private.xat_bots_del_fil(uuid)». El client continua funcionant.
-- Prova PostgreSQL 18.6: tests/xat-entrega-r24-postgres.test.mjs,
-- tests/xat-r24-entrega-precondicions-postgres.test.mjs (SDP-XAT-947) i
-- tests/xat-r24-entrega-bots-per-fil-postgres.test.mjs (paritat i bots).
-- ============================================================================
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Precondició: la cadena de 2611080432 i 20261113003000 ──────────────
do $$
begin
  if to_regprocedure('private.xat_reconcilia_beta_testers(uuid)') is null
     or to_regprocedure('private.xat_participant_vigent(uuid,uuid)') is null
     or to_regprocedure('private.xat_ritme_es_bot(uuid,uuid)') is null
     or to_regprocedure('public.xat_marca_rebut(uuid,bigint)') is null
     or not exists (select 1 from pg_catalog.pg_attribute a
                    where a.attrelid = 'public.xat_fils'::regclass
                      and a.attname = 'canal_clau' and not a.attisdropped) then
    raise exception 'SDP-XAT-947: cal 2611080432 (lliurament i ritme) i 20261113003000 (canal Beta, R21.9b) abans de 20261114061000.'
      using errcode = '55000';
  end if;
end $$;

-- ── 1 · Bots lligats al fil, una sola consulta per fil ─────────────────────
-- La condició de private.xat_ritme_es_bot (2611080432:24-37) sense la fila del
-- participant, que xat_cursors_altres ja filtra (visible, no eixida, vigent).
create or replace function private.xat_bots_del_fil(p_fil_id uuid)
returns uuid[] language plpgsql stable security definer set search_path = '' as $$
declare v_bots uuid[];
begin
  if to_regclass('private.xat_iaia_principals') is null or to_regclass('private.xat_iaia_binding') is null then
    return '{}'::uuid[];
  end if;
  execute 'select coalesce(array_agg(bp.bot_id), ''{}''::uuid[]) from private.xat_iaia_principals bp
    join private.xat_iaia_binding b on b.bot_id = bp.bot_id and b.fil_id = $1
    join public.xat_fils f on f.id = b.fil_id and f.tenant_id = b.tenant_id'
    into v_bots using p_fil_id;
  return coalesce(v_bots, '{}'::uuid[]);
end $$;
revoke all on function private.xat_bots_del_fil(uuid) from public, anon, authenticated, service_role;

-- ── 1b · Cursors dels altres: el conjunt humà de xat_ritme i la regla D-1 ──
create or replace function private.xat_cursors_altres(p_fil_id uuid, p_jo uuid)
returns table (rebut_altres bigint, llegit_altres bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(min(p.rebut_fins_seq), 0)::bigint,
    coalesce(min(p.llegit_fins_seq), 0)::bigint
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = p_jo
  -- «offset 0» impedix que el planificador aplane la subconsulta i torne a
  -- avaluar el helper per cada participant.
  cross join lateral (select private.xat_bots_del_fil(f.id) as bots offset 0) b
  left join public.xat_participants p on p.fil_id = f.id and p.usuari_id <> p_jo
    and p.visible_fins_seq is null and p.eixit_al is null
    and private.xat_participant_vigent(f.id, p.usuari_id)
    and p.usuari_id <> all (b.bots)
    and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)
  where f.id = p_fil_id
  group by f.id, f.org_id, f.interlocutor_id, jo.com_org_id;
$$;
revoke all on function private.xat_cursors_altres(uuid, uuid) from public, anon, authenticated, service_role;

-- ── 2 · xat_fils_meus: R21.9b literal + rebut_pels_altres_fins_seq al final ──
drop function if exists public.xat_fils_meus(uuid);
CREATE FUNCTION public.xat_fils_meus(p_tenant_id uuid)
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
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;
revoke all on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
