import assert from 'node:assert/strict';
import {MIGRATIONS,read,migrate} from './r32_25-push.mjs';
// Només completa dependències del bootstrap històric. Cap ASSERT original es transforma.
export async function upgrade(db,existing=[]){
 const exec=q=>db.exec?db.exec(q):db.query(q);
 await exec(`create or replace function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$`);
 for(const name of MIGRATIONS)if(!existing.includes(name))await exec(read('supabase/migrations/'+name));
 await install(db);
}
export async function install(db){await migrate({exec:q=>db.exec?db.exec(q):db.query(q)});assert.equal((await db.query("select to_regclass('private.xat_push_directes_nous') is not null and to_regprocedure('private.avisos_push_normalitza(text)') is not null and pg_get_functiondef('public.xat_push_reclama_v2(integer)'::regprocedure) like '%a.avis%' as installed")).rows[0].installed,true,'R32.25 instal·lada dins cada oracle');}
