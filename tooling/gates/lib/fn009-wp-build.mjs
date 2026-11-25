/** FN0-009 slow, explicit local build evidence. Importing this module builds nothing. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { analitzaFonts, inventariaFonts, ciclesTarjan } from '../../analysis/dependency-graph.mjs';

export const SCHEMA = 'sdp.fn009.wp-build.v1';
export const RESULT_SCHEMA = 'sdp.fn009.result.v1';
export const PROFILE = 'wp-core-qa-autonom-trossos';
export const BUDGETS = Object.freeze({ coreBytes: 1_589_500, legacyCoreBytes: 1_591_000, loaderBytes: 4_096 });
export const TOOL_PATHS = Object.freeze([
  'tooling/gates/compila-fn009-wp.mjs',
  'tooling/gates/lib/fn009-wp-build.mjs',
  'tooling/gates/verifica-fn009-wp.mjs'
]);
export const SOURCE_TREES = Object.freeze(['src', 'tooling', 'scripts', 'tests', 'nix', 'public', '.agents/deute']);
export const CONFIG_PATH = 'vite.standalone.config.js';
export const ENTRY_ID = 'rel:src/embed.jsx';
export const LOADER = 'soc-de-poble.standalone.js';
export const MAX_RECEIPT_BYTES = 64 * 1024 * 1024;
const MAX_ROWS = 100_000;
const SOURCE_EXTENSIONS = /\.(?:[cm]?jsx?|tsx?|css|json|html|py|sh|yaml|yml|sql|svg)$/i;
const SKIP = new Set(['node_modules', '.git', 'dist', 'coverage', '__pycache__']);
const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const ordered = value => Array.isArray(value) ? value.map(ordered)
  : value !== null && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort(compare).map(key => [key, ordered(value[key])])) : value;
const canonical = value => JSON.stringify(ordered(value));

function fail(message) { throw new Error(message); }
function insist(condition, message) { if (!condition) fail(message); }
function object(value, keys, label) {
  insist(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: cal objecte`);
  insist(canonical(Object.keys(value).sort()) === canonical([...keys].sort()), `${label}: camps absents o desconeguts`);
}
function text(value, label) {
  insist(typeof value === 'string' && value.length > 0 && value.length <= 16_384 && !/[\u0000-\u001f\u007f]/u.test(value), `${label}: text invàlid`);
}
function integer(value, label, minimum = 0) {
  insist(Number.isSafeInteger(value) && value >= minimum, `${label}: enter segur invàlid`);
}
function array(value, label, { nonempty = false } = {}) {
  insist(Array.isArray(value) && value.length <= MAX_ROWS && (!nonempty || value.length > 0), `${label}: array invàlid`);
}
function digest(value, label) { insist(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), `${label}: SHA-256 invàlid`); }
function mode(value, label) { integer(value, label); insist(value <= 0o777, `${label}: mode invàlid`); }
function unique(values, label) { insist(new Set(values).size === values.length, `${label}: duplicats`); }

export function relativePath(value) {
  text(value, 'ruta');
  insist(value === value.normalize('NFC') && !value.includes('\\') && !path.posix.isAbsolute(value), 'Ruta no canònica');
  insist(!/[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value), 'Control o format invisible en ruta');
  const parts = value.split('/');
  insist(parts.every(p => p && p !== '.' && p !== '..' && !/[<>:"|?*]/.test(p) && !/[ .]$/.test(p)), 'Ruta fora de l’arrel');
  insist(parts.every(p => !/^(?:\.git|\.env(?:\..*)?|\.kit-carril.*)$/i.test(p)), 'Segment de ruta prohibit');
  return value;
}

function inside(root, file) { return file === root || file.startsWith(root + path.sep); }
function regularPath(root, relative) {
  let current = root;
  const parts = relativePath(relative).split('/');
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    const info = fs.lstatSync(current);
    insist(!info.isSymbolicLink(), `Symlink refusat: ${relative}`);
    if (index < parts.length - 1) insist(info.isDirectory(), `Pare no regular: ${relative}`);
    else insist(info.isFile() && info.nlink === 1, `Fitxer no regular/hardlink: ${relative}`);
  }
  return current;
}

export function readFilePin(root, relative) {
  const file = regularPath(root, relative);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd);
    insist(before.isFile() && before.nlink === 1, 'Descriptor no regular');
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd);
    insist(before.dev === after.dev && before.ino === after.ino && before.size === after.size
      && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs, `Fitxer canviat durant lectura: ${relative}`);
    return { path: relative, sha256: sha256(bytes), bytes: bytes.length, mode: before.mode & 0o777, data: bytes };
  } finally { fs.closeSync(fd); }
}

const publicPin = pin => ({ path: pin.path, sha256: pin.sha256, bytes: pin.bytes, mode: pin.mode });
function sortedRows(rows) { return rows.sort((a, b) => compare(a.path ?? a.id, b.path ?? b.id)); }
function portableNames(names) {
  const keys = names.map(name => relativePath(name).toLowerCase());
  unique(keys, 'Rutes equivalents');
}

export function captureSnapshot(root) {
  root = fs.realpathSync(root);
  const sourcePaths = [];
  const publicNames = [];
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const child = `${relative}/${entry.name}`.normalize('NFC');
      insist(!entry.isSymbolicLink(), `Symlink de font refusat: ${child}`);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) {
        if (child.startsWith('public/')) publicNames.push(child);
        if (SOURCE_EXTENSIONS.test(entry.name)) sourcePaths.push(child);
      } else fail(`Entrada de font especial: ${child}`);
    }
  }
  for (const relative of SOURCE_TREES) {
    let current = root;
    for (const part of relative.split('/')) {
      current = path.join(current, part);
      const info = fs.lstatSync(current);
      insist(info.isDirectory() && !info.isSymbolicLink(), `Arrel/pare de fonts no regular: ${relative}`);
    }
    visit(relative);
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = /^(?:package(?:-lock)?\.json|(?:pnpm-lock|yarn)\..+)$/.test(entry.name)
      || /^(?:vite|vitest).*\.(?:[cm]?js|ts)$/.test(entry.name);
    if (!candidate) continue;
    insist(entry.isFile() && !entry.isSymbolicLink(), `Config de l’arrel no regular: ${entry.name}`);
    sourcePaths.push(entry.name.normalize('NFC'));
  }
  insist(sourcePaths.includes(CONFIG_PATH) && sourcePaths.includes('package.json'), 'Config/paquet obligatori absent');
  portableNames(sourcePaths);
  portableNames(publicNames);
  const files = sortedRows(sourcePaths.map(relative => publicPin(readFilePin(root, relative))));
  publicNames.sort(compare);
  return { files, publicNames, sha256: sha256(canonical({ files, publicNames })) };
}

export function captureOutputs(root) {
  root = fs.realpathSync(root);
  const paths = [];
  function visit(relative = '') {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const child = (relative ? `${relative}/${entry.name}` : entry.name).normalize('NFC');
      insist(!entry.isSymbolicLink(), 'Symlink output refusat');
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) paths.push(child);
      else fail('Output especial refusat');
    }
  }
  visit();
  portableNames(paths);
  return sortedRows(paths.map(relative => publicPin(readFilePin(root, relative))));
}

function nearestNodeModules(file) {
  let current = path.dirname(file);
  while (path.dirname(current) !== current) {
    if (path.basename(current) === 'node_modules') return current;
    current = path.dirname(current);
  }
  fail('Dependència fora de les arrels revisades');
}

function packageFileFromEntry(mainFile, expectedName) {
  let current = path.dirname(mainFile);
  while (path.dirname(current) !== current) {
    const candidate = path.join(current, 'package.json');
    if (fs.existsSync(candidate) && !fs.lstatSync(candidate).isSymbolicLink()) {
      const value = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (value.name === expectedName) return candidate;
    }
    current = path.dirname(current);
  }
  fail(`Metadades de paquet absents: ${expectedName}`);
}

export function createContext(root) {
  root = fs.realpathSync(root);
  const toolRoot = fs.realpathSync(ownRoot);
  const require = createRequire(path.join(toolRoot, 'package.json'));
  const dependencyRoots = [{ id: 'installed', basis: 'tool-node-modules', root: fs.realpathSync(path.join(toolRoot, 'node_modules')) }];
  const metadataFiles = [];
  const packages = [['vite', 'vite'], ['rollup', 'rollup'], ['parser', '@babel/parser'], ['react-plugin', '@vitejs/plugin-react']];
  const versions = { node: process.version };
  for (const [id, name] of packages) {
    const mainFile = fs.realpathSync(require.resolve(name));
    const packageFile = fs.realpathSync(packageFileFromEntry(mainFile, name));
    if (!dependencyRoots.some(item => inside(item.root, packageFile))) {
      const candidate = nearestNodeModules(packageFile);
      if (!dependencyRoots.some(item => item.root === candidate)) dependencyRoots.push({ id, basis: `resolve-${id}`, root: candidate });
    }
    metadataFiles.push(packageFile, mainFile);
    versions[id] = JSON.parse(fs.readFileSync(packageFile, 'utf8')).version;
  }
  dependencyRoots.sort((a, b) => b.root.length - a.root.length || compare(a.id, b.id));
  return { root, toolRoot, dependencyRoots, metadataFiles: [...new Set(metadataFiles)], versions };
}

export function fileIdentity(file, context) {
  const physical = fs.realpathSync(file);
  for (const item of context.dependencyRoots) {
    if (inside(item.root, physical)) return `dep:${item.id}:${relativePath(path.relative(item.root, physical).split(path.sep).join('/').normalize('NFC'))}`;
  }
  insist(inside(context.root, physical), 'Fitxer fora de repo/dependències declarades');
  return `rel:${relativePath(path.relative(context.root, physical).split(path.sep).join('/').normalize('NFC'))}`;
}

function physicalIdentity(id, context) {
  text(id, 'identitat física');
  if (id.startsWith('rel:')) return { root: context.root, relative: relativePath(id.slice(4)) };
  const match = /^dep:([a-z-]+):(.+)$/.exec(id);
  insist(match, 'Identitat física desconeguda');
  const dependency = context.dependencyRoots.find(item => item.id === match[1]);
  insist(dependency, 'Arrel de dependència no declarada per l’eina');
  return { root: dependency.root, relative: relativePath(match[2]) };
}

export function runtimePin(id, context) {
  const item = physicalIdentity(id, context);
  const pin = readFilePin(item.root, item.relative);
  return { id, sha256: pin.sha256, bytes: pin.bytes, mode: pin.mode };
}

export function moduleIdentity(rawId, context, external = false) {
  if (external) return { id: `external:${encodeURIComponent(rawId)}`, fileId: null, kind: 'external' };
  if (rawId.startsWith('\0') || !path.isAbsolute(rawId)) return { id: `virtual:${sha256(rawId)}`, fileId: null, kind: 'virtual' };
  const position = rawId.indexOf('?');
  const file = position < 0 ? rawId : rawId.slice(0, position);
  const query = position < 0 ? '' : rawId.slice(position + 1);
  const fileId = fileIdentity(file, context);
  return { id: fileId + (query ? `#q=${encodeURIComponent(query)}` : ''), fileId, kind: fileId.startsWith('rel:') ? 'repo' : 'dependency' };
}

export function toolIdentity(context) {
  return TOOL_PATHS.map(relative => {
    const pin = publicPin(readFilePin(context.toolRoot, relative));
    insist(pin.mode === 0o644, 'Mode de l’eina no canònic');
    return pin;
  });
}

export function runtimeIdentitySet(modules, configIds, context) {
  return [...new Set([
    ...modules.filter(item => item.fileId !== null).map(item => item.fileId),
    ...configIds,
    ...context.metadataFiles.map(file => fileIdentity(file, context))
  ])].sort(compare);
}

/** Native Vite does not report configFileDependencies. Derive the reviewed
 * repository-relative ESM closure without executing the destination modules.
 * Bare package internals are not claimed as a complete Node loader trace. */
export function captureConfigIds(context) {
  const visited = new Set();
  const pending = [CONFIG_PATH];
  while (pending.length) {
    const relative = pending.pop();
    if (visited.has(relative)) continue;
    insist(visited.size < MAX_ROWS, 'Clausura de config massa gran');
    visited.add(relative);
    const code = new TextDecoder('utf-8', { fatal: true }).decode(readFilePin(context.root, relative).data);
    const ast = parse(code, { sourceType: 'module', plugins: ['importAttributes'] });
    for (const statement of ast.program.body) {
      if (!['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(statement.type)
        || !statement.source) continue;
      const specifier = statement.source.value;
      if (!specifier.startsWith('.')) continue;
      insist(!specifier.includes('?') && !specifier.includes('#'), 'Import de config amb query no acreditat');
      const file = path.resolve(context.root, path.dirname(relative), specifier);
      insist(inside(context.root, file), 'Import relatiu de config fora del repo');
      pending.push(relativePath(path.relative(context.root, file).split(path.sep).join('/')));
    }
  }
  return [...visited].map(relative => `rel:${relative}`).sort(compare);
}

function validatePin(value, key, label) {
  object(value, [key, 'sha256', 'bytes', 'mode'], label);
  if (key === 'path') relativePath(value.path);
  else text(value.id, `${label}.id`);
  digest(value.sha256, label);
  integer(value.bytes, label);
  mode(value.mode, label);
}

function validateSnapshot(value, label) {
  object(value, ['files', 'publicNames', 'sha256'], label);
  array(value.files, label, { nonempty: true });
  value.files.forEach(pin => validatePin(pin, 'path', label));
  portableNames(value.files.map(pin => pin.path));
  array(value.publicNames, label);
  value.publicNames.forEach(relativePath);
  portableNames(value.publicNames);
  digest(value.sha256, label);
  insist(value.sha256 === sha256(canonical({ files: value.files, publicNames: value.publicNames })), `${label}: hash d’inventari incoherent`);
}

export function normalProcess(exit, signal = null, error = null, truncated = false) {
  return { exit, signal, error, truncated };
}

function validateProcess(value, allowed, label) {
  object(value, ['exit', 'signal', 'error', 'truncated'], label);
  insist(Number.isInteger(value.exit) && allowed.includes(value.exit), `${label}: procés sense settlement normal`);
  insist(value.signal === null && value.error === null && value.truncated === false, `${label}: senyal/error/truncament`);
}

function stringArray(values, label, { nonempty = false } = {}) {
  array(values, label, { nonempty });
  values.forEach(value => text(value, label));
  unique(values, label);
}

function validateModule(value) {
  object(value, ['id', 'fileId', 'kind', 'entry', 'imports', 'dynamicImports'], 'mòdul');
  text(value.id, 'mòdul.id');
  insist(['repo', 'dependency', 'virtual', 'external'].includes(value.kind), 'Tipus de mòdul desconegut');
  insist(typeof value.entry === 'boolean', 'entry de mòdul invàlid');
  if (value.kind === 'virtual' || value.kind === 'external') {
    insist(value.fileId === null && value.id.startsWith(`${value.kind}:`), 'Identitat virtual/externa incoherent');
    if (value.kind === 'virtual') digest(value.id.slice(8), 'ID virtual');
  } else {
    text(value.fileId, 'mòdul.fileId');
    insist(value.fileId.startsWith(value.kind === 'repo' ? 'rel:' : 'dep:'), 'Origen físic incoherent');
    insist(value.id === value.fileId || value.id.startsWith(value.fileId + '#q='), 'Query de mòdul incoherent');
  }
  stringArray(value.imports, 'imports de mòdul');
  stringArray(value.dynamicImports, 'imports dinàmics de mòdul');
}

function validateChunk(value) {
  object(value, ['fileName', 'entry', 'facadeId', 'imports', 'dynamicImports', 'modules'], 'chunk');
  relativePath(value.fileName);
  insist(value.fileName.endsWith('.js') && value.fileName !== LOADER, 'Chunk JS invàlid');
  insist(typeof value.entry === 'boolean', 'entry de chunk invàlid');
  insist(value.facadeId === null || typeof value.facadeId === 'string', 'Façana de chunk invàlida');
  stringArray(value.imports, 'imports de chunk');
  stringArray(value.dynamicImports, 'imports dinàmics de chunk');
  stringArray(value.modules, 'mòduls del chunk');
}

function sccArray(value, label) {
  array(value, label);
  value.forEach(group => stringArray(group, label, { nonempty: true }));
}

export function validateSchema(value) {
  object(value, ['schema', 'profile', 'budgets', 'producerPins', 'dependencyRoots', 'versions', 'source', 'runtime', 'graph', 'astPin', 'outputs', 'metrics', 'law', 'build', 'coverage'], 'rebut');
  insist(value.schema === SCHEMA && value.profile === PROFILE, 'Esquema/perfil no admés');
  object(value.budgets, Object.keys(BUDGETS), 'pressupostos');
  insist(canonical(value.budgets) === canonical(BUDGETS), 'Pressupostos divergents');
  array(value.producerPins, 'producerPins', { nonempty: true });
  value.producerPins.forEach(pin => validatePin(pin, 'path', 'producerPins'));
  insist(canonical(value.producerPins.map(pin => pin.path)) === canonical(TOOL_PATHS), 'ProducerPins no fixa les tres eines exactes');
  array(value.dependencyRoots, 'arrels de dependències', { nonempty: true });
  for (const item of value.dependencyRoots) {
    object(item, ['id', 'basis'], 'arrel de dependència');
    text(item.id, 'arrel.id');
    text(item.basis, 'arrel.basis');
  }
  unique(value.dependencyRoots.map(item => item.id), 'Arrels de dependències');
  object(value.versions, ['node', 'vite', 'rollup', 'parser', 'react-plugin'], 'versions');
  Object.values(value.versions).forEach(version => text(version, 'versió'));
  object(value.source, ['before', 'after'], 'font');
  validateSnapshot(value.source.before, 'snapshot abans');
  validateSnapshot(value.source.after, 'snapshot després');
  object(value.runtime, ['configIds', 'pinsBefore', 'pinsAfter'], 'runtime');
  stringArray(value.runtime.configIds, 'configIds', { nonempty: true });
  insist(value.runtime.configIds.includes(`rel:${CONFIG_PATH}`), 'Config canònica absent del runtime');
  for (const pins of [value.runtime.pinsBefore, value.runtime.pinsAfter]) {
    array(pins, 'pins runtime', { nonempty: true });
    pins.forEach(pin => validatePin(pin, 'id', 'runtime'));
    unique(pins.map(pin => pin.id), 'Pins runtime');
  }
  object(value.graph, ['modules', 'chunks', 'staticScc', 'combinedScc'], 'graf');
  array(value.graph.modules, 'mòduls', { nonempty: true });
  value.graph.modules.forEach(validateModule);
  unique(value.graph.modules.map(item => item.id), 'IDs de mòduls');
  array(value.graph.chunks, 'chunks', { nonempty: true });
  value.graph.chunks.forEach(validateChunk);
  portableNames(value.graph.chunks.map(item => item.fileName));
  sccArray(value.graph.staticScc, 'SCC estàtiques');
  sccArray(value.graph.combinedScc, 'SCC combinades');
  validatePin(value.astPin, 'path', 'AST');
  insist(value.astPin.path === 'ast.json', 'Artefacte AST no canònic');
  array(value.outputs, 'outputs', { nonempty: true });
  value.outputs.forEach(pin => validatePin(pin, 'path', 'output'));
  portableNames(value.outputs.map(pin => pin.path));
  object(value.metrics, ['coreBytes', 'loaderBytes', 'startupTotalBytes', 'staticClosure'], 'mètriques');
  integer(value.metrics.coreBytes, 'coreBytes', 1);
  integer(value.metrics.loaderBytes, 'loaderBytes', 1);
  integer(value.metrics.startupTotalBytes, 'startupTotalBytes', 1);
  stringArray(value.metrics.staticClosure, 'clausura', { nonempty: true });
  value.metrics.staticClosure.forEach(relativePath);
  object(value.law, ['process', 'logPin', 'count', 'maximum', 'newOrphans'], 'LLEI08');
  validateProcess(value.law.process, [0, 1], 'LLEI08');
  validatePin(value.law.logPin, 'path', 'log LLEI08');
  insist(value.law.logPin.path === 'llei08.log', 'Log LLEI08 no canònic');
  integer(value.law.count, 'orfes');
  integer(value.law.maximum, 'màxim orfes');
  stringArray(value.law.newOrphans, 'identitats d’orfes');
  value.law.newOrphans.forEach(relativePath);
  object(value.build, ['process', 'durationMs', 'environment', 'publicCopied', 'snapshotAtomic', 'warnings'], 'build');
  validateProcess(value.build.process, [0], 'build');
  insist(Number.isFinite(value.build.durationMs) && value.build.durationMs >= 0, 'Durada de build invàlida');
  insist(value.build.environment === 'minimal-ci-fixture-v1' && value.build.publicCopied === false && value.build.snapshotAtomic === false, 'Perfil de build divergent');
  array(value.build.warnings, 'advertències');
  for (const warning of value.build.warnings) {
    object(warning, ['code', 'message', 'id'], 'advertència');
    text(warning.code, 'codi d’advertència');
    insist(typeof warning.message === 'string' && !warning.message.includes('\0'), 'Missatge d’advertència invàlid');
    insist(warning.id === null || typeof warning.id === 'string', 'ID d’advertència invàlid');
  }
  object(value.coverage, ['allRoots', 'scope'], 'cobertura');
  insist(value.coverage.allRoots === false && value.coverage.scope === PROFILE, 'Un perfil WP únic no acredita totes les arrels');
  return value;
}

const LAW_IDS = [
  'LLEI_01_CLASSE_ORFENA', 'LLEI_02_TOKEN_FANTASMA', 'LLEI_03_ESTIL_EN_LINIA',
  'LLEI_03_COLOR_EN_LINIA', 'LLEI_04_VIDA', 'LLEI_05_PORTA_UNICA',
  'LLEI_06_ENCAPSULAMENT', 'LLEI_07_PARITAT_I18N', 'LLEI_08_SUBARBRE_ORFE'
];

export function parseLawLog(log, settlement) {
  validateProcess(settlement, [0, 1], 'LLEI08');
  insist(typeof log === 'string' && log.includes('══ TRACTOR PEDRA SECA'), 'Capçalera de subporta absent');
  const occurrences = log.match(/LLEI_08_SUBARBRE_ORFE/g) ?? [];
  insist(occurrences.length === 1, 'Diagnòstic LLEI08 múltiple/contradictori');
  const rows = [...log.matchAll(/^([·↓✗]) +(LLEI_[A-Z0-9_]+) +(\d+) +(màx (\d+)|\(DURA\))[ \t]*$/gm)];
  insist(canonical(rows.map(row => row[2])) === canonical(LAW_IDS), 'Protocol de les nou lleis incomplet/duplicat');
  const row = rows.at(-1);
  const count = Number(row[3]);
  const maximum = Number(row[5]);
  insist(Number.isSafeInteger(count) && maximum === 0, 'Perfil LLEI08 només acredita el trinquet canònic zero');
  const block = log.slice(row.index + row[0].length);
  const identities = [...block.matchAll(/^\s+\+ (src\/[^\n]+)$/gm)].map(match => relativePath(match[1])).sort(compare);
  unique(identities, 'Orfes');
  insist(identities.length === count, 'Recompte d’orfes no correspon a la secció completa');
  const passed = log.trimEnd().endsWith('PASSA. El deute no puja.');
  const failed = log.trimEnd().endsWith("PARAT. El deute puja o s’ha trencat una llei dura.")
    || log.trimEnd().endsWith("PARAT. El deute puja o s'ha trencat una llei dura.");
  insist(settlement.exit === 0 ? passed : failed, 'Final de procés/log incoherent');
  insist(count === 0 || settlement.exit === 1, 'Orfes amb exit zero');
  return { count, maximum, newOrphans: identities };
}

export function graphSummary(modules, chunks) {
  const known = new Map(modules.map(item => [item.id, item]));
  const ids = modules.filter(item => item.kind !== 'external').map(item => item.id).sort(compare);
  const edges = [];
  for (const item of modules) {
    for (const [kind, targets] of [['static', item.imports], ['dynamic', item.dynamicImports]]) {
      for (const to of targets) {
        insist(known.has(to), `Aresta sense mòdul resolt: ${to}`);
        edges.push({ from: item.id, to, kind });
      }
    }
  }
  const rendered = new Set();
  for (const chunk of chunks) {
    if (chunk.facadeId !== null) insist(known.has(chunk.facadeId), 'Façana sense mòdul resolt');
    for (const id of chunk.modules) {
      insist(known.has(id) && known.get(id).kind !== 'external', 'Chunk amb mòdul absent/extern');
      insist(!rendered.has(id), 'Mòdul declarat en més d’un chunk');
      rendered.add(id);
    }
  }
  const entryModules = modules.filter(item => item.entry);
  const entries = chunks.filter(item => item.entry);
  insist(entryModules.length === 1 && entryModules[0].id === ENTRY_ID, 'Entrada de graf no canònica');
  insist(entries.length === 1 && entries[0].facadeId === ENTRY_ID && entries[0].modules.includes(ENTRY_ID), 'Entrada/chunk/façana incoherents');
  return {
    staticScc: ciclesTarjan(ids, edges.filter(edge => edge.kind === 'static')),
    combinedScc: ciclesTarjan(ids, edges),
    renderedModules: rendered.size,
    analysisOnlyModules: modules.filter(item => item.kind !== 'external' && !rendered.has(item.id)).length,
    edges
  };
}

function resolveChunkImport(specifier, fileName) {
  text(specifier, 'import de chunk');
  if (!specifier.startsWith('.')) return `external:${encodeURIComponent(specifier)}`;
  const value = path.posix.normalize(path.posix.join(path.posix.dirname(fileName), specifier));
  return relativePath(value);
}

export function emittedImports(code, fileName) {
  const ast = parse(code, { sourceType: 'unambiguous', createImportExpressions: true, plugins: ['importAttributes'] });
  const imports = new Set();
  const dynamicImports = new Set();
  const opaque = [];
  const work = [ast.program];
  while (work.length) {
    const node = work.pop();
    if (!node || typeof node !== 'object') continue;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
      imports.add(resolveChunkImport(node.source.value, fileName));
    }
    if (node.type === 'ImportExpression') {
      if (node.source.type === 'StringLiteral') dynamicImports.add(resolveChunkImport(node.source.value, fileName));
      else opaque.push({ fileName, offset: node.start, reason: 'computed-import' });
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'tokens', 'extra'].includes(key)) continue;
      if (Array.isArray(value)) work.push(...value.filter(child => child && typeof child === 'object'));
      else if (value && typeof value === 'object' && typeof value.type === 'string') work.push(value);
    }
  }
  return { imports: [...imports].sort(compare), dynamicImports: [...dynamicImports].sort(compare), opaque };
}

function loaderEntry(code, parsed) {
  insist(parsed.imports.length === 0, 'Carregador amb imports estàtics fora del perfil');
  if (parsed.opaque.length === 0) {
    insist(parsed.dynamicImports.length === 1, 'Carregador sense entrada literal única');
    return parsed.dynamicImports[0];
  }
  insist(parsed.opaque.length === 1 && parsed.dynamicImports.length === 0, 'Carregador computed fora del perfil canònic');
  const ast = parse(code, { sourceType: 'script', createImportExpressions: true });
  const work = [ast.program];
  const candidates = [];
  while (work.length) {
    const node = work.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.arguments.length === 5) {
      const [windowArg, documentArg, scriptArg, options, callback] = node.arguments;
      const canonicalArguments = windowArg.type === 'Identifier' && windowArg.name === 'window'
        && documentArg.type === 'Identifier' && documentArg.name === 'document'
        && scriptArg.type === 'MemberExpression' && !scriptArg.computed
        && scriptArg.object.type === 'Identifier' && scriptArg.object.name === 'document'
        && scriptArg.property.type === 'Identifier' && scriptArg.property.name === 'currentScript';
      if (canonicalArguments && options.type === 'ObjectExpression' && callback.type === 'ArrowFunctionExpression'
        && callback.params.length === 1 && callback.params[0].type === 'Identifier'
        && callback.body.type === 'ImportExpression' && callback.body.source.type === 'Identifier'
        && callback.body.source.name === callback.params[0].name) {
        const properties = new Map();
        for (const property of options.properties) {
          insist(property.type === 'ObjectProperty' && !property.computed && !property.shorthand, 'Opcions de carregador no literals');
          const key = property.key.type === 'Identifier' ? property.key.name : property.key.value;
          insist(!properties.has(key), 'Opció de carregador duplicada');
          properties.set(key, property.value);
        }
        equal([...properties.keys()].sort(compare), ['claus', 'fitxer', 'modul'], 'Opcions de carregador fora del contracte');
        const module = properties.get('modul');
        const file = properties.get('fitxer');
        const keys = properties.get('claus');
        insist(module.type === 'StringLiteral' && file.type === 'StringLiteral' && file.value === LOADER,
          'Nom/entrada del carregador no literal o divergent');
        insist(keys.type === 'ArrayExpression' && keys.elements.length > 0
          && keys.elements.every(item => item?.type === 'StringLiteral'), 'Claus del carregador no literals');
        unique(keys.elements.map(item => item.value), 'Claus del carregador');
        candidates.push(relativePath(module.value));
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'tokens', 'extra'].includes(key)) continue;
      if (Array.isArray(value)) work.push(...value.filter(child => child && typeof child === 'object'));
      else if (value && typeof value === 'object' && typeof value.type === 'string') work.push(value);
    }
  }
  insist(candidates.length === 1, 'Contracte computed del carregador absent o ambigu');
  return candidates[0];
}

export function artifactPin(root, relative) { return publicPin(readFilePin(root, relative)); }
export function captureAst(root) { return analitzaFonts(inventariaFonts(root)); }
export function dependencyDeclarations(context) {
  return context.dependencyRoots.map(({ id, basis }) => ({ id, basis })).sort((a, b) => compare(a.id, b.id));
}
export function captureRuntimePins(ids, context) { return ids.map(id => runtimePin(id, context)); }

export function readJsonFile(file) {
  const info = fs.lstatSync(file);
  insist(info.isFile() && !info.isSymbolicLink() && info.nlink === 1, 'JSON no regular');
  insist(info.size <= MAX_RECEIPT_BYTES, 'JSON supera el límit de lectura del protocol');
  const textValue = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
  return JSON.parse(textValue);
}

function equal(actual, expected, message) { insist(canonical(actual) === canonical(expected), message); }

function verifyArtifact(root, expected) {
  const actual = artifactPin(root, expected.path);
  equal(actual, expected, `Artefacte divergent: ${expected.path}`);
  return readFilePin(root, expected.path).data;
}

function checkEntrySidecars(buildRoot, outputMap, entryFile) {
  const read = relative => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(readFilePin(buildRoot, relative).data));
  if (outputMap.has('sdp-release.json')) {
    const release = read('sdp-release.json');
    insist(release?.schema === 'sdp.release.v1' && release.formatDelPaquet?.format === 'trossos'
      && release.formatDelPaquet.modul === entryFile, 'Entrada del release divergent del carregador/chunk');
    const loader = outputMap.get(LOADER);
    insist(release.entrada?.cami === LOADER && release.entrada.mida === loader.bytes
      && release.entrada.sha256 === loader.sha256, 'Rebut del carregador al release divergent');
  }
  if (outputMap.has('.vite/manifest.json')) {
    const manifest = read('.vite/manifest.json');
    insist(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Manifest Vite no objecte');
    const entries = Object.entries(manifest).filter(([, row]) => row?.isEntry === true);
    insist(entries.length === 1 && entries[0][0] === ENTRY_ID.slice(4)
      && entries[0][1].src === ENTRY_ID.slice(4) && entries[0][1].file === entryFile,
    'Entrada del manifest Vite divergent del carregador/chunk');
  }
}

export function materialGraph(receipt, artifactRoot, graph) {
  const outputMap = new Map(receipt.outputs.map(item => [item.path, item]));
  const chunkMap = new Map(receipt.graph.chunks.map(item => [item.fileName, item]));
  const javascriptOutputs = receipt.outputs.filter(item => item.path.endsWith('.js') && item.path !== LOADER).map(item => item.path).sort(compare);
  equal([...chunkMap.keys()].sort(compare), javascriptOutputs, 'Conjunt chunks/outputs JS divergent');
  insist(outputMap.has(LOADER), 'Carregador absent');
  const opaque = [];
  // Chunk edges also encode Rollup execution order and hoisted dependencies;
  // they are not a quotient of the source-module graph. Check their real JS.
  const hasMaterialEdges = receipt.graph.chunks.some(chunk => chunk.imports.length || chunk.dynamicImports.length);
  insist(!hasMaterialEdges || graph.edges.length > 0, 'Graf resolt buit d’arestes amb dependències materials');
  for (const chunk of receipt.graph.chunks) {
    insist(outputMap.has(chunk.fileName), `Chunk sense output: ${chunk.fileName}`);
    const code = readFilePin(path.join(artifactRoot, 'build'), chunk.fileName).data.toString('utf8');
    const parsed = emittedImports(code, chunk.fileName);
    equal(parsed.imports, [...chunk.imports].sort(compare), 'Imports estàtics no corresponen al codi emés');
    equal(parsed.dynamicImports, [...chunk.dynamicImports].sort(compare), 'Imports dinàmics no corresponen al codi emés');
    opaque.push(...parsed.opaque);
    for (const target of [...chunk.imports, ...chunk.dynamicImports]) {
      insist(target.startsWith('external:') || chunkMap.has(target), `Referència a chunk absent: ${target}`);
    }
  }
  const loaderCode = readFilePin(path.join(artifactRoot, 'build'), LOADER).data.toString('utf8');
  const loader = emittedImports(loaderCode, LOADER);
  opaque.push(...loader.opaque);
  const entries = receipt.graph.chunks.filter(item => item.entry);
  insist(entries.length === 1, 'Cal una entrada material única');
  insist(loaderEntry(loaderCode, loader) === entries[0].fileName, 'Entrada declarada no correspon al carregador material');
  checkEntrySidecars(path.join(artifactRoot, 'build'), outputMap, entries[0].fileName);
  const closure = new Set();
  const pending = [entries[0].fileName];
  while (pending.length) {
    const name = pending.pop();
    if (closure.has(name)) continue;
    const chunk = chunkMap.get(name);
    insist(chunk && outputMap.has(name), 'Clausura amb output desconegut');
    closure.add(name);
    for (const target of chunk.imports) {
      insist(!target.startsWith('external:'), 'Arrencada amb dependència externa no mesurada en aquest perfil');
      pending.push(target);
    }
  }
  const coreBytes = [...closure].reduce((sum, name) => sum + outputMap.get(name).bytes, 0);
  const loaderBytes = outputMap.get(LOADER).bytes;
  const metrics = { coreBytes, loaderBytes, startupTotalBytes: coreBytes + loaderBytes, staticClosure: [...closure].sort(compare) };
  equal(metrics, receipt.metrics, 'Mètriques no derivades de la clausura material');
  insist(graph.renderedModules > 0, 'Graf sense cap mòdul material');
  return { metrics, opaque };
}

export function deriveMetrics(chunks, outputs) {
  const map = new Map(chunks.map(item => [item.fileName, item]));
  const files = new Map(outputs.map(item => [item.path, item]));
  const entries = chunks.filter(item => item.entry);
  insist(entries.length === 1, 'Entrada de build no única');
  const closure = new Set();
  const pending = [entries[0].fileName];
  while (pending.length) {
    const name = pending.pop();
    if (closure.has(name)) continue;
    insist(map.has(name) && files.has(name), 'Chunk de clausura absent');
    closure.add(name);
    pending.push(...map.get(name).imports);
  }
  insist(files.has(LOADER), 'Carregador obligatori absent');
  const coreBytes = [...closure].reduce((sum, name) => sum + files.get(name).bytes, 0);
  const loaderBytes = files.get(LOADER).bytes;
  return { coreBytes, loaderBytes, startupTotalBytes: coreBytes + loaderBytes, staticClosure: [...closure].sort(compare) };
}

export function invalidResult(error) {
  return {
    schema: RESULT_SCHEMA, status: 'INVALIDAT', fn009: 'INCOMPLET',
    issues: [error instanceof Error ? error.message : String(error)],
    certifiesProduction: false, filterWarmCertified: false
  };
}

export function exitCode(result) { return result.status === 'PASS' ? 0 : result.status === 'FAIL' ? 1 : 2; }

export function isMain(moduleUrl, argument = process.argv[1]) {
  if (!argument) return false;
  try {
    const selected = fs.realpathSync(path.resolve(argument));
    const own = fs.realpathSync(fileURLToPath(moduleUrl));
    return selected === own && fs.lstatSync(own).isFile();
  } catch { return false; }
}

export function validateReceipt(receipt, { root, artifactRoot } = {}) {
  try {
    validateSchema(receipt);
    const context = createContext(root);
    const physicalArtifacts = fs.realpathSync(artifactRoot);
    insist(path.resolve(artifactRoot) === physicalArtifacts, 'Arrel d’artefactes amb pare simbòlic');
    equal(toolIdentity(context), receipt.producerPins, 'Les tres identitats revisades de productor no corresponen');
    equal(dependencyDeclarations(context), receipt.dependencyRoots, 'Arrels de dependències no acreditades per la instal·lació actual');
    equal(context.versions, receipt.versions, 'Versions de la instal·lació divergents');
    equal(receipt.source.before, receipt.source.after, 'Fonts canviades durant el productor');
    const current = captureSnapshot(context.root);
    equal(current, receipt.source.after, 'Rebut INVALIDAT: fonts actuals diferents');
    const graph = graphSummary(receipt.graph.modules, receipt.graph.chunks);
    equal(graph.staticScc, receipt.graph.staticScc, 'SCC estàtiques no derivades del graf');
    equal(graph.combinedScc, receipt.graph.combinedScc, 'SCC combinades no derivades del graf');
    equal(captureConfigIds(context), receipt.runtime.configIds, 'Clausura relativa de config incompleta/divergent');
    const runtimeIds = runtimeIdentitySet(receipt.graph.modules, receipt.runtime.configIds, context);
    equal(runtimeIds, receipt.runtime.pinsBefore.map(item => item.id), 'Cobertura de runtimePins abans incompleta');
    equal(runtimeIds, receipt.runtime.pinsAfter.map(item => item.id), 'Cobertura de runtimePins després incompleta');
    equal(receipt.runtime.pinsBefore, receipt.runtime.pinsAfter, 'Dependències canviades durant el build');
    equal(captureRuntimePins(runtimeIds, context), receipt.runtime.pinsAfter, 'Dependències actuals divergents');
    const buildRoot = path.join(physicalArtifacts, 'build');
    insist(fs.lstatSync(buildRoot).isDirectory() && !fs.lstatSync(buildRoot).isSymbolicLink()
      && fs.realpathSync(buildRoot) === buildRoot, 'Arrel de build simbòlica/no regular');
    equal(captureOutputs(buildRoot), receipt.outputs, 'Inventari/hash/mode dels outputs divergent');
    const material = materialGraph(receipt, physicalArtifacts, graph);
    const astBytes = verifyArtifact(physicalArtifacts, receipt.astPin);
    const astSaved = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(astBytes));
    const astCurrent = captureAst(context.root);
    equal(astSaved, astCurrent, 'Graf AST canònic no correspon a les fonts actuals');
    const log = new TextDecoder('utf-8', { fatal: true }).decode(verifyArtifact(physicalArtifacts, receipt.law.logPin));
    const law = parseLawLog(log, receipt.law.process);
    equal(law, { count: receipt.law.count, maximum: receipt.law.maximum, newOrphans: receipt.law.newOrphans }, 'LLEI08 incoherent amb el log complet');
    equal(captureSnapshot(context.root), current, 'Fonts canviades durant la validació');
    equal(captureRuntimePins(runtimeIds, context), receipt.runtime.pinsAfter, 'Dependències canviades durant la validació');
    equal(toolIdentity(context), receipt.producerPins, 'Eina canviada durant la validació');
    equal(captureOutputs(buildRoot), receipt.outputs, 'Outputs canviats durant la validació');
    equal(artifactPin(physicalArtifacts, 'ast.json'), receipt.astPin, 'AST canviat durant la validació');
    equal(artifactPin(physicalArtifacts, 'llei08.log'), receipt.law.logPin, 'Log canviat durant la validació');
    const sourceScc = graph.staticScc.filter(group => group.some(id => id.startsWith('rel:src/')));
    const fails = [];
    if (law.newOrphans.length) fails.push({ code: 'FN009_NEW_ORPHANS', paths: law.newOrphans });
    if (material.metrics.coreBytes > BUDGETS.coreBytes) fails.push({ code: 'FN009_CORE_OVER_BUDGET', actual: material.metrics.coreBytes, maximum: BUDGETS.coreBytes });
    if (material.metrics.loaderBytes > BUDGETS.loaderBytes) fails.push({ code: 'FN009_LOADER_OVER_LIMIT', actual: material.metrics.loaderBytes, maximum: BUDGETS.loaderBytes });
    if (sourceScc.length) fails.push({ code: 'FN009_STATIC_SOURCE_SCC', components: sourceScc });
    if (astCurrent.unresolved.length || astCurrent.parseErrors.length) fails.push({ code: 'FN009_SOURCE_AST_FAILURE', unresolved: astCurrent.unresolved, parseErrors: astCurrent.parseErrors });
    return {
      schema: RESULT_SCHEMA, status: fails.length ? 'FAIL' : 'INCOMPLET', fn009: fails.length ? 'FAIL' : 'INCOMPLET',
      fails, metrics: material.metrics, budgets: BUDGETS,
      graph: { staticSourceScc: sourceScc, staticAllScc: graph.staticScc, combinedScc: graph.combinedScc, renderedModules: graph.renderedModules, analysisOnlyModules: graph.analysisOnlyModules },
      opaque: { source: astCurrent.opaque, emitted: material.opaque, commonjs: astCurrent.commonjsRequires },
      warnings: receipt.build.warnings,
      issues: ['Un perfil WP únic no acredita totes les arrels de producció; cap PASS global.', 'SHA-256 comprova integritat/coherència local, sense autenticar una execució.'],
      certifiesProduction: false, filterWarmCertified: false
    };
  } catch (error) { return invalidResult(error); }
}
