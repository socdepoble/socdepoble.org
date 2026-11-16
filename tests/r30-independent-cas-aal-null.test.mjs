import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL(process.env.SDP_PGLITE_MODULE).href);
test('revisió independent: una comprovació de curadoria NULL mai autoritza CAS',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema private;
 create table auth.users(id uuid primary key);insert into auth.users values('11111111-1111-4111-8111-111111111111');
 create function auth.uid() returns uuid language sql stable as $$select '11111111-1111-4111-8111-111111111111'::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;
 create function private.es_superadmin() returns boolean language sql stable as $$select true$$;
 create function private.pot_curar_cultura() returns boolean language sql stable as $$select false$$;`);
 for(const name of ['2611110455_revisions_editorials_wp.sql','20261115230000_r30_revisions_editorials_cas.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 assert.notEqual((await db.query('select private.pot_revisar_importacio_wp() as p')).rows[0].p,true);
 await db.exec('set role authenticated');
 await assert.rejects(db.query("select public.desa_revisio_editorial_wp_cas(619,'aprovat','No autoritzada')"),/SDP-WP-REV-403/);
});
