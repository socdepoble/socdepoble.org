-- ============================================================================
-- 20261114060000 · R24 · IDEA-260 (a), costat del servidor: un sol directe
-- persona↔persona per parella i poble, amb clau canònica, reconciliació dels
-- duplicats que ja hi haja i crea_fil_directe per clau. Proposta C3 de
-- l'informe R24 (onada 1, xat_duplicats.md), revisada. NO aplicada: R24,
-- l'aplica el Mestre, mai un agent.
--
-- Per què: la unicitat d'un directe entre dues persones només la guardava un
-- pany consultiu i una cerca per predicat a crea_fil_directe (dos
-- participants, l'altra visible, el més antic). Cap índex no la garantia: un
-- fil inserit pel servidor o a mà, o un tercer participant, en feia un altre.
-- Les entitats ja tenen el seu índex únic per poble, entitat i interlocutora
-- (xat_fils_entitat_interlocutor_uq); els directes personals, ara també.
--
-- Què fa:
--   1 · Clau canònica a public.xat_fils: parella_menor < parella_major (els
--       dos usuari_id ordenats), totes dues nul·les fora d'un directe de dues
--       persones. CHECK de forma xat_fils_parella_forma: només en un
--       'directe' sense entitat (org_id, interlocutor_id), sense fil propi,
--       comunitat ni subjecte. Un canal d'entitat no porta mai clau i no es
--       fusiona mai amb un directe personal (audiències diferents: el canal
--       el lligen totes les gestores).
--   1b · Claus mortes fora: abans de reconciliar, una clau que ja no
--       descriu una parella viva (exactament dos participants, tots dos de la
--       parella, sense entitat, visibles i no eixits) es retira; el pas 4 la
--       torna a posar on toca. Només passa després d'una marxa enrere (sense
--       el disparador del pas 6); en una passada normal no canvia cap fila.
--   2 · Taules privades, sense cap privilegi per a l'API ni cap usuari_id:
--       private.xat_fils_fusionats (làpida antic → supervivent) i
--       private.xat_fusions_pendents (grups de la mateixa parella que no es
--       fusionen sols: «e2ee», «iaia», «visibilitat» o «temporal»).
--   3 · Reconciliació, grup a grup (dos o més directes de la mateixa parella
--       al mateix poble):
--         · supervivent determinista: el més antic (creat_al, id), el mateix
--           que ja tornava crea_fil_directe;
--         · missatges: tots els del grup passen al supervivent amb els ids
--           intactes (respostes, cadenes, denúncies, adjunts i cua d'avisos no
--           canvien) i una numeració nova cronològica i MONÒTONA, per damunt
--           de tot seq existent del grup: cap UPDATE no topa mai amb
--           xat_missatges_seq_uq i cap cursor vell no salta cap missatge;
--         · marques de lectura i de recepció: el prefix conservador (mai
--           amaguen un missatge que la persona no havia llegit al seu fil);
--         · adjunts, cua d'avisos (private.xat_push_cua), denúncies i
--           xat_lectures repuntats al supervivent abans d'esborrar res (així
--           el disparador xat_adjunt_a_purga no encua cap binari);
--         · estat per persona: arxivat només si ho estava a tots; fixat,
--           preferit i silenci, el més fort; avisos, el més restrictiu;
--           marca manual de no llegit, si n'hi havia; etiqueta, la primera;
--         · comprovacions dins de la transacció abans d'esborrar cap duplicat
--           (SDP-XAT-943, 944) i al final (SDP-XAT-945, 946);
--         · un grup amb xifratge E2EE, la IAIA, marques de visibilitat
--           (eixida, visible_des_de_seq, buidat_fins_seq) o missatges
--           temporals diferents no es fusiona: va a pendents (avís
--           SDP-XAT-942) i es queda com està.
--   4 · Clau a la resta de directes de dues persones visibles: un per parella
--       i poble, el més antic (el que ja tornava crea_fil_directe).
--   5 · Índex únic xat_fils_parella_uq (tenant_id, parella_menor,
--       parella_major): el poble forma part de la clau, com a l'índex de les
--       entitats.
--   6 · Disparador private.xat_parella_vigent a xat_participants: la clau
--       només descriu una parella viva. Si una de les dues persones ix del
--       fil, el deixa de veure o el seu compte s'esborra, o hi entra una
--       tercera, el fil perd la clau. Així crea_fil_directe es comporta com
--       abans en tots els casos (el predicat vell tampoc no retrobava eixos
--       fils) i cap fila no conserva l'UUID d'un compte suprimit.
--   7 · public.crea_fil_directe: les branques del fil propi i de l'entitat
--       són les de la seua última definició, lletra a lletra; la de persona
--       busca per clau (accés per índex) sota el mateix pany i, si crea el
--       fil, li posa la clau. Mateixa signatura, mateix retorn i mateixos
--       permisos (authenticated; mai anon ni PUBLIC).
--
-- NO fa: tocar xat_fils_meus, xat_envia ni membres_del_poble; fusionar cap
-- canal d'entitat, cap fil de pàgina o de comunitat, cap missatge xifrat ni
-- cap fil amb època E2EE; cap RPC per a resoldre una làpida (els enllaços
-- vells a un fil fusionat continuen donant el 404 honest).
--
-- Depén de 2609272200, 2610290400 i 2611121630.
--
-- Panys i moment: pany exclusiu sobre xat_fils i SHARE ROW EXCLUSIVE sobre
-- xat_participants, xat_missatges, xat_lectures i xat_adjunts fins al COMMIT:
-- cap enviament ni cap llista del xat mentrestant. Amb el volum del 13-11-2026
-- (26 fils, 35 missatges) són mil·lisegons, però cal aplicar-la a una hora
-- sense ús i després de la còpia de seguretat del Runbook (pas 1). Si avorta
-- per 55P03 (lock_timeout) o 40P01 (interbloqueig), no s'ha aplicat res: es
-- torna a executar. Repetible: la segona passada no troba cap grup per
-- fusionar i no canvia cap fila; després d'una marxa enrere, el pas 1b retira
-- les claus mortes i la reaplicació no topa amb SDP-XAT-946.
--
-- Com tornar enrere: les fusions no es desfan (la marxa enrere de les dades
-- és la còpia de seguretat). La part estructural, dins d'una transacció:
--   drop trigger if exists xat_parella_vigent on public.xat_participants;
--   drop index if exists public.xat_fils_parella_uq;
--   update public.xat_fils set parella_menor = null, parella_major = null where parella_menor is not null;
--   i tornar a aplicar el crea_fil_directe de 2611121630 (línies 122-208).
-- Les claus també se'n van: sense el disparador, cap baixa no les buidaria i
-- quedaria l'UUID d'un compte suprimit a xat_fils. Les columnes i el CHECK es
-- queden, nuls i inofensius; una reaplicació els reutilitza.
-- Prova PostgreSQL 18.6: tests/xat-directe-canonic-r24-postgres.test.mjs i
-- tests/xat-r24-directe-marxa-enrere-postgres.test.mjs (esta marxa enrere,
-- literal, i la reaplicació).
--
-- Abans (lectura):
-- select count(*) as grups, coalesce(sum(g.n), 0) as fils from (select count(*) as n from (select f.id, f.tenant_id, (array_agg(p.usuari_id order by p.usuari_id))[1] as menor, (array_agg(p.usuari_id order by p.usuari_id))[2] as major from public.xat_fils f join public.xat_participants p on p.fil_id = f.id where f.tipus = 'directe' and f.org_id is null and f.interlocutor_id is null and f.propi_usuari_id is null and f.comunitat_id is null and f.subjecte_tipus is null group by f.id having count(*) = 2 and count(distinct p.usuari_id) = 2 and bool_and(p.com_org_id is null)) d group by d.tenant_id, d.menor, d.major having count(*) > 1) g;
-- select count(*) as missatges from public.xat_missatges;
-- select count(*) as adjunts from public.xat_adjunts;
-- Verificació posterior (lectura):
-- select count(*) as amb_clau from public.xat_fils where parella_menor is not null;
-- select count(*) as fusionats, coalesce(sum(missatges_moguts), 0) as moguts from private.xat_fils_fusionats;
-- select motiu, count(*) as grups from private.xat_fusions_pendents group by motiu;
-- select indexname from pg_catalog.pg_indexes where schemaname = 'public' and indexname = 'xat_fils_parella_uq';
-- ============================================================================
begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';
-- Les restriccions diferides (xat_propi_integritat) es comproven en cada
-- sentència: si no, l'índex únic del pas 5 no es podria crear (55006).
set constraints all immediate;

do $$
begin
  if to_regprocedure('public.crea_fil_directe(uuid,uuid,text)') is null
     or to_regprocedure('private.es_participant(uuid)') is null
     or to_regclass('public.xat_fils_entitat_interlocutor_uq') is null
     or to_regclass('public.xat_fils_propi_usuari_uq') is null
     or to_regclass('public.xat_epoques') is null
     or not exists (select 1 from pg_catalog.pg_attribute a
                    where a.attrelid = 'public.xat_missatges'::regclass
                      and a.attname = 'versio_xifrat' and not a.attisdropped)
     or not exists (select 1 from pg_catalog.pg_attribute a
                    where a.attrelid = 'public.xat_fils'::regclass
                      and a.attname = 'e2ee_des_de_seq' and not a.attisdropped) then
    raise exception 'SDP-XAT-941: cal la cadena del xat fins a 2611121630 (fil propi) i el xifratge de 2610290400.'
      using errcode = '55000';
  end if;
end $$;

lock table public.xat_fils in access exclusive mode;
lock table public.xat_participants, public.xat_missatges, public.xat_lectures, public.xat_adjunts
  in share row exclusive mode;

-- ── 1 · Clau canònica (nul·la fora dels directes de dues persones) ──────────
alter table public.xat_fils add column if not exists parella_menor uuid;
alter table public.xat_fils add column if not exists parella_major uuid;
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
                 where conrelid = 'public.xat_fils'::regclass and conname = 'xat_fils_parella_forma') then
    alter table public.xat_fils add constraint xat_fils_parella_forma check (
      (parella_menor is null) = (parella_major is null)
      and (parella_menor is null or (
        parella_menor < parella_major and tipus = 'directe'
        and org_id is null and interlocutor_id is null and propi_usuari_id is null
        and comunitat_id is null and subjecte_tipus is null)));
  end if;
end $$;

-- ── 1b · Claus mortes fora (només després d'una marxa enrere) ──────────────
-- Sense el disparador del pas 6, una baixa, una eixida o una tercera persona
-- deixen una clau que ja no descriu una parella viva. Es retira abans de
-- reconciliar; el pas 4 la torna a posar al fil que toca.
update public.xat_fils f set parella_menor = null, parella_major = null
 where f.parella_menor is not null and not (
   (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
   and exists (select 1 from public.xat_participants p where p.fil_id = f.id and p.usuari_id = f.parella_menor
                 and p.com_org_id is null and p.visible_fins_seq is null and p.eixit_al is null)
   and exists (select 1 from public.xat_participants p where p.fil_id = f.id and p.usuari_id = f.parella_major
                 and p.com_org_id is null and p.visible_fins_seq is null and p.eixit_al is null));

-- ── 2 · Làpides i grups pendents (privats; cap usuari_id) ───────────────────
create table if not exists private.xat_fils_fusionats (
  antic_id uuid primary key,
  supervivent_id uuid not null references public.xat_fils (id) on delete cascade,
  tenant_id uuid not null,
  missatges_moguts integer not null check (missatges_moguts >= 0),
  fusionat_al timestamptz not null default now()
);
create index if not exists xat_fils_fusionats_supervivent
  on private.xat_fils_fusionats (supervivent_id);
create table if not exists private.xat_fusions_pendents (
  fils uuid[] primary key check (cardinality(fils) >= 2),
  tenant_id uuid not null,
  motiu text not null check (motiu in ('e2ee', 'iaia', 'visibilitat', 'temporal')),
  detectat_al timestamptz not null default now()
);
revoke all on table private.xat_fils_fusionats, private.xat_fusions_pendents
  from public, anon, authenticated, service_role;

-- ── 3 i 4 · Reconciliació i clau a la resta ─────────────────────────────────
do $$
declare
  g record;
  v_s uuid;          -- supervivent: el més antic
  v_d uuid[];        -- duplicats
  v_motiu text;
  v_iaia boolean;
  v_adj_xifrat boolean;
  v_base bigint;
  v_n bigint;
  v_msg_abans bigint;
  v_adj_abans bigint;
begin
  select count(*) into v_msg_abans from public.xat_missatges;
  select count(*) into v_adj_abans from public.xat_adjunts;

  create temporary table if not exists xat_r24_directes (
    id uuid primary key, tenant_id uuid not null, creat_al timestamptz not null,
    menor uuid not null, major uuid not null, tots_visibles boolean not null
  ) on commit drop;
  create temporary table if not exists xat_r24_mapa (
    missatge_id uuid primary key, fil_antic uuid not null,
    seq_antic bigint not null, seq_nou bigint not null
  ) on commit drop;
  create temporary table if not exists xat_r24_marques (
    usuari_id uuid primary key, llegit bigint not null, rebut bigint not null
  ) on commit drop;
  truncate pg_temp.xat_r24_directes;

  -- Candidats: directes de dues persones, sense entitat, propi, comunitat ni
  -- subjecte (un canal amb canal_clau sempre és un 'grup').
  insert into pg_temp.xat_r24_directes (id, tenant_id, creat_al, menor, major, tots_visibles)
  select f.id, f.tenant_id, f.creat_al,
         (array_agg(p.usuari_id order by p.usuari_id))[1],
         (array_agg(p.usuari_id order by p.usuari_id))[2],
         bool_and(p.visible_fins_seq is null and p.eixit_al is null)
  from public.xat_fils f
  join public.xat_participants p on p.fil_id = f.id
  where f.tipus = 'directe' and f.org_id is null and f.interlocutor_id is null
    and f.propi_usuari_id is null and f.comunitat_id is null and f.subjecte_tipus is null
  group by f.id
  having count(*) = 2 and count(distinct p.usuari_id) = 2 and bool_and(p.com_org_id is null);

  for g in
    select d.tenant_id, d.menor, d.major, array_agg(d.id order by d.creat_al, d.id) as fils
    from pg_temp.xat_r24_directes d
    group by d.tenant_id, d.menor, d.major
    having count(*) > 1
    order by d.tenant_id, d.menor, d.major
  loop
    v_s := g.fils[1];
    v_d := g.fils[2:cardinality(g.fils)];
    v_motiu := null;

    v_adj_xifrat := false;
    if exists (select 1 from pg_catalog.pg_attribute a
               where a.attrelid = 'public.xat_adjunts'::regclass and a.attname = 'xifrat' and not a.attisdropped) then
      execute 'select exists (select 1 from public.xat_adjunts a where a.fil_id = any ($1) and a.xifrat)'
        into v_adj_xifrat using g.fils;
    end if;
    if v_adj_xifrat
       or exists (select 1 from public.xat_fils f where f.id = any (g.fils)
                    and (f.epoca_actual > 0 or f.e2ee_des_de_seq is not null or f.cap_epoca_hash is not null))
       or exists (select 1 from public.xat_missatges m where m.fil_id = any (g.fils) and m.versio_xifrat <> 0)
       or exists (select 1 from public.xat_epoques e where e.fil_id = any (g.fils)) then
      v_motiu := 'e2ee';
    else
      v_iaia := false;
      if to_regclass('private.xat_iaia_binding') is not null then
        execute 'select exists (select 1 from private.xat_iaia_binding b where b.fil_id = any ($1))'
          into v_iaia using g.fils;
      end if;
      if not v_iaia and to_regclass('private.xat_iaia_jobs') is not null then
        execute 'select exists (select 1 from private.xat_iaia_jobs j where j.fil_id = any ($1))'
          into v_iaia using g.fils;
      end if;
      if v_iaia then
        v_motiu := 'iaia';
      elsif exists (select 1 from public.xat_participants p where p.fil_id = any (g.fils)
                      and (p.visible_fins_seq is not null or p.eixit_al is not null
                           or p.visible_des_de_seq > 0 or p.buidat_fins_seq > 0)) then
        v_motiu := 'visibilitat';
      elsif (select count(distinct coalesce(f.temporal_segons, 0)) from public.xat_fils f
             where f.id = any (g.fils)) > 1 then
        v_motiu := 'temporal';
      end if;
    end if;

    if v_motiu is not null then
      delete from private.xat_fusions_pendents pe where pe.fils && g.fils and pe.fils <> g.fils;
      insert into private.xat_fusions_pendents as pe (fils, tenant_id, motiu)
      values (g.fils, g.tenant_id, v_motiu)
      on conflict (fils) do update set motiu = excluded.motiu, detectat_al = now()
        where pe.motiu is distinct from excluded.motiu;
      raise warning 'SDP-XAT-942: % fils d''una mateixa parella no es fusionen sols (%); vegeu private.xat_fusions_pendents.',
        cardinality(g.fils), v_motiu;
      continue;
    end if;

    select count(*) into v_n from public.xat_missatges m where m.fil_id = any (g.fils);
    truncate pg_temp.xat_r24_mapa;
    truncate pg_temp.xat_r24_marques;

    if exists (select 1 from public.xat_missatges m where m.fil_id = any (v_d)) then
      -- 3a · Numeració nova, cronològica i monòtona per damunt de tot el grup.
      select greatest(f.ultim_seq, coalesce((select max(m.seq) from public.xat_missatges m
                                             where m.fil_id = any (g.fils)), 0))
        into v_base from public.xat_fils f where f.id = v_s;
      insert into pg_temp.xat_r24_mapa (missatge_id, fil_antic, seq_antic, seq_nou)
      select m.id, m.fil_id, m.seq,
             v_base + row_number() over (order by m.creat_al, array_position(g.fils, m.fil_id), m.seq)
      from public.xat_missatges m where m.fil_id = any (g.fils);

      -- 3b · Marques per persona: el prefix més llarg de l'ordre nou que la
      --      persona ja havia llegit (o rebut) al seu fil d'origen.
      insert into pg_temp.xat_r24_marques (usuari_id, llegit, rebut)
      select p.usuari_id,
        coalesce((select min(t.seq_nou) - 1 from pg_temp.xat_r24_mapa t
                  join public.xat_participants q on q.fil_id = t.fil_antic and q.usuari_id = p.usuari_id
                  where t.seq_antic > q.llegit_fins_seq), v_base + v_n),
        coalesce((select min(t.seq_nou) - 1 from pg_temp.xat_r24_mapa t
                  join public.xat_participants q on q.fil_id = t.fil_antic and q.usuari_id = p.usuari_id
                  where t.seq_antic > greatest(q.rebut_fins_seq, q.llegit_fins_seq)), v_base + v_n)
      from public.xat_participants p where p.fil_id = v_s;

      -- 3c · Moure: els ids no canvien.
      update public.xat_missatges m set fil_id = v_s, seq = t.seq_nou
      from pg_temp.xat_r24_mapa t where m.id = t.missatge_id;
      update public.xat_fils f set ultim_seq = v_base + v_n where f.id = v_s;
    end if;

    -- 3d · Adjunts, cua d'avisos, denúncies i lectures, abans d'esborrar.
    update public.xat_adjunts a set fil_id = v_s where a.fil_id = any (v_d);
    if to_regclass('private.xat_push_cua') is not null then
      execute 'update private.xat_push_cua c set fil_id = $1 where c.fil_id = any ($2)' using v_s, v_d;
    end if;
    if to_regclass('public.denuncies') is not null then
      execute 'update public.denuncies d set fil_id = $1 where d.fil_id = any ($2)' using v_s, v_d;
    end if;
    insert into public.xat_lectures as l (fil_id, usuari_id, ultim_llegit_al)
    select v_s, x.usuari_id, max(x.ultim_llegit_al) from public.xat_lectures x
    where x.fil_id = any (v_d) group by x.usuari_id
    on conflict (fil_id, usuari_id) do update
      set ultim_llegit_al = greatest(l.ultim_llegit_al, excluded.ultim_llegit_al);

    -- 3e · Estat per persona al supervivent.
    with e as (
      select p.usuari_id,
             bool_and(p.arxivat_al is not null) as tots_arxivats,
             max(p.arxivat_al) as arxivat_al,
             max(p.fixat_al) as fixat_al,
             max(p.preferit_al) as preferit_al,
             max(p.silenciat_fins_al) as silenciat_fins_al,
             bool_or(p.no_llegit_manual) as no_llegit_manual,
             case when bool_or(p.avisos = 'cap') then 'cap'
                  when bool_or(p.avisos = 'destacats') then 'destacats' else 'tots' end as avisos,
             (array_agg(p.etiqueta order by array_position(g.fils, p.fil_id))
                filter (where p.etiqueta is not null))[1] as etiqueta,
             min(p.creat_al) as creat_al
      from public.xat_participants p where p.fil_id = any (g.fils)
      group by p.usuari_id)
    update public.xat_participants s set
      llegit_fins_seq = coalesce(mk.llegit, s.llegit_fins_seq),
      rebut_fins_seq = coalesce(mk.rebut, s.rebut_fins_seq),
      creat_al = e.creat_al,
      arxivat_al = case when e.tots_arxivats then e.arxivat_al end,
      fixat_al = e.fixat_al,
      preferit_al = e.preferit_al,
      silenciat_fins_al = e.silenciat_fins_al,
      no_llegit_manual = e.no_llegit_manual,
      avisos = e.avisos,
      etiqueta = e.etiqueta
    from e left join pg_temp.xat_r24_marques mk on mk.usuari_id = e.usuari_id
    where s.fil_id = v_s and s.usuari_id = e.usuari_id;

    update public.xat_fils f set actualitzat_al = greatest(f.actualitzat_al,
      (select max(x.actualitzat_al) from public.xat_fils x where x.id = any (v_d) and x.ultim_seq > 0))
    where f.id = v_s;

    -- 3f · Comprovacions abans d'esborrar cap duplicat.
    if exists (select 1 from public.xat_missatges m where m.fil_id = any (v_d))
       or exists (select 1 from public.xat_adjunts a where a.fil_id = any (v_d)) then
      raise exception 'SDP-XAT-943: un duplicat encara té missatges o adjunts.' using errcode = '23514';
    end if;
    if (select count(*) from public.xat_missatges m where m.fil_id = v_s) <> v_n
       or (select count(distinct m.seq) from public.xat_missatges m where m.fil_id = v_s) <> v_n
       or coalesce((select max(m.seq) from public.xat_missatges m where m.fil_id = v_s), 0)
          > (select f.ultim_seq from public.xat_fils f where f.id = v_s)
       or (select count(*) from public.xat_participants p where p.fil_id = v_s) <> 2
       or exists (select 1 from public.xat_participants p where p.fil_id = v_s
                    and (p.llegit_fins_seq > (select f.ultim_seq from public.xat_fils f where f.id = v_s)
                         or p.rebut_fins_seq > (select f.ultim_seq from public.xat_fils f where f.id = v_s))) then
      raise exception 'SDP-XAT-944: numeració o marques del supervivent incoherents.' using errcode = '23514';
    end if;

    -- 3g · Làpides, esborrat dels duplicats ja buits i clau al supervivent.
    insert into private.xat_fils_fusionats (antic_id, supervivent_id, tenant_id, missatges_moguts)
    select d.id, v_s, g.tenant_id,
           (select count(*) from pg_temp.xat_r24_mapa t where t.fil_antic = d.id)
    from unnest(v_d) as d(id)
    on conflict (antic_id) do nothing;
    delete from public.xat_fils f where f.id = any (v_d);
    delete from private.xat_fusions_pendents pe where pe.fils && g.fils;
    update public.xat_fils f set parella_menor = g.menor, parella_major = g.major where f.id = v_s;
  end loop;

  -- 4 · Clau a la resta: un directe per parella i poble, el més antic amb les
  --     dues persones visibles i només si la parella encara no en té.
  update public.xat_fils f set parella_menor = c.menor, parella_major = c.major
  from (select distinct on (d.tenant_id, d.menor, d.major) d.id, d.tenant_id, d.menor, d.major
        from pg_temp.xat_r24_directes d
        where d.tots_visibles and exists (select 1 from public.xat_fils x where x.id = d.id)
        order by d.tenant_id, d.menor, d.major, d.creat_al, d.id) c
  where f.id = c.id and f.parella_menor is null
    and not exists (select 1 from public.xat_fils k where k.tenant_id = c.tenant_id
                      and k.parella_menor = c.menor and k.parella_major = c.major);

  if (select count(*) from public.xat_missatges) <> v_msg_abans
     or (select count(*) from public.xat_adjunts) <> v_adj_abans then
    raise exception 'SDP-XAT-945: la reconciliació perdria missatges o adjunts.' using errcode = '23514';
  end if;
  if exists (select 1 from public.xat_fils f where f.parella_menor is not null and not (
       (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
       and exists (select 1 from public.xat_participants p where p.fil_id = f.id
                     and p.usuari_id = f.parella_menor and p.com_org_id is null)
       and exists (select 1 from public.xat_participants p where p.fil_id = f.id
                     and p.usuari_id = f.parella_major and p.com_org_id is null))) then
    raise exception 'SDP-XAT-946: una clau de parella no coincidix amb els participants del fil.' using errcode = '23514';
  end if;
end $$;

-- ── 5 · Índex únic per parella i poble ──────────────────────────────────────
create unique index if not exists xat_fils_parella_uq
  on public.xat_fils (tenant_id, parella_menor, parella_major)
  where parella_menor is not null;

-- ── 6 · La clau només descriu una parella viva ──────────────────────────────
create or replace function private.xat_parella_vigent()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Una persona de la parella ix del fil (o el seu compte s'esborra).
  if tg_op = 'DELETE' then
    update public.xat_fils f set parella_menor = null, parella_major = null
     where f.id = old.fil_id and f.parella_menor is not null;
    return null;
  end if;
  -- Ix, el deixa de veure o la fila canvia de fil o de persona.
  if tg_op = 'UPDATE' then
    if new.fil_id is distinct from old.fil_id or new.usuari_id is distinct from old.usuari_id
       or new.visible_fins_seq is not null or new.eixit_al is not null then
      update public.xat_fils f set parella_menor = null, parella_major = null
       where f.id = old.fil_id and f.parella_menor is not null;
    end if;
  end if;
  -- Hi entra una tercera persona.
  update public.xat_fils f set parella_menor = null, parella_major = null
   where f.id = new.fil_id and f.parella_menor is not null
     and new.usuari_id is distinct from f.parella_menor
     and new.usuari_id is distinct from f.parella_major;
  return null;
end $$;
revoke all on function private.xat_parella_vigent() from public, anon, authenticated, service_role;
drop trigger if exists xat_parella_vigent on public.xat_participants;
create trigger xat_parella_vigent
  after insert or delete or update of fil_id, usuari_id, visible_fins_seq, eixit_al
  on public.xat_participants
  for each row execute function private.xat_parella_vigent();

-- ── 7 · crea_fil_directe per clau ───────────────────────────────────────────
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
  if p_altre_usuari is null then
    raise exception 'SDP-XAT-002: cal un interlocutor.' using errcode = '22023';
  end if;
  if not private.is_town_member(p_tenant_id) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;
  if p_altre_usuari = v_jo then
    -- Self is private storage, not directory publication: no consent for
    -- another recipient is requested or bypassed. Pending deletion is denied.
    if not exists (select 1 from public.profiles pr where pr.id=v_jo and pr.baixa_demanada_at is null)
      or exists (select 1 from private.baixes b where b.user_id=v_jo) then
      raise exception 'SDP-XAT-004: l''interlocutor no és disponible en aquest poble.' using errcode='42501';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('xat:propi:'||p_tenant_id::text||':'||v_jo::text,0));
    select f.id into v_fil from public.xat_fils f where f.tenant_id=p_tenant_id and f.propi_usuari_id=v_jo;
    if v_fil is null then
      insert into public.xat_fils(tenant_id,titol,creat_per,tipus,propi_usuari_id)
        values(p_tenant_id,nullif(btrim(p_titol),''),v_jo,'directe',v_jo) returning id into v_fil;
      insert into public.xat_participants(fil_id,usuari_id,rol) values(v_fil,v_jo,'propietari');
    else
      update public.xat_participants set visible_fins_seq=null,eixit_al=null
        where fil_id=v_fil and usuari_id=v_jo;
    end if;
    return v_fil;
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
  -- R24 · Per la clau canònica (xat_fils_parella_uq): un sol directe per
  -- parella i poble, el que la reconciliació ha deixat o el que es crea ara.
  select f.id into v_fil from public.xat_fils f
  where f.tenant_id = p_tenant_id
    and f.parella_menor = least(v_jo, p_altre_usuari)
    and f.parella_major = greatest(v_jo, p_altre_usuari)
  limit 1;
  if v_fil is null then
    if not exists (select 1 from public.profiles pr
      where pr.id = p_altre_usuari and pr.consentiment_rgpd_at is not null) then
      raise exception 'SDP-XAT-016: l''interlocutor no és disponible al xat.' using errcode = '42501';
    end if;
    insert into public.xat_fils (tenant_id, titol, creat_per, tipus)
    values (p_tenant_id, nullif(btrim(p_titol), ''), v_jo, 'directe') returning id into v_fil;
    insert into public.xat_participants (fil_id, usuari_id)
    values (v_fil, v_jo), (v_fil, p_altre_usuari);
    update public.xat_fils f
       set parella_menor = least(v_jo, p_altre_usuari), parella_major = greatest(v_jo, p_altre_usuari)
     where f.id = v_fil;
  end if;
  return v_fil;
end;
$$;
revoke execute on function public.crea_fil_directe(uuid, uuid, text) from public, anon;
grant execute on function public.crea_fil_directe(uuid, uuid, text) to authenticated;

notify pgrst, 'reload schema';
commit;
