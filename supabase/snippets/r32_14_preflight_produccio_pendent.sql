-- Només lectura; cap canvi ni xarxa. Els prerequisits han d'existir.
select current_setting('server_version') as postgres,
 to_regclass('public.xat_fils') is not null as xat_base,
 to_regprocedure('public.xat_fils_meus(uuid)') is not null as inbox_base,
 to_regclass('private.r32_fossils_backup') is not null as fossils_revisats,
 to_regclass('private.xat_fils_fusionats') is not null as reconciliacio,
 to_regprocedure('public.publica_section_submission_cas(uuid,uuid,text,jsonb,text,text,uuid,boolean,timestamptz,uuid)') is not null as r32_11_ja_aplicada;
-- El super-bundle inclou les guardes completes de cos/esquema/ACL; si detecten
-- deriva avorta tota la transacció, no sobreescriu silenciosament l'objecte.
