#!/usr/bin/env node
// Post-CAS structural merge. Never replaces the incoming manifest with a
// snapshot from another round, and never executes the suites it registers.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SUITES } from '../tests/run-node-tests.mjs';

export const MANIFEST_PATH = 'tooling/tests/node-suite-manifest.json';
export const R21_2_SUITES = Object.freeze([
  { path: 'tests/missatgeria-r21-2-postgres.test.mjs', suite: 'primary', kind: 'postgres', reason: 'R21.2: regressió de missatgeria, consentiment i aïllament sobre PostgreSQL real; cap backend remot.' },
  { path: 'tests/xat-push-omnicanal.test.mjs', suite: 'primary', kind: 'node', reason: 'R21.2: cadena de missatgeria i push omnicanal amb fixtures locals i proveïdors simulats.' },
  { path: 'tests/push-aprovisionament.test.mjs', suite: 'primary', kind: 'node', reason: 'R21.2: aprovisionament i preflight de push amb fixtures, sense secrets ni desplegaments reals.' },
  { path: 'tests/push-registra-suites.test.mjs', suite: 'primary', kind: 'node', reason: 'R21.2: fusió estructural del manifest, idempotència i escriptura atòmica amb fixtures temporals.' },
  { path: 'tests/xat-propi-r21-4-postgres.test.mjs', suite: 'primary', kind: 'postgres', reason: 'R21.4: xat propi d’un sol participant, idempotència, aïllament i absència d’auto-push sobre PostgreSQL real.' },
  { path: 'tests/agents-app-content-r21-5-postgres.test.mjs', suite: 'primary', kind: 'postgres', reason: 'R21.5: purga del catàleg antic, hidratació canònica i preservació de persones i entitats reals sobre PostgreSQL real.' }
].map(Object.freeze));
const fail = message => { throw new Error(`SDP-PUSH-SUITES: ${message}`); };

/** Pure append-only merge. Existing entries, metadata and ordering survive. */
export function mergeR21_2Suites(manifest) {
  if (!manifest || manifest.schema !== 'sdp.node-suites.v1' || !Array.isArray(manifest.files)
      || !Array.isArray(manifest.requiredPrimary) || manifest.requiredPrimary.length === 0) fail('manifest invàlid');
  const existing = new Map();
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== 'string' || !entry.path || !SUITES.includes(entry.suite)
        || typeof entry.reason !== 'string' || !entry.reason.trim()) fail('entrada invàlida');
    if (existing.has(entry.path)) fail(`ruta duplicada: ${entry.path}`);
    existing.set(entry.path, entry);
  }
  if (manifest.requiredPrimary.some(p => typeof p !== 'string')
      || new Set(manifest.requiredPrimary).size !== manifest.requiredPrimary.length) fail('requiredPrimary invàlid o duplicat');
  for (const p of manifest.requiredPrimary) {
    if (existing.get(p)?.suite !== 'primary') fail(`cobertura primària incompatible: ${p}`);
  }
  const merged = structuredClone(manifest);
  const added = [];
  const requiredAdded = [];
  for (const expected of R21_2_SUITES) {
    const entry = existing.get(expected.path);
    if (entry && (entry.suite !== expected.suite || (entry.kind !== undefined && entry.kind !== expected.kind))) {
      fail(`categoria incompatible: ${expected.path}`);
    }
    if (!entry) { merged.files.push({ ...expected }); added.push(expected.path); }
    if (!merged.requiredPrimary.includes(expected.path)) {
      merged.requiredPrimary.push(expected.path);
      requiredAdded.push(expected.path);
    }
  }
  return { manifest: merged, added, requiredAdded, changed: added.length > 0 || requiredAdded.length > 0 };
}

// Root is canonicalized once (macOS /tmp is itself an OS symlink). Every
// component below that root is checked with lstat and cannot be a symlink.
function checkedPath(root, relative, file = true) {
  const segments = relative.split('/');
  if (path.isAbsolute(relative) || segments.some(s => !s || s === '.' || s === '..' || s.includes('\\'))) fail('ruta no confinada');
  let absolute = root;
  for (let i = 0; i < segments.length; i++) {
    absolute = path.join(absolute, segments[i]);
    let stat;
    try { stat = fs.lstatSync(absolute); } catch { fail(`ruta absent o il·legible: ${relative}`); }
    if (stat.isSymbolicLink()) fail(`symlink rebutjat: ${relative}`);
    const last = i === segments.length - 1;
    if ((!last || !file) ? !stat.isDirectory() : !stat.isFile()) fail(`ruta no regular: ${relative}`);
  }
  return absolute;
}

function readManifest(root) {
  const absolute = checkedPath(root, MANIFEST_PATH);
  let fd;
  try {
    fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024) fail('manifest no regular o massa gran');
    const bytes = fs.readFileSync(fd);
    let manifest;
    try { manifest = JSON.parse(bytes.toString('utf8')); } catch { fail('JSON del manifest invàlid'); }
    return { absolute, stat, bytes, manifest };
  } catch (error) {
    if (error.message?.startsWith('SDP-PUSH-SUITES:')) throw error;
    fail('manifest il·legible');
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}

/** Read-only readiness check: every explicitly listed suite must be installed. */
export function inspectRegistration(root) {
  let canonical;
  try { canonical = fs.realpathSync(root); } catch { fail('arrel absent o il·legible'); }
  checkedPath(canonical, 'tests', false);
  for (const entry of R21_2_SUITES) checkedPath(canonical, entry.path);
  const original = readManifest(canonical);
  return { root: canonical, original, ...mergeR21_2Suites(original.manifest) };
}

/** Atomic same-directory rename, guarded against observed concurrent edits. */
export function applyRegistration(root) {
  const inspected = inspectRegistration(root);
  if (!inspected.changed) return { changed: false, added: [], requiredAdded: [] };
  const { original } = inspected;
  const lock = `${original.absolute}.r21-2.lock`;
  const temporary = `${original.absolute}.r21-2.${randomUUID()}.tmp`;
  let lockFd;
  let temporaryFd;
  let ownsLock = false;
  try {
    try { lockFd = fs.openSync(lock, 'wx', 0o600); ownsLock = true; } catch { fail('registre ocupat; no s’ha canviat el manifest'); }
    temporaryFd = fs.openSync(temporary, 'wx', original.stat.mode & 0o777);
    fs.writeFileSync(temporaryFd, `${JSON.stringify(inspected.manifest, null, 2)}\n`);
    fs.fsyncSync(temporaryFd);
    fs.closeSync(temporaryFd); temporaryFd = undefined;
    // Recheck files and current preimage immediately before the atomic rename.
    const current = inspectRegistration(inspected.root).original;
    if (!current.bytes.equals(original.bytes) || current.stat.ino !== original.stat.ino || current.stat.dev !== original.stat.dev) {
      fail('el manifest ha canviat durant la fusió; reintent requerit');
    }
    fs.renameSync(temporary, original.absolute);
    return { changed: true, added: inspected.added, requiredAdded: inspected.requiredAdded };
  } catch (error) {
    if (error.message?.startsWith('SDP-PUSH-SUITES:')) throw error;
    fail('aplicació atòmica fallida; comprova el manifest abans de reintentar');
  } finally {
    if (temporaryFd !== undefined) fs.closeSync(temporaryFd);
    try { fs.unlinkSync(temporary); } catch { /* absent after successful rename */ }
    if (lockFd !== undefined) fs.closeSync(lockFd);
    if (ownsLock) { try { fs.unlinkSync(lock); } catch { /* no secret or path output */ } }
  }
}

const USAGE = 'node tooling/push/registra-suites.mjs [--root DIRECTORI] [--check | --apply]\nSense bandera: comprovació en sec. Eixides: 0 registrat/aplicat, 1 pendent de fusió, 2 error. --apply només fusiona el manifest; no executa proves.';
export function main(argv = process.argv.slice(2), output = line => process.stdout.write(`${line}\n`)) {
  let root = fileURLToPath(new URL('../..', import.meta.url));
  let mode = 'check';
  let selected = false;
  let rootSelected = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help') { output(USAGE); return 0; }
    if (arg === '--root' && argv[i + 1] && !argv[i + 1].startsWith('--') && !rootSelected) { root = path.resolve(argv[++i]); rootSelected = true; }
    else if ((arg === '--check' || arg === '--apply') && !selected) { mode = arg.slice(2); selected = true; }
    else fail('opcions incompatibles o desconegudes; usa --help');
  }
  const result = mode === 'apply' ? applyRegistration(root) : inspectRegistration(root);
  output(JSON.stringify({ schema: 'sdp.push.register-suites.v1', mode, changed: result.changed, added: result.added, requiredAdded: result.requiredAdded }));
  return mode === 'check' && result.changed ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message?.startsWith('SDP-PUSH-SUITES:') ? error.message : 'SDP-PUSH-SUITES: error controlat'}\n`); process.exitCode = 2; }
}
