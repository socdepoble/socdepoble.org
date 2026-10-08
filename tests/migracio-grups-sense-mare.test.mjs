// Prova estàtica de la migració 261008_1400 (ordre del Mestre, 261008, grup C:
// un grup ja no necessita empresa mare). No hi ha cap base de dades: es llig el
// SQL i es comproven la funció private.can_create_group, la política d'INSERT
// de public.organizations, que el cas amb mare no s'afluixa i que no toca res
// fora d'abast (create_organization, el lema). S'executa amb `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOM = '2610081400_grups_sense_mare.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const SQL = fs.readFileSync(path.join(MIGRACIONS, NOM), 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** El cos de private.can_create_group (de «create or replace» fins al «$$;»). */
const FUNCIO = /create\s+or\s+replace\s+function\s+private\.can_create_group\s*\([\s\S]*?\n\$\$;/i.exec(CODI)?.[0] ?? '';
/** La política d'INSERT, de «create policy» fins al punt i coma final. */
const POLITICA = /create policy "members create organizations"[\s\S]*?\n\);/i.exec(CODI)?.[0] ?? '';

test('el nom segueix el format de les migracions i va després de 2610072230', () => {
  assert.match(NOM, /^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2610072230_mur_imatges_propies.sql'), 'ha d’aplicar-se després de 2610072230');
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2609272201_grups_mare.sql'), 'ha d’aplicar-se després de la que va fer obligatòria la mare');
});

test('la capçalera diu què fa, que NO està aplicada i que va ABANS de publicar el client', () => {
  assert.match(SQL, /^-- =+\n-- 261008_1400 · /);
  assert.match(SQL, /NO aplicada/);
  assert.match(SQL, /ABANS de publicar el client/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.match(CODI.trimEnd(), /commit;$/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

test('can_create_group: la mare és opcional (null o una que pots administrar)', () => {
  assert.ok(FUNCIO, 'falta private.can_create_group');
  assert.match(FUNCIO, /p_parent_organization_id is null or exists \(/i);
  assert.doesNotMatch(FUNCIO, /p_parent_organization_id is not null/i);
  // Sense sessió, mai: la guarda va fora de la disjunció.
  assert.match(SENSE_ESPAIS(FUNCIO), /select \(select auth\.uid\(\)\) is not null and \( p_parent_organization_id is null or exists \(/);
});

test('can_create_group: amb mare, la frontera de 2609272201 es conserva lletra a lletra', () => {
  for (const condicio of [
    /parent\.id = p_parent_organization_id/i,
    /parent\.tenant_id = p_tenant_id/i,
    /parent\.kind in \('company', 'entity', 'city_hall'\)/i,
    /membership\.user_id = \(select auth\.uid\(\)\)/i,
    /membership\.role in \('owner', 'admin'\)/i,
    /on membership\.organization_id = parent\.id\s+and membership\.tenant_id = parent\.tenant_id/i
  ]) assert.match(FUNCIO, condicio);
});

test('can_create_group: mateixa signatura, stable, security definer, search_path buit i mateixos permisos', () => {
  assert.match(SENSE_ESPAIS(FUNCIO), /private\.can_create_group\( p_parent_organization_id uuid, p_tenant_id uuid \) returns boolean language sql stable security definer set search_path = ''/);
  assert.match(CODI, /revoke execute on function private\.can_create_group\(uuid, uuid\) from public, anon;/i);
  assert.match(CODI, /grant execute on function private\.can_create_group\(uuid, uuid\) to authenticated;/i);
});

test('la política d’INSERT es torna a crear sense exigir mare al grup i conserva la resta', () => {
  assert.match(CODI, /drop policy if exists "members create organizations" on public\.organizations;/i);
  assert.ok(CODI.search(/drop policy if exists "members create organizations"/i) < CODI.search(/create policy "members create organizations"/i));
  assert.ok(POLITICA, 'falta la política');
  const politica = SENSE_ESPAIS(POLITICA);
  assert.match(politica, /on public\.organizations for insert to authenticated with check \(/);
  for (const condicio of [
    '(select auth.uid()) is not null',
    'created_by = (select auth.uid())',
    "visibility = 'public'",
    '(select private.is_town_member(tenant_id))',
    "(kind = 'company' and parent_organization_id is null)",
    "kind = 'group' and (select private.can_create_group(parent_organization_id, tenant_id))"
  ]) assert.ok(politica.includes(condicio), `falta: ${condicio}`);
  assert.doesNotMatch(POLITICA, /parent_organization_id is not null/i);
  assert.doesNotMatch(POLITICA, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i);
});

test('no toca create_organization ni el lema (limitsText.test.js) ni obri res a anon', () => {
  assert.doesNotMatch(SQL, /create\s+or\s+replace\s+function\s+public\.create_organization\b/i);
  assert.doesNotMatch(SQL, /char_length\(lema\)/i);
  assert.doesNotMatch(CODI, /grant [^;]*\bto\b[^;]*\banon\b/i);
  assert.doesNotMatch(CODI, /\b(create table|alter table|drop table|drop column|truncate|delete from|update public\.)/i);
  // Una sola funció i una sola política.
  assert.equal((CODI.match(/create\s+(or\s+replace\s+)?function/gi) || []).length, 1);
  assert.equal((CODI.match(/create policy/gi) || []).length, 1);
});

test('és l’última migració que redefinix can_create_group i diu els mateixos tipus de mare que el client', () => {
  const ordre = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  const ultima = ordre.filter((f) => /create\s+or\s+replace\s+function\s+private\.can_create_group/i
    .test(fs.readFileSync(path.join(MIGRACIONS, f), 'utf8'))).at(-1);
  assert.equal(ultima, NOM);
  const client = fs.readFileSync(path.join(ARREL, 'src/data/organizations.js'), 'utf8');
  assert.match(client, /TIPUS_MARE = new Set\(\['company', 'entity', 'city_hall'\]\)/);
});

test('el catàleg supabase/README.md la nomena, després de 2610042330, i diu que va abans del client', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const nom = `migrations/${NOM}`;
  assert.ok(readme.includes(nom), 'falta l’entrada al README');
  assert.ok(readme.indexOf(nom) > readme.indexOf('migrations/2610042330_xat_pagina_iaia.sql'));
  const entrada = readme.slice(readme.indexOf(nom)).split('\n\n')[0];
  assert.match(entrada, /abans de publicar el client/i);
  assert.match(entrada, /no aplicada/i);
  assert.match(entrada, /2610072230/);
});
