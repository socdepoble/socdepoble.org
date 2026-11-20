-- R32.14 · ÚNIC SUPER-BUNDLE PENDENT DE PRODUCCIÓ. Aplicació humana.
-- Una sola transacció: qualsevol dependència absent o deriva desconeguda avorta TOT.
-- Requerix el catàleg previ de producció, no una instal·lació Supabase buida.
-- r32_11_publicacions_cas ja aplicada: es preserva, no es torna a instal·lar.
-- Fòssils inexistents sense backup continuen absents; els presents mantenen pins.
-- R32.13: CREATE IF NOT EXISTS + CREATE OR REPLACE; imports/auditoria sense duplicats.
-- No activa clients, treballadors, DNS ni push. Cap credencial és necessària.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
select pg_catalog.pg_advisory_xact_lock(1935960372,1732140000);
-- Strict SQL contract: captured native18.6/PGlite shapes; owner anchored to xat_fils.
-- NOT NULL is checked via pg_attribute across PG versions; indexes include validity.
do $r3214_guards$
declare spec pg_catalog.jsonb:=$r3214_expected${"tables":{"public.xat_reaccions":[{"acl":[],"rls":true,"force":false,"columns":[["missatge_id","uuid",true,null],["usuari_id","uuid",true,null],["emoji","text",true,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE UNIQUE INDEX xat_reaccions_pkey ON public.xat_reaccions USING btree (missatge_id, usuari_id, emoji)",true,true]],"policies":[["xat_reaccions_propies","*",true,["authenticated"],"((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))","((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_reaccions_emoji_check","CHECK (((char_length(emoji) >= 1) AND (char_length(emoji) <= 16)))"],["xat_reaccions_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_reaccions_pkey","PRIMARY KEY (missatge_id, usuari_id, emoji)"],["xat_reaccions_usuari_id_fkey","FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE"]]}],"public.xat_missatges_destacats":[{"acl":[],"rls":true,"force":false,"columns":[["usuari_id","uuid",true,null],["missatge_id","uuid",true,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE INDEX xat_destacats_missatge_idx ON public.xat_missatges_destacats USING btree (missatge_id)",true,true],["CREATE UNIQUE INDEX xat_missatges_destacats_pkey ON public.xat_missatges_destacats USING btree (usuari_id, missatge_id)",true,true]],"policies":[["xat_destacats_propis","*",true,["authenticated"],"((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))","((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_missatges_destacats_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_missatges_destacats_pkey","PRIMARY KEY (usuari_id, missatge_id)"],["xat_missatges_destacats_usuari_id_fkey","FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE"]]}],"public.xat_missatges_fixats":[{"acl":[],"rls":true,"force":false,"columns":[["conversa_id","uuid",true,null],["missatge_id","uuid",true,null],["fixat_per","uuid",false,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE INDEX xat_fixats_missatge_idx ON public.xat_missatges_fixats USING btree (missatge_id)",true,true],["CREATE UNIQUE INDEX xat_missatges_fixats_pkey ON public.xat_missatges_fixats USING btree (conversa_id, missatge_id)",true,true]],"policies":[["xat_fixats_autor","*",true,["authenticated"],"((fixat_per = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, conversa_id))","((fixat_per = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, conversa_id))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_missatges_fixats_conversa_id_fkey","FOREIGN KEY (conversa_id) REFERENCES xat_fils(id) ON DELETE CASCADE"],["xat_missatges_fixats_fixat_per_fkey","FOREIGN KEY (fixat_per) REFERENCES auth.users(id) ON DELETE SET NULL"],["xat_missatges_fixats_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_missatges_fixats_pkey","PRIMARY KEY (conversa_id, missatge_id)"]]}],"public.xat_missatges_amagats":[{"acl":[],"rls":true,"force":false,"columns":[["usuari_id","uuid",true,null],["missatge_id","uuid",true,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE INDEX xat_amagats_missatge_idx ON public.xat_missatges_amagats USING btree (missatge_id)",true,true],["CREATE UNIQUE INDEX xat_missatges_amagats_pkey ON public.xat_missatges_amagats USING btree (usuari_id, missatge_id)",true,true]],"policies":[["xat_amagats_propis","*",true,["authenticated"],"((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))","((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_missatges_amagats_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_missatges_amagats_pkey","PRIMARY KEY (usuari_id, missatge_id)"],["xat_missatges_amagats_usuari_id_fkey","FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE"]]}],"private.xat_push_credencials_v2":[{"acl":[],"rls":true,"force":false,"columns":[["proveidor","text",true,null],["empremta","text",true,null],["valor","text",true,null],["caduca_al","timestamp with time zone",true,null]],"indexes":[["CREATE UNIQUE INDEX xat_push_credencials_v2_pkey ON private.xat_push_credencials_v2 USING btree (proveidor, empremta)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_push_credencials_v2_empremta_forma","CHECK ((empremta ~ '^[0-9a-f]{16}$'::text))"],["xat_push_credencials_v2_pkey","PRIMARY KEY (proveidor, empremta)"],["xat_push_credencials_v2_proveidor_valid","CHECK ((proveidor = ANY (ARRAY['apns'::text, 'fcm'::text])))"],["xat_push_credencials_v2_valor_forma","CHECK ((((char_length(valor) >= 20) AND (char_length(valor) <= 4096)) AND (valor ~ '^[A-Za-z0-9._-]+$'::text)))"]]}],"private.r3210_fossils_acl_backup":[{"acl":[],"rls":true,"force":false,"columns":[["signature","text",true,null],["function_oid","oid",true,null],["owner_oid","oid",true,null],["definition_hash","text",true,null],["before_acl","text",false,null],["after_acl","text",true,null],["captured_at","timestamp with time zone",true,"now()"]],"indexes":[["CREATE UNIQUE INDEX r3210_fossils_acl_backup_pkey ON private.r3210_fossils_acl_backup USING btree (signature)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3210_fossils_acl_backup_pkey","PRIMARY KEY (signature)"]]}],"private.r3213_crdt_captures":[{"acl":[],"rls":true,"force":false,"columns":[["tenant_id","uuid",true,null],["owner_id","uuid",true,null],["request_id","text",true,null],["canonical_capture","text",true,null],["capture_sha256","text",true,null],["frontier","jsonb",true,null],["confirmed_at","timestamp with time zone",true,null]],"indexes":[["CREATE UNIQUE INDEX r3213_crdt_captures_pkey ON private.r3213_crdt_captures USING btree (tenant_id, owner_id, request_id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_crdt_captures_canonical_capture_check","CHECK ((octet_length(canonical_capture) <= 4194304))"],["r3213_crdt_captures_capture_sha256_check","CHECK ((capture_sha256 ~ '^[a-f0-9]{64}$'::text))"],["r3213_crdt_captures_frontier_check","CHECK ((jsonb_typeof(frontier) = 'array'::text))"],["r3213_crdt_captures_owner_id_fkey","FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE"],["r3213_crdt_captures_pkey","PRIMARY KEY (tenant_id, owner_id, request_id)"],["r3213_crdt_captures_request_id_check","CHECK ((request_id ~ '^[A-Za-z0-9_-]{1,128}$'::text))"],["r3213_crdt_captures_tenant_id_fkey","FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE CASCADE"]]}],"private.r3213_crdt_dots":[{"acl":[],"rls":true,"force":false,"columns":[["tenant_id","uuid",true,null],["owner_id","uuid",true,null],["dot","text",true,null],["operation","jsonb",true,null]],"indexes":[["CREATE UNIQUE INDEX r3213_crdt_dots_pkey ON private.r3213_crdt_dots USING btree (tenant_id, owner_id, dot)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_crdt_dots_owner_id_fkey","FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE"],["r3213_crdt_dots_pkey","PRIMARY KEY (tenant_id, owner_id, dot)"],["r3213_crdt_dots_tenant_id_fkey","FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE CASCADE"]]}],"private.r3213_lssi_flux":[{"acl":[],"rls":true,"force":false,"columns":[["denuncia_id","uuid",true,null],["estat","text",true,null],["versio","integer",true,null],["modificada_al","timestamp with time zone",true,"clock_timestamp()"]],"indexes":[["CREATE UNIQUE INDEX r3213_lssi_flux_pkey ON private.r3213_lssi_flux USING btree (denuncia_id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_lssi_flux_denuncia_id_fkey","FOREIGN KEY (denuncia_id) REFERENCES denuncies(id) ON DELETE CASCADE"],["r3213_lssi_flux_estat_check","CHECK ((estat = ANY (ARRAY['rebuda'::text, 'en_revisio'::text, 'ocultacio_cautelar'::text, 'arxivada'::text, 'resolta'::text])))"],["r3213_lssi_flux_pkey","PRIMARY KEY (denuncia_id)"],["r3213_lssi_flux_versio_check","CHECK ((versio >= 1))"]]}],"private.r3213_lssi_audit":[{"acl":[],"rls":true,"force":false,"columns":[["id","uuid",true,"gen_random_uuid()"],["denuncia_id","uuid",true,null],["actor_id","uuid",false,null],["anterior","text",false,null],["estat","text",true,null],["justificacio","text",true,null],["creat_al","timestamp with time zone",true,"clock_timestamp()"]],"indexes":[["CREATE UNIQUE INDEX r3213_lssi_audit_pkey ON private.r3213_lssi_audit USING btree (id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_lssi_audit_actor_id_fkey","FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL"],["r3213_lssi_audit_denuncia_id_fkey","FOREIGN KEY (denuncia_id) REFERENCES denuncies(id) ON DELETE CASCADE"],["r3213_lssi_audit_estat_check","CHECK ((estat = ANY (ARRAY['rebuda'::text, 'en_revisio'::text, 'ocultacio_cautelar'::text, 'arxivada'::text, 'resolta'::text])))"],["r3213_lssi_audit_justificacio_check","CHECK (((char_length(justificacio) >= 1) AND (char_length(justificacio) <= 2000)))"],["r3213_lssi_audit_pkey","PRIMARY KEY (id)"]]}],"private.r3213_lssi_rebuts":[{"acl":[],"rls":true,"force":false,"columns":[["subjecte","text",true,null],["operacio_id","uuid",true,null],["peticio_sha256","text",true,null],["rebut","jsonb",true,null],["actor_id","uuid",false,null]],"indexes":[["CREATE UNIQUE INDEX r3213_lssi_rebuts_pkey ON private.r3213_lssi_rebuts USING btree (subjecte, operacio_id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_lssi_rebuts_actor_id_fkey","FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE"],["r3213_lssi_rebuts_peticio_sha256_check","CHECK ((peticio_sha256 ~ '^[a-f0-9]{64}$'::text))"],["r3213_lssi_rebuts_pkey","PRIMARY KEY (subjecte, operacio_id)"]]}]},"functions":{"private.denuncies_abans_insercio()":[{"body":"71c11c9a704161e5e1406518cd8ed856cd19c95db4d19a0a54b0db7a68b4a47c","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"trigger","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]},{"body":"c92d45f52316897522d3f1b3547a461b0cf127e02544c313b68280bf34c3e6b3","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"trigger","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]}],"public.xat_fils_meus(p_tenant_id uuid)":[{"body":"1f2a329adf5b165c7941fa693615fe4211c6d85e4f0fbda6077f26f1691a97ac","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"TABLE(id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamp with time zone, altres_noms text[], ultim_text text, ultim_al timestamp with time zone, ultim_autor_id uuid, ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint, llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamp with time zone, fixat_al timestamp with time zone, silenciat_fins_al timestamp with time zone, preferit_al timestamp with time zone, no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb, comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text, subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint, canal_clau text, rebut_pels_altres_fins_seq bigint)","defaults":null,"proretset":true,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]},{"body":"17a5b8b1beee4921a9e771f0fa16632803babc7b6a076d03e485759eae0ea4c4","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"TABLE(id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamp with time zone, altres_noms text[], ultim_text text, ultim_al timestamp with time zone, ultim_autor_id uuid, ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint, llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamp with time zone, fixat_al timestamp with time zone, silenciat_fins_al timestamp with time zone, preferit_al timestamp with time zone, no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb, comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text, subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint, canal_clau text, rebut_pels_altres_fins_seq bigint)","defaults":null,"proretset":true,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid)":[{"body":"28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::uuid","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_quota()":[{"body":"41a4d7e443a47dcccaf226a26bfc7799c7c5211d5edcdbbaa38987f6b4df2e14","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]},{"body":"c9607dbf16a0dfc4e716a71876a180c2f9e0dc3f1a6b2674a16357671290b01a","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_reserva_adjunt(p_id uuid, p_fil_id uuid, p_bytes bigint, p_mime text, p_durada_ms integer)":[{"body":"17241d05975614f723170fd52d15da2676db495996c7a7ab40097326b00b5d4f","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::integer","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]},{"body":"dddb2fda616808f319c0bf036d3489a6ee90ff72596c32e50f533ef6167373e5","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::integer","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"private.r3213_lssi_sync()":[{"body":"c501dfb164d1e237303c235c464454272eaa2438e082bfa6cfff8ab2d0f0669a","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"trigger","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]}],"private.xat_accio_estat(p_id uuid)":[{"body":"40d72d2a38b190b117d04da993d1252dd7e9adb854510a143c6f01357f75bd35","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"sql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]}],"private.xat_accio_visible(p_id uuid, p_fil_id uuid)":[{"body":"c819f68a1aa31e5287d38eb939661e12f2b696dd4337cd370f66d65b3845b324","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"sql","result":"boolean","defaults":"NULL::uuid","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.confirma_captura_crdt_rural(p_tenant uuid, p_request text, p_capture text, p_sha256 text, p_frontier jsonb)":[{"body":"45a8b355a4e22812790907b1e56ade8444565339d410cffd1eeb12a5fbd3226f","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.llista_denuncies_diligents(p_estat text, p_limit integer)":[{"body":"70d19bde272059c474c4bf471f6bf298abd39e7e364f447fcfa3c3d36ca3f110","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"50","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.registra_denuncia_diligent(p_publicacio uuid, p_motiu text, p_detall text, p_operacio uuid)":[{"body":"8e83339040e3f1cd547246486f1c87a88faa01660e64a8aa2aff7c4418545f21","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["anon","EXECUTE",false],["authenticated","EXECUTE",false]],"effective":[["anon",true],["authenticated",true],["service_role",false]]}],"public.revisa_denuncia_diligent(p_id uuid, p_estat_esperat text, p_versio integer, p_estat text, p_justificacio text, p_operacio uuid)":[{"body":"2d18b9f4aab5080aba0a93e490161911087b56e3690922ea06f612a7ad4d0b81","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_accions_missatges(p_fil_id uuid, p_ids uuid[], p_nomes_destacats boolean, p_despres_de_id uuid, p_limit integer)":[{"body":"301a69eeb2f2bd183b054e3c5720208d88d5556c9d1387ee114fd9c23fdb86c2","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::uuid, '{}'::uuid[], false, NULL::uuid, 100","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_alterna_destacat(p_fil_id uuid, p_missatge_id uuid, p_actiu boolean)":[{"body":"c97105c39010b0e5a6e823e0f55d00d94f91bd51247d3c01c09d5785c3f43b36","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_alterna_fixat(p_fil_id uuid, p_missatge_id uuid, p_actiu boolean)":[{"body":"4bf4faa7c30c4d0a97a60a4e64b85d71a54e73d12d743ff778c2ea985a5aabe4","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_alterna_reaccio(p_fil_id uuid, p_missatge_id uuid, p_emoji text, p_activa boolean)":[{"body":"22eaac4ec5a81b14aab94e4308d5ceda27a4a2078497c3e7a55990d11e16f3de","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_elimina_per_a_mi(p_fil_id uuid, p_missatge_id uuid)":[{"body":"8d68523d654c4e47f43af1232a6ca42d43e69c37cff08cfb87ef86c0c2c1c2d6","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid, p_ubicacio jsonb)":[{"body":"e478942615b608443df92d4979b1409a8c6fca4d4b6280ee9652a09545d100fa","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_push_credencial_v2(p_proveidor text, p_empremta text)":[{"body":"0feb81b669ce17081e67ed721a2a951755a1be71dbb8b5701d1ecc5f806cf26a","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"text","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["service_role","EXECUTE",false]],"effective":[["anon",false],["authenticated",false],["service_role",true]]}],"public.xat_push_desa_credencial_v2(p_proveidor text, p_empremta text, p_valor text, p_caduca_al timestamp with time zone)":[{"body":"8ccb401aee33380ddc820101b67e0326293b80d689449f4230f80e1e5e894f13","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"boolean","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["service_role","EXECUTE",false]],"effective":[["anon",false],["authenticated",false],["service_role",true]]}]},"triggers":{"denuncies_abans_insercio":[{"tgname":"denuncies_abans_insercio","ddl":"CREATE TRIGGER denuncies_abans_insercio BEFORE INSERT ON public.denuncies FOR EACH ROW EXECUTE FUNCTION private.denuncies_abans_insercio()","tgenabled":"O"}],"r3213_lssi_decisio":[{"tgname":"r3213_lssi_decisio","ddl":"CREATE TRIGGER r3213_lssi_decisio AFTER UPDATE OF estat ON public.denuncies FOR EACH ROW WHEN ((old.estat IS DISTINCT FROM new.estat)) EXECUTE FUNCTION private.r3213_lssi_sync()","tgenabled":"O"}],"r3213_lssi_insercio":[{"tgname":"r3213_lssi_insercio","ddl":"CREATE TRIGGER r3213_lssi_insercio AFTER INSERT ON public.denuncies FOR EACH ROW EXECUTE FUNCTION private.r3213_lssi_sync()","tgenabled":"O"}]}}$r3214_expected$::pg_catalog.jsonb;
 item record; procrow record; got pg_catalog.jsonb; seen pg_catalog.jsonb:='{}'::pg_catalog.jsonb;
 expected_owner pg_catalog.oid:=(select relowner from pg_catalog.pg_class where oid='public.xat_fils'::pg_catalog.regclass);
begin
 if (select x.schema_name from pg_catalog.unnest(pg_catalog.current_schemas(true)) with ordinality as x(schema_name,ordinal)
  where x.schema_name is distinct from (select n.nspname from pg_catalog.pg_namespace n where n.oid=pg_catalog.pg_my_temp_schema()) order by x.ordinal limit 1) is distinct from 'pg_catalog' then
  raise exception 'SDP-R3214-DRIFT: caller schema' using errcode='55000';
 end if;
 for item in select key,value from pg_catalog.jsonb_each(spec->'tables') loop
  if pg_catalog.to_regclass(item.key) is null then
   continue;
  end if;
  if not exists(select 1 from pg_catalog.pg_class where oid=pg_catalog.to_regclass(item.key) and relkind='r' and relowner=expected_owner) then
   raise exception 'SDP-R3214-DRIFT: table owner/kind %',item.key using errcode='55000';
  end if;
  select jsonb_build_object(
 'columns',(select jsonb_agg(jsonb_build_array(a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_catalog.pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_catalog.pg_attribute a left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select coalesce(jsonb_agg(jsonb_build_array(k.conname,pg_catalog.pg_get_constraintdef(k.oid)) order by k.conname),'[]'::jsonb) from pg_catalog.pg_constraint k where k.conrelid=c.oid and k.contype<>'n'),
 'indexes',(select coalesce(jsonb_agg(jsonb_build_array(pg_catalog.pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by i.indexrelid::regclass::text),'[]'::jsonb) from pg_catalog.pg_index i where i.indrelid=c.oid),
 'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
 'acl',(select coalesce(jsonb_agg(jsonb_build_array(coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a left join pg_catalog.pg_roles r on r.oid=a.grantee where a.grantee<>c.relowner and coalesce(r.rolname,'PUBLIC')<>'service_role'),
 'effective',(select jsonb_agg(jsonb_build_array(r,case when r='service_role' then false else pg_catalog.has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') end,case when r='service_role' then false else pg_catalog.has_any_column_privilege(r,c.oid,'SELECT,INSERT,UPDATE,REFERENCES') end) order by r) from unnest(array['anon','authenticated','service_role']) r),
 'columnacl',(select coalesce(jsonb_agg(jsonb_build_array(x.attname,coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by x.attnum,coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.pg_attribute x cross join lateral pg_catalog.aclexplode(x.attacl) a left join pg_catalog.pg_roles r on r.oid=a.grantee where x.attrelid=c.oid and a.grantee<>c.relowner and coalesce(r.rolname,'PUBLIC')<>'service_role'),
 'policies',(select coalesce(jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,(select array_agg(coalesce(r.rolname,'PUBLIC') order by coalesce(r.rolname,'PUBLIC')) from unnest(p.polroles) roleid left join pg_catalog.pg_roles r on r.oid=roleid),pg_catalog.pg_get_expr(p.polqual,p.polrelid),pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname),'[]'::jsonb) from pg_catalog.pg_policy p where p.polrelid=c.oid)
) into got from pg_catalog.pg_class c where c.oid=pg_catalog.to_regclass(item.key);
  if not exists(select 1 from pg_catalog.jsonb_array_elements(item.value) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: table %',item.key using errcode='55000';
  end if;
 end loop;
 for procrow in select n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')' signature,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') body,p.prosecdef,p.provolatile,p.proconfig,l.lanname,pg_catalog.pg_get_function_result(p.oid) result,pg_catalog.pg_get_expr(p.proargdefaults,0) defaults,p.proretset,p.proleakproof,p.proparallel,(select coalesce(jsonb_agg(jsonb_build_array(coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a left join pg_catalog.pg_roles r on r.oid=a.grantee where a.grantee<>p.proowner and (p.proname like 'xat_push_%' or coalesce(r.rolname,'PUBLIC')<>'service_role')) acl,(select jsonb_agg(jsonb_build_array(r,case when r='service_role' and p.proname not like 'xat_push_%' then false else pg_catalog.has_function_privilege(r,p.oid,'EXECUTE') end) order by r) from unnest(array['anon','authenticated','service_role']) r) effective from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace join pg_catalog.pg_language l on l.oid=p.prolang where n.nspname||'.'||p.proname=any(array['private.denuncies_abans_insercio','public.xat_fils_meus','public.xat_publica_adjunt','public.xat_quota','public.xat_reserva_adjunt','private.r3213_lssi_sync','private.xat_accio_estat','private.xat_accio_visible','public.confirma_captura_crdt_rural','public.llista_denuncies_diligents','public.registra_denuncia_diligent','public.revisa_denuncia_diligent','public.xat_accions_missatges','public.xat_alterna_destacat','public.xat_alterna_fixat','public.xat_alterna_reaccio','public.xat_elimina_per_a_mi','public.xat_push_credencial_v2','public.xat_push_desa_credencial_v2']::pg_catalog.text[]::text[]) order by 1 loop
  if not (spec->'functions') ? procrow.signature or not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
   where n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')'=procrow.signature and p.proowner=expected_owner) then
   raise exception 'SDP-R3214-DRIFT: function owner/overload %',procrow.signature using errcode='55000';
  end if;
  got:=pg_catalog.to_jsonb(procrow)-'signature';
  if not exists(select 1 from pg_catalog.jsonb_array_elements(spec->'functions'->procrow.signature) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: function %',procrow.signature using errcode='55000';
  end if;
  seen:=seen||pg_catalog.jsonb_build_object(procrow.signature,true);
 end loop;
 
 for item in select key,value from pg_catalog.jsonb_each(spec->'triggers') loop
  select pg_catalog.jsonb_build_object('tgname',t.tgname,'ddl',pg_catalog.pg_get_triggerdef(t.oid),'tgenabled',t.tgenabled) into got
   from pg_catalog.pg_trigger t where t.tgrelid='public.denuncies'::pg_catalog.regclass and t.tgname=item.key;
  if got is null then continue; end if;
  if not exists(select 1 from pg_catalog.jsonb_array_elements(item.value) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: trigger %',item.key using errcode='55000';
  end if;
 end loop;
end $r3214_guards$;


-- SOURCE supabase/migrations/20261117173000_r32_7_xat_reaccions_destacats_fixats_amagats.sql SHA256 99ea3db8330b9c650ca3f0c73e018f7c15203202cca3ac362ab39aaaae471a84

set local lock_timeout = '5s';
set local statement_timeout = '120s';

do $$ begin
  if to_regclass('public.xat_fils') is null or to_regclass('public.xat_missatges') is null
    or to_regprocedure('private.es_participant(uuid)') is null
    or to_regprocedure('private.seq_visible(uuid,bigint)') is null
    or to_regprocedure('private.es_admin_del_fil(uuid)') is null then
    raise exception 'SDP-XAT-ACCIONS-DEPENDENCY' using errcode='55000';
  end if;
end $$;

create table if not exists public.xat_reaccions (
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  creat_al timestamptz not null default now(), primary key(missatge_id,usuari_id,emoji)
);
create table if not exists public.xat_missatges_destacats (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  creat_al timestamptz not null default now(), primary key(usuari_id,missatge_id)
);
create table if not exists public.xat_missatges_fixats (
  conversa_id uuid not null references public.xat_fils(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  fixat_per uuid references auth.users(id) on delete set null,
  creat_al timestamptz not null default now(), primary key(conversa_id,missatge_id)
);
create table if not exists public.xat_missatges_amagats (
  usuari_id uuid not null references auth.users(id) on delete cascade,
  missatge_id uuid not null references public.xat_missatges(id) on delete cascade,
  creat_al timestamptz not null default now(), primary key(usuari_id,missatge_id)
);
create index if not exists xat_destacats_missatge_idx on public.xat_missatges_destacats(missatge_id);
create index if not exists xat_fixats_missatge_idx on public.xat_missatges_fixats(missatge_id);
create index if not exists xat_amagats_missatge_idx on public.xat_missatges_amagats(missatge_id);

create or replace function private.xat_accio_visible(p_id uuid,p_fil_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.xat_missatges m
  where m.id=p_id and (p_fil_id is null or m.fil_id=p_fil_id)
    and private.es_participant(m.fil_id) and private.seq_visible(m.fil_id,m.seq)
    and m.esborrat_al is null and (m.caduca_al is null or m.caduca_al>now()));
$$;
revoke all on function private.xat_accio_visible(uuid,uuid) from public,anon;
grant execute on function private.xat_accio_visible(uuid,uuid) to authenticated;

alter table public.xat_reaccions enable row level security;
alter table public.xat_missatges_destacats enable row level security;
alter table public.xat_missatges_fixats enable row level security;
alter table public.xat_missatges_amagats enable row level security;
-- Les taules no són API: RLS també protegeix una concessió futura accidental.
revoke all on table public.xat_reaccions,public.xat_missatges_destacats,
 public.xat_missatges_fixats,public.xat_missatges_amagats from public,anon,authenticated;
drop policy if exists xat_reaccions_propies on public.xat_reaccions;
create policy xat_reaccions_propies on public.xat_reaccions for all to authenticated
 using(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null))
 with check(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null));
drop policy if exists xat_destacats_propis on public.xat_missatges_destacats;
create policy xat_destacats_propis on public.xat_missatges_destacats for all to authenticated
 using(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null))
 with check(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null));
drop policy if exists xat_amagats_propis on public.xat_missatges_amagats;
create policy xat_amagats_propis on public.xat_missatges_amagats for all to authenticated
 using(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null))
 with check(usuari_id=(select auth.uid()) and private.xat_accio_visible(missatge_id,null));
drop policy if exists xat_fixats_autor on public.xat_missatges_fixats;
create policy xat_fixats_autor on public.xat_missatges_fixats for all to authenticated
 using(fixat_per=(select auth.uid()) and private.xat_accio_visible(missatge_id,conversa_id))
 with check(fixat_per=(select auth.uid()) and private.xat_accio_visible(missatge_id,conversa_id));

create or replace function private.xat_accio_estat(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('missatgeId',m.id,'filId',m.fil_id,
  'reaccions',coalesce((select jsonb_agg(jsonb_build_object('emoji',r.emoji,'total',r.total,'meua',r.meua) order by r.emoji)
   from(select x.emoji,count(*)::integer total,bool_or(x.usuari_id=auth.uid()) meua
    from public.xat_reaccions x where x.missatge_id=m.id group by x.emoji) r),'[]'::jsonb),
  'destacat',exists(select 1 from public.xat_missatges_destacats d where d.missatge_id=m.id and d.usuari_id=auth.uid()),
  'fixat',exists(select 1 from public.xat_missatges_fixats f where f.missatge_id=m.id and f.conversa_id=m.fil_id),
  'amagat',exists(select 1 from public.xat_missatges_amagats a where a.missatge_id=m.id and a.usuari_id=auth.uid()))
 from public.xat_missatges m where m.id=p_id and private.xat_accio_visible(m.id,m.fil_id);
$$;
revoke all on function private.xat_accio_estat(uuid) from public,anon,authenticated;

create or replace function public.xat_accions_missatges(p_fil_id uuid default null,p_ids uuid[] default '{}',
 p_nomes_destacats boolean default false,p_despres_de_id uuid default null,p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_files jsonb; v_limit integer:=coalesce(p_limit,100); v_mes boolean;
begin
 if auth.uid() is null then raise exception 'SDP-XAT-001' using errcode='42501'; end if;
 if v_limit<1 or v_limit>100 or coalesce(cardinality(p_ids),0)>100
  or (p_fil_id is null and not coalesce(p_nomes_destacats,false)) then
  raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if p_fil_id is not null and not private.es_participant(p_fil_id) then
  raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 select coalesce(jsonb_agg(private.xat_accio_estat(q.id) order by q.id),'[]'::jsonb) into v_files
 from(select m.id from public.xat_missatges m
  where (p_fil_id is null or m.fil_id=p_fil_id) and private.xat_accio_visible(m.id,m.fil_id)
   and (coalesce(cardinality(p_ids),0)=0 or m.id=any(p_ids))
   and (p_despres_de_id is null or m.id>p_despres_de_id)
   and (not coalesce(p_nomes_destacats,false) or exists(select 1 from public.xat_missatges_destacats d
    where d.missatge_id=m.id and d.usuari_id=auth.uid())) order by m.id limit v_limit+1) q;
 v_mes:=jsonb_array_length(v_files)>v_limit;
 if v_mes then v_files:=v_files-(jsonb_array_length(v_files)-1); end if;
 return jsonb_build_object('missatges',v_files,'teMes',v_mes,'seguentId',
  case when v_mes then v_files->(jsonb_array_length(v_files)-1)->>'missatgeId' else null end);
end $$;

create or replace function public.xat_alterna_reaccio(p_fil_id uuid,p_missatge_id uuid,p_emoji text,p_activa boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_activa is null or p_emoji is null or char_length(p_emoji) not between 1 and 16 or btrim(p_emoji)='' then
  raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('xat:reaccio:'||p_missatge_id::text||auth.uid()::text,0));
 if p_activa then
  -- Una sola reacció per persona i missatge, encara que canvie l'emoji.
  delete from public.xat_reaccions where missatge_id=p_missatge_id and usuari_id=auth.uid() and emoji<>p_emoji;
  insert into public.xat_reaccions(missatge_id,usuari_id,emoji) values(p_missatge_id,auth.uid(),p_emoji) on conflict do nothing;
 else delete from public.xat_reaccions where missatge_id=p_missatge_id and usuari_id=auth.uid() and emoji=p_emoji; end if;
 return private.xat_accio_estat(p_missatge_id);
end $$;

create or replace function public.xat_alterna_destacat(p_fil_id uuid,p_missatge_id uuid,p_actiu boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_actiu is null then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if p_actiu then insert into public.xat_missatges_destacats(usuari_id,missatge_id) values(auth.uid(),p_missatge_id) on conflict do nothing;
 else delete from public.xat_missatges_destacats where usuari_id=auth.uid() and missatge_id=p_missatge_id; end if;
 return private.xat_accio_estat(p_missatge_id);
end $$;

create or replace function public.xat_alterna_fixat(p_fil_id uuid,p_missatge_id uuid,p_actiu boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 if p_actiu is null then raise exception 'SDP-XAT-009' using errcode='22023'; end if;
 if exists(select 1 from public.xat_fils f where f.id=p_fil_id and f.tipus in('grup','canal','comunitat'))
  and not private.es_admin_del_fil(p_fil_id) then raise exception 'SDP-XAT-011' using errcode='42501'; end if;
 if p_actiu then insert into public.xat_missatges_fixats(conversa_id,missatge_id,fixat_per) values(p_fil_id,p_missatge_id,auth.uid()) on conflict do nothing;
 else delete from public.xat_missatges_fixats where conversa_id=p_fil_id and missatge_id=p_missatge_id; end if;
 return private.xat_accio_estat(p_missatge_id);
end $$;

create or replace function public.xat_elimina_per_a_mi(p_fil_id uuid,p_missatge_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
 if not private.xat_accio_visible(p_missatge_id,p_fil_id) then raise exception 'SDP-XAT-006' using errcode='42501'; end if;
 insert into public.xat_missatges_amagats(usuari_id,missatge_id) values(auth.uid(),p_missatge_id) on conflict do nothing;
 return private.xat_accio_estat(p_missatge_id);
end $$;

revoke all on function public.xat_accions_missatges(uuid,uuid[],boolean,uuid,integer),
 public.xat_alterna_reaccio(uuid,uuid,text,boolean),public.xat_alterna_destacat(uuid,uuid,boolean),
 public.xat_alterna_fixat(uuid,uuid,boolean),public.xat_elimina_per_a_mi(uuid,uuid) from public,anon;
grant execute on function public.xat_accions_missatges(uuid,uuid[],boolean,uuid,integer),
 public.xat_alterna_reaccio(uuid,uuid,text,boolean),public.xat_alterna_destacat(uuid,uuid,boolean),
 public.xat_alterna_fixat(uuid,uuid,boolean),public.xat_elimina_per_a_mi(uuid,uuid) to authenticated;

-- SOURCE supabase/migrations/20261117193000_r32_8_xat_quota_250mb_video_60s_i_ubicacio.sql SHA256 8e505a81f448b6711a381a405357199a7d55a93a0e73a2e33842db642ffbc236

set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $r328_preflight$
declare r record; v_hash text;
begin
  if pg_catalog.to_regclass('public.xat_adjunts') is null
    or pg_catalog.to_regclass('storage.objects') is null then
    raise exception 'SDP-R328-DEPENDENCY: falta el catàleg de xat.' using errcode='55000';
  end if;
  for r in select * from (values
    ('public.xat_quota()','41a4d7e443a47dcccaf226a26bfc7799c7c5211d5edcdbbaa38987f6b4df2e14','c9607dbf16a0dfc4e716a71876a180c2f9e0dc3f1a6b2674a16357671290b01a'),
    ('public.xat_reserva_adjunt(uuid,uuid,bigint,text,integer)','17241d05975614f723170fd52d15da2676db495996c7a7ab40097326b00b5d4f','dddb2fda616808f319c0bf036d3489a6ee90ff72596c32e50f533ef6167373e5'),
    ('public.xat_publica_adjunt(uuid,text,uuid)','28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb','28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb')
  ) as expected(signature,before_hash,after_hash) loop
    select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') into v_hash
      from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure(r.signature)
        and p.prosecdef and coalesce(p.proconfig @> array['search_path=""']::text[],false);
    if v_hash is null or (v_hash<>r.before_hash and v_hash<>r.after_hash) then
      raise exception 'SDP-R328-DRIFT: RPC vigent absent o divergent %.',r.signature using errcode='55000';
    end if;
  end loop;
end;
$r328_preflight$;

create or replace function public.xat_quota() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  return jsonb_build_object('usats', coalesce((select sum(bytes) from public.xat_adjunts where usuari_id = (select auth.uid())), 0)
      + private.xat_bytes_en_purga((select auth.uid())), 'limit', 250000000,
    'pendents', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'bytes', bytes, 'mime', mime))
      from public.xat_adjunts where usuari_id = (select auth.uid()) and not publicat), '[]'::jsonb));
end;
$$;

create or replace function public.xat_reserva_adjunt(p_id uuid,p_fil_id uuid,p_bytes bigint,p_mime text,p_durada_ms integer default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_jo uuid := (select auth.uid()); a public.xat_adjunts%rowtype; v_total bigint; v_caduc uuid;
  v_pendents integer; v_recents integer; v_pujat boolean;
begin
  if v_jo is null then raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode = '42501'; end if;
  if not private.es_participant(p_fil_id) then raise exception 'SDP-XAT-006: no eres membre del fil.' using errcode = '42501'; end if;
  if exists (select 1 from public.xat_fils where id = p_fil_id and tipus = 'comunitat') then
    raise exception 'SDP-XAT-011: esta comunitat no admet missatges directes.' using errcode = '42501';
  end if;
  if exists (select 1 from public.xat_fils where id = p_fil_id and tipus = 'canal')
    and not private.es_admin_del_fil(p_fil_id) then
    raise exception 'SDP-XAT-011: només els administradors poden escriure.' using errcode = '42501';
  end if;

  IF p_mime='application/octet-stream' THEN
    PERFORM private.xat_e2ee_exigix(p_fil_id);
    IF NOT private.xat_e2ee_abast(p_fil_id) OR p_durada_ms IS NOT NULL THEN RAISE EXCEPTION 'SDP-XAT-032: adjunt fora d’abast.' USING errcode='22023'; END IF;
    IF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)=0 AND NOT private.xat_e2ee_permes(p_fil_id) THEN
      RAISE EXCEPTION 'SDP-XAT-039: activació no autoritzada.' USING errcode='42501';
    END IF;
  ELSIF (SELECT epoca_actual FROM public.xat_fils WHERE id=p_fil_id)>0 THEN
    RAISE EXCEPTION 'SDP-XAT-031: el fil requerix adjunts xifrats.' USING errcode='42501';
  END IF;
  -- F12 · Format i mida del tipus abans de cap pany.
  if p_id is null or p_bytes is null or p_bytes < 64 or private.xat_maxim_adjunt(p_mime) is null then
    raise exception 'SDP-XAT-009: paràmetre invàlid.' using errcode = '22023';
  end if;
  if p_bytes > private.xat_maxim_adjunt(p_mime) then
    raise exception 'SDP-XAT-020: el fitxer passa del sostre del seu tipus.' using errcode = '23514';
  end if;
  -- Un sol lock per persona, també si puja a dos fils o des de dos dispositius.
  perform pg_advisory_xact_lock(hashtextextended('xat:quota:' || v_jo::text, 0));
  -- La sonda de Storage no pren cap pany (F1) i només admet reserves de menys
  -- de 15 minuts; esta neteja, les d'una hora sense objecte. Si una pujada
  -- lenta encara és en curs, el disparador la fa fallar (R1).
  for v_caduc in select id from public.xat_adjunts
    where usuari_id = v_jo and not publicat and creat_al < now() - interval '1 hour' for update
  loop
    delete from public.xat_adjunts cad where cad.id = v_caduc and not cad.publicat
      and not exists (select 1 from storage.objects o where o.bucket_id = 'xat_adjunts' and o.name = cad.id::text);
  end loop;
  select * into a from public.xat_adjunts where id = p_id for update;
  if found then
    if a.cancellant then raise exception 'SDP-XAT-021: este adjunt s’està descartant.' using errcode = '22023'; end if;
    if a.usuari_id <> v_jo or a.fil_id <> p_fil_id or a.bytes <> p_bytes or a.mime <> p_mime
      or a.durada_ms is distinct from p_durada_ms then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    v_pujat := exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text);
    -- El reintent sense objecte renova la finestra de pujada.
    if not a.publicat and not v_pujat then
      update public.xat_adjunts set creat_al = now() where id = p_id;
    end if;
  else
    -- Gauntlet 261022_0225 (crítica Claude), F2 · Un objecte orfe (compte o
    -- fil esborrat) o ja a la cua de purga no el torna a adoptar ningú.
    if exists (select 1 from public.xat_missatges where id = p_id)
      or exists (select 1 from storage.objects where bucket_id = 'xat_adjunts' and name = p_id::text)
      or exists (select 1 from private.purga_storage_pendent where bucket_id = 'xat_adjunts' and nom = p_id::text) then
      raise exception 'SDP-XAT-008: identificador d’un altre enviament.' using errcode = '42501';
    end if;
    -- Gauntlet 261022_0225 (crítica Claude), F3 i revisió R4 i R5 · Deu
    -- pendents com a molt, amb codi propi (esperar no ajuda: cal enviar-ne o
    -- descartar-ne), i seixanta adjunts vius reservats en l'última hora (una
    -- reserva cancel·lada no compta perquè no deixa res).
    select count(*) filter (where not publicat), count(*) filter (where creat_al > now() - interval '1 hour')
      into v_pendents, v_recents from public.xat_adjunts where usuari_id = v_jo;
    if v_pendents >= 10 then
      raise exception 'SDP-XAT-022: tens massa fitxers pendents d’enviar.' using errcode = '42900';
    end if;
    if v_recents >= 60 then
      raise exception 'SDP-XAT-429: has reservat massa fitxers en poc de temps.' using errcode = '42900';
    end if;
    select coalesce(sum(bytes), 0) + private.xat_bytes_en_purga(v_jo) into v_total from public.xat_adjunts where usuari_id = v_jo;
    if v_total + p_bytes > 250000000 then
      raise exception 'SDP-XAT-020: quota de 250 MB esgotada.' using errcode = '23514';
    end if;
    insert into public.xat_adjunts(id, usuari_id, fil_id, bytes, mime, durada_ms, xifrat)
      values(p_id, v_jo, p_fil_id, p_bytes, p_mime, p_durada_ms, p_mime='application/octet-stream') returning * into a;
    v_pujat := false;
  end if;
  return jsonb_build_object('ruta', p_id::text, 'pujat', v_pujat);
end;
$$;

-- Mateixa llista MIME i branca opaca; només s'eixampla la durada de vídeo.
alter table public.xat_adjunts drop constraint if exists xat_adjunts_format_lot3;
alter table public.xat_adjunts add constraint xat_adjunts_format_lot3 check(coalesce(
  (xifrat and mime='application/octet-stream' and durada_ms is null) or
  (not xifrat and mime in ('image/webp','image/png','image/jpeg','video/mp4','video/webm','video/quicktime','audio/webm','audio/mp4','audio/ogg')
    and ((mime like 'image/%' and durada_ms is null) or (mime like 'video/%' and durada_ms between 1 and 60000)
      or (mime like 'audio/%' and durada_ms>0))),false));

create or replace function public.xat_publica_adjunt(p_id uuid,p_text text,p_resposta_a uuid,p_ubicacio jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_ubicacio jsonb; v_publicat boolean; v_ack jsonb; v_metadades jsonb;
begin
  if p_ubicacio is not null and p_ubicacio<>'null'::jsonb then
    -- Tipus abans de convertir: ni strings, ni bools, ni NaN/Infinity JSON.
    if jsonb_typeof(p_ubicacio)<>'object' or octet_length(p_ubicacio::text)>256 then
      raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode='22023';
    end if;
    if not p_ubicacio ?& array['lat','lng'] or (p_ubicacio-array['lat','lng'])<>'{}'::jsonb
      or jsonb_typeof(p_ubicacio->'lat')<>'number' or jsonb_typeof(p_ubicacio->'lng')<>'number' then
      raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode='22023';
    end if;
    if (p_ubicacio->>'lat')::numeric not between -90 and 90 or (p_ubicacio->>'lng')::numeric not between -180 and 180 then
      raise exception 'SDP-XAT-009: ubicació invàlida.' using errcode='22023';
    end if;
    v_ubicacio:=jsonb_build_object('lat',(p_ubicacio->>'lat')::numeric,'lng',(p_ubicacio->>'lng')::numeric);
  end if;
  -- Mateix ordre de panys que la RPC original: fila, després missatge.
  -- La primera publicació decidix text/GPS. Un reintent només retorna l'ACK.
  select a.publicat into v_publicat from public.xat_adjunts a
    where a.id=p_id and a.usuari_id=(select auth.uid()) for update;
  v_ack:=public.xat_publica_adjunt(p_id,p_text,p_resposta_a);
  if v_publicat is false and v_ubicacio is not null then
    update public.xat_missatges m set metadades=m.metadades||jsonb_build_object('ubicacio',v_ubicacio)
      where m.id=p_id and m.usuari_id=(select auth.uid()) returning m.metadades into v_metadades;
    v_ack:=jsonb_set(v_ack,array['metadades'],v_metadades,false);
  end if;
  return v_ack;
end;
$$;
revoke all on function public.xat_publica_adjunt(uuid,text,uuid,jsonb) from public,anon,service_role;
grant execute on function public.xat_publica_adjunt(uuid,text,uuid,jsonb) to authenticated;

-- SOURCE supabase/migrations/20261118230000_a03_xat_push_credencials_per_configuracio.sql SHA256 5f9f7edeff92735c3b665b89b67595c371a01dfaea6c28baa2df2d2b7939757c

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── 1 · Una credencial per proveïdor i configuració ────────────────────────
create table if not exists private.xat_push_credencials_v2 (
  proveidor text not null
    constraint xat_push_credencials_v2_proveidor_valid check (proveidor in ('apns', 'fcm')),
  empremta  text not null
    constraint xat_push_credencials_v2_empremta_forma check (empremta ~ '^[0-9a-f]{16}$'),
  valor     text not null
    constraint xat_push_credencials_v2_valor_forma check (char_length(valor) between 20 and 4096 and valor ~ '^[A-Za-z0-9._-]+$'),
  caduca_al timestamptz not null,
  constraint xat_push_credencials_v2_pkey primary key (proveidor, empremta)
);
-- RLS sense cap política (com la v1): la credencial només la llig el worker.
alter table private.xat_push_credencials_v2 enable row level security;
revoke all on table private.xat_push_credencials_v2 from public, anon, authenticated, service_role;


-- ── 2 · Les RPC del worker (només service_role) ────────────────────────────
-- La credencial vigent d'una configuració (amb cinc minuts de marge), o null.
create or replace function public.xat_push_credencial_v2(p_proveidor text, p_empremta text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  return (select c.valor from private.xat_push_credencials_v2 c
           where c.proveidor = p_proveidor and c.empremta = p_empremta
             and c.caduca_al > now() + interval '5 minutes');
end;
$$;

-- Desa la credencial d'una configuració només si dura més que la que hi ha.
-- Les caducades del proveïdor s'esborren abans; com a molt quatre vives.
create or replace function public.xat_push_desa_credencial_v2(p_proveidor text, p_empremta text, p_valor text, p_caduca_al timestamptz)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'SDP-PUSH-000: només el servidor.' using errcode = '42501';
  end if;
  if p_proveidor is null or p_proveidor not in ('apns', 'fcm')
     or p_empremta is null or p_empremta !~ '^[0-9a-f]{16}$'
     or p_valor is null or char_length(p_valor) not between 20 and 4096 or p_valor !~ '^[A-Za-z0-9._-]+$'
     or p_caduca_al is null or not isfinite(p_caduca_al)
     or p_caduca_al <= now() or p_caduca_al > now() + interval '65 minutes' then
    raise exception 'SDP-PUSH-005: paràmetre del worker invàlid.' using errcode = '22023';
  end if;
  -- Un sol desament alhora per proveïdor: el sostre de quatre és exacte.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('sdp.xat_push_credencials_v2'), pg_catalog.hashtext(p_proveidor));
  delete from private.xat_push_credencials_v2 c
   where c.proveidor = p_proveidor and c.caduca_al <= now();
  if not exists (select 1 from private.xat_push_credencials_v2 c
                  where c.proveidor = p_proveidor and c.empremta = p_empremta)
     and (select count(*) from private.xat_push_credencials_v2 c where c.proveidor = p_proveidor) >= 4 then
    raise exception 'SDP-PUSH-014: massa configuracions vives del proveïdor.' using errcode = '54000';
  end if;
  insert into private.xat_push_credencials_v2 as c (proveidor, empremta, valor, caduca_al)
  values (p_proveidor, p_empremta, p_valor, p_caduca_al)
  on conflict (proveidor, empremta) do update
    set valor = excluded.valor, caduca_al = excluded.caduca_al
    where c.caduca_al < excluded.caduca_al;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;


-- ── 3 · Qui pot cridar què ──────────────────────────────────────────────────
revoke all on function public.xat_push_credencial_v2(text, text) from public, anon, authenticated, service_role;
revoke all on function public.xat_push_desa_credencial_v2(text, text, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.xat_push_credencial_v2(text, text) to service_role;
grant execute on function public.xat_push_desa_credencial_v2(text, text, text, timestamptz) to service_role;

notify pgrst, 'reload schema';

-- SOURCE supabase/snippets/r32_10_xat_privades_rls_repara.sql SHA256 da5be152d1be21c8e1de21ec031c189d6489205e757db5bd3f6f5cf41778aa69

set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732100000);
do $r3210_rls$
declare t record; c record; v_oid oid; v_role text;
begin
  for t in select * from (values
    ('private.xat_fils_fusionats'), ('private.xat_fusions_pendents')
  ) as wanted(relation) loop
    v_oid := pg_catalog.to_regclass(t.relation);
    if v_oid is null or not exists(select 1 from pg_catalog.pg_class where oid=v_oid and relkind='r') then
      raise exception 'SDP-R3210-RLS-001: falta taula interna %',t.relation using errcode='55000';
    end if;
    if exists(select 1 from pg_catalog.pg_policy where polrelid=v_oid) then
      raise exception 'SDP-R3210-RLS-002: política no revisada %',t.relation using errcode='55000';
    end if;
    if exists(select 1 from pg_catalog.pg_class x cross join lateral pg_catalog.aclexplode(x.relacl) a
      where x.oid=v_oid and a.grantee<>x.relowner and a.grantee<>0
        and a.grantee not in (select oid from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role')))
      or exists(select 1 from pg_catalog.pg_attribute x cross join lateral pg_catalog.aclexplode(x.attacl) a
        join pg_catalog.pg_class rel on rel.oid=x.attrelid
        where x.attrelid=v_oid and a.grantee<>rel.relowner and a.grantee<>0
          and a.grantee not in (select oid from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role'))) then
      raise exception 'SDP-R3210-RLS-003: ACL desconeguda %',t.relation using errcode='55000';
    end if;
  end loop;
  alter table private.xat_fils_fusionats enable row level security;
  alter table private.xat_fusions_pendents enable row level security;
  revoke all on private.xat_fils_fusionats,private.xat_fusions_pendents from public,anon,authenticated,service_role;
  -- REVOKE ON TABLE no retira concessions individuals de columna.
  for c in select attrelid,attname from pg_catalog.pg_attribute
    where attrelid in ('private.xat_fils_fusionats'::regclass,'private.xat_fusions_pendents'::regclass)
      and attnum>0 and not attisdropped and attacl is not null loop
    execute pg_catalog.format('revoke all (%I) on table %s from public,anon,authenticated,service_role',c.attname,c.attrelid::regclass);
  end loop;
  foreach v_role in array array['anon','authenticated','service_role'] loop
    for t in select * from (values('private.xat_fils_fusionats'),('private.xat_fusions_pendents')) as wanted(relation) loop
      if pg_catalog.has_table_privilege(v_role,t.relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or pg_catalog.has_any_column_privilege(v_role,t.relation,'SELECT,INSERT,UPDATE,REFERENCES') then
        raise exception 'SDP-R3210-RLS-004: privilegi heretat encara actiu % %',v_role,t.relation using errcode='55000';
      end if;
    end loop;
  end loop;
end $r3210_rls$;

-- SOURCE supabase/snippets/r32_10_fossils_acl_enduriment.sql SHA256 078416d9457502dcedda50154e72112b95ee2c9d5ca99f377611be703e692913

set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_catalog.pg_advisory_xact_lock(1935960372, 1732000000);
create table if not exists private.r3210_fossils_acl_backup (
 signature text primary key, function_oid oid not null, owner_oid oid not null,
 definition_hash text not null, before_acl text, after_acl text not null,
 captured_at timestamptz not null default now()
);
alter table private.r3210_fossils_acl_backup enable row level security;
revoke all on private.r3210_fossils_acl_backup from public,anon,authenticated,service_role;
do $r3210_acl$
declare v record; p record; old private.r32_fossils_backup%rowtype;
 saved private.r3210_fossils_acl_backup%rowtype; v_oid oid; v_hash text; v_before text;
begin
 for v in select * from (values
  ('public.check_market_rate_limit()',true),
  ('public.clean_expired_push_subscriptions()',false),
  ('public.log_push_notification(uuid,text,jsonb,boolean,text)',false),
  ('public.mark_messages_as_read(uuid,uuid)',false),
  ('public.omega_invalidate_stale_translations()',true),
  ('public.omega_set_default_parent_id()',true),
  ('public.refresh_entity_member_map()',true)
 ) as wanted(signature,is_trigger) loop
  v_oid:=pg_catalog.to_regprocedure(v.signature);
  if v_oid is null and not exists(select 1 from private.r32_fossils_backup where signature=v.signature)
      and not exists(select 1 from private.r3210_fossils_acl_backup where signature=v.signature) then continue; end if;
    select * into p from pg_catalog.pg_proc where oid=v_oid;
  select * into old from private.r32_fossils_backup where signature=v.signature;
  if v_oid is null or old.signature is null or old.function_oid is distinct from v_oid or old.owner_oid is distinct from p.proowner
    or not p.prosecdef or p.prokind<>'f' or (v.is_trigger and p.prorettype<>'pg_catalog.trigger'::regtype)
    or not coalesce(p.proconfig @> array['search_path=""']::text[],false) then
   raise exception 'SDP-R3210-ACL-001: identitat/backup/path no revisats %',v.signature using errcode='55000';
  end if;
  v_hash:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(v_oid),'UTF8')),'hex');
  if v_hash is distinct from old.after_definition_hash
    or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') is distinct from old.after_hash then
   raise exception 'SDP-R3210-ACL-002: DDL divergent %',v.signature using errcode='55000';
  end if;
  select * into saved from private.r3210_fossils_acl_backup where signature=v.signature;
  if found then
   if saved.function_oid is distinct from v_oid or saved.owner_oid is distinct from p.proowner or saved.definition_hash is distinct from v_hash or saved.after_acl is distinct from p.proacl::text then
    raise exception 'SDP-R3210-ACL-003: deriva posterior %',v.signature using errcode='55000';
   end if;
  else
  if p.proacl::text is distinct from old.acl_text or exists(
    select 1 from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
    where a.grantee<>p.proowner and (a.is_grantable or (a.grantee<>0 and a.grantee not in(
      select oid from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role'))))) then
   raise exception 'SDP-R3210-ACL-004: ACL inicial no revisada %',v.signature using errcode='55000';
  end if;
  v_before:=p.proacl::text;
  execute pg_catalog.format('revoke all on function %s from public,anon,authenticated',v_oid::regprocedure);
  if v.is_trigger then
   execute pg_catalog.format('revoke all on function %s from service_role',v_oid::regprocedure);
  end if;
  insert into private.r3210_fossils_acl_backup(signature,function_oid,owner_oid,definition_hash,before_acl,after_acl)
   select v.signature,v_oid,p.proowner,v_hash,v_before,proacl::text from pg_catalog.pg_proc where oid=v_oid;
  end if;
  -- ACLs efectives, inclosa herència de rols: REVOKE directe no la retira.
  if pg_catalog.has_function_privilege('anon',v_oid,'EXECUTE') is distinct from false
    or pg_catalog.has_function_privilege('authenticated',v_oid,'EXECUTE') is distinct from false
    or (v.is_trigger and pg_catalog.has_function_privilege('service_role',v_oid,'EXECUTE') is distinct from false) then
   raise exception 'SDP-R3210-ACL-005: EXECUTE heretat encara actiu %',v.signature using errcode='55000';
  end if;
 end loop;
end $r3210_acl$;
notify pgrst, 'reload schema';

-- SOURCE supabase/snippets/r32_13_pf03_crdt_ack_i_lssi_denuncies.sql SHA256 871b7bdc23588e4c697837cac236627ed5d14ea8b2174a8484381fbe0198e57d

set local lock_timeout='5s';
set local statement_timeout='60s';
-- Preserve the caller's search_path. Static R6 rejects session path mutation;
-- Routine tables and DDL default calls are explicitly qualified; each routine
-- retains its own empty path. Casts, signatures and variable types are qualified.
-- Refuse migration caller namespace orders that can shadow DDL operators.
-- A temporary namespace is permitted: all used builtin types are qualified.
do $r3213_caller$
begin
 if (select x.schema_name from pg_catalog.unnest(pg_catalog.current_schemas(true)) with ordinality as x(schema_name,ordinal)
     where x.schema_name is distinct from (select n.nspname from pg_catalog.pg_namespace n where n.oid=pg_catalog.pg_my_temp_schema())
     order by x.ordinal limit 1) is distinct from 'pg_catalog'
 then
  raise exception using errcode='55000',message='SDP-R3213-CALLER-SCHEMA';
 end if;
end;
$r3213_caller$;

create table if not exists private.r3213_crdt_captures (
 tenant_id pg_catalog.uuid not null references public.towns(id) on delete cascade,
 owner_id pg_catalog.uuid not null references auth.users(id) on delete cascade,
 request_id pg_catalog.text not null check(request_id ~ '^[A-Za-z0-9_-]{1,128}$'),
 canonical_capture pg_catalog.text not null check(pg_catalog.octet_length(canonical_capture)<=4194304),
 capture_sha256 pg_catalog.text not null check(capture_sha256 ~ '^[a-f0-9]{64}$'),
 frontier pg_catalog.jsonb not null check(pg_catalog.jsonb_typeof(frontier)='array'),
 confirmed_at pg_catalog.timestamptz not null,
 primary key(tenant_id,owner_id,request_id)
);
alter table private.r3213_crdt_captures enable row level security;
revoke all on private.r3213_crdt_captures from public,anon,authenticated,service_role;

create table if not exists private.r3213_crdt_dots (
 tenant_id pg_catalog.uuid not null references public.towns(id) on delete cascade,
 owner_id pg_catalog.uuid not null references auth.users(id) on delete cascade,
 dot pg_catalog.text not null, operation pg_catalog.jsonb not null,
 primary key(tenant_id,owner_id,dot)
);
alter table private.r3213_crdt_dots enable row level security;
revoke all on private.r3213_crdt_dots from public,anon,authenticated,service_role;

create or replace function public.confirma_captura_crdt_rural(p_tenant pg_catalog.uuid,p_request pg_catalog.text,p_capture pg_catalog.text,p_sha256 pg_catalog.text,p_frontier pg_catalog.jsonb)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); old private.r3213_crdt_captures; moment pg_catalog.timestamptz; capture pg_catalog.jsonb; frontier pg_catalog.jsonb; op pg_catalog.jsonb; opdot pg_catalog.text;
begin
 if who is null or not coalesce(private.copub_compte_actiu(who),false) or not coalesce(private.is_town_member(p_tenant),false) then
  raise exception using errcode='42501',message='SDP-PF03-403';
 end if;
 if p_tenant is null or p_request is null or p_request !~ '^[A-Za-z0-9_-]{1,128}$' or p_capture is null
  or pg_catalog.octet_length(p_capture)>4194304 or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$'
  or p_frontier is null or pg_catalog.jsonb_typeof(p_frontier)<>'array' or jsonb_array_length(p_frontier)>2048 then
  raise exception using errcode='22023',message='SDP-PF03-400';
 end if;
 capture:=p_capture::pg_catalog.jsonb;
 if pg_catalog.jsonb_typeof(capture)<>'object' or capture->>'schema' is distinct from 'sdp.rural.rga-mv-dag.v1'
  or pg_catalog.jsonb_typeof(capture->'ops') is distinct from 'array' or jsonb_array_length(capture->'ops')>2048
  or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_capture,'UTF8')),'hex')<>p_sha256
  or exists(select 1 from jsonb_array_elements(p_frontier) x where pg_catalog.jsonb_typeof(x)<>'string') then
  raise exception using errcode='22023',message='SDP-PF03-400';
 end if;
 -- Verify the frontier against the actual durable operation set. DAG validity
 -- and JCS canonicalization are additionally checked by the neutral CRDT client.
 select coalesce(jsonb_agg(dot order by dot collate "C"),'[]'::pg_catalog.jsonb) into frontier from (
  select (o->>'replica')||':'||(o->>'comptador') dot from jsonb_array_elements(capture->'ops') o
  except select p from jsonb_array_elements(capture->'ops') o cross join lateral jsonb_array_elements_text(o->'parents') p
 ) heads;
 if frontier<>p_frontier then raise exception using errcode='22023',message='SDP-PF03-FRONTIER'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('sdp:pf03:'||p_tenant::pg_catalog.text||':'||who::pg_catalog.text,0));
 -- Never overwrite a DOT even when another device submits a disjoint capture.
 for op in select value from jsonb_array_elements(capture->'ops') loop
  opdot:=(op->>'replica')||':'||(op->>'comptador');
  if opdot is null or pg_catalog.char_length(opdot)>82 or exists(select 1 from private.r3213_crdt_dots x
    where x.tenant_id=p_tenant and x.owner_id=who and x.dot=opdot and x.operation<>op) then
   raise exception using errcode='40001',message='SDP-PF03-DOT-EQUIVOCATION';
  end if;
  insert into private.r3213_crdt_dots values(p_tenant,who,opdot,op) on conflict do nothing;
 end loop;
 select * into old from private.r3213_crdt_captures where tenant_id=p_tenant and owner_id=who and request_id=p_request;
 if found then
  if old.canonical_capture<>p_capture or old.capture_sha256<>p_sha256 or old.frontier<>p_frontier then
   raise exception using errcode='40001',message='SDP-PF03-REPLAY-CONFLICT';
  end if;
  moment:=old.confirmed_at;
 else
  select greatest(pg_catalog.date_trunc('milliseconds',pg_catalog.clock_timestamp()),coalesce(max(confirmed_at)+'1 millisecond'::pg_catalog.interval,'-infinity'::pg_catalog.timestamptz)) into moment
   from private.r3213_crdt_captures where tenant_id=p_tenant and owner_id=who;
  insert into private.r3213_crdt_captures values(p_tenant,who,p_request,p_capture,p_sha256,p_frontier,moment);
 end if;
 -- Authority is bound to the authenticated transport's configured HTTPS origin,
 -- never supplied by the caller. The adapter supplies it after validating RPC.
 return jsonb_build_object('requestId',p_request,'sha256',p_sha256,'frontera',p_frontier,
  'confirmatEl',to_char(moment at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'ack_remot_confirmat',true);
end; $$;
revoke all on function public.confirma_captura_crdt_rural(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.jsonb) from public,anon,authenticated,service_role;
grant execute on function public.confirma_captura_crdt_rural(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.jsonb) to authenticated;

create table if not exists private.r3213_lssi_flux (
 denuncia_id pg_catalog.uuid primary key references public.denuncies(id) on delete cascade,
 estat pg_catalog.text not null check(estat in('rebuda','en_revisio','ocultacio_cautelar','arxivada','resolta')),
 versio pg_catalog.int4 not null check(versio>=1),
 modificada_al pg_catalog.timestamptz not null default pg_catalog.clock_timestamp()
);
create table if not exists private.r3213_lssi_audit (
 id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
 denuncia_id pg_catalog.uuid not null references public.denuncies(id) on delete cascade,
 actor_id pg_catalog.uuid references auth.users(id) on delete set null,
 anterior pg_catalog.text,
 estat pg_catalog.text not null check(estat in('rebuda','en_revisio','ocultacio_cautelar','arxivada','resolta')),
 justificacio pg_catalog.text not null check(pg_catalog.char_length(justificacio) between 1 and 2000),
 creat_al pg_catalog.timestamptz not null default pg_catalog.clock_timestamp()
);
-- Receipts contain a request digest rather than a duplicate of personal text.
-- Account deletion removes authenticated replay keys; anonymous receipts keep
-- the existing IP-bucket retention policy and carry no actor_id.
create table if not exists private.r3213_lssi_rebuts (
 subjecte pg_catalog.text not null, operacio_id pg_catalog.uuid not null,
 peticio_sha256 pg_catalog.text not null check(peticio_sha256 ~ '^[a-f0-9]{64}$'), rebut pg_catalog.jsonb not null,
 actor_id pg_catalog.uuid references auth.users(id) on delete cascade,
 primary key(subjecte,operacio_id)
);
alter table private.r3213_lssi_flux enable row level security;
alter table private.r3213_lssi_audit enable row level security;
alter table private.r3213_lssi_rebuts enable row level security;
revoke all on private.r3213_lssi_flux,private.r3213_lssi_audit,private.r3213_lssi_rebuts from public,anon,authenticated,service_role;
-- No raw table SELECT (including IP / complainant) is added. All DTOs are explicit.

-- Both old and new transports share one workflow. This trigger observes
-- legacy human decisions too; it cannot authorize a decision by itself.
create or replace function private.r3213_lssi_sync() returns pg_catalog.trigger language plpgsql volatile security definer set search_path='' as $$
declare f private.r3213_lssi_flux; target pg_catalog.text; reason pg_catalog.text;
begin
 if new.objecte_tipus not in('publicacio','producte','esdeveniment') or not exists(select 1 from public.section_submissions x where x.id::pg_catalog.text=new.objecte_id and x.visibility='public') then return new; end if;
 target:=case new.estat when 'pendent' then 'rebuda' when 'retirada' then 'ocultacio_cautelar' when 'desestimada' then 'arxivada' else 'resolta' end;
 if tg_op='INSERT' then
  insert into private.r3213_lssi_flux values(new.id,target,1,pg_catalog.clock_timestamp());
  insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(new.id,auth.uid(),target,'Denúncia rebuda; pendent de revisió humana.');
 else
  select * into f from private.r3213_lssi_flux where denuncia_id=new.id for update;
  if not found then
   insert into private.r3213_lssi_flux values(new.id,target,1,pg_catalog.clock_timestamp());
   insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(new.id,auth.uid(),target,'Revisió de denúncia històrica.');
  elsif f.estat<>target and not(new.estat='pendent' and f.estat='en_revisio') then
   select justificacio into reason from private.lssi_revisions where denuncia_id=new.id;
   update private.r3213_lssi_flux set estat=target,versio=versio+1,modificada_al=pg_catalog.clock_timestamp() where denuncia_id=new.id;
   insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(new.id,auth.uid(),f.estat,target,coalesce(reason,'Revisió humana mitjançant el transport anterior.'));
  end if;
 end if;
 return new;
end; $$;
revoke all on function private.r3213_lssi_sync() from public,anon,authenticated,service_role;
do $r3214_trigger$ begin
 if not exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.denuncies'::pg_catalog.regclass and tgname='r3213_lssi_insercio') then
  create trigger r3213_lssi_insercio after insert on public.denuncies for each row execute function private.r3213_lssi_sync();
 end if;
end $r3214_trigger$;
do $r3214_trigger$ begin
 if not exists(select 1 from pg_catalog.pg_trigger where tgrelid='public.denuncies'::pg_catalog.regclass and tgname='r3213_lssi_decisio') then
  create trigger r3213_lssi_decisio after update of estat on public.denuncies for each row when(old.estat is distinct from new.estat) execute function private.r3213_lssi_sync();
 end if;
end $r3214_trigger$;
-- Existing cases are imported with their existing state, not reset to pending.
insert into private.r3213_lssi_flux(denuncia_id,estat,versio)
 select d.id,case d.estat when 'pendent' then 'rebuda' when 'retirada' then 'ocultacio_cautelar' when 'desestimada' then 'arxivada' else 'resolta' end,1
 from public.denuncies d join public.section_submissions x on x.id::pg_catalog.text=d.objecte_id
 where x.visibility='public' and d.objecte_tipus in('publicacio','producte','esdeveniment') on conflict(denuncia_id) do nothing;
insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio)
 select f.denuncia_id,null,f.estat,'Importació de l’estat de la denúncia anterior; cap decisió nova.' from private.r3213_lssi_flux f where not exists(select 1 from private.r3213_lssi_audit a where a.denuncia_id=f.denuncia_id);

create index if not exists r3213_denuncies_ip_rafega on public.denuncies(ip_hash,creat_al);

-- Existing own-row RLS is preserved. Table grants cannot expose IP hashes,
-- complainant identity or private authorship through SELECT *.
revoke select on public.denuncies from public,anon,authenticated;
grant select(id,tenant_id,objecte_tipus,objecte_id,motiu,detall,estat,creat_al,revisada_al) on public.denuncies to authenticated;

create or replace function private.denuncies_abans_insercio()
returns pg_catalog.trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo    pg_catalog.uuid := (select auth.uid());
  v_ip    pg_catalog.text := private.empremta_ip_moderacio();
  v_n     pg_catalog.int4;
  v_maxim pg_catalog.int4;
  v_total pg_catalog.int4;
begin
  new.id := pg_catalog.gen_random_uuid();
  new.denunciant := v_jo;
  new.estat := 'pendent';
  new.creat_al := now();
  new.revisada_al := null;
  new.ip_hash := v_ip;
  new.detall := nullif(btrim(new.detall), '');

  perform pg_advisory_xact_lock(hashtextextended('denuncies:' || coalesce(v_jo::pg_catalog.text, v_ip, 'anon'), 0));
  if v_jo is not null and exists(select 1 from public.denuncies d where d.denunciant=v_jo and d.estat='pendent' and d.objecte_tipus=new.objecte_tipus and d.objecte_id=new.objecte_id) then return null; end if;
  -- All insertion paths (RPC and raw insert) share the same quota. The IP
  -- is derived from the trusted ingress headers, never a function parameter.
  perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:ip:' || coalesce(v_ip,'shared'),0));
  if (v_jo is not null and (select count(*) from public.denuncies d where d.denunciant=v_jo and d.creat_al>pg_catalog.clock_timestamp()-'1 minute'::pg_catalog.interval)>=5)
    or (select count(*) from public.denuncies d where d.ip_hash is not distinct from v_ip and d.creat_al>pg_catalog.clock_timestamp()-'1 minute'::pg_catalog.interval)>=10 then
    raise exception using errcode='42900',message='SDP-LSSI-429';
  end if;
  if v_jo is not null then
    if exists (select 1 from public.denuncies d
                where d.denunciant = v_jo and d.estat = 'pendent'
                  and d.objecte_tipus = new.objecte_tipus and d.objecte_id = new.objecte_id) then
      return null;   -- Ja l'havia denunciada i està pendent: no es repetix (row_count 0).
    end if;
    select count(*) into v_n from public.denuncies d
     where d.denunciant = v_jo and d.creat_al > now() - '1 hour'::pg_catalog.interval;
    v_maxim := 20;
  else
    -- Fase D (261020, revisió) · El sostre comú de les anònimes, sota un sol
    -- pany: cap IP nova (ni cap capçalera inventada) no el passa.
    perform pg_advisory_xact_lock(hashtextextended('denuncies:anon-global', 0));
    select count(*) into v_total from public.denuncies d
     where d.denunciant is null and d.creat_al > now() - '1 hour'::pg_catalog.interval;
    if v_total >= 300 then
      raise exception 'SDP-MOD-429: ara mateix hi ha massa denúncies anònimes. Entra per a denunciar.' using errcode = '42900';
    end if;
    select count(*) into v_n from public.denuncies d
     where d.denunciant is null and d.ip_hash is not distinct from v_ip
       and d.creat_al > now() - '1 hour'::pg_catalog.interval;
    v_maxim := case when v_ip is null then 50 else 10 end;
  end if;
  if v_n >= v_maxim then
    raise exception 'SDP-MOD-429: has enviat massa denúncies en poc de temps.' using errcode = '42900';
  end if;
  return new;
end;
$$;
revoke execute on function private.denuncies_abans_insercio() from public, anon, authenticated;

drop trigger if exists denuncies_abans_insercio on public.denuncies;
create trigger denuncies_abans_insercio before insert on public.denuncies
  for each row execute function private.denuncies_abans_insercio();

create or replace function public.registra_denuncia_diligent(p_publicacio pg_catalog.uuid,p_motiu pg_catalog.text,p_detall pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); ip pg_catalog.text:=private.empremta_ip_moderacio(); subject pg_catalog.text; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; did pg_catalog.uuid; result pg_catalog.jsonb; tip pg_catalog.text;
begin
 if who is not null and not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_publicacio is null or p_operacio is null or p_motiu is null or p_motiu not in('ofensiu','spam_frau','desinformacio','altre')
  or p_detall is null or pg_catalog.char_length(btrim(p_detall)) not between 1 and 1000 then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:=coalesce(who::pg_catalog.text,'anon:'||coalesce(ip,'shared'));
 req:=jsonb_build_object('publicacio',p_publicacio,'motiu',p_motiu,'detall',btrim(p_detall));
 perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||jsonb_build_object('repetida',true);
 end if;
 perform public.denuncia_publicacio_mur(p_publicacio,p_motiu,btrim(p_detall));
 select d.id,d.objecte_tipus into did,tip from public.denuncies d where d.objecte_id=p_publicacio::pg_catalog.text
  and d.objecte_tipus in('publicacio','producte','esdeveniment') and d.denunciant is not distinct from who
  and (who is not null or d.ip_hash is not distinct from ip) and d.estat='pendent' order by d.creat_al desc,d.id limit 1;
 if did is null then raise exception using errcode='55000',message='SDP-LSSI-NO-RECEIPT'; end if;
 insert into private.r3213_lssi_flux values(did,'rebuda',1,pg_catalog.clock_timestamp()) on conflict do nothing;
 if not exists(select 1 from private.r3213_lssi_audit where denuncia_id=did) then
  insert into private.r3213_lssi_audit(denuncia_id,actor_id,estat,justificacio) values(did,who,'rebuda','Denúncia rebuda; pendent de revisió humana.');
 end if;
 select jsonb_build_object('id',did,'estat',f.estat,'versio',f.versio,'repetida',false) into result from private.r3213_lssi_flux f where f.denuncia_id=did;
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.registra_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) from public,anon,authenticated,service_role;
grant execute on function public.registra_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) to anon,authenticated;

create or replace function public.revisa_denuncia_diligent(p_id pg_catalog.uuid,p_estat_esperat pg_catalog.text,p_versio pg_catalog.int4,p_estat pg_catalog.text,p_justificacio pg_catalog.text,p_operacio pg_catalog.uuid)
returns pg_catalog.jsonb language plpgsql volatile security definer set search_path='' as $$
declare who pg_catalog.uuid:=auth.uid(); f private.r3213_lssi_flux; d public.denuncies; s public.section_submissions; req pg_catalog.jsonb; prev private.r3213_lssi_rebuts; subject pg_catalog.text; result pg_catalog.jsonb;
begin
 if who is null or not coalesce(private.es_superadmin(),false) or not coalesce(private.copub_compte_actiu(who),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_id is null or p_operacio is null or p_versio is null or p_versio<1 or p_justificacio is null or pg_catalog.char_length(btrim(p_justificacio)) not between 1 and 2000
  or p_estat_esperat is null or p_estat is null or not ((p_estat_esperat='rebuda' and p_estat in('en_revisio','arxivada'))
   or (p_estat_esperat='en_revisio' and p_estat in('ocultacio_cautelar','arxivada','resolta'))
   or (p_estat_esperat='ocultacio_cautelar' and p_estat in('resolta','arxivada'))) then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 subject:='review:'||who::pg_catalog.text;
 req:=jsonb_build_object('id',p_id,'estatEsperat',p_estat_esperat,'versio',p_versio,'estat',p_estat,'justificacio',btrim(p_justificacio));
 perform pg_advisory_xact_lock(hashtextextended('sdp:lssi:subject:'||subject,0));
 select * into prev from private.r3213_lssi_rebuts where subjecte=subject and operacio_id=p_operacio;
 if found then
  if prev.peticio_sha256<>pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex') then raise exception using errcode='40001',message='SDP-LSSI-REPLAY-CONFLICT'; end if;
  return prev.rebut||jsonb_build_object('repetida',true);
 end if;
 select * into d from public.denuncies where id=p_id for update;
 select * into f from private.r3213_lssi_flux where denuncia_id=p_id for update;
 if not found or d.objecte_tipus not in('publicacio','producte','esdeveniment') then raise exception using errcode='22023',message='SDP-LSSI-404'; end if;
 if f.estat<>p_estat_esperat or f.versio<>p_versio then raise exception using errcode='40001',message='SDP-LSSI-409'; end if;
 if p_estat='ocultacio_cautelar' then
  perform pg_advisory_xact_lock(hashtextextended('sdp:mur:'||d.objecte_id,0));
  select * into s from public.section_submissions where id::pg_catalog.text=d.objecte_id and visibility='public' for update;
  if not found then raise exception using errcode='22023',message='SDP-LSSI-404'; end if;
  if s.moderation_state<>'visible' or s.deleted_at is not null or exists(select 1 from private.mur_publicacions_revocades where submission_id=s.id) then
   raise exception using errcode='40001',message='SDP-LSSI-409';
  end if;
  update public.section_submissions set moderation_state='retirada_cautelar' where id=s.id;
 end if;
 update private.r3213_lssi_flux set estat=p_estat,versio=versio+1,modificada_al=pg_catalog.clock_timestamp() where denuncia_id=p_id;
 insert into private.r3213_lssi_audit(denuncia_id,actor_id,anterior,estat,justificacio) values(p_id,who,f.estat,p_estat,btrim(p_justificacio));
 -- Closing a case never silently restores a withdrawn resource.
 update public.denuncies set estat=case p_estat when 'arxivada' then 'desestimada' when 'resolta' then 'revisada' when 'ocultacio_cautelar' then 'retirada' else 'pendent' end,
  revisada_al=case when p_estat in('arxivada','resolta','ocultacio_cautelar') then pg_catalog.clock_timestamp() else null end where id=p_id;
 result:=jsonb_build_object('id',p_id,'estat',p_estat,'versio',f.versio+1,'repetida',false);
 insert into private.r3213_lssi_rebuts values(subject,p_operacio,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(req::pg_catalog.text,'UTF8')),'hex'),result,who);
 return result;
end; $$;
revoke all on function public.revisa_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) from public,anon,authenticated,service_role;
grant execute on function public.revisa_denuncia_diligent(pg_catalog.uuid,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.uuid) to authenticated;

create or replace function public.llista_denuncies_diligents(p_estat pg_catalog.text,p_limit pg_catalog.int4 default 50)
returns pg_catalog.jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.es_superadmin(),false) or not coalesce(private.copub_compte_actiu(auth.uid()),false) then raise exception using errcode='42501',message='SDP-LSSI-403'; end if;
 if p_estat is null or p_estat not in('rebuda','en_revisio','ocultacio_cautelar','arxivada','resolta') or p_limit is null or p_limit not between 1 and 100 then raise exception using errcode='22023',message='SDP-LSSI-400'; end if;
 return (select coalesce(jsonb_agg(x.fila order by x.creat_al,x.id),'[]'::pg_catalog.jsonb) from (
  select d.id,d.creat_al,jsonb_build_object('id',d.id,'publicacioId',d.objecte_id,'motiu',d.motiu,'detall',d.detall,'estat',f.estat,'versio',f.versio) fila
  from private.r3213_lssi_flux f join public.denuncies d on d.id=f.denuncia_id
  where f.estat=p_estat and d.objecte_tipus in('publicacio','producte','esdeveniment') order by d.creat_al,d.id limit p_limit) x);
end; $$;
revoke all on function public.llista_denuncies_diligents(pg_catalog.text,pg_catalog.int4) from public,anon,authenticated,service_role;
grant execute on function public.llista_denuncies_diligents(pg_catalog.text,pg_catalog.int4) to authenticated;
notify pgrst,'reload schema';

-- SOURCE supabase/migrations/20261119143000_r32_14_xat_fils_previa_sense_amagats.sql SHA256 a030604331e272f6560579c264d94f6ac763d2faa1e94db5e5a3fdfe154dd1b0

set local lock_timeout='5s';
set local statement_timeout='60s';
do $r3214_preview_preflight$
begin
 if pg_catalog.to_regclass('public.xat_missatges_amagats') is null
   or pg_catalog.to_regprocedure('public.xat_fils_meus(uuid)') is null then
  raise exception 'SDP-R3214-PREVIEW-DEPENDENCY' using errcode='55000';
 end if;
 if not exists(select 1 from pg_catalog.pg_proc p where p.oid=pg_catalog.to_regprocedure('public.xat_fils_meus(uuid)')
   and p.prosecdef and p.provolatile='v' and p.proconfig=array['search_path=""']::text[]
   and pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') in (
    '1f2a329adf5b165c7941fa693615fe4211c6d85e4f0fbda6077f26f1691a97ac',
    '17a5b8b1beee4921a9e771f0fa16632803babc7b6a076d03e485759eae0ea4c4')) then
  raise exception 'SDP-R3214-DRIFT: xat_fils_meus' using errcode='55000';
 end if;
end $r3214_preview_preflight$;
CREATE OR REPLACE FUNCTION public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamptz,
  altres_noms text[], ultim_text text, ultim_al timestamptz, ultim_autor_id uuid,
  ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint,
  llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamptz,
  fixat_al timestamptz, silenciat_fins_al timestamptz, preferit_al timestamptz,
  no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb,
  comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text,
  subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint, canal_clau text,
  rebut_pels_altres_fins_seq bigint
)
language plpgsql volatile security definer SET search_path = ''
as $$
#variable_conflict use_column
begin
  if (select auth.uid()) is null then
    raise exception 'SDP-XAT-001: cal iniciar sessió.' using errcode='42501';
  end if;
  -- R22 · Beta reconciliation is best effort only for the two expected
  -- configuration outcomes, which roll back just this block while the inbox
  -- keeps listing direct, own and existing threads:
  --   · 23514 raised as SDP-XAT-018 (incoherent channel, for example after
  --     rotating the institutional principal);
  --   · 55P03 lock_not_available (lock_timeout while another session holds
  --     the per-town lock); the next listing retries.
  -- R22 (ronda 3) · Each warning carries the real SQLSTATE (as its code and in
  -- the text) and only SDP-XAT-018 keeps that label. Any other error, also a
  -- 23514 from another check, 23505, 40001, 40P01 or a code bug, propagates
  -- with its own SQLSTATE. statement_timeout (57014) is never caught here.
  begin
    perform private.xat_reconcilia_beta_testers(p_tenant_id);
  exception
    when check_violation then
      if sqlerrm not like 'SDP-XAT-018:%' then raise; end if;
      raise warning using errcode = sqlstate,
        message = format('SDP-XAT-018: reconciliació del canal Beta omesa (SQLSTATE %s).', sqlstate);
    when lock_not_available then
      raise warning using errcode = sqlstate,
        message = format('Canal Beta: reconciliació ajornada, pany per poble ocupat (SQLSTATE %s).', sqlstate);
  end;
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
    -- R24 · Abans, el mínim de tots els altres vigents (també la IAIA i qui ha
    -- eixit); ara el del helper, el mateix conjunt que el rebut (D-1).
    coalesce(ca.llegit_altres, 0),
    greatest(0, f.ultim_seq - greatest(jo.llegit_fins_seq, jo.buidat_fins_seq))::integer,
    jo.arxivat_al, jo.fixat_al, jo.silenciat_fins_al, jo.preferit_al, jo.no_llegit_manual,
    f.org_id, o.name, jo.com_org_id is not null, coalesce(costat.dades, '[]'::jsonb),
    f.comunitat_id, f.subjecte_tipus, f.subjecte_id, f.subjecte_ruta, f.subjecte_titol, f.subjecte_uri,
    jo.rol,
    (select count(*)::integer from public.xat_participants p
      where p.fil_id = f.id and p.visible_fins_seq is null),
    u.tipus, f.epoca_actual, f.cap_epoca_hash, f.e2ee_des_de_seq, f.canal_clau,
    -- R24 · Columna nova, al final: el rebut d'entrega dels altres (✓✓ gris).
    coalesce(ca.rebut_altres, 0)
  from public.xat_fils f
  join public.xat_participants jo on jo.fil_id = f.id and jo.usuari_id = (select auth.uid())
    and jo.visible_fins_seq is null
  left join public.organizations o on o.id = f.org_id
  left join lateral private.xat_cursors_altres(f.id, (select auth.uid())) ca on true
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
      where p.fil_id = f.id and (p.usuari_id <> (select auth.uid()) or f.propi_usuari_id = (select auth.uid()))
        and p.visible_fins_seq is null and private.xat_participant_vigent(f.id, p.usuari_id)
        and (f.org_id is null or (jo.com_org_id is not null and p.com_org_id is null))
        and f.subjecte_tipus is null
    ) c
  ) costat on true
  left join lateral (
    select m.text, m.creat_al, m.usuari_id, m.tipus from public.xat_missatges m
    where m.fil_id = f.id and m.seq > greatest(jo.visible_des_de_seq, jo.buidat_fins_seq)
      and (m.caduca_al is null or m.caduca_al > now())
      and m.esborrat_al is null
      and not exists (select 1 from public.xat_missatges_amagats a
        where a.usuari_id = (select auth.uid()) and a.missatge_id = m.id)
    order by m.seq desc, m.id desc limit 1
  ) u on true
  where f.tenant_id = p_tenant_id and private.xat_participant_vigent(f.id, (select auth.uid()))
  order by (jo.fixat_al is not null) desc, coalesce(u.creat_al, f.actualitzat_al) desc;
end;
$$;
revoke all on function public.xat_fils_meus(uuid) from public, anon;
grant execute on function public.xat_fils_meus(uuid) to authenticated;

notify pgrst, 'reload schema';
-- Strict SQL contract: captured native18.6/PGlite shapes; owner anchored to xat_fils.
-- NOT NULL is checked via pg_attribute across PG versions; indexes include validity.
do $r3214_postguards$
declare spec pg_catalog.jsonb:=$r3214_expected${"tables":{"public.xat_reaccions":[{"acl":[],"rls":true,"force":false,"columns":[["missatge_id","uuid",true,null],["usuari_id","uuid",true,null],["emoji","text",true,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE UNIQUE INDEX xat_reaccions_pkey ON public.xat_reaccions USING btree (missatge_id, usuari_id, emoji)",true,true]],"policies":[["xat_reaccions_propies","*",true,["authenticated"],"((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))","((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_reaccions_emoji_check","CHECK (((char_length(emoji) >= 1) AND (char_length(emoji) <= 16)))"],["xat_reaccions_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_reaccions_pkey","PRIMARY KEY (missatge_id, usuari_id, emoji)"],["xat_reaccions_usuari_id_fkey","FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE"]]}],"public.xat_missatges_destacats":[{"acl":[],"rls":true,"force":false,"columns":[["usuari_id","uuid",true,null],["missatge_id","uuid",true,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE INDEX xat_destacats_missatge_idx ON public.xat_missatges_destacats USING btree (missatge_id)",true,true],["CREATE UNIQUE INDEX xat_missatges_destacats_pkey ON public.xat_missatges_destacats USING btree (usuari_id, missatge_id)",true,true]],"policies":[["xat_destacats_propis","*",true,["authenticated"],"((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))","((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_missatges_destacats_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_missatges_destacats_pkey","PRIMARY KEY (usuari_id, missatge_id)"],["xat_missatges_destacats_usuari_id_fkey","FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE"]]}],"public.xat_missatges_fixats":[{"acl":[],"rls":true,"force":false,"columns":[["conversa_id","uuid",true,null],["missatge_id","uuid",true,null],["fixat_per","uuid",false,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE INDEX xat_fixats_missatge_idx ON public.xat_missatges_fixats USING btree (missatge_id)",true,true],["CREATE UNIQUE INDEX xat_missatges_fixats_pkey ON public.xat_missatges_fixats USING btree (conversa_id, missatge_id)",true,true]],"policies":[["xat_fixats_autor","*",true,["authenticated"],"((fixat_per = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, conversa_id))","((fixat_per = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, conversa_id))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_missatges_fixats_conversa_id_fkey","FOREIGN KEY (conversa_id) REFERENCES xat_fils(id) ON DELETE CASCADE"],["xat_missatges_fixats_fixat_per_fkey","FOREIGN KEY (fixat_per) REFERENCES auth.users(id) ON DELETE SET NULL"],["xat_missatges_fixats_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_missatges_fixats_pkey","PRIMARY KEY (conversa_id, missatge_id)"]]}],"public.xat_missatges_amagats":[{"acl":[],"rls":true,"force":false,"columns":[["usuari_id","uuid",true,null],["missatge_id","uuid",true,null],["creat_al","timestamp with time zone",true,"now()"]],"indexes":[["CREATE INDEX xat_amagats_missatge_idx ON public.xat_missatges_amagats USING btree (missatge_id)",true,true],["CREATE UNIQUE INDEX xat_missatges_amagats_pkey ON public.xat_missatges_amagats USING btree (usuari_id, missatge_id)",true,true]],"policies":[["xat_amagats_propis","*",true,["authenticated"],"((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))","((usuari_id = ( SELECT auth.uid() AS uid)) AND private.xat_accio_visible(missatge_id, NULL::uuid))"]],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_missatges_amagats_missatge_id_fkey","FOREIGN KEY (missatge_id) REFERENCES xat_missatges(id) ON DELETE CASCADE"],["xat_missatges_amagats_pkey","PRIMARY KEY (usuari_id, missatge_id)"],["xat_missatges_amagats_usuari_id_fkey","FOREIGN KEY (usuari_id) REFERENCES auth.users(id) ON DELETE CASCADE"]]}],"private.xat_push_credencials_v2":[{"acl":[],"rls":true,"force":false,"columns":[["proveidor","text",true,null],["empremta","text",true,null],["valor","text",true,null],["caduca_al","timestamp with time zone",true,null]],"indexes":[["CREATE UNIQUE INDEX xat_push_credencials_v2_pkey ON private.xat_push_credencials_v2 USING btree (proveidor, empremta)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["xat_push_credencials_v2_empremta_forma","CHECK ((empremta ~ '^[0-9a-f]{16}$'::text))"],["xat_push_credencials_v2_pkey","PRIMARY KEY (proveidor, empremta)"],["xat_push_credencials_v2_proveidor_valid","CHECK ((proveidor = ANY (ARRAY['apns'::text, 'fcm'::text])))"],["xat_push_credencials_v2_valor_forma","CHECK ((((char_length(valor) >= 20) AND (char_length(valor) <= 4096)) AND (valor ~ '^[A-Za-z0-9._-]+$'::text)))"]]}],"private.r3210_fossils_acl_backup":[{"acl":[],"rls":true,"force":false,"columns":[["signature","text",true,null],["function_oid","oid",true,null],["owner_oid","oid",true,null],["definition_hash","text",true,null],["before_acl","text",false,null],["after_acl","text",true,null],["captured_at","timestamp with time zone",true,"now()"]],"indexes":[["CREATE UNIQUE INDEX r3210_fossils_acl_backup_pkey ON private.r3210_fossils_acl_backup USING btree (signature)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3210_fossils_acl_backup_pkey","PRIMARY KEY (signature)"]]}],"private.r3213_crdt_captures":[{"acl":[],"rls":true,"force":false,"columns":[["tenant_id","uuid",true,null],["owner_id","uuid",true,null],["request_id","text",true,null],["canonical_capture","text",true,null],["capture_sha256","text",true,null],["frontier","jsonb",true,null],["confirmed_at","timestamp with time zone",true,null]],"indexes":[["CREATE UNIQUE INDEX r3213_crdt_captures_pkey ON private.r3213_crdt_captures USING btree (tenant_id, owner_id, request_id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_crdt_captures_canonical_capture_check","CHECK ((octet_length(canonical_capture) <= 4194304))"],["r3213_crdt_captures_capture_sha256_check","CHECK ((capture_sha256 ~ '^[a-f0-9]{64}$'::text))"],["r3213_crdt_captures_frontier_check","CHECK ((jsonb_typeof(frontier) = 'array'::text))"],["r3213_crdt_captures_owner_id_fkey","FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE"],["r3213_crdt_captures_pkey","PRIMARY KEY (tenant_id, owner_id, request_id)"],["r3213_crdt_captures_request_id_check","CHECK ((request_id ~ '^[A-Za-z0-9_-]{1,128}$'::text))"],["r3213_crdt_captures_tenant_id_fkey","FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE CASCADE"]]}],"private.r3213_crdt_dots":[{"acl":[],"rls":true,"force":false,"columns":[["tenant_id","uuid",true,null],["owner_id","uuid",true,null],["dot","text",true,null],["operation","jsonb",true,null]],"indexes":[["CREATE UNIQUE INDEX r3213_crdt_dots_pkey ON private.r3213_crdt_dots USING btree (tenant_id, owner_id, dot)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_crdt_dots_owner_id_fkey","FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE"],["r3213_crdt_dots_pkey","PRIMARY KEY (tenant_id, owner_id, dot)"],["r3213_crdt_dots_tenant_id_fkey","FOREIGN KEY (tenant_id) REFERENCES towns(id) ON DELETE CASCADE"]]}],"private.r3213_lssi_flux":[{"acl":[],"rls":true,"force":false,"columns":[["denuncia_id","uuid",true,null],["estat","text",true,null],["versio","integer",true,null],["modificada_al","timestamp with time zone",true,"clock_timestamp()"]],"indexes":[["CREATE UNIQUE INDEX r3213_lssi_flux_pkey ON private.r3213_lssi_flux USING btree (denuncia_id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_lssi_flux_denuncia_id_fkey","FOREIGN KEY (denuncia_id) REFERENCES denuncies(id) ON DELETE CASCADE"],["r3213_lssi_flux_estat_check","CHECK ((estat = ANY (ARRAY['rebuda'::text, 'en_revisio'::text, 'ocultacio_cautelar'::text, 'arxivada'::text, 'resolta'::text])))"],["r3213_lssi_flux_pkey","PRIMARY KEY (denuncia_id)"],["r3213_lssi_flux_versio_check","CHECK ((versio >= 1))"]]}],"private.r3213_lssi_audit":[{"acl":[],"rls":true,"force":false,"columns":[["id","uuid",true,"gen_random_uuid()"],["denuncia_id","uuid",true,null],["actor_id","uuid",false,null],["anterior","text",false,null],["estat","text",true,null],["justificacio","text",true,null],["creat_al","timestamp with time zone",true,"clock_timestamp()"]],"indexes":[["CREATE UNIQUE INDEX r3213_lssi_audit_pkey ON private.r3213_lssi_audit USING btree (id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_lssi_audit_actor_id_fkey","FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL"],["r3213_lssi_audit_denuncia_id_fkey","FOREIGN KEY (denuncia_id) REFERENCES denuncies(id) ON DELETE CASCADE"],["r3213_lssi_audit_estat_check","CHECK ((estat = ANY (ARRAY['rebuda'::text, 'en_revisio'::text, 'ocultacio_cautelar'::text, 'arxivada'::text, 'resolta'::text])))"],["r3213_lssi_audit_justificacio_check","CHECK (((char_length(justificacio) >= 1) AND (char_length(justificacio) <= 2000)))"],["r3213_lssi_audit_pkey","PRIMARY KEY (id)"]]}],"private.r3213_lssi_rebuts":[{"acl":[],"rls":true,"force":false,"columns":[["subjecte","text",true,null],["operacio_id","uuid",true,null],["peticio_sha256","text",true,null],["rebut","jsonb",true,null],["actor_id","uuid",false,null]],"indexes":[["CREATE UNIQUE INDEX r3213_lssi_rebuts_pkey ON private.r3213_lssi_rebuts USING btree (subjecte, operacio_id)",true,true]],"policies":[],"columnacl":[],"effective":[["anon",false,false],["authenticated",false,false],["service_role",false,false]],"constraints":[["r3213_lssi_rebuts_actor_id_fkey","FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE CASCADE"],["r3213_lssi_rebuts_peticio_sha256_check","CHECK ((peticio_sha256 ~ '^[a-f0-9]{64}$'::text))"],["r3213_lssi_rebuts_pkey","PRIMARY KEY (subjecte, operacio_id)"]]}]},"functions":{"private.denuncies_abans_insercio()":[{"body":"c92d45f52316897522d3f1b3547a461b0cf127e02544c313b68280bf34c3e6b3","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"trigger","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]}],"private.r3213_lssi_sync()":[{"body":"c501dfb164d1e237303c235c464454272eaa2438e082bfa6cfff8ab2d0f0669a","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"trigger","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]}],"private.xat_accio_estat(p_id uuid)":[{"body":"40d72d2a38b190b117d04da993d1252dd7e9adb854510a143c6f01357f75bd35","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"sql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[],"effective":[["anon",false],["authenticated",false],["service_role",false]]}],"private.xat_accio_visible(p_id uuid, p_fil_id uuid)":[{"body":"c819f68a1aa31e5287d38eb939661e12f2b696dd4337cd370f66d65b3845b324","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"sql","result":"boolean","defaults":"NULL::uuid","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.confirma_captura_crdt_rural(p_tenant uuid, p_request text, p_capture text, p_sha256 text, p_frontier jsonb)":[{"body":"45a8b355a4e22812790907b1e56ade8444565339d410cffd1eeb12a5fbd3226f","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.llista_denuncies_diligents(p_estat text, p_limit integer)":[{"body":"70d19bde272059c474c4bf471f6bf298abd39e7e364f447fcfa3c3d36ca3f110","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"50","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.registra_denuncia_diligent(p_publicacio uuid, p_motiu text, p_detall text, p_operacio uuid)":[{"body":"8e83339040e3f1cd547246486f1c87a88faa01660e64a8aa2aff7c4418545f21","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["anon","EXECUTE",false],["authenticated","EXECUTE",false]],"effective":[["anon",true],["authenticated",true],["service_role",false]]}],"public.revisa_denuncia_diligent(p_id uuid, p_estat_esperat text, p_versio integer, p_estat text, p_justificacio text, p_operacio uuid)":[{"body":"2d18b9f4aab5080aba0a93e490161911087b56e3690922ea06f612a7ad4d0b81","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_accions_missatges(p_fil_id uuid, p_ids uuid[], p_nomes_destacats boolean, p_despres_de_id uuid, p_limit integer)":[{"body":"301a69eeb2f2bd183b054e3c5720208d88d5556c9d1387ee114fd9c23fdb86c2","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::uuid, '{}'::uuid[], false, NULL::uuid, 100","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_alterna_destacat(p_fil_id uuid, p_missatge_id uuid, p_actiu boolean)":[{"body":"c97105c39010b0e5a6e823e0f55d00d94f91bd51247d3c01c09d5785c3f43b36","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_alterna_fixat(p_fil_id uuid, p_missatge_id uuid, p_actiu boolean)":[{"body":"4bf4faa7c30c4d0a97a60a4e64b85d71a54e73d12d743ff778c2ea985a5aabe4","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_alterna_reaccio(p_fil_id uuid, p_missatge_id uuid, p_emoji text, p_activa boolean)":[{"body":"22eaac4ec5a81b14aab94e4308d5ceda27a4a2078497c3e7a55990d11e16f3de","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_elimina_per_a_mi(p_fil_id uuid, p_missatge_id uuid)":[{"body":"8d68523d654c4e47f43af1232a6ca42d43e69c37cff08cfb87ef86c0c2c1c2d6","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_fils_meus(p_tenant_id uuid)":[{"body":"17a5b8b1beee4921a9e771f0fa16632803babc7b6a076d03e485759eae0ea4c4","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"TABLE(id uuid, tipus text, titol text, imatge_url text, actualitzat_al timestamp with time zone, altres_noms text[], ultim_text text, ultim_al timestamp with time zone, ultim_autor_id uuid, ultim_seq bigint, llegit_fins_seq bigint, rebut_fins_seq bigint, llegit_pels_altres_fins_seq bigint, no_llegits integer, arxivat_al timestamp with time zone, fixat_al timestamp with time zone, silenciat_fins_al timestamp with time zone, preferit_al timestamp with time zone, no_llegit_manual boolean, org_id uuid, entitat_nom text, com_entitat boolean, altres jsonb, comunitat_id uuid, subjecte_tipus text, subjecte_id text, subjecte_ruta text, subjecte_titol text, subjecte_uri text, rol text, participants integer, ultim_tipus text, epoca_actual integer, cap_epoca_hash text, e2ee_des_de_seq bigint, canal_clau text, rebut_pels_altres_fins_seq bigint)","defaults":null,"proretset":true,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid)":[{"body":"28bf2db16b2222620ab2d978c70afe4b7713f97fb6f5160083cd50108ec13ccb","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::uuid","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_publica_adjunt(p_id uuid, p_text text, p_resposta_a uuid, p_ubicacio jsonb)":[{"body":"e478942615b608443df92d4979b1409a8c6fca4d4b6280ee9652a09545d100fa","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_push_credencial_v2(p_proveidor text, p_empremta text)":[{"body":"0feb81b669ce17081e67ed721a2a951755a1be71dbb8b5701d1ecc5f806cf26a","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"text","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["service_role","EXECUTE",false]],"effective":[["anon",false],["authenticated",false],["service_role",true]]}],"public.xat_push_desa_credencial_v2(p_proveidor text, p_empremta text, p_valor text, p_caduca_al timestamp with time zone)":[{"body":"8ccb401aee33380ddc820101b67e0326293b80d689449f4230f80e1e5e894f13","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"boolean","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["service_role","EXECUTE",false]],"effective":[["anon",false],["authenticated",false],["service_role",true]]}],"public.xat_quota()":[{"body":"c9607dbf16a0dfc4e716a71876a180c2f9e0dc3f1a6b2674a16357671290b01a","prosecdef":true,"provolatile":"s","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":null,"proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}],"public.xat_reserva_adjunt(p_id uuid, p_fil_id uuid, p_bytes bigint, p_mime text, p_durada_ms integer)":[{"body":"dddb2fda616808f319c0bf036d3489a6ee90ff72596c32e50f533ef6167373e5","prosecdef":true,"provolatile":"v","proconfig":["search_path=\"\""],"lanname":"plpgsql","result":"jsonb","defaults":"NULL::integer","proretset":false,"proleakproof":false,"proparallel":"u","acl":[["authenticated","EXECUTE",false]],"effective":[["anon",false],["authenticated",true],["service_role",false]]}]},"triggers":{"denuncies_abans_insercio":[{"tgname":"denuncies_abans_insercio","ddl":"CREATE TRIGGER denuncies_abans_insercio BEFORE INSERT ON public.denuncies FOR EACH ROW EXECUTE FUNCTION private.denuncies_abans_insercio()","tgenabled":"O"}],"r3213_lssi_decisio":[{"tgname":"r3213_lssi_decisio","ddl":"CREATE TRIGGER r3213_lssi_decisio AFTER UPDATE OF estat ON public.denuncies FOR EACH ROW WHEN ((old.estat IS DISTINCT FROM new.estat)) EXECUTE FUNCTION private.r3213_lssi_sync()","tgenabled":"O"}],"r3213_lssi_insercio":[{"tgname":"r3213_lssi_insercio","ddl":"CREATE TRIGGER r3213_lssi_insercio AFTER INSERT ON public.denuncies FOR EACH ROW EXECUTE FUNCTION private.r3213_lssi_sync()","tgenabled":"O"}]}}$r3214_expected$::pg_catalog.jsonb;
 item record; procrow record; got pg_catalog.jsonb; seen pg_catalog.jsonb:='{}'::pg_catalog.jsonb;
 expected_owner pg_catalog.oid:=(select relowner from pg_catalog.pg_class where oid='public.xat_fils'::pg_catalog.regclass);
begin
 if (select x.schema_name from pg_catalog.unnest(pg_catalog.current_schemas(true)) with ordinality as x(schema_name,ordinal)
  where x.schema_name is distinct from (select n.nspname from pg_catalog.pg_namespace n where n.oid=pg_catalog.pg_my_temp_schema()) order by x.ordinal limit 1) is distinct from 'pg_catalog' then
  raise exception 'SDP-R3214-DRIFT: caller schema' using errcode='55000';
 end if;
 for item in select key,value from pg_catalog.jsonb_each(spec->'tables') loop
  if pg_catalog.to_regclass(item.key) is null then
   raise exception 'SDP-R3214-DRIFT: missing table %',item.key using errcode='55000';
  end if;
  if not exists(select 1 from pg_catalog.pg_class where oid=pg_catalog.to_regclass(item.key) and relkind='r' and relowner=expected_owner) then
   raise exception 'SDP-R3214-DRIFT: table owner/kind %',item.key using errcode='55000';
  end if;
  select jsonb_build_object(
 'columns',(select jsonb_agg(jsonb_build_array(a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_catalog.pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_catalog.pg_attribute a left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select coalesce(jsonb_agg(jsonb_build_array(k.conname,pg_catalog.pg_get_constraintdef(k.oid)) order by k.conname),'[]'::jsonb) from pg_catalog.pg_constraint k where k.conrelid=c.oid and k.contype<>'n'),
 'indexes',(select coalesce(jsonb_agg(jsonb_build_array(pg_catalog.pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by i.indexrelid::regclass::text),'[]'::jsonb) from pg_catalog.pg_index i where i.indrelid=c.oid),
 'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
 'acl',(select coalesce(jsonb_agg(jsonb_build_array(coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a left join pg_catalog.pg_roles r on r.oid=a.grantee where a.grantee<>c.relowner and coalesce(r.rolname,'PUBLIC')<>'service_role'),
 'effective',(select jsonb_agg(jsonb_build_array(r,case when r='service_role' then false else pg_catalog.has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') end,case when r='service_role' then false else pg_catalog.has_any_column_privilege(r,c.oid,'SELECT,INSERT,UPDATE,REFERENCES') end) order by r) from unnest(array['anon','authenticated','service_role']) r),
 'columnacl',(select coalesce(jsonb_agg(jsonb_build_array(x.attname,coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by x.attnum,coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.pg_attribute x cross join lateral pg_catalog.aclexplode(x.attacl) a left join pg_catalog.pg_roles r on r.oid=a.grantee where x.attrelid=c.oid and a.grantee<>c.relowner and coalesce(r.rolname,'PUBLIC')<>'service_role'),
 'policies',(select coalesce(jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,(select array_agg(coalesce(r.rolname,'PUBLIC') order by coalesce(r.rolname,'PUBLIC')) from unnest(p.polroles) roleid left join pg_catalog.pg_roles r on r.oid=roleid),pg_catalog.pg_get_expr(p.polqual,p.polrelid),pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname),'[]'::jsonb) from pg_catalog.pg_policy p where p.polrelid=c.oid)
) into got from pg_catalog.pg_class c where c.oid=pg_catalog.to_regclass(item.key);
  if not exists(select 1 from pg_catalog.jsonb_array_elements(item.value) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: table %',item.key using errcode='55000';
  end if;
 end loop;
 for procrow in select n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')' signature,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') body,p.prosecdef,p.provolatile,p.proconfig,l.lanname,pg_catalog.pg_get_function_result(p.oid) result,pg_catalog.pg_get_expr(p.proargdefaults,0) defaults,p.proretset,p.proleakproof,p.proparallel,(select coalesce(jsonb_agg(jsonb_build_array(coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a left join pg_catalog.pg_roles r on r.oid=a.grantee where a.grantee<>p.proowner and (p.proname like 'xat_push_%' or coalesce(r.rolname,'PUBLIC')<>'service_role')) acl,(select jsonb_agg(jsonb_build_array(r,case when r='service_role' and p.proname not like 'xat_push_%' then false else pg_catalog.has_function_privilege(r,p.oid,'EXECUTE') end) order by r) from unnest(array['anon','authenticated','service_role']) r) effective from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace join pg_catalog.pg_language l on l.oid=p.prolang where n.nspname||'.'||p.proname=any(array['private.denuncies_abans_insercio','private.r3213_lssi_sync','private.xat_accio_estat','private.xat_accio_visible','public.confirma_captura_crdt_rural','public.llista_denuncies_diligents','public.registra_denuncia_diligent','public.revisa_denuncia_diligent','public.xat_accions_missatges','public.xat_alterna_destacat','public.xat_alterna_fixat','public.xat_alterna_reaccio','public.xat_elimina_per_a_mi','public.xat_fils_meus','public.xat_publica_adjunt','public.xat_push_credencial_v2','public.xat_push_desa_credencial_v2','public.xat_quota','public.xat_reserva_adjunt']::pg_catalog.text[]::text[]) order by 1 loop
  if not (spec->'functions') ? procrow.signature or not exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
   where n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')'=procrow.signature and p.proowner=expected_owner) then
   raise exception 'SDP-R3214-DRIFT: function owner/overload %',procrow.signature using errcode='55000';
  end if;
  got:=pg_catalog.to_jsonb(procrow)-'signature';
  if not exists(select 1 from pg_catalog.jsonb_array_elements(spec->'functions'->procrow.signature) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: function %',procrow.signature using errcode='55000';
  end if;
  seen:=seen||pg_catalog.jsonb_build_object(procrow.signature,true);
 end loop;
 for item in select key from pg_catalog.jsonb_each(spec->'functions') loop
  if not seen ? item.key then raise exception 'SDP-R3214-DRIFT: missing function %',item.key using errcode='55000'; end if;
 end loop;
 for item in select key,value from pg_catalog.jsonb_each(spec->'triggers') loop
  select pg_catalog.jsonb_build_object('tgname',t.tgname,'ddl',pg_catalog.pg_get_triggerdef(t.oid),'tgenabled',t.tgenabled) into got
   from pg_catalog.pg_trigger t where t.tgrelid='public.denuncies'::pg_catalog.regclass and t.tgname=item.key;
  if got is null then raise exception 'SDP-R3214-DRIFT: missing trigger %',item.key using errcode='55000'; end if;
  if not exists(select 1 from pg_catalog.jsonb_array_elements(item.value) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: trigger %',item.key using errcode='55000';
  end if;
 end loop;
end $r3214_postguards$;

notify pgrst,'reload schema';
commit;

-- POSTVERIFICACIÓ AUTOMÀTICA INCLOSA (ha de retornar tot TRUE)
-- Només lectura; tots els camps han de ser TRUE.
select
 to_regclass('public.xat_missatges_amagats') is not null as accions_r327,
 to_regprocedure('public.xat_publica_adjunt(uuid,text,uuid,jsonb)') is not null as ubicacio_r328,
 position('250000000' in pg_get_functiondef('public.xat_quota()'::regprocedure))>0 as quota_250mb,
 to_regclass('private.xat_push_credencials_v2') is not null as push_v2,
 not has_function_privilege('authenticated','public.xat_push_desa_credencial_v2(text,text,text,timestamptz)','EXECUTE') as push_nomes_servidor,
 (select bool_and(relrowsecurity) from pg_class where oid in ('private.xat_fils_fusionats'::regclass,'private.xat_fusions_pendents'::regclass)) as reconciliacio_rls,
 to_regclass('private.r3210_fossils_acl_backup') is not null as fossils_acl,
 to_regprocedure('public.confirma_captura_crdt_rural(uuid,text,text,text,jsonb)') is not null as pf03,
 to_regprocedure('public.registra_denuncia_diligent(uuid,text,text,uuid)') is not null as lssi,
 (select encode(sha256(convert_to(prosrc,'UTF8')),'hex')='17a5b8b1beee4921a9e771f0fa16632803babc7b6a076d03e485759eae0ea4c4' from pg_proc where oid='public.xat_fils_meus(uuid)'::regprocedure) as previa_sense_amagats;
