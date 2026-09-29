-- ============================================================================
-- 260928_2100 · T63.2 i T67 · El xat comú de les Pàgines Universals
-- Contracte del Xat §1-§6 (onada 2, 260928). Cada grup o comunitat naix d'una
-- Pàgina Universal: el subjecte la nomena.
--
-- Revisada i NO aplicada a cap base de dades. Depén de dos migracions que
-- TAMPOC no estan aplicades: 2609270200_xat_f0_fonament.sql (F0: tipus
-- 'grup', 'comunitat' i 'canal', comunitat_id, org_id, rol, finestra per seq)
-- i 2609272200_xat_entitats.sql (xat_participant_vigent, xat_envia i la v3 de
-- xat_fils_meus, que ací es torna a fer). S'aplica DESPRÉS de les dos i de
-- 2609282035, i ABANS de publicar un client que declare la capacitat
-- 'xatDePagina'. Sense ella, obri_fil_de_pagina no existix (PGRST202) i el
-- client ho diu amb un avís honest ('sense-capacitat'). Additiva i
-- idempotent: es pot tornar a executar.
--
--   1. xat_fils: subjecte_tipus, subjecte_id (text, sense clau forana: els
--      subjectes són heterogenis), subjecte_ruta, subjecte_titol i
--      subjecte_uri, la URI canònica absoluta del node per al Fedivers (només
--      si private.ajustos té 'url_publica_node', que no s'hi posa ací).
--   2. CHECK de llista blanca (cap nota ni res privat) i de coherència;
--      índex únic parcial (tenant_id, subjecte_tipus, subjecte_id, tipus): la
--      comunitat, els seus Avisos i el seu General comparteixen subjecte.
--   3. private.xat_subjecte: el subjecte existix i qui el demana el pot vore
--      (organitzacions 'members', només els seus membres; cap nota; una
--      'pagina', només de la llista tancada de PAGINES_AMB_XAT de
--      src/data/contracte.js). Torna la clau canònica, el títol, l'entitat i
--      la ruta, totes del servidor: la ruta del client no es guarda mai.
--   4. obri_fil_de_pagina: troba o crea (comunitat + Avisos + General, o
--      grup) i NO fa participant a qui l'obri. Els gestors vigents de
--      l'entitat entren a la comunitat i als Avisos, on signen com ella.
--      Obrir no deixa rastre: creat_per queda null. Un fil que ja existia
--      pren la URI i el títol del subjecte d'ara.
--   5. xat_llig_fil_de_pagina: llegir un fil de pàgina sense ser-ne
--      participant. Llegir no et publica, i l'autor d'un missatge signat per
--      l'entitat no s'hi veu.
--   6. xat_entra_al_fil_de_pagina: l'alta, idempotent, en escriure el primer
--      missatge; en un General, també a la comunitat i als Avisos.
--   7. Disparador xat_missatges_canal: la comunitat no té missatges propis i
--      als Avisos només hi escriuen els administradors.
--   8. private.xat_participant_vigent (2609272200 + una condició): en el fil
--      d'una entitat o d'un grup, qui ja hi participa perd l'accés si
--      l'organització deixa de ser visible per a ell ('members' i no n'és).
--   9. private.xat_pot_veure_participant (2609272200 + una condició): en un
--      fil de pàgina cada participant només veu la seua fila de
--      xat_participants, ni les persones ni els seus ajustos.
--  10. xat_fils_meus v4 (drop + create, patró de 2609272200): afig
--      comunitat_id, subjecte_*, rol i participants. Un fil de pàgina no
--      llista les persones que hi participen: només quantes n'hi ha.
--  11. private.purga_una_baixa (2609261500 + una condició): la neteja de fils
--      sense ningú no esborra els fils de pàgina, que naixen sense creador i
--      sense participants. Si no, qualsevol baixa canviaria els seus ids.
--
-- Les redefinicions 8, 9 i 11 són còpies literals de la darrera versió més
-- una sola condició; tests/migracio-xat-de-pagina.test.mjs ho comprova.
--
-- Codis nous (cap text de missatge als errors):
--   SDP-XAT-011  només escriuen els administradors (canal o comunitat)
--   SDP-XAT-012  este subjecte no té xat (tipus o clau invàlids)
--   SDP-XAT-013  la pàgina no existix o no la pots vore
--
-- MODERACIÓ: NO N'HI HA. Cap RPC amaga missatges d'altri, expulsa, silencia
-- ni tanca un fil, i no hi ha cap denúncia. L'únic fre és el límit de
-- freqüència (trg_rate_limit_xat). És una condició prèvia, no un deute
-- opcional: ABANS D'OBRIR ELS FILS DE PÀGINA A TOT EL POBLE cal un mínim
-- (amagar, expulsar, tancar i denunciar, sempre per RPC, per a l'autor de la
-- pàgina o els administradors de l'entitat). Tampoc no hi ha «eixir del fil»
-- (visible_fins_seq no l'escriu ningú) ni administració dels Avisos d'un
-- poble: sense cap administrador, són de només lectura.
--
-- DEUTES DECLARATS:
--   · Qui ja participa en un fil de pàgina el continua llegint si s'esborra
--     el contingut (una publicació, un producte…): només l'organització es
--     torna a comprovar (8). Qui no hi ha escrit rep SDP-XAT-013 en obrir-lo.
--   · xat_historial, xat_nous i la lectura directa de xat_missatges (RLS de
--     F0) continuen tornant usuari_id dels missatges signats per l'entitat,
--     com als fils d'entitat des de 2609272200: qui participa en uns Avisos
--     veu l'identificador de qui els escriu. Només la lectura de visitant (5)
--     l'amaga.
--   · El títol del fil (titol) es fixa en crear-lo; el del subjecte
--     (subjecte_titol) es refresca en obrir-lo.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';


-- ── 1 · Columnes del subjecte ────────────────────────────────────────────────
alter table public.xat_fils
  add column if not exists subjecte_tipus text;
alter table public.xat_fils
  add column if not exists subjecte_id text;
alter table public.xat_fils
  add column if not exists subjecte_ruta text;
alter table public.xat_fils
  add column if not exists subjecte_titol text;
alter table public.xat_fils
  add column if not exists subjecte_uri text;


-- ── 2 · Llista blanca, coherència i unicitat ─────────────────────────────────
-- Es tornen a crear senceres a cada execució: una segona passada deixa les
-- mateixes restriccions, amb el mateix nom. 'organitzacio' no hi és: el
-- client i la RPC la guarden com a 'entitat'. La clau d'una organització és
-- el seu uuid: xat_participant_vigent la llig com a tal.
alter table public.xat_fils
  drop constraint if exists xat_fils_subjecte_tipus_valid;
alter table public.xat_fils
  add constraint xat_fils_subjecte_tipus_valid check (subjecte_tipus in
    ('entitat', 'poble', 'publicacio', 'producte', 'esdeveniment', 'multimedia', 'grup', 'pagina'));

alter table public.xat_fils
  drop constraint if exists xat_fils_subjecte_coherent;
alter table public.xat_fils
  add constraint xat_fils_subjecte_coherent check (
    (subjecte_tipus is null) = (subjecte_id is null)
    and (subjecte_tipus is null or tipus in ('comunitat', 'canal', 'grup'))
    and (subjecte_tipus is null or tipus = 'grup' or subjecte_tipus in ('entitat', 'poble'))
    and (subjecte_id is null or char_length(subjecte_id) between 1 and 200)
    and (subjecte_tipus is null or subjecte_tipus not in ('entitat', 'grup')
      or subjecte_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    and (subjecte_ruta is null or (char_length(subjecte_ruta) <= 300
      and subjecte_ruta like '/%' and subjecte_ruta not like '//%'))
    and (subjecte_titol is null or char_length(subjecte_titol) <= 200)
    and (subjecte_uri is null or (char_length(subjecte_uri) <= 600 and subjecte_uri like 'https://%'))
  );

create unique index if not exists xat_fils_subjecte_uq
  on public.xat_fils (tenant_id, subjecte_tipus, subjecte_id, tipus)
  where subjecte_tipus is not null;
create index if not exists xat_fils_comunitat_idx
  on public.xat_fils (comunitat_id)
  where comunitat_id is not null;


-- ── 3 · El subjecte existix i el pots vore ───────────────────────────────────
-- Cap RPC: només la criden les funcions d'esta migració. Una organització
-- 'members' només la veuen els seus membres; una publicació, dins del seu
-- poble i mai de la secció 'notes'; una pàgina, només si és de la llista
-- tancada (el servidor no sap quines rutes existixen a l'SPA ni si són
-- públiques). La ruta es deriva ací, amb el format de rutaDePerfil i
-- getSectionItemPath (rutaDeSubjecte de src/data/contracte.js); una clau que
-- caldria codificar es queda sense ruta. Sense cap fila: no existix o no la
-- pots vore. La versió sense publicar d'este fitxer tenia p_ruta: fora.
drop function if exists private.xat_subjecte(uuid, text, text, text);
create or replace function private.xat_subjecte(p_tenant_id uuid, p_tipus text, p_id text)
returns table (clau text, titol text, org_id uuid, ruta text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_clau  text;
  v_titol text;
  v_org   uuid;
  v_tram  text;
begin
  if p_tipus in ('entitat', 'grup') then
    select o.id::text, o.name::text, o.id into v_clau, v_titol, v_org
    from public.organizations o
    where o.tenant_id = p_tenant_id and (o.id::text = p_id or o.slug = p_id)
      and (o.kind = 'group') = (p_tipus = 'grup')
      and (o.visibility = 'public' or private.is_organization_member(o.id))
    limit 1;
  elsif p_tipus = 'poble' then
    -- La clau és l'id; la ruta, el slug, que és com /pobles/:id coneix els pobles.
    select t.id::text, t.name::text, coalesce(t.slug, t.id::text) into v_clau, v_titol, v_tram
    from public.towns t
    where t.id::text = p_id or t.slug = p_id
    limit 1;
    if v_clau is null then
      select p_id, coalesce(e ->> 'name', e ->> 'title') into v_clau, v_titol
      from public.app_content c
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(c.payload) = 'array' then c.payload else '[]'::jsonb end) e
      where c.tenant_id = p_tenant_id and c.key = 'towns' and e ->> 'id' = p_id
      limit 1;
    end if;
  elsif p_tipus in ('publicacio', 'producte', 'esdeveniment', 'multimedia') then
    select s.id::text, s.title::text into v_clau, v_titol
    from public.section_submissions s
    where s.tenant_id = p_tenant_id and s.id::text = p_id
      and s.section_id = case p_tipus when 'publicacio' then 'mur' when 'producte' then 'mercat'
        when 'esdeveniment' then 'events' else 'multimedia' end
    limit 1;
    if v_clau is null then
      select p_id, coalesce(e ->> 'title', e ->> 'name') into v_clau, v_titol
      from public.app_content c
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(c.payload) = 'array' then c.payload else '[]'::jsonb end) e
      where c.tenant_id = p_tenant_id
        and c.key = case p_tipus when 'publicacio' then 'feedPosts' when 'producte' then 'marketItems'
          when 'esdeveniment' then 'events' else 'mediaItems' end
        and e ->> 'id' = p_id
      limit 1;
    end if;
  elsif p_tipus = 'pagina' then
    -- PAGINES_AMB_XAT (src/data/contracte.js), amb els mateixos títols.
    select pg.cami, pg.nom into v_clau, v_titol
    from (values
      ('/mur', 'Mur'),
      ('/mercat', 'Mercat'),
      ('/pobles', 'Pobles'),
      ('/multimedia', 'Multimèdia'),
      ('/dispositius', 'Dispositius'),
      ('/disseny', 'Disseny'),
      ('/wikidepoble', 'Wiki de Poble'),
      ('/projecte', 'El projecte'),
      ('/constitucio', 'Constitució'),
      ('/ia', 'L''ànima de la iaia'),
      ('/roadmap', 'Full de ruta'),
      ('/versions', 'Versions'),
      ('/legal', 'Legal i privacitat')
    ) as pg (cami, nom)
    where pg.cami = p_id;
  end if;
  if v_clau is null then
    return;
  end if;
  v_tram := coalesce(v_tram, v_clau);
  return query select v_clau, v_titol, v_org,
    case
      when p_tipus = 'pagina' then v_clau
      when v_tram !~ '^[A-Za-z0-9._~-]{1,200}$' then null
      else (case p_tipus when 'entitat' then '/empresa/' when 'grup' then '/grup/' when 'poble' then '/pobles/'
        when 'publicacio' then '/mur/' when 'producte' then '/mercat/' when 'esdeveniment' then '/events/'
        when 'multimedia' then '/multimedia/' end) || v_tram
    end;
end;
$$;
revoke execute on function private.xat_subjecte(uuid, text, text) from public, anon, authenticated;

-- Un fil de pàgina que qui el demana pot llegir sense ser-ne participant:
-- membre del poble del fil i subjecte encara visible. Qui ja hi participa
-- passa per xat_participant_vigent (8), que torna a mirar l'organització.
create or replace function private.xat_fil_de_pagina_visible(p_fil_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.xat_fils f
    where f.id = p_fil_id and f.subjecte_tipus is not null
      and private.is_town_member(f.tenant_id)
      and exists (select 1 from private.xat_subjecte(f.tenant_id, f.subjecte_tipus, f.subjecte_id)));
$$;
revoke execute on function private.xat_fil_de_pagina_visible(uuid) from public, anon, authenticated;

-- Troba o crea el fil d'un tipus que naix d'un subjecte. Qui el crida ja té el
-- bloqueig del subjecte. Sense creador: obrir una pàgina no deixa rastre.
create or replace function private.xat_fil_del_subjecte(p_tenant_id uuid, p_tipus text, p_comunitat_id uuid,
  p_titol text, p_org_id uuid, p_subjecte_tipus text, p_subjecte_id text, p_subjecte_ruta text,
  p_subjecte_titol text, p_subjecte_uri text)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_fil uuid;
begin
  select f.id into v_fil from public.xat_fils f
  where f.tenant_id = p_tenant_id and f.subjecte_tipus = p_subjecte_tipus
    and f.subjecte_id = p_subjecte_id and f.tipus = p_tipus;
  if v_fil is null then
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus, comunitat_id, org_id, permisos,
      subjecte_tipus, subjecte_id, subjecte_ruta, subjecte_titol, subjecte_uri)
    values (p_tenant_id, p_titol, null, p_tipus, p_comunitat_id, p_org_id,
      case when p_tipus = 'canal' then '{"escriuen": "administradors"}'::jsonb else '{}'::jsonb end,
      p_subjecte_tipus, p_subjecte_id, p_subjecte_ruta, p_subjecte_titol, p_subjecte_uri)
    returning id into v_fil;
  end if;
  return v_fil;
end;
$$;
revoke execute on function private.xat_fil_del_subjecte(uuid, text, uuid, text, uuid, text, text, text, text, text) from public, anon, authenticated;


-- ── 4 · Obrir el xat d'una pàgina ────────────────────────────────────────────
-- Una entitat o un poble: la comunitat, «Avisos» (canal) i «General» (grup),
-- amb General com a destí. La resta: un grup. Qui l'obri NO hi entra: ho farà
-- en escriure (6). `participant` diu si ja hi eres. Cap ruta del client: la
-- dona xat_subjecte. p_titol només val per a un contingut sense títol propi,
-- i només per al títol del fil, mai per a subjecte_titol.
drop function if exists public.obri_fil_de_pagina(uuid, text, text, text, text);
drop function if exists public.obri_fil_de_pagina(uuid, text, text, text);
create function public.obri_fil_de_pagina(p_tenant_id uuid, p_tipus text, p_id text,
  p_titol text default null)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz, ultim_seq bigint,
  comunitat_id uuid, org_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, participant boolean, rol text, desti boolean
)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo        uuid := (select auth.uid());
  v_tipus     text := btrim(coalesce(p_tipus, ''));
  v_id        text := btrim(coalesce(p_id, ''));
  v_clau      text;
  v_titol_srv text;
  v_titol     text;
  v_org       uuid;
  v_ruta      text;
  v_uri       text;
  v_comunitat uuid;
  v_canal     uuid;
  v_desti     uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  if v_tipus = 'organitzacio' then
    v_tipus := 'entitat';
  end if;
  if v_tipus not in ('entitat', 'poble', 'publicacio', 'producte', 'esdeveniment', 'multimedia', 'grup', 'pagina')
     or v_id = '' or char_length(v_id) > 200 then
    raise exception 'SDP-XAT-012: este subjecte no té xat.' using errcode = '22023';
  end if;

  select s.clau, left(nullif(btrim(s.titol), ''), 100), s.org_id, s.ruta
    into v_clau, v_titol_srv, v_org, v_ruta
  from private.xat_subjecte(p_tenant_id, v_tipus, v_id) s;
  if v_clau is null then
    raise exception 'SDP-XAT-013: la pàgina no existix o no la pots vore.' using errcode = '42501';
  end if;
  v_titol := coalesce(v_titol_srv, left(nullif(btrim(p_titol), ''), 100), left(v_clau, 100));
  v_uri := (select rtrim(a.valor, '/') from private.ajustos a
            where a.clau = 'url_publica_node' and a.valor like 'https://%') || v_ruta;
  if char_length(v_uri) > 600 then
    v_uri := null;
  end if;

  -- Dos obertures alhora del mateix subjecte creen un sol fil.
  perform pg_advisory_xact_lock(hashtextextended('xat:subjecte:' || p_tenant_id::text || ':' || v_tipus || ':' || v_clau, 0));

  if v_tipus in ('entitat', 'poble') then
    v_comunitat := private.xat_fil_del_subjecte(p_tenant_id, 'comunitat', null, v_titol, v_org,
      v_tipus, v_clau, v_ruta, v_titol_srv, v_uri);
    v_canal := private.xat_fil_del_subjecte(p_tenant_id, 'canal', v_comunitat, 'Avisos', v_org,
      v_tipus, v_clau, v_ruta, v_titol_srv, v_uri);
    v_desti := private.xat_fil_del_subjecte(p_tenant_id, 'grup', v_comunitat, 'General', null,
      v_tipus, v_clau, v_ruta, v_titol_srv, v_uri);
    -- Els gestors vigents administren la comunitat i els Avisos, i hi signen
    -- com l'entitat (xat_participant_vigent ho revoca en perdre el rol).
    if v_org is not null then
      insert into public.xat_participants as pa (fil_id, usuari_id, com_org_id, rol)
      select x.fil, om.user_id, v_org, 'admin'
      from (values (v_comunitat), (v_canal)) as x (fil)
      cross join public.organization_memberships om
      where om.organization_id = v_org and om.tenant_id = p_tenant_id and om.role in ('owner', 'admin')
      on conflict (fil_id, usuari_id) do update
        set com_org_id = excluded.com_org_id, rol = 'admin'
        where pa.com_org_id is null and pa.visible_fins_seq is null;
    end if;
  else
    v_desti := private.xat_fil_del_subjecte(p_tenant_id, 'grup', null, v_titol, null,
      v_tipus, v_clau, v_ruta, v_titol_srv, v_uri);
  end if;

  -- Un fil que ja existia pren la ruta, la URI i el títol del subjecte d'ara:
  -- no els fixa per sempre qui l'obri primer (la URI arriba quan el node
  -- configura url_publica_node; el títol, quan l'entitat es reanomena).
  update public.xat_fils f
     set subjecte_ruta = v_ruta,
         subjecte_uri = coalesce(v_uri, f.subjecte_uri),
         subjecte_titol = coalesce(v_titol_srv, f.subjecte_titol)
   where f.id in (v_comunitat, v_canal, v_desti)
     and (f.subjecte_ruta is distinct from v_ruta
       or (v_uri is not null and f.subjecte_uri is distinct from v_uri)
       or (v_titol_srv is not null and f.subjecte_titol is distinct from v_titol_srv));

  return query
  select f.id, f.tipus, f.titol, coalesce(f.imatge_url, o.logo_url), f.actualitzat_al, f.ultim_seq,
    f.comunitat_id, f.org_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol,
    f.subjecte_uri,
    jo.usuari_id is not null and jo.visible_fins_seq is null and private.xat_participant_vigent(f.id, v_jo),
    jo.rol, f.id = v_desti
  from public.xat_fils f
  left join public.organizations o on o.id = f.org_id
  left join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = v_jo
  where f.id in (v_comunitat, v_canal, v_desti)
  order by case f.tipus when 'comunitat' then 0 when 'canal' then 1 else 2 end;
end;
$$;
revoke execute on function public.obri_fil_de_pagina(uuid, text, text, text) from public, anon;
grant execute on function public.obri_fil_de_pagina(uuid, text, text, text) to authenticated;


-- ── 5 · Llegir sense ser-ne participant ──────────────────────────────────────
-- La mateixa forma que xat_historial (sense cursor, els últims) i xat_nous
-- (amb p_despres_de_seq, els següents). Sense finestra: tota la història.
-- Un missatge signat per l'entitat no diu qui de l'equip l'ha escrit: un
-- visitant no en té cap de propi i no necessita l'usuari_id per al costat.
drop function if exists public.xat_llig_fil_de_pagina(uuid, bigint, bigint, integer);
create function public.xat_llig_fil_de_pagina(
  p_fil_id         uuid,
  p_abans_de_seq   bigint  default null,
  p_despres_de_seq bigint  default null,
  p_limit          integer default 50
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  com_org_id  uuid,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo    uuid := (select auth.uid());
  v_limit integer := coalesce(p_limit, 50);
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or v_limit < 1 or v_limit > 100
     or (p_abans_de_seq is not null and p_abans_de_seq < 1)
     or (p_despres_de_seq is not null and p_despres_de_seq < 0) then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;
  if not private.xat_fil_de_pagina_visible(p_fil_id) then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select * from (
      select
        m.id,
        m.fil_id,
        m.seq,
        case when m.com_org_id is not null then null else m.usuari_id end as usuari_id,
        coalesce(o.name, pr.full_name, 'Veí')::text as autor_nom,
        m.com_org_id,
        m.text as cos,
        m.tipus,
        m.resposta_a,
        m.editat_al,
        m.esborrat_al,
        m.metadades,
        m.es_ia,
        m.creat_al
      from public.xat_missatges m
      left join public.profiles pr on pr.id = m.usuari_id
      left join public.organizations o on o.id = m.com_org_id
      where m.fil_id = p_fil_id
        and (p_abans_de_seq is null or m.seq < p_abans_de_seq)
        and (p_despres_de_seq is null or m.seq > p_despres_de_seq)
        and (m.caduca_al is null or m.caduca_al > now())
      order by case when p_despres_de_seq is null then m.seq end desc nulls last, m.seq asc
      limit v_limit
    ) sub
    order by sub.seq asc;
end;
$$;
revoke execute on function public.xat_llig_fil_de_pagina(uuid, bigint, bigint, integer) from public, anon;
grant execute on function public.xat_llig_fil_de_pagina(uuid, bigint, bigint, integer) to authenticated;


-- ── 6 · Entrar en escriure el primer missatge ────────────────────────────────
-- El client la crida just abans de xat_envia. Només un grup de pàgina; en un
-- General, també la comunitat i els Avisos (per a llegir-los). Tota la
-- història es veu (visible_des_de_seq = 0). Idempotent.
drop function if exists public.xat_entra_al_fil_de_pagina(uuid);
create function public.xat_entra_al_fil_de_pagina(p_fil_id uuid)
returns uuid
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_jo        uuid := (select auth.uid());
  v_tipus     text;
  v_comunitat uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  select f.tipus, f.comunitat_id into v_tipus, v_comunitat
  from public.xat_fils f
  where f.id = p_fil_id and f.subjecte_tipus is not null;
  if v_tipus is distinct from 'grup' or not private.xat_fil_de_pagina_visible(p_fil_id) then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;
  insert into public.xat_participants (fil_id, usuari_id, rol, visible_des_de_seq)
  select x.fil, v_jo, 'membre', 0
  from (
    select p_fil_id as fil
    union
    select c.id from public.xat_fils c
    where v_comunitat is not null
      and (c.id = v_comunitat or (c.comunitat_id = v_comunitat and c.tipus = 'canal'))
  ) x
  on conflict (fil_id, usuari_id) do nothing;
  return p_fil_id;
end;
$$;
revoke execute on function public.xat_entra_al_fil_de_pagina(uuid) from public, anon;
grant execute on function public.xat_entra_al_fil_de_pagina(uuid) to authenticated;


-- ── 7 · Qui escriu a la comunitat i als Avisos ───────────────────────────────
-- BEFORE INSERT i per nom abans de xat_missatges_seq: un missatge rebutjat no
-- consumix cap número. Als Avisos hi escriu qui signa com l'entitat (vigent,
-- ho comprova xat_envia) o un administrador del fil.
create or replace function private.xat_canal_nomes_admins()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_tipus text;
begin
  select f.tipus into v_tipus from public.xat_fils f where f.id = new.fil_id;
  if v_tipus = 'comunitat' then
    raise exception 'SDP-XAT-011: només escriuen els administradors.' using errcode = '42501';
  end if;
  if v_tipus = 'canal' and not exists (
    select 1 from public.xat_participants p
    where p.fil_id = new.fil_id and p.usuari_id = new.usuari_id and p.visible_fins_seq is null
      and (p.rol in ('propietari', 'admin') or p.com_org_id is not null)) then
    raise exception 'SDP-XAT-011: només escriuen els administradors.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.xat_canal_nomes_admins() from public, anon, authenticated;

drop trigger if exists xat_missatges_canal on public.xat_missatges;
create trigger xat_missatges_canal before insert on public.xat_missatges
  for each row execute function private.xat_canal_nomes_admins();


-- ── 8 · Qui participa perd l'accés si l'organització deixa de ser visible ────
-- La de 2609272200 sencera, més l'última condició: en el fil d'una entitat o
-- d'un grup (organització kind 'group'), l'organització ha de ser pública o
-- l'usuari n'ha de ser membre. Una organització que passa a 'members' tanca
-- el seu fil a qui no n'és (llegir, escriure, xat_fils_meus, marques i RLS), i
-- una organització esborrada també. La clau és l'uuid (CHECK de 2).
create or replace function private.xat_participant_vigent(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.xat_participants p
    join public.xat_fils f on f.id = p.fil_id
    where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
      and (f.interlocutor_id is null or f.org_id is not null)
      and (
        (p.com_org_id is null
          and (f.interlocutor_id is null or f.interlocutor_id = p_usuari_id)
          and exists (select 1 from public.town_memberships tm
            where tm.town_id = f.tenant_id and tm.user_id = p_usuari_id))
        or (p.com_org_id = f.org_id and exists (
          select 1 from public.organization_memberships om
          where om.organization_id = f.org_id and om.tenant_id = f.tenant_id
            and om.user_id = p_usuari_id and om.role in ('owner', 'admin')))
      )
      and (f.subjecte_tipus is null or f.subjecte_tipus not in ('entitat', 'grup')
        or exists (select 1 from public.organizations so
          where so.id = (case when f.subjecte_tipus in ('entitat', 'grup') then f.subjecte_id::uuid end)
            and (so.visibility = 'public' or exists (select 1 from public.organization_memberships sm
              where sm.organization_id = so.id and sm.user_id = p_usuari_id))))
  );
$$;
revoke execute on function private.xat_participant_vigent(uuid, uuid) from public, anon, authenticated;


-- ── 9 · En un fil de pàgina, cadascú veu només la seua fila ──────────────────
-- La de 2609272200 sencera, més l'última condició. La taula continua amb
-- `grant select` (260908) i sense ella qualsevol participant d'un General
-- obert a tot el poble llistaria per PostgREST tots els usuari_id i els seus
-- ajustos (silenciat, arxivat, etiqueta, llegit…). Executable per
-- authenticated, com l'original: la usa la política xat_participants_lectura.
create or replace function private.xat_pot_veure_participant(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_participant(p_fil_id)
    and private.xat_participant_vigent(p_fil_id, p_usuari_id)
    and exists (select 1 from public.xat_participants p
      where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
        and (p.com_org_id is null or p.usuari_id = (select auth.uid())
          or private.can_manage_organization(p.com_org_id)))
    and (p_usuari_id = (select auth.uid()) or not exists (select 1 from public.xat_fils sf
      where sf.id = p_fil_id and sf.subjecte_tipus is not null));
$$;
revoke execute on function private.xat_pot_veure_participant(uuid, uuid) from public, anon;
grant execute on function private.xat_pot_veure_participant(uuid, uuid) to authenticated;


-- ── 10 · Llista de converses v4 ──────────────────────────────────────────────
-- La v3 de 2609272200 sencera, més comunitat_id, el subjecte, el rol propi i
-- quantes persones hi participen. En un fil de pàgina, els altres són només
-- l'entitat (si n'és seu i no hi signes tu): cap llista de persones.
drop function if exists public.xat_fils_meus(uuid);
create function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer
)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
begin
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
    coalesce((select min(p.llegit_fins_seq) from public.xat_participants p
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or p.com_org_id is distinct from jo.com_org_id)), 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null)
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
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
      where p.fil_id = f.id and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;
revoke execute on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;


-- ── 11 · La purga d'una baixa no esborra els fils de pàgina ──────────────────
-- La de 2609261500 sencera, més una condició a l'última neteja («Fils que ja
-- no són de ningú»): un fil de pàgina naix amb creat_per null i sense
-- participants fins que algú hi escriu, i esborrar-lo canviaria l'id de la
-- comunitat, els Avisos o el General que els visitants tenen oberts
-- (SDP-XAT-006 fins que tornaren a obrir la pàgina). Els fils de pàgina
-- queden fitats pels subjectes: cap ruta ni clau inventada en crea.
create or replace function private.purga_una_baixa(p_uid uuid)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  r     record;
  v_nou uuid;
begin
  perform 1
  from private.baixes b
  where b.user_id = p_uid
    and b.purga_prevista_al <= now()
  for update;
  if not found then
    return false;
  end if;

  -- T2 · Grups on és propietària: un grup ha de tindre exactament una
  -- propietària (comprova_una_propietaria). Passa a qui l'administra o, si no,
  -- al membre més antic que no estiga de baixa. Si no queda ningú, el grup
  -- desapareix (les seues publicacions conserven la signatura, D10).
  for r in
    select m.organization_id
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = p_uid and m.role = 'owner' and o.kind = 'group'
  loop
    v_nou := null;
    select m2.user_id into v_nou
    from public.organization_memberships m2
    where m2.organization_id = r.organization_id
      and m2.user_id <> p_uid
      and not exists (select 1 from private.baixes b where b.user_id = m2.user_id)
    order by (m2.role = 'admin') desc, m2.created_at asc
    limit 1;

    if v_nou is null then
      delete from public.organizations where id = r.organization_id;
    else
      update public.organization_memberships
         set role = 'owner'
       where organization_id = r.organization_id and user_id = v_nou;
      delete from public.organization_memberships
       where organization_id = r.organization_id and user_id = p_uid;
    end if;
  end loop;

  -- D12: les notes (privades) s'esborren. Les publicacions personals es
  -- conserven anònimes (també les de la secció notes: no s'esborra res que
  -- s'haja publicat). Les signades per una entitat són de l'entitat.
  delete from public.notes where owner_user_id = p_uid;
  update public.section_submissions s
     set owner_user_id = '00000000-0000-0000-0000-000000000000'::uuid,
         payload = s.payload - private.claus_personals_payload(s.payload, null)
   where s.owner_user_id = p_uid
     and s.author_org_id is null;

  -- Fitxers: a la cua. Els que encara usa una entitat o una publicació es
  -- marquen com a referenciats i es conserven. Es compara amb el bucket
  -- inclòs (casa amb sdp-media://<bucket>/<nom> i amb /object/public/<bucket>/<nom>):
  -- la còpia pública d'un adjunt té el mateix nom que l'original privat, i
  -- només la pública és la referenciada. Les imatges del cos de la fitxa
  -- d'una entitat (presentacio_html) també són seues.
  begin
    insert into private.purga_storage_pendent (user_id, bucket_id, nom, referenciat)
    select p_uid, o.bucket_id, o.name,
           exists (select 1 from public.organizations org
                    where right(coalesce(org.logo_url, ''), char_length(o.bucket_id || '/' || o.name)) = o.bucket_id || '/' || o.name
                       or right(coalesce(org.hero_url, ''), char_length(o.bucket_id || '/' || o.name)) = o.bucket_id || '/' || o.name
                       or strpos(coalesce(org.presentacio_html, ''), o.bucket_id || '/' || o.name) > 0)
        or exists (select 1 from public.section_submissions s
                    where strpos(s.payload::text, o.bucket_id || '/' || o.name) > 0)
    from storage.objects o
    where o.bucket_id in ('mitjans', 'mitjans_privats')
      and ((storage.foldername(o.name))[2] = p_uid::text
        or (cardinality(storage.foldername(o.name)) = 1 and (storage.foldername(o.name))[1] = p_uid::text))
    on conflict (bucket_id, nom) do nothing;
  exception when insufficient_privilege or undefined_table or undefined_function then
    raise notice 'SDP-BAIXA-020: sense accés a storage.objects per a %.', p_uid;
  end;

  -- Cascada: perfil, pertinences, rols, reclamacions, missatges i lectures del
  -- xat, incidències, la pròpia baixa i els consentiments (que passen a bloqueig).
  delete from auth.users where id = p_uid;

  -- Fils que ja no són de ningú.
  delete from public.xat_fils f
   where f.creat_per is null
     and f.subjecte_tipus is null
     and not exists (select 1 from public.xat_participants p where p.fil_id = f.id);
  return true;
end;
$$;
revoke execute on function private.purga_una_baixa(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
