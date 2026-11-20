-- D-v1213-2. Un clic al SQL Editor: només lectura, cap credencial ni dada personal.
-- Informa estat estructural actual, no afirma autoria, data d'aplicació ni ledger.
begin read only;
set local statement_timeout = '2s';
select '20261117140000' as versio, 120 as fila,
 pg_catalog.to_regprocedure('public.admin_safata_denuncies_lssi(text,integer)') is not null as safata,
 pg_catalog.to_regprocedure('public.admin_revisa_denuncia_lssi(uuid,text,text,text)') is not null as revisio,
 pg_catalog.to_regclass('private.lssi_revisions') is not null as auditoria;
do $sonda$
declare recompte pg_catalog.int8 := 0; present pg_catalog.bool;
begin
 present := pg_catalog.to_regclass('private.recursos_copublicacio_paquet') is not null;
 if present then
  execute 'select count(*) from private.recursos_copublicacio_paquet where tipus=''pagina'' and recurs_id=''sistema-nervios''' into recompte;
 end if;
 raise notice 'fila=121 versio=20261117150000 registre_present=% sistema_nervios=% coherent=%', present,recompte,(present and recompte=1);
end;
$sonda$;
commit;
