-- ============================================================================
-- 261024_1410 · P2-08 (pla 261024_1315, T7; auditoria Codex C-04) · «Descarregar
-- les meues dades», completa: la moderació, el xat sencer, els adjunts, els
-- seguiments i el permís d'Apple, i què es deixa fora a posta.
--
-- QUÈ FA:
--   1. Torna a crear public.exporta_les_meues_dades() amb la versió de
--      2609261500 al peu de la lletra (la mateixa signatura i capçalera, el
--      format 'socdepoble.exportacio.v1' i els mateixos permisos) i només hi
--      afig lectures filtrades per la persona (v_uid):
--      · 'moderacio' (2610201500): denuncies_fetes (les que has fet, amb
--        columnes explícites; de l'empremta d'IP, només si n'hi ha),
--        denuncies_rebudes (NOMÉS amb_mesura: quantes de les que t'afecten
--        han acabat retirant el contingut; cap fila, tipus, motiu ni estat
--        en curs, ni qui denuncia), bloquejos (només els que has fet tu) i
--        normes_acceptades.
--      · 'xat': els missatges propis guanyen id, seq, tipus, resposta_a,
--        editat_al, esborrat_al, caduca_al, metadades, com_org_id i
--        esborrat_per_mi (mai l'id de qui el va esborrar); les converses, el
--        tipus i el subjecte del fil i els teus ajustos de participant; i
--        adjunts_propis (2610220240) amb el bucket i el nom de cada objecte,
--        perquè es puga recuperar. Un àudio o una foto sense peu (text null)
--        conserva la referència a metadades.adjunt.
--      · 'seguiments' (2610241430, T6b): a qui seguixes ara i, de qui et
--        seguix ara, només quants (els deixats de seguir, amb deixat_al, no
--        hi compten).
--      · 'apple' (T1): quan es va desar el permís que vas donar a Sóc de
--        Poble (desat_al); mai el testimoni xifrat.
--      · 'no_inclou': què es deixa fora i per què.
--   2. Cada lectura de moderació, adjunts, seguiments i Apple va dins d'un
--      IF to_regclass(...): sense la migració que crea la taula, la clau ix
--      null (adjunts_propis, buida) i l'exportació no falla. Les de
--      seguiments i Apple, a més, capturen undefined_column i datatype_mismatch:
--      si l'esquema no casa, la clau diu l'error i la resta continua.
--   3. Els permisos, amb el mandat Supabase 30-Oct-2026: primer es revoca tot
--      a public, anon, authenticated i service_role i després només
--      authenticated la pot executar (com fins ara per al client).
--
-- QUÈ NO FA:
--   · Cap taula, columna, política ni permís de taula nou. No canvia els
--     permisos de public.denuncies (la RLS ja et deixa llegir les teues).
--   · No exporta qui t'ha denunciat ni cap fila de les denúncies sobre tu
--     (RGPD, art. 15.4), ni cap recompte de les pendents, revisades o
--     desestimades, ni per tipus ni per motiu: un recompte en directe es pot
--     comparar entre dues exportacions i delataria qui denuncia. El detall es
--     respon per correu, ponderant els drets de qui denuncia. Tampoc qui t'ha
--     bloquejat (ni tan sols quants), qui et seguix, les empremtes d'IP ni el
--     testimoni xifrat d'Apple.
--   · No signa cap URL ni porta els bytes dels fitxers: en dona el bucket i
--     el nom.
--
-- CODIS (sense canvis):
--   SDP-EXPORT-000 cal la sessió iniciada (42501)
--
-- Depén de: 2609261500 (la versió que redefinix) i de les columnes del xat de
-- 2609270200, 2609272200 i 2609282100 (aplicades al node remot el 261009).
-- Si hi són, llig 2610201500 (moderació), 2610220240 (adjunts), 2610241420
-- (T1, private.autoritzacions_apple) i 2610241430 (seguiments, T6b): es
-- comprova en cridar-la, no en aplicar-la, i l'ordre entre elles no importa.
--
-- Additiva i idempotent. Revisada i NO aplicada a cap base de dades.
-- L'aplica el Mestre, mai un agent.
-- ============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create or replace function public.exporta_les_meues_dades()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_fitxers   jsonb := '[]'::jsonb;
  v_federacio jsonb := '{}'::jsonb;
  v_taula     text;
  v_condicio  text;
  v_files     jsonb;
  -- P2-08 (T7) · Les claus noves. Null (adjunts_propis, buida) vol dir que la
  -- taula encara no hi és: la migració que la crea no s'ha aplicat.
  v_moderacio  jsonb;
  v_adjunts    jsonb := '[]'::jsonb;
  v_seguiments jsonb;
  v_apple      jsonb;
begin
  if v_uid is null then
    raise exception 'SDP-EXPORT-000: cal la sessió iniciada.' using errcode = '42501';
  end if;

  -- Fitxers propis: <poble>/<uid>/<carpeta>/fitxer o el format antic <uid>/fitxer.
  begin
    select coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'nom', o.name, 'creat_al', o.created_at)
                              order by o.created_at), '[]'::jsonb)
      into v_fitxers
    from storage.objects o
    where o.bucket_id in ('mitjans', 'mitjans_privats')
      and ((storage.foldername(o.name))[2] = v_uid::text
        or (cardinality(storage.foldername(o.name)) = 1 and (storage.foldername(o.name))[1] = v_uid::text));
  exception when insufficient_privilege or undefined_table or undefined_function then
    v_fitxers := null;
  end;

  -- Federació no versionada (directiva del Mestre): al Supabase viu hi ha
  -- taules que no són al repositori (realms, user_realms, connections i potser
  -- posts). No se'n suposa cap columna. Per a cada taula que existisca,
  -- s'exporten les files on alguna columna uuid (llevat d'id i tenant_id) és la
  -- de la persona. Si la taula no existix, o no té cap columna uuid candidata,
  -- no hi apareix. Els noms passen per format('%I'): cap concatenació crua.
  foreach v_taula in array array['realms', 'user_realms', 'connections', 'posts'] loop
    if to_regclass(format('public.%I', v_taula)) is null then
      continue;
    end if;
    select string_agg(format('t.%I = $1', c.column_name), ' or ' order by c.ordinal_position)
      into v_condicio
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = v_taula
      and c.data_type = 'uuid'
      and c.column_name not in ('id', 'tenant_id');
    if v_condicio is null then
      continue;
    end if;
    begin
      execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where %s',
                     v_taula, v_condicio)
        into v_files
        using v_uid;
      v_federacio := v_federacio || jsonb_build_object(v_taula, v_files);
    exception when others then
      v_federacio := v_federacio || jsonb_build_object(v_taula, jsonb_build_object('error', sqlstate));
    end;
  end loop;

  -- P2-08 (T7) · La moderació (2610201500): les denúncies que has fet, de les
  -- que t'afecten només quantes han acabat amb una mesura, els bloquejos que
  -- has fet tu i les normes que has acceptat. Cada lectura va filtrada per
  -- v_uid. De qui t'ha
  -- denunciat o bloquejat no n'ix res (RGPD, art. 15.4); de l'empremta d'IP,
  -- només si n'hi ha (com els consentiments, que no la porten).
  if to_regclass('public.denuncies') is not null
     and to_regclass('public.bloquejos') is not null
     and to_regclass('private.normes_acceptades') is not null then
    v_moderacio := jsonb_build_object(
      'denuncies_fetes', coalesce((
        select jsonb_agg(jsonb_build_object('id', d.id, 'objecte_tipus', d.objecte_tipus, 'objecte_id', d.objecte_id,
                                            'autor_tipus', d.autor_tipus, 'autor_id', d.autor_id, 'fil_id', d.fil_id,
                                            'poble_id', d.tenant_id, 'motiu', d.motiu, 'detall', d.detall,
                                            'estat', d.estat, 'al', d.creat_al, 'revisada_al', d.revisada_al,
                                            'empremta_ip_desada', d.ip_hash is not null) order by d.creat_al)
        from public.denuncies d where d.denunciant = v_uid), '[]'::jsonb),
      -- Les que altres persones han fet sobre tu o sobre el que has publicat o
      -- escrit: NOMÉS quantes han acabat amb una mesura (estat 'retirada'),
      -- que ja veus perquè el contingut s'ha retirat. Cap fila, data, detall,
      -- tipus ni motiu, ni les pendents, revisades o desestimades: un recompte
      -- en directe es pot comparar entre dues exportacions i, en un directe 1:1
      -- o en un poble menut, delataria qui denuncia (revisió 261024 R2-02 i
      -- R3-07). El detall es respon per correu, ponderant els drets de qui
      -- denuncia (RGPD, art. 15.4). L'autor el declara el client: el recompte
      -- pot incloure atribucions falses.
      'denuncies_rebudes', jsonb_build_object('amb_mesura', (
        select count(*)
        from public.denuncies d where d.denunciant is distinct from v_uid
          and d.estat = 'retirada'
          and ((d.autor_tipus = 'persona' and d.autor_id = v_uid::text)
            or (d.objecte_tipus = 'persona' and d.objecte_id = v_uid::text)
            or (d.objecte_tipus in ('publicacio', 'producte', 'esdeveniment') and d.objecte_id in (
                  select s.id::text from public.section_submissions s where s.owner_user_id = v_uid))
            or (d.objecte_tipus = 'missatge' and d.objecte_id in (
                  select m.id::text from public.xat_missatges m where m.usuari_id = v_uid))))),
      'bloquejos', coalesce((
        select jsonb_agg(jsonb_build_object('tipus', b.bloquejat_tipus,
                                            'id', coalesce(b.bloquejat_persona, b.bloquejat_entitat),
                                            'nom', b.nom, 'al', b.creat_al) order by b.creat_al)
        from public.bloquejos b where b.bloquejador = v_uid), '[]'::jsonb),
      'normes_acceptades', coalesce((
        select jsonb_agg(jsonb_build_object('versio', n.versio, 'acceptada_al', n.acceptada_al,
                                            'empremta_ip_desada', n.ip_hash is not null) order by n.acceptada_al)
        from private.normes_acceptades n where n.usuari_id = v_uid), '[]'::jsonb));
  end if;

  -- P2-08 (T7; auditoria Codex C-04) · Els adjunts propis del xat (2610220240).
  -- Cada objecte del bucket privat xat_adjunts es diu com l'id de la reserva:
  -- amb el bucket i el nom es pot recuperar. Un àudio o una foto sense peu té
  -- el text null, i la referència és a les metadades del missatge.
  if to_regclass('public.xat_adjunts') is not null then
    select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'fil_id', a.fil_id, 'mime', a.mime, 'bytes', a.bytes,
                                                 'durada_ms', a.durada_ms, 'versio', a.versio, 'publicat', a.publicat,
                                                 'creat_al', a.creat_al, 'bucket', 'xat_adjunts', 'nom', a.id::text)
                              order by a.creat_al), '[]'::jsonb)
      into v_adjunts
    from public.xat_adjunts a where a.usuari_id = v_uid;
  end if;

  -- P2-08 (T7) · Els seguiments (2610241430, T6b): a qui seguixes tu (des de
  -- la primera vegada i, si l'havies deixat, quan la vas tornar a seguir) i,
  -- de qui et seguix, només quants. Només els vius: deixar de seguir hi posa
  -- deixat_al (revisió 261024 R2-04) i eixa fila ja no és un seguiment. Si
  -- l'esquema no casa (una 2610241430 sense deixat_al, per exemple), la clau
  -- diu l'error i la resta de l'exportació continua.
  if to_regclass('public.seguiments') is not null then
    begin
      v_seguiments := jsonb_build_object(
        'seguits', coalesce((
          select jsonb_agg(jsonb_build_object('tipus', s.seguit_tipus,
                                              'id', coalesce(s.seguit_persona, s.seguit_entitat),
                                              'des_de', s.creat_al, 'reactivat_al', s.reactivat_al)
                           order by s.creat_al)
          from public.seguiments s where s.seguidor = v_uid and s.deixat_al is null), '[]'::jsonb),
        'total_seguidors', (select count(*) from public.seguiments s where s.seguit_persona = v_uid and s.deixat_al is null));
    exception when undefined_column or datatype_mismatch then
      v_seguiments := jsonb_build_object('error', sqlstate);
    end;
  end if;

  -- P2-08 (T7) · Apple (T1): quan es va desar el permís que vas donar a Sóc de
  -- Poble. Mai el testimoni xifrat: és una credencial i no ix del servidor.
  if to_regclass('private.autoritzacions_apple') is not null then
    begin
      v_apple := jsonb_build_object('autoritzacio_desada_al', (
        select a.desat_al from private.autoritzacions_apple a where a.user_id = v_uid));
    exception when undefined_column or datatype_mismatch then
      v_apple := jsonb_build_object('error', sqlstate);
    end;
  end if;

  return jsonb_build_object(
    'format', 'socdepoble.exportacio.v1',
    'generat_al', now(),
    'compte', (
      select jsonb_build_object('id', u.id, 'email', u.email, 'creat_al', u.created_at,
                                'ultima_entrada_al', u.last_sign_in_at, 'metadades', u.raw_user_meta_data)
      from auth.users u where u.id = v_uid),
    'perfil', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'baixa', (
      select jsonb_build_object('demanada_al', b.demanada_al, 'purga_prevista_al', b.purga_prevista_al,
                                'motiu', b.motiu, 'dades_en_quarantena', b.instantania)
      from private.baixes b where b.user_id = v_uid),
    'pobles', coalesce((
      select jsonb_agg(jsonb_build_object('poble_id', t.id, 'slug', t.slug, 'nom', t.name,
                                          'rol', m.role, 'des_de', m.created_at) order by m.created_at)
      from public.town_memberships m join public.towns t on t.id = m.town_id
      where m.user_id = v_uid), '[]'::jsonb),
    'organitzacions', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'slug', o.slug, 'nom', o.name, 'tipus', o.kind,
                                          'rol', m.role, 'des_de', m.created_at,
                                          'creada_per_mi', o.created_by = v_uid) order by m.created_at)
      from public.organization_memberships m join public.organizations o on o.id = m.organization_id
      where m.user_id = v_uid), '[]'::jsonb),
    'reclamacions', coalesce((
      select jsonb_agg(jsonb_build_object('organitzacio', c.organization_id, 'estat', c.estat,
                                          'justificacio', c.justificacio, 'al', c.created_at,
                                          'resolta_al', c.resolta_at) order by c.created_at)
      from public.organization_claims c where c.user_id = v_uid), '[]'::jsonb),
    'rols_plataforma', coalesce((
      select jsonb_agg(jsonb_build_object('rol', r.role, 'des_de', r.granted_at))
      from public.user_platform_roles r where r.user_id = v_uid), '[]'::jsonb),
    'publicacions', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at)
      from public.section_submissions s where s.owner_user_id = v_uid), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at)
      from public.notes n where n.owner_user_id = v_uid), '[]'::jsonb),
    'consentiments', coalesce((
      select jsonb_agg(jsonb_build_object('tipus', c.tipus, 'accio', c.accio, 'versio_politica', c.versio_politica,
                                          'text_sha256', c.text_sha256, 'origen', c.origen, 'al', c.creat_al)
                       order by c.creat_al)
      from public.consentiments c where c.user_id = v_uid), '[]'::jsonb),
    'xat', jsonb_build_object(
      'adjunts_propis', v_adjunts,
      'converses', coalesce((
        select jsonb_agg(jsonb_build_object('fil_id', f.id, 'titol', f.titol, 'creat_al', f.creat_al,
                                            'tipus', f.tipus, 'subjecte_tipus', f.subjecte_tipus,
                                            'subjecte_id', f.subjecte_id, 'subjecte_ruta', f.subjecte_ruta,
                                            'subjecte_titol', f.subjecte_titol, 'subjecte_uri', f.subjecte_uri,
                                            'rol', p.rol, 'com_org_id', p.com_org_id, 'etiqueta', p.etiqueta,
                                            'eixit_al', p.eixit_al, 'silenciat_fins_al', p.silenciat_fins_al,
                                            'arxivat_al', p.arxivat_al, 'fixat_al', p.fixat_al,
                                            'preferit_al', p.preferit_al, 'no_llegit_manual', p.no_llegit_manual,
                                            'avisos', p.avisos, 'llegit_fins_seq', p.llegit_fins_seq,
                                            'creada_per_mi', f.creat_per = v_uid) order by f.creat_al)
        from public.xat_participants p join public.xat_fils f on f.id = p.fil_id
        where p.usuari_id = v_uid), '[]'::jsonb),
      'missatges_propis', coalesce((
        select jsonb_agg(jsonb_build_object('fil_id', m.fil_id, 'text', m.text, 'creat_al', m.creat_al)
                         -- P2-08 (T7) · Les columnes de F0 (2609270200 i 2609272200): d'un
                         -- àudio o d'una foto sense peu, la referència és a metadades.adjunt.
                         || jsonb_build_object('id', m.id, 'seq', m.seq, 'tipus', m.tipus, 'resposta_a', m.resposta_a,
                                               'editat_al', m.editat_al, 'esborrat_al', m.esborrat_al,
                                               'esborrat_per_mi', coalesce(m.esborrat_per = v_uid, false),
                                               'caduca_al', m.caduca_al, 'metadades', m.metadades,
                                               'com_org_id', m.com_org_id)
                         order by m.creat_al)
        from public.xat_missatges m where m.usuari_id = v_uid), '[]'::jsonb),
      'lectures', coalesce((
        select jsonb_agg(jsonb_build_object('fil_id', l.fil_id, 'ultim_llegit_al', l.ultim_llegit_al))
        from public.xat_lectures l where l.usuari_id = v_uid), '[]'::jsonb)),
    -- P2-08 (T7) · Les claus noves, i què es deixa fora a posta i per què.
    'moderacio', v_moderacio,
    'seguiments', v_seguiments,
    'apple', v_apple,
    'no_inclou', jsonb_build_array(
      jsonb_build_object('que', 'qui ha fet les denúncies sobre tu o sobre el teu contingut, cadascuna d''elles i les que no han acabat amb una mesura',
                         'per_que', 'per a protegir qui denuncia: un recompte que canvia en directe delataria qui ho ha fet, '
                                    || 'i només hi ha quantes han acabat amb una mesura. Si en vols el detall, demana-nos-el '
                                    || 'per correu, a l''adreça de contacte de la política de privacitat: et respondrem '
                                    || 'ponderant els drets de qui denuncia (RGPD, art. 15.4)'),
      jsonb_build_object('que', 'qui t''ha bloquejat',
                         'per_que', 'bloquejar no avisa ningú, i dir-ho delataria qui ho ha fet'),
      jsonb_build_object('que', 'qui et seguix',
                         'per_que', 'és una dada de cada persona que et seguix; en tens el nombre'),
      jsonb_build_object('que', 'les empremtes de l''adreça IP',
                         'per_que', 'són resums amb una clau del servidor que a tu no et servixen i que, fora d''ell, '
                                    || 'podrien relacionar-te amb una adreça; només hi diem si n''hi ha'),
      jsonb_build_object('que', 'el permís xifrat d''Apple',
                         'per_que', 'és una credencial: només servix per a retirar-lo i no ix mai del servidor'),
      jsonb_build_object('que', 'el contingut dels fitxers i dels adjunts',
                         'per_que', 'este fitxer és de text: de cada un hi ha el bucket i el nom per a recuperar-lo')),
    'fitxers', v_fitxers,
    'federacio_no_versionada', v_federacio
  );
end;
$$;
revoke all on function public.exporta_les_meues_dades() from public, anon, authenticated, service_role;
grant execute on function public.exporta_les_meues_dades() to authenticated;

notify pgrst, 'reload schema';
commit;
