-- ============================================================================
-- 261008_1543 · Xat · Consentiment al directori i metadades buides
-- Auditoria adversarial del xat (261008_1355_auditoria_claude.md), dos dels
-- bloquejants que no necessiten cap decisió del Mestre:
--
--   B03 · Regressió RGPD. 2609261500_identitat_perfil_f1.sql filtrava el
--     directori del xat per consentiment («and pr.consentiment_rgpd_at is not
--     null»), i 2609272200_xat_entitats.sql i 2609291210_xat_cerca_accents.sql
--     el van perdre en reescriure membres_del_poble. Qui entra per OAuth sense
--     consentiment, o el retira (anota_consentiment el posa a null), tornava a
--     aparéixer amb nom i avatar per a tot el poble, i qualsevol li podia obrir
--     un missatge directe. Ara:
--       1. public.membres_del_poble: la de 2609291210 lletra a lletra, amb una
--          sola condició més a la branca de les persones. Les entitats no hi
--          canvien (no tenen consentiment personal).
--       2. public.crea_fil_directe: la de 2609272200 lletra a lletra, amb una
--          sola comprovació més per a l'altra PERSONA (no per a una entitat):
--          sense consentiment, SDP-XAT-016 («l'interlocutor no és disponible
--          al xat»). Només quan cal CREAR el directe (dins de «if v_fil is
--          null»): un directe que ja existix, obert abans d'esta migració o
--          abans que l'altra persona retirara el consentiment, es continua
--          retrobant, igual que xat_envia hi continua acceptant missatges.
--          Tancar o silenciar els directes existents quan algú retira el
--          consentiment és una decisió del Mestre (B03, amb B02), no d'esta
--          migració. Codi nou: 015 queda per a la protecció de menors (B02),
--          que l'auditoria proposa amb eixe número i decidix el Mestre.
--   B08 · xat_envia no limitava la mida de p_metadades: un veí podia inserir
--     2 MB per missatge (15 cada 5 s) que tothom descarregava. El client F0
--     no n'envia mai (XatContext.jsx: `metadades: {}`). Ara:
--       3. public.xat_envia: la de 2609272200 lletra a lletra, amb la mateixa
--          signatura, el mateix tipus de retorn i els mateixos permisos, però
--          la inserció posa sempre '{}'::jsonb i ignora p_metadades (la
--          validació de tipus de 2609272200 es conserva: un no-objecte
--          continua sent SDP-XAT-009). El CHECK de mida i la llista blanca de
--          claus queden per a F1.
--
-- No obri cap permís nou ni toca cap taula: les tres funcions es tornen a
-- crear amb «create or replace» (mateixa signatura i mateix retorn; la de
-- xat_envia, que 2609272200 creava amb drop + create, ja no canvia de forma) i
-- es tornen a donar els mateixos revoke i grant. Additiva i idempotent: es pot
-- tornar a executar. No es reescriu cap fil ni cap missatge existent.
--
-- Revisada i NO aplicada a cap base de dades: l'aplica el Mestre. Va després
-- de 2610081402 (i de 2609291210, l'última que definia membres_del_poble, i
-- de 2609272200, l'última que definia crea_fil_directe i xat_envia).
--
-- ABANS D'APLICAR-LA, una consulta de lectura al node (2609080300 ja ho
-- avisava en deixar el filtre desactivat): quants perfils no tenen
-- consentiment. Desapareixen tots del padró del xat i no se'ls pot obrir cap
-- directe nou.
--     select count(*) filter (where consentiment_rgpd_at is null) as sense,
--            count(*) as total
--     from public.profiles;
-- Si `sense` no és residual (pilots donats d'alta amb la clau de metadades
-- antiga 'rgpd' de 2609080000, altes sense la casella o per OAuth, que no en
-- porta, 2609261500), cal un pla de reconsentiment (estat_consentiment()
-- .cal_reconsentir) ABANS d'aplicar-la; si és residual, es pot aplicar.
-- La fixture tests/fixtures/xat-entitats/regression.sql crea perfils sense
-- consentiment_rgpd_at i obri un directe NOU amb un d'ells; amb esta
-- migració, eixe pas rep SDP-XAT-016 fins que la fixture els done
-- consentiment.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · B03 · El directori només mostra persones amb consentiment ───────────
-- La de 2609291210 amb una sola condició més: «and pr.consentiment_rgpd_at is
-- not null» a la branca de les persones.
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

-- ── 2 · B03 · Cap directe nou amb una persona sense consentiment ────────────
-- La de 2609272200 amb una sola comprovació més, dins de «if v_fil is null»
-- de la branca de les persones: després del bloqueig i de buscar el directe
-- existent, just abans de crear-ne un. El directe que ja existix es retroba
-- (vegeu la capçalera); la branca de les entitats no hi passa.
create or replace function public.crea_fil_directe(p_tenant_id uuid, p_altre_usuari uuid, p_titol text default null)
returns uuid language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
  v_fil uuid;
  v_org uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_altre_usuari is null or p_altre_usuari = v_jo then
    raise exception 'SDP-XAT-002: cal un altre interlocutor, distint de tu.' using errcode = '22023';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  select o.id into v_org from public.organizations o
  where o.id = p_altre_usuari and o.tenant_id = p_tenant_id
    and (o.visibility = 'public' or private.is_organization_member(o.id));
  if v_org is not null then
    if private.can_manage_organization(v_org) then
      raise exception 'SDP-XAT-002: ja representes aquesta entitat.' using errcode = '22023';
    end if;
    -- Mateixa clau en les dues crides concurrents; cada client té el seu fil.
    perform pg_advisory_xact_lock(hashtextextended('xat:org:' || p_tenant_id::text || ':' || v_org::text || ':' || v_jo::text, 0));
    select f.id into v_fil from public.xat_fils f
    where f.tenant_id = p_tenant_id and f.org_id = v_org and f.interlocutor_id = v_jo;
    if v_fil is null then
      insert into public.xat_fils (tenant_id, titol, creat_per, tipus, org_id, interlocutor_id)
      values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe', v_org, v_jo)
      returning id into v_fil;
      insert into public.xat_participants (fil_id, usuari_id) values (v_fil, v_jo);
      insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
      select v_fil, om.user_id, v_org, 'admin' from public.organization_memberships om
      where om.organization_id = v_org and om.tenant_id = p_tenant_id
        and om.role in ('owner', 'admin') and om.user_id <> v_jo
      on conflict (fil_id, usuari_id) do nothing;
    end if;
    return v_fil;
  end if;
  if not exists (select 1 from public.town_memberships tm
    join public.profiles pr on pr.id = tm.user_id and pr.baixa_demanada_at is null
    where tm.town_id = p_tenant_id and tm.user_id = p_altre_usuari) then
    raise exception 'SDP-XAT-004: l''interlocutor no és disponible en aquest poble.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:persona:' || p_tenant_id::text || ':' || least(v_jo, p_altre_usuari)::text || ':' || greatest(v_jo, p_altre_usuari)::text, 0));
  select f.id into v_fil from public.xat_fils f
  where f.tenant_id = p_tenant_id and f.tipus = 'directe'
    and f.org_id is null and f.interlocutor_id is null
    and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
    and private.es_participant(f.id)
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id
      and p.usuari_id = p_altre_usuari and p.visible_fins_seq is null)
  order by f.creat_al, f.id limit 1;
  if v_fil is null then
    if not exists (select 1 from public.profiles pr
      where pr.id = p_altre_usuari and pr.consentiment_rgpd_at is not null) then
      raise exception 'SDP-XAT-016: l''interlocutor no és disponible al xat.' using errcode = '42501';
    end if;
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus)
    values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe') returning id into v_fil;
    insert into public.xat_participants (fil_id, usuari_id)
    values (v_fil, v_jo), (v_fil, p_altre_usuari);
  end if;
  return v_fil;
end;
$$;
revoke execute on function public.crea_fil_directe(uuid, uuid, text) from public, anon;
grant execute on function public.crea_fil_directe(uuid, uuid, text) to authenticated;

-- ── 3 · B08 · xat_envia guarda sempre unes metadades buides ─────────────────
-- La de 2609272200 amb una sola cosa canviada: la inserció posa '{}'::jsonb
-- en lloc de p_metadades. L'autoria continua eixint del participant.
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

notify pgrst, 'reload schema';
commit;
