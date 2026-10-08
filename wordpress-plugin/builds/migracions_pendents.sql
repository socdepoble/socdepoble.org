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
-- ============================================================================
-- 260927_1400 · Paperera i arxiu de Notes
-- Cicle de vida d'una nota: activa → paperera (30 dies) | arxivada, i esborrat
-- definitiu (DELETE, que «private delete notes» de 260914_0000 ja permet).
--
-- Additiva i idempotent: es pot tornar a executar. Requerix 260914_0000
-- (public.notes) i 260926_1500 (private.ajustos). Mateix estil que
-- 260926_1500: una sola transacció amb temps d'espera curts.
--
-- NO S'HA APLICAT: a l'entorn local no hi ha PostgreSQL. El client
-- (src/data/supabase/notes.js) ja demana status i filtra status=eq.activa:
-- fins que s'aplique, el mode remot de Notes no carrega (el mateix cas que la
-- columna copyright de 260926_2232).
--
--   1. Columnes status i trashed_at, coherència entre elles i índex.
--   2. trashed_at el fixa el servidor (trigger before insert or update): el
--      valor que envie el client no compta mai.
--   3. Purga als 30 dies: private.purga_paperera_notes, amb pg_cron si hi és.
--      L'arxiu no caduca.
--
-- La publicació al Mur es conserva: la clau forana va de la nota cap a
-- section_submissions (published_submission_id … on delete set null) i
-- esborrar la nota no hi toca.
--
-- Codis nous: SDP-NOTES-900.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Ajustos: dies que una nota es guarda a la paperera ───────────────────
insert into private.ajustos (clau, valor)
values ('dies_paperera_notes', '30')
on conflict (clau) do nothing;


-- ── 1 · Estat de la nota ─────────────────────────────────────────────────────
alter table public.notes
  add column if not exists status text not null default 'activa'
    constraint notes_status_valid check (status in ('activa', 'paperera', 'arxivada'));

alter table public.notes
  add column if not exists trashed_at timestamptz;

-- Una nota és a la paperera si i només si té data d'entrada.
alter table public.notes drop constraint if exists notes_paperera_amb_data;
alter table public.notes
  add constraint notes_paperera_amb_data check ((status = 'paperera') = (trashed_at is not null));

-- El Bloc llista les actives d'una persona per id descendent (cursor de
-- loadNotesPage); la purga busca per estat.
create index if not exists idx_notes_tenant_owner_status
  on public.notes (tenant_id, owner_user_id, status, id desc);


-- ── 2 · La data d'entrada a la paperera la posa el servidor ──────────────────
-- En entrar-hi, now(); en eixir-ne, null; si l'estat no canvia, la que hi
-- havia. Un INSERT o un PATCH amb trashed_at inventat (una data futura que no
-- caducaria mai) no té cap efecte.
create or replace function public.notes_marca_paperera()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status <> 'paperera' then
    new.trashed_at := null;
  elsif tg_op = 'UPDATE' and old.status = 'paperera' then
    new.trashed_at := old.trashed_at;
  else
    new.trashed_at := now();
  end if;
  return new;
end;
$$;
revoke execute on function public.notes_marca_paperera() from public, anon, authenticated;

drop trigger if exists trg_notes_paperera on public.notes;
create trigger trg_notes_paperera
before insert or update on public.notes
for each row execute function public.notes_marca_paperera();


-- ── 3 · Purga de la paperera ─────────────────────────────────────────────────
-- Només esborra notes en estat 'paperera' amb més dies dels de l'ajust. El
-- client no la pot executar; la programa pg_cron.
create or replace function private.purga_paperera_notes(p_limit integer default 500)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_dies  integer;
  v_fetes integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtext('sdp-purga-paperera-notes')) then
    return 0;
  end if;

  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
    from private.ajustos a where a.clau = 'dies_paperera_notes';
  exception when invalid_text_representation then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 30);

  with vencudes as (
    select n.id
    from public.notes n
    where n.status = 'paperera'
      and n.trashed_at <= now() - make_interval(days => v_dies)
    order by n.trashed_at asc
    limit greatest(1, least(coalesce(p_limit, 500), 5000))
    for update skip locked
  )
  delete from public.notes n
   using vencudes v
   where n.id = v.id
     and n.status = 'paperera';
  get diagnostics v_fetes = row_count;
  return v_fetes;
end;
$$;
revoke execute on function private.purga_paperera_notes(integer) from public, anon, authenticated;

-- Programació només si pg_cron ja està actiu (s'activa des del panell). Si no
-- ho està, cal programar private.purga_paperera_notes() a mà.
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('sdp-purga-paperera-notes', '37 3 * * *', $cron$select private.purga_paperera_notes(500)$cron$);
  else
    raise notice 'SDP-NOTES-900: pg_cron no està actiu; la purga de la paperera de Notes queda sense programar.';
  end if;
end
$$;

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- 260927_2100 · Notes: l'origen d'una nota connectada (Lògica d'Usuari, T5)
-- Prompt 260927_1925_prompt_logica_usuari (actualització de requisits T5).
--
-- Una connexió («Connectar» sobre un element d'altri) és una nota del MAS de
-- qui connecta. La nota recorda d'on ve a `origen`:
--   { "tipus": "connexio", "sectionId", "itemId", "titol",
--     "autorId", "autorNom", "autorTipus", "ruta" }
-- i per això l'editor canvia «Publicar» per «Compartir» encara que la nota
-- canvie de carpeta. El client (src/data/origenNota.js) neteja i acota cada
-- camp abans d'enviar-lo; ací només es garantix la forma.
--
-- Additiva i idempotent: es pot tornar a executar. Requerix 260914_0000
-- (taula notes) aplicada. Cap permís nou: authenticated ja té INSERT i UPDATE
-- sobre la taula sencera, i les quatre polítiques de propietari continuen
-- manant. Revisada i NO aplicada a cap base de dades.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

alter table public.notes
  add column if not exists origen jsonb
    constraint notes_origen_objecte check (origen is null or jsonb_typeof(origen) = 'object');

comment on column public.notes.origen is
  'D''on ve una nota connectada (T5): {tipus: connexio, sectionId, itemId, titol, autorId, autorNom, autorTipus, ruta}. Null a les notes pròpies.';

notify pgrst, 'reload schema';
commit;
-- Xat d'entitats: una conversa privada per client i organització.
-- Les persones owner/admin responen amb autoria d'entitat derivada al servidor.
-- La pertinença es comprova també en llegir: revocar un rol talla tot accés.
-- Aplicació local revisable; no provisiona comptes ni cap entitat fictícia.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

alter table public.xat_fils add column if not exists interlocutor_id uuid
  references auth.users (id) on delete cascade;
alter table public.xat_missatges add column if not exists com_org_id uuid
  references public.organizations (id) on delete set null;
create unique index if not exists xat_fils_entitat_interlocutor_uq
  on public.xat_fils (tenant_id, org_id, interlocutor_id)
  where org_id is not null and interlocutor_id is not null;

-- Esta funció no és una RPC: l'usuari no pot consultar permisos de tercers.
-- interlocutor_id conserva el tipus de conversa encara que s'esborre l'org
-- (la FK org_id històrica és SET NULL), evitant convertir-la en un fil personal.
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
  );
$$;
revoke execute on function private.xat_participant_vigent(uuid, uuid) from public, anon, authenticated;

create or replace function private.es_participant(p_fil_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.xat_participant_vigent(p_fil_id, (select auth.uid())) and exists (
    select 1 from public.xat_participants p where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid()) and p.visible_fins_seq is null);
$$;
revoke execute on function private.es_participant(uuid) from public, anon;
grant execute on function private.es_participant(uuid) to authenticated;

-- RLS del roster: el client veu la seua fila, no els identificadors de l'equip.
-- Les gestores només veuen participants que encara tenen accés vigent.
create or replace function private.xat_pot_veure_participant(p_fil_id uuid, p_usuari_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_participant(p_fil_id)
    and private.xat_participant_vigent(p_fil_id, p_usuari_id)
    and exists (select 1 from public.xat_participants p
      where p.fil_id = p_fil_id and p.usuari_id = p_usuari_id
        and (p.com_org_id is null or p.usuari_id = (select auth.uid())
          or private.can_manage_organization(p.com_org_id)));
$$;
revoke execute on function private.xat_pot_veure_participant(uuid, uuid) from public, anon;
grant execute on function private.xat_pot_veure_participant(uuid, uuid) to authenticated;
drop policy if exists "xat_participants_lectura" on public.xat_participants;
create policy "xat_participants_lectura" on public.xat_participants
for select to authenticated
using (private.xat_pot_veure_participant(fil_id, usuari_id));

create or replace function private.seq_visible(p_fil_id uuid, p_seq bigint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.xat_participant_vigent(p_fil_id, (select auth.uid())) and exists (
    select 1 from public.xat_participants p where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
      and p_seq > greatest(p.visible_des_de_seq, p.buidat_fins_seq)
      and (p.visible_fins_seq is null or p_seq <= p.visible_fins_seq));
$$;
revoke execute on function private.seq_visible(uuid, bigint) from public, anon;
grant execute on function private.seq_visible(uuid, bigint) to authenticated;

create or replace function private.es_admin_del_fil(p_fil_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_participant(p_fil_id) and exists (
    select 1 from public.xat_participants p where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid()) and p.rol in ('propietari', 'admin'));
$$;
revoke execute on function private.es_admin_del_fil(uuid) from public, anon;
grant execute on function private.es_admin_del_fil(uuid) to authenticated;

-- Les altes/promocions administratives reben les converses ja existents.
-- No es transforma mai en representant una fila que pertany al client.
-- Les baixes no esborren història: el control dinàmic anterior revoca l'accés.
create or replace function private.xat_alta_gestor_entitat()
returns trigger language plpgsql volatile security definer set search_path = ''
as $$
begin
  if new.role in ('owner', 'admin') then
    insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
    select f.id, new.user_id, new.organization_id, 'admin'
    from public.xat_fils f
    where f.org_id = new.organization_id and f.tenant_id = new.tenant_id
      and f.interlocutor_id is not null and f.interlocutor_id <> new.user_id
    on conflict (fil_id, usuari_id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function private.xat_alta_gestor_entitat() from public, anon, authenticated;
drop trigger if exists xat_alta_gestor_entitat on public.organization_memberships;
create trigger xat_alta_gestor_entitat after insert or update on public.organization_memberships
  for each row execute function private.xat_alta_gestor_entitat();

-- Cap via directa permet afegir tercers, canviar de costat o suplantar autoria.
revoke insert, update, delete on public.xat_participants from authenticated;
revoke insert, update, delete on public.xat_missatges from authenticated;
revoke insert (fil_id, usuari_id, text) on public.xat_missatges from authenticated;

-- Directori: nom i avatar, mai correus ni membres de l'equip d'una entitat.
drop function if exists public.membres_del_poble(uuid, text, integer);
create function public.membres_del_poble(p_tenant_id uuid, p_cerca text default null, p_limit integer default 100)
returns table (usuari_id uuid, nom text, fil_id uuid, tipus text, avatar_url text)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  return query
  select d.id, d.nom, d.fil_id, d.tipus, d.avatar_url from (
    select pr.id, coalesce(pr.full_name, 'Veí') as nom, 'persona'::text as tipus, pr.avatar_url,
      (select f.id from public.xat_fils f
       where f.tenant_id = p_tenant_id and f.tipus = 'directe'
         and f.org_id is null and f.interlocutor_id is null
         and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
         and private.es_participant(f.id)
         and exists (select 1 from public.xat_participants p where p.fil_id = f.id
           and p.usuari_id = pr.id and p.visible_fins_seq is null)
       order by f.creat_al, f.id limit 1) as fil_id
    from public.town_memberships tm join public.profiles pr on pr.id = tm.user_id
    where tm.town_id = p_tenant_id and pr.id <> v_jo and pr.baixa_demanada_at is null
    union all
    select o.id, o.name, 'entitat'::text, o.logo_url,
      (select f.id from public.xat_fils f where f.tenant_id = p_tenant_id
        and f.org_id = o.id and f.interlocutor_id = v_jo and private.es_participant(f.id)
       order by f.creat_al, f.id limit 1)
    from public.organizations o
    where o.tenant_id = p_tenant_id
      and (o.visibility = 'public' or private.is_organization_member(o.id))
      and not private.can_manage_organization(o.id)
  ) d
  where nullif(btrim(p_cerca), '') is null or d.nom ilike '%' || btrim(p_cerca) || '%'
  order by d.nom, d.id limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

create or replace function public.crea_fil_directe(p_tenant_id uuid, p_altre_usuari uuid, p_titol text default null)
returns uuid language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_jo uuid := (select auth.uid());
  v_fil uuid;
  v_org uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_altre_usuari is null or p_altre_usuari = v_jo then
    raise exception 'SDP-XAT-002: cal un altre interlocutor, distint de tu.' using errcode = '22023';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  select o.id into v_org from public.organizations o
  where o.id = p_altre_usuari and o.tenant_id = p_tenant_id
    and (o.visibility = 'public' or private.is_organization_member(o.id));
  if v_org is not null then
    if private.can_manage_organization(v_org) then
      raise exception 'SDP-XAT-002: ja representes aquesta entitat.' using errcode = '22023';
    end if;
    -- Mateixa clau en les dues crides concurrents; cada client té el seu fil.
    perform pg_advisory_xact_lock(hashtextextended('xat:org:' || p_tenant_id::text || ':' || v_org::text || ':' || v_jo::text, 0));
    select f.id into v_fil from public.xat_fils f
    where f.tenant_id = p_tenant_id and f.org_id = v_org and f.interlocutor_id = v_jo;
    if v_fil is null then
      insert into public.xat_fils (tenant_id, titol, creat_per, tipus, org_id, interlocutor_id)
      values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe', v_org, v_jo)
      returning id into v_fil;
      insert into public.xat_participants (fil_id, usuari_id) values (v_fil, v_jo);
      insert into public.xat_participants (fil_id, usuari_id, com_org_id, rol)
      select v_fil, om.user_id, v_org, 'admin' from public.organization_memberships om
      where om.organization_id = v_org and om.tenant_id = p_tenant_id
        and om.role in ('owner', 'admin') and om.user_id <> v_jo
      on conflict (fil_id, usuari_id) do nothing;
    end if;
    return v_fil;
  end if;
  if not exists (select 1 from public.town_memberships tm
    join public.profiles pr on pr.id = tm.user_id and pr.baixa_demanada_at is null
    where tm.town_id = p_tenant_id and tm.user_id = p_altre_usuari) then
    raise exception 'SDP-XAT-004: l''interlocutor no és disponible en aquest poble.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('xat:persona:' || p_tenant_id::text || ':' || least(v_jo, p_altre_usuari)::text || ':' || greatest(v_jo, p_altre_usuari)::text, 0));
  select f.id into v_fil from public.xat_fils f
  where f.tenant_id = p_tenant_id and f.tipus = 'directe'
    and f.org_id is null and f.interlocutor_id is null
    and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
    and private.es_participant(f.id)
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id
      and p.usuari_id = p_altre_usuari and p.visible_fins_seq is null)
  order by f.creat_al, f.id limit 1;
  if v_fil is null then
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus)
    values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe') returning id into v_fil;
    insert into public.xat_participants (fil_id, usuari_id)
    values (v_fil, v_jo), (v_fil, p_altre_usuari);
  end if;
  return v_fil;
end;
$$;
revoke execute on function public.crea_fil_directe(uuid, uuid, text) from public, anon;
grant execute on function public.crea_fil_directe(uuid, uuid, text) to authenticated;

-- L'autoria s'obté del participant, mai de p_metadades ni d'un id del client.
drop function if exists public.xat_envia(uuid, uuid, text, text, uuid, jsonb);
create function public.xat_envia(p_id uuid, p_fil_id uuid, p_tipus text default 'text',
  p_text text default null, p_resposta_a uuid default null, p_metadades jsonb default '{}'::jsonb)
returns table (id uuid, seq bigint, creat_al timestamptz, usuari_id uuid, com_org_id uuid, autor_nom text)
language plpgsql volatile security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_jo uuid := (select auth.uid());
  v_org uuid;
  v_m public.xat_missatges%rowtype;
  v_text text := btrim(p_text);
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if p_id is null or p_fil_id is null or jsonb_typeof(coalesce(p_metadades, '{}'::jsonb)) <> 'object' then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if coalesce(nullif(btrim(p_tipus), ''), 'text') <> 'text' then
    raise exception 'SDP-XAT-010: tipus de missatge no admés des del client.' using errcode = '22023';
  end if;
  if v_text is null or v_text = '' or char_length(v_text) > 4096 then
    raise exception 'SDP-XAT-007: missatge buit o massa llarg.' using errcode = '22023';
  end if;
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;
  select p.com_org_id into v_org from public.xat_participants p
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  if v_org is not null then
    -- La revocació no pot intercalar-se entre l'autorització i l'enviament.
    perform 1 from public.organization_memberships om where om.organization_id = v_org
      and om.user_id = v_jo and om.role in ('owner', 'admin') for share;
    if not found then
      raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
    end if;
  end if;
  -- Serialitza també reintents concurrents: no consumixen seq ni el límit de freqüència.
  perform pg_advisory_xact_lock(hashtextextended('xat:missatge:' || p_id::text, 0));
  select m.* into v_m from public.xat_missatges m where m.id = p_id;
  if found then
    if v_m.usuari_id is distinct from v_jo or v_m.fil_id is distinct from p_fil_id then
      raise exception 'SDP-XAT-008: identificador d''un altre enviament.' using errcode = '42501';
    end if;
  else
    -- Una cita s'autoritza en crear el missatge. Un reintent ja acceptat
    -- continua sent idempotent si després la cita caduca o es buida.
    if p_resposta_a is not null and not exists (select 1 from public.xat_missatges m
      where m.id = p_resposta_a and m.fil_id = p_fil_id and private.seq_visible(m.fil_id, m.seq)
        and (m.caduca_al is null or m.caduca_al > now())) then
      raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
    end if;
    insert into public.xat_missatges (id, fil_id, usuari_id, com_org_id, text, tipus, resposta_a, metadades, es_ia)
    values (p_id, p_fil_id, v_jo, v_org, v_text, 'text', p_resposta_a,
      coalesce(p_metadades, '{}'::jsonb) - array['com_org_id', 'comOrgId', 'autor_nom', 'autorNom', 'usuari_id', 'usuariId'], false)
    returning * into v_m;
  end if;
  update public.xat_participants p set llegit_fins_seq = greatest(p.llegit_fins_seq, v_m.seq),
    rebut_fins_seq = greatest(p.rebut_fins_seq, v_m.seq)
  where p.fil_id = p_fil_id and p.usuari_id = v_jo;
  return query select v_m.id, v_m.seq, v_m.creat_al, v_m.usuari_id, v_m.com_org_id,
    coalesce(o.name, pr.full_name, 'Veí')::text
  from public.profiles pr left join public.organizations o on o.id = v_m.com_org_id
  where pr.id = v_jo;
end;
$$;
revoke execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) from public, anon;
grant execute on function public.xat_envia(uuid, uuid, text, text, uuid, jsonb) to authenticated;

drop function if exists public.xat_historial(uuid, bigint, integer);
create function public.xat_historial(
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
  where p.fil_id = p_fil_id and p.usuari_id = v_jo
    and private.xat_participant_vigent(p_fil_id, v_jo);
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

drop function if exists public.xat_nous(uuid, bigint, integer);
create function public.xat_nous(
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
  where p.fil_id = p_fil_id and p.usuari_id = v_jo
    and private.xat_participant_vigent(p_fil_id, v_jo);
  if not found then
    raise exception 'SDP-XAT-006: no eres membre actiu del fil.' using errcode = '42501';
  end if;

  return query
    select
      m.id,
      m.fil_id,
      m.seq,
      m.usuari_id,
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
      and m.seq > greatest(v_des_de, p_despres_de_seq)
      and (v_fins is null or m.seq <= v_fins)
      and (m.caduca_al is null or m.caduca_al > now())
    order by m.seq asc
    limit v_limit;
end;
$$;
revoke execute on function public.xat_nous(uuid, bigint, integer) from public, anon;
grant execute on function public.xat_nous(uuid, bigint, integer) to authenticated;

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
    and p.visible_fins_seq is null
    and private.xat_participant_vigent(p_fil_id, v_jo);
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

-- Llista del fil amb l'altre costat lògic: l'entitat o el client, no l'equip.
-- La inserció idempotent repara també una alta concurrent de gestor/fil.
drop function if exists public.xat_fils_meus(uuid);
create function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb
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
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb)
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

-- Compatibilitat de lectura antiga, amb la mateixa autoria, finestra i caducitat.
create or replace function public.xat_missatges_del_fil(p_fil_id uuid, p_limit integer default 200)
returns table (id uuid, usuari_id uuid, autor_nom text, cos text, es_ia boolean, creat_al timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;
  return query select m.id, m.usuari_id, coalesce(o.name, pr.full_name, 'Veí')::text,
    m.text, m.es_ia, m.creat_al
  from public.xat_missatges m left join public.profiles pr on pr.id = m.usuari_id
  left join public.organizations o on o.id = m.com_org_id
  where m.fil_id = p_fil_id and private.seq_visible(m.fil_id, m.seq)
    and (m.caduca_al is null or m.caduca_al > now())
  order by m.seq asc limit greatest(1, least(coalesce(p_limit, 200), 500));
end;
$$;
revoke execute on function public.xat_missatges_del_fil(uuid, integer) from public, anon;
grant execute on function public.xat_missatges_del_fil(uuid, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
-- La RPC i la RLS han d'exigir la mateixa empresa mare per a un grup.
-- Abans el helper acceptava NULL, però l'INSERT el rebutjava amb un 403 opac.
-- No s'amplien permisos: es conserva la frontera de poble, tipus i owner/admin.
begin;

create or replace function private.can_create_group(
  p_parent_organization_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and p_parent_organization_id is not null
    and exists (
      select 1
      from public.organizations parent
      join public.organization_memberships membership
        on membership.organization_id = parent.id
       and membership.tenant_id = parent.tenant_id
      where parent.id = p_parent_organization_id
        and parent.tenant_id = p_tenant_id
        and parent.kind in ('company', 'entity', 'city_hall')
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'admin')
    );
$$;

revoke execute on function private.can_create_group(uuid, uuid) from public, anon;
grant execute on function private.can_create_group(uuid, uuid) to authenticated;

commit;
-- ============================================================================
-- 260928_1500 · T49 · Entradilla (lema) de 120 a 256 caràcters
-- Ordre del Mestre (260928): l'entradilla admet 256 caràcters a tots els
-- nivells. El client en té la font única a src/data/limitsText.js
-- (MAXIM_LEMA), i src/data/limitsText.test.js llig este fitxer per vigilar
-- que tots dos diguen el mateix.
--
--   1. CHECK de public.profiles i public.organizations: char_length(lema) <= 256.
--      El d'organitzacions naix sense nom (260908_0000) i el de perfils es diu
--      profiles_lema_llargaria (260926_1500): es busquen per definició, no pel
--      nom, i es deixa un de sol per taula, <taula>_lema_llargaria.
--   2. public.create_organization: còpia literal de la definició vigent
--      (260916_0600) amb una sola línia canviada, el retall del lema a 256.
--      Mateixa signatura i mateixos revoke/grant.
--
-- Només amplia un límit: cap fila vella el pot trencar. Additiva i idempotent:
-- es pot tornar a executar. Les migracions històriques no es toquen (les
-- proves de 260926_1500 hi fixen el 120 d'aquell moment). Cap taula, política
-- ni permís de taula nous. Revisada i NO aplicada a cap base de dades:
-- s'ha d'aplicar ABANS de publicar el client, o un lema de 121 a 256 caràcters
-- rebria l'avís genèric del servidor en lloc de desar-se.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · CHECK de la llargària del lema ──────────────────────────────────────
-- Sense la columna (la F1 no aplicada als perfils), la taula es deixa com està
-- i ho avisa SDP-LEMA-001: la migració no falla.
do $$
declare
  v_taula text;
  v_restriccio record;
  v_ja_hi_es boolean;
begin
  foreach v_taula in array array['profiles', 'organizations'] loop
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = v_taula and column_name = 'lema') then
      raise notice 'SDP-LEMA-001: public.% no té la columna lema; es deixa sense CHECK.', v_taula;
      continue;
    end if;

    v_ja_hi_es := false;
    for v_restriccio in
      select c.conname, pg_catalog.pg_get_constraintdef(c.oid) as definicio
      from pg_catalog.pg_constraint c
      where c.conrelid = format('public.%I', v_taula)::regclass
        and c.contype = 'c'
        and pg_catalog.pg_get_constraintdef(c.oid) ~* 'char_length\(\s*lema\s*\)'
    loop
      -- Una segona execució troba la seua pròpia restricció: es conserva.
      if v_restriccio.conname = v_taula || '_lema_llargaria'
        and v_restriccio.definicio ~ '<=\s*256\M' then
        v_ja_hi_es := true;
      else
        execute format('alter table public.%I drop constraint %I', v_taula, v_restriccio.conname);
      end if;
    end loop;

    if not v_ja_hi_es then
      execute format('alter table public.%I add constraint %I check (char_length(lema) <= 256)',
                     v_taula, v_taula || '_lema_llargaria');
    end if;
  end loop;
end
$$;

-- ── 2 · create_organization ─────────────────────────────────────────────────
-- Còpia literal de 2609160600_politiques_superadmin_organitzacions.sql (P2).
-- Única diferència: v_lema es retalla a 256 (abans, 120).
create or replace function public.create_organization(
  p_tenant_id uuid,
  p_kind text,
  p_name text,
  p_slug text,
  p_lema text default '',
  p_description text default '',
  p_parent_organization_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := left(btrim(coalesce(p_name, '')), 120);
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_lema text := left(btrim(coalesce(p_lema, '')), 256);
  v_description text := left(btrim(coalesce(p_description, '')), 500);
  v_organization record;
begin
  if p_kind in ('entity', 'city_hall') then
    raise exception 'Les entitats i els ajuntaments no es creen: es reclamen.' using errcode = '42501';
  end if;

  if v_user_id is null then
    raise exception 'Cal iniciar sessió per crear una organització.' using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('company', 'group', 'entity', 'city_hall') then
    raise exception 'El tipus d’organització no és vàlid.' using errcode = '22023';
  end if;

  if char_length(v_name) < 2 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'El nom o l’identificador de l’organització no és vàlid.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.towns town where town.id = p_tenant_id) then
    raise exception 'El poble indicat no existeix.' using errcode = '22023';
  end if;

  if p_kind in ('company', 'entity', 'city_hall') and p_parent_organization_id is not null then
    raise exception 'Aquesta organització no pot tindre una organització mare.' using errcode = '22023';
  end if;

  if p_kind = 'group'
    and not (select private.can_create_group(p_parent_organization_id, p_tenant_id))
  then
    raise exception 'El grup necessita una empresa mare que pugues administrar.' using errcode = '42501';
  end if;

  insert into public.profiles (id, full_name, visibility)
  values (
    v_user_id,
    coalesce(
      nullif(left(btrim((select auth.jwt()) -> 'user_metadata' ->> 'name'), 120), ''),
      'Persona'
    ),
    'private'
  )
  on conflict (id) do nothing;


  select
    organization.id,
    organization.tenant_id,
    organization.slug,
    organization.name,
    organization.kind,
    organization.parent_organization_id,
    organization.lema,
    organization.description,
    organization.visibility,
    organization.created_at,
    organization.updated_at
  into v_organization
  from public.organizations organization
  where organization.tenant_id = p_tenant_id
    and organization.slug = v_slug;

  if found then
    if v_organization.kind <> p_kind
      or v_organization.parent_organization_id is distinct from p_parent_organization_id
      or not (select private.can_manage_organization(v_organization.id))
    then
      raise exception 'L’identificador ja pertany a una altra organització.' using errcode = '23505';
    end if;
    return to_jsonb(v_organization);
  end if;

  insert into public.organizations (
    tenant_id,
    slug,
    name,
    kind,
    parent_organization_id,
    lema,
    description,
    visibility,
    created_by
  ) values (
    p_tenant_id,
    v_slug,
    v_name,
    p_kind,
    p_parent_organization_id,
    v_lema,
    v_description,
    'public',
    v_user_id
  )
  returning
    id,
    tenant_id,
    slug,
    name,
    kind,
    parent_organization_id,
    lema,
    description,
    visibility,
    created_at,
    updated_at
  into v_organization;

  return to_jsonb(v_organization);
end;
$$;

revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from public;
revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from anon;
grant execute on function public.create_organization(uuid, text, text, text, text, text, uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- 260928_2035 · T66 · L'emoticona de la fitxa de la persona (profiles.icon)
-- Ordre del Mestre (260928): en edició, l'espai central de la barra taronja
-- del Perfil és un botó que tria l'emoticona de la fitxa, i la tria es desa
-- al servidor amb l'autodesament de la resta de camps.
--
--   1. public.profiles.icon: text, admet null (null = sense emoticona). És el
--      mateix camp cru `icon` dels documents: un sol emoji, com diu emojiSol
--      (src/utils/emoji.js). Postgres no té \p{Emoji}: la forma la valida el
--      client en desar i la torna a aplicar en llegir; ací només la llargària.
--   2. CHECK profiles_icon_llargaria: char_length(icon) <= 16 punts de codi.
--      Les seqüències RGI més llargues en fan uns 10; el límit posa fita a una
--      cadena ZWJ abusiva. Font única al client: src/data/limitsText.js
--      (MAXIM_EMOTICONA); src/data/limitsText.test.js llig este fitxer.
--   3. Permís de columna per a l'UPDATE de la fitxa pròpia. La lectura ja la
--      dona el SELECT de taula d'authenticated (260908_0000). Les polítiques
--      «profiles update own» (260911_0600) i «profiles sense baixa»
--      (260926_1500) ja limiten l'UPDATE a la fila pròpia i fora de la baixa.
--      Cap vista ni RPC exposa profiles columna a columna: no se'n refà cap.
--
-- Fora d'abast, com a deute declarat: les organitzacions i els agents (la
-- seua fitxa continua sense emoticona al servidor), la baixa (les funcions de
-- baixa i de cancel·lació no la retiren ni la tornen, igual que copyright) i
-- les notes.
--
-- Additiva i idempotent: es pot tornar a executar. Cap taula, política ni
-- funció noves. Revisada i NO aplicada a cap base de dades: s'ha d'aplicar
-- DESPRÉS de 2609281500 i ABANS de publicar el client. Sense ella, el desat
-- de l'emoticona queda en quarantena al dispositiu amb l'avís «Este camp
-- encara no té columna» (PGRST204) i no es perd.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Columna ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists icon text;

-- ── 2 · CHECK de la llargària ───────────────────────────────────────────────
-- Es torna a crear sencer a cada execució: una segona passada deixa la
-- mateixa restricció, amb el mateix nom.
alter table public.profiles
  drop constraint if exists profiles_icon_llargaria;
alter table public.profiles
  add constraint profiles_icon_llargaria check (char_length(icon) <= 16);

-- ── 3 · Permís de columna ───────────────────────────────────────────────────
grant update (icon) on table public.profiles to authenticated;

notify pgrst, 'reload schema';
commit;
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
-- Fortificació T4: retirar i restaurar icon/copyright amb el compte.
-- Mateixes signatures i permisos que F1; no altera la purga.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.demana_baixa(p_motiu text default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_perfil  public.profiles;
  v_baixa   private.baixes;
  v_dies    integer;
  v_retirat jsonb;
  v_meta    jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;

  select * into v_baixa from private.baixes b where b.user_id = v_uid;
  if found then
    return jsonb_build_object('demanada_al', v_baixa.demanada_al,
                              'purga_prevista_al', v_baixa.purga_prevista_al, 'ja_demanada', true);
  end if;

  select * into v_perfil from public.profiles p where p.id = v_uid for update;

  begin
    select greatest(1, least(a.valor::integer, 365)) into v_dies
    from private.ajustos a where a.clau = 'dies_quarantena_baixa';
  exception when invalid_text_representation then
    v_dies := null;
  end;
  v_dies := coalesce(v_dies, 30);

  -- Les claus personals de cada publicació pròpia (signada com a persona) es
  -- guarden a la instantània abans de retirar-les: cancela_baixa les torna.
  select coalesce(jsonb_object_agg(s.id::text, (
           select jsonb_object_agg(e.key, e.value)
           from jsonb_each(s.payload) e
           where e.key = any (private.claus_personals_payload(s.payload, v_perfil.full_name)))), '{}'::jsonb)
    into v_retirat
  from public.section_submissions s
  where s.owner_user_id = v_uid
    and s.author_org_id is null
    and cardinality(private.claus_personals_payload(s.payload, v_perfil.full_name)) > 0;

  -- GoTrue en guarda una còpia a user_metadata (updateProfile hi escriu el nom,
  -- la foto i la bio; Google, name i picture): sense retirar-la, el nom
  -- sobreviuria a l'anonimització. També va a la instantània.
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    into v_meta
  from auth.users u
  cross join lateral jsonb_each(case when jsonb_typeof(u.raw_user_meta_data) = 'object'
                                     then u.raw_user_meta_data else '{}'::jsonb end) e
  where u.id = v_uid
    and e.key = any (array['full_name', 'name', 'avatar_url', 'picture', 'bio', 'icon', 'copyright']);

  insert into private.baixes (user_id, demanada_al, purga_prevista_al, instantania, motiu)
  values (
    v_uid, now(), now() + make_interval(days => v_dies),
    jsonb_build_object(
      'perfil', jsonb_build_object('full_name', v_perfil.full_name, 'avatar_url', v_perfil.avatar_url,
                                   'bio', v_perfil.bio, 'lema', v_perfil.lema,
                                   'icon', v_perfil.icon, 'copyright', v_perfil.copyright,
                                   'presentacio_html', v_perfil.presentacio_html,
                                   'hero_url', v_perfil.hero_url, 'is_public', v_perfil.is_public),
      'publicacions', v_retirat,
      'metadades', v_meta),
    nullif(left(btrim(coalesce(p_motiu, '')), 500), ''))
  returning * into v_baixa;

  -- Anonimització immediata. membres_del_poble ja no la mostra (baixa_demanada_at).
  update public.profiles
     set full_name = 'Veïna que se n''ha anat',
         avatar_url = null, bio = '', lema = '', presentacio_html = '', hero_url = null,
         icon = null, copyright = '',
         is_public = false, baixa_demanada_at = v_baixa.demanada_al
   where id = v_uid;

  -- La còpia de GoTrue, fora. Millor esforç: si el rol propietari no pot
  -- escriure a auth.users, la baixa continua i ho diu el registre.
  begin
    update auth.users u
       set raw_user_meta_data = u.raw_user_meta_data - array['full_name', 'name', 'avatar_url', 'picture', 'bio', 'icon', 'copyright']
     where u.id = v_uid
       and jsonb_typeof(u.raw_user_meta_data) = 'object';
  exception when insufficient_privilege then
    raise notice 'SDP-BAIXA-021: sense permís per a netejar les metadades de GoTrue de %.', v_uid;
  end;

  -- Publicacions personals: fora les claus personals. El trigger d'autor
  -- reescriu author_name amb el nom anònim. Les signades per una entitat són
  -- de l'entitat i no es toquen.
  update public.section_submissions s
     set payload = s.payload - private.claus_personals_payload(s.payload, v_perfil.full_name)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  -- Tancament de sessions (millor esforç; el client fa a més logout global).
  begin
    delete from auth.sessions where user_id = v_uid;
  exception when insufficient_privilege or undefined_table then
    null;
  end;

  return jsonb_build_object('demanada_al', v_baixa.demanada_al,
                            'purga_prevista_al', v_baixa.purga_prevista_al, 'ja_demanada', false);
end;
$$;
revoke execute on function public.demana_baixa(text) from public, anon;
grant execute on function public.demana_baixa(text) to authenticated;

-- Idempotent: sense cap baixa pendent, l'estat desitjat ja es complix.
create or replace function public.cancela_baixa()
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_b   private.baixes;
  v_p   jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-BAIXA-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  select * into v_b from private.baixes b where b.user_id = v_uid for update;
  if not found then
    return jsonb_build_object('cancelada', true);
  end if;
  v_p := coalesce(v_b.instantania -> 'perfil', '{}'::jsonb);

  update public.profiles p
     set full_name = coalesce(nullif(btrim(v_p ->> 'full_name'), ''), p.full_name),
         avatar_url = v_p ->> 'avatar_url',
         bio = coalesce(v_p ->> 'bio', ''),
         lema = coalesce(v_p ->> 'lema', ''),
         presentacio_html = coalesce(v_p ->> 'presentacio_html', ''),
         hero_url = v_p ->> 'hero_url',
         icon = v_p ->> 'icon',
         copyright = coalesce(v_p ->> 'copyright', ''),
         is_public = coalesce((v_p ->> 'is_public')::boolean, false),
         baixa_demanada_at = null
   where p.id = v_uid;

  -- Torna a GoTrue el nom, la foto i la bio que la baixa li va retirar.
  if jsonb_typeof(v_b.instantania -> 'metadades') = 'object' and v_b.instantania -> 'metadades' <> '{}'::jsonb then
    begin
      update auth.users u
         set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || (v_b.instantania -> 'metadades')
       where u.id = v_uid;
    exception when insufficient_privilege then
      raise notice 'SDP-BAIXA-022: sense permís per a restaurar les metadades de GoTrue de %.', v_uid;
    end;
  end if;

  -- Torna les claus retirades i el trigger d'autor torna a signar amb el nom.
  update public.section_submissions s
     set payload = s.payload || coalesce(v_b.instantania -> 'publicacions' -> (s.id::text), '{}'::jsonb)
   where s.owner_user_id = v_uid
     and s.author_org_id is null;

  delete from private.baixes where user_id = v_uid;
  return jsonb_build_object('cancelada', true);
end;
$$;
revoke execute on function public.cancela_baixa() from public, anon;
grant execute on function public.cancela_baixa() to authenticated;


-- Completar les baixes ja en quarantena, conservant la instantània original.
update private.baixes b set instantania = jsonb_set(b.instantania, '{perfil}',
  jsonb_build_object('icon', p.icon, 'copyright', p.copyright) || coalesce(b.instantania->'perfil', '{}'::jsonb))
from public.profiles p where p.id = b.user_id;
update private.baixes b set instantania = jsonb_set(b.instantania, '{metadades}',
  (select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
   from jsonb_each(case when jsonb_typeof(u.raw_user_meta_data) = 'object'
     then u.raw_user_meta_data else '{}'::jsonb end) e
   where e.key in ('icon', 'copyright')) || coalesce(b.instantania->'metadades', '{}'::jsonb))
from auth.users u where u.id = b.user_id;
update auth.users u set raw_user_meta_data = u.raw_user_meta_data - array['icon', 'copyright']
where jsonb_typeof(u.raw_user_meta_data) = 'object'
  and exists (select 1 from private.baixes b where b.user_id=u.id);
update public.profiles p set icon = null, copyright = ''
where exists (select 1 from private.baixes b where b.user_id=p.id);
notify pgrst, 'reload schema';
commit;
-- Cerca coherent amb el client: accents, majúscules i diverses paraules.
-- Mateixa pertinença, visibilitat, límit i exclusió de baixes; cap extensió.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create or replace function private.xat_plega_cerca(p_text text)
returns text language sql immutable strict set search_path = '' as $$
  select translate(lower(normalize(p_text, NFC)), 'àáâäãåèéêëìíîïòóôöõùúûüçñ', 'aaaaaaeeeeiiiiooooouuuucn');
$$;
revoke execute on function private.xat_plega_cerca(text) from public, anon, authenticated;

create or replace function public.membres_del_poble(p_tenant_id uuid, p_cerca text default null, p_limit integer default 100)
returns table (usuari_id uuid, nom text, fil_id uuid, tipus text, avatar_url text)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  return query
  select d.id, d.nom, d.fil_id, d.tipus, d.avatar_url from (
    select pr.id, coalesce(pr.full_name, 'Veí') as nom, 'persona'::text as tipus, pr.avatar_url,
      (select f.id from public.xat_fils f
       where f.tenant_id = p_tenant_id and f.tipus = 'directe'
         and f.org_id is null and f.interlocutor_id is null
         and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
         and private.es_participant(f.id)
         and exists (select 1 from public.xat_participants p where p.fil_id = f.id
           and p.usuari_id = pr.id and p.visible_fins_seq is null)
       order by f.creat_al, f.id limit 1) as fil_id
    from public.town_memberships tm join public.profiles pr on pr.id = tm.user_id
    where tm.town_id = p_tenant_id and pr.id <> v_jo and pr.baixa_demanada_at is null
    union all
    select o.id, o.name, 'entitat'::text, o.logo_url,
      (select f.id from public.xat_fils f where f.tenant_id = p_tenant_id
        and f.org_id = o.id and f.interlocutor_id = v_jo and private.es_participant(f.id)
       order by f.creat_al, f.id limit 1)
    from public.organizations o
    where o.tenant_id = p_tenant_id
      and (o.visibility = 'public' or private.is_organization_member(o.id))
      and not private.can_manage_organization(o.id)
  ) d
  where nullif(btrim(p_cerca), '') is null or not exists (select 1 from regexp_split_to_table(private.xat_plega_cerca(btrim(p_cerca)), '\s+') mot
    where strpos(private.xat_plega_cerca(d.nom), mot) = 0)
  order by d.nom, d.id limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

notify pgrst, 'reload schema';
commit;
-- ARQ-D02: rebre avisos de fils propis. Els clients no poden emetre avisos.
-- La taula i el seu RLS pertanyen al servei Realtime, no a esta migració.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $$
begin
  if not coalesce((select relrowsecurity from pg_class
    where oid = to_regclass('realtime.messages')), false) then
    raise exception 'Realtime requereix realtime.messages amb RLS actiu';
  end if;
end;
$$;

drop policy if exists xat_avisos_lectura on realtime.messages;
create policy xat_avisos_lectura on realtime.messages
for select to authenticated
using (
  extension = 'broadcast'
  and case
    when (select realtime.topic()) ~ '^xat:f:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then private.es_participant(substring((select realtime.topic()) from 7)::uuid)
    else false
  end
);

commit;
-- ============================================================================
-- 261002_1520 · La persona al cercador: public.perfil_public(p_id)
-- Ordre del Mestre (261002): «quan algú es registre, se li cree
-- automàticament el seu perfil (Persona) per eixir al cercador».
--
-- La fila ja naix: el trigger d'alta (public.handle_new_user, 2609261500) crea
-- public.profiles i completa_la_meua_alta la repara (el client també la crida
-- des de getProfile quan no troba la fila pròpia). El que faltava era poder-la
-- LLEGIR: la política «profiles read own» només deixa veure la fila pròpia, i
-- src/data/supabase/perfils.js tornava null per a qualsevol altra persona.
--
-- Què obri, per funció i no per política (com membres_del_poble):
--   1. La pròpia persona: la seua fitxa sencera.
--   2. Una fitxa publicada (is_public): sencera, per a qualsevol sessió.
--   3. Una fitxa no publicada: NOMÉS id, full_name, avatar_url i town_name, i
--      només si qui pregunta és membre d'un poble on també ho és ella
--      (town_memberships). És el que diu el text legal vigent
--      (src/sections/text/legalContent.js, §13): el nom i la imatge de perfil
--      són visibles per a la resta de membres del poble.
-- Què NO obri mai: correu, rol, visibility, consentiment_rgpd_at ni
-- baixa_demanada_at; cap persona amb la baixa demanada (quarantena), tampoc a
-- ella mateixa; res sense sessió (anon no té permís i la funció ho exigix).
--
-- Codi nou: SDP-PERFIL-010 (cal la sessió iniciada).
--
-- Additiva i idempotent: una sola funció nova, cap taula, política ni
-- columna. Revisada i NO aplicada a cap base de dades: va després de
-- 2609291230 (i de 2609262232 i 2609282035, que creen copyright i icon).
-- S'ha d'aplicar ABANS de publicar el client: l'adaptador de Supabase declara
-- sempre la capacitat 'directori' (perfils.js exporta loadPerfilPublic) i el
-- cercador enllaça cada persona del padró a /gent/<id>. Sense la funció, el
-- client torna null davant el 404 / PGRST202 i el clic acaba en «Perfil no
-- trobat».
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Les columnes de la fitxa que llig perfilDePersona (perfils.js). En el cas 3
-- les que no són mínimes tornen null i is_public, false.
create or replace function public.perfil_public(p_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  town_name text,
  hero_url text,
  lema text,
  bio text,
  presentacio_html text,
  copyright text,
  icon text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
#variable_conflict use_column
declare v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-PERFIL-010: cal la sessió iniciada.' using errcode = '42501';
  end if;
  return query
  select p.id, p.full_name, p.avatar_url, p.town_name,
    case when d.sencera then p.hero_url end,
    case when d.sencera then p.lema end,
    case when d.sencera then p.bio end,
    case when d.sencera then p.presentacio_html end,
    case when d.sencera then p.copyright end,
    case when d.sencera then p.icon end,
    case when d.sencera then coalesce(p.is_public, false) else false end,
    case when d.sencera then p.created_at end,
    case when d.sencera then p.updated_at end
  from public.profiles p
  cross join lateral (select (p.id = v_jo or coalesce(p.is_public, false)) as sencera) d
  where p.id = p_id
    and p.baixa_demanada_at is null
    and (d.sencera or exists (
      select 1
      from public.town_memberships tm_jo
      join public.town_memberships tm_ella on tm_ella.town_id = tm_jo.town_id
      where tm_jo.user_id = v_jo
        and tm_ella.user_id = p.id));
end;
$$;
revoke execute on function public.perfil_public(uuid) from public, anon;
grant execute on function public.perfil_public(uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- 261004_2330 · Ruta canònica del xat de la pàgina /iaia
-- Correcció posterior a 2609282100_xat_de_pagina.sql; no reescriu la història.
-- Revisada i NO aplicada a cap base de dades. Depén de la migració de pàgina
-- i de les seues dependències. No substituïx la condició de moderació prèvia.
--
-- private.xat_subjecte conserva literalment les branques i permisos previs,
-- amb /iaia a la llista tancada del client. Només l'entrada antiga exacta /ia
-- és un àlies: tant /ia com /iaia resolen clau i ruta /iaia abans del bloqueig
-- de la RPC existent. No s'accepta cap prefix, ruta privada ni ruta del client.
--
-- La fila antiga es reanomena dins d'una transacció, preservant id, missatges,
-- seq, participants i permisos. Si un poble ja té dos fils (/ia i /iaia) del
-- mateix tipus, SDP-XAT-014 avorta TOTA la migració: fusionar histories o
-- marques requereix un pla explícit; ací no es tria ni s'esborra cap fil.
-- El CHECK posterior impedeix que una RPC antiga encara en vol recree /ia.
-- La ruta i el títol es refresquen; una URI antiga acabada en /ia passa a
-- /iaia. Si superaria 600 caràcters, queda null com en la RPC existent.
-- Additiva i idempotent. Cap alta de participant, política o RPC pública nova.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- Impedeix inserts/updates concurrents mentre es comprova i canvia la clau.
lock table public.xat_fils in share row exclusive mode;

do $$
begin
  if exists (
    select 1 from public.xat_fils f
    where f.subjecte_tipus = 'pagina' and f.subjecte_id in ('/ia', '/iaia')
    group by f.tenant_id, f.tipus
    having count(*) > 1
  ) then
    raise exception 'SDP-XAT-014: hi ha dos fils per a la pàgina canònica.' using errcode = '23505';
  end if;
end;
$$;

-- Només metadades del subjecte: no canvia id, titol del fil, seq ni autoria.
update public.xat_fils f
   set subjecte_id = '/iaia',
       subjecte_ruta = '/iaia',
       subjecte_titol = 'L''ànima de la iaia',
       subjecte_uri = case
         when f.subjecte_uri like 'https://%/ia' then
           case when char_length(f.subjecte_uri) <= 598
             then regexp_replace(f.subjecte_uri, '/ia$', '/iaia') else null end
         else f.subjecte_uri end
 where f.subjecte_tipus = 'pagina' and f.subjecte_id in ('/ia', '/iaia')
   and (f.subjecte_id is distinct from '/iaia'
     or f.subjecte_ruta is distinct from '/iaia'
     or f.subjecte_titol is distinct from 'L''ànima de la iaia'
     or f.subjecte_uri like 'https://%/ia');

-- Una execució antiga que resolgué /ia abans del commit no pot duplicar el fil.
alter table public.xat_fils
  drop constraint if exists xat_fils_pagina_iaia_canonica;
alter table public.xat_fils
  add constraint xat_fils_pagina_iaia_canonica check (
    subjecte_tipus is distinct from 'pagina' or subjecte_id is distinct from '/ia'
  );

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
      ('/iaia', 'L''ànima de la iaia'),
      ('/roadmap', 'Full de ruta'),
      ('/versions', 'Versions'),
      ('/legal', 'Legal i privacitat')
    ) as pg (cami, nom)
    where pg.cami = case when p_id = '/ia' then '/iaia' else p_id end;
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

notify pgrst, 'reload schema';
commit;
-- ============================================================================
-- 261004_2350 · F1 · Convergència: profiles.is_public, permisos de columna de
-- la fitxa i una sola public.create_organization
-- Ordre del Mestre, 261004 (pla 2045, Marató 2230; front F1). Tres errors
-- reals que el Mestre ha vist contra la seua base de dades:
--   · Visibilitat de la fitxa: PGRST204, «Could not find the 'is_public'
--     column of 'profiles'».
--   · Avatar i Subtítol: «no tens permís per a canviar este camp», la frase
--     amb què el client traduïa qualsevol 403 o 42501. Que siga un 42501 de
--     PostgREST (el PATCH de profiles sense el permís d'UPDATE de la columna)
--     és una INFERÈNCIA: també podria ser un 403 de GoTrue al PUT de
--     /auth/v1/user, que va just després del PATCH quan es desa la foto o la
--     bio. Es confirma a la pestanya Xarxa del navegador, amb la ruta de la
--     petició rebutjada i el cos de la resposta. Si és el PUT de GoTrue, esta
--     migració no el cura.
--   · Nova organització: PGRST203 (HTTP 300), «Could not choose the best
--     candidate function».
-- Per què: la base està desfasada respecte d'este directori. Va nàixer d'un
-- esquema anterior (l'antic supabase/schema.sql, ja retirat) i només s'hi han
-- aplicat algunes migracions numerades. La columna is_public i el permís
-- d'UPDATE d'avatar_url, town_name, bio i is_public només els dona
-- 2609110600; la segona create_organization (molt probablement la de 6
-- arguments, sense p_lema) no l'ha creada cap fitxer d'este directori, que
-- sempre definix la mateixa signatura de 7. És una INFERÈNCIA ben fonamentada:
-- el repositori no registra l'estat de cap base.
--
--   1. public.profiles.is_public: boolean default false, idèntica a
--      2609110600. Si ja existix, no es toca.
--   2. Permís d'UPDATE, per a authenticated, de cada columna que el client
--      escriu a la fitxa (CAMPS_PERFIL de src/data/supabase/auth.js), només
--      si la columna existix (information_schema). Si en falta alguna, ho
--      avisa SDP-CONV-001 i continua: la crea la seua migració pendent, que
--      també en dona el permís. És exactament la unió dels permisos de
--      columna que ja donen 2609080000, 2609110600, 2609261500, 2609262232 i
--      2609282035: cap altra columna no en rep.
--   3. Una sola public.create_organization. Es conserva la canònica,
--      (uuid, text, text, text, text, text, uuid), la de 2609080000,
--      2609160600 i 2609281500, i s'esborra qualsevol altra sobrecàrrega,
--      sense CASCADE (SDP-CONV-003 en diu la signatura). Si la canònica no hi
--      és, la migració avorta sencera amb SDP-CONV-002 i la base es queda com
--      estava. La funció no es redefinix: la vigent és la de 2609281500, i
--      src/data/limitsText.test.js en vigila el retall del lema.
--
-- Cap política, vista, taula ni funció nova; cap permís retirat. No repetix
-- 2609110600: la seua política de lectura de profiles obria el padró sencer,
-- i 2609121500, 2609150000 i 2609160600 la tornen a tancar. Idempotent: una
-- segona execució no canvia res.
--
-- Revisada i NO aplicada a cap base de dades. L'aplica el Mestre o Sollutia,
-- mai un agent. S'aplica DESPRÉS de les pendents del supabase/README.md, en
-- ordre alfabètic, i ABANS de publicar el client. No en substituïx cap.
-- Abans d'aplicar-la, executeu a l'editor SQL estes quatre consultes de només
-- lectura i guardeu-ne el resultat (el drop del pas 3 depén de la primera):
--   1. Les versions de create_organization (n'hi hauria d'haver una):
--      select oid::regprocedure from pg_catalog.pg_proc
--       where proname = 'create_organization' and pronamespace = 'public'::regnamespace;
--   2. Les columnes de profiles:
--      select column_name from information_schema.columns
--       where table_schema = 'public' and table_name = 'profiles' order by ordinal_position;
--   3. Els permisos de columna d'authenticated sobre profiles:
--      select column_name, privilege_type from information_schema.column_privileges
--       where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated';
--   4. Les migracions registrades, si la taula existix:
--      select version from supabase_migrations.schema_migrations order by 1;
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Columna ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_public boolean default false;

-- ── 2 · Permisos de columna de la fitxa ─────────────────────────────────────
-- La mateixa llista, en el mateix ordre, que CAMPS_PERFIL (auth.js):
-- tests/migracio-convergencia-perfil.test.mjs les contrasta.
do $$
declare
  v_columna text;
begin
  foreach v_columna in array array['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public',
                                   'lema', 'presentacio_html', 'hero_url', 'copyright', 'icon'] loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'profiles' and column_name = v_columna) then
      execute format('grant update (%I) on table public.profiles to authenticated', v_columna);
    else
      raise notice 'SDP-CONV-001: public.profiles no té la columna %; es deixa sense permís.', v_columna;
    end if;
  end loop;
end
$$;

-- ── 3 · Una sola create_organization ────────────────────────────────────────
-- Es busca pel catàleg perquè no en sabem la signatura estrangera: el
-- missatge PGRST203 arriba tallat. Només funcions (prokind = 'f'): drop
-- function no esborra un procediment ('p') ni un agregat ('a') amb el mateix
-- nom, i l'intent faria fallar la migració sencera. Sense CASCADE: si algun
-- objecte en depén, el drop falla i la transacció sencera es desfà.
do $$
declare
  v_canonica regprocedure := to_regprocedure('public.create_organization(uuid, text, text, text, text, text, uuid)');
  v_sobrecarrega record;
begin
  if v_canonica is null then
    raise exception 'SDP-CONV-002: falta public.create_organization(uuid, text, text, text, text, text, uuid); cal aplicar abans 2609160600 i 2609281500.';
  end if;
  for v_sobrecarrega in
    select p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_organization' and p.prokind = 'f'
      and p.oid <> v_canonica::oid
  loop
    raise notice 'SDP-CONV-003: public.create_organization(%) no és la canònica i s''esborra.', v_sobrecarrega.arguments;
    execute format('drop function public.%I(%s)', v_sobrecarrega.proname, v_sobrecarrega.arguments);
  end loop;
end
$$;

notify pgrst, 'reload schema';
commit;
-- Enforce AAL2 (2FA) for superadmin privileges
create or replace function private.es_superadmin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_platform_roles r
    where r.user_id = (select auth.uid()) 
      and r.role = 'superadmin'
      and (select auth.jwt() ->> 'aal') = 'aal2'
  );
$$;
-- V-FW-02, V-LOGIN-07: Actualització de la lectura d'IPs (fix estil Vigilante 2.11.8)
create or replace function private.capcalera_client(p_que text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_h jsonb;
  v_xff text;
  v_arr text[];
begin
  begin
    v_h := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    return null;
  end;
  if v_h is null then
    return null;
  end if;
  if p_que = 'ip' then
    -- Es prefereix cf-connecting-ip (blindat per Cloudflare) o x-real-ip
    if v_h ? 'cf-connecting-ip' then
      return nullif(btrim(v_h ->> 'cf-connecting-ip'), '');
    elsif v_h ? 'x-real-ip' then
      return nullif(btrim(v_h ->> 'x-real-ip'), '');
    elsif v_h ? 'x-forwarded-for' then
      -- Si només hi ha x-forwarded-for, la IP reial afegida per la nostra passarel·la
      -- (Supabase/Vercel) és la DRETA, no l'esquerra (esquerra = falsificable pel visitant).
      v_xff := v_h ->> 'x-forwarded-for';
      v_arr := string_to_array(v_xff, ',');
      return nullif(btrim(v_arr[array_length(v_arr, 1)]), '');
    end if;
    return null;
  elsif p_que = 'ua' then
    return nullif(left(btrim(coalesce(v_h ->> 'user-agent', '')), 300), '');
  end if;
  return null;
end;
$$;
