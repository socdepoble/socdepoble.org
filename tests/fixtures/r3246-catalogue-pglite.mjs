import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {creaPlaMigracions,generaSql,preparaHidratacio} from '../../tooling/node0/hidrata-postgres-node0.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const root=fileURLToPath(new URL('../../',import.meta.url));
const roles=new Set(['anon','authenticated','service_role','node0_runtime']);

/** Motor local obligatori; una absència no es transforma en un test ignorat. */
export async function creaBaseR3246(){
 const modulePath=process.env.SDP_PGLITE_MODULE;
 if(!modulePath||!path.isAbsolute(modulePath))throw Error('SDP_PGLITE_MODULE absolut obligatori.');
 const url=pathToFileURL(modulePath),{PGlite}=await import(url.href);
 const {pgcrypto}=await import(new URL('./contrib/pgcrypto.js',url));
 const initial=new PGlite();let image;
 try{await initial.exec('CREATE DATABASE socdepoble_node0');image=await initial.dumpDataDir('none');}finally{await initial.close();}
 const pg=new PGlite({database:'socdepoble_node0',loadDataDir:image,extensions:{pgcrypto}});
 try{
  const plan=creaPlaMigracions();
  await pg.exec(generaSql(plan,await preparaHidratacio(),{advisoryLock:false}));
  const packagePath=path.resolve(path.dirname(modulePath),'../package.json');
  const engine=JSON.parse(fs.readFileSync(packagePath,'utf8')).version;
  Object.defineProperty(pg,'r3246',{value:{engine,postgres:(await pg.query('select version() as version')).rows[0].version,migrations:plan.migrations.map(source=>Object.fromEntries(Object.entries(source).filter(([clau])=>clau!=='sql'))),orderSha256:plan.orderSha256,bootstrapSha256:sha(fs.readFileSync(path.join(root,'tooling/node0/bootstrap-node0.sql')))}});
  return pg;
 }catch(error){await pg.close();throw error;}
}

/** Claims no substituïxen el rol efectiu. Cada crida és transaccional i local. */
export async function asClient(pg,{uid=null,role='authenticated',aal='aal1',claims={}},sql,args=[]){
 assert(roles.has(role),'Rol de fixture no admés');
 return pg.transaction(async tx=>{
  await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",[uid??'',role,JSON.stringify({sub:uid,role,aal,...claims})]);
  await tx.exec(`SET LOCAL ROLE ${role}`);
  const effective=(await tx.query('select current_user as actor, session_user as session, rolsuper, rolbypassrls from pg_roles where rolname=current_user')).rows[0];
  assert.equal(effective.actor,role);if(role!=='service_role'){assert.equal(effective.rolsuper,false);assert.equal(effective.rolbypassrls,false);}
  return (await tx.query(sql,args)).rows;
 });
}

/** Inventari de l'estat final, incloent DDL dinàmic, ACL efectives i vistes. */
export async function catalogueR3246(pg){
 const tables=(await pg.query(`
  select n.nspname as schema,c.relname as name,c.relkind as kind,pg_get_userbyid(c.relowner) as owner,
   c.relrowsecurity as rls,c.relforcerowsecurity as force_rls,c.relacl::text as acl,c.reloptions as options,
   case when c.relkind in ('v','m') then pg_get_viewdef(c.oid,true) else null end as definition,
   (select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notnull',a.attnotnull,
    'anon_select',has_column_privilege('anon',c.oid,a.attnum,'SELECT'),'authenticated_select',has_column_privilege('authenticated',c.oid,a.attnum,'SELECT'),
    'anon_update',has_column_privilege('anon',c.oid,a.attnum,'UPDATE'),'authenticated_update',has_column_privilege('authenticated',c.oid,a.attnum,'UPDATE')) order by a.attnum)
    from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) as columns,
   (select jsonb_object_agg(r.rolname,jsonb_build_object('select',has_table_privilege(r.oid,c.oid,'SELECT'),'insert',has_table_privilege(r.oid,c.oid,'INSERT'),
    'update',has_table_privilege(r.oid,c.oid,'UPDATE'),'delete',has_table_privilege(r.oid,c.oid,'DELETE'),'truncate',has_table_privilege(r.oid,c.oid,'TRUNCATE'),
    'references',has_table_privilege(r.oid,c.oid,'REFERENCES'),'trigger',has_table_privilege(r.oid,c.oid,'TRIGGER'))) from pg_roles r where r.rolname in ('anon','authenticated','service_role','node0_runtime')) as effective
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('public','private','auth','storage','node0','realtime') and c.relkind in ('r','p','v','m','f') order by n.nspname,c.relname
 `)).rows;
 const functions=(await pg.query(`
  select n.nspname as schema,p.proname as name,pg_get_function_identity_arguments(p.oid) as arguments,
   pg_get_function_arguments(p.oid) as default_arguments,pg_get_function_result(p.oid) as result,
   pg_get_userbyid(p.proowner) as owner,p.prosecdef as security_definer,p.proconfig as config,p.proacl::text as acl,
   l.lanname as language,p.provolatile as volatility,pg_get_functiondef(p.oid) as definition,
   (select e.extname from pg_depend d join pg_extension e on e.oid=d.refobjid where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e' limit 1) as extension,
   (select jsonb_object_agg(r.rolname,has_function_privilege(r.oid,p.oid,'EXECUTE')) from pg_roles r where r.rolname in ('anon','authenticated','service_role','node0_runtime')) as effective
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
  where n.nspname in ('public','private','auth','storage','node0','realtime') and p.prokind in ('f','p') order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)
 `)).rows;
 const policies=(await pg.query("select schemaname as schema,tablename as name,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','private','auth','storage','node0','realtime') order by schemaname,tablename,policyname")).rows;
 const constraints=(await pg.query("select n.nspname as schema,c.relname as name,x.conname,x.contype,pg_get_constraintdef(x.oid,true) as definition from pg_constraint x join pg_class c on c.oid=x.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','auth','storage','node0','realtime') order by n.nspname,c.relname,x.conname")).rows;
 const triggers=(await pg.query("select n.nspname as schema,c.relname as name,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid,true) as definition,pn.nspname as function_schema,p.proname as function_name,pg_get_function_identity_arguments(p.oid) as function_arguments from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid join pg_namespace pn on pn.oid=p.pronamespace where not t.tgisinternal and n.nspname in ('public','private','auth','storage','node0','realtime') order by n.nspname,c.relname,t.tgname")).rows;
 const buckets=(await pg.query('select * from storage.buckets order by id')).rows;
 const roleCatalogue=(await pg.query("select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolbypassrls from pg_roles where rolname in ('anon','authenticated','service_role','node0_runtime') order by rolname")).rows;
 const memberships=(await pg.query("select parent.rolname as parent,member.rolname as member,m.admin_option from pg_auth_members m join pg_roles parent on parent.oid=m.roleid join pg_roles member on member.oid=m.member order by parent.rolname,member.rolname")).rows;
 return {format:'sdp.r3246.catalogue/v1',source:pg.r3246,tables,functions,policies,constraints,triggers,buckets,roles:roleCatalogue,memberships};
}

export function eviR3246(name,value){
 const dir=process.env.SDP_R3246_EVIDENCE;if(!dir)return;
 assert(path.isAbsolute(dir)&&/^[a-zA-Z0-9_.-]+$/.test(name));
 const target=path.join(dir,name);fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
}
