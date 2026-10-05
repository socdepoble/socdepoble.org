// Prova estàtica de la migració 261004_2350 (F1, Marató 2230: convergència de
// profiles.is_public, dels permisos de columna de la fitxa i d'una sola
// public.create_organization). No hi ha cap base de dades: es llig el SQL i es
// comproven la columna, la paritat dels permisos amb el client
// (CAMPS_PERFIL de src/data/supabase/auth.js), l'esborrat de les sobrecàrregues
// sense tocar la canònica, i que no toca cap política. S'executa amb
// `node --test`: vite.config.js exclou tests/**/*.test.mjs de vitest.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOM = '2610042350_convergencia_perfil_i_create_organization.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = fs.readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const CANONICA = 'public.create_organization(uuid, text, text, text, text, text, uuid)';

/* La llista del client, llegida del fitxer font: si algú hi afig un camp, esta
   prova obliga a decidir si la convergència també n'ha de donar el permís. */
function campsPerfilDelClient() {
  const font = fs.readFileSync(path.join(ARREL, 'src/data/supabase/auth.js'), 'utf8');
  const llista = /const CAMPS_PERFIL = Object\.freeze\(\[([^\]]*)\]\);/.exec(font);
  assert.ok(llista, 'falta CAMPS_PERFIL a auth.js');
  return [...llista[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

test('el nom segueix el format i va després de 2610021520 i de 2610042330 (si hi és)', () => {
  assert.match(NOM, /^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2610021520_perfil_public.sql'), 'ha d’aplicar-se després de 2610021520');
  for (const anterior of ordre.filter((f) => f.startsWith('2610042330'))) {
    assert.ok(ordre.indexOf(NOM) > ordre.indexOf(anterior), `ha d’aplicar-se després de ${anterior}`);
  }
});

test('la capçalera diu què fa, que NO està aplicada i quan s’aplica, amb les quatre consultes de lectura', () => {
  assert.match(SQL, /^-- =+\n-- 261004_2350 · F1 · /);
  assert.match(SQL, /NO aplicada/);
  assert.match(SQL, /DESPRÉS de les pendents/);
  assert.match(SQL, /ABANS de publicar el client/);
  const capcalera = SQL.slice(0, SQL.indexOf('\nbegin;'));
  for (const consulta of [
    /select oid::regprocedure from pg_catalog\.pg_proc/,
    /select column_name from information_schema\.columns/,
    /select column_name, privilege_type from information_schema\.column_privileges/,
    /select version from supabase_migrations\.schema_migrations/,
  ]) assert.match(capcalera, consulta);
  /* L'origen de l'error d'Avatar i Subtítol (42501 de PostgREST o 403 de
     GoTrue) no està confirmat: la capçalera ho diu i diu on es comprova. */
  assert.match(capcalera, /Avatar i Subtítol[\s\S]*?INFERÈNCIA[\s\S]*?GoTrue[\s\S]*?pestanya Xarxa/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST just abans del commit', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.match(CODI.trimEnd(), /commit;$/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

test('la columna is_public és la de 2609110600 i idempotent', () => {
  assert.match(CODI, /alter table public\.profiles\s+add column if not exists is_public boolean default false;/i);
  assert.equal((CODI.match(/add column/gi) || []).length, 1);
});

test('paritat: el bucle de permisos és exactament CAMPS_PERFIL del client, en el mateix ordre', () => {
  const bucle = /foreach v_columna in array array\[([^\]]*)\] loop/i.exec(CODI);
  assert.ok(bucle, 'falta el bucle de permisos');
  const columnes = [...bucle[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  assert.deepEqual(columnes, campsPerfilDelClient());
});

test('cada permís va guardat per information_schema.columns i només és UPDATE de columna per a authenticated', () => {
  assert.match(CODI, /if exists \(select 1 from information_schema\.columns\s+where table_schema = 'public' and table_name = 'profiles' and column_name = v_columna\) then\s+execute format\('grant update \(%I\) on table public\.profiles to authenticated', v_columna\);\s+else\s+raise notice 'SDP-CONV-001:/i);
  assert.equal((CODI.match(/\bgrant\b/gi) || []).length, 1, 'un sol grant, el del bucle');
  assert.doesNotMatch(CODI, /grant (select|insert|delete|all|execute)/i);
});

test('l’esborrat exclou la canònica, avorta amb SDP-CONV-002 si falta i no usa CASCADE', () => {
  const declara = CODI.indexOf(`v_canonica regprocedure := to_regprocedure('${CANONICA}');`);
  const guarda = CODI.search(/if v_canonica is null then\s+raise exception 'SDP-CONV-002:/i);
  const bucle = CODI.search(/for v_sobrecarrega in/i);
  assert.ok(declara > 0, 'falta la canònica per signatura exacta');
  assert.ok(guarda > declara && bucle > guarda, 'la guarda va abans de cap drop');
  /* Només funcions: drop function no esborra un procediment ni un agregat, i
     l'intent desfaria la migració sencera. */
  assert.match(CODI, /where n\.nspname = 'public' and p\.proname = 'create_organization' and p\.prokind = 'f'\s+and p\.oid <> v_canonica::oid/i);
  assert.match(CODI, /execute format\('drop function public\.%I\(%s\)', v_sobrecarrega\.proname, v_sobrecarrega\.arguments\);/i);
  assert.equal((CODI.match(/drop function/gi) || []).length, 1);
  assert.doesNotMatch(CODI, /\bcascade\b/i);
});

test('no redefinix create_organization ni toca el lema: l’invariant de limitsText.test.js no es mou', () => {
  // limitsText.test.js llig el fitxer sencer (comentaris inclosos): ni en la prosa.
  assert.doesNotMatch(SQL, /create\s+or\s+replace\s+function\s+public\.create_organization\b/i);
  assert.doesNotMatch(SQL, /char_length\(lema\)/i);
  assert.doesNotMatch(CODI, /create (or replace )?function/i);
});

test('cap política, permís retirat ni obertura: ni create policy, ni using (true), ni anon, ni revoke', () => {
  assert.doesNotMatch(CODI, /\b(create|alter|drop) policy\b/i);
  assert.doesNotMatch(CODI, /using\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(CODI, /\banon\b/i);
  assert.doesNotMatch(CODI, /\brevoke\b/i);
  assert.doesNotMatch(CODI, /create (or replace )?view|create table|create trigger/i);
  assert.doesNotMatch(CODI, /\b(drop column|drop table|truncate|delete from|update public\.)/i);
});

test('el catàleg supabase/README.md la nomena després de 2610021520, abans del client, i avisa de 2609110600', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const posicio = readme.indexOf(`migrations/${NOM}`);
  assert.ok(posicio >= 0, 'falta l’entrada al README');
  assert.ok(posicio > readme.indexOf('migrations/2610021520_perfil_public.sql'), 'l’entrada va després de 2610021520');
  const entrada = readme.slice(posicio).split('\n\n')[0];
  assert.match(entrada, /abans de publicar el\s+client/i);
  assert.match(entrada, /No torneu a executar 2609110600 sola/);
  assert.match(entrada, /42501[\s\S]*?INFERÈNCIA[\s\S]*?GoTrue[\s\S]*?pestanya\s+Xarxa/);
});
