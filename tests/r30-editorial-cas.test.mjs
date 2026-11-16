import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const entrada = process.env.SDP_PGLITE_MODULE;
if (!entrada) throw new Error('Cal SDP_PGLITE_MODULE explícit: aquesta prova no es pot ometre.');
const { PGlite } = await import(entrada.startsWith('file:') ? entrada : pathToFileURL(entrada).href);
const db = new PGlite();
const uid = '11111111-1111-4111-8111-111111111111';
const sql = name => readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8');
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema private;
create table auth.users(id uuid primary key);insert into auth.users values('${uid}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
create function private.es_superadmin() returns boolean language sql stable as $$select true$$;
create function private.pot_curar_cultura() returns boolean language sql stable as $$select true$$;
create function auth.jwt() returns jsonb language sql stable as $$select '{"aal":"aal2"}'::jsonb$$;
select set_config('request.uid','${uid}',false);
grant usage on schema auth,private to authenticated;`);
await db.exec(sql('2611110455_revisions_editorials_wp.sql'));
// Onada R30 · P1-79 (àrbitre) · Només entra 20261115230000; 20261115231000 (section_submissions) queda fora.
for (let i = 0; i < 2; i++) await db.exec(sql('20261115230000_r30_revisions_editorials_cas.sql'));
const wp = async (nota, versio = null) => (await db.query('select public.desa_revisio_editorial_wp_cas(1,\'aprovat\',$1,\'Autora\',\'mur\',$2) r', [nota, versio])).rows[0].r;
await test('WP · primera inserció, dos escriptors de la mateixa versió i reintent informat', async () => {
 const inicial = await wp('inicial');
 const resultats = await Promise.allSettled([wp('primera', inicial.actualitzat_a), wp('segona', inicial.actualitzat_a)]);
 assert.equal(resultats.filter(r => r.status === 'fulfilled').length, 1);
 assert.match(resultats.find(r => r.status === 'rejected').reason.message, /SDP-WP-REV-409/);
 const vigent = (await db.query('select public.llista_revisions_editorials_wp() r')).rows[0].r[0];
 const reintent = await wp('segona revisada', vigent.actualitzat_a);
 assert.notEqual(reintent.actualitzat_a, vigent.actualitzat_a);
 assert.equal(reintent.nota, 'segona revisada');
});
await test('WP · la signatura antiga no sobreescriu i el token absent no és incondicional', async () => {
 await assert.rejects(wp('obsoleta'), /SDP-WP-REV-409/);
 await assert.rejects(db.query("select public.desa_revisio_editorial_wp(1,'aprovat','cega')"), /SDP-WP-REV-409/);
 await assert.rejects(wp('no finit', 'infinity'), /invàlida/);
 assert.equal((await db.query('select nota from public.revisions_editorials_wp')).rows[0].nota, 'segona revisada');
});
await test('WP · sense sessió no muta ni revela contingut', async () => {
 await db.exec("select set_config('request.uid','',false)");
 await assert.rejects(wp('sense sessió'), /SDP-WP-REV-403/);
 await db.exec(`select set_config('request.uid','${uid}',false)`);
});
await db.close();
