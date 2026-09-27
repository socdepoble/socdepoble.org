-- ============================================================================
-- 260927_0200 · Xat F0 (Fonament): número d'ordre, marques, RPC idempotents
-- Pla 260927_0055_pla_implementacio_fable_xat (§4.A) sobre l'especificació
-- 260926_2330_skill_esborrany_xat (ARQ-A, ARQ-C01..C03, ARQ-D01, ARQ-E01..E06,
-- ARQ-F01, ARQ-K01, ARQ-K02).
--
-- Additiva i idempotent: es pot tornar a executar. Requerix 260908_xat_v2,
-- 260908_xat_v2_correccions, 260908_xat_v2_membres, 260916_2300, 260920_0600
-- i 260926_1500 aplicades. Mateix estil que 260926_1500: una sola transacció
-- amb temps d'espera curts. Revisada i NO aplicada a cap base de dades.
--
--   1. xat_fils: tipus, ultim_seq, descripcio, imatge_url, permisos, temporal,
--      comunitat_id, org_id i llargària del títol (ARQ-C01).
--   2. xat_participants: rol, finestra visible, marques per seq i ajustos
--      personals (ARQ-C02).
--   3. xat_missatges: seq i columnes de làpida, cita, caducitat i metadades;
--      relleno del seq existent i de les marques des de xat_lectures (ARQ-C03).
--   4. Disparador que numera dins de la mateixa transacció (ARQ-A03).
--   5. Cap escriptura directa des del client: tot per RPC (ARQ-A05).
--   6. Visibilitat per finestra de seq i membre actiu (ARQ-D01).
--   7. xat_lectures tancada als participants del fil.
--   8. RPC: xat_envia, xat_historial, xat_nous, xat_marca, xat_fils_meus v2,
--      xat_marca_llegit conservada (ARQ-E01..E06).
--   9. Avís de temps real des de la base de dades, sense tombar cap enviament
--      (ARQ-F01). Les polítiques sobre realtime.messages NO entren ací.
--
-- Codis nous (cap text de missatge als errors, ARQ-J06):
--   SDP-XAT-006  no eres membre actiu del fil
--   SDP-XAT-007  missatge buit o massa llarg
--   SDP-XAT-008  identificador d'una altra persona
--   SDP-XAT-009  cursor, límit o paràmetre invàlid
--   SDP-XAT-010  tipus de missatge reservat al servidor o no admés encara
--   SDP-XAT-901  (avís) títols de més de 100 caràcters: restricció sense validar
--   SDP-XAT-902  (avís) textos de més de 4096 caràcters: restricció sense validar
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';


-- ── 1 · Converses (ARQ-C01) ──────────────────────────────────────────────────
alter table public.xat_fils
  add column if not exists tipus text not null default 'directe'
    constraint xat_fils_tipus_valid
    check (tipus in ('directe', 'grup', 'comunitat', 'canal', 'personal', 'iaia'));
alter table public.xat_fils
  add column if not exists ultim_seq bigint not null default 0;
alter table public.xat_fils
  add column if not exists descripcio text
    constraint xat_fils_descripcio_llargaria check (char_length(descripcio) <= 2048);
alter table public.xat_fils
  add column if not exists imatge_url text;
alter table public.xat_fils
  add column if not exists permisos jsonb not null default '{}'::jsonb;
-- Missatges temporals (F2): 24 h, 7 dies o 90 dies. El disparador de seq
-- l'usa per a omplir caduca_al; sense valor, cap missatge caduca.
alter table public.xat_fils
  add column if not exists temporal_segons integer
    constraint xat_fils_temporal_valid check (temporal_segons in (86400, 604800, 7776000));
alter table public.xat_fils
  add column if not exists comunitat_id uuid references public.xat_fils (id) on delete set null;
alter table public.xat_fils
  add column if not exists org_id uuid references public.organizations (id) on delete set null;

-- Llargària del títol: not valid perquè no bloquege files velles; es valida
-- només si cap fila la trenca (si no, SDP-XAT-901 i es queda sense validar).
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
                 where conrelid = 'public.xat_fils'::regclass and conname = 'xat_fils_titol_llargaria') then
    alter table public.xat_fils
      add constraint xat_fils_titol_llargaria check (char_length(titol) <= 100) not valid;
  end if;
  if exists (select 1 from public.xat_fils where char_length(titol) > 100) then
    raise notice 'SDP-XAT-901: hi ha títols de més de 100 caràcters; xat_fils_titol_llargaria queda sense validar.';
  else
    alter table public.xat_fils validate constraint xat_fils_titol_llargaria;
  end if;
end
$$;


-- ── 2 · Participants (ARQ-C02) ───────────────────────────────────────────────
-- creat_al ja fa de data d'entrada. visible_fins_seq null = membre actiu.
alter table public.xat_participants
  add column if not exists rol text not null default 'membre'
    constraint xat_participants_rol_valid check (rol in ('propietari', 'admin', 'membre'));
alter table public.xat_participants
  add column if not exists eixit_al timestamptz;
alter table public.xat_participants
  add column if not exists visible_des_de_seq bigint not null default 0;
alter table public.xat_participants
  add column if not exists visible_fins_seq bigint;
alter table public.xat_participants
  add column if not exists llegit_fins_seq bigint not null default 0;
alter table public.xat_participants
  add column if not exists rebut_fins_seq bigint not null default 0;
alter table public.xat_participants
  add column if not exists buidat_fins_seq bigint not null default 0;
alter table public.xat_participants
  add column if not exists silenciat_fins_al timestamptz;
alter table public.xat_participants
  add column if not exists arxivat_al timestamptz;
alter table public.xat_participants
  add column if not exists fixat_al timestamptz;
alter table public.xat_participants
  add column if not exists preferit_al timestamptz;
alter table public.xat_participants
  add column if not exists no_llegit_manual boolean not null default false;
alter table public.xat_participants
  add column if not exists avisos text not null default 'tots'
    constraint xat_participants_avisos_valid check (avisos in ('tots', 'destacats', 'cap'));
alter table public.xat_participants
  add column if not exists etiqueta text
    constraint xat_participants_etiqueta_llargaria check (char_length(etiqueta) <= 30);
alter table public.xat_participants
  add column if not exists com_org_id uuid references public.organizations (id) on delete set null;

create index if not exists xat_participants_usuari_idx
  on public.xat_participants (usuari_id, fil_id);


-- ── 3 · Missatges (ARQ-C03, ARQ-K01) ─────────────────────────────────────────
-- text deixa de ser obligatori: làpides (ARQ-A04) i, en F1, missatges només amb adjunt.
alter table public.xat_missatges alter column text drop not null;

alter table public.xat_missatges
  add column if not exists seq bigint;
alter table public.xat_missatges
  add column if not exists tipus text not null default 'text'
    constraint xat_missatges_tipus_valid
    check (tipus in ('text', 'imatge', 'video', 'veu', 'nota_video', 'document', 'ubicacio',
                     'contacte', 'enquesta', 'esdeveniment', 'adhesiu', 'sistema'));
alter table public.xat_missatges
  add column if not exists resposta_a uuid references public.xat_missatges (id) on delete set null;
alter table public.xat_missatges
  add column if not exists cadena_arrel uuid references public.xat_missatges (id) on delete set null;
alter table public.xat_missatges
  add column if not exists reenviat boolean not null default false;
alter table public.xat_missatges
  add column if not exists reenviaments smallint not null default 0;
alter table public.xat_missatges
  add column if not exists editat_al timestamptz;
alter table public.xat_missatges
  add column if not exists esborrat_al timestamptz;
alter table public.xat_missatges
  add column if not exists esborrat_per uuid references auth.users (id) on delete set null;
alter table public.xat_missatges
  add column if not exists caduca_al timestamptz;
alter table public.xat_missatges
  add column if not exists metadades jsonb not null default '{}'::jsonb;
alter table public.xat_missatges
  add column if not exists versio_xifrat smallint not null default 0;

-- Llargària del text: mateix patró que el títol (SDP-XAT-902 si no es pot validar).
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
                 where conrelid = 'public.xat_missatges'::regclass and conname = 'xat_missatges_text_llargaria') then
    alter table public.xat_missatges
      add constraint xat_missatges_text_llargaria check (char_length(text) <= 4096) not valid;
  end if;
  if exists (select 1 from public.xat_missatges where char_length(text) > 4096) then
    raise notice 'SDP-XAT-902: hi ha textos de més de 4096 caràcters; xat_missatges_text_llargaria queda sense validar.';
  else
    alter table public.xat_missatges validate constraint xat_missatges_text_llargaria;
  end if;
end
$$;

-- Relleno del seq: per conversa, en l'ordre d'arribada (creat_al, id), a
-- continuació del màxim que ja hi haja (una segona execució no toca res).
with base as (
  select m.fil_id, coalesce(max(m.seq), 0) as ultim
  from public.xat_missatges m
  group by m.fil_id
),
numerats as (
  select x.id,
         b.ultim + row_number() over (partition by x.fil_id order by x.creat_al, x.id) as nou_seq
  from public.xat_missatges x
  join base b on b.fil_id = x.fil_id
  where x.seq is null
)
update public.xat_missatges m
   set seq = n.nou_seq
  from numerats n
 where n.id = m.id;

alter table public.xat_missatges alter column seq set not null;

create unique index if not exists xat_missatges_seq_uq
  on public.xat_missatges (fil_id, seq);

create index if not exists xat_missatges_caduca_idx
  on public.xat_missatges (caduca_al)
  where caduca_al is not null and esborrat_al is null;

-- El comptador de cada conversa arranca al màxim ja numerat.
update public.xat_fils f
   set ultim_seq = s.maxim
  from (select m.fil_id, max(m.seq) as maxim from public.xat_missatges m group by m.fil_id) s
 where s.fil_id = f.id
   and f.ultim_seq < s.maxim;

-- Convivència amb xat_lectures (DEC-04): la marca per hora es traduïx a la
-- marca per seq (l'últim missatge amb creat_al <= ultim_llegit_al). Mai retrocedix.
update public.xat_participants p
   set llegit_fins_seq = greatest(
         p.llegit_fins_seq,
         coalesce((select max(m.seq)
                     from public.xat_missatges m
                    where m.fil_id = p.fil_id
                      and m.creat_al <= l.ultim_llegit_al), 0))
  from public.xat_lectures l
 where l.fil_id = p.fil_id
   and l.usuari_id = p.usuari_id;

-- Els missatges propis compten com a llegits per qui els ha escrit.
update public.xat_participants p
   set llegit_fins_seq = greatest(p.llegit_fins_seq, s.maxim)
  from (select m.fil_id, m.usuari_id, max(m.seq) as maxim
          from public.xat_missatges m
         group by m.fil_id, m.usuari_id) s
 where s.fil_id = p.fil_id
   and s.usuari_id = p.usuari_id
   and p.llegit_fins_seq < s.maxim;

-- Rebut no pot anar per darrere de llegit.
update public.xat_participants p
   set rebut_fins_seq = p.llegit_fins_seq
 where p.rebut_fins_seq < p.llegit_fins_seq;


-- ── 4 · Numeració dins de la transacció (ARQ-A03) ────────────────────────────
-- El bloqueig de la fila de la conversa serialitza els enviaments d'eixa
-- conversa, i només d'eixa. Substituïx on_nou_missatge (AFTER), que només
-- tocava actualitzat_al. El límit de freqüència (trg_rate_limit_xat) es queda.
create or replace function private.xat_assigna_seq()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_temporal integer;
begin
  update public.xat_fils f
     set ultim_seq = f.ultim_seq + 1,
         actualitzat_al = now()
   where f.id = new.fil_id
  returning f.ultim_seq, f.temporal_segons into new.seq, v_temporal;

  if new.seq is null then
    -- Sense conversa no hi ha número: la clau forana ho rebutjarà igualment.
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;

  new.creat_al := now();
  if v_temporal is not null then
    new.caduca_al := now() + make_interval(secs => v_temporal);
  end if;
  return new;
end;
$$;
-- Funció de disparador: cap client la crida.
revoke execute on function private.xat_assigna_seq() from public, anon, authenticated;

drop trigger if exists on_nou_missatge on public.xat_missatges;
drop function if exists public.trg_actualitza_xat_fil();

drop trigger if exists xat_missatges_seq on public.xat_missatges;
create trigger xat_missatges_seq before insert on public.xat_missatges
  for each row execute function private.xat_assigna_seq();


-- ── 5 · Totes les escriptures per RPC (ARQ-A05) ──────────────────────────────
-- Revocar sobre la taula també retira el permís per columnes de 260908_xat_v2.
revoke insert on table public.xat_missatges from authenticated;
drop policy if exists "xat_missatges_insercio" on public.xat_missatges;


-- ── 6 · Qui veu quins missatges (ARQ-D01) ────────────────────────────────────
-- es_participant passa a exigir membre actiu: qui ix d'un grup (F1) no pot
-- continuar llegint-lo per les RPC antigues ni pels canals.
create or replace function private.es_participant(p_fil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_participants p
    where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
      and p.visible_fins_seq is null
  );
$$;
revoke execute on function private.es_participant(uuid) from public, anon;
grant execute on function private.es_participant(uuid) to authenticated;

-- Un seq és visible per a mi si soc o he sigut membre, és posterior a la
-- meua entrada i al que he buidat, i anterior a la meua eixida.
create or replace function private.seq_visible(p_fil_id uuid, p_seq bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_participants p
    where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
      and p_seq > greatest(p.visible_des_de_seq, p.buidat_fins_seq)
      and (p.visible_fins_seq is null or p_seq <= p.visible_fins_seq)
  );
$$;
revoke execute on function private.seq_visible(uuid, bigint) from public, anon;
grant execute on function private.seq_visible(uuid, bigint) to authenticated;

create or replace function private.es_admin_del_fil(p_fil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_participants p
    where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
      and p.visible_fins_seq is null
      and p.rol in ('propietari', 'admin')
  );
$$;
revoke execute on function private.es_admin_del_fil(uuid) from public, anon;
grant execute on function private.es_admin_del_fil(uuid) to authenticated;

drop policy if exists "xat_missatges_lectura" on public.xat_missatges;
create policy "xat_missatges_lectura" on public.xat_missatges
for select to authenticated
using (
  private.seq_visible(fil_id, seq)
  and (caduca_al is null or caduca_al > now())
);


-- ── 7 · xat_lectures només per a participants ────────────────────────────────
-- Fins ara qualsevol autenticat podia escriure lectures a fils aliens.
drop policy if exists "xat_lectures_lectura" on public.xat_lectures;
create policy "xat_lectures_lectura" on public.xat_lectures
for select to authenticated
using (usuari_id = (select auth.uid()) and private.es_participant(fil_id));

drop policy if exists "xat_lectures_insercio" on public.xat_lectures;
create policy "xat_lectures_insercio" on public.xat_lectures
for insert to authenticated
with check (usuari_id = (select auth.uid()) and private.es_participant(fil_id));

drop policy if exists "xat_lectures_actualitzacio" on public.xat_lectures;
create policy "xat_lectures_actualitzacio" on public.xat_lectures
for update to authenticated
using (usuari_id = (select auth.uid()) and private.es_participant(fil_id))
with check (usuari_id = (select auth.uid()) and private.es_participant(fil_id));


-- ── 8 · RPC ──────────────────────────────────────────────────────────────────

-- 8.1 · Enviar, idempotent per id (ARQ-E01). El client genera l'identificador
-- abans d'enviar; si el mateix missatge arriba dos vegades, es guarda una.
-- Si l'identificador ja és d'una altra persona: SDP-XAT-008. En F0 el client
-- només pot enviar 'text'; la resta de tipus són del servidor o de fases
-- posteriors (SDP-XAT-010). El límit de freqüència el posa trg_rate_limit_xat.
create or replace function public.xat_envia(
  p_id         uuid,
  p_fil_id     uuid,
  p_tipus      text  default 'text',
  p_text       text  default null,
  p_resposta_a uuid  default null,
  p_metadades  jsonb default '{}'::jsonb
)
returns table (id uuid, seq bigint, creat_al timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo       uuid := (select auth.uid());
  v_tipus    text := coalesce(nullif(btrim(p_tipus), ''), 'text');
  v_text     text := btrim(p_text);
  v_meta     jsonb := coalesce(p_metadades, '{}'::jsonb);
  v_id       uuid;
  v_seq      bigint;
  v_creat_al timestamptz;
  v_autor    uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_id is null or p_fil_id is null then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if v_tipus <> 'text' then
    raise exception 'SDP-XAT-010: tipus de missatge no admés des del client.' using errcode = '22023';
  end if;
  if v_text is null or v_text = '' or char_length(v_text) > 4096 then
    raise exception 'SDP-XAT-007: missatge buit o massa llarg.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_meta) <> 'object' then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.xat_participants p
    where p.fil_id = p_fil_id and p.usuari_id = v_jo and p.visible_fins_seq is null
  ) then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  if p_resposta_a is not null and not exists (
    select 1 from public.xat_missatges m
    where m.id = p_resposta_a and m.fil_id = p_fil_id
  ) then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;

  -- Ja existix? Si és meu, es torna tal com està; si no, error.
  select m.id, m.seq, m.creat_al, m.usuari_id
    into v_id, v_seq, v_creat_al, v_autor
  from public.xat_missatges m
  where m.id = p_id;
  if found then
    if v_autor is distinct from v_jo then
      raise exception 'SDP-XAT-008: identificador d''una altra persona.' using errcode = '42501';
    end if;
    return query select v_id, v_seq, v_creat_al;
    return;
  end if;

  -- Dos enviaments simultanis del mateix id: el segon espera l'índex únic i no
  -- fa res; després es torna a llegir el que ha quedat.
  insert into public.xat_missatges (id, fil_id, usuari_id, text, tipus, resposta_a, metadades, es_ia)
  values (p_id, p_fil_id, v_jo, v_text, v_tipus, p_resposta_a, v_meta, false)
  on conflict (id) do nothing;

  select m.id, m.seq, m.creat_al, m.usuari_id
    into v_id, v_seq, v_creat_al, v_autor
  from public.xat_missatges m
  where m.id = p_id;
  if not found or v_autor is distinct from v_jo then
    raise exception 'SDP-XAT-008: identificador d''una altra persona.' using errcode = '42501';
  end if;

  -- El que escric ja ho he llegit: el comptador propi no puja.
  update public.xat_participants p
     set llegit_fins_seq = greatest(p.llegit_fins_seq, v_seq),
         rebut_fins_seq  = greatest(p.rebut_fins_seq, v_seq)
   where p.fil_id = p_fil_id
     and p.usuari_id = v_jo;

  return query select v_id, v_seq, v_creat_al;
end;
$$;
revoke execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) from public, anon;
grant execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) to authenticated;


-- 8.2 · Historial per cursor (ARQ-E02): seq < cursor, 50 per defecte, 100 com
-- a màxim, dins de la meua finestra visible i sense els caducats. Les làpides
-- (esborrat_al) es tornen amb cos null: conserven el seq per a cites i marques.
-- Sense cursor, els últims. El resultat va en ordre ascendent de seq.
-- `cos` i no `text`: dins de plpgsql el nom col·lidiria amb el tipus.
-- Qui ha eixit del fil (F1) llig només fins a visible_fins_seq.
create or replace function public.xat_historial(
  p_fil_id       uuid,
  p_abans_de_seq bigint  default null,
  p_limit        integer default 50
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo     uuid := (select auth.uid());
  v_limit  integer := coalesce(p_limit, 50);
  v_des_de bigint;
  v_fins   bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or v_limit < 1 or v_limit > 100
     or (p_abans_de_seq is not null and p_abans_de_seq < 1) then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select greatest(p.visible_des_de_seq, p.buidat_fins_seq), p.visible_fins_seq
    into v_des_de, v_fins
  from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select * from (
      select
        m.id,
        m.fil_id,
        m.seq,
        m.usuari_id,
        coalesce(pr.full_name, 'Veí')::text as autor_nom,
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
      where m.fil_id = p_fil_id
        and m.seq > v_des_de
        and (v_fins is null or m.seq <= v_fins)
        and (p_abans_de_seq is null or m.seq < p_abans_de_seq)
        and (m.caduca_al is null or m.caduca_al > now())
      order by m.seq desc
      limit v_limit
    ) sub
    order by sub.seq asc;
end;
$$;
revoke execute on function public.xat_historial(uuid, bigint, integer) from public, anon;
grant execute on function public.xat_historial(uuid, bigint, integer) to authenticated;


-- 8.3 · Els que han arribat mentre no hi era (ARQ-E04): seq > cursor, en
-- ordre ascendent. Es crida en rebre un avís o en tornar la connexió.
create or replace function public.xat_nous(
  p_fil_id         uuid,
  p_despres_de_seq bigint,
  p_limit          integer default 100
)
returns table (
  id          uuid,
  fil_id      uuid,
  seq         bigint,
  usuari_id   uuid,
  autor_nom   text,
  cos         text,
  tipus       text,
  resposta_a  uuid,
  editat_al   timestamptz,
  esborrat_al timestamptz,
  metadades   jsonb,
  es_ia       boolean,
  creat_al    timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo     uuid := (select auth.uid());
  v_limit  integer := coalesce(p_limit, 100);
  v_des_de bigint;
  v_fins   bigint;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null or p_despres_de_seq is null or p_despres_de_seq < 0
     or v_limit < 1 or v_limit > 500 then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select greatest(p.visible_des_de_seq, p.buidat_fins_seq), p.visible_fins_seq
    into v_des_de, v_fins
  from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select
      m.id,
      m.fil_id,
      m.seq,
      m.usuari_id,
      coalesce(pr.full_name, 'Veí')::text as autor_nom,
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
    where m.fil_id = p_fil_id
      and m.seq > greatest(v_des_de, p_despres_de_seq)
      and (v_fins is null or m.seq <= v_fins)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq asc
    limit v_limit;
end;
$$;
revoke execute on function public.xat_nous(uuid, bigint, integer) from public, anon;
grant execute on function public.xat_nous(uuid, bigint, integer) to authenticated;


-- 8.4 · Marcar rebut i llegit (ARQ-E05). greatest(): una marca mai retrocedix.
-- null = fins a l'últim missatge de la conversa. Convivència (DEC-04): la
-- marca per hora de xat_lectures també avança. Quan s'ha llegit tot, el
-- «marcar com a no llegit» manual s'apaga.
create or replace function public.xat_marca(
  p_fil_id      uuid,
  p_rebut_fins  bigint default null,
  p_llegit_fins bigint default null
)
returns table (rebut_fins_seq bigint, llegit_fins_seq bigint)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo       uuid := (select auth.uid());
  v_ultim    bigint;
  v_rebut    bigint;
  v_llegit   bigint;
  v_llegit_al timestamptz;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_fil_id is null
     or (p_rebut_fins is not null and p_rebut_fins < 0)
     or (p_llegit_fins is not null and p_llegit_fins < 0) then
    raise exception 'SDP-XAT-009: cursor o límit invàlid.' using errcode = '22023';
  end if;

  select f.ultim_seq into v_ultim
  from public.xat_fils f
  join public.xat_participants p on p.fil_id = f.id
  where f.id = p_fil_id
    and p.usuari_id = v_jo
    and p.visible_fins_seq is null;
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  v_llegit := least(coalesce(p_llegit_fins, v_ultim), v_ultim);
  v_rebut  := greatest(least(coalesce(p_rebut_fins, v_ultim), v_ultim), v_llegit);

  update public.xat_participants p
     set rebut_fins_seq   = greatest(p.rebut_fins_seq, v_rebut),
         llegit_fins_seq  = greatest(p.llegit_fins_seq, v_llegit),
         no_llegit_manual = case
           when greatest(p.llegit_fins_seq, v_llegit) >= v_ultim then false
           else p.no_llegit_manual
         end
   where p.fil_id = p_fil_id
     and p.usuari_id = v_jo
  returning p.rebut_fins_seq, p.llegit_fins_seq into v_rebut, v_llegit;

  select coalesce(
           (select m.creat_al from public.xat_missatges m
             where m.fil_id = p_fil_id and m.seq = v_llegit),
           now())
    into v_llegit_al;

  insert into public.xat_lectures as l (fil_id, usuari_id, ultim_llegit_al)
  values (p_fil_id, v_jo, v_llegit_al)
  on conflict (fil_id, usuari_id)
  do update set ultim_llegit_al = greatest(l.ultim_llegit_al, excluded.ultim_llegit_al);

  return query select v_rebut, v_llegit;
end;
$$;
revoke execute on function public.xat_marca(uuid, bigint, bigint) from public, anon;
grant execute on function public.xat_marca(uuid, bigint, bigint) to authenticated;


-- 8.5 · xat_marca_llegit conservada (compatibilitat): a més de l'hora, puja
-- llegit_fins_seq i rebut_fins_seq fins a l'últim missatge.
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

  update public.xat_participants p
     set llegit_fins_seq  = greatest(p.llegit_fins_seq, f.ultim_seq),
         rebut_fins_seq   = greatest(p.rebut_fins_seq, f.ultim_seq),
         no_llegit_manual = false
    from public.xat_fils f
   where f.id = p.fil_id
     and p.fil_id = p_fil_id
     and p.usuari_id = (select auth.uid());

  return v_ara;
end;
$$;
revoke execute on function public.xat_marca_llegit(uuid) from public, anon;
grant execute on function public.xat_marca_llegit(uuid) to authenticated;


-- 8.6 · Llista de converses v2 (ARQ-E06). El tipus de retorn canvia: create or
-- replace no ho admet, cal esborrar-la. Només converses on soc membre actiu.
-- L'últim missatge és l'últim que jo puc veure (finestra i caducitat).
-- llegit_pels_altres_fins_seq = el mínim entre els altres membres actius
-- (0 si no n'hi ha). no_llegits = ultim_seq - greatest(llegit, buidat).
-- altres_noms continua sent l'única escletxa cap a profiles (P0-B).
drop function if exists public.xat_fils_meus(uuid);
create function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id                          uuid,
  tipus                       text,
  titol                       text,
  imatge_url                  text,
  actualitzat_al              timestamptz,
  altres_noms                 text[],
  ultim_text                  text,
  ultim_al                    timestamptz,
  ultim_autor_id              uuid,
  ultim_seq                   bigint,
  llegit_fins_seq             bigint,
  rebut_fins_seq              bigint,
  llegit_pels_altres_fins_seq bigint,
  no_llegits                  integer,
  arxivat_al                  timestamptz,
  fixat_al                    timestamptz,
  silenciat_fins_al           timestamptz,
  preferit_al                 timestamptz,
  no_llegit_manual            boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id,
    f.tipus,
    f.titol,
    f.imatge_url,
    f.actualitzat_al,
    coalesce((
      select array_agg(coalesce(pr.full_name, 'Veí') order by pr.full_name)
      from public.xat_participants p
      left join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id
        and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null
    ), array[]::text[]) as altres_noms,
    u.text       as ultim_text,
    u.creat_al   as ultim_al,
    u.usuari_id  as ultim_autor_id,
    f.ultim_seq,
    jo.llegit_fins_seq,
    jo.rebut_fins_seq,
    coalesce((
      select min(p.llegit_fins_seq)
      from public.xat_participants p
      where p.fil_id = f.id
        and p.usuari_id <> (select auth.uid())
        and p.visible_fins_seq is null
    ), 0) as llegit_pels_altres_fins_seq,
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer as no_llegits,
    jo.arxivat_al,
    jo.fixat_al,
    jo.silenciat_fins_al,
    jo.preferit_al,
    jo.no_llegit_manual
  from public.xat_fils f
  join public.xat_participants jo
    on jo.fil_id = f.id
   and jo.usuari_id = (select auth.uid())
   and jo.visible_fins_seq is null
  left join lateral (
    select m.text, m.creat_al, m.usuari_id
    from public.xat_missatges m
    where m.fil_id = f.id
      and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq desc
    limit 1
  ) u on true
  where f.tenant_id = p_tenant_id
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
$$;
revoke execute on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;


-- ── 9 · Avís de temps real des de la base de dades (ARQ-F01) ─────────────────
-- Només avisa («hi ha missatges nous a partir del seq X»); el client demana
-- les dades amb xat_nous (ARQ-A06). Canal privat xat:f:<fil_id>. Cap error
-- de Realtime (funció absent, canal sense política) pot tombar un enviament.
-- Les polítiques sobre realtime.messages que autoritzen el canal (ARQ-D02)
-- no entren en este fitxer: la porta R1 de tractor-rls.mjs no exempta
-- l'esquema realtime. Sense elles, el client cau al sondeig.
create or replace function private.xat_avisa_nous()
returns trigger
language plpgsql volatile security definer set search_path = ''
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('filId', new.fil_id, 'seq', new.seq),
      'nous',
      'xat:f:' || new.fil_id::text,
      true
    );
  exception when others then
    null;
  end;
  return new;
end;
$$;
-- Funció de disparador: cap client la crida.
revoke execute on function private.xat_avisa_nous() from public, anon, authenticated;

drop trigger if exists xat_missatges_avisa on public.xat_missatges;
create trigger xat_missatges_avisa after insert on public.xat_missatges
  for each row execute function private.xat_avisa_nous();


notify pgrst, 'reload schema';
commit;
