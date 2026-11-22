#!/usr/bin/env node
/** R32.43: duplicats de public/assets congelats per bytes, SHA-256 i conjunt de rutes.
 * Només lectura. El registre no és una llista blanca de hashes reutilitzables:
 * una còpia addicional, un canvi de bytes o una ruta retirada requerixen revisió.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { esMain } from '../lib/arrel.mjs';

export const SCHEMA_DUPLICATS = 'sdp.duplicats-public.v1';
export const REGISTRE_DUPLICATS = fileURLToPath(new URL('./duplicats-public.registre.json', import.meta.url));
const SCOPE = 'public/assets';
const hashPattern = /^[a-f0-9]{64}$/;
const sorted = values => [...values].sort();
const equalPaths = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
const ownKeys = (obj, allowed) => Object.keys(obj).every(key => allowed.includes(key));

export function validaRegistreDuplicats(registre) {
  if (!registre || typeof registre !== 'object' || Array.isArray(registre)
      || registre.schema !== SCHEMA_DUPLICATS || registre.scope !== SCOPE
      || !Array.isArray(registre.groups)
      || !ownKeys(registre, ['schema', 'scope', 'base', 'frozenAt', 'groups'])) throw Error('Registre de duplicats invàlid.');
  const seenHashes = new Set(), seenPaths = new Set();
  for (const group of registre.groups) {
    if (!group || typeof group !== 'object' || Array.isArray(group)
        || !ownKeys(group, ['sha256', 'bytes', 'paths', 'reason'])
        || !hashPattern.test(group.sha256) || seenHashes.has(group.sha256)
        || !Number.isSafeInteger(group.bytes) || group.bytes < 0
        || typeof group.reason !== 'string' || !group.reason.trim()
        || !Array.isArray(group.paths) || group.paths.length < 2) throw Error('Grup congelat invàlid o repetit.');
    seenHashes.add(group.sha256);
    for (const file of group.paths) {
      if (typeof file !== 'string' || !file.startsWith(`${SCOPE}/`)
          || file !== file.normalize('NFC') || file.includes('\\') || /[\p{Cc}\p{Cf}*?<>:"|]/u.test(file)
          || file.split('/').some(segment => !segment || ['.', '..'].includes(segment))
          || seenPaths.has(file)) throw Error('Ruta congelada invàlida o repetida.');
      seenPaths.add(file);
    }
    if (!equalPaths(group.paths, sorted(group.paths))) throw Error('Les rutes congelades han d’estar ordenades.');
  }
  return registre;
}

/** API amb arrel i registre explícits per a fixtures portables; no importa l’app. */
export function auditaDuplicatsPublic({ root = process.cwd(), registre = REGISTRE_DUPLICATS } = {}) {
  const issues = [], actualFiles = new Map(), bySize = new Map(), groups = [];
  let hashes = 0, bytesRead = 0;
  const issue = (code, file, message, extra = {}) => issues.push({ code, path: file, message, ...extra });
  try {
    root = fs.realpathSync(path.resolve(root));
    if (!fs.lstatSync(root).isDirectory()) throw Error('L’arrel no és un directori.');
    registre = validaRegistreDuplicats(typeof registre === 'string' ? JSON.parse(fs.readFileSync(registre, 'utf8')) : registre);
    // Comprova també public/: un pare simbòlic no pot escapar de l’arrel.
    for (const directory of ['public', SCOPE]) {
      const st = fs.lstatSync(path.join(root, directory));
      if (!st.isDirectory() || st.isSymbolicLink()) throw Error(`Directori d’actius no regular: ${directory}`);
    }
    const walk = relative => {
      for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const file = `${relative}/${entry.name}`, absolute = path.join(root, file), st = fs.lstatSync(absolute);
        if (st.isSymbolicLink()) issue('DP0', file, 'Symlink d’actius rebutjat; no es seguix.');
        else if (st.isDirectory()) walk(file);
        else if (st.isFile()) {
          const record = { path: file, absolute, bytes: st.size, sha256: null };
          actualFiles.set(file, record);
          if (!bySize.has(st.size)) bySize.set(st.size, []);
          bySize.get(st.size).push(record);
        } else issue('DP0', file, 'Actiu no regular.');
      }
    };
    walk(SCOPE);
    const digest = record => {
      if (record.sha256 !== null) return record.sha256;
      const fd = fs.openSync(record.absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
      const hash = crypto.createHash('sha256'), buffer = Buffer.allocUnsafe(65536);
      try {
        const before = fs.fstatSync(fd);
        if (!before.isFile() || before.size !== record.bytes) throw Error(`Actiu canviat durant el cens: ${record.path}`);
        let count;
        while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) { hash.update(buffer.subarray(0, count)); bytesRead += count; }
        const after = fs.fstatSync(fd), current = fs.lstatSync(record.absolute);
        if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs
            || current.isSymbolicLink() || before.dev !== current.dev || before.ino !== current.ino) throw Error(`Actiu canviat durant la lectura: ${record.path}`);
      } finally { fs.closeSync(fd); }
      hashes++;
      record.sha256 = hash.digest('hex');
      return record.sha256;
    };
    const expected = new Map(registre.groups.map(group => [group.sha256, group]));
    for (const sameSize of bySize.values()) {
      if (sameSize.length < 2) continue;
      const sameHash = new Map();
      for (const file of sameSize) {
        const sha256 = digest(file);
        if (!sameHash.has(sha256)) sameHash.set(sha256, []);
        sameHash.get(sha256).push(file);
      }
      for (const [sha256, files] of sameHash) {
        if (files.length < 2) continue;
        const paths = sorted(files.map(file => file.path)), known = expected.get(sha256);
        const allowed = !!known && known.bytes === files[0].bytes && equalPaths(paths, known.paths);
        groups.push({ sha256, bytes: files[0].bytes, paths, allowed });
        if (!allowed) issue(known ? 'DP2' : 'DP1', paths[0], known
          ? 'El conjunt de rutes duplicades diferix del registre congelat.'
          : 'Nou grup de binaris duplicats fora del registre congelat.', { sha256, paths });
      }
    }
    // Les rutes històriques formen part del contracte: no desapareixen silenciosament.
    for (const group of registre.groups) for (const file of group.paths) {
      const actual = actualFiles.get(file);
      if (!actual) issue('DP3', file, 'Ruta congelada absent; cal revisar referències abans de retirar-la.');
      else if (actual.bytes !== group.bytes || digest(actual) !== group.sha256) issue('DP3', file, 'Mida o SHA-256 divergent del registre congelat.');
    }
  } catch (error) { issue('DP0', SCOPE, `No s’ha pogut completar el cens: ${error.message}`); }
  return { valid: issues.length === 0, root, scope: SCOPE,
    stats: { files: actualFiles.size, hashes, bytesRead, duplicateGroups: groups.length, frozenGroups: registre?.groups?.length ?? 0 },
    groups: groups.sort((a, b) => a.sha256.localeCompare(b.sha256)), issues };
}

export function main(argv = process.argv.slice(2)) {
  let root = process.cwd(), registre = REGISTRE_DUPLICATS, json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') json = true;
    else if (['--arrel', '--registre'].includes(argv[i]) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      if (argv[i] === '--arrel') root = argv[++i]; else registre = argv[++i];
    } else throw Error(`Argument invàlid: ${argv[i]}`);
  }
  const report = auditaDuplicatsPublic({ root, registre });
  if (json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    for (const entry of report.issues) process.stdout.write(`[${entry.code}] ${entry.path}: ${entry.message}\n`);
    process.stdout.write(`Duplicats públics: ${report.stats.duplicateGroups} grups, ${report.issues.length} infraccions.\n`);
  }
  return report;
}

// v1.2.22 · Entrada canònica (lib/arrel.mjs): la Porta Arrel A4 la reconeix i resol l'enllaç simbòlic d'argv[1].
if (esMain(import.meta.url)) {
  try { process.exitCode = main().valid ? 0 : 1; }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
