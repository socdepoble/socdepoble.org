#!/usr/bin/env node
/**
 * pre-commit.mjs — Orquestrador (Zero Overhead, Husky-ready)
 *
 * Ordre: integritat d'arrel -> auditor canònic -> semàntica consultiva.
 * Un hook de commit és SEMPRE de sol lectura. Cap fase mou ni crea fitxers.
 *
 * Ús a .husky/pre-commit:
 *   node tooling/wiki/pre-commit.mjs || exit 1
 */

import { auditWiki } from './autoneteja_wiki.mjs';
import { runSemanticAudit } from './semantic_auditor.mjs';
import { verifyWikiBaselineLock } from './reflex_petorreta.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

const step = (n, msg) => console.log(`\n[${n}/4] ${msg}`);

function wikiFromCli(argv) {
  const wikiArgs = argv.filter((arg) => arg.startsWith('--wiki='));
  const unknown = argv.filter((arg) => arg !== '--dry-run' && !arg.startsWith('--wiki='));
  if (unknown.length) throw new Error(`Arguments desconeguts: ${unknown.join(', ')}`);
  if (wikiArgs.length > 1 || !wikiArgs[0]?.slice(7).trim()) {
    if (wikiArgs.length) throw new Error('--wiki exigix una única ruta no buida.');
    return undefined;
  }
  return path.resolve(wikiArgs[0].slice(7));
}

async function main() {
  const wikiDir = wikiFromCli(process.argv.slice(2));

  step(0, 'Execució del Tractor Cognitiu (Guardià del Cànon)...');
  try {
    execSync('npm run gate', { stdio: 'inherit' });
  } catch {
    console.error('Tractor Cognitiu FALLAT: El Cànon té errors de Ceguesa Cognitiva.');
    process.exit(1);
  }

  step(1, 'Sondes mecàniques anti-tombstone i anti-camins fràgils...');
  // Les dos sondes són CONSULTIVES: informen i no aturen el commit.
  // Fins ara ho feien llançant un error que el seu propi `catch` s'engolia, de
  // manera que no es podien distingir d'una sonda bloquejant avariada. Ací la
  // intenció queda escrita: el que s'imprimix és el que passa.
  // Per a fer-les bloquejants cal netejar abans els fitxers que ja incomplixen
  // (auditoria 260923: 14 amb camins fràgils). `spawnSync` no llança: quan grep
  // no troba res torna status 1 i stdout buit, que és el cas bo.

  // 1. Cercar camins fràgils a tooling/wiki ignorant project_paths
  const grep1 = spawnSync('grep', ['-rnl', '-E', 'process\\.cwd\\(\\)|\\.\\./\\.\\.', 'tooling/wiki'], { encoding: 'utf8' });
  if (grep1.stdout) {
    const outLines = grep1.stdout.trim().split('\n').filter(l => l && !l.includes('project_paths'));
    if (outLines.length > 0) {
      console.error(`SDP-LOCK (consultiu): Fitxers usant camins absoluts o cwd:\n${outLines.join('\n')}`);
    }
  }

  // 2. Anti-tombstone: cercar si algun import invoca fitxers amb TOMBSTONE
  const grep2 = spawnSync('grep', ['-rl', 'SDP-LOCK: .* retirat', 'tooling/wiki'], { encoding: 'utf8' });
  const tombstones = grep2.stdout ? grep2.stdout.trim().split('\n').filter(Boolean).map(p => path.basename(p)) : [];
  if (tombstones.length > 0) {
    const grepPattern = tombstones.join('|');
    const grep3 = spawnSync('grep', ['-rnl', '-E', grepPattern, 'tooling/wiki', '.agents', 'package.json'], { encoding: 'utf8' });
    const references = grep3.stdout || '';
    const badRefs = references.trim().split('\n').filter(p => p && !tombstones.includes(path.basename(p)));
    if (badRefs.length > 0) {
      console.error(`SDP-LOCK (consultiu): Els següents fitxers referencien tombstones inactius:\n${badRefs.join('\n')}`);
    }
  }

  step(1, 'Integritat d\'arrel (sol lectura)...');
  const rootOrphans = wikiDir ? fs.readdirSync(wikiDir).filter(f => f.endsWith('.md') && f !== 'README.md' && fs.statSync(path.join(wikiDir, f)).isFile()).length : 0;
  if (rootOrphans > 0) {
    throw new Error(`SDP-LOCK: ${rootOrphans} Markdown solt(s) a l’arrel del vault.`);
  }

  step(2, 'Baseline estable i contracte de la Vista Gràfica...');
  const baseline = await verifyWikiBaselineLock(wikiDir);
  if (!baseline.ok) {
    throw new Error(`SDP-LOCK: baseline divergent: ${baseline.findings.join('; ')}`);
  }
  console.log(`✅ Baseline segellada (${baseline.baseline.documents} documents; ${baseline.baseline.treeSha256}).`);

  step(3, 'Auditoria canònica de Wiki (YAML, graf operatiu i integritat)...');
  const audit = await auditWiki(wikiDir);
  const traversalUnsafe = audit.safety.skippedSymlinks.length > 0;
  const isOperational = (item) => /^0[0-3]_/.test(typeof item === 'string' ? item : item.file);
  const parserFailures = audit.frontmatter.malformed.filter(isOperational).length
    + audit.frontmatter.yamlErrors.filter(isOperational).length;
  const controlFailures = audit.content.controlChars.filter(isOperational).length;
  if (!audit.operational.ok || parserFailures + controlFailures > 0 || traversalUnsafe) {
    console.error('\n🚨 SDP-LOCK: auditoria canònica fallada 🚨');
    console.error(`Nucli: ${audit.operational.health}; drift FM: ${audit.operational.frontmatterDrift}; `
      + `buits: ${audit.operational.semanticEmpty.length}; fantasmes: ${audit.operational.graph.unresolvedOccurrences}; `
      + `ambigus: ${audit.operational.graph.ambiguousOccurrences}; symlinks: ${audit.safety.skippedSymlinks.length}.`);
    console.error(`Pla diagnòstic SHA-256: ${audit.plan.planDigest}`);
    process.exit(1);
  }
  console.log(`✅ Integritat dura del nucli superada (${audit.operational.documents} documents).`);
  if (!audit.operational.ok) {
    console.warn(`⚠️  Cutover YAML pendent: ${audit.operational.frontmatterDrift} nota(es) encara no conformes amb v2.`);
  }

  step(4, 'Auditoria Semàntica (Trellat, consultiva)...');
  const semantic = await runSemanticAudit(wikiDir);
  const semanticCount = semantic.folderAlerts.length + semantic.filenameAlerts.length
    + semantic.descriptionAlerts.length;
  if (semanticCount) console.warn(`⚠️  Auditoria semàntica: ${semanticCount} avís(os) consultius.`);
  else console.log('✅ Cap avís semàntic.');

  console.log('\n✅ TALLAFOCS SUPERAT. Trellat intacte.');

  step(5, 'Integritat termodinàmica de la Canonada...');
  try {
    execSync('node 06_EINES/canonada.mjs verifica', { stdio: 'inherit' });
  } catch {
    console.error('\n🚨 SDP-LOCK: Fitxers usant fs.writeFileSync detectats fora de la Canonada 🚨');
    process.exit(1);
  }

  step(6, 'Compilació i Validació Cognitiva (La Canonada)...');
  try {
    execSync('node tooling/wiki/validate-wiki-compliance.mjs', { stdio: 'inherit' });
  } catch {
    console.error('\n🚨 SDP-LOCK: Fracàs a la canonada cognitiva 🚨');
    process.exit(1);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('🚨 ERROR INESPERAT A L\'ORQUESTRADOR 🚨');
  console.error(err);
  process.exit(1);
});
