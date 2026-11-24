-- C12 · suplement de catàleg: NOMÉS LECTURA, no executat contra producció.
-- El JSON original no té prosrc, totes les polítiques/ACL ni índexs complets.
-- No retorna files de negoci, noms d'objectes Storage, correus o cossos SQL.
-- L'operador ha de conservar el JSON resultant i el SHA d'esta sonda.
BEGIN READ ONLY;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='15s';
SELECT jsonb_build_object(
 'format','sdp.r3272.catalogue-supplement.v1',
 'generated_at_utc',clock_timestamp(),
 'postgres_version',version(),
 'functions',(
   SELECT coalesce(jsonb_agg(jsonb_build_object(
     'signature',p.oid::regprocedure::text,'arguments',pg_get_function_arguments(p.oid),
     'result',pg_get_function_result(p.oid),'owner',pg_get_userbyid(p.proowner),
     'prosrc_sha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),
     'definition_sha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex'),
     'security_definer',p.prosecdef,'search_path_and_config',p.proconfig,'volatility',p.provolatile,
     'language',l.lanname,'acl',p.proacl::text,
     'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
     'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
     'service_execute',has_function_privilege('service_role',p.oid,'EXECUTE'),
     'public_execute',exists(SELECT FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
       WHERE a.grantee=0 AND a.privilege_type='EXECUTE')
   ) ORDER BY p.oid::regprocedure::text),'[]'::jsonb)
   FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
   WHERE p.oid=ANY(ARRAY[to_regprocedure('private.r3244_edicio_snapshot()'),
     to_regprocedure('private.xat_missatges_e2ee()'),to_regprocedure('public.xat_elimina_per_a_tothom(uuid,uuid)'),
     to_regprocedure('private.comprova_una_propietaria()'),to_regprocedure('private.is_town_member(uuid)'),
     to_regprocedure('private.trigger_rate_limit_xat()'),to_regprocedure('public.touch_updated_at()')])
 ),
 'edicio_contract',(
   SELECT jsonb_build_object('id',c.id,
     'snapshot_sha256',encode(sha256(convert_to(c.snapshot::text,'UTF8')),'hex'))
   FROM private.r3244_edicio_contract c WHERE c.id=1
 ),
 'target_trigger_bindings',(
   SELECT coalesce(jsonb_agg(jsonb_build_object('schema_name',n.nspname,'table_name',c.relname,
     'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true),
     'function',p.oid::regprocedure::text) ORDER BY n.nspname,c.relname,t.tgname),'[]'::jsonb)
   FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   JOIN pg_proc p ON p.oid=t.tgfoid WHERE NOT t.tgisinternal
     AND p.oid=ANY(ARRAY[to_regprocedure('private.comprova_una_propietaria()'),
       to_regprocedure('private.trigger_rate_limit_xat()'),to_regprocedure('public.touch_updated_at()')])
 ),
 'foreign_keys_and_indexes',(
   SELECT coalesce(jsonb_agg(jsonb_build_object(
     'schema_name',n.nspname,'table_name',c.relname,'constraint_name',con.conname,
     'constraint_definition',pg_get_constraintdef(con.oid,true),'validated',con.convalidated,
     'deferrable',con.condeferrable,'initially_deferred',con.condeferred,
     'fk_columns',ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY k(num,ord)
       JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=k.num ORDER BY k.ord),
     'referenced_table',con.confrelid::regclass::text,
     'indexes',coalesce((SELECT jsonb_agg(jsonb_build_object(
       'index_name',ic.relname,'definition',pg_get_indexdef(i.indexrelid),'method',am.amname,
       'valid',i.indisvalid,'ready',i.indisready,'live',i.indislive,'unique',i.indisunique,
       'key_count',i.indnkeyatts,'attribute_count',i.indnatts,'key_attnums',i.indkey::smallint[],
       'operator_classes',i.indclass::oid[],'collations',i.indcollation::oid[],
       'predicate',pg_get_expr(i.indpred,i.indrelid),'expressions',pg_get_expr(i.indexprs,i.indrelid)
     ) ORDER BY ic.relname) FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid
       JOIN pg_am am ON am.oid=ic.relam WHERE i.indrelid=con.conrelid),'[]'::jsonb)
   ) ORDER BY n.nspname,c.relname,con.conname),'[]'::jsonb)
   FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE con.contype='f' AND n.nspname IN('public','private')
 ),
 'storage_policies',(
   SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.policyname),'[]'::jsonb)
   FROM pg_policies p WHERE p.schemaname='storage' AND p.tablename='objects'
 ),
 'private_helper_policy_dependencies',(
   SELECT coalesce(jsonb_agg(jsonb_build_object('schema_name',n.nspname,'table_name',c.relname,
     'policy',pol.polname,'function',f.oid::regprocedure::text,'roles',pol.polroles)
     ORDER BY n.nspname,c.relname,pol.polname,f.oid::regprocedure::text),'[]'::jsonb)
   FROM pg_depend d JOIN pg_policy pol ON d.classid='pg_policy'::regclass AND d.objid=pol.oid
   JOIN pg_class c ON c.oid=pol.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   JOIN pg_proc f ON d.refclassid='pg_proc'::regclass AND d.refobjid=f.oid
   WHERE f.oid=to_regprocedure('private.is_town_member(uuid)')
 ),
 'private_schema_usage',jsonb_build_object(
   'anon',has_schema_privilege('anon','private','USAGE'),
   'authenticated',has_schema_privilege('authenticated','private','USAGE'),
   'service_role',has_schema_privilege('service_role','private','USAGE')
 ),
 'storage_buckets',(
   SELECT coalesce(jsonb_agg(jsonb_build_object('id',b.id,'public',b.public,
     'file_size_limit',b.file_size_limit,'allowed_mime_types',b.allowed_mime_types) ORDER BY b.id),'[]'::jsonb)
   FROM storage.buckets b
 ),
 'legacy_chat_attachments_aggregate',(
   SELECT jsonb_build_object('objects',count(o.id),'bytes',coalesce(sum(
     CASE WHEN o.metadata->>'size' ~ '^[0-9]{1,18}$' THEN (o.metadata->>'size')::bigint ELSE 0 END),0))
   FROM storage.objects o WHERE o.bucket_id='chat_attachments'
 ),
 'migration_registry_present',to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
) AS catalogue_supplement;
ROLLBACK;
