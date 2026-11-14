-- ============================================================================
-- 20261114000100 · R22.2 · Reconciliació de la deriva de producció (Onada R22,
-- receptari de l'Eix B del dossier de Fable 5.2, apartat 2). NO aplicada: la
-- revisa i l'aplica el Mestre, mai un agent.
--
-- Què fa (arrels R02, R11, R03, R05, R12, R13 i R14 del receptari):
--   R02 · Retira el disparador fòssil sdp_protegeix_propietari, la seua funció
--     i l'índex únic idx_organization_memberships_one_owner, residus de l'antic
--     supabase/schema.sql que cap migració crea. Torna organizations.created_by
--     a la forma de Git (nul·lable, clau forana ON DELETE SET NULL). Amb açò
--     tornen a funcionar marca_titular_public, transfereix_propietat_organitzacio,
--     l'esborrat d'organitzacions i la purga d'una propietària. L'invariant
--     «una sola propietària» el continua guardant el disparador diferit
--     sdp_una_propietaria de Git (23514).
--   R11 · Revoca i després esborra public.delete_user(), feta a mà a
--     producció i sense cap cridador: deixava saltar-se tota la baixa. Va en la
--     mateixa transacció que R02: llevat el RESTRICT de created_by, una
--     propietària es podria esborrar el compte a l'instant amb eixa funció.
--   R03 · public.xat_envia amb el cos de 2610081543_xat_consentiment_i_metadades.sql
--     línies 195-262, copiades LLETRA A LLETRA amb el seu revoke i el seu grant
--     (md5(prosrc) esperat 2ab3cc315219aaac4a0aa83b0f9768be). MAI el fitxer
--     sencer: les línies 121-190 redefinixen crea_fil_directe i desfarien el fil
--     propi de 2611121630 (md5 354f4120d203494efe099e7d89852c3f, que no canvia).
--     Més el CHECK xat_missatges_metadades_mida (16384 bytes): s'afig NOT VALID
--     i només es valida si cap fila el viola; si n'hi ha, avisa i el deixa NOT
--     VALID (s'aplica a tot el que s'escriga de nou). 16384 i no 4096: les
--     metadades legítimes fan uns 100 bytes, el client envia sempre {} i
--     xat_envia ja hi posa '{}'; 16384 deixa marge als adjunts i a la IAIA.
--     I, opcional segons el dossier, public.membres_del_poble de 2610081543
--     línies 71-114 (md5 esperat 2bab4bf5bd8c3fd278c61f2dd6882bb3): és
--     l'última de Git i torna a amagar del directori del xat qui no té
--     consentiment; sense ella, qui el revoca (ara que R05 ho permet) hi
--     continuaria.
--   R05 · Etapa A del consentiment: profiles.consentiment_rgpd_at torna a ser
--     nul·lable (revoca_consentiment('rgpd_acepta') fallava amb 23502). El
--     DEFAULT now() es queda: llevar-lo (etapa B) espera la porta de
--     reconsentiment del client, i l'etapa C és decisió del Mestre.
--   R12 · admin_list_organizations() i admin_list_users(integer,integer) amb
--     el cos de l'última definició de Git (2609121600 i 2609150000), amb els
--     mateixos revoke i grant. La de producció llegia public.entitats (42P01) i
--     tornava jsonb: es fa drop abans perquè canvia el tipus de retorn. Efecte
--     visible només per al superadmin: la llista d'usuaris torna a l'ordre de
--     Git (alta més recent primer) i ja no porta nom, origen ni dispositiu, que
--     cap pantalla llig. private.es_superadmin NO es toca (2610061448 és
--     reservada al Mestre).
--   R13 · TRUNCATE, REFERENCES, TRIGGER i MAINTAIN fora per a anon i
--     authenticated a totes les taules de public (la RLS no els cobrix);
--     privilegis per defecte: cap funció nova naix executable per anon ni per
--     PUBLIC, i cap taula nova naix amb eixos quatre privilegis per a anon i
--     authenticated. EXECUTE fora per a PUBLIC i anon NOMÉS en les 16 funcions
--     heretades que només són a producció, sense cap cridador al repositori ni
--     cap ús en polítiques (q14) ni en disparadors (q17); si no existixen (Git),
--     no es fa res.
--   R14 · La CHECK section_submissions_autoria_org_valida (depén d'auth.uid())
--     passa a ser el disparador zz_sdp_autoria_org_valida. Mateixa regla, mateix
--     codi (23514) i mateix nom de restricció a l'error, però només per a les
--     peticions de l'API que no són service_role: l'editor SQL, les migracions,
--     el planificador i el servidor ja poden mantindre una publicació signada
--     per una entitat. NO es fa la variant «només quan la signatura canvia»:
--     tornaria a obrir la frontera que tests/uuid-editorial-authorship-boundary-r19
--     tanca (un UPDATE SECURITY DEFINER d'una fila signada, amb el JWT d'algú
--     que no administra l'entitat, ha de fallar amb 23514). I les columnes
--     icon i publish_date de notes, que el client ja escriu i que cap
--     migració creava (exporta_les_meues_dades fa to_jsonb(n): ja hi entren).
--
-- Què NO fa (pendent i anotat a l'informe):
--   R06 · «revoke update (town_name) on public.profiles from authenticated» NO
--     s'aplica: Perfil › Poble escriu town_name directament a la taula
--     (src/data/supabase/auth.js, updateProfile, PATCH /rest/v1/profiles).
--     Revocar-lo trencaria eixe selector. handle_new_user és decisió del Mestre.
--   R04 (2610081400 sencera) i 2610061450 són fitxers ja existents: van en
--   l'ordre del Runbook (README). 2610081543 sencera NO s'ha d'aplicar mai.
--
-- Ordre d'aplicació (Runbook del Mestre, apartat 2.0): primer la còpia de
-- seguretat (R01) i la feina del Dashboard; esta migració va abans que la
-- 2610081400 sencera i que les tres R22 següents (sostres, purga i buckets).
-- Depén de 2609121600, 2609150000, 2610081543, 2611011500, 2611121630 i
-- 20261113112500.
--
-- Precondicions: cap. Totes les sentències són repetibles i toleren tant la
-- forma de producció (amb els residus) com la de Git (sense). Transaccional:
-- si una falla, no queda res a mitges. lock_timeout de 5 s: amb el Mas en ús,
-- si no aconseguix els panys, avorta neta i es torna a provar.
--
-- Avisos: (1) en local postgres és superusuari i a Supabase no; les proves
-- (tests/r22-2-reconciliacio-deriva-produccio-postgres.test.mjs) l'apliquen
-- també com a rol sense superusuari propietari dels objectes. (2) Tornar a
-- aplicar 2611122200 després d'esta migració avorta neta amb
-- SDP-MUR-DEPENDENCY si queden publicacions compartides per migrar, perquè
-- la CHECK ja no hi és: el remei és no tornar-la a aplicar (ja ho està).
--
-- Com tornar enrere (dins d'una transacció, només si cal):
--   R02 · create unique index idx_organization_memberships_one_owner on
--     public.organization_memberships (organization_id) where role = 'owner';
--     (el disparador fòssil NO s'ha de tornar a crear: trencava la propietat).
--   R11 · no es recrea: ningú la crida.
--   R03 · alter table public.xat_missatges drop constraint if exists
--     xat_missatges_metadades_mida; (el cos de xat_envia és el de Git).
--   R05 · cap marxa enrere (tornar NOT NULL tornaria a trencar la revocació).
--   R12 · els cossos són els de Git; el de producció depenia d'una taula
--     inexistent.
--   R13 · grant truncate, references, trigger, maintain on all tables in
--     schema public to anon, authenticated; i alter default privileges for role
--     postgres grant execute on functions to public; (no recomanat).
--   R14 · drop trigger if exists zz_sdp_autoria_org_valida on
--     public.section_submissions; alter table public.section_submissions add
--     constraint section_submissions_autoria_org_valida check
--     (public.pot_signar_com_organitzacio(author_org_id, tenant_id)) not valid;
--
-- Abans (lectura):
-- select count(*) as disparador_fossil from pg_catalog.pg_trigger t where t.tgname = 'sdp_protegeix_propietari' and not t.tgisinternal;
-- select char_length(p.prosrc) as xat_envia_llargaria, position('''{}''::jsonb, false)' in p.prosrc) > 0 as metadades_buides from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.xat_envia(uuid,uuid,text,text,uuid,jsonb)');
-- select coalesce(max(octet_length(m.metadades::text)), 0) as metadades_max_bytes from public.xat_missatges m;
-- Verificació posterior (lectura):
-- select to_regprocedure('public.delete_user()') is null as sense_delete_user, to_regprocedure('public.sdp_protegeix_propietari()') is null as sense_fossil;
-- select char_length(p.prosrc) as xat_envia_llargaria, position('''{}''::jsonb, false)' in p.prosrc) > 0 as metadades_buides from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.xat_envia(uuid,uuid,text,text,uuid,jsonb)');
-- select c.conname, c.convalidated from pg_catalog.pg_constraint c where c.conname in ('xat_missatges_metadades_mida', 'section_submissions_autoria_org_valida', 'organizations_created_by_fkey');
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- R02 · Desbloqueig de la propietat (ronda E del contrast de funcions-auth-m-z-1)
-- ---------------------------------------------------------------------------
drop trigger if exists sdp_protegeix_propietari on public.organization_memberships;
drop function if exists public.sdp_protegeix_propietari();
drop index if exists public.idx_organization_memberships_one_owner;
alter table public.organizations alter column created_by drop not null;
alter table public.organizations drop constraint if exists organizations_created_by_fkey;
alter table public.organizations add constraint organizations_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- R11 · delete_user(): primer el revoke (en la mateixa transacció), després fora.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.delete_user()') is not null then
    execute 'revoke execute on function public.delete_user() from public, anon, authenticated';
  end if;
end $$;
drop function if exists public.delete_user();

-- ---------------------------------------------------------------------------
-- R03 · 2610081543_xat_consentiment_i_metadades.sql:195-262, lletra a lletra.
-- ---------------------------------------------------------------------------
create or replace function public.xat_envia(p_id uuid, p_fil_id uuid, p_tipus text default 'text',
  p_text text default null, p_resposta_a uuid default null, p_metadades jsonb default '{}'::jsonb)
returns table (id uuid, seq bigint, creat_al timestamptz, usuari_id uuid, com_org_id uuid, autor_nom text)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
  v_org uuid;
  v_m public.xat_missatges%rowtype;
  v_text text := btrim(p_text);
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_id is null or p_fil_id is null or jsonb_typeof(coalesce(p_metadades, '{}'::jsonb)) <> 'object' then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if coalesce(nullif(btrim(p_tipus), ''), 'text') <> 'text' then
    raise exception 'SDP-XAT-010: tipus de missatge no admés des del client.' using errcode = '22023';
  end if;
  if v_text is null or v_text = '' or char_length(v_text) > 4096 then
    raise exception 'SDP-XAT-007: missatge buit o massa llarg.' using errcode = '22023';
  end if;
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;
  select p.com_org_id into v_org from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  if v_org is not null then
    -- La revocació no pot intercalar-se entre l'autorització i l'enviament.
    perform 1 from public.organization_memberships om where om.organization_id = v_org
      and om.user_id = v_jo and om.role in ('owner', 'admin') for share;
    if not found then
      raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
    end if;
  end if;
  -- Serialitza també reintents concurrents: no consumixen seq ni el límit de freqüència.
  perform pg_advisory_xact_lock(hashtextextended('xat:missatge:' || p_id::text, 0));
  select m.* into v_m from public.xat_missatges m where m.id = p_id;
  if found then
    if v_m.usuari_id is distinct from v_jo or v_m.fil_id is distinct from p_fil_id then
      raise exception 'SDP-XAT-008: identificador d''un altre enviament.' using errcode = '42501';
    end if;
  else
    -- Una cita s'autoritza en crear el missatge. Un reintent ja acceptat
    -- continua sent idempotent si després la cita caduca o es buida.
    if p_resposta_a is not null and not exists (select 1 from public.xat_missatges m
      where m.id = p_resposta_a and m.fil_id = p_fil_id and private.seq_visible(m.fil_id, m.seq)
        and (m.caduca_al is null or m.caduca_al > now())) then
      raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
    end if;
    insert into public.xat_missatges (id, fil_id, usuari_id, com_org_id, text, tipus, resposta_a, metadades, es_ia)
    values (p_id, p_fil_id, v_jo, v_org, v_text, 'text', p_resposta_a,
      '{}'::jsonb, false)
    returning * into v_m;
  end if;
  update public.xat_participants p set llegit_fins_seq = greatest(p.llegit_fins_seq, v_m.seq),
    rebut_fins_seq = greatest(p.rebut_fins_seq, v_m.seq)
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  return query select v_m.id, v_m.seq, v_m.creat_al, v_m.usuari_id, v_m.com_org_id,
    coalesce(o.name, pr.full_name, 'Veí')::text
  from public.profiles pr left join public.organizations o on o.id = v_m.com_org_id
  where pr.id = v_jo;
end;
$$;
revoke execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) from public, anon;
grant execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) to authenticated;

-- R03 · Cinturó a la taula: NOT VALID i validació només si cap fila el viola.
alter table public.xat_missatges drop constraint if exists xat_missatges_metadades_mida;
alter table public.xat_missatges add constraint xat_missatges_metadades_mida
  check (octet_length(metadades::text) <= 16384) not valid;
do $$
declare v_violacions bigint;
begin
  select count(*) into v_violacions from public.xat_missatges m where octet_length(m.metadades::text) > 16384;
  if v_violacions = 0 then
    alter table public.xat_missatges validate constraint xat_missatges_metadades_mida;
  else
    raise notice 'R22.2 · xat_missatges_metadades_mida queda NOT VALID: % files passen de 16384 bytes de metadades.', v_violacions;
  end if;
end $$;

-- R03 (opcional del dossier, en la mateixa sessió) · 2610081543:71-114, lletra
-- a lletra: el directori del xat torna a amagar qui no té consentiment. Amb
-- l'etapa A de R05 la revocació torna a funcionar, i sense este filtre qui la
-- retira continuaria al padró del xat. Hui no amaga ningú (DEFAULT now()).
create or replace function public.membres_del_poble(p_tenant_id uuid, p_cerca text default null, p_limit integer default 100)
returns table (usuari_id uuid, nom text, fil_id uuid, tipus text, avatar_url text)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  return query
  select d.id, d.nom, d.fil_id, d.tipus, d.avatar_url from (
    select pr.id, coalesce(pr.full_name, 'Veí') as nom, 'persona'::text as tipus, pr.avatar_url,
      (select f.id from public.xat_fils f
       where f.tenant_id = p_tenant_id and f.tipus = 'directe'
         and f.org_id is null and f.interlocutor_id is null
         and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
         and private.es_participant(f.id)
         and exists (select 1 from public.xat_participants p where p.fil_id = f.id
           and p.usuari_id = pr.id and p.visible_fins_seq is null)
       order by f.creat_al, f.id limit 1) as fil_id
    from public.town_memberships tm join public.profiles pr on pr.id = tm.user_id
    where tm.town_id = p_tenant_id and pr.id <> v_jo and pr.baixa_demanada_at is null
      and pr.consentiment_rgpd_at is not null
    union all
    select o.id, o.name, 'entitat'::text, o.logo_url,
      (select f.id from public.xat_fils f where f.tenant_id = p_tenant_id
        and f.org_id = o.id and f.interlocutor_id = v_jo and private.es_participant(f.id)
       order by f.creat_al, f.id limit 1)
    from public.organizations o
    where o.tenant_id = p_tenant_id
      and (o.visibility = 'public' or private.is_organization_member(o.id))
      and not private.can_manage_organization(o.id)
  ) d
  where nullif(btrim(p_cerca), '') is null or not exists (select 1 from regexp_split_to_table(private.xat_plega_cerca(btrim(p_cerca)), '\s+') mot
    where strpos(private.xat_plega_cerca(d.nom), mot) = 0)
  order by d.nom, d.id limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- R05 · Etapa A: només drop not null (el DEFAULT now() es queda fins a l'etapa B).
-- ---------------------------------------------------------------------------
alter table public.profiles alter column consentiment_rgpd_at drop not null;

-- ---------------------------------------------------------------------------
-- R12 · admin_list_organizations(): cos de 2609121600 (drop: canvia el retorn).
-- ---------------------------------------------------------------------------
drop function if exists public.admin_list_organizations();
CREATE OR REPLACE FUNCTION public.admin_list_organizations()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE((SELECT private.es_superadmin()), FALSE) THEN
    RAISE EXCEPTION 'SDP-ADMIN-002: cal rol de superadmin.' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'kind', o.kind,
        'description', o.description,
        'created_at', o.created_at
      )
    ), '[]'::json)
    FROM public.organizations o
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_organizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_organizations() TO authenticated;

-- R12 · admin_list_users(integer, integer): cos de 2609150000 (mateix retorn).
create or replace function public.admin_list_users(
  p_limit  integer default 100,
  p_offset integer default 0
)
returns json
language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-001: cal rol de superadmin.' using errcode = '42501';
  end if;
  return (
    select coalesce(json_agg(t), '[]'::json) from (
      select u.id, u.email, u.created_at, u.last_sign_in_at
      from auth.users u
      order by u.created_at desc
      limit greatest(1, least(coalesce(p_limit, 100), 500))
      offset greatest(0, coalesce(p_offset, 0))
    ) t
  );
end;
$$;

revoke execute on function public.admin_list_users(integer, integer) from public, anon;
grant execute on function public.admin_list_users(integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- R13 · Privilegis que la RLS no cobrix, i valors per defecte.
-- ---------------------------------------------------------------------------
revoke truncate, references, trigger, maintain on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;
-- Per a anon, el permís per defecte és per esquema (Supabase el dona a public).
alter default privileges for role postgres in schema public revoke execute on functions from anon;
-- Per a PUBLIC, PostgreSQL el dona globalment: un REVOKE per esquema no el lleva
-- (la prova ho demostra). Cal la forma global, que també cobrix private.
alter default privileges for role postgres revoke execute on functions from public;

-- R13 · Les 16 funcions heretades (només a producció), sense cridador ni ús.
do $$
declare v_sig text;
begin
  foreach v_sig in array array[
    'public.sanitize_posts_content_trigger()', 'public.sanitize_html(text)',
    'public.clean_expired_push_subscriptions()', 'public.log_push_notification(uuid,text,jsonb,boolean,text)',
    'public.mark_messages_as_read(uuid,uuid)', 'public.check_market_rate_limit()',
    'public.check_post_rate_limit()', 'public.fn_market_items_null_safety()',
    'public.generate_post_slug()', 'public.handle_updated_at()',
    'public.omega_invalidate_stale_translations()', 'public.omega_set_default_parent_id()',
    'public.refresh_entity_member_map()', 'public.update_cms_pages_modtime()',
    'public.update_connections_count()', 'public.update_lexicon_updated_at_column()'
  ] loop
    if to_regprocedure(v_sig) is not null then
      execute format('revoke execute on function %s from public, anon', to_regprocedure(v_sig));
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- R14 · Autoria per entitat: de CHECK a disparador (mateixa regla per a l'API).
-- ---------------------------------------------------------------------------
-- Cert només per a l'editor SQL, les migracions i el planificador (cap claim i
-- cap auth.uid()) i per a service_role. Una petició anònima no hi entra.
create or replace function private.peticio_de_servidor()
returns boolean language sql stable set search_path = ''
as $$
  select case
    when coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role' then true
    when (select auth.uid()) is null
     and coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') is null then true
    else false
  end;
$$;
revoke all on function private.peticio_de_servidor() from public, anon, authenticated, service_role;

create or replace function private.section_submissions_autoria_org_valida()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.author_org_id is null or private.peticio_de_servidor() then
    return new;
  end if;
  if not coalesce(public.pot_signar_com_organitzacio(new.author_org_id, new.tenant_id), false) then
    raise exception using errcode = '23514', constraint = 'section_submissions_autoria_org_valida',
      table = 'section_submissions', schema = 'public',
      message = 'new row for relation "section_submissions" violates check constraint "section_submissions_autoria_org_valida"';
  end if;
  return new;
end;
$$;
revoke all on function private.section_submissions_autoria_org_valida() from public, anon, authenticated, service_role;
-- «zz_»: l'últim BEFORE per ordre de nom, com la CHECK, que mira la fila final.
drop trigger if exists zz_sdp_autoria_org_valida on public.section_submissions;
create trigger zz_sdp_autoria_org_valida
  before insert or update on public.section_submissions
  for each row execute function private.section_submissions_autoria_org_valida();
alter table public.section_submissions drop constraint if exists section_submissions_autoria_org_valida;

-- R14 · notes.icon i notes.publish_date (A-dades-port-r1-2).
alter table public.notes add column if not exists icon text, add column if not exists publish_date timestamptz;

notify pgrst, 'reload schema';
commit;
