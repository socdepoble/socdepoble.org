/**
 * FEDI-23 · Regressió SQL de connexions sobre les migracions reals fins a 2611032100.
 * Executar des de l’arrel del repositori. Opt-in explícit:
 *   SDP_PGLITE_MODULE=/ruta/existent/pglite/dist/index.js node --test tests/connexions-publiques-postgres.test.mjs
 * També admet file:///.../dist/index.js. No busca paquets ni instal·la res.
 * Sense el mòdul indicat, només informa d’una omissió: cap SQL validat.
 * Auth.uid/jwt/roles, Storage i Realtime són fixtures d’infraestructura;
 * el helper d’autoritat, les taules, les RLS i les RPC són migracions reals.
 * Les concessions ambientals de Supabase i GoTrue no es certifiquen ací.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { after, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const entrada = process.env.SDP_PGLITE_MODULE?.trim() || '';
let moduleURL = null;
if (entrada) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(entrada) && !entrada.startsWith('file:')) {
    throw new TypeError('SDP_PGLITE_MODULE només admet una ruta local o file URL.');
  }
  moduleURL = entrada.startsWith('file:') ? new URL(entrada) : pathToFileURL(path.resolve(entrada));
  if (moduleURL.search || moduleURL.hash) throw new TypeError('El mòdul local no admet query ni fragment.');
}
const modulePath = moduleURL ? fileURLToPath(moduleURL) : null;
if (!modulePath || !fs.existsSync(modulePath)) {
  test('FEDI-23 · PostgreSQL en memòria necessita un PGlite existent i explícit', {
    skip: entrada ? 'El mòdul indicat no existix; no s’ha executat cap migració.' : 'Falta SDP_PGLITE_MODULE; no s’ha executat cap migració.'
  }, () => {});
} else {
  assert.equal(fs.statSync(modulePath).isFile(), true, 'SDP_PGLITE_MODULE ha d’apuntar al fitxer d’entrada del mòdul.');
  const {
    PGlite
  } = await import(moduleURL.href);
  const {
    pgcrypto
  } = await import(new URL('./contrib/pgcrypto.js', moduleURL));
  assert.equal(typeof PGlite, 'function', 'El mòdul indicat no exporta PGlite.');
  const packageURL = new URL('../package.json', moduleURL);
  const packageVersion = fs.existsSync(packageURL) ? JSON.parse(fs.readFileSync(packageURL, 'utf8')).version ?? null : null;
  const ROOT = process.cwd(),
    MIG = 'supabase/migrations';
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const { capcalera, dependenciesDeclarades, llegixOrdre, ordena } = await import(pathToFileURL(path.join(ROOT, 'scripts/supabase/verifica-migracions.mjs')).href);
  const ordrePath = path.join(ROOT, 'supabase/ordre_desplegament.json');
  const ordreBytes = fs.readFileSync(ordrePath);
  const inventari = fs.readdirSync(path.join(ROOT, MIG)).filter(f => /^\d{10}_.+\.sql$/.test(f)).sort();
  const versions = inventari.map(f => f.slice(0, 10));
  assert.equal(new Set(versions).size, versions.length, 'No s’admeten versions SQL duplicades.');
  const ordreDeclarat = llegixOrdre(ordreBytes.toString('utf8'), new Set(versions));
  const dependencies = new Map(inventari.map(file => {
    const versio = file.slice(0, 10);
    return [versio, dependenciesDeclarades(capcalera(fs.readFileSync(path.join(ROOT, MIG, file), 'utf8')), versio).filter(d => d.versio < versio).map(d => d.versio)];
  }));
  const pla = ordena({ versions, dependencies, restriccions: ordreDeclarat.restriccions, portes: ordreDeclarat.portes });
  assert.deepEqual(pla.errors, [], 'No s’executa SQL amb un ordre inconsistent.');
  const files = pla.ordre.filter(p => p.tipus === 'migracio').map(p => inventari.find(file => file.startsWith(p.id + '_')));
  assert.equal(files.length, inventari.length);
  assert.ok(files.every(Boolean));
  for (const r of ordreDeclarat.restriccions) {
    const abans = files.findIndex(f => f.startsWith(r.abans + '_'));
    const despres = files.findIndex(f => f.startsWith(r.despres + '_'));
    assert.ok(abans < despres, `${r.abans} ha d’anar abans de ${r.despres}`);
    if (r.just) assert.equal(despres, abans + 1, `${r.despres} ha d’anar immediatament després de ${r.abans}`);
  }
  const captures = files.map(file => {
    const bytes = fs.readFileSync(path.join(ROOT, MIG, file));
    return {
      file,
      bytes: bytes.length,
      sha256: sha(bytes),
      sql: bytes.toString('utf8')
    };
  });
  for (const requerida of ['2610250100_seguiments_des_d_entitat.sql', '2610281730_membres_concurrents_i_correu_public.sql', '2611031700_administracio_multipoble.sql']) {
    assert.ok(files.includes(requerida), 'Dependència SQL real absent: ' + requerida);
  }
  // Substituts declarats de la infraestructura; no substituïxen private.es_superadmin.
  const bootstrap = "-- Només substituts de la infraestructura auth/rols de Supabase; cap taula\n-- d'organitzacions o de pertinences es redefineix en esta fixture.\nCREATE ROLE anon NOLOGIN;\nCREATE ROLE authenticated NOLOGIN;\nCREATE ROLE service_role NOLOGIN BYPASSRLS;\nCREATE SCHEMA auth;\nCREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb NOT NULL DEFAULT '{}');\nCREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;\nGRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;\nGRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;\nCREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)$$;\nCREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;\nCREATE TABLE auth.sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE);\nALTER TABLE auth.users ADD COLUMN banned_until timestamptz;\nALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;\nCREATE SCHEMA storage;\nCREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);\nCREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text REFERENCES storage.buckets(id),name text,owner uuid,owner_id text,metadata jsonb,version text,created_at timestamptz DEFAULT now(),UNIQUE(bucket_id,name));\nALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$SELECT (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;\nCREATE FUNCTION storage.operation() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('storage.operation',true)$$;\nGRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;\nGRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;\nCREATE SCHEMA realtime;\nCREATE TABLE realtime.messages(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,extension text,topic text,payload jsonb);\nALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;\nCREATE FUNCTION realtime.topic() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('realtime.topic',true)$$;\n-- No emissor de xarxa: els avisos de Realtime són infraestructura fora de l'assaig.\n";
  describe('FEDI23 · connexions públiques amb catàleg SQL real', { concurrency: false }, () => {
    const T='00000000-0000-4000-8000-000000000101', T2='00000000-0000-4000-8000-000000000102';
    const A='00000000-0000-4000-8000-000000000001', B='00000000-0000-4000-8000-000000000002', C='00000000-0000-4000-8000-000000000003', D='00000000-0000-4000-8000-000000000004', E='00000000-0000-4000-8000-000000000005', F='00000000-0000-4000-8000-000000000006';
    const O='00000000-0000-4000-8000-000000000201', O2='00000000-0000-4000-8000-000000000202', O3='00000000-0000-4000-8000-000000000203';
    let db; const errors=[];
    async function com(uid,fn,role='authenticated') {
      await db.exec('BEGIN');
      try {
        await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",[uid??'',role,JSON.stringify({sub:uid,role,aal:'aal2'})]);
        await db.exec('SET LOCAL ROLE '+role); const result=await fn(); await db.exec('COMMIT'); return result;
      } catch(error) {await db.exec('ROLLBACK');throw error;}
    }
    const rpc=async(nom,args=[]) => (await db.query('SELECT public.'+nom+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') AS resultat',args)).rows[0].resultat;
    const lectura=(tipus,id,uid=null,role='anon')=>com(uid,()=>rpc('connexions_publiques_de',[tipus,id]),role);
    const publica=(tipus,id,uid,vis='publica',altre=null)=>com(uid,()=>rpc('desa_visibilitat_connexions',[tipus,id,vis,altre?.tipus??null,altre?.id??null]));
    const rebutja=(promise,codi)=>assert.rejects(promise,e=>{assert.equal(e.code,codi,e.message);return true;});
    before(async()=>{
      db=new PGlite({extensions:{pgcrypto}}); await db.exec(bootstrap);
      for(const source of captures){try{await db.exec(source.sql);}catch(error){errors.push({file:source.file,code:error.code,message:error.message});await db.exec('ROLLBACK').catch(()=>{});}}
      assert.deepEqual(errors,[],'Cap SQL omés ni helper d’autoritat substituït');
      await db.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'sella','Sella'),($2,'xixona','Xixona') ON CONFLICT DO NOTHING",[T,T2]);
      for(const [id,town] of [[A,T],[B,T],[C,T],[D,T],[E,T],[F,T2]]) await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,'fixture-'+id.slice(-1)+'@example.invalid',{tenant_id:town,name:'Persona '+id.slice(-1),rgpd:true}]);
      await db.query('UPDATE public.profiles SET is_public=(id<>$1)',[C]);
      for(const [id,town,creator,slug] of [[O,T,A,'associacio'],[O2,T,C,'empresa'],[O3,T2,F,'altre-poble']]) await db.query("INSERT INTO public.organizations(id,tenant_id,kind,name,slug,created_by,visibility) VALUES($1,$2,'group',$4,$4,$3,'public')",[id,town,creator,slug]);
      await db.query("INSERT INTO public.organization_memberships(organization_id,tenant_id,user_id,role) VALUES($1,$2,$3,'admin') ON CONFLICT DO NOTHING",[O,T,D]);
      for(const [seguidor,seguit] of [[A,B],[B,A],[A,C]]) await db.query("INSERT INTO public.seguiments(tenant_id,seguidor,seguit_tipus,seguit_persona) VALUES($1,$2,'persona',$3)",[T,seguidor,seguit]);
    });
    after(async()=>{
      console.log(JSON.stringify({prova:'connexions-publiques-postgres',runtime:{package:'@electric-sql/pglite',version:packageVersion,moduleSha256:sha(fs.readFileSync(modulePath))},migrations:captures.map(({file,sha256})=>({file,sha256})),errors,postgres:(await db.query('SELECT version() AS v')).rows[0].v,scope:'PostgreSQL WASM local; Auth/Storage/Realtime fixtures; cap desplegament ni xarxa'}));
      await db?.close(); assert.ok(captures.every(c=>sha(fs.readFileSync(path.join(ROOT,MIG,c.file)))===c.sha256),'Fonts SQL estables durant assaig');
    });
    test('catàleg real complet aplicat en ordre canònic',()=>assert.deepEqual(errors,[]));
    test('les sis RPC existixen i defaultprivada no publica cap graf',async()=>{
      const funcs=(await db.query("SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('preferencies_connexions','desa_visibilitat_connexions','connexions_publiques_de','membres_i_entitats_connectades_de','inclou_persona_en_entitat','solicita_unir_se_a_entitat')")).rows;
      assert.equal(funcs.length,6); assert.deepEqual(await lectura('persona',A),[]);
      const own=await com(A,()=>rpc('preferencies_connexions',['persona',A]));assert.equal(own.visibilitatConnexions,'privada');assert.ok(own.connexions.some(c=>c.id===B));
    });
    test('anon/service sense concessions no executen preferències ni mutacions',async()=>{
      for(const role of ['anon','service_role']) for(const [nom,args] of [['preferencies_connexions',['persona',A]],['desa_visibilitat_connexions',['persona',A,'publica',null,null]],['inclou_persona_en_entitat',[O,B,'administrador']],['solicita_unir_se_a_entitat',[O,'administrador']]]) await rebutja(com(null,()=>rpc(nom,args),role),'42501');
    });
    test('ACL mínimes, RLS privada i search_path buit en RPC',async()=>{
      const funcs=(await db.query("SELECT p.proname,p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') AS anon,has_function_privilege('authenticated',p.oid,'EXECUTE') AS auth,has_function_privilege('service_role',p.oid,'EXECUTE') AS service FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('preferencies_connexions','desa_visibilitat_connexions','connexions_publiques_de','membres_i_entitats_connectades_de','inclou_persona_en_entitat','solicita_unir_se_a_entitat')")).rows;
      assert.equal(funcs.length,6); for(const f of funcs){assert.equal(f.prosecdef,true);assert.deepEqual(f.proconfig,['search_path=""']);assert.equal(f.auth,true);assert.equal(f.service,false);assert.equal(f.anon,['connexions_publiques_de','membres_i_entitats_connectades_de'].includes(f.proname));}
      const tables=(await db.query("SELECT c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') AS anon,has_table_privilege('authenticated',c.oid,'SELECT') AS auth,has_table_privilege('service_role',c.oid,'SELECT') AS service FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='private' AND c.relname LIKE 'connexions_%' AND c.relkind='r'")).rows;
      assert.ok(tables.length>=4);for(const table of tables){assert.equal(table.relrowsecurity,true);assert.equal(table.anon,false);assert.equal(table.auth,false);assert.equal(table.service,false);}
    });
    test('global públic no revela perfil privat ni aresta inversa privada',async()=>{
      await publica('persona',A,A); const files=await lectura('persona',A);assert.deepEqual(files.map(f=>[f.id,f.direccio]),[[B,'sortint']]);
      assert.deepEqual(await lectura('persona',A,A,'authenticated'),files);assert.ok(!JSON.stringify(files).includes(C));assert.ok(!JSON.stringify(files).includes('email'));
      await publica('persona',B,B);assert.equal((await lectura('persona',A))[0].direccio,'mutua');
    });
    test('perlink privat de qualsevol extrem i global privat sempre dominen',async()=>{
      await publica('persona',B,B,'privada',{tipus:'persona',id:A});assert.deepEqual(await lectura('persona',A),[]);
      await publica('persona',B,B,'publica',{tipus:'persona',id:A});await publica('persona',A,A,'privada');assert.deepEqual(await lectura('persona',A),[]);
      await publica('persona',A,A);assert.ok((await lectura('persona',A)).length);
    });
    test('cap owner bypassa el selector públic ni pot modificar preferències alienes',async()=>{
      await publica('persona',A,A,'privada');assert.deepEqual(await lectura('persona',A,A,'authenticated'),[]);
      await rebutja(publica('persona',A,B),'42501');await rebutja(com(B,()=>rpc('preferencies_connexions',['persona',A])),'42501');await publica('persona',A,A);
    });
    test('bloquejos bidireccionals i del viewer amaguen la relació sense explicar-la',async()=>{
      await com(B,()=>db.query("INSERT INTO public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_persona) VALUES($1,'persona',$2)",[B,A]));assert.deepEqual(await lectura('persona',A),[]);
      await db.query('DELETE FROM public.bloquejos WHERE bloquejador=$1',[B]);await com(E,()=>db.query("INSERT INTO public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_persona) VALUES($1,'persona',$2)",[E,B]));assert.deepEqual(await lectura('persona',A,E,'authenticated'),[]);await db.query('DELETE FROM public.bloquejos WHERE bloquejador=$1',[E]);
    });
    test('una entitat publica l’aresta pròpia sense filtrar qui l’administra privat',async()=>{
      await db.query("INSERT INTO public.seguiments(tenant_id,seguidor,seguidor_entitat,seguit_tipus,seguit_persona) VALUES($1,$2,$3,'persona',$4)",[T,C,O2,A]);await publica('entitat',O2,C);
      const l=await lectura('persona',A);assert.ok(l.some(c=>c.id===O2&&c.direccio==='entrant'));assert.ok(!JSON.stringify(l).includes(C));assert.ok(!JSON.stringify(l).includes('seguidor'));
    });
    test('bloquejar la persona representant amaga també l’aresta d’entitat, sense exposar-la',async()=>{
      await com(A,()=>db.query("INSERT INTO public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_persona) VALUES($1,'persona',$2)",[A,C]));
      const antiga=(await com(A,()=>db.query('SELECT * FROM public.qui_em_segueix(null)'))).rows;assert.ok(!antiga.some(f=>f.id===O2));
      assert.ok(!(await lectura('persona',A)).some(f=>f.id===O2));
      await com(A,()=>db.query('DELETE FROM public.bloquejos WHERE bloquejador=$1',[A]));
      await com(B,()=>db.query("INSERT INTO public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_persona) VALUES($1,'persona',$2)",[B,C]));
      assert.ok(!(await lectura('persona',A,B,'authenticated')).some(f=>f.id===O2));
      assert.ok((await lectura('persona',A)).some(f=>f.id===O2));
      await com(B,()=>db.query('DELETE FROM public.bloquejos WHERE bloquejador=$1',[B]));
    });
    test('sol·licitar administrador crea només pendent amb atribució de servidor',async()=>{
      const r=await com(E,()=>rpc('solicita_unir_se_a_entitat',[O,'administrador']));assert.deepEqual(r,{orgId:O,personaId:E,rol:'administrador',estat:'pendent'});
      assert.equal((await db.query('SELECT count(*)::int AS n FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2',[O,E])).rows[0].n,0);
      assert.equal((await com(E,()=>db.query('SELECT private.can_manage_organization($1) AS valor',[O]))).rows[0].valor,false);
      await com(E,()=>rpc('solicita_unir_se_a_entitat',[O,'treballador']));assert.equal((await db.query('SELECT count(*)::int AS n FROM private.connexions_sollicituds WHERE organitzacio=$1 AND persona=$2',[O,E])).rows[0].n,1);
    });
    test('incloure usa rol real, manté owner-only admin i no creua poble',async()=>{
      await rebutja(com(E,()=>rpc('inclou_persona_en_entitat',[O,B,'usuari'])),'42501');
      await rebutja(com(D,()=>rpc('inclou_persona_en_entitat',[O,B,'administrador'])),'42501');
      const r=await com(D,()=>rpc('inclou_persona_en_entitat',[O,B,'treballador']));assert.deepEqual(r,{orgId:O,personaId:B,rol:'treballador'});
      assert.equal((await db.query('SELECT role FROM public.organization_memberships WHERE organization_id=$1 AND user_id=$2',[O,B])).rows[0].role,'member');
      await rebutja(com(F,()=>rpc('inclou_persona_en_entitat',[O3,B,'usuari'])),'22023');
    });
    test('membres públics consentits: rol viu prima sobre etiqueta funcional i baixa no deixa orfes',async()=>{
      await publica('entitat',O,A);let r=await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon');assert.ok(r.some(m=>m.id===B&&m.rol==='treballador'));assert.ok(!r.some(m=>m.id===E||m.id===C));
      await com(A,()=>rpc('desa_membre_organitzacio',[O,B,'persona','admin']));r=await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon');assert.ok(r.some(m=>m.id===B&&m.rol==='administrador'));
      await com(A,()=>rpc('lleva_membre_organitzacio',[O,B,'persona']));r=await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon');assert.ok(!r.some(m=>m.id===B));
    });
    test('poble resol slug explícit i filtra persones/entitats per consentiment públic',async()=>{
      await db.query("UPDATE public.town_memberships SET role='admin' WHERE town_id=$1 AND user_id=$2",[T,A]);await publica('poble','sella',A);
      const r=await com(null,()=>rpc('membres_i_entitats_connectades_de',['poble','sella']),'anon');assert.ok(r.some(m=>m.id===A));assert.ok(r.some(m=>m.id===O));assert.ok(!r.some(m=>m.id===C));
      assert.deepEqual(await com(null,()=>rpc('membres_i_entitats_connectades_de',['poble','poble-absent']),'anon'),[]);
      await publica('poble','sella',A,'privada',{tipus:'persona',id:A});assert.ok(!(await com(null,()=>rpc('membres_i_entitats_connectades_de',['poble',T]),'anon')).some(m=>m.id===A));
      await publica('poble',T,A,'publica',{tipus:'persona',id:A});await publica('persona',A,A,'privada',{tipus:'poble',id:'sella'});assert.ok(!(await com(null,()=>rpc('membres_i_entitats_connectades_de',['poble','sella']),'anon')).some(m=>m.id===A));
      await publica('persona',A,A,'publica',{tipus:'poble',id:T});
    });
    test('authenticated sense uid i service amb GRANT ambiental no reben autoritat',async()=>{
      await rebutja(com(null,()=>rpc('desa_visibilitat_connexions',['persona',A,'publica',null,null])),'42501');
      await db.exec('GRANT EXECUTE ON FUNCTION public.desa_visibilitat_connexions(text,text,text,text,text) TO service_role');
      try {await rebutja(com(A,()=>rpc('desa_visibilitat_connexions',['persona',A,'publica',null,null]),'service_role'),'42501');}
      finally {await db.exec('REVOKE EXECUTE ON FUNCTION public.desa_visibilitat_connexions(text,text,text,text,text) FROM service_role');}
    });
    test('consentiment individual de membre domina i worker no reviu després de promoció/degradació antiga',async()=>{
      await com(A,()=>rpc('inclou_persona_en_entitat',[O,B,'treballador']));
      await publica('persona',B,B,'privada',{tipus:'entitat',id:O});
      let r=await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon');assert.ok(!r.some(m=>m.id===B));
      await publica('persona',B,B,'publica',{tipus:'entitat',id:O});
      await com(A,()=>rpc('desa_membre_organitzacio',[O,B,'persona','admin']));
      await com(A,()=>rpc('desa_membre_organitzacio',[O,B,'persona','member']));
      r=await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon');assert.ok(r.some(m=>m.id===B&&m.rol==='usuari'));
      assert.equal((await db.query('SELECT count(*)::int AS n FROM private.connexions_rols_membres WHERE organitzacio=$1 AND persona=$2',[O,B])).rows[0].n,0);
    });
    test('admin configura veïnat consentit amb poble global privat i override propi privat',async()=>{
      await publica('poble','sella',A,'privada');await publica('poble',T,A,'privada',{tipus:'persona',id:A});
      let pref=await com(A,()=>rpc('preferencies_connexions',['poble','sella']));
      assert.equal(pref.visibilitatConnexions,'privada');assert.ok(pref.connexions.some(c=>c.id===A&&c.visibilitatConnexions==='privada'));
      assert.deepEqual(await com(null,()=>rpc('membres_i_entitats_connectades_de',['poble','sella']),'anon'),[]);
      await publica('persona',B,B,'privada');pref=await com(A,()=>rpc('preferencies_connexions',['poble',T]));assert.ok(!pref.connexions.some(c=>c.id===B));
      await publica('persona',B,B);await publica('persona',A,A,'privada',{tipus:'poble',id:'sella'});pref=await com(A,()=>rpc('preferencies_connexions',['poble','sella']));assert.ok(!pref.connexions.some(c=>c.id===A));
      await publica('persona',A,A,'publica',{tipus:'poble',id:T});await publica('poble',T,A,'publica',{tipus:'persona',id:A});await publica('poble',T,A);
    });
    test('pertinences sense follow són editables a preferències pròpies privades i es dedupliquen',async()=>{
      await publica('persona',B,B,'privada');
      let pref=await com(B,()=>rpc('preferencies_connexions',['persona',B]));assert.ok(pref.connexions.some(c=>c.id===O&&c.direccio==='membre'));
      const desat=await publica('persona',B,B,'privada',{tipus:'entitat',id:O});assert.ok(desat.connexions.some(c=>c.id===O&&c.visibilitatConnexions==='privada'));
      await publica('persona',B,B,'publica',{tipus:'entitat',id:O});await publica('entitat',O,A,'privada');
      pref=await com(A,()=>rpc('preferencies_connexions',['entitat',O]));assert.ok(pref.connexions.some(c=>c.id===B&&c.direccio==='membre'&&c.rol==='usuari'));
      await db.query("INSERT INTO public.seguiments(tenant_id,seguidor,seguit_tipus,seguit_entitat) VALUES($1,$2,'entitat',$3)",[T,B,O]);
      pref=await com(B,()=>rpc('preferencies_connexions',['persona',B]));assert.equal(pref.connexions.filter(c=>c.id===O).length,1);assert.equal(pref.connexions.find(c=>c.id===O).rol,'usuari');
      assert.deepEqual(await lectura('persona',B),[]);assert.deepEqual(await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon'),[]);
      await publica('persona',B,B);await publica('entitat',O,A);
    });
    test('entitats membres sense follow tenen controls propis segurs als dos extrems',async()=>{
      await db.query('INSERT INTO public.organization_member_organizations(organization_id,member_organization_id,tenant_id,created_by) VALUES($1,$2,$3,$4)',[O,O2,T,A]);
      await publica('entitat',O,A,'privada');await publica('entitat',O2,C,'privada');
      let pref=await com(A,()=>rpc('preferencies_connexions',['entitat',O]));assert.ok(pref.connexions.some(c=>c.id===O2&&c.tipus==='entitat'&&c.direccio==='membre'&&c.rol==='usuari'));
      pref=await com(C,()=>rpc('preferencies_connexions',['entitat',O2]));assert.ok(pref.connexions.some(c=>c.id===O&&c.tipus==='entitat'&&c.direccio==='membre'));
      pref=await publica('entitat',O,A,'privada',{tipus:'entitat',id:O2});assert.equal(pref.connexions.find(c=>c.id===O2).visibilitatConnexions,'privada');
      await db.query("INSERT INTO public.seguiments(tenant_id,seguidor,seguidor_entitat,seguit_tipus,seguit_entitat) VALUES($1,$2,$3,'entitat',$4)",[T,A,O,O2]);
      pref=await com(A,()=>rpc('preferencies_connexions',['entitat',O]));assert.equal(pref.connexions.filter(c=>c.id===O2).length,1);assert.equal(pref.connexions.find(c=>c.id===O2).rol,'usuari');
      await db.query("UPDATE public.organizations SET visibility='members' WHERE id=$1",[O2]);pref=await com(A,()=>rpc('preferencies_connexions',['entitat',O]));assert.ok(!pref.connexions.some(c=>c.id===O2));
      await db.query("UPDATE public.organizations SET visibility='public' WHERE id=$1",[O2]);
      await com(A,()=>db.query("INSERT INTO public.bloquejos(bloquejador,bloquejat_tipus,bloquejat_entitat) VALUES($1,'entitat',$2)",[A,O2]));
      pref=await com(A,()=>rpc('preferencies_connexions',['entitat',O]));assert.ok(!pref.connexions.some(c=>c.id===O2));await com(A,()=>db.query('DELETE FROM public.bloquejos WHERE bloquejador=$1',[A]));
      assert.deepEqual(await com(null,()=>rpc('membres_i_entitats_connectades_de',['entitat',O]),'anon'),[]);
      await db.query('DELETE FROM public.organization_member_organizations WHERE organization_id=$1 AND member_organization_id=$2',[O,O2]);
      pref=await com(A,()=>rpc('preferencies_connexions',['entitat',O]));assert.equal(pref.connexions.find(c=>c.id===O2).rol,undefined);
    });
    test('la migració és idempotent i no amplia concessions en reaplicar',async()=>{
      const source=captures.find(c=>c.file==='2611032100_connexions_publiques_i_membres.sql');assert.ok(source);await db.exec(source.sql);await db.exec(source.sql);
      assert.equal((await db.query("SELECT has_function_privilege('service_role','public.solicita_unir_se_a_entitat(uuid,text)','EXECUTE') AS valor").catch(()=>db.query("SELECT has_function_privilege('service_role','public.solicita_unir_se_a_entitat(uuid,text)','EXECUTE') AS valor"))).rows[0].valor,false);
    });
  });
}
