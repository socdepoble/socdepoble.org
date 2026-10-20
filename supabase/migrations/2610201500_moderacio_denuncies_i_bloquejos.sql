-- ============================================================================
-- 261020_1500 · Fase D (Tasca 2) · Moderació del contingut dels veïns (UGC):
-- denúncies, bloquejos i acceptació de les normes de convivència.
-- Ordre del Mestre (pla 261020_1300, prompt 261020_1300_prompt_claude_botigues_i_auth_mobil.md,
-- Tasca 2; App Store Review Guideline 1.2 i política UGC de Google Play) i
-- MANDAT SUPABASE 30-OCT-2026 (core-seguretat-audit, Llei E): tota taula nova
-- de public porta els permisos explícits en la mateixa transacció (secció 6).
--
-- QUÈ FA:
--   1. public.denuncies · Una fila per denúncia d'una publicació, un producte,
--      un acte, un missatge, una persona o una entitat. Motiu tancat
--      ('ofensiu', 'spam_frau', 'desinformacio', 'altre') i detall opcional de
--      fins a 1.000 caràcters. La pot enviar anon i authenticated. RLS: només
--      entra amb estat 'pendent' i denunciant = (select auth.uid()) (null per a
--      anon); cada persona llig les seues i la superadmin amb aal2, totes. El
--      client no les modifica ni les esborra: ho fa la moderació (service_role).
--   2. public.bloquejos · Qui bloqueja a qui (persona o entitat). RLS: cadascú
--      veu, afig i lleva només els seus.
--   3. Dos disparadors d'abans d'inserir (SECURITY DEFINER, search_path buit)
--      forcen les columnes que el client no tria (id, denunciant, estat,
--      creat_al, empremta d'IP; id, bloquejador, creat_al) i posen els límits:
--      20 denúncies/hora per persona, 10/hora per IP anònima (50 si no se sap
--      la IP; una IPv6 compta per la seua /64), 300/hora entre totes les
--      anònimes (el sostre comú), una sola pendent per persona i contingut (la
--      repetida no entra) i 1.000 bloquejos per persona.
--   4. public.denuncia_contingut(...) · L'RPC del client
--      (src/data/supabase/moderacio.js). SECURITY INVOKER a posta: corre amb els
--      permisos de la secció 6 i la RLS, mai amb els del propietari. Torna
--      { rebuda, repetida } sense cap dada de la fila (anon no té SELECT).
--   5. private.normes_acceptades i dues RPC SECURITY DEFINER,
--      accepta_normes_convivencia(p_versio) i estat_normes_convivencia(p_versio):
--      la prova al servidor que la persona ha acceptat les normes. Esquema
--      private: fora de l'API de dades. La versió ha de ser una data real que
--      no siga futura (el calendari de Madrid) i cada persona n'accepta 20
--      com a molt.
--
-- Fase D (261020, revisió) · EL SOSTRE ANÒNIM, I QUÈ COSTA:
--   · La porta d'anon es queda oberta (ordre del Mestre: `grant insert ... to
--     anon`), però una IP sola no pot omplir la cua: una IPv6 compta per la
--     seua /64 (canviar d'adreça dins del mateix /64 no dona un compte nou) i
--     totes les anònimes compartixen un sostre de 300/hora, comptat sota un
--     sol pany (pg_advisory_xact_lock) i amb un índex parcial
--     (idx_denuncies_anon_creat).
--   · El preu: qui inunda pot gastar el sostre comú d'una hora, i mentre dura
--     cap altra denúncia anònima no entra (SDP-MOD-429, que el client ja diu
--     com a límit). Les de les persones amb sessió (20/hora per compte) no hi
--     compten i continuen entrant.
--   · Llevar del tot la denúncia anònima és decisió del Mestre.
--
-- QUÈ NO FA (decisions del Mestre pendents, supabase/README.md):
--   · No avisa ningú quan arriba una denúncia: la cua es revisa a mà.
--   · No amaga al servidor el contingut de qui has bloquejat (ho fa el client)
--     ni li impedix escriure't.
--   · No guarda cap còpia del contingut denunciat. No filtra abans de publicar.
--   · service_role pot llegir, corregir i esborrar; els disparadors no li
--     deixen crear bloquejos sense persona.
--
-- CODIS (missatges en valencià; l'adaptador els llig pel prefix):
--   SDP-MOD-000 cal la sessió iniciada (42501)
--   SDP-MOD-001 el contingut denunciat no és vàlid (22023)
--   SDP-MOD-002 el motiu no és vàlid (22023)
--   SDP-MOD-003 el detall passa de 1.000 caràcters (22023)
--   SDP-MOD-004 no et pots bloquejar a tu mateix (22023)
--   SDP-MOD-005 la versió de les normes no és vàlida, no és una data o és futura (22023)
--   SDP-MOD-429 massa denúncies (també el sostre anònim), bloquejos o versions de normes (42900)
--
-- Depén de: auth.users, public.towns, public.organizations i
-- private.es_superadmin() (2609080000; aal2 des de 2610061448) i, si hi són,
-- private.hash_subjecte i private.capcalera_client (2609261500, 2610061450):
-- sense elles, l'empremta d'IP és null i les anònimes compartixen el compte
-- de 50/hora (dins del sostre de 300/hora).
--
-- Additiva i idempotent. Revisada i NO aplicada a cap base de dades.
-- L'aplica el Mestre, mai un agent.
-- Va ABANS de publicar el client: sense ella, les denúncies diuen
-- NO-DISPONIBLE i els bloquejos només duren la sessió.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Les denúncies ───────────────────────────────────────────────────────
create table if not exists public.denuncies (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.towns (id) on delete set null,
  denunciant    uuid references auth.users (id) on delete set null,
  objecte_tipus text not null
    constraint denuncies_objecte_tipus_valid
    check (objecte_tipus in ('publicacio', 'producte', 'esdeveniment', 'missatge', 'persona', 'entitat')),
  objecte_id    text not null
    constraint denuncies_objecte_id_valid
    check (char_length(objecte_id) between 1 and 200 and objecte_id ~ '^[A-Za-z0-9._:~-]+$'),
  autor_tipus   text
    constraint denuncies_autor_tipus_valid
    check (autor_tipus is null or autor_tipus in ('persona', 'entitat')),
  autor_id      text
    constraint denuncies_autor_id_valid
    check (autor_id is null or (char_length(autor_id) between 1 and 200 and autor_id ~ '^[A-Za-z0-9._:~-]+$')),
  fil_id        uuid,
  motiu         text not null
    constraint denuncies_motiu_valid
    check (motiu in ('ofensiu', 'spam_frau', 'desinformacio', 'altre')),
  detall        text
    constraint denuncies_detall_llarg
    check (detall is null or char_length(detall) <= 1000),
  estat         text not null default 'pendent'
    constraint denuncies_estat_valid
    check (estat in ('pendent', 'revisada', 'retirada', 'desestimada')),
  ip_hash       text,
  creat_al      timestamptz not null default now(),
  revisada_al   timestamptz
);

create index if not exists idx_denuncies_estat_creat on public.denuncies (estat, creat_al desc);
create index if not exists idx_denuncies_denunciant_creat on public.denuncies (denunciant, creat_al desc) where denunciant is not null;
create index if not exists idx_denuncies_ip_creat on public.denuncies (ip_hash, creat_al desc) where denunciant is null;
-- Fase D (261020, revisió) · El compte del sostre anònim (secció 3), sense recórrer la taula.
create index if not exists idx_denuncies_anon_creat on public.denuncies (creat_al desc) where denunciant is null;
create index if not exists idx_denuncies_objecte on public.denuncies (objecte_tipus, objecte_id);

alter table public.denuncies enable row level security;

-- ── 2 · Els bloquejos ───────────────────────────────────────────────────────
create table if not exists public.bloquejos (
  id                uuid primary key default gen_random_uuid(),
  bloquejador       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bloquejat_tipus   text not null
    constraint bloquejos_tipus_valid check (bloquejat_tipus in ('persona', 'entitat')),
  bloquejat_persona uuid references auth.users (id) on delete cascade,
  bloquejat_entitat uuid references public.organizations (id) on delete cascade,
  nom               text constraint bloquejos_nom_llarg check (nom is null or char_length(nom) <= 120),
  creat_al          timestamptz not null default now(),
  constraint bloquejos_un_sol_bloquejat check (
    (bloquejat_tipus = 'persona' and bloquejat_persona is not null and bloquejat_entitat is null)
    or (bloquejat_tipus = 'entitat' and bloquejat_entitat is not null and bloquejat_persona is null)),
  constraint bloquejos_no_autobloqueig check (bloquejat_persona is distinct from bloquejador),
  -- Els null no topen: una fila d'entitat no xoca amb cap altra a la de persona.
  constraint bloquejos_persona_unic unique (bloquejador, bloquejat_persona),
  constraint bloquejos_entitat_unic unique (bloquejador, bloquejat_entitat)
);

alter table public.bloquejos enable row level security;

-- ── 3 · L'empremta d'IP i les columnes forçades ─────────────────────────────
-- Fase D (261020, revisió) · Una IPv6 compta per la seua /64 (qui en té una en
-- té milions d'adreces); una IPv4 i una IPv6 que du dins una IPv4
-- (::ffff:a.b.c.d), per l'adreça. El que no es llig com a adreça es queda
-- com venia: el compte de sempre per a eixe text, i el sostre comú per damunt.
create or replace function private.empremta_ip_moderacio()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_crua text;
  v_ip   inet;
  v_clau text;
begin
  v_crua := private.capcalera_client('ip');
  if v_crua is null then
    return null;
  end if;
  begin
    v_ip := v_crua::inet;
    v_clau := case
      when family(v_ip) = 6 and not (v_ip <<= '::ffff:0.0.0.0/96'::inet)
        then host(network(set_masklen(v_ip, 64))) || '/64'
      else host(v_ip)
    end;
  exception when others then
    v_clau := v_crua;
  end;
  return private.hash_subjecte('ip:' || v_clau);
exception when undefined_function or undefined_table then
  return null;
end;
$$;
revoke execute on function private.empremta_ip_moderacio() from public, anon, authenticated;

create or replace function private.denuncies_abans_insercio()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo    uuid := (select auth.uid());
  v_ip    text := private.empremta_ip_moderacio();
  v_n     integer;
  v_maxim integer;
  v_total integer;
begin
  new.id := gen_random_uuid();
  new.denunciant := v_jo;
  new.estat := 'pendent';
  new.creat_al := now();
  new.revisada_al := null;
  new.ip_hash := v_ip;
  new.detall := nullif(btrim(new.detall), '');

  perform pg_advisory_xact_lock(hashtextextended('denuncies:' || coalesce(v_jo::text, v_ip, 'anon'), 0));
  if v_jo is not null then
    if exists (select 1 from public.denuncies d
                where d.denunciant = v_jo and d.estat = 'pendent'
                  and d.objecte_tipus = new.objecte_tipus and d.objecte_id = new.objecte_id) then
      return null;   -- Ja l'havia denunciada i està pendent: no es repetix (row_count 0).
    end if;
    select count(*) into v_n from public.denuncies d
     where d.denunciant = v_jo and d.creat_al > now() - interval '1 hour';
    v_maxim := 20;
  else
    -- Fase D (261020, revisió) · El sostre comú de les anònimes, sota un sol
    -- pany: cap IP nova (ni cap capçalera inventada) no el passa.
    perform pg_advisory_xact_lock(hashtextextended('denuncies:anon-global', 0));
    select count(*) into v_total from public.denuncies d
     where d.denunciant is null and d.creat_al > now() - interval '1 hour';
    if v_total >= 300 then
      raise exception 'SDP-MOD-429: ara mateix hi ha massa denúncies anònimes. Entra per a denunciar.' using errcode = '42900';
    end if;
    select count(*) into v_n from public.denuncies d
     where d.denunciant is null and d.ip_hash is not distinct from v_ip
       and d.creat_al > now() - interval '1 hour';
    v_maxim := case when v_ip is null then 50 else 10 end;
  end if;
  if v_n >= v_maxim then
    raise exception 'SDP-MOD-429: has enviat massa denúncies en poc de temps.' using errcode = '42900';
  end if;
  return new;
end;
$$;
revoke execute on function private.denuncies_abans_insercio() from public, anon, authenticated;

drop trigger if exists denuncies_abans_insercio on public.denuncies;
create trigger denuncies_abans_insercio before insert on public.denuncies
  for each row execute function private.denuncies_abans_insercio();

create or replace function private.bloquejos_abans_insercio()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
  v_n  integer;
begin
  if v_jo is null then
    raise exception 'SDP-MOD-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  new.id := gen_random_uuid();
  new.bloquejador := v_jo;
  new.creat_al := now();
  new.nom := nullif(left(btrim(coalesce(new.nom, '')), 120), '');
  if new.bloquejat_persona = v_jo then
    raise exception 'SDP-MOD-004: no et pots bloquejar a tu mateix.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('bloquejos:' || v_jo::text, 0));
  select count(*) into v_n from public.bloquejos b where b.bloquejador = v_jo;
  if v_n >= 1000 then
    raise exception 'SDP-MOD-429: has arribat al màxim de 1.000 bloquejos.' using errcode = '42900';
  end if;
  return new;
end;
$$;
revoke execute on function private.bloquejos_abans_insercio() from public, anon, authenticated;

drop trigger if exists bloquejos_abans_insercio on public.bloquejos;
create trigger bloquejos_abans_insercio before insert on public.bloquejos
  for each row execute function private.bloquejos_abans_insercio();

-- ── 5 · Polítiques (la RLS es comprova després dels disparadors) ────────────
drop policy if exists "denuncies: qualsevol en pot enviar" on public.denuncies;
create policy "denuncies: qualsevol en pot enviar" on public.denuncies
for insert to anon, authenticated
with check (estat = 'pendent' and denunciant is not distinct from (select auth.uid()));

drop policy if exists "denuncies: cadascu llig les seues" on public.denuncies;
create policy "denuncies: cadascu llig les seues" on public.denuncies
for select to authenticated
using (denunciant = (select auth.uid()) or coalesce((select private.es_superadmin()), false));

drop policy if exists "bloquejos: cadascu veu els seus" on public.bloquejos;
create policy "bloquejos: cadascu veu els seus" on public.bloquejos
for select to authenticated
using (bloquejador = (select auth.uid()));

drop policy if exists "bloquejos: cadascu afig els seus" on public.bloquejos;
create policy "bloquejos: cadascu afig els seus" on public.bloquejos
for insert to authenticated
with check (bloquejador = (select auth.uid()));

drop policy if exists "bloquejos: cadascu lleva els seus" on public.bloquejos;
create policy "bloquejos: cadascu lleva els seus" on public.bloquejos
for delete to authenticated
using (bloquejador = (select auth.uid()));

-- ── 6 · Permisos (mandat Supabase 30-Oct-2026): la llista sencera ──────────
revoke all on table public.denuncies from public, anon, authenticated, service_role;
revoke all on table public.bloquejos from public, anon, authenticated, service_role;
grant select, insert on public.denuncies to authenticated;
grant insert on public.denuncies to anon;
grant select, insert, delete on public.bloquejos to authenticated;
grant select, insert, update, delete on public.denuncies, public.bloquejos to service_role;

-- ── 7 · L'RPC de les denúncies (SECURITY INVOKER) ───────────────────────────
create or replace function public.denuncia_contingut(
  p_objecte_tipus text,
  p_objecte_id    text,
  p_motiu         text,
  p_detall        text default null,
  p_autor_tipus   text default null,
  p_autor_id      text default null,
  p_fil_id        uuid default null,
  p_tenant_id     uuid default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_files integer;
begin
  if p_objecte_tipus is null
     or p_objecte_tipus not in ('publicacio', 'producte', 'esdeveniment', 'missatge', 'persona', 'entitat')
     or p_objecte_id is null or char_length(p_objecte_id) not between 1 and 200 or p_objecte_id !~ '^[A-Za-z0-9._:~-]+$'
     or (p_autor_tipus is not null and p_autor_tipus not in ('persona', 'entitat'))
     or (p_autor_id is not null and (char_length(p_autor_id) not between 1 and 200 or p_autor_id !~ '^[A-Za-z0-9._:~-]+$')) then
    raise exception 'SDP-MOD-001: el contingut denunciat no és vàlid.' using errcode = '22023';
  end if;
  if p_motiu is null or p_motiu not in ('ofensiu', 'spam_frau', 'desinformacio', 'altre') then
    raise exception 'SDP-MOD-002: el motiu de la denúncia no és vàlid.' using errcode = '22023';
  end if;
  if p_detall is not null and char_length(p_detall) > 1000 then
    raise exception 'SDP-MOD-003: el detall passa de 1.000 caràcters.' using errcode = '22023';
  end if;
  insert into public.denuncies (tenant_id, objecte_tipus, objecte_id, autor_tipus, autor_id, fil_id, motiu, detall)
  values (p_tenant_id, p_objecte_tipus, p_objecte_id, p_autor_tipus, p_autor_id, p_fil_id, p_motiu, p_detall);
  get diagnostics v_files = row_count;
  return jsonb_build_object('rebuda', true, 'repetida', v_files = 0);
end;
$$;
revoke execute on function public.denuncia_contingut(text, text, text, text, text, text, uuid, uuid) from public;
grant execute on function public.denuncia_contingut(text, text, text, text, text, text, uuid, uuid) to anon, authenticated;

-- ── 8 · Les normes de convivència acceptades ────────────────────────────────
create table if not exists private.normes_acceptades (
  usuari_id    uuid not null references auth.users (id) on delete cascade,
  versio       text not null constraint normes_acceptades_versio_valida check (versio ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  acceptada_al timestamptz not null default now(),
  ip_hash      text,
  primary key (usuari_id, versio)
);
alter table private.normes_acceptades enable row level security;
revoke all on table private.normes_acceptades from public, anon, authenticated;

create or replace function public.accepta_normes_convivencia(p_versio text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo   uuid := (select auth.uid());
  v_al   timestamptz;
  v_data date;
  v_n    integer;
begin
  if v_jo is null then
    raise exception 'SDP-MOD-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_versio is null or p_versio !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'SDP-MOD-005: la versió de les normes no és vàlida.' using errcode = '22023';
  end if;
  -- Fase D (261020, revisió) · Una data real i que no siga futura al
  -- calendari de Madrid, on es publiquen les normes: ningú no accepta unes
  -- normes que encara no existixen (ni '9999-99-99').
  begin
    v_data := p_versio::date;
  exception when invalid_datetime_format or datetime_field_overflow then
    v_data := null;
  end;
  if v_data is null or v_data > (now() at time zone 'Europe/Madrid')::date then
    raise exception 'SDP-MOD-005: la versió de les normes no és vàlida.' using errcode = '22023';
  end if;
  -- Fase D (261020, revisió) · 20 versions per persona com a molt, sota el
  -- seu pany: tornar a acceptar la mateixa no en suma cap.
  perform pg_advisory_xact_lock(hashtextextended('normes:' || v_jo::text, 0));
  if not exists (select 1 from private.normes_acceptades n where n.usuari_id = v_jo and n.versio = p_versio) then
    select count(*) into v_n from private.normes_acceptades n where n.usuari_id = v_jo;
    if v_n >= 20 then
      raise exception 'SDP-MOD-429: has arribat al màxim de 20 versions de les normes acceptades.' using errcode = '42900';
    end if;
  end if;
  insert into private.normes_acceptades (usuari_id, versio, ip_hash)
  values (v_jo, p_versio, private.empremta_ip_moderacio())
  on conflict (usuari_id, versio) do nothing;
  select n.acceptada_al into v_al from private.normes_acceptades n where n.usuari_id = v_jo and n.versio = p_versio;
  return jsonb_build_object('versio', p_versio, 'acceptada_al', v_al);
end;
$$;
revoke execute on function public.accepta_normes_convivencia(text) from public, anon;
grant execute on function public.accepta_normes_convivencia(text) to authenticated;

create or replace function public.estat_normes_convivencia(p_versio text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'versio', p_versio,
    'acceptada_al', (select n.acceptada_al from private.normes_acceptades n
                      where n.usuari_id = (select auth.uid()) and n.versio = p_versio));
$$;
revoke execute on function public.estat_normes_convivencia(text) from public, anon;
grant execute on function public.estat_normes_convivencia(text) to authenticated;

notify pgrst, 'reload schema';

commit;
