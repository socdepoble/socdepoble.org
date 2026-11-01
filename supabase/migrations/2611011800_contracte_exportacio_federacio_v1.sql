-- ============================================================================
-- 261101_1800 · P2-09 (auditoria Codex 261024_1315; kit Onada 2 de Codex,
-- integrat a l'assalt 261101 pel torn torn_3f5652a2) · Contracte explícit v1
-- de l'exportació RGPD de les taules de federació
--
-- QUÈ FA:
--   Crea private.exporta_federacio_v1(p_uid uuid) → jsonb (plpgsql, STABLE,
--   SECURITY INVOKER, search_path buit) i torna a crear
--   public.exporta_les_meues_dades() amb el cos sencer de 2610311900: només
--   canvia el bloc federacio_no_versionada, que ara és la crida protegida a la
--   funció privada. El contracte és supabase/contracts/exportacio_federacio.v1.json
--   (la prova src/data/supabase/exportacioFederacio.contracte.test.js el fa
--   casar amb este SQL). Per a cada recurs fixa UNA columna de propietat
--   (realms.owner_user_id, user_realms.user_id, connections.user_id,
--   posts.author_id) i els tipus admesos de cada columna exportable. Un recurs
--   només s'exporta si és una taula (no una vista), si id i la columna de
--   propietat són uuid, si cap columna del contracte present té un altre tipus
--   i si la columna de propietat té una FK d'una sola columna, validada, cap a
--   auth.users(id) o public.profiles(id). Llavors ixen les files on eixa
--   columna és la persona de la sessió, amb les columnes del contracte que la
--   taula tinga. La clau _contracte en diu la versió.
--
-- QUÈ NO FA:
--   Cap precedència entre columnes alternatives (la 2610311900 encara acceptava
--   realms.user_id, connections.owner_user_id i posts.owner_user_id/user_id) i
--   cap inferència per una columna uuid qualsevol. No crea taules, polítiques
--   ni endpoints; no canvia cap altra clau de l'exportació ni el format
--   (socdepoble.exportacio.v1). Una taula que no existix no ix (sense clau).
--   El client (compte.js i contracteExportacioFederacio.js) no canvia: torna a
--   filtrar i projectar, i descarta la clau _contracte.
--
-- CODIS:
--   SDP-FED-ESQUEMA-NO-ADMES · per recurs: l'esquema no casa amb el contracte;
--     l'exportació queda incompleta i la resta continua.
--   SQLSTATE de 5 caràcters · per recurs: la lectura ha fallat; la resta continua.
--   42501 o 42883 als quatre recursos · ha fallat la crida a la privada (la
--     propietària de l'RPC no la pot executar, o la privada no hi és); la resta
--     de l'exportació continua.
--   SDP-FED-PROPIETARI-INVALID (42501) · la funció privada només accepta l'uid
--     de la sessió.
--   SDP-EXPORT-000 (42501) · sense sessió, com abans.
--
-- Permisos: cap rol de l'API pot executar la privada (revoke a public, anon,
--   authenticated i service_role); només la propietària, i per tant l'RPC
--   pública si és de la mateixa propietària. L'RPC continua
--   SECURITY DEFINER, amb el search_path buit, auth.uid() i EXECUTE només per a
--   authenticated.
--
-- Depén de: 2610311900 (en porta el cos) i, per tant, de 2610241410. Va
--   després de 2610311900; si mai es torna a aplicar la 2610311900, cal tornar a
--   aplicar esta.
--
-- Abans (lectura), les columnes i les FK reals de les quatre taules:
--   select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('realms', 'user_realms', 'connections', 'posts') order by table_name, ordinal_position;
--   select k.relname as taula, a.attname as columna, c.confrelid::regclass as desti, c.convalidated as validada, cardinality(c.conkey) as columnes from pg_catalog.pg_constraint c join pg_catalog.pg_class k on k.oid = c.conrelid join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1] where c.contype = 'f' and k.relnamespace = 'public'::regnamespace and k.relname in ('realms', 'user_realms', 'connections', 'posts') order by 1, 2;
--   (una columna de propietat sense FK validada cap a auth.users o profiles,
--   o un tipus fora del contracte, donarà SDP-FED-ESQUEMA-NO-ADMES en eixe
--   recurs: cal decidir-ho abans d'aplicar).
-- Abans (lectura), qui aplica ha de ser la propietària de l'RPC actual, perquè
--   la privada naix seua i cap rol de l'API la pot executar (si dona fals, la
--   federació eixirà amb 42501 a cada recurs):
--   select pg_get_userbyid(p.proowner) as propietaria_rpc, current_user as qui_aplica, pg_get_userbyid(p.proowner) = current_user as casen from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.exporta_les_meues_dades()');
--
-- Verificació posterior (lectura):
--   select to_regprocedure('private.exporta_federacio_v1(uuid)') is not null as te_contracte_2611011800, position('private.exporta_federacio_v1' in pg_get_functiondef(to_regprocedure('public.exporta_les_meues_dades()'))) > 0 as l_rpc_la_crida, has_function_privilege('authenticated', 'private.exporta_federacio_v1(uuid)', 'execute') as authenticated_la_crida, (select p.proowner from pg_catalog.pg_proc p where p.oid = to_regprocedure('public.exporta_les_meues_dades()')) = (select p.proowner from pg_catalog.pg_proc p where p.oid = to_regprocedure('private.exporta_federacio_v1(uuid)')) as mateixa_propietaria;
--   (cert, cert, fals i cert).
--
-- Inversa: tornar a aplicar 2610311900 i, només després,
--   drop function if exists private.exporta_federacio_v1(uuid);
--   (en l'ordre contrari l'exportació no cau, però la federació ix amb 42883
--   a cada recurs fins que s'aplique la 2610311900).
--
-- Idempotent i en una sola transacció. NO aplicada.
-- L'aplica el Mestre, mai un agent.
-- ============================================================================
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create schema if not exists private;
create or replace function private.exporta_federacio_v1(p_uid uuid)
returns jsonb language plpgsql stable security invoker set search_path = '' as $fed$
declare
  v_resultat jsonb := jsonb_build_object('_contracte','sdp.exportacio.federacio.v1');
  v_recurs text; v_propietari text; v_columnes jsonb; v_oid oid;
  v_projeccio text; v_files jsonb;
begin
  if p_uid is null or p_uid is distinct from (select auth.uid()) then
    raise exception 'SDP-FED-PROPIETARI-INVALID' using errcode = '42501';
  end if;
  foreach v_recurs in array array['realms','user_realms','connections','posts'] loop
    v_oid := to_regclass(format('public.%I',v_recurs));
    if v_oid is null then continue; end if;
    begin
    case v_recurs
      when 'realms' then v_propietari := 'owner_user_id'; v_columnes := '{"id":["uuid"],"tenant_id":["uuid"],"slug":["text","character varying"],"name":["text","character varying"],"title":["text","character varying"],"description":["text","character varying"],"domain":["text","character varying"],"protocol":["text","character varying"],"visibility":["text","character varying"],"status":["text","character varying"],"owner_user_id":["uuid"],"created_at":["timestamp with time zone","timestamp without time zone"],"updated_at":["timestamp with time zone","timestamp without time zone"]}'::jsonb;
      when 'user_realms' then v_propietari := 'user_id'; v_columnes := '{"id":["uuid"],"tenant_id":["uuid"],"user_id":["uuid"],"realm_id":["uuid"],"role":["text","character varying"],"status":["text","character varying"],"handle":["text","character varying"],"actor_uri":["text","character varying"],"created_at":["timestamp with time zone","timestamp without time zone"],"updated_at":["timestamp with time zone","timestamp without time zone"]}'::jsonb;
      when 'connections' then v_propietari := 'user_id'; v_columnes := '{"id":["uuid"],"tenant_id":["uuid"],"user_id":["uuid"],"realm_id":["uuid"],"provider":["text","character varying"],"remote_actor_uri":["text","character varying"],"remote_handle":["text","character varying"],"direction":["text","character varying"],"status":["text","character varying"],"created_at":["timestamp with time zone","timestamp without time zone"],"updated_at":["timestamp with time zone","timestamp without time zone"]}'::jsonb;
      when 'posts' then v_propietari := 'author_id'; v_columnes := '{"id":["uuid"],"tenant_id":["uuid"],"author_id":["uuid"],"realm_id":["uuid"],"title":["text","character varying"],"content":["text","character varying"],"summary":["text","character varying"],"visibility":["text","character varying"],"status":["text","character varying"],"uri":["text","character varying"],"url":["text","character varying"],"published_at":["timestamp with time zone","timestamp without time zone"],"created_at":["timestamp with time zone","timestamp without time zone"],"updated_at":["timestamp with time zone","timestamp without time zone"]}'::jsonb;
    end case;
    -- Només taules ordinàries/particionades, mai una vista amb semàntica aliena.
    if not exists(select 1 from pg_catalog.pg_class where oid=v_oid and relkind in ('r','p'))
      or exists (select 1 from unnest(array['id',v_propietari]) n(nom)
        where not exists(select 1 from information_schema.columns c
          where c.table_schema='public' and c.table_name=v_recurs and c.column_name=n.nom and c.data_type='uuid'))
      or exists (select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name=v_recurs and v_columnes ? c.column_name
          and not ((v_columnes -> c.column_name) ? c.data_type))
      -- La columna canònica ha de referenciar un compte. FK de realm, tenant
      -- o contrapart no acredita propietat. FK compostes/no validades tampoc.
      or not exists (
        select 1 from pg_catalog.pg_constraint fk
        join pg_catalog.pg_attribute origen on origen.attrelid=fk.conrelid and origen.attnum=fk.conkey[1]
        join pg_catalog.pg_attribute desti on desti.attrelid=fk.confrelid and desti.attnum=fk.confkey[1]
        where fk.conrelid=v_oid and fk.contype='f' and fk.convalidated
          and cardinality(fk.conkey)=1 and cardinality(fk.confkey)=1
          and origen.attname=v_propietari and desti.attname='id'
          and fk.confrelid in (to_regclass('auth.users'),to_regclass('public.profiles'))
      ) then
      v_resultat := v_resultat || jsonb_build_object(v_recurs,jsonb_build_object('error','SDP-FED-ESQUEMA-NO-ADMES'));
      continue;
    end if;
    select string_agg(format('t.%I',c.column_name),', ' order by c.ordinal_position)
      into v_projeccio from information_schema.columns c
      where c.table_schema='public' and c.table_name=v_recurs and v_columnes ? c.column_name;
    execute format('select coalesce(jsonb_agg(to_jsonb(e)), ''[]''::jsonb)
      from (select %s from public.%I t where t.%I = $1) e',v_projeccio,v_recurs,v_propietari)
      into v_files using p_uid;
    v_resultat := v_resultat || jsonb_build_object(v_recurs,v_files);
    exception when others then
      v_resultat := v_resultat || jsonb_build_object(v_recurs,jsonb_build_object('error',sqlstate));
    end;
  end loop;
  return v_resultat;
end;
$fed$;
revoke all on function private.exporta_federacio_v1(uuid) from public, anon, authenticated, service_role;

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

  -- P2-09 v1: propietat demostrada i projecció per recurs. Si falla la crida
  -- mateixa (la propietària de l'RPC no pot executar la privada, o la privada
  -- s'ha esborrat abans de tornar a aplicar la 2610311900), cada recurs en diu
  -- el SQLSTATE i la resta de l'exportació continua, com en la 2610311900.
  -- Un error de primer nivell no serviria: el client només mira els recursos.
  begin
    v_federacio := private.exporta_federacio_v1(v_uid);
  exception when insufficient_privilege or undefined_function then
    v_federacio := jsonb_build_object('realms', jsonb_build_object('error', sqlstate),
                                      'user_realms', jsonb_build_object('error', sqlstate),
                                      'connections', jsonb_build_object('error', sqlstate),
                                      'posts', jsonb_build_object('error', sqlstate));
  end;

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
