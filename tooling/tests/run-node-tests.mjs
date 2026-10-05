#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SUITES = Object.freeze(['primary', 'laboratory', 'session']);
export const ROOTS = Object.freeze(['tests', 'tooling']);
const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const MANIFEST = 'tooling/tests/node-suite-manifest.json';

/** Descobrix totes les proves Node del producte i de les eines, amb ordre estable. */
export function discoverNodeTests(root) {
  const found = [];
  const visit = (relative) => {
    for (const item of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, item.name);
      if (item.isDirectory()) visit(name);
      else if (item.name.endsWith('.test.mjs')) {
        if (!item.isFile()) throw new Error(`La prova no és un fitxer regular: ${name}`);
        found.push(name);
      }
    }
  };
  for (const directory of ROOTS) visit(directory);
  return found.sort();
}

/** Una prova nova, una entrada retirada o una doble assignació no donen verd buit. */
export function validateManifest(root, manifest) {
  if (manifest?.schema !== 'sdp.node-suites.v1' || !Array.isArray(manifest.files)) {
    throw new Error('Manifest de proves Node invàlid');
  }
  if (!Array.isArray(manifest.requiredPrimary) || manifest.requiredPrimary.length === 0) {
    throw new Error('Cal declarar la cobertura primària obligatòria');
  }
  const files = discoverNodeTests(root);
  const discovered = new Set(files);
  const assignments = new Map();
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== 'string' || !SUITES.includes(entry.suite)
        || typeof entry.reason !== 'string' || !entry.reason.trim()) {
      throw new Error('Cada prova necessita ruta, suite i motiu explícits');
    }
    if (assignments.has(entry.path)) throw new Error(`Prova duplicada al manifest: ${entry.path}`);
    if (!discovered.has(entry.path)) throw new Error(`Entrada sense prova al disc: ${entry.path}`);
    assignments.set(entry.path, entry.suite);
  }
  const unclassified = files.filter((name) => !assignments.has(name));
  if (unclassified.length) throw new Error(`Proves sense classificar: ${unclassified.join(', ')}`);
  if (new Set(manifest.requiredPrimary).size !== manifest.requiredPrimary.length) {
    throw new Error('Cobertura primària obligatòria duplicada');
  }
  for (const name of manifest.requiredPrimary) {
    if (assignments.get(name) !== 'primary') throw new Error(`Cobertura primària absent: ${name}`);
  }
  return {
    files,
    suites: Object.fromEntries(SUITES.map((suite) => [suite, files.filter((name) => assignments.get(name) === suite)]))
  };
}

const exitCode = (result) => result.error || result.signal || !Number.isInteger(result.status) ? 1 : result.status;

export function runNodeSuite(root, catalog, suite = 'primary', run = spawnSync) {
  if (![...SUITES, 'all'].includes(suite)) throw new Error(`Suite desconeguda: ${suite}`);
  const files = suite === 'all' ? catalog.files : catalog.suites[suite];
  if (!files.length) throw new Error(`La suite ${suite} és buida`);
  const result = run(process.execPath, ['--test', '--test-concurrency=2', ...files], { cwd: root, stdio: 'inherit' });
  if (result.error) process.stderr.write(`${result.error.message}\n`);
  return exitCode(result);
}

/** Les dues etapes deixen evidència fins i tot quan la primera falla. Cap watcher. */
export function runCi(root, catalog, run = spawnSync) {
  const node = runNodeSuite(root, catalog, 'primary', run);
  const unit = exitCode(run(process.execPath, [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--maxWorkers=2'], {
    cwd: root, stdio: 'inherit'
  }));
  process.stdout.write(`CI · Node=${node} · Vitest=${unit}\n`);
  return node === 0 && unit === 0 ? 0 : 1;
}

export function main(args = process.argv.slice(2)) {
  let suite = 'primary';
  let list = false;
  let ci = false;
  let selected = false;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--suite' && args[i + 1]) { suite = args[++i]; selected = true; }
    else if (args[i] === '--list') list = true;
    else if (args[i] === '--ci') ci = true;
    else throw new Error(`Opció desconeguda o incompleta: ${args[i]}`);
  }
  if (![...SUITES, 'all'].includes(suite) || (ci && (selected || list))) {
    throw new Error('Ús: run-node-tests.mjs [--suite primary|laboratory|session|all] [--list] | --ci');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST), 'utf8'));
  const catalog = validateManifest(ROOT, manifest);
  if (list) {
    process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
    return 0;
  }
  process.stdout.write(`Proves Node · ${catalog.files.length} classificades · ${SUITES.map((name) => `${name}=${catalog.suites[name].length}`).join(' · ')}\n`);
  process.stdout.write(`Selecció: ${ci ? 'primary + Vitest' : suite}. Laboratori i sessió tenen corredors explícits; un verd primari no certifica el repositori sencer.\n`);
  return ci ? runCi(ROOT, catalog) : runNodeSuite(ROOT, catalog, suite);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
