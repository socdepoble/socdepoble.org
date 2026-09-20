/**
 * autoneteja_wiki.mjs — auditoria i migració reversible de la Wiki.
 *
 * GARANTIES:
 * - Sense flags d'aplicació és un dry-run real: zero escriptures.
 * - Una migració de frontmatter conserva el cos byte a byte.
 * - Cap orfe amb contingut es mou automàticament.
 * - Només es poden quarantinar buits semàntics amb grau zero.
 * - Tota mutació exigix rebut del Reflex, backup, manifest i rollback.
 * - Qualsevol error és fail-closed (exit diferent de zero).
 *
 * Ús:
 *   node autoneteja_wiki.mjs [--json] [--strict]
 *   node autoneteja_wiki.mjs --apply-frontmatter --ack-schema-cutover \
 *     --receipt=/ruta/rebut.json
 *   node autoneteja_wiki.mjs --quarantine-empty --receipt=/ruta/rebut.json
 *   node autoneteja_wiki.mjs --restore=/ruta/manifest.json \
 *     --receipt=/ruta/rebut.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import {
  parseFrontmatter,
  serializeFrontmatter,
} from '../lib/frontmatter.mjs';
import { discoverMarkdown, zoneOf, runId, treeDigest, treeDigestEntries, isMutableZone } from './corpus_snapshot.mjs';
import { buildGraph, validateCanonical, canonicalFrontmatter, sourceShapeErrors, contentClassification } from './parse.mjs';
import { assertUnchanged, requireReceipt, atomicWrite, writeManifest, acquireMutationLock, assertSchemaCutoverReady, safetyDirFor, writeNewFile, completeReceiptClaim } from './mutation_kernel.mjs';
import {
  TOOLING_WIKI_DIR,
  WIKI_DIR,
} from '../lib/project_paths.mjs';

const SCRIPT_DIR = TOOLING_WIKI_DIR;
export const DEFAULT_WIKI_DIR = WIKI_DIR;
const _metaUrl = import.meta.url.startsWith('file:') ? import.meta.url : 'file://' + import.meta.url;
const SCHEMA_TEXT = await fs.readFile(new URL('../schema.json', _metaUrl), 'utf8');
const SCHEMA = JSON.parse(SCHEMA_TEXT);
const FIELD_ORDER = ['estat', 'tipus', 'description', 'aliases', 'revisat'];
const ALLOWED_FIELDS = new Set(Object.keys(SCHEMA.properties));
const KNOWN_LEGACY_FIELDS = new Set([
  'name', 'descripcio', 'resum', 'autor', 'authority', 'categoria', 'tags',
  'created_at', 'updated_at', 'version', 'script', 'replaces', 'depends_on',
  'jurisdiccio', 'pilar', 'mode',
]);
const MANUAL_LEGACY_FIELDS = new Set([
  'tags', 'script', 'replaces', 'depends_on', 'jurisdiccio', 'mode',
]);


const posix = (value) => value.split(path.sep).join('/');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const SCHEMA_SHA256 = sha256(SCHEMA_TEXT);
const emptyValue = (value) => value === undefined || value === null || value === ''
  || (Array.isArray(value) && value.length === 0);
const valueFingerprint = (value) => ({
  type: Array.isArray(value) ? 'array' : typeof value,
  items: Array.isArray(value) ? value.length : undefined,
  sha256: sha256(JSON.stringify(value)),
});
const isInside = (root, candidate) => {
  const rel = path.relative(root, candidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

export async function readGraphConfig(root) {
  try {
    const config = JSON.parse(await fs.readFile(path.join(root, '.obsidian', 'graph.json'), 'utf8'));
    return {
      present: true,
      search: config.search ?? '',
      showOrphans: config.showOrphans ?? null,
      hideUnresolved: config.hideUnresolved ?? null,
      showAttachments: config.showAttachments ?? null,
      colorGroups: Array.isArray(config.colorGroups) ? config.colorGroups.length : 0,
    };
  } catch (error) {
    return { present: false, error: error.message };
  }
}

export async function auditWiki(wikiDir = DEFAULT_WIKI_DIR, options = {}) {
  const { includeMirrors = false, includeLifecycle = false } = options;
  const mutationPolicy = { includeMirrors, includeLifecycle };
  const { root, docs, skippedSymlinks } = await discoverMarkdown(wikiDir);
  const baselineDigest = treeDigest(docs);
  const graph = buildGraph(docs);
  const operationalDocs = docs.filter((doc) => doc.zone === 'operatiu');
  const operationalGraph = buildGraph(operationalDocs, docs);
  const zones = {};
  const keys = new Map();
  const absentFrontmatter = [];
  const malformedFrontmatter = [];
  const yamlErrors = [];
  const canonicalViolations = [];
  const unknownFields = [];
  const unmappedFields = [];
  const unsafeSourceFields = [];
  const physicalEmpty = [];
  const semanticEmpty = [];
  const placeholders = [];
  const titleOnly = [];
  const controlChars = [];
  const frontmatterActions = [];

  for (const doc of docs) {
    zones[doc.zone] = (zones[doc.zone] || 0) + 1;
    const schemaManaged = doc.zone !== 'mirall' && doc.zone !== 'vendor';
    const parsed = parseFrontmatter(doc.content);
    for (const key of Object.keys(parsed.data)) keys.set(key, (keys.get(key) || 0) + 1);
    if (schemaManaged && !parsed.hasFrontmatter) absentFrontmatter.push(doc.relPath);
    if (parsed.malformed) malformedFrontmatter.push(doc.relPath);
    if (parsed.errors.length) yamlErrors.push({ file: doc.relPath, errors: parsed.errors });
    const unknown = schemaManaged ? Object.keys(parsed.data).filter((key) => !ALLOWED_FIELDS.has(key)) : [];
    if (unknown.length) unknownFields.push({ file: doc.relPath, fields: unknown });
    const unmapped = unknown.filter((key) => (!KNOWN_LEGACY_FIELDS.has(key) || MANUAL_LEGACY_FIELDS.has(key))
      && !emptyValue(parsed.data[key]));
    if (unmapped.length) unmappedFields.push({ file: doc.relPath, fields: unmapped });
    const sourceErrors = schemaManaged ? sourceShapeErrors(parsed.data, doc) : [];
    if (sourceErrors.length) unsafeSourceFields.push({ file: doc.relPath, errors: sourceErrors });

    const classification = contentClassification(doc, parsed);
    if (classification.physicalEmpty) physicalEmpty.push(doc.relPath);
    if (classification.semanticEmpty) semanticEmpty.push(doc.relPath);
    if (classification.placeholder) placeholders.push(doc.relPath);
    if (classification.titleOnly) titleOnly.push(doc.relPath);
    if (classification.controlChars) controlChars.push(doc.relPath);

    if (schemaManaged && !parsed.malformed && parsed.errors.length === 0 && !classification.controlChars
      && unmapped.length === 0 && sourceErrors.length === 0) {
      const currentValidation = validateCanonical(parsed.data);
      if (currentValidation.length) canonicalViolations.push({ file: doc.relPath, errors: currentValidation });
      const canonical = canonicalFrontmatter(doc, parsed);
      const validation = validateCanonical(canonical);
      if (validation.length) {
        canonicalViolations.push({ file: doc.relPath, errors: validation.map((error) => `proposta: ${error}`) });
        continue;
      }
      const mergedCanonical = { ...parsed.data, ...canonical };
      const newContent = serializeFrontmatter(mergedCanonical, FIELD_ORDER) + parsed.body;
      if (newContent !== doc.content && isMutableZone(doc.zone, mutationPolicy)) {
        frontmatterActions.push({
          action: 'rewrite-frontmatter',
          file: doc.relPath,
          beforeSha256: doc.sha256,
          afterSha256: sha256(newContent),
          bodySha256: sha256(parsed.body),
          removedFields: unknown,
          removedValues: Object.fromEntries(unknown
            .filter((key) => !emptyValue(parsed.data[key]))
            .map((key) => [key, valueFingerprint(parsed.data[key])])),
          canonical: mergedCanonical,
          content: newContent,
        });
      }
    }
  }

  const quarantineCandidates = physicalEmpty
    .filter((file) => graph.degree.get(file) === 0)
    .filter((file) => {
      const doc = docs.find((candidate) => candidate.relPath === file);
      return doc && isMutableZone(doc.zone, mutationPolicy);
    });
  const linkedEmpty = semanticEmpty.filter((file) => graph.degree.get(file) > 0);
  const visibleQuarantines = docs
    .filter((doc) => doc.zone === 'quarantena_visible')
    .map((doc) => doc.relPath);
  const zoneByFile = new Map(docs.map((doc) => [doc.relPath, doc.zone]));
  const mutationBlockers = [
    ...malformedFrontmatter.map((file) => ({ file, reason: 'frontmatter-malformat' })),
    ...yamlErrors.map((item) => ({ file: item.file, reason: 'yaml-invalid' })),
    ...controlChars.map((file) => ({ file, reason: 'control-char' })),
    ...unmappedFields.map((item) => ({ file: item.file, reason: `unmapped-fields:${item.fields.join(',')}` })),
    ...unsafeSourceFields.map((item) => ({ file: item.file, reason: `unsafe-source:${item.errors.join(',')}` })),
    ...skippedSymlinks.map((file) => ({ file, reason: 'symlink' })),
  ].filter((item) => isMutableZone(zoneByFile.get(item.file) || zoneOf(item.file), mutationPolicy));

  const p0 = malformedFrontmatter.length + yamlErrors.length + controlChars.length + skippedSymlinks.length;
  const schemaDriftFiles = new Set([
    ...absentFrontmatter,
    ...unknownFields.map((item) => item.file),
    ...canonicalViolations.map((item) => item.file),
    ...unsafeSourceFields.map((item) => item.file),
    ...frontmatterActions.map((item) => item.file),
  ]);
  const schemaDrift = schemaDriftFiles.size;
  const operationalSet = new Set(operationalDocs.map((doc) => doc.relPath));
  const inOperational = (file) => operationalSet.has(typeof file === 'string' ? file : file.file);
  const operationalPlaceholders = placeholders.filter(inOperational);
  const operationalTitleOnly = titleOnly.filter(inOperational);
  const operationalP0 = malformedFrontmatter.filter(inOperational).length
    + yamlErrors.filter(inOperational).length
    + controlChars.filter(inOperational).length
    + skippedSymlinks.filter((file) => zoneOf(file) === 'operatiu').length;
  const operationalP1 = semanticEmpty.filter(inOperational).length
    + operationalPlaceholders.length + operationalTitleOnly.length
    + operationalGraph.orphans.length
    + operationalGraph.unresolved.length + operationalGraph.ambiguous.length;
  // Les zones de cicle de vida, miralls i vendor poden contindre nodes
  // informatius aïllats. En canvi, un orfe/placeholder/títol-sol dins del nucli
  // operatiu és una fallada dura i ha de fer fallar també `--strict`.
  const p1 = semanticEmpty.length + graph.unresolved.length + graph.ambiguous.length
    + visibleQuarantines.length + operationalPlaceholders.length
    + operationalTitleOnly.length + operationalGraph.orphans.length;
  const health = p0 > 0 ? 'critic' : p1 > 0 ? 'degradat' : schemaDrift > 0 ? 'a_madurar' : 'saludable';
  const operationalDrift = new Set([...schemaDriftFiles].filter((file) => operationalSet.has(file))).size;
  const operationalHealth = operationalP0 > 0 ? 'critic'
    : operationalP1 > 0 ? 'degradat'
      : operationalDrift > 0 ? 'a_madurar' : 'saludable';
  const obsidian = await readGraphConfig(root);
  const zoneByPath = new Map(docs.map((doc) => [doc.relPath, doc.zone]));
  const orphanZones = Object.fromEntries([...graph.orphans.reduce((counts, file) => {
    const zone = zoneByPath.get(file) || 'desconegut';
    counts.set(zone, (counts.get(zone) || 0) + 1);
    return counts;
  }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b, 'ca')));
  const planBasis = {
    schemaSha256: SCHEMA_SHA256,
    baselineDigest,
    baselineFiles: docs.map((doc) => ({ file: doc.relPath, sha256: doc.sha256 })),
    mutationPolicy,
    frontmatterActions: frontmatterActions.map(({ content, ...item }) => item),
    quarantineCandidates,
    mutationBlockers,
  };
  const planDigest = sha256(JSON.stringify(planBasis));

  return {
    schema: 'socdepoble.autoneteja.report.v2',
    generatedAt: new Date().toISOString(),
    root,
    health,
    ok: p0 === 0 && p1 === 0 && schemaDrift === 0,
    snapshot: {
      files: docs.length,
      bytes: docs.reduce((sum, doc) => sum + doc.bytes, 0),
      treeSha256: baselineDigest,
      zones,
    },
    frontmatter: {
      schemaFile: posix(path.relative(root, path.join(SCRIPT_DIR, 'schema.json'))),
      keys: [...keys.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count })),
      absent: absentFrontmatter,
      malformed: malformedFrontmatter,
      yamlErrors,
      canonicalViolations,
      unknownFields,
      unmappedFields,
      unsafeSourceFields,
      plannedRewrites: frontmatterActions.length,
    },
    content: { physicalEmpty, semanticEmpty, linkedEmpty, placeholders, titleOnly, controlChars },
    graph: {
      ...graph.summary,
      unresolved: graph.unresolved,
      ambiguous: graph.ambiguous,
      outside: graph.outside,
      orphanFiles: graph.orphans,
      orphanZones,
      sourceOnlyFiles: graph.sourceOnly,
      duplicateBasenameGroups: graph.duplicateBasenames,
    },
    operational: {
      health: operationalHealth,
      ok: operationalP0 === 0 && operationalP1 === 0 && operationalDrift === 0,
      documents: operationalDocs.length,
      frontmatterDrift: operationalDrift,
      semanticEmpty: semanticEmpty.filter(inOperational),
      placeholders: operationalPlaceholders,
      titleOnly: operationalTitleOnly,
      graph: {
        ...operationalGraph.summary,
        unresolved: operationalGraph.unresolved,
        ambiguous: operationalGraph.ambiguous,
        outsideScope: operationalGraph.outsideScope,
        orphanFiles: operationalGraph.orphans,
        sourceOnlyFiles: operationalGraph.sourceOnly,
        duplicateBasenameGroups: operationalGraph.duplicateBasenames,
      },
    },
    obsidian,
    safety: {
      skippedSymlinks,
      visibleQuarantines,
      quarantineCandidates,
      mutationBlockers,
      note: 'Un orfe amb contingut mai és candidat automàtic.',
    },
    plan: { ...planBasis, planDigest, frontmatterActions },
  };
}

export function planBasisFromReport(report) {
  const plan = report?.plan;
  if (!plan || !Array.isArray(plan.baselineFiles) || !Array.isArray(plan.frontmatterActions)
    || !Array.isArray(plan.quarantineCandidates) || !Array.isArray(plan.mutationBlockers)) {
    throw new Error('Pla d’autoneteja incomplet o amb estructura invàlida.');
  }
  return {
    schemaSha256: plan.schemaSha256,
    baselineDigest: plan.baselineDigest,
    baselineFiles: plan.baselineFiles,
    mutationPolicy: plan.mutationPolicy,
    frontmatterActions: plan.frontmatterActions.map(({ content, ...item }) => item),
    quarantineCandidates: plan.quarantineCandidates,
    mutationBlockers: plan.mutationBlockers,
  };
}

export function assertAuditPlanIntegrity(report) {
  if (report?.schema !== 'socdepoble.autoneteja.report.v2') {
    throw new Error('Informe d’autoneteja desconegut.');
  }
  const basis = planBasisFromReport(report);
  if (basis.schemaSha256 !== SCHEMA_SHA256) {
    throw new Error('Pla caducat: no està vinculat al schema.json actual.');
  }
  if (report.snapshot?.treeSha256 !== basis.baselineDigest
    || treeDigestEntries(basis.baselineFiles) !== basis.baselineDigest) {
    throw new Error('Pla manipulat: el digest de baseline no concorda amb els fitxers.');
  }
  if (JSON.stringify(report.safety?.mutationBlockers) !== JSON.stringify(basis.mutationBlockers)) {
    throw new Error('Pla manipulat: els bloquejos no concorden amb l’auditoria.');
  }

  const baseline = new Map();
  for (const item of basis.baselineFiles) {
    if (typeof item?.file !== 'string' || !/^[a-f0-9]{64}$/.test(item?.sha256 || '')
      || baseline.has(item.file)) {
      throw new Error('Pla manipulat: baseline amb ruta/hash invàlid o duplicat.');
    }
    baseline.set(item.file, item.sha256);
  }
  const actionFiles = new Set();
  for (const action of report.plan.frontmatterActions) {
    if (action?.action !== 'rewrite-frontmatter' || typeof action.file !== 'string'
      || typeof action.content !== 'string' || actionFiles.has(action.file)) {
      throw new Error('Pla manipulat: acció de frontmatter invàlida o duplicada.');
    }
    actionFiles.add(action.file);
    if (baseline.get(action.file) !== action.beforeSha256) {
      throw new Error(`Pla manipulat: beforeSha256 no concorda per ${action.file}.`);
    }
    if (sha256(action.content) !== action.afterSha256) {
      throw new Error(`Pla manipulat: afterSha256 no concorda amb el contingut de ${action.file}.`);
    }
  }
  const quarantine = new Set();
  for (const file of basis.quarantineCandidates) {
    if (typeof file !== 'string' || !baseline.has(file) || quarantine.has(file)) {
      throw new Error('Pla manipulat: candidat de quarantena invàlid o duplicat.');
    }
    quarantine.add(file);
  }
  const expectedDigest = sha256(JSON.stringify(basis));
  if (expectedDigest !== report.plan.planDigest) {
    throw new Error('Pla manipulat: planDigest no concorda amb accions, bloquejos i schema.');
  }
  return expectedDigest;
}

export async function applyAuditPlan(report, options = {}) {
  const {
    applyFrontmatter = false, quarantineEmpty = false, ackSchemaCutover = false,
    ackLegacyLoss = false, receiptPath,
  } = options;
  if (!applyFrontmatter && !quarantineEmpty) return { applied: false, reason: 'sense-accions' };
  assertAuditPlanIntegrity(report);
  if (applyFrontmatter && !ackSchemaCutover) {
    throw new Error('Falta --ack-schema-cutover: abans cal adaptar compilador, plantilles i validators legacy.');
  }
  if (applyFrontmatter) await assertSchemaCutoverReady();
  const actionsWithLegacyLoss = report.plan.frontmatterActions
    .filter((action) => Object.keys(action.removedValues || {}).length > 0);
  if (applyFrontmatter && actionsWithLegacyLoss.length > 0 && !ackLegacyLoss) {
    throw new Error(`${actionsWithLegacyLoss.length} nota(es) perdrien valors legacy; revisa el ledger i usa --ack-legacy-loss.`);
  }
  const policy = report.plan.mutationPolicy || { includeMirrors: false, includeLifecycle: false };
  if (Boolean(options.includeMirrors) !== Boolean(policy.includeMirrors)
    || Boolean(options.includeLifecycle) !== Boolean(policy.includeLifecycle)) {
    throw new Error('La política de zones no coincidix amb la usada per generar el pla; torna a auditar.');
  }
  if (report.safety.mutationBlockers.length) {
    throw new Error(`Pla bloquejat per ${report.safety.mutationBlockers.length} troballa(es) P0 en zones mutables.`);
  }
  const defaultRoot = await fs.realpath(DEFAULT_WIKI_DIR);
  if (await fs.realpath(report.root) !== defaultRoot) {
    throw new Error('Una arrel --wiki alternativa només es pot auditar; les mutacions estan restringides al vault canònic.');
  }
  const claims = [];
  if (applyFrontmatter) {
    claims.push(await requireReceipt(receiptPath, 'autoneteja-frontmatter', [report.root], report.plan.planDigest));
  }
  if (quarantineEmpty) {
    claims.push(await requireReceipt(receiptPath, 'autoneteja-quarantine', [report.root], report.plan.planDigest));
  }
  const releaseLock = await acquireMutationLock(report.root);
  try {
    // El rebut autoritza un digest, no l'objecte JS rebut. Sota el lock tornem
    // a derivar el pla des dels bytes del vault i només mutem eixe informe nou.
    const fresh = await auditWiki(report.root, {
      includeMirrors: Boolean(policy.includeMirrors),
      includeLifecycle: Boolean(policy.includeLifecycle),
    });
    assertAuditPlanIntegrity(fresh);
    if (fresh.plan.planDigest !== report.plan.planDigest) {
      const error = new Error('La Wiki o el pla han canviat; rebut caducat, zero escriptures.');
      error.code = 'STALE_PLAN';
      throw error;
    }
    if (fresh.safety.mutationBlockers.length) {
      throw new Error(`Pla fresc bloquejat per ${fresh.safety.mutationBlockers.length} troballa(es) en zones mutables.`);
    }
    const result = await applyAuditPlanLocked(fresh, options);
    for (const claim of claims) await completeReceiptClaim(claim);
    return result;
  } finally {
    await releaseLock();
  }
}

async function applyAuditPlanLocked(report, options = {}) {
  const {
    applyFrontmatter = false,
    quarantineEmpty = false,
    includeMirrors = false,
    includeLifecycle = false,
    ackLegacyLoss = false,
  } = options;
  await assertUnchanged(report.root, report.plan.baselineDigest);

  const id = runId();
  const runDir = path.join(safetyDirFor(report.root), id);
  const manifestPath = path.join(runDir, 'manifest.json');
  const quarantineSet = new Set(quarantineEmpty ? report.plan.quarantineCandidates : []);
  const rewrites = applyFrontmatter
    ? report.plan.frontmatterActions.filter((item) => !quarantineSet.has(item.file))
    : [];
  const actions = [
    ...rewrites.map((item) => ({ ...item, content: undefined })),
    ...[...quarantineSet].map((file) => {
      const doc = { file };
      return { action: 'quarantine-empty', ...doc };
    }),
  ];
  const manifest = {
    schema: 'socdepoble.autoneteja.manifest.v2',
    runId: id,
    status: 'preparing',
    createdAt: new Date().toISOString(),
    root: report.root,
    baselineTreeSha256: report.plan.baselineDigest,
    includeMirrors,
    includeLifecycle,
    ackLegacyLoss,
    actions,
  };
  const predictedFiles = new Map(report.plan.baselineFiles.map((item) => [item.file, item.sha256]));
  for (const action of actions) {
    if (action.action === 'rewrite-frontmatter') predictedFiles.set(action.file, action.afterSha256);
    else predictedFiles.delete(action.file);
  }
  manifest.predictedTreeSha256 = treeDigestEntries([...predictedFiles].map(([file, hash]) => ({ file, sha256: hash })));

  await fs.mkdir(runDir, { recursive: true });
  const applied = [];
  try {
    for (const action of actions) {
      const source = path.join(report.root, action.file);
      if (!isInside(report.root, source)) throw new Error(`Acció fora de la Wiki: ${action.file}`);
      const sourceStat = await fs.lstat(source);
      if (!sourceStat.isFile() || sourceStat.isSymbolicLink() || sourceStat.nlink !== 1) {
        throw new Error(`Target no regular, symlink o hardlink: ${action.file}`);
      }
      const originalBuffer = await fs.readFile(source);
      if (!isUtf8(originalBuffer)) throw new Error(`Markdown no UTF-8: ${action.file}`);
      const original = originalBuffer.toString('utf8');
      action.beforeSha256 ||= sha256(originalBuffer);
      action.mode = sourceStat.mode & 0o777;
      const backup = path.join(runDir, 'originals', `${action.file}.bak`);
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await writeNewFile(backup, originalBuffer, { mode: 0o600 });
      action.backup = posix(path.relative(runDir, backup));

      if (action.action === 'rewrite-frontmatter') {
        const planned = report.plan.frontmatterActions.find((item) => item.file === action.file);
        if (!planned || sha256(original) !== planned.beforeSha256) throw new Error(`Hash canviat: ${action.file}`);
        const parsedBefore = parseFrontmatter(original);
        const parsedAfter = parseFrontmatter(planned.content);
        if (parsedAfter.errors.length || parsedAfter.malformed) throw new Error(`YAML generat invàlid: ${action.file}`);
        if (sha256(parsedBefore.body) !== sha256(parsedAfter.body)) throw new Error(`El cos canviaria: ${action.file}`);
        action.afterSha256 = sha256(planned.content);
      } else {
        const parsed = parseFrontmatter(original);
        if (!/^\uFEFF?\s*$/u.test(original) || parsed.hasFrontmatter) {
          throw new Error(`Ja no és un buit físic pur: ${action.file}`);
        }
        const destination = path.join(runDir, 'quarantine', action.file);
        action.destination = posix(path.relative(runDir, destination));
      }
    }

    manifest.status = 'prepared';
    await writeManifest(manifestPath, manifest);
    await assertUnchanged(report.root, report.plan.baselineDigest);

    manifest.status = 'applying';
    await writeManifest(manifestPath, manifest);
    for (const action of actions) {
      const source = path.join(report.root, action.file);
      action.state = 'committing';
      await writeManifest(manifestPath, manifest);
      if (action.action === 'rewrite-frontmatter') {
        const planned = report.plan.frontmatterActions.find((item) => item.file === action.file);
        if (sha256(await fs.readFile(source)) !== action.beforeSha256) throw new Error(`Canvi concurrent: ${action.file}`);
        await atomicWrite(source, planned.content, { mode: action.mode });
      } else {
        const destination = path.join(runDir, action.destination);
        if (sha256(await fs.readFile(source)) !== action.beforeSha256) throw new Error(`Canvi concurrent: ${action.file}`);
        if (await fs.lstat(destination).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error))) {
          throw new Error(`La quarantena ja existix: ${action.file}`);
        }
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.rename(source, destination);
      }
      action.state = 'applied';
      applied.push(action);
      manifest.appliedCount = applied.length;
      await writeManifest(manifestPath, manifest);
    }

    for (const action of actions) {
      const source = path.join(report.root, action.file);
      if (action.action === 'rewrite-frontmatter') {
        if (sha256(await fs.readFile(source)) !== action.afterSha256) throw new Error(`Verificació posterior fallada: ${action.file}`);
      } else {
        const destination = path.join(runDir, action.destination);
        if (await fs.lstat(source).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error))) {
          throw new Error(`Quarantena incompleta: ${action.file}`);
        }
        if (sha256(await fs.readFile(destination)) !== action.beforeSha256) throw new Error(`Hash de quarantena incorrecte: ${action.file}`);
      }
    }
    manifest.status = 'applied';
    manifest.appliedAt = new Date().toISOString();
    const post = await discoverMarkdown(report.root);
    manifest.observedTreeSha256 = treeDigest(post.docs);
    if (manifest.observedTreeSha256 !== manifest.predictedTreeSha256) {
      throw new Error('El digest final no coincidix amb el pla; s’activa rollback.');
    }
    await writeManifest(manifestPath, manifest);
    return { applied: true, runId: id, manifestPath, actions: actions.length };
  } catch (error) {
    let rollbackError = null;
    for (const action of [...applied].reverse()) {
      try {
        const source = path.join(report.root, action.file);
        const backup = path.join(runDir, action.backup);
        const original = await fs.readFile(backup);
        if (action.action === 'quarantine-empty') {
          const destination = path.join(runDir, action.destination);
          if (await fs.lstat(source).catch((failure) => failure.code === 'ENOENT' ? null : Promise.reject(failure))) {
            throw new Error(`Conflicte de rollback, target recreat: ${action.file}`);
          }
          if (sha256(await fs.readFile(destination)) !== action.beforeSha256) throw new Error(`Conflicte de rollback en quarantena: ${action.file}`);
          await fs.mkdir(path.dirname(source), { recursive: true });
          await fs.rename(destination, source);
        } else {
          if (sha256(await fs.readFile(source)) !== action.afterSha256) throw new Error(`Conflicte de rollback: ${action.file}`);
          await atomicWrite(source, original, { mode: action.mode });
        }
      } catch (rollbackFailure) {
        rollbackError = rollbackFailure;
      }
    }
    manifest.status = rollbackError ? 'rollback-failed' : 'rolled-back';
    manifest.error = error.message;
    if (rollbackError) manifest.rollbackError = rollbackError.message;
    await writeManifest(manifestPath, manifest).catch(() => {});
    if (rollbackError) throw new Error(`${error.message}; ROLLBACK FALLAT: ${rollbackError.message}`);
    throw error;
  }
}

export function safeJoin(root, relative, label) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\0')) {
    throw new Error(`${label} invàlida.`);
  }
  const candidate = path.resolve(root, relative);
  if (!isInside(root, candidate)) throw new Error(`${label} fora de l’arrel: ${relative}`);
  return candidate;
}

export async function regularFileInside(root, file, label) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    throw new Error(`${label} no és un fitxer regular amb identitat exclusiva: ${file}`);
  }
  const real = await fs.realpath(file);
  if (!isInside(root, real)) throw new Error(`${label} resol fora de l’arrel: ${file}`);
  return real;
}

/**
 * Comprova component a component sense seguir symlinks. `safeJoin` evita `..`,
 * però no evita que `carpeta/` siga substituïda per un enllaç cap a fora abans
 * d'un mkdir/rename. La comprovació es repetix just abans de cada efecte.
 */
export async function assertPhysicalAncestors(root, candidate, label, {
  allowMissing = false,
  leafDirectory = false,
} = {}) {
  const physicalRoot = await fs.realpath(root);
  const absolute = path.resolve(candidate);
  if (!isInside(physicalRoot, absolute)) throw new Error(`${label} fora de l’arrel física.`);
  const relative = path.relative(physicalRoot, absolute);
  if (!relative) return physicalRoot;
  const parts = relative.split(path.sep).filter(Boolean);
  let current = physicalRoot;
  for (let index = 0; index < parts.length; index++) {
    current = path.join(current, parts[index]);
    const stat = await fs.lstat(current).catch((error) => {
      if (error.code === 'ENOENT' && allowMissing) return null;
      throw error;
    });
    if (!stat) return null;
    if (stat.isSymbolicLink()) throw new Error(`${label} travessa un symlink: ${current}`);
    if ((index < parts.length - 1 || leafDirectory) && !stat.isDirectory()) {
      throw new Error(`${label} travessa un ancestre no directori: ${current}`);
    }
  }
  return absolute;
}

export async function restoreRun(manifestPath, receiptPath) {
  const requestedManifest = path.resolve(manifestPath);
  const requestedStat = await fs.lstat(requestedManifest);
  if (!requestedStat.isFile() || requestedStat.isSymbolicLink()) {
    throw new Error('El manifest ha de ser un fitxer regular, no un symlink.');
  }
  const absoluteManifest = await fs.realpath(requestedManifest);
  const initialBytes = await fs.readFile(absoluteManifest);
  const manifestDigest = sha256(initialBytes);
  const initial = JSON.parse(initialBytes.toString('utf8'));
  if (initial.schema !== 'socdepoble.autoneteja.manifest.v2'
    || !['prepared', 'applying', 'applied', 'restoring'].includes(initial.status)
    || !Array.isArray(initial.actions)) {
    throw new Error('Manifest no restaurable.');
  }
  const root = await fs.realpath(initial.root);
  if (root !== await fs.realpath(DEFAULT_WIKI_DIR)) throw new Error('El manifest no pertany al vault canònic.');
  const safetyRoot = await fs.realpath(safetyDirFor(root));
  const runDir = path.dirname(absoluteManifest);
  if (path.basename(absoluteManifest) !== 'manifest.json' || path.dirname(runDir) !== safetyRoot
    || path.basename(runDir) !== initial.runId) {
    throw new Error('El manifest no està en .wiki-safety/<runId>/manifest.json.');
  }
  await assertPhysicalAncestors(safetyRoot, absoluteManifest, 'Manifest');
  await regularFileInside(runDir, absoluteManifest, 'Manifest');
  const receiptClaim = await requireReceipt(receiptPath, 'autoneteja-restore', [root], manifestDigest);

  // A partir d'ací, preflight, efectes i verificació final compartixen lock.
  const releaseLock = await acquireMutationLock(root, { recoverStale: true });
  try {
    const lockedBytes = await fs.readFile(absoluteManifest);
    if (sha256(lockedBytes) !== manifestDigest) {
      throw new Error('El manifest ha canviat abans del preflight; rebut caducat.');
    }
    const manifest = JSON.parse(lockedBytes.toString('utf8'));
    if (manifest.schema !== initial.schema || manifest.runId !== initial.runId
      || !['prepared', 'applying', 'applied', 'restoring'].includes(manifest.status)
      || !Array.isArray(manifest.actions)) {
      throw new Error('Manifest canviat o no restaurable sota el lock.');
    }
    await assertPhysicalAncestors(safetyRoot, absoluteManifest, 'Manifest');
    await regularFileInside(runDir, absoluteManifest, 'Manifest');

    const seen = new Set();
    const prepared = [];
    const backupRoot = path.join(runDir, 'originals');
    const quarantineRoot = path.join(runDir, 'quarantine');
    for (const action of [...manifest.actions].reverse()) {
      if (!['rewrite-frontmatter', 'quarantine-empty'].includes(action.action)) throw new Error('Acció desconeguda al manifest.');
      if (typeof action.file !== 'string' || seen.has(action.file)) throw new Error(`Acció invàlida o duplicada: ${action.file}`);
      if (!/^[a-f0-9]{64}$/.test(action.beforeSha256 || '')) throw new Error(`beforeSha256 invàlid: ${action.file}`);
      if (action.action === 'rewrite-frontmatter' && !/^[a-f0-9]{64}$/.test(action.afterSha256 || '')) {
        throw new Error(`afterSha256 invàlid: ${action.file}`);
      }
      seen.add(action.file);
      const target = safeJoin(root, action.file, 'Target');
      await assertPhysicalAncestors(root, target, 'Target', { allowMissing: action.action === 'quarantine-empty' });
      const backup = safeJoin(runDir, action.backup, 'Backup');
      if (!isInside(backupRoot, backup)) throw new Error(`Backup fora d’originals/: ${action.file}`);
      await assertPhysicalAncestors(backupRoot, backup, 'Backup');
      await regularFileInside(backupRoot, backup, 'Backup');
      const original = await fs.readFile(backup);
      if (sha256(original) !== action.beforeSha256) throw new Error(`Backup corrupte: ${action.file}`);

      if (action.action === 'rewrite-frontmatter') {
        await regularFileInside(root, target, 'Target');
        const current = await fs.readFile(target);
        const currentHash = sha256(current);
        if (currentHash === action.beforeSha256) action.restoreState = 'already-baseline';
        else if (currentHash === action.afterSha256) prepared.push({ action, target, backup, original, current });
        else throw new Error(`Conflicte de restauració: ${action.file}`);
      } else {
        const quarantined = safeJoin(runDir, action.destination, 'Quarantena');
        if (!isInside(quarantineRoot, quarantined)) throw new Error(`Quarantena fora de quarantine/: ${action.file}`);
        await assertPhysicalAncestors(quarantineRoot, quarantined, 'Quarantena', { allowMissing: true });
        const targetStat = await fs.lstat(target).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
        const quarantinedStat = await fs.lstat(quarantined).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
        if (targetStat && !quarantinedStat) {
          await regularFileInside(root, target, 'Target');
          if (sha256(await fs.readFile(target)) !== action.beforeSha256) throw new Error(`Target restaurat però divergent: ${action.file}`);
          action.restoreState = 'already-baseline';
        } else if (!targetStat && quarantinedStat) {
          await regularFileInside(quarantineRoot, quarantined, 'Quarantena');
          const current = await fs.readFile(quarantined);
          if (sha256(current) !== action.beforeSha256) throw new Error(`Quarantena corrupta: ${action.file}`);
          prepared.push({ action, target, backup, original, current, quarantined });
        } else {
          throw new Error(`Estat ambigu entre target i quarantena: ${action.file}`);
        }
      }
    }

    const restored = [];
    try {
      manifest.status = 'restoring';
      manifest.restoreStartedAt = new Date().toISOString();
      await writeManifest(absoluteManifest, manifest);
      for (const item of prepared) {
        item.action.restoreState = 'committing';
        await writeManifest(absoluteManifest, manifest);
        if (item.action.action === 'rewrite-frontmatter') {
          await assertPhysicalAncestors(root, item.target, 'Target');
          if (sha256(await fs.readFile(item.target)) !== item.action.afterSha256) throw new Error(`Canvi concurrent: ${item.action.file}`);
          await atomicWrite(item.target, item.original, { mode: item.action.mode || 0o644 });
        } else {
          await assertPhysicalAncestors(root, item.target, 'Target', { allowMissing: true });
          if (await fs.lstat(item.target).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error))) {
            throw new Error(`Target recreat concurrentment: ${item.action.file}`);
          }
          await assertPhysicalAncestors(quarantineRoot, item.quarantined, 'Quarantena');
          await assertPhysicalAncestors(root, path.dirname(item.target), 'Directori target', { allowMissing: true, leafDirectory: true });
          await fs.mkdir(path.dirname(item.target), { recursive: true });
          await assertPhysicalAncestors(root, path.dirname(item.target), 'Directori target', { leafDirectory: true });
          await fs.rename(item.quarantined, item.target);
        }
        item.action.restoreState = 'restored';
        restored.push(item);
        await writeManifest(absoluteManifest, manifest);
      }

      // Inclou expressament les accions que el preflight marcà already-baseline.
      for (const action of manifest.actions) {
        const target = safeJoin(root, action.file, 'Target final');
        await assertPhysicalAncestors(root, target, 'Target final');
        await regularFileInside(root, target, 'Target final');
        if (sha256(await fs.readFile(target)) !== action.beforeSha256) {
          throw new Error(`Verificació final de restore fallada: ${action.file}`);
        }
        if (action.action === 'quarantine-empty') {
          const quarantined = safeJoin(runDir, action.destination, 'Quarantena final');
          await assertPhysicalAncestors(quarantineRoot, quarantined, 'Quarantena final', { allowMissing: true });
          if (await fs.lstat(quarantined).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error))) {
            throw new Error(`La quarantena encara existix després del restore: ${action.file}`);
          }
        }
      }
      manifest.status = 'restored';
      manifest.restoredAt = new Date().toISOString();
      await writeManifest(absoluteManifest, manifest);
      await completeReceiptClaim(receiptClaim);
      return { restored: true, runId: manifest.runId };
    } catch (error) {
      let rollbackError = null;
      for (const item of [...restored].reverse()) {
        try {
          if (item.action.action === 'rewrite-frontmatter') {
            await assertPhysicalAncestors(root, item.target, 'Target de rollback');
            if (sha256(await fs.readFile(item.target)) !== item.action.beforeSha256) throw new Error('target canviat durant rollback');
            await atomicWrite(item.target, item.current, { mode: item.action.mode || 0o644 });
          } else {
            await assertPhysicalAncestors(quarantineRoot, item.quarantined, 'Quarantena de rollback', { allowMissing: true });
            if (await fs.lstat(item.quarantined).catch((failure) => failure.code === 'ENOENT' ? null : Promise.reject(failure))) {
              throw new Error('quarantena recreada durant rollback');
            }
            await assertPhysicalAncestors(root, item.target, 'Target de rollback');
            if (sha256(await fs.readFile(item.target)) !== item.action.beforeSha256) throw new Error('target restaurat canviat durant rollback');
            await assertPhysicalAncestors(quarantineRoot, path.dirname(item.quarantined), 'Directori de quarantena', { allowMissing: true, leafDirectory: true });
            await fs.mkdir(path.dirname(item.quarantined), { recursive: true });
            await assertPhysicalAncestors(quarantineRoot, path.dirname(item.quarantined), 'Directori de quarantena', { leafDirectory: true });
            await fs.rename(item.target, item.quarantined);
          }
        } catch (failure) {
          rollbackError = failure;
        }
      }
      manifest.status = rollbackError ? 'restore-rollback-failed' : 'applied';
      manifest.restoreError = error.message;
      if (rollbackError) manifest.restoreRollbackError = rollbackError.message;
      await writeManifest(absoluteManifest, manifest).catch(() => {});
      if (rollbackError) throw new Error(`${error.message}; ROLLBACK DE RESTORE FALLAT: ${rollbackError.message}`);
      throw error;
    }
  } finally {
    await releaseLock();
  }
}
