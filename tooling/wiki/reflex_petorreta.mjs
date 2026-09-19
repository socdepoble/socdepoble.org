#!/usr/bin/env node
/**
 * reflex_petorreta.mjs — lease verificable abans de mutacions d'alt risc.
 *
 * El reflex no pot provar comprensió semàntica. Sí que pot provar que els bytes
 * exactes de les regles s'han carregat, vincular-los a una tasca/Petorreta,
 * limitar abast i temps, i fer que els scripts destructius fallen sense rebut.
 *
 * Flux:
 *   open -> lectura completa + nonce + bootstrap buit reservat (15 min)
 *   seal -> Petorreta/manifest/hashes + lease signada (60 min)
 *   verify -> gate de scripts o pre-commit
 *   consume -> invalida la lease després del commit
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { isUtf8 } from 'node:buffer';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { validarFrontmatter } from './entropia_zero_router.mjs';
import {
  PROJECT_DIR as DISCOVERED_PROJECT_DIR,
  TOOLING_WIKI_DIR,
  WIKI_DIR as DISCOVERED_WIKI_DIR,
} from './lib/project_paths.mjs';
import { prepararDocument, validarDocument, promoureDocument } from './reflex_document.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = TOOLING_WIKI_DIR;
export const PROJECT_DIR = DISCOVERED_PROJECT_DIR;
const STATE_DIR = path.join(PROJECT_DIR, '.sdp-reflex');
const SESSION_DIR = path.join(STATE_DIR, 'sessions');
const BOOTSTRAP_DIR = path.join(STATE_DIR, 'bootstrap');
const SECRET_FILE = path.join(STATE_DIR, 'secret.key');
const ACTIVE_FILE = path.join(STATE_DIR, 'active.json');
const ACTIVE_LOCK = path.join(STATE_DIR, 'active.lock');
const WIKI_DIR = DISCOVERED_WIKI_DIR;
const WIKI_BASELINE_RELATIVE = 'tooling/wiki/wiki-baseline.lock.json';
const GRAPH_CONFIG_RELATIVE = '_wiki_de_poble/.obsidian/graph.json';
function getDynamicTTL(risk, scopesCount = 1, contextBytes = 0) {
  const riskMult = risk === 'high' ? 2 : risk === 'low' ? 0.5 : 1;
  const openTtl = (15 * 60 * 1000 * riskMult) + (scopesCount * 60 * 1000);
  const leaseTtl = (60 * 60 * 1000 * riskMult) + (scopesCount * 2 * 60 * 1000) + (Math.floor(contextBytes / (1024 * 1024)) * 5 * 60 * 1000);
  return { openTtl, leaseTtl: Math.min(leaseTtl, 4 * 60 * 60 * 1000) };
}
const MAX_CONTEXT_SOURCES = 25;
const MAX_CONTEXT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_CONTEXT_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_PETORRETA_BYTES = 128 * 1024;
const MAX_MANIFEST_BYTES = 128 * 1024;
const RISK_LEVELS = new Set(['low', 'medium', 'high']);
const HIGH_RISK_OPERATIONS = new Set([
  'autoneteja-frontmatter',
  'autoneteja-quarantine',
  'autoneteja-report',
  'autoneteja-restore',
  'purga-wiki',
  'migracio-esquema',
  'canvi-genotip',
  'git-commit',
  'contradiction-report',
  'pattern-extract',
  'compiler-build',
  'snapshot-create',
  'tombstone-gc',
  'code-translate',
  'supabase-seed',
  'restauracio-segellada',
]);
const SNAPSHOT_SKIP_DIRS = new Set(['.git', '.sdp-reflex', '.sdp-paperera', '.wiki-safety', '.snapshots', 'node_modules', 'dist', 'build', '_build', 'coverage']);
const REFLEX_STATE_RELATIVE = '.sdp-reflex';
const ALLOWED_INDEX_MODES = new Set(['100644', '100755']);
const REQUIRED_HOOKS = new Map([
  ['pre-commit', [
    /npm run gate/,
  ]],
  ['post-commit', [/SDP-REFLEX-HOOK:v2:post-commit/, /consume-commit/]],
  ['pre-merge-commit', [/SDP-REFLEX-HOOK:v2:pre-merge-commit/, /pre-commit/]],
  ['pre-applypatch', [/SDP-REFLEX-HOOK:v2:pre-applypatch/, /pre-commit/]],
  ['post-applypatch', [/SDP-REFLEX-HOOK:v2:post-applypatch/, /post-commit/]],
]);
const CRITICAL_SEED_PATHS = [
  '.gitignore',
  'package.json',
  'AGENTS.md',
  '.agents/AGENTS.md',
  '.agents/README.md',
  '.agents/PROTOCOL_PETORRETA.md',
  '.agents/skills/socdepoble-workflow/SKILL.md',
  '.github/workflows/wiki-integrity.yml',
  '.husky/pre-commit',
  '.husky/post-commit',
  '.husky/pre-merge-commit',
  '.husky/pre-applypatch',
  '.husky/post-applypatch',
  'tooling/wiki/reflex_petorreta.mjs',
  'tooling/wiki/package.json',
  'tooling/wiki/pre-commit.mjs',
  'tooling/wiki/autoneteja_wiki.mjs',
  'tooling/wiki/contradiction_engine.mjs',
  'tooling/wiki/core/translate.mjs',
  'tooling/wiki/sdp.mjs',
  'tooling/wiki/core/audit.mjs',
  'tooling/wiki/core/lint.mjs',
  'tooling/wiki/core/snapshot_engine.mjs',
  'tooling/wiki/core/edge_rag.mjs',
  'tooling/wiki/core/search_cli.mjs',
  'tooling/wiki/core/build_rag_index.mjs',
  'tooling/wiki/core/a11y_seo.mjs',
  'tooling/wiki/core/runner.mjs',
  'scripts/generate-supabase-seed.mjs',
  'scripts/generate-supabase-seed.sh',
  'scripts/enllacat-intelligent-wiki.mjs',
  'tooling/wiki/lib/frontmatter.mjs',
  'tooling/wiki/lib/project_paths.mjs',
  'tooling/wiki/schema.json',
  'tooling/wiki/rules/trellat-rules.json',
  'tooling/wiki/schema-cutover.lock.json',
  WIKI_BASELINE_RELATIVE,
  'tooling/wiki/core/sistema_nervios.mjs',
];

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const posix = (value) => value.split(path.sep).join('/');
const unique = (values) => [...new Set(values)];
const isReflexState = (relative) => relative === REFLEX_STATE_RELATIVE || relative.startsWith(`${REFLEX_STATE_RELATIVE}/`);
const isInside = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

const LOCAL_MODULE_PATTERNS = [
  /\bfrom\s*["'](\.[^"']+)["']/g,
  /\bimport\s*["'](\.[^"']+)["']/g,
  /import\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
  /require\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
  /new\s+URL\(\s*["'](\.[^"']+)["']\s*,\s*import\.meta\.url\s*\)/g,
];
const JAVASCRIPT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx']);

async function resolveLocalModule(importerRelative, specifier) {
  const importer = path.join(PROJECT_DIR, importerRelative);
  const base = path.resolve(path.dirname(importer), specifier);
  if (!isInside(PROJECT_DIR, base)) throw new Error(`Import local fora del projecte: ${importerRelative} -> ${specifier}`);
  const candidates = path.extname(base)
    ? [base]
    : [base, ...['.mjs', '.js', '.cjs', '.json'].map((extension) => `${base}${extension}`), path.join(base, 'index.mjs')];
  for (const candidate of candidates) {
    const stat = await fs.lstat(candidate).catch(() => null);
    if (stat?.isFile()) return posix(path.relative(PROJECT_DIR, candidate));
  }
  throw new Error(`Import local absent: ${importerRelative} -> ${specifier}`);
}

async function criticalDependencyClosure() {
  const queue = [...CRITICAL_SEED_PATHS];
  const paths = new Set();
  const findings = [];
  while (queue.length) {
    const relative = posix(queue.shift());
    if (paths.has(relative)) continue;
    paths.add(relative);
    const absolute = path.join(PROJECT_DIR, relative);
    const stat = await fs.lstat(absolute).catch(() => null);
    if (!stat) {
      findings.push(`Fitxer crític absent: ${relative}.`);
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
      findings.push(`Fitxer crític no regular, symlink o hardlink: ${relative}.`);
      continue;
    }
    if (!JAVASCRIPT_EXTENSIONS.has(path.extname(relative))) continue;
    const content = await fs.readFile(absolute, 'utf8');
    const specifiers = new Set();
    for (const pattern of LOCAL_MODULE_PATTERNS) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) specifiers.add(match[1]);
    }
    for (const specifier of specifiers) {
      if (specifier.endsWith('/')) continue;
      try {
        const dependency = await resolveLocalModule(relative, specifier);
        if (!paths.has(dependency)) queue.push(dependency);
      } catch (error) {
        findings.push(error.message);
      }
    }
  }
  return { paths: [...paths].sort(), findings };
}

function validateGraphContract(graph) {
  const findings = [];
  if (graph.showOrphans !== false) findings.push('showOrphans ha de ser false');
  if (graph.hideUnresolved !== true) findings.push('hideUnresolved ha de ser true');
  if (graph.showAttachments !== false) findings.push('showAttachments ha de ser false');
  const requiredFilters = [
    '90_historic',
    '04_escriptori',
    '00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR',
    '00_SER_Brain_Identitat/Sollutia',
    '03_GOVERNAR_Normativa_Regles/agents_actius',
  ];
  const search = typeof graph.search === 'string' ? graph.search : '';
  for (const filter of requiredFilters) {
    if (!search.includes(`-path:"${filter}"`)) findings.push(`falta exclusió del graf: ${filter}`);
  }
  const groupQueries = new Set(Array.isArray(graph.colorGroups)
    ? graph.colorGroups.map((group) => group?.query).filter(Boolean) : []);
  for (const pillar of ['00_SER_Brain_Identitat', '01_SABER_Cultura_Coneixement', '02_ACTUAR_Maquina_Tecnica', '03_GOVERNAR_Normativa_Regles']) {
    if (!groupQueries.has(`path:"${pillar}"`)) findings.push(`falta grup de color del graf: ${pillar}`);
  }
  return findings;
}

function graphContractProjection(graph) {
  const exclusions = typeof graph.search === 'string'
    ? [...graph.search.matchAll(/-path:"([^"]+)"/g)].map((match) => match[1]).sort()
    : [];
  const colorGroups = Array.isArray(graph.colorGroups)
    ? graph.colorGroups.map((group) => ({ query: group?.query, color: group?.color })).sort((a, b) => String(a.query).localeCompare(String(b.query)))
    : [];
  return {
    showOrphans: graph.showOrphans,
    hideUnresolved: graph.hideUnresolved,
    showAttachments: graph.showAttachments,
    exclusions,
    colorGroups,
  };
}

export async function captureWikiBaseline(wikiDir = WIKI_DIR) {
  const rootReal = await fs.realpath(wikiDir);
  const entries = [];
  const findings = [];
  const excludedDirs = new Set(['.git', '.obsidian', 'assets', 'node_modules', 'scripts', '.wiki-safety']);
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if ((entry.name.startsWith('.') && entry.name !== '.agents') || excludedDirs.has(entry.name)) continue;
      if (entry.isSymbolicLink()) {
        findings.push(`Symlink prohibit dins del corpus: ${posix(path.relative(rootReal, absolute))}`);
        continue;
      }
      if (entry.isDirectory()) {
        if (directory === rootReal && entry.name === '04_escriptori') continue;
        await walk(absolute);
      }
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        const stat = await fs.lstat(absolute);
        if (stat.nlink !== 1) {
          findings.push(`Hardlink prohibit dins del corpus: ${posix(path.relative(rootReal, absolute))}`);
          continue;
        }
        const buffer = await fs.readFile(absolute);
        if (!isUtf8(buffer)) {
          findings.push(`Markdown no UTF-8: ${posix(path.relative(rootReal, absolute))}`);
          continue;
        }
        entries.push({
          file: posix(path.relative(rootReal, absolute)),
          bytes: buffer.length,
          sha256: sha256(buffer),
        });
      }
    }
  }
  await walk(rootReal);
  entries.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
  const zones = {};
  for (const entry of entries) {
    const zone = entry.file.split('/')[0];
    zones[zone] = (zones[zone] || 0) + 1;
  }
  const graphFile = path.join(rootReal, '.obsidian', 'graph.json');
  const graphStat = await fs.lstat(graphFile);
  if (!graphStat.isFile() || graphStat.isSymbolicLink() || graphStat.nlink !== 1) {
    throw new Error('graph.json ha de ser un fitxer regular únic, no symlink/hardlink.');
  }
  const [graphReal, obsidianReal] = await Promise.all([fs.realpath(graphFile), fs.realpath(path.dirname(graphFile))]);
  if (path.dirname(graphReal) !== obsidianReal || !isInside(rootReal, graphReal)) {
    throw new Error('graph.json no viu físicament dins de .obsidian del vault.');
  }
  const graphBuffer = await fs.readFile(graphFile);
  let graph;
  try {
    graph = JSON.parse(graphBuffer.toString('utf8'));
  } catch (error) {
    throw new Error(`graph.json invàlid: ${error.message}`);
  }
  findings.push(...validateGraphContract(graph));
  const summary = {
    schema: 'socdepoble.wiki-baseline.v1',
    documents: entries.length,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    zones,
    treeSha256: sha256(entries.map((entry) => `${entry.file}\0${entry.sha256}`).join('\n')),
    graphConfig: {
      path: GRAPH_CONFIG_RELATIVE,
      contractSha256: sha256(JSON.stringify(stable(graphContractProjection(graph)))),
    },
  };
  return { summary, files: entries.map((entry) => `_wiki_de_poble/${entry.file}`), findings };
}

export async function verifyWikiBaselineLock(wikiDir = WIKI_DIR) {
  const baseline = await captureWikiBaseline(wikiDir);
  const lockFile = path.join(PROJECT_DIR, WIKI_BASELINE_RELATIVE);
  const locked = JSON.parse(await fs.readFile(lockFile, 'utf8'));
  const findings = [...baseline.findings];
  if (baseline.summary.documents === 0) findings.push('La baseline no pot certificar un corpus Markdown buit');
  if (JSON.stringify(stable(locked)) !== JSON.stringify(stable(baseline.summary))) {
    findings.push(`baseline divergent: esperat ${locked.treeSha256 || '(sense hash)'}, actual ${baseline.summary.treeSha256}`);
  }
  return { ok: findings.length === 0, findings, baseline: baseline.summary, files: baseline.files };
}

function payloadForSignature(receipt) {
  const { signature, ...unsigned } = receipt;
  return JSON.stringify(stable(unsigned));
}

async function assertPrivateDirectory(directory, label, { create = false } = {}) {
  if (create) {
    await fs.mkdir(directory, { mode: 0o700 }).catch((error) => {
      if (error.code !== 'EEXIST') throw error;
    });
  }
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} ha de ser un directori físic, mai un symlink.`);
  }
  if ((stat.mode & 0o077) !== 0) throw new Error(`${label} ha de tindre permisos privats 0700.`);
  const [parentReal, directoryReal] = await Promise.all([
    fs.realpath(path.dirname(directory)),
    fs.realpath(directory),
  ]);
  if (path.dirname(directoryReal) !== parentReal) {
    throw new Error(`${label} no és un fill físic directe del directori esperat.`);
  }
  return stat;
}

async function assertStateLayout({ create = false, requireSecret = false } = {}) {
  await assertPrivateDirectory(STATE_DIR, '.sdp-reflex', { create });
  await assertPrivateDirectory(SESSION_DIR, '.sdp-reflex/sessions', { create });
  await assertPrivateDirectory(BOOTSTRAP_DIR, '.sdp-reflex/bootstrap', { create });
  if (!requireSecret) return null;
  const stat = await fs.lstat(SECRET_FILE);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    throw new Error('La clau local del Reflex ha de ser un fitxer regular únic, mai symlink ni hardlink.');
  }
  if ((stat.mode & 0o777) !== 0o600) throw new Error('La clau local del Reflex ha de tindre permisos 0600.');
  const [stateReal, secretReal] = await Promise.all([fs.realpath(STATE_DIR), fs.realpath(SECRET_FILE)]);
  if (path.dirname(secretReal) !== stateReal) throw new Error('La clau local no viu físicament dins de .sdp-reflex.');
  return stat;
}

async function ensureState() {
  await assertStateLayout({ create: true });
  try {
    await assertStateLayout({ requireSecret: true });
    const secret = (await fs.readFile(SECRET_FILE, 'utf8')).trim();
    if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Clau local del Reflex invàlida.');
    return secret;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const secret = randomBytes(32).toString('hex');
    try {
      await fs.writeFile(SECRET_FILE, `${secret}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      await assertStateLayout({ requireSecret: true });
      return secret;
    } catch (writeError) {
      if (writeError.code !== 'EEXIST') throw writeError;
      await assertStateLayout({ requireSecret: true });
      const existing = (await fs.readFile(SECRET_FILE, 'utf8')).trim();
      if (!/^[a-f0-9]{64}$/.test(existing)) throw new Error('Clau local del Reflex invàlida.');
      return existing;
    }
  }
}

async function loadSecret() {
  await assertStateLayout({ requireSecret: true });
  const secret = (await fs.readFile(SECRET_FILE, 'utf8')).trim();
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Clau local del Reflex invàlida.');
  return secret;
}

function sign(receipt, secret) {
  return createHmac('sha256', secret).update(payloadForSignature(receipt)).digest('hex');
}

function verifySignature(receipt, secret) {
  if (!/^[a-f0-9]{64}$/.test(receipt.signature || '')) return false;
  const expected = Buffer.from(sign(receipt, secret), 'hex');
  const actual = Buffer.from(receipt.signature, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function atomicJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await fs.rename(temp, file);
}

async function acquireExclusive(file, label) {
  let handle;
  try {
    handle = await fs.open(file, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`${label}: ja hi ha una altra operació en curs.`);
    throw error;
  }
  await handle.writeFile(`${process.pid} ${new Date().toISOString()}\n`);
  return async () => {
    await handle.close().catch(() => {});
    await fs.rm(file, { force: true }).catch(() => {});
  };
}

async function git(args, { allowFailure = false } = {}) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', PROJECT_DIR, ...args], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('Git no està disponible.');
    if (allowFailure) return '';
    throw new Error(`Git ha fallat (${args.join(' ')}): ${error.message}`);
  }
}

async function gitBuffer(args) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', PROJECT_DIR, ...args], {
      encoding: null,
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('Git no està disponible.');
    throw new Error(`Git ha fallat (${args.join(' ')}): ${error.message}`);
  }
}

async function gitState() {
  const head = (await git(['rev-parse', 'HEAD'])).trim() || null;
  const status = await git(['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  return { head, statusSha256: sha256(status) };
}

function parseIndexEntries(raw) {
  const entries = new Map();
  for (const record of raw.split('\0').filter(Boolean)) {
    const match = /^([0-7]{6}) ([0-9a-f]+) ([0-3])\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error('Resposta inesperada de `git ls-files --stage -z`.');
    const relative = safeIndexRelative(match[4]);
    const entry = { path: relative, mode: match[1], object: match[2], stage: Number(match[3]) };
    if (!entries.has(relative)) entries.set(relative, []);
    entries.get(relative).push(entry);
  }
  return entries;
}

async function stagedIndexChanges() {
  // --no-renames és essencial: una mudança fora->dins de scope ha d’exposar
  // tant el preimage eliminat com el postimage afegit.
  const changedPaths = unique((await git([
    'diff', '--cached', '--name-only', '-z', '--no-renames', '--no-ext-diff',
  ])).split('\0').filter(Boolean).map(safeIndexRelative)).sort((a, b) => a.localeCompare(b, 'ca'));
  const index = parseIndexEntries(await git(['ls-files', '--stage', '-z']));
  const changes = [];
  for (const relative of changedPaths) {
    const candidates = index.get(relative) || [];
    if (candidates.length === 0) {
      changes.push({ path: relative, mode: null, object: null, stage: null, change: 'delete' });
      continue;
    }
    if (candidates.length !== 1 || candidates[0].stage !== 0) {
      throw new Error(`Índex amb conflictes o stages múltiples no admés: ${relative}`);
    }
    const entry = candidates[0];
    if (!ALLOWED_INDEX_MODES.has(entry.mode)) {
      const kind = entry.mode === '120000' ? 'symlink'
        : entry.mode === '160000' ? 'gitlink/submòdul' : `mode ${entry.mode}`;
      throw new Error(`Entrada ${kind} prohibida en l’índex: ${relative}`);
    }
    if (/^0+$/.test(entry.object)) throw new Error(`Entrada intent-to-add sense blob real: ${relative}`);
    changes.push({ ...entry, change: 'write' });
  }
  return changes;
}

function ruleCandidates() {
  return [
    ['.agents/AGENTS.md'],
    ['.agents/PROTOCOL_PETORRETA.md'],
  ];
}

async function loadRules() {
  const rules = [];
  for (const candidates of ruleCandidates()) {
    let loaded = null;
    for (const relative of candidates) {
      const fullPath = path.join(PROJECT_DIR, relative);
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        loaded = { path: posix(relative), bytes: Buffer.byteLength(content), sha256: sha256(content), content };
        break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (!loaded) throw new Error(`Falta regla obligatòria: ${candidates.join(' o ')}`);
    rules.push(loaded);
  }
  return {
    rules,
    digest: sha256(rules.map((rule) => `${rule.path}\0${rule.sha256}`).join('\n')),
  };
}

async function resolveScope(raw) {
  if (!raw?.trim()) throw new Error('Un --scope buit no és vàlid; usa `.` explícitament si vols tot el projecte.');
  const absolute = path.resolve(PROJECT_DIR, raw);
  if (!isInside(PROJECT_DIR, absolute)) throw new Error(`Scope fora del projecte: ${raw}`);
  const [projectReal, scopeReal] = await Promise.all([
    fs.realpath(PROJECT_DIR),
    fs.realpath(absolute),
  ]);
  if (!isInside(projectReal, scopeReal)) throw new Error(`Scope físicament fora del projecte (symlink): ${raw}`);
  const lexicalRelative = posix(path.relative(PROJECT_DIR, absolute)) || '.';
  const physicalRelative = posix(path.relative(projectReal, scopeReal)) || '.';
  if (lexicalRelative !== physicalRelative) {
    throw new Error(`Scope ambigu a través d’un symlink: ${raw}; declara la ruta física ${physicalRelative}.`);
  }
  if (isReflexState(lexicalRelative)) throw new Error('.sdp-reflex és estat intern i no pot ser un scope mutable.');
  return lexicalRelative;
}

async function safeTargetRelative(raw) {
  const target = path.resolve(raw);
  if (!isInside(PROJECT_DIR, target)) throw new Error(`Target fora del projecte: ${raw}`);

  const targetStat = await fs.lstat(target).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (targetStat?.isFile() && targetStat.nlink !== 1) {
    throw new Error(`Target és un hardlink i no té identitat exclusiva: ${raw}`);
  }

  // realpath falla per a fitxers nous o eliminats. En eixe cas pugem fins al
  // primer ancestre existent i tornem a afegir la cua sense seguir symlinks.
  let cursor = target;
  const tail = [];
  let resolved;
  while (!resolved) {
    try {
      resolved = await fs.realpath(cursor);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      tail.unshift(path.basename(cursor));
      cursor = parent;
    }
  }
  const physical = path.resolve(resolved, ...tail);
  const projectReal = await fs.realpath(PROJECT_DIR);
  if (!isInside(projectReal, physical)) throw new Error(`Target físicament fora del projecte (symlink): ${raw}`);
  const lexicalRelative = posix(path.relative(PROJECT_DIR, target)) || '.';
  const physicalRelative = posix(path.relative(projectReal, physical)) || '.';
  if (lexicalRelative !== physicalRelative) {
    throw new Error(`Target ambigu a través d’un symlink: ${lexicalRelative}.`);
  }
  return lexicalRelative;
}

function safeIndexRelative(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.includes('\0')) {
    throw new Error('Ruta buida o amb NUL en l’índex de Git.');
  }
  const relative = posix(raw).replace(/^\.\//, '');
  if (path.posix.isAbsolute(relative) || relative === '.' || relative === '..'
    || relative.startsWith('../') || path.posix.normalize(relative) !== relative) {
    throw new Error(`Ruta lèxicament insegura en l’índex de Git: ${raw}`);
  }
  const absolute = path.resolve(PROJECT_DIR, relative);
  if (!isInside(PROJECT_DIR, absolute)) throw new Error(`Target de l’índex fora del projecte: ${raw}`);
  if (isReflexState(relative)) throw new Error('.sdp-reflex no pot ser target d’un commit.');
  return relative;
}

function inScopes(relative, scopes) {
  const value = posix(relative).replace(/^\.\//, '');
  if (isReflexState(value)) return false;
  return scopes.some((scope) => scope === '.' || value === scope || value.startsWith(`${scope}/`));
}

async function snapshotScopes(scopes) {
  const entries = new Map();
  const excluded = new Set();

  async function walk(fullPath) {
    const relative = posix(path.relative(PROJECT_DIR, fullPath)) || '.';
    const stat = await fs.lstat(fullPath);
    if (stat.isSymbolicLink()) {
      entries.set(relative, { path: relative, type: 'symlink', sha256: sha256(await fs.readlink(fullPath)), bytes: 0 });
      return;
    }
    if (stat.isDirectory()) {
      if (relative !== '.' && SNAPSHOT_SKIP_DIRS.has(path.basename(fullPath))) {
        excluded.add(relative);
        return;
      }
      const children = await fs.readdir(fullPath);
      children.sort((a, b) => a.localeCompare(b, 'ca'));
      for (const child of children) await walk(path.join(fullPath, child));
      return;
    }
    if (!stat.isFile()) return;
    const buffer = await fs.readFile(fullPath);
    entries.set(relative, { path: relative, type: 'file', sha256: sha256(buffer), bytes: buffer.length });
  }

  for (const scope of scopes) {
    const fullPath = path.resolve(PROJECT_DIR, scope);
    if (!isInside(PROJECT_DIR, fullPath)) throw new Error(`Scope fora del projecte: ${scope}`);
    await walk(fullPath);
  }
  const sorted = [...entries.values()].sort((a, b) => a.path.localeCompare(b.path, 'ca'));
  const sortedExcluded = [...excluded].sort((a, b) => a.localeCompare(b, 'ca'));
  return {
    files: sorted.length,
    bytes: sorted.reduce((sum, item) => sum + item.bytes, 0),
    digest: sha256([
      ...sorted.map((item) => `${item.path}\0${item.type}\0${item.sha256}`),
      ...sortedExcluded.map((item) => `EXCLUDED\0${item}`),
    ].join('\n')),
    excluded: sortedExcluded,
    entries: sorted,
  };
}

function sessionPath(sessionId) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) throw new Error('Identificador de sessió invàlid.');
  return path.join(SESSION_DIR, `${sessionId}.json`);
}

function bootstrapPath(sessionId) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) throw new Error('Identificador de sessió invàlid.');
  return path.join(BOOTSTRAP_DIR, sessionId);
}

async function reserveBootstrap(sessionId) {
  const directory = bootstrapPath(sessionId);
  await fs.mkdir(directory, { mode: 0o700 });
  const stat = await fs.lstat(directory);
  const entries = await fs.readdir(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || entries.length !== 0) {
    throw new Error('No s’ha pogut reservar un bootstrap nou, buit i físic.');
  }

  try {
    const plantillaSrc = path.join(PROJECT_DIR, '_wiki_de_poble', '02_saber', '07_plantilles', '00_PLANTILLA_PROMPT_CONSELL.md');
    const plantillaDest = path.join(directory, '00_PLANTILLA_PROMPT_CONSELL.md');
    await fs.copyFile(plantillaSrc, plantillaDest);
  } catch (e) {
    console.warn(`[Reflex] No s'ha pogut injectar la plantilla ISO: ${e.message}`);
  }
  return {
    path: posix(path.relative(PROJECT_DIR, directory)),
    device: String(stat.dev),
    inode: String(stat.ino),
  };
}

async function assertReservedBootstrap(session) {
  if (session.schema !== 'socdepoble.reflex.session.v3') {
    throw new Error('Sessió anterior al bootstrap aïllat; repetix open/seal.');
  }
  const directory = bootstrapPath(session.sessionId);
  const expectedRelative = posix(path.relative(PROJECT_DIR, directory));
  if (session.bootstrap?.path !== expectedRelative) throw new Error('Ruta de bootstrap no vinculada a la sessió.');

  const [rootStat, directoryStat] = await Promise.all([
    fs.lstat(BOOTSTRAP_DIR),
    fs.lstat(directory),
  ]);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('L’arrel de bootstrap no és un directori físic.');
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw new Error('El bootstrap reservat no és un directori físic.');
  if (String(directoryStat.dev) !== session.bootstrap.device || String(directoryStat.ino) !== session.bootstrap.inode) {
    throw new Error('El directori bootstrap reservat ha sigut substituït després d’open.');
  }

  const [stateReal, rootReal, directoryReal] = await Promise.all([
    fs.realpath(STATE_DIR),
    fs.realpath(BOOTSTRAP_DIR),
    fs.realpath(directory),
  ]);
  if (!isInside(stateReal, rootReal) || path.dirname(directoryReal) !== rootReal) {
    throw new Error('El bootstrap no és el directori físic exacte reservat dins de .sdp-reflex/bootstrap.');
  }
  return { directory, directoryReal };
}

async function assertBootstrapPair(session, petorretaPath, manifestPath) {
  if (!petorretaPath || !manifestPath) throw new Error('Calen --petorreta i --manifest dins del bootstrap reservat.');
  const { directory, directoryReal } = await assertReservedBootstrap(session);
  const requested = [path.resolve(petorretaPath), path.resolve(manifestPath)];
  if (requested[0] === requested[1]) throw new Error('Petorreta i manifest han de ser dos fitxers diferents.');
  if (requested.some((file) => path.dirname(file) !== directory)) {
    throw new Error(`Petorreta i manifest han de ser fills directes de ${posix(path.relative(PROJECT_DIR, directory))}.`);
  }

  const expectedNames = requested.map((file) => path.basename(file)).sort((a, b) => a.localeCompare(b, 'ca'));
  const actualNames = (await fs.readdir(directory)).sort((a, b) => a.localeCompare(b, 'ca'));
  if (actualNames.length !== 2 || actualNames.some((name, index) => name !== expectedNames[index])) {
    throw new Error('El bootstrap ha de contindre exactament la Petorreta i el manifest declarats, sense cap altra entrada.');
  }

  for (const file of requested) {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`El bootstrap només admet fitxers regulars, mai symlinks: ${path.basename(file)}`);
    }
    if (stat.nlink !== 1) throw new Error(`El bootstrap no admet hardlinks: ${path.basename(file)}`);
    const real = await fs.realpath(file);
    if (path.dirname(real) !== directoryReal) {
      throw new Error(`Fitxer de bootstrap fora del directori físic reservat: ${path.basename(file)}`);
    }
  }
  return {
    directory,
    petorreta: requested[0],
    manifest: requested[1],
  };
}

async function loadSession(sessionId) {
  return JSON.parse(await fs.readFile(sessionPath(sessionId), 'utf8'));
}

async function receiptOrActive(receiptPath) {
  if (receiptPath) return path.resolve(receiptPath);
  const active = JSON.parse(await fs.readFile(ACTIVE_FILE, 'utf8'));
  return sessionPath(active.sessionId);
}

export function editorialPart(content) {
  const marker = content.search(/^#{2,3}\s+(?:ANNEX|ANNEXOS|CONTEXT MECÀNIC|CODI FONT)\b/im);
  const editorial = marker >= 0 ? content.slice(0, marker) : content;
  const noCode = [];
  let fence = false;
  let fenceChar = '';
  for (const line of editorial.split(/(?<=\n)/)) {
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (!fence && match) {
      fence = true;
      fenceChar = match[1][0];
      continue;
    }
    if (fence) {
      if (match && match[1][0] === fenceChar) fence = false;
      continue;
    }
    noCode.push(line);
  }
  return noCode.join('').replace(/(`+)[^`]*\1/g, '');
}

export function validatePetorreta(file, content) {
  const errors = [];
  const parsed = parseFrontmatter(content);
  if (!parsed.hasFrontmatter || parsed.malformed) errors.push('frontmatter absent o mal tancat');
  if (parsed.errors.length) errors.push(`frontmatter invàlid: ${parsed.errors.join(', ')}`);
  if (parsed.hasFrontmatter && !parsed.malformed && parsed.errors.length === 0) {
    const schemaErrors = validarFrontmatter(parsed.data);
    if (schemaErrors.length) errors.push(`frontmatter fora de schema v2: ${schemaErrors.join(' ')}`);
  }
  if (parsed.data.tipus !== 'petorreta') errors.push('el frontmatter ha de declarar `tipus: petorreta`');
  if (!parsed.data.description) errors.push('el frontmatter necessita `description`');
  const base = path.basename(file);
  const match = /^(\d{6}_\d{4})_PROMPT_(.+)\.md$/.exec(base);
  if (!match) {
    errors.push('nom invàlid: usa YYMMDD_HHMM_PROMPT_... i `tipus: petorreta`');
  } else {
    const words = match[2].split('_').filter(Boolean);
    if (words.length < 8 || words.length > 12) errors.push(`títol descriptiu de ${words.length} paraules; se n'exigixen 8–12`);
  }
  const editorial = editorialPart(content);
  const requiredSections = [
    ['context', /^(?:#{1,4}\s+.*context|\*\*context)/im],
    ['tasques', /^(?:#{1,4}\s+.*tasques|\*\*tasques)/im],
    ['riscos', /^(?:#{1,4}\s+.*riscos|\*\*riscos)/im],
    ['criteris d’acceptació', /^(?:#{1,4}\s+.*criteris? d['’]acceptaci[oó]|\*\*criteris? d['’]acceptaci[oó])/im],
  ];
  for (const [name, regex] of requiredSections) if (!regex.test(editorial)) errors.push(`falta secció editorial: ${name}`);
  if (/\$\{[A-Za-z_][A-Za-z0-9_.-]*\}/.test(editorial)) errors.push('placeholder editorial sense interpolar');
  if (editorial.trim().length < 800) errors.push('cos editorial massa curt (<800 caràcters)');
  return errors;
}

const DENIED_PATH_RE = /(^|\/)(?:\.env(?:\.|$)|id_rsa|id_ed25519|credentials?|secrets?)(\/|$)|\.(?:pem|p12|pfx|key)$/i;
const SENSITIVE_PATTERNS = [
  ['clau privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['secret assignat', /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,}["']/i],
  ['IBAN', /\b[A-Z]{2}\d{2}(?:[ ]?\d{4}){4,7}\b/],
  ['correu electrònic', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['DNI o NIE', /\b(?:\d{8}|[XYZ]\d{7})[A-Z]\b/i],
  ['telèfon personal probable', /(?<![A-Za-z0-9])(?:\+34[ .-]?)?[6789]\d{2}(?:[ .-]?\d{3}){2}(?![A-Za-z0-9])/],
];

function assertNoSensitiveText(content, label) {
  for (const [kind, regex] of SENSITIVE_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(content)) throw new Error(`Possible ${kind} en ${label}; cal redacció humana.`);
  }
}

function looksBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  return sample.includes(0);
}

async function hashContextManifest(manifestPath) {
  if (!manifestPath) throw new Error('Cal --manifest=<context.json>.');
  const absolute = await fs.realpath(path.resolve(manifestPath));
  const projectReal = await fs.realpath(PROJECT_DIR);
  if (!isInside(projectReal, absolute)) throw new Error('El manifest ha de viure dins del projecte.');
  const manifestBuffer = await fs.readFile(absolute);
  if (manifestBuffer.length > MAX_MANIFEST_BYTES) {
    throw new Error(`El manifest supera ${MAX_MANIFEST_BYTES} bytes.`);
  }
  const manifestText = manifestBuffer.toString('utf8');
  assertNoSensitiveText(manifestText, 'el manifest');
  const manifest = JSON.parse(manifestText);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)
    || Object.keys(manifest).some((key) => key !== 'sources')) {
    throw new Error('El manifest només admet la propietat `sources`.');
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) throw new Error('El manifest necessita `sources` no buit.');
  if (manifest.sources.length > MAX_CONTEXT_SOURCES) {
    throw new Error(`El manifest té ${manifest.sources.length} fonts; el màxim selectiu és ${MAX_CONTEXT_SOURCES}. Divideix la tasca.`);
  }
  const sources = [];
  const seen = new Set();
  let totalBytes = 0;
  for (const source of manifest.sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)
      || Object.keys(source).some((key) => !['path', 'reason', 'classification', 'role'].includes(key))) {
      throw new Error('Cada font només admet path, reason, classification i role.');
    }
    if (!source.path || !source.reason) throw new Error('Cada font necessita path i reason.');
    if (typeof source.path !== 'string' || typeof source.reason !== 'string' || source.reason.length > 240) {
      throw new Error('path/reason han de ser text i reason no pot superar 240 caràcters.');
    }
    const relative = posix(source.path).replace(/^\.\//, '');
    if (DENIED_PATH_RE.test(relative)) throw new Error(`Font sensible prohibida: ${relative}`);
    const lexicalPath = path.resolve(PROJECT_DIR, relative);
    if (!isInside(PROJECT_DIR, lexicalPath)) throw new Error(`Font fora del projecte: ${relative}`);
    const fullPath = await fs.realpath(lexicalPath);
    if (!isInside(projectReal, fullPath)) throw new Error(`Symlink de font fora del projecte: ${relative}`);
    const canonicalRelative = posix(path.relative(projectReal, fullPath));
    if (seen.has(canonicalRelative)) throw new Error(`Font de context duplicada: ${canonicalRelative}`);
    seen.add(canonicalRelative);
    const buffer = await fs.readFile(fullPath);
    if (looksBinary(buffer)) throw new Error(`Font binària prohibida: ${relative}`);
    if (buffer.length > MAX_CONTEXT_FILE_BYTES) {
      throw new Error(`Font massa gran (${buffer.length} bytes; màxim ${MAX_CONTEXT_FILE_BYTES}): ${relative}`);
    }
    totalBytes += buffer.length;
    if (totalBytes > MAX_CONTEXT_TOTAL_BYTES) {
      throw new Error(`El context supera ${MAX_CONTEXT_TOTAL_BYTES} bytes; selecciona només fonts rellevants.`);
    }
    const content = buffer.toString('utf8');
    assertNoSensitiveText(content, relative);
    const role = source.role || 'reference';
    if (!['reference', 'target'].includes(role)) throw new Error(`Role de context invàlid en ${relative}: ${role}`);
    const classification = source.classification || 'internal';
    if (!['public', 'internal', 'confidential'].includes(classification)) {
      throw new Error(`Classificació de context invàlida en ${relative}: ${classification}`);
    }
    sources.push({
      path: canonicalRelative,
      reason: source.reason,
      classification,
      role,
      bytes: buffer.length,
      sha256: sha256(buffer),
    });
  }
  return { path: posix(path.relative(projectReal, absolute)), sha256: sha256(manifestBuffer), sources };
}

export async function openReflex(options) {
  const { intent, risk = 'high', scopes = [], operations = [] } = options;
  if (!intent?.trim()) throw new Error('Cal --intent=<descripció de la tasca>.');
  if (!RISK_LEVELS.has(risk)) throw new Error(`Risc invàlid: ${risk}`);
  if (scopes.length === 0) throw new Error('Cal almenys un --scope=<ruta>.');
  if (operations.length === 0) throw new Error('Cal almenys una --operation=<nom>; el rebut ha d’estar lligat a accions concretes.');
  if (operations.some((operation) => !operation?.trim())) throw new Error('Les operacions buides no són vàlides.');
  const normalizedOperations = unique(operations.map((operation) => operation.trim()));
  if (normalizedOperations.some((operation) => HIGH_RISK_OPERATIONS.has(operation)) && risk !== 'high') {
    throw new Error('Una operació d’alt risc exigix --risk=high.');
  }
  let secret;
  try {
    secret = await loadSecret();
  } catch (error) {
    throw new Error(`Reflex no inicialitzat o insegur; executa \`reflex:init\`: ${error.message}`);
  }
  const loaded = await loadRules();
  const gitBefore = await gitState();
  const normalizedScopes = unique(await Promise.all(scopes.map((scope) => resolveScope(scope.trim()))));
  const scopeSnapshot = await snapshotScopes(normalizedScopes);
  const id = randomUUID();
  const nonce = randomBytes(24).toString('hex');
  const openedAt = new Date();
  const bootstrap = await reserveBootstrap(id);
  const session = {
    schema: 'socdepoble.reflex.session.v3',
    sessionId: id,
    status: 'open',
    risk,
    intentSha256: sha256(intent.trim()),
    scopes: normalizedScopes,
    operations: normalizedOperations,
    openedAt: openedAt.toISOString(),
    openExpiresAt: new Date(openedAt.getTime() + getDynamicTTL(risk, normalizedScopes.length).openTtl).toISOString(),
    nonceSha256: sha256(nonce),
    rules: loaded.rules.map(({ content, ...rule }) => rule),
    rulesDigest: loaded.digest,
    gitBefore,
    scopeSnapshot,
    bootstrap,
  };
  session.signature = sign(session, secret);
  try {
    await atomicJson(sessionPath(id), session);
  } catch (error) {
    await fs.rm(bootstrapPath(id), { recursive: true, force: true }).catch(() => {});
    throw error;
  }
  return { session, nonce, ruleTexts: loaded.rules };
}

export async function sealReflex(options) {
  const { sessionId, nonce, petorretaPath, manifestPath } = options;
  const secret = await loadSecret();
  const releaseLock = await acquireExclusive(ACTIVE_LOCK, 'Segellat del Reflex bloquejat');
  try {
  const session = await loadSession(sessionId);
  if (!verifySignature(session, secret)) throw new Error('Sessió manipulada o signatura invàlida.');
  if (session.status !== 'open') throw new Error(`Sessió no oberta: ${session.status}`);
  if (Date.now() > Date.parse(session.openExpiresAt)) throw new Error('Sessió open caducada.');
  if (sha256(nonce || '') !== session.nonceSha256) throw new Error('Nonce invàlid.');

  const rules = await loadRules();
  if (rules.digest !== session.rulesDigest) throw new Error('Les regles han canviat després d’open.');
  const currentGit = await gitState();
  if (currentGit.head !== session.gitBefore.head) throw new Error('HEAD ha canviat després d’open.');

  const bootstrapPair = await assertBootstrapPair(session, petorretaPath, manifestPath);
  const petorreta = bootstrapPair.petorreta;
  const manifestReal = bootstrapPair.manifest;
  const snapshotAtSeal = await snapshotScopes(session.scopes);
  if (snapshotAtSeal.digest !== session.scopeSnapshot.digest) {
    throw new Error('Els scopes han canviat entre open i seal; el bootstrap no crea cap excepció al snapshot.');
  }
  const petorretaBuffer = await fs.readFile(petorreta);
  if (petorretaBuffer.length > MAX_PETORRETA_BYTES) {
    throw new Error(`La Petorreta supera ${MAX_PETORRETA_BYTES} bytes; usa context selectiu.`);
  }
  const content = petorretaBuffer.toString('utf8');
  assertNoSensitiveText(content, 'la Petorreta');
  const errors = validatePetorreta(petorreta, content);
  const editorial = editorialPart(content);
  if (!editorial.includes(`Reflex-Session: ${session.sessionId}`)) errors.push('falta vincle exacte `Reflex-Session`');
  if (!editorial.includes(`Intent-SHA256: ${session.intentSha256}`)) errors.push('falta vincle exacte `Intent-SHA256`');
  if (!editorial.includes(`Rules-SHA256: ${session.rulesDigest}`)) errors.push('falta vincle exacte `Rules-SHA256`');
  const planMatch = /^Plan-SHA256:\s*([a-f0-9]{64})\s*$/im.exec(editorial);
  if (session.operations.some((operation) => operation.startsWith('autoneteja-')) && !planMatch) {
    errors.push('una operació d’autoneteja exigix `Plan-SHA256`');
  }
  if (errors.length) throw new Error(`Petorreta invàlida: ${errors.join('; ')}`);
  const context = await hashContextManifest(manifestReal);
  for (const source of context.sources.filter((item) => item.role === 'target')) {
    if (!inScopes(source.path, session.scopes)) throw new Error(`Target de context fora de scope: ${source.path}`);
  }
  const active = await fs.readFile(ACTIVE_FILE, 'utf8').then(JSON.parse).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (active && active.sessionId !== sessionId) {
    const previous = await loadSession(active.sessionId).catch(() => null);
    if (previous && verifySignature(previous, secret) && previous.status === 'sealed'
      && Date.now() <= Date.parse(previous.leaseExpiresAt)) {
      throw new Error(`Ja hi ha una lease activa: ${active.sessionId}. Consumix-la o espera que caduque.`);
    }
  }
  const sealedAt = new Date();
  const sealed = {
    ...session,
    status: 'sealed',
    sealedAt: sealedAt.toISOString(),
    leaseExpiresAt: new Date(sealedAt.getTime() + getDynamicTTL(session.risk, session.scopes.length, context.sources.reduce((sum, s) => sum + s.bytes, 0)).leaseTtl).toISOString(),
    petorreta: {
      path: posix(path.relative(PROJECT_DIR, petorreta)),
      bytes: Buffer.byteLength(content),
      sha256: sha256(content),
    },
    context,
    planSha256: planMatch?.[1] || null,
    baselineAtSeal: currentGit,
    scopeSnapshotAtSeal: {
      files: snapshotAtSeal.files,
      bytes: snapshotAtSeal.bytes,
      digest: snapshotAtSeal.digest,
      excluded: snapshotAtSeal.excluded,
    },
  };
  delete sealed.nonceSha256;
  delete sealed.signature;
  sealed.signature = sign(sealed, secret);
  await atomicJson(sessionPath(sessionId), sealed);
  await atomicJson(ACTIVE_FILE, { sessionId, receipt: posix(path.relative(PROJECT_DIR, sessionPath(sessionId))) });
  return sealed;
  } finally {
    await releaseLock();
  }
}

async function currentRulesDigest() {
  return (await loadRules()).digest;
}

export async function validateReceiptForMutation({
  receiptPath,
  operation,
  targets = [],
  checkDirty = true,
  planDigest = null,
  stagedTargets = false,
}) {
  const absolute = await fs.realpath(await receiptOrActive(receiptPath));
  const stateReal = await fs.realpath(STATE_DIR);
  if (!isInside(stateReal, absolute)) throw new Error('El rebut ha de ser una sessió de .sdp-reflex.');
  const receipt = JSON.parse(await fs.readFile(absolute, 'utf8'));
  const secret = await loadSecret();
  const canonicalReceipt = await fs.realpath(sessionPath(receipt.sessionId));
  if (canonicalReceipt !== absolute) throw new Error('Només s’admet el rebut canònic de la sessió; les còpies no són reutilitzables.');
  const active = JSON.parse(await fs.readFile(ACTIVE_FILE, 'utf8'));
  if (active.sessionId !== receipt.sessionId) throw new Error('El rebut no és la lease activa del worktree.');
  if (!verifySignature(receipt, secret)) throw new Error('Rebut manipulat o signatura invàlida.');
  if (receipt.status !== 'sealed') throw new Error(`Rebut no usable: ${receipt.status}`);
  if (Date.now() > Date.parse(receipt.leaseExpiresAt)) throw new Error('Lease del Reflex caducada.');
  if (!receipt.operations.includes(operation)) throw new Error(`Operació fora del rebut: ${operation}`);
  if (planDigest && receipt.planSha256 !== planDigest) throw new Error('El pla no coincidix amb el declarat a la Petorreta.');
  if (receipt.planSha256 && !planDigest && operation.startsWith('autoneteja-')) {
    throw new Error('L’operació exigix validar el Plan-SHA256 del rebut.');
  }
  if (await currentRulesDigest() !== receipt.rulesDigest) throw new Error('Les regles han canviat; repetix open/seal.');

  const bootstrapPair = await assertBootstrapPair(
    receipt,
    path.join(PROJECT_DIR, receipt.petorreta.path),
    path.join(PROJECT_DIR, receipt.context.path),
  );
  const petorretaContent = await fs.readFile(bootstrapPair.petorreta);
  if (sha256(petorretaContent) !== receipt.petorreta.sha256) throw new Error('La Petorreta ha canviat després de seal.');
  const manifestContent = await fs.readFile(bootstrapPair.manifest);
  if (sha256(manifestContent) !== receipt.context.sha256) throw new Error('El manifest ha canviat després de seal.');
  for (const source of receipt.context.sources) {
    if (operation === 'git-commit' && source.role === 'target') continue;
    const sourcePath = path.join(PROJECT_DIR, source.path);
    if (!isInside(PROJECT_DIR, sourcePath)) throw new Error(`Font de context fora del projecte: ${source.path}`);
    const buffer = await fs.readFile(sourcePath);
    if (sha256(buffer) !== source.sha256) throw new Error(`Font de context canviada: ${source.path}`);
  }
  for (const targetRaw of targets) {
    // Els targets de l’índex són autoritat de Git, no del worktree. Inspeccionar
    // el fitxer físic ací permetria ocultar un symlink staged substituint-lo per
    // un fitxer regular no staged abans que s’execute el hook.
    const relative = stagedTargets ? safeIndexRelative(targetRaw) : await safeTargetRelative(targetRaw);
    if (!inScopes(relative, receipt.scopes)) throw new Error(`Target fora de scope: ${relative}`);
  }
  const state = await gitState();
  if (state.head !== receipt.baselineAtSeal.head) throw new Error('HEAD ha canviat després de seal.');
  if (checkDirty && state.statusSha256 !== receipt.baselineAtSeal.statusSha256) {
    throw new Error('El worktree ha canviat després de seal; receipt caducat.');
  }
  if (checkDirty) {
    const scoped = await snapshotScopes(receipt.scopes);
    if (scoped.digest !== receipt.scopeSnapshotAtSeal.digest) {
      throw new Error('El contingut dels scopes ha canviat després de seal; receipt caducat.');
    }
  }
  return receipt;
}

export async function claimReceiptForMutation(options) {
  if (options.operation === 'git-commit') {
    throw new Error('git-commit es vincula a l’arbre staged i no usa claims de mutador.');
  }
  const releaseLock = await acquireExclusive(ACTIVE_LOCK, 'Claim del Reflex bloquejat');
  try {
    const receipt = await validateReceiptForMutation(options);
    if (receipt.claims?.[options.operation]) {
      throw new Error(`Replay prohibit: l’operació ${options.operation} ja ha sigut reclamada per esta lease.`);
    }
    const secret = await loadSecret();
    const claimToken = randomBytes(32).toString('hex');
    const claimed = {
      ...receipt,
      claims: {
        ...(receipt.claims || {}),
        [options.operation]: {
          status: 'claimed',
          claimedAt: new Date().toISOString(),
          tokenSha256: sha256(claimToken),
          targetsSha256: sha256(JSON.stringify(stable(options.targets || []))),
        },
      },
    };
    delete claimed.signature;
    claimed.signature = sign(claimed, secret);
    await atomicJson(sessionPath(claimed.sessionId), claimed);
    return { receipt: claimed, claimToken };
  } finally {
    await releaseLock();
  }
}

export async function validateExecutionClaim(options, claimToken) {
  if (!/^[a-f0-9]{64}$/.test(claimToken || '')) throw new Error('Claim d’execució absent o invàlid.');
  const receipt = await validateReceiptForMutation(options);
  const claim = receipt.claims?.[options.operation];
  if (!claim || claim.status !== 'claimed') throw new Error(`No hi ha claim actiu per ${options.operation}.`);
  const expected = Buffer.from(claim.tokenSha256, 'hex');
  const actual = Buffer.from(sha256(claimToken), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Claim d’execució incorrecte.');
  }
  if (claim.targetsSha256 !== sha256(JSON.stringify(stable(options.targets || [])))) {
    throw new Error('Els targets no coincidixen amb el claim d’execució.');
  }
  return receipt;
}

export async function completeMutationClaim({ receiptPath, operation }, claimToken) {
  const releaseLock = await acquireExclusive(ACTIVE_LOCK, 'Finalització del claim bloquejada');
  try {
    const loaded = await loadConsumableReceipt(receiptPath);
    const claim = loaded.receipt.claims?.[operation];
    if (!claim || claim.status !== 'claimed') throw new Error(`Claim no finalitzable per ${operation}.`);
    const expected = Buffer.from(claim.tokenSha256, 'hex');
    const actual = Buffer.from(sha256(claimToken || ''), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new Error('Token incorrecte en finalitzar el claim.');
    }
    claim.status = 'completed';
    claim.completedAt = new Date().toISOString();
    delete loaded.receipt.signature;
    loaded.receipt.signature = sign(loaded.receipt, loaded.secret);
    await atomicJson(loaded.absolute, loaded.receipt);
    return loaded.receipt;
  } finally {
    await releaseLock();
  }
}

const stagedChangesDigest = (changes) => sha256(JSON.stringify(stable(changes)));

async function currentPendingTree() {
  const before = await stagedIndexChanges();
  const treeBefore = (await git(['write-tree'])).trim();
  const diff = await git(['diff', '--cached', '--binary', '--no-ext-diff', '--no-renames']);
  const after = await stagedIndexChanges();
  const treeAfter = (await git(['write-tree'])).trim();
  if (treeBefore !== treeAfter || stagedChangesDigest(before) !== stagedChangesDigest(after)) {
    throw new Error('L’índex de Git ha canviat mentre es verificava; torna a executar el Reflex.');
  }
  return {
    tree: treeAfter,
    diffSha256: sha256(diff),
    stagedChanges: after,
    stagedPaths: after.map((entry) => entry.path),
  };
}

async function bindStagedTree(receipt, expectedChanges) {
  const releaseLock = await acquireExclusive(ACTIVE_LOCK, 'Binding Git del Reflex bloquejat');
  try {
    const current = await validateReceiptForMutation({
      receiptPath: sessionPath(receipt.sessionId),
      operation: 'git-commit',
      targets: (expectedChanges || []).map((entry) => entry.path),
      checkDirty: false,
      stagedTargets: true,
    });
    const secret = await loadSecret();
    const pending = await currentPendingTree();
    if (expectedChanges && stagedChangesDigest(expectedChanges) !== stagedChangesDigest(pending.stagedChanges)) {
      throw new Error('L’índex de Git ha canviat entre la validació de scopes i el segellat de l’arbre.');
    }
    for (const change of pending.stagedChanges) {
      if (!inScopes(change.path, current.scopes)) throw new Error(`Target fora de scope: ${change.path}`);
    }
    const headBeforeCommit = (await git(['rev-parse', 'HEAD'])).trim();
    if (headBeforeCommit !== current.baselineAtSeal.head) {
      throw new Error('HEAD ha canviat abans de vincular l’arbre staged.');
    }
    const bound = {
      ...current,
      pendingCommit: {
        ...pending,
        headBeforeCommit,
        verifiedAt: new Date().toISOString(),
      },
    };
    delete bound.signature;
    bound.signature = sign(bound, secret);
    await atomicJson(sessionPath(bound.sessionId), bound);
    return bound;
  } finally {
    await releaseLock();
  }
}

async function loadConsumableReceipt(receiptPath) {
  const absolute = await fs.realpath(await receiptOrActive(receiptPath));
  const stateReal = await fs.realpath(STATE_DIR);
  if (!isInside(stateReal, absolute)) throw new Error('El rebut ha de ser una sessió de .sdp-reflex.');
  const secret = await loadSecret();
  const receipt = JSON.parse(await fs.readFile(absolute, 'utf8'));
  if (await fs.realpath(sessionPath(receipt.sessionId)) !== absolute) throw new Error('Rebut no canònic.');
  const active = JSON.parse(await fs.readFile(ACTIVE_FILE, 'utf8'));
  if (active.sessionId !== receipt.sessionId) throw new Error('La sessió no és la lease activa.');
  if (!verifySignature(receipt, secret) || receipt.status !== 'sealed') throw new Error('Rebut no consumible.');
  return { absolute, receipt, secret };
}

async function finalizeReceipt({ absolute, receipt, secret }) {
  delete receipt.signature;
  receipt.status = 'consumed';
  receipt.consumedAt = new Date().toISOString();
  receipt.signature = sign(receipt, secret);
  await atomicJson(absolute, receipt);
  await fs.rm(ACTIVE_FILE, { force: true });
  return receipt;
}

export async function consumeReceipt(receiptPath) {
  const releaseLock = await acquireExclusive(ACTIVE_LOCK, 'Consum del Reflex bloquejat');
  try {
    const loaded = await loadConsumableReceipt(receiptPath);
    if (loaded.receipt.operations.includes('git-commit')) {
      throw new Error('Un rebut git-commit només es pot consumir amb `consume-commit` després d’un arbre pending verificat.');
    }
    const incomplete = Object.entries(loaded.receipt.claims || {})
      .filter(([, claim]) => claim.status !== 'completed')
      .map(([operation]) => operation);
    if (incomplete.length) throw new Error(`Hi ha claims no completats: ${incomplete.join(', ')}.`);
    return finalizeReceipt(loaded);
  } finally {
    await releaseLock();
  }
}

export async function pendingTreeForReceipt(receiptPath) {
  const receipt = await validateReceiptForMutation({
    receiptPath,
    operation: 'git-commit',
    targets: [],
    checkDirty: false,
  });
  if (!receipt.pendingCommit) throw new Error('No hi ha cap arbre pending vinculat; executa primer `verify --staged`.');
  const pending = await currentPendingTree();
  if (pending.tree !== receipt.pendingCommit.tree
    || pending.diffSha256 !== receipt.pendingCommit.diffSha256
    || stagedChangesDigest(pending.stagedChanges) !== stagedChangesDigest(receipt.pendingCommit.stagedChanges || [])) {
    throw new Error('L’índex actual no coincidix byte a byte amb l’arbre pending verificat.');
  }
  const head = (await git(['rev-parse', 'HEAD'])).trim();
  if (head !== receipt.pendingCommit.headBeforeCommit) throw new Error('HEAD ha canviat després de verificar l’arbre pending.');
  return { tree: pending.tree, headBeforeCommit: head, stagedPaths: pending.stagedPaths };
}

function parseTreeEntries(raw) {
  const entries = [];
  for (const record of raw.split('\0').filter(Boolean)) {
    const match = /^([0-7]{6}) (blob|commit) ([0-9a-f]+)\t([\s\S]+)$/.exec(record);
    if (!match) throw new Error('Resposta inesperada de `git ls-tree -rz`.');
    const relative = safeIndexRelative(match[4]);
    if (!ALLOWED_INDEX_MODES.has(match[1]) || match[2] !== 'blob') {
      const kind = match[1] === '120000' ? 'symlink'
        : match[1] === '160000' ? 'gitlink/submòdul' : `${match[2]} mode ${match[1]}`;
      throw new Error(`L’arbre pending conté una entrada ${kind} no materialitzable: ${relative}`);
    }
    entries.push({ path: relative, mode: match[1], object: match[3] });
  }
  return entries;
}

async function emptyPrivateTempDestination(raw) {
  if (!raw?.trim()) throw new Error('materialize-tree exigix --destination=<directori temporal buit>.');
  const absolute = path.resolve(raw);
  const stat = await fs.lstat(absolute);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('La destinació temporal ha de ser un directori físic.');
  if ((stat.mode & 0o077) !== 0) throw new Error('La destinació temporal ha de tindre permisos privats 0700.');
  if ((await fs.readdir(absolute)).length !== 0) throw new Error('La destinació temporal ha d’estar buida.');
  const [tempReal, destinationReal] = await Promise.all([fs.realpath(os.tmpdir()), fs.realpath(absolute)]);
  if (destinationReal === tempReal || !isInside(tempReal, destinationReal)) {
    throw new Error('La destinació ha de viure dins del directori temporal local del sistema.');
  }
  return { absolute, real: destinationReal, device: String(stat.dev), inode: String(stat.ino) };
}

export async function materializePendingTree(receiptPath, destinationRaw) {
  const authorized = await pendingTreeForReceipt(receiptPath);
  const destination = await emptyPrivateTempDestination(destinationRaw);
  const entries = parseTreeEntries(await git(['ls-tree', '-rz', '--full-tree', authorized.tree]));
  let bytes = 0;
  for (const entry of entries) {
    const target = path.resolve(destination.absolute, entry.path);
    if (!isInside(destination.absolute, target)) throw new Error(`Ruta d’arbre fora del temporal: ${entry.path}`);
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const parentReal = await fs.realpath(path.dirname(target));
    if (!isInside(destination.real, parentReal)) throw new Error(`Ancestre físic fora del temporal: ${entry.path}`);
    const blob = await gitBuffer(['cat-file', 'blob', entry.object]);
    await fs.writeFile(target, blob, { flag: 'wx', mode: entry.mode === '100755' ? 0o755 : 0o644 });
    const written = await fs.lstat(target);
    if (!written.isFile() || written.isSymbolicLink() || written.nlink !== 1) {
      throw new Error(`Materialització no regular o amb hardlink: ${entry.path}`);
    }
    bytes += blob.length;
  }
  const finalStat = await fs.lstat(destination.absolute);
  if (String(finalStat.dev) !== destination.device || String(finalStat.ino) !== destination.inode) {
    throw new Error('El directori temporal ha sigut substituït durant la materialització.');
  }
  const finalPending = await pendingTreeForReceipt(receiptPath);
  if (finalPending.tree !== authorized.tree) throw new Error('L’arbre pending ha canviat durant la materialització.');
  return { tree: authorized.tree, destination: destination.real, files: entries.length, bytes };
}

export async function consumeCommitReceipt(receiptPath) {
  const releaseLock = await acquireExclusive(ACTIVE_LOCK, 'Consum Git del Reflex bloquejat');
  try {
  const loaded = await loadConsumableReceipt(receiptPath);
  const { receipt } = loaded;
  if (!receipt.operations.includes('git-commit')) {
    throw new Error('La lease activa no autoritza git-commit; post-commit no la consumirà.');
  }
  if (!receipt.pendingCommit?.tree || !receipt.pendingCommit?.headBeforeCommit) {
    throw new Error('Falta l’arbre pending o el HEAD previ verificat; rebut git no consumible.');
  }
  const commit = (await git(['rev-parse', 'HEAD'])).trim();
  const committedTree = (await git(['rev-parse', 'HEAD^{tree}'])).trim();
  if (committedTree !== receipt.pendingCommit.tree) {
    throw new Error('L’arbre del commit no coincidix amb el verificat pel pre-commit; rebut no consumit.');
  }
  const ancestry = (await git(['rev-list', '--parents', '-n', '1', commit])).trim().split(/\s+/);
  const parents = ancestry.slice(1);
  if (!parents.includes(receipt.pendingCommit.headBeforeCommit)) {
    throw new Error('El commit no descendix directament del HEAD que va verificar el pre-commit.');
  }
  receipt.commit = commit;
  receipt.commitParents = parents;
  return finalizeReceipt(loaded);
  } finally {
    await releaseLock();
  }
}

async function initReflex() {
  for (const hook of REQUIRED_HOOKS.keys()) {
    const file = path.join(PROJECT_DIR, '.husky', hook);
    const stat = await fs.lstat(file).catch(() => null);
    if (!stat || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !(stat.mode & 0o111)) {
      throw new Error(`No s’activarà un hook absent o insegur: .husky/${hook}`);
    }
  }
  await ensureState();
  await git(['config', 'core.hooksPath', '.husky']);
  return { ok: true, hooksPath: '.husky', state: REFLEX_STATE_RELATIVE };
}

async function doctor({ ci = false } = {}) {
  const findings = [];
  const durablePaths = new Set();
  const rootAgents = path.join(PROJECT_DIR, 'AGENTS.md');
  const rootStat = await fs.lstat(rootAgents).catch(() => null);
  if (!rootStat) findings.push('Falta AGENTS.md a l’arrel; l’autodescobriment no està garantit.');
  else if (!rootStat.isFile() || rootStat.isSymbolicLink()) findings.push('AGENTS.md ha de ser un fitxer regular, no un symlink.');
  if (!ci) {
    const hooksPath = (await git(['config', '--get', 'core.hooksPath'], { allowFailure: true })).trim();
    if (hooksPath !== '.husky') findings.push(`core.hooksPath=${hooksPath || '(buit)'}; s’esperava .husky.`);
  }
  for (const [hook, markers] of REQUIRED_HOOKS) {
    const file = path.join(PROJECT_DIR, '.husky', hook);
    const stat = await fs.lstat(file).catch(() => null);
    if (!stat) findings.push(`Falta .husky/${hook}.`);
    else if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
      findings.push(`.husky/${hook} ha de ser un fitxer regular únic, no symlink/hardlink.`);
    } else {
      if (!(stat.mode & 0o111)) findings.push(`.husky/${hook} no és executable.`);
      const content = await fs.readFile(file, 'utf8');
      for (const marker of markers) {
        if (!marker.test(content)) findings.push(`.husky/${hook} no conté el marcador semàntic ${marker}.`);
      }
    }
  }
  const closure = await criticalDependencyClosure();
  findings.push(...closure.findings);
  closure.paths.forEach((relative) => durablePaths.add(relative));
  const tracked = new Set((await git(['ls-files', '-z'])).split('\0').filter(Boolean).map(posix));
  const untrackedCritical = closure.paths.filter((relative) => !tracked.has(relative));
  if (untrackedCritical.length) {
    findings.push(`${untrackedCritical.length} fitxer(s) crític(s) no versionat(s) per Git: ${untrackedCritical.slice(0, 12).join(', ')}${untrackedCritical.length > 12 ? ', …' : ''}.`);
  }
  if (!ci) {
    try {
      await assertStateLayout({ requireSecret: true });
      const secret = (await fs.readFile(SECRET_FILE, 'utf8')).trim();
      if (!/^[a-f0-9]{64}$/.test(secret)) findings.push('La clau local del Reflex no té 32 bytes hexadecimals.');
    } catch (error) {
      findings.push(`Estat local del Reflex insegur o absent: ${error.message}`);
    }
  }
  try {
    await loadRules();
  } catch (error) {
    findings.push(`Regles no carregables: ${error.message}`);
  }
  try {
    const verification = await verifyWikiBaselineLock();
    findings.push(...verification.findings.map((finding) => `Contracte del graf/corpus: ${finding}.`));
    const corpusPaths = [...verification.files, GRAPH_CONFIG_RELATIVE];
    corpusPaths.forEach((relative) => durablePaths.add(relative));
    const untrackedCorpus = corpusPaths.filter((relative) => !tracked.has(relative));
    if (untrackedCorpus.length) {
      findings.push(`${untrackedCorpus.length} fitxer(s) del corpus estable no versionat(s): ${untrackedCorpus.slice(0, 10).join(', ')}${untrackedCorpus.length > 10 ? ', …' : ''}.`);
    }
  } catch (error) {
    findings.push(`Baseline de Wiki no verificable: ${error.message}`);
  }
  if (durablePaths.size) {
    const status = await git(['status', '--porcelain=v1', '-z', '--', ...durablePaths]);
    if (status) findings.push('Hi ha canvis durables pendents en regles, codi de control o corpus; `doctor` no certifica bytes fora de HEAD.');
  }
  return { ok: findings.length === 0, findings };
}

function parseCli(argv) {
  const [command = 'doctor', ...rest] = argv;
  const options = { command, scopes: [], operations: [], json: false, staged: false };
  for (const arg of rest) {
    if (arg === '--') continue;
    if (arg === '--json') options.json = true;
    else if (arg === '--staged') options.staged = true;
    else if (arg === '--ci') options.ci = true;
    else if (arg.startsWith('--intent=')) options.intent = arg.slice(9);
    else if (arg.startsWith('--risk=')) options.risk = arg.slice(7);
    else if (arg.startsWith('--scope=')) options.scopes.push(arg.slice(8));
    else if (arg.startsWith('--operation=')) options.operations.push(arg.slice(12));
    else if (arg.startsWith('--session=')) options.sessionId = arg.slice(10);
    else if (arg.startsWith('--nonce=')) options.nonce = arg.slice(8);
    else if (arg.startsWith('--petorreta=')) options.petorretaPath = path.resolve(arg.slice(12));
    else if (arg.startsWith('--manifest=')) options.manifestPath = path.resolve(arg.slice(11));
    else if (arg.startsWith('--receipt=')) options.receiptPath = path.resolve(arg.slice(10));
    else if (arg.startsWith('--destination=')) options.destination = path.resolve(arg.slice(14));
    else throw new Error(`Argument desconegut: ${arg}`);
  }
  return options;
}

function printRules(opened) {
  console.log(`\n🧠 REFLEX OBERT — sessió ${opened.session.sessionId}`);
  for (const rule of opened.ruleTexts) {
    console.log(`\n===== REGLA ${rule.path} · SHA-256 ${rule.sha256} =====\n`);
    console.log(rule.content);
  }
  console.log('\n===== FI DE LES REGLES =====');
  console.log(`Reflex-Session: ${opened.session.sessionId}`);
  console.log(`Intent-SHA256: ${opened.session.intentSha256}`);
  console.log(`Rules-SHA256: ${opened.session.rulesDigest}`);
  console.log(`NONCE D'UN SOL ÚS: ${opened.nonce}`);
  console.log(`BOOTSTRAP ESPERAT: ${path.join(PROJECT_DIR, opened.session.bootstrap.path)}`);
  console.log(`REBUT: ${sessionPath(opened.session.sessionId)}`);
}

async function main() {
  const options = parseCli(process.argv.slice(2));
  let result;
  if (options.command === 'open') result = await openReflex(options);
  else if (options.command === 'seal') result = await sealReflex(options);
  else if (options.command === 'verify') {
    if (options.operations.length !== 1 || !options.operations[0]?.trim()) {
      throw new Error('verify exigix exactament un --operation=<nom> explícit.');
    }
    const staged = options.staged ? await stagedIndexChanges() : [];
    result = await validateReceiptForMutation({
      receiptPath: options.receiptPath,
      operation: options.operations[0].trim(),
      targets: staged.length ? staged.map((entry) => entry.path) : options.scopes.map((scope) => path.resolve(PROJECT_DIR, scope)),
      checkDirty: !options.staged,
      stagedTargets: options.staged,
    });
    if (options.staged) result = await bindStagedTree(result, staged);
  } else if (options.command === 'consume') result = await consumeReceipt(options.receiptPath);
  else if (options.command === 'consume-commit') result = await consumeCommitReceipt(options.receiptPath);
  else if (options.command === 'pending-tree') result = await pendingTreeForReceipt(options.receiptPath);
  else if (options.command === 'materialize-tree') {
    result = await materializePendingTree(options.receiptPath, options.destination);
  }
  else if (options.command === 'init') result = await initReflex();
  else if (options.command === 'baseline') result = (await captureWikiBaseline()).summary;
  else if (options.command === 'doctor') result = await doctor({ ci: options.ci });
  else if (options.command === 'prepare') {
    if (!options.operations[0]) throw new Error('Manca --operation=<tipus>');
    result = await prepararDocument(options.operations[0], options.nonce || Date.now().toString());
  }
  else if (options.command === 'validate') {
    if (!options.petorretaPath) throw new Error('Manca --petorreta=<ruta_esborrany>');
    result = await validarDocument(options.petorretaPath);
  }
  else if (options.command === 'promote') {
    if (!options.petorretaPath) throw new Error('Manca --petorreta=<ruta_esborrany>');
    if (!options.destination) throw new Error('Manca --destination=<ruta_destinacio_relativa>');
    result = await promoureDocument(options.petorretaPath, options.destination, options.nonce);
  }
  else throw new Error(`Comanda desconeguda: ${options.command}`);

  if (options.command === 'open' && !options.json) printRules(result);
  else if (options.command === 'pending-tree' && !options.json) console.log(result.tree);
  else if (options.json) {
    const printable = options.command === 'open'
      ? { ...result, ruleTexts: result.ruleTexts.map(({ content, ...rule }) => rule) }
      : result;
    console.log(JSON.stringify(printable, null, 2));
  } else if (options.command === 'doctor') {
    console.log(result.ok ? '✅ Reflex operatiu.' : `❌ Reflex incomplet:\n- ${result.findings.join('\n- ')}`);
    if (!result.ok) process.exitCode = 1;
  } else if (options.command === 'baseline') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`✅ Reflex ${options.command}: ${result.sessionId || result.status || 'correcte'}`);
  }
  if (options.command === 'doctor' && !result.ok) process.exitCode = 1;
}

const isMain = Boolean(process.argv[1])
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((error) => {
    console.error(`❌ [REFLEX] ${error.message}`);
    process.exitCode = 1;
  });
}
