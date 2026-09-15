-- ==============================================================================
-- MIGRACIÓ: Xat v2 · PEGAT CORRECTIU (260908)
-- ==============================================================================
-- S'aplica DESPRÉS de 260908_xat_v2.sql. És idempotent: es pot executar les
-- voltes que faça falta.
--
-- PER QUÈ EXISTIX AQUEST FITXER
-- ─────────────────────────────
-- 260908_xat_v2.sql crea les quatre taules correctament, però el xat no pot
-- funcionar tal com està. Tres defectes estructurals:
--
--   P0-A · La política "xat_participants_insercio" és un peix que es mossega
--          la cua. La subconsulta `(select creat_per from public.xat_fils
--          where id = fil_id)` s'avalua AMB RLS. Per a llegir eixa fila cal
--          passar "xat_fils_lectura", que exigix ser participant. Qui acaba de
--          crear el fil encara no ho és → la subconsulta torna 0 files → NULL
--          → `false OR NULL` = NULL → INSERT rebutjat. Ningú pot afegir mai el
--          primer participant. Cap fil arriba a ser utilitzable.
--
--   P0-B · "profiles read own" (esquema inicial, línia 858) només deixa llegir
--          el teu propi perfil. No hi ha cap camí per a saber com es diu l'altra
--          persona de la conversa. El xat mostraria "Usuari" per sempre.
--          No s'obri profiles: s'obri NOMÉS el nom de qui comparteix fil amb tu,
--          i a través d'una funció, no d'una política.
--
--   P0-C · Amb el seed actual, `xat_fils` queda BUIDA (seed.sql només omple
--          l'antiga `chat_threads`) i no hi ha cap manera de crear un fil.
--          `crea_fil_directe` és eixa manera.
--
-- Tot allò que travessa RLS ho fa per SECURITY DEFINER amb `search_path = ''`
-- i noms qualificats, com la resta de l'esquema.
-- ==============================================================================


-- ══════════════════════════════════════════════════════════════════════════
-- 1 · ÍNDEXS
-- Sense estos, cada obertura de conversa és un seqüencial sobre xat_missatges.
-- ══════════════════════════════════════════════════════════════════════════

create index if not exists idx_xat_missatges_fil_creat
  on public.xat_missatges (fil_id, creat_al desc);

create index if not exists idx_xat_participants_usuari
  on public.xat_participants (usuari_id);

create index if not exists idx_xat_fils_tenant_actualitzat
  on public.xat_fils (tenant_id, actualitzat_al desc);

create index if not exists idx_xat_lectures_usuari
  on public.xat_lectures (usuari_id);


-- ══════════════════════════════════════════════════════════════════════════
-- 2 · COLUMNA `es_ia`
-- XatSection.jsx llig `msg.is_ai` des de fa temps. Eixe camp no existix ni a la
-- taula ni al mapeig: és un camp fantasma que sempre val undefined. O s'esborra
-- del frontend o es fa real. Es fa real, perquè el fil de la IAIA MarIA el
-- necessitarà, i costa una columna amb default.
-- ══════════════════════════════════════════════════════════════════════════

alter table public.xat_missatges
  add column if not exists es_ia boolean not null default false;


-- ══════════════════════════════════════════════════════════════════════════
-- 3 · PERMISOS DE `private.es_participant`
-- La migració original la va crear sense revoke/grant explícits, a diferència
-- de TOTES les altres funcions de `private` a l'esquema inicial (línies 470-481).
-- Per defecte, EXECUTE és de PUBLIC. Ara mateix no és explotable perquè `anon`
-- no té USAGE sobre l'esquema `private`, però la defensa no pot dependre d'un
-- detall que està escrit en un altre fitxer.
-- ══════════════════════════════════════════════════════════════════════════

revoke execute on function private.es_participant(uuid) from public;
revoke execute on function private.es_participant(uuid) from anon;
grant  execute on function private.es_participant(uuid) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 4 · CORRECCIÓ P0-A · el peix que es mossega la cua
-- ══════════════════════════════════════════════════════════════════════════

-- Mateix patró que `es_participant`: llig `xat_fils` per damunt de RLS, així que
-- el creador es reconeix a si mateix abans de ser participant.
create or replace function private.es_creador_del_fil(p_fil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_fils f
    where f.id = p_fil_id
      and f.creat_per = (select auth.uid())
  );
$$;

revoke execute on function private.es_creador_del_fil(uuid) from public;
revoke execute on function private.es_creador_del_fil(uuid) from anon;
grant  execute on function private.es_creador_del_fil(uuid) to authenticated;

drop policy if exists "xat_participants_insercio" on public.xat_participants;
create policy "xat_participants_insercio" on public.xat_participants
for insert to authenticated
with check (
  private.es_participant(fil_id)
  or private.es_creador_del_fil(fil_id)
);

-- Un participant ha de poder eixir-se'n. Sense esta política, el GRANT DELETE
-- de la migració original no servix per a res (cap política = denegat).
drop policy if exists "xat_participants_eixida" on public.xat_participants;
create policy "xat_participants_eixida" on public.xat_participants
for delete to authenticated
using (usuari_id = (select auth.uid()));


-- ══════════════════════════════════════════════════════════════════════════
-- 5 · RPC · crear un fil directe (idempotent)
--
-- IDEMPOTÈNCIA: si ja existix un fil d'exactament dos participants amb estes
-- dos persones, es torna eixe. La lliçó de `create_organization` és que crear
-- dues voltes no és una funcionalitat, és un error de disseny.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.crea_fil_directe(
  p_tenant_id     uuid,
  p_altre_usuari  uuid,
  p_titol         text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo  uuid := (select auth.uid());
  v_fil uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;

  if p_altre_usuari is null or p_altre_usuari = v_jo then
    raise exception 'SDP-XAT-002: cal una altra persona, distinta de tu.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.town_memberships m
    where m.town_id = p_tenant_id and m.user_id = v_jo
  ) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.town_memberships m
    where m.town_id = p_tenant_id and m.user_id = p_altre_usuari
  ) then
    raise exception 'SDP-XAT-004: l''altra persona no és membre d''aquest poble.' using errcode = '42501';
  end if;

  select f.id into v_fil
  from public.xat_fils f
  where f.tenant_id = p_tenant_id
    and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id and p.usuari_id = v_jo)
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id and p.usuari_id = p_altre_usuari)
  order by f.creat_al asc
  limit 1;

  if v_fil is not null then
    return v_fil;
  end if;

  insert into public.xat_fils (tenant_id, titol, creat_per)
  values (p_tenant_id, nullif(btrim(coalesce(p_titol, '')), ''), v_jo)
  returning id into v_fil;

  insert into public.xat_participants (fil_id, usuari_id)
  values (v_fil, v_jo), (v_fil, p_altre_usuari)
  on conflict do nothing;

  return v_fil;
end;
$$;

revoke execute on function public.crea_fil_directe(uuid, uuid, text) from public;
revoke execute on function public.crea_fil_directe(uuid, uuid, text) from anon;
grant  execute on function public.crea_fil_directe(uuid, uuid, text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 6 · RPC · els meus fils
--
-- Una crida, no N+1. Torna el que la barra lateral ja pinta: nom, avanç de
-- l'últim missatge, hora i no llegits. CORRECCIÓ P0-B: `altres_noms` és
-- l'única escletxa cap a `profiles`, i només per a qui comparteix fil amb tu.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id              uuid,
  titol           text,
  actualitzat_al  timestamptz,
  altres_noms     text[],
  ultim_text      text,
  ultim_al        timestamptz,
  no_llegits      integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id,
    f.titol,
    f.actualitzat_al,
    coalesce((
      select array_agg(coalesce(pr.full_name, 'Veí') order by pr.full_name)
      from public.xat_participants p
      left join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id
        and p.usuari_id <> (select auth.uid())
    ), array[]::text[]) as altres_noms,
    u.text     as ultim_text,
    u.creat_al as ultim_al,
    (
      select count(*)::integer
      from public.xat_missatges m
      where m.fil_id = f.id
        and m.usuari_id <> (select auth.uid())
        and m.creat_al > coalesce(
          (select l.ultim_llegit_al
             from public.xat_lectures l
            where l.fil_id = f.id and l.usuari_id = (select auth.uid())),
          '-infinity'::timestamptz
        )
    ) as no_llegits
  from public.xat_fils f
  join public.xat_participants jo
    on jo.fil_id = f.id
   and jo.usuari_id = (select auth.uid())
  left join lateral (
    select m.text, m.creat_al
    from public.xat_missatges m
    where m.fil_id = f.id
    order by m.creat_al desc
    limit 1
  ) u on true
  where f.tenant_id = p_tenant_id
  order by coalesce(u.creat_al, f.actualitzat_al) desc;
$$;

revoke execute on function public.xat_fils_meus(uuid) from public;
revoke execute on function public.xat_fils_meus(uuid) from anon;
grant  execute on function public.xat_fils_meus(uuid) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 7 · RPC · missatges d'un fil, amb el nom de qui els ha escrit
--
-- La columna de text s'anomena `cos` i no `text` a propòsit: dins de plpgsql,
-- una variable de retorn dita `text` col·lisiona amb el nom del tipus.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.xat_missatges_del_fil(
  p_fil_id uuid,
  p_limit  integer default 200
)
returns table (
  id         uuid,
  usuari_id  uuid,
  autor_nom  text,
  cos        text,
  es_ia      boolean,
  creat_al   timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;

  return query
    select
      m.id,
      m.usuari_id,
      coalesce(pr.full_name, 'Veí')::text,
      m.text,
      m.es_ia,
      m.creat_al
    from public.xat_missatges m
    left join public.profiles pr on pr.id = m.usuari_id
    where m.fil_id = p_fil_id
    order by m.creat_al asc
    limit greatest(1, least(coalesce(p_limit, 200), 500));
end;
$$;

revoke execute on function public.xat_missatges_del_fil(uuid, integer) from public;
revoke execute on function public.xat_missatges_del_fil(uuid, integer) from anon;
grant  execute on function public.xat_missatges_del_fil(uuid, integer) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 8 · RPC · marcar llegit
--
-- L'`upsert` que feia el frontend contra /rest/v1/xat_lectures NO avançava mai
-- la marca: `ultim_llegit_al` no anava al cos de la petició, i PostgREST només
-- actualitza les columnes que rep. La primera lectura entrava i la resta es
-- perdien en silenci. Ací el rellotge el posa el servidor.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.xat_marca_llegit(p_fil_id uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ara timestamptz := now();
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;

  insert into public.xat_lectures (fil_id, usuari_id, ultim_llegit_al)
  values (p_fil_id, (select auth.uid()), v_ara)
  on conflict (fil_id, usuari_id)
  do update set ultim_llegit_al = excluded.ultim_llegit_al;

  return v_ara;
end;
$$;

revoke execute on function public.xat_marca_llegit(uuid) from public;
revoke execute on function public.xat_marca_llegit(uuid) from anon;
grant  execute on function public.xat_marca_llegit(uuid) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 9 · REALTIME (DESACTIVAT A PROPÒSIT)
--
-- Les taules del xat NO estan a la publicació `supabase_realtime`. Mentre no
-- hi estiguen, qualsevol subscripció Realtime es connecta, no dóna cap error i
-- no rep res mai: el pitjor mode de fallada que hi ha.
--
-- El frontend d'aquesta entrega fa sondeig adaptatiu (vegeu XatContext.jsx),
-- que NO necessita això. Si algun dia s'obri el WebSocket, descomenta el bloc
-- i comprova que Realtime RLS està actiu al panell de Supabase; si no, els
-- missatges es difonen a qui no toca.
--
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'xat_missatges'
  ) then
    alter publication supabase_realtime add table public.xat_missatges;
  end if;
end
$$;
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 10 · Restauració de Política d'Inserció
--
-- Restaurem la política d'inserció de missatges que ara ja pot comprovar
-- la columna `es_ia` (creada en la secció 2 d'aquest fitxer).
-- ══════════════════════════════════════════════════════════════════════════

drop policy if exists "xat_missatges_insercio" on public.xat_missatges;
create policy "xat_missatges_insercio" on public.xat_missatges for insert to authenticated
with check (private.es_participant(fil_id) and usuari_id = (select auth.uid()) and es_ia = false);
