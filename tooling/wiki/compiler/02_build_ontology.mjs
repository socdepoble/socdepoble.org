#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { WIKI_DIR } from '../lib/project_paths.mjs';
import crypto from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SCHEMA = require('../schema.json');

const DOCUMENT_FIELDS = Object.freeze([
  'id', 'path', 'pilar', 'title', 'description', 'type', 'status',
  'aliases', 'revisat', 'hash', 'size', 'links'
]);
const DOCUMENT_FIELD_SET = new Set(DOCUMENT_FIELDS);
const MANIFEST_FIELDS = new Set([
  'version', 'build_time', 'global_hash', 'total_documents',
  'by_pilar', 'by_status', 'by_type',
  'changed_since_last_build', 'added_since_last_build', 'removed_since_last_build',
  'documents'
]);
const MANIFEST_DOCUMENT_FIELDS = new Set(['id', 'hash', 'status', 'type']);
const ESTATS = new Set(SCHEMA.properties.status.enum);
const TIPUS = new Set(SCHEMA.properties.type.enum);
const DESCRIPTION_MIN = SCHEMA.properties.description.minLength;
const DESCRIPTION_MAX = SCHEMA.properties.description.maxLength;
const ALIASES_MAX = SCHEMA.properties.aliases.maxItems;
const ALIAS_MAX = SCHEMA.properties.aliases.items.maxLength;
const PILARS = new Set([
  '00_SER_Brain_Identitat',
  '01_SABER_Cultura_Coneixement',
  '02_ACTUAR_Maquina_Tecnica',
  '03_GOVERNAR_Normativa_Regles',
  '90_arxiu_historic',
  '04_ESCRIPTORI'
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object'
    && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function sameKeys(object, expected) {
  const keys = Object.keys(object);
  return keys.length === expected.size && keys.every(key => expected.has(key));
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateStringArray(value, context) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error(`${context} ha de ser una llista de cadenes no buides`);
  }
}

function validateDocuments(value) {
  if (!Array.isArray(value)) throw new Error('documents.json ha de contindre una llista');
  const ids = new Set();
  const paths = new Set();

  value.forEach((doc, index) => {
    const context = `documents[${index}]`;
    if (!isPlainObject(doc) || !sameKeys(doc, DOCUMENT_FIELD_SET)) {
      const keys = isPlainObject(doc) ? Object.keys(doc).join(', ') : typeof doc;
      throw new Error(`${context}: camps diferents del contracte v2: ${keys}`);
    }
    for (const field of ['id', 'path', 'pilar', 'title', 'description', 'type', 'status', 'hash']) {
      if (typeof doc[field] !== 'string' || !doc[field].trim()) {
        throw new Error(`${context}.${field} ha de ser una cadena no buida`);
      }
    }
    if (!PILARS.has(doc.pilar)) throw new Error(`${context}.pilar invàlid: ${doc.pilar}`);
    if (doc.path.split('/')[0] !== doc.pilar) {
      throw new Error(`${context}.pilar no concorda amb la ruta`);
    }
    if (!TIPUS.has(doc.type)) throw new Error(`${context}.type invàlid: ${doc.type}`);
    if (!ESTATS.has(doc.status)) throw new Error(`${context}.status invàlid: ${doc.status}`);
    if (!/^[a-z0-9_-]+$/.test(doc.id)) throw new Error(`${context}.id invàlid`);
    const descriptionLength = [...doc.description].length;
    if (descriptionLength < DESCRIPTION_MIN || descriptionLength > DESCRIPTION_MAX) {
      throw new Error(`${context}.description fora dels límits del schema`);
    }
    if (!/^[a-f0-9]{64}$/.test(doc.hash)) throw new Error(`${context}.hash no és SHA-256 complet`);
    if (!Number.isSafeInteger(doc.size) || doc.size < 0) throw new Error(`${context}.size invàlid`);
    if (path.posix.isAbsolute(doc.path) || path.posix.normalize(doc.path) !== doc.path
      || doc.path.split('/').includes('..') || !doc.path.endsWith('.md')) {
      throw new Error(`${context}.path no és una ruta Markdown relativa segura`);
    }
    validateStringArray(doc.aliases, `${context}.aliases`);
    validateStringArray(doc.links, `${context}.links`);
    if (doc.aliases.length > ALIASES_MAX
      || doc.aliases.some(alias => [...alias].length > ALIAS_MAX)
      || new Set(doc.aliases.map(normalizeKey)).size !== doc.aliases.length) {
      throw new Error(`${context}.aliases fora dels límits del schema`);
    }
    if (new Set(doc.links.map(normalizeKey)).size !== doc.links.length) {
      throw new Error(`${context}.links conté duplicats`);
    }
    if (doc.revisat !== null && !validDate(doc.revisat)) {
      throw new Error(`${context}.revisat ha de ser null o una data real`);
    }
    if (ids.has(doc.id)) throw new Error(`ID duplicat en documents.json: ${doc.id}`);
    if (paths.has(doc.path)) throw new Error(`Ruta duplicada en documents.json: ${doc.path}`);
    ids.add(doc.id);
    paths.add(doc.path);
  });
  return value;
}

function isInside(root, candidate) {
  const relativePath = path.relative(root, candidate);
  return relativePath === '' || (relativePath !== '..'
    && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath));
}

async function validateSources(wikiRoot, documents) {
  for (const doc of documents) {
    const lexicalPath = path.resolve(wikiRoot, doc.path);
    if (!isInside(wikiRoot, lexicalPath)) throw new Error(`Ruta fora de la Wiki: ${doc.path}`);
    const stat = await fs.lstat(lexicalPath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(`Font no regular o symlink: ${doc.path}`);
    }
    const realPath = await fs.realpath(lexicalPath);
    if (!isInside(wikiRoot, realPath)) throw new Error(`Font resol fora de la Wiki: ${doc.path}`);
    const raw = await fs.readFile(realPath);
    if (!isUtf8(raw)) throw new Error(`Font no UTF-8: ${doc.path}`);
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    if (raw.length !== doc.size || hash !== doc.hash) {
      throw new Error(`La font ha canviat després de construir documents.json: ${doc.path}`);
    }
  }
}

async function loadJson(filePath, label) {
  let text;
  try {
    text = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`${label} no es pot llegir: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} no és JSON vàlid: ${error.message}`);
  }
}

function countBy(documents, field) {
  const result = {};
  for (const doc of documents) result[doc[field]] = (result[doc[field]] || 0) + 1;
  return result;
}

function stableHash(documents) {
  const input = [...documents]
    .sort((a, b) => a.id.localeCompare(b.id, 'ca'))
    .map(doc => `${doc.id}:${doc.hash}`)
    .join('|');
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validateManifest(manifest, documents) {
  if (!isPlainObject(manifest) || !sameKeys(manifest, MANIFEST_FIELDS)) {
    throw new Error('manifest.json conté camps no admesos o en falten');
  }
  if (manifest.version !== '2.1.0') throw new Error(`Versió de manifest no admesa: ${manifest.version}`);
  if (!Number.isSafeInteger(manifest.total_documents)
    || manifest.total_documents !== documents.length) {
    throw new Error('manifest.json no concorda amb el nombre de documents');
  }
  if (manifest.global_hash !== stableHash(documents)) {
    throw new Error('manifest.json no concorda amb els hashes de documents.json');
  }
  const expectedIndexes = {
    by_pilar: countBy(documents, 'pilar'),
    by_status: countBy(documents, 'status'),
    by_type: countBy(documents, 'type')
  };
  for (const [key, expected] of Object.entries(expectedIndexes)) {
    if (!sameJson(manifest[key], expected)) throw new Error(`Índex ${key} incoherent al manifest`);
  }
  if (!Array.isArray(manifest.documents) || manifest.documents.length !== documents.length) {
    throw new Error('Resum de documents incoherent al manifest');
  }
  const summaries = new Map();
  for (const entry of manifest.documents) {
    if (!isPlainObject(entry) || !sameKeys(entry, MANIFEST_DOCUMENT_FIELDS)) {
      throw new Error('Entrada de document invàlida al manifest');
    }
    if (summaries.has(entry.id)) throw new Error(`ID duplicat al manifest: ${entry.id}`);
    summaries.set(entry.id, entry);
  }
  for (const doc of documents) {
    const entry = summaries.get(doc.id);
    if (!entry || entry.hash !== doc.hash || entry.status !== doc.status || entry.type !== doc.type) {
      throw new Error(`El manifest no concorda amb el document: ${doc.id}`);
    }
  }
  return manifest;
}

function normalizeKey(value) {
  return String(value).normalize('NFC').toLocaleLowerCase('ca');
}

function withoutMarkdownExtension(value) {
  return value.replace(/\.md$/i, '');
}

function addLookup(map, key, id) {
  const normalized = normalizeKey(key);
  if (!normalized) return;
  if (!map.has(normalized)) map.set(normalized, new Set());
  map.get(normalized).add(id);
}

function lookup(map, key, label, fromDoc) {
  const ids = map.get(normalizeKey(key));
  if (!ids) return { found: false };
  if (ids.size > 1) {
    return {
      found: true,
      error: `Referència ambigua "${label}" en ${fromDoc.path}: ${[...ids].join(', ')}`
    };
  }
  return { found: true, id: ids.values().next().value };
}

function targetPathCandidates(target, fromDoc) {
  const normalized = withoutMarkdownExtension(target.replaceAll('\\', '/'));
  const fromDirectory = path.posix.dirname(fromDoc.path);
  const candidates = [];
  if (normalized.startsWith('/')) {
    candidates.push(normalized.slice(1));
  } else if (normalized.startsWith('.') || normalized.includes('/')) {
    candidates.push(path.posix.normalize(normalized));
    candidates.push(path.posix.normalize(path.posix.join(fromDirectory, normalized)));
  } else {
    candidates.push(path.posix.join(fromDirectory, normalized));
  }
  return [...new Set(candidates.filter(candidate => candidate && candidate !== '..'
    && !candidate.startsWith('../') && !path.posix.isAbsolute(candidate)))];
}

function buildGraph(documents) {
  const nodes = new Map(documents.map(doc => [doc.id, doc]));
  const linksToSets = new Map(documents.map(doc => [doc.id, new Set()]));
  const linkedFromSets = new Map(documents.map(doc => [doc.id, new Set()]));
  const byID = new Map();
  const byPath = new Map();
  const byBasename = new Map();
  const byLabel = new Map();

  for (const doc of documents) {
    addLookup(byID, doc.id, doc.id);
    const pathWithoutExtension = withoutMarkdownExtension(doc.path);
    addLookup(byPath, pathWithoutExtension, doc.id);
    addLookup(byBasename, path.posix.basename(pathWithoutExtension), doc.id);
    addLookup(byLabel, doc.title, doc.id);
    for (const alias of doc.aliases) addLookup(byLabel, alias, doc.id);
  }

  const errors = [];
  for (const [kind, index] of [['ID', byID], ['ruta', byPath]]) {
    for (const [key, ids] of index) {
      if (ids.size > 1) errors.push(`${kind} ambigu per normalització "${key}": ${[...ids].join(', ')}`);
    }
  }

  function resolveTarget(target, fromDoc) {
    const idMatch = lookup(byID, target, target, fromDoc);
    if (idMatch.found) return idMatch;

    for (const candidate of targetPathCandidates(target, fromDoc)) {
      const pathMatch = lookup(byPath, candidate, target, fromDoc);
      if (pathMatch.found) return pathMatch;
    }

    const base = path.posix.basename(withoutMarkdownExtension(target.replaceAll('\\', '/')));
    const basenameMatch = lookup(byBasename, base, target, fromDoc);
    if (basenameMatch.found) return basenameMatch;

    const labelMatch = lookup(byLabel, target, target, fromDoc);
    if (labelMatch.found) return labelMatch;
    return { found: false, error: `Referència trencada "${target}" en ${fromDoc.path}` };
  }

  for (const doc of documents) {
    for (const target of doc.links) {
      const resolved = resolveTarget(target, doc);
      if (resolved.error) {
        errors.push(resolved.error);
        continue;
      }
      linksToSets.get(doc.id).add(resolved.id);
      linkedFromSets.get(resolved.id).add(doc.id);
    }
  }

  const links_to = new Map();
  const linked_from = new Map();
  for (const id of nodes.keys()) {
    links_to.set(id, [...linksToSets.get(id)].sort((a, b) => a.localeCompare(b, 'ca')));
    linked_from.set(id, [...linkedFromSets.get(id)].sort((a, b) => a.localeCompare(b, 'ca')));
  }
  return { nodes, edges: { links_to, linked_from }, errors };
}

function detectOrphans(graph) {
  const orphans = [];
  for (const id of graph.nodes.keys()) {
    if (graph.edges.links_to.get(id).length === 0 && graph.edges.linked_from.get(id).length === 0) {
      orphans.push(id);
    }
  }
  return orphans.sort((a, b) => a.localeCompare(b, 'ca'));
}

function buildInverseIndexes(graph) {
  const indexes = { by_pilar: {}, by_status: {}, by_type: {} };
  for (const [id, doc] of graph.nodes) {
    for (const [indexName, field] of [
      ['by_pilar', 'pilar'],
      ['by_status', 'status'],
      ['by_type', 'type']
    ]) {
      if (!indexes[indexName][doc[field]]) indexes[indexName][doc[field]] = [];
      indexes[indexName][doc[field]].push(id);
    }
  }
  for (const index of Object.values(indexes)) {
    for (const ids of Object.values(index)) ids.sort((a, b) => a.localeCompare(b, 'ca'));
  }
  return indexes;
}

function objectFromMap(map) {
  return Object.fromEntries(map.entries());
}

function buildMeta(manifest) {
  return {
    compiler_version: manifest.version,
    build_time: manifest.build_time,
    global_hash: manifest.global_hash,
    total_documents: manifest.total_documents
  };
}

async function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.tmp-${process.pid}`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(value, null, 2), { encoding: 'utf8', flag: 'wx' });
    await fs.rename(tempPath, filePath);
  } finally {
    await fs.unlink(tempPath).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const wikiArg = args.find(argument => argument.startsWith('--wiki='));
  const requestedRoot = path.resolve(
    wikiArg ? wikiArg.slice('--wiki='.length) : WIKI_DIR
  );
  const wikiRoot = await fs.realpath(requestedRoot);
  const buildDir = path.join(wikiRoot, '_build');
  const receiptArg = args.find(argument => argument.startsWith('--receipt='));
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

  console.log('🕸️  COMPILADOR D\'ONTOLOGIA v2.1.0');
  console.log(`📂 Wiki: ${wikiRoot}\n`);

  const documents = validateDocuments(await loadJson(
    path.join(buildDir, 'documents.json'),
    'documents.json'
  ));
  await validateSources(wikiRoot, documents);
  const manifest = validateManifest(await loadJson(
    path.join(buildDir, 'manifest.json'),
    'manifest.json'
  ), documents);
  console.log(`✓ ${documents.length} documents validats`);

  const graph = buildGraph(documents);
  if (graph.errors.length) {
    throw new Error(`Graf invàlid; no s'escriuran artefactes:\n- ${graph.errors.join('\n- ')}`);
  }
  const indexes = buildInverseIndexes(graph);
  const orphans = detectOrphans(graph);
  const nodes = objectFromMap(graph.nodes);
  const edges = {
    links_to: objectFromMap(graph.edges.links_to),
    linked_from: objectFromMap(graph.edges.linked_from)
  };
  const meta = buildMeta(manifest);

  const ontology = { _meta: meta, nodes, edges, indexes, orphans };
  const knowledge = { _meta: meta, nodes, edges, indexes };
  const ontologyPath = path.join(buildDir, 'ontology.json');
  const knowledgePath = path.join(buildDir, 'knowledge.json');
  const writeClaim = await claimLease();
  await atomicWriteJson(ontologyPath, ontology);
  await atomicWriteJson(knowledgePath, knowledge);
  if (!claimToken) {
    await completeMutationClaim({ receiptPath, operation: 'compiler-build' }, writeClaim.claimToken);
  }

  const edgeCount = [...graph.edges.links_to.values()].reduce((sum, links) => sum + links.length, 0);
  console.log(`✓ ${edgeCount} arestes de wikilink resoltes`);
  console.log(`ℹ️ ${orphans.length} document(s) sense arestes`);
  console.log(`✅ Ontologia: ${ontologyPath}`);
  console.log(`✅ Coneixement: ${knowledgePath}`);
}

main().catch(error => {
  console.error(`❌ Error fatal: ${error.message}`);
  process.exitCode = 2;
});
