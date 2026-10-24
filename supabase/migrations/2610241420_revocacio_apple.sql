-- ============================================================================
-- 261024_1420 · T1 (P0-04) · Custòdia i revocació de Sign in with Apple quan
-- una persona es dona de baixa.
-- Ordre del Mestre (pla 261024_1315 de fortificació i auditoria adversarial;
-- App Store Review Guideline 5.1.1(v) i Apple TN3194) i auditoria Codex
-- 261024_1315 C-01: el codi d'autorització es canvia al servidor, vinculat a
-- la persona autenticada; la clau .p8 i el client_secret viuen només a la
-- funció compte-apple; la revocació és idempotent i va ABANS de la purga.
-- MANDAT SUPABASE 30-OCT-2026: cada taula i cada funció nova porten els
-- permisos explícits en la mateixa transacció.
--
-- QUÈ FA:
--   1. private.autoritzacions_apple · Una fila per persona amb el refresh
--      token d'Apple XIFRAT (AES-256-GCM, a la funció compte-apple, amb la
--      persona com a dades associades): la base no veu mai el text clar ni la
--      clau. La desa la funció quan la persona entra amb Apple a l'iPhone i
--      l'esborra apple_registra_revocacio quan Apple confirma la revocació.
--      Cau en cascada amb auth.users.
--   2. private.revocacions_apple · El registre de cada revocació o de la seua
--      falta: l'empremta pseudònima del subjecte (private.hash_subjecte),
--      l'origen ('baixa', 'cron', 'purga') i el resultat ('revocat',
--      'ja_invalid', 'sense_testimoni', 'purgat_sense_revocar'). Sense clau
--      forana a posta: sobreviu a la purga i no porta cap dada en clar.
--   3. L'ajust private.ajustos('dies_espera_revocacio_apple', '7'): els dies,
--      passada la purga prevista, que la purga espera una revocació pendent
--      abans de purgar igualment amb 'purgat_sense_revocar'.
--   4. Quatre RPC SECURITY DEFINER (search_path buit) NOMÉS per a
--      service_role, la funció compte-apple:
--      apple_desa_autoritzacio(p_user_id, p_sub, p_client_id, p_xifrat)
--        · desa o substituïx la fila, i només si p_sub és la identitat
--          d'Apple d'eixa persona a auth.identities (vincle A/B);
--      apple_autoritzacio_de(p_user_id) · la fila d'una persona;
--      apple_revocacions_pendents(p_limit) · les de les baixes: les desades
--        abans de demanar-la, i totes les que queden a un dia de la purga
--        prevista (una entrada nova durant la quarantena es respecta fins
--        aleshores: si cancel·la, no se li revoca res); primer les no
--        provades i després les provades fa més temps (R1-01, 261024
--        correccions: una fila que falla no tapa la cua);
--      apple_registra_revocacio(p_user_id, p_origen, p_resultat, p_xifrat, p_detall)
--        · terminal ('revocat', 'ja_invalid') esborra la fila NOMÉS si el
--          xifrat és el revocat (una autorització nova desada entremig es
--          conserva) i ho registra; 'sense_testimoni' ho registra si no hi
--          ha fila, si la baixa ja existix i si eixa persona no en té cap
--          de les últimes 24 hores (R1-03); 'fallida' suma un intent a la fila.
--      Revocades a public, anon, authenticated i service_role, i després
--      grant execute només a service_role; a dins, la porta auth.role().
--
-- QUÈ NO FA:
--   · No crida Apple ni cap URL, ni usa pg_net ni Vault: ho fa la funció
--     compte-apple (supabase/functions/compte-apple).
--   · No programa el buidatge de cada hora: el programa el Mestre
--     (supabase/README.md, «Funció compte-apple»).
--   · No toca private.purga_una_baixa: la porta abans de la purga, que usa
--     estes taules i l'ajust, és de 2610241440 (tasca T8).
--   · No revoca qui va entrar amb Apple abans de la custòdia (TestFlight): no
--     hi ha cap testimoni; el camí manual és al README.
--   · No purga private.revocacions_apple: la retenció la decidix el Mestre.
--
-- CODIS (missatges en valencià; la funció els llig pel prefix):
--   SDP-APPLE-000 només el servidor (service_role) (42501)
--   SDP-APPLE-001 el subjecte no és la identitat d'Apple de la persona (42501)
--   SDP-APPLE-002 les dades de l'autorització o de la revocació no són vàlides (22023)
--
-- Depén de: auth.users i auth.identities (GoTrue, amb provider_id),
-- private.ajustos (2609080000), private.baixes i private.hash_subjecte
-- (2609261500).
--
-- Additiva i idempotent. Revisada i NO aplicada a cap base de dades.
-- L'aplica el Mestre, mai un agent.
-- Va ABANS de desplegar la funció compte-apple i ABANS de 2610241440.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · L'espera màxima d'una revocació pendent ─────────────────────────────
insert into private.ajustos (clau, valor)
values ('dies_espera_revocacio_apple', '7')
on conflict (clau) do nothing;

-- ── 1 · La custòdia: el refresh token d'Apple, xifrat ───────────────────────
create table if not exists private.autoritzacions_apple (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  client_id        text not null
    constraint autoritzacions_apple_client_id_valid
    check (client_id ~ '^[A-Za-z0-9][A-Za-z0-9.-]{0,254}$'),
  testimoni_xifrat text not null
    constraint autoritzacions_apple_xifrat_valid
    check (char_length(testimoni_xifrat) between 40 and 4096 and testimoni_xifrat ~ '^[A-Za-z0-9+/]+={0,2}$'),
  desat_al         timestamptz not null default now(),
  intents          integer not null default 0,
  ultim_error      text
    constraint autoritzacions_apple_error_llarg
    check (ultim_error is null or char_length(ultim_error) <= 200),
  ultim_intent_al  timestamptz
);
alter table private.autoritzacions_apple enable row level security;
revoke all on table private.autoritzacions_apple from public, anon, authenticated, service_role;

-- ── 2 · El registre: sense clau forana i sense cap dada en clar ─────────────
create table if not exists private.revocacions_apple (
  id            bigint generated always as identity primary key,
  subjecte_hash text,
  origen        text not null
    constraint revocacions_apple_origen_valid
    check (origen in ('baixa', 'cron', 'purga')),
  resultat      text not null
    constraint revocacions_apple_resultat_valid
    check (resultat in ('revocat', 'ja_invalid', 'sense_testimoni', 'purgat_sense_revocar')),
  detall        text
    constraint revocacions_apple_detall_llarg
    check (detall is null or char_length(detall) <= 200),
  al            timestamptz not null default now()
);
alter table private.revocacions_apple enable row level security;
revoke all on table private.revocacions_apple from public, anon, authenticated, service_role;
create index if not exists idx_revocacions_apple_al on private.revocacions_apple (al desc);
create index if not exists idx_revocacions_apple_subjecte on private.revocacions_apple (subjecte_hash, al desc);

-- ── 3 · Les RPC de la funció compte-apple (només service_role) ──────────────
create or replace function public.apple_desa_autoritzacio(p_user_id uuid, p_sub text, p_client_id text, p_xifrat text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-APPLE-000: només el servidor.' using errcode = '42501';
  end if;
  if p_user_id is null or p_sub is null or char_length(p_sub) not between 1 and 255
     or p_client_id is null or p_client_id !~ '^[A-Za-z0-9][A-Za-z0-9.-]{0,254}$'
     or p_xifrat is null or char_length(p_xifrat) not between 40 and 4096 or p_xifrat !~ '^[A-Za-z0-9+/]+={0,2}$' then
    raise exception 'SDP-APPLE-002: les dades de l''autorització no són vàlides.' using errcode = '22023';
  end if;
  -- El vincle A/B: només es desa per a la persona que té ESTA identitat d'Apple.
  if not exists (select 1 from auth.identities i
                  where i.user_id = p_user_id and i.provider = 'apple' and i.provider_id = p_sub) then
    raise exception 'SDP-APPLE-001: el subjecte no és la identitat d''Apple de la persona.' using errcode = '42501';
  end if;
  -- Una entrada nova substituïx l'anterior sense revocar-la: revocar-la
  -- trauria l'autorització que la persona acaba de donar.
  insert into private.autoritzacions_apple (user_id, client_id, testimoni_xifrat, desat_al, intents, ultim_error, ultim_intent_al)
  values (p_user_id, p_client_id, p_xifrat, now(), 0, null, null)
  on conflict (user_id) do update
     set client_id = excluded.client_id,
         testimoni_xifrat = excluded.testimoni_xifrat,
         desat_al = excluded.desat_al,
         intents = 0,
         ultim_error = null,
         ultim_intent_al = null;
  return jsonb_build_object('desat', true);
end;
$$;
revoke all on function public.apple_desa_autoritzacio(uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.apple_desa_autoritzacio(uuid, text, text, text) to service_role;

create or replace function public.apple_autoritzacio_de(p_user_id uuid)
returns table (client_id text, testimoni_xifrat text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-APPLE-000: només el servidor.' using errcode = '42501';
  end if;
  return query
    select a.client_id, a.testimoni_xifrat
      from private.autoritzacions_apple a
     where a.user_id = p_user_id;
end;
$$;
revoke all on function public.apple_autoritzacio_de(uuid) from public, anon, authenticated, service_role;
grant execute on function public.apple_autoritzacio_de(uuid) to service_role;

create or replace function public.apple_revocacions_pendents(p_limit integer default 50)
returns table (user_id uuid, client_id text, testimoni_xifrat text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-APPLE-000: només el servidor.' using errcode = '42501';
  end if;
  -- Les de les baixes demanades: les desades abans de demanar-la, i totes
  -- quan falta un dia per a la purga. Una fallida espera mitja hora.
  -- R1-01 (261024 correccions): primer les que no s'han provat mai i
  -- després les que fa més temps que es van provar. Una fila que falla passa
  -- al final de la cua i no tapa les altres hora rere hora.
  return query
    select a.user_id, a.client_id, a.testimoni_xifrat
      from private.autoritzacions_apple a
      join private.baixes b on b.user_id = a.user_id
     where (a.desat_al <= b.demanada_al or b.purga_prevista_al <= now() + interval '1 day')
       and (a.ultim_intent_al is null or a.ultim_intent_al < now() - interval '30 minutes')
     order by a.ultim_intent_al asc nulls first, b.purga_prevista_al, a.user_id
     limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;
revoke all on function public.apple_revocacions_pendents(integer) from public, anon, authenticated, service_role;
grant execute on function public.apple_revocacions_pendents(integer) to service_role;

create or replace function public.apple_registra_revocacio(
  p_user_id  uuid,
  p_origen   text,
  p_resultat text,
  p_xifrat   text default null,
  p_detall   text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-APPLE-000: només el servidor.' using errcode = '42501';
  end if;
  -- El detall és vocabulari tancat de la funció (config:invalid_client,
  -- reintenta:503…): mai un testimoni ni el cos d'Apple.
  if p_user_id is null or p_origen is null or p_origen not in ('baixa', 'cron')
     or p_resultat is null or p_resultat not in ('revocat', 'ja_invalid', 'sense_testimoni', 'fallida')
     or (p_resultat <> 'sense_testimoni' and p_xifrat is null)
     or (p_detall is not null and p_detall !~ '^[a-z0-9_:-]{1,60}$') then
    raise exception 'SDP-APPLE-002: les dades de la revocació no són vàlides.' using errcode = '22023';
  end if;

  if p_resultat = 'fallida' then
    update private.autoritzacions_apple a
       set intents = a.intents + 1,
           ultim_error = left(p_detall, 200),
           ultim_intent_al = now()
     where a.user_id = p_user_id and a.testimoni_xifrat = p_xifrat;
    return;
  end if;

  if p_resultat = 'sense_testimoni' then
    if exists (select 1 from private.autoritzacions_apple a where a.user_id = p_user_id) then
      return;
    end if;
    -- R1-03 (261024 correccions): un 'sense_testimoni' és d'una baixa que
    -- existix, i com a molt un per persona cada 24 hores. La funció el demana
    -- just ABANS de demana_baixa: la primera vegada encara no hi ha baixa i
    -- no es registra res (no s'ha revocat res); qui crida la funció sense
    -- donar-se de baixa no fa créixer el registre.
    if not exists (select 1 from private.baixes b where b.user_id = p_user_id) then
      return;
    end if;
    if exists (select 1 from private.revocacions_apple r
                where r.subjecte_hash = private.hash_subjecte(p_user_id::text)
                  and r.resultat = 'sense_testimoni'
                  and r.al > now() - interval '24 hours') then
      return;
    end if;
  else
    -- Terminal: només el xifrat que s'ha revocat. Si una entrada nova l'ha
    -- substituït entremig, o una altra crida ja l'ha registrat, no es toca res.
    delete from private.autoritzacions_apple a
     where a.user_id = p_user_id and a.testimoni_xifrat = p_xifrat;
    get diagnostics v_n = row_count;
    if v_n = 0 then
      return;
    end if;
  end if;

  insert into private.revocacions_apple (subjecte_hash, origen, resultat, detall)
  values (private.hash_subjecte(p_user_id::text), p_origen, p_resultat, p_detall);
end;
$$;
revoke all on function public.apple_registra_revocacio(uuid, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.apple_registra_revocacio(uuid, text, text, text, text) to service_role;

notify pgrst, 'reload schema';

commit;
