// Prova estàtica de la migració 260928_2035 (T66, l'emoticona de la fitxa de
// la persona). No hi ha cap base de dades: es llig el SQL i es comproven la
// columna, el CHECK, el permís, la idempotència textual i que no toca res fora
// d'abast (la baixa, les organitzacions, les notes). S'executa amb
// `node --test`: vite.config.js exclou tests/**/*.test.mjs de vitest.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOM = '2609282035_perfil_emoticona.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = fs.readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');

test('el nom segueix el format de les migracions i va després de la del lema (2609281500)', () => {
  assert.match(NOM, /^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2609281500_lema_entradilla_256.sql'), 'ha d’aplicar-se després de 2609281500');
});

test('la capçalera diu què fa i que NO està aplicada', () => {
  assert.match(SQL, /^-- =+\n-- 260928_2035 · T66 · /);
  assert.match(SQL, /NO aplicada/);
  assert.match(SQL, /ABANS de publicar el client/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.match(CODI.trimEnd(), /commit;$/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

test('la columna icon és text i admet null (sense default ni not null)', () => {
  assert.match(CODI, /alter table public\.profiles\s+add column if not exists icon text;/i);
  assert.doesNotMatch(CODI, /icon text\s+not null/i);
  assert.doesNotMatch(CODI, /icon text\s+default/i);
});

test('el CHECK de 16 caràcters es torna a crear: drop if exists abans de l’add', () => {
  const esborra = CODI.search(/alter table public\.profiles\s+drop constraint if exists profiles_icon_llargaria;/i);
  const crea = CODI.search(/alter table public\.profiles\s+add constraint profiles_icon_llargaria check \(char_length\(icon\) <= 16\);/i);
  assert.ok(esborra > 0, 'falta el drop constraint if exists');
  assert.ok(crea > esborra, 'el CHECK s’ha de crear després d’esborrar-lo');
  assert.equal((CODI.match(/add constraint/gi) || []).length, 1);
});

test('només el permís d’UPDATE de la columna, per a authenticated; la lectura ja és de taula', () => {
  assert.match(CODI, /grant update \(icon\) on table public\.profiles to authenticated;/i);
  assert.equal((CODI.match(/\bgrant\b/gi) || []).length, 1);
  assert.doesNotMatch(CODI, /grant select/i);
  assert.doesNotMatch(CODI, /\banon\b/i);
  assert.doesNotMatch(CODI, /\brevoke\b/i);
});

test('cap política, vista, funció ni taula noves; cap using (true)', () => {
  assert.doesNotMatch(CODI, /create policy/i);
  assert.doesNotMatch(CODI, /create (or replace )?view/i);
  assert.doesNotMatch(CODI, /create (or replace )?function/i);
  assert.doesNotMatch(CODI, /create table/i);
  assert.doesNotMatch(CODI, /using\s*\(\s*true\s*\)/i);
});

test('no toca la baixa, les organitzacions, les notes ni el lema', () => {
  assert.doesNotMatch(CODI, /baixa/i);
  assert.doesNotMatch(CODI, /organizations/i);
  assert.doesNotMatch(CODI, /\bnotes\b/i);
  assert.doesNotMatch(CODI, /section_submissions/i);
  // limitsText.test.js busca l'última migració amb char_length(lema): esta no hi ha d'entrar.
  assert.doesNotMatch(SQL, /char_length\(lema\)/i);
  assert.doesNotMatch(CODI, /\b(drop column|drop table|truncate|delete from|update public\.)/i);
});

test('idempotència: cada add column porta if not exists i cada drop, if exists', () => {
  for (const m of CODI.matchAll(/add column (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `add column sense if not exists: ${m[0]}`);
  for (const m of CODI.matchAll(/drop constraint (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `drop constraint sense if exists: ${m[0]}`);
});

test('el catàleg supabase/README.md la nomena i diu que va abans del client', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const entrada = readme.slice(readme.indexOf(`migrations/${NOM}`));
  assert.ok(readme.includes(`migrations/${NOM}`), 'falta l’entrada al README');
  assert.ok(readme.indexOf(`migrations/${NOM}`) > readme.indexOf('migrations/2609281500_lema_entradilla_256.sql'), 'l’entrada va després de la del lema');
  assert.match(entrada.split('\n\n')[0], /abans de publicar el client/i);
});
