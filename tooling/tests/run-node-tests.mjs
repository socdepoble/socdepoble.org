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

/**
 * Resol el mòdul PGlite configurat: primer `--pglite <ruta>`, després SDP_PGLITE_MODULE.
 * Mateixa regla que les proves: només ruta local o file URL, sense query ni fragment.
 * No busca paquets ni instal·la res; una ruta relativa es resol des de l’arrel.
 */
export function resolvePglite(root, env = process.env, flag) {
  const entrada = (typeof flag === 'string' && flag.trim()) || env.SDP_PGLITE_MODULE?.trim() || '';
  if (!entrada) return { entrada, absPath: null, existeix: false };
  if (/^[a-z][a-z0-9+.-]*:/i.test(entrada) && !entrada.startsWith('file:')) {
    throw new TypeError('SDP_PGLITE_MODULE només admet una ruta local o file URL.');
  }
  const url = entrada.startsWith('file:') ? new URL(entrada) : pathToFileURL(path.resolve(root, entrada));
  if (url.search || url.hash) throw new TypeError('El mòdul local no admet query ni fragment.');
  const absPath = fileURLToPath(url);
  let existeix = false;
  try { existeix = fs.statSync(absPath).isFile(); } catch { existeix = false; }
  return { entrada, absPath, existeix };
}

const LLIG_PGLITE = /process\.env\.SDP_PGLITE_MODULE\b/;
const IMPORT_RELATIU = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

/**
 * Llig cada fitxer una sola vegada per cens: guarda si llig SDP_PGLITE_MODULE i els seus imports relatius.
 * Un fitxer il·legible queda com a node sense lectura ni arestes.
 */
function nodeDelCens(root, relative, cache) {
  let node = cache.get(relative);
  if (node) return node;
  let font = '';
  try { font = fs.readFileSync(path.join(root, relative), 'utf8'); } catch { font = ''; }
  const deps = [];
  for (const [, especificador] of font.matchAll(IMPORT_RELATIU)) {
    const destinacio = path.posix.normalize(path.posix.join(path.posix.dirname(relative), especificador));
    if (!destinacio.startsWith('../')) deps.push(destinacio);
  }
  node = { llig: LLIG_PGLITE.test(font), deps };
  cache.set(relative, node);
  return node;
}

/** Cens estàtic: la prova llig SDP_PGLITE_MODULE directament o per un import relatiu. */
function depenDePglite(root, relative, cache, vist = new Set()) {
  if (vist.has(relative)) return false;
  vist.add(relative);
  const node = nodeDelCens(root, relative, cache);
  if (node.llig) return true;
  return node.deps.some((destinacio) => depenDePglite(root, destinacio, cache, vist));
}

/** Deute PGlite: quines proves seleccionades depenen del mòdul i quines quedaran sense SQL. */
export function pgliteDebt(root, files, resolved) {
  const cache = new Map();
  const dependents = files.filter((name) => depenDePglite(root, name, cache));
  const omitted = resolved.existeix ? [] : dependents;
  const motiu = resolved.existeix ? null
    : resolved.entrada ? `el mòdul indicat no existix o no és un fitxer: ${resolved.absPath}` : 'falta SDP_PGLITE_MODULE';
  return { dependents, omitted, motiu };
}

const liniaDeute = (debt, total) =>
  `Deute PGlite: ${debt.omitted.length}/${total} proves sense SQL certificat (${debt.motiu}): ${debt.omitted.join(', ')}\n`;

export function runNodeSuite(root, catalog, suite = 'primary', run = spawnSync, {
  pglite = resolvePglite(root), strict = false, out = process.stdout, err = process.stderr
} = {}) {
  if (![...SUITES, 'all'].includes(suite)) throw new Error(`Suite desconeguda: ${suite}`);
  const files = suite === 'all' ? catalog.files : catalog.suites[suite];
  if (!files.length) throw new Error(`La suite ${suite} és buida`);
  const debt = pgliteDebt(root, files, pglite);
  if (debt.omitted.length) {
    out.write(liniaDeute(debt, files.length));
    if (strict) {
      err.write(`Mode estricte PGlite: ${liniaDeute(debt, files.length)}`);
      return 1;
    }
  } else if (debt.dependents.length) {
    out.write(`PGlite: ${debt.dependents.length}/${files.length} proves reben SDP_PGLITE_MODULE=${pglite.absPath}\n`);
  }
  const env = { ...process.env, ...(pglite.absPath ? { SDP_PGLITE_MODULE: pglite.absPath } : {}) };
  const result = run(process.execPath, ['--test', '--test-concurrency=2', ...files], { cwd: root, stdio: 'inherit', env });
  if (result.error) err.write(`${result.error.message}\n`);
  // El deute torna a ser l’última línia: un verd amb omissions no certifica SQL.
  if (debt.omitted.length) out.write(liniaDeute(debt, files.length));
  return exitCode(result);
}

/** Les dues etapes deixen evidència fins i tot quan la primera falla. Cap watcher. */
export function runCi(root, catalog, run = spawnSync, options = {}) {
  const node = runNodeSuite(root, catalog, 'primary', run, options);
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
  let flagPglite;
  let strict = process.env.SDP_PGLITE_STRICT === '1';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--suite' && args[i + 1]) { suite = args[++i]; selected = true; }
    else if (args[i] === '--pglite' && args[i + 1]) flagPglite = args[++i];
    else if (args[i] === '--strict-pglite') strict = true;
    else if (args[i] === '--list') list = true;
    else if (args[i] === '--ci') ci = true;
    else throw new Error(`Opció desconeguda o incompleta: ${args[i]}`);
  }
  if (![...SUITES, 'all'].includes(suite) || (ci && (selected || list))) {
    throw new Error('Ús: run-node-tests.mjs [--suite primary|laboratory|session|all] [--list] | --ci; opcions: [--pglite <ruta>] [--strict-pglite]');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST), 'utf8'));
  const catalog = validateManifest(ROOT, manifest);
  if (list) {
    process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
    return 0;
  }
  process.stdout.write(`Proves Node · ${catalog.files.length} classificades · ${SUITES.map((name) => `${name}=${catalog.suites[name].length}`).join(' · ')}\n`);
  process.stdout.write(`Selecció: ${ci ? 'primary + Vitest' : suite}. Laboratori i sessió tenen corredors explícits; un verd primari no certifica el repositori sencer.\n`);
  const options = { pglite: resolvePglite(ROOT, process.env, flagPglite), strict };
  return ci ? runCi(ROOT, catalog, spawnSync, options) : runNodeSuite(ROOT, catalog, suite, spawnSync, options);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try { process.exitCode = main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
