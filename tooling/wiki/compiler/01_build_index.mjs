#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { WIKI_DIR } from '../lib/project_paths.mjs';
import crypto from 'node:crypto';
import { isUtf8 } from 'node:buffer';

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓ CANÒNICA
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  // Quatre pilars operatius + dues zones de cicle de vida.
  carpetesTaxonomia: [
    '00_core_wiki',
    '01_identitat_iaia',
    '02_filosofia',
    '03_govern',
    '04_arquitectura_disseny',
    '05_skills_ia',
    '06_cultura',
    '07_plantilles',
    '08_capacitats',
    '09_skills_colmena',
    '10_metriques',
    '11_recursos_ia',
    '12_actes',
    '90_arxiu_historic',
    '04_ESCRIPTORI'
  ],
  carpetesExcluides: [
    'node_modules', '.git', '.obsidian', 'scripts', '_build', '_temp',
    '99_assets', 'assets', '.wiki-safety',
    // Jurisdiccions amb contracte propi: el schema v2 no s'hi aplica.
    '00_AGENTS_I_SKILLS_MIRROR', 'agents_actius', 'Sollutia'
  ],
  extensionsValides: ['.md'],
  buildDir: '_build',
  documentsFile: 'documents.json',
  manifestFile: 'manifest.json',
  compilerVersion: '2.1.0'
};

// ═══════════════════════════════════════════════════════════
// CONTRACTE DE FRONTMATTER V2
// ═══════════════════════════════════════════════════════════
let frontmatterToolsPromise;

function loadFrontmatterTools() {
  if (!frontmatterToolsPromise) {
    frontmatterToolsPromise = Promise.all([
      import('../lib/frontmatter.mjs'),
      import('../entropia_zero_router.mjs')
    ]);
  }
  return frontmatterToolsPromise;
}

async function parseCanonicalFrontmatter(content, context) {
  const [{ parseFrontmatter }, { validarFrontmatter }] = await loadFrontmatterTools();
  const parsed = parseFrontmatter(content);
  if (!parsed.hasFrontmatter) {
    const reason = parsed.malformed ? 'frontmatter obert però no tancat' : 'frontmatter absent';
    throw new Error(`${context}: ${reason}`);
  }
  if (parsed.errors.length) {
    throw new Error(`${context}: YAML invàlid: ${parsed.errors.join('; ')}`);
  }
  const schemaErrors = validarFrontmatter(parsed.data);
  if (schemaErrors.length) {
    throw new Error(`${context}: schema v2 invàlid: ${schemaErrors.join(' ')}`);
  }
  return { frontmatter: parsed.data, body: parsed.body };
}

// ═══════════════════════════════════════════════════════════
// EXTRACTORS DE METADATA
// ═══════════════════════════════════════════════════════════
function extractTitle(body, fileName, aliases) {
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  if (aliases.length) return aliases[0];
  return fileName
    .replace(/\.md$/i, '')
    .replace(/^\d{6}_\d{4}_[A-Z]+_/, '')
    .replaceAll('_', ' ')
    .trim();
}

function liveMarkdown(body) {
  const withoutComments = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/%%[\s\S]*?%%/g, '');
  const lines = [];
  let fence = null;
  for (const line of withoutComments.split(/(?<=\n)/)) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (!fence && marker) {
      fence = { char: marker[1][0], length: marker[1].length };
      lines.push('\n');
      continue;
    }
    if (fence) {
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
      lines.push('\n');
      continue;
    }
    lines.push(line.replace(/`+[^`\n]*`+/g, ''));
  }
  return lines.join('');
}

function cleanWikilinkTarget(raw) {
  const target = raw.trim();
  if (!target || target.startsWith('#') || target.startsWith('^')) return null;
  return target.split(/[#^]/, 1)[0].trim().replace(/\.md$/i, '') || null;
}

function extractWikilinks(body) {
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links = new Set();
  let match;
  const source = liveMarkdown(body);
  while ((match = regex.exec(source)) !== null) {
    const link = cleanWikilinkTarget(match[1]);
    if (link) links.add(link);
  }
  return Array.from(links).sort((a, b) => a.localeCompare(b, 'ca'));
}

function detectPilar(filePath, wikiRoot) {
  const relPath = path.relative(wikiRoot, filePath);
  const parts = relPath.split(path.sep);
  
  for (const pilar of CONFIG.carpetesTaxonomia) {
    if (parts[0] === pilar || parts[0].startsWith(pilar.split('_')[0])) {
      return pilar;
    }
  }
  return 'unknown';
}

function computeHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function generateID(fileName) {
  return fileName
    .replace(/\.md$/, '')
    .replace(/^\d{6}_\d{4}_[A-Z]+_/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
}

// ═══════════════════════════════════════════════════════════
// ESCÀNER
// ═══════════════════════════════════════════════════════════
async function* walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, 'ca'));
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symlink no admés durant la compilació: ${fullPath}`);
    } else if (entry.isDirectory()) {
      if (!CONFIG.carpetesExcluides.includes(entry.name)) {
        yield* walkDir(fullPath);
      }
    } else if (CONFIG.extensionsValides.includes(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

async function processFile(filePath, wikiRoot) {
  const fileName = path.basename(filePath);
  const raw = await fs.readFile(filePath);
  if (!isUtf8(raw)) throw new Error(`${filePath}: Markdown no és UTF-8 vàlid`);
  const content = raw.toString('utf8');
  const relPath = path.relative(wikiRoot, filePath).replace(/\\/g, '/');
  const { frontmatter, body } = await parseCanonicalFrontmatter(content, relPath);
  const pilar = detectPilar(filePath, wikiRoot);
  if (pilar === 'unknown') throw new Error(`${relPath}: document fora de la taxonomia 4+2`);
  const aliases = frontmatter.aliases || [];
  
  return {
    id: generateID(fileName),
    path: relPath,
    pilar,
    title: extractTitle(body, fileName, aliases),
    description: frontmatter.description,
    type: frontmatter.type,
    status: frontmatter.status,
    aliases,
    revisat: frontmatter.revisat || null,
    hash: computeHash(raw),
    size: raw.length,
    links: extractWikilinks(body)
  };
}

// ═══════════════════════════════════════════════════════════
// MANIFEST
// ═══════════════════════════════════════════════════════════
function computeGlobalHash(documents) {
  const sorted = [...documents].sort((a, b) => a.id.localeCompare(b.id, 'ca'));
  const concatenated = sorted.map(d => `${d.id}:${d.hash}`).join('|');
  return crypto.createHash('sha256').update(concatenated, 'utf8').digest('hex');
}

function buildManifest(documents, previousManifest) {
  const byPilar = {};
  const byEstat = {};
  const byType = {};
  
  for (const doc of documents) {
    byPilar[doc.pilar] = (byPilar[doc.pilar] || 0) + 1;
    byEstat[doc.status] = (byEstat[doc.status] || 0) + 1;
    byType[doc.type] = (byType[doc.type] || 0) + 1;
  }
  
  const globalHash = computeGlobalHash(documents);
  const now = new Date().toISOString();
  
  const changed = [];
  const added = [];
  const removed = [];
  
  if (previousManifest) {
    const prevDocs = new Map((previousManifest.documents || []).map(doc => [doc.id, doc]));
    const currDocs = new Map(documents.map(d => [d.id, d]));
    
    for (const [id, doc] of currDocs) {
      if (!prevDocs.has(id)) {
        added.push(id);
      } else if (prevDocs.get(id).hash !== doc.hash) {
        changed.push(id);
      }
    }
    for (const id of prevDocs.keys()) {
      if (!currDocs.has(id)) removed.push(id);
    }
  }
  
  return {
    version: CONFIG.compilerVersion,
    build_time: now,
    global_hash: globalHash,
    total_documents: documents.length,
    by_pilar: byPilar,
    by_status: byEstat,
    by_type: byType,
    changed_since_last_build: changed,
    added_since_last_build: added,
    removed_since_last_build: removed,
    documents: documents.map(d => ({ id: d.id, hash: d.hash, status: d.status, type: d.type }))
  };
}

async function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(value, null, 2), { encoding: 'utf8', flag: 'wx' });
    await fs.rename(tempPath, filePath);
  } finally {
    await fs.unlink(tempPath).catch(err => {
      if (err.code !== 'ENOENT') throw err;
    });
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const wikiArg = args.find(a => a.startsWith('--wiki='));
  const wikiRoot = path.resolve(wikiArg ? wikiArg.slice('--wiki='.length) : WIKI_DIR);
  const buildDir = path.join(wikiRoot, CONFIG.buildDir);
  const receiptArg = args.find(a => a.startsWith('--receipt='));
  if (!receiptArg) throw new Error('Falta --receipt=<lease Reflex> per a compiler-build.');
  const receiptPath = path.resolve(receiptArg.slice('--receipt='.length));
  const { claimReceiptForMutation, completeMutationClaim, validateExecutionClaim, validateReceiptForMutation } = await import('../reflex_petorreta.mjs');
  const claimToken = process.env.SDP_REFLEX_CLAIM || null;
  const leaseOptions = {
    receiptPath,
    operation: 'compiler-build',
    targets: [buildDir],
    checkDirty: true,
  };
  const verifyLease = () => claimToken
    ? validateExecutionClaim(leaseOptions, claimToken)
    : validateReceiptForMutation(leaseOptions);
  const claimLease = () => claimToken
    ? validateExecutionClaim(leaseOptions, claimToken)
    : claimReceiptForMutation(leaseOptions);
  await verifyLease();
  
  console.log(`🔨 COMPILADOR SDP v${CONFIG.compilerVersion}`);
  console.log(`📂 Wiki: ${wikiRoot}`);
  console.log(`📦 Output: ${buildDir}\n`);
  
  let previousManifest = null;
  try {
    const prevContent = await fs.readFile(path.join(buildDir, CONFIG.manifestFile), 'utf8');
    previousManifest = JSON.parse(prevContent);
    console.log(`✓ Manifest previ carregat (hash: ${previousManifest.global_hash})`);
  } catch (err) {
    if (err.code === 'ENOENT') console.log('✓ Primera build (sense manifest previ)');
    else throw new Error(`Manifest previ il·legible o invàlid: ${err.message}`);
  }
  
  const documents = [];
  let fitxersProcessats = 0;
  
  const processingErrors = [];
  for await (const filePath of walkDir(wikiRoot)) {
    try {
      const doc = await processFile(filePath, wikiRoot);
      documents.push(doc);
      fitxersProcessats++;
      if (verbose) console.log(`  ✓ ${doc.pilar}/${doc.id}`);
    } catch (err) {
      processingErrors.push(`${path.relative(wikiRoot, filePath)}: ${err.message}`);
    }
  }

  const ids = new Map();
  for (const doc of documents) {
    const previous = ids.get(doc.id);
    if (previous) processingErrors.push(`ID duplicat "${doc.id}": ${previous} i ${doc.path}`);
    else ids.set(doc.id, doc.path);
  }

  if (processingErrors.length) {
    throw new Error(`Compilació cancel·lada; no s'escriurà un índex parcial:\n- ${processingErrors.join('\n- ')}`);
  }
  
  console.log(`\n✓ ${fitxersProcessats} fitxers processats`);
  
  const manifest = buildManifest(documents, previousManifest);
  const writeClaim = await claimLease();
  await fs.mkdir(buildDir, { recursive: true });
  const documentsPath = path.join(buildDir, CONFIG.documentsFile);
  await atomicWriteJson(documentsPath, documents);
  
  const manifestPath = path.join(buildDir, CONFIG.manifestFile);
  await atomicWriteJson(manifestPath, manifest);
  if (!claimToken) {
    await completeMutationClaim({ receiptPath, operation: 'compiler-build' }, writeClaim.claimToken);
  }
  
  console.log(`\n✅ Build completada: ${documentsPath}`);
}

main().catch(err => {
  console.error(`❌ Error fatal: ${err.message}`);
  process.exit(2);
});
