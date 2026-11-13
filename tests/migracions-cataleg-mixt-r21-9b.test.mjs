import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import * as V from '../scripts/supabase/verifica-migracions.mjs';
import { creaPlaMigracions, generaSql, ROOT } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import { SQL_ULTIMA_MIGRACIO_NODE0 } from '../tooling/node0/postgres-node0.mjs';

const FUTUR = new Date('2027-01-01T00:00:00Z');
const NOU = '20261113003000';
const sql = 'BEGIN; CREATE TABLE IF NOT EXISTS public.mix_test(id int PRIMARY KEY); COMMIT;';
const hash = text => createHash('sha256').update(text).digest('hex');
function fixture(t, migrations) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-mix-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'supabase/migrations'), { recursive: true });
  fs.mkdirSync(path.join(root, 'tooling/node0'), { recursive: true });
  for (const [file, body] of Object.entries(migrations)) fs.writeFileSync(path.join(root, 'supabase/migrations', file), body);
  fs.writeFileSync(path.join(root, 'supabase/README.md'), Object.keys(migrations).map((file, i) => `- \`migrations/${file}\`\n  Prova.\n\n| ${i + 1} | \`${file.split('_')[0]}\` | \`${file}\` | Estat remot no acreditat | prova |`).join('\n'));
  fs.writeFileSync(path.join(root, 'supabase/ordre_desplegament.json'), JSON.stringify({ esquema: V.ESQUEMA_ORDRE }));
  fs.copyFileSync(path.join(ROOT, 'tooling/node0/bootstrap-node0.sql'), path.join(root, 'tooling/node0/bootstrap-node0.sql'));
  return root;
}

/* Gauntlet R22 (pwa-05) · «Prohibix db push i globs crus» ha de ser una
   comprovació, no una promesa del manifest. Una recepta executable del
   repositori (scripts de package.json, workflows, shell de scripts/ i de
   tooling/, crides de procés en JS o Python) no pot aplicar el catàleg mixt
   amb `supabase db push` (ordre per nom de fitxer) ni amb un glob cru de
   `migrations/*` (ordre alfabètic del shell). Mencionar-ho en un avís o en un
   comentari no és invocar-ho. */
const SHELL = /\.(?:sh|bash|zsh|ya?ml)$/i, CODI = /\.(?:mjs|cjs|js|py)$/i;
const DB_PUSH_SHELL = /\bdb\s+push\b/i, GLOB_CRU_SHELL = /\bmigrations\/\*/;
const DB_PUSH_ARGS = /(['"`])db\1\s*,\s*(['"`])push\2/;
const DB_PUSH_EXEC = /\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|run|call|check_call|check_output|system|Popen)\s*\(\s*(['"`])[^'"`\n]*\bdb\s+push\b/;
const GLOB_CRU_CODI = /\bglob\w*\s*\(\s*(['"`])[^'"`\n]*migrations\/\*/;
function fitxersDeReceptes(arrel) {
  const fitxers = [];
  const recorre = relatiu => {
    let entrades;
    try { entrades = fs.readdirSync(path.join(arrel, relatiu), { withFileTypes: true }); } catch { return; }
    for (const entrada of entrades) {
      const cami = path.posix.join(relatiu, entrada.name);
      if (entrada.isDirectory() && entrada.name !== 'node_modules' && !entrada.name.startsWith('.')) recorre(cami);
      else if (entrada.isFile() && (SHELL.test(entrada.name) || CODI.test(entrada.name))) fitxers.push(cami);
    }
  };
  for (const carpeta of ['scripts', 'tooling']) recorre(carpeta);
  try {
    for (const nom of fs.readdirSync(path.join(arrel, '.github/workflows'))) if (SHELL.test(nom)) fitxers.push(`.github/workflows/${nom}`);
  } catch { /* sense workflows */ }
  return fitxers.sort();
}
function receptesPerilloses(arrel) {
  const infraccions = [];
  const scripts = JSON.parse(fs.readFileSync(path.join(arrel, 'package.json'), 'utf8')).scripts || {};
  for (const [nom, ordre] of Object.entries(scripts)) {
    if (DB_PUSH_SHELL.test(ordre)) infraccions.push(`package.json#scripts.${nom} db-push`);
    if (GLOB_CRU_SHELL.test(ordre)) infraccions.push(`package.json#scripts.${nom} glob-cru`);
  }
  for (const fitxer of fitxersDeReceptes(arrel)) {
    const text = fs.readFileSync(path.join(arrel, fitxer), 'utf8');
    text.split('\n').forEach((linia, i) => {
      const lloc = `${fitxer}:${i + 1}`;
      if (SHELL.test(fitxer)) {
        if (/^\s*#/.test(linia)) return;
        if (DB_PUSH_SHELL.test(linia)) infraccions.push(`${lloc} db-push`);
        if (GLOB_CRU_SHELL.test(linia)) infraccions.push(`${lloc} glob-cru`);
      } else {
        if (DB_PUSH_ARGS.test(linia) || DB_PUSH_EXEC.test(linia)) infraccions.push(`${lloc} db-push`);
        if (GLOB_CRU_CODI.test(linia)) infraccions.push(`${lloc} glob-cru`);
      }
    });
  }
  return infraccions;
}

test('no executable recipe applies the mixed catalogue with db push or a raw migrations glob, and the README forbids it', () => {
  assert.deepEqual(receptesPerilloses(ROOT), []);
  assert.match(fs.readFileSync(path.join(ROOT, 'supabase/README.md'), 'utf8'), /No usar ordre alfabètic cru ni `supabase db push`/);
});

test('the recipe guard bites on db push and raw globs, and ignores warnings and comments', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-receptes-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const escriu = (fitxer, text) => { fs.mkdirSync(path.dirname(path.join(root, fitxer)), { recursive: true }); fs.writeFileSync(path.join(root, fitxer), text); };
  escriu('package.json', JSON.stringify({ scripts: { 'db:aplica': 'npx supabase db push --include-all',
    'db:cru': 'for f in supabase/migrations/*.sql; do psql -f "$f"; done', verifica: 'node scripts/supabase/verifica-migracions.mjs' } }));
  escriu('scripts/aplica.sh', '#!/bin/sh\n# Mai supabase db push sobre el catàleg mixt.\nsupabase db push\n');
  escriu('tooling/node0/aplica.mjs', "const avis = 'supabase db push no la respectaria';\nspawnSync('supabase', ['db', 'push']);\nexecSync(`npx supabase db push --linked`);\nconst fitxers = globSync('supabase/migrations/*.sql');\n");
  escriu('tooling/node0/aplica.py', "# supabase db push\nsubprocess.run(['supabase', 'db', 'push'])\nfor f in sorted(glob.glob('supabase/migrations/*.sql')): pass\n");
  escriu('.github/workflows/migra.yml', 'jobs:\n  migra:\n    steps:\n      - run: supabase db push\n');
  assert.deepEqual(receptesPerilloses(root).sort(), [
    '.github/workflows/migra.yml:4 db-push',
    'package.json#scripts.db:aplica db-push',
    'package.json#scripts.db:cru glob-cru',
    'scripts/aplica.sh:3 db-push',
    'tooling/node0/aplica.mjs:2 db-push',
    'tooling/node0/aplica.mjs:3 db-push',
    'tooling/node0/aplica.mjs:4 glob-cru',
    'tooling/node0/aplica.py:2 db-push',
    'tooling/node0/aplica.py:3 glob-cru'
  ]);
});

test('mixed version names validate full calendar, seconds and original identities', () => {
  for (const v of ['2609131120', '2611121630', NOU, '20240229115959']) {
    assert.deepEqual(V.validaNom(`${v}_prova.sql`, FUTUR).errors, [], v);
    assert.equal(V.validaNom(`${v}_prova.sql`, FUTUR).versio, v);
  }
  for (const v of ['20260229120000', '20261113240000', '20261113006000', '20261113003060', '2613320030']) {
    assert.ok(V.validaNom(`${v}_prova.sql`, FUTUR).errors.some(e => e.codi === 'E-DATA'), v);
  }
  for (const v of ['202611130030', '202611130030000', '261112163']) assert.ok(V.validaNom(`${v}_prova.sql`, FUTUR).errors.some(e => e.codi === 'E-NOM'), v);
});

test('mixed catalogue is chronological without rewriting version IDs', () => {
  const versions = [NOU, '2611121630', '20260913111959', '2609131120', '20260913112001'];
  assert.deepEqual(V.ordena({ versions }).ordre.map(x => x.id), ['20260913111959', '2609131120', '20260913112001', '2611121630', NOU]);
  const forced = V.ordena({ versions: ['2611121630', NOU], restriccions: [{ abans: NOU, despres: '2611121630' }] });
  assert.deepEqual(forced.ordre.map(x => x.id), [NOU, '2611121630']);
  assert.deepEqual(V.ordena({ versions: [NOU, '2611121630'] }).inversions, [{ abans: '2611121630', despres: NOU }], 'warn that Supabase filename order cannot implement the chronological mixed plan');
});

test('mixed dependencies, order metadata, README tables and probes retain all digits', () => {
  const cap = V.capcalera(`-- Depén de 2611121630 i ${NOU}.\nSELECT 1;`);
  assert.deepEqual(V.dependenciesDeclarades(cap, '20261113004000').map(x => x.versio), ['2611121630', NOU]);
  assert.deepEqual(V.dependenciesDeclarades(V.capcalera(`-- Depén de ${NOU}_prova.sql i 2611121630_xat_propi.sql.\nSELECT 1;`), '20261113004000').map(x => x.versio), [NOU, '2611121630']);
  const order = { esquema: V.ESQUEMA_ORDRE, restriccions: [{ abans: '2611121630', despres: NOU }] };
  assert.equal(V.llegixOrdre(order, new Set(['2611121630', NOU])).restriccions[0].despres, NOU);
  const readme = V.llegixReadme(`| 1 | \`${NOU}\` | \`${NOU}_prova.sql\` | no acreditat | prova |\n\`\`\`sql\nSELECT true AS te_prova_${NOU};\n\`\`\`\n### Nota d’auditoria\n\`2611121630\` → \`${NOU}\`\n`);
  assert.equal(readme.taula[0]?.versio, NOU);
  assert.equal(readme.sondaVersions.get(NOU)?.alias, `te_prova_${NOU}`);
  assert.equal(readme.cadenes[0]?.despres, NOU);
  assert.equal(V.llegixEmpremtes(JSON.stringify([{ versio: NOU, esperats: 1, presents: 1 }])).perVersio.get(NOU)?.presents, 1);
  assert.deepEqual(V.llegixAplicades(JSON.stringify([NOU, '2611121630'])).versions, ['2611121630', NOU]);
});

test('Node0 includes mixed sources once with exact names, hashes and dependency order', t => {
  const files = {
    [`${NOU}_nou.sql`]: '-- Depén de 2611121630.\nBEGIN; CREATE OR REPLACE VIEW public.mix_view AS SELECT * FROM public.mix_test; CREATE OR REPLACE FUNCTION public.mix_fn() RETURNS integer LANGUAGE sql VOLATILE AS $$SELECT 1$$; COMMIT;',
    '2611121630_antic.sql': sql.replace('COMMIT;', 'CREATE OR REPLACE FUNCTION public.mix_fn() RETURNS integer LANGUAGE sql STABLE AS $$SELECT 1$$; COMMIT;')
  };
  const root = fixture(t, files);
  const plan = creaPlaMigracions({ root });
  assert.deepEqual(plan.migrations.map(m => m.version), ['2611121630', NOU]);
  for (const m of plan.migrations) {
    assert.equal(m.file, `${m.version}_${m.version === NOU ? 'nou' : 'antic'}.sql`);
    assert.equal(m.sha256, hash(files[m.file]));
  }
  const verified = V.verifica({ arrel: root, ara: FUTUR });
  assert.deepEqual(verified.errors, [], 'an object created by the legacy migration is not a future dependency of its full-year consumer');
  assert.equal(verified.catalegFuncions['public.mix_fn'], 'volatile', 'the new full-year definition wins over the historical legacy one');
  assert.equal(verified.migracions.find(m => m.versio === NOU).dependencies.some(d => d.versio === '2611121630' && d.origen === 'inferida'), true);
  fs.writeFileSync(path.join(root, `supabase/migrations/${NOU}_duplicada.sql`), sql);
  assert.throws(() => creaPlaMigracions({ root }), /node0_migration_catalog_invalid/);
  fs.rmSync(path.join(root, `supabase/migrations/${NOU}_duplicada.sql`));
  fs.writeFileSync(path.join(root, 'supabase/migrations/20260230120000_invalid.sql'), sql);
  assert.throws(() => creaPlaMigracions({ root }), /node0_migration_catalog_invalid/);
});

test('shipping bootstrap upgrades legacy ledger in place and keeps mixed replay failclosed on PostgreSQL 18.6', async t => {
  const root = fixture(t, { '2611121630_antic.sql': sql, [`${NOU}_nou.sql`]: `-- Depén de 2611121630.\n${sql}` });
  const plan = creaPlaMigracions({ root });
  const pg = await startLocalPostgres();
  t.after(() => pg.close());
  assert.match((await pg.db.query('SELECT version()')).rows[0].version, /PostgreSQL 18\.6(?:\s|$)/);
  await pg.db.query(`CREATE SCHEMA node0; CREATE TABLE node0.schema_migrations(version text PRIMARY KEY CHECK(version ~ '^[0-9]{10}$'),file text NOT NULL UNIQUE,sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),applied_at timestamptz NOT NULL DEFAULT now());`);
  const old = plan.migrations.find(m => m.version === '2611121630');
  await pg.db.query('INSERT INTO node0.schema_migrations(version,file,sha256) VALUES($1,$2,$3)', [old.version, old.file, old.sha256]);
  const before = (await pg.db.query('SELECT * FROM node0.schema_migrations')).rows[0];
  const generated = generaSql(plan, null, { advisoryLock: false });
  await pg.db.query(generated);
  await pg.db.query(generated);
  assert.deepEqual((await pg.db.query('SELECT * FROM node0.schema_migrations WHERE version=$1', [old.version])).rows[0], before);
  assert.equal((await pg.db.query('SELECT count(*)::int n FROM node0.schema_migrations')).rows[0].n, 2);
  assert.equal((await pg.db.query('SELECT file FROM node0.schema_migrations WHERE version=$1', [NOU])).rows[0].file, `${NOU}_nou.sql`);
  const health = (await pg.db.query(`SELECT json_build_object('schemaVersion',(${SQL_ULTIMA_MIGRACIO_NODE0})) AS value`)).rows[0].value;
  assert.equal(health.schemaVersion, NOU);
  assert.equal(typeof health.schemaVersion, 'string', 'health exposes the original 14-digit ID, never its ordering key');
  await pg.db.query('DELETE FROM node0.schema_migrations WHERE version=$1', [NOU]);
  assert.equal((await pg.db.query(SQL_ULTIMA_MIGRACIO_NODE0)).rows[0].version, old.version);
  await pg.db.query(generated);
  for (const v of ['202611130030', '202611130030000', 'bad']) await assert.rejects(pg.db.query('INSERT INTO node0.schema_migrations(version,file,sha256) VALUES($1,$2,$3)', [v, `${v}.sql`, 'a'.repeat(64)]), e => e.code === '23514');
  await pg.db.query("UPDATE node0.schema_migrations SET sha256=repeat('0',64) WHERE version=$1", [NOU]);
  await assert.rejects(pg.db.query(generated), /node0_migration_ledger_drift/);
});
