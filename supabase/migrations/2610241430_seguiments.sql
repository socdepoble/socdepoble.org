-- ============================================================================
-- 261024_1430 · T6b (IDEA-14) · Seguir una persona o una entitat: el
-- seguiment d'un sol sentit de «Connectar / Seguir».
-- Decisió del Mestre (261024; pla 261024_1315, T6): pots seguir una veïna o
-- una entitat; qui és seguit ho sap i veu qui el seguix; cap algoritme.
-- MANDAT SUPABASE 30-OCT-2026 (core-seguretat-audit, Llei E): la taula nova
-- de public porta els permisos explícits en la mateixa transacció (secció 2).
--
-- QUÈ FA:
--   1. public.seguiments · Una fila per parella, per sempre: qui seguix
--      (seguidor), a qui (seguit_tipus 'persona' amb seguit_persona, o
--      'entitat' amb seguit_entitat), el poble (tenant_id), quan la va seguir
--      la primera vegada (creat_al), quan la va tornar a seguir per última
--      vegada (reactivat_al, null si mai) i quan la va deixar de seguir
--      (deixat_al; null = seguiment viu). Deixar de seguir no esborra la
--      fila, la marca (esborrat suau): seguir i deixar de seguir en bucle no
--      reinicia el límit per hora ni torna a donar primer: true. Un sol
--      seguit per fila i del seu tipus, ningú no se seguix a si mateix i una
--      sola fila per parella (dos índexs únics parcials). RLS activa i cap
--      política: anon i authenticated no hi tenen cap permís de taula; tot
--      passa per les RPC.
--      I private.seguiments_altes (T2 261024_1800, P2-10; auditoria Codex
--      261024_1800 C6-01) · El registre de les altes: una fila per cada alta
--      o represa acceptada (qui seguix i quan, mai a qui), que cap baixa ni
--      cap represa no esborra ni sobreescriu. El límit per hora el compta
--      ací: abans comptava files de public.seguiments, i una parella
--      represa diverses vegades en una hora hi pesava una sola. A l'esquema
--      private (PostgREST no l'exposa), amb la RLS activa i cap permís per
--      a ningú: només segueix hi escriu.
--   2. Tres funcions privades (SECURITY DEFINER, search_path buit; cap client
--      no les pot cridar): private.poble_compartit (el poble de dues persones
--      que no han demanat la baixa, la regla de veïnatge de perfil_public),
--      private.bloqueig_de_seguiment (si un bloqueig de public.bloquejos els
--      separa, i de quina banda) i private.seguiment_viu (si un seguiment
--      encara val: el veïnatge, la baixa i la visibilitat; els bloquejos els
--      mira cada lectura, punt 6).
--   3. Cinc RPC SECURITY DEFINER, només per a authenticated, amb
--      (select auth.uid()):
--        segueix(p_tipus, p_id)          → { seguint: true, creat_al, nou, primer }  (idempotent)
--        deixa_de_seguir(p_tipus, p_id)  → { seguint: false }                (idempotent)
--        estat_seguiment(p_tipus, p_id)  → { seguint, creat_al }
--        els_meus_seguiments()           → (tipus, id, nom, creat_al)
--        qui_em_segueix(p_org_id)        → (id, nom, creat_al)
--      Sense p_org_id, qui seguix la persona que crida; amb p_org_id, qui
--      seguix eixa entitat, només per a qui l'administra (owner o admin).
--      creat_al, a l'eixida, és des de quan se seguix ara: reactivat_al si
--      s'ha tornat a seguir, si no creat_al.
--      primer és true NOMÉS quan la parella no havia tingut mai cap fila (la
--      primera vegada de totes); nou es conserva per compatibilitat i val el
--      mateix que primer. Tornar a seguir després de deixar-ho dona
--      nou: false i primer: false. El client envia l'avís al xat amb primer:
--      un sol avís per parella, per sempre.
--   4. Les regles de segueix: una persona, només si sou del mateix poble
--      (town_memberships, com public.perfil_public, 2610021520) i cap de les
--      dues no ha demanat la baixa; una entitat, si existix i és pública (o
--      en formes part), de qualsevol poble, si qui seguix no ha demanat la
--      baixa (com a seguiment_viu; Codex 261024_1800); mai tu mateix ni una entitat que
--      administres; cap bloqueig teu (una persona o una entitat que has
--      bloquejat: SDP-SEG-004); 30 altes o represes per hora (Gauntlet
--      261024_1945: Codex G-01, Gemini G1945-02), en una finestra lliscant
--      (les files de private.seguiments_altes de l'última hora: seguir,
--      deixar i tornar a seguir no en salta cap), una represa de la mateixa
--      parella com a molt cada 10 minuts, comptats des de l'última represa
--      o, si no n'hi ha cap, des de l'alta (Gemini G1945-03: la primera
--      represa ja no és lliure), i 1.000 seguiments
--      vius per persona, comptats sota el seu pany (pg_advisory_xact_lock):
--      el compte i l'anotació de l'alta van dins del pany i de la mateixa
--      transacció (dues crides alhora de la mateixa persona van en fila), i
--      l'instant de l'alta és el d'admetre-la (clock_timestamp() després del
--      pany), no el de començar la transacció: una crida que espera el pany
--      no anota una alta que ja ix de la finestra abans d'hora. El mateix
--      instant marca creat_al i reactivat_al i mesura l'espera de represa:
--      segueix no usa now() enlloc.
--      Tornar a seguir el que ja seguixes no és cap alta: idempotent, ni
--      compta ni avisa. El pany i el compte depenen del nivell READ
--      COMMITTED (el de PostgREST): cada sentència de segueix (volatile), un
--      cop té el pany, veu les altes de la crida anterior.
--   5. Les lectures només tornen seguiments vius (deixat_al null), amaguen
--      el que ara mateix tapen un bloqueig (del sentit del punt 6), una baixa
--      demanada o un canvi de poble, i van per data (des de quan se seguix
--      ara, la més nova primer), mai per cap puntuació. Com a molt, 1.000
--      files.
--   6. El bloqueig de l'altra banda és a l'ombra. Si la persona seguida, o
--      algú que administra l'entitat seguida, ha bloquejat qui seguix,
--      segueix funciona igual (crea o reprén la fila, viva, i torna
--      seguint: true amb el mateix primer) i estat_seguiment i
--      els_meus_seguiments no ho amaguen: les lectures de qui seguix només
--      amaguen el que tapa el seu propi bloqueig. Només qui_em_segueix, la
--      llista de qui és seguit, el deixa fora (els dos sentits). Qui ha estat
--      bloquejat no ho sap per esta via: cap codi no ho distingix. Bloquejar
--      no impedix que et seguisquen; només t'amaga qui et seguix.
--
-- QUÈ NO FA (decisions del Mestre pendents, supabase/README.md):
--   · El servidor no envia cap notificació: l'avís al xat l'envia el client
--     quan segueix torna primer: true (useSeguiment, T6a), una sola vegada
--     per parella. La constància és la llista de qui et seguix (el Perfil la
--     pinta) i, per a una entitat, la de qui l'administra.
--   · No recomana ningú ni ordena per cap algoritme.
--   · No esborra cap seguiment quan naix un bloqueig: les lectures l'amaguen
--     (punt 6) i, si es desbloqueja, torna.
--   · No esborra cap fila en deixar de seguir: la marca amb deixat_al. Les
--     files deixades no les veu ningú (cap lectura les torna) i només
--     compten per a primer i per a l'espera de represa; se'n van amb la
--     baixa del compte (on delete cascade). En naixen com a molt 30 per
--     hora, i mai més que les persones i entitats que es poden seguir. Quant de
--     temps es guarden, i si l'exportació les ha de donar, ho decidix el
--     Mestre (el text legal ho ha de dir).
--   · No guarda el registre de les altes gaire més enllà de l'hora que
--     compta: cada alta poda les de més d'una hora de qui seguix, i una purga
--     cada 10 minuts (pg_cron, si hi és) les de tothom, de manera que cap fila
--     no dura més d'una hora i deu minuts. Sense pg_cron, una fila vella es
--     queda fins a la pròxima alta de la mateixa persona o fins a la baixa
--     del compte (on delete cascade); la quota no la compta igualment. No diu
--     a qui has seguit, i l'exportació (2610241410) no el dona: és el
--     comptador del límit, no un historial.
--   · No compta els intents rebutjats (un error desfà la transacció
--     sencera, també la seua anotació): el límit és de les altes que
--     canvien alguna cosa i que poden fer avisar.
--   · No és mutu ni demana acceptació: és d'un sol sentit.
--   · No toca public.bloquejos ni cap altra taula, funció o política.
--   · L'exportació de dades (2610241410, T7) el llig amb to_regclass per les
--     columnes seguidor, seguit_tipus, seguit_persona, seguit_entitat,
--     creat_al i deixat_al (un seguiment viu és deixat_al is null): no se'n
--     canvia cap nom.
--
-- CODIS (missatges en valencià; l'adaptador els llig pel prefix):
--   SDP-SEG-000 cal la sessió iniciada (42501)
--   SDP-SEG-001 el tipus o l'identificador no són vàlids (22023)
--   SDP-SEG-002 no existix, no és del teu poble o no la pots seguir (22023)
--   SDP-SEG-003 no et pots seguir a tu mateix ni una entitat que administres (22023)
--   SDP-SEG-004 l'has bloquejada tu: cal desbloquejar-la abans (22023)
--   SDP-SEG-005 només qui administra l'entitat veu qui la seguix (42501)
--   SDP-SEG-006 massa seguiments: 30 altes o represes per hora, una represa
--               de la mateixa parella cada 10 minuts (també des de l'alta),
--               o 1.000 vius (42900)
--   Un bloqueig de l'altra banda no dona cap codi: és a l'ombra (punt 6).
--   Cap codi no és 404 (PostgREST el donaria per «esquema absent»).
--
-- Depén de: auth.users, public.towns, public.town_memberships,
-- public.organizations, public.organization_memberships i
-- private.can_manage_organization() (2609080000), i
-- public.profiles.baixa_demanada_at (2609261500); i, si hi és,
-- public.bloquejos (2610201500): sense ella, cap bloqueig no compta. La
-- purga horària del registre de les altes, de pg_cron si hi és (si no,
-- només la poda de cada alta: supabase/README.md).
--
-- Additiva i idempotent. Revisada i NO aplicada a cap base de dades.
-- L'aplica el Mestre, mai un agent.
-- Va ABANS de publicar el client: sense ella, Seguir diu NO-DISPONIBLE.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Els seguiments ──────────────────────────────────────────────────────
create table if not exists public.seguiments (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.towns (id) on delete cascade,
  seguidor       uuid not null references auth.users (id) on delete cascade,
  seguit_tipus   text not null
    constraint seguiments_tipus_valid check (seguit_tipus in ('persona', 'entitat')),
  seguit_persona uuid references auth.users (id) on delete cascade,
  seguit_entitat uuid references public.organizations (id) on delete cascade,
  creat_al       timestamptz not null default now(),
  reactivat_al   timestamptz,
  deixat_al      timestamptz,
  constraint seguiments_un_sol_seguit check (
    (seguit_tipus = 'persona' and seguit_persona is not null and seguit_entitat is null)
    or (seguit_tipus = 'entitat' and seguit_entitat is not null and seguit_persona is null)),
  constraint seguiments_no_autoseguiment check (seguidor <> seguit_persona)
);

-- Una sola fila per parella. Parcials: una fila d'entitat no topa amb cap de persona.
create unique index if not exists seguiments_persona_unic
  on public.seguiments (seguidor, seguit_persona) where seguit_tipus = 'persona';
create unique index if not exists seguiments_entitat_unic
  on public.seguiments (seguidor, seguit_entitat) where seguit_tipus = 'entitat';
-- Qui seguix una persona o una entitat, i el compte per hora de qui seguix, per data.
create index if not exists idx_seguiments_persona_creat
  on public.seguiments (seguit_persona, creat_al desc) where seguit_tipus = 'persona';
create index if not exists idx_seguiments_entitat_creat
  on public.seguiments (seguit_entitat, creat_al desc) where seguit_tipus = 'entitat';
create index if not exists idx_seguiments_seguidor_creat
  on public.seguiments (seguidor, creat_al desc);

alter table public.seguiments enable row level security;

-- T2 (261024_1800, P2-10; Codex C6-01) · El registre de les altes: una fila
-- per alta o represa acceptada. Cap columna diu a qui; cap UPDATE no la
-- toca; només la poda i la purga de més d'una hora l'esborren.
create table if not exists private.seguiments_altes (
  id        uuid primary key default gen_random_uuid(),
  seguidor  uuid not null references auth.users (id) on delete cascade,
  al        timestamptz not null default now()
);
create index if not exists idx_seguiments_altes_seguidor_al
  on private.seguiments_altes (seguidor, al desc);
alter table private.seguiments_altes enable row level security;

-- ── 2 · Permisos (mandat Supabase 30-Oct-2026): la llista sencera ──────────
-- Cap permís de taula per a anon ni authenticated, i cap política: el client
-- només hi entra per les RPC de la secció 4.
revoke all on table public.seguiments from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.seguiments to service_role;
-- El registre de les altes: cap permís per a ningú, ni service_role (com
-- private.autoritzacions_apple, 2610241420); només segueix (definer) hi entra.
revoke all on table private.seguiments_altes from public, anon, authenticated, service_role;

-- ── 3 · Les funcions privades ───────────────────────────────────────────────
-- El primer poble que compartixen dues persones (town_memberships), si cap de
-- les dues no ha demanat la baixa; null si no en compartixen cap. La regla de
-- veïnatge de public.perfil_public (2610021520).
create or replace function private.poble_compartit(p_a uuid, p_b uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tm_a.town_id
    from public.town_memberships tm_a
    join public.town_memberships tm_b on tm_b.town_id = tm_a.town_id
   where tm_a.user_id = p_a
     and tm_b.user_id = p_b
     and p_a <> p_b
     and exists (select 1 from public.profiles pa where pa.id = p_a and pa.baixa_demanada_at is null)
     and exists (select 1 from public.profiles pb where pb.id = p_b and pb.baixa_demanada_at is null)
   order by tm_a.town_id
   limit 1;
$$;
revoke all on function private.poble_compartit(uuid, uuid) from public, anon, authenticated, service_role;

-- Si un bloqueig de public.bloquejos (2610201500) separa qui seguix
-- (p_seguidor) del que seguix: 'seguidor' si l'ha posat qui seguix; 'seguit'
-- si l'ha posat la persona seguida, o algú que administra l'entitat seguida;
-- null si cap. Sense la taula, null: la moderació encara no hi és.
create or replace function private.bloqueig_de_seguiment(p_seguidor uuid, p_tipus text, p_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if to_regclass('public.bloquejos') is null then
    return null;
  end if;
  if exists (select 1 from public.bloquejos b
              where b.bloquejador = p_seguidor
                and ((p_tipus = 'persona' and b.bloquejat_persona = p_id)
                  or (p_tipus = 'entitat' and b.bloquejat_entitat = p_id))) then
    return 'seguidor';
  end if;
  if exists (select 1 from public.bloquejos b
              where b.bloquejat_persona = p_seguidor
                and ((p_tipus = 'persona' and b.bloquejador = p_id)
                  or (p_tipus = 'entitat' and b.bloquejador in (
                        select m.user_id from public.organization_memberships m
                         where m.organization_id = p_id and m.role in ('owner', 'admin'))))) then
    return 'seguit';
  end if;
  return null;
end;
$$;
revoke all on function private.bloqueig_de_seguiment(uuid, text, uuid) from public, anon, authenticated, service_role;

-- Si el seguiment de p_seguidor cap a (p_tipus, p_id) encara val: d'una
-- persona, encara veïnes i sense baixa; d'una entitat, qui seguix sense baixa
-- i l'entitat pública o seua. Els bloquejos no hi són: cada lectura els mira
-- del sentit que li toca (capçalera, punt 6).
create or replace function private.seguiment_viu(p_seguidor uuid, p_tipus text, p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_tipus
    when 'persona' then private.poble_compartit(p_seguidor, p_id) is not null
    when 'entitat' then
      exists (select 1 from public.profiles p where p.id = p_seguidor and p.baixa_demanada_at is null)
      and exists (select 1 from public.organizations o
                   where o.id = p_id
                     and (o.visibility = 'public' or exists (
                           select 1 from public.organization_memberships m
                            where m.organization_id = o.id and m.user_id = p_seguidor)))
    else false
  end;
$$;
revoke all on function private.seguiment_viu(uuid, text, uuid) from public, anon, authenticated, service_role;

-- ── 4 · Les RPC del client (src/data/supabase/seguiments.js) ────────────────
create or replace function public.segueix(p_tipus text, p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo       uuid := (select auth.uid());
  v_poble    uuid;
  v_bloqueig text;
  v_fila     uuid;
  v_al       timestamptz;
  v_represa  timestamptz;
  v_deixat   timestamptz;
  v_hora     integer;
  v_total    integer;
  v_ara      timestamptz;
begin
  if v_jo is null then
    raise exception 'SDP-SEG-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_tipus is null or p_tipus not in ('persona', 'entitat') or p_id is null then
    raise exception 'SDP-SEG-001: la persona o l''entitat no són vàlides.' using errcode = '22023';
  end if;
  if (p_tipus = 'persona' and p_id = v_jo)
     or (p_tipus = 'entitat' and coalesce(private.can_manage_organization(p_id), false)) then
    raise exception 'SDP-SEG-003: no et pots seguir a tu mateix ni seguir una entitat que administres.' using errcode = '22023';
  end if;
  if p_tipus = 'persona' then
    v_poble := private.poble_compartit(v_jo, p_id);
  else
    select o.tenant_id into v_poble
      from public.organizations o
     where o.id = p_id
       and (o.visibility = 'public' or exists (
             select 1 from public.organization_memberships m
              where m.organization_id = o.id and m.user_id = v_jo))
       and exists (select 1 from public.profiles p
                    where p.id = v_jo and p.baixa_demanada_at is null);
  end if;
  v_bloqueig := private.bloqueig_de_seguiment(v_jo, p_tipus, p_id);
  if v_bloqueig = 'seguidor' then
    raise exception 'SDP-SEG-004: l''has bloquejada: desbloqueja-la abans de seguir-la.' using errcode = '22023';
  end if;
  -- El bloqueig de l'altra banda ('seguit') és a l'ombra (capçalera, punt 6):
  -- no canvia res d'ací avall, i qui l'ha rebut no ho sap per esta via.
  if v_poble is null then
    raise exception 'SDP-SEG-002: no trobem esta persona o esta entitat, o no la pots seguir.' using errcode = '22023';
  end if;

  -- Sota el pany de qui seguix: la fila de la parella, el compte i l'alta (o
  -- la represa) van en fila.
  perform pg_advisory_xact_lock(hashtextextended('seguiments:' || v_jo::text, 0));
  -- L'instant d'admissió, una sola vegada i després del pany (now() és el de
  -- començar la transacció, potser abans d'esperar-lo): la poda, el compte i
  -- l'anotació del registre de les altes el fan servir.
  v_ara := clock_timestamp();
  select s.id, s.creat_al, s.reactivat_al, s.deixat_al into v_fila, v_al, v_represa, v_deixat
    from public.seguiments s
   where s.seguidor = v_jo
     and ((p_tipus = 'persona' and s.seguit_tipus = 'persona' and s.seguit_persona = p_id)
       or (p_tipus = 'entitat' and s.seguit_tipus = 'entitat' and s.seguit_entitat = p_id));
  if v_fila is not null and v_deixat is null then
    return jsonb_build_object('seguint', true, 'creat_al', coalesce(v_represa, v_al), 'nou', false, 'primer', false);
  end if;
  -- Tornar a seguir la mateixa parella: com a molt una vegada cada 10 minuts,
  -- des de l'última represa o, si no n'hi ha cap, des de l'alta (v_al és el
  -- creat_al de la fila; Gauntlet 261024_1945, Gemini G1945-03).
  if v_fila is not null and coalesce(v_represa, v_al) > v_ara - interval '10 minutes' then
    raise exception 'SDP-SEG-006: has fet massa seguiments nous en poc de temps.' using errcode = '42900';
  end if;
  -- T2 (261024_1800, P2-10; Codex C6-01) · El compte per hora és el del
  -- registre de les altes, una fila per alta o represa acceptada: ni deixar
  -- de seguir ni tornar a seguir no el reinicien, i una parella represa tres
  -- vegades hi compta tres. Primer es poden les de més d'una hora de qui
  -- seguix (sota el seu pany: només ell hi escriu).
  delete from private.seguiments_altes a
   where a.seguidor = v_jo
     and a.al <= v_ara - interval '1 hour';
  select count(*) into v_hora
    from private.seguiments_altes a
   where a.seguidor = v_jo
     and a.al > v_ara - interval '1 hour';
  select count(*) into v_total
    from public.seguiments s
   where s.seguidor = v_jo
     and s.deixat_al is null;
  if v_hora >= 30 then
    raise exception 'SDP-SEG-006: has fet massa seguiments nous en poc de temps.' using errcode = '42900';
  end if;
  if v_total >= 1000 then
    raise exception 'SDP-SEG-006: has arribat al màxim de 1.000 seguiments.' using errcode = '42900';
  end if;
  -- L'alta o la represa, anotada dins del pany i de la mateixa transacció:
  -- si alguna cosa d'ací avall falla, l'anotació també es desfà.
  insert into private.seguiments_altes (seguidor, al) values (v_jo, v_ara);
  if v_fila is not null then
    update public.seguiments s
       set deixat_al = null, reactivat_al = v_ara, tenant_id = v_poble
     where s.id = v_fila
    returning s.reactivat_al into v_al;
    return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', false, 'primer', false);
  end if;
  insert into public.seguiments (tenant_id, seguidor, seguit_tipus, seguit_persona, seguit_entitat, creat_al)
  values (v_poble, v_jo, p_tipus,
          case when p_tipus = 'persona' then p_id end,
          case when p_tipus = 'entitat' then p_id end,
          v_ara)
  returning creat_al into v_al;
  return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', true, 'primer', true);
end;
$$;
revoke all on function public.segueix(text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.segueix(text, uuid) to authenticated;

create or replace function public.deixa_de_seguir(p_tipus text, p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-SEG-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_tipus is null or p_tipus not in ('persona', 'entitat') or p_id is null then
    raise exception 'SDP-SEG-001: la persona o l''entitat no són vàlides.' using errcode = '22023';
  end if;
  -- Esborrat suau: la fila es queda (capçalera, punt 1) i només es marca.
  update public.seguiments s
     set deixat_al = now()
   where s.seguidor = v_jo
     and s.deixat_al is null
     and ((p_tipus = 'persona' and s.seguit_tipus = 'persona' and s.seguit_persona = p_id)
       or (p_tipus = 'entitat' and s.seguit_tipus = 'entitat' and s.seguit_entitat = p_id));
  return jsonb_build_object('seguint', false);
end;
$$;
revoke all on function public.deixa_de_seguir(text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.deixa_de_seguir(text, uuid) to authenticated;

create or replace function public.estat_seguiment(p_tipus text, p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
  v_al timestamptz;
begin
  if v_jo is null then
    raise exception 'SDP-SEG-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_tipus is null or p_tipus not in ('persona', 'entitat') or p_id is null then
    raise exception 'SDP-SEG-001: la persona o l''entitat no són vàlides.' using errcode = '22023';
  end if;
  -- La lectura de qui seguix: només el seu propi bloqueig l'amaga (punt 6).
  select coalesce(s.reactivat_al, s.creat_al) into v_al
    from public.seguiments s
   where s.seguidor = v_jo
     and s.deixat_al is null
     and ((p_tipus = 'persona' and s.seguit_tipus = 'persona' and s.seguit_persona = p_id)
       or (p_tipus = 'entitat' and s.seguit_tipus = 'entitat' and s.seguit_entitat = p_id))
     and private.seguiment_viu(v_jo, p_tipus, p_id)
     and private.bloqueig_de_seguiment(v_jo, p_tipus, p_id) is distinct from 'seguidor';
  return jsonb_build_object('seguint', v_al is not null, 'creat_al', v_al);
end;
$$;
revoke all on function public.estat_seguiment(text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.estat_seguiment(text, uuid) to authenticated;

create or replace function public.els_meus_seguiments()
returns table (tipus text, id uuid, nom text, creat_al timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-SEG-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  -- La lectura de qui seguix: només el seu propi bloqueig l'amaga (punt 6).
  return query
  select s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat), coalesce(p.full_name, o.name), coalesce(s.reactivat_al, s.creat_al)
    from public.seguiments s
    left join public.profiles p on s.seguit_tipus = 'persona' and p.id = s.seguit_persona
    left join public.organizations o on s.seguit_tipus = 'entitat' and o.id = s.seguit_entitat
   where s.seguidor = v_jo
     and s.deixat_al is null
     and private.seguiment_viu(v_jo, s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat))
     and private.bloqueig_de_seguiment(v_jo, s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat)) is distinct from 'seguidor'
   order by coalesce(s.reactivat_al, s.creat_al) desc, s.id
   limit 1000;
end;
$$;
revoke all on function public.els_meus_seguiments() from public, anon, authenticated, service_role;
grant execute on function public.els_meus_seguiments() to authenticated;

create or replace function public.qui_em_segueix(p_org_id uuid default null)
returns table (id uuid, nom text, creat_al timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-SEG-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  -- La lectura de qui és seguit: un bloqueig en qualsevol sentit (també el
  -- de qualsevol persona que administra l'entitat) deixa fora qui seguix.
  if p_org_id is null then
    return query
    select s.seguidor, p.full_name, coalesce(s.reactivat_al, s.creat_al)
      from public.seguiments s
      join public.profiles p on p.id = s.seguidor
     where s.seguit_tipus = 'persona' and s.seguit_persona = v_jo
       and s.deixat_al is null
       and private.seguiment_viu(s.seguidor, 'persona', v_jo)
       and private.bloqueig_de_seguiment(s.seguidor, 'persona', v_jo) is null
     order by coalesce(s.reactivat_al, s.creat_al) desc, s.id
     limit 1000;
    return;
  end if;
  if not coalesce(private.can_manage_organization(p_org_id), false) then
    raise exception 'SDP-SEG-005: només qui administra l''entitat veu qui la seguix.' using errcode = '42501';
  end if;
  return query
  select s.seguidor, p.full_name, coalesce(s.reactivat_al, s.creat_al)
    from public.seguiments s
    join public.profiles p on p.id = s.seguidor
   where s.seguit_tipus = 'entitat' and s.seguit_entitat = p_org_id
     and s.deixat_al is null
     and private.seguiment_viu(s.seguidor, 'entitat', p_org_id)
     and private.bloqueig_de_seguiment(s.seguidor, 'entitat', p_org_id) is null
   order by coalesce(s.reactivat_al, s.creat_al) desc, s.id
   limit 1000;
end;
$$;
revoke all on function public.qui_em_segueix(uuid) from public, anon, authenticated, service_role;
grant execute on function public.qui_em_segueix(uuid) to authenticated;

-- ── 5 · La purga del registre de les altes, cada 10 minuts ─────────────────
-- Programada només si pg_cron ja està actiu (com 2610220240). Si no, cada
-- alta ja poda les velles de qui seguix; la de tothom es programa a mà
-- (supabase/README.md). Salta les files que una poda té bloquejades (skip
-- locked): la purga no espera mai la poda, i no s'interbloquegen.
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('sdp-purga-altes-seguiments', '*/10 * * * *',
      $cron$delete from private.seguiments_altes where id in (select a.id from private.seguiments_altes a where a.al <= now() - interval '1 hour' for update skip locked)$cron$);
  else
    raise notice 'pg_cron no està actiu: la purga de private.seguiments_altes queda sense programar.';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
