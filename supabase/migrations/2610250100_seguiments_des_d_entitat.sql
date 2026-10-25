-- ============================================================================
-- 261025_0100 · IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) ·
-- Connectar des d'una entitat: qui administra una organització (owner o
-- admin) la connecta, COM A eixa organització, amb una persona o amb una
-- altra entitat, sense canviar la sessió global (B2B rural).
-- Directiva del Mestre (261025, àudios 00:53-00:55): una empresa o un grup es
-- connecta com a tal, i qui l'administra tria amb quin barret es connecta a
-- la mateixa pantalla. Per davall, el seguiment d'un sol sentit de
-- 2610241430: una entitat també pot ser qui seguix.
-- MANDAT SUPABASE 30-OCT-2026 (core-seguretat-audit, Llei E): els permisos de
-- la taula i de cada RPC, explícits en la mateixa transacció (seccions 2 i 4).
--
-- QUÈ FA:
--   1. public.seguiments.seguidor_entitat (uuid null, references
--      public.organizations on delete cascade). Null: la fila és d'una
--      persona (seguidor), com fins ara; totes les files d'abans ho són. Amb
--      valor: qui seguix és eixa entitat, i seguidor és la persona que
--      l'administra i que hi ha fet l'última alta o represa (qui en respon;
--      cap lectura no la torna mai). Els CHECK: ningú no se seguix a si
--      mateix es queda per a les files de persona; una entitat no se seguix a
--      ella mateixa (seguidor_entitat <> seguit_entitat). Una entitat sí que
--      pot seguir una persona que l'administra, també la que actua: com
--      entitat A → entitat B, que val encara que la persona administre B.
--   2. Els índexs únics, refets per a separar persona i entitat: (seguidor,
--      seguit_*) només per a les files de persona (seguidor_entitat is null) i
--      (seguidor_entitat, seguit_*) per a les d'entitat. Una persona seguix
--      cada destí com a molt una vegada, com ara; una entitat també, siga qui
--      siga l'admin que ho haja fet. Els nous es creen abans de llevar els
--      vells (seguiments_persona_unic i seguiments_entitat_unic): les files
--      d'abans són totes de persona i ja hi complien, i cap moment de la
--      transacció no es queda sense unicitat. I un índex per seguidor_entitat
--      (la baixa en cascada d'una entitat i el compte dels seus vius).
--   3. Tres funcions privades noves (SECURITY DEFINER, search_path buit; cap
--      client no les pot cridar): private.poble_d_entitat_i_persona (el poble
--      de l'entitat, si la persona n'és veïna i no ha demanat la baixa),
--      private.seguiment_d_entitat_viu (si el seguiment d'una entitat encara
--      val) i private.entitat_bloquejada_pel_seguit (si la banda seguida ha
--      bloquejat l'entitat que la seguix).
--   4. Les RPC segueix, deixa_de_seguir i estat_seguiment, amb p_com uuid
--      default null. PostgREST no tolera dues sobrecàrregues ambigües: es
--      llança la signatura vella (text, uuid) i es crea la nova (text, uuid,
--      uuid) amb el default, i els REVOKE/GRANT van amb la signatura nova.
--      Sense p_com (o null), exactament el d'ara: la persona de la sessió,
--      amb els mateixos codis i les mateixes respostes. Amb p_com, l'entitat,
--      si qui crida l'administra (private.can_manage_organization,
--      2609080000); si no, SDP-SEG-007. Deixar de seguir com a entitat el pot
--      fer qualsevol persona que l'administra.
--      qui_em_segueix(p_org_id) torna, a més, seguidor_tipus ('persona' o
--      'entitat'): d'un seguiment fet com a entitat, id i nom són els de
--      l'ENTITAT seguidora, mai els de la persona que el va fer. Canvia el
--      tipus de retorn: es llança i es torna a crear amb la mateixa signatura
--      (uuid) i els mateixos permisos. els_meus_seguiments() no canvia de
--      forma: només els de la persona, ara amb seguidor_entitat is null
--      perquè els fets com a entitat no s'hi barregen.
--   5. Les regles de segueix com a entitat: una persona, si és del poble de
--      l'entitat (town_memberships amb organizations.tenant_id) i no ha
--      demanat la baixa; una altra entitat, si és pública, de qualsevol
--      poble; mai ella mateixa (SDP-SEG-003, el text de sempre); i qui actua,
--      sense la baixa demanada. Els bloquejos són els de la persona que actua,
--      com ara (SDP-SEG-004), i el de l'altra banda és a l'ombra, com ara.
--      El pany de la persona que actua va ara just després de validar
--      l'entrada (en 2610241430 anava després de les portes de veïnatge): la
--      porta de l'entitat (SDP-SEG-007) es mira DESPRÉS del pany i abans de
--      cap porta que depenga de l'entitat, i qui no l'administra no en
--      sondeja res (un 002 diria si una veïna és del seu poble). Amb p_com,
--      després de la porta, també el pany de l'entitat, sempre després del de
--      la persona (l'ordre és sempre el mateix: cap interbloqueig): dues
--      persones que l'administren no en creen dues files ni passen del màxim
--      de vius. L'instant d'admissió (clock_timestamp()) es pren després dels
--      dos panys.
--      La quota és la de sempre i la compta la PERSONA que actua, mai
--      l'entitat (així no s'esquiva amb moltes entitats): 30 altes o represes
--      per hora al registre private.seguiments_altes, el de 2610241430, i una
--      represa de la mateixa parella cada 10 minuts (la parella de l'entitat,
--      la faça qui la faça). Els 1.000 vius, de qui seguix: la persona, els
--      seus (seguidor_entitat is null); l'entitat, els seus, sota el seu pany.
--      Una represa com a entitat posa seguidor a la persona que la fa.
--   6. Les lectures. estat_seguiment amb p_com: el de l'entitat, per a
--      qualsevol persona que l'administra; només el bloqueig propi de qui
--      mira l'amaga (com ara). qui_em_segueix: un seguiment d'entitat queda
--      fora si ja no val (la persona ja no és del poble de l'entitat o ha
--      demanat la baixa, o l'entitat seguida ja no és pública), si un bloqueig
--      separa la persona que l'ha fet de la banda seguida (els dos sentits,
--      com les files de persona) o si la banda seguida (la persona, o algú que
--      administra l'entitat seguida) ha bloquejat l'entitat seguidora.
--   7. RLS i permisos: la taula continua amb la RLS activa, cap política i
--      cap permís de taula per a anon ni authenticated (ho reafirma). Qui
--      administra l'entitat seguidora en veu els seguiments per
--      estat_seguiment(…, p_com) i els deixa per deixa_de_seguir(…, p_com):
--      la porta és can_manage_organization dins de cada RPC, no cap política
--      (una de lectura obriria la taula a authenticated).
--
-- QUÈ NO FA (decisions del Mestre pendents, supabase/README.md):
--   · No dona cap llista de «a qui seguix l'entitat»: els_meus_seguiments és
--     de la persona; l'entitat es mira destí a destí amb estat_seguiment.
--   · No toca l'exportació (2610241410): llig s.seguidor = v_uid, i hi
--     eixiran també, com a «a qui seguixes», els seguiments que la persona ha
--     fet com a entitat (l'última alta o represa). Separar-los és una versió
--     nova de l'exportació.
--   · No guarda qui de l'equip ha fet cada alta: seguidor és l'última alta o
--     represa. Si eixa persona es dona de baixa, la fila de l'entitat se'n va
--     amb ella (on delete cascade de seguidor, 2610241430).
--   · No notifica res: com 2610241430, l'avís al xat el decidix el client amb
--     primer (una sola vegada per parella). Des d'una entitat el client no
--     n'envia cap (useSeguiment, revisió adversarial 261025: el xat personal
--     diria quina persona l'administra). Per a una entitat, primer no és «per
--     sempre»: si la fila se'n va amb la baixa de qui la va fer (el punt
--     d'abans), la parella torna a començar i primer torna a ser true.
--   · No compta cap quota per entitat ni en canvia cap sostre.
--   · No toca private.seguiments_altes, public.bloquejos,
--     private.can_manage_organization, private.poble_compartit,
--     private.bloqueig_de_seguiment, private.seguiment_viu ni cap altra
--     taula, funció o política, ni el fitxer de 2610241430.
--   · No es pot tornar a aplicar 2610241430 després d'esta: tornaria a crear
--     les signatures (text, uuid), al costat de les noves (PostgREST no podria
--     triar: PGRST203), els dos índexs vells i els_meus_seguiments sense el
--     filtre. Si passa, cal tornar a aplicar esta just després.
--   · Sense esta migració, una crida amb com dona NO-DISPONIBLE (PostgREST no
--     troba la signatura amb p_com); sense com, tot continua igual.
--
-- CODIS (missatges en valencià; l'adaptador els llig pel prefix):
--   SDP-SEG-007 no administres l'entitat amb què vols connectar (42501)
--   SDP-SEG-003 també quan una entitat es vol connectar amb ella mateixa
--               (22023, el text de sempre)
--   La resta, els de 2610241430 (SDP-SEG-000…006), amb el mateix text i el
--   mateix errcode. Cap codi no és 404.
--
-- Depén de: 2610241430 (public.seguiments, private.seguiments_altes,
-- private.poble_compartit, private.bloqueig_de_seguiment i
-- private.seguiment_viu), 2609080000 (public.organizations,
-- public.organization_memberships, public.town_memberships i
-- private.can_manage_organization()) i 2609261500
-- (public.profiles.baixa_demanada_at); i, si hi és, public.bloquejos
-- (2610201500): sense ella, cap bloqueig no compta.
--
-- Idempotent i en una sola transacció. Va després de 2610241430 i ABANS de
-- publicar el client que connecta com a entitat.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Qui seguix també pot ser una entitat ───────────────────────────────
alter table public.seguiments
  add column if not exists seguidor_entitat uuid references public.organizations (id) on delete cascade;

-- Ningú no se seguix a si mateix: per a les files de persona, com ara. Una
-- entitat no se seguix a ella mateixa (els null no hi topen).
alter table public.seguiments drop constraint if exists seguiments_no_autoseguiment;
alter table public.seguiments add constraint seguiments_no_autoseguiment
  check (seguidor_entitat is not null or seguidor <> seguit_persona);
alter table public.seguiments drop constraint if exists seguiments_entitat_no_autoseguiment;
alter table public.seguiments add constraint seguiments_entitat_no_autoseguiment
  check (seguidor_entitat <> seguit_entitat);

-- Una sola fila per parella: la persona, per seguidor; l'entitat, per
-- seguidor_entitat. Els nous abans de llevar els vells (capçalera, punt 2).
create unique index if not exists seguiments_persona_a_persona_unic
  on public.seguiments (seguidor, seguit_persona) where seguit_tipus = 'persona' and seguidor_entitat is null;
create unique index if not exists seguiments_persona_a_entitat_unic
  on public.seguiments (seguidor, seguit_entitat) where seguit_tipus = 'entitat' and seguidor_entitat is null;
create unique index if not exists seguiments_entitat_a_persona_unic
  on public.seguiments (seguidor_entitat, seguit_persona) where seguit_tipus = 'persona' and seguidor_entitat is not null;
create unique index if not exists seguiments_entitat_a_entitat_unic
  on public.seguiments (seguidor_entitat, seguit_entitat) where seguit_tipus = 'entitat' and seguidor_entitat is not null;
drop index if exists public.seguiments_persona_unic;
drop index if exists public.seguiments_entitat_unic;
-- La baixa en cascada d'una entitat i el compte dels seus vius, per data.
create index if not exists idx_seguiments_seguidor_entitat_creat
  on public.seguiments (seguidor_entitat, creat_al desc) where seguidor_entitat is not null;

-- ── 2 · RLS i permisos (mandat Supabase 30-Oct-2026), reafirmats ───────────
-- Cap política i cap permís de taula per a anon ni authenticated: qui
-- administra l'entitat seguidora hi entra per les RPC de la secció 4.
alter table public.seguiments enable row level security;
revoke all on table public.seguiments from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.seguiments to service_role;

-- ── 3 · Les funcions privades noves ────────────────────────────────────────
-- El poble de l'entitat p_entitat (organizations.tenant_id) si la persona
-- p_persona n'és veïna (town_memberships) i no ha demanat la baixa; null si
-- no. La regla de veïnatge d'una entitat que seguix una persona.
create or replace function private.poble_d_entitat_i_persona(p_entitat uuid, p_persona uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select o.tenant_id
    from public.organizations o
    join public.town_memberships tm on tm.town_id = o.tenant_id
   where o.id = p_entitat
     and tm.user_id = p_persona
     and exists (select 1 from public.profiles p where p.id = p_persona and p.baixa_demanada_at is null)
   limit 1;
$$;
revoke all on function private.poble_d_entitat_i_persona(uuid, uuid) from public, anon, authenticated, service_role;

-- Si el seguiment de l'entitat p_entitat cap a (p_tipus, p_id) encara val:
-- d'una persona, encara del poble de l'entitat i sense baixa; d'una entitat,
-- una altra i pública. Els bloquejos no hi són (com private.seguiment_viu):
-- cada lectura els mira del sentit que li toca.
create or replace function private.seguiment_d_entitat_viu(p_entitat uuid, p_tipus text, p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_tipus
    when 'persona' then private.poble_d_entitat_i_persona(p_entitat, p_id) is not null
    when 'entitat' then
      p_id <> p_entitat
      and exists (select 1 from public.organizations o where o.id = p_id and o.visibility = 'public')
    else false
  end;
$$;
revoke all on function private.seguiment_d_entitat_viu(uuid, text, uuid) from public, anon, authenticated, service_role;

-- Si la banda seguida ha bloquejat l'entitat seguidora (public.bloquejos,
-- bloquejat_entitat): la persona seguida, o algú que administra l'entitat
-- seguida. Sense la taula, false (com private.bloqueig_de_seguiment).
create or replace function private.entitat_bloquejada_pel_seguit(p_entitat uuid, p_tipus text, p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if to_regclass('public.bloquejos') is null then
    return false;
  end if;
  return exists (select 1 from public.bloquejos b
                  where b.bloquejat_entitat = p_entitat
                    and ((p_tipus = 'persona' and b.bloquejador = p_id)
                      or (p_tipus = 'entitat' and b.bloquejador in (
                            select m.user_id from public.organization_memberships m
                             where m.organization_id = p_id and m.role in ('owner', 'admin')))));
end;
$$;
revoke all on function private.entitat_bloquejada_pel_seguit(uuid, text, uuid) from public, anon, authenticated, service_role;

-- ── 4 · Les RPC del client (src/data/supabase/seguiments.js) ────────────────
-- La signatura vella fora (PostgREST no tria entre dues sobrecàrregues).
drop function if exists public.segueix(text, uuid);
create or replace function public.segueix(p_tipus text, p_id uuid, p_com uuid default null)
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

  -- Sota el pany de la persona que actua, ara abans de cap porta (capçalera,
  -- punt 5): la de l'entitat, primer de tot; després, el pany de l'entitat.
  perform pg_advisory_xact_lock(hashtextextended('seguiments:' || v_jo::text, 0));
  if p_com is not null then
    if not coalesce(private.can_manage_organization(p_com), false) then
      raise exception 'SDP-SEG-007: no administres l''entitat amb què vols connectar.' using errcode = '42501';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('seguiments:entitat:' || p_com::text, 0));
  end if;
  -- L'instant d'admissió, una sola vegada i després dels panys.
  v_ara := clock_timestamp();

  if (p_com is null and ((p_tipus = 'persona' and p_id = v_jo)
        or (p_tipus = 'entitat' and coalesce(private.can_manage_organization(p_id), false))))
     or (p_com is not null and p_tipus = 'entitat' and p_id = p_com) then
    raise exception 'SDP-SEG-003: no et pots seguir a tu mateix ni seguir una entitat que administres.' using errcode = '22023';
  end if;
  if p_com is null and p_tipus = 'persona' then
    v_poble := private.poble_compartit(v_jo, p_id);
  elsif p_com is null then
    select o.tenant_id into v_poble
      from public.organizations o
     where o.id = p_id
       and (o.visibility = 'public' or exists (
             select 1 from public.organization_memberships m
              where m.organization_id = o.id and m.user_id = v_jo))
       and exists (select 1 from public.profiles p
                    where p.id = v_jo and p.baixa_demanada_at is null);
  elsif exists (select 1 from public.profiles p where p.id = v_jo and p.baixa_demanada_at is null) then
    -- Com a entitat: una persona del poble de l'entitat; una altra entitat, pública.
    if p_tipus = 'persona' then
      v_poble := private.poble_d_entitat_i_persona(p_com, p_id);
    else
      select o.tenant_id into v_poble
        from public.organizations o
       where o.id = p_id
         and o.visibility = 'public';
    end if;
  end if;
  -- Els bloquejos de la persona que actua, també com a entitat.
  v_bloqueig := private.bloqueig_de_seguiment(v_jo, p_tipus, p_id);
  if v_bloqueig = 'seguidor' then
    raise exception 'SDP-SEG-004: l''has bloquejada: desbloqueja-la abans de seguir-la.' using errcode = '22023';
  end if;
  if v_poble is null then
    raise exception 'SDP-SEG-002: no trobem esta persona o esta entitat, o no la pots seguir.' using errcode = '22023';
  end if;

  -- La fila de la parella: la de la persona o la de l'entitat.
  select s.id, s.creat_al, s.reactivat_al, s.deixat_al into v_fila, v_al, v_represa, v_deixat
    from public.seguiments s
   where ((p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null)
       or (p_com is not null and s.seguidor_entitat = p_com))
     and ((p_tipus = 'persona' and s.seguit_tipus = 'persona' and s.seguit_persona = p_id)
       or (p_tipus = 'entitat' and s.seguit_tipus = 'entitat' and s.seguit_entitat = p_id));
  if v_fila is not null and v_deixat is null then
    return jsonb_build_object('seguint', true, 'creat_al', coalesce(v_represa, v_al), 'nou', false, 'primer', false);
  end if;
  -- L'espera de represa és de la parella: la de l'entitat, la faça qui la faça.
  if v_fila is not null and coalesce(v_represa, v_al) > v_ara - interval '10 minutes' then
    raise exception 'SDP-SEG-006: has fet massa seguiments nous en poc de temps.' using errcode = '42900';
  end if;
  -- El compte per hora és de la PERSONA que actua, mai de l'entitat.
  delete from private.seguiments_altes a
   where a.seguidor = v_jo
     and a.al <= v_ara - interval '1 hour';
  select count(*) into v_hora
    from private.seguiments_altes a
   where a.seguidor = v_jo
     and a.al > v_ara - interval '1 hour';
  -- Els vius de qui seguix: la persona, els seus; l'entitat, els seus.
  select count(*) into v_total
    from public.seguiments s
   where ((p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null)
       or (p_com is not null and s.seguidor_entitat = p_com))
     and s.deixat_al is null;
  if v_hora >= 30 then
    raise exception 'SDP-SEG-006: has fet massa seguiments nous en poc de temps.' using errcode = '42900';
  end if;
  if v_total >= 1000 then
    raise exception 'SDP-SEG-006: has arribat al màxim de 1.000 seguiments.' using errcode = '42900';
  end if;
  insert into private.seguiments_altes (seguidor, al) values (v_jo, v_ara);
  if v_fila is not null then
    update public.seguiments s
       set deixat_al = null, reactivat_al = v_ara, tenant_id = v_poble, seguidor = v_jo
     where s.id = v_fila
    returning s.reactivat_al into v_al;
    return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', false, 'primer', false);
  end if;
  insert into public.seguiments (tenant_id, seguidor, seguidor_entitat, seguit_tipus, seguit_persona, seguit_entitat, creat_al)
  values (v_poble, v_jo, p_com, p_tipus,
          case when p_tipus = 'persona' then p_id end,
          case when p_tipus = 'entitat' then p_id end,
          v_ara)
  returning creat_al into v_al;
  return jsonb_build_object('seguint', true, 'creat_al', v_al, 'nou', true, 'primer', true);
end;
$$;
revoke all on function public.segueix(text, uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.segueix(text, uuid, uuid) to authenticated;

drop function if exists public.deixa_de_seguir(text, uuid);
create or replace function public.deixa_de_seguir(p_tipus text, p_id uuid, p_com uuid default null)
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
  -- Com a entitat, qualsevol persona que l'administra. Cap pany, com ara.
  if p_com is not null and not coalesce(private.can_manage_organization(p_com), false) then
    raise exception 'SDP-SEG-007: no administres l''entitat amb què vols connectar.' using errcode = '42501';
  end if;
  -- Esborrat suau, com en 2610241430: la fila es queda i només es marca.
  update public.seguiments s
     set deixat_al = now()
   where ((p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null)
       or (p_com is not null and s.seguidor_entitat = p_com))
     and s.deixat_al is null
     and ((p_tipus = 'persona' and s.seguit_tipus = 'persona' and s.seguit_persona = p_id)
       or (p_tipus = 'entitat' and s.seguit_tipus = 'entitat' and s.seguit_entitat = p_id));
  return jsonb_build_object('seguint', false);
end;
$$;
revoke all on function public.deixa_de_seguir(text, uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.deixa_de_seguir(text, uuid, uuid) to authenticated;

drop function if exists public.estat_seguiment(text, uuid);
create or replace function public.estat_seguiment(p_tipus text, p_id uuid, p_com uuid default null)
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
  if p_com is not null and not coalesce(private.can_manage_organization(p_com), false) then
    raise exception 'SDP-SEG-007: no administres l''entitat amb què vols connectar.' using errcode = '42501';
  end if;
  -- La lectura de qui seguix: només el bloqueig propi de qui mira l'amaga.
  select coalesce(s.reactivat_al, s.creat_al) into v_al
    from public.seguiments s
   where ((p_com is null and s.seguidor = v_jo and s.seguidor_entitat is null
           and private.seguiment_viu(v_jo, p_tipus, p_id))
       or (p_com is not null and s.seguidor_entitat = p_com
           and private.seguiment_d_entitat_viu(p_com, p_tipus, p_id)))
     and s.deixat_al is null
     and ((p_tipus = 'persona' and s.seguit_tipus = 'persona' and s.seguit_persona = p_id)
       or (p_tipus = 'entitat' and s.seguit_tipus = 'entitat' and s.seguit_entitat = p_id))
     and private.bloqueig_de_seguiment(v_jo, p_tipus, p_id) is distinct from 'seguidor';
  return jsonb_build_object('seguint', v_al is not null, 'creat_al', v_al);
end;
$$;
revoke all on function public.estat_seguiment(text, uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.estat_seguiment(text, uuid, uuid) to authenticated;

-- La mateixa forma i la mateixa signatura: només els de la persona.
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
  return query
  select s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat), coalesce(p.full_name, o.name), coalesce(s.reactivat_al, s.creat_al)
    from public.seguiments s
    left join public.profiles p on s.seguit_tipus = 'persona' and p.id = s.seguit_persona
    left join public.organizations o on s.seguit_tipus = 'entitat' and o.id = s.seguit_entitat
   where s.seguidor = v_jo
     and s.seguidor_entitat is null
     and s.deixat_al is null
     and private.seguiment_viu(v_jo, s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat))
     and private.bloqueig_de_seguiment(v_jo, s.seguit_tipus, coalesce(s.seguit_persona, s.seguit_entitat)) is distinct from 'seguidor'
   order by coalesce(s.reactivat_al, s.creat_al) desc, s.id
   limit 1000;
end;
$$;
revoke all on function public.els_meus_seguiments() from public, anon, authenticated, service_role;
grant execute on function public.els_meus_seguiments() to authenticated;

-- El tipus de retorn canvia (seguidor_tipus): fora i de nou, mateixa signatura.
drop function if exists public.qui_em_segueix(uuid);
create or replace function public.qui_em_segueix(p_org_id uuid default null)
returns table (id uuid, nom text, creat_al timestamptz, seguidor_tipus text)
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
  -- La lectura de qui és seguit: d'una entitat seguidora, el seu id i el seu
  -- nom (mai la persona que actua); fora si ja no val, si un bloqueig separa
  -- qui actua de la banda seguida o si la banda seguida ha bloquejat l'entitat.
  if p_org_id is null then
    return query
    select coalesce(s.seguidor_entitat, s.seguidor),
           case when s.seguidor_entitat is null then p.full_name else o.name end,
           coalesce(s.reactivat_al, s.creat_al),
           case when s.seguidor_entitat is null then 'persona' else 'entitat' end
      from public.seguiments s
      left join public.profiles p on s.seguidor_entitat is null and p.id = s.seguidor
      left join public.organizations o on o.id = s.seguidor_entitat
     where s.seguit_tipus = 'persona' and s.seguit_persona = v_jo
       and s.deixat_al is null
       and private.bloqueig_de_seguiment(s.seguidor, 'persona', v_jo) is null
       and ((s.seguidor_entitat is null and private.seguiment_viu(s.seguidor, 'persona', v_jo))
         or (s.seguidor_entitat is not null
             and private.seguiment_d_entitat_viu(s.seguidor_entitat, 'persona', v_jo)
             and not private.entitat_bloquejada_pel_seguit(s.seguidor_entitat, 'persona', v_jo)))
     order by coalesce(s.reactivat_al, s.creat_al) desc, s.id
     limit 1000;
    return;
  end if;
  if not coalesce(private.can_manage_organization(p_org_id), false) then
    raise exception 'SDP-SEG-005: només qui administra l''entitat veu qui la seguix.' using errcode = '42501';
  end if;
  return query
  select coalesce(s.seguidor_entitat, s.seguidor),
         case when s.seguidor_entitat is null then p.full_name else o.name end,
         coalesce(s.reactivat_al, s.creat_al),
         case when s.seguidor_entitat is null then 'persona' else 'entitat' end
    from public.seguiments s
    left join public.profiles p on s.seguidor_entitat is null and p.id = s.seguidor
    left join public.organizations o on o.id = s.seguidor_entitat
   where s.seguit_tipus = 'entitat' and s.seguit_entitat = p_org_id
     and s.deixat_al is null
     and private.bloqueig_de_seguiment(s.seguidor, 'entitat', p_org_id) is null
     and ((s.seguidor_entitat is null and private.seguiment_viu(s.seguidor, 'entitat', p_org_id))
       or (s.seguidor_entitat is not null
           and private.seguiment_d_entitat_viu(s.seguidor_entitat, 'entitat', p_org_id)
           and not private.entitat_bloquejada_pel_seguit(s.seguidor_entitat, 'entitat', p_org_id)))
   order by coalesce(s.reactivat_al, s.creat_al) desc, s.id
   limit 1000;
end;
$$;
revoke all on function public.qui_em_segueix(uuid) from public, anon, authenticated, service_role;
grant execute on function public.qui_em_segueix(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
