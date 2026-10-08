// Prova estàtica de la migració 261008_1401 (ordre del Mestre, 261008, grup C:
// el poble d'una organització). No hi ha cap base de dades: es llig el SQL i
// es comproven la columna, el CHECK, els permisos de columna, que la vista i
// la RPC són les de 2609262232 amb town_name al final, i que els adaptadors
// del client llegixen i escriuen la mateixa columna. S'executa amb `node --test`.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOM = '2610081401_organitzacions_poble.sql';
const ANTERIOR = '2609262232_copyright_editor.sql';
const MIGRACIONS = path.join(ARREL, 'supabase/migrations');
const llig = (fitxer) => fs.readFileSync(path.join(MIGRACIONS, fitxer), 'utf8');
const senseComentaris = (sql) => sql.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
const SQL = llig(NOM);
const CODI = senseComentaris(SQL);
const CODI_ANTERIOR = senseComentaris(llig(ANTERIOR));
const SENSE_ESPAIS = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const llegeixClient = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');

/** Les columnes de la vista organization_directory, en ordre. */
function columnesDeLaVista(codi) {
  const vista = /create or replace view public\.organization_directory[^\n]*\nas\nselect\n([\s\S]*?)\nfrom public\.organizations\nwhere visibility = 'public';/i.exec(codi);
  assert.ok(vista, 'falta la vista organization_directory amb el filtre visibility = public');
  return vista[1].split(',').map((c) => c.trim()).filter(Boolean);
}
/** La RPC list_my_organizations: columnes del returns table i llista del select. */
function laRpc(codi) {
  const rpc = /create function public\.list_my_organizations\(p_tenant_id uuid\)\s*returns table \(([\s\S]*?)\)\s*language sql\s*stable\s*security invoker\s*set search_path = ''\s*as \$\$\s*select([\s\S]*?)from public\.organization_memberships membership([\s\S]*?)\$\$;/i.exec(codi);
  assert.ok(rpc, 'falta list_my_organizations amb la forma de 2609262232');
  return {
    retorn: rpc[1].split(',').map((c) => SENSE_ESPAIS(c)),
    select: rpc[2].split(',').map((c) => c.trim()).filter(Boolean),
    resta: SENSE_ESPAIS(rpc[3])
  };
}

test('el nom segueix el format de les migracions i va després de 2610081400 i de 2610072230', () => {
  assert.match(NOM, /^\d{10}_[a-z0-9_]+\.sql$/);
  const ordre = fs.readdirSync(MIGRACIONS).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2610072230_mur_imatges_propies.sql'));
  assert.ok(ordre.indexOf(NOM) > ordre.indexOf('2610081400_grups_sense_mare.sql'));
});

test('la capçalera diu què fa, que NO està aplicada, quan s’aplica i la consulta de lectura prèvia', () => {
  assert.match(SQL, /^-- =+\n-- 261008_1401 · /);
  assert.match(SQL, /NO aplicada/);
  assert.match(SQL, /ABANS de publicar el client/);
  assert.match(SQL, /--\s+select column_name from information_schema\.columns\n--\s+where table_schema = 'public' and table_name = 'organization_directory'/);
});

test('una sola transacció amb temps d’espera curts, i recarrega l’esquema de PostgREST abans del commit', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /begin;\s*set local lock_timeout = '5s';\s*set local statement_timeout = '60s';/i);
  assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

test('la columna town_name és text, admet null (sense poble) i té un CHECK de 120 que es pot tornar a crear', () => {
  assert.match(CODI, /alter table public\.organizations\s+add column if not exists town_name text;/i);
  assert.doesNotMatch(CODI, /town_name text\s+(not null|default)/i);
  const esborra = CODI.search(/alter table public\.organizations\s+drop constraint if exists organizations_town_name_llargaria;/i);
  const crea = CODI.search(/alter table public\.organizations\s+add constraint organizations_town_name_llargaria check \(char_length\(town_name\) <= 120\);/i);
  assert.ok(esborra > 0, 'falta el drop constraint if exists');
  assert.ok(crea > esborra, 'el CHECK s’ha de crear després d’esborrar-lo');
  assert.equal((CODI.match(/add constraint/gi) || []).length, 1);
});

test('permisos de columna: lectura per a anon i authenticated, escriptura només per a authenticated', () => {
  assert.match(CODI, /grant select \(town_name\) on table public\.organizations to anon, authenticated;/i);
  assert.match(CODI, /grant update \(town_name\) on table public\.organizations to authenticated;/i);
  assert.doesNotMatch(CODI, /grant (insert|update|delete)[^;]*\bto\b[^;]*\banon\b/i);
  // Cap altre permís de taula: només els de la vista i la RPC, com 2609262232.
  const grants = [...CODI.matchAll(/^grant [^;]*;/gim)].map((m) => SENSE_ESPAIS(m[0]));
  assert.deepEqual(grants, [
    'grant select (town_name) on table public.organizations to anon, authenticated;',
    'grant update (town_name) on table public.organizations to authenticated;',
    'grant select on table public.organization_directory to anon, authenticated;',
    'grant execute on function public.list_my_organizations(uuid) to authenticated;'
  ]);
});

test('el directori públic és el de 2609262232 amb town_name al final, i amb els mateixos permisos', () => {
  const anteriors = columnesDeLaVista(CODI_ANTERIOR);
  assert.equal(anteriors.at(-1), 'copyright');
  assert.deepEqual(columnesDeLaVista(CODI), [...anteriors, 'town_name']);
  assert.match(CODI, /create or replace view public\.organization_directory with \(security_invoker = true, security_barrier = true\)/i);
  assert.match(CODI, /revoke all on table public\.organization_directory from public, anon, authenticated;\s*grant select on table public\.organization_directory to anon, authenticated;/i);
  // Mai cap columna privada al directori.
  for (const privada of ['created_by', 'visibility', 'contact_email']) {
    assert.ok(!columnesDeLaVista(CODI).includes(privada), `${privada} no pot eixir al directori`);
  }
});

test('list_my_organizations és la de 2609262232 amb town_name al final, i amb els mateixos permisos', () => {
  const anterior = laRpc(CODI_ANTERIOR);
  const nova = laRpc(CODI);
  assert.deepEqual(nova.retorn, [...anterior.retorn, 'town_name text']);
  assert.deepEqual(nova.select, [...anterior.select, 'organization.town_name']);
  assert.equal(nova.resta, anterior.resta);
  assert.ok(CODI.search(/drop function if exists public\.list_my_organizations\(uuid\);/i) < CODI.search(/create function public\.list_my_organizations/i));
  assert.match(CODI, /revoke execute on function public\.list_my_organizations\(uuid\) from public, anon;\s*grant execute on function public\.list_my_organizations\(uuid\) to authenticated;/i);
});

test('cap política, taula ni funció més; no toca create_organization ni el lema', () => {
  assert.doesNotMatch(CODI, /create policy|create table|create (or replace )?function (?!public\.list_my_organizations)/i);
  assert.equal((CODI.match(/create (or replace )?function/gi) || []).length, 1);
  assert.doesNotMatch(SQL, /create\s+or\s+replace\s+function\s+public\.create_organization\b/i);
  assert.doesNotMatch(SQL, /char_length\(lema\)/i);
  assert.doesNotMatch(CODI, /\b(drop column|drop table|truncate|delete from|update public\.|revoke select|revoke update)\b/i);
});

test('el client llig i escriu la mateixa columna: RETURNING de l’adaptador, llavor local i fitxa pública', () => {
  const remot = llegeixClient('src/data/supabase/organizations.js');
  const columnes = /const COLUMNES_ORG = '([^']+)'/.exec(remot)?.[1].split(',') ?? [];
  assert.ok(columnes.includes('town_name'), 'COLUMNES_ORG ha de demanar town_name');
  assert.match(remot, /town_name: 'town_name'/);
  const local = llegeixClient('src/data/localPerfils.js');
  assert.match(/const CAMPS_ORG = \[([^\]]+)\]/.exec(local)?.[1] ?? '', /'town_name'/);
  const perfils = llegeixClient('src/data/supabase/perfils.js');
  const fitxa = perfils.slice(perfils.indexOf('export function perfilDOrganitzacio'), perfils.indexOf('export function perfilDePersona'));
  assert.match(fitxa, /poble: text\(org\.town_name\)/);
});

test('el catàleg supabase/README.md la nomena després de 2610081400 i diu que va abans del client', () => {
  const readme = fs.readFileSync(path.join(ARREL, 'supabase/README.md'), 'utf8');
  const nom = `migrations/${NOM}`;
  assert.ok(readme.includes(nom), 'falta l’entrada al README');
  assert.ok(readme.indexOf(nom) > readme.indexOf('migrations/2610081400_grups_sense_mare.sql'));
  const entrada = readme.slice(readme.indexOf(nom)).split('\n\n')[0];
  assert.match(entrada, /abans de publicar el client/i);
  assert.match(entrada, /no aplicada/i);
});
