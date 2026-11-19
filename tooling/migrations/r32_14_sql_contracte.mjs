export const tableFingerprintSQL=`select jsonb_build_object(
 'columns',(select jsonb_agg(jsonb_build_array(a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_catalog.pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_catalog.pg_attribute a left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select coalesce(jsonb_agg(jsonb_build_array(k.conname,pg_catalog.pg_get_constraintdef(k.oid)) order by k.conname),'[]'::jsonb) from pg_catalog.pg_constraint k where k.conrelid=c.oid and k.contype<>'n'),
 'indexes',(select coalesce(jsonb_agg(jsonb_build_array(pg_catalog.pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by i.indexrelid::regclass::text),'[]'::jsonb) from pg_catalog.pg_index i where i.indrelid=c.oid),
 'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
 'acl',(select coalesce(jsonb_agg(jsonb_build_array(coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a left join pg_catalog.pg_roles r on r.oid=a.grantee where a.grantee<>c.relowner),
 'effective',(select jsonb_agg(jsonb_build_array(r,pg_catalog.has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),pg_catalog.has_any_column_privilege(r,c.oid,'SELECT,INSERT,UPDATE,REFERENCES')) order by r) from unnest(array['anon','authenticated','service_role']) r),
 'columnacl',(select coalesce(jsonb_agg(jsonb_build_array(x.attname,coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by x.attnum,coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.pg_attribute x cross join lateral pg_catalog.aclexplode(x.attacl) a left join pg_catalog.pg_roles r on r.oid=a.grantee where x.attrelid=c.oid and a.grantee<>c.relowner),
 'policies',(select coalesce(jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,(select array_agg(coalesce(r.rolname,'PUBLIC') order by coalesce(r.rolname,'PUBLIC')) from unnest(p.polroles) roleid left join pg_catalog.pg_roles r on r.oid=roleid),pg_catalog.pg_get_expr(p.polqual,p.polrelid),pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname),'[]'::jsonb) from pg_catalog.pg_policy p where p.polrelid=c.oid)
) shape from pg_catalog.pg_class c where c.oid=pg_catalog.to_regclass($1)`;
export const functionFingerprintSQL=`select n.nspname||'.'||p.proname||'('||pg_catalog.pg_get_function_identity_arguments(p.oid)||')' signature,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex') body,p.prosecdef,p.provolatile,p.proconfig,l.lanname,pg_catalog.pg_get_function_result(p.oid) result,pg_catalog.pg_get_expr(p.proargdefaults,0) defaults,p.proretset,p.proleakproof,p.proparallel,(select coalesce(jsonb_agg(jsonb_build_array(coalesce(r.rolname,'PUBLIC'),a.privilege_type,a.is_grantable) order by coalesce(r.rolname,'PUBLIC'),a.privilege_type),'[]'::jsonb) from pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a left join pg_catalog.pg_roles r on r.oid=a.grantee where a.grantee<>p.proowner) acl,(select jsonb_agg(jsonb_build_array(r,pg_catalog.has_function_privilege(r,p.oid,'EXECUTE')) order by r) from unnest(array['anon','authenticated','service_role']) r) effective from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace join pg_catalog.pg_language l on l.oid=p.prolang where n.nspname||'.'||p.proname=any($1::text[]) order by 1`;

export function bundleGuards(contract,{post=false}={}) {
  if(contract.schema!=='sdp.r3214.sql-contract.v1'||!contract.pre?.tables||!contract.post?.functions)throw Error('Invalid SQL contract');
  const spec=post?contract.post:contract.pre;
  const names=[...new Set(Object.keys(spec.functions).map(s=>s.slice(0,s.indexOf('('))))];
  const namesSQL='array['+names.map(n=>"'"+n.replaceAll("'","''")+"'").join(',')+']::pg_catalog.text[]';
  const tableQuery=tableFingerprintSQL.replace(') shape from pg_catalog.pg_class c',') into got from pg_catalog.pg_class c').replace('$1','item.key');
  const functionQuery=functionFingerprintSQL.replace('$1',namesSQL);
  const tag=post?'$r3214_postguards$':'$r3214_guards$';
  return `-- Strict SQL contract: captured native18.6/PGlite shapes; owner anchored to xat_fils.
-- NOT NULL is checked via pg_attribute across PG versions; indexes include validity.
do ${tag}
declare spec pg_catalog.jsonb:=$r3214_expected$${JSON.stringify(spec)}$r3214_expected$::pg_catalog.jsonb;
 item record; procrow record; got pg_catalog.jsonb; seen pg_catalog.jsonb:='{}'::pg_catalog.jsonb;
 expected_owner pg_catalog.oid:=(select relowner from pg_catalog.pg_class where oid='public.xat_fils'::pg_catalog.regclass);
begin
 if (select x.schema_name from pg_catalog.unnest(pg_catalog.current_schemas(true)) with ordinality as x(schema_name,ordinal)
  where x.schema_name is distinct from (select n.nspname from pg_catalog.pg_namespace n where n.oid=pg_catalog.pg_my_temp_schema()) order by x.ordinal limit 1) is distinct from 'pg_catalog' then
  raise exception 'SDP-R3214-DRIFT: caller schema' using errcode='55000';
 end if;
 for item in select key,value from pg_catalog.jsonb_each(spec->'tables') loop
  if pg_catalog.to_regclass(item.key) is null then
   ${post?"raise exception 'SDP-R3214-DRIFT: missing table %',item.key using errcode='55000';":"continue;"}
  end if;
  if not exists(select 1 from pg_catalog.pg_class where oid=pg_catalog.to_regclass(item.key) and relkind='r' and relowner=expected_owner) then
   raise exception 'SDP-R3214-DRIFT: table owner/kind %',item.key using errcode='55000';
  end if;
  ${tableQuery};
  if not exists(select 1 from pg_catalog.jsonb_array_elements(item.value) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: table %',item.key using errcode='55000';
  end if;
 end loop;
 for procrow in ${functionQuery} loop
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
 ${post?`for item in select key from pg_catalog.jsonb_each(spec->'functions') loop
  if not seen ? item.key then raise exception 'SDP-R3214-DRIFT: missing function %',item.key using errcode='55000'; end if;
 end loop;`:''}
 for item in select key,value from pg_catalog.jsonb_each(spec->'triggers') loop
  select pg_catalog.jsonb_build_object('tgname',t.tgname,'ddl',pg_catalog.pg_get_triggerdef(t.oid),'tgenabled',t.tgenabled) into got
   from pg_catalog.pg_trigger t where t.tgrelid='public.denuncies'::pg_catalog.regclass and t.tgname=item.key;
  if got is null then ${post?"raise exception 'SDP-R3214-DRIFT: missing trigger %',item.key using errcode='55000';":"continue;"} end if;
  if not exists(select 1 from pg_catalog.jsonb_array_elements(item.value) expected where expected=got) then
   raise exception 'SDP-R3214-DRIFT: trigger %',item.key using errcode='55000';
  end if;
 end loop;
end ${tag};
`;
}
