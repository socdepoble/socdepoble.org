-- R32.15 · Sonda pura de catàleg: exportar el resultat abans de qualsevol DDL.
-- Totes les rutines SECURITY DEFINER no internes, inclosos esquemes del proveïdor.
-- dins_abast_blindatge marca només public/private no pertanyents a extensions.
-- L'ACL directa i l'efectiva no són equivalents (PUBLIC, propietat i herència).
-- Operadors i funcions de catàleg explícits: el search_path del caller no pot
-- desviar la consulta a operadors d'un esquema hostil. Cap cos inventariat s'executa.
select p.oid, n.nspname as esquema, p.proname as nom, p.prokind,
 pg_catalog.format('%I.%I(%s)',n.nspname,p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid)) as signatura,
 pg_catalog.pg_get_userbyid(p.proowner) as propietari,
 p.proconfig,
 (select pg_catalog.count(*) OPERATOR(pg_catalog.=) 1 and pg_catalog.bool_and(c OPERATOR(pg_catalog.=) any(array['search_path=""','search_path=']::pg_catalog.text[]))
   from pg_catalog.unnest(p.proconfig) c where pg_catalog.split_part(c,'=',1) OPERATOR(pg_catalog.=) 'search_path') as search_path_buit,
 n.nspname OPERATOR(pg_catalog.=) any(array['public','private']::pg_catalog.name[]) and not exists(select 1 from pg_catalog.pg_depend d
  where d.classid OPERATOR(pg_catalog.=) 'pg_catalog.pg_proc'::pg_catalog.regclass and d.objid OPERATOR(pg_catalog.=) p.oid
   and d.refclassid OPERATOR(pg_catalog.=) 'pg_catalog.pg_extension'::pg_catalog.regclass and d.deptype OPERATOR(pg_catalog.=) 'e') as dins_abast_blindatge,
 coalesce((select pg_catalog.bool_or(a.grantee OPERATOR(pg_catalog.=) 0 and a.privilege_type OPERATOR(pg_catalog.=) 'EXECUTE')
  from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),false) as public_execute,
 coalesce((select pg_catalog.bool_or(a.grantee OPERATOR(pg_catalog.=) pg_catalog.to_regrole('anon') and a.privilege_type OPERATOR(pg_catalog.=) 'EXECUTE')
  from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),false) as anon_execute_directe,
 case when pg_catalog.to_regrole('anon') is not null then pg_catalog.has_function_privilege('anon',p.oid,'EXECUTE') end as anon_execute_efectiu,
 coalesce((select pg_catalog.bool_or(a.grantee OPERATOR(pg_catalog.=) pg_catalog.to_regrole('authenticated') and a.privilege_type OPERATOR(pg_catalog.=) 'EXECUTE')
  from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a),false) as authenticated_execute_directe,
 case when pg_catalog.to_regrole('authenticated') is not null then pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE') end as authenticated_execute_efectiu,
 p.proacl::pg_catalog.text as acl,
 pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.pg_get_functiondef(p.oid),'UTF8')),'hex') as definicio_sha256,
 pg_catalog.pg_get_functiondef(p.oid) as definicio
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid OPERATOR(pg_catalog.=) p.pronamespace
where p.prosecdef and not (n.nspname OPERATOR(pg_catalog.=) any(array['pg_catalog','information_schema']::pg_catalog.name[]))
 and pg_catalog.left(n.nspname,3) OPERATOR(pg_catalog.<>) 'pg_'
order by n.nspname,p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid),p.oid;
