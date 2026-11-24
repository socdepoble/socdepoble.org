-- C12 / R32.72 · pendent de desplegar; depén de la cadena reconciliada 133.
-- Depén de: 20261123233000.
-- RESTRICTIVE per a anon: una permissiva antiga no pot enumerar profiles.
-- No canvia bucket.public, bytes, noms, propietaris, URLs ni polítiques prèvies.
-- EXECUTE mínim: no es retira USAGE private ni l'EXECUTE authenticated de
-- is_town_member que requerixen les polítiques RLS. Les RPC públiques legítimes
-- queden intactes. Funcions trigger no necessiten EXECUTE del rol de l'escriptor.
-- Les empremtes són del HEAD local verificat: el JSON de producció NO té prosrc.
-- Un cos/configuració desconegut refusa la migració; cal la sonda complementària.
-- Abans (lectura): select p.oid::regprocedure::text,encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),p.proconfig,p.proacl from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('private.is_town_member(uuid)');
-- Verificació posterior (lectura): select policyname,permissive,roles,qual from pg_catalog.pg_policies where schemaname='storage' and tablename='objects' and policyname='r3272 profiles sense llista anon';
-- Verificació posterior (lectura): select has_function_privilege('anon','private.is_town_member(uuid)','EXECUTE') as anon_execute,has_function_privilege('authenticated','private.is_town_member(uuid)','EXECUTE') as authenticated_execute;
BEGIN;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='30s';
DO $r3272$
DECLARE spec record; fn record; policy record;
BEGIN
 IF NOT pg_try_advisory_xact_lock(3272,134) THEN
   RAISE EXCEPTION USING ERRCODE='55P03',MESSAGE='r3272_hygiene_already_running';
 END IF;
 IF NOT EXISTS(SELECT FROM pg_class WHERE oid=to_regclass('storage.objects') AND relrowsecurity) THEN
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3272_storage_rls_required';
 END IF;
 IF NOT EXISTS(SELECT FROM pg_attribute a WHERE a.attrelid='storage.objects'::regclass
   AND a.attname='bucket_id' AND a.attnum>0 AND NOT a.attisdropped AND a.atttypid='text'::regtype) THEN
   -- Una variant varchar/domain canvia els casts de pg_get_expr: no s'admet
   -- una primera aplicació que després es refusaria com a col·lisió.
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3272_storage_bucket_shape';
 END IF;
 -- Preflight complet abans de qualsevol canvi de política o privilegi.
 FOR spec IN SELECT * FROM (VALUES
   ('private.comprova_una_propietaria()','trigger','v','ce2b0844ccb7e77c629520493e0c1ca3a416fec06523212649a8d936ed53c82c'),
   ('private.is_town_member(uuid)','boolean','s','40f37baa53e0afd3d7f4273b2521d72180ff573df9405dc33961337ecc9877f9'),
   ('private.trigger_rate_limit_xat()','trigger','v','f2ef75ee1621ed707a07c1aa52885cc683f1445618dbd82d960d72bf634a138b'),
   ('public.touch_updated_at()','trigger','v','3c6d6c41d6262a20e7c102dbd49bb3383bd86a4138c8a3ab6b9b04a1ec2420a5')
 ) AS source(signature,result,volatility,body_sha256) LOOP
   SELECT p.* INTO fn FROM pg_proc p WHERE p.oid=to_regprocedure(spec.signature);
   IF NOT FOUND OR NOT fn.prosecdef OR fn.prorettype::regtype::text<>spec.result
     OR fn.provolatile::text<>spec.volatility OR fn.proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[]
     OR encode(sha256(convert_to(fn.prosrc,'UTF8')),'hex')<>spec.body_sha256 THEN
     RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3272_hygiene_function_drift';
   END IF;
 END LOOP;
 IF NOT has_function_privilege('authenticated','private.is_town_member(uuid)','EXECUTE') THEN
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3272_required_rls_execute_missing';
 END IF;
 SELECT p.* INTO policy FROM pg_policy p WHERE p.polrelid='storage.objects'::regclass
   AND p.polname='r3272 profiles sense llista anon';
 IF FOUND THEN
   IF policy.polcmd<>'r' OR policy.polpermissive OR policy.polroles<>ARRAY['anon'::regrole::oid]
     OR policy.polwithcheck IS NOT NULL
     OR pg_get_expr(policy.polqual,policy.polrelid) IS DISTINCT FROM '(bucket_id <> ''profiles''::text)' THEN
     RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3272_profiles_policy_collision';
   END IF;
 ELSE
   EXECUTE 'CREATE POLICY "r3272 profiles sense llista anon" ON storage.objects AS RESTRICTIVE FOR SELECT TO anon USING (bucket_id <> ''profiles'')';
 END IF;
 REVOKE EXECUTE ON FUNCTION private.comprova_una_propietaria(),private.is_town_member(uuid),
   private.trigger_rate_limit_xat(),public.touch_updated_at() FROM PUBLIC,anon;
 -- No concedir permisos nous per emmascarar una preimatge desconeguda.
 IF NOT has_function_privilege('authenticated','private.is_town_member(uuid)','EXECUTE')
   OR EXISTS(SELECT FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
     WHERE p.oid=ANY(ARRAY['private.comprova_una_propietaria()'::regprocedure::oid,
       'private.is_town_member(uuid)'::regprocedure::oid,'private.trigger_rate_limit_xat()'::regprocedure::oid,
       'public.touch_updated_at()'::regprocedure::oid]) AND a.grantee=0 AND a.privilege_type='EXECUTE')
   OR has_function_privilege('anon','private.comprova_una_propietaria()','EXECUTE')
   OR has_function_privilege('anon','private.is_town_member(uuid)','EXECUTE')
   OR has_function_privilege('anon','private.trigger_rate_limit_xat()','EXECUTE')
   OR has_function_privilege('anon','public.touch_updated_at()','EXECUTE') THEN
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3272_execute_postcondition_failed';
 END IF;
END
$r3272$;
NOTIFY pgrst,'reload schema';
COMMIT;
