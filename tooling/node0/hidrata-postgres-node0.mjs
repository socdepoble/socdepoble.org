#!/usr/bin/env node
/** Dedicated PostgreSQL Node 0 bootstrap, canonical migrations and verified public Open Data.
 * Dry-run by default. PGHOST/PGDATABASE/PGUSER/PGPASSWORD stay in the server environment.
 * Compatibility schemas are not a GoTrue, Storage or Realtime implementation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { capcalera, dependenciesDeclarades, llegixOrdre, ordena } from '../../scripts/supabase/verifica-migracions.mjs';
import { llegeixPaquetOpenData } from '../../src/data/importaMunicipiOpenData.js';
import { llegeixZipNodeZero } from './paquet-opendata-node0.mjs';

export const ZIP_CANONIC = 'public/opendata/dades-obertes-la-torre-de-les-macanes-20261103.zip';
export const SHA256_ZIP_CANONIC = 'fb1611627c2cd2e23defe38f04d9dd58ed7cdc2a95766d5c5fc381f500a651be';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
/** RFC 4122 UUIDv5 in the DNS namespace; local municipality identity, not a user. */
export function uuidMunicipi(slug) {
  const namespace = Buffer.from('6ba7b8109dad11d180b400c04fd430c8', 'hex');
  const bytes = createHash('sha1').update(namespace).update(`socdepoble.cat/node0/municipi/${slug}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
/** Contract date/time are municipal wall-clock fields, never UTC projections. */
export function dataHoraMunicipal(value) {
  if (typeof value !== 'string') return {};
  const match = /^(\d{4}-\d{2}-\d{2})(?:T([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return {};
  const day = new Date(`${match[1]}T00:00:00Z`);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== match[1]) return {};
  return { date: match[1], ...(match[2] ? { time: `${match[2]}:${match[3]}` } : {}) };
}
const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
const dollar = (text, prefix = 'node0') => {
  let tag = '$' + prefix + '_' + sha(text).slice(0, 16) + '$';
  while (text.includes(tag)) tag = tag.slice(0, -1) + '_$';
  return tag + text + tag;
};

/** Split only top-level SQL statements; preserve every byte inside quoted functions. */
export function sentenciesSql(sql) {
  const statements = [];
  let start = 0, i = 0, state = '', tag = '', depth = 0;
  while (i < sql.length) {
    const c = sql[i], next = sql[i + 1];
    if (state === 'line') { if (c === '\n') state = ''; i++; continue; }
    if (state === 'comment') {
      if (c === '/' && next === '*') { depth++; i += 2; continue; }
      if (c === '*' && next === '/') { if (--depth === 0) state = ''; i += 2; continue; }
      i++; continue;
    }
    if (state === 'dollar') { if (sql.startsWith(tag, i)) { i += tag.length; state = ''; } else i++; continue; }
    if (state === 'single' || state === 'double') {
      const q = state === 'single' ? "'" : '"';
      if (c === q) { if (next === q) { i += 2; continue; } state = ''; }
      // PostgreSQL E'...' is accepted conservatively: protect the following quote.
      else if (state === 'single' && c === '\\') { i += 2; continue; }
      i++; continue;
    }
    if (c === '-' && next === '-') { state = 'line'; i += 2; continue; }
    if (c === '/' && next === '*') { state = 'comment'; depth = 1; i += 2; continue; }
    if (c === "'" || c === '"') { state = c === "'" ? 'single' : 'double'; i++; continue; }
    if (c === '$') {
      const match = /^(?:\$[A-Za-z_][A-Za-z0-9_]*\$|\$\$)/.exec(sql.slice(i));
      if (match) { tag = match[0]; state = 'dollar'; i += tag.length; continue; }
    }
    if (c === ';') { statements.push(sql.slice(start, i + 1)); start = i + 1; }
    i++;
  }
  if (state && state !== 'line') throw new TypeError('node0_sql_unterminated');
  if (sql.slice(start).trim()) statements.push(sql.slice(start));
  return statements;
}
const withoutComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim();
/** Retain source hash but fold the existing outer transaction into the migration+ledger transaction. */
export function cosMigracio(sql) {
  const statements = sentenciesSql(sql);
  const meaningful = statements.map((raw, index) => ({ raw, index, head: withoutComments(raw) })).filter(s => s.head);
  const transactions = meaningful.filter(s => /^(?:BEGIN|COMMIT|ROLLBACK|START\s+TRANSACTION)\b/i.test(s.head));
  if (!transactions.length) return sql;
  if (transactions.length !== 2 || transactions[0] !== meaningful[0] || transactions[1] !== meaningful.at(-1)
    || !/^BEGIN\s*;$/i.test(transactions[0].head) || !/^COMMIT\s*;$/i.test(transactions[1].head)) {
    throw new TypeError('node0_sql_transaction_not_supported');
  }
  return statements.filter((_, i) => i !== transactions[0].index && i !== transactions[1].index).join('');
}

export function creaPlaMigracions({ root = ROOT } = {}) {
  const directory = path.join(root, 'supabase/migrations');
  const files = fs.readdirSync(directory).filter(file => /^\d{10}_.+\.sql$/.test(file)).sort();
  const versions = files.map(file => file.slice(0, 10));
  if (!files.length || versions.length !== new Set(versions).size) throw new TypeError('node0_migration_catalog_invalid');
  const orderBytes = fs.readFileSync(path.join(root, 'supabase/ordre_desplegament.json'));
  const declared = llegixOrdre(orderBytes.toString('utf8'), new Set(versions));
  const sources = new Map(files.map(file => {
    const bytes = fs.readFileSync(path.join(directory, file));
    return [file.slice(0, 10), { version: file.slice(0, 10), file, sha256: sha(bytes), sql: bytes.toString('utf8') }];
  }));
  const dependencies = new Map([...sources.values()].map(source => [source.version,
    dependenciesDeclarades(capcalera(source.sql), source.version).filter(d => d.versio < source.version).map(d => d.versio)]));
  const order = ordena({ versions, dependencies, restriccions: declared.restriccions, portes: declared.portes });
  if (order.errors.length) throw new TypeError('node0_migration_order_invalid');
  const migrations = order.ordre.filter(p => p.tipus === 'migracio').map(p => sources.get(p.id));
  if (migrations.length !== files.length || migrations.some(p => !p)) throw new TypeError('node0_migration_catalog_incomplete');
  for (const migration of migrations) migration.body = cosMigracio(migration.sql);
  return { migrations, orderSha256: sha(orderBytes),
    // Operational function/client gates need their own deployments; SQL does not claim them.
    gates: declared.portes,
    bootstrap: fs.readFileSync(path.join(root, 'tooling/node0/bootstrap-node0.sql'), 'utf8') };
}

export async function preparaHidratacio({ root = ROOT, zip = ZIP_CANONIC, sha256Esperat = SHA256_ZIP_CANONIC } = {}) {
  if (!/^[0-9a-f]{64}$/.test(sha256Esperat)) throw new TypeError('node0_zip_expected_hash_required');
  const bytes = await llegeixZipNodeZero({root,zip,sha256Esperat});
  const packageData = await llegeixPaquetOpenData(bytes, { sha256Esperat });
  if (packageData.versio !== '1.2.0') throw new TypeError('node0_opendata_version_expected_120');
  const documents = [{ kind: 'towns', id: packageData.slug,
    document: { ...packageData.municipi, id: packageData.slug, name: packageData.municipi.nom }, source_uri: null }];
  const projections = { entitats: 'agents', noticies: 'feedPosts', agenda: 'events', memoria: 'pages', memoriaOral: 'pages' };
  for (const [collection, kind] of Object.entries(projections)) {
    for (const source of packageData.lot[collection] ?? []) {
      if (source.visibility !== 'public') throw new TypeError('node0_private_document');
      const document = { ...source };
      if (collection === 'noticies') Object.assign(document, { content: source.body || '', summary: source.entradilla || '', type: 'post' });
      if (collection === 'agenda') Object.assign(document, { ...dataHoraMunicipal(source.inici), type: 'event', summary: source.entradilla || '' });
      if (collection === 'memoria') Object.assign(document, { content: source.text || '', type: 'memory' });
      if (collection === 'memoriaOral') Object.assign(document, { content: source.okf.cos, type: 'oral-memory' });
      documents.push({ kind, id: source.id, document, source_uri: null });
    }
  }
  return { sha256: packageData.sha256, version: packageData.versio, municipality: packageData.slug, municipalityId: uuidMunicipi(packageData.slug), documents,
    omissions: { perfils: 'No personal profiles in the public Open Data package.', mercat: 'No market collection in this package.',
      organizations: 'Canonical organization insert requires a real creator: add_organization_owner writes a NOT NULL user_id. Entities remain in app_content agents and public_documents; no fake owner or disabled trigger.' },
    integrity: 'SHA-256 pin, BagIt, resource hashes, strict schemas and canonical regeneration; no origin signature.' };
}

/** One advisory-locked session; each source+ledger record is one PostgreSQL statement transaction. */
export function generaSql({ migrations, bootstrap }, hydration = null, { advisoryLock = true } = {}) {
  const lock = advisoryLock ? "SELECT pg_advisory_lock(1935960372, 1701737586);\n" : '';
  const unlock = advisoryLock ? "\nSELECT pg_advisory_unlock(1935960372, 1701737586);\n" : '';
  const known = migrations.map(m => `(${literal(m.version)},${literal(m.file)},${literal(m.sha256)})`).join(',');
  const check = `DO $node0_ledger$ BEGIN
    IF EXISTS(SELECT 1 FROM node0.schema_migrations l LEFT JOIN (VALUES ${known}) AS s(version,file,sha256)
      ON s.version=l.version WHERE s.version IS NULL OR s.file<>l.file OR s.sha256<>l.sha256) THEN
      RAISE EXCEPTION 'node0_migration_ledger_drift';
    END IF;
  END $node0_ledger$;`;
  const steps = migrations.map(m => `DO $node0_migrate$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM node0.schema_migrations WHERE version=${literal(m.version)}) THEN
      EXECUTE ${dollar(m.body, 'source')};
      INSERT INTO node0.schema_migrations(version,file,sha256) VALUES(${literal(m.version)},${literal(m.file)},${literal(m.sha256)});
    END IF;
  END $node0_migrate$;`);
  const inserts = hydration?.documents.map(d => `INSERT INTO node0.public_documents(kind,id,document,source_uri)
    VALUES(${literal(d.kind)},${literal(d.id)},${dollar(JSON.stringify(d.document), 'json')}::jsonb,NULL)
    ON CONFLICT(kind,id) DO NOTHING;`) ?? [];
  let canonical = '';
  if (hydration) {
    const town = hydration.documents.find(d => d.kind === 'towns')?.document;
    canonical = `DO $node0_town$ BEGIN
      IF EXISTS(SELECT 1 FROM public.towns WHERE slug=${literal(hydration.municipality)} AND id<>${literal(hydration.municipalityId)}::uuid) THEN
        RAISE EXCEPTION 'node0_town_identity_conflict';
      END IF;
    END $node0_town$;
    INSERT INTO public.towns(id,slug,name) VALUES(${literal(hydration.municipalityId)}::uuid,${literal(hydration.municipality)},${literal(town.name)})
      ON CONFLICT(id) DO NOTHING;
    `;
    for (const kind of ['towns', 'agents', 'feedPosts', 'events', 'pages']) {
      const payload = hydration.documents.filter(d => d.kind === kind).map(d => d.document);
      canonical += `INSERT INTO public.app_content(tenant_id,key,payload)
        VALUES(${literal(hydration.municipalityId)}::uuid,${literal(kind)},${dollar(JSON.stringify(payload), 'payload')}::jsonb)
        ON CONFLICT(tenant_id,key) DO NOTHING;\n`;
    }
  }
  const hydrate = hydration ? `BEGIN;\n${canonical}\n${inserts.join('\n')}\nUPDATE node0.public_documents d SET document=v.value||jsonb_build_object('_editorialClau',c.key,'_editorialVersio',c.version) FROM public.app_content c CROSS JOIN LATERAL jsonb_array_elements(c.payload) v(value) WHERE c.tenant_id=${literal(hydration.municipalityId)}::uuid AND c.key IN ('feedPosts','events','marketItems','pages') AND d.kind=c.key AND d.id=v.value->>'id';\nCOMMIT;` : '';
  return lock + bootstrap + '\n' + check + '\n' + steps.join('\n') + '\n' + hydrate + unlock;
}

export function validaEntornLocal(env) {
  const host = env.PGHOST || '';
  if (!(/^\/[A-Za-z0-9_./-]*$/.test(host) || ['127.0.0.1', '::1'].includes(host))) throw new TypeError('node0_pg_host_must_be_local');
  if (!/^[A-Za-z_][A-Za-z0-9_-]{0,62}$/.test(env.PGDATABASE || '') || ['postgres','template0','template1'].includes(env.PGDATABASE)) throw new TypeError('node0_dedicated_database_required');
  if (!env.PGUSER || env.PGUSER === 'node0_runtime') throw new TypeError('node0_migration_operator_required');
  if (env.PGSERVICE || env.PGSERVICEFILE || env.PGOPTIONS || env.PGHOSTADDR) throw new TypeError('node0_pg_connection_override_rejected');
}

export function aplicaAmbPsql(sql, { env = process.env, run = spawnSync } = {}) {
  validaEntornLocal(env);
  const result = run(env.NODE0_PSQL || 'psql', ['-X', '-w', '--set', 'ON_ERROR_STOP=1', '--quiet', '--file', '-'], {
    env: { ...env, PGCONNECT_TIMEOUT: '5', PSQL_HISTORY: '/dev/null' }, input: sql, encoding: 'utf8', maxBuffer: 1024 * 1024,
    timeout: 120_000, shell: false
  });
  // Never print psql stderr/stdout: SQL errors may echo document content or environment connection material.
  if (result.error || result.status !== 0) throw new Error('node0_psql_apply_failed');
  return { applied: true };
}

export async function main(argv = process.argv.slice(2), { env = process.env, stdout = process.stdout, stderr = process.stderr } = {}) {
  try {
    let apply = false, root = ROOT, zip = ZIP_CANONIC, expected = SHA256_ZIP_CANONIC;
    for (const arg of argv) {
      if (arg === '--apply') apply = true;
      else if (arg.startsWith('--root=')) root = path.resolve(arg.slice(7));
      else if (arg.startsWith('--zip=')) zip = arg.slice(6);
      else if (arg.startsWith('--sha256=')) expected = arg.slice(9);
      else throw new TypeError('node0_argument_unknown');
    }
    const plan = creaPlaMigracions({ root });
    const hydration = await preparaHidratacio({ root, zip, sha256Esperat: expected });
    const receipt = { applied: false, migrations: plan.migrations.map(({version,file,sha256}) => ({version,file,sha256})),
      orderSha256: plan.orderSha256, data: { ...hydration, documents: undefined, counts: Object.fromEntries([...new Set(hydration.documents.map(d => d.kind))].map(kind => [kind, hydration.documents.filter(d => d.kind === kind).length])) },
      compatibility: 'Local auth/storage/realtime SQL schemas only; no real identity provider or media delivery.' };
    if (apply) Object.assign(receipt, aplicaAmbPsql(generaSql(plan, hydration), { env }));
    stdout.write(JSON.stringify(receipt, null, 2) + '\n');
    return 0;
  } catch (error) {
    // Only controlled error identifiers; malformed source/SQL errors are not exposed.
    stderr.write(JSON.stringify({ applied: false, error: /^node0_[a-z0-9_]+$/.test(error?.message || '') ? error.message : 'node0_preflight_failed' }) + '\n');
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = await main();
