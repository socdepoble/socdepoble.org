#!/usr/bin/env node
import { auditWiki, applyAuditPlan, restoreRun } from './core/autoneteja_audit.mjs';
import { requireReceipt, writeNewFile, safetyDirFor } from './core/mutation_kernel.mjs';
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

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { WIKI_DIR } from './lib/project_paths.mjs';

const isInside = (root, candidate) => {
  const rel = path.relative(root, candidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

function parseCli(argv) {
  const options = {
    json: false,
    strict: false,
    includeMirrors: false,
    includeLifecycle: false,
    applyFrontmatter: false,
    quarantineEmpty: false,
    ackSchemaCutover: false,
    ackLegacyLoss: false,
    wikiDir: WIKI_DIR,
    receiptPath: '',
    restore: '',
    reportPath: '',
  };
  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--include-mirrors') options.includeMirrors = true;
    else if (arg === '--include-lifecycle') options.includeLifecycle = true;
    else if (arg === '--apply-frontmatter') options.applyFrontmatter = true;
    else if (arg === '--quarantine-empty') options.quarantineEmpty = true;
    else if (arg === '--ack-schema-cutover') options.ackSchemaCutover = true;
    else if (arg === '--ack-legacy-loss') options.ackLegacyLoss = true;
    else if (arg.startsWith('--wiki=')) options.wikiDir = path.resolve(arg.slice(7));
    else if (arg.startsWith('--receipt=')) options.receiptPath = path.resolve(arg.slice(10));
    else if (arg.startsWith('--restore=')) options.restore = path.resolve(arg.slice(10));
    else if (arg.startsWith('--report=')) options.reportPath = path.resolve(arg.slice(9));
    else if (arg === '--help') options.help = true;
    else if (arg === '--procedeix') throw new Error('--procedeix és ambigu i ha sigut retirat; usa flags d\'acció explícites.');
    else throw new Error(`Argument desconegut: ${arg}`);
  }
  return options;
}

function printHelp() {
  console.log('Autoneteja Wiki v2 (dry-run real per defecte)');
  console.log('  --json --strict --wiki=/ruta --include-mirrors --include-lifecycle');
  console.log('  --apply-frontmatter --ack-schema-cutover [--ack-legacy-loss] --receipt=/ruta');
  console.log('  --quarantine-empty --receipt=/ruta');
  console.log('  --restore=/ruta/manifest.json --receipt=/ruta');
  console.log('  --report=/.../.wiki-safety/reports/informe.json --receipt=/ruta');
}

function printHuman(report) {
  console.log(`\n🧭 AUTONETEJA V2 — ${report.health.toUpperCase()} (DRY-RUN REAL)`);
  console.log(`   Nucli operatiu: ${report.operational.health.toUpperCase()} · ${report.operational.documents} documents`);
  console.log(`   Documents: ${report.snapshot.files} · ${report.snapshot.bytes} bytes`);
  console.log(`   YAML: ${report.frontmatter.yamlErrors.length} invàlids · ${report.frontmatter.absent.length} absents`);
  console.log(`   Frontmatters a migrar: ${report.frontmatter.plannedRewrites}`);
  console.log(`   Buits semàntics: ${report.content.semanticEmpty.length} · quarantinables: ${report.safety.quarantineCandidates.length}`);
  console.log(`   Graf operatiu: ${report.operational.graph.orphans} orfes · ${report.operational.graph.unresolvedOccurrences} fantasmes · ${report.operational.graph.ambiguousOccurrences} ambigus`);
  const excludedOrphans = report.graph.orphans - report.operational.graph.orphans;
  console.log(`   Zones excloses: ${excludedOrphans} orfes informatius ${JSON.stringify(report.graph.orphanZones)} · ${report.graph.duplicateBasenames} basenames duplicats`);
  if (report.safety.visibleQuarantines.length) console.log(`   ⚠️ Quarantena visible dins del vault: ${report.safety.visibleQuarantines.length} nodes`);
  if (report.obsidian.present && report.obsidian.colorGroups === 0) {
    console.log('   ℹ️ Obsidian no té grups de color: gris no significa buit ni orfe.');
  }
  console.log(`   Snapshot SHA-256: ${report.snapshot.treeSha256}`);
  console.log(`   Pla SHA-256: ${report.plan.planDigest}`);
}

export async function main() {
  const options = parseCli(process.argv.slice(2));
  if (options.help) return printHelp();
  if (options.restore) {
    const restored = await restoreRun(options.restore, options.receiptPath);
    console.log(options.json ? JSON.stringify(restored, null, 2) : `✅ Restaurat: ${restored.runId}`);
    return;
  }

  const report = await auditWiki(options.wikiDir, options);
  if (options.reportPath) {
    const reportsDir = path.join(safetyDirFor(report.root), 'reports');
    if (!isInside(reportsDir, options.reportPath) || options.reportPath === reportsDir) {
      throw new Error('--report només pot crear un fitxer nou dins de .wiki-safety/reports/.');
    }
    await requireReceipt(options.receiptPath, 'autoneteja-report', [options.reportPath], report.plan.planDigest);
    const safeReport = { ...report, plan: { ...report.plan, frontmatterActions: report.plan.frontmatterActions.map(({ content, ...item }) => item) } };
    await writeNewFile(options.reportPath, `${JSON.stringify(safeReport, null, 2)}\n`);
  }
  const result = await applyAuditPlan(report, options);
  const printable = {
    ...report,
    plan: {
      ...report.plan,
      frontmatterActions: report.plan.frontmatterActions.map(({ content, ...item }) => item),
    },
    mutation: result,
  };
  if (options.json) console.log(JSON.stringify(printable, null, 2));
  else {
    printHuman(report);
    if (result.applied) console.log(`   ✅ Manifest reversible: ${result.manifestPath}`);
  }
  if (options.strict && !report.ok) process.exitCode = 1;
}

const isMain = Boolean(process.argv[1])
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((error) => {
    console.error(`❌ [AUTONETEJA] ${error.message}`);
    process.exitCode = error.code === 'STALE_PLAN' ? 4 : 3;
  });
}
