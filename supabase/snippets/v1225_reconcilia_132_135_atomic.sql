-- C4/v1.2.25: 132 + 135 pendents, un únic COMMIT. No aplicar sense sonda.
-- Depén de: 20261124033000
-- No registra 132/135 com aplicades: l'operador reconcilia el seu registre després del COMMIT.
BEGIN;
SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='120s';

SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='1s';
SET LOCAL statement_timeout='120s';
DO $r3254_guard$
BEGIN
  IF NOT pg_try_advisory_xact_lock(3254,132) THEN
    RAISE EXCEPTION USING ERRCODE='55P03',MESSAGE='r3254_migration132_already_running';
  END IF;
END
$r3254_guard$;
LOCK TABLE "private"."admin_accions" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."admin_invitacions" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."ajuntament_auditoria" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."ajuntament_dominis_oficials" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."aparadors_sync_events" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."aparadors_sync_sources" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."connexions_preferencies" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."connexions_sollicituds" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."connexions_vincles" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."lssi_revisions" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."municipi_opendata_documents" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."mur_actes_notes" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."mur_bloquejos_opacs" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."mur_operacions_notes" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."mur_publicacions_revocades" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."mur_revocacions_notes" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."publicacio_traspassos" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."publicacions_beta_cas_rebuts" IN SHARE MODE NOWAIT;
DO $r3272_lock$ BEGIN IF to_regclass('private.publicacions_cas_rebuts') IS NOT NULL THEN LOCK TABLE "private"."publicacions_cas_rebuts" IN SHARE MODE NOWAIT; END IF; END $r3272_lock$;
DO $r3272_lock$ BEGIN IF to_regclass('private.r3213_crdt_captures') IS NOT NULL THEN LOCK TABLE "private"."r3213_crdt_captures" IN SHARE MODE NOWAIT; END IF; END $r3272_lock$;
DO $r3272_lock$ BEGIN IF to_regclass('private.r3213_crdt_dots') IS NOT NULL THEN LOCK TABLE "private"."r3213_crdt_dots" IN SHARE MODE NOWAIT; END IF; END $r3272_lock$;
DO $r3272_lock$ BEGIN IF to_regclass('private.r3213_lssi_audit') IS NOT NULL THEN LOCK TABLE "private"."r3213_lssi_audit" IN SHARE MODE NOWAIT; END IF; END $r3272_lock$;
DO $r3272_lock$ BEGIN IF to_regclass('private.r3213_lssi_rebuts') IS NOT NULL THEN LOCK TABLE "private"."r3213_lssi_rebuts" IN SHARE MODE NOWAIT; END IF; END $r3272_lock$;
LOCK TABLE "private"."r3244_edicio_contract" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."xat_iaia_binding" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."xat_iaia_jobs" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."xat_iaia_principals" IN SHARE MODE NOWAIT;
LOCK TABLE "private"."xat_presencia" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."aportacions_culturals" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."app_content_historial" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."bloquejos" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."consentiments" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."denuncies" IN SHARE MODE NOWAIT;
DO $r3272_lock$ BEGIN IF to_regclass('public.inventari_brain_node0') IS NOT NULL THEN LOCK TABLE "public"."inventari_brain_node0" IN SHARE MODE NOWAIT; END IF; END $r3272_lock$;
LOCK TABLE "public"."note_folders" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."notes" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."organization_claims" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."organization_member_organizations" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."organization_memberships" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."organizations" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."page_revisions" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."seed_revisions" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."seguiments" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."user_platform_roles" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_alliberaments_recuperacio" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_avals_recuperacio" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_fils" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_missatges" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_missatges_fixats" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_participants" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_reaccions" IN SHARE MODE NOWAIT;
LOCK TABLE "public"."xat_verificacions_recuperacio" IN SHARE MODE NOWAIT;
SELECT id FROM private.r3244_edicio_contract WHERE id=1 FOR UPDATE NOWAIT;

SET LOCAL search_path=pg_catalog,public;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
DO $r3252$
DECLARE expected record; target record; existing oid; attrs text;
 before_snapshot jsonb; after_snapshot jsonb; normalized_snapshot jsonb;
 created_definitions jsonb:='[]'::jsonb; created_definition text; changed integer;
BEGIN
 -- El productor del rebut també ha de ser el canònic: una funció falsejada
 -- que retornara el rebut vell no pot acreditar-se a si mateixa.
 IF (SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') FROM pg_proc p
     WHERE p.oid=to_regprocedure('private.r3244_edicio_snapshot()'))
    IS DISTINCT FROM 'dfd4af7e5d14168db57fcd18990bbec7e75c191c8e65736c6820ad94f758369e' THEN
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3252_r3244_snapshot_function_drift';
 END IF;
 -- El contracte R32.44 inclou els índexs de dos taules. Mai absorbir deriva.
 SELECT snapshot INTO before_snapshot FROM private.r3244_edicio_contract WHERE id=1 FOR UPDATE;
 IF NOT FOUND OR before_snapshot IS DISTINCT FROM private.r3244_edicio_snapshot() THEN
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3252_r3244_preimage_drift';
 END IF;
 FOR expected IN WITH canonical(schema_name,table_name,constraint_name,definition,index_name) AS (VALUES
   ('public','xat_alliberaments_recuperacio','xat_alliberaments_recuperacio_peticio_id_amic_id_intent_fkey','FOREIGN KEY (peticio_id, amic_id, intent) REFERENCES xat_verificacions_recuperacio(peticio_id, amic_id, intent)','r3252_fk_fc709a4514b1be9d9d6c'),
   ('private','admin_invitacions','admin_invitacions_tenant_id_organitzacio_fkey','FOREIGN KEY (tenant_id, organitzacio) REFERENCES organizations(tenant_id, id) ON DELETE CASCADE','r3252_fk_40a2dac9adfde307327a'),
   ('private','aparadors_sync_events','aparadors_sync_events_source_id_external_product_id_fkey','FOREIGN KEY (source_id, external_product_id) REFERENCES private.aparadors_sync_products(source_id, external_product_id) ON DELETE CASCADE','r3252_fk_b44b298d74acb697232d'),
   ('public','organization_claims','organization_claims_tenant_id_organization_id_fkey','FOREIGN KEY (tenant_id, organization_id) REFERENCES organizations(tenant_id, id) ON DELETE CASCADE','r3252_fk_ca9ef27f1cb3ebfce0ea'),
   ('public','organization_member_organizations','organization_member_organizations_organitzacio_fkey','FOREIGN KEY (tenant_id, organization_id) REFERENCES organizations(tenant_id, id) ON DELETE CASCADE','r3252_fk_7f47e6f32257e5b26ac5'),
   ('public','organization_memberships','organization_memberships_tenant_id_organization_id_fkey','FOREIGN KEY (tenant_id, organization_id) REFERENCES organizations(tenant_id, id) ON DELETE CASCADE','r3252_fk_28ca8ef77cb3d708c1fa'),
   ('public','organizations','organizations_tenant_id_parent_organization_id_fkey','FOREIGN KEY (tenant_id, parent_organization_id) REFERENCES organizations(tenant_id, id) ON DELETE RESTRICT','r3252_fk_627977cafe1fd7a881be'),
   ('private','admin_accions','admin_accions_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES towns(id)','r3252_fk_e7bc65d2d8d9a764c7cc'),
   ('private','admin_invitacions','admin_invitacions_creada_per_fkey','FOREIGN KEY (creada_per) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_fbe7187dc5fa73cb64e4'),
   ('private','admin_invitacions','admin_invitacions_persona_fkey','FOREIGN KEY (persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_49bfcefe85083c5874a6'),
   ('private','admin_invitacions','admin_invitacions_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES towns(id)','r3252_fk_83ff0ab7b5bfed8a49a4'),
   ('private','ajuntament_auditoria','ajuntament_auditoria_actor_id_fkey','FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_e5627895b3955200b3cd'),
   ('private','ajuntament_auditoria','ajuntament_auditoria_claim_id_fkey','FOREIGN KEY (claim_id) REFERENCES organization_claims(id) ON DELETE SET NULL','r3252_fk_e51dc854a409b7e9ae1d'),
   ('private','ajuntament_auditoria','ajuntament_auditoria_organization_id_fkey','FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE','r3252_fk_f904448fc9c8036ddf6c'),
   ('private','ajuntament_dominis_oficials','ajuntament_dominis_oficials_verificat_per_fkey','FOREIGN KEY (verificat_per) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_3da5d039099e38debfd1'),
   ('private','aparadors_sync_events','aparadors_sync_events_source_id_fkey','FOREIGN KEY (source_id) REFERENCES private.aparadors_sync_sources(id) ON DELETE CASCADE','r3252_fk_3e5657444f9c6ee0ae13'),
   ('private','aparadors_sync_sources','aparadors_sync_sources_owner_user_id_fkey','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_5e099a159e80afb2e8fd'),
   ('private','connexions_preferencies','connexions_preferencies_entitat_fkey','FOREIGN KEY (entitat) REFERENCES organizations(id) ON DELETE CASCADE','r3252_fk_a7aabed78180fd7b8d2e'),
   ('private','connexions_preferencies','connexions_preferencies_persona_fkey','FOREIGN KEY (persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_2c0e85e7674cfd02de5c'),
   ('private','connexions_preferencies','connexions_preferencies_poble_fkey','FOREIGN KEY (poble) REFERENCES towns(id) ON DELETE CASCADE','r3252_fk_898e490cab61d00f9465'),
   ('private','connexions_sollicituds','connexions_sollicituds_persona_fkey','FOREIGN KEY (persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_143d5a160bb417e29072'),
   ('private','connexions_vincles','connexions_vincles_entitat_fkey','FOREIGN KEY (entitat) REFERENCES organizations(id) ON DELETE CASCADE','r3252_fk_7b869adec09e3cd3bee5'),
   ('private','connexions_vincles','connexions_vincles_persona_fkey','FOREIGN KEY (persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_fa7697d6daa164ab3f3e'),
   ('private','connexions_vincles','connexions_vincles_poble_fkey','FOREIGN KEY (poble) REFERENCES towns(id) ON DELETE CASCADE','r3252_fk_682b303766f19fd44e7c'),
   ('private','lssi_revisions','lssi_revisions_revisor_fkey','FOREIGN KEY (revisor) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_35f48f116cbe678fb813'),
   ('private','municipi_opendata_documents','municipi_opendata_documents_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES private.municipi_opendata(tenant_id) ON DELETE CASCADE','r3252_fk_53d9ddc5b1bf4279f7f4'),
   ('private','mur_actes_notes','mur_actes_notes_note_id_fkey','FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL','r3252_fk_f0eddbfe722e928d89df'),
   ('private','mur_actes_notes','mur_actes_notes_owner_user_id_fkey','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_cba66344e0d3d179150b'),
   ('private','mur_bloquejos_opacs','mur_bloquejos_opacs_bloquejat_entitat_fkey','FOREIGN KEY (bloquejat_entitat) REFERENCES organizations(id) ON DELETE CASCADE','r3252_fk_8b3010b49049ecc44e67'),
   ('private','mur_bloquejos_opacs','mur_bloquejos_opacs_bloquejat_persona_fkey','FOREIGN KEY (bloquejat_persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_d4a265da5eaf38c652b1'),
   ('private','mur_operacions_notes','mur_operacions_notes_note_id_fkey','FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL','r3252_fk_e4295d6559124ad639a9'),
   ('private','mur_operacions_notes','mur_operacions_notes_owner_user_id_fkey','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_d3da5ef667340a37f5c6'),
   ('private','mur_publicacions_revocades','mur_revocades_owner_fk','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_c0d06fff7ed87bf7fa5b'),
   ('private','mur_revocacions_notes','mur_notes_owner_fk','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_b0337fbe7cbec89024d2'),
   ('private','publicacio_traspassos','publicacio_traspassos_qui_fkey','FOREIGN KEY (qui) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_2791a224feaabefbac27'),
   ('private','publicacions_beta_cas_rebuts','publicacions_beta_cas_rebuts_submission_id_fkey','FOREIGN KEY (submission_id) REFERENCES section_submissions(id) ON DELETE CASCADE','r3252_fk_ed4c17549142c966c934'),
   ('private','publicacions_beta_cas_rebuts','publicacions_beta_cas_rebuts_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE CASCADE','r3252_fk_9a5c6435cce99eae16b3'),
   ('private','xat_iaia_binding','xat_iaia_binding_bot_id_fkey','FOREIGN KEY (bot_id) REFERENCES auth.users(id)','r3252_fk_fa3cd0a9930a06cb1185'),
   ('private','xat_iaia_binding','xat_iaia_binding_fil_id_fkey','FOREIGN KEY (fil_id) REFERENCES xat_fils(id)','r3252_fk_c39f7af35e2310b86d3f'),
   ('private','xat_iaia_binding','xat_iaia_binding_updated_by_fkey','FOREIGN KEY (updated_by) REFERENCES auth.users(id)','r3252_fk_eba8c8c39dfc6250d7c7'),
   ('private','xat_iaia_jobs','xat_iaia_jobs_bot_id_fkey','FOREIGN KEY (bot_id) REFERENCES auth.users(id)','r3252_fk_4dc54d24d11a78b3f383'),
   ('private','xat_iaia_jobs','xat_iaia_jobs_fil_id_fkey','FOREIGN KEY (fil_id) REFERENCES xat_fils(id)','r3252_fk_e92575c7442c383f369b'),
   ('private','xat_iaia_jobs','xat_iaia_jobs_requester_id_fkey','FOREIGN KEY (requester_id) REFERENCES auth.users(id)','r3252_fk_1d478c4cb336e3de63a2'),
   ('private','xat_iaia_jobs','xat_iaia_jobs_source_id_fkey','FOREIGN KEY (source_id) REFERENCES xat_missatges(id)','r3252_fk_7ed6611a21f9348dc405'),
   ('private','xat_iaia_principals','xat_iaia_principals_registered_by_fkey','FOREIGN KEY (registered_by) REFERENCES auth.users(id)','r3252_fk_c2685886e18ba14ed0a1'),
   ('private','xat_presencia','xat_presencia_usuari_id_fkey','FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_cddd8593e701249052ed'),
   ('public','aportacions_culturals','aportacions_culturals_revisor_id_fkey','FOREIGN KEY (revisor_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_4ef32dbc811abc54a95a'),
   ('public','app_content_historial','app_content_historial_autor_fkey','FOREIGN KEY (autor) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_7db62345da415e7d9c99'),
   ('public','bloquejos','bloquejos_bloquejat_entitat_fkey','FOREIGN KEY (bloquejat_entitat) REFERENCES organizations(id) ON DELETE CASCADE','r3252_fk_d8f1f7b128d56f9ed17b'),
   ('public','bloquejos','bloquejos_bloquejat_persona_fkey','FOREIGN KEY (bloquejat_persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_775de9fab360716dc0dc'),
   ('public','consentiments','consentiments_versio_politica_fkey','FOREIGN KEY (versio_politica) REFERENCES politiques_privacitat(versio) NOT VALID','r3252_fk_386cf05c31d884088e43'),
   ('public','denuncies','denuncies_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE SET NULL','r3252_fk_4fa297d30b370b539cef'),
   ('public','note_folders','note_folders_owner_user_id_fkey','FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_f2839e692f7fb86a0cfb'),
   ('public','notes','notes_published_submission_id_fkey','FOREIGN KEY (published_submission_id) REFERENCES section_submissions(id) ON DELETE SET NULL','r3252_fk_ac83258bb099f4a4adc3'),
   ('public','organization_claims','organization_claims_resolta_per_fkey','FOREIGN KEY (resolta_per) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_c1f629c24144de573216'),
   ('public','organization_claims','organization_claims_user_id_fkey','FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_7375c5dabfd581a261ea'),
   ('public','organization_member_organizations','organization_member_organizations_created_by_fkey','FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_211c5306e8df2b1715ef'),
   ('public','page_revisions','page_revisions_actor_entity_id_fkey','FOREIGN KEY (actor_entity_id) REFERENCES organizations(id) ON DELETE SET NULL','r3252_fk_a67ad1dc9655cb3b3bc7'),
   ('public','page_revisions','page_revisions_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES towns(id)','r3252_fk_e185b02771b790572f26'),
   ('public','seed_revisions','seed_revisions_author_id_fkey','FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_de701a052fbfe3d33c46'),
   ('public','seguiments','seguiments_seguit_entitat_fkey','FOREIGN KEY (seguit_entitat) REFERENCES organizations(id) ON DELETE CASCADE','r3252_fk_de84a0763cc6aaf11d5e'),
   ('public','seguiments','seguiments_seguit_persona_fkey','FOREIGN KEY (seguit_persona) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_4a8d1ba6d3d89b3cc67b'),
   ('public','seguiments','seguiments_tenant_id_fkey','FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE CASCADE','r3252_fk_d58a4fae1290f57f07a3'),
   ('public','user_platform_roles','user_platform_roles_granted_by_fkey','FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_96dee569fd03411e4c54'),
   ('public','xat_alliberaments_recuperacio','xat_alliberaments_recuperacio_amic_id_fkey','FOREIGN KEY (amic_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_add5b2d42beda760d4af'),
   ('public','xat_avals_recuperacio','xat_avals_recuperacio_amic_id_fkey','FOREIGN KEY (amic_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_77a19e3740fd20c46735'),
   ('public','xat_fils','xat_fils_creat_per_fkey','FOREIGN KEY (creat_per) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_5e0f8587101694e94788'),
   ('public','xat_fils','xat_fils_interlocutor_id_fkey','FOREIGN KEY (interlocutor_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_b6fa966c60ebf0136597'),
   ('public','xat_fils','xat_fils_org_id_fkey','FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL','r3252_fk_131a06b3a2bb65e7ac6f'),
   ('public','xat_fils','xat_fils_propi_usuari_id_fkey','FOREIGN KEY (propi_usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_bc35f3f3d2e580a042c8'),
   ('public','xat_missatges_fixats','xat_missatges_fixats_fixat_per_fkey','FOREIGN KEY (fixat_per) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_f3e1e73fbe5d6bea34d6'),
   ('public','xat_missatges','xat_missatges_cadena_arrel_fkey','FOREIGN KEY (cadena_arrel) REFERENCES xat_missatges(id) ON DELETE SET NULL','r3252_fk_c0929999a29382ac9e2f'),
   ('public','xat_missatges','xat_missatges_com_org_id_fkey','FOREIGN KEY (com_org_id) REFERENCES organizations(id) ON DELETE SET NULL','r3252_fk_66345bd6e783b5eccfc4'),
   ('public','xat_missatges','xat_missatges_esborrat_per_fkey','FOREIGN KEY (esborrat_per) REFERENCES auth.users(id) ON DELETE SET NULL','r3252_fk_b592e48643b69ba99edd'),
   ('public','xat_missatges','xat_missatges_resposta_a_fkey','FOREIGN KEY (resposta_a) REFERENCES xat_missatges(id) ON DELETE SET NULL','r3252_fk_4f695cbaef11ceceb74e'),
   ('public','xat_participants','xat_participants_com_org_id_fkey','FOREIGN KEY (com_org_id) REFERENCES organizations(id) ON DELETE SET NULL','r3252_fk_95d7e39283b1852351d8'),
   ('public','xat_reaccions','xat_reaccions_usuari_id_fkey','FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_5f32ff934d71c3a35628'),
   ('public','xat_verificacions_recuperacio','xat_verificacions_recuperacio_amic_id_fkey','FOREIGN KEY (amic_id) REFERENCES auth.users(id) ON DELETE CASCADE','r3252_fk_7b08d618bafa9cbf92ed')

 ), observed(schema_name,table_name,constraint_name,observed_columns,referenced_table,index_name) AS (VALUES
   ('private','publicacions_cas_rebuts','publicacions_cas_rebuts_owner_user_id_fkey',ARRAY['owner_user_id']::text[],'auth.users','r3252_fk_3b0282611c93250c89a1'),
   ('private','publicacions_cas_rebuts','publicacions_cas_rebuts_submission_id_fkey',ARRAY['submission_id']::text[],'public.section_submissions','r3252_fk_e5de503d75793aa6d5c6'),
   ('private','publicacions_cas_rebuts','publicacions_cas_rebuts_tenant_id_fkey',ARRAY['tenant_id']::text[],'public.towns','r3252_fk_42296b96c9f690f24e71'),
   ('private','r3213_crdt_captures','r3213_crdt_captures_owner_id_fkey',ARRAY['owner_id']::text[],'auth.users','r3252_fk_301b4729a716f1be129b'),
   ('private','r3213_crdt_dots','r3213_crdt_dots_owner_id_fkey',ARRAY['owner_id']::text[],'auth.users','r3252_fk_d4705dfd6a0735546857'),
   ('private','r3213_lssi_audit','r3213_lssi_audit_actor_id_fkey',ARRAY['actor_id']::text[],'auth.users','r3252_fk_071acca446495d44ed4b'),
   ('private','r3213_lssi_audit','r3213_lssi_audit_denuncia_id_fkey',ARRAY['denuncia_id']::text[],'public.denuncies','r3252_fk_41cf0492b1b7acd566bd'),
   ('private','r3213_lssi_rebuts','r3213_lssi_rebuts_actor_id_fkey',ARRAY['actor_id']::text[],'auth.users','r3252_fk_bf7bd279a0cd3741f6a3'),
   ('public','aportacions_culturals','aportacions_culturals_branca_id_fkey',ARRAY['branca_id']::text[],'public.branques_saber','r3252_fk_77e13bc7df173e5ebc02'),
   ('public','inventari_brain_node0','inventari_brain_node0_branca_id_fkey',ARRAY['branca_id']::text[],'public.branques_saber','r3252_fk_7a5fb8652e07499113eb')
 )
 SELECT c.*,NULL::text[] AS observed_columns,NULL::text AS referenced_table,false AS production_only FROM canonical c
 UNION ALL
 SELECT o.schema_name,o.table_name,o.constraint_name,NULL::text,o.index_name,o.observed_columns,o.referenced_table,true FROM observed o
 LOOP
   SELECT con.* INTO target FROM pg_constraint con
    WHERE con.conrelid=to_regclass(format('%I.%I',expected.schema_name,expected.table_name))
      AND con.conname=expected.constraint_name AND con.contype='f';
   IF NOT FOUND AND expected.production_only AND NOT EXISTS (
     SELECT FROM pg_attribute a WHERE a.attrelid=to_regclass(format('%I.%I',expected.schema_name,expected.table_name))
       AND a.attname=ANY(expected.observed_columns) AND a.attnum>0 AND NOT a.attisdropped
   ) THEN
     -- Variant canònica HEAD: la taula o totes les columnes observades no hi són.
     -- No es creen dades/taules de producció; la fixture separada acredita eixe camí.
     RAISE NOTICE 'r3272_observed_fk_absent_locally: %.%.%',expected.schema_name,expected.table_name,expected.constraint_name;
     CONTINUE;
   END IF;
   IF target.oid IS NULL OR (NOT expected.production_only AND pg_get_constraintdef(target.oid,true)<>expected.definition)
     OR (expected.production_only AND (
       target.confrelid IS DISTINCT FROM to_regclass(expected.referenced_table)
       OR ARRAY(SELECT a.attname::text FROM unnest(target.conkey) WITH ORDINALITY k(attnum,ord)
          JOIN pg_attribute a ON a.attrelid=target.conrelid AND a.attnum=k.attnum ORDER BY k.ord)
          IS DISTINCT FROM expected.observed_columns
     )) THEN
     RAISE EXCEPTION USING ERRCODE='55000', MESSAGE='r3252_fk_constraint_drift';
   END IF;
   SELECT to_regclass(format('%I.%I',expected.schema_name,expected.index_name)) INTO existing;
   IF existing IS NOT NULL AND NOT EXISTS(
     SELECT FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_am am ON am.oid=c.relam
     WHERE i.indexrelid=existing AND i.indrelid=target.conrelid AND i.indisvalid AND i.indisready AND i.indislive
       AND am.amname='btree' AND i.indpred IS NULL AND i.indexprs IS NULL
       AND i.indnkeyatts=cardinality(target.conkey) AND i.indnatts=i.indnkeyatts
       AND ARRAY(SELECT k FROM unnest(i.indkey::smallint[]) k)=target.conkey
   ) THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3252_fk_index_collision'; END IF;
   IF NOT EXISTS(
 SELECT 1 FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid JOIN pg_am am ON am.oid=ic.relam
 WHERE i.indrelid=target.conrelid AND i.indisvalid AND i.indisready AND i.indislive
   AND am.amname='btree' AND i.indnkeyatts>=cardinality(target.conkey)
   AND (i.indpred IS NULL OR EXISTS (
     SELECT 1 FROM pg_attribute a WHERE a.attrelid=target.conrelid AND a.attnum=ANY(target.conkey)
       AND pg_get_expr(i.indpred,i.indrelid)=format('(%I IS NOT NULL)',a.attname)
   ))
   AND ARRAY(SELECT k.attnum FROM unnest(i.indkey::smallint[]) WITH ORDINALITY k(attnum,ord)
             WHERE k.ord<=cardinality(target.conkey) ORDER BY k.attnum)
       = ARRAY(SELECT k.attnum FROM unnest(target.conkey) k(attnum) ORDER BY k.attnum)
   ) THEN
     SELECT string_agg(format('%I',a.attname),',' ORDER BY k.ord) INTO attrs
       FROM unnest(target.conkey) WITH ORDINALITY k(attnum,ord)
       JOIN pg_attribute a ON a.attrelid=target.conrelid AND a.attnum=k.attnum;
     EXECUTE format('CREATE INDEX %I ON %I.%I USING btree (%s)',expected.index_name,expected.schema_name,expected.table_name,attrs);
     SELECT pg_get_indexdef(to_regclass(format('%I.%I',expected.schema_name,expected.index_name))) INTO created_definition;
     created_definitions:=created_definitions||jsonb_build_array(created_definition);
   END IF;
 END LOOP;
 after_snapshot:=private.r3244_edicio_snapshot();
 -- Zero-based slot 8 és l'array pg_get_indexdef original de R32.44.
 -- Retirem del DESPRÉS només els índexs que este bloc acaba de crear.
 -- El resultat ha de ser byte-semànticament igual al rebut ABANS, incloent
 -- cossos/config/ACL, columnes, constraints, triggers, polítiques i índexs previs.
 normalized_snapshot:=jsonb_set(after_snapshot,'{tables}',(
   SELECT jsonb_agg(jsonb_set(t.entry,'{8}',coalesce((
     SELECT jsonb_agg(i.entry ORDER BY i.ord)
     FROM jsonb_array_elements(t.entry->8) WITH ORDINALITY i(entry,ord)
     WHERE NOT created_definitions @> jsonb_build_array(i.entry)
   ),'null'::jsonb)) ORDER BY t.ord)
   FROM jsonb_array_elements(after_snapshot->'tables') WITH ORDINALITY t(entry,ord)
 ));
 IF normalized_snapshot IS DISTINCT FROM before_snapshot THEN
   RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3252_r3244_postimage_drift';
 END IF;
 UPDATE private.r3244_edicio_contract SET snapshot=after_snapshot
   WHERE id=1 AND snapshot=before_snapshot;
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='r3252_r3244_cas_failed'; END IF;
END
$r3252$;

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
