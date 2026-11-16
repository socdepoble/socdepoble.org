import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
import { capcalera,comparaVersions,dependenciesDeclarades,llegixOrdre,ordena,versioDeFitxer } from '../scripts/supabase/verifica-migracions.mjs';
const moduleURL = pathToFileURL(process.env.SDP_PGLITE_MODULE).href;
const {PGlite} = await import(moduleURL);
const {pgcrypto} = await import(new URL('./contrib/pgcrypto.js',moduleURL));
const db = new PGlite({extensions:{pgcrypto}});
// Fixtures d’infraestructura Auth/Storage/Realtime d’R29; tot el domini/RLS/RPC és del catàleg real.
const bootstrap = "CREATE ROLE anon NOLOGIN;\nCREATE ROLE authenticated NOLOGIN;\nCREATE ROLE service_role NOLOGIN BYPASSRLS;\nCREATE SCHEMA auth;\nCREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb NOT NULL DEFAULT '{}');\nCREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;\nGRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;\nGRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;\nCREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;\nCREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;\nCREATE TABLE auth.sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);\nALTER TABLE auth.users ADD COLUMN banned_until timestamptz;\nALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;\nCREATE SCHEMA storage;\nCREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);\nCREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz DEFAULT now(),UNIQUE(bucket_id,name));\nALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;\nCREATE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;\nGRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;\nGRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;\nCREATE SCHEMA realtime;\nCREATE TABLE realtime.messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,extension text,topic text,payload jsonb);\nALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('realtime.topic',true)$$;\n";
await db.exec(bootstrap);
const folder='supabase/migrations';
const inventari=fs.readdirSync(folder).filter(f=>/^(?:\d{10}|\d{14})_.+\.sql$/.test(f)).sort((a,b)=>comparaVersions(versioDeFitxer(a),versioDeFitxer(b)));
const versions=inventari.map(versioDeFitxer), ordre=llegixOrdre(fs.readFileSync('supabase/ordre_desplegament.json','utf8'),new Set(versions));
const dependencies=new Map(inventari.map(f=>{ const v=versioDeFitxer(f);return [v,dependenciesDeclarades(capcalera(fs.readFileSync(folder+'/'+f,'utf8')),v).filter(d=>comparaVersions(d.versio,v)<0).map(d=>d.versio)]; }));
const pla=ordena({versions,dependencies,restriccions:ordre.restriccions,portes:ordre.portes});
assert.deepEqual(pla.errors,[]);
const aplicades=[];
for(const pas of pla.ordre.filter(p=>p.tipus==='migracio')){
 const file=inventari.find(f=>f.startsWith(pas.id+'_'));
 try{await db.exec(fs.readFileSync(folder+'/'+file,'utf8'));aplicades.push(file);}catch(error){await db.exec('rollback').catch(()=>{});throw new Error(file+': '+error.message,{cause:error});}
}
console.log('Catàleg real aplicat:',aplicades.length);
// Onada R30 · P1-79 (àrbitre) · El catàleg ja inclou 20261115230000; es reaplica per provar-ne la idempotència.
const nova=['20261115230000_r30_revisions_editorials_cas.sql'];
for(const f of nova)await db.exec(fs.readFileSync(folder+'/'+f,'utf8'));
const uid='11111111-1111-4111-8111-111111111111', b='44444444-4444-4444-8444-444444444444', town='22222222-2222-4222-8222-222222222222';
for(const who of [uid,b])await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[who,who+'@example.invalid']);
await db.query("insert into public.towns(id,slug,name) values($1,'r30-sintetic','R30 Sintètic')",[town]);
for(const who of [uid,b]){
 await db.query("insert into public.town_memberships(town_id,user_id,role) values($1,$2,'member')",[town,who]);
 await db.query('insert into private.normes_acceptades(usuari_id,versio) values($1,private.versio_normes_vigent())',[who]);
}
await db.query("insert into public.user_platform_roles(user_id,role) values($1,'superadmin')",[uid]);
async function com(who,sql,params=[],aal='aal2'){
 await db.exec('begin');try{
 await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true),set_config('request.jwt.claims',$2,true)",[who,JSON.stringify({sub:who,role:'authenticated',aal})]);
 await db.exec('set local role authenticated');const r=await db.query(sql,params);await db.exec('commit');return r;
 }catch(error){await db.exec('rollback');throw error;}
}
const wp=(nota,esperat=null,who=uid,aal='aal2')=>com(who,"select public.desa_revisio_editorial_wp_cas(1,'aprovat',$1,'Autora','mur',$2) r",[nota,esperat],aal).then(r=>r.rows[0].r);
await test('catàleg complet · WP CAS i cap bypass per signatura antiga/taula directa',async()=>{
 const a=await wp('a'),c=await wp('c',a.actualitzat_a);
 await assert.rejects(wp('obsoleta',a.actualitzat_a),/SDP-WP-REV-409/);
 await assert.rejects(com(uid,"select public.desa_revisio_editorial_wp(1,'aprovat','cega')"),/SDP-WP-REV-409/);
 await assert.rejects(com(uid,"update public.revisions_editorials_wp set nota='directa' where wp_id=1"),/permission denied/);
 await assert.rejects(wp('aal1',c.actualitzat_a,uid,'aal1'),/SDP-WP-REV-403/);
 await assert.rejects(wp('aal nul',c.actualitzat_a,uid,null),/SDP-WP-REV-403/);
 await assert.rejects(com(uid,'select public.llista_revisions_editorials_wp()',[],null),/SDP-WP-REV-403/);
 await assert.rejects(wp('aliena',c.actualitzat_a,b),/SDP-WP-REV-403/);
 assert.equal((await wp('revisada',c.actualitzat_a)).nota,'revisada');
});
await test('catàleg complet · Notes publica amb CAS, replay idempotent i revisió obsoleta rebutjada',async()=>{
 const note='55555555-5555-4555-8555-555555555555',act='66666666-6666-4666-8666-666666666666',op='77777777-7777-4777-8777-777777777777';
 await db.query("insert into public.notes(id,tenant_id,owner_user_id,title,content) values($1,$2,$3,'Nota real','Cos inicial')",[note,town,uid]);
 const publica=revision=>com(uid,"select public.publica_nota_al_mur($1,$2,'mur',$3::jsonb,$4,$5) r",[note,act,JSON.stringify({title:'Nota real',description:'',author_org_id:null,payload:{title:'Nota real',content:'Cos inicial'}}),revision,op]);
 const creada=(await publica(1)).rows[0].r;
 assert.equal(creada.publicacio.id,act);
 const replay=(await publica(1)).rows[0].r;assert.equal(replay.replay,true);
 await db.query("update public.notes set content='Cos revisat' where id=$1",[note]);
 const rev=(await db.query('select revision from public.notes where id=$1',[note])).rows[0].revision;
 await assert.rejects(com(uid,"select public.publica_nota_al_mur($1,$2,'mur',$3::jsonb,$4,$5)",[note,act,JSON.stringify({title:'Revisada',description:'',author_org_id:null,payload:{content:'Cos revisat'}}),1,'88888888-8888-4888-8888-888888888888']),/revisió|SDP-MUR|conflict/i);
 const actual=(await com(uid,"select public.publica_nota_al_mur($1,$2,'mur',$3::jsonb,$4,$5) r",[note,act,JSON.stringify({title:'Revisada',description:'',author_org_id:null,payload:{content:'Cos revisat'}}),rev,'99999999-9999-4999-8999-999999999999'])).rows[0].r;
 assert.equal(actual.publicacio.id,act);assert.equal(actual.publicacio.title,'Revisada');
});
await db.close();
