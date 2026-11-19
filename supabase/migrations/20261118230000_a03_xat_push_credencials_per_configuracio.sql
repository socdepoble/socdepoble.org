-- ============================================================================
-- 20261118230000 · P1-74 (A-03) · Dues configuracions natives de push alhora
--
-- PER QUÈ: private.xat_push_credencials (2611020417) guarda UNA credencial
-- per proveïdor (el JWT d'APNs i el testimoni d'OAuth de FCM). Mentre es
-- roten SDP_APNS_* o SDP_FCM_COMPTE_SERVEI, conviuen treballadors amb la
-- configuració vella i amb la nova (notifica-xat, notifica-xat-desperta i
-- iaia no es despleguen en el mateix instant). Cadascun troba la credencial
-- de l'altre, no la creu (G1-B-doctr-02), en fa una de nova que dura més i
-- la substituïx: ping-pong, un JWT d'APNs nou a cada passada i el 429
-- TooManyProviderTokenUpdates d'Apple. Fins ara calia apagar el cron per a
-- rotar.
--
-- QUÈ FA (additiva; no toca cap objecte existent):
--   1. private.xat_push_credencials_v2: una credencial per (proveïdor,
--      empremta). L'empremta són 16 caràcters hexadecimals que el worker
--      calcula de la configuració pública (mai d'un secret en clar): dues
--      configuracions tenen dues files i no es trepitgen. RLS sense cap
--      política, com la taula v1.
--   2. public.xat_push_credencial_v2(p_proveidor, p_empremta): la credencial
--      vigent d'eixa configuració, amb els mateixos cinc minuts de marge que
--      la v1, o null.
--   3. public.xat_push_desa_credencial_v2(p_proveidor, p_empremta, p_valor,
--      p_caduca_al): les mateixes comprovacions que la v1 (SDP-PUSH-005) i
--      «desa només si dura més» dins de la mateixa configuració. Abans
--      d'escriure esborra les files caducades del proveïdor i, si ja n'hi ha
--      quatre de vives d'altres configuracions, no en desa cap més
--      (SDP-PUSH-014): la taula queda fitada sense dependre de la neteja.
--   4. Les dues RPC només per a service_role (amb la guarda d'auth.role()).
--
-- QUÈ NO FA:
--   · No canvia private.xat_push_credencials ni les RPC v1
--     (xat_push_credencial, xat_push_desa_credencial): un worker que encara
--     no s'ha tornat a desplegar continua llegint i desant la seua fila
--     única durant la transició, i el cron no s'ha d'aturar mai.
--   · No migra la fila v1: la primera passada del worker nou fa una
--     credencial per a la seua empremta (un sol JWT o intercanvi).
--   · No guarda cap clau privada ni cap secret de configuració: només la
--     credencial derivada que ja guardava la v1, que caduca sola (65 minuts
--     com a molt).
--
-- CODIS:
--   SDP-PUSH-000 només el servidor (42501)
--   SDP-PUSH-005 paràmetre del worker invàlid (22023)
--   SDP-PUSH-014 massa configuracions vives del proveïdor (54000)
--
-- Depén de: 2611020417 (les credencials v1 i el codi SDP-PUSH-005).
--
-- ORDRE (decisió del Mestre): additiva; en qualsevol moment després de
-- 2611020417, sense apagar el cron. Primer s'aplica esta migració i només
-- després es despleguen notifica-xat, notifica-xat-desperta i iaia amb el
-- natius.js que crida les _v2 (sense la migració, els natius responen
-- «reintenta» i el web push continua igual).
-- Verificació posterior (lectura):
--   select to_regclass('private.xat_push_credencials_v2') is not null as te_taula, to_regprocedure('public.xat_push_credencial_v2(text, text)') is not null as te_lectura, to_regprocedure('public.xat_push_desa_credencial_v2(text, text, text, timestamptz)') is not null as te_desament, has_function_privilege('authenticated', 'public.xat_push_desa_credencial_v2(text, text, text, timestamptz)', 'execute') as authenticated_desa;
--   (cert, cert, cert i fals).
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Una credencial per proveïdor i configuració ────────────────────────
create table if not exists private.xat_push_credencials_v2 (
  proveidor text not null
    constraint xat_push_credencials_v2_proveidor_valid check (proveidor in ('apns', 'fcm')),
  empremta  text not null
    constraint xat_push_credencials_v2_empremta_forma check (empremta ~ '^[0-9a-f]{16}$'),
  valor     text not null
    constraint xat_push_credencials_v2_valor_forma check (char_length(valor) between 20 and 4096 and valor ~ '^[A-Za-z0-9._-]+$'),
  caduca_al timestamptz not null,
  constraint xat_push_credencials_v2_pkey primary key (proveidor, empremta)
);
-- RLS sense cap política (com la v1): la credencial només la llig el worker.
alter table private.xat_push_credencials_v2 enable row level security;
revoke all on table private.xat_push_credencials_v2 from public, anon, authenticated, service_role;


-- ── 2 · Les RPC del worker (només service_role) ────────────────────────────
-- La credencial vigent d'una configuració (amb cinc minuts de marge), o null.
create or replace function public.xat_push_credencial_v2(p_proveidor text, p_empremta text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  return (select c.valor from private.xat_push_credencials_v2 c
           where c.proveidor = p_proveidor and c.empremta = p_empremta
             and c.caduca_al > now() + interval '5 minutes');
end;
$$;

-- Desa la credencial d'una configuració només si dura més que la que hi ha.
-- Les caducades del proveïdor s'esborren abans; com a molt quatre vives.
create or replace function public.xat_push_desa_credencial_v2(p_proveidor text, p_empremta text, p_valor text, p_caduca_al timestamptz)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  if p_proveidor is null or p_proveidor not in ('apns', 'fcm')
     or p_empremta is null or p_empremta !~ '^[0-9a-f]{16}$'
     or p_valor is null or char_length(p_valor) not between 20 and 4096 or p_valor !~ '^[A-Za-z0-9._-]+$'
     or p_caduca_al is null or not isfinite(p_caduca_al)
     or p_caduca_al <= now() or p_caduca_al > now() + interval '65 minutes' then
    raise exception 'SDP-PUSH-005: paràmetre del worker invàlid.' using errcode = '22023';
  end if;
  -- Un sol desament alhora per proveïdor: el sostre de quatre és exacte.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('sdp.xat_push_credencials_v2'), pg_catalog.hashtext(p_proveidor));
  delete from private.xat_push_credencials_v2 c
   where c.proveidor = p_proveidor and c.caduca_al <= now();
  if not exists (select 1 from private.xat_push_credencials_v2 c
                  where c.proveidor = p_proveidor and c.empremta = p_empremta)
     and (select count(*) from private.xat_push_credencials_v2 c where c.proveidor = p_proveidor) >= 4 then
    raise exception 'SDP-PUSH-014: massa configuracions vives del proveïdor.' using errcode = '54000';
  end if;
  insert into private.xat_push_credencials_v2 as c (proveidor, empremta, valor, caduca_al)
  values (p_proveidor, p_empremta, p_valor, p_caduca_al)
  on conflict (proveidor, empremta) do update
    set valor = excluded.valor, caduca_al = excluded.caduca_al
    where c.caduca_al < excluded.caduca_al;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;


-- ── 3 · Qui pot cridar què ──────────────────────────────────────────────────
revoke all on function public.xat_push_credencial_v2(text, text) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_desa_credencial_v2(text, text, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.xat_push_credencial_v2(text, text) to service_role;
grant execute on function public.xat_push_desa_credencial_v2(text, text, text, timestamptz) to service_role;

notify pgrst, 'reload schema';

commit;
