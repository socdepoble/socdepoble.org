#!/usr/bin/env node
/**
 * Kits CAS locals, sense dependències ni ordres executables al manifest.
 *
 * create --source BASE --candidate CANDIDAT --kit DESTI --name NOM --path RUTA [...]
 *        [--precondition RUTA ...]
 * check  --kit KIT --target ARBRE      (només lectura de l'arbre destí)
 * apply  --kit KIT --target ARBRE      (CAS estricte, sense --force)
 *
 * API: generateKit({sourceRoot,candidateRoot,kitRoot,paths,name,preconditions:[]})
 *      applyKit({kitRoot,targetRoot,write:false})
 * `source_sha256: null` exigix absència; `target_sha256: null` és una retirada.
 * Les precondicions són rutes de BASE que el kit no modifica. Tot el payload,
 * modes, preimatges i hashes es validen abans de cap escriptura al destí.
 *
 * Cada rename és atòmic; el conjunt té staging previ i rollback davant errors
 * capturables, NO una transacció del sistema de fitxers davant tall de corrent
 * o SIGKILL. El lock és cooperatiu entre aplicadors; no bloqueja editors aliens.
 * Els hashes detecten corrupció i divergència, no autentiquen l'autor del kit.
 * La Frontissa avalua JavaScript: reviseu el codi abans d'executar un kit alié.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const SCHEMA = 'sdp.kit-carril.v1';
const LOCK = '.kit-carril.lock';
const REGISTRY = '.agents/contingut_estructural.json';
const GATE = 'tooling/gates/frontissa-contingut.mjs';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const has = (object, key) => Object.hasOwn(object, key);
const fail = message => { throw new Error(`[kit-carril] ${message}`); };

function rootDirectory(value) {
  if (typeof value !== 'string' || !value) fail('Cal una arrel explícita');
  const root = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(root).isDirectory()) fail(`Arrel no regular: ${value}`);
  return root;
}

/** Forma única, portable entre macOS/Linux/Windows i sense àlies de ruta. */
export function validatePath(value) {
  if (typeof value !== 'string' || !value || value.length > 4096 || value !== value.normalize('NFC')
      || value.includes('\\') || /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value) || path.posix.isAbsolute(value)) {
    fail('Ruta relativa invàlida');
  }
  for (const segment of value.split('/')) {
    if (!segment || segment === '.' || segment === '..' || /[ .]$/.test(segment)
        || /[<>:"|?*]/.test(segment) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment)
        || ['.git', 'node_modules', LOCK].includes(segment.toLowerCase())
        || segment.toLowerCase().startsWith('.kit-carril-stage-') || /^\.env(?:\.|$)/i.test(segment)) {
      fail(`Segment de ruta prohibit: ${segment}`);
    }
  }
  return value;
}

function pathSet(paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail('Llista de rutes buida');
  const seen = new Set();
  const result = paths.map(validatePath).sort();
  for (const name of result) {
    const key = name.toLowerCase();
    if (seen.has(key)) fail(`Ruta duplicada: ${name}`);
    for (const previous of seen) {
      if (key.startsWith(`${previous}/`) || previous.startsWith(`${key}/`)) fail(`Rutes solapades: ${name}`);
    }
    seen.add(key);
  }
  return result;
}

/** No seguix symlinks ni accepta directoris, dispositius o hardlinks al full. */
function inspect(root, name) {
  validatePath(name);
  let absolute = root;
  const segments = name.split('/');
  for (let i = 0; i < segments.length; i += 1) {
    absolute = path.join(absolute, segments[i]);
    let stat;
    try { stat = fs.lstatSync(absolute); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    if (stat.isSymbolicLink()) fail(`Symlink prohibit: ${name}`);
    if (i < segments.length - 1) {
      if (!stat.isDirectory()) fail(`Pare no és directori: ${name}`);
    } else {
      if (!stat.isFile() || stat.nlink > 1) fail(`Fitxer no regular o hardlink: ${name}`);
      const bytes = fs.readFileSync(absolute);
      return { bytes, sha256: hash(bytes), mode: stat.mode & 0o777 };
    }
  }
  return null;
}

function sameState(actual, sha256, mode) {
  return sha256 === null ? actual === null : actual?.sha256 === sha256 && actual?.mode === mode;
}

function mode(value) { return Number.isInteger(value) && value >= 0 && value <= 0o777; }
function digest(value) { return value === null || typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
function writeFile(root, name, bytes, permissions = 0o644) {
  const destination = path.join(root, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const fd = fs.openSync(destination, 'wx', permissions);
  try { fs.writeFileSync(fd, bytes); fs.fchmodSync(fd, permissions); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}

/** Publica un kit complet amb un sol rename, sense sobreescriure kits existents. */
export function generateKit({ sourceRoot, candidateRoot, kitRoot, paths, name, preconditions = [] }) {
  const source = rootDirectory(sourceRoot);
  const candidate = rootDirectory(candidateRoot);
  if (typeof kitRoot !== 'string' || !kitRoot || typeof name !== 'string' || !name.trim()) fail('Cal kitRoot i name');
  const requested = path.resolve(kitRoot);
  const parent = rootDirectory(path.dirname(requested));
  const destination = path.join(parent, path.basename(requested));
  if ([source, candidate].some(root => destination === root || destination.startsWith(`${root}${path.sep}`))) {
    fail('El kit ha d’estar fora dels arbres font i candidat');
  }
  if (fs.existsSync(destination)) fail('El kit destí ja existix');
  const files = pathSet(paths).map(relative => {
    const before = inspect(source, relative);
    const after = inspect(candidate, relative);
    if (!before && !after) fail(`Ruta absent als dos arbres: ${relative}`);
    if (sameState(before, after?.sha256 ?? null, after?.mode ?? null)) fail(`Ruta sense canvis: ${relative}`);
    return { path: relative, source_sha256: before?.sha256 ?? null, target_sha256: after?.sha256 ?? null,
      source_mode: before?.mode ?? null, target_mode: after?.mode ?? null, before, after };
  });
  if (!Array.isArray(preconditions)) fail('Precondicions invàlides');
  const conditions = preconditions.length ? pathSet(preconditions).map(relative => {
    if (files.some(file => file.path.toLowerCase() === relative.toLowerCase())) fail(`Precondició modificada: ${relative}`);
    const before = inspect(source, relative);
    const tested = inspect(candidate, relative);
    if (!sameState(tested, before?.sha256 ?? null, before?.mode ?? null)) fail(`Precondició divergent al candidat: ${relative}`);
    return { path: relative, source_sha256: before?.sha256 ?? null, source_mode: before?.mode ?? null };
  }) : [];
  pathSet([...files.map(file => file.path), ...conditions.map(file => file.path)]);
  const manifest = { schema: SCHEMA, name, files: files.map(file => ({
    path: file.path, source_sha256: file.source_sha256, target_sha256: file.target_sha256,
    source_mode: file.source_mode, target_mode: file.target_mode
  })), preconditions: conditions };
  const staging = fs.mkdtempSync(path.join(parent, '.kit-carril-stage-'));
  try {
    for (const file of files) {
      if (file.after) writeFile(staging, `payload/${file.path}`, file.after.bytes, file.after.mode);
      if (file.before) writeFile(staging, `preimages/${file.path}`, file.before.bytes, file.before.mode);
    }
    const content = `${JSON.stringify(manifest, null, 2)}\n`;
    writeFile(staging, 'manifest.json', content);
    writeFile(staging, 'manifest.sha256', `${hash(content)}  manifest.json\n`);
    if (fs.existsSync(destination)) fail('El kit destí ha aparegut durant la generació');
    fs.renameSync(staging, destination);
  } finally { fs.rmSync(staging, { recursive: true, force: true }); }
  return manifest;
}

function loadKit(kitRoot) {
  const kit = rootDirectory(kitRoot);
  const content = inspect(kit, 'manifest.json');
  const sidecar = inspect(kit, 'manifest.sha256');
  if (!content || !sidecar || sidecar.bytes.toString('utf8') !== `${content.sha256}  manifest.json\n`) fail('Hash del manifest divergent');
  let manifest;
  try { manifest = JSON.parse(content.bytes); } catch { fail('JSON de manifest invàlid'); }
  if (manifest?.schema !== SCHEMA || typeof manifest.name !== 'string' || !manifest.name.trim()
      || !Array.isArray(manifest.files) || !Array.isArray(manifest.preconditions)) fail('Esquema de manifest invàlid');
  pathSet(manifest.files.map(file => file?.path));
  pathSet([...manifest.files, ...manifest.preconditions].map(file => file?.path));
  const files = manifest.files.map(file => {
    for (const prefix of ['source', 'target']) {
      if (!has(file, `${prefix}_sha256`) || !digest(file[`${prefix}_sha256`])
          || !has(file, `${prefix}_mode`) || (file[`${prefix}_sha256`] === null ? file[`${prefix}_mode`] !== null : !mode(file[`${prefix}_mode`]))) {
        fail(`Hash o mode invàlid: ${file.path}`);
      }
    }
    if (file.source_sha256 === null && file.target_sha256 === null) fail(`Operació buida: ${file.path}`);
    const payload = inspect(kit, `payload/${file.path}`);
    const preimage = inspect(kit, `preimages/${file.path}`);
    if (!sameState(payload, file.target_sha256, file.target_mode)) fail(`Payload divergent: ${file.path}`);
    if (!sameState(preimage, file.source_sha256, file.source_mode)) fail(`Preimatge divergent: ${file.path}`);
    return { ...file, payload, preimage };
  });
  for (const condition of manifest.preconditions) {
    if (!has(condition, 'source_sha256') || !digest(condition.source_sha256) || !has(condition, 'source_mode')
        || (condition.source_sha256 === null ? condition.source_mode !== null : !mode(condition.source_mode))) fail('Precondició invàlida');
  }
  return { manifest, files };
}

function checkSource(target, files, conditions) {
  for (const file of [...files, ...conditions]) {
    if (!sameState(inspect(target, file.path), file.source_sha256, file.source_mode)) fail(`CAS divergent: ${file.path}`);
  }
}

/**
 * El registre vigent conté claus PAGE_COPY, no rutes. Sobreaproximem totes les
 * fonts src/ i el nucli de la porta: inclou imports nous i evita mapes duplicats.
 * La porta sempre és la de l'arbre destí; un payload que la desactive no passa
 * a ser l'àrbitre de la seua pròpia integritat.
 */
export function requiresFrontissa(paths) {
  return paths.some(name => name.startsWith('src/') || name === REGISTRY || name === 'package.json'
    || name.startsWith('tooling/gates/') || name.startsWith('tooling/lib/') || name === '.agents/AGENTS.md');
}

function copyRegularTree(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyRegularTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
    else fail('Symlink o fitxer especial dins de les fonts de Frontissa');
  }
}

function validateFrontissa(target, files, staging) {
  if (!requiresFrontissa(files.map(file => file.path))) return { ran: false };
  const gate = inspect(target, GATE);
  if (!gate) fail('Falta la Frontissa de confiança a l’arbre destí');
  const candidate = path.join(staging, 'candidate');
  fs.mkdirSync(candidate);
  for (const name of ['package.json', '.agents/AGENTS.md', REGISTRY]) {
    const file = inspect(target, name);
    if (!file) fail(`Falta una font de Frontissa: ${name}`);
    writeFile(candidate, name, file.bytes, file.mode);
  }
  const src = path.join(target, 'src');
  if (!fs.lstatSync(src).isDirectory()) fail('Falta src/ per a Frontissa');
  copyRegularTree(src, path.join(candidate, 'src'));
  for (const file of files) {
    const destination = path.join(candidate, file.path);
    if (fs.existsSync(destination)) fs.rmSync(destination);
    if (file.payload) writeFile(candidate, file.path, file.payload.bytes, file.target_mode);
  }
  const result = spawnSync(process.execPath, [path.join(target, GATE), `--arrel=${candidate}`, '--json'], {
    cwd: candidate, env: { ...process.env, SDP_ARREL: candidate }, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024
  });
  if (result.error || result.signal || result.status !== 0) fail(`Frontissa rebutja el candidat (${result.status ?? result.signal ?? 'error'}): ${(result.stderr || result.stdout || result.error?.message || '').slice(0, 4000)}`);
  let report;
  try { report = JSON.parse(result.stdout); } catch { fail('Frontissa no ha retornat JSON verificable'); }
  if (report.valid !== true) fail('Frontissa no certifica valid:true');
  return { ran: true, report };
}

function ensureParents(target, relative, created) {
  const segments = relative.split('/').slice(0, -1);
  let current = target;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      const stat = fs.lstatSync(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`Pare insegur: ${relative}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      fs.mkdirSync(current);
      created.push(current);
    }
  }
}

/** Sense write:true, no crea lock ni modifica l'arbre destí. */
export function applyKit({ kitRoot, targetRoot, write = false }) {
  if (typeof write !== 'boolean') fail('write ha de ser booleà explícit');
  const target = rootDirectory(targetRoot);
  const { manifest, files } = loadKit(kitRoot);
  let lock;
  let lockIdentity;
  const lockPath = path.join(target, LOCK);
  // El staging és al mateix sistema de fitxers que el destí: rename atòmic.
  let staging;
  const applied = [];
  const created = [];
  try {
    if (write) {
      try { lock = fs.openSync(lockPath, 'wx', 0o600); }
      catch (error) { if (error.code === 'EEXIST') fail('Arbre bloquejat per un altre kit-carril; no es retira un lock alié'); throw error; }
      lockIdentity = fs.fstatSync(lock);
      fs.writeFileSync(lock, `${JSON.stringify({ pid: process.pid, kit: manifest.name })}\n`);
    }
    checkSource(target, files, manifest.preconditions);
    staging = fs.mkdtempSync(path.join(write ? target : os.tmpdir(), '.kit-carril-stage-'));
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      if (file.payload) writeFile(staging, `new/${i}`, file.payload.bytes, file.target_mode);
      if (file.preimage) writeFile(staging, `old/${i}`, file.preimage.bytes, file.source_mode);
    }
    const frontissa = validateFrontissa(target, files, staging);
    checkSource(target, files, manifest.preconditions);
    if (!write) return { valid: true, applied: false, name: manifest.name, files: files.length, frontissa };
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      ensureParents(target, file.path, created);
      if (!sameState(inspect(target, file.path), file.source_sha256, file.source_mode)) fail(`CAS divergent abans del rename: ${file.path}`);
      const destination = path.join(target, file.path);
      if (file.payload) fs.renameSync(path.join(staging, `new/${i}`), destination);
      else fs.unlinkSync(destination);
      applied.push({ file, index: i });
    }
    for (const file of files) {
      if (!sameState(inspect(target, file.path), file.target_sha256, file.target_mode)) fail(`Verificació final divergent: ${file.path}`);
    }
    checkSource(target, [], manifest.preconditions);
    return { valid: true, applied: true, name: manifest.name, files: files.length, frontissa };
  } catch (error) {
    const rollbackErrors = [];
    for (const { file, index } of applied.reverse()) {
      try {
        // No sobreescriu una edició aliena apareguda després del nostre rename.
        if (!sameState(inspect(target, file.path), file.target_sha256, file.target_mode)) fail(`Rollback amb canvi concurrent: ${file.path}`);
        if (file.preimage) fs.renameSync(path.join(staging, `old/${index}`), path.join(target, file.path));
        else fs.unlinkSync(path.join(target, file.path));
      } catch (rollbackError) { rollbackErrors.push(rollbackError.message); }
    }
    for (const directory of created.reverse()) {
      try { fs.rmdirSync(directory); } catch (cleanupError) { if (cleanupError.code !== 'ENOTEMPTY' && cleanupError.code !== 'ENOENT') rollbackErrors.push(cleanupError.message); }
    }
    if (rollbackErrors.length) {
      const recovery = staging;
      staging = null; // conserva les preimatges per a recuperació manual
      throw new Error(`${error.message}; rollback incomplet: ${rollbackErrors.join('; ')}; preimatges: ${recovery}`);
    }
    throw error;
  } finally {
    try { if (staging) fs.rmSync(staging, { recursive: true, force: true }); }
    finally {
      if (lock !== undefined) {
        // Un lock substituït durant el torn pertany a un altre procés.
        try {
          const current = fs.lstatSync(lockPath);
          if (lockIdentity && current.dev === lockIdentity.dev && current.ino === lockIdentity.ino) fs.unlinkSync(lockPath);
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
        finally { fs.closeSync(lock); }
      }
    }
  }
}

export function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (!['create', 'check', 'apply'].includes(command)) fail('Ús: kit-carril.mjs create|check|apply (vegeu la capçalera del mòdul)');
  const options = { path: [], precondition: [] };
  const allowed = command === 'create' ? ['source', 'candidate', 'kit', 'name', 'path', 'precondition'] : ['kit', 'target'];
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].startsWith('--') ? args[i].slice(2) : '';
    const value = args[i + 1];
    if (!allowed.includes(key) || !value || value.startsWith('--')) fail(`Opció desconeguda o incompleta: ${args[i]}`);
    if (Array.isArray(options[key])) options[key].push(value);
    else { if (has(options, key)) fail(`Opció duplicada: ${key}`); options[key] = value; }
  }
  const result = command === 'create'
    ? generateKit({ sourceRoot: options.source, candidateRoot: options.candidate, kitRoot: options.kit, paths: options.path, name: options.name, preconditions: options.precondition })
    : applyKit({ kitRoot: options.kit, targetRoot: options.target, write: command === 'apply' });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

if (process.argv[1] && pathToFileURL(fs.realpathSync(path.resolve(process.argv[1]))).href === import.meta.url) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
