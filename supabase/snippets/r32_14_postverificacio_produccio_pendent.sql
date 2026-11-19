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
