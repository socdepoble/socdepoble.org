-- R31 ADD118 · Contracte vigent SECURITY DEFINER amb search_path buit.
-- Additiva: aplicar després del catàleg complet117 i 20261116031000.
-- No modifica bytes històrics, propietaris, signatures, OID, grants ni RLS.
-- 29 funcions vigents auditades: 27 conserven el cos; dues qualifiquen pg_catalog.
-- Els paths públics explícits anteriors no es declaren 29 exploits demostrats.
-- Preconditions: hash de cos auditat o postimatge idempotent; deriva desconeguda falla tancada.
-- Remot NO executat per l'agent. Marxa enrere: restaurar definicions/configuració
-- capturades abans de migrar en una sessió de manteniment autoritzada, mai reaplicar
-- a cegues migracions històriques que també canvien altres contractes.
-- Depén de: 20261116031000 (catàleg complet117, aplicat abans d'esta migració).
-- Després (lectura):
-- select n.nspname,p.proname,p.proconfig from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname in ('public','private') and not coalesce(p.proconfig @> array['search_path=""']::text[],false) and not coalesce(p.proconfig @> array['search_path=']::text[],false);
-- Resultat esperat: zero files; l'absència d'una signatura la refusa el preflight.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $r31_preflight$
declare x record; p record; h text;
begin
  for x in select * from (values
    ('private.mur_anti_resurreccio()','7df9f8a0ecf27dc15bc59eb7949987e1e91d70cc6c30e24d1e538199d5704010','0cda40336086736d8472d8a349199cac6dfb72e4b16b3b2bae00d23534492371'),
    ('private.pot_editar_revisio_patrimoni(uuid,uuid)','01b8e8d21d68e83a54bd2cb14165af45e04d236ae81f45e8979075aa93acbf7e','01b8e8d21d68e83a54bd2cb14165af45e04d236ae81f45e8979075aa93acbf7e'),
    ('private.xat_e2ee_abast(uuid)','d176e283939bfe8005d5ef528ba0f2226844fa162877df585cc32ca303deeeed','d176e283939bfe8005d5ef528ba0f2226844fa162877df585cc32ca303deeeed'),
    ('private.xat_e2ee_bloqueja(uuid)','25e95179b01c3a0a4404ae7ce6a8ba91de856ea0a6f07c74da9779caef0e7a99','25e95179b01c3a0a4404ae7ce6a8ba91de856ea0a6f07c74da9779caef0e7a99'),
    ('private.xat_e2ee_exigix(uuid)','eed806031ea7523a906dff78862f9b292cde22facd34d90b7aad89c08bc547ec','eed806031ea7523a906dff78862f9b292cde22facd34d90b7aad89c08bc547ec'),
    ('private.xat_e2ee_immutable()','a152737932539315ecb177e2e78d3d666a0829d3f632377b851fcdd8b58cbb41','a152737932539315ecb177e2e78d3d666a0829d3f632377b851fcdd8b58cbb41'),
    ('private.xat_e2ee_json_missatge(uuid)','534a8d9aadcf90aa49673c971472646c845c7e3e8e242d7cbfd35ad7a3a7345c','534a8d9aadcf90aa49673c971472646c845c7e3e8e242d7cbfd35ad7a3a7345c'),
    ('private.xat_e2ee_permes(uuid)','f82a8851aee80dd01833b864834538404b22287abd10f7b26e04a7761e96404c','f82a8851aee80dd01833b864834538404b22287abd10f7b26e04a7761e96404c'),
    ('private.xat_epoca_vigent_valida(uuid,integer)','d7c85c55a0b7e604c6203c5884b4cf7ee0f3ab0efbb46939b0a29e78fb1900bb','d7c85c55a0b7e604c6203c5884b4cf7ee0f3ab0efbb46939b0a29e78fb1900bb'),
    ('private.xat_escriptura_final()','cebc8798a01c6bc01351ad29e0d3dfffdefd165ee9149cc0bc9183fa211a9b8c','cebc8798a01c6bc01351ad29e0d3dfffdefd165ee9149cc0bc9183fa211a9b8c'),
    ('private.xat_fils_e2ee_apegalos()','0e4d4658be332516da746b7adc1cbdfea285cb83d9f90488185ac6ed34adddc0','0e4d4658be332516da746b7adc1cbdfea285cb83d9f90488185ac6ed34adddc0'),
    ('private.xat_llegible_adjunt(text)','e44f3a296edc49c4f21bb35b89a1ebf0271d52177bb139efa83b3f8fab400b3c','e44f3a296edc49c4f21bb35b89a1ebf0271d52177bb139efa83b3f8fab400b3c'),
    ('private.xat_lot3_b64(text,integer)','8ab25aed413f25398825f7e0f4fe2824e98170a5093f4deec0db00a670a5d4da','8ab25aed413f25398825f7e0f4fe2824e98170a5093f4deec0db00a670a5d4da'),
    ('private.xat_missatges_e2ee()','7ac6e5b80831a1f6838d2e28e4268944166e983b16ed18189059b612aab87ebb','7ac6e5b80831a1f6838d2e28e4268944166e983b16ed18189059b612aab87ebb'),
    ('private.xat_obri_epoca_intern(uuid,uuid,jsonb)','0a5137eba77691468c433b283d76bf87338e60bf3638e03990a48cc558372c6e','0a5137eba77691468c433b283d76bf87338e60bf3638e03990a48cc558372c6e'),
    ('private.xat_sobre_format_v1_valid(jsonb)','7a170e9ff8d5da89492339ea28c9724769e038190510f1e516f2aff5678201a5','7a170e9ff8d5da89492339ea28c9724769e038190510f1e516f2aff5678201a5'),
    ('public.xat_demana_xifrat(uuid)','1ff359ba80be444912f4757274eb944549c656cb75196c09fe03c7d4c9d7618b','1ff359ba80be444912f4757274eb944549c656cb75196c09fe03c7d4c9d7618b'),
    ('public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb)','fece66d91d632e65491506236bbd3071260460002a8c8772f4f48765ea594924','fece66d91d632e65491506236bbd3071260460002a8c8772f4f48765ea594924'),
    ('public.xat_epoques_del_fil(uuid,integer)','aaaa553835709f15bdca9a268e18f48673e06ef857e4601902e8f90ab8a5b982','aaaa553835709f15bdca9a268e18f48673e06ef857e4601902e8f90ab8a5b982'),
    ('public.xat_estat_xifrat(uuid[])','bbd4b3e92bf694dec65baa9b837f8e3d0bf69b1ddf8d9cecce395511c034a2c1','bbd4b3e92bf694dec65baa9b837f8e3d0bf69b1ddf8d9cecce395511c034a2c1'),
    ('public.xat_historial(uuid,bigint,integer)','607f23b542b1c37e06ced224d91d9266d42ea9c9976d63cd5e084400c7deb4f6','607f23b542b1c37e06ced224d91d9266d42ea9c9976d63cd5e084400c7deb4f6'),
    ('public.xat_meus_sobres(uuid,integer[])','71b4f80408bc292cad6b440e54cf6be055d8c49922690a0e27b37fe0c2c46c76','71b4f80408bc292cad6b440e54cf6be055d8c49922690a0e27b37fe0c2c46c76'),
    ('public.xat_nous(uuid,bigint,integer)','32b355f48eec16251bd9d6685cbb31b35aacc16a5dc233c2d7e01d5a1daef2e2','32b355f48eec16251bd9d6685cbb31b35aacc16a5dc233c2d7e01d5a1daef2e2'),
    ('public.xat_obri_epoca(uuid,jsonb)','dacae635536e34d9ed7660e1e2f0e0dba00820a3d88976127dae47b841adc9df','dacae635536e34d9ed7660e1e2f0e0dba00820a3d88976127dae47b841adc9df'),
    ('public.xat_publica_adjunt(uuid,text,uuid)','28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb','28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb'),
    ('public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb)','970cd280503e74e3a52e50640149b6ab8b1ea95cc5a998ebf9bce80866d41536','970cd280503e74e3a52e50640149b6ab8b1ea95cc5a998ebf9bce80866d41536'),
    ('public.xat_reembolcalla(uuid,jsonb)','fb7c14059e1284f4cb024ec22a31d88f6db71aff3e89191b0834284a72b94b0f','fb7c14059e1284f4cb024ec22a31d88f6db71aff3e89191b0834284a72b94b0f'),
    ('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)','17241d05975614f723170fd52d15da2676db495996c7a7ab40097326b00b5d4f','17241d05975614f723170fd52d15da2676db495996c7a7ab40097326b00b5d4f'),
    ('public.xat_verifica_prerequisits_e2ee()','dc70d38723301d36c35f3ab897c97f6508088ccd8909170fa14489086ae28a3b','6e28edcd7e96fdec2ed623fef973ed2a182d2ac31ee5e131c2116412d177f915')
  ) as auditada(sig,pre_hash,post_hash) loop
    select f.prosrc,f.prosecdef,f.prokind into p from pg_catalog.pg_proc f
      where f.oid=pg_catalog.to_regprocedure(x.sig);
    if not found or not p.prosecdef or p.prokind<>'f' then
      raise exception 'SDP-R31-DEFINER-DEPENDENCY: falta funció vigent auditada %.',x.sig using errcode='55000';
    end if;
    h:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex');
    if h<>x.pre_hash and h<>x.post_hash then
      raise exception 'SDP-R31-DEFINER-DRIFT: cos divergent %.',x.sig using errcode='55000';
    end if;
  end loop;
end;
$r31_preflight$;

CREATE OR REPLACE FUNCTION private.mur_anti_resurreccio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if ((tg_op='INSERT' and (new.moderation_state is distinct from 'visible' or new.deleted_at is not null))
    or (tg_op='UPDATE' and (new.moderation_state is distinct from old.moderation_state or new.deleted_at is distinct from old.deleted_at)))
    and not (current_setting('role',true) in ('service_role','postgres')
      or (current_setting('role',true)='none' and exists(select 1 from pg_catalog.pg_roles r where r.rolname=session_user and r.rolsuper))
      or (coalesce(private.es_superadmin(),false) and private.copub_compte_actiu(auth.uid()))) then
    raise exception using errcode='42501',message='SDP-MUR-MODERATION: camps de servidor; cal superadmin actiu amb aal2.';
  end if;
  if tg_op='UPDATE' and (new.id is distinct from old.id or new.tenant_id is distinct from old.tenant_id) then
    raise exception using errcode='23514',message='SDP-MUR-IDENTITY: UUID i poble són immutables.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||new.id::text,0));
  if exists(select 1 from private.mur_publicacions_revocades r where r.submission_id=new.id) then
    raise exception using errcode='23514',message='SDP-MUR-REVOKED: UUID retirat definitivament; publica amb un UUID nou.';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.xat_verifica_prerequisits_e2ee()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE t text; v record; f text[]:=ARRAY[]::text[]; v_oid oid;
BEGIN
  FOREACH t IN ARRAY ARRAY['public.xat_fils','public.xat_participants','public.xat_missatges','public.xat_adjunts','public.xat_claus_usuari','public.xat_llibretes','public.xat_cercles_recuperacio','public.xat_avals_recuperacio','public.xat_peticions_recuperacio','public.xat_verificacions_recuperacio','public.xat_alliberaments_recuperacio','public.xat_epoques','public.xat_epoques_membres','public.xat_claus_fil','public.xat_reembolcalls','private.xat_cohort_e2ee','private.xat_configuracio_e2ee','private.xat_origens_xifrat','private.xat_ritme_claus','storage.objects']::text[] LOOP
    IF NOT coalesce((SELECT c.relrowsecurity FROM pg_catalog.pg_class c WHERE c.oid=to_regclass(t)),false) THEN f:=array_append(f,'taula_o_rls:'||t); END IF;
  END LOOP;
  FOR v IN SELECT * FROM (VALUES ('public.xat_publica_identitat(text,text,text,text,jsonb)',ARRAY['p_kid_anterior','p_declaracio','p_autofirma','p_firma_continuitat','p_copia']::text[]),('public.xat_la_meua_identitat()',ARRAY[]::text[]),('public.xat_desa_frase(text,jsonb)',ARRAY['p_kid','p_frase']::text[]),('public.xat_claus_de(uuid[])',ARRAY['p_usuaris']::text[]),('public.xat_desa_llibreta(bigint,jsonb)',ARRAY['p_comptador','p_llibreta']::text[]),('public.xat_la_meua_llibreta()',ARRAY[]::text[]),('public.xat_canvia_rk(text,text,jsonb,jsonb)',ARRAY['p_kid','p_hash_copia','p_copia','p_llibreta']::text[]),('public.xat_estat_xifrat(uuid[])',ARRAY['p_fils']::text[]),('public.xat_epoques_del_fil(uuid,integer)',ARRAY['p_fil_id','p_des_de']::text[]),('public.xat_meus_sobres(uuid,integer[])',ARRAY['p_fil_id','p_epoques']::text[]),('public.xat_obri_epoca(uuid,jsonb)',ARRAY['p_fil_id','p_epoca_nova']::text[]),('public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb)',ARRAY['p_id','p_fil_id','p_resposta_a','p_xifrat','p_epoca_nova']::text[]),('public.xat_reembolcalla(uuid,jsonb)',ARRAY['p_fil_id','p_items']::text[]),('public.xat_demana_xifrat(uuid)',ARRAY['p_fil_id']::text[]),('public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb)',ARRAY['p_id','p_resposta_a','p_xifrat','p_epoca_nova']::text[]),('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)',ARRAY['p_id','p_fil_id','p_bytes','p_mime','p_durada_ms']::text[]),('public.xat_cancella_reserva(uuid)',ARRAY['p_id']::text[]),('public.xat_llegix_adjunt(uuid)',ARRAY['p_id']::text[]),('public.xat_historial(uuid,bigint,integer)',ARRAY['p_fil_id','p_abans_de_seq','p_limit']::text[]),('public.xat_nous(uuid,bigint,integer)',ARRAY['p_fil_id','p_despres_de_seq','p_limit']::text[]),('public.xat_fils_meus(uuid)',ARRAY['p_tenant_id']::text[])) AS x(sig,noms) LOOP
    v_oid:=to_regprocedure(v.sig);
    IF v_oid IS NULL THEN f:=array_append(f,'rpc:'||v.sig);
    ELSE
      IF has_function_privilege('anon',v_oid,'EXECUTE') OR NOT has_function_privilege('authenticated',v_oid,'EXECUTE') THEN f:=array_append(f,'acl:'||v.sig); END IF;
      IF coalesce((SELECT p.proargnames[1:p.pronargs] FROM pg_catalog.pg_proc p WHERE p.oid=v_oid),ARRAY[]::text[]) IS DISTINCT FROM v.noms THEN f:=array_append(f,'parametres:'||v.sig); END IF;
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['private.xat_e2ee_exigix(uuid)','private.xat_e2ee_abast(uuid)','private.xat_obri_epoca_intern(uuid,uuid,jsonb)','public.xat_obri_epoca(uuid,jsonb)','public.xat_estat_xifrat(uuid[])','public.xat_epoques_del_fil(uuid,integer)','public.xat_meus_sobres(uuid,integer[])','public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb)','public.xat_reembolcalla(uuid,jsonb)','public.xat_demana_xifrat(uuid)','private.xat_e2ee_permes(uuid)','private.xat_epoca_vigent_valida(uuid,integer)','private.xat_e2ee_bloqueja(uuid)','private.xat_e2ee_json_missatge(uuid)','public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)','public.xat_publica_adjunt(uuid,text,uuid)','private.xat_escriptura_final()','private.xat_llegible_adjunt(text)','public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb)','private.xat_missatges_e2ee()','private.xat_fils_e2ee_apegalos()','private.xat_e2ee_immutable()','public.xat_historial(uuid,bigint,integer)','public.xat_nous(uuid,bigint,integer)','public.xat_fils_meus(uuid)']::text[] LOOP
    IF NOT coalesce((SELECT p.prosecdef AND p.proconfig @> ARRAY['search_path=""'] FROM pg_catalog.pg_proc p WHERE p.oid=to_regprocedure(t)),false) THEN f:=array_append(f,'definer_path:'||t); END IF;
  END LOOP;
  FOR v IN SELECT * FROM (VALUES
    ('public.xat_missatges','xat_missatges_e2ee'),('public.xat_fils','xat_fils_e2ee_apegalos'),
    ('public.xat_missatges','xat_missatges_seq'),('public.xat_missatges','trg_rate_limit_xat'),
    ('public.xat_missatges','xat_missatges_exigix_normes'),('storage.objects','xat_escriptura_final')) AS x(taula,nom)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_trigger tr WHERE tr.tgrelid=to_regclass(v.taula) AND tr.tgname=v.nom AND tr.tgenabled='O') THEN f:=array_append(f,'trigger:'||v.nom); END IF;
  END LOOP;
  FOR v IN SELECT * FROM (VALUES ('public.xat_missatges','xifrat','jsonb'),('public.xat_missatges','resposta_a_xifrada','uuid'),
    ('public.xat_fils','epoca_actual','integer'),('public.xat_fils','cap_epoca_hash','text'),('public.xat_fils','e2ee_des_de_seq','bigint'),('public.xat_adjunts','xifrat','boolean')) AS x(taula,columna,tipus)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute a WHERE a.attrelid=to_regclass(v.taula) AND a.attname=v.columna AND NOT a.attisdropped AND a.atttypid=to_regtype(v.tipus)) THEN f:=array_append(f,'columna:'||v.taula||'.'||v.columna); END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['public.xat_epoques','public.xat_epoques_membres','public.xat_claus_fil','public.xat_reembolcalls'] LOOP
    IF has_table_privilege('anon',t,'SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated',t,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN f:=array_append(f,'privilegis_taula:'||t); END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_policies p WHERE p.schemaname='public'
    AND p.tablename IN ('xat_epoques','xat_epoques_membres','xat_claus_fil','xat_reembolcalls')
    AND (p.tablename,p.policyname) NOT IN (('xat_epoques','xat_epoques_lectura_lot3'),('xat_epoques_membres','xat_epoques_membres_lectura_lot3'),('xat_claus_fil','xat_sobres_propis_lot3'),('xat_reembolcalls','xat_reembolcalls_propis_lot3'))) THEN
    f:=array_append(f,'politiques_desconegudes');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.buckets b WHERE b.id='xat_adjunts' AND NOT b.public AND b.file_size_limit=20000000 AND 'application/octet-stream'=ANY(b.allowed_mime_types)) THEN f:=array_append(f,'bucket'); END IF;
  IF has_schema_privilege('authenticated','public','CREATE') OR has_schema_privilege('anon','public','CREATE') THEN f:=array_append(f,'schema_public_no_fiable'); END IF;
  RETURN jsonb_build_object('contracte','sdp-xat-v1','preparat_sql',cardinality(f)=0,'faltants',to_jsonb(f),
    'general',(SELECT general FROM private.xat_configuracio_e2ee WHERE id),'flag_client_modificat',false,
    'entitats_habilitades',false,'grups_requerixen_alineacio_client',true,'requereix_ordre_del_mestre',true);
END $function$
;

-- Reitera la revocació ja vigent; CREATE OR REPLACE no concedix privilegis nous.
revoke all on function private.mur_anti_resurreccio() from public, anon, authenticated;

-- ALTER preserva cos, descriptors, propietari i ACL; dependències de negoci ja qualificades.
alter function private.pot_editar_revisio_patrimoni(uuid,uuid) set search_path = '';
alter function private.xat_e2ee_abast(uuid) set search_path = '';
alter function private.xat_e2ee_bloqueja(uuid) set search_path = '';
alter function private.xat_e2ee_exigix(uuid) set search_path = '';
alter function private.xat_e2ee_immutable() set search_path = '';
alter function private.xat_e2ee_json_missatge(uuid) set search_path = '';
alter function private.xat_e2ee_permes(uuid) set search_path = '';
alter function private.xat_epoca_vigent_valida(uuid,integer) set search_path = '';
alter function private.xat_escriptura_final() set search_path = '';
alter function private.xat_fils_e2ee_apegalos() set search_path = '';
alter function private.xat_llegible_adjunt(text) set search_path = '';
alter function private.xat_lot3_b64(text,integer) set search_path = '';
alter function private.xat_missatges_e2ee() set search_path = '';
alter function private.xat_obri_epoca_intern(uuid,uuid,jsonb) set search_path = '';
alter function private.xat_sobre_format_v1_valid(jsonb) set search_path = '';
alter function public.xat_demana_xifrat(uuid) set search_path = '';
alter function public.xat_envia_xifrat(uuid,uuid,uuid,jsonb,jsonb) set search_path = '';
alter function public.xat_epoques_del_fil(uuid,integer) set search_path = '';
alter function public.xat_estat_xifrat(uuid[]) set search_path = '';
alter function public.xat_historial(uuid,bigint,integer) set search_path = '';
alter function public.xat_meus_sobres(uuid,integer[]) set search_path = '';
alter function public.xat_nous(uuid,bigint,integer) set search_path = '';
alter function public.xat_obri_epoca(uuid,jsonb) set search_path = '';
alter function public.xat_publica_adjunt(uuid,text,uuid) set search_path = '';
alter function public.xat_publica_adjunt_xifrat(uuid,uuid,jsonb,jsonb) set search_path = '';
alter function public.xat_reembolcalla(uuid,jsonb) set search_path = '';
alter function public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer) set search_path = '';

commit;
