// Prova estàtica de la migració 260927_1400 (paperera i arxiu de Notes).
// No hi ha cap base de dades: es llig el SQL i es comproven les regles que
// tractor-rls no mira (search_path buit, permisos, trigger que ignora la data
// del client, purga limitada a la paperera) i la idempotència.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = path.join(ARREL, 'supabase/migrations/2609271400_notes_paperera.sql');
const SQL = fs.readFileSync(FITXER, 'utf8');
// Sense comentaris de línia: es comprova el codi, no la prosa.
const CODI = SQL.split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');

/** Cada funció: esquema, nom, paràmetres, capçalera (fins a «as $$») i cos. */
function funcions(sql) {
  const re = /create\s+(?:or\s+replace\s+)?function\s+(\w+)\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$(\w*)\$/gi;
  const eixida = [];
  let m;
  while ((m = re.exec(sql))) {
    const tanca = `$${m[5]}$`;
    const inici = re.lastIndex;
    const fi = sql.indexOf(tanca, inici);
    assert.ok(fi > inici, `cos sense tancar a ${m[1]}.${m[2]}`);
    eixida.push({ esquema: m[1].toLowerCase(), nom: m[2].toLowerCase(), params: m[3], capcalera: m[4], cos: sql.slice(inici, fi) });
    re.lastIndex = fi + tanca.length;
  }
  return eixida;
}
const FUNCIONS = funcions(CODI);
const funcio = (esquema, nom) => FUNCIONS.find((f) => f.esquema === esquema && f.nom === nom);

test('la migració és una sola transacció i recarrega l’esquema de PostgREST', () => {
  assert.match(CODI.trimStart(), /^begin;/i);
  assert.match(CODI.trimEnd(), /commit;$/i);
  assert.equal((CODI.match(/^\s*begin;\s*$/gim) || []).length, 1);
  assert.equal((CODI.match(/^\s*commit;\s*$/gim) || []).length, 1);
  assert.match(CODI, /notify pgrst, 'reload schema';\s*commit;\s*$/i);
});

test('status: activa, paperera o arxivada, i activa per defecte', () => {
  assert.match(CODI, /alter table public\.notes\s+add column if not exists status text not null default 'activa'\s+constraint notes_status_valid check \(status in \('activa', 'paperera', 'arxivada'\)\);/i);
  assert.match(CODI, /alter table public\.notes\s+add column if not exists trashed_at timestamptz;/i);
});

test('una nota és a la paperera si i només si té data d’entrada', () => {
  assert.match(CODI, /add constraint notes_paperera_amb_data check \(\(status = 'paperera'\) = \(trashed_at is not null\)\);/i);
  const esborra = CODI.search(/drop constraint if exists notes_paperera_amb_data;/i);
  assert.ok(esborra > 0 && esborra < CODI.search(/add constraint notes_paperera_amb_data/i), 'la restricció s’ha de poder tornar a crear');
});

test('índex per al llistat de les actives d’una persona', () => {
  assert.match(CODI, /create index if not exists idx_notes_tenant_owner_status\s+on public\.notes \(tenant_id, owner_user_id, status, id desc\);/i);
});

test('la data de paperera la fixa el servidor en inserir i en actualitzar', () => {
  assert.match(CODI, /drop trigger if exists trg_notes_paperera on public\.notes;\s+create trigger trg_notes_paperera\s+before insert or update on public\.notes\s+for each row execute function public\.notes_marca_paperera\(\);/i);
  const f = funcio('public', 'notes_marca_paperera');
  assert.ok(f, 'falta public.notes_marca_paperera');
  assert.match(f.capcalera, /returns\s+trigger/i);
  assert.match(f.capcalera, /set\s+search_path\s*=\s*''/i);
  assert.doesNotMatch(f.capcalera, /security\s+definer/i);
  // Tres branques i cap deixa passar el valor del client.
  assert.match(f.cos, /if new\.status <> 'paperera' then\s+new\.trashed_at := null;/i);
  assert.match(f.cos, /elsif tg_op = 'UPDATE' and old\.status = 'paperera' then\s+new\.trashed_at := old\.trashed_at;/i);
  assert.match(f.cos, /else\s+new\.trashed_at := now\(\);/i);
  assert.doesNotMatch(f.cos, /coalesce\(new\.trashed_at/i);
  assert.match(CODI, /revoke execute on function public\.notes_marca_paperera\(\) from public, anon, authenticated;/i);
});

test('els 30 dies viuen a private.ajustos, sense trepitjar un valor existent', () => {
  assert.match(CODI, /insert into private\.ajustos \(clau, valor\)\s+values \('dies_paperera_notes', '30'\)\s+on conflict \(clau\) do nothing;/i);
});

test('la purga és privada, definer amb search_path buit i només toca la paperera', () => {
  const f = funcio('private', 'purga_paperera_notes');
  assert.ok(f, 'falta private.purga_paperera_notes');
  assert.match(f.capcalera, /returns\s+integer/i);
  assert.match(f.capcalera, /security\s+definer\s+set\s+search_path\s*=\s*''/i);
  assert.match(f.cos, /pg_try_advisory_xact_lock\(hashtext\('sdp-purga-paperera-notes'\)\)/i);
  assert.match(f.cos, /from private\.ajustos a where a\.clau = 'dies_paperera_notes'/i);
  assert.match(f.cos, /v_dies := coalesce\(v_dies, 30\);/i);
  // Dues guardes d'estat: en triar i en esborrar. L'arxiu no caduca.
  assert.equal((f.cos.match(/status = 'paperera'/g) || []).length, 2);
  assert.doesNotMatch(f.cos, /arxivada/i);
  assert.match(f.cos, /n\.trashed_at <= now\(\) - make_interval\(days => v_dies\)/i);
  assert.match(CODI, /revoke execute on function private\.purga_paperera_notes\(integer\) from public, anon, authenticated;/i);
  assert.doesNotMatch(CODI, /grant execute on function/i);
});

test('la purga es programa amb pg_cron només si existix', () => {
  assert.match(CODI, /if exists \(select 1 from pg_catalog\.pg_extension where extname = 'pg_cron'\) then\s+perform cron\.schedule\('sdp-purga-paperera-notes', '[^']+', \$cron\$select private\.purga_paperera_notes\(500\)\$cron\$\);/i);
  assert.match(CODI, /raise notice 'SDP-NOTES-900:/i);
});

test('la publicació al Mur es conserva i no s’obri cap permís nou', () => {
  assert.doesNotMatch(CODI, /section_submissions/i);
  assert.doesNotMatch(CODI, /\bgrant\b/i);
  assert.doesNotMatch(CODI, /create policy/i);
  assert.doesNotMatch(CODI, /using\s*\(\s*true\s*\)/i);
});

test('idempotència: cada objecte nou es pot tornar a crear', () => {
  for (const m of CODI.matchAll(/add column (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `add column sense if not exists: ${m[0]}`);
  for (const m of CODI.matchAll(/create index (\S+)/gi)) assert.equal(m[1].toLowerCase(), 'if', `create index sense if not exists: ${m[0]}`);
  for (const m of CODI.matchAll(/create function (\w+)\.(\w+)\(/gi)) assert.fail(`create function sense or replace: ${m[1]}.${m[2]}`);
});
