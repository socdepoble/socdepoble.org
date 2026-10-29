-- ============================================================================
-- 261028_2100 · P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre
-- 261028, ronda de preguntes del Bloc H) · L'identificador @usuari únic i el
-- poble canònic de cada persona
--
-- QUÈ CORREGIX:
--   Les altes reals naixen amb public.profiles.username, town_uuid i
--   primary_town a NULL, i amb provinces i comarcas buides (captures
--   261028_2008_produccio_supabase_profiles_1..4). Cap migració ni cap línia
--   del client no generava l'identificador ni derivava el poble:
--   handle_new_user i completa_la_meua_alta (2609261500) només escriuen
--   (id, full_name, avatar_url), i create_organization (2610042350) només
--   (id, full_name, visibility). Les columnes username, town_uuid,
--   primary_town, provinces, comarcas i secondary_towns són d'una forma
--   antiga de la taula que el repositori no descriu (2609080000 és un
--   «create table if not exists»).
--
-- QUÈ FA:
--   1. Guardes, abans de tocar res: public.profiles existix i té la RLS
--      activa, les columnes que ja hi haja tenen el tipus esperat, cap
--      política permissiva de lectura de profiles que no siga «profiles read
--      own», i esta només la fila pròpia (una de les tres formes del
--      repositori) i per a authenticated, cap política que llija les columnes
--      d'esta migració i cap vista
--      ni regla que en depenga (SDP-USER-022, avorta: obririen l'identificador
--      o el poble d'una fitxa privada, o en farien un permís); després de
--      crear-les, cap identificador repetit sense distingir majúscules
--      (SDP-USER-020, avorta).
--   2. Columnes (ADD COLUMN IF NOT EXISTS: en producció no fan res):
--      profiles.username, username_confirmat_at (null = l'ha proposat el
--      servidor i la persona encara no l'ha triat), town_uuid, primary_town,
--      provinces, comarcas i secondary_towns (jsonb, '[]' de sèrie), i
--      towns.provincia i towns.comarca (com a molt 120 caràcters), que
--      s'omplin una sola vegada del catàleg 'towns' d'app_content pel títol
--      del poble; un homònim (QA-H02), per l'entrada amb el seu slug (el seu
--      id, slugDelPoble) i, si no n'hi ha cap, pel títol, mai amb l'entrada
--      que du el slug d'una altra fila i només si és la fila que eixe títol
--      tria (la regla de poble_derivat): un homònim que la regla no tria es
--      queda sense regió, mai amb la d'un altre.
--   3. Dues taules privades (RLS activa, cap política i tot revocat):
--      private.usuaris_retinguts, l'identificador d'una persona mentre la
--      seua baixa és en quarantena (el reté perquè ningú no el prenga i la
--      cancel·lació el torne), i private.usuari_intents, una fila per crida
--      a desa_el_meu_usuari que arriba a mirar si l'identificador és lliure.
--   4. Funcions privades, totes amb search_path buit i sense cap permís per a
--      public, anon ni authenticated: usuari_plega, usuari_base,
--      usuari_normalitzat, usuari_reservat i usuari_lliure (la regla del
--      client, src/sections/onboarding/onboardingModel.js, literal a
--      literal), llista_pobles (llistaDePobles de
--      src/sections/pobles/nomsDelPoble.js) i poble_derivat (els cinc camps
--      de poble d'un town_name).
--   5. La regla: el primer nom i el primer cognom sense partícules, en
--      minúscules ASCII, sense accents ni separadors i com a molt 24
--      caràcters (exemple sintètic: «Anna Pérez Soler» → annaperez); menys de
--      3, 'veina'; si ja és d'algú, d'una baixa en quarantena o reservat,
--      -2, -3… fins a 30 caràcters. Reservats: la llista literal (les rutes
--      del sistema, les identitats de la plataforma i 'baixa'), les seues
--      còpies (sense guionets ni xifres del final, iaia-maria-2 o
--      socdepoble2; i tot el que comença per socdepoble o iaiamaria), el
--      prefix 'baixa-' i les identitats fundacionals que el Mestre posa a
--      private.ajustos 'usuaris_reservats' (cap nom de persona ací). Una base
--      que no pot dur cap sufix (la seua -2 és reservada: baixa, iaiamaria…)
--      passa a 'veina'; i, per si de cas, després de 100 candidats, 'veina-'
--      i 8 xifres a l'atzar. Cada candidat es mira sota el seu pany consultiu
--      (pg_advisory_xact_lock de 'sdp-usuari:' || candidat): dues altes o dos
--      canvis amb el mateix nom van en fila, i la segona veu la primera
--      confirmada. L'índex únic és l'última guarda.
--   6. Backfill genèric, amb trg_profiles_touch i trg_profiles_usuari_i_poble
--      desactivats (updated_at no es mou: la fitxa pública el mostra): cada
--      fila amb username NULL, per ordre d'alta, rep l'identificador de la
--      regla (sense confirmar); una fila amb la baixa demanada el rep del nom
--      de la instantània de la baixa, retingut, i un 'baixa-…' a la fila.
--      Després, cada camp de poble NULL (o '[]') rep el derivat; cap camp que
--      ja en porte no es reescriu. Es deriva de town_name, o de primary_town
--      si la fila en porta un altre (una tria d'abans); town_name buit rep
--      el derivat. Una fila que ja porta town_uuid (d'una forma antiga) el
--      conserva, i eixa fila només desempata els homònims (QA-H02): el poble
--      triat amb el seu nom la pren a ella i no una homònima. No canvia ni
--      l'ordre ni els pobles triats. Una fila amb el town_uuid d'un poble que
--      no és el seu primer no rep cap camp de poble (mai camps de dues
--      files) i ix a la comprovació de DESPRÉS; una amb el town_uuid d'una
--      fila que ja no existix el conserva i la resta ix del nom.
--   7. NOT NULL a username (si cap fila no en queda sense), l'índex únic
--      profiles_usuari_unic sobre lower(username) i el CHECK
--      profiles_usuari_forma (^[a-z0-9]+(-[a-z0-9]+)*$, de 3 a 30), que
--      només es posa si cap fila no el trenca (SDP-USER-021).
--   8. El disparador trg_profiles_usuari_i_poble (BEFORE INSERT OR UPDATE,
--      private.profiles_usuari_i_poble, SECURITY DEFINER). Cobrix les tres
--      altes sense redefinir-ne cap (handle_new_user, completa_la_meua_alta
--      i create_organization), com 2610181800:
--      · INSERT: l'identificador de la fila, si en porta, o el que la
--        persona va escriure a /registre (metadada username) o, si no hi és
--        o és reservat, el de la regla, sempre sense confirmar. Res d'este
--        pas no fa caure l'alta: un error deixa 'veina-' i 8 xifres de l'id
--        i la incidència SDP-REG-903 (private.anota_incidencia_alta). El
--        poble triat a /registre (metadada town_name) passa a town_name si
--        la fila no en porta cap de propi (buit o el de sèrie).
--      · UPDATE d'username: forma (SDP-USER-001); amb sessió, només dins de
--        desa_el_meu_usuari (la marca local sdp.desa_el_meu_usuari; si no,
--        SDP-USER-006: un permís antic de columna no se salta el ritme) i mai
--        un reservat (SDP-USER-002); el pany, cap identificador retingut per
--        una baixa (SDP-USER-007) i username_confirmat_at = now(). Amb sessió
--        i fora de la RPC, username_confirmat_at no es mou.
--      · UPDATE de full_name des de 'Veí/na' (el nom de reserva de
--        private.nom_d_alta: Apple dona el nom de veres després) amb
--        l'identificador encara de reserva (^veina(-[0-9a-f]+)?$: 'veina',
--        'veina-2'… o 'veina-' i 8 xifres), sense confirmar i sense baixa:
--        es torna a generar. És l'alta que acaba, una sola vegada (el nou ja
--        no és de reserva: cap oracle d'identificadors sense ritme); cap
--        altre canvi de nom no el toca.
--      · Baixa (demana_baixa posa baixa_demanada_at): l'identificador passa
--        a private.usuaris_retinguts, la fila rep 'baixa-' i 12 xifres a
--        l'atzar, i la metadada username de GoTrue s'esborra (millor esforç,
--        SDP-USER-023). Cancel·lació (cancela_baixa el torna a null): torna
--        el retingut (o, si no n'hi ha, el de la regla amb el nom restaurat).
--        La purga (delete from auth.users) l'allibera per cascada.
--      · El poble, a l'alta i quan canvia town_name (private.poble_derivat):
--        town_name buit → 'La Torre de les Maçanes' (el mateix literal que
--        el default de 2609110600; ordre del Mestre del 261028, que deroga la
--        del 261009 de no inventar-lo); una tria explícita no es reescriu
--        mai. Cada poble de town_name, UNA sola fila de public.towns (slug
--        és únic, name no; si n'hi ha dos amb el mateix nom: en un canvi de
--        town_name, la que ja tenia, old.town_uuid; després, el
--        poble_per_defecte de private.ajustos, el nom escrit igual, obert, el
--        més antic i el slug, QA-H02). town_uuid i primary_town, de la fila
--        del primer; secondary_towns, la resta; provinces i comarcas, les
--        d'eixes mateixes files, sense repetir: dos homònims no es barregen.
--        Qualsevol altra escriptura amb sessió (un permís antic) deixa els
--        cinc camps derivats com eren; sense sessió (el SQL Editor), mana el
--        que s'escriu.
--   9. public.desa_el_meu_usuari(p_usuari text) → jsonb, SECURITY DEFINER,
--      només per a authenticated: la persona canvia (o confirma) el SEU
--      identificador i cap altre. Normalitza, valida la forma (001), la
--      baixa (004), la fila (005) i la reserva (002, llevat del que ja té),
--      compta el ritme (003: 10 proves per hora i persona, sota el seu
--      pany) i, si està ocupat, torna { desat: false, motiu: 'ocupat',
--      proposta }; si no, posa la marca local sdp.desa_el_meu_usuari, desa i
--      torna { desat: true, usuari, confirmat_al }.
--  10. public.perfil_public(p_id) es torna a crear (DROP + CREATE: canvia el
--      RETURNS TABLE) idèntica a 2610021520 i amb `usuari` AL FINAL: només
--      en la fitxa sencera (la pròpia persona o una fitxa publicada,
--      is_public); en el cas mínim (mateix poble), null. Mai d'una baixa.
--      Els mateixos revoke i grant.
--
-- QUÈ NO FA:
--   · No redefinix handle_new_user, completa_la_meua_alta,
--     create_organization, demana_baixa, cancela_baixa ni cap purga_*: el
--     disparador les cobrix totes.
--   · No dona cap permís de taula ni de columna: username no és de
--     CAMPS_PERFIL (decisió del Mestre: RPC pròpia i camp separat); el
--     client el llig de la fila pròpia (SELECT de taula de 2609080000 i la
--     política «profiles read own») i d'altri només per perfil_public.
--     Cap política nova; cap columna privada no s'obri.
--   · No el posa a membres_del_poble, a cap índex de cerca ni a cap vista.
--   · No toca public.town_memberships: la pertinença dona permisos
--     d'escriptura al poble i la continua decidint l'alta.
--   · No crea files a public.towns: un poble del catàleg sense fila té
--     town_uuid NULL i primary_town amb el seu nom.
--   · No desfà els homònims: town_name és un nom, i l'homònim que la regla
--     no tria (QA-H02) no es pot triar per nom (només el conserva qui ja el
--     tenia, pel town_uuid) ni rep pel títol la regió del catàleg; cal que
--     public.towns li done un nom diferent.
--   · No reescriu cap camp de poble que ja en porte: el backfill només
--     omple els NULL (i els '[]'), i el disparador no torna a derivar una
--     fila fins que hi canvia town_name.
--   · El catàleg 'towns' només s'hi llig una vegada: si després hi canvia
--     una província o una comarca, public.towns no se n'assabenta.
--   · No escriu cap identitat fundacional ni cap nom de persona: la llista
--     de private.ajustos 'usuaris_reservats' l'omple el Mestre DESPRÉS
--     d'aplicar-la (primer pas), quan el backfill ja ha donat a cada compte
--     la seua base; així cap identitat fundacional no rep el sufix per la
--     seua pròpia reserva, i des d'eixe moment ningú més no la pot prendre.
--     No assigna cap identificador reservat a cap fila concreta. Si alguna
--     encara en rep un (una altra persona amb el mateix nom, més antiga), el
--     Mestre la corregix a mà des del SQL Editor (DESPRÉS; sense sessió, el
--     disparador no mira la reserva).
--
-- CODIS:
--   SDP-USER-000 (42501) cal la sessió iniciada.
--   SDP-USER-001 (22023) l'identificador no té la forma (3 a 30 caràcters:
--     lletres sense accents, xifres i guionets).
--   SDP-USER-002 (42501) l'identificador és reservat.
--   SDP-USER-003 (42900) massa proves seguides.
--   SDP-USER-004 (42501) la baixa és en curs: el perfil està congelat.
--   SDP-USER-005 (P0002) la persona encara no té fila de perfil.
--   SDP-USER-006 (42501) amb sessió, l'identificador només es canvia amb
--     desa_el_meu_usuari.
--   SDP-USER-007 (23505) l'identificador és retingut per una baixa en
--     quarantena.
--   SDP-USER-020 (avorta) hi ha identificadors repetits.
--   SDP-USER-021 (avís) el CHECK de forma no es posa: alguna fila el trenca.
--   SDP-USER-022 (avorta) falta public.profiles, no té la RLS activa, una
--     columna té un altre tipus, «profiles read own» no és només la fila
--     pròpia per a authenticated, o una política, una vista o una regla de
--     fora llig les columnes d'esta migració.
--   SDP-USER-023 (avís) no s'ha pogut esborrar la metadada username de
--     GoTrue en començar una baixa.
--   SDP-USER-024 (avís) queda alguna fila sense identificador: el NOT NULL
--     no es posa.
--   SDP-REG-903 (incidència d'alta) l'identificador o el poble de l'alta no
--     s'han pogut calcular: la fila naix amb el de reserva.
--
-- Depén de: 2609080000 (towns, app_content, private.ajustos i
-- trg_profiles_touch), 2609110600 (town_name i el seu default), 2609261500
-- (baixa_demanada_at, private.baixes, private.nom_d_alta,
-- private.anota_incidencia_alta i «profiles sense baixa»), 2610021520
-- (perfil_public, que es torna a crear), 2610160250 (la política «profiles
-- update own») i 2610241440 (la purga que esborra auth.users).
--
-- ABANS D'APLICAR-LA (lectura; el resultat s'ha de guardar):
--   1. select table_name, column_name, data_type, udt_name, is_nullable, column_default
--        from information_schema.columns
--       where table_schema = 'public' and table_name in ('profiles', 'towns')
--       order by 1, ordinal_position;
--      (username text, town_uuid uuid, primary_town text, provinces, comarcas
--      i secondary_towns jsonb; si no, SDP-USER-022 i cal adaptar-la).
--   2. select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.profiles'::regclass;
--      select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = 'profiles';
--   3. select policyname, permissive, roles, cmd, qual, with_check
--        from pg_policies where schemaname = 'public' and tablename = 'profiles';
--      (cap política SELECT amb using (true): exposaria username i el poble).
--   4. select grantee, column_name, privilege_type from information_schema.column_privileges
--       where table_schema = 'public' and table_name = 'profiles' and grantee in ('anon', 'authenticated') order by 1, 2, 3;
--      select grantee, privilege_type from information_schema.role_table_grants
--       where table_schema = 'public' and table_name = 'profiles';
--   5. select tgname, pg_get_triggerdef(oid) from pg_trigger
--       where tgrelid = 'public.profiles'::regclass and not tgisinternal;
--   6. select lower(username), count(*) from public.profiles where username is not null group by 1 having count(*) > 1;
--      (cap fila; si no, SDP-USER-020) i
--      select count(*) from public.profiles where username !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(username) not between 3 and 30;
--   7. select id, slug, name, is_open from public.towns order by created_at;
--      select town_uuid, primary_town, town_name, count(*) from public.profiles group by 1, 2, 3;
--      select lower(name), array_agg(slug order by created_at) from public.towns group by 1 having count(*) > 1;
--      (els homònims: cada poble triat en tria una sola fila, QA-H02; el
--      catàleg dona a cada homònim la regió de l'entrada amb el seu slug i,
--      només si no n'hi ha cap, la del títol que no du el slug d'una altra
--      fila, a la fila que el títol tria; a un nom únic, la del títol, com
--      abans)
--   8. select clau, valor from private.ajustos where clau in ('poble_per_defecte', 'usuaris_reservats');
--   9. select n.nspname, p.proname from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
--       where p.prosrc ~ '\m(town_uuid|primary_town|secondary_towns|provinces|comarcas)\M'
--         and n.nspname not in ('pg_catalog', 'information_schema');
--      (cap funció de fora d'esta migració no hauria de decidir permisos amb
--      el poble derivat: a partir d'ara el deriva el town_name que tria la
--      persona).
--
-- DESPRÉS D'APLICAR-LA (lectura):
--   Primer, l'única escriptura del Mestre: les identitats fundacionals,
--   separades per espais, en la forma que es desen (el valor és
--   USERNAMES_FUNDACIONALS.join(' ') d'onboardingModel.js). Va després del
--   backfill perquè, abans, la reserva donaria el sufix -2 a les mateixes
--   identitats fundacionals:
--      insert into private.ajustos (clau, valor) values ('usuaris_reservats', '<identificadors>')
--        on conflict (clau) do update set valor = excluded.valor;
--   select count(*) from public.profiles where username is null;  (0)
--   select count(*) from public.profiles where town_uuid is null or primary_town is null;
--   (només les files d'un poble sense fila a public.towns i les que el
--   backfill no toca, les de la consulta següent)
--   select count(*) from public.profiles p join public.towns t on t.id = p.town_uuid
--    where lower(p.primary_town) is distinct from lower(t.name)
--       or (nullif(btrim(t.provincia), '') is not null and p.provinces ->> 0 is distinct from t.provincia)
--       or (nullif(btrim(t.comarca), '') is not null and p.comarcas ->> 0 is distinct from t.comarca);
--   (0, QA-H02: primary_town i la primera província i comarca són els de la
--   fila de town_uuid; llevat de les files d'una forma antiga amb un
--   town_uuid que no és el seu primer poble (el backfill no les toca) o que
--   ja portaven regions: es miren a mà. Una, a favor del seu town_name i
--   sense sessió:
--      update public.profiles p set (town_name, town_uuid, primary_town, secondary_towns, provinces, comarcas) =
--        (select d.town_name, d.town_uuid, d.primary_town, d.secondary_towns, d.provinces, d.comarcas
--           from private.poble_derivat(p.town_name) as d) where p.id = '<id>';)
--   i la consulta 4 d'abans ha de tornar exactament el mateix.
--   Abans de publicar el client, les identitats fundacionals:
--   select id, full_name, username from public.profiles where username ~ '-[0-9]+$' order by created_at limit 20;
--   Si alguna ha rebut un sufix perquè la seua base és reservada, el Mestre
--   li torna la seua des del SQL Editor (sense sessió; el disparador la
--   confirma): update public.profiles set username = '<reservat>' where id = '<id>';
--
-- VERIFICACIÓ MANUAL AMB DUES SESSIONS (en una base de prova, mai en la de
-- producció): dues persones A i B amb sessió i sense l'identificador 'pepa'.
-- En dues finestres de psql (o del SQL Editor) obertes alhora:
--   Sessió 1: begin;
--             select set_config('request.jwt.claims', '{"sub":"<A>","role":"authenticated"}', true);
--             set local role authenticated;
--             select public.desa_el_meu_usuari('pepa');
--             (no confirmes encara)
--   Sessió 2: begin;
--             select set_config('request.jwt.claims', '{"sub":"<B>","role":"authenticated"}', true);
--             set local role authenticated;
--             select public.desa_el_meu_usuari('pepa');
--             (es queda esperant el pany de 'pepa')
--   Sessió 1: commit;
--   Sessió 2: torna {"desat": false, "motiu": "ocupat", "proposta": "pepa-2"}; commit;
--   I l'alta: dues altes amb el mateix full_name en dues sessions (insert a
--   auth.users sense confirmar a la primera); la segona espera i acaba amb
--   el sufix -2.
--
-- Idempotent (IF NOT EXISTS, CREATE OR REPLACE, DROP … IF EXISTS) i en una
-- sola transacció. Va després de 2610281730. L'ordre amb el client és lliure:
-- sense la migració, la fila no porta username i la interfície no pinta
-- l'identificador; desa_el_meu_usuari absent és NO-DISPONIBLE. Les proves
-- estàtiques són src/data/supabase/usuariIPoble.migracio.test.js.
-- NO aplicada: l'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 0 · Guardes ───────────────────────────────────────────────────────────────
do $$
begin
  if pg_catalog.to_regclass('public.profiles') is null then
    raise exception 'SDP-USER-022: falta public.profiles; no es toca res.';
  end if;
  if not exists (select 1 from pg_catalog.pg_class
                 where oid = pg_catalog.to_regclass('public.profiles') and relrowsecurity) then
    raise exception 'SDP-USER-022: public.profiles no té la RLS activa; no es toca res.';
  end if;
  if exists (select 1
               from information_schema.columns c
               join (values ('username', 'text'), ('username_confirmat_at', 'timestamp with time zone'),
                            ('town_uuid', 'uuid'), ('primary_town', 'text'), ('provinces', 'jsonb'),
                            ('comarcas', 'jsonb'), ('secondary_towns', 'jsonb')) as e(columna, tipus)
                 on e.columna = c.column_name
              where c.table_schema = 'public' and c.table_name = 'profiles' and c.data_type <> e.tipus) then
    raise exception 'SDP-USER-022: una columna de public.profiles ja existix amb un altre tipus; cal adaptar la migració.';
  end if;
  -- Una lectura de profiles oberta a més files que la pròpia exposaria
  -- l'identificador i el poble d'una fitxa privada.
  if exists (select 1 from pg_catalog.pg_policies pp
              where pp.schemaname = 'public' and pp.tablename = 'profiles'
                and pp.cmd in ('SELECT', 'ALL') and pp.permissive = 'PERMISSIVE'
                and pp.policyname <> 'profiles read own') then
    raise exception 'SDP-USER-022: public.profiles té una política de lectura que no és «profiles read own»; cal revisar-la abans.';
  end if;
  -- I «profiles read own», només la fila pròpia i per a authenticated: les
  -- tres formes del repositori com les desa pg_policies (2609080000;
  -- 2609121500 i 2609160600; 2609150000). La de 2609110600 obria el padró.
  if exists (select 1 from pg_catalog.pg_policies pp
              where pp.schemaname = 'public' and pp.tablename = 'profiles'
                and pp.cmd in ('SELECT', 'ALL') and pp.permissive = 'PERMISSIVE'
                and pp.policyname = 'profiles read own'
                and (pp.qual is null
                     or pp.qual not in ('((( SELECT auth.uid() AS uid) IS NOT NULL) AND (id = ( SELECT auth.uid() AS uid)))',
                                        '(( SELECT auth.uid() AS uid) = id)',
                                        '(auth.uid() = id)')
                     or pp.roles <> array['authenticated']::name[])) then
    raise exception 'SDP-USER-022: «profiles read own» no és només la fila pròpia per a authenticated; cal revisar-la abans.';
  end if;
  -- Cap política no pot decidir res amb les columnes d'esta migració: el poble
  -- derivat el tria la persona (town_name).
  if exists (select 1 from pg_catalog.pg_policies pp
              where ((pp.schemaname = 'public' and pp.tablename = 'profiles')
                     or coalesce(pp.qual, '') || ' ' || coalesce(pp.with_check, '') ~ '\mprofiles\M')
                and coalesce(pp.qual, '') || ' ' || coalesce(pp.with_check, '')
                    ~ '\m(username|username_confirmat_at|town_uuid|primary_town|secondary_towns|provinces|comarcas)\M') then
    raise exception 'SDP-USER-022: una política llig l''identificador o el poble derivat de public.profiles; cal revisar-la abans.';
  end if;
  -- Ni cap vista ni cap regla que les mostre.
  if exists (select 1 from pg_catalog.pg_depend d
               join pg_catalog.pg_rewrite r on r.oid = d.objid
               join pg_catalog.pg_attribute a on a.attrelid = d.refobjid and a.attnum = d.refobjsubid
              where d.classid = 'pg_catalog.pg_rewrite'::regclass
                and d.refobjid = 'public.profiles'::regclass
                and a.attname in ('username', 'username_confirmat_at', 'town_uuid', 'primary_town', 'secondary_towns', 'provinces', 'comarcas')) then
    raise exception 'SDP-USER-022: una vista o una regla llig l''identificador o el poble derivat de public.profiles; cal revisar-la abans.';
  end if;
end
$$;


-- ── 1 · Columnes ──────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists username_confirmat_at timestamptz;
alter table public.profiles add column if not exists town_uuid uuid;
alter table public.profiles add column if not exists primary_town text;
alter table public.profiles add column if not exists provinces jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists comarcas jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists secondary_towns jsonb not null default '[]'::jsonb;

alter table public.towns
  add column if not exists provincia text
    constraint towns_provincia_llargaria check (char_length(provincia) <= 120);
alter table public.towns
  add column if not exists comarca text
    constraint towns_comarca_llargaria check (char_length(comarca) <= 120);

do $$
begin
  if exists (select 1 from public.profiles p where p.username is not null
             group by lower(p.username) having count(*) > 1) then
    raise exception 'SDP-USER-020: hi ha identificadors repetits (sense distingir majúscules); cal resoldre-ho abans.';
  end if;
end
$$;

-- La província i la comarca de cada poble, una sola vegada, del catàleg pel
-- títol. QA-H02: el nom no és únic, el slug sí. Un homònim pren l'entrada
-- amb el seu slug (l'id de l'entrada, slugDelPoble) i, si no n'hi ha cap, la
-- del títol, mai la que du el slug d'una altra fila i només si és la fila
-- que eixe títol tria (el mateix ordre que poble_derivat, sense la fila
-- d'abans): els altres homònims es queden sense regió, mai amb la d'un
-- altre. Un nom únic, la del títol, com abans. Si n'hi ha diverses, mana la
-- del poble per defecte, després la més nova i, al final, l'ordre del
-- catàleg. Una fila que ja en porta no es toca.
update public.towns t
   set provincia = nullif(left(btrim(c.provincia), 120), ''),
       comarca = nullif(left(btrim(c.comarca), 120), '')
  from (select distinct on (w.id)
               w.id, l.e ->> 'provincia' as provincia, l.e ->> 'comarca' as comarca
          from public.towns w
          cross join lateral (select exists (select 1 from public.towns o
                                             where lower(o.name) = lower(w.name) and o.id <> w.id) as homonim) as h
          join public.app_content ac on ac.key = 'towns'
          cross join lateral jsonb_array_elements(
            case when jsonb_typeof(ac.payload) = 'array' then ac.payload else '[]'::jsonb end) with ordinality as l(e, n)
         where jsonb_typeof(l.e) = 'object'
           and jsonb_typeof(l.e -> 'title') = 'string'
           and case when h.homonim
                    then l.e ->> 'id' = w.slug
                         or (lower(l.e ->> 'title') = lower(w.name)
                             and not exists (select 1 from public.towns o where o.slug = l.e ->> 'id' and o.id <> w.id)
                             and w.id = (select o.id from public.towns o
                                          where lower(o.name) = lower(w.name)
                                          order by (o.id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
                                                   (o.name = l.e ->> 'title') desc, o.is_open desc, o.created_at, o.slug, o.id
                                          limit 1))
                    else lower(l.e ->> 'title') = lower(w.name) end
         order by w.id,
                  coalesce(h.homonim and l.e ->> 'id' = w.slug, false) desc,
                  (ac.tenant_id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
                  ac.updated_at desc, ac.tenant_id, l.n) as c
 where c.id = t.id
   and t.provincia is null
   and t.comarca is null;


-- ── 2 · Taules privades ───────────────────────────────────────────────────────
create table if not exists private.usuaris_retinguts (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  retingut_al timestamptz not null default now()
);
create unique index if not exists usuaris_retinguts_unic on private.usuaris_retinguts (lower(username));
alter table private.usuaris_retinguts enable row level security;
revoke all on table private.usuaris_retinguts from public, anon, authenticated, service_role;

create table if not exists private.usuari_intents (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  al      timestamptz not null default now()
);
create index if not exists idx_usuari_intents_user_al on private.usuari_intents (user_id, al desc);
alter table private.usuari_intents enable row level security;
revoke all on table private.usuari_intents from public, anon, authenticated, service_role;


-- ── 3 · La regla (la mateixa que onboardingModel.js) ──────────────────────────
-- Plegat: NFC, la ela geminada en dues eles, les lligadures, els accents i
-- les majúscules ASCII. Cap lower(): depén del locale i el client no el pot
-- copiar.
create or replace function private.usuari_plega(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(
           translate(
             replace(replace(replace(replace(replace(replace(replace(
               regexp_replace(normalize(coalesce(p_text, ''), NFC), '([lL])[.·‧∙]([lL])', '\1\2', 'g'),
               'ŀ', 'l'), 'Ŀ', 'l'), 'ß', 'ss'), 'æ', 'ae'), 'Æ', 'ae'), 'œ', 'oe'), 'Œ', 'oe'),
             'àáâäãåÀÁÂÄÃÅèéêëÈÉÊËìíîïÌÍÎÏòóôöõøÒÓÔÖÕØùúûüÙÚÛÜçÇñÑýÿÝ',
             'aaaaaaaaaaaaeeeeeeeeiiiiiiiioooooooooooouuuuuuuuccnnyyy'),
           'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz');
$$;
revoke execute on function private.usuari_plega(text) from public, anon, authenticated;

-- El primer nom i el primer cognom sense partícules, junts (24 com a molt).
create or replace function private.usuari_base(p_nom text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_bones   text[] := '{}';
  v_paraula text;
begin
  foreach v_paraula in array regexp_split_to_array(
    btrim(regexp_replace(private.usuari_plega(p_nom), '[^a-z0-9]+', ' ', 'g')), ' ') loop
    continue when v_paraula = '' or v_paraula = any (array['de', 'del', 'dels', 'la', 'les', 'el', 'els', 'i', 'y', 'd', 'l', 'da', 'das', 'do', 'dos', 'van', 'von', 'der', 'den']);
    v_bones := v_bones || v_paraula;
    exit when cardinality(v_bones) = 2;
  end loop;
  return left(array_to_string(v_bones, ''), 24);
end;
$$;
revoke execute on function private.usuari_base(text) from public, anon, authenticated;

-- Un identificador escrit a mà, en la forma que es desa, o null.
create or replace function private.usuari_normalitzat(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(btrim(left(btrim(regexp_replace(private.usuari_plega(p_text), '[^a-z0-9]+', '-', 'g'), '-'), 30), '-'), '');
$$;
revoke execute on function private.usuari_normalitzat(text) from public, anon, authenticated;

-- Les rutes del sistema, les identitats de la plataforma i les seues còpies,
-- els de les baixes i les identitats fundacionals de private.ajustos (el
-- Mestre les hi posa: cap nom de persona en este fitxer).
create or replace function private.usuari_reservat(p_usuari text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(p_usuari = any (array[
    '0001', 'socdepoble', 'soc-de-poble', 'rentonar', 'iaia', 'iaia-maria', 'mestre',
    'admin', 'superadmin', 'consola', 'registre', 'entrar', 'perfil', 'el-meu-perfil', 'gent', 'empresa', 'grup', 'pobles',
    'xat', 'cerca', 'connectar', 'app', 'api', 'auth', 'anima', 'legal', 'descarregues', 'page', 'sistema', 'suport',
    'mur', 'mercat', 'notes', 'calendari', 'multimedia', 'projecte', 'skills', 'wikidepoble', 'fedivers', 'constitucio', 'roadmap', 'versions',
    'baixa'
  ]) or starts_with(p_usuari, 'baixa-')
    or regexp_replace(replace(p_usuari, '-', ''), '[0-9]+$', '') = any (array['socdepoble', 'iaia', 'iaiamaria', 'rentonar', 'mestre', 'admin', 'superadmin'])
    or starts_with(replace(p_usuari, '-', ''), 'socdepoble') or starts_with(replace(p_usuari, '-', ''), 'iaiamaria')
    or exists (select 1 from private.ajustos a
               where a.clau = 'usuaris_reservats'
                 and p_usuari = any (regexp_split_to_array(btrim(a.valor), '[\s,]+'))), false);
$$;
revoke execute on function private.usuari_reservat(text) from public, anon, authenticated;

-- El primer candidat lliure de la base: la base, base-2, base-3… Cada
-- candidat sota el seu pany consultiu, fins al final de la transacció. Una
-- base que no pot dur cap sufix (la seua -2 és reservada) no en buscaria
-- mai cap de lliure: passa a 'veina'. I 100 candidats com a molt.
create or replace function private.usuari_lliure(p_base text, p_usuari uuid)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_base     text := case when char_length(coalesce(p_base, '')) >= 3 then p_base else 'veina' end;
  v_candidat text;
  v_n        integer := 1;
begin
  if private.usuari_reservat(rtrim(left(v_base, 30 - char_length('-2')), '-') || '-2') then
    v_base := 'veina';
  end if;
  v_candidat := v_base;
  loop
    perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || v_candidat, 0));
    exit when not private.usuari_reservat(v_candidat)
      and not exists (select 1 from public.profiles p
                      where lower(p.username) = v_candidat and p.id is distinct from p_usuari)
      and not exists (select 1 from private.usuaris_retinguts r
                      where lower(r.username) = v_candidat and r.user_id is distinct from p_usuari);
    v_n := v_n + 1;
    if v_n > 100 then
      v_candidat := 'veina-' || left(replace(gen_random_uuid()::text, '-', ''), 8);
      perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || v_candidat, 0));
      exit;
    end if;
    v_candidat := rtrim(left(v_base, 30 - char_length('-' || v_n)), '-') || '-' || v_n;
  end loop;
  return v_candidat;
end;
$$;
revoke execute on function private.usuari_lliure(text, uuid) from public, anon, authenticated;

-- Els pobles d'una cadena 'A · B', nets i sense repetits, en l'ordre triat.
-- La ela geminada (l·l) es protegix abans de partir, com nomsDelPoble.js.
create or replace function private.llista_pobles(p_text text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(b.nom order by b.ordre), '{}'::text[])
    from (select distinct on (a.nom) a.nom, a.ordre
            from (select btrim(replace(x.tros, chr(57344), '·')) as nom, x.ordre
                    from regexp_split_to_table(
                           regexp_replace(coalesce(p_text, ''), '([lL])·(?=[lL])', '\1' || chr(57344), 'g'),
                           '\s*·\s*') with ordinality as x(tros, ordre)) as a
           where a.nom <> ''
           order by a.nom, a.ordre) as b;
$$;
revoke execute on function private.llista_pobles(text) from public, anon, authenticated;

-- Els cinc camps de poble d'un town_name ('A · B'), i el town_name mateix
-- (buit → 'La Torre de les Maçanes'). QA-H02: towns.slug és únic, name no.
-- Cada poble triat es resol a UNA sola fila de public.towns (p_town_uuid, el
-- poble_per_defecte, el nom escrit igual, obert, el més antic i el slug), i
-- town_uuid, primary_town, provinces i comarcas ixen d'eixes mateixes files:
-- dos homònims de regions diferents no es barregen. p_town_uuid és la fila
-- que ja porta la persona (el backfill i un canvi de town_name): només
-- desempata els homònims, mai no canvia ni l'ordre ni els pobles triats.
-- Amb noms únics, el resultat és el d'abans.
-- La signatura d'un sol argument se'n va: amb totes dues, la crida
-- poble_derivat(text) seria ambigua.
drop function if exists private.poble_derivat(text);
create or replace function private.poble_derivat(p_town_name text, p_town_uuid uuid default null,
  out town_name text, out town_uuid uuid, out primary_town text,
  out secondary_towns jsonb, out provinces jsonb, out comarcas jsonb)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_pobles text[] := private.llista_pobles(p_town_name);
begin
  town_name := p_town_name;
  if cardinality(v_pobles) = 0 then
    v_pobles := array['La Torre de les Maçanes'];
    town_name := v_pobles[1];
  end if;
  with triades as (
    select l.ordre, f.id, f.name, f.provincia, f.comarca
      from unnest(v_pobles) with ordinality as l(nom, ordre)
      cross join lateral (
        select t.id, t.name, t.provincia, t.comarca
          from public.towns t
         where lower(t.name) = lower(l.nom)
         order by (t.id = p_town_uuid) desc nulls last,
                  (t.id::text = (select a.valor from private.ajustos a where a.clau = 'poble_per_defecte')) desc nulls last,
                  (t.name = l.nom) desc, t.is_open desc, t.created_at, t.slug, t.id
         limit 1) as f)
  select (select r.id from triades r where r.ordre = 1),
         coalesce((select r.name from triades r where r.ordre = 1), v_pobles[1]),
         (select coalesce(jsonb_agg(x.provincia order by x.primer), '[]'::jsonb)
            from (select r.provincia, min(r.ordre) as primer
                    from triades r
                   where nullif(btrim(r.provincia), '') is not null
                   group by r.provincia) as x),
         (select coalesce(jsonb_agg(x.comarca order by x.primer), '[]'::jsonb)
            from (select r.comarca, min(r.ordre) as primer
                    from triades r
                   where nullif(btrim(r.comarca), '') is not null
                   group by r.comarca) as x)
    into town_uuid, primary_town, provinces, comarcas;
  secondary_towns := to_jsonb(coalesce(v_pobles[2:], '{}'::text[]));
end;
$$;
revoke execute on function private.poble_derivat(text, uuid) from public, anon, authenticated;


-- ── 4 · Backfill (abans del disparador; updated_at no es mou) ─────────────────
-- En una segona execució el disparador ja hi és: també es desactiva, perquè
-- el backfill no torne a derivar res.
do $$
declare
  v_toca     boolean := exists (select 1 from pg_catalog.pg_trigger t
                                where t.tgrelid = 'public.profiles'::regclass
                                  and t.tgname = 'trg_profiles_touch' and not t.tgisinternal);
  v_meu      boolean := exists (select 1 from pg_catalog.pg_trigger t
                                where t.tgrelid = 'public.profiles'::regclass
                                  and t.tgname = 'trg_profiles_usuari_i_poble' and not t.tgisinternal);
  r          record;
  v_nom      text;
  v_retingut text;
  v_baixa    text;
begin
  if v_toca then
    alter table public.profiles disable trigger trg_profiles_touch;
  end if;
  if v_meu then
    alter table public.profiles disable trigger trg_profiles_usuari_i_poble;
  end if;

  for r in select p.id, p.full_name, p.baixa_demanada_at
             from public.profiles p
            where p.username is null
            order by p.created_at, p.id loop
    if r.baixa_demanada_at is null then
      update public.profiles p
         set username = private.usuari_lliure(private.usuari_base(r.full_name), r.id)
       where p.id = r.id;
    else
      -- En quarantena, el nom de veres és a la instantània de la baixa.
      select nullif(btrim(b.instantania -> 'perfil' ->> 'full_name'), '') into v_nom
        from private.baixes b where b.user_id = r.id;
      v_retingut := private.usuari_lliure(private.usuari_base(coalesce(v_nom, r.full_name)), r.id);
      insert into private.usuaris_retinguts (user_id, username)
      values (r.id, v_retingut)
      on conflict (user_id) do nothing;
      loop
        v_baixa := 'baixa-' || left(replace(gen_random_uuid()::text, '-', ''), 12);
        exit when not exists (select 1 from public.profiles p where lower(p.username) = v_baixa);
      end loop;
      update public.profiles p set username = v_baixa where p.id = r.id;
    end if;
  end loop;

  -- El poble: només els camps NULL (o '[]'). Es deriva de town_name, o de
  -- primary_town si la fila en porta un altre (una tria d'abans); el
  -- town_uuid que ja porta, si n'hi ha, desempata els homònims (QA-H02). Si
  -- és d'un poble que no és el primer, la fila no es toca: mai camps de dues
  -- files (DESPRÉS la llista). El d'una fila que ja no existix es conserva.
  update public.profiles p
     set town_name = coalesce(nullif(btrim(p.town_name), ''), d.town_name),
         town_uuid = coalesce(p.town_uuid, d.town_uuid),
         primary_town = coalesce(p.primary_town, d.primary_town),
         secondary_towns = case when coalesce(p.secondary_towns, '[]'::jsonb) = '[]'::jsonb then d.secondary_towns else p.secondary_towns end,
         provinces = case when coalesce(p.provinces, '[]'::jsonb) = '[]'::jsonb then d.provinces else p.provinces end,
         comarcas = case when coalesce(p.comarcas, '[]'::jsonb) = '[]'::jsonb then d.comarcas else p.comarcas end
    from (select f.id, x.*
            from public.profiles f
            cross join lateral private.poble_derivat(
              case when f.primary_town is null
                     or lower(btrim(f.primary_town)) = lower(coalesce((private.llista_pobles(f.town_name))[1], ''))
                   then f.town_name else f.primary_town end,
              f.town_uuid) as x
           where f.town_uuid is null or f.primary_town is null or nullif(btrim(f.town_name), '') is null
              or coalesce(f.secondary_towns, '[]'::jsonb) = '[]'::jsonb or coalesce(f.provinces, '[]'::jsonb) = '[]'::jsonb
              or coalesce(f.comarcas, '[]'::jsonb) = '[]'::jsonb) as d
   where d.id = p.id
     and (p.town_uuid is null or d.town_uuid is not distinct from p.town_uuid
          or not exists (select 1 from public.towns t where t.id = p.town_uuid));

  if v_meu then
    alter table public.profiles enable trigger trg_profiles_usuari_i_poble;
  end if;
  if v_toca then
    alter table public.profiles enable trigger trg_profiles_touch;
  end if;
end
$$;


-- ── 5 · Restriccions ──────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from public.profiles p where p.username is null) then
    raise notice 'SDP-USER-024: queda alguna fila sense identificador; username queda sense NOT NULL.';
  else
    alter table public.profiles alter column username set not null;
  end if;
end
$$;

create unique index if not exists profiles_usuari_unic on public.profiles (lower(username));

do $$
begin
  if exists (select 1 from pg_catalog.pg_constraint
             where conrelid = 'public.profiles'::regclass and conname = 'profiles_usuari_forma') then
    null;
  elsif exists (select 1 from public.profiles p
                where p.username !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p.username) not between 3 and 30) then
    raise notice 'SDP-USER-021: alguna fila trenca la forma de l''identificador; profiles_usuari_forma queda sense posar.';
  else
    alter table public.profiles
      add constraint profiles_usuari_forma
      check (username ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(username) between 3 and 30);
  end if;
end
$$;


-- ── 6 · El disparador ─────────────────────────────────────────────────────────
create or replace function private.profiles_usuari_i_poble()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_meta     jsonb := '{}'::jsonb;
  v_desitjat text;
  v_retingut text;
  v_pobles   text[];
  -- Amb sessió (una persona) i, si és així, si escriu des de desa_el_meu_usuari.
  v_sessio   boolean := (select auth.uid()) is not null;
  v_rpc      boolean := coalesce(current_setting('sdp.desa_el_meu_usuari', true), '') = 'on';
begin
  if tg_op = 'UPDATE' and v_sessio and not v_rpc then
    new.username_confirmat_at := old.username_confirmat_at;
  end if;

  if tg_op = 'INSERT' then
    -- L'alta no cau mai per l'identificador.
    begin
      select u.raw_user_meta_data into v_meta from auth.users u where u.id = new.id;
      v_meta := case when jsonb_typeof(v_meta) = 'object' then v_meta else '{}'::jsonb end;
      v_desitjat := private.usuari_normalitzat(coalesce(
        nullif(btrim(new.username), ''),
        case when jsonb_typeof(v_meta -> 'username') = 'string' then v_meta ->> 'username' end));
      if v_desitjat is not null and char_length(v_desitjat) >= 3 and not private.usuari_reservat(v_desitjat) then
        new.username := private.usuari_lliure(v_desitjat, new.id);
      else
        new.username := private.usuari_lliure(private.usuari_base(new.full_name), new.id);
      end if;
      -- El poble triat a /registre, si la fila no en porta cap de propi.
      if jsonb_typeof(v_meta -> 'town_name') = 'string'
         and (nullif(btrim(new.town_name), '') is null or new.town_name = 'La Torre de les Maçanes') then
        v_pobles := private.llista_pobles(left(v_meta ->> 'town_name', 120));
        if cardinality(v_pobles) > 0 then
          new.town_name := v_pobles[1];
        end if;
      end if;
    exception when others then
      new.username := 'veina-' || left(replace(new.id::text, '-', ''), 8);
      perform private.anota_incidencia_alta(new.id, 'SDP-REG-903', sqlstate || ': ' || sqlerrm);
    end;
    new.username_confirmat_at := null;

  elsif old.baixa_demanada_at is null and new.baixa_demanada_at is not null then
    -- Comença la baixa: l'identificador es reté i la fila en porta un d'anònim.
    if old.username is not null and not starts_with(old.username, 'baixa-') then
      insert into private.usuaris_retinguts (user_id, username)
      values (new.id, old.username)
      on conflict (user_id) do update set username = excluded.username, retingut_al = now();
    end if;
    loop
      v_retingut := 'baixa-' || left(replace(gen_random_uuid()::text, '-', ''), 12);
      exit when not exists (select 1 from public.profiles p where lower(p.username) = v_retingut);
    end loop;
    new.username := v_retingut;
    begin
      update auth.users u
         set raw_user_meta_data = u.raw_user_meta_data - 'username'
       where u.id = new.id
         and jsonb_typeof(u.raw_user_meta_data) = 'object'
         and u.raw_user_meta_data ? 'username';
    exception when insufficient_privilege then
      raise notice 'SDP-USER-023: sense permís per a netejar la metadada username de GoTrue de %.', new.id;
    end;

  elsif old.baixa_demanada_at is not null and new.baixa_demanada_at is null then
    -- Es cancel·la la baixa: torna el retingut.
    select r.username into v_retingut from private.usuaris_retinguts r where r.user_id = new.id;
    delete from private.usuaris_retinguts where user_id = new.id;
    if v_retingut is not null then
      perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || lower(v_retingut), 0));
      if exists (select 1 from public.profiles p where lower(p.username) = lower(v_retingut) and p.id <> new.id) then
        v_retingut := private.usuari_lliure(private.usuari_normalitzat(v_retingut), new.id);
      end if;
      new.username := v_retingut;
    else
      new.username := private.usuari_lliure(private.usuari_base(new.full_name), new.id);
    end if;

  elsif new.username is distinct from old.username then
    -- Un canvi d'identificador: desa_el_meu_usuari o, sense sessió, el SQL
    -- Editor. Amb sessió i fora de la RPC (un permís antic de columna), no.
    if new.username is null or new.username !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(new.username) not between 3 and 30 then
      raise exception 'SDP-USER-001: l''identificador ha de tindre entre 3 i 30 caràcters: lletres sense accents, xifres i guionets.' using errcode = '22023';
    end if;
    if v_sessio and not v_rpc then
      raise exception 'SDP-USER-006: l''identificador només es canvia amb desa_el_meu_usuari.' using errcode = '42501';
    end if;
    if v_sessio and private.usuari_reservat(new.username) then
      raise exception 'SDP-USER-002: eixe identificador està reservat.' using errcode = '42501';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || new.username, 0));
    if exists (select 1 from private.usuaris_retinguts r where lower(r.username) = new.username and r.user_id <> new.id) then
      raise exception 'SDP-USER-007: eixe identificador és retingut per una baixa en quarantena.' using errcode = '23505';
    end if;
    new.username_confirmat_at := now();

  elsif old.full_name = 'Veí/na' and new.full_name is distinct from old.full_name
        and old.username_confirmat_at is null
        and old.username ~ '^veina(-[0-9a-f]+)?$'
        and old.baixa_demanada_at is null and new.baixa_demanada_at is null then
    -- El nom de veres arriba després de l'alta (Apple): l'alta acaba ací, una
    -- sola vegada (només des de l'identificador de reserva; el nou ja no ho és).
    new.username := private.usuari_lliure(private.usuari_base(new.full_name), new.id);
  end if;

  -- El poble canònic: a l'alta i quan canvia town_name, la tria de la
  -- persona; en un canvi, la fila que ja tenia desempata els homònims
  -- (QA-H02). Una alta no cau mai per ell.
  if tg_op = 'INSERT' or new.town_name is distinct from old.town_name then
    begin
      select d.town_name, d.town_uuid, d.primary_town, d.secondary_towns, d.provinces, d.comarcas
        into new.town_name, new.town_uuid, new.primary_town, new.secondary_towns, new.provinces, new.comarcas
        from private.poble_derivat(new.town_name, case when tg_op = 'UPDATE' then old.town_uuid end) as d;
    exception when others then
      if tg_op <> 'INSERT' then
        raise;
      end if;
      perform private.anota_incidencia_alta(new.id, 'SDP-REG-903', sqlstate || ': ' || sqlerrm);
    end;
  elsif v_sessio then
    -- Cap altra escriptura amb sessió no toca el poble derivat (un permís
    -- antic); sense sessió (el SQL Editor), mana el que s'escriu.
    new.town_uuid := old.town_uuid;
    new.primary_town := old.primary_town;
    new.secondary_towns := old.secondary_towns;
    new.provinces := old.provinces;
    new.comarcas := old.comarcas;
  end if;

  return new;
end;
$$;
revoke execute on function private.profiles_usuari_i_poble() from public, anon, authenticated;

drop trigger if exists trg_profiles_usuari_i_poble on public.profiles;
create trigger trg_profiles_usuari_i_poble
before insert or update on public.profiles
for each row execute function private.profiles_usuari_i_poble();


-- ── 7 · La RPC: canviar (o confirmar) el meu identificador ────────────────────
create or replace function public.desa_el_meu_usuari(p_usuari text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo     uuid := (select auth.uid());
  v_usuari text;
  v_actual text;
  v_baixa  timestamptz;
  v_ara    timestamptz;
  v_hora   integer;
begin
  if v_jo is null then
    raise exception 'SDP-USER-000: cal la sessió iniciada.' using errcode = '42501';
  end if;
  v_usuari := private.usuari_normalitzat(p_usuari);
  if v_usuari is null or char_length(v_usuari) < 3 then
    raise exception 'SDP-USER-001: l''identificador ha de tindre entre 3 i 30 caràcters: lletres sense accents, xifres i guionets.' using errcode = '22023';
  end if;
  -- Sota el pany de la persona: el ritme i la seua fila van en fila.
  perform pg_advisory_xact_lock(hashtextextended('sdp-usuari-ritme:' || v_jo::text, 0));
  select p.username, p.baixa_demanada_at into v_actual, v_baixa
    from public.profiles p where p.id = v_jo for update;
  if not found then
    raise exception 'SDP-USER-005: encara no tens fila de perfil.' using errcode = 'P0002';
  end if;
  -- «profiles sense baixa» no frena una funció de la propietària: es mira ací.
  if v_baixa is not null then
    raise exception 'SDP-USER-004: tens una baixa en curs i el perfil està congelat.' using errcode = '42501';
  end if;
  if private.usuari_reservat(v_usuari) and v_usuari is distinct from v_actual then
    raise exception 'SDP-USER-002: eixe identificador està reservat.' using errcode = '42501';
  end if;
  -- Deu proves per hora, també les que el troben ocupat: frena qui vol
  -- endevinar els identificadors dels altres.
  v_ara := clock_timestamp();
  delete from private.usuari_intents i
   where i.user_id = v_jo
     and i.al <= v_ara - interval '1 hour';
  select count(*) into v_hora from private.usuari_intents i where i.user_id = v_jo;
  if v_hora >= 10 then
    raise exception 'SDP-USER-003: has provat massa identificadors seguits.' using errcode = '42900';
  end if;
  insert into private.usuari_intents (user_id, al) values (v_jo, v_ara);

  perform pg_advisory_xact_lock(hashtextextended('sdp-usuari:' || v_usuari, 0));
  if exists (select 1 from public.profiles p where lower(p.username) = v_usuari and p.id <> v_jo)
     or exists (select 1 from private.usuaris_retinguts r where lower(r.username) = v_usuari and r.user_id <> v_jo) then
    return jsonb_build_object('desat', false, 'motiu', 'ocupat', 'proposta', private.usuari_lliure(v_usuari, v_jo));
  end if;
  -- La marca local que el disparador espera d'una persona amb sessió; el
  -- rollback de la subtransacció també la desfà.
  begin
    perform pg_catalog.set_config('sdp.desa_el_meu_usuari', 'on', true);
    update public.profiles p
       set username = v_usuari, username_confirmat_at = now()
     where p.id = v_jo;
    perform pg_catalog.set_config('sdp.desa_el_meu_usuari', '', true);
  exception when unique_violation then
    return jsonb_build_object('desat', false, 'motiu', 'ocupat', 'proposta', private.usuari_lliure(v_usuari, v_jo));
  end;
  return jsonb_build_object('desat', true, 'usuari', v_usuari, 'confirmat_al', now());
end;
$$;
revoke execute on function public.desa_el_meu_usuari(text) from public, anon;
grant execute on function public.desa_el_meu_usuari(text) to authenticated;


-- ── 8 · perfil_public amb l'identificador, només a la fitxa sencera ──────────
drop function if exists public.perfil_public(uuid);
create function public.perfil_public(p_id uuid)
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
  updated_at timestamptz,
  usuari text
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
    case when d.sencera then p.updated_at end,
    case when d.sencera then p.username end
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
