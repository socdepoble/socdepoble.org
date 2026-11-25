-- C4 v1.2.25: executa abans de la reconciliació, conserva resultat i hash.
-- Catàleg + dos ajustos Push redactats: funciona si falten taules/dependències.
-- Els ajustos només poden tornar si/no/unknown. Cap altra configuració es retorna.
-- No retorna SQL prosrc, files de negoci, tokens ni noms d'objectes Storage.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='15s';
WITH wanted(signature) AS (VALUES
 ('private.r3244_edicio_snapshot()'),('private.comprova_una_propietaria()'),
 ('private.is_town_member(uuid)'),('private.trigger_rate_limit_xat()'),
 ('public.touch_updated_at()'),('public.xat_push_reclama_v2(integer)'),
 ('public.xat_push_confirma_v2(jsonb)'),('public.xat_push_desperta_v2(uuid,uuid)')
), functions AS (
 SELECT w.signature,p.oid IS NOT NULL AS present,
  CASE WHEN p.oid IS NOT NULL THEN encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') END AS body_sha256,
  p.prosecdef AS security_definer,p.proconfig AS config,p.provolatile::text AS volatility,
  CASE WHEN p.oid IS NOT NULL THEN pg_get_function_result(p.oid) END AS result,
  pg_get_userbyid(p.proowner) AS owner,p.proacl::text AS acl,
  coalesce((SELECT jsonb_object_agg(r.rolname,has_function_privilege(r.oid,p.oid,'EXECUTE'))
    FROM pg_roles r WHERE p.oid IS NOT NULL AND r.rolname IN('anon','authenticated','service_role')),'{}'::jsonb) AS effective_execute
 FROM wanted w LEFT JOIN pg_proc p ON p.oid=to_regprocedure(w.signature)
), tables AS (
 SELECT wanted.name,c.oid IS NOT NULL AS present,c.relkind::text AS kind,c.relrowsecurity AS rls,c.relforcerowsecurity AS force_rls,
  pg_get_userbyid(c.relowner) AS owner,
  coalesce((SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull) ORDER BY a.attnum)
   FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb) AS columns,
  coalesce((SELECT jsonb_agg(jsonb_build_object('name',x.conname,'type',x.contype,'definition',pg_get_constraintdef(x.oid,true)) ORDER BY x.conname)
   FROM pg_constraint x WHERE x.conrelid=c.oid),'[]'::jsonb) AS constraints,
  coalesce((SELECT jsonb_agg(jsonb_build_object('name',t.tgname,'enabled',t.tgenabled,'function',t.tgfoid::regprocedure::text) ORDER BY t.tgname)
   FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal),'[]'::jsonb) AS triggers
 FROM (VALUES ('private.admin_accions'),
  ('private.admin_invitacions'),
  ('private.ajuntament_auditoria'),
  ('private.ajuntament_dominis_oficials'),
  ('private.aparadors_sync_events'),
  ('private.aparadors_sync_sources'),
  ('private.connexions_preferencies'),
  ('private.connexions_sollicituds'),
  ('private.connexions_vincles'),
  ('private.lssi_revisions'),
  ('private.municipi_opendata_documents'),
  ('private.mur_actes_notes'),
  ('private.mur_bloquejos_opacs'),
  ('private.mur_operacions_notes'),
  ('private.mur_publicacions_revocades'),
  ('private.mur_revocacions_notes'),
  ('private.publicacio_traspassos'),
  ('private.publicacions_beta_cas_rebuts'),
  ('private.publicacions_cas_rebuts'),
  ('private.r3213_crdt_captures'),
  ('private.r3213_crdt_dots'),
  ('private.r3213_lssi_audit'),
  ('private.r3213_lssi_rebuts'),
  ('private.r3244_edicio_contract'),
  ('private.xat_iaia_binding'),
  ('private.xat_iaia_jobs'),
  ('private.xat_iaia_principals'),
  ('private.xat_presencia'),
  ('public.aportacions_culturals'),
  ('public.app_content_historial'),
  ('public.bloquejos'),
  ('public.consentiments'),
  ('public.denuncies'),
  ('public.inventari_brain_node0'),
  ('public.note_folders'),
  ('public.notes'),
  ('public.organization_claims'),
  ('public.organization_member_organizations'),
  ('public.organization_memberships'),
  ('public.organizations'),
  ('public.page_revisions'),
  ('public.push_subscriptions'),
  ('public.seed_revisions'),
  ('public.seguiments'),
  ('public.user_platform_roles'),
  ('public.xat_alliberaments_recuperacio'),
  ('public.xat_avals_recuperacio'),
  ('public.xat_dispositius_push'),
  ('public.xat_fils'),
  ('public.xat_missatges'),
  ('public.xat_missatges_fixats'),
  ('public.xat_participants'),
  ('public.xat_reaccions'),
  ('public.xat_verificacions_recuperacio'),
  ('storage.objects')) wanted(name)
 LEFT JOIN pg_class c ON c.oid=to_regclass(wanted.name)
), push_config AS (
 -- L'únic SQL dinàmic és este literal fix, sense cap entrada del caller.
 -- CASE evita resoldre private.ajustos quan no existeix. El tipus text exacte
 -- evita executar conversions desconegudes; la transacció continua READ ONLY.
 -- Àlies XML simples: SQL/XML escapa el fragment «_x» dels noms SQL llargs.
 SELECT CASE WHEN EXISTS (
  SELECT FROM pg_class c WHERE c.oid=to_regclass('private.ajustos') AND c.relkind IN('r','p')
   AND has_table_privilege(current_user,c.oid,'SELECT')
   AND 2=(SELECT count(*) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
     AND a.attname IN('clau','valor') AND a.atttypid='text'::regtype)
 ) THEN pg_catalog.query_to_xml($push_flags$
  SELECT
   (SELECT CASE WHEN count(*)=1 THEN min(CASE WHEN valor IN('si','no') THEN valor ELSE 'unknown' END) ELSE 'unknown' END
    FROM private.ajustos WHERE clau='push_poble_actiu') AS poble,
   (SELECT CASE WHEN count(*)=1 THEN min(CASE WHEN valor IN('si','no') THEN valor ELSE 'unknown' END) ELSE 'unknown' END
    FROM private.ajustos WHERE clau='push_xat_actiu') AS xat
 $push_flags$,false,false,'') ELSE NULL::xml END AS flags
)
SELECT jsonb_build_object(
 'format','sdp.v1225.preflight-132-135-push.v1',
 'observed_at',clock_timestamp(),
 'database',current_database(),
 'functions',(SELECT jsonb_agg(to_jsonb(f) ORDER BY f.signature) FROM functions f),
 'tables',(SELECT jsonb_agg(to_jsonb(t) ORDER BY t.name) FROM tables t),
 'push_settings',(SELECT jsonb_build_object(
   'push_poble_actiu',coalesce((pg_catalog.xpath('/table/row/poble/text()',p.flags))[1]::text,'unknown'),
   'push_xat_actiu',coalesce((pg_catalog.xpath('/table/row/xat/text()',p.flags))[1]::text,'unknown')
  ) FROM push_config p),
 'storage_policies',(SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.policyname),'[]'::jsonb)
    FROM pg_policies p WHERE p.schemaname='storage' AND p.tablename='objects'),
 'foreign_keys',(SELECT coalesce(jsonb_agg(jsonb_build_object(
  'schema_name',n.nspname,'table_name',c.relname,'name',x.conname,
  'definition',pg_get_constraintdef(x.oid,true),
  'columns',ARRAY(SELECT a.attname::text FROM unnest(x.conkey) WITH ORDINALITY k(attnum,ord) JOIN pg_attribute a ON a.attrelid=x.conrelid AND a.attnum=k.attnum ORDER BY k.ord),
  'referenced_table',(SELECT rn.nspname||'.'||rc.relname FROM pg_class rc JOIN pg_namespace rn ON rn.oid=rc.relnamespace WHERE rc.oid=x.confrelid),
  'indexes',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',ic.relname,'definition',pg_get_indexdef(i.indexrelid),
   'valid',i.indisvalid,'ready',i.indisready,'live',i.indislive) ORDER BY ic.relname),'[]'::jsonb)
   FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid WHERE i.indrelid=x.conrelid))
   ORDER BY n.nspname,c.relname,x.conname),'[]'::jsonb)
   FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE x.contype='f' AND n.nspname IN('public','private')),
 'registry_present',to_regclass('supabase_migrations.schema_migrations') IS NOT NULL,
 'business_rows_read',false,
 'production_verified',false
) AS preflight;
ROLLBACK;
