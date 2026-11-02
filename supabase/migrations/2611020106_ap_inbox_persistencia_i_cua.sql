-- ============================================================================
-- 261102_0106 · P1-23 (fase 2) / P2-07 (part ActivityPub) · Marató 261101_2143,
-- torn torn_3d9af83b (carril M14-B5-SQL) · La persistència de la inbox
-- ActivityPub i la cua d'eixida signada
--
-- PER QUÈ: la biblioteca de la inbox (src/data/federacio/inboxActivityPub.js)
-- verifica i processa les activitats rebudes, però el seu magatzem només
-- existix en memòria: sense taules, cap servidor no pot recordar quines
-- activitats ha vist, qui seguix cada actor local ni quines alertes remotes
-- són vigents, i l'Accept d'un Follow (els «lliuraments») no l'envia ningú.
-- La funció supabase/functions/ap-inbox-verifica (no desplegada) fa servir
-- estes RPC amb la clau de servei a través de magatzemPostgrest.js.
--
-- QUÈ FA:
--   1. Cinc taules a private, amb RLS, sense cap política i amb tots els
--      permisos revocats (també a service_role): cap rol de l'API les llig
--      ni les escriu directament, només per les RPC.
--        · ap_inbox_lliuraments: idempotència de les activitats rebudes
--          (activitat_id, host, tipus, estat en_curs/fet, conserva_fins).
--        · ap_seguidors: seguidors remots de cada actor local.
--        · ap_alertes_remotes: alertes municipals remotes en text pla.
--        · ap_lapides: làpides per objecte I propietari, amb caducitat.
--        · ap_cua_eixida: la cua d'eixida (hui, els Accept), idempotent per
--          (activitat_id, inbox), amb intents, espera i error tallat.
--   2. Tretze RPC public.ap_* SECURITY DEFINER amb el search_path buit, la
--      guarda auth.role() = 'service_role' i EXECUTE només per a
--      service_role (el patró de purga_fitxers_*, 2610241440). Paràmetres
--      tipats: l'únic jsonb és el cos de ap_cua_encua, que ha de ser un
--      objecte de 64 KiB com a molt amb el mateix id que l'activitat.
--   3. Quotes amb el mateix missatge que la memòria: per host de l'actor i un
--      sostre global (p_maxim, el residu dels subdominis comodí), per actor
--      local (seguidors) i global (alertes). Les reclamacions d'un host i les
--      altes de seguidors d'un actor es serialitzen amb un pany de
--      transacció.
--   4. TTL: cada reclamació purga les vençudes del seu host i ap_purga()
--      buida, per passades de 5.000 files com a molt, les activitats
--      vençudes, les alertes caducades fa més d'un dia, les làpides vençudes,
--      la cua feta de fa més de 7 dies i la fallida de fa més de 30.
--   5. Cua: encuar és idempotent; un Follow repetit pel remot torna a enviar
--      el MATEIX Accept com a molt una vegada per hora i mai un cos distint
--      amb el mateix id. Reclamar usa FOR UPDATE SKIP LOCKED i deixa una
--      reserva de 10 minuts; una fila que ha esgotat 50 reclamacions sense
--      cap resolució (un worker que cau sempre amb ella) passa a fallida i no
--      bloqueja la cua.
--
-- QUÈ NO FA:
--   · No encén la federació: sense la funció desplegada, SDP_AP_ACTIVA=1,
--     les claus de l'actor i la llista de nodes de confiança, estes taules
--     es queden buides. No toca cap taula de persones del poble: només
--     actors remots (URL públiques), alertes públiques i el cos dels Accept.
--   · No fa transaccional la seqüència reclamar → efecte → confirmar (són
--     tres crides): una reclamació en_curs de fa més de 5 minuts es torna a
--     prendre i els efectes són idempotents.
--   · No prova la concurrència real de SKIP LOCKED ni dels panys: PGlite és
--     una sola connexió.
--
-- CODIS:
--   SDP-AP-000   només el servidor (service_role) (42501)
--   SDP-AP-001   paràmetre invàlid (22023)
--   SDP-AP-QUOTA quota o magatzem ple (54000); el missatge diu quina
--
-- Depén de: cap migració del repositori (només auth.role() de Supabase).
--
-- Abans (lectura):
--   select to_regclass('private.ap_inbox_lliuraments') is null as sense_inbox_ap, to_regprocedure('public.ap_cua_reclama(integer)') is null as sense_cua_ap;
--   (cert i cert; si ja hi són, és una reaplicació: la migració és idempotent).
--
-- Verificació posterior (lectura):
--   select to_regclass('private.ap_cua_eixida') is not null as te_cua_ap, has_function_privilege('service_role', 'public.ap_inbox_reclama(text,text,text,text,integer,integer,integer)', 'execute') as servidor_reclama, has_function_privilege('authenticated', 'public.ap_inbox_reclama(text,text,text,text,integer,integer,integer)', 'execute') as authenticated_reclama, has_table_privilege('service_role', 'private.ap_seguidors', 'select') as servidor_llig_taula;
--   (cert, cert, fals i fals).
--
-- Inversa (esborra els seguidors, les alertes i la cua; només si la
-- federació no s'ha encés mai o se'n pot perdre l'estat):
--   drop function if exists public.ap_inbox_reclama(text, text, text, text, integer, integer, integer),
--     public.ap_inbox_confirma(text), public.ap_inbox_allibera(text),
--     public.ap_seguidor_desa(text, text, text, text, text, integer),
--     public.ap_seguidor_retira(text, text, text), public.ap_actor_remot_retira(text),
--     public.ap_alerta_desa(text, text, text, text, text, text, text, text, timestamptz, timestamptz, timestamptz, integer),
--     public.ap_alerta_retira(text, text, text, boolean, integer), public.ap_alertes_vigents(timestamptz),
--     public.ap_cua_encua(text, text, text, jsonb), public.ap_cua_reclama(integer),
--     public.ap_cua_resol(bigint, text, integer, text, integer), public.ap_purga();
--   drop table if exists private.ap_cua_eixida, private.ap_lapides, private.ap_alertes_remotes,
--     private.ap_seguidors, private.ap_inbox_lliuraments;
--
-- Prova estàtica: src/data/supabase/apInbox.migracio.test.js (també la
-- paritat dels noms i dels paràmetres amb magatzemPostgrest.js). L'execució a
-- PGlite 0.3.16 (guardes, permisos, idempotència, quotes, TTL, cua i purga)
-- és evidència no versionada, fora del repositori.
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create schema if not exists private;

-- ── 1 · Taules (private, RLS sense polítiques, cap permís) ──────────────────

-- Idempotència de les activitats rebudes (el nom ve del pla 261101_2059).
create table if not exists private.ap_inbox_lliuraments (
  activitat_id  text primary key check (char_length(activitat_id) between 12 and 2048 and activitat_id like 'https://%'),
  actor         text not null check (char_length(actor) between 12 and 2048 and actor like 'https://%'),
  host          text not null check (char_length(host) between 1 and 253 and host ~ '^[a-z0-9.-]+$'),
  tipus         text not null check (tipus in ('Follow', 'Undo', 'Create', 'Delete', 'Announce')),
  estat         text not null default 'en_curs' check (estat in ('en_curs', 'fet')),
  rebuda_al     timestamptz not null default now(),
  conserva_fins timestamptz not null
);
create index if not exists ap_inbox_lliuraments_host_idx on private.ap_inbox_lliuraments (host);
create index if not exists ap_inbox_lliuraments_conserva_idx on private.ap_inbox_lliuraments (conserva_fins);
alter table private.ap_inbox_lliuraments enable row level security;

-- Seguidors remots de cada actor local.
create table if not exists private.ap_seguidors (
  slug      text not null check (char_length(slug) between 1 and 64 and slug ~ '^[a-z0-9-]+$'),
  actor     text not null check (char_length(actor) <= 2048 and actor like 'https://%'),
  inbox     text not null check (char_length(inbox) <= 2048 and inbox like 'https://%'),
  follow_id text not null check (char_length(follow_id) <= 2048),
  accept_id text not null check (char_length(accept_id) <= 2048),
  des_al    timestamptz not null default now(),
  primary key (slug, actor)
);
alter table private.ap_seguidors enable row level security;

-- Alertes municipals remotes (text pla, mai HTML ni l'objecte sencer).
create table if not exists private.ap_alertes_remotes (
  id        text primary key check (char_length(id) <= 2048 and id like 'https://%'),
  actor     text not null check (char_length(actor) <= 2048),
  via       text check (via is null or char_length(via) <= 2048),
  activitat text not null check (char_length(activitat) <= 2048),
  tipus     text not null check (tipus in ('alerta', 'bandol_urgent')),
  url       text check (url is null or (char_length(url) <= 2048 and url like 'https://%')),
  nom       text not null default '' check (char_length(nom) <= 160),
  text      text not null default '' check (char_length(text) <= 2000),
  publicat  timestamptz,
  caduca    timestamptz not null,
  rebuda    timestamptz not null
);
create index if not exists ap_alertes_remotes_caduca_idx on private.ap_alertes_remotes (caduca);
alter table private.ap_alertes_remotes enable row level security;

-- Làpides (Delete d'un node de confiança): per objecte I propietari.
create table if not exists private.ap_lapides (
  id            text not null check (char_length(id) <= 2048),
  actor         text not null check (char_length(actor) <= 2048),
  creat_al      timestamptz not null default now(),
  conserva_fins timestamptz not null,
  primary key (id, actor)
);
alter table private.ap_lapides enable row level security;

-- Cua d'eixida signada (hui, els Accept). Idempotent per (activitat, inbox).
create table if not exists private.ap_cua_eixida (
  id               bigint generated always as identity primary key,
  slug             text not null check (char_length(slug) between 1 and 64 and slug ~ '^[a-z0-9-]+$'),
  inbox            text not null check (char_length(inbox) <= 2048 and inbox like 'https://%'),
  activitat_id     text not null check (char_length(activitat_id) <= 2048 and activitat_id like 'https://%'),
  cos              jsonb not null check (jsonb_typeof(cos) = 'object' and octet_length(cos::text) <= 65536),
  estat            text not null default 'pendent' check (estat in ('pendent', 'fet', 'fallit')),
  intents          integer not null default 0 check (intents between 0 and 100),
  proper_intent_al timestamptz not null default now(),
  ultim_error      text check (ultim_error is null or char_length(ultim_error) <= 200),
  creat_al         timestamptz not null default now(),
  resolt_al        timestamptz,
  unique (activitat_id, inbox)
);
create index if not exists ap_cua_eixida_pendents_idx on private.ap_cua_eixida (proper_intent_al) where estat = 'pendent';
alter table private.ap_cua_eixida enable row level security;

-- Cap permís de taula: ni els rols de l'API ni service_role (que salta l'RLS)
-- hi entren directament; ho fan les RPC, que són de la propietària.
revoke all on table private.ap_inbox_lliuraments from public, anon, authenticated, service_role;
revoke all on table private.ap_seguidors from public, anon, authenticated, service_role;
revoke all on table private.ap_alertes_remotes from public, anon, authenticated, service_role;
revoke all on table private.ap_lapides from public, anon, authenticated, service_role;
revoke all on table private.ap_cua_eixida from public, anon, authenticated, service_role;

-- ── 2 · RPC de la inbox (només service_role; guarda + permís) ───────────────

-- Reclama un id d'activitat abans de cap efecte: true si és nova (o una
-- en_curs abandonada fa més de 5 min), false si és una repetició, també amb
-- el host ple. Quota per host i sostre global, amb el missatge de la memòria.
create or replace function public.ap_inbox_reclama(p_activitat_id text, p_actor text, p_host text, p_tipus text,
  p_retencio_s integer, p_maxim_per_host integer, p_maxim integer default 100000)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare
  v_n integer;
  v_maxim integer := greatest(1, least(coalesce(p_maxim, 100000), 1000000));
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  if p_activitat_id is null or p_actor is null or p_host is null or p_tipus is null then
    raise exception 'SDP-AP-001: paràmetre invàlid.' using errcode = '22023';
  end if;
  -- Les reclamacions d'un host es serialitzen: la quota no es pot passar en paral·lel.
  perform pg_advisory_xact_lock(hashtextextended('ap_inbox:' || p_host, 0));
  delete from private.ap_inbox_lliuraments l where l.host = p_host and l.conserva_fins < now();
  -- Una en_curs de fa més de 5 min és d'un procés que va caure entre la
  -- reclamació i l'efecte: es torna a prendre.
  update private.ap_inbox_lliuraments l set rebuda_al = now()
   where l.activitat_id = p_activitat_id and l.estat = 'en_curs' and l.rebuda_al < now() - interval '5 minutes';
  if found then return true; end if;
  -- Una repetició és duplicada encara que el host estiga ple (no gasta quota).
  if exists (select 1 from private.ap_inbox_lliuraments l where l.activitat_id = p_activitat_id) then return false; end if;
  select count(*) into v_n from private.ap_inbox_lliuraments l where l.host = p_host;
  if v_n >= greatest(1, least(coalesce(p_maxim_per_host, 1000), 100000)) then
    raise exception 'SDP-AP-QUOTA: Quota de la inbox esgotada per a este origen.' using errcode = '54000';
  end if;
  -- Sostre global (els subdominis d'un DNS comodí són hosts diferents). Abans
  -- de dir que és ple, es buida un lot de vençudes de qualsevol host.
  if (select count(*) from (select 1 from private.ap_inbox_lliuraments x limit v_maxim) s) >= v_maxim then
    delete from private.ap_inbox_lliuraments l where l.activitat_id in (
      select x.activitat_id from private.ap_inbox_lliuraments x where x.conserva_fins < now() limit 1000);
    if (select count(*) from (select 1 from private.ap_inbox_lliuraments x limit v_maxim) s) >= v_maxim then
      raise exception 'SDP-AP-QUOTA: Magatzem de la inbox ple.' using errcode = '54000';
    end if;
  end if;
  insert into private.ap_inbox_lliuraments (activitat_id, actor, host, tipus, conserva_fins)
  values (p_activitat_id, p_actor, p_host, p_tipus, now() + make_interval(secs => greatest(60, least(coalesce(p_retencio_s, 50400), 172800))))
  on conflict (activitat_id) do nothing;
  return found;
end;
$$;

-- L'efecte ha acabat bé: en_curs → fet.
create or replace function public.ap_inbox_confirma(p_activitat_id text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  update private.ap_inbox_lliuraments l set estat = 'fet' where l.activitat_id = p_activitat_id and l.estat = 'en_curs';
  return found;
end;
$$;

-- L'efecte ha fallat: allibera la reclamació (i la quota), només si és en_curs.
create or replace function public.ap_inbox_allibera(p_activitat_id text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  delete from private.ap_inbox_lliuraments l where l.activitat_id = p_activitat_id and l.estat = 'en_curs';
  return found;
end;
$$;

-- 'nou' o 'existent' (un Follow repetit actualitza inbox, followId i acceptId i conserva des_al).
create or replace function public.ap_seguidor_desa(p_slug text, p_actor text, p_inbox text, p_follow_id text, p_accept_id text, p_maxim integer)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  v_existia boolean;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ap_seguidors:' || coalesce(p_slug, ''), 0));
  select true into v_existia from private.ap_seguidors s where s.slug = p_slug and s.actor = p_actor;
  if v_existia is null and (select count(*) from private.ap_seguidors s where s.slug = p_slug) >= greatest(1, least(coalesce(p_maxim, 10000), 1000000)) then
    raise exception 'SDP-AP-QUOTA: Magatzem de la inbox ple.' using errcode = '54000';
  end if;
  insert into private.ap_seguidors as s (slug, actor, inbox, follow_id, accept_id)
  values (p_slug, p_actor, p_inbox, p_follow_id, p_accept_id)
  on conflict (slug, actor) do update set inbox = excluded.inbox, follow_id = excluded.follow_id, accept_id = excluded.accept_id;
  return case when v_existia then 'existent' else 'nou' end;
end;
$$;

-- Undo(Follow): amb p_follow_id, només si és el vigent.
create or replace function public.ap_seguidor_retira(p_slug text, p_actor text, p_follow_id text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  delete from private.ap_seguidors s where s.slug = p_slug and s.actor = p_actor and (p_follow_id is null or s.follow_id = p_follow_id);
  return found;
end;
$$;

-- Delete de l'actor sencer: els seus seguiments i les alertes on és autor o qui les anuncià.
create or replace function public.ap_actor_remot_retira(p_actor text)
returns integer language plpgsql volatile security definer set search_path = '' as $$
declare
  v_s integer; v_a integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  delete from private.ap_seguidors s where s.actor = p_actor;
  get diagnostics v_s = row_count;
  delete from private.ap_alertes_remotes a where a.actor = p_actor or a.via = p_actor;
  get diagnostics v_a = row_count;
  return v_s + v_a;
end;
$$;

-- 'nova', 'existent' o 'esborrada' (làpida del propietari). Paràmetres tipats, cap jsonb.
create or replace function public.ap_alerta_desa(p_id text, p_actor text, p_via text, p_activitat text, p_tipus text, p_url text,
  p_nom text, p_text text, p_publicat timestamptz, p_caduca timestamptz, p_rebuda timestamptz, p_maxim integer)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  v_actual private.ap_alertes_remotes%rowtype;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ap_alerta:' || coalesce(p_id, ''), 0));
  if exists (select 1 from private.ap_lapides l where l.id = p_id and l.actor = p_actor) then return 'esborrada'; end if;
  select * into v_actual from private.ap_alertes_remotes a where a.id = p_id;
  if found then
    -- El Create directe de l'autor guanya a l'Announce (via): ja no la retira qui només l'anuncià.
    if v_actual.via is not null and p_via is null and v_actual.actor = p_actor then
      update private.ap_alertes_remotes a set via = null, activitat = p_activitat, tipus = p_tipus, url = p_url,
        nom = coalesce(p_nom, ''), text = coalesce(p_text, ''), publicat = p_publicat, caduca = p_caduca, rebuda = p_rebuda
       where a.id = p_id;
    end if;
    return 'existent';
  end if;
  if (select count(*) from private.ap_alertes_remotes) >= greatest(1, least(coalesce(p_maxim, 10000), 1000000)) then
    raise exception 'SDP-AP-QUOTA: Magatzem de la inbox ple.' using errcode = '54000';
  end if;
  insert into private.ap_alertes_remotes (id, actor, via, activitat, tipus, url, nom, text, publicat, caduca, rebuda)
  values (p_id, p_actor, p_via, p_activitat, p_tipus, p_url, coalesce(p_nom, ''), coalesce(p_text, ''), p_publicat, p_caduca, p_rebuda);
  return 'nova';
end;
$$;

-- Delete (p_id): només el propietari; amb p_lapida, deixa làpida (objecte + propietari).
-- Undo(Announce) (p_activitat): només qui l'anuncià.
create or replace function public.ap_alerta_retira(p_id text, p_actor text, p_activitat text, p_lapida boolean, p_lapida_s integer)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  if p_id is not null then
    if exists (select 1 from private.ap_alertes_remotes a where a.id = p_id and a.actor <> p_actor) then return false; end if;
    if coalesce(p_lapida, false) then
      insert into private.ap_lapides (id, actor, conserva_fins)
      values (p_id, p_actor, now() + make_interval(secs => greatest(86400, least(coalesce(p_lapida_s, 2678400), 31536000))))
      on conflict (id, actor) do nothing;
    end if;
    delete from private.ap_alertes_remotes a where a.id = p_id;
    return found;
  end if;
  delete from private.ap_alertes_remotes a
   where a.id = (select b.id from private.ap_alertes_remotes b where b.activitat = p_activitat and b.via = p_actor limit 1);
  return found;
end;
$$;

-- Les alertes que encara no han caducat, fins a 500.
create or replace function public.ap_alertes_vigents(p_ara timestamptz)
returns table (id text, actor text, via text, activitat text, tipus text, url text, nom text, text text, publicat timestamptz, caduca timestamptz, rebuda timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  return query select a.id, a.actor, a.via, a.activitat, a.tipus, a.url, a.nom, a.text, a.publicat, a.caduca, a.rebuda
    from private.ap_alertes_remotes a where a.caduca > coalesce(p_ara, now()) order by a.rebuda, a.id limit 500;
end;
$$;

-- ── 3 · RPC de la cua d'eixida ───────────────────────────────────────────────

-- Encuar (idempotent). Un Follow repetit pel remot torna a enviar el MATEIX
-- Accept només si l'anterior es va resoldre fa més d'una hora i el cos és el
-- mateix: mai un cos distint amb el mateix id (idea del kit de Codex).
create or replace function public.ap_cua_encua(p_slug text, p_inbox text, p_activitat_id text, p_cos jsonb)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  if p_cos is null or jsonb_typeof(p_cos) <> 'object' or p_cos ->> 'id' is distinct from p_activitat_id
     or octet_length(p_cos::text) > 65536 then
    raise exception 'SDP-AP-001: paràmetre invàlid.' using errcode = '22023';
  end if;
  insert into private.ap_cua_eixida as c (slug, inbox, activitat_id, cos)
  values (p_slug, p_inbox, p_activitat_id, p_cos)
  on conflict (activitat_id, inbox) do update
     set estat = 'pendent', intents = 0, proper_intent_al = now(), ultim_error = null, resolt_al = null
   where c.estat <> 'pendent' and c.resolt_al < now() - interval '1 hour' and c.cos = excluded.cos;
  return found;
end;
$$;

-- Reclamar un lot. SKIP LOCKED: dues passades no es reparteixen la mateixa
-- fila. Reclamar suma l'intent i posa una reserva de 10 min (si el procés
-- cau, la fila torna sola). Una fila reclamada 50 vegades sense cap
-- resolució passa abans a fallida: no pot bloquejar la cua.
create or replace function public.ap_cua_reclama(p_limit integer)
returns table (id bigint, slug text, inbox text, activitat_id text, cos jsonb, intents integer)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  update private.ap_cua_eixida c
     set estat = 'fallit', resolt_al = now(), ultim_error = 'reclamacions_esgotades'
   where c.estat = 'pendent' and c.intents >= 50 and c.proper_intent_al <= now();
  return query
  with triades as (
    select c.id from private.ap_cua_eixida c
     where c.estat = 'pendent' and c.proper_intent_al <= now()
     order by c.proper_intent_al, c.id
     limit greatest(1, least(coalesce(p_limit, 20), 100))
     for update of c skip locked
  )
  update private.ap_cua_eixida p
     set intents = p.intents + 1, proper_intent_al = now() + interval '10 minutes'
    from triades t
   where p.id = t.id
  returning p.id, p.slug, p.inbox, p.activitat_id, p.cos, p.intents;
end;
$$;

-- Resoldre: 'fet', 'reintent' (amb l'espera que calcula el worker, d'1 s a
-- 1 dia) o 'fallit'. Arribat a p_maxim_intents (d'1 a 50), 'fallit'. L'error
-- el posa el worker (cap secret), tallat a 200. Només es resol una fila
-- pendent ja reclamada: una de feta o fallida, o una que ningú no ha
-- reclamat, torna null. Després d'un reintent la fila torna a ser pendent i
-- encara es pot resoldre (sense token de reclamació: un worker de fa més de
-- 10 min pot resoldre la reclamació d'un altre).
create or replace function public.ap_cua_resol(p_id bigint, p_resultat text, p_espera_s integer, p_error text, p_maxim_intents integer)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  v_estat text;
  v_maxim integer := greatest(1, least(coalesce(p_maxim_intents, 10), 50));
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  if p_resultat is null or p_resultat not in ('fet', 'reintent', 'fallit') then
    raise exception 'SDP-AP-001: paràmetre invàlid.' using errcode = '22023';
  end if;
  update private.ap_cua_eixida c
     set estat = case when p_resultat = 'fet' then 'fet'
                      when p_resultat = 'fallit' or c.intents >= v_maxim then 'fallit'
                      else 'pendent' end,
         proper_intent_al = case when p_resultat = 'reintent' then now() + make_interval(secs => greatest(1, least(coalesce(p_espera_s, 60), 86400)))
                                 else c.proper_intent_al end,
         ultim_error = case when p_resultat = 'fet' then null else left(coalesce(nullif(btrim(p_error), ''), 'sense detall'), 200) end,
         resolt_al = case when p_resultat = 'reintent' and c.intents < v_maxim then null else now() end
   where c.id = p_id and c.estat = 'pendent' and c.intents > 0
  returning c.estat into v_estat;
  return v_estat;
end;
$$;

-- Purga per TTL, fitada per passada.
create or replace function public.ap_purga()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_l integer; v_a integer; v_p integer; v_c integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-AP-000: només el servidor.' using errcode = '42501';
  end if;
  delete from private.ap_inbox_lliuraments l where l.activitat_id in (
    select x.activitat_id from private.ap_inbox_lliuraments x where x.conserva_fins < now() limit 5000);
  get diagnostics v_l = row_count;
  delete from private.ap_alertes_remotes a where a.id in (
    select x.id from private.ap_alertes_remotes x where x.caduca < now() - interval '1 day' limit 5000);
  get diagnostics v_a = row_count;
  delete from private.ap_lapides l where (l.id, l.actor) in (
    select x.id, x.actor from private.ap_lapides x where x.conserva_fins < now() limit 5000);
  get diagnostics v_p = row_count;
  delete from private.ap_cua_eixida c where c.id in (
    select x.id from private.ap_cua_eixida x
     where (x.estat = 'fet' and x.resolt_al < now() - interval '7 days')
        or (x.estat = 'fallit' and x.resolt_al < now() - interval '30 days') limit 5000);
  get diagnostics v_c = row_count;
  return jsonb_build_object('activitats', v_l, 'alertes', v_a, 'lapides', v_p, 'cua', v_c);
end;
$$;

-- ── 4 · Permisos: una RPC pública naix amb EXECUTE per a anon i authenticated
-- (privilegis per defecte de Supabase); es revoca a tothom i es torna a donar
-- només a service_role, dins de la mateixa transacció.
revoke all on function public.ap_inbox_reclama(text, text, text, text, integer, integer, integer) from public, anon, authenticated, service_role;
revoke all on function public.ap_inbox_confirma(text) from public, anon, authenticated, service_role;
revoke all on function public.ap_inbox_allibera(text) from public, anon, authenticated, service_role;
revoke all on function public.ap_seguidor_desa(text, text, text, text, text, integer) from public, anon, authenticated, service_role;
revoke all on function public.ap_seguidor_retira(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.ap_actor_remot_retira(text) from public, anon, authenticated, service_role;
revoke all on function public.ap_alerta_desa(text, text, text, text, text, text, text, text, timestamptz, timestamptz, timestamptz, integer) from public, anon, authenticated, service_role;
revoke all on function public.ap_alerta_retira(text, text, text, boolean, integer) from public, anon, authenticated, service_role;
revoke all on function public.ap_alertes_vigents(timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.ap_cua_encua(text, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.ap_cua_reclama(integer) from public, anon, authenticated, service_role;
revoke all on function public.ap_cua_resol(bigint, text, integer, text, integer) from public, anon, authenticated, service_role;
revoke all on function public.ap_purga() from public, anon, authenticated, service_role;
grant execute on function public.ap_inbox_reclama(text, text, text, text, integer, integer, integer) to service_role;
grant execute on function public.ap_inbox_confirma(text) to service_role;
grant execute on function public.ap_inbox_allibera(text) to service_role;
grant execute on function public.ap_seguidor_desa(text, text, text, text, text, integer) to service_role;
grant execute on function public.ap_seguidor_retira(text, text, text) to service_role;
grant execute on function public.ap_actor_remot_retira(text) to service_role;
grant execute on function public.ap_alerta_desa(text, text, text, text, text, text, text, text, timestamptz, timestamptz, timestamptz, integer) to service_role;
grant execute on function public.ap_alerta_retira(text, text, text, boolean, integer) to service_role;
grant execute on function public.ap_alertes_vigents(timestamptz) to service_role;
grant execute on function public.ap_cua_encua(text, text, text, jsonb) to service_role;
grant execute on function public.ap_cua_reclama(integer) to service_role;
grant execute on function public.ap_cua_resol(bigint, text, integer, text, integer) to service_role;
grant execute on function public.ap_purga() to service_role;

notify pgrst, 'reload schema';
commit;
