-- ============================================================================
-- 261102_0417 · B8-SERVIDOR (marató 261101_2143; ordre del Mestre 261101) ·
-- Els avisos push del Xat al servidor: els dispositius, el silenci per
-- conversa i la cua del worker notifica-xat (spec B8-SERVIDOR §2, subcarril
-- S1; el contracte amb el client és el de §2.9)
--
-- PER QUÈ: src/pwa/avisosPush.js i src/natiu/avisosPushNatius.js (fase N1,
-- inerts) esperen un servidor que guarde l'endpoint web o el testimoni natiu i
-- que, quan arriba un missatge, desperte els aparells dels altres membres del
-- fil. Fins ara no hi havia ni taula ni RPC, i el silenci per conversa
-- (xat_participants.silenciat_fins_al, 2609270200) es podia llegir però cap
-- RPC no el podia escriure (authenticated no té UPDATE a xat_participants des
-- de 2609272200).
--
-- QUÈ FA:
--   1. private.xat_push_adreca_valida(tipus, adreca): la llista blanca dels
--      serveis de push (la mateixa que SERVEIS_DE_PUSH de
--      src/pwa/avisosPush.js) i la forma dels testimonis APNs i FCM. Pura.
--   2. public.xat_dispositius_push: un aparell per fila (tipus web, apns o
--      fcm; l'adreça única per tipus; la llengua de l'avís; la caducitat i la
--      darrera renovació). RLS: cadascú només veu les seues files, i
--      authenticated només pot llegir columnes sense l'adreça.
--   3. public.xat_push_desa i public.xat_push_retira (authenticated; el
--      contracte de B8-CLIENT: plataforma 'web', 'ios' o 'android'): desar
--      només amb els avisos encesos al node (private.ajustos 'push_xat_actiu'
--      = 'si'); una adreça d'una altra persona només canvia d'amo amb
--      p_gest = true (activació amb un gest; sense, SDP-PUSH-011); deu
--      aparells per persona com a molt (s'esborra el més antic). Retirar
--      funciona sempre.
--   4. public.xat_silencia(fil, durada) (authenticated): '8h', '1setmana',
--      'sempre' o 'cap', amb el rellotge del servidor. «Sempre» és
--      9999-12-31 00:00:00 UTC (mai infinity, i en l'any 9999 en qualsevol
--      zona horària).
--   5. private.xat_push_cua, private.xat_push_encua() i el disparador
--      xat_missatges_push_encua: cada missatge nou (no de sistema) entra a la
--      cua NOMÉS si 'push_xat_actiu' = 'si', i cada missatge esborra com a
--      molt 100 files de més d'una hora (la retenció no depén del worker).
--      Cap error de la cua no pot aturar l'enviament d'un missatge.
--   6. Les RPC del worker (només service_role, amb la guarda d'auth.role()):
--      xat_push_reclama (buida un lot de la cua i torna els aparells que cal
--      despertar: com a molt 5.000 i 1.800.000 octets de JSON, perquè el
--      worker en llig 2 MiB), xat_push_expulsa (404/410), xat_push_neteja
--      (aparells caducats o sense renovar i cua vella), xat_push_credencial i
--      xat_push_desa_credencial (el testimoni d'APNs i el d'OAuth de FCM, que
--      no es poden refer a cada passada). La cua i les credencials són
--      taules privades amb RLS i sense cap política: només hi entren estes
--      funcions.
--
-- QUÈ NO FA:
--   · No envia res ni crida cap servei de fora: ho fa la funció notifica-xat.
--   · No usa pg_net, ni Vault, ni cap secret: el worker el desperta el cron.
--   · No encén res: sense 'push_xat_actiu' = 'si' la cua no creix i desar
--     dona SDP-PUSH-010.
--   · No guarda les claus de xifratge de la subscripció web (p256dh, auth):
--     el push és un despertador cec, sense cos.
--   · No envia el fil ni el remitent a cap servei de push: els avisos natius
--     porten només el text cec en la llengua de l'aparell.
--   · No toca exporta_les_meues_dades (decisió del Mestre D-B8S-7).
--
-- CODIS:
--   SDP-PUSH-000 només el servidor (42501)
--   SDP-PUSH-001 cal la sessió iniciada (42501)
--   SDP-PUSH-002 plataforma invàlida (22023)
--   SDP-PUSH-003 adreça o servei de push no admés (22023)
--   SDP-PUSH-004 caducitat invàlida o passada (22023)
--   SDP-PUSH-005 paràmetre del worker invàlid (22023)
--   SDP-PUSH-010 els avisos push no estan encesos en este node (55000)
--   SDP-PUSH-011 l'aparell és d'una altra sessió; cal el gest (42501)
--   SDP-PUSH-900 avís: no s'ha pogut encuar (warning, mai error)
--   SDP-XAT-001  cal la sessió iniciada (42501)
--   SDP-XAT-006  no eres membre actiu del fil (42501)
--   SDP-XAT-050  durada del silenci invàlida (22023)
--
-- Depén de: 2609080000 (private.ajustos), 2609261500 (private.baixes),
-- 2609270200 (xat_participants.silenciat_fins_al, avisos, arxivat_al,
-- visible_fins_seq, com_org_id; xat_missatges.tipus, resposta_a, esborrat_al;
-- xat_fils.tipus, comunitat_id), 2609272200 (xat_missatges.com_org_id), 2609282100
-- (private.xat_participant_vigent v3, xat_fils.subjecte_tipus), 2610201500
-- (public.bloquejos).
--
-- ORDRE (decisió del Mestre): additiva; en qualsevol moment després de
-- 2610201500. Després: el desplegament de notifica-xat i el cron; només
-- després, 'push_xat_actiu' = 'si' (si s'encén abans, no ix cap avís i la
-- cua es poda sola: res de més d'una hora). Per a apagar, al revés: primer
-- l'ajust i després `delete from private.xat_push_cua;`.
-- Verificació posterior (lectura):
--   select to_regclass('public.xat_dispositius_push') is not null as te_dispositius, to_regprocedure('public.xat_silencia(uuid, text)') is not null as te_silenci, has_function_privilege('authenticated', 'public.xat_push_reclama(integer)', 'execute') as authenticated_reclama, coalesce((select valor from private.ajustos where clau = 'push_xat_actiu'), 'no') as actiu;
--   (cert, cert, fals i no).
-- Idempotent i en una sola transacció.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · La llista blanca i la forma de l'adreça ────────────────────────────
-- web: https, ASCII visible, sense fragment, credencials ni port, l'amfitrió
-- en minúscula i d'un servei conegut (contra SSRF; el worker ho torna a
-- mirar). apns: el testimoni en hexadecimal. fcm: el de registre de FCM.
create or replace function private.xat_push_adreca_valida(p_tipus text, p_adreca text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_resta text;
  v_host  text;
begin
  if p_tipus is null or p_adreca is null then
    return false;
  end if;
  if p_tipus = 'apns' then
    return p_adreca ~ '^[0-9a-f]{64,200}$';
  end if;
  if p_tipus = 'fcm' then
    return char_length(p_adreca) between 32 and 1024 and p_adreca ~ '^[A-Za-z0-9_:-]+$';
  end if;
  if p_tipus <> 'web' then
    return false;
  end if;
  if char_length(p_adreca) > 2048 or p_adreca !~ '^https://[!-~]+$' or position('#' in p_adreca) > 0 then
    return false;
  end if;
  v_resta := substr(p_adreca, 9);
  if position('/' in v_resta) = 0 then
    return false;
  end if;
  v_host := split_part(v_resta, '/', 1);
  if v_host !~ '^[a-z0-9.-]{1,253}$' or left(v_host, 1) = '.' or position('..' in v_host) > 0 then
    return false;
  end if;
  return v_host in ('fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.apple.com', 'notify.windows.com')
      or v_host like '%.push.apple.com'
      or v_host like '%.notify.windows.com';
end;
$$;
revoke all on function private.xat_push_adreca_valida(text, text) from public, anon, authenticated, service_role;


-- ── 2 · Els aparells ────────────────────────────────────────────────────────
create table if not exists public.xat_dispositius_push (
  id         uuid primary key default gen_random_uuid(),
  usuari_id  uuid not null references auth.users (id) on delete cascade,
  tipus      text not null
    constraint xat_dispositius_push_tipus_valid check (tipus in ('web', 'apns', 'fcm')),
  adreca     text not null,
  llengua    text not null default 'ca'
    constraint xat_dispositius_push_llengua_valida check (llengua in ('ca', 'es', 'en', 'eu', 'gl')),
  caduca_al  timestamptz,
  creat_al   timestamptz not null default now(),
  renovat_al timestamptz not null default now(),
  constraint xat_dispositius_push_adreca_forma check (
    (tipus = 'web' and char_length(adreca) <= 2048 and adreca ~ '^https://[a-z0-9.-]+/[!-~]*$')
    or (tipus = 'apns' and adreca ~ '^[0-9a-f]{64,200}$')
    or (tipus = 'fcm' and char_length(adreca) between 32 and 1024 and adreca ~ '^[A-Za-z0-9_:-]+$')),
  constraint xat_dispositius_push_unic unique (tipus, adreca)
);
create index if not exists xat_dispositius_push_usuari_idx
  on public.xat_dispositius_push (usuari_id, renovat_al desc);

alter table public.xat_dispositius_push enable row level security;
revoke all on table public.xat_dispositius_push from public, anon, authenticated, service_role;
-- Cap columna d'adreça: l'endpoint és una URL de capacitat.
grant select (id, usuari_id, tipus, llengua, caduca_al, creat_al, renovat_al)
  on table public.xat_dispositius_push to authenticated;
drop policy if exists "xat_dispositius_push_propis" on public.xat_dispositius_push;
create policy "xat_dispositius_push_propis" on public.xat_dispositius_push
  for select to authenticated
  using (usuari_id = (select auth.uid()));


-- ── 3 · Desar i retirar un aparell (authenticated) ──────────────────────────
-- Contracte de B8-CLIENT (§9.1, reconciliat a l'esmena ARB-B8S-01): la
-- plataforma és la del client ('web', 'ios', 'android') i el servidor la
-- passa al tipus intern ('web', 'apns', 'fcm'); el testimoni d'iOS es desa en
-- minúscula. Coacció primitiva: cap jsonb d'entrada. Una adreça d'una altra
-- persona només canvia d'amo amb p_gest = true (l'activació amb un gest):
-- la sincronització sense gest no inscriu mai la persona següent d'un aparell
-- compartit (ARB-B8S-04) i rep SDP-PUSH-011 (el client desfà la subscripció).
create or replace function public.xat_push_desa(
  p_plataforma text,
  p_adreca     text,
  p_caduca_al  timestamptz default null,
  p_llengua    text default null,
  p_gest       boolean default false
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo      uuid := (select auth.uid());
  v_tipus   text;
  v_adreca  text;
  v_llengua text := lower(btrim(coalesce(p_llengua, '')));
  v_gest    boolean := coalesce(p_gest, false);
  v_n       integer;
begin
  if v_jo is null then
    raise exception 'SDP-PUSH-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_actiu'), '') <> 'si' then
    raise exception 'SDP-PUSH-010: els avisos push no estan encesos en este node.' using errcode = '55000';
  end if;
  v_tipus := case p_plataforma when 'web' then 'web' when 'ios' then 'apns' when 'android' then 'fcm' else null end;
  if v_tipus is null then
    raise exception 'SDP-PUSH-002: plataforma invàlida.' using errcode = '22023';
  end if;
  v_adreca := case when v_tipus = 'apns' then lower(p_adreca) else p_adreca end;
  if not private.xat_push_adreca_valida(v_tipus, v_adreca) then
    raise exception 'SDP-PUSH-003: adreça o servei de push no admés.' using errcode = '22023';
  end if;
  if p_caduca_al is not null and (not isfinite(p_caduca_al) or p_caduca_al <= now()) then
    raise exception 'SDP-PUSH-004: caducitat invàlida o passada.' using errcode = '22023';
  end if;
  if v_llengua not in ('ca', 'es', 'en', 'eu', 'gl') then
    v_llengua := 'ca';
  end if;

  -- Atòmic: el canvi d'amo i la comprovació del gest van en la mateixa ordre.
  insert into public.xat_dispositius_push as d (usuari_id, tipus, adreca, llengua, caduca_al)
  values (v_jo, v_tipus, v_adreca, v_llengua, p_caduca_al)
  on conflict (tipus, adreca) do update
    set usuari_id  = excluded.usuari_id,
        llengua    = excluded.llengua,
        caduca_al  = excluded.caduca_al,
        renovat_al = now()
    where d.usuari_id = excluded.usuari_id or v_gest;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    raise exception 'SDP-PUSH-011: este aparell és d''una altra sessió; cal activar-lo amb un gest.' using errcode = '42501';
  end if;

  -- Deu aparells per persona com a molt: el més antic se'n va.
  delete from public.xat_dispositius_push d
   where d.usuari_id = v_jo
     and d.id in (select x.id from public.xat_dispositius_push x
                   where x.usuari_id = v_jo
                   order by x.renovat_al desc, x.id desc
                   offset 10);
end;
$$;

-- Retirar funciona amb els avisos apagats: és la baixa en eixir. Idempotent.
create or replace function public.xat_push_retira(p_plataforma text, p_adreca text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo    uuid := (select auth.uid());
  v_tipus text := case p_plataforma when 'web' then 'web' when 'ios' then 'apns' when 'android' then 'fcm' else null end;
begin
  if v_jo is null then
    raise exception 'SDP-PUSH-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  delete from public.xat_dispositius_push d
   where d.usuari_id = v_jo
     and d.tipus = v_tipus
     and d.adreca = case when v_tipus = 'apns' then lower(p_adreca) else p_adreca end;
end;
$$;


-- ── 4 · Silenciar una conversa (authenticated) ──────────────────────────────
-- Contracte de B8-CLIENT: una durada tancada, i la data de fi la calcula el
-- rellotge del servidor. «Sempre» és 9999-12-31 00:00:00 UTC: una data finita
-- (esSilenciat, src/sections/xat/missatges.js, llig 'infinity' com a «no
-- silenciat») i que continua en l'any 9999 en qualsevol zona horària de la
-- sessió (23:59:59 UTC es mostraria com a 10000-01-01 a Europe/Madrid, i
-- new Date() en fa NaN). 'cap' lleva el silenci.
create or replace function public.xat_silencia(p_fil_id uuid, p_durada text)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo   uuid := (select auth.uid());
  v_fins timestamptz;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or p_durada is null or p_durada not in ('8h', '1setmana', 'sempre', 'cap') then
    raise exception 'SDP-XAT-050: durada del silenci invàlida.' using errcode = '22023';
  end if;
  v_fins := case p_durada
              when '8h'       then now() + interval '8 hours'
              when '1setmana' then now() + interval '7 days'
              when 'sempre'   then timestamptz '9999-12-31 00:00:00+00'
              else null
            end;
  update public.xat_participants p
     set silenciat_fins_al = v_fins
   where p.fil_id = p_fil_id
     and p.usuari_id = v_jo
     and p.visible_fins_seq is null
     and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;
  return v_fins;
end;
$$;


-- ── 5 · La cua i el disparador ──────────────────────────────────────────────
-- Una fila per missatge, sense FK: és transitòria. El worker la buida.
create table if not exists private.xat_push_cua (
  id          bigint generated always as identity primary key,
  fil_id      uuid not null,
  missatge_id uuid not null,
  autor_id    uuid,
  com_org_id  uuid,
  resposta_a  uuid,
  creat_al    timestamptz not null default now()
);
create index if not exists xat_push_cua_creat_idx on private.xat_push_cua (creat_al);
-- RLS sense cap política (ARB-P01-03), com les cues privades de 2611020106:
-- ningú no hi entra directament; les funcions de l'amo (definer) la salten.
alter table private.xat_push_cua enable row level security;
revoke all on table private.xat_push_cua from public, anon, authenticated, service_role;

-- Mai atura un missatge: qualsevol error es queda en un avís. La retenció
-- (una hora) no depén del worker (ARB-B8S-03): cada missatge esborra com a
-- molt 100 files velles, sense esperar cap bloqueig (skip locked), també amb
-- els avisos apagats. Sense res vell, és una sola consulta a l'índex.
create or replace function private.xat_push_encua()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.xat_push_cua c
   where c.id in (select q.id from private.xat_push_cua q
                   where q.creat_al < now() - interval '1 hour'
                   order by q.creat_al
                   limit 100
                   for update skip locked);
  if coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_actiu'), '') = 'si' then
    insert into private.xat_push_cua (fil_id, missatge_id, autor_id, com_org_id, resposta_a)
    values (new.fil_id, new.id, new.usuari_id, new.com_org_id, new.resposta_a);
  end if;
  return null;
exception when others then
  raise warning 'SDP-PUSH-900: no s''ha pogut encuar l''avís (%).', sqlstate;
  return null;
end;
$$;
revoke all on function private.xat_push_encua() from public, anon, authenticated, service_role;

drop trigger if exists xat_missatges_push_encua on public.xat_missatges;
create trigger xat_missatges_push_encua
  after insert on public.xat_missatges
  for each row
  when (new.tipus is distinct from 'sistema' and new.usuari_id is not null)
  execute function private.xat_push_encua();


-- ── 6 · Les credencials dels proveïdors natius (només el worker) ───────────
-- APNs no deixa refer el testimoni més d'una vegada cada 20 minuts; el
-- d'OAuth de FCM dura una hora. Caduquen soles: com a molt 65 minuts.
create table if not exists private.xat_push_credencials (
  proveidor text primary key
    constraint xat_push_credencials_proveidor_valid check (proveidor in ('apns', 'fcm')),
  valor     text not null
    constraint xat_push_credencials_valor_forma check (char_length(valor) between 20 and 4096 and valor ~ '^[A-Za-z0-9._-]+$'),
  caduca_al timestamptz not null
);
-- RLS sense cap política (ARB-P01-03): el testimoni vigent només el llig el worker.
alter table private.xat_push_credencials enable row level security;
revoke all on table private.xat_push_credencials from public, anon, authenticated, service_role;


-- ── 7 · Les RPC del worker notifica-xat (només service_role) ───────────────
-- Un lot de la cua: s'esborra en reclamar-lo (com a molt una vegada: un avís
-- perdut no és greu, un de repetit molesta). Els missatges de més de 15
-- minuts, o esborrats, ja no avisen. Destinataris: els membres actius i
-- vigents del fil, menys l'autor, els del mateix costat d'una entitat, qui
-- l'ha silenciat o arxivat, qui té els avisos a 'cap' (o 'destacats' i no és
-- una resposta seua), qui ha bloquejat l'autor o l'entitat i qui ha demanat
-- la baixa. Només fils directes, i canals i grups fora de comunitats i
-- pàgines: el General i els Avisos d'una pàgina o comunitat (difusió a tots
-- els que hi entren) només amb 'push_xat_generals' = 'si' (ARB-B8S-07). Un
-- aparell surt una vegada per lot encara que hi haja molts missatges; com a
-- molt 5.000 per lot, en ordre aleatori perquè el retall no deixe sempre fora
-- els mateixos (ARB-B8S-06), i com a molt 1.800.000 octets de JSON perquè el
-- worker el puga llegir sencer (ARB-P01-02); 'retallats' diu quants s'han
-- quedat fora.
create or replace function public.xat_push_reclama(p_limit integer default 50)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_lot         integer := greatest(1, least(coalesce(p_limit, 50), 200));
  v_dies        integer;
  v_generals    boolean;
  v_missatges   integer;
  v_retallats   integer;
  v_dispositius jsonb;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
      from private.ajustos a where a.clau = 'push_xat_dies_dispositiu';
  exception when invalid_text_representation or numeric_value_out_of_range then
    -- Un valor que no és un enter de 32 bits cau en 60 (mai atura el worker).
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 60);
  v_generals := coalesce((select a.valor from private.ajustos a where a.clau = 'push_xat_generals'), '') = 'si';

  with lot as (
    delete from private.xat_push_cua c
     where c.id in (select q.id from private.xat_push_cua q
                     order by q.id
                     limit v_lot
                     for update skip locked)
    returning c.fil_id, c.missatge_id, c.autor_id, c.com_org_id, c.resposta_a, c.creat_al
  ),
  vigents as (
    select l.*
      from lot l
     where l.creat_al > now() - interval '15 minutes'
       and exists (select 1 from public.xat_missatges m
                    where m.id = l.missatge_id and m.esborrat_al is null)
  ),
  destinataris as (
    select distinct p.usuari_id
      from vigents v
      join public.xat_fils f on f.id = v.fil_id
      join public.xat_participants p on p.fil_id = v.fil_id
     where p.usuari_id is distinct from v.autor_id
       and p.visible_fins_seq is null
       and p.arxivat_al is null
       and (p.silenciat_fins_al is null or p.silenciat_fins_al <= now())
       and (p.avisos = 'tots'
            or (p.avisos = 'destacats' and v.resposta_a is not null
                and exists (select 1 from public.xat_missatges r
                             where r.id = v.resposta_a and r.usuari_id = p.usuari_id)))
       and not (v.com_org_id is not null and p.com_org_id is not distinct from v.com_org_id)
       and (f.tipus = 'directe'
            or (f.tipus in ('canal', 'grup')
                and ((f.comunitat_id is null and f.subjecte_tipus is null) or v_generals)))
       and private.xat_participant_vigent(v.fil_id, p.usuari_id)
       and not exists (select 1 from public.bloquejos b
                        where b.bloquejador = p.usuari_id
                          and ((b.bloquejat_tipus = 'persona' and b.bloquejat_persona = v.autor_id)
                            or (b.bloquejat_tipus = 'entitat' and v.com_org_id is not null
                                and b.bloquejat_entitat = v.com_org_id)))
       and not exists (select 1 from private.baixes bx where bx.user_id = p.usuari_id)
  ),
  candidats as (
    select d.id, d.tipus, d.adreca, d.llengua
      from destinataris x
      join public.xat_dispositius_push d on d.usuari_id = x.usuari_id
     where (d.caduca_al is null or d.caduca_al > now())
       and d.renovat_al > now() - make_interval(days => v_dies)
  ),
  mostra as (
    select jsonb_build_object('id', c.id, 'tipus', c.tipus, 'adreca', c.adreca, 'llengua', c.llengua) as fila,
           random() as atzar
      from candidats c
     order by atzar
     limit 5000
  ),
  -- ARB-P01-02: el worker no llig mai més de 2 MiB (MAXIM_COS_BASE) i el lot
  -- ja és esborrat. Es mesura el JSON mateix que ix (amb les cometes
  -- escapades) i es queda un prefix de l'ordre aleatori.
  dispositius as (
    select f.fila
      from (select m.fila,
                   sum(octet_length(m.fila::text) + 2)
                     over (order by m.atzar rows between unbounded preceding and current row) as octets
              from mostra m) f
     where f.octets <= 1800000
  )
  select (select count(*) from lot)::integer,
         (select count(*) from candidats)::integer - (select count(*) from dispositius)::integer,
         coalesce((select jsonb_agg(s.fila) from dispositius s), '[]'::jsonb)
    into v_missatges, v_retallats, v_dispositius;

  return jsonb_build_object('missatges', v_missatges, 'retallats', v_retallats, 'dispositius', v_dispositius);
end;
$$;

-- 404 o 410 del servei de push: l'aparell ja no hi és.
create or replace function public.xat_push_expulsa(p_ids uuid[])
returns integer
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
  if p_ids is null or cardinality(p_ids) not between 1 and 1000 then
    raise exception 'SDP-PUSH-005: paràmetre del worker invàlid.' using errcode = '22023';
  end if;
  delete from public.xat_dispositius_push d where d.id = any (p_ids);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Aparells caducats o sense renovar (60 dies per defecte) i cua de més d'una
-- hora (el worker no hi era). Com a molt 1.000 aparells per crida.
create or replace function public.xat_push_neteja()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_dies        integer;
  v_dispositius integer;
  v_cua         integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
      from private.ajustos a where a.clau = 'push_xat_dies_dispositiu';
  exception when invalid_text_representation or numeric_value_out_of_range then
    -- Un valor que no és un enter de 32 bits cau en 60 (mai atura el worker).
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 60);

  delete from public.xat_dispositius_push d
   where d.id in (select x.id from public.xat_dispositius_push x
                   where (x.caduca_al is not null and x.caduca_al <= now())
                      or x.renovat_al <= now() - make_interval(days => v_dies)
                   limit 1000);
  get diagnostics v_dispositius = row_count;

  delete from private.xat_push_cua c where c.creat_al <= now() - interval '1 hour';
  get diagnostics v_cua = row_count;

  return jsonb_build_object('dispositius', v_dispositius, 'cua', v_cua);
end;
$$;

-- La credencial vigent d'un proveïdor (amb cinc minuts de marge), o null.
create or replace function public.xat_push_credencial(p_proveidor text)
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
  return (select c.valor from private.xat_push_credencials c
           where c.proveidor = p_proveidor and c.caduca_al > now() + interval '5 minutes');
end;
$$;

-- Desa una credencial nova només si dura més que la que hi ha.
create or replace function public.xat_push_desa_credencial(p_proveidor text, p_valor text, p_caduca_al timestamptz)
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
     or p_valor is null or char_length(p_valor) not between 20 and 4096 or p_valor !~ '^[A-Za-z0-9._-]+$'
     or p_caduca_al is null or not isfinite(p_caduca_al)
     or p_caduca_al <= now() or p_caduca_al > now() + interval '65 minutes' then
    raise exception 'SDP-PUSH-005: paràmetre del worker invàlid.' using errcode = '22023';
  end if;
  insert into private.xat_push_credencials as c (proveidor, valor, caduca_al)
  values (p_proveidor, p_valor, p_caduca_al)
  on conflict (proveidor) do update
    set valor = excluded.valor, caduca_al = excluded.caduca_al
    where c.caduca_al < excluded.caduca_al;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;


-- ── 8 · Qui pot cridar què ──────────────────────────────────────────────────
revoke all on function public.xat_push_desa(text, text, timestamptz, text, boolean) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_retira(text, text) from public, anon, authenticated, service_role;
revoke all on function public.xat_silencia(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_reclama(integer) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_expulsa(uuid[]) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_neteja() from public, anon, authenticated, service_role;
revoke all on function public.xat_push_credencial(text) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_desa_credencial(text, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.xat_push_desa(text, text, timestamptz, text, boolean) to authenticated;
grant execute on function public.xat_push_retira(text, text) to authenticated;
grant execute on function public.xat_silencia(uuid, text) to authenticated;
grant execute on function public.xat_push_reclama(integer) to service_role;
grant execute on function public.xat_push_expulsa(uuid[]) to service_role;
grant execute on function public.xat_push_neteja() to service_role;
grant execute on function public.xat_push_credencial(text) to service_role;
grant execute on function public.xat_push_desa_credencial(text, text, timestamptz) to service_role;

notify pgrst, 'reload schema';

commit;
